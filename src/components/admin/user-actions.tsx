"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteUser, updateUser, revokeUserToken } from "@/app/admin/actions";

export function UserActions({
  userId,
  userName,
  userRole,
}: {
  userId: string;
  userName: string | null;
  userRole: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          const newRole = userRole === "admin" ? "user" : "admin";
          if (
            !confirm(
              `Change ${userName || "this user"}'s role to ${newRole}?`
            )
          )
            return;
          startTransition(() => {
            updateUser(userId, { role: newRole });
          });
        }}
      >
        {userRole === "admin" ? "Demote to User" : "Promote to Admin"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (
            !confirm(
              `Revoke all MCP tokens for ${userName || "this user"}? They will need to re-authorize in Claude.`
            )
          )
            return;
          startTransition(() => {
            revokeUserToken(userId);
          });
        }}
      >
        Revoke Tokens
      </Button>

      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (
            !confirm(
              `Delete ${userName || "this user"}? This action cannot be undone.`
            )
          )
            return;
          startTransition(async () => {
            await deleteUser(userId);
            router.push("/admin/users");
          });
        }}
      >
        Delete User
      </Button>
    </div>
  );
}
