"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeyDisplay } from "@/components/admin/api-key-display";
import { createUser, createAgent } from "@/app/admin/actions";

type UserType = "employee" | "agent";
type Step = "form" | "key-display";

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>("employee");
  const [step, setStep] = useState<Step>("form");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  function resetState() {
    setError(null);
    setUserType("employee");
    setStep("form");
    setGeneratedKey(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetState();
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (userType === "agent") {
          const apiKey = await createAgent(formData);
          setGeneratedKey(apiKey);
          setStep("key-display");
        } else {
          await createUser(formData);
          setOpen(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create user");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Create a new employee or agent account.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              {/* User type toggle */}
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-1 rounded-md border p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      userType === "employee"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setUserType("employee")}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      userType === "agent"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setUserType("agent")}
                  >
                    Agent
                  </button>
                </div>
              </div>

              {userType === "employee" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder={
                    userType === "agent" ? "e.g. Production Agent" : undefined
                  }
                />
              </div>

              {userType === "employee" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="role"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      defaultValue="user"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}

              {userType === "agent" && (
                <p className="text-sm text-muted-foreground">
                  An API key will be generated after creation. The agent will
                  authenticate to the MCP endpoint using this key.
                </p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Creating\u2026"
                    : userType === "agent"
                    ? "Create Agent"
                    : "Create User"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Agent API Key</DialogTitle>
              <DialogDescription>
                This key will only be shown once. Copy it now.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ApiKeyDisplay apiKey={generatedKey!} />
              <p className="text-sm text-muted-foreground">
                Use this key as a Bearer token when calling the MCP endpoint.
                You can manage permissions for this agent on the Permissions
                page.
              </p>
              <Button className="w-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
