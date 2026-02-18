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
    WsdlOperation,
    WsdlTypes,
    WsdlPart,
    WsdlService,
    WsdlPort,
    WsdlSoapAddress,
    WsdlOperationMessage,
    WsdlBindingOperation,
    WsdlSoapOperation,
    WsdlSoapBinding,
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

interface ProcessedPort {
    name: string;
    description: string;
    requests: RQAPI.ApiRecord[];
    variables: Set<string>;
    location: string;
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

const getChildByTagName = <T = any>(obj: any, tagName: string): T | undefined => {
    if (!obj) return undefined;
    const key = Object.keys(obj).find(
        (k) => k === tagName || k.endsWith(`:${tagName}`),
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

    const messages = asArray(getChildByTagName<WsdlMessage>(definitions, "message"));
    messages.forEach((msg) => {
        if (msg.$?.name) {
            context.messageMap.set(msg.$?.name, msg);
        }
    });

    const bindings = asArray(getChildByTagName<WsdlBinding>(definitions, "binding"));
    bindings.forEach((binding) => {
        if (binding.$?.name) {
            context.bindingMap.set(binding.$?.name, binding);
        }
    });

    const portTypes = asArray(getChildByTagName<WsdlPortType>(definitions, "portType"));
    portTypes.forEach((pt) => {
        if (pt.$?.name) {
            context.portTypeMap.set(pt.$?.name, pt);
        }
    });

    const types = asArray(getChildByTagName<WsdlTypes>(definitions, "types"))[0];
    if (types) {
        const schemas = asArray(getChildByTagName<any>(types, "schema"));
        schemas.forEach((schema) => {
            const targetNamespace =
                schema.$?.targetNamespace || schema.$?.["xmlns:tns"];
            const elements = asArray(getChildByTagName<any>(schema, "element"));

            elements.forEach((element) => {
                const name = element.$?.name;
                if (!name || context.elementMap.has(name)) return;

                let children: Array<{ name: string; type: string }> = [];
                const complexType = getChildByTagName<any>(element, "complexType");

                if (complexType) {
                    const ct = Array.isArray(complexType)
                        ? complexType[0]
                        : complexType;
                    const sequence = getChildByTagName<any>(ct, "sequence");

                    if (sequence) {
                        const seq = Array.isArray(sequence)
                            ? sequence[0]
                            : sequence;
                        const childElements = asArray(
                            getChildByTagName<any>(seq, "element"),
                        );

                        children = childElements.map((child: any) => ({
                            name: child.$?.name || "param",
                            type: child.$?.type || "xs:string",
                        }));
                    }
                }

                context.elementMap.set(name, { targetNamespace, children });
            });
        });
    }

    return context;
};

const preProcessWsdl = async (content: string): Promise<WsdlDefinitions> => {
    const parsed = await parseStringPromise(content, { explicitArray: false });
    const definitions = getChildByTagName<WsdlDefinitions>(parsed, "definitions");
    if (!definitions) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: Missing definitions element",
        );
    }
    return definitions;
};

const validateWsdlStructure = (definitions: WsdlDefinitions): void => {
    if (!definitions) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: Missing definitions element",
        );
    }

    if (asArray(getChildByTagName<WsdlService>(definitions, "service")).length === 0) {
        throw createSoapError(
            SoapImportErrorType.INVALID_WSDL_STRUCTURE,
            "Invalid WSDL: No services found",
        );
    }
};

const detectSoapVersion = (binding: WsdlBinding): "1.1" | "1.2" => {
    const soapBinding = getChildByTagName<WsdlSoapBinding>(binding, "binding");
    const bindingNode = Array.isArray(soapBinding)
        ? soapBinding[0]
        : soapBinding;

    if (!bindingNode) return "1.1";

    const transport = bindingNode.$?.transport || "";
    if (transport === "http://www.w3.org/2003/05/soap-http") return "1.2";

    const bindingKey = Object.keys(binding).find((k) => k.endsWith(":binding"));
    if (bindingKey && bindingKey.includes("soap12")) return "1.2";

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

const extractMessageParts = (message: WsdlMessage | undefined): any[] => {
    if (!message) return [];
    const partData = getChildByTagName<WsdlPart>(message, "part");
    if (!partData) return [];
    return asArray(partData).map((part) => ({
        name: part.$?.name || "param",
        element: part.$?.element,
        type: part.$?.type,
    }));
};

const extractElementNameFromPart = (part: any): string => {
    if (part.element) return part.element.replace(/^.*:/, "");
    return part.name;
};

const getOperationParams = (
    operation: SoapOperationInfo,
    context: WsdlContext,
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
        childElements: elementInfo?.children || [],
    };
};

const generateSoapEnvelope = (
    soapVersion: "1.1" | "1.2",
    params: OperationParams,
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
        contentType: RequestContentType.XML,
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

    const usedVariables = params.childElements.map((child) =>
        getVariableName(child.name),
    );

    return { record: apiRecord, variables: usedVariables };
};

const processPort = (
    port: SoapPortInfo,
    serviceDocumentation: string,
    context: WsdlContext,
    timestamp: number,
): ProcessedPort => {
    const requests: RQAPI.ApiRecord[] = [];
    const variables = new Set<string>();

    port.operations.forEach((operation) => {
        const result = createSoapRequest(operation, port, context, timestamp);
        requests.push(result.record);
        result.variables.forEach((v) => variables.add(v));
    });

    return {
        name: port.portName,
        description: serviceDocumentation,
        requests,
        variables,
        location: port.location,
    };
};

const createVersionedCollection = (
    name: string,
    description: string,
    ports: ProcessedPort[],
    timestamp: number,
): RQAPI.CollectionRecord => {
    const portCollections: RQAPI.CollectionRecord[] = [];

    ports.forEach((port) => {
        const portVariables: EnvironmentVariables = {};
        let varIdCounter = 1;

        const addVariable = (key: string, value: string) => {
            if (!portVariables[key]) {
                portVariables[key] = {
                    id: varIdCounter++,
                    isPersisted: true,
                    type: EnvironmentVariableType.String,
                    syncValue: value,
                };
            }
        };

        addVariable("BaseUrl", port.location);
        port.variables.forEach((v) => {
            addVariable(v, "");
        });

        const portCol: RQAPI.CollectionRecord = {
            id: "",
            name: port.name,
            description: port.description,
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
                children: port.requests,
                scripts: { preRequest: "", postResponse: "" },
                variables: portVariables,
                auth: {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {},
                },
            },
        };
        portCollections.push(portCol);
    });

    return {
        id: "",
        name: name,
        description: description,
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
            children: portCollections,
            scripts: { preRequest: "", postResponse: "" },
            variables: {},
            auth: {
                currentAuthType: Authorization.Type.INHERIT,
                authConfigStore: {},
            },
        },
    };
};

const convertWsdlToRQAPI = (context: WsdlContext): RQAPI.CollectionRecord => {
    const currentTimestamp = Date.now();

    const soap11Ports: ProcessedPort[] = [];
    const soap12Ports: ProcessedPort[] = [];

    const definitions = context.definitions;
    const services = asArray(getChildByTagName<WsdlService>(definitions, "service"));

    const serviceName =
        services.length > 0 && services[0].$?.name
            ? services[0].$?.name
            : definitions.$?.name || "SOAP Service";

    services.forEach((service) => {
        const ports = asArray(getChildByTagName<WsdlPort>(service, "port"));
        const docs = asArray(getChildByTagName<string>(service, "documentation"));
        const serviceDoc =
            docs.length > 0
                ? typeof docs[0] === "string"
                    ? docs[0]
                    : JSON.stringify(docs[0])
                : "";

        ports.forEach((port) => {
            const portName = port.$?.name || "Port";
            const bindingName = port.$?.binding || "";
            const cleanBindingName = bindingName.replace(/^.*:/, "");

            const soapAddress = getChildByTagName<WsdlSoapAddress>(port, "address");
            const addressNode = Array.isArray(soapAddress)
                ? soapAddress[0]
                : soapAddress;
            const location = addressNode?.$?.location || "";

            if (!location) {
                console.warn(`Port ${portName} has no SOAP address location`);
                return;
            }

            const binding = context.bindingMap.get(cleanBindingName);
            if (!binding) return;

            const soapVersion = detectSoapVersion(binding);
            const bindingType = binding.$?.type || "";
            const cleanPortTypeName = bindingType.replace(/^.*:/, "");

            const portTypeOperations =
                context.portTypeMap.get(cleanPortTypeName);
            const operations: SoapOperationInfo[] = [];
            
            const rawOperations = asArray<WsdlOperation>(
                getChildByTagName<WsdlOperation>(portTypeOperations, "operation"),
            );

            if (rawOperations.length > 0) {
                rawOperations.forEach((operation) => {
                    const operationName = operation.$?.name;
                    if (!operationName) return;

                    const input = asArray(
                        getChildByTagName<WsdlOperationMessage>(operation, "input"),
                    )[0];

                    const inputMsg = input?.$?.message || "";
                    const inputMessageObject = findMessage(inputMsg, context);

                    operations.push({
                        name: operationName,
                        messageName: inputMsg.replace(/^.*:/, ""),
                        inputMessageObject,
                        soapAction: (() => {
                            const bindingOperations = asArray(
                                getChildByTagName<WsdlBindingOperation>(binding, "operation"),
                            );
                            const bindingOp = bindingOperations.find(
                                (op) => op.$?.name === operationName,
                            );
                            if (bindingOp) {
                                const soapOperation = getChildByTagName<WsdlSoapOperation>(
                                    bindingOp,
                                    "operation",
                                );
                                const soapOperationNode = Array.isArray(
                                    soapOperation,
                                )
                                    ? soapOperation[0]
                                    : soapOperation;
                                return soapOperationNode?.$?.soapAction;
                            }
                            return undefined;
                        })(),
                    });
                });
            }

            const portInfo: SoapPortInfo = {
                portName,
                location,
                soapVersion,
                operations,
            };

            const processedPort = processPort(
                portInfo,
                serviceDoc,
                context,
                currentTimestamp,
            );

            if (soapVersion === "1.1") {
                soap11Ports.push(processedPort);
            } else {
                soap12Ports.push(processedPort);
            }
        });
    });

    const rootChildren: RQAPI.CollectionRecord[] = [];

    if (soap11Ports.length > 0) {
        rootChildren.push(
            createVersionedCollection(
                `${serviceName} V1.1`,
                `SOAP 1.1 Endpoints for ${serviceName}`,
                soap11Ports,
                currentTimestamp,
            ),
        );
    }

    if (soap12Ports.length > 0) {
        rootChildren.push(
            createVersionedCollection(
                `${serviceName} V1.2`,
                `SOAP 1.2 Endpoints for ${serviceName}`,
                soap12Ports,
                currentTimestamp,
            ),
        );
    }

    return {
        id: "",
        name: serviceName,
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
            children: rootChildren,
            scripts: { preRequest: "", postResponse: "" },
            variables: {},
            auth: {
                currentAuthType: Authorization.Type.INHERIT,
                authConfigStore: {},
            },
        },
    };
};

export const convert: ApiClientImporterMethod<ImportFile> = async (
    file: ImportFile,
) => {
    let definitions: WsdlDefinitions;

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
