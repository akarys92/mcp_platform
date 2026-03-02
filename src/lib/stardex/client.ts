import { ApiKeyClient } from "@/lib/api-key-client";

/**
 * Stardex API client.
 * Auth: Authorization: Bearer <api_key>
 * Base URL: https://api.stardex.ai
 */
export class StardexClient extends ApiKeyClient {
  protected baseUrl = "https://api.stardex.ai";

  protected buildAuthHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  static async fromConnector(connectorId: string): Promise<StardexClient> {
    const { apiKey } = await ApiKeyClient.loadCredentials(
      connectorId,
      "Stardex"
    );
    return new StardexClient(apiKey, connectorId);
  }
}
