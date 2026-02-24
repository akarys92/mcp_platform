import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToolToggle } from "@/components/admin/tool-toggle";
import { DisconnectButton } from "@/components/admin/disconnect-button";

export default async function ConnectorsPage() {
  const admin = createAdminClient();

  const { data: connectors } = await admin
    .from("connectors")
    .select("*, users!connectors_connected_by_fkey(email, name)")
    .order("created_at");

  const qboConnector = connectors?.find((c) => c.type === "quickbooks") ?? null;

  // Fetch tools for the QBO connector
  let tools: { id: string; name: string; display_name: string | null; category: string; is_active: boolean }[] = [];
  if (qboConnector) {
    const { data } = await admin
      .from("tools")
      .select("id, name, display_name, category, is_active")
      .eq("connector_id", qboConnector.id)
      .order("category")
      .order("name");
    tools = data ?? [];
  }

  const statusColor = {
    connected: "default" as const,
    disconnected: "secondary" as const,
    error: "destructive" as const,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Connectors</h2>

      {/* QuickBooks card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>QuickBooks Online</CardTitle>
              <CardDescription>
                Accounting data — invoices, customers, payments, reports
              </CardDescription>
            </div>
            {qboConnector && (
              <Badge variant={statusColor[qboConnector.status as keyof typeof statusColor] ?? "secondary"}>
                {qboConnector.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!qboConnector || qboConnector.status === "disconnected" ? (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Connect your QuickBooks Online account to enable accounting tools
                for Claude.
              </p>
              <a href="/api/qbo/connect">
                <Button>Connect QuickBooks</Button>
              </a>
            </div>
          ) : (
            <>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Realm ID</p>
                  <p className="font-mono text-xs">
                    {qboConnector.config?.realm_id || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Environment</p>
                  <p>{qboConnector.config?.environment || "sandbox"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Connected</p>
                  <p>
                    {qboConnector.connected_at
                      ? new Date(qboConnector.connected_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a href="/api/qbo/connect">
                  <Button variant="outline" size="sm">
                    Reconnect
                  </Button>
                </a>
                <DisconnectButton connectorId={qboConnector.id} />
              </div>

              {tools.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 text-sm font-medium">Tools</h3>
                    <div className="space-y-2">
                      {(["read", "write"] as const).map((category) => {
                        const categoryTools = tools.filter(
                          (t) => t.category === category
                        );
                        if (categoryTools.length === 0) return null;
                        return (
                          <div key={category}>
                            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                              {category}
                            </p>
                            <div className="space-y-1">
                              {categoryTools.map((tool) => (
                                <ToolToggle
                                  key={tool.id}
                                  toolId={tool.id}
                                  name={tool.display_name || tool.name}
                                  isActive={tool.is_active}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
