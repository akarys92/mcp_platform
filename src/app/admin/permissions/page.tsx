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

  // Fetch users, tools (with connector info), and existing permissions
  const [usersRes, toolsRes, permissionsRes] = await Promise.all([
    admin
      .from("users")
      .select("id, email, name, role, user_type")
      .order("name"),
    admin
      .from("tools")
      .select("id, name, display_name, description, category, is_active, connector_id, connectors(type, display_name)")
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

  // Group tools by connector
  const connectorGroups: {
    connectorType: string;
    connectorName: string;
    tools: typeof tools;
  }[] = [];

  const connectorMap = new Map<string, typeof tools>();
  const connectorMeta = new Map<string, { type: string; name: string }>();

  for (const tool of tools) {
    const connectorId = tool.connector_id;
    if (!connectorMap.has(connectorId)) {
      connectorMap.set(connectorId, []);
      const connector = tool.connectors as unknown as
        | { type: string; display_name: string }
        | { type: string; display_name: string }[]
        | null;
      const c = Array.isArray(connector) ? connector[0] : connector;
      connectorMeta.set(connectorId, {
        type: c?.type ?? "unknown",
        name: c?.display_name ?? "Unknown",
      });
    }
    connectorMap.get(connectorId)!.push(tool);
  }

  for (const [connectorId, connectorTools] of connectorMap) {
    const meta = connectorMeta.get(connectorId)!;
    connectorGroups.push({
      connectorType: meta.type,
      connectorName: meta.name,
      tools: connectorTools,
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Permissions</h2>

      {connectorGroups.length === 0 ? (
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
              Grant or revoke tool access per user. Select a connector to manage
              its tool permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionMatrix
              users={users}
              connectorGroups={connectorGroups.map((g) => ({
                connectorType: g.connectorType,
                connectorName: g.connectorName,
                tools: g.tools.map((t) => ({
                  id: t.id,
                  name: t.name,
                  display_name: t.display_name,
                  description: t.description,
                  category: t.category,
                  is_active: t.is_active,
                })),
              }))}
              permissionSet={Array.from(permissionSet)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
