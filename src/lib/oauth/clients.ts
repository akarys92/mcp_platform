import { randomBytes } from "crypto";

/**
 * In-memory store for dynamically registered OAuth clients (RFC 7591).
 *
 * Claude Desktop registers itself via DCR before starting the auth flow.
 * For this MVP the registrations live in memory — they survive as long
 * as the server process is running, which is fine because Claude
 * re-registers on every new connection attempt.
 */

interface RegisteredClient {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  created_at: number;
}

const clients = new Map<string, RegisteredClient>();

export function registerClient(body: {
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
}): RegisteredClient {
  const client_id = randomBytes(16).toString("hex");

  const client: RegisteredClient = {
    client_id,
    client_name: body.client_name,
    redirect_uris: body.redirect_uris || [],
    grant_types: body.grant_types || ["authorization_code"],
    response_types: body.response_types || ["code"],
    token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
    created_at: Date.now(),
  };

  clients.set(client_id, client);
  console.log(`[OAuth DCR] Registered client: ${client_id} (${client.client_name || "unnamed"})`);

  return client;
}

export function getClient(client_id: string): RegisteredClient | undefined {
  return clients.get(client_id);
}
