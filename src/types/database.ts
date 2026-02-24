export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export interface Connector {
  id: string;
  type: "quickbooks" | "stardex" | "justworks" | "docusign" | "gdrive";
  display_name: string;
  status: "connected" | "disconnected" | "error";
  oauth_credentials: string | null; // AES-256-GCM encrypted JSON
  config: ConnectorConfig;
  connected_by: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorConfig {
  realm_id?: string;
  company_name?: string;
  environment?: "sandbox" | "production";
  [key: string]: unknown;
}

export interface Tool {
  id: string;
  connector_id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  category: "read" | "write" | "admin";
  is_active: boolean;
  input_schema: Record<string, unknown>;
  created_at: string;
}

export interface UserToolPermission {
  id: string;
  user_id: string;
  tool_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface OAuthToken {
  id: string;
  user_id: string;
  access_token_hash: string;
  refresh_token_hash: string | null;
  expires_at: string;
  scopes: string[];
  revoked_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  tool_name: string | null;
  connector_id: string | null;
  action_type: string;
  action_detail: string | null;
  request_summary: Record<string, unknown> | null;
  response_summary: Record<string, unknown> | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface OAuthAuthorizationCode {
  code: string;
  user_id: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scopes: string[];
  expires_at: string;
  used: boolean;
  created_at: string;
}

// Joined types used in queries
export interface ToolWithPermission extends Tool {
  has_permission: boolean;
}

export interface AuditLogWithUser extends AuditLog {
  users?: { email: string; name: string | null } | null;
}
