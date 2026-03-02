/**
 * Shared tool definition interface used by all connectors.
 */
export interface ToolDefinition {
  name: string;
  display_name: string;
  description: string;
  category: "read" | "write";
  input_schema: Record<string, unknown>;
}

/**
 * Build tool rows ready for inserting into the tools table.
 */
export function buildToolSeedData(
  connectorId: string,
  definitions: ToolDefinition[]
) {
  return definitions.map((def) => ({
    connector_id: connectorId,
    name: def.name,
    display_name: def.display_name,
    description: def.description,
    category: def.category,
    is_active: true,
    input_schema: def.input_schema,
  }));
}
