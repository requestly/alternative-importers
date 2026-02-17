import { ImportFile } from "../types";
import { OpenAPIV3 } from 'openapi-types';
import { RQAPI, KeyValuePair, RequestContentType } from "@requestly/shared/types/entities/apiClient";
import { ApiClientImporterMethod } from "~/importers/types";
export declare const prepareParameters: (parameters: OpenAPIV3.ParameterObject[] | undefined) => {
    queryParams: KeyValuePair[];
    headers: KeyValuePair[];
    pathParams: RQAPI.PathVariable[];
};
export declare const getRawRequestBody: (schema: OpenAPIV3.SchemaObject) => string;
export declare const getUrlEncodedRequestBody: (schema: OpenAPIV3.SchemaObject) => RQAPI.FormDataKeyValuePair[];
export declare const getMultipartFormRequestBody: (schema: OpenAPIV3.SchemaObject) => RQAPI.FormDataKeyValuePair[];
export declare const getJsonRequestBody: (schema: OpenAPIV3.SchemaObject) => string;
export declare const prepareRequestBody: (operation: OpenAPIV3.OperationObject) => {
    contentType: RequestContentType;
    bodyContainer: RQAPI.RequestBodyContainer;
    body: RQAPI.RequestBody | null;
};
export declare const convert: ApiClientImporterMethod<ImportFile>;
