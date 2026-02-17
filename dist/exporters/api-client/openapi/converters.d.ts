import { RQAPI } from "@requestly/shared/types/entities/apiClient";
import type { OpenAPIV3 } from "openapi-types";
/**
 * Convert path with {{variable}} to OpenAPI path with {variable}
 * Also extracts path parameters
 */
export declare function convertPathVariables(path: string, pathVariables?: RQAPI.PathVariable[]): {
    openApiPath: string;
    parameters: OpenAPIV3.ParameterObject[];
};
/**
 * Convert query parameters to OpenAPI format
 */
export declare function convertQueryParameters(queryParams: RQAPI.HttpRequest["queryParams"]): OpenAPIV3.ParameterObject[];
/**
 * Convert headers to OpenAPI format
 * Skips common headers that are typically handled by the client
 */
export declare function convertHeaders(headers: RQAPI.HttpRequest["headers"]): OpenAPIV3.ParameterObject[];
/**
 * Convert request body to OpenAPI format
 */
export declare function convertRequestBody(request: RQAPI.HttpRequest): OpenAPIV3.RequestBodyObject | undefined;
/**
 * Get authentication for a request (handles inheritance)
 */
export declare function getEffectiveAuth(record: RQAPI.ApiRecord, parentAuth?: RQAPI.Auth): RQAPI.Auth | undefined;
/**
 * Convert RQAPI auth to OpenAPI security scheme
 */
export declare function convertAuthToSecurityScheme(auth: RQAPI.Auth): {
    schemeName: string;
    scheme: OpenAPIV3.SecuritySchemeObject;
} | null;
