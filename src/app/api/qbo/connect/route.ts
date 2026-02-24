import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

/**
 * Initiate QuickBooks OAuth connection.
 * Only admins can connect QuickBooks.
 */
export async function GET(request: NextRequest) {
  // Verify admin session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const admin = createAdminClient();
  const { data: userData } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can connect QuickBooks" },
      { status: 403 }
    );
  }

  // Generate CSRF state parameter
  const state = randomBytes(16).toString("hex");

  // Build Intuit authorization URL
  const authUrl = new URL("https://appcenter.intuit.com/connect/oauth2");
  authUrl.searchParams.set("client_id", process.env.QBO_CLIENT_ID!);
  authUrl.searchParams.set("scope", "com.intuit.quickbooks.accounting");
  authUrl.searchParams.set("redirect_uri", process.env.QBO_REDIRECT_URI!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  // Store state in a cookie for verification on callback
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("qbo_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
