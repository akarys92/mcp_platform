import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { getStardexToolSeedData } from "@/lib/stardex/tool-definitions";
import { logAdminAction } from "@/lib/mcp/audit";
import { autoGrantReadTools } from "@/lib/mcp/auto-grant";

/**
 * POST /api/stardex/connect
 * Connect Stardex by providing an API key. Admin only.
 */
export async function POST(request: NextRequest) {
  // Verify authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
      { error: "Only admins can connect Stardex" },
      { status: 403 }
    );
  }

  // Read API key from request body
  const body = await request.json().catch(() => null);
  const apiKey = body?.api_key;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  // Validate the API key with a lightweight test call
  try {
    const testRes = await fetch("https://api.stardex.ai/v1/jobs?per_page=1", {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: "application/json",
      },
    });
    if (!testRes.ok) {
      return NextResponse.json(
        { error: `Invalid API key (Stardex returned ${testRes.status})` },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach Stardex API to validate the key" },
      { status: 502 }
    );
  }

  // Encrypt credentials
  const encryptedCreds = encrypt(
    JSON.stringify({ api_key: apiKey.trim() })
  );

  // Upsert connector row
  const { data: existing } = await admin
    .from("connectors")
    .select("id")
    .eq("type", "stardex")
    .limit(1);

  let connectorId: string;

  if (existing && existing.length > 0) {
    connectorId = existing[0].id;
    await admin
      .from("connectors")
      .update({
        status: "connected",
        oauth_credentials: encryptedCreds,
        config: {},
        connected_by: user.id,
        connected_at: new Date().toISOString(),
      })
      .eq("id", connectorId);
  } else {
    const { data: newConnector, error: insertError } = await admin
      .from("connectors")
      .insert({
        type: "stardex",
        display_name: "Stardex",
        status: "connected",
        oauth_credentials: encryptedCreds,
        config: {},
        connected_by: user.id,
        connected_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !newConnector) {
      console.error("Failed to create Stardex connector:", insertError);
      return NextResponse.json(
        { error: "Failed to save connector" },
        { status: 500 }
      );
    }
    connectorId = newConnector.id;
  }

  // Seed tool definitions (delete + re-insert for idempotency)
  await admin.from("tools").delete().eq("connector_id", connectorId);
  const toolData = getStardexToolSeedData(connectorId);
  const { error: toolError } = await admin.from("tools").insert(toolData);
  if (toolError) {
    console.error("Failed to seed Stardex tools:", toolError);
  }

  // Auto-grant read tools to all users
  await autoGrantReadTools(connectorId, user.id);

  // Audit log
  await logAdminAction({
    userId: user.id,
    actionType: "connector_connected",
    actionDetail: "Connected Stardex",
    connectorId,
  });

  return NextResponse.json({ success: true });
}
