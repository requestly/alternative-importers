import {
  RQAPI,
  Authorization,
  RequestMethod,
  RequestContentType,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { stringify as yamlStringify } from "yaml";

/**
 * Type representing an extracted API record with its inherited auth
 */
interface ExtractedApiRecord {
  record: RQAPI.ApiRecord;
  parentAuth?: RQAPI.Auth;
}

/**
 * Parse URL into components
 */
function parseUrl(url: string): {
  protocol: string;
  host: string;
  path: string;
  queryString: string;
} {
  try {
    // If URL doesn't have protocol, add a temporary one for parsing
    let processedUrl = url;
    if (!url.match(/^[^:]+(?=:\/\/)/)) {
      processedUrl = `http://${url}`;
    }

    const urlObj = new URL(processedUrl);
    const protocol = urlObj.protocol.replace(":", "");
    const host = urlObj.hostname + (urlObj.port ? `:${urlObj.port}` : "");
    let path: string;
    try {
      path = decodeURIComponent(urlObj.pathname);
    } catch {
      path = urlObj.pathname;
    }
    const queryString = urlObj.search.substring(1); // Remove '?'

    return { protocol, host, path, queryString };
  } catch {
    // If URL parsing fails (e.g., contains variables), do basic string parsing
    // match everything before :// as protocol
    const protocolMatch = url.match(/^[^:]+(?=:\/\/)/);
    const protocol = protocolMatch ? protocolMatch[0] : "https";

    const withoutProtocol = url.replace(/.*:\/\//, "");
    const [hostAndPath, queryString = ""] = withoutProtocol.split("?");
    const [host, ...pathParts] = hostAndPath.split("/");
    const path = "/" + pathParts.join("/");

    return { protocol, host, path, queryString };
  }
}

/**
 * Convert path with {{variable}} to OpenAPI path with {variable}
 * Also extracts path parameters
 */
function convertPathVariables(
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
function convertQueryParameters(
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
function convertHeaders(
  headers: RQAPI.HttpRequest["headers"],
): OpenAPIV3.ParameterObject[] {
  const skipHeaders = new Set([
    "host",
    "content-length",
    "content-type",
    "accept",
    "user-agent",
    "connection",
  ]);

  return headers
    .filter(
      (header) =>
        header.isEnabled && !skipHeaders.has(header.key.toLowerCase()),
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
 * Infer OpenAPI schema from a parsed JSON value
 */
function inferSchemaFromValue(value: unknown): OpenAPIV3.SchemaObject {
  if (value === null) {
    return { type: "string", nullable: true };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: "array", items: {} };
    }
    // Infer schema from first item
    return {
      type: "array",
      items: inferSchemaFromValue(value[0]),
    };
  }

  const type = typeof value;

  if (type === "object") {
    const properties: Record<string, OpenAPIV3.SchemaObject> = {};
    for (const key in value as Record<string, unknown>) {
      properties[key] = inferSchemaFromValue(
        (value as Record<string, unknown>)[key],
      );
    }
    return {
      type: "object",
      properties,
    };
  }

  if (type === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" };
  }

  if (type === "boolean") {
    return { type: "boolean" };
  }

  // Default to string
  return { type: "string" };
}

/**
 * Convert request body to OpenAPI format
 */
function convertRequestBody(
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
function getEffectiveAuth(
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
function convertAuthToSecurityScheme(
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

/**
 * Extract all API records from collection hierarchy with their inherited auth
 */
function extractApiRecords(
  collection: RQAPI.Collection,
  parentAuth?: RQAPI.Auth,
): ExtractedApiRecord[] {
  const result: ExtractedApiRecord[] = [];

  if (!collection.children) {
    return result;
  }

  for (const child of collection.children) {
    if (child.type === RQAPI.RecordType.COLLECTION) {
      // For collections, pass down auth and recurse
      const childAuth = child.data.auth;
      const collectionAuth =
        !childAuth || childAuth.currentAuthType === Authorization.Type.INHERIT
          ? parentAuth
          : childAuth;

      result.push(...extractApiRecords(child.data, collectionAuth));
    } else if (child.type === RQAPI.RecordType.API) {
      // Add API records with parent auth
      result.push({ record: child, parentAuth });
    }
  }

  return result;
}

/**
 * Process a single API request and add it to OpenAPI paths
 */
function processRequest(
  apiRecord: RQAPI.ApiRecord,
  parentAuth: RQAPI.Auth | undefined,
  pathsMap: Map<string, Set<string>>,
  serversSet: Set<string>,
  securitySchemesMap: Map<string, OpenAPIV3.SecuritySchemeObject>,
): OpenAPIV3.PathsObject {
  const entry = apiRecord.data;

  // Skip GraphQL requests
  if (entry.type === RQAPI.ApiEntryType.GRAPHQL) {
    return {};
  }

  const request = entry.request;
  const { protocol, host, path } = parseUrl(request.url);

  // Convert path variables
  const { openApiPath, parameters: pathParams } = convertPathVariables(
    path,
    request.pathVariables,
  );

  // Check for duplicate path + method
  const pathKey = `${openApiPath}|${request.method}`;
  if (!pathsMap.has(openApiPath)) {
    pathsMap.set(openApiPath, new Set());
  }

  const methodsForPath = pathsMap.get(openApiPath)!;
  if (methodsForPath.has(request.method)) {
    // Skip duplicate
    return {};
  }
  methodsForPath.add(request.method);

  // Add server
  const serverUrl = `${protocol}://${host}`;
  serversSet.add(serverUrl);

  // Convert parameters
  const queryParams = request.queryParams
    ? convertQueryParameters(request.queryParams)
    : [];
  const headerParams = request.headers ? convertHeaders(request.headers) : [];
  const allParameters = [...pathParams, ...queryParams, ...headerParams];

  // Convert request body
  const requestBody = convertRequestBody(request);

  // Handle authentication
  const effectiveAuth = getEffectiveAuth(apiRecord, parentAuth);
  let security: OpenAPIV3.SecurityRequirementObject[] | undefined;

  if (effectiveAuth) {
    const authScheme = convertAuthToSecurityScheme(effectiveAuth);
    if (authScheme) {
      securitySchemesMap.set(authScheme.schemeName, authScheme.scheme);
      security = [{ [authScheme.schemeName]: [] }];
    }
  }

  // Create operation object
  const operation: OpenAPIV3.OperationObject = {
    summary: apiRecord.name,
    description: apiRecord.description,
    parameters: allParameters.length > 0 ? allParameters : undefined,
    requestBody,
    responses: {
      "200": {
        description: "Successful response",
      },
    },
    security,
  };

  const result: OpenAPIV3.PathsObject = {};

  if (!result[openApiPath]) {
    result[openApiPath] = {};
  }

  const methodKey = request.method.toLowerCase() as Lowercase<RequestMethod>;
  result[openApiPath][methodKey] = operation;
  return result;
}

/**
 * Main export function to convert Requestly Collection to OpenAPI 3.0
 */
export function convertToOpenAPI(
  collection: RQAPI.CollectionRecord,
): OpenAPIV3.Document {
  // Create base OpenAPI document
  const openApiDoc: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
      title: collection.name || "Exported API Collection",
      description:
        collection.description || "Exported from Requestly API Client",
      version: "1.0.0",
    },
    paths: {},
    servers: [],
    components: {
      securitySchemes: {},
    },
  };

  const collectionData = collection.data;

  // Track paths, servers, and security schemes
  const pathsMap = new Map<string, Set<string>>();
  const serversSet = new Set<string>();
  const securitySchemesMap = new Map<string, OpenAPIV3.SecuritySchemeObject>();

  // Extract all API records from the collection hierarchy
  const apiRecords = extractApiRecords(collectionData, collectionData.auth);

  // Process each API record
  for (const { record, parentAuth } of apiRecords) {
    const result = processRequest(
      record,
      parentAuth,
      pathsMap,
      serversSet,
      securitySchemesMap,
    );

    // Merge paths properly and avoid overwriting methods
    for (const [path, methods] of Object.entries(result)) {
      if (!openApiDoc.paths[path]) {
        openApiDoc.paths[path] = {};
      }
      openApiDoc.paths[path] = {
        ...openApiDoc.paths[path],
        ...methods,
      };
    }
  }

  // Add servers to document
  openApiDoc.servers = Array.from(serversSet).map((url) => ({ url }));

  // Add security schemes to document
  if (securitySchemesMap.size > 0) {
    openApiDoc.components = {
      securitySchemes: Object.fromEntries(securitySchemesMap),
    };
  } else {
    // Remove empty components
    delete openApiDoc.components;
  }

  return openApiDoc;
}
