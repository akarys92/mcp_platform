"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
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
  user_type?: string;
}

interface Tool {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  category: string;
  is_active: boolean;
}

interface ConnectorGroup {
  connectorType: string;
  connectorName: string;
  tools: Tool[];
}

const CONNECTOR_LABELS: Record<string, string> = {
  quickbooks: "QuickBooks",
  stardex: "Stardex",
  apollo: "Apollo",
};

export function PermissionMatrix({
  users,
  connectorGroups,
  permissionSet: initialPermissions,
}: {
  users: User[];
  connectorGroups: ConnectorGroup[];
  permissionSet: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
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

  const activeGroup = connectorGroups.find(
    (g) => g.connectorType === expanded
  );

  function toggleConnector(ct: string) {
    setExpanded((prev) => (prev === ct ? null : ct));
  }

  function handleToggle(userId: string, toolId: string) {
    const key = `${userId}:${toolId}`;
    const has = permissions.has(key);
    startTransition(async () => {
      setOptimisticPermissions({ type: has ? "remove" : "add", key });
      if (has) await revokePermission(userId, toolId);
      else await grantPermission(userId, toolId);
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

  function getSummary(userId: string, tools: Tool[]) {
    let rE = 0,
      rT = 0,
      wE = 0,
      wT = 0;
    for (const t of tools) {
      const has = permissions.has(`${userId}:${t.id}`);
      if (t.category === "read") {
        rT++;
        if (has) rE++;
      } else {
        wT++;
        if (has) wE++;
      }
    }
    return { rE, rT, wE, wT };
  }

  return (
    <div className="space-y-5">
      {/* ── Connector selector cards ── */}
      <div className="flex flex-wrap gap-3">
        {connectorGroups.map((group) => {
          const isActive = expanded === group.connectorType;
          const label =
            CONNECTOR_LABELS[group.connectorType] || group.connectorName;
          const readCount = group.tools.filter(
            (t) => t.category === "read"
          ).length;
          const writeCount = group.tools.filter(
            (t) => t.category === "write"
          ).length;

          return (
            <button
              key={group.connectorType}
              onClick={() => toggleConnector(group.connectorType)}
              className={`flex items-center gap-3 rounded-lg border px-5 py-3 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/25 hover:bg-muted/50"
              }`}
            >
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isActive ? "rotate-90" : ""
                }`}
              />
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {readCount} read · {writeCount} write
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Expanded detail table ── */}
      {activeGroup && (
        <DetailTable
          group={activeGroup}
          users={users}
          permissions={permissions}
          isPending={isPending}
          onToggle={handleToggle}
          onBulkGrant={handleBulkGrant}
          onRevokeAll={handleRevokeAll}
          getSummary={getSummary}
        />
      )}
    </div>
  );
}

/* ─── Detail table for one connector ─── */

function DetailTable({
  group,
  users,
  permissions,
  isPending,
  onToggle,
  onBulkGrant,
  onRevokeAll,
  getSummary,
}: {
  group: ConnectorGroup;
  users: User[];
  permissions: Set<string>;
  isPending: boolean;
  onToggle: (userId: string, toolId: string) => void;
  onBulkGrant: (userId: string, category: "read" | "write") => void;
  onRevokeAll: (userId: string) => void;
  getSummary: (
    userId: string,
    tools: Tool[]
  ) => { rE: number; rT: number; wE: number; wT: number };
}) {
  const label =
    CONNECTOR_LABELS[group.connectorType] || group.connectorName;
  const readTools = group.tools.filter((t) => t.category === "read");
  const writeTools = group.tools.filter((t) => t.category === "write");

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="min-w-[280px]">
              {label} Tools
            </TableHead>
            {users.map((user) => {
              const s = getSummary(user.id, group.tools);
              return (
                <TableHead
                  key={user.id}
                  className="w-[120px] text-center"
                >
                  <div className="font-semibold">
                    {user.name || user.email}
                    {user.user_type === "agent" && (
                      <span className="ml-1 inline-block rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground">
                        Agent
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                    {s.rE}/{s.rT} read · {s.wE}/{s.wT} write
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Read section */}
          {readTools.length > 0 && (
            <>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={1 + users.length}
                  className="bg-muted/20 py-1.5"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Read
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {readTools.length} tools
                  </span>
                </TableCell>
              </TableRow>
              {readTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  users={users}
                  permissions={permissions}
                  isPending={isPending}
                  onToggle={onToggle}
                />
              ))}
            </>
          )}

          {/* Write section */}
          {writeTools.length > 0 && (
            <>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={1 + users.length}
                  className="bg-muted/20 py-1.5"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Write
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {writeTools.length} tools
                  </span>
                </TableCell>
              </TableRow>
              {writeTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  users={users}
                  permissions={permissions}
                  isPending={isPending}
                  onToggle={onToggle}
                />
              ))}
            </>
          )}
        </TableBody>
      </Table>

      {/* Bulk actions footer */}
      <div className="flex items-center border-t bg-muted/10 px-4 py-2.5">
        <div className="min-w-[280px] text-sm text-muted-foreground">
          Bulk actions
        </div>
        {users.map((user) => (
          <div
            key={user.id}
            className="flex w-[120px] shrink-0 items-center justify-center gap-1"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isPending}
              onClick={() => onBulkGrant(user.id, "read")}
            >
              +Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={isPending}
              onClick={() => onBulkGrant(user.id, "write")}
            >
              +Write
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => onRevokeAll(user.id)}
            >
              Clear
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Single tool row ─── */

function ToolRow({
  tool,
  users,
  permissions,
  isPending,
  onToggle,
}: {
  tool: Tool;
  users: User[];
  permissions: Set<string>;
  isPending: boolean;
  onToggle: (userId: string, toolId: string) => void;
}) {
  const displayName = (tool.display_name || tool.name)
    .replace(/^(apollo_|stardex_|qbo_)/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <TableRow className="group">
      <TableCell className="py-2.5">
        <div className="font-medium">{displayName}</div>
        {tool.description && (
          <div className="mt-0 max-h-0 overflow-hidden text-xs leading-relaxed text-muted-foreground transition-all duration-200 ease-in-out group-hover:mt-1 group-hover:max-h-16">
            {tool.description}
          </div>
        )}
      </TableCell>
      {users.map((user) => {
        const checked = permissions.has(`${user.id}:${tool.id}`);
        return (
          <TableCell key={user.id} className="text-center">
            <Switch
              size="sm"
              checked={checked}
              disabled={isPending}
              onCheckedChange={() => onToggle(user.id, tool.id)}
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
}
