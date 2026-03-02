import type { ToolDefinition } from "@/types/tools";
import { buildToolSeedData } from "@/types/tools";

export const APOLLO_TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Search ──────────────────────────────────────────────────────────

  {
    name: "apollo_search_people",
    display_name: "Search People",
    description:
      "Search for people by job title, seniority, location, company, or industry. Free — no Apollo credits consumed.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        q_keywords: {
          type: "string",
          description: "Keywords to search for",
        },
        person_titles: {
          type: "array",
          items: { type: "string" },
          description: "Job titles to filter by (e.g. ['CEO', 'CTO'])",
        },
        person_locations: {
          type: "array",
          items: { type: "string" },
          description: "Locations to filter by (e.g. ['San Francisco, CA'])",
        },
        person_seniorities: {
          type: "array",
          items: { type: "string" },
          description:
            "Seniority levels (e.g. ['senior', 'manager', 'director', 'vp', 'c_suite'])",
        },
        organization_domains: {
          type: "array",
          items: { type: "string" },
          description: "Company domains to filter by (e.g. ['apollo.io'])",
        },
        organization_industry_tag_ids: {
          type: "array",
          items: { type: "string" },
          description: "Industry tag IDs to filter by",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        per_page: {
          type: "number",
          description: "Results per page (default: 25, max: 100)",
        },
      },
    },
  },

  {
    name: "apollo_search_organizations",
    display_name: "Search Organizations",
    description:
      "Search for companies by industry, size, funding, or location. Costs 1 Apollo credit per page of results.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        q_organization_keyword_tags: {
          type: "array",
          items: { type: "string" },
          description: "Keywords for company search",
        },
        organization_locations: {
          type: "array",
          items: { type: "string" },
          description: "Company HQ locations",
        },
        organization_num_employees_ranges: {
          type: "array",
          items: { type: "string" },
          description:
            "Employee count ranges (e.g. ['1,10', '11,50', '51,200'])",
        },
        organization_industry_tag_ids: {
          type: "array",
          items: { type: "string" },
          description: "Industry tag IDs",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        per_page: {
          type: "number",
          description: "Results per page (default: 25)",
        },
      },
    },
  },

  {
    name: "apollo_get_organization_job_postings",
    display_name: "Get Organization Job Postings",
    description:
      "See what a specific company is currently hiring for.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        organization_id: {
          type: "string",
          description: "The Apollo organization ID",
        },
      },
      required: ["organization_id"],
    },
  },

  // ── Enrichment ──────────────────────────────────────────────────────

  {
    name: "apollo_enrich_person",
    display_name: "Enrich Person",
    description:
      "Enrich a single person with full profile data including email and phone. Costs 1 Apollo credit.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: "Person's first name",
        },
        last_name: {
          type: "string",
          description: "Person's last name",
        },
        organization_name: {
          type: "string",
          description: "Company name for matching",
        },
        email: {
          type: "string",
          description: "Known email address for matching",
        },
        linkedin_url: {
          type: "string",
          description: "LinkedIn profile URL",
        },
        domain: {
          type: "string",
          description: "Company domain for matching",
        },
      },
    },
  },

  {
    name: "apollo_bulk_enrich_people",
    display_name: "Bulk Enrich People",
    description:
      "Enrich up to 10 people at once with full profile data. Costs 1 Apollo credit per match.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        details: {
          type: "array",
          items: {
            type: "object",
            properties: {
              first_name: { type: "string", description: "First name" },
              last_name: { type: "string", description: "Last name" },
              organization_name: {
                type: "string",
                description: "Company name",
              },
              email: { type: "string", description: "Email address" },
              linkedin_url: {
                type: "string",
                description: "LinkedIn URL",
              },
              domain: { type: "string", description: "Company domain" },
            },
          },
          description: "Array of people to enrich (max 10)",
        },
      },
      required: ["details"],
    },
  },

  {
    name: "apollo_enrich_organization",
    display_name: "Enrich Organization",
    description:
      "Enrich a company profile with detailed data including industry, size, funding, and tech stack.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Company domain (e.g. 'apollo.io')",
        },
      },
      required: ["domain"],
    },
  },

  // ── Contact Management ──────────────────────────────────────────────

  {
    name: "apollo_create_contact",
    display_name: "Create Contact",
    description: "Save someone as a contact in Apollo.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: "First name",
        },
        last_name: {
          type: "string",
          description: "Last name",
        },
        email: {
          type: "string",
          description: "Email address",
        },
        organization_name: {
          type: "string",
          description: "Company name",
        },
        title: {
          type: "string",
          description: "Job title",
        },
        phone_number: {
          type: "string",
          description: "Phone number",
        },
        linkedin_url: {
          type: "string",
          description: "LinkedIn profile URL",
        },
      },
      required: ["first_name", "last_name"],
    },
  },

  {
    name: "apollo_update_contact",
    display_name: "Update Contact",
    description: "Update an existing Apollo contact's details.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: "The Apollo contact ID",
        },
        first_name: { type: "string", description: "First name" },
        last_name: { type: "string", description: "Last name" },
        email: { type: "string", description: "Email address" },
        organization_name: { type: "string", description: "Company name" },
        title: { type: "string", description: "Job title" },
        phone_number: { type: "string", description: "Phone number" },
      },
      required: ["contact_id"],
    },
  },

  {
    name: "apollo_search_contacts",
    display_name: "Search Contacts",
    description: "Search your existing Apollo contacts.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        q_keywords: {
          type: "string",
          description: "Keywords to search contacts",
        },
        sort_by_field: {
          type: "string",
          description: "Field to sort by (e.g. 'contact_last_activity_date')",
        },
        sort_ascending: {
          type: "boolean",
          description: "Sort ascending (default: false)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        per_page: {
          type: "number",
          description: "Results per page (default: 25)",
        },
      },
    },
  },

  // ── Sequences ───────────────────────────────────────────────────────

  {
    name: "apollo_search_sequences",
    display_name: "Search Sequences",
    description: "List available outreach sequences in Apollo.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        q_name: {
          type: "string",
          description: "Search sequences by name",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        per_page: {
          type: "number",
          description: "Results per page (default: 25)",
        },
      },
    },
  },

  {
    name: "apollo_add_contacts_to_sequence",
    display_name: "Add Contacts to Sequence",
    description:
      "Enroll one or more contacts in an email outreach sequence.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        sequence_id: {
          type: "string",
          description: "The Apollo sequence (emailer campaign) ID",
        },
        contact_ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of contact IDs to enroll",
        },
      },
      required: ["sequence_id", "contact_ids"],
    },
  },
];

export function getApolloToolSeedData(connectorId: string) {
  return buildToolSeedData(connectorId, APOLLO_TOOL_DEFINITIONS);
}
