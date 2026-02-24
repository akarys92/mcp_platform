# Einstellen Connect — Testing Guide

This document walks through how to set up, test, and verify every component of Einstellen Connect end-to-end: the database, OAuth server, MCP server, QuickBooks integration, and admin UI.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Database Setup](#3-database-setup)
4. [Smoke Test: Dev Server](#4-smoke-test-dev-server)
5. [Test the Admin UI](#5-test-the-admin-ui)
6. [Test MCP OAuth Flow](#6-test-mcp-oauth-flow)
7. [Test the MCP Server](#7-test-the-mcp-server)
8. [Test QuickBooks Connection](#8-test-quickbooks-connection)
9. [Test End-to-End with Claude](#9-test-end-to-end-with-claude)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

- **Node.js 20+** (`nvm use 20` if using nvm)
- **A Supabase project** (free tier works) — [supabase.com](https://supabase.com)
- **An Intuit Developer account** — [developer.intuit.com](https://developer.intuit.com)
- **curl** (or any HTTP client like Postman/Insomnia)
- **A browser** for the admin UI and OAuth consent flow

---

## 2. Environment Setup

### 2.1 Configure `.env`

Copy your Supabase project credentials and QBO app credentials into `.env`. The key variables to configure:

```bash
# Already set if you created the Supabase project via Vercel integration.
# Otherwise fill in from your Supabase dashboard → Settings → API.
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# QuickBooks — from developer.intuit.com → your app → Keys & credentials
QBO_CLIENT_ID=your-qbo-client-id
QBO_CLIENT_SECRET=your-qbo-client-secret
QBO_REDIRECT_URI=http://localhost:3000/api/qbo/callback
QBO_ENVIRONMENT=sandbox

# Generate a real encryption key:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64-hex-char-key>

# MCP OAuth
MCP_ISSUER_URL=http://localhost:3000
MCP_CLIENT_ID=einstellen-claude-connector

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Install Dependencies

```bash
npm install
```

---

## 3. Database Setup

### 3.1 Run Migrations

In the Supabase dashboard, go to **SQL Editor** and run the two migration files in order:

1. `supabase/migrations/001_initial_schema.sql` — Creates all 7 tables, indexes, and triggers
2. `supabase/migrations/002_rls_policies.sql` — Enables RLS and creates policies

Alternatively, if you have the Supabase CLI:

```bash
supabase db push
```

### 3.2 Verify Tables Exist

In the Supabase dashboard → **Table Editor**, confirm these tables exist:

- `users`
- `connectors`
- `tools`
- `user_tool_permissions`
- `oauth_tokens`
- `oauth_authorization_codes`
- `audit_logs`

### 3.3 Create Your First Admin User

In Supabase dashboard → **Authentication** → **Users** → **Add user**:

- Email: `admin@einstellen.io` (or your email)
- Password: choose a strong password
- Check "Auto confirm user"

Then in the **SQL Editor**, insert the matching `public.users` row:

```sql
INSERT INTO public.users (id, email, name, role)
SELECT id, email, 'Admin', 'admin'
FROM auth.users
WHERE email = 'admin@einstellen.io';
```

### 3.4 Verify RLS

Quick sanity check — this should return your admin user:

```sql
SELECT * FROM public.users;
```

---

## 4. Smoke Test: Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Next.js default page.

### 4.1 Check Well-Known Endpoints

```bash
# OAuth server metadata
curl -s http://localhost:3000/.well-known/oauth-authorization-server | jq .

# Expected: JSON with issuer, authorization_endpoint, token_endpoint, etc.
```

```bash
# Protected resource metadata
curl -s http://localhost:3000/.well-known/oauth-protected-resource | jq .

# Expected: JSON with resource URL and authorization_servers array
```

Both should return valid JSON with URLs pointing to `http://localhost:3000`.

---

## 5. Test the Admin UI

### 5.1 Login

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter the admin credentials you created in step 3.3
3. You should be redirected to [http://localhost:3000/admin](http://localhost:3000/admin)

### 5.2 Dashboard

The dashboard should show:
- **0** connectors (none connected yet)
- **1** user (the admin you just created)
- **0** tool calls
- Empty recent activity feed

### 5.3 Users Page

1. Go to [http://localhost:3000/admin/users](http://localhost:3000/admin/users)
2. You should see your admin user in the table
3. Click **Add User** and create a test user:
   - Email: `user@einstellen.io`
   - Name: `Test User`
   - Password: `testpass123`
   - Role: User
4. The new user should appear in the table

### 5.4 User Detail

1. Click **View** on the test user
2. You should see their profile, empty permissions, no MCP tokens, no activity
3. Test the **Promote to Admin** / **Demote to User** toggle
4. Test **Revoke Tokens** (should succeed silently — no tokens to revoke)

### 5.5 Connectors Page

1. Go to [http://localhost:3000/admin/connectors](http://localhost:3000/admin/connectors)
2. You should see the QuickBooks card with a "Connect QuickBooks" button
3. Don't click it yet — we'll test the QBO flow in step 8

### 5.6 Permissions Page

1. Go to [http://localhost:3000/admin/permissions](http://localhost:3000/admin/permissions)
2. Should show "No active tools. Connect a service first."
3. This is correct — tools get seeded when QuickBooks is connected

### 5.7 Audit Logs

1. Go to [http://localhost:3000/admin/audit-logs](http://localhost:3000/admin/audit-logs)
2. You should see entries for the user creation action from step 5.3
3. Test the user and action type filter dropdowns

---

## 6. Test MCP OAuth Flow

This is the flow Claude uses to get an access token. We simulate it manually with curl.

### 6.1 Generate PKCE Values

```bash
# Generate code_verifier (43-128 characters, URL-safe)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=/+' | head -c 43)
echo "code_verifier: $CODE_VERIFIER"

# Generate code_challenge = base64url(SHA256(code_verifier))
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
echo "code_challenge: $CODE_CHALLENGE"
```

Save both values — you'll need them in the next steps.

### 6.2 Authorization Request

Open this URL in your browser (replace the `code_challenge` value):

```
http://localhost:3000/oauth/authorize?response_type=code&client_id=einstellen-claude-connector&redirect_uri=http://localhost:3000/api/oauth/callback&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256&state=test123
```

**Expected behavior:**
1. If not logged in: Redirects to `/login` with a `returnTo` parameter
2. After login: Shows the consent screen with "Authorize" and "Deny" buttons

### 6.3 Grant Consent

Click **Authorize**. The browser will redirect to:

```
http://localhost:3000/api/oauth/callback?code=AUTHORIZATION_CODE&state=test123
```

This URL will 404 (there's no handler at `/api/oauth/callback` — that would be Claude's redirect URI). **Copy the `code` parameter from the URL bar.**

> **Tip:** If you want to avoid the 404, use a redirect_uri of `https://httpbin.org/get` instead — it will display the query parameters.

### 6.4 Exchange Code for Token

```bash
AUTH_CODE=<paste-the-code-from-step-6.3>

curl -s -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "code_verifier=$CODE_VERIFIER" \
  -d "client_id=einstellen-claude-connector" \
  -d "redirect_uri=http://localhost:3000/api/oauth/callback" | jq .
```

**Expected response:**
```json
{
  "access_token": "abc123...",
  "refresh_token": "def456...",
  "token_type": "Bearer",
  "expires_in": 7776000,
  "scope": "mcp:tools"
}
```

Save the `access_token` and `refresh_token`.

### 6.5 Test Token Refresh

```bash
curl -s -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=einstellen-claude-connector" | jq .
```

You should get a new `access_token` and `refresh_token`. The old ones are now revoked.

### 6.6 Verify Token in Database

In Supabase SQL Editor:

```sql
SELECT id, user_id, expires_at, revoked_at, created_at
FROM public.oauth_tokens
ORDER BY created_at DESC
LIMIT 5;
```

You should see token entries — the original pair should have `revoked_at` set (from the refresh), and the new pair should have `revoked_at` as NULL.

---

## 7. Test the MCP Server

Use the access token from step 6.4 (or 6.5 if you refreshed).

### 7.1 Initialize

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "test-client", "version": "1.0" }
    }
  }' | jq .
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": { "tools": {} },
    "serverInfo": {
      "name": "einstellen-connect",
      "version": "1.0.0"
    }
  }
}
```

Should also include an `Mcp-Session-Id` response header.

### 7.2 List Tools (No Auth — should fail)

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/list",
    "params": {}
  }'
```

**Expected:** HTTP 401 with `WWW-Authenticate` header.

### 7.3 List Tools (With Auth)

```bash
ACCESS_TOKEN=<your-access-token>

curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/list",
    "params": {}
  }' | jq .
```

**Expected:** A `result.tools` array. If QBO is connected and the user has permissions, you'll see tools. If not, the array will be empty.

### 7.4 Call a Tool (No Permission — should fail)

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "tools/call",
    "params": {
      "name": "get_invoices",
      "arguments": {}
    }
  }' | jq .
```

**Expected:** Either `error.message: "Tool not found"` (if QBO not connected) or `error.message: "Permission denied"` (if no permission granted).

### 7.5 Session Termination

```bash
curl -s -X DELETE http://localhost:3000/api/mcp
# Expected: 200 OK
```

---

## 8. Test QuickBooks Connection

### 8.1 Set Up Intuit Developer App

1. Go to [developer.intuit.com](https://developer.intuit.com) → Dashboard → Create an app
2. Select **QuickBooks Online and Payments**
3. Under **Development Settings** → **Keys & OAuth**:
   - Copy the **Client ID** and **Client Secret** → put in `.env`
   - Add redirect URI: `http://localhost:3000/api/qbo/callback`
4. Under **Sandbox** → note the sandbox company available for testing

### 8.2 Connect QuickBooks

1. Log in to the admin UI at [http://localhost:3000/admin](http://localhost:3000/admin)
2. Go to **Connectors**
3. Click **Connect QuickBooks**
4. You'll be redirected to Intuit's OAuth consent page
5. Select your sandbox company and authorize
6. You'll be redirected back to `/admin/connectors`

**After successful connection:**
- The QuickBooks card should show status: **connected**
- Realm ID, environment, and connection date should display
- 12 tools should appear (8 read, 4 write) with toggle switches

### 8.3 Verify in Database

```sql
-- Check connector
SELECT id, type, status, config, connected_at
FROM public.connectors;

-- Check tools were seeded
SELECT name, display_name, category, is_active
FROM public.tools
ORDER BY category, name;
```

You should see 12 tools (8 read + 4 write).

### 8.4 Grant Permissions

1. Go to **Permissions** page
2. You should now see the tool access matrix
3. Grant yourself (admin) and the test user access to some tools:
   - Grant all **read** tools to both users
   - Grant **write** tools only to the admin
4. Use the "+Read" bulk button for convenience

### 8.5 Test Tool Execution via MCP

Now that QBO is connected and permissions are granted, try calling a tool:

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "4",
    "method": "tools/call",
    "params": {
      "name": "get_customers",
      "arguments": {}
    }
  }' | jq .
```

**Expected:** A `result.content` array with a text element containing formatted customer data from the QBO sandbox.

### 8.6 Test More Tools

```bash
# Get invoices
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "5",
    "method": "tools/call",
    "params": {
      "name": "get_invoices",
      "arguments": { "status": "unpaid" }
    }
  }' | jq .

# Get profit and loss report
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "6",
    "method": "tools/call",
    "params": {
      "name": "get_profit_loss",
      "arguments": {
        "start_date": "2024-01-01",
        "end_date": "2024-12-31"
      }
    }
  }' | jq .

# Create a customer (write tool — requires write permission)
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "7",
    "method": "tools/call",
    "params": {
      "name": "create_customer",
      "arguments": {
        "display_name": "Test Customer from MCP",
        "email": "test@example.com",
        "phone": "555-0100"
      }
    }
  }' | jq .
```

### 8.7 Verify Audit Logs

After running tool calls, go to **Audit Logs** in the admin UI. You should see entries for each tool_call with:
- The user who made the call
- Tool name
- Duration in milliseconds
- Success/error status

---

## 9. Test End-to-End with Claude

This is the real integration test — connecting Claude Desktop (or claude.ai) to your MCP server.

### 9.1 Expose Your Local Server

Claude needs to reach your server over the internet. Options:

**Option A: Deploy to Vercel**
```bash
npx vercel
```
Update `.env` with your Vercel URL for `NEXT_PUBLIC_APP_URL`, `MCP_ISSUER_URL`, and `QBO_REDIRECT_URI`.

**Option B: Use a tunnel (for local testing)**
```bash
npx cloudflared tunnel --url http://localhost:3000
# or
ngrok http 3000
```
Note the public URL — you'll need it as the MCP server URL.

### 9.2 Configure Claude's MCP Connector

In Claude Desktop → Settings → MCP Servers, or in Claude.ai MCP settings:

1. Add a new MCP server
2. URL: `https://your-domain.com/api/mcp` (your public URL)
3. Client ID: `einstellen-claude-connector` (must match `MCP_CLIENT_ID`)

### 9.3 Test the OAuth Handshake

When Claude first tries to use a tool:
1. Claude discovers your server via the well-known endpoints
2. Claude redirects you to `/oauth/authorize` to sign in and consent
3. After consent, Claude receives an access token
4. Claude can now call tools

### 9.4 Try Prompts

Once connected, try these prompts with Claude:

- "What invoices are currently unpaid?"
- "Show me the profit and loss report for last quarter."
- "List all customers."
- "Create a new customer named 'Acme Corp' with email info@acme.com."
- "What's the balance sheet look like as of today?"
- "Show me bills that are unpaid."
- "Get me the details of invoice #1001."

Claude should use the MCP tools and return formatted results.

---

## 10. Troubleshooting

### OAuth Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 on tools/list | Token expired or invalid | Re-do the OAuth flow from step 6 |
| "Invalid client_id" on /oauth/authorize | Client ID mismatch | Ensure `MCP_CLIENT_ID` matches what Claude sends |
| "Invalid code_challenge_method" | Not using S256 | Only `S256` is supported |
| Token exchange returns error | Code expired (10 min TTL) | Re-authorize and exchange faster |
| Refresh token fails | Old token already revoked | QBO rotates refresh tokens; each can only be used once |

### QuickBooks Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Connector error" on tool call | QBO token expired | Go to Connectors → Reconnect QuickBooks |
| Connector status = "error" | Refresh token rotation failed | Reconnect QuickBooks |
| "No data returned" | Sandbox has no data | Create sample invoices/customers in the QBO sandbox |
| 429 from QBO API | Hit Intuit's rate limits | Wait a few minutes; the app rate-limits proactively |

### Admin UI Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirected to /login from /admin | Session expired or not admin | Log in again; verify user has role = 'admin' in DB |
| "User creation failed" | Email already exists in auth.users | Use a different email |
| Permission matrix empty | No tools seeded | Connect QuickBooks first |

### Database Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| RLS policy violations | Missing is_admin() function | Re-run `002_rls_policies.sql` |
| Foreign key errors on users | auth.users entry missing | Create user via Supabase Auth first |
| "relation does not exist" | Migrations not run | Run both SQL migration files |

### MCP Protocol Errors

| Error Code | Meaning |
|-----------|---------|
| -32700 | Parse error — malformed JSON |
| -32600 | Invalid request — bad auth or params |
| -32601 | Method not found — unknown tool |
| -32602 | Invalid params — schema validation failed |
| -32603 | Internal error — QBO API failure |
| -32000 | Rate limit exceeded |

### Useful SQL Queries for Debugging

```sql
-- Check all OAuth tokens for a user
SELECT id, user_id, expires_at, revoked_at, created_at
FROM oauth_tokens
WHERE user_id = '<user-id>'
ORDER BY created_at DESC;

-- Check a user's permissions
SELECT t.name, t.category, utp.granted_at
FROM user_tool_permissions utp
JOIN tools t ON t.id = utp.tool_id
WHERE utp.user_id = '<user-id>';

-- Recent audit log errors
SELECT action_type, tool_name, error, created_at
FROM audit_logs
WHERE error IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Check connector health
SELECT type, status, config->>'realm_id' as realm_id, connected_at
FROM connectors;
```
