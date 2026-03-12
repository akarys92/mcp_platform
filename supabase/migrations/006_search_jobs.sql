-- Async search jobs for Stardex vector search

create table public.search_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  connector_id uuid not null references public.connectors(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  query_params jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index idx_search_jobs_user_status on public.search_jobs(user_id, status);
create index idx_search_jobs_created on public.search_jobs(created_at desc);

alter table public.search_jobs enable row level security;
