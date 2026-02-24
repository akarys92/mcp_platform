-- Einstellen Connect — Row Level Security Policies

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.connectors enable row level security;
alter table public.tools enable row level security;
alter table public.user_tool_permissions enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.oauth_authorization_codes enable row level security;

-- Helper: check if the current authenticated user is an admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Users
create policy "Admins can manage all users"
  on public.users for all
  using (public.is_admin());

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Connectors
create policy "Admins can manage connectors"
  on public.connectors for all
  using (public.is_admin());

create policy "Users can view connectors"
  on public.connectors for select
  using (true);

-- Tools
create policy "Admins can manage tools"
  on public.tools for all
  using (public.is_admin());

create policy "Users can view active tools"
  on public.tools for select
  using (is_active = true);

-- User Tool Permissions
create policy "Admins can manage permissions"
  on public.user_tool_permissions for all
  using (public.is_admin());

create policy "Users can view own permissions"
  on public.user_tool_permissions for select
  using (auth.uid() = user_id);

-- OAuth Tokens: service role only (no user-facing RLS policies)
-- All access goes through the admin client which bypasses RLS.

-- Audit Logs
create policy "Admins can view all audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Users can view own audit logs"
  on public.audit_logs for select
  using (auth.uid() = user_id);

-- OAuth Authorization Codes: service role only
-- These are created and consumed entirely server-side.
