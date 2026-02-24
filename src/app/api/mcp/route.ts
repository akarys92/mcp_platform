import { NextRequest, NextResponse } from "next/server";
import { validateMCPToken } from "@/lib/oauth/validate-token";
import { handleMCPMessage } from "@/lib/mcp/handler";
import { checkUserRateLimit } from "@/lib/mcp/rate-limit";
import { wwwAuthenticateHeader, rateLimitError } from "@/lib/mcp/errors";
import type { JsonRpcRequest, JsonRpcNotification } from "@/types/mcp";

/**
 * MCP Streamable HTTP endpoint.
 * Single endpoint handling all MCP protocol traffic from Claude.
 */
export async function POST(request: NextRequest) {
  // Special case: initialize doesn't require auth (Claude hasn't completed
  // the OAuth flow yet when it first connects). However, tools/list and
  // tools/call do require auth.
  const body = await request.json();
  const message = body as JsonRpcRequest | JsonRpcNotification;

  // Allow initialize without auth — Claude needs to discover the server
  // before completing OAuth. For all other methods, require Bearer token.
  const isInitialize =
    message.method === "initialize" ||
    message.method === "notifications/initialized";

  let userId: string | undefined;

  if (!isInitialize) {
    const auth = await validateMCPToken(
      request.headers.get("authorization")
    );

    if (!auth.valid) {
      return new NextResponse(null, {
        status: 401,
        headers: {
          "WWW-Authenticate": wwwAuthenticateHeader(
            process.env.NEXT_PUBLIC_APP_URL!
          ),
        },
      });
    }
    userId = auth.userId;

    // Rate limit authenticated requests
    if (userId && !checkUserRateLimit(userId)) {
      const rpcId = "id" in message ? (message as JsonRpcRequest).id : null;
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: rpcId,
          error: rateLimitError(),
        },
        { status: 429 }
      );
    }
  }

  // Route to handler
  const result = await handleMCPMessage(message, userId);

  // Extract session ID if set by initialize handler
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (result._sessionId) {
    headers["Mcp-Session-Id"] = result._sessionId;
    delete result._sessionId;
  }

  return NextResponse.json(result, { headers });
}

/**
 * GET: Server-initiated messages.
 * Not needed for MVP — Claude doesn't use this.
 */
export async function GET() {
  return new NextResponse(null, { status: 405 });
}

/**
 * DELETE: Session termination.
 * Accept gracefully.
 */
export async function DELETE() {
  return new NextResponse(null, { status: 200 });
}
