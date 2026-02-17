import { KeyValueDataType } from "@requestly/shared/types/entities/apiClient";
export declare const unthrowableParseJson: (rawData: string) => any;
export type ParamValue = string | number | boolean;
export declare const getParamType: (paramSchema: any) => "string" | "number" | "boolean";
export declare const getDefaultValueForType: (paramType: "string" | "number" | "boolean", paramSchema: any) => ParamValue;
export declare const getEnumValue: (paramSchema: any) => ParamValue;
export declare const getParamValue: (paramSchema: any) => ParamValue;
export declare const getKeyValueDataTypeFromParam: (paramSchema: any) => KeyValueDataType;
