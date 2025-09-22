# Supabase Integration Guide — Account Linking Edge Function

This project uses Supabase for Auth, Postgres, and Edge Functions. A dedicated Edge Function `link-account` securely handles cloud account linking for AWS, Azure, and GCP.

## Environment Variables (frontend)
Set via orchestrator (do not commit `.env`):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

## Edge Function: link-account
Path: supabase/functions/link-account/index.ts

Purpose:
- Accept credential payloads from the frontend.
- Validate and store minimal metadata in `cloud_accounts`.
- Store sensitive credentials into `cloud_credentials`.
- Emit audit entries to `activity_log`.

Auth:
- Requires Authorization: Bearer <Supabase JWT> (handled by supabase-js on the frontend).
- The function extracts the user id (`sub`) from JWT claims.

Provider payloads:
- AWS: { access_key_id, secret_access_key, account_id }
- Azure: { tenant_id, client_id, client_secret, subscription_id }
- GCP: { service_account_json } // full JSON string

Response:
- 200: { message, account: { id, provider, name, account_id, status, metadata } }
- 4xx/5xx: { error }

## Required Tables (create in Supabase)
Example SQL (adjust as needed and add RLS policies):

```sql
-- cloud_accounts: minimal metadata only
create table if not exists public.cloud_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('AWS','AZURE','GCP')),
  name text not null,
  account_id text not null,
  status text not null default 'connected',
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- cloud_credentials: sensitive payload
create table if not exists public.cloud_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cloud_account_id uuid references public.cloud_accounts(id) on delete cascade,
  provider text not null check (provider in ('AWS','AZURE','GCP')),
  secret jsonb not null,
  created_at timestamptz not null default now()
);

-- activity_log: audit
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  type text,
  summary text,
  status text,
  created_at timestamptz not null default now()
);
```

RLS:
- Enable RLS and add policies to allow users to see only their own `cloud_accounts` rows.
- Keep `cloud_credentials` fully restricted; only backend processes should access it.

## Deployment
Use the Supabase CLI:
- supabase functions deploy link-account
- supabase functions deploy mock-aws
- supabase functions deploy mock-azure
- supabase functions deploy mock-gcp
- supabase functions deploy recommendations
- supabase functions deploy automation-enforcer
- supabase functions deploy queue-processor

Make sure the function has access to:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (recommended) or ANON key for PostgREST writes

Supabase config automatically injects these into the Edge environment when deployed.

### Scheduler (Cron) Setup
Use Supabase Scheduled Triggers to automate back-end jobs (project Dashboard → Edge Functions → Schedules):
- recommendations: POST /run every 6 hours to generate new recommendations and anomalies.
- automation-enforcer: POST /run on a schedule that matches how often you want rules evaluated (e.g., every 10 minutes).
- queue-processor: POST /run every 2–5 minutes to process queued operations and recommendation_actions.

All scheduled calls must include a service bearer key in headers or be configured via Supabase’s secure scheduler which injects credentials automatically.

## Frontend Usage
lib/linkAccountApi.js exports:

- linkCloudAccount({ provider, name, credentials })

Profile.jsx uses this to send credentials securely. No sensitive data is inserted directly from the client into tables.

Recommendations.jsx and Automation.jsx are already wired to:
- Read from `recommendations` and enqueue into `recommendation_actions`.
- Create/toggle rules in `automation_rules`.

With the new Edge Functions and cron:
- `recommendations` will be periodically populated.
- `automation_rules` will be enforced and resulting `operations` queued.
- `queue-processor` will update `operations`/`recommendation_actions` and append to `activity_log` for the Activity panel.
