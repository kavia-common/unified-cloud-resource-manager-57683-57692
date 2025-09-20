# Cross-Cloud Resource Manager — Implementation Plan (Extracted) and Execution Checklist

Source: attachments/20250920_171035_Cross_Cloud_Manager_Plan.pdf

This document extracts the plan from the provided PDF and maps it to the current repository state for the React frontend dashboard. It also provides a stepwise execution checklist, explicitly noting which items are already implemented and which remain.

----------------------------------------------------------------

PHASE 1: Planning & Architecture
- Define database schema in Supabase Postgres.
- Define component & page structure (React/Next.js).
- Decide Supabase Edge Functions structure.

Status in repo:
- DB schema: Not defined in this repo (handled by backend/Supabase). Components are defensive to missing tables.
- Component & page structure: Implemented in React (not Next.js). Structure present under src/features/*, src/components/ui/*, src/lib/* and App layout with Sidebar + Topbar.
- Edge Functions: Mock functions included under supabase/functions (mock-aws, mock-azure, mock-gcp). Baseline structure present.

Action items:
- Keep DB interactions tolerant of missing tables (already done).
- Confirm Edge Functions naming/paths consistent (done via lib/cloudApi.js using supabase.functions.invoke).

----------------------------------------------------------------

PHASE 2: Authentication & User Management
- Implement Supabase Auth (email/password, Google login).
- Create user profile page for cloud account linking.
- Backend Edge Function for account linking.

Status in repo:
- Auth intentionally removed and replaced with no-op context to keep UI accessible without env vars (src/context/AuthContext.jsx).
- Settings page for linking cloud accounts exists (src/features/settings/CloudConnections.jsx) writing to "cloud_accounts" table.
- No user profile view; account linking happens directly in settings.
- No dedicated account-linking Edge Function (front-end inserts into cloud_accounts table).

Decision for stepwise execution:
- Since the current project uses guest-mode and focuses on UI and Edge Function mocks, defer full Supabase Auth until later. The settings screen covers the functional flow for linking accounts in a simplified manner.

----------------------------------------------------------------

PHASE 3: Multi-Cloud Inventory
- Edge Functions to fetch AWS/Azure resources.
- Store inventory in Supabase Postgres.
- Frontend dashboard to display inventory with filters.

Status in repo:
- Edge Functions: mock-aws, mock-azure, mock-gcp exist with /inventory endpoints.
- Storage in DB: Inventory page reads from "resources" table if it exists; also displays mock inventory from Edge Functions.
- Frontend inventory with filters: Implemented (search filter, DataTable, operations modal).

Action items:
- None required for base functionality; optional: add periodic refresh or sync job (future).

----------------------------------------------------------------

PHASE 4: Resource Management
- Edge Functions for start/stop/restart/scale VMs, tagging, bulk operations.
- Update DB after operations.
- Frontend action buttons and bulk operations UI.

Status in repo:
- Edge Functions: mock-gcp supports POST /action/stop; mock-azure supports POST /action/start, /action/stop; mock-aws supports /action/stop.
- Frontend UI: Inventory has an "Operate" modal for queued operations into "operations" table; for mock GCP, inline Start/Stop actions update local UI via postCloudAction.
- DB updates after operations: Enqueues into "operations" table; actual backend processing assumed (edge functions/cron) outside this repo.

Action items:
- Optional: expand mock functions to include /action/start for all providers, restart/scale placeholders.
- Optional: bulk operations UI (future).

----------------------------------------------------------------

PHASE 5: Cost Visibility
- Edge Functions to fetch cost data from AWS and Azure.
- Store per-resource monthly costs.
- Frontend charts and spend insights.

Status in repo:
- Edge Functions: mock-aws, mock-azure, mock-gcp support /costs with totals and breakdown.
- DB: Costs page reads "costs_breakdown" and RPC "costs_aggregates" if they exist; otherwise uses mock functions as a separate panel.
- Frontend: Costs panel shows stat cards, table, and mock cloud provider cost cards.

Action items:
- Optional: add charts (currently tables and stats only).
- Optional: CSV export actual implementation (button is placeholder).

----------------------------------------------------------------

PHASE 6: AI/ML Recommendations
- Edge Functions for idle resource detection, resizing suggestions, anomaly detection.
- Store recommendations in DB.
- Frontend recommendations panel with actionable options.

Status in repo:
- Frontend recommendations page reads from "recommendations" table and enqueues actions to "recommendation_actions".
- Edge functions not provided (out of scope here).
- UI action "Apply" implemented.

Action items:
- Optional: add mock recommendations Edge Function or populate via seed script (outside frontend scope).

----------------------------------------------------------------

PHASE 7: Automation Rules
- Define automation_rules table.
- Edge Functions enforce rules.
- Supabase Cron Jobs schedule automation.
- Update history logs.
- Frontend for creating/editing/deleting rules.

Status in repo:
- Frontend page (Automation.jsx) supports creating rules (insert into "automation_rules"), toggling rule status.
- Enforcement engine, cron, and history update are outside frontend scope.
- Activity stream (Activity.jsx) reads from "activity_log".

Action items:
- None for UI baseline; backend enforcement remains TODO.

----------------------------------------------------------------

PHASE 8: Dashboard & Analytics
- Unified table for all resources.
- Filters by account, region, service type, tags.
- Cost charts and trends.
- Recommendations panel.
- History of operations.

Status in repo:
- Overview with stat cards and empty-state CTA.
- Inventory table with filters/search.
- Costs panel with stats and tables.
- Recommendations and Activity panels implemented.
- Unified table concept is represented by "resources" table + mock sections.

Action items:
- Optional: add tag filters and charts (future).

----------------------------------------------------------------

PHASE 9: Testing & QA
- Unit tests for Edge Functions.
- Integration tests for frontend-backend.
- Sandbox accounts or mock API testing.
- Validate cost calculations and recommendations.

Status in repo:
- Basic React test exists (renders App).
- Edge Function tests not included here.
- Mock API coverage exists via supabase/functions mocks.

Action items:
- Optional: add integration tests around lib/cloudApi and feature panels using MSW or mocking supabase client.

----------------------------------------------------------------

PHASE 10: Future-Proofing & Extensibility
- Add GCP, Snowflake, Databricks connectors.
- Modular SDK pattern.
- Extend cost management and optimization features.

Status in repo:
- GCP mock present. Snowflake/Databricks not included.
- cloudApi.js centralizes calls to Edge Functions; modular enough to extend.

Action items:
- Future phases can add connectors and extend UI.

----------------------------------------------------------------

Sequential Execution Checklist (Skip items already implemented)
1) Baseline architecture
   - [x] React app scaffold, Pure White theme, Sidebar + Topbar layout.
   - [x] Feature folders: overview, inventory, costs, recommendations, automation, activity, settings.
   - [x] Supabase client with env-safe stubbing for CI.

2) Edge Functions (Mock) for clouds
   - [x] mock-aws: /inventory, /costs, action/stop
   - [x] mock-azure: /inventory, /costs, action/start, action/stop
   - [x] mock-gcp: /inventory, /costs, action/stop
   - [ ] Optional: add start/scale endpoints for completeness.

3) Inventory
   - [x] Display from DB "resources" (best-effort)
   - [x] Display mock inventories (AWS/Azure/GCP) via Edge Functions
   - [x] Search filter
   - [x] Operations modal (enqueue to "operations")

4) Resource actions
   - [x] GCP inline start/stop against mock Edge Functions
   - [ ] Optional: start/scale for AWS/Azure, bulk operations

5) Costs
   - [x] Read "costs_breakdown" and "costs_aggregates" if present
   - [x] Fallback mock costs panel for AWS/Azure/GCP
   - [ ] Optional: charts/CSV export implementation

6) Recommendations
   - [x] Table from "recommendations"
   - [x] Apply action enqueues "recommendation_actions"

7) Automation
   - [x] Create/Toggle rules in "automation_rules"
   - [ ] Backend enforcement/Cron/Activity logging (backend scope)

8) Activity
   - [x] Read from "activity_log"

9) Authentication
   - [ ] Full Supabase Auth (email/password, Google), user profile page
   - [ ] Account linking via dedicated Edge Function
   - Note: Deferred; current UI operates in guest mode to demonstrate functionality.

10) Testing
   - [x] Basic App render test
   - [ ] Add integration tests for cloudApi and feature panels

11) Future Integration
   - [ ] Extend connectors (Snowflake, Databricks)
   - [ ] Modular SDK enhancements

Notes:
- The environment variables required by the dashboard are:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY
- Components are built to fail-safe if tables or RPCs do not exist.
- Proceed with implementing only unchecked optional items if/when needed.

----------------------------------------------------------------

Next Step Recommendation
- If required by the work item, implement optional enhancements:
  a) Add mock start endpoint for GCP and AWS to support full start/stop parity.
  b) Implement CSV export in Costs panel.
  c) Add minimal integration tests for lib/cloudApi using jest + simple mocking.

This document will guide subsequent steps to ensure we only implement what’s missing.
