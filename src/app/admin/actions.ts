"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/mcp/audit";
import { generateToken, hashToken } from "@/lib/crypto";
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
    must_change_password: true,
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

  const userEmail = await resolveUserEmail(admin, userId);

  await logAdminAction({
    userId: adminId,
    actionType: "user_updated",
    actionDetail: `Updated ${userEmail}: ${JSON.stringify(data)}`,
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  // Resolve email before deletion since the user row will be cascade-deleted
  const userEmail = await resolveUserEmail(admin, userId);

  // Delete from auth (cascade will handle public.users)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "user_deleted",
    actionDetail: `Deleted ${userEmail}`,
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

  const [toolName, userEmail] = await Promise.all([
    resolveToolName(admin, toolId),
    resolveUserEmail(admin, userId),
  ]);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_granted",
    actionDetail: `Granted ${toolName} to ${userEmail}`,
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

  const [toolName, userEmail] = await Promise.all([
    resolveToolName(admin, toolId),
    resolveUserEmail(admin, userId),
  ]);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_revoked",
    actionDetail: `Revoked ${toolName} from ${userEmail}`,
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

  const userEmail = await resolveUserEmail(admin, userId);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_bulk_granted",
    actionDetail: `Granted all ${category} tools to ${userEmail}`,
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

  const userEmail = await resolveUserEmail(admin, userId);

  await logAdminAction({
    userId: adminId,
    actionType: "permission_bulk_revoked",
    actionDetail: `Revoked all tools from ${userEmail}`,
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

  const toolName = await resolveToolName(admin, toolId);

  await logAdminAction({
    userId: adminId,
    actionType: "tool_toggled",
    actionDetail: `${isActive ? "Enabled" : "Disabled"} ${toolName}`,
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

  const connectorName = await resolveConnectorName(admin, connectorId);

  await logAdminAction({
    userId: adminId,
    actionType: "connector_disconnected",
    actionDetail: `Disconnected ${connectorName}`,
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

  const userEmail = await resolveUserEmail(admin, userId);

  await logAdminAction({
    userId: adminId,
    actionType: "token_revoked",
    actionDetail: `Revoked MCP tokens for ${userEmail}`,
  });

  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Update auth password via admin API
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (authError) throw new Error(authError.message);

  // Re-set the must_change_password flag
  const { error: flagError } = await admin
    .from("users")
    .update({ must_change_password: true })
    .eq("id", userId);
  if (flagError) throw new Error(flagError.message);

  const userEmail = await resolveUserEmail(admin, userId);
  await logAdminAction({
    userId: adminId,
    actionType: "password_reset",
    actionDetail: `Reset password for ${userEmail}`,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

// ── Agent management ────────────────────────────────────────────────

export async function createAgent(formData: FormData): Promise<string> {
  const adminId = await requireAdmin();
  const name = formData.get("name") as string;

  const admin = createAdminClient();
  const agentUuid = crypto.randomUUID();
  const dummyEmail = `agent-${agentUuid}@agent.internal`;
  const dummyPassword = generateToken(16);

  // Create a Supabase auth user (satisfies FK constraint, agent never logs in)
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: dummyEmail,
      password: dummyPassword,
      email_confirm: true,
    });

  if (authError) throw new Error(authError.message);

  // Insert into public.users as an agent
  const { error: insertError } = await admin.from("users").insert({
    id: authUser.user.id,
    email: dummyEmail,
    name,
    role: "user",
    user_type: "agent",
    must_change_password: false,
  });

  if (insertError) throw new Error(insertError.message);

  // Generate API key with eak_ prefix
  const rawKey = generateToken(32);
  const apiKey = `eak_${rawKey}`;
  const keyHash = hashToken(apiKey);
  const keyPrefix = apiKey.slice(0, 12);

  const { error: keyError } = await admin.from("agent_api_keys").insert({
    user_id: authUser.user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label: name,
  });

  if (keyError) throw new Error(keyError.message);

  await logAdminAction({
    userId: adminId,
    actionType: "agent_created",
    actionDetail: `Created agent "${name}"`,
  });

  revalidatePath("/admin/users");
  return apiKey;
}

export async function revokeAgentKey(keyId: string) {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("agent_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .is("revoked_at", null);

  if (error) throw new Error(error.message);

  await logAdminAction({
    userId: adminId,
    actionType: "agent_key_revoked",
    actionDetail: `Revoked agent API key`,
  });

  revalidatePath("/admin/users");
}

export async function regenerateAgentKey(userId: string): Promise<string> {
  const adminId = await requireAdmin();
  const admin = createAdminClient();

  // Revoke all existing keys for this agent
  await admin
    .from("agent_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);

  // Generate new key
  const rawKey = generateToken(32);
  const apiKey = `eak_${rawKey}`;
  const keyHash = hashToken(apiKey);
  const keyPrefix = apiKey.slice(0, 12);

  const { data: user } = await admin
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  const { error: keyError } = await admin.from("agent_api_keys").insert({
    user_id: userId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label: user?.name || "Agent",
  });

  if (keyError) throw new Error(keyError.message);

  await logAdminAction({
    userId: adminId,
    actionType: "agent_key_regenerated",
    actionDetail: `Regenerated API key for agent ${user?.name || userId}`,
  });

  revalidatePath("/admin/users");
  return apiKey;
}

// ── Helpers to resolve UUIDs to human-readable names for audit logs ──

type AdminClient = ReturnType<typeof createAdminClient>;

async function resolveUserEmail(admin: AdminClient, userId: string): Promise<string> {
  const { data } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  return data?.email || userId;
}

async function resolveToolName(admin: AdminClient, toolId: string): Promise<string> {
  const { data } = await admin
    .from("tools")
    .select("name")
    .eq("id", toolId)
    .single();
  return data?.name || toolId;
}

async function resolveConnectorName(admin: AdminClient, connectorId: string): Promise<string> {
  const { data } = await admin
    .from("connectors")
    .select("display_name")
    .eq("id", connectorId)
    .single();
  return data?.display_name || connectorId;
}
