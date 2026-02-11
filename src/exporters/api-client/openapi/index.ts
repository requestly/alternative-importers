import {
  RQAPI,
  RequestMethod,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { ProcessRequestResult } from "./types";
import { parseUrl, extractApiRecords } from "./utils";
import {
  convertPathVariables,
  convertQueryParameters,
  convertHeaders,
  convertRequestBody,
  getEffectiveAuth,
  convertAuthToSecurityScheme,
} from "./converters";

/**
 * Process a single API request and add it to OpenAPI paths
 */
export function processRequest(
  apiRecord: RQAPI.ApiRecord,
  parentAuth: RQAPI.Auth | undefined,
): ProcessRequestResult {
  const entry = apiRecord.data;

  if (entry.type === RQAPI.ApiEntryType.GRAPHQL) {
    return { serverUrl: "", paths: {}, openApiPath: "" };
  }

  const request = entry.request;
  const { protocol, host, path } = parseUrl(request.url);

  // Convert path variables
  const { openApiPath, parameters: pathParams } = convertPathVariables(
    path,
    request.pathVariables,
  );

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
  let securityScheme: { schemeName: string; scheme: OpenAPIV3.SecuritySchemeObject } | undefined;

  if (effectiveAuth) {
    const authScheme = convertAuthToSecurityScheme(effectiveAuth);
    if (authScheme) {
      securityScheme = authScheme;
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
  const serverUrl = `${protocol}://${host}`;
  const result: ProcessRequestResult = {
    serverUrl,
    paths: {},
    openApiPath,
    securityScheme,
  };

  if (!result.paths[openApiPath]) {
    result.paths[openApiPath] = {};
  }

  const methodKey = request.method.toLowerCase() as Lowercase<RequestMethod>;
  result.paths[openApiPath][methodKey] = operation;
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
    // Skip GraphQL requests
    if (record.data.type === RQAPI.ApiEntryType.GRAPHQL) {
      continue;
    }

    const result = processRequest(record, parentAuth);

    // Add security scheme if present
    if (result.securityScheme) {
      securitySchemesMap.set(
        result.securityScheme.schemeName,
        result.securityScheme.scheme,
      );
    }

    const entry = record.data;
    const request = entry.request;
    // Check for duplicate path + method
    if (!pathsMap.has(result.openApiPath)) {
      pathsMap.set(result.openApiPath, new Set());
    }

    const methodsForPath = pathsMap.get(result.openApiPath)!;
    if (methodsForPath.has(request.method)) {
      // Skip duplicate
      continue;
    }
    methodsForPath.add(request.method);
    // Merge paths properly and avoid overwriting methods
    for (const [path, methods] of Object.entries(result.paths)) {
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
