import {
  RQAPI,
  Authorization,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { ExtractedApiRecord } from "./types";

/**
 * Parse URL into components
 */
export function parseUrl(url: string): {
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
 * Infer OpenAPI schema from a parsed JSON value
 */
export function inferSchemaFromValue(value: unknown): OpenAPIV3.SchemaObject {
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
 * Extract all API records from collection hierarchy with their inherited auth
 */
export function extractApiRecords(
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
