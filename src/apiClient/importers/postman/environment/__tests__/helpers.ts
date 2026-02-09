import type { PostmanEnvironment, PostmanEnvironmentValue } from "../types";

// Type for the variable type field
type PostmanVariableType = "default" | "secret" | "text" | "number" | "boolean";

/**
 * Creates a mock Postman environment with default values
 */
export const createMockEnvironment = (
  overrides?: Partial<PostmanEnvironment>
): PostmanEnvironment => ({
  id: "test-env-id",
  name: "Test Environment",
  values: [],
  ...overrides,
});

/**
 * Creates a mock environment variable
 */
export const createMockVariable = (
  key: string,
  value: string,
  options?: {
    type?: PostmanVariableType;
    enabled?: boolean;
    description?: string;
  }
): PostmanEnvironmentValue => ({
  key,
  value,
  type: options?.type ?? "default",
  enabled: options?.enabled !== undefined ? options.enabled : true,
  ...(options?.description && { description: options.description }),
});

/**
 * Creates a batch of mock variables with sequential naming
 */
export const createMockVariables = (
  count: number,
  prefix: string = "var"
): PostmanEnvironmentValue[] => {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}${i + 1}`,
    value: `value${i + 1}`,
    type: "default" as const,
    enabled: true,
  }));
};

/**
 * Creates an environment with global scope
 */
export const createGlobalEnvironment = (
  name: string = "Global Variables",
  values: PostmanEnvironmentValue[] = []
): PostmanEnvironment => ({
  id: "global-id",
  name,
  values,
  _postman_variable_scope: "globals",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Postman/11.83.4",
});
