import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/crypto";

export interface TokenValidation {
  valid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validate an MCP Bearer token from the Authorization header.
 * Looks up the token hash in the oauth_tokens table and verifies
 * it hasn't been revoked or expired.
 */
export async function validateMCPToken(
  authHeader: string | null
): Promise<TokenValidation> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7);
  if (!token) {
    return { valid: false, error: "Empty bearer token" };
  }

  const tokenHash = hashToken(token);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("user_id, expires_at, revoked_at")
    .eq("access_token_hash", tokenHash)
    .is("revoked_at", null)
    .single();

  if (error || !data) {
    return { valid: false, error: "Invalid token" };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "Token expired" };
  }

  return { valid: true, userId: data.user_id };
}
