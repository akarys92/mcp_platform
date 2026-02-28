"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const initialError =
    errorParam === "admin_only"
      ? "Admin access required. Non-admin users connect through Claude's MCP integration."
      : null;

  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check profile for role and password-change flag
    const userId = authData.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("users")
        .select("role, must_change_password")
        .eq("id", userId)
        .single();

      // Force password change before anything else
      if (profile?.must_change_password) {
        router.push("/change-password");
        return;
      }

      // If there's a returnTo (OAuth consent flow), redirect there regardless of role
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
        return;
      }

      // Route based on role
      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/setup-claude");
      }
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Einstellen Connect</CardTitle>
          <CardDescription>
            Sign in to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@einstellen.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 text-xs text-muted-foreground">
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        <span>&middot;</span>
        <Link href="/terms" className="underline hover:text-foreground">
          End User Agreement
        </Link>
      </div>
    </div>
  );
}
