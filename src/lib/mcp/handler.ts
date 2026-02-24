import type {
  JsonRpcRequest,
  JsonRpcNotification,
  JsonRpcResponse,
} from "@/types/mcp";
import { JSON_RPC_ERRORS } from "@/types/mcp";
import { handleInitialize } from "./handlers/initialize";
import { handleToolsList } from "./handlers/tools-list";
import { handleToolCall } from "./handlers/tool-call";

type MCPResponse = JsonRpcResponse & { _sessionId?: string };

/**
 * Route incoming JSON-RPC messages to the appropriate handler.
 */
export async function handleMCPMessage(
  message: JsonRpcRequest | JsonRpcNotification,
  userId?: string
): Promise<MCPResponse> {
  const { method } = message;
  const id = "id" in message ? message.id : 0;

  switch (method) {
    case "initialize":
      return handleInitialize(message.params, id);

    case "notifications/initialized":
      // Acknowledgment notification — no response needed per spec,
      // but since this came via POST we return 202-style empty response.
      return { jsonrpc: "2.0", id };

    case "tools/list":
      if (!userId) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: JSON_RPC_ERRORS.INTERNAL_ERROR,
            message: "Authentication required",
          },
        };
      }
      return handleToolsList(userId, id, message.params);

    case "tools/call":
      if (!userId) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: JSON_RPC_ERRORS.INTERNAL_ERROR,
            message: "Authentication required",
          },
        };
      }
      return handleToolCall(
        message.params as { name: string; arguments?: Record<string, unknown> },
        userId,
        id
      );

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
          message: `Method not found: ${method}`,
        },
      };
  }
}
