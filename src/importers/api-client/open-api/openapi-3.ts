import { ImportFile } from "../types";
import { OpenAPIV3 } from 'openapi-types';
import { parse as parseYaml } from 'yaml';
import { unthrowableParseJson, getParamValue, getKeyValueDataTypeFromParam } from "./utils";
import { RQAPI,RequestMethod, KeyValuePair, RequestContentType, Authorization, EnvironmentVariables, EnvironmentData, EnvironmentVariableType, KeyValueDataType } from "@requestly/shared/types/entities/apiClient";
import { NestedCollectionMap } from "./types";
import { ApiClientImporterMethod } from "~/importers/types";

import SwaggerParser from "@apidevtools/swagger-parser";

const SUPPORTED_OPENAPI_SPEC_VERSION= /^3\.\d+\.\d+$/;

const preProcessSpecFile = async(specFile: ImportFile): Promise<OpenAPIV3.Document> => {
    return (unthrowableParseJson(specFile.content) || parseYaml(specFile.content));
}

const resolveServerUrlWithDefaultVariables = (server: OpenAPIV3.ServerObject): string => {
    const variables = server.variables || {};
    const url = server.url 

    return url.replace(/\{([^}]+)\}/g, (match, p1) => variables[p1]?.default || match);
}

const createServerVariables = (servers: OpenAPIV3.ServerObject[]): EnvironmentVariables => {
    const variables: Record<string, any> = {};
    
    if (!servers || servers.length === 0) {
        return variables;
    }
    
    servers.forEach((server, index) => {
        const variableName = index === 0 ? 'base_url' : `base_url${index + 1}`;
        variables[variableName] = {
            id: index + 1,
            isPersisted: true,
            type: EnvironmentVariableType.String,
            syncValue: resolveServerUrlWithDefaultVariables(server)
        };
    });
    
    return variables;
}

const getDescriptionFromTags = (tags: OpenAPIV3.TagObject[], basePath: string): string => {
    return tags.find(tag => tag.name === basePath.split('/')[1])?.description || "Collection for " + basePath + " endpoints";
}


const buildNestedCollections = (specData: OpenAPIV3.Document): NestedCollectionMap => {
    const collections: NestedCollectionMap = {};
    
    if (!specData.paths) {
        return collections;
    }
    
    Object.entries(specData.paths).forEach(([path, pathItem]) => {
        if (!pathItem) return;
        
        const pathSegments = path.split('/').filter(segment => segment !== '');
        const methods = Object.keys(pathItem).filter(method => 
            ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())
        );
        
        const pathGroup = {
            path,
            methods: methods.map(m => m.toUpperCase())
        };
        
        let currentLevel = collections;
        let currentPath = '';
        
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            const isParameter = segment.startsWith('{') && segment.endsWith('}');
            const collectionName = isParameter ? segment : segment;
            const fullPath = currentPath + '/' + segment;
            
            if (!currentLevel[collectionName]) {
                currentLevel[collectionName] = {
                    name: collectionName,
                    path: fullPath,
                    children: {},
                    requests: []
                };
            }
            
            if (i === pathSegments.length - 1) {
                currentLevel[collectionName].requests.push(pathGroup);
            } else {
                currentLevel = currentLevel[collectionName].children;
                currentPath = fullPath;
            }
        }
    });
    
    return collections;
}

const createAuthConfig = (operation: OpenAPIV3.OperationObject, specData: OpenAPIV3.Document): RQAPI.Auth => {
    const createAuthConfigObject = (schemeData: OpenAPIV3.SecuritySchemeObject): RQAPI.Auth => {
        const type = schemeData.type;
        switch(type){
            case "apiKey":
                return {
                    currentAuthType: Authorization.Type.API_KEY,
                    authConfigStore: {
                        [Authorization.Type.API_KEY]: {
                            key: schemeData.name,
                            value: "",
                            addTo: schemeData.in === "header" ?  "HEADER": "QUERY"
                        }
                    }
                }
            case "http":
                if(schemeData.scheme === "bearer"){
                    return {
                        currentAuthType: Authorization.Type.BEARER_TOKEN,
                        authConfigStore: {
                            [Authorization.Type.BEARER_TOKEN]: {
                                bearer: schemeData.bearerFormat || ""
                            }
                        }
                    }
                }
                else if(schemeData.scheme === "basic"){
                    return {
                        currentAuthType: Authorization.Type.BASIC_AUTH,
                        authConfigStore: {}
                    }
                }
            default:
                return {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                }
        }
    }  
        
    if(!operation.security){
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        }
    }

    let authConfig = null;
    for(const securityScheme of operation.security){
        const [key,] = Object.entries(securityScheme)[0];
        const schemeData = specData.components?.securitySchemes?.[key];
        if(schemeData && typeof schemeData === 'object' && 'type' in schemeData && (schemeData.type === "http" || schemeData.type === "apiKey")){
            authConfig = createAuthConfigObject(schemeData);
            break;
        }
        else continue;
    }

    if(!authConfig){
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        }
    }

    return authConfig;
}

export const prepareParameters = (parameters: OpenAPIV3.ParameterObject[] | undefined): { queryParams: KeyValuePair[], headers: KeyValuePair[], pathParams: RQAPI.PathVariable[] } => {
    if(!parameters) return { queryParams: [], headers: [], pathParams: [] };
    const queryParams: KeyValuePair[] = [];
    const headers: KeyValuePair[] = [];
    const pathParams: RQAPI.PathVariable[] = [];
    parameters.forEach((param: OpenAPIV3.ParameterObject, index: number) => {
        if(param.in === 'query'){
            queryParams.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if(param.in === 'header'){
            headers.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if(param.in === 'path'){
            pathParams.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
    });
    return { queryParams, headers, pathParams };
}


export const getRawRequestBody = (schema: OpenAPIV3.SchemaObject): string => {
    return schema.default ?? schema.example ?? "";
}

export const getUrlEncodedRequestBody = (schema: OpenAPIV3.SchemaObject): RQAPI.FormDataKeyValuePair[] => {
    const formData: RQAPI.FormDataKeyValuePair[] = [];
    
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property], index) => {
            if (property) {
                const propSchema = property as OpenAPIV3.SchemaObject;
                const value = propSchema.example ?? propSchema.default ?? '';
                
                formData.push({
                    id: index + 1,
                    key: key,
                    value: String(value),
                    isEnabled: true
                });
            }
        });
    }
    
    return formData;
}

export const getMultipartFormRequestBody = (schema: OpenAPIV3.SchemaObject): RQAPI.FormDataKeyValuePair[] => {
    const formData: RQAPI.FormDataKeyValuePair[] = [];
    
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property], index) => {
            if (property) {
                const propSchema = property as OpenAPIV3.SchemaObject;
                const value = propSchema.example ?? propSchema.default ?? '';
                
                formData.push({
                    id: index + 1,
                    key: key,
                    value: "",
                    isEnabled: true
                });
            }
        });
    }
    
    return formData;
}

const getJsonValue = (schema: OpenAPIV3.SchemaObject): any => {
    
    switch (schema.type) {
        case 'string':
            return schema.example ?? schema.default ?? '';
        case 'number':
        case 'integer':
            return schema.example ?? schema.default ?? 0;
        case 'boolean':
            return schema.example ?? schema.default ?? false;
        case 'array':
            if (schema.example !== undefined) {
                return schema.example;
            }
            if (schema.default !== undefined) {
                return schema.default;
            }
            if (schema.items) {
                const itemsSchema = schema.items as OpenAPIV3.SchemaObject;
                return [getJsonValue(itemsSchema)];
            }
            return [];
        case 'object':
            if (schema.properties) {
                const obj: Record<string, any> = {};
                Object.entries(schema.properties).forEach(([key, property]) => {
                    if (property) {
                        const propSchema = property as OpenAPIV3.SchemaObject;
                        obj[key] = getJsonValue(propSchema);
                    }
                });
                return obj;
            }
            return {};
        default:
            return null;
    }
}

export const getJsonRequestBody = (schema: OpenAPIV3.SchemaObject): string => {
    const json: Record<string, any> = {};
    
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property]) => {
            if (property) {
                const propSchema = property as OpenAPIV3.SchemaObject;
                json[key] = getJsonValue(propSchema);
            }
        });
    }
    
    return JSON.stringify(json, null, 2);
}



const getRawTextFromSchema = (schema: OpenAPIV3.SchemaObject): string => {
    return schema.example ?? schema.default ?? '';
}

export const prepareRequestBody = (operation: OpenAPIV3.OperationObject): { contentType: RequestContentType; bodyContainer: RQAPI.RequestBodyContainer; body: RQAPI.RequestBody | null } => {
    const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
    let body :RQAPI.RequestBody | null = null;
    const bodyContainer: RQAPI.RequestBodyContainer = {
        text: '',
        form: [],
        multipartForm: []
    };
    let contentType: RequestContentType | null = null;
    
    if (!requestBody?.content) {
        return { contentType: RequestContentType.RAW, bodyContainer, body: null };
    }
    
    const content = requestBody.content;

    if(content[RequestContentType.RAW]){
        contentType = RequestContentType.RAW;
        const parsedBody = getRawTextFromSchema(content[RequestContentType.RAW].schema as OpenAPIV3.SchemaObject);
        bodyContainer.text = parsedBody;
        body = parsedBody;
    }
    
    if (content[RequestContentType.JSON]) {
        contentType = RequestContentType.JSON;
        const parsedBody = getJsonRequestBody(content[RequestContentType.JSON].schema as OpenAPIV3.SchemaObject);
        bodyContainer.text = parsedBody;
        body = parsedBody;
        
    }
    
    if (content[RequestContentType.FORM]) {
        contentType = RequestContentType.FORM;
        const parsedBody = getUrlEncodedRequestBody(content[RequestContentType.FORM].schema as OpenAPIV3.SchemaObject);
        bodyContainer.form = parsedBody;
        body = parsedBody;
    }
    
    if (content[RequestContentType.MULTIPART_FORM]) {
        contentType = RequestContentType.MULTIPART_FORM;
        const parsedBody = getMultipartFormRequestBody(content[RequestContentType.MULTIPART_FORM].schema as OpenAPIV3.SchemaObject);
        bodyContainer.multipartForm = parsedBody;
        bodyContainer.multipartForm = getMultipartFormRequestBody(content[RequestContentType.MULTIPART_FORM].schema as OpenAPIV3.SchemaObject);
        body = parsedBody;
    }
    

    
    return { contentType: contentType || RequestContentType.RAW, bodyContainer, body };
}

const createApiRecord = (
    operation: OpenAPIV3.OperationObject,
    path: string,
    method: RequestMethod,
    specData: OpenAPIV3.Document
): RQAPI.ApiRecord => {
    console.log("Creating API record for operation:", operation);
    const resolvedPath = path.replace(/\{([^}]+)\}/g, ':$1');
    const fullUrl = `{{base_url}}${resolvedPath}`;
    
    const {queryParams, headers, pathParams} = prepareParameters(operation.parameters as OpenAPIV3.ParameterObject[]);
    
    const pathVariables: RQAPI.PathVariable[] = [];
    const pathVarMatches = path.match(/\{([^}]+)\}/g);
    if (pathVarMatches) {
        pathVarMatches.forEach((match, index) => {
            const pathVarName = match.slice(1, -1); // Remove { and }
            pathVariables.push({
                id: index + 1,
                key: pathVarName,
                value: pathParams.find(param => param.key === pathVarName)?.value || '',
                description: pathParams.find(param => param.key === pathVarName)?.description || "",
                dataType: pathParams.find(param => param.key === pathVarName)?.dataType || KeyValueDataType.STRING,
            });
        });
    }
    
    const { contentType, bodyContainer, body } = prepareRequestBody(operation);
    
    const httpRequest: RQAPI.HttpRequest = {
        url: fullUrl,
        queryParams,
        method,
        pathVariables,
        headers,
        /*
        TODO: fix this
        Accoring to our types we allow undefiend values for body, but this will cause issues whhen
        saving the record in firestore DB because it firebase does not allow undefiend values in documents.
        We need to fix this by adding a default value for body in the types or giving a null value to body
        */
        // @ts-ignore
        body,
        bodyContainer,
        contentType,
        includeCredentials: false
    };
    
    const httpApiEntry: RQAPI.HttpApiEntry = {
        type: RQAPI.ApiEntryType.HTTP,
        request: httpRequest,
        response: null,
        testResults: [],
        scripts: {
            preRequest: '',
            postResponse: ''
        },
        auth: createAuthConfig(operation, specData)
    };

    const apiRecord: RQAPI.ApiRecord = {
        id: "",
        name: operation.summary || `${path}`,
        description: operation.description || '',
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: Date.now(),
        updatedTs: Date.now(),
        type: RQAPI.RecordType.API,
        data: httpApiEntry
    };
    
    return apiRecord;
}

const convertNestedCollectionToRQAPI = (
    collection: NestedCollectionMap,
    specData: OpenAPIV3.Document,
    currentTimestamp: number
): RQAPI.CollectionRecord[] => {
    const result: RQAPI.CollectionRecord[] = [];
    
    Object.values(collection).forEach(nestedCollection => {
        const apiRecords: RQAPI.ApiRecord[] = [];
        
        // Add requests from this collection
        nestedCollection.requests.forEach(({ path, methods }) => {
            methods.forEach(method => {
                const operation = (specData.paths?.[path] as any)?.[method.toLowerCase()];
                if (operation) {
                    const apiRecord = createApiRecord(
                        operation,
                        path,
                        method as RequestMethod,
                        specData
                    );
                    apiRecords.push(apiRecord);
                }
            });
        });
        
        // Recursively convert child collections
        const childCollections = convertNestedCollectionToRQAPI(
            nestedCollection.children,
            specData,
            currentTimestamp
        );
        
        const collectionRecord: RQAPI.CollectionRecord = {
            id: "",
            name: nestedCollection.name,
            description: getDescriptionFromTags(specData.tags || [], nestedCollection.path),
            collectionId: "",
            isExample: false,
            ownerId: '',
            deleted: false,
            createdBy: '',
            updatedBy: '',
            createdTs: currentTimestamp,
            updatedTs: currentTimestamp,
            type: RQAPI.RecordType.COLLECTION,
            data: {
                children: [...apiRecords, ...childCollections],
                scripts: {
                    preRequest: '',
                    postResponse: ''
                },
                variables: {},
                auth: {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                }
            }
        };
        
        result.push(collectionRecord);
    });
    
    return result;
};

const parseSpecification = (specData: OpenAPIV3.Document): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();
    
    const rootServers = specData.servers || [];
    const rootServerVariables = createServerVariables(rootServers);
    
    const collections = buildNestedCollections(specData);
    const subCollections = convertNestedCollectionToRQAPI(collections, specData, currentTimestamp);
    
    const rootCollection: RQAPI.CollectionRecord = {
        id: "",
        name: specData.info?.title || 'OpenAPI Collection',
        description: specData.info?.description || 'Collection imported from OpenAPI specification',
        collectionId: "",
        isExample: false,
        ownerId: '',
        deleted: false,
        createdBy: '',
        updatedBy: '',
        createdTs: currentTimestamp,
        updatedTs: currentTimestamp,
        type: RQAPI.RecordType.COLLECTION,
        data: {
            children: subCollections,
            scripts: {
                preRequest: '',
                postResponse: ''
            },
            variables: rootServerVariables,
            auth: {
                currentAuthType: Authorization.Type.NO_AUTH,
                authConfigStore: {}
            }
        }
    };
    
    return rootCollection;
}

const createServerEnvironment = (server: OpenAPIV3.ServerObject, index: number, title: string): EnvironmentData => {
    return {
        id:"",
        name: `${title} ${index > 0 ? `(${index + 1})` : ''}`,
        variables: createServerVariables([server]),
    }
}

const parseServerEnvironments = (servers: OpenAPIV3.ServerObject[] | undefined, title: string): EnvironmentData[] => {
  if(!servers || servers.length === 0) return [];
  return servers.map((server, index)=> createServerEnvironment(server, index, title))
}


export const convert: ApiClientImporterMethod<ImportFile> = async(specFile: ImportFile) => {
    let specData: OpenAPIV3.Document = await preProcessSpecFile(specFile);
    
    if(!specData || !SUPPORTED_OPENAPI_SPEC_VERSION.test(specData.openapi)){
        throw new Error("Invalid OpenAPI specification");
    }
    try{
        specData  = (await SwaggerParser.validate(specData,{
            dereference: {
                circular: "ignore"
            },
            validate: {
                schema: false,
                spec: true    
            }
        })) as OpenAPIV3.Document;

        console.log("Spec data:", specData);

        const environments = parseServerEnvironments(specData.servers, specData.info.title);
        const collectionRecord = parseSpecification(specData);
        return {
            data: {
                collection: collectionRecord,
                environments
            }
        };

    }catch(error){
        console.error("Error validating spec file:", error);
        throw new Error("Invalid OpenAPI specification");
    }
}