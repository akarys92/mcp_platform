import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth/clients";

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591).
 *
 * Claude Desktop calls this endpoint to register itself before starting
 * the authorization flow. It sends a JSON body with its desired client
 * metadata and receives back a client_id.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "Could not parse request body as JSON" },
      { status: 400 }
    );
  }

  console.log("[OAuth DCR] Registration request:", JSON.stringify(body));

  const client = registerClient({
    client_name: body.client_name as string | undefined,
    redirect_uris: body.redirect_uris as string[] | undefined,
    grant_types: body.grant_types as string[] | undefined,
    response_types: body.response_types as string[] | undefined,
    token_endpoint_auth_method: body.token_endpoint_auth_method as string | undefined,
  });

  // RFC 7591 Section 3.2 — Client Information Response
  return NextResponse.json(
    {
      client_id: client.client_id,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      token_endpoint_auth_method: client.token_endpoint_auth_method,
    },
    { status: 201 }
  );
}
