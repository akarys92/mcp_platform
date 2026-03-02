import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserActions } from "@/components/admin/user-actions";
import { RegenerateKeyButton } from "@/components/admin/regenerate-key-button";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (!user) notFound();

  const isAgent = user.user_type === "agent";

  // Fetch permissions and recent activity in parallel
  const [permissionsRes, logsRes, tokensRes, agentKeysRes] = await Promise.all([
    admin
      .from("user_tool_permissions")
      .select("id, tool_id, granted_at, tools(name, display_name, category)")
      .eq("user_id", id)
      .order("granted_at", { ascending: false }),
    admin
      .from("audit_logs")
      .select("id, action_type, action_detail, tool_name, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    isAgent
      ? Promise.resolve({ data: [] })
      : admin
          .from("oauth_tokens")
          .select("id, created_at, expires_at, revoked_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
    isAgent
      ? admin
          .from("agent_api_keys")
          .select("id, key_prefix, label, revoked_at, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const permissions = permissionsRes.data ?? [];
  const recentLogs = logsRes.data ?? [];
  const tokens = tokensRes.data ?? [];
  const agentKeys = agentKeysRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {user.name || user.email}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAgent ? "Agent" : user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role}
          </Badge>
          {isAgent && <Badge variant="outline">Agent</Badge>}
        </div>
      </div>

      <UserActions
        userId={user.id}
        userName={user.name}
        userRole={user.role}
        userType={user.user_type}
      />

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Permissions</CardTitle>
          <CardDescription>
            {permissions.length} tool{permissions.length !== 1 ? "s" : ""} granted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tool permissions granted. Go to the Permissions page to manage
              access.
            </p>
          ) : (
            <div className="space-y-1">
              {permissions.map((perm) => {
                const toolRaw = perm.tools as unknown;
                const tool = Array.isArray(toolRaw)
                  ? (toolRaw[0] as { name: string; display_name: string | null; category: string } | undefined) ?? null
                  : (toolRaw as { name: string; display_name: string | null; category: string } | null);
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tool?.category}
                      </Badge>
                      <span>{tool?.display_name || tool?.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(perm.granted_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent API Keys (shown for agents) */}
      {isAgent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  API keys for this agent to authenticate with the MCP endpoint
                </CardDescription>
              </div>
              <RegenerateKeyButton userId={user.id} userName={user.name} />
            </div>
          </CardHeader>
          <CardContent>
            {agentKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No API keys. Use Regenerate Key to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {agentKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-mono text-xs">
                        {key.key_prefix}...
                      </span>
                      <span className="text-muted-foreground"> · Created </span>
                      {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    {key.revoked_at ? (
                      <Badge variant="secondary">Revoked</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MCP Tokens (shown for employees) */}
      {!isAgent && (
        <Card>
          <CardHeader>
            <CardTitle>MCP Sessions</CardTitle>
            <CardDescription>OAuth tokens issued for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No MCP tokens issued yet.
              </p>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="text-muted-foreground">Issued </span>
                      {new Date(token.created_at).toLocaleDateString()}
                      <span className="text-muted-foreground"> · Expires </span>
                      {new Date(token.expires_at).toLocaleDateString()}
                    </div>
                    {token.revoked_at ? (
                      <Badge variant="secondary">Revoked</Badge>
                    ) : new Date(token.expires_at) < new Date() ? (
                      <Badge variant="secondary">Expired</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
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
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.tool_name}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-muted-foreground">
                      {log.action_detail || "\u2014"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
