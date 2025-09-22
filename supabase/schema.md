# Cross-Cloud Resource Manager — Database Schema (Supabase/Postgres)

This document describes the unified schema covering:
- cloud_accounts
- cloud_credentials
- resources
- costs_breakdown (+ v_costs_aggregates view, costs_aggregates RPC)
- recommendations, recommendation_actions
- automation_rules, automation_rule_runs
- operations
- activity_log

Compatibility: Supabase/Postgres 14+

## Design Goals
- Unify AWS, Azure, and GCP resources in a single `resources` table.
- Store sensitive credentials server-side only (`cloud_credentials`), separate from non-sensitive metadata (`cloud_accounts`).
- Provide simple cost breakdowns and an aggregate RPC used by the frontend.
- Support operations queuing, automation rules, and an activity/audit stream.
- Be RLS-ready for multi-tenant isolation by `auth.uid()`.

## Entities

### cloud_accounts
Non-sensitive per-user cloud account metadata.

Columns:
- id (uuid, pk)
- user_id (uuid, references auth.users)
- provider (enum: AWS | AZURE | GCP)
- name (text)
- account_id (text) — AWS Account ID / Azure Subscription ID / GCP Project ID
- status (text, default: "connected")
- metadata (jsonb) — safe hints (e.g., masked ids)
- created_at (timestamptz)

Indexes:
- user_id, provider, account_id

Usage:
- Display linked accounts in Settings/Profile.
- Joined by `account_id` for costs reporting convenience.

RLS (recommended):
- enable RLS, allow select/insert/update/delete for rows where user_id = auth.uid()

### cloud_credentials
Sensitive credentials; keep locked down.

Columns:
- id (uuid, pk)
- user_id (uuid)
- cloud_account_id (uuid, references cloud_accounts)
- provider (enum)
- secret (jsonb, required) — raw credential payload (AWS keys, Azure client secret, GCP SA JSON)
- created_at (timestamptz)

Indexes:
- user_id, cloud_account_id

Usage:
- Only server-side functions/Edge Functions should read/write this table.

RLS:
- enable RLS; restrict all client access. Use service role where necessary.

### resources
Unified resource inventory.

Columns:
- id (uuid, pk)
- user_id (uuid)
- cloud_account_id (uuid, nullable)
- provider (enum)
- provider_resource_id (text, unique per user+provider)
- name (text)
- type (text) — EC2, VM, ComputeEngine, RDS, Storage, etc.
- region (text), zone (text)
- state (text) — running/stopped/active/etc.
- tags (jsonb)
- cost_daily (numeric), cost_monthly (numeric)
- metadata (jsonb)
- discovered_at (timestamptz)
- updated_at (timestamptz; maintained by trigger)

Indexes:
- (user_id, provider, provider_resource_id) unique
- provider, type, region, state, tags GIN

Usage:
- Inventory UI reads from here.

RLS:
- enable, scope by user_id.

### costs_breakdown
Denormalized monthly spend per provider/service/account.

Columns:
- id (uuid, pk)
- user_id (uuid)
- provider (enum)
- account_id (text)
- account_name (text)
- service (text)
- month (date, default current month)
- amount (numeric)
- created_at (timestamptz)

Indexes:
- (user_id, month), provider, service

View:
- v_costs_aggregates summarizes monthly, daily (monthly/30), and delta vs previous month for a user.

RPC:
- costs_aggregates() returns JSON:
  { daily: number, monthly: number, delta_pct: number }

Front-end usage:
- Costs page calls `rpc('costs_aggregates')` and `from('costs_breakdown')`.

RLS:
- enable, scope by user_id.

### recommendations
AI/ML suggestions tracked for each user (optionally linked to a resource).

Columns:
- id (uuid, pk)
- user_id (uuid)
- resource_id (uuid, nullable)
- title (text), reason (text)
- priority (int) — higher is more important
- impact (numeric) — expected monthly savings
- provider (enum), metadata (jsonb)
- created_at (timestamptz)

Indexes:
- user_id, priority desc

### recommendation_actions
Queue of actions taken from recommendations.

Columns:
- id (uuid, pk)
- user_id (uuid)
- recommendation_id (uuid)
- action (text) — apply/ignore
- status (enum: queued | running | success | error | cancelled)
- result (jsonb)
- created_at, updated_at

Indexes:
- user_id, status

### automation_rules
User-defined rules for scheduled actions.

Columns:
- id (uuid, pk)
- user_id (uuid)
- name (text)
- match (text) — e.g., simple tag query: env=dev AND type=vm
- action (text) — start/stop/scale
- cron (text)
- status (enum: enabled | disabled)
- created_at, updated_at

Indexes:
- user_id, status

### automation_rule_runs
Execution history of automation rules.

Columns:
- id (uuid, pk)
- rule_id (uuid)
- user_id (uuid)
- started_at, finished_at
- status (enum)
- details (jsonb)

Indexes:
- rule_id, user_id

### operations
User or system initiated resource operation queue.

Columns:
- id (uuid, pk)
- user_id (uuid)
- resource_id (uuid)
- operation (text)
- params (jsonb)
- status (enum)
- result (jsonb)
- created_at, updated_at

Indexes:
- user_id, resource_id, status

Front-end usage:
- Inventory modal inserts into `operations`.

### activity_log
Append-only audit log for user/system actions.

Columns:
- id (uuid, pk)
- actor (uuid) — auth.users(id) when available
- type (text) — link_account, operation, rule_run, recommendation, etc.
- summary (text)
- status (text)
- created_at (timestamptz)

Indexes:
- actor, created_at desc

Front-end usage:
- Activity panel reads from `activity_log`.

## RLS Recommendations (high level)
Enable Row Level Security for user-owned tables and add policies like:
- SELECT: auth.uid() = user_id
- INSERT/UPDATE/DELETE: auth.uid() = user_id
Keep `cloud_credentials` locked (no client access); allow only service role or backend RPC to read/write.

Example (do not apply blindly):
```
alter table public.cloud_accounts enable row level security;
create policy "select own" on public.cloud_accounts for select using (auth.uid() = user_id);
create policy "insert own" on public.cloud_accounts for insert with check (auth.uid() = user_id);
```

For `cloud_credentials`, prefer:
```
alter table public.cloud_credentials enable row level security;
-- No client policies; service role only.
```

## Migration and Deployment
- Apply SQL: run supabase migration or execute `supabase/schema.sql` in your Supabase SQL editor.
- Deploy edge functions (already scaffolded): link-account, mock-aws, mock-azure, mock-gcp.
- Verify frontend env:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY

## Frontend expectations and mapping
The React dashboard expects:
- Tables: resources, cloud_accounts, costs_breakdown, recommendations, automation_rules, operations, activity_log
- RPC: costs_aggregates()
- Optional: recommendation_actions, automation_rule_runs (for extended flows)

All names and fields here align with the current UI components.
