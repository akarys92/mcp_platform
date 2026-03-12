import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StardexClient } from "@/lib/stardex/client";

/**
 * POST /api/workers/stardex-search
 *
 * Background worker that executes a Stardex vector search.
 * Called internally by searchPersons; returns 200 immediately
 * and processes the search in the background via after().
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const jobId = body?.job_id;

  if (!jobId) {
    return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Auth: job must exist and be pending
  const { data: job, error } = await supabase
    .from("search_jobs")
    .select("id, connector_id, query_params, status")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "pending") {
    return NextResponse.json(
      { error: `Job is already ${job.status}` },
      { status: 409 }
    );
  }

  // Mark as running
  await supabase
    .from("search_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  // Return immediately, process in background
  after(async () => {
    try {
      const client = await StardexClient.fromConnector(job.connector_id);
      const params = job.query_params as Record<string, string>;
      const result = await client.get("/v1/persons", params, {
        timeoutMs: 240_000,
      });

      await supabase
        .from("search_jobs")
        .update({
          status: "completed",
          result,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      console.error(`[search-worker] Job ${jobId} failed:`, errorMessage);

      await supabase
        .from("search_jobs")
        .update({
          status: "failed",
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
  });

  return NextResponse.json({ status: "accepted" });
}
