"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  name: string | null;
}

export function AuditLogFilters({
  users,
  actionTypes,
  currentUser,
  currentAction,
}: {
  users: User[];
  actionTypes: string[];
  currentUser: string;
  currentAction: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 when filtering
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/admin/audit-logs");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentUser}
        onChange={(e) => updateFilter("user", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        <option value="">All users</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.email}
          </option>
        ))}
      </select>

      <select
        value={currentAction}
        onChange={(e) => updateFilter("action", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
      >
        <option value="">All actions</option>
        {actionTypes.map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select>

      {(currentUser || currentAction) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
