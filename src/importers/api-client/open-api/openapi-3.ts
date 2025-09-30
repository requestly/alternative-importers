import { ImportFile } from "../types";
import { OpenAPIV3 } from 'openapi-types';
import { parse as parseYaml } from 'yaml';
import { unthrowableParseJson } from "./utils";
import { RQAPI,RequestMethod, KeyValuePair, RequestContentType, Authorization, EnvironmentVariables, EnvironmentData } from "@requestly/shared/types/entities/apiClient";
import { PathGroupMap } from "./types";
import { ApiClientImporterMethod } from "~/importers/types";

const SwaggerParser = require("@apidevtools/swagger-parser");

const SUPPORTED_OPENAPI_SPEC_VERSION= /^3\.\d+\.\d+$/;

const preProcessSpecFile = async(specFile: ImportFile): Promise<OpenAPIV3.Document> => {
    return (unthrowableParseJson(specFile.content) || parseYaml(specFile.content));
}

const resolveServerUrlWithDefaultVariables = (server: OpenAPIV3.ServerObject): string => {
    const variables = server.variables || {};
    const url = server.url 

    return url.replace(/\{([^}]+)\}/g, (match, p1) => variables[p1]?.default || match);
}

// Create collection variables from server objects
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
            syncValue: resolveServerUrlWithDefaultVariables(server)
        };
    });
    
    return variables;
}

const getDescriptionFromTags = (tags: OpenAPIV3.TagObject[], basePath: string): string => {
    return tags.find(tag => tag.name === basePath.split('/')[1])?.description || "Collection for " + basePath + " endpoints";
}


// group paths by their base path
const groupPaths = (specData: OpenAPIV3.Document): PathGroupMap => {
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

// create auth configuration
const createAuthConfig = (operation: OpenAPIV3.OperationObject, specData: OpenAPIV3.Document): RQAPI.Auth => {
    const createAuthConfigObject = (schemeData: OpenAPIV3.SecuritySchemeObject): RQAPI.Auth => {
        const type = schemeData.type;
        switch(type){
            case "apiKey":
                return {
                    currentAuthType: Authorization.Type.API_KEY,
                    authConfigStore: {}
                }
            case "http":
                if(schemeData.scheme === "bearer"){
                    return {
                        currentAuthType: Authorization.Type.BEARER_TOKEN,
                        authConfigStore: {}
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

const prepareParameters = (parameters: (OpenAPIV3.ParameterObject| OpenAPIV3.ReferenceObject)[] | undefined, parameterType: 'query' | 'header'): KeyValuePair[] => {
    if(!parameters) return [];
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

// Extract content type and body from OpenAPI operation request body
const prepareRequestBody = (operation: OpenAPIV3.OperationObject): { contentType: RequestContentType; body: RQAPI.RequestBody | undefined } => {
    let contentType: RequestContentType = RequestContentType.JSON;
    let body: RQAPI.RequestBody | undefined;
    
    if (operation.requestBody && typeof operation.requestBody === 'object' && 'content' in operation.requestBody) {
        const content = operation.requestBody.content;
        if (content['application/json']) {
            contentType = RequestContentType.JSON;
            body = JSON.stringify(content['application/json'].schema || {}, null, 2);
        } else if (content['application/x-www-form-urlencoded']) {
            contentType = RequestContentType.FORM;
            body = [];
        } else if (content['multipart/form-data']) {
            contentType = RequestContentType.MULTIPART_FORM;
            body = [];
        } else if (content['text/plain']) {
            contentType = RequestContentType.RAW;
            body = '';
        }
    }
    
    return { contentType, body };
}

// Helper function to create API records
const createApiRecord = (
    operation: OpenAPIV3.OperationObject,
    path: string,
    method: RequestMethod,
    specData: OpenAPIV3.Document
): RQAPI.ApiRecord => {
    const resolvedPath = path.replace(/\{([^}]+)\}/g, ':$1');
    const fullUrl = `{{base_url}}${resolvedPath}`;
    
    // Extract path variables
    const pathVariables: RQAPI.PathVariable[] = [];
    const pathVarMatches = path.match(/\{([^}]+)\}/g);
    if (pathVarMatches) {
        pathVarMatches.forEach((match, index) => {
            const pathVarName = match.slice(1, -1); // Remove { and }
            pathVariables.push({
                id: index + 1,
                key: pathVarName,
                value: '',
                description:""
            });
        });
    }
    
    // Extract query parameters
    const queryParams: KeyValuePair[] = prepareParameters(operation.parameters, 'query');
    // Extract headers
    const headers: KeyValuePair[] = prepareParameters(operation.parameters, 'header');
    // Extract content type and body
    const { contentType, body } = prepareRequestBody(operation);
    
    // Create HTTP request
    const httpRequest: RQAPI.HttpRequest = {
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
        request: httpRequest,
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

const parseSpecification = (specData: OpenAPIV3.Document): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();
    
    // Extract root-level servers
    const rootServers = specData.servers || [];
    const rootServerVariables = createServerVariables(rootServers);
    
    // Group paths by their base path
    const pathGroups = groupPaths(specData);
    
    // Create API records for each path group
    const childCollections: RQAPI.CollectionRecord[] = [];
    
    Object.entries(pathGroups).forEach(([basePath, paths]) => {
        const collectionName = basePath.split('/')[1];
        
        // Extract servers for this specific path group
        const pathGroupServers = specData.paths?.[basePath]?.servers || [];
        const pathServerVariables = pathGroupServers.length > 0 
            ? createServerVariables(pathGroupServers)
            : {}
        
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
                variables: pathServerVariables,
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
            children: childCollections,
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