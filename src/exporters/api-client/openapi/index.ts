import {
  RQAPI,
  Authorization,
  RequestMethod,
  RequestContentType,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { stringify as yamlStringify } from "yaml";



/**
 * Type representing a flattened record with hierarchy information
 */
interface FlattenedRecord {
  record: RQAPI.ApiClientRecord;
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
    if (!url.match(/^https?:\/\//)) {
      processedUrl = `http://${url}`;
    }

    const urlObj = new URL(processedUrl);
    const protocol = urlObj.protocol.replace(":", "");
    const host = urlObj.hostname + (urlObj.port ? `:${urlObj.port}` : "");
    const path = decodeURIComponent(urlObj.pathname);
    const queryString = urlObj.search.substring(1); // Remove '?'

    return { protocol, host, path, queryString };
  } catch {
    // If URL parsing fails (e.g., contains variables), do basic string parsing
    const protocolMatch = url.match(/^(https?):\/\//);
    const protocol = protocolMatch ? protocolMatch[1] : "https";

    const withoutProtocol = url.replace(/^https?:\/\//, "");
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
  const openApiPath = path.replace(/\{\{([^}]+)\}\}|:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, var1, var2) => {
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
  });

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
        type: param.dataType,
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
 * Convert request body to OpenAPI format
 */
function convertRequestBody(
  request: RQAPI.HttpRequest,
): OpenAPIV3.RequestBodyObject | undefined {
  const contentType = request.contentType;

  if (!request.body && !request.bodyContainer) {
    return undefined;
  }

  const content: OpenAPIV3.RequestBodyObject["content"] = {};

  switch (contentType) {
    case RequestContentType.JSON: {
      let schema: OpenAPIV3.SchemaObject = { type: "object" };

      // Try to infer schema from body
      if (request.body && typeof request.body === "string") {
        try {
          const parsed = JSON.parse(request.body);
          // For simplicity, just mark it as object type
          schema = { type: "object" };
        } catch {
          // If parsing fails, keep default
        }
      }

      content["application/json"] = {
        schema,
        example: request.body
          ? typeof request.body === "string"
            ? request.body
            : undefined
          : undefined,
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
      if (config) {
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
 * Flatten collection hierarchy to get all records with their parent auth
 */
function flattenCollection(
  collection: RQAPI.Collection,
  parentAuth?: RQAPI.Auth,
): FlattenedRecord[] {
  const result: FlattenedRecord[] = [];

  if (!collection.children) {
    return result;
  }

  for (const child of collection.children) {
    if (child.type === RQAPI.RecordType.COLLECTION) {
      // For collections, pass down auth and recurse
      const collectionAuth = child.data.auth || parentAuth;
      result.push({ record: child, parentAuth });
      result.push(...flattenCollection(child.data, collectionAuth));
    } else if (child.type === RQAPI.RecordType.API) {
      // For API records, just add with parent auth
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
  openApiDoc: OpenAPIV3.Document,
  pathsMap: Map<string, Set<string>>,
  serversSet: Set<string>,
  securitySchemesMap: Map<string, OpenAPIV3.SecuritySchemeObject>,
): void {
  const entry = apiRecord.data;

  // Skip GraphQL requests
  if (entry.type === RQAPI.ApiEntryType.GRAPHQL) {
    return;
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
    return;
  }
  methodsForPath.add(request.method);

  // Add server
  const serverUrl = `${protocol}://${host}`;
  serversSet.add(serverUrl);

  // Convert parameters
  const queryParams = convertQueryParameters(request.queryParams);
  const headerParams = convertHeaders(request.headers);
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

  // Add to paths
  if (!openApiDoc.paths) {
    openApiDoc.paths = {};
  }

  if (!openApiDoc.paths[openApiPath]) {
    openApiDoc.paths[openApiPath] = {};
  }

  const methodKey = request.method.toLowerCase() as Lowercase<RequestMethod>;
  openApiDoc.paths[openApiPath][methodKey] = operation;
}

/**
 * Main export function to convert Requestly Collection to OpenAPI 3.0
 */
export function convertToOpenAPI(
  collection: RQAPI.Collection,
): OpenAPIV3.Document {
  // Create base OpenAPI document
  const openApiDoc: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
      title: "Exported API Collection",
      description: "Exported from Requestly API Client",
      version: "1.0.0",
    },
    paths: {},
    servers: [],
    components: {
      securitySchemes: {},
    },
  };

  // Track paths, servers, and security schemes
  const pathsMap = new Map<string, Set<string>>();
  const serversSet = new Set<string>();
  const securitySchemesMap = new Map<string, OpenAPIV3.SecuritySchemeObject>();

  // Flatten collection and get all API records
  const flattenedRecords = flattenCollection(collection, collection.auth);

  // Process each API record
  for (const { record, parentAuth } of flattenedRecords) {
    if (record.type === RQAPI.RecordType.API) {
      processRequest(
        record,
        parentAuth,
        openApiDoc,
        pathsMap,
        serversSet,
        securitySchemesMap,
      );
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

interface OpenAPIExportResult {
  file: {
    fileName: string;
    content: Blob;
    type: string;
  }[];
  metadata: Array<{
    key: string;
    value: string[] | number | string;
  }>;
}

/**
 * Export function that takes a CollectionRecord and converts it to OpenAPI
 * Returns both JSON and YAML formats
 */
export function exportCollectionToOpenAPI(
  collectionRecord: RQAPI.CollectionRecord,
): OpenAPIExportResult {
  const openApiDoc = convertToOpenAPI(collectionRecord.data);

  // Use collection metadata for info
  if (collectionRecord.name) {
    openApiDoc.info.title = collectionRecord.name;
  }
  if (collectionRecord.description) {
    openApiDoc.info.description = collectionRecord.description;
  }

  // Generate sanitized filename from collection name
  const sanitizedName = collectionRecord.name.replace(/[^a-z0-9]/gi, "-");
  const baseFileName = sanitizedName || "openapi";

  // Create JSON version
  const jsonContent = JSON.stringify(openApiDoc, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: "application/json" });

  // Create YAML version
  const yamlContent = yamlStringify(openApiDoc);
  const yamlBlob = new Blob([yamlContent], { type: "application/x-yaml" });

  // Calculate metadata

  const pathCount = Object.keys(openApiDoc.paths || {}).length;
  const serverCount = openApiDoc.servers?.length || 0;
  const securitySchemeCount = Object.keys(
    openApiDoc.components?.securitySchemes || {},
  ).length;

  return {
    file: [
      {
        fileName: `${baseFileName}.json`,
        content: jsonBlob,
        type: "JSON",
      },
      {
        fileName: `${baseFileName}.yaml`,
        content: yamlBlob,
        type: "YAML",
      },
    ],
    metadata: [
      {
        key: "Paths",
        value: pathCount,
      },
      {
        key: "Servers",
        value: serverCount,
      },
      {
        key: "Security schemes",
        value: securitySchemeCount,
      },
    ],
  };
}
