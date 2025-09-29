import { ImportFile } from "../types";
import { OpenAPIV2 } from 'openapi-types';
import { parse as parseYaml } from 'yaml';
import { unthrowableParseJson } from "./utils";
import { RQAPI, RequestMethod, KeyValuePair, RequestContentType, Authorization } from "@requestly/shared/types/entities/apiClient";
import { PathGroupMap } from "./types";

const SwaggerParser = require("@apidevtools/swagger-parser");

const SUPPORTED_SWAGGER_SPEC_VERSION= /^2\.\d+\.\d+$/;

const preProcessSpecFile = async(specFile: ImportFile): Promise<OpenAPIV2.Document> => {
    return (unthrowableParseJson(specFile.content) || parseYaml(specFile.content));
}


const extractBaseUrl = (specData: OpenAPIV2.Document): string => {
    const host = specData.host || '';
    const basePath = specData.basePath || '';
    const schemes = specData.schemes || ['https'];
    const scheme = schemes[0] || 'https';
    
    return `${scheme}://${host}${basePath}`;
}

const getDescriptionFromTags = (tags: OpenAPIV2.TagObject[], basePath: string): string => {
    return tags.find(tag => tag.name === basePath.split('/')[1])?.description || "Collection for " + basePath + " endpoints";
}

const groupPaths = (specData: OpenAPIV2.Document): PathGroupMap => {
    const pathGroups: PathGroupMap = {};
    
    if (specData.paths) {
        Object.entries(specData.paths).forEach(([path, pathItem]) => {
            if (pathItem) {
                const collectionGroup = path.split('/').slice(0, 2).join('/');
                
                if (!pathGroups[collectionGroup]) {
                    pathGroups[collectionGroup] = [];
                }
                
                const methods = Object.keys(pathItem).filter(method => 
                    ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())
                );
                
                pathGroups[collectionGroup].push({ 
                    path,
                    methods: methods.map(m => m.toUpperCase())
                });
            }
        });
    }
    
    return pathGroups;
}

const createAuthConfig = (operation: OpenAPIV2.OperationObject, specData: OpenAPIV2.Document): RQAPI.Auth => {
    const createAuthConfigObject = (schemeData: OpenAPIV2.SecuritySchemeObject): RQAPI.Auth => {
        const type = schemeData.type;
        switch(type){
            case "apiKey":
                return {
                    currentAuthType: Authorization.Type.API_KEY,
                    authConfigStore: {}
                }
            case "basic":
                return {
                    currentAuthType: Authorization.Type.BASIC_AUTH,
                    authConfigStore: {}
                }
            case "oauth2":
                // For OAuth2, we'll default to Bearer token for simplicity
                return {
                    currentAuthType: Authorization.Type.BEARER_TOKEN,
                    authConfigStore: {}
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
        const schemeData = specData.securityDefinitions?.[key];
        if(schemeData && typeof schemeData === 'object' && 'type' in schemeData && 
           (schemeData.type === "basic" || schemeData.type === "apiKey" || schemeData.type === "oauth2")){
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

const prepareParameters = (parameters: (OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject)[] | undefined, parameterType: 'query' | 'header'): KeyValuePair[] => {
    if (!parameters) return [];
    const filteredParams: KeyValuePair[] = parameters.map((param: any, index: number) => {
        if (typeof param === 'object' && 'in' in param && param.in === parameterType) {
            return {
                id: index + 1,
                key: param.name || '',
                value: '',
                isEnabled: true,
            };
        }
        return undefined;
    }).filter(Boolean) as KeyValuePair[];
    return filteredParams;
}

// Extract content type and body from Swagger 2.0 operation parameters
const prepareRequestBody = (operation: OpenAPIV2.OperationObject): { contentType: RequestContentType; body: RQAPI.RequestBody | undefined } => {
    let contentType: RequestContentType = RequestContentType.JSON;
    let body: RQAPI.RequestBody | undefined;
    
    // In Swagger 2.0, request body is defined in parameters with 'in': 'body'
    const bodyParam = operation.parameters?.find((param: any) => 
        param && typeof param === 'object' && 'in' in param && param.in === 'body'
    ) as OpenAPIV2.ParameterObject;
    
    if (bodyParam && 'schema' in bodyParam && bodyParam.schema) {
        contentType = RequestContentType.JSON;
        body = JSON.stringify(bodyParam.schema, null, 2);
    } else {
        // Check for form data parameters
        const formDataParams = operation.parameters?.filter((param: any) => 
            param && typeof param === 'object' && 'in' in param && param.in === 'formData'
        );
        
        if (formDataParams && formDataParams.length > 0) {
            contentType = RequestContentType.MULTIPART_FORM;
            body = [];
        }
    }
    
    return { contentType, body };
}

const createApiRecord = (
    operation: OpenAPIV2.OperationObject,
    path: string,
    method: RequestMethod,
    specData: OpenAPIV2.Document
): RQAPI.ApiRecord => {
    const fullUrl = `{{base_url}}${path}`;
    
    const pathVariables: RQAPI.PathVariable[] = [];
    const pathVarMatches = path.match(/\{([^}]+)\}/g);
    if (pathVarMatches) {
        pathVarMatches.forEach((match, index) => {
            const pathVarName = match.slice(1, -1); // Remove { and }
            pathVariables.push({
                id: index + 1,
                key: pathVarName,
                value: '',
                description: ""
            });
        });
    }
    
    // Extract query parameters
    const queryParams: KeyValuePair[] = prepareParameters(operation.parameters, 'query');
    // Extract headers
    const headers: KeyValuePair[] = prepareParameters(operation.parameters, 'header');
    // Extract content type and body
    const { contentType, body } = prepareRequestBody(operation);
    
    const requestData: RQAPI.HttpRequest = {
        url: fullUrl,
        queryParams,
        method,
        pathVariables,
        headers,
        body,
        contentType,
        includeCredentials: false
    };
    
    // Create HTTP API entry
    const httpApiEntry: RQAPI.HttpApiEntry = {
        type: RQAPI.ApiEntryType.HTTP,
        request: requestData,
        response: null,
        testResults: [],
        scripts: {
            preRequest: '',
            postResponse: ''
        },
        auth: createAuthConfig(operation, specData)
    };

    // Create API record
    const apiRecord: RQAPI.ApiRecord = {
        id: "",
        name: `${method} ${path}`,
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

const parseSpecification = (specData: OpenAPIV2.Document): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();
    
    // Extract base URL
    const baseUrl = extractBaseUrl(specData);
    
    // Group paths by their base path
    const pathGroups = groupPaths(specData);
    
    // Create API records for each path group
    const childCollections: RQAPI.CollectionRecord[] = [];
    
    Object.entries(pathGroups).forEach(([basePath, paths]) => {
        const collectionName = basePath.split('/')[1];
        
        // Create API records for this collection
        const apiRecords: RQAPI.ApiRecord[] = [];
        
        paths.forEach(({ path, methods }) => {
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
        
        // Create collection for this path group
        const pathCollection: RQAPI.CollectionRecord = {
            id: "",
            name: collectionName,
            description: getDescriptionFromTags(specData.tags || [], basePath),
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
                children: apiRecords,
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
        
        childCollections.push(pathCollection);
    });
    
    // Create root collection
    const rootCollection: RQAPI.CollectionRecord = {
        id: "",
        name: specData.info?.title || 'Swagger Collection',
        description: specData.info?.description || 'Collection imported from Swagger 2.0 specification',
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
            children: childCollections,
            scripts: {
                preRequest: '',
                postResponse: ''
            },
            variables: {
                base_url: {
                    id: 1,
                    type: 'string' as any,
                    isPersisted: true,
                    syncValue: baseUrl
                }
            },
            auth: {
                currentAuthType: Authorization.Type.NO_AUTH,
                authConfigStore: {}
            }
        }
    };
    
    return rootCollection;
}

export const convert = async(specFile: ImportFile): Promise<RQAPI.CollectionRecord> => {
    let specData: OpenAPIV2.Document = await preProcessSpecFile(specFile);
    if(!specData || !SUPPORTED_SWAGGER_SPEC_VERSION.test(specData.swagger)){
        throw new Error("Invalid Swagger 2.0 specification");
    }
    try{
        specData = (await SwaggerParser.validate(specData, {
            dereference: {
                circular: "ignore"
            }
        })) as OpenAPIV2.Document;

        console.log("🔍 Swagger 2.0 Spec data:", specData);

        const collectionRecord = parseSpecification(specData);
        return collectionRecord;

    }catch(error){
        console.error("Error validating Swagger 2.0 spec file:", error);
        throw new Error("Invalid Swagger 2.0 specification");
    }
}
