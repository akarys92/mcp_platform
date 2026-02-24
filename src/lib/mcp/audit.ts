import { createAdminClient } from "@/lib/supabase/admin";

interface AuditEntry {
  userId: string;
  toolName: string;
  connectorId: string;
  actionType?: string;
  actionDetail?: string;
  requestSummary?: unknown;
  responseSummary?: unknown;
  error?: string;
  durationMs: number;
}

/**
 * Log a tool call (or any auditable action) to the audit_logs table.
 * Truncates large payloads to stay within reasonable storage limits.
 */
export async function logToolCall(entry: AuditEntry): Promise<void> {
  const supabase = createAdminClient();

  try {
    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      tool_name: entry.toolName,
      connector_id: entry.connectorId,
      action_type: entry.actionType || "tool_call",
      action_detail: entry.actionDetail || null,
      request_summary: entry.requestSummary
        ? truncateForLog(entry.requestSummary)
        : null,
      response_summary: entry.responseSummary
        ? truncateForLog(entry.responseSummary)
        : null,
      error: entry.error || null,
      duration_ms: entry.durationMs,
    });
  } catch (err) {
    // Audit logging should never cause a tool call to fail
    console.error("Failed to write audit log:", err);
  }
}

/**
 * Log a general admin action (not a tool call).
 */
export async function logAdminAction(params: {
  userId: string;
  actionType: string;
  actionDetail: string;
  connectorId?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  try {
    await supabase.from("audit_logs").insert({
      user_id: params.userId,
      action_type: params.actionType,
      action_detail: params.actionDetail,
      connector_id: params.connectorId || null,
      duration_ms: 0,
    });
  } catch (err) {
    console.error("Failed to write admin audit log:", err);
  }
}

function truncateForLog(data: unknown): unknown {
  const str = JSON.stringify(data);
  if (str.length > 5000) {
    return { _truncated: true, preview: str.slice(0, 5000) };
  }
  return typeof data === "object" ? data : { value: data };
}
