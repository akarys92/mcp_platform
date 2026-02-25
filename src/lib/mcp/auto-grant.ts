import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-grant all "read" category tools for a connector to every user.
 * Called when a connector is first connected so read-only tools are
 * available by default (the admin can still revoke individual access).
 */
export async function autoGrantReadTools(connectorId: string, grantedBy: string): Promise<void> {
  const admin = createAdminClient();

  // Get all read tools for this connector
  const { data: readTools, error: toolsError } = await admin
    .from("tools")
    .select("id")
    .eq("connector_id", connectorId)
    .eq("category", "read")
    .eq("is_active", true);

  if (toolsError || !readTools?.length) {
    if (toolsError) console.error("Failed to fetch read tools for auto-grant:", toolsError);
    return;
  }

  // Get all users
  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id");

  if (usersError || !users?.length) {
    if (usersError) console.error("Failed to fetch users for auto-grant:", usersError);
    return;
  }

  // Build permission rows (user × tool)
  const rows = users.flatMap((user) =>
    readTools.map((tool) => ({
      user_id: user.id,
      tool_id: tool.id,
      granted_by: grantedBy,
    }))
  );

  // Upsert to avoid duplicates (unique constraint on user_id, tool_id)
  const { error: insertError } = await admin
    .from("user_tool_permissions")
    .upsert(rows, { onConflict: "user_id,tool_id", ignoreDuplicates: true });

  if (insertError) {
    console.error("Failed to auto-grant read tools:", insertError);
  } else {
    console.log(
      `[Auto-grant] Granted ${readTools.length} read tools to ${users.length} users for connector ${connectorId}`
    );
  }
}
