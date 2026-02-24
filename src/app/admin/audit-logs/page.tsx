import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";

const PAGE_SIZE = 50;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const userFilter = params.user || "";
  const actionFilter = params.action || "";

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from("audit_logs")
    .select(
      "id, user_id, tool_name, action_type, action_detail, error, duration_ms, created_at, users(email, name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (userFilter) {
    query = query.eq("user_id", userFilter);
  }
  if (actionFilter) {
    query = query.eq("action_type", actionFilter);
  }

  const { data: logs, count } = await query;

  // Fetch users for filter dropdown
  const { data: users } = await admin
    .from("users")
    .select("id, email, name")
    .order("name");

  // Get distinct action types
  const { data: actionTypes } = await admin
    .from("audit_logs")
    .select("action_type")
    .limit(100);

  const uniqueActions = [
    ...new Set((actionTypes ?? []).map((a) => a.action_type)),
  ].sort();

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Audit Logs</h2>

      <AuditLogFilters
        users={users ?? []}
        actionTypes={uniqueActions}
        currentUser={userFilter}
        currentAction={actionFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {count ?? 0} total entries
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs ?? []).map((log) => {
                const userRaw = log.users as unknown;
                const user = Array.isArray(userRaw)
                  ? (userRaw[0] as { email: string; name: string | null } | undefined) ?? null
                  : (userRaw as { email: string; name: string | null } | null);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user?.name || user?.email || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.tool_name || "—"}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {log.action_detail || "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                    </TableCell>
                    <TableCell>
                      {log.error ? (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, count ?? 0)} of {count}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildPageUrl(page - 1, userFilter, actionFilter)}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildPageUrl(page + 1, userFilter, actionFilter)}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildPageUrl(page: number, user: string, action: string): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (user) params.set("user", user);
  if (action) params.set("action", action);
  return `/admin/audit-logs?${params.toString()}`;
}
