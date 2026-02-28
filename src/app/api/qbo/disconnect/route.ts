import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { logAdminAction } from "@/lib/mcp/audit";

const QBO_REVOKE_URL =
  "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

/**
 * Disconnect QuickBooks.
 * Revokes the token at Intuit, clears stored credentials, and marks the connector as disconnected.
 * Also serves as the Disconnect URL that Intuit redirects to when a user disconnects from their side.
 */
export async function GET(request: NextRequest) {
  // Verify admin session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const admin = createAdminClient();
  const { data: userData } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can disconnect QuickBooks" },
      { status: 403 }
    );
  }

  // Find the QuickBooks connector
  const { data: connector } = await admin
    .from("connectors")
    .select("id, oauth_credentials, config")
    .eq("type", "quickbooks")
    .limit(1)
    .single();

  if (!connector) {
    return NextResponse.redirect(
      new URL("/admin/connectors?error=no_connector", request.url)
    );
  }

  // Revoke the token at Intuit (best effort — don't block disconnect on failure)
  if (connector.oauth_credentials) {
    try {
      const creds = JSON.parse(decrypt(connector.oauth_credentials));
      await fetch(QBO_REVOKE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({ token: creds.refresh_token }),
      });
    } catch (err) {
      console.error("Failed to revoke QBO token (continuing disconnect):", err);
    }
  }

  // Clear credentials and mark as disconnected
  await admin
    .from("connectors")
    .update({
      status: "disconnected",
      oauth_credentials: null,
      connected_by: null,
      connected_at: null,
    })
    .eq("id", connector.id);

  // Audit log
  const realmId = (connector.config as Record<string, unknown>)?.realm_id;
  await logAdminAction({
    userId: user.id,
    actionType: "connector_disconnected",
    actionDetail: `Disconnected QuickBooks Online${realmId ? ` (realm: ${realmId})` : ""}`,
    connectorId: connector.id,
  });

  return NextResponse.redirect(
    new URL("/admin/connectors?success=disconnected", request.url)
  );
}
