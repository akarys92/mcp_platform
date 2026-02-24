import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

/**
 * Validate tool arguments against their JSON Schema.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateToolArgs(
  schema: Record<string, unknown>,
  args: Record<string, unknown>
): string | null {
  const validate = ajv.compile(schema);
  const valid = validate(args);

  if (valid) return null;

  const errors = validate.errors ?? [];
  const messages = errors.map((err) => {
    const path = err.instancePath || "(root)";
    return `${path}: ${err.message}`;
  });

  return messages.join("; ");
}
