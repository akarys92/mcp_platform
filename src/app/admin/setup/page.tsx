import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyBlock } from "@/components/admin/copy-block";

export default function SetupGuidePage() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const mcpClientId = process.env.MCP_CLIENT_ID || "einstellen-claude-connector";
  const mcpUrl = `${appUrl}/api/mcp`;

  const agentCurlExample = `curl -X POST ${mcpUrl} \\
  -H "Authorization: Bearer eak_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  const agentPythonExample = `import httpx

response = httpx.post(
    "${mcpUrl}",
    headers={
        "Authorization": "Bearer eak_YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "apollo_search_people",
            "arguments": {"person_titles": ["CEO"]},
        },
    },
)
print(response.json())`;

  const employeeMessage = `Hi! We've set up Einstellen Connect so you can use Claude to work with our business tools.

Here's how to connect:

1. Open Claude Desktop → Settings → MCP Servers → "Add new MCP server"
   (Or in claude.ai → Settings → Integrations → "Add MCP Server")

2. Enter these details:
   • Server URL: ${mcpUrl}
   • Name: Einstellen Connect

3. Claude will open a browser window asking you to sign in.
   Use your Einstellen Connect credentials:
   • Email: [YOUR EMAIL]
   • Password: [YOUR TEMPORARY PASSWORD]

4. After signing in, click "Authorize" to grant Claude access.

5. That's it! Claude can now use the tools your admin has enabled for you.
   Try asking Claude something like "What tools do I have access to?"

If you have any issues, reach out to your admin.`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Setup Guide</h2>

      {/* Admin setup */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Setup — Connect Claude to This Server</CardTitle>
          <CardDescription>
            Follow these steps to add this MCP server to your Claude account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-medium">Step 1: Add the MCP Server</h3>
              <p className="mt-1 text-muted-foreground">
                In <strong>Claude Desktop</strong>: Settings → MCP Servers →
                &quot;Add new MCP server&quot;
              </p>
              <p className="mt-1 text-muted-foreground">
                In <strong>claude.ai</strong>: Settings → Integrations →
                &quot;Add MCP Server&quot;
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 2: Enter Server Details</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Server URL</p>
                  <CopyBlock text={mcpUrl} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Step 3: Authorize</h3>
              <p className="mt-1 text-muted-foreground">
                Claude will open a browser window with the Einstellen Connect
                login page. Sign in with your admin credentials, then click
                &quot;Authorize&quot; on the consent screen.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 4: Verify</h3>
              <p className="mt-1 text-muted-foreground">
                Once connected, try asking Claude: &quot;What tools do I have
                access to?&quot; — it should list the tools you&apos;ve been granted
                on the Permissions page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Employee instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Instructions</CardTitle>
          <CardDescription>
            Copy the message below and send it to your team members. Replace the
            bracketed fields with each employee&apos;s credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-medium">Before sending, make sure you&apos;ve:</h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                <li>Created a user account for the employee (Users page)</li>
                <li>Granted them tool permissions (Permissions page)</li>
                <li>Confirmed the connectors are active (Connectors page)</li>
              </ul>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Message to copy
              </p>
              <CopyBlock text={employeeMessage} multiline />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Agent setup */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Setup — API Key Authentication</CardTitle>
          <CardDescription>
            Connect AI agents (e.g. OpenClaw) to the MCP endpoint using API keys
            instead of OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-medium">Step 1: Create an Agent User</h3>
              <p className="mt-1 text-muted-foreground">
                Go to the Users page and click &quot;Add User&quot;. Select the
                &quot;Agent&quot; type, give it a name, and click &quot;Create
                Agent&quot;. An API key will be generated — copy it immediately,
                as it won&apos;t be shown again.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 2: Grant Permissions</h3>
              <p className="mt-1 text-muted-foreground">
                Go to the Permissions page. The agent appears alongside
                employees in the access matrix. Toggle on the tools the agent
                should be able to use.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 3: Authenticate Requests</h3>
              <p className="mt-1 text-muted-foreground">
                Send the API key as a Bearer token in the Authorization header.
                The endpoint, protocol, and tool schemas are identical to the
                OAuth flow — only the auth method differs.
              </p>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Example — List available tools
              </p>
              <CopyBlock text={agentCurlExample} multiline />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Example — Call a tool (Python)
              </p>
              <CopyBlock text={agentPythonExample} multiline />
            </div>

            <div>
              <h3 className="font-medium">Key Management</h3>
              <p className="mt-1 text-muted-foreground">
                API keys don&apos;t expire automatically. To rotate a key, open
                the agent&apos;s detail page (Users → View) and click
                &quot;Regenerate Key&quot;. The old key is revoked immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Technical reference */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Reference</CardTitle>
          <CardDescription>
            Connection details for manual configuration or troubleshooting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Shared
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    MCP Server URL
                  </p>
                  <CopyBlock text={mcpUrl} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protocol</p>
                  <CopyBlock text="JSON-RPC 2.0 over HTTP" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                OAuth (Claude Desktop &amp; claude.ai)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Client ID</p>
                  <CopyBlock text={mcpClientId} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Authorization Endpoint
                  </p>
                  <CopyBlock text={`${appUrl}/oauth/authorize`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Token Endpoint
                  </p>
                  <CopyBlock text={`${appUrl}/api/oauth/token`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Server Metadata
                  </p>
                  <CopyBlock
                    text={`${appUrl}/.well-known/oauth-authorization-server`}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Resource Metadata
                  </p>
                  <CopyBlock
                    text={`${appUrl}/.well-known/oauth-protected-resource`}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                API Key (Agents)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Auth Header</p>
                  <CopyBlock text="Authorization: Bearer eak_..." />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Key Prefix</p>
                  <CopyBlock text="eak_" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Agent API keys never expire. Revoke or regenerate from the
                agent&apos;s user detail page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
