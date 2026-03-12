import { StardexClient } from "../client";

const VECTOR_SEARCH_TIMEOUT_MS = 120_000;

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
  args: Record<string, unknown>
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
  const isVectorSearch = Boolean(params.vector_search);
  return client.get("/v1/persons", params, isVectorSearch ? { timeoutMs: VECTOR_SEARCH_TIMEOUT_MS } : undefined);
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
