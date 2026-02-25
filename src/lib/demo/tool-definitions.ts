/**
 * Demo connector tool definitions.
 * Fun tools for testing the MCP pipeline without needing QuickBooks.
 */

export interface ToolDefinition {
  name: string;
  display_name: string;
  description: string;
  category: "read" | "write";
  input_schema: Record<string, unknown>;
}

export const DEMO_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "demo_magic_8_ball",
    display_name: "Magic 8-Ball",
    description:
      "Ask the Magic 8-Ball a yes-or-no question and receive a mysteriously authoritative answer.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "A yes-or-no question to ask the Magic 8-Ball",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "demo_roll_dice",
    display_name: "Roll Dice",
    description:
      "Roll one or more dice with a configurable number of sides. Defaults to 1d6.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        count: {
          type: "integer",
          description: "Number of dice to roll (1–20)",
          minimum: 1,
          maximum: 20,
          default: 1,
        },
        sides: {
          type: "integer",
          description: "Number of sides per die (2–100)",
          minimum: 2,
          maximum: 100,
          default: 6,
        },
      },
    },
  },
  {
    name: "demo_coin_flip",
    display_name: "Coin Flip",
    description: "Flip one or more coins and get the results.",
    category: "read",
    input_schema: {
      type: "object",
      properties: {
        count: {
          type: "integer",
          description: "Number of coins to flip (1–100)",
          minimum: 1,
          maximum: 100,
          default: 1,
        },
      },
    },
  },
  {
    name: "demo_random_excuse",
    display_name: "Random Excuse Generator",
    description:
      "Generate a random excuse for why you were late to a meeting, missed a deadline, or any other workplace mishap.",
    category: "write",
    input_schema: {
      type: "object",
      properties: {
        situation: {
          type: "string",
          description:
            'What you need an excuse for, e.g. "late to standup", "missed deadline", "forgot to reply"',
        },
      },
      required: ["situation"],
    },
  },
];

/**
 * Build tool rows ready for inserting into the tools table.
 */
export function getDemoToolSeedData(connectorId: string) {
  return DEMO_TOOL_DEFINITIONS.map((tool) => ({
    connector_id: connectorId,
    name: tool.name,
    display_name: tool.display_name,
    description: tool.description,
    category: tool.category,
    is_active: true,
    input_schema: tool.input_schema,
  }));
}
