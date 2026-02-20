import {
  RQAPI,
  Authorization,
  RequestContentType,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { SKIP_HEADERS } from "./types";
import { inferSchemaFromValue } from "./utils";

/**
 * Convert path with {{variable}} to OpenAPI path with {variable}
 * Also extracts path parameters
 */
export function convertPathVariables(
  path: string,
  pathVariables?: RQAPI.PathVariable[],
): {
  openApiPath: string;
  parameters: OpenAPIV3.ParameterObject[];
} {
  const parameters: OpenAPIV3.ParameterObject[] = [];

  // Convert {{variable}} to {variable} and collect parameters
  const openApiPath = path.replace(
    /\{\{([^}]+)\}\}|:([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (_, var1, var2) => {
      const varName = var1 || var2;
      // Only add parameter if we haven't seen it before
      if (!parameters.find((p) => p.name === varName)) {
        const pathVar = pathVariables?.find((pv) => pv.key === varName);

        parameters.push({
          name: varName,
          in: "path",
          required: true,
          schema: {
            type: pathVar?.dataType || "string",
          },
          description: pathVar?.description,
        });
      }
      return `{${varName}}`;
    },
  );

  return { openApiPath, parameters };
}

/**
 * Convert query parameters to OpenAPI format
 */
export function convertQueryParameters(
  queryParams: RQAPI.HttpRequest["queryParams"],
): OpenAPIV3.ParameterObject[] {
  return queryParams
    .filter((param) => param.isEnabled)
    .map((param) => ({
      name: param.key,
      in: "query" as const,
      schema: {
        type: param.dataType || "string",
      },
      description: param.description,
      example: param.value || undefined,
    }));
}

/**
 * Convert headers to OpenAPI format
 * Skips common headers that are typically handled by the client
 */
export function convertHeaders(
  headers: RQAPI.HttpRequest["headers"],
): OpenAPIV3.ParameterObject[] {
  return headers
    .filter(
      (header) =>
        header.isEnabled && !SKIP_HEADERS.includes(header.key.toLowerCase()),
    )
    .map((header) => ({
      name: header.key,
      in: "header" as const,
      schema: {
        type: "string",
      },
      description: header.description,
      example: header.value || undefined,
    }));
}

/**
 * Convert request body to OpenAPI format
 */
export function convertRequestBody(
  request: RQAPI.HttpRequest,
): OpenAPIV3.RequestBodyObject | undefined {
  // Use request.contentType or infer from enabled Content-Type header
  let contentType =
    request.headers?.find((h) => h.key.toLowerCase() === "content-type")
      ?.value || request.contentType;

  if (!request.body && !request.bodyContainer) {
    return undefined;
  }

  const content: OpenAPIV3.RequestBodyObject["content"] = {};

  switch (contentType) {
    case RequestContentType.JSON: {
      let schema: OpenAPIV3.SchemaObject = { type: "object" };

      // Infer schema from body
      if (request.body && typeof request.body === "string") {
        try {
          const parsed = JSON.parse(request.body);
          schema = inferSchemaFromValue(parsed);
        } catch {
          // If parsing fails, keep generic object schema
        }
      }

      content["application/json"] = {
        schema,
      };
      break;
    }

    case RequestContentType.RAW:
    case RequestContentType.HTML:
    case RequestContentType.XML:
    case RequestContentType.JAVASCRIPT: {
      const mimeType = contentType || "text/plain";
      content[mimeType] = {
        schema: {
          type: "string",
        },
        example: typeof request.body === "string" ? request.body : undefined,
      };
      break;
    }

    case RequestContentType.FORM: {
      content["application/x-www-form-urlencoded"] = {
        schema: {
          type: "object",
          properties: {},
        },
      };

      if (Array.isArray(request.body)) {
        const properties: Record<string, OpenAPIV3.SchemaObject> = {};
        request.body.forEach((field) => {
          if (field.isEnabled) {
            properties[field.key] = {
              type: "string",
              example: field.value,
            };
          }
        });
        content["application/x-www-form-urlencoded"].schema = {
          type: "object",
          properties,
        };
      }
      break;
    }

    case RequestContentType.MULTIPART_FORM: {
      content["multipart/form-data"] = {
        schema: {
          type: "object",
          properties: {},
        },
      };

      if (Array.isArray(request.body)) {
        const properties: Record<string, OpenAPIV3.SchemaObject> = {};
        request.body.forEach((field) => {
          if (field.isEnabled) {
            // Check if it's a file field
            const isFile = Array.isArray(field.value);
            properties[field.key] = isFile
              ? {
                  type: "string",
                  format: "binary",
                }
              : {
                  type: "string",
                  example: field.value,
                };
          }
        });
        content["multipart/form-data"].schema = {
          type: "object",
          properties,
        };
      }
      break;
    }
  }

  return Object.keys(content).length > 0 ? { content } : undefined;
}

/**
 * Get authentication for a request (handles inheritance)
 */
export function getEffectiveAuth(
  record: RQAPI.ApiRecord,
  parentAuth?: RQAPI.Auth,
): RQAPI.Auth | undefined {
  const recordAuth = record.data.auth;

  if (!recordAuth) {
    return parentAuth;
  }

  // Check if it's inherited
  if (recordAuth.currentAuthType === Authorization.Type.INHERIT) {
    return parentAuth;
  }

  return recordAuth;
}

/**
 * Convert RQAPI auth to OpenAPI security scheme
 */
export function convertAuthToSecurityScheme(
  auth: RQAPI.Auth,
): { schemeName: string; scheme: OpenAPIV3.SecuritySchemeObject } | null {
  switch (auth.currentAuthType) {
    case Authorization.Type.BEARER_TOKEN: {
      const config = auth.authConfigStore[Authorization.Type.BEARER_TOKEN];
      return {
        schemeName: "bearerAuth",
        scheme: {
          type: "http",
          scheme: "bearer",
        },
      };
    }

    case Authorization.Type.BASIC_AUTH: {
      return {
        schemeName: "basicAuth",
        scheme: {
          type: "http",
          scheme: "basic",
        },
      };
    }

    case Authorization.Type.API_KEY: {
      const config = auth.authConfigStore[Authorization.Type.API_KEY];
      if (config?.key) {
        const sanitizedName = config.key.replace(/[^a-zA-Z0-9]/g, "_");
        const schemeName = `apiKey_${sanitizedName}`;
        return {
          schemeName,
          scheme: {
            type: "apiKey",
            name: config.key,
            in: config.addTo === "HEADER" ? "header" : "query",
          },
        };
      }
      return null;
    }

    default:
      return null;
  }
}
