import { after } from "next/server";
import { StardexClient } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ToolContext {
  userId: string;
  connectorId: string;
}

export async function listJobs(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params: Record<string, string> = {};
  if (args.offset != null) params.offset = String(args.offset);
  if (args.limit) params.limit = String(args.limit);
  if (args.status) params.status = String(args.status);
  return client.get("/v1/jobs", params);
}

export async function getJob(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/v1/jobs/${args.id}`);
}

export async function listJobCandidates(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params: Record<string, string> = {};
  if (args.offset != null) params.offset = String(args.offset);
  if (args.limit) params.limit = String(args.limit);
  return client.get(`/v1/jobs/${args.id}/candidates`, params);
}

export async function searchPersons(
  client: StardexClient,
  args: Record<string, unknown>,
  context?: ToolContext
): Promise<unknown> {
  const params: Record<string, string> = {};
  if (args.name) params.name = String(args.name);
  if (args.email) params.email = String(args.email);
  if (args.phone) params.phone = String(args.phone);
  if (args.linkedin_url) params.linkedin_url = String(args.linkedin_url);
  if (args.vector_search) params.vector_search = String(args.vector_search);
  // Backward compat: map generic "query" to vector_search
  if (args.query && !args.vector_search) {
    params.vector_search = String(args.query);
  }
  if (args.offset != null) params.offset = String(args.offset);
  if (args.limit) params.limit = String(args.limit);

  // Non-vector searches: synchronous fast path
  if (!params.vector_search) {
    return client.get("/v1/persons", params);
  }

  // Vector search: async job pattern
  if (!context) {
    throw new Error("Vector search requires user context");
  }

  const supabase = createAdminClient();
  const { data: job, error } = await supabase
    .from("search_jobs")
    .insert({
      user_id: context.userId,
      connector_id: context.connectorId,
      query_params: params,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !job) {
    throw new Error("Failed to create search job");
  }

  // Mark as running and execute the search in background via after().
  // We use after() instead of an HTTP self-call to avoid Vercel
  // deployment protection blocking internal requests.
  await supabase
    .from("search_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id);

  after(async () => {
    const bgSupabase = createAdminClient();
    try {
      const bgClient = await StardexClient.fromConnector(context.connectorId);
      const result = await bgClient.get("/v1/persons", params, {
        timeoutMs: 240_000,
      });

      await bgSupabase
        .from("search_jobs")
        .update({
          status: "completed",
          result,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      console.error(`[search] Job ${job.id} failed:`, errorMessage);

      await bgSupabase
        .from("search_jobs")
        .update({
          status: "failed",
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  });

  return {
    job_id: job.id,
    status: "running",
    message:
      "Vector search started. Use stardex_get_search_results with this job_id to check for results.",
  };
}

// Max age before a pending/running job is considered timed out
const PENDING_TIMEOUT_S = 60;
const RUNNING_TIMEOUT_S = 300;

export async function getSearchResults(
  _client: StardexClient,
  args: Record<string, unknown>,
  context?: ToolContext
): Promise<unknown> {
  if (!args.job_id) {
    throw new Error("job_id is required");
  }
  if (!context?.userId) {
    throw new Error("User context required");
  }

  const supabase = createAdminClient();
  const { data: job, error } = await supabase
    .from("search_jobs")
    .select("id, status, result, error, created_at, started_at, completed_at")
    .eq("id", String(args.job_id))
    .eq("user_id", context.userId)
    .single();

  if (error || !job) {
    return { error: "Job not found or access denied", job_id: args.job_id };
  }

  // Detect timed-out jobs and mark them as failed
  if (job.status === "pending" || job.status === "running") {
    const refTime = job.status === "running" ? job.started_at : job.created_at;
    const timeoutS =
      job.status === "running" ? RUNNING_TIMEOUT_S : PENDING_TIMEOUT_S;

    if (refTime) {
      const elapsed = (Date.now() - new Date(refTime).getTime()) / 1000;
      if (elapsed > timeoutS) {
        const timeoutMsg =
          job.status === "running"
            ? "Search timed out after 5 minutes"
            : "Search failed to start — worker did not pick up the job";

        await supabase
          .from("search_jobs")
          .update({
            status: "failed",
            error: timeoutMsg,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        return { status: "failed", error: timeoutMsg, job_id: job.id };
      }
    }
  }

  switch (job.status) {
    case "completed":
      return job.result;
    case "failed":
      return { status: "failed", error: job.error, job_id: job.id };
    case "running": {
      const elapsed = job.started_at
        ? Math.round(
            (Date.now() - new Date(job.started_at).getTime()) / 1000
          )
        : 0;
      return {
        status: "running",
        job_id: job.id,
        elapsed_seconds: elapsed,
        message: "Search is still running. Please try again in 15-30 seconds.",
      };
    }
    default:
      return {
        status: "pending",
        job_id: job.id,
        message:
          "Search has not started yet. Please try again in a few seconds.",
      };
  }
}

export async function getPerson(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/v1/persons/${args.id}`);
}

export async function getPersonActivities(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const params: Record<string, string> = {};
  if (args.offset != null) params.offset = String(args.offset);
  if (args.limit) params.limit = String(args.limit);
  return client.get(`/v1/persons/${args.id}/activities`, params);
}

export async function getPersonDocuments(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/v1/persons/${args.id}/documents`);
}

export async function getCandidate(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/v1/candidates/${args.id}`);
}

export async function getPersonActivity(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/v1/person-activities/${args.id}`);
}
