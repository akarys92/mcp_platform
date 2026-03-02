import { ApolloClient } from "./client";
import * as readTools from "./tools/read";
import * as writeTools from "./tools/write";

type ToolHandler = (
  client: ApolloClient,
  args: Record<string, unknown>
) => Promise<unknown>;

const TOOL_MAP: Record<string, ToolHandler> = {
  // Search
  apollo_search_people: readTools.searchPeople,
  apollo_search_organizations: readTools.searchOrganizations,
  apollo_get_organization_job_postings: readTools.getOrganizationJobPostings,
  // Enrichment
  apollo_enrich_person: readTools.enrichPerson,
  apollo_bulk_enrich_people: readTools.bulkEnrichPeople,
  apollo_enrich_organization: readTools.enrichOrganization,
  // Contact Management
  apollo_create_contact: writeTools.createContact,
  apollo_update_contact: writeTools.updateContact,
  apollo_search_contacts: readTools.searchContacts,
  // Sequences
  apollo_search_sequences: readTools.searchSequences,
  apollo_add_contacts_to_sequence: writeTools.addContactsToSequence,
};

/**
 * Execute an Apollo tool by name.
 */
export async function executeApolloTool(
  toolName: string,
  args: Record<string, unknown>,
  connectorId: string
): Promise<unknown> {
  const handler = TOOL_MAP[toolName];
  if (!handler) {
    throw new Error(`Unknown Apollo tool: ${toolName}`);
  }

  const client = await ApolloClient.fromConnector(connectorId);
  return handler(client, args);
}
