import { RQAPI } from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { ExtractedApiRecord } from "./types";
/**
 * Parse URL into components
 */
export declare function parseUrl(url: string): {
    protocol: string;
    host: string;
    path: string;
    queryString: string;
};
/**
 * Infer OpenAPI schema from a parsed JSON value
 */
export declare function inferSchemaFromValue(value: unknown): OpenAPIV3.SchemaObject;
/**
 * Extract all API records from collection hierarchy with their inherited auth
 */
export declare function extractApiRecords(collection: RQAPI.Collection, parentAuth?: RQAPI.Auth): ExtractedApiRecord[];
