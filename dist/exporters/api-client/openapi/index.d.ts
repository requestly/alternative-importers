import { RQAPI } from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
import { ProcessRequestResult } from "./types";
/**
 * Process a single API request and add it to OpenAPI paths
 */
export declare function processRequest(apiRecord: RQAPI.ApiRecord, parentAuth: RQAPI.Auth | undefined): ProcessRequestResult;
/**
 * Main export function to convert Requestly Collection to OpenAPI 3.0
 */
export declare function convertToOpenAPI(collection: RQAPI.CollectionRecord): OpenAPIV3.Document;
