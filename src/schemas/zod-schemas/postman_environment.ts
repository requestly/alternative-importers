import { z } from "zod";

// Environment variable value schema
const PostmanEnvironmentValueSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(["default", "secret", "text", "number", "boolean"]).optional(),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
});

// Main Environment schema
export const PostmanEnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(PostmanEnvironmentValueSchema),
  color: z.string().nullable().optional(),
  _postman_variable_scope: z.enum(["environment", "globals"]).optional(),
  _postman_exported_at: z.string().optional(),
  _postman_exported_using: z.string().optional(),
});