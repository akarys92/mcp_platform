import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PermissionMatrix } from "@/components/admin/permission-matrix";

export default async function PermissionsPage() {
  const admin = createAdminClient();

  // Fetch users, tools, and existing permissions in parallel
  const [usersRes, toolsRes, permissionsRes] = await Promise.all([
    admin
      .from("users")
      .select("id, email, name, role")
      .order("name"),
    admin
      .from("tools")
      .select("id, name, display_name, category, is_active")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    admin
      .from("user_tool_permissions")
      .select("user_id, tool_id"),
  ]);

  const users = usersRes.data ?? [];
  const tools = toolsRes.data ?? [];
  const permissions = permissionsRes.data ?? [];

  // Build a set for quick lookup
  const permissionSet = new Set(
    permissions.map((p) => `${p.user_id}:${p.tool_id}`)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Permissions</h2>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active tools. Connect a service first.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tool Access Matrix</CardTitle>
            <CardDescription>
              Grant or revoke tool access per user. Rows are users, columns are
              tools grouped by category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionMatrix
              users={users}
              tools={tools}
              permissionSet={Array.from(permissionSet)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
