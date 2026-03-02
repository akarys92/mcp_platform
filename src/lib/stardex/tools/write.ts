import { StardexClient } from "../client";

export async function createPerson(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const { first_name, last_name, email, phone, title, company, linkedin_url } =
    args;
  return client.request("/v1/persons", {
    body: { first_name, last_name, email, phone, title, company, linkedin_url },
  });
}

export async function updatePerson(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const { id, ...fields } = args;
  return client.request(`/v1/persons/${id}`, {
    method: "PATCH",
    body: fields,
  });
}

export async function updateCandidateStage(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/v1/candidates/stage", {
    body: {
      candidate_id: args.candidate_id,
      stage_id: args.stage_id,
    },
  });
}

export async function createPersonActivity(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const { person_id, type, subject, body } = args;
  return client.request("/v1/person-activities", {
    body: { person_id, type, subject, body },
  });
}

export async function updatePersonActivity(
  client: StardexClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const { id, ...fields } = args;
  return client.request(`/v1/person-activities/${id}`, {
    method: "PATCH",
    body: fields,
  });
}
