# Supabase Integration Guide — Account Linking Edge Function

This project uses Supabase for Auth, Postgres, and Edge Functions. A dedicated Edge Function `link-account` securely handles cloud account linking for AWS, Azure, and GCP.

## Environment Variables (frontend)
Set via orchestrator (do not commit `.env`):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Frontend client:
- File: react_frontend_dashboard/src/lib/supabaseClient.js
- Export: supabase() // returns a memoized Supabase client
- Usage: import { supabase } from "../lib/supabaseClient"; supabase().auth.getSession()

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

## Troubleshooting

- 401 Unauthorized when linking accounts:
  - Ensure the frontend includes Authorization: Bearer <access_token> when calling Edge Functions. The api.js helper now does this via supabase().auth.getSession().
  - Make sure the user is signed in (AuthContext provides session).

- 404 Not Found:
  - Verify the function is deployed and enabled: supabase functions deploy link-account
  - The frontend constructs absolute URL: ${REACT_APP_SUPABASE_URL}/functions/v1/link-account

- Network/CORS errors:
  - Calls are made to the Supabase URL directly (not relative). Ensure REACT_APP_SUPABASE_URL is set correctly.
  - Supabase Edge Functions include CORS handling by default; ensure the project’s allowed origins include the app origin.

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
Frontend integrates via:
- Supabase client: react_frontend_dashboard/src/lib/supabaseClient.js
- API service: react_frontend_dashboard/src/services/api.js
  - createLinkedAccount() -> calls Edge Function link-account (persists and stores secrets)
  - getLinkedAccounts() -> reads public.cloud_accounts via supabase-js (RLS-scoped to user)

UI flows:
- Overview.jsx opens AddCloudAccountModal, calls createLinkedAccount on Create, shows toast on success/error, and refreshes list via getLinkedAccounts.
- Toast notifications are provided by a lightweight ToastProvider at app root.

No sensitive data is inserted directly into tables from the client; credentials are posted only to the Edge Function.

Recommendations.jsx and Automation.jsx are already wired to:
- Read from `recommendations` and enqueue into `recommendation_actions`.
- Create/toggle rules in `automation_rules`.

With the new Edge Functions and cron:
- `recommendations` will be periodically populated.
- `automation_rules` will be enforced and resulting `operations` queued.
- `queue-processor` will update `operations`/`recommendation_actions` and append to `activity_log` for the Activity panel.
