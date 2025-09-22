# Supabase Edge Functions — Backend Automation

This folder contains Edge Functions used by the Cross-Cloud Resource Manager:

Functions:
- link-account — Securely links AWS/Azure/GCP accounts (stores public metadata and private credentials).
- mock-aws, mock-azure, mock-gcp — Mock providers for inventory/costs/actions during development.
- recommendations — Generates AI/ML-like recommendations:
  - Idle detection, rightsizing, anomaly detection.
  - Inserts into public.recommendations and logs to public.activity_log.
  - Route: POST /run (Authorization: Bearer <Supabase JWT>).
- automation-enforcer — Enforces automation rules:
  - Reads enabled public.automation_rules for the user.
  - Matches resources by simple tag query and enqueues public.operations entries.
  - Writes public.automation_rule_runs and public.activity_log.
  - Route: POST /run (Authorization: Bearer <Supabase JWT>).
- queue-processor — Processes queued operations and recommendation_actions:
  - Transitions status queued → running → success with simulated results.
  - Appends activity entries.
  - Route: POST /run (Authorization: Bearer <Supabase JWT>).

Environment:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY
These are provided by Supabase in the Edge runtime.

Scheduling:
Use Supabase Scheduled Triggers:
- recommendations /run — every 6 hours
- automation-enforcer /run — every 10 minutes
- queue-processor /run — every 2–5 minutes

Security:
Ensure RLS is enabled as documented in supabase/schema.md. Keep cloud_credentials inaccessible from client. Prefer service role for backend writes.
