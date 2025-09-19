//
// Placeholder Edge Function for Mock GCP
// This file is intentionally minimal and ready for future implementation.
//
// Notes:
// - This function will simulate GCP operations for local development/testing.
// - Replace with actual logic or HTTP handlers as needed.
// - Ensure Supabase CLI is configured when deploying Edge Functions.
//
// PUBLIC_INTERFACE
export default function handler() {
  /** Placeholder export for mock GCP Edge Function. */
  return new Response(JSON.stringify({ provider: "gcp", status: "ok", message: "mock-gcp placeholder" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
