import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);

  // Mock Inventory
  if (url.pathname === "/inventory") {
    return new Response(JSON.stringify([
      { id: "gce-777", type: "ComputeEngine", status: "running", cost: 8.7 },
      { id: "bq-222", type: "BigQuery", status: "active", cost: 5.0 }
    ]), { headers: { "Content-Type": "application/json" }});
  }

  // Mock Costs
  if (url.pathname === "/costs") {
    return new Response(JSON.stringify({
      month: "2025-09",
      total: 13.7,
      breakdown: { ComputeEngine: 8.7, BigQuery: 5.0 }
    }), { headers: { "Content-Type": "application/json" }});
  }

  // Mock Actions
  if (url.pathname === "/action/start") {
    const body = await req.json().catch(() => ({}));
    return new Response(JSON.stringify({ message: "Compute Engine VM started", id: body.id || "gce-777" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/action/stop") {
    const body = await req.json().catch(() => ({}));
    return new Response(JSON.stringify({ message: "Compute Engine VM stopped", id: body.id || "gce-777" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
});

