import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

interface SearchParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
}

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const {
    client_id,
    redirect_uri,
    response_type,
    state,
    code_challenge,
    code_challenge_method,
    scope,
  } = params;

  // Validate required OAuth parameters
  if (!client_id || !redirect_uri || !response_type || !code_challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invalid Request</h1>
          <p className="mt-2 text-muted-foreground">
            Missing required OAuth parameters.
          </p>
        </div>
      </div>
    );
  }

  if (response_type !== "code") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Unsupported Response Type</h1>
          <p className="mt-2 text-muted-foreground">
            Only &quot;code&quot; response type is supported.
          </p>
        </div>
      </div>
    );
  }

  if (code_challenge_method && code_challenge_method !== "S256") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Unsupported Challenge Method</h1>
          <p className="mt-2 text-muted-foreground">
            Only S256 code challenge method is supported.
          </p>
        </div>
      </div>
    );
  }

  // Accept any client_id — Claude Desktop and claude.ai use their own IDs.
  // In production you could maintain an allowlist if needed.

  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Build the returnTo path (relative — works with any host/tunnel)
    const authorizeParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) authorizeParams.set(key, value);
    }
    const returnTo = `/oauth/authorize?${authorizeParams.toString()}`;
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // Get user name from our users table
  const { data: userData } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ConsentForm
        userName={userData?.name || userData?.email || user.email || "User"}
        clientId={client_id}
        redirectUri={redirect_uri}
        state={state || ""}
        codeChallenge={code_challenge}
        codeChallengeMethod={code_challenge_method || "S256"}
        scope={scope || "mcp:tools"}
      />
    </div>
  );
}
