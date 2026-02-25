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
    WsdlService,
    WsdlPort,
    WsdlSoapAddress,
    WsdlOperation,
    WsdlOperationMessage,
    WsdlBindingOperation,
    WsdlSoapOperation,
    WsdlSoapBinding,
    WsdlTypes,
    WsdlPart,
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

const MAX_WSDL_SIZE_CHARS = 5 * 1024 * 1024;
interface SchemaNode {
    targetNamespace?: string;
    node: any;
    isComplexType?: boolean;
}

interface WsdlContext {
    definitions: WsdlDefinitions;
    messageMap: Map<string, WsdlMessage>;
    bindingMap: Map<string, WsdlBinding>;
    portTypeMap: Map<string, WsdlPortType>;
    elementMap: Map<string, SchemaNode>;
    typeMap: Map<string, SchemaNode>;
}

interface ResolvedParam {
    name: string;
    type: string;
    namespace?: string;
    children?: ResolvedParam[];
    isComplex?: boolean;
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
    if (!paramName) return "Variable";
    return paramName;
};

const isWsdl = (content: string): boolean => {
    if (!content) return false;
    const hasWsdlNamespace = content.includes("http://schemas.xmlsoap.org/wsdl/");
    const hasDefinitions = content.includes("definitions");
    
    return hasWsdlNamespace && hasDefinitions;
};

const buildWsdlContext = (definitions: WsdlDefinitions): WsdlContext => {
    const context: WsdlContext = {
        definitions,
        messageMap: new Map(),
        bindingMap: new Map(),
        portTypeMap: new Map(),
        elementMap: new Map(),
        typeMap: new Map(),
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
                context.elementMap.set(name, { targetNamespace, node: element });
            });

            const complexTypes = asArray(getChildByTagName<any>(schema, "complexType"));
            complexTypes.forEach((ct) => {
                const name = ct.$?.name;
                if (name) context.typeMap.set(name, { targetNamespace, node: ct, isComplexType: true });
            });

            const simpleTypes = asArray(getChildByTagName<any>(schema, "simpleType"));
            simpleTypes.forEach((st) => {
                const name = st.$?.name;
                if (name) context.typeMap.set(name, { targetNamespace, node: st, isComplexType: false });
            });
        });
    }

    return context;
};

const preProcessWsdl = async (content: string): Promise<WsdlDefinitions> => {
    if (!content || content.length > MAX_WSDL_SIZE_CHARS) {
        throw createSoapError(
            SoapImportErrorType.XML_PARSE_ERROR,
            "WSDL content exceeds the maximum allowed size of 5MB."
        );
    }

    const parsed = await parseStringPromise(content, { explicitArray: false });
    
    if (getChildByTagName<any>(parsed, "description")) {
        throw createSoapError(
            SoapImportErrorType.UNSUPPORTED_WSDL,
            "WSDL 2.0 is not supported. Please provide a WSDL 1.1 specification.",
        );
    }

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

const isNodeComplex = (node: any, context: WsdlContext): boolean => {
    if (getChildByTagName<any>(node, "complexType")) return true;
    const typeAttr = node.$?.type;
    if (typeAttr) {
        const cleanType = typeAttr.replace(/^.*:/, "");
        const typeInfo = context.typeMap.get(cleanType);
        if (typeInfo && typeInfo.isComplexType) {
            return true;
        }
    }
    return false;
};

const extractParamsFromNode = (
    node: any, 
    context: WsdlContext, 
    visited: Set<string> = new Set()
): ResolvedParam[] => {
    if (!node) return [];
    let params: ResolvedParam[] = [];

    const typeAttr = node.$?.type;
    if (typeAttr && typeAttr.includes(":")) {
        const cleanType = typeAttr.replace(/^.*:/, "");
        if (visited.has(cleanType)) return []; 
        visited.add(cleanType);

        const typeInfo = context.typeMap.get(cleanType);
        if (typeInfo) return extractParamsFromNode(typeInfo.node, context, visited);
        return []; 
    }

    let complexType = getChildByTagName<any>(node, "complexType");
    if (!complexType && node.$?.name && context.typeMap.has(node.$?.name)) {
        complexType = node; 
    }

    if (complexType) {
        const ct = Array.isArray(complexType) ? complexType[0] : complexType;

        const complexContent = getChildByTagName<any>(ct, "complexContent");
        if (complexContent) {
            const ext = getChildByTagName<any>(complexContent, "extension");
            if (ext) {
                const baseType = ext.$?.base?.replace(/^.*:/, "");
                if (baseType && !visited.has(baseType)) {
                    visited.add(baseType);
                    const baseTypeInfo = context.typeMap.get(baseType);
                    if (baseTypeInfo) params.push(...extractParamsFromNode(baseTypeInfo.node, context, visited));
                }
                params.push(...extractParamsFromNode(ext, context, visited));
                return params;
            }
        }

        const container = getChildByTagName<any>(ct, "sequence") || 
                          getChildByTagName<any>(ct, "choice") || 
                          getChildByTagName<any>(ct, "all");
                          
        if (container) {
            const seq = Array.isArray(container) ? container[0] : container;
            asArray(getChildByTagName<any>(seq, "element")).forEach((child: any) => {
                const childName = child.$?.name || "param";
                const childType = child.$?.type || "xsd:string";
                const nested = extractParamsFromNode(child, context, new Set(visited));
                params.push({
                    name: childName,
                    type: childType,
                    children: nested.length > 0 ? nested : undefined,
                    isComplex: isNodeComplex(child, context)
                });
            });
        }
    }
    return params;
};

const resolveMessageParts = (partsData: any[], context: WsdlContext): ResolvedParam[] => {
    const resolved: ResolvedParam[] = [];
    partsData.forEach(part => {
        const element = part.element?.replace(/^.*:/, "");
        const type = part.type?.replace(/^.*:/, "");
        
        if (element) {
            const elementInfo = context.elementMap.get(element);
            if (elementInfo) {
                resolved.push({
                    name: element, 
                    type: elementInfo.node.$?.type || "complex",
                    namespace: elementInfo.targetNamespace,
                    children: extractParamsFromNode(elementInfo.node, context),
                    isComplex: isNodeComplex(elementInfo.node, context)
                });
            }
        } else if (type) {
            const typeInfo = context.typeMap.get(type);
            if (typeInfo) {
                const children = extractParamsFromNode(typeInfo.node, context);
                resolved.push({
                    name: part.name,
                    type: part.type, 
                    namespace: typeInfo.targetNamespace,
                    children: children.length > 0 ? children : undefined,
                    isComplex: typeInfo.isComplexType
                });
            } else {
                resolved.push({ name: part.name, type: part.type, isComplex: false });
            }
        }
    });
    return resolved;
};

const paramToXml = (param: ResolvedParam, use: "literal" | "encoded", paramPrefix: string, indentLvl: number): string => {
    const indent = "  ".repeat(indentLvl);
    const tagName = `${paramPrefix}${param.name}`;
    const typeAttr = use === "encoded" && param.type && param.type !== "complex" ? ` xsi:type="${param.type}"` : "";
    
    if (param.children && param.children.length > 0) {
        const childXml = param.children.map(c => paramToXml(c, use, paramPrefix, indentLvl + 1)).join("\n");
        return `${indent}<${tagName}${typeAttr}>\n${childXml}\n${indent}</${tagName}>`;
    } else if (param.isComplex) {
        return `${indent}<${tagName}${typeAttr} />`;
    } else {
        return `${indent}<${tagName}${typeAttr}>{{${getVariableName(param.name)}}}</${tagName}>`;
    }
};

const extractVariables = (params: ResolvedParam[], vars: Set<string>) => {
    params.forEach(p => {
        if (p.children && p.children.length > 0) {
            extractVariables(p.children, vars);
        } else if (!p.isComplex) {
            vars.add(getVariableName(p.name));
        }
    });
};

const generateSoapEnvelope = (
    soapVersion: "1.1" | "1.2",
    style: "document" | "rpc",
    use: "literal" | "encoded",
    operationName: string,
    globalNamespace: string,
    headerParts: ResolvedParam[],
    bodyParts: ResolvedParam[]
): string => {
    const soapXmlns = soapVersion === "1.2"
        ? "http://www.w3.org/2003/05/soap-envelope"
        : "http://schemas.xmlsoap.org/soap/envelope/";

    let envelopeAttrs = `xmlns:soap="${soapXmlns}" xmlns:tns="${globalNamespace}"`;
    if (use === "encoded") {
        envelopeAttrs += ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"`;
    }

    let headerXml = "";
    if (headerParts.length > 0) {
        const hXml = headerParts.map(p => paramToXml(p, use, "tns:", 2)).join("\n");
        headerXml = `  <soap:Header>\n${hXml}\n  </soap:Header>\n`;
    }

    let bodyXml = "";
    if (style === "rpc") {
        const encStyle = use === "encoded" ? ` soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"` : "";
        const partsXml = bodyParts.map(p => paramToXml(p, use, "", 3)).join("\n");
        bodyXml = `    <tns:${operationName}${encStyle}>\n${partsXml}\n    </tns:${operationName}>`;
    } else {
        bodyXml = bodyParts.map(p => paramToXml(p, use, "tns:", 2)).join("\n");
    }

    return `<?xml version="1.0" encoding="utf-8"?>\n<soap:Envelope ${envelopeAttrs}>\n${headerXml}  <soap:Body>\n${bodyXml}\n  </soap:Body>\n</soap:Envelope>`;
};

const createSoapRequest = (
    operation: SoapOperationInfo,
    port: SoapPortInfo,
    context: WsdlContext,
    timestamp: number,
): { record: RQAPI.ApiRecord; variables: string[] } => {
    
    const inputPartsData = extractMessageParts(operation.inputMessageObject);
    const bodyParts = resolveMessageParts(inputPartsData, context);

    let headerPartsData: any[] = [];
    if (operation.headers && operation.headers.length > 0) {
        operation.headers.forEach(h => {
            const hMsg = findMessage(h.message, context);
            const hParts = extractMessageParts(hMsg);
            const targetPart = hParts.find(p => p.name === h.part?.replace(/^.*:/, ""));
            if (targetPart) headerPartsData.push(targetPart);
        });
    }
    const headerParts = resolveMessageParts(headerPartsData, context);

    const globalNamespace = context.definitions.$?.targetNamespace || "http://tempuri.org/";
    const style = operation.style || "document";
    const use = operation.use || "literal";

    const soapEnvelope = generateSoapEnvelope(
        port.soapVersion, 
        style, 
        use, 
        operation.name, 
        globalNamespace, 
        headerParts, 
        bodyParts
    );

    const headers: KeyValuePair[] = [];
    
    if (port.soapVersion === "1.2") {
        let ctValue = "application/soap+xml; charset=UTF-8";
        if (operation.soapAction) {
            ctValue += `; action="${operation.soapAction}"`;
        }
        headers.push({
            id: 1,
            key: "Content-Type",
            value: ctValue,
            isEnabled: true,
            description: "SOAP Content-Type header",
            dataType: KeyValueDataType.STRING,
        });
    } else {
        headers.push({
            id: 1,
            key: "Content-Type",
            value: "text/xml; charset=UTF-8",
            isEnabled: true,
            description: "SOAP Content-Type header",
            dataType: KeyValueDataType.STRING,
        });
    }

    // Note: SOAPAction header is included for both SOAP 1.1 and 1.2 for compatibility
    // with legacy systems, even though SOAP 1.2 spec recommends using the 'action'
    // parameter in Content-Type instead.
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
    requestName = requestName.replace(/(Soap(12)?Request|Soap(11|12)|Soap(In|Out)|Port|Binding)$/i, "");

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
        description: `SOAP ${port.soapVersion} ${style}/${use} operation`,
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

    const variablesSet = new Set<string>();
    extractVariables(bodyParts, variablesSet);
    extractVariables(headerParts, variablesSet);

    return { record: apiRecord, variables: Array.from(variablesSet) };
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
            
            const globalSoapBinding = getChildByTagName<WsdlSoapBinding>(binding, "binding");
            const gsbNode = Array.isArray(globalSoapBinding) ? globalSoapBinding[0] : globalSoapBinding;
            const globalStyle = gsbNode?.$?.style || "document";

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
                    
                    let style = globalStyle;
                    let use = "literal";
                    let soapAction = undefined;
                    let headers: any[] = [];

                    const bindingOperations = asArray(
                        getChildByTagName<WsdlBindingOperation>(binding, "operation"),
                    );
                    const bindingOp = bindingOperations.find(
                        (op) => op.$?.name === operationName,
                    );
                    
                    if (bindingOp) {
                        const soapOperationNode = asArray(getChildByTagName<WsdlSoapOperation>(bindingOp, "operation"))[0];
                        if (soapOperationNode?.$?.soapAction) soapAction = soapOperationNode.$.soapAction;
                        if (soapOperationNode?.$?.style) style = soapOperationNode.$.style;

                        const bindingInput = asArray(getChildByTagName<any>(bindingOp, "input"))[0];
                        if (bindingInput) {
                            const soapBody = asArray(getChildByTagName<any>(bindingInput, "body"))[0];
                            if (soapBody?.$?.use) use = soapBody.$.use;

                            asArray(getChildByTagName<any>(bindingInput, "header")).forEach(h => {
                                if (h.$?.message && h.$?.part) headers.push({ message: h.$.message, part: h.$.part });
                            });
                        }
                    }

                    operations.push({
                        name: operationName,
                        messageName: inputMsg.replace(/^.*:/, ""),
                        inputMessageObject: findMessage(inputMsg, context),
                        soapAction,
                        style: style as any,
                        use: use as any,
                        headers
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
    if (!isWsdl(file.content)) {
        throw createSoapError(
            SoapImportErrorType.UNSUPPORTED_WSDL,
            "Invalid WSDL file format. File must contain valid WSDL definitions.",
        );
    }

    let definitions: WsdlDefinitions;

    try {
        definitions = await preProcessWsdl(file.content);
    } catch (error) {
        if ((error as SoapError).type) {
            throw error;
        }
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
