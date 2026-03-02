import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

/**
 * POST /api/connectors/reveal-key
 * Reveal a stored API key after admin re-authenticates with their password.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify admin role
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const connectorId = body?.connector_id;
  const password = body?.password;

  if (!connectorId || !password) {
    return NextResponse.json(
      { error: "connector_id and password are required" },
      { status: 400 }
    );
  }

  // Re-authenticate to verify the admin's password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (authError) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401 }
    );
  }

  // Load and decrypt the stored credentials
  const { data: connector } = await admin
    .from("connectors")
    .select("oauth_credentials")
    .eq("id", connectorId)
    .eq("status", "connected")
    .single();

  if (!connector?.oauth_credentials) {
    return NextResponse.json(
      { error: "Connector not found or not connected" },
      { status: 404 }
    );
  }

  try {
    const creds = JSON.parse(decrypt(connector.oauth_credentials));
    return NextResponse.json({ api_key: creds.api_key });
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt credentials" },
      { status: 500 }
    );
  }
}
