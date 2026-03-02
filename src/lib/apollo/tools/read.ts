import { ApolloClient } from "../client";

export async function searchPeople(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/mixed_people/api_search", {
    body: {
      q_keywords: args.q_keywords,
      person_titles: args.person_titles,
      person_locations: args.person_locations,
      person_seniorities: args.person_seniorities,
      organization_domains: args.organization_domains,
      organization_industry_tag_ids: args.organization_industry_tag_ids,
      page: args.page || 1,
      per_page: args.per_page || 25,
    },
  });
}

export async function searchOrganizations(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/mixed_companies/search", {
    body: {
      q_organization_keyword_tags: args.q_organization_keyword_tags,
      organization_locations: args.organization_locations,
      organization_num_employees_ranges: args.organization_num_employees_ranges,
      organization_industry_tag_ids: args.organization_industry_tag_ids,
      page: args.page || 1,
      per_page: args.per_page || 25,
    },
  });
}

export async function getOrganizationJobPostings(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get(`/organizations/${args.organization_id}/job_postings`);
}

export async function enrichPerson(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/people/match", {
    body: {
      first_name: args.first_name,
      last_name: args.last_name,
      organization_name: args.organization_name,
      email: args.email,
      linkedin_url: args.linkedin_url,
      domain: args.domain,
    },
  });
}

export async function bulkEnrichPeople(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/people/bulk_match", {
    body: {
      details: args.details,
    },
  });
}

export async function enrichOrganization(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.get("/organizations/enrich", {
    domain: String(args.domain),
  });
}

export async function searchContacts(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/contacts/search", {
    body: {
      q_keywords: args.q_keywords,
      sort_by_field: args.sort_by_field,
      sort_ascending: args.sort_ascending,
      page: args.page || 1,
      per_page: args.per_page || 25,
    },
  });
}

export async function searchSequences(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/emailer_campaigns/search", {
    body: {
      q_name: args.q_name,
      page: args.page || 1,
      per_page: args.per_page || 25,
    },
  });
}
