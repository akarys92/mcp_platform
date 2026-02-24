-- Einstellen Connect — Initial Schema
-- Creates all core tables for the platform.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 1. Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Connectors (external platform connections)
create table public.connectors (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'quickbooks' check (type in ('quickbooks', 'stardex', 'justworks', 'docusign', 'gdrive')),
  display_name text not null default 'QuickBooks Online',
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  oauth_credentials text, -- AES-256-GCM encrypted JSON string
  config jsonb not null default '{}'::jsonb, -- { realm_id, company_name, environment, ... }
  connected_by uuid references public.users(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tools (individual capabilities per connector)
create table public.tools (
  id uuid primary key default uuid_generate_v4(),
  connector_id uuid not null references public.connectors(id) on delete cascade,
  name text not null,
  display_name text,
  description text,
  category text not null check (category in ('read', 'write', 'admin')),
  is_active boolean not null default true,
  input_schema jsonb not null default '{}'::jsonb, -- MCP JSON Schema
  created_at timestamptz not null default now()
);

create unique index idx_tools_connector_name on public.tools(connector_id, name);

-- 4. User Tool Permissions (per-user, per-tool access control)
create table public.user_tool_permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  granted_by uuid references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique(user_id, tool_id)
);

-- 5. OAuth Tokens (MCP tokens issued to users for Claude's connector)
create table public.oauth_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  access_token_hash text not null, -- SHA-256 hex hash
  refresh_token_hash text, -- SHA-256 hex hash
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  revoked_at timestamptz, -- null unless admin revokes
  created_at timestamptz not null default now()
);

create index idx_oauth_tokens_access_hash on public.oauth_tokens(access_token_hash);
create index idx_oauth_tokens_refresh_hash on public.oauth_tokens(refresh_token_hash);

-- 6. Audit Logs
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  tool_name text,
  connector_id uuid references public.connectors(id) on delete set null,
  action_type text not null, -- 'tool_call', 'login', 'permission_change', 'connector_connected', etc.
  action_detail text, -- human-readable summary
  request_summary jsonb,
  response_summary jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_audit_logs_action_type on public.audit_logs(action_type);

-- 7. OAuth Authorization Codes (temporary, for MCP OAuth flow)
create table public.oauth_authorization_codes (
  code text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  client_id text not null,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger connectors_updated_at
  before update on public.connectors
  for each row execute function public.update_updated_at();
