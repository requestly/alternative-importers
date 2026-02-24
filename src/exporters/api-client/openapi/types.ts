import {
  RQAPI,
} from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";

/**
 * Headers that are skipped during OpenAPI export
 */
export const SKIP_HEADERS = [
  "host",
  "content-length",
  "content-type",
  "accept",
  "user-agent",
  "connection",
];

/**
 * Type representing an extracted API record with its inherited auth
 */
export interface ExtractedApiRecord {
  record: RQAPI.ApiRecord;
  parentAuth?: RQAPI.Auth;
}

/**
 * Type representing the result of processing a request
 */
export interface ProcessRequestResult {
  serverUrl: string;
  paths: OpenAPIV3.PathsObject;
  openApiPath: string;
  securityScheme?: { schemeName: string; scheme: OpenAPIV3.SecuritySchemeObject };
}
