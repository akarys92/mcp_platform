import { ApiKeyClient } from "@/lib/api-key-client";

/**
 * Apollo API client.
 * Auth: x-api-key header
 * Base URL: https://api.apollo.io/api/v1
 */
export class ApolloClient extends ApiKeyClient {
  protected baseUrl = "https://api.apollo.io/api/v1";

  protected buildAuthHeaders(): Record<string, string> {
    return { "x-api-key": this.apiKey };
  }

  static async fromConnector(connectorId: string): Promise<ApolloClient> {
    const { apiKey } = await ApiKeyClient.loadCredentials(
      connectorId,
      "Apollo"
    );
    return new ApolloClient(apiKey, connectorId);
  }
}
