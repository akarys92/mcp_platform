import { createAdminClient } from "@/lib/supabase/admin";
import type { JsonRpcResponse } from "@/types/mcp";

/**
 * Handle MCP tools/list request.
 * Returns only tools the authenticated user has permission to access.
 */
export async function handleToolsList(
  userId: string,
  id: string | number,
  params?: Record<string, unknown>
): Promise<JsonRpcResponse> {
  const supabase = createAdminClient();

  // Get all tools the user has permission for, joined with tool details
  const { data: permissions, error } = await supabase
    .from("user_tool_permissions")
    .select(
      `
      tool_id,
      tools (
        name,
        description,
        input_schema,
        is_active
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch tool permissions:", error);
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: [] },
    };
  }

  const tools = (permissions || [])
    .filter((p) => {
      const tool = p.tools as unknown as {
        name: string;
        description: string | null;
        input_schema: Record<string, unknown>;
        is_active: boolean;
      } | null;
      return tool && tool.is_active;
    })
    .map((p) => {
      const tool = p.tools as unknown as {
        name: string;
        description: string | null;
        input_schema: Record<string, unknown>;
        is_active: boolean;
      };
      return {
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.input_schema,
      };
    });

  return {
    jsonrpc: "2.0",
    id,
    result: { tools },
  };
}
