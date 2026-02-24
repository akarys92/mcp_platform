import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return NextResponse.json({
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp:tools"],
  });
}
