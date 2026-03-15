import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - .well-known (OAuth discovery — must be public)
     * - api/mcp (MCP server uses its own Bearer auth)
     * - api/oauth (OAuth endpoints use their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|\\.well-known|api/mcp|api/oauth|api/workers).*)",
  ],
};
