import { ImportFile } from "../types";
import { parseStringPromise } from "xml2js";
import { ApiClientImporterMethod } from "~/importers/types";
import {
    SoapImportErrorType,
    SoapError,
    WsdlDefinitions,
    WsdlMessage,
    WsdlBinding,
    SoapOperationInfo,
    SoapPortInfo,
    WsdlPortType,
} from "./types";
import {
    RQAPI,
    RequestMethod,
    KeyValuePair,
    RequestContentType,
    Authorization,
    EnvironmentVariables,
    EnvironmentVariableType,
    KeyValueDataType,
} from "@requestly/shared/types/entities/apiClient";

interface ElementCacheItem {
    targetNamespace?: string;
    children: Array<{ name: string; type: string }>;
}

interface WsdlContext {
    definitions: WsdlDefinitions;
    messageMap: Map<string, WsdlMessage>;
    bindingMap: Map<string, WsdlBinding>;
    portTypeMap: Map<string, WsdlPortType>;
    elementMap: Map<string, ElementCacheItem>;
}

interface OperationParams {
    elementNamespace: string | undefined;
    operationElement: string;
    childElements: Array<{ name: string; type: string }>;
}

const createSoapError = (
    type: SoapImportErrorType,
    message: string,
    originalError?: any,
): SoapError => {
    const error = new Error(message) as SoapError;
    error.type = type;
    error.originalError = originalError;
    return error;
};

const asArray = <T>(input: T | T[] | undefined): T[] => {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
};

/**
 * Finds a child key ignoring namespace prefixes.
 * e.g. getChildByTagName(obj, "definitions") matches "definitions" or "wsdl:definitions"
 */
const getChildByTagName = (obj: any, tagName: string): any => {
    if (!obj) return undefined;
    const key = Object.keys(obj).find(
        (k) => k === tagName || k.endsWith(`:${tagName}`)
    );
    return key ? obj[key] : undefined;
};

const getVariableName = (paramName: string): string => {
    if (paramName.match(/^s[A-Z]/)) {
        return paramName.substring(1);
    }
    return paramName;
};

const buildWsdlContext = (definitions: WsdlDefinitions): WsdlContext => {
    const context: WsdlContext = {
        definitions,
        messageMap: new Map(),
        bindingMap: new Map(),
        portTypeMap: new Map(),
        elementMap: new Map(),
    };

    const messages = asArray(getChildByTagName(definitions, "message"));
    messages.forEach((msg) => {
        if (msg.$?.name) {
            context.messageMap.set(msg.$?.name, msg);
        }
    });

    const bindings = asArray(getChildByTagName(definitions, "binding"));
    bindings.forEach((binding) => {
        if (binding.$?.name) {
            context.bindingMap.set(binding.$?.name, binding);
        }
    });

    const portTypes = asArray(getChildByTagName(definitions, "portType"));
    portTypes.forEach((pt) => {
        if (pt.$?.name) {
            context.portTypeMap.set(pt.$?.name, pt);
        }
    });

    const types = asArray(getChildByTagName(definitions, "types"))[0];
    if (types) {
        const schemas = asArray(getChildByTagName(types, "schema"));
        
        schemas.forEach((schema) => {
            const targetNamespace = schema.$?.targetNamespace || schema.$?.["xmlns:tns"];
            const elements = asArray(getChildByTagName(schema, "element"));

            elements.forEach((element) => {
                const name = element.$?.name;
                if (!name || context.elementMap.has(name)) return;

                // Pre-calculate nested children structure
                let children: Array<{ name: string; type: string }> = [];
                const complexType = getChildByTagName(element, "complexType");
                
                if (complexType) {
                    const ct = Array.isArray(complexType) ? complexType[0] : complexType;
                    const sequence = getChildByTagName(ct, "sequence");
                    
                    if (sequence) {
                        const seq = Array.isArray(sequence) ? sequence[0] : sequence;
                        const childElements = asArray(getChildByTagName(seq, "element"));
                        
                        children = childElements.map((child: any) => ({
                            name: child.$?.name || "param",
                            type: child.$?.type || "xs:string",
                        }));
                    }
                }

                context.elementMap.set(name, {
                    targetNamespace,
                    children
                });
            });
        });
    }

    return context;
};

const preProcessWsdl = async (content: string): Promise<WsdlDefinitions> => {
    const parsed = await parseStringPromise(content, { explicitArray: false });
    return getChildByTagName(parsed, "definitions");
};

const validateWsdlStructure = (definitions: WsdlDefinitions): void => {
    if (!definitions) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: Missing definitions element",
        );
    }

    if (asArray(getChildByTagName(definitions, "service")).length === 0) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: No services found",
        );
    }

    if (asArray(getChildByTagName(definitions, "binding")).length === 0) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: No bindings found",
        );
    }

    if (asArray(getChildByTagName(definitions, "portType")).length === 0) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: No port types found",
        );
    }

    if (asArray(getChildByTagName(definitions, "message")).length === 0) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: No messages found",
        );
    }
};

const detectSoapVersion = (binding: WsdlBinding): "1.1" | "1.2" => {
    const soapBinding = getChildByTagName(binding, "binding");
    const bindingNode = Array.isArray(soapBinding) ? soapBinding[0] : soapBinding;

    if (!bindingNode) {
        return "1.1";
    }

    const transport = bindingNode.$?.transport || "";
    if (transport === "http://www.w3.org/2003/05/soap-http") {
        return "1.2";
    }
    
    const bindingKey = Object.keys(binding).find(k => k.endsWith(":binding"));
    if (bindingKey && bindingKey.includes("soap12")) {
        return "1.2";
    }

    return "1.1";
};

const findMessage = (
    messageName: string,
    context: WsdlContext,
): WsdlMessage | undefined => {
    if (!messageName) return undefined;
    const cleanName = messageName.replace(/^.*:/, ""); 
    return context.messageMap.get(cleanName);
};

const extractMessageParts = (
    message: WsdlMessage | undefined,
): any[] => {
    if (!message) return [];
    
    const partData = getChildByTagName(message, "part");
    if (!partData) return [];

    const parts = asArray(partData);

    return parts.map((part) => ({
        name: part.$?.name || "param",
        element: part.$?.element,
        type: part.$?.type,
    }));
};

const extractElementNameFromPart = (part: any): string => {
    if (part.element) {
        return part.element.replace(/^.*:/, "");
    }
    return part.name;
};

const getOperationParams = (
    operation: SoapOperationInfo,
    context: WsdlContext
): OperationParams => {
    const inputParts = extractMessageParts(operation.inputMessageObject);
    const firstPart = inputParts[0];
    const operationElement = firstPart
        ? extractElementNameFromPart(firstPart)
        : operation.name;

    const elementInfo = context.elementMap.get(operationElement);
    
    return { 
        elementNamespace: elementInfo?.targetNamespace, 
        operationElement, 
        childElements: elementInfo?.children || [] 
    };
};

const generateSoapEnvelope = (
    soapVersion: "1.1" | "1.2",
    params: OperationParams
): string => {
    const { elementNamespace, operationElement, childElements } = params;
    const soapXmlns =
        soapVersion === "1.2"
            ? "http://www.w3.org/2003/05/soap-envelope"
            : "http://schemas.xmlsoap.org/soap/envelope/";

    let envelopeNamespaceAttr = `xmlns:soap="${soapXmlns}"`;
    
    let operationTagOpen = operationElement;
    let operationTagClose = operationElement;
    let paramPrefix = "";

    if (elementNamespace) {
        operationTagOpen = `tns:${operationElement} xmlns:tns="${elementNamespace}"`;
        operationTagClose = `tns:${operationElement}`;
        paramPrefix = "tns:";
    }

    const paramElements =
        childElements.length > 0
            ? childElements
                  .map((child) => {
                      const tagName = `${paramPrefix}${child.name}`;
                      const variableName = getVariableName(child.name);
                      return `      <${tagName}>{{${variableName}}}</${tagName}>`;
                  })
                  .join("\n")
            : "      ";

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope ${envelopeNamespaceAttr}>
  <soap:Body>
    <${operationTagOpen}>
${paramElements}
    </${operationTagClose}>
  </soap:Body>
</soap:Envelope>`;
};

const createSoapRequest = (
    operation: SoapOperationInfo,
    port: SoapPortInfo,
    context: WsdlContext,
    timestamp: number,
): { record: RQAPI.ApiRecord; variables: string[] } => {
    
    const params = getOperationParams(operation, context);
    const soapEnvelope = generateSoapEnvelope(port.soapVersion, params);

    const headers: KeyValuePair[] = [
        {
            id: 1,
            key: "Content-Type",
            value:
                port.soapVersion === "1.2"
                    ? "application/soap+xml; charset=UTF-8"
                    : "text/xml; charset=UTF-8",
            isEnabled: true,
            description: "SOAP Content-Type header",
            dataType: KeyValueDataType.STRING,
        },
    ];

    if (operation.soapAction) {
        headers.push({
            id: 2,
            key: "SOAPAction",
            value: operation.soapAction,
            isEnabled: true,
            description: "SOAP Action header",
            dataType: KeyValueDataType.STRING,
        });
    }

    const httpRequest: RQAPI.HttpRequest = {
        url: "{{BaseUrl}}",
        method: RequestMethod.POST,
        queryParams: [],
        headers,
        pathVariables: [],
        body: soapEnvelope,
        bodyContainer: {
            text: soapEnvelope,
            form: [],
            multipartForm: [],
        },
        contentType: RequestContentType.RAW,
        includeCredentials: false,
    };
    
    let requestName = operation.name || operation.messageName;
    requestName = requestName.replace(/Soap(12)?Request$/i, "");

    const httpApiEntry: RQAPI.HttpApiEntry = {
        type: RQAPI.ApiEntryType.HTTP,
        request: httpRequest,
        response: null,
        testResults: [],
        scripts: {
            preRequest: "",
            postResponse: "",
        },
        auth: {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {},
        },
    };

    const apiRecord: RQAPI.ApiRecord = {
        id: "",
        name: requestName,
        description: `SOAP ${port.soapVersion} operation - ${operation.name}`,
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: timestamp,
        updatedTs: timestamp,
        type: RQAPI.RecordType.API,
        data: httpApiEntry,
    };
    
    const usedVariables = params.childElements.map(child => getVariableName(child.name));

    return { record: apiRecord, variables: usedVariables };
};

const buildPortCollection = (
    port: SoapPortInfo,
    serviceDocumentation: string,
    context: WsdlContext,
    timestamp: number,
): RQAPI.CollectionRecord => {
    const apiRecords: RQAPI.ApiRecord[] = [];
    const collectedVariables = new Set<string>();

    port.operations.forEach((operation) => {
        const result = createSoapRequest(operation, port, context, timestamp);
        apiRecords.push(result.record);
        result.variables.forEach(v => collectedVariables.add(v));
    });

    const collectionVariables: EnvironmentVariables = {
        BaseUrl: {
            id: 1,
            isPersisted: true,
            type: EnvironmentVariableType.String,
            syncValue: port.location,
        },
    };
    
    let varIdCounter = 2;
    collectedVariables.forEach((varName) => {
        collectionVariables[varName] = {
            id: varIdCounter++,
            isPersisted: true,
            type: EnvironmentVariableType.String,
            syncValue: "",
        };
    });

    const collectionRecord: RQAPI.CollectionRecord = {
        id: "",
        name: `${port.portName}`,
        description: serviceDocumentation,
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: timestamp,
        updatedTs: timestamp,
        type: RQAPI.RecordType.COLLECTION,
        data: {
            children: apiRecords,
            scripts: {
                preRequest: "",
                postResponse: "",
            },
            variables: collectionVariables,
            auth: {
                currentAuthType: Authorization.Type.INHERIT,
                authConfigStore: {},
            },
        },
    };

    return collectionRecord;
};

const convertWsdlToRQAPI = (
    context: WsdlContext,
): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();
    const portCollections: RQAPI.CollectionRecord[] = [];
    
    const definitions = context.definitions;
    const services = asArray(getChildByTagName(definitions, "service"));

    services.forEach((service) => {
        const ports = asArray(getChildByTagName(service, "port"));
        
        const docs = asArray(getChildByTagName(service, "documentation")); 
        const serviceDoc = docs.length > 0 ? (typeof docs[0] === 'string' ? docs[0] : JSON.stringify(docs[0])) : "";

        ports.forEach((port) => {
            const portName = port.$?.name || "Port";
            const bindingName = port.$?.binding || "";
            const cleanBindingName = bindingName.replace(/^.*:/, "");

            const soapAddress = getChildByTagName(port, "address");
            const addressNode = Array.isArray(soapAddress) ? soapAddress[0] : soapAddress;
            const location = addressNode?.$?.location || "";

            if (!location) {
                console.warn(`Port ${portName} has no SOAP address location`);
                return;
            }

            const binding = context.bindingMap.get(cleanBindingName);
            if (!binding) {
                return;
            }

            const soapVersion = detectSoapVersion(binding);
            const bindingType = binding.$?.type || "";
            const cleanPortTypeName = bindingType.replace(/^.*:/, "");

            const portTypeOperations = context.portTypeMap.get(cleanPortTypeName);

            const operations: SoapOperationInfo[] = [];
            const rawOperations = asArray(getChildByTagName(portTypeOperations, "operation"));

            if (rawOperations.length > 0) {
                rawOperations.forEach((operation) => {
                    const operationName = operation.$?.name;
                    
                    const input = asArray(getChildByTagName(operation, "input"))[0];
                    const output = asArray(getChildByTagName(operation, "output"))[0];
                    
                    const inputMsg = input?.$?.message || "";
                    const outputMsg = output?.$?.message || "";

                    const inputMessageObject = findMessage(inputMsg, context);
                    const outputMessageObject = findMessage(outputMsg, context);

                    const cleanInputName = inputMsg.replace(/^.*:/, "");

                    const operationInfo: SoapOperationInfo = {
                        name: operationName,
                        messageName: cleanInputName,
                        messageInputName: inputMsg,
                        messageOutputName: outputMsg,
                        inputMessageObject,
                        outputMessageObject,
                        soapAction: "",
                    };

                    const bindingOperations = asArray(getChildByTagName(binding, "operation"));
                    const bindingOperation = bindingOperations.find(
                        (op) => op.$?.name === operationName,
                    );
                    
                    if (bindingOperation) {
                        const soapOperation = getChildByTagName(bindingOperation, "operation");
                        const soapOperationNode = Array.isArray(soapOperation) ? soapOperation[0] : soapOperation;
                        if (soapOperationNode) {
                            operationInfo.soapAction = soapOperationNode.$?.soapAction;
                        }
                    }

                    operations.push(operationInfo);
                });
            }

            const portInfo: SoapPortInfo = {
                portName,
                bindingName: cleanBindingName,
                location,
                soapVersion,
                operations,
            };

            const portCollection = buildPortCollection(
                portInfo,
                serviceDoc,
                context,
                currentTimestamp,
            );
            portCollections.push(portCollection);
        });
    });

    const rootCollection: RQAPI.CollectionRecord = {
        id: "",
        name: definitions.$?.name || "SOAP Service",
        description: "Collection imported from WSDL specification",
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: currentTimestamp,
        updatedTs: currentTimestamp,
        type: RQAPI.RecordType.COLLECTION,
        data: {
            children: portCollections,
            scripts: {
                preRequest: "",
                postResponse: "",
            },
            variables: {},
            auth: {
                currentAuthType: Authorization.Type.INHERIT,
                authConfigStore: {},
            },
        },
    };

    return rootCollection;
};

export const convert: ApiClientImporterMethod<ImportFile> = async (
    file: ImportFile,
) => {
    let definitions: WsdlDefinitions;
    console.log("Received file for SOAP import:", file.name, `(${file.content.length} characters)`);

    try {
        definitions = await preProcessWsdl(file.content);
    } catch (error) {
        throw createSoapError(
            SoapImportErrorType.XML_PARSE_ERROR,
            "Failed to parse WSDL XML content",
            error,
        );
    }

    try {
        validateWsdlStructure(definitions);
    } catch (error) {
        if ((error as SoapError).type) {
            throw error;
        }
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL structure",
            error,
        );
    }

    const context = buildWsdlContext(definitions);

    try {
        const collection = convertWsdlToRQAPI(context);
        return {
            data: {
                collection,
                environments: [],
            },
        };
    } catch (error) {
        const err = error as SoapError;
        if (err.type) {
            throw error;
        }
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Error converting WSDL to Requestly format",
            error,
        );
    }
};
