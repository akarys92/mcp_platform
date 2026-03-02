import { StardexClient } from "./client";
import * as readTools from "./tools/read";
import * as writeTools from "./tools/write";

type ToolHandler = (
  client: StardexClient,
  args: Record<string, unknown>
) => Promise<unknown>;

const TOOL_MAP: Record<string, ToolHandler> = {
  // Jobs
  stardex_list_jobs: readTools.listJobs,
  stardex_get_job: readTools.getJob,
  stardex_list_job_candidates: readTools.listJobCandidates,
  // Persons
  stardex_search_persons: readTools.searchPersons,
  stardex_get_person: readTools.getPerson,
  stardex_create_person: writeTools.createPerson,
  stardex_update_person: writeTools.updatePerson,
  stardex_get_person_activities: readTools.getPersonActivities,
  stardex_get_person_documents: readTools.getPersonDocuments,
  // Candidates
  stardex_update_candidate_stage: writeTools.updateCandidateStage,
  stardex_get_candidate: readTools.getCandidate,
  // Person Activities
  stardex_create_person_activity: writeTools.createPersonActivity,
  stardex_get_person_activity: readTools.getPersonActivity,
  stardex_update_person_activity: writeTools.updatePersonActivity,
};

/**
 * Execute a Stardex tool by name.
 */
export async function executeStardexTool(
  toolName: string,
  args: Record<string, unknown>,
  connectorId: string
): Promise<unknown> {
  const handler = TOOL_MAP[toolName];
  if (!handler) {
    throw new Error(`Unknown Stardex tool: ${toolName}`);
  }

  const client = await StardexClient.fromConnector(connectorId);
  return handler(client, args);
}
