import { JSON_RPC_ERRORS } from "@/types/mcp";

/**
 * Standardized MCP error responses.
 * Maps application errors to JSON-RPC error codes with clear messages.
 */

export function invalidTokenError() {
  return {
    code: -32600,
    message: "Invalid or expired token. Please re-authorize.",
  };
}

export function permissionDeniedError(toolName: string) {
  return {
    code: JSON_RPC_ERRORS.INVALID_REQUEST,
    message: `Permission denied: you do not have access to tool "${toolName}".`,
  };
}

export function toolNotFoundError(toolName: string) {
  return {
    code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
    message: `Tool not found: "${toolName}".`,
  };
}

export function validationError(message: string) {
  return {
    code: JSON_RPC_ERRORS.INVALID_PARAMS,
    message: `Invalid parameters: ${message}`,
  };
}

export function connectorError(message: string) {
  return {
    code: JSON_RPC_ERRORS.INTERNAL_ERROR,
    message: `Connector error: ${message}`,
  };
}

export function qboApiError(statusCode: number, message: string) {
  return {
    code: JSON_RPC_ERRORS.INTERNAL_ERROR,
    message: `QuickBooks API error (${statusCode}): ${message}`,
  };
}

export function rateLimitError() {
  return {
    code: -32000,
    message: "Rate limit exceeded. Please wait before making more requests.",
  };
}

/**
 * Build WWW-Authenticate header for 401 responses.
 * Includes the resource metadata URL so Claude can re-discover endpoints.
 */
export function wwwAuthenticateHeader(baseUrl: string): string {
  return `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;
}
