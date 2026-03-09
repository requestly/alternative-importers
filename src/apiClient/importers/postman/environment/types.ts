import { z } from "zod";

import { PostmanEnvironmentSchema } from "~/schemas/zod-schemas/postman_environment";

// Export types
export type PostmanEnvironment = z.infer<typeof PostmanEnvironmentSchema>;
export type PostmanEnvironmentValue = PostmanEnvironment["values"][number];
