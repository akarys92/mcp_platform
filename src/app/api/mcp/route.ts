import { NextRequest, NextResponse } from "next/server";
import { validateMCPToken } from "@/lib/oauth/validate-token";
import { handleMCPMessage } from "@/lib/mcp/handler";
import { checkUserRateLimit } from "@/lib/mcp/rate-limit";
import { wwwAuthenticateHeader, rateLimitError } from "@/lib/mcp/errors";
import type { JsonRpcRequest, JsonRpcNotification } from "@/types/mcp";

/**
 * MCP Streamable HTTP endpoint.
 * All requests require a valid Bearer token. When the token is missing or
 * invalid the server returns 401 with a WWW-Authenticate header pointing
 * to the protected-resource metadata. This is what triggers Claude's OAuth
 * authorization flow (per MCP spec / RFC 9728).
 */
export async function POST(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  // ── Auth check (applies to ALL methods including initialize) ───────
  const auth = await validateMCPToken(
    request.headers.get("authorization")
  );

  if (!auth.valid) {
    console.log(
      `[MCP] 401 — no valid token (auth header present: ${request.headers.has("authorization")})`
    );
    return new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": wwwAuthenticateHeader(baseUrl),
      },
    });
  }

  const userId = auth.userId!;

  // ── Parse JSON-RPC body ────────────────────────────────────────────
  const body = await request.json();
  const message = body as JsonRpcRequest | JsonRpcNotification;

  const rpcId = "id" in message ? (message as JsonRpcRequest).id : null;
  console.log(`[MCP] method=${message.method} id=${rpcId} user=${userId}`);

  // ── Rate limit ─────────────────────────────────────────────────────
  if (!checkUserRateLimit(userId)) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: rpcId, error: rateLimitError() },
      { status: 429 }
    );
  }

  // ── Route to handler ──────────────────────────────────────────────
  const result = await handleMCPMessage(message, userId);

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
 * GET: Server-Sent Events stream (not used in MVP).
 * Return 401 so Claude discovers the OAuth flow.
 */
export async function GET(request: NextRequest) {
  const auth = await validateMCPToken(
    request.headers.get("authorization")
  );

  if (!auth.valid) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    return new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": wwwAuthenticateHeader(baseUrl),
      },
    });
  }

  return new NextResponse(null, { status: 405 });
}

/**
 * DELETE: Session termination. Accept gracefully.
 */
export async function DELETE() {
  return new NextResponse(null, { status: 200 });
}
