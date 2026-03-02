import type { ToolDefinition } from "@/types/tools";
import { buildToolSeedData } from "@/types/tools";

export const STARDEX_TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Jobs ────────────────────────────────────────────────────────────

  {
    name: "stardex_list_jobs",
    display_name: "List Jobs",
    description:
      "List all jobs with optional pagination and filtering by status.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        offset: {
          type: "number",
          description: "Number of records to skip (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum records to return, 1-100 (default: 100)",
        },
        status: {
          type: "string",
          description: "Filter by job status (e.g. open, closed, draft)",
        },
      },
    },
  },

  {
    name: "stardex_get_job",
    display_name: "Get Job Details",
    description:
      "Get full details for a specific job including pipeline stages, team members, candidate count, location, and salary range. Note: the Stardex API does not currently return job description or requirements text.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex job ID",
        },
      },
      required: ["id"],
    },
  },

  {
    name: "stardex_list_job_candidates",
    display_name: "List Job Candidates",
    description:
      "List all candidates in a job's pipeline with their current stage and status.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex job ID",
        },
        offset: {
          type: "number",
          description: "Number of records to skip (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum records to return, 1-100 (default: 100)",
        },
      },
      required: ["id"],
    },
  },

  // ── Persons ─────────────────────────────────────────────────────────

  {
    name: "stardex_search_persons",
    display_name: "Search Persons",
    description:
      "Search people in the Stardex database by name, email, phone, LinkedIn URL, or vector search query.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (name, email, etc.)",
        },
        name: {
          type: "string",
          description: "Name to search for",
        },
        email: {
          type: "string",
          description: "Email address to search for",
        },
        phone: {
          type: "string",
          description: "Phone number to search for",
        },
        linkedin_url: {
          type: "string",
          description: "LinkedIn URL to search for",
        },
        vector_search: {
          type: "string",
          description:
            "Semantic search query, min 5 chars (e.g. 'VP ops with strategy consulting experience')",
        },
        offset: {
          type: "number",
          description: "Number of records to skip (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum records to return, 1-100 (default: 100)",
        },
      },
    },
  },

  {
    name: "stardex_get_person",
    display_name: "Get Person Details",
    description:
      "Get full person details including contact info, tags, and custom fields.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex person ID",
        },
      },
      required: ["id"],
    },
  },

  {
    name: "stardex_create_person",
    display_name: "Create Person",
    description: "Create a new person record in Stardex.",
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
        phone: {
          type: "string",
          description: "Phone number",
        },
        title: {
          type: "string",
          description: "Job title",
        },
        company: {
          type: "string",
          description: "Current company name",
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
    name: "stardex_update_person",
    display_name: "Update Person",
    description: "Update an existing person's details in Stardex.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex person ID",
        },
        first_name: { type: "string", description: "First name" },
        last_name: { type: "string", description: "Last name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        title: { type: "string", description: "Job title" },
        company: { type: "string", description: "Current company name" },
        linkedin_url: { type: "string", description: "LinkedIn profile URL" },
      },
      required: ["id"],
    },
  },

  {
    name: "stardex_get_person_activities",
    display_name: "Get Person Activities",
    description:
      "Get the activity history (calls, emails, notes) for a person.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex person ID",
        },
        offset: {
          type: "number",
          description: "Number of records to skip (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum records to return, 1-100 (default: 100)",
        },
      },
      required: ["id"],
    },
  },

  {
    name: "stardex_get_person_documents",
    display_name: "Get Person Documents",
    description: "Get documents (resumes, cover letters, etc.) attached to a person.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Stardex person ID",
        },
      },
      required: ["id"],
    },
  },

  // ── Candidates ──────────────────────────────────────────────────────

  {
    name: "stardex_update_candidate_stage",
    display_name: "Move Candidate Stage",
    description:
      "Move a candidate to a different stage in the job pipeline.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        candidate_id: {
          type: "string",
          description: "The candidate ID",
        },
        stage_id: {
          type: "string",
          description: "The target pipeline stage ID",
        },
      },
      required: ["candidate_id", "stage_id"],
    },
  },

  {
    name: "stardex_get_candidate",
    display_name: "Get Candidate Details",
    description:
      "Get detailed candidate information including pipeline stage and application data.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The candidate ID",
        },
      },
      required: ["id"],
    },
  },

  // ── Person Activities ───────────────────────────────────────────────

  {
    name: "stardex_create_person_activity",
    display_name: "Log Activity",
    description:
      "Log an activity (call, email, note, meeting) against a person.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        person_id: {
          type: "string",
          description: "The Stardex person ID",
        },
        type: {
          type: "string",
          enum: ["call", "email", "note", "meeting"],
          description: "Activity type",
        },
        subject: {
          type: "string",
          description: "Activity subject line",
        },
        body: {
          type: "string",
          description: "Activity body/content",
        },
      },
      required: ["person_id", "type"],
    },
  },

  {
    name: "stardex_get_person_activity",
    display_name: "Get Activity",
    description: "Get details for a specific activity record.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The activity ID",
        },
      },
      required: ["id"],
    },
  },

  {
    name: "stardex_update_person_activity",
    display_name: "Update Activity",
    description: "Update an existing activity record.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The activity ID",
        },
        subject: {
          type: "string",
          description: "Updated subject line",
        },
        body: {
          type: "string",
          description: "Updated body/content",
        },
      },
      required: ["id"],
    },
  },
];

export function getStardexToolSeedData(connectorId: string) {
  return buildToolSeedData(connectorId, STARDEX_TOOL_DEFINITIONS);
}
