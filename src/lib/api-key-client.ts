import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

export interface ApiKeyCredentials {
  api_key: string;
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public response: unknown,
    clientName: string
  ) {
    const preview = JSON.stringify(response).slice(0, 500);
    super(`${clientName} API error (${statusCode}): ${preview}`);
    this.name = "ApiClientError";
  }
}

/**
 * Base class for API-key-authenticated connector clients.
 * Subclasses set baseUrl and buildAuthHeaders().
 */
export abstract class ApiKeyClient {
  protected apiKey: string;
  protected connectorId: string;
  protected abstract baseUrl: string;

  constructor(apiKey: string, connectorId: string) {
    this.apiKey = apiKey;
    this.connectorId = connectorId;
  }

  /**
   * Return auth headers for this client. Override in subclasses
   * to support different auth header formats.
   */
  protected abstract buildAuthHeaders(): Record<string, string>;

  /**
   * Load encrypted API key credentials from a connector row.
   */
  static async loadCredentials(
    connectorId: string,
    connectorType: string
  ): Promise<{ apiKey: string }> {
    const supabase = createAdminClient();
    const { data: connector, error } = await supabase
      .from("connectors")
      .select("oauth_credentials")
      .eq("id", connectorId)
      .eq("status", "connected")
      .single();

    if (error || !connector?.oauth_credentials) {
      throw new Error(
        `${connectorType} is not connected or connector not found`
      );
    }

    const creds: ApiKeyCredentials = JSON.parse(
      decrypt(connector.oauth_credentials)
    );
    return { apiKey: creds.api_key };
  }

  /**
   * Authenticated GET request.
   */
  async get(
    path: string,
    params?: Record<string, string>
  ): Promise<unknown> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      );
      if (Object.keys(filtered).length > 0) {
        url += `?${new URLSearchParams(filtered).toString()}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          ...this.buildAuthHeaders(),
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new Error(
          `${this.constructor.name} request timed out after 30s: GET ${path}`
        );
      }
      throw err;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiClientError(
        response.status,
        body,
        this.constructor.name
      );
    }

    return response.json();
  }

  /**
   * Authenticated POST/PATCH/PUT request with JSON body.
   */
  async request(
    path: string,
    options: { method?: string; body?: unknown } = {}
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const method = options.method || "POST";

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          ...this.buildAuthHeaders(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new Error(
          `${this.constructor.name} request timed out after 30s: ${method} ${path}`
        );
      }
      throw err;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiClientError(
        response.status,
        body,
        this.constructor.name
      );
    }

    return response.json();
  }
}
