import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/components/admin/copy-block";
import Link from "next/link";

export default async function SetupClaudePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, must_change_password")
    .eq("id", user.id)
    .single();

  if (profile?.must_change_password) redirect("/change-password");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const mcpUrl = `${appUrl}/api/mcp`;
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">You're All Set!</CardTitle>
          <CardDescription>
            Your password has been updated. Follow these steps to connect Claude
            to your business tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">Step 1: Open Claude Settings</h3>
              <p className="mt-1 text-muted-foreground">
                In <strong>Claude Desktop</strong>: Settings &rarr; MCP Servers
                &rarr; &quot;Add new MCP server&quot;
              </p>
              <p className="mt-1 text-muted-foreground">
                In <strong>claude.ai</strong>: Settings &rarr; Integrations
                &rarr; &quot;Add MCP Server&quot;
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 2: Enter Server Details</h3>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Server URL</p>
                <CopyBlock text={mcpUrl} />
              </div>
            </div>

            <div>
              <h3 className="font-medium">Step 3: Authorize</h3>
              <p className="mt-1 text-muted-foreground">
                Claude will open a browser window asking you to sign in. Use
                your Einstellen Connect email and the password you just set,
                then click &quot;Authorize&quot;.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Step 4: Verify</h3>
              <p className="mt-1 text-muted-foreground">
                Once connected, try asking Claude: &quot;What tools do I have
                access to?&quot;
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2">
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  Go to Admin Dashboard
                </Button>
              </Link>
            </div>
          )}

          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" className="w-full" type="submit">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
