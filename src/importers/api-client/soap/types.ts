// SOAP-specific error types
export enum SoapImportErrorType {
  XML_PARSE_ERROR = "XML_PARSE_ERROR",
  INVALID_WSDL_STRUCTURE = "INVALID_WSDL_STRUCTURE",
  UNSUPPORTED_WSDL = "UNSUPPORTED_WSDL",
}

export interface SoapError extends Error {
  type: SoapImportErrorType;
  originalError?: any;
}

// WSDL structure types
export interface WsdlDefinitions {
  $: {
    targetNamespace?: string;
    name?: string;
    [key: string]: any;
  };
  types?: WsdlTypes | WsdlTypes[];
  message?: WsdlMessage | WsdlMessage[];
  portType?: WsdlPortType | WsdlPortType[];
  binding?: WsdlBinding | WsdlBinding[];
  service?: WsdlService | WsdlService[];
  [key: string]: any; // Critical: Allows for prefixed keys like 'wsdl:service'
}

export interface WsdlTypes {
  "xsd:schema"?: any;
  "xs:schema"?: any;
  schema?: any;
  [key: string]: any;
}

export interface WsdlMessage {
  $: { name: string };
  part?: WsdlPart | WsdlPart[];
  [key: string]: any;
}

export interface WsdlPart {
  $: { name: string; type?: string; element?: string };
  [key: string]: any;
}

export interface WsdlPortType {
  $: { name: string };
  operation?: WsdlOperation | WsdlOperation[];
  [key: string]: any;
}

export interface WsdlOperation {
  $?: { name?: string };
  input?: WsdlOperationMessage | WsdlOperationMessage[];
  output?: WsdlOperationMessage | WsdlOperationMessage[];
  [key: string]: any;
}

export interface WsdlOperationMessage {
  $: { message: string; name?: string };
  [key: string]: any;
}

export interface WsdlBinding {
  $: { name: string; type: string };
  operation?: WsdlBindingOperation | WsdlBindingOperation[];
  "soap:binding"?: WsdlSoapBinding | WsdlSoapBinding[];
  [key: string]: any;
}

export interface WsdlSoapBinding {
  $: { style?: string; transport: string };
  [key: string]: any;
}

export interface WsdlBindingOperation {
  $: { name: string };
  "soap:operation"?: WsdlSoapOperation | WsdlSoapOperation[];
  input?: any;
  output?: any;
  [key: string]: any;
}

export interface WsdlSoapOperation {
  $: { soapAction?: string; style?: string };
  [key: string]: any;
}

export interface WsdlService {
  $: { name: string };
  documentation?: string | string[]; 
  port?: WsdlPort | WsdlPort[];
  [key: string]: any;
}

export interface WsdlPort {
  $: { name: string; binding: string };
  "soap:address"?: WsdlSoapAddress | WsdlSoapAddress[];
  [key: string]: any;
}

export interface WsdlSoapAddress {
  $: { location: string };
  [key: string]: any;
}

// Extracted info types (Used internally by the importer logic)
export interface SoapOperationInfo {
  name: string;
  messageName: string;
  inputMessageObject?: WsdlMessage;
  soapAction?: string;
}

export interface SoapPortInfo {
  portName: string;
  location: string;
  soapVersion: "1.1" | "1.2";
  operations: SoapOperationInfo[];
}
