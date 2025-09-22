-- Cross-Cloud Resource Manager — Unified Database Schema (Postgres/Supabase)
-- This schema defines core tables used by the React frontend and Supabase Edge Functions.
-- Compatibility: Supabase/Postgres 14+
-- Notes:
-- - Enable RLS and add policies in your Supabase project as appropriate.
-- - auth.users(id) reference is available in Supabase projects.
-- - Avoid storing sensitive credentials in public tables; use cloud_credentials (restricted) or a secrets manager.

-- Required extension in Supabase for UUID generation (already available in most projects)
-- enable if missing:
-- create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cloud_provider') then
    create type cloud_provider as enum ('AWS','AZURE','GCP');
  end if;
  if not exists (select 1 from pg_type where typname = 'operation_status') then
    create type operation_status as enum ('queued','running','success','error','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'rule_status') then
    create type rule_status as enum ('enabled','disabled');
  end if;
end $$;

-- ============================================================================
-- CLOUD ACCOUNTS (public metadata only)
-- ============================================================================
create table if not exists public.cloud_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  provider            cloud_provider not null,
  name                text not null,
  account_id          text not null,          -- AWS account id / Azure subscription id / GCP project id
  status              text not null default 'connected',
  metadata            jsonb,                  -- safe, non-sensitive metadata (e.g., masked identifiers)
  created_at          timestamptz not null default now()
);

create index if not exists idx_cloud_accounts_user on public.cloud_accounts(user_id);
create index if not exists idx_cloud_accounts_provider on public.cloud_accounts(provider);
create index if not exists idx_cloud_accounts_account on public.cloud_accounts(account_id);

comment on table public.cloud_accounts is
'Cloud account metadata per user (non-sensitive).';

-- ============================================================================
-- CLOUD CREDENTIALS (sensitive; restrict via RLS)
-- ============================================================================
create table if not exists public.cloud_credentials (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  cloud_account_id    uuid references public.cloud_accounts(id) on delete cascade,
  provider            cloud_provider not null,
  secret              jsonb not null,         -- provider-specific sensitive payload
  created_at          timestamptz not null default now()
);

create index if not exists idx_cloud_credentials_user on public.cloud_credentials(user_id);
create index if not exists idx_cloud_credentials_account on public.cloud_credentials(cloud_account_id);

comment on table public.cloud_credentials is
'Sensitive credentials stored server-side only. Lock down with RLS to backend-only access.';

-- ============================================================================
-- RESOURCES (unified inventory across providers)
-- ============================================================================
create table if not exists public.resources (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  cloud_account_id    uuid references public.cloud_accounts(id) on delete set null,
  provider            cloud_provider not null,
  provider_resource_id text not null,         -- e.g., i-abc123, vm-xyz, gce-123
  name                text,                   -- human-friendly name where available
  type                text,                   -- e.g., EC2, VM, ComputeEngine, RDS, Storage
  region              text,
  zone                text,
  state               text,                   -- running/stopped/active/etc.
  tags                jsonb default '{}'::jsonb,
  cost_daily          numeric(12,4),          -- estimated daily cost
  cost_monthly        numeric(12,4),
  metadata            jsonb,                  -- arbitrary provider-specific attributes
  discovered_at       timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists uq_resources_provider_resid_user
  on public.resources(user_id, provider, provider_resource_id);

create index if not exists idx_resources_provider on public.resources(provider);
create index if not exists idx_resources_type on public.resources(type);
create index if not exists idx_resources_region on public.resources(region);
create index if not exists idx_resources_state on public.resources(state);
create index if not exists idx_resources_tags_gin on public.resources using gin (tags);
create index if not exists idx_resources_updated_at on public.resources(updated_at desc);

comment on table public.resources is
'Unified resource inventory across AWS, Azure, and GCP.';

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trig_resources_updated_at on public.resources;
create trigger trig_resources_updated_at
before update on public.resources
for each row execute procedure public.set_updated_at();

-- ============================================================================
-- COSTS BREAKDOWN (denormalized monthly breakdown for UI)
-- ============================================================================
create table if not exists public.costs_breakdown (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  provider            cloud_provider not null,
  account_id          text,                   -- join key to cloud_accounts.account_id for display
  account_name        text,
  service             text not null,          -- EC2, RDS, VM, Storage, ComputeEngine, BigQuery...
  month               date not null default (date_trunc('month', now()))::date,
  amount              numeric(14,4) not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists idx_costs_breakdown_user_month on public.costs_breakdown(user_id, month);
create index if not exists idx_costs_breakdown_provider on public.costs_breakdown(provider);
create index if not exists idx_costs_breakdown_service on public.costs_breakdown(service);

comment on table public.costs_breakdown is
'Monthly spend breakdown per provider/service/account for reporting.';

-- Optional helper view for aggregates the frontend may call via RPC
create or replace view public.v_costs_aggregates as
select
  cb.user_id,
  coalesce(sum(case when cb.month = date_trunc('month', now())::date then cb.amount end), 0) as monthly,
  -- naive daily estimation: monthly / 30
  coalesce(sum(case when cb.month = date_trunc('month', now())::date then cb.amount end), 0) / 30.0 as daily,
  -- delta vs previous month
  case
    when coalesce(sum(case when cb.month = date_trunc('month', now())::date then cb.amount end), 0) = 0
      then 0
    else round(
      (
        (coalesce(sum(case when cb.month = date_trunc('month', now())::date then cb.amount end), 0) -
         coalesce(sum(case when cb.month = (date_trunc('month', now()) - interval '1 month')::date then cb.amount end), 0)
        )
        /
        nullif(coalesce(sum(case when cb.month = (date_trunc('month', now()) - interval '1 month')::date then cb.amount end), 0), 0)
      ) * 100.0, 1)
  end as delta_pct
from public.costs_breakdown cb
group by cb.user_id;

comment on view public.v_costs_aggregates is
'Helper aggregates for monthly/daily spend and delta vs previous month.';

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================
create table if not exists public.recommendations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  resource_id         uuid references public.resources(id) on delete set null,
  title               text not null,
  reason              text,
  priority            int default 0,          -- higher is more important
  impact              numeric(12,4),         -- expected monthly savings
  provider            cloud_provider,
  metadata            jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_recommendations_user on public.recommendations(user_id);
create index if not exists idx_recommendations_priority on public.recommendations(priority desc);

comment on table public.recommendations is
'AI/ML optimization suggestions with potential impact.';

-- Actions taken on recommendations (apply/ignore)
create table if not exists public.recommendation_actions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  recommendation_id   uuid references public.recommendations(id) on delete cascade,
  action              text not null,         -- apply / ignore
  status              operation_status not null default 'queued',
  result              jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_recommendation_actions_user on public.recommendation_actions(user_id);
create index if not exists idx_recommendation_actions_status on public.recommendation_actions(status);

drop trigger if exists trig_rec_actions_updated_at on public.recommendation_actions;
create trigger trig_rec_actions_updated_at
before update on public.recommendation_actions
for each row execute procedure public.set_updated_at();

comment on table public.recommendation_actions is
'Queue of actions triggered from recommendations.';

-- ============================================================================
-- AUTOMATION RULES
-- ============================================================================
create table if not exists public.automation_rules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  name                text not null,
  match               text,                   -- simple tag query or filter expression
  action              text not null,          -- start|stop|scale
  cron                text not null,          -- cron string for scheduling
  status              rule_status not null default 'enabled',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_automation_rules_user on public.automation_rules(user_id);
create index if not exists idx_automation_rules_status on public.automation_rules(status);

drop trigger if exists trig_automation_rules_updated_at on public.automation_rules;
create trigger trig_automation_rules_updated_at
before update on public.automation_rules
for each row execute procedure public.set_updated_at();

comment on table public.automation_rules is
'User-defined rules to automate resource operations on a schedule.';

-- Rule runs history (optional but useful)
create table if not exists public.automation_rule_runs (
  id                  uuid primary key default gen_random_uuid(),
  rule_id             uuid references public.automation_rules(id) on delete cascade,
  user_id             uuid references auth.users(id) on delete cascade,
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  status              operation_status not null default 'queued',
  details             jsonb
);

create index if not exists idx_automation_rule_runs_rule on public.automation_rule_runs(rule_id);
create index if not exists idx_automation_rule_runs_user on public.automation_rule_runs(user_id);

comment on table public.automation_rule_runs is
'Execution history for automation rules.';

-- ============================================================================
-- OPERATIONS (user-initiated resource operations)
-- ============================================================================
create table if not exists public.operations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  resource_id         uuid references public.resources(id) on delete set null,
  operation           text not null,          -- start|stop|scale|tag|...
  params              jsonb,                  -- e.g., { size: "large" }
  status              operation_status not null default 'queued',
  result              jsonb,                  -- backend result or error details
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_operations_user on public.operations(user_id);
create index if not exists idx_operations_resource on public.operations(resource_id);
create index if not exists idx_operations_status on public.operations(status);

drop trigger if exists trig_operations_updated_at on public.operations;
create trigger trig_operations_updated_at
before update on public.operations
for each row execute procedure public.set_updated_at();

comment on table public.operations is
'Queue of resource lifecycle operations initiated by users or backend.';

-- ============================================================================
-- ACTIVITY LOG (audit trail)
-- ============================================================================
create table if not exists public.activity_log (
  id                  uuid primary key default gen_random_uuid(),
  actor               uuid,                   -- references auth.users(id) when available
  type                text,                   -- link_account, operation, rule_run, recommendation, etc.
  summary             text,
  status              text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_activity_log_actor on public.activity_log(actor);
create index if not exists idx_activity_log_created on public.activity_log(created_at desc);

comment on table public.activity_log is
'Append-only audit log of user/system activities.';

-- ============================================================================
-- SAMPLE RPC for Costs Aggregates (to match frontend .rpc("costs_aggregates"))
-- Returns a JSON object with daily, monthly, and delta_pct fields.
-- ============================================================================
create or replace function public.costs_aggregates()
returns json
language plpgsql
stable
as $$
declare
  uid uuid;
  monthly_total numeric;
  daily_est numeric;
  delta numeric;
begin
  -- In Supabase RLS context, use auth.uid()
  begin
    uid := auth.uid();
  exception when others then
    uid := null;
  end;

  select coalesce(sum(amount),0)
    into monthly_total
  from public.costs_breakdown
  where (uid is null or user_id = uid)
    and month = date_trunc('month', now())::date;

  daily_est := monthly_total / 30.0;

  with cur as (
    select coalesce(sum(amount),0) v
    from public.costs_breakdown
    where (uid is null or user_id = uid)
      and month = date_trunc('month', now())::date
  ), prev as (
    select coalesce(sum(amount),0) v
    from public.costs_breakdown
    where (uid is null or user_id = uid)
      and month = (date_trunc('month', now()) - interval '1 month')::date
  )
  select case when p.v = 0 then 0 else round(((c.v - p.v) / p.v) * 100.0, 1) end
  into delta
  from cur c, prev p;

  return json_build_object(
    'daily', coalesce(daily_est,0),
    'monthly', coalesce(monthly_total,0),
    'delta_pct', coalesce(delta,0)
  );
end;
$$;

comment on function public.costs_aggregates() is
'Aggregated spend for the current user: { daily, monthly, delta_pct }.';

-- ============================================================================
-- RLS PLACEHOLDERS (do not enable blindly; adjust as per your project policies)
-- ============================================================================
-- alter table public.cloud_accounts enable row level security;
-- create policy "Users can view own cloud accounts"
--   on public.cloud_accounts for select
--   using (auth.uid() = user_id);
-- create policy "Users can insert own cloud accounts"
--   on public.cloud_accounts for insert
--   with check (auth.uid() = user_id);

-- alter table public.cloud_credentials enable row level security;
-- -- Recommend: no select from client. Allow only service role.
-- create policy "Service role only" on public.cloud_credentials for all
--   using (false) with check (false);

-- Repeat appropriate RLS for other tables to scope by user_id where applicable.

-- End of schema
