import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken, generateToken } from "@/lib/crypto";
import { createHash } from "crypto";

const TOKEN_EXPIRY_DAYS = 90;

/**
 * OAuth 2.1 Token Endpoint
 * Handles: authorization_code exchange and refresh_token grant
 * Request body: application/x-www-form-urlencoded (NOT JSON)
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  console.log(`[OAuth Token] content-type: ${contentType}`);

  let grantType: string | null = null;
  let formData: FormData;

  try {
    formData = await request.formData();
    grantType = formData.get("grant_type") as string;
  } catch {
    // Claude may send JSON instead of form data
    console.log("[OAuth Token] Failed to parse as form data, trying JSON");
    try {
      const cloned = request.clone();
      const jsonBody = await cloned.json();
      console.log("[OAuth Token] JSON body:", JSON.stringify(jsonBody));
      grantType = jsonBody.grant_type;
      // Convert JSON body to FormData for downstream handlers
      formData = new FormData();
      for (const [key, value] of Object.entries(jsonBody)) {
        if (typeof value === "string") formData.set(key, value);
      }
    } catch {
      console.log("[OAuth Token] Failed to parse body entirely");
      return NextResponse.json(
        { error: "invalid_request", error_description: "Could not parse request body" },
        { status: 400 }
      );
    }
  }

  console.log(`[OAuth Token] grant_type=${grantType}`);

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(formData);
  } else if (grantType === "refresh_token") {
    return handleRefreshToken(formData);
  }

  return NextResponse.json(
    { error: "unsupported_grant_type", error_description: `grant_type "${grantType}" is not supported` },
    { status: 400 }
  );
}

async function handleAuthorizationCode(formData: FormData) {
  const code = formData.get("code") as string;
  const codeVerifier = formData.get("code_verifier") as string;
  const clientId = formData.get("client_id") as string;
  const redirectUri = formData.get("redirect_uri") as string;

  if (!code || !codeVerifier) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing code or code_verifier" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Look up the authorization code
  const { data: authCode, error: lookupError } = await admin
    .from("oauth_authorization_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (lookupError || !authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid authorization code" },
      { status: 400 }
    );
  }

  // Check if code is expired
  if (new Date(authCode.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code expired" },
      { status: 400 }
    );
  }

  // Check if code was already used
  if (authCode.used) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code already used" },
      { status: 400 }
    );
  }

  // Validate client_id matches
  if (clientId && clientId !== authCode.client_id) {
    return NextResponse.json(
      { error: "invalid_client" },
      { status: 400 }
    );
  }

  // Validate redirect_uri matches
  if (redirectUri && redirectUri !== authCode.redirect_uri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // PKCE verification: base64url(SHA256(code_verifier)) must match code_challenge
  const expectedChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  if (expectedChallenge !== authCode.code_challenge) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Mark code as used
  await admin
    .from("oauth_authorization_codes")
    .update({ used: true })
    .eq("code", code);

  // Generate tokens
  const accessToken = generateToken(64);
  const refreshToken = generateToken(64);
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  // Store hashed tokens
  const { error: insertError } = await admin.from("oauth_tokens").insert({
    user_id: authCode.user_id,
    access_token_hash: hashToken(accessToken),
    refresh_token_hash: hashToken(refreshToken),
    expires_at: expiresAt.toISOString(),
    scopes: authCode.scopes,
  });

  if (insertError) {
    console.error("Failed to store tokens:", insertError);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    refresh_token: refreshToken,
    scope: (authCode.scopes as string[]).join(" "),
  });
}

async function handleRefreshToken(formData: FormData) {
  const refreshToken = formData.get("refresh_token") as string;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing refresh_token" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const refreshHash = hashToken(refreshToken);

  // Look up the refresh token
  const { data: tokenRecord, error: lookupError } = await admin
    .from("oauth_tokens")
    .select("*")
    .eq("refresh_token_hash", refreshHash)
    .is("revoked_at", null)
    .single();

  if (lookupError || !tokenRecord) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid refresh token" },
      { status: 400 }
    );
  }

  // Revoke the old token pair
  await admin
    .from("oauth_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenRecord.id);

  // Issue new tokens
  const newAccessToken = generateToken(64);
  const newRefreshToken = generateToken(64);
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const { error: insertError } = await admin.from("oauth_tokens").insert({
    user_id: tokenRecord.user_id,
    access_token_hash: hashToken(newAccessToken),
    refresh_token_hash: hashToken(newRefreshToken),
    expires_at: expiresAt.toISOString(),
    scopes: tokenRecord.scopes,
  });

  if (insertError) {
    console.error("Failed to store refreshed tokens:", insertError);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    refresh_token: newRefreshToken,
    scope: (tokenRecord.scopes as string[]).join(" "),
  });
}
