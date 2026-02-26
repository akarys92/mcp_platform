"use client";

import { useState } from "react";
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
import Link from "next/link";
import { changePassword } from "./actions";

export function ChangePasswordForm({
  forced,
  isAdmin,
}: {
  forced: boolean;
  isAdmin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    // If changePassword succeeds it redirects, so we only get here on error
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Change Your Password</CardTitle>
          <CardDescription>
            {forced
              ? "Please set a new password to continue."
              : "Enter a new password for your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <input type="hidden" name="forced" value={forced ? "1" : "0"} />
            <input type="hidden" name="isAdmin" value={isAdmin ? "1" : "0"} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Set Password"}
            </Button>
            {!forced && (
              <Link
                href={isAdmin ? "/admin" : "/setup-claude"}
                className="block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Link>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
