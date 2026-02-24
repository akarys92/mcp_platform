"use client";

import { useTransition, useMemo, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import {
  grantPermission,
  revokePermission,
  grantCategoryPermissions,
  revokeAllPermissions,
} from "@/app/admin/actions";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Tool {
  id: string;
  name: string;
  display_name: string | null;
  category: string;
  is_active: boolean;
}

export function PermissionMatrix({
  users,
  tools,
  permissionSet: initialPermissions,
}: {
  users: User[];
  tools: Tool[];
  permissionSet: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [permissions, setOptimisticPermissions] = useOptimistic(
    new Set(initialPermissions),
    (state: Set<string>, action: { type: "add" | "remove"; key: string }) => {
      const next = new Set(state);
      if (action.type === "add") next.add(action.key);
      else next.delete(action.key);
      return next;
    }
  );

  const readTools = useMemo(
    () => tools.filter((t) => t.category === "read"),
    [tools]
  );
  const writeTools = useMemo(
    () => tools.filter((t) => t.category === "write"),
    [tools]
  );

  function handleToggle(userId: string, toolId: string) {
    const key = `${userId}:${toolId}`;
    const hasPermission = permissions.has(key);

    startTransition(async () => {
      if (hasPermission) {
        setOptimisticPermissions({ type: "remove", key });
        await revokePermission(userId, toolId);
      } else {
        setOptimisticPermissions({ type: "add", key });
        await grantPermission(userId, toolId);
      }
    });
  }

  function handleBulkGrant(userId: string, category: "read" | "write") {
    startTransition(() => {
      grantCategoryPermissions(userId, category);
    });
  }

  function handleRevokeAll(userId: string) {
    if (!confirm("Revoke all permissions for this user?")) return;
    startTransition(() => {
      revokeAllPermissions(userId);
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
              User
            </th>
            {readTools.length > 0 && (
              <th
                colSpan={readTools.length}
                className="border-l px-2 py-1 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                Read
              </th>
            )}
            {writeTools.length > 0 && (
              <th
                colSpan={writeTools.length}
                className="border-l px-2 py-1 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                Write
              </th>
            )}
            <th className="border-l px-2 py-1 text-center text-xs font-medium">
              Actions
            </th>
          </tr>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="sticky left-0 z-10 bg-card" />
            {[...readTools, ...writeTools].map((tool) => (
              <th
                key={tool.id}
                className="max-w-[80px] truncate border-l px-1 py-1 text-center font-normal"
                title={tool.display_name || tool.name}
              >
                {(tool.display_name || tool.name)
                  .replace(/^(get_|create_|send_|record_)/, "")
                  .replace(/_/g, " ")}
              </th>
            ))}
            <th className="border-l" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-muted/50">
              <td className="sticky left-0 z-10 bg-card px-3 py-2">
                <div className="font-medium">{user.name || user.email}</div>
                {user.name && (
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                )}
              </td>
              {[...readTools, ...writeTools].map((tool) => {
                const key = `${user.id}:${tool.id}`;
                const checked = permissions.has(key);
                return (
                  <td key={tool.id} className="border-l text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPending}
                      onChange={() => handleToggle(user.id, tool.id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-primary"
                    />
                  </td>
                );
              })}
              <td className="border-l px-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    disabled={isPending}
                    onClick={() => handleBulkGrant(user.id, "read")}
                  >
                    +Read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    disabled={isPending}
                    onClick={() => handleBulkGrant(user.id, "write")}
                  >
                    +Write
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs text-destructive"
                    disabled={isPending}
                    onClick={() => handleRevokeAll(user.id)}
                  >
                    Clear
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
