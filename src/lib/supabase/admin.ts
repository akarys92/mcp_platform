import { createClient } from "@supabase/supabase-js";

/**
 * Service role client — bypasses RLS. Server-side only.
 * Use for operations that need access regardless of the authenticated user,
 * such as oauth_tokens and audit_logs management.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
