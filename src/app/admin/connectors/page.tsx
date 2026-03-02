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
import { ApiKeyConnectForm } from "@/components/admin/api-key-connect-form";
import { ConnectedKeyDisplay } from "@/components/admin/connected-key-display";

type ToolRow = {
  id: string;
  name: string;
  display_name: string | null;
  category: string;
  is_active: boolean;
};

const statusColor = {
  connected: "default" as const,
  disconnected: "secondary" as const,
  error: "destructive" as const,
};

async function getToolsForConnector(
  admin: ReturnType<typeof createAdminClient>,
  connectorId: string
): Promise<ToolRow[]> {
  const { data } = await admin
    .from("tools")
    .select("id, name, display_name, category, is_active")
    .eq("connector_id", connectorId)
    .order("category")
    .order("name");
  return (data ?? []) as ToolRow[];
}

function ConnectorToolList({ tools }: { tools: ToolRow[] }) {
  if (tools.length === 0) return null;
  return (
    <>
      <Separator />
      <div>
        <h3 className="mb-3 text-sm font-medium">Tools</h3>
        <div className="space-y-2">
          {(["read", "write"] as const).map((category) => {
            const categoryTools = tools.filter((t) => t.category === category);
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
  );
}

export default async function ConnectorsPage() {
  const admin = createAdminClient();

  const { data: connectors } = await admin
    .from("connectors")
    .select("*, users!connectors_connected_by_fkey(email, name)")
    .order("created_at");

  const qboConnector =
    connectors?.find((c) => c.type === "quickbooks") ?? null;
  const stardexConnector =
    connectors?.find((c) => c.type === "stardex") ?? null;
  const apolloConnector =
    connectors?.find((c) => c.type === "apollo") ?? null;

  // Fetch tools for each connected connector
  const qboTools = qboConnector
    ? await getToolsForConnector(admin, qboConnector.id)
    : [];
  const stardexTools = stardexConnector
    ? await getToolsForConnector(admin, stardexConnector.id)
    : [];
  const apolloTools = apolloConnector
    ? await getToolsForConnector(admin, apolloConnector.id)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Connectors</h2>

      {/* Stardex card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stardex</CardTitle>
              <CardDescription>
                ATS &amp; Recruiting — jobs, candidates, persons, and activities
              </CardDescription>
            </div>
            {stardexConnector && (
              <Badge
                variant={
                  statusColor[
                    stardexConnector.status as keyof typeof statusColor
                  ] ?? "secondary"
                }
              >
                {stardexConnector.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stardexConnector || stardexConnector.status === "disconnected" ? (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Connect your Stardex account to enable recruiting tools for
                Claude.
              </p>
              <ApiKeyConnectForm
                connectorType="stardex"
                endpoint="/api/stardex/connect"
              />
            </div>
          ) : (
            <>
              <ConnectedKeyDisplay
                connectorId={stardexConnector.id}
                connectorType="stardex"
                endpoint="/api/stardex/connect"
                connectedAt={stardexConnector.connected_at}
              />

              <ConnectorToolList tools={stardexTools} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Apollo card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apollo</CardTitle>
              <CardDescription>
                Sales intelligence — people search, enrichment, contacts, and
                sequences
              </CardDescription>
            </div>
            {apolloConnector && (
              <Badge
                variant={
                  statusColor[
                    apolloConnector.status as keyof typeof statusColor
                  ] ?? "secondary"
                }
              >
                {apolloConnector.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!apolloConnector || apolloConnector.status === "disconnected" ? (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Connect your Apollo account to enable sales intelligence tools
                for Claude.
              </p>
              <ApiKeyConnectForm
                connectorType="apollo"
                endpoint="/api/apollo/connect"
              />
            </div>
          ) : (
            <>
              <ConnectedKeyDisplay
                connectorId={apolloConnector.id}
                connectorType="apollo"
                endpoint="/api/apollo/connect"
                connectedAt={apolloConnector.connected_at}
              />

              <ConnectorToolList tools={apolloTools} />
            </>
          )}
        </CardContent>
      </Card>

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
              <Badge
                variant={
                  statusColor[
                    qboConnector.status as keyof typeof statusColor
                  ] ?? "secondary"
                }
              >
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
                      ? new Date(
                          qboConnector.connected_at
                        ).toLocaleDateString()
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

              <ConnectorToolList tools={qboTools} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
