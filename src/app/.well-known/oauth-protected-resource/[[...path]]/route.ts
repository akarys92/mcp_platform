import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth Protected Resource Metadata (RFC 9728).
 *
 * Handles both:
 *   GET /.well-known/oauth-protected-resource          (base discovery)
 *   GET /.well-known/oauth-protected-resource/api/mcp  (resource-specific)
 *
 * Claude tries the resource-specific path first per the MCP spec,
 * then falls back to the base path. We return the same response for both.
 *
 * URLs are derived from the incoming request's Host header so they work
 * correctly behind tunnels (ngrok, cloudflared) without reconfiguring env vars.
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  return NextResponse.json({
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp:tools"],
  });
}

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
