"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/mcp/audit";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") throw new Error("Not authorized");
  return user.id;
}

export async function createUser(formData: FormData) {
  const adminId = await requireAdmin();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "user";

  const admin = createAdminClient();

  // Create auth user via admin API
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw new Error(authError.message);

  // Insert into public.users
  const { error: insertError } = await admin.from("users").insert({
    id: authUser.user.id,
    email,
    name,
    role,
  });

  if (insertError) throw new Error(insertError.message);

  await logAdminAction({
    userId: adminId,
    actionType: "user_created",
    actionDetail: `Created user ${email} with role ${role}`,
  });

  revalidatePath("/admin/users");
}

export async function updateUser(
  userId: string,
  data: { name?: string; role?: string }
) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("users")
    .update(data)
    .eq("id", userId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "user_updated",
    actionDetail: `Updated user ${userId}: ${JSON.stringify(data)}`,
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  // Delete from auth (cascade will handle public.users)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "user_deleted",
    actionDetail: `Deleted user ${userId}`,
  });

  revalidatePath("/admin/users");
}

export async function grantPermission(userId: string, toolId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("user_tool_permissions").upsert(
    {
      user_id: userId,
      tool_id: toolId,
      granted_by: adminId,
    },
    { onConflict: "user_id,tool_id" }
  );

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_granted",
    actionDetail: `Granted tool ${toolId} to user ${userId}`,
  });

  revalidatePath("/admin/permissions");
}

export async function revokePermission(userId: string, toolId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("user_tool_permissions")
    .delete()
    .eq("user_id", userId)
    .eq("tool_id", toolId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_revoked",
    actionDetail: `Revoked tool ${toolId} from user ${userId}`,
  });

  revalidatePath("/admin/permissions");
}

export async function grantCategoryPermissions(
  userId: string,
  category: "read" | "write"
) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { data: tools } = await admin
    .from("tools")
    .select("id")
    .eq("category", category)
    .eq("is_active", true);

  if (!tools) return;

  const permissions = tools.map((t) => ({
    user_id: userId,
    tool_id: t.id,
    granted_by: adminId,
  }));

  const { error } = await admin
    .from("user_tool_permissions")
    .upsert(permissions, { onConflict: "user_id,tool_id" });

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_bulk_granted",
    actionDetail: `Granted all ${category} tools to user ${userId}`,
  });

  revalidatePath("/admin/permissions");
}

export async function revokeAllPermissions(userId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("user_tool_permissions")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_bulk_revoked",
    actionDetail: `Revoked all tools from user ${userId}`,
  });

  revalidatePath("/admin/permissions");
}

export async function toggleTool(toolId: string, isActive: boolean) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("tools")
    .update({ is_active: isActive })
    .eq("id", toolId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "tool_toggled",
    actionDetail: `${isActive ? "Enabled" : "Disabled"} tool ${toolId}`,
  });

  revalidatePath("/admin/connectors");
}

export async function disconnectConnector(connectorId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("connectors")
    .update({
      status: "disconnected",
      oauth_credentials: null,
      connected_at: null,
    })
    .eq("id", connectorId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "connector_disconnected",
    actionDetail: `Disconnected connector ${connectorId}`,
    connectorId,
  });

  revalidatePath("/admin/connectors");
}

export async function revokeUserToken(userId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("oauth_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "token_revoked",
    actionDetail: `Revoked MCP tokens for user ${userId}`,
  });

  revalidatePath("/admin/users");
}
