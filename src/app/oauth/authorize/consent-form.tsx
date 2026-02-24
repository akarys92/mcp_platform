"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConsentFormProps {
  userName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
}

export function ConsentForm({
  userName,
  clientId,
  redirectUri,
  state,
  codeChallenge,
  codeChallengeMethod,
  scope,
}: ConsentFormProps) {
  const [loading, setLoading] = useState(false);

  const handleAuthorize = async () => {
    setLoading(true);

    const response = await fetch("/api/oauth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        scope,
      }),
    });

    if (response.ok) {
      const { redirect_url } = await response.json();
      window.location.href = redirect_url;
    } else {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied the authorization request");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Authorize Claude</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium">{userName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Claude</span> is
          requesting access to your Einstellen Connect account. This will
          allow Claude to use the business tools your admin has granted you
          access to.
        </p>
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm font-medium">Requested permissions:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
            <li>Access your assigned business tools</li>
            <li>Read and write data through permitted tools</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDeny}
          disabled={loading}
        >
          Deny
        </Button>
        <Button
          className="flex-1"
          onClick={handleAuthorize}
          disabled={loading}
        >
          {loading ? "Authorizing..." : "Authorize"}
        </Button>
      </CardFooter>
    </Card>
  );
}
