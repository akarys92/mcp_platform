import { ApolloClient } from "../client";

export async function createContact(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request("/contacts", {
    body: {
      first_name: args.first_name,
      last_name: args.last_name,
      email: args.email,
      organization_name: args.organization_name,
      title: args.title,
      phone_number: args.phone_number,
      linkedin_url: args.linkedin_url,
    },
  });
}

export async function updateContact(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  const { contact_id, ...fields } = args;
  return client.request(`/contacts/${contact_id}`, {
    method: "PATCH",
    body: fields,
  });
}

export async function addContactsToSequence(
  client: ApolloClient,
  args: Record<string, unknown>
): Promise<unknown> {
  return client.request(
    `/emailer_campaigns/${args.sequence_id}/add_contact_ids`,
    {
      body: {
        contact_ids: args.contact_ids,
      },
    }
  );
}
