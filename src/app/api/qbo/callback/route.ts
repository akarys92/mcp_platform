import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { getToolSeedData } from "@/lib/qbo/tool-definitions";
import { logAdminAction } from "@/lib/mcp/audit";

/**
 * QuickBooks OAuth callback.
 * Exchanges the authorization code for tokens and stores them encrypted.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const realmId = url.searchParams.get("realmId");
  const error = url.searchParams.get("error");

  // Check for errors from Intuit
  if (error) {
    console.error("QBO OAuth error:", error);
    return NextResponse.redirect(
      new URL("/admin/connectors?error=qbo_denied", request.url)
    );
  }

  if (!code || !realmId) {
    return NextResponse.redirect(
      new URL("/admin/connectors?error=missing_params", request.url)
    );
  }

  // Verify CSRF state
  const savedState = request.cookies.get("qbo_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/admin/connectors?error=state_mismatch", request.url)
    );
  }

  // Verify admin session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Exchange code for tokens
  // CRITICAL: Body must be application/x-www-form-urlencoded, not JSON
  const tokenResponse = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.QBO_REDIRECT_URI!,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.json().catch(() => ({}));
    console.error("QBO token exchange failed:", errBody);
    return NextResponse.redirect(
      new URL("/admin/connectors?error=token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenResponse.json();

  // Encrypt tokens for storage
  const encryptedCreds = encrypt(
    JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
    })
  );

  const admin = createAdminClient();

  // Check if a QuickBooks connector already exists
  const { data: existing } = await admin
    .from("connectors")
    .select("id")
    .eq("type", "quickbooks")
    .limit(1);

  let connectorId: string;

  if (existing && existing.length > 0) {
    // Update existing connector
    connectorId = existing[0].id;
    await admin
      .from("connectors")
      .update({
        status: "connected",
        oauth_credentials: encryptedCreds,
        config: {
          realm_id: realmId,
          environment: process.env.QBO_ENVIRONMENT || "sandbox",
        },
        connected_by: user.id,
        connected_at: new Date().toISOString(),
      })
      .eq("id", connectorId);
  } else {
    // Create new connector
    const { data: newConnector, error: insertError } = await admin
      .from("connectors")
      .insert({
        type: "quickbooks",
        display_name: "QuickBooks Online",
        status: "connected",
        oauth_credentials: encryptedCreds,
        config: {
          realm_id: realmId,
          environment: process.env.QBO_ENVIRONMENT || "sandbox",
        },
        connected_by: user.id,
        connected_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !newConnector) {
      console.error("Failed to create connector:", insertError);
      return NextResponse.redirect(
        new URL("/admin/connectors?error=db_error", request.url)
      );
    }
    connectorId = newConnector.id;
  }

  // Seed tool definitions (idempotent — uses upsert logic via unique constraint)
  const toolData = getToolSeedData(connectorId);

  // Delete existing tools for this connector and re-insert
  // (simpler than upserting since tool definitions may change between versions)
  await admin.from("tools").delete().eq("connector_id", connectorId);
  const { error: toolError } = await admin.from("tools").insert(toolData);
  if (toolError) {
    console.error("Failed to seed tools:", toolError);
  }

  // Audit log
  await logAdminAction({
    userId: user.id,
    actionType: "connector_connected",
    actionDetail: `Connected QuickBooks Online (realm: ${realmId})`,
    connectorId,
  });

  // Clear state cookie and redirect
  const response = NextResponse.redirect(
    new URL("/admin/connectors?success=connected", request.url)
  );
  response.cookies.delete("qbo_oauth_state");
  return response;
}
