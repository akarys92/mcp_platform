import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";
import { QBOError } from "./errors";

interface QBOCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO timestamp
  realm_id: string;
}

const QBO_BASE_URLS = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
};

const QBO_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_MINOR_VERSION = "75";

/**
 * QuickBooks Online API client.
 * Handles authenticated requests with automatic token refresh.
 */
export class QBOClient {
  private credentials: QBOCredentials;
  private connectorId: string;
  private baseUrl: string;

  constructor(
    credentials: QBOCredentials,
    connectorId: string,
    environment: "sandbox" | "production" = "sandbox"
  ) {
    this.credentials = credentials;
    this.connectorId = connectorId;
    this.baseUrl = QBO_BASE_URLS[environment];
  }

  /**
   * Create a QBOClient from a connector's stored (encrypted) credentials.
   */
  static async fromConnector(connectorId: string): Promise<QBOClient> {
    const supabase = createAdminClient();
    const { data: connector, error } = await supabase
      .from("connectors")
      .select("oauth_credentials, config")
      .eq("id", connectorId)
      .eq("status", "connected")
      .single();

    if (error || !connector?.oauth_credentials) {
      throw new Error("QuickBooks is not connected or connector not found");
    }

    const creds = JSON.parse(decrypt(connector.oauth_credentials));
    const config = connector.config as Record<string, unknown>;
    creds.realm_id = config.realm_id;

    const environment =
      (config.environment as "sandbox" | "production") ||
      (process.env.QBO_ENVIRONMENT as "sandbox" | "production") ||
      "sandbox";

    return new QBOClient(creds, connectorId, environment);
  }

  /**
   * Make an authenticated request to the QBO API.
   * Automatically refreshes tokens if they're about to expire.
   */
  async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Record<string, unknown>> {
    // Refresh token if expiring within 5 minutes
    if (this.isTokenExpiring()) {
      await this.refreshToken();
    }

    const url = this.buildUrl(path);

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.credentials.access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });

    // If 401, attempt one token refresh and retry
    if (response.status === 401) {
      await this.refreshToken();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        },
      });

      if (!retryResponse.ok) {
        const errBody = await retryResponse.json().catch(() => ({}));
        throw new QBOError(retryResponse.status, errBody);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new QBOError(response.status, errBody);
    }

    return response.json();
  }

  /**
   * Execute a SQL-like query against the QBO query endpoint.
   */
  async query(
    entity: string,
    where?: string,
    orderBy?: string,
    maxResults: number = 100,
    startPosition: number = 1
  ): Promise<Record<string, unknown>> {
    let sql = `SELECT * FROM ${entity}`;
    if (where) sql += ` WHERE ${where}`;
    if (orderBy) sql += ` ORDERBY ${orderBy}`;
    sql += ` STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    return this.request(`/query?query=${encodeURIComponent(sql)}`);
  }

  private buildUrl(path: string): string {
    const base = `${this.baseUrl}/v3/company/${this.credentials.realm_id}${path}`;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}minorversion=${QBO_MINOR_VERSION}`;
  }

  private isTokenExpiring(): boolean {
    const expiresAt = new Date(this.credentials.expires_at);
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiresAt < fiveMinFromNow;
  }

  /**
   * Refresh the QBO access token.
   * CRITICAL: QBO rotates refresh tokens on every refresh —
   * the new refresh token MUST be persisted.
   */
  private async refreshToken(): Promise<void> {
    const response = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.credentials.refresh_token,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("QBO token refresh failed:", errBody);

      // Mark connector as error
      const supabase = createAdminClient();
      await supabase
        .from("connectors")
        .update({ status: "error" })
        .eq("id", this.connectorId);

      throw new Error(
        "QuickBooks token refresh failed. An admin may need to reconnect QuickBooks."
      );
    }

    const tokens = await response.json();

    // Update local credentials
    this.credentials.access_token = tokens.access_token;
    this.credentials.refresh_token = tokens.refresh_token; // NEW refresh token
    this.credentials.expires_at = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Persist updated tokens (encrypted)
    const supabase = createAdminClient();
    await supabase
      .from("connectors")
      .update({
        oauth_credentials: encrypt(
          JSON.stringify({
            access_token: this.credentials.access_token,
            refresh_token: this.credentials.refresh_token,
            expires_at: this.credentials.expires_at,
          })
        ),
      })
      .eq("id", this.connectorId);
  }
}
