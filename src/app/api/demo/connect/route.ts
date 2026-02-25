import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDemoToolSeedData } from "@/lib/demo/tool-definitions";
import { logAdminAction } from "@/lib/mcp/audit";
import { autoGrantReadTools } from "@/lib/mcp/auto-grant";

/**
 * GET /api/demo/connect
 * One-click demo connector setup. No OAuth — just creates the connector
 * and seeds the demo tools. Admin only.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify admin
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(
      new URL("/admin/connectors?error=admin_required", request.url)
    );
  }

  // Check if demo connector already exists
  const { data: existing } = await admin
    .from("connectors")
    .select("id")
    .eq("type", "stardex")
    .limit(1);

  let connectorId: string;

  if (existing && existing.length > 0) {
    // Re-activate existing connector
    connectorId = existing[0].id;
    await admin
      .from("connectors")
      .update({
        status: "connected",
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        config: { mode: "demo" },
      })
      .eq("id", connectorId);
  } else {
    // Create new demo connector
    const { data: newConnector, error: insertError } = await admin
      .from("connectors")
      .insert({
        type: "stardex",
        display_name: "Demo Tools",
        status: "connected",
        config: { mode: "demo" },
        connected_by: user.id,
        connected_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !newConnector) {
      console.error("Failed to create demo connector:", insertError);
      return NextResponse.redirect(
        new URL("/admin/connectors?error=db_error", request.url)
      );
    }
    connectorId = newConnector.id;
  }

  // Seed demo tools (delete + re-insert for idempotency)
  await admin.from("tools").delete().eq("connector_id", connectorId);
  const toolData = getDemoToolSeedData(connectorId);
  const { error: toolError } = await admin.from("tools").insert(toolData);
  if (toolError) {
    console.error("Failed to seed demo tools:", toolError);
  }

  // Auto-grant read tools to all users
  await autoGrantReadTools(connectorId, user.id);

  // Audit log
  await logAdminAction({
    userId: user.id,
    actionType: "connector_connected",
    actionDetail: "Connected Demo Tools connector",
    connectorId,
  });

  return NextResponse.redirect(
    new URL("/admin/connectors?success=demo_connected", request.url)
  );
}
