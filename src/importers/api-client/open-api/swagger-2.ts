import { ImportFile } from "../types";
import { OpenAPIV2 } from 'openapi-types';
import { parse as parseYaml } from 'yaml';
import { unthrowableParseJson, getParamValue, getKeyValueDataTypeFromParam } from "./utils";
import { RQAPI, RequestMethod, KeyValuePair, RequestContentType, Authorization } from "@requestly/shared/types/entities/apiClient";
import { NestedCollectionMap } from "./types";
import { ApiClientImporterMethod } from "~/importers/types";
import SwaggerParser from "@apidevtools/swagger-parser";

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

const buildNestedCollections = (specData: OpenAPIV2.Document): NestedCollectionMap => {
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

const prepareParameters = (parameters:OpenAPIV2.ParameterObject[]): { queryParams: KeyValuePair[], headers: KeyValuePair[], pathParams: RQAPI.PathVariable[] } => {
    if (!parameters) return { queryParams: [], headers: [], pathParams: [] };
    const queryParams: KeyValuePair[] = [];
    const headers: KeyValuePair[] = [];
    const pathParams: RQAPI.PathVariable[] = [];
    
    parameters.forEach((param: OpenAPIV2.ParameterObject, index: number) => {
        if(param.in === 'query'){
            queryParams.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if(param.in === 'header'){
            headers.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if(param.in === 'path'){
            pathParams.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                description: param.description || "",
            });
        }
    });
    return { queryParams, headers, pathParams };
}

const prepareRequestBody = (operation: OpenAPIV2.OperationObject): { contentType: RequestContentType; body: RQAPI.RequestBody | null } => {
    let contentType: RequestContentType = RequestContentType.JSON;
    let body: RQAPI.RequestBody | null = null;
    
    const bodyParam = operation.parameters?.find((param: any) => 
        param && typeof param === 'object' && 'in' in param && param.in === 'body'
    ) as OpenAPIV2.ParameterObject;
    
    if (bodyParam && 'schema' in bodyParam && bodyParam.schema) {
        contentType = RequestContentType.JSON;
        body = JSON.stringify(bodyParam.schema, null, 2);
    } else {
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

    const {queryParams, headers, pathParams} = prepareParameters(operation.parameters as OpenAPIV2.ParameterObject[]);
    
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
            });
        });
    }
    
    const { contentType, body } = prepareRequestBody(operation);
    
    const requestData: RQAPI.HttpRequest = {
        url: fullUrl,
        queryParams,
        method,
        pathVariables,
        headers,
        // @ts-ignore
        body,
        contentType,
        includeCredentials: false
    };
    
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

const convertNestedCollectionToRQAPI = (
    collection: NestedCollectionMap,
    specData: OpenAPIV2.Document,
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

const parseSpecification = (specData: OpenAPIV2.Document): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();
    
    const baseUrl = extractBaseUrl(specData);
    
    const nestedCollections = buildNestedCollections(specData);
    const childCollections = convertNestedCollectionToRQAPI(
        nestedCollections,
        specData,
        currentTimestamp
    );
    
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

export const convert: ApiClientImporterMethod<ImportFile> = async(specFile: ImportFile) => {
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
        return {
            data: {
                collection: collectionRecord,
                environments: []
            }
        };

    }catch(error){
        console.error("Error validating Swagger 2.0 spec file:", error);
        throw new Error("Invalid Swagger 2.0 specification");
    }
}
