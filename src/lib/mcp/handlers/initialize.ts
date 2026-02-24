import { v4 as uuidv4 } from "uuid";
import type { JsonRpcResponse } from "@/types/mcp";

/**
 * Handle MCP initialize request.
 * Returns server capabilities and protocol version.
 */
export function handleInitialize(
  params: Record<string, unknown> | undefined,
  id: string | number
): JsonRpcResponse & { _sessionId?: string } {
  const sessionId = uuidv4();

  return {
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: "2025-03-26",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "einstellen-connect",
        version: "1.0.0",
      },
    },
    _sessionId: sessionId,
  };
}
