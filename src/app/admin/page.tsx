import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const admin = createAdminClient();

  // Fetch overview data in parallel
  const [connectorsRes, usersRes, recentLogsRes, toolCallsRes] =
    await Promise.all([
      admin.from("connectors").select("id, type, display_name, status"),
      admin.from("users").select("id", { count: "exact" }),
      admin
        .from("audit_logs")
        .select("id, action_type, action_detail, tool_name, created_at, user_id, users(email, name)")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("audit_logs")
        .select("id", { count: "exact" })
        .eq("action_type", "tool_call")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

  const connectors = connectorsRes.data ?? [];
  const userCount = usersRes.count ?? 0;
  const recentLogs = recentLogsRes.data ?? [];
  const toolCallCount = toolCallsRes.count ?? 0;

  const connectedCount = connectors.filter(
    (c) => c.status === "connected"
  ).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connectors</CardDescription>
            <CardTitle className="text-3xl">{connectedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {connectors.length} configured, {connectedCount} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{userCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tool Calls (7d)</CardDescription>
            <CardTitle className="text-3xl">{toolCallCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              MCP tool invocations this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connector Status</CardDescription>
            <CardTitle className="text-3xl">
              {connectedCount > 0 ? (
                <Badge variant="default">Healthy</Badge>
              ) : (
                <Badge variant="secondary">No connections</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {connectors
                .filter((c) => c.status === "error")
                .length > 0
                ? "Some connectors have errors"
                : "All connectors operational"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 10 audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const userRaw = log.users as unknown;
                const user = Array.isArray(userRaw)
                  ? (userRaw[0] as { email: string; name: string | null } | undefined) ?? null
                  : (userRaw as { email: string; name: string | null } | null);
                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {log.action_type}
                        </Badge>
                        {log.tool_name && (
                          <span className="text-muted-foreground">
                            {log.tool_name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-muted-foreground">
                        {log.action_detail || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <p>{user?.name || user?.email || "System"}</p>
                      <p>
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
