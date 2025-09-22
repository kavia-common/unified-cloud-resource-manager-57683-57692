# Cross-Cloud Resource Manager — React Dashboard

This frontend provides a minimalist "Pure White" dashboard for managing resources across AWS, Azure, and GCP. It uses Supabase for authentication and data access.

Key features:
- Supabase authentication (email/password, Google)
- Connect cloud accounts (AWS/Azure/GCP with service account flow)
- Inventory with resource operations (start/stop/scale)
- Costs analytics and breakdown
- AI/ML recommendations
- Rule-based automation
- Activity tracking

Environment variables (set via orchestrator, do not commit .env):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Directory overview:
- src/lib/supabaseClient.js — Supabase client factory
- src/context/AuthContext.jsx — Auth provider (PUBLIC_INTERFACE)
- src/components/ui/* — Reusable minimalist UI components
- src/features/auth/* — AuthGate + Login screens
- src/features/profile/Profile.jsx — User profile and cloud linking (includes GCP service account JSON flow)
- src/features/* — App features (overview, inventory, costs, recommendations, automation, activity, settings)
- src/theme.css — Pure White theme and layout styles
- src/App.js — Auth-enabled layout composition and routing

Notes:
- Tables and RPC used are optional in dev; components handle missing tables gracefully.
- For signUp and OAuth redirect, emailRedirectTo uses window.location.origin.
- Google OAuth must be enabled in your Supabase project and callback configured to your site URL.
- Integrate Edge Functions to process queued operations (operations, recommendation_actions, automation rules) server-side.
