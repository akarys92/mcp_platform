import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  // Verify the user is authenticated via Supabase session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    scope,
  } = body;

  // Validate client_id
  if (client_id !== process.env.MCP_CLIENT_ID) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }

  // Generate authorization code (32 random bytes, hex encoded)
  const code = randomBytes(32).toString("hex");

  // Store the authorization code
  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("oauth_authorization_codes")
    .insert({
      code,
      user_id: user.id,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method: code_challenge_method || "S256",
      scopes: scope ? scope.split(" ") : ["mcp:tools"],
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

  if (insertError) {
    console.error("Failed to store authorization code:", insertError);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }

  // Build redirect URL with code and state
  const url = new URL(redirect_uri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);

  return NextResponse.json({ redirect_url: url.toString() });
}
