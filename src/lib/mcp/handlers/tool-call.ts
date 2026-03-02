import { createAdminClient } from "@/lib/supabase/admin";
import { executeQBOTool } from "@/lib/qbo/executor";
import { executeStardexTool } from "@/lib/stardex/executor";
import { executeApolloTool } from "@/lib/apollo/executor";
import { logToolCall } from "@/lib/mcp/audit";
import { validateToolArgs } from "@/lib/qbo/validation";
import {
  checkQBOStandardRateLimit,
  checkQBOReportRateLimit,
} from "@/lib/mcp/rate-limit";
import {
  permissionDeniedError,
  toolNotFoundError,
  validationError,
  rateLimitError,
} from "@/lib/mcp/errors";
import type { JsonRpcResponse, MCPToolCallParams } from "@/types/mcp";
import { JSON_RPC_ERRORS } from "@/types/mcp";

const REPORT_TOOLS = new Set([
  "qb_get_profit_loss",
  "qb_get_balance_sheet",
  "qb_get_accounts_receivable",
]);

/**
 * Handle MCP tools/call request.
 * Validates user permission, executes the tool, and logs the action.
 */
export async function handleToolCall(
  params: MCPToolCallParams,
  userId: string,
  id: string | number
): Promise<JsonRpcResponse> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const { name: toolName, arguments: toolArgs } = params;

  if (!toolName) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: "Missing tool name",
      },
    };
  }

  // Check user has permission for this tool (join connector to get type)
  const { data: tools, error: toolError } = await supabase
    .from("tools")
    .select("id, connector_id, is_active, input_schema, connectors(type)")
    .eq("name", toolName)
    .limit(1);

  const tool = tools?.[0];
  const connectorType = (tool?.connectors as unknown as { type: string } | { type: string }[] | null);
  const connectorTypeStr = Array.isArray(connectorType)
    ? connectorType[0]?.type
    : connectorType?.type;

  if (toolError || !tool) {
    return { jsonrpc: "2.0", id, error: toolNotFoundError(toolName) };
  }

  if (!tool.is_active) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: `Tool is disabled: ${toolName}`,
      },
    };
  }

  // Check permission
  const { data: permission } = await supabase
    .from("user_tool_permissions")
    .select("id")
    .eq("user_id", userId)
    .eq("tool_id", tool.id)
    .single();

  if (!permission) {
    await logToolCall({
      userId,
      toolName,
      connectorId: tool.connector_id,
      requestSummary: toolArgs,
      error: "Permission denied",
      durationMs: Date.now() - startTime,
    });

    return { jsonrpc: "2.0", id, error: permissionDeniedError(toolName) };
  }

  // Validate input arguments against JSON Schema
  if (tool.input_schema && toolArgs) {
    const validationErr = validateToolArgs(
      tool.input_schema as Record<string, unknown>,
      toolArgs
    );
    if (validationErr) {
      return { jsonrpc: "2.0", id, error: validationError(validationErr) };
    }
  }

  // Check QBO rate limits (only for QBO tools)
  if (connectorTypeStr === "quickbooks") {
    const isReport = REPORT_TOOLS.has(toolName);
    const withinLimit = isReport
      ? checkQBOReportRateLimit()
      : checkQBOStandardRateLimit();

    if (!withinLimit) {
      return { jsonrpc: "2.0", id, error: rateLimitError() };
    }
  }

  // Execute the tool — route to the right executor by connector type
  try {
    let result: unknown;
    switch (connectorTypeStr) {
      case "quickbooks":
        result = await executeQBOTool(toolName, toolArgs || {}, tool.connector_id);
        break;
      case "stardex":
        result = await executeStardexTool(toolName, toolArgs || {}, tool.connector_id);
        break;
      case "apollo":
        result = await executeApolloTool(toolName, toolArgs || {}, tool.connector_id);
        break;
      default:
        throw new Error(`Unknown connector type: ${connectorTypeStr}`);
    }

    const durationMs = Date.now() - startTime;

    // Log success
    await logToolCall({
      userId,
      toolName,
      connectorId: tool.connector_id,
      requestSummary: toolArgs,
      responseSummary: summarizeResponse(result),
      durationMs,
    });

    // Format result as text for Claude
    const text =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text }],
      },
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    // Log failure
    await logToolCall({
      userId,
      toolName,
      connectorId: tool.connector_id,
      requestSummary: toolArgs,
      error: errorMessage,
      durationMs,
    });

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Error executing ${toolName}: ${errorMessage}`,
          },
        ],
        isError: true,
      },
    };
  }
}

function summarizeResponse(result: unknown): Record<string, unknown> {
  const str = JSON.stringify(result);
  if (str.length > 2000) {
    return {
      _truncated: true,
      length: str.length,
      preview: str.slice(0, 2000),
    };
  }
  return typeof result === "object" && result !== null
    ? (result as Record<string, unknown>)
    : { value: result };
}
