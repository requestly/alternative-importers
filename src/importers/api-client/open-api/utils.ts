import { KeyValueDataType } from "@requestly/shared/types/entities/apiClient";

export const unthrowableParseJson = (rawData: string) => {
  try {
    return JSON.parse(rawData);
  } catch (err) {
    return null;
  }
};

export type ParamValue = string | number | boolean;

export const getParamType = (paramSchema: any): "string" | "number" | "boolean" => {
  if (paramSchema) {
    switch (paramSchema.type) {
      case "string":
        return "string";
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      default:
        return "string";
    }
  }
  return "string";
};

export const getDefaultValueForType = (paramType: "string" | "number" | "boolean", paramSchema: any): ParamValue => {
  switch (paramType) {
    case "string":
      return "string";
    case "number":
      return paramSchema.minimum ?? 0;
    case "boolean":
      return false;
    default:
      return "string";
  }
};

export const getEnumValue = (paramSchema: any): ParamValue => {
  return paramSchema.enum?.[0] ?? "string";
};

export const getParamValue = (paramSchema: any): ParamValue => {
  if (!paramSchema) {
    return "string";
  }

  if (paramSchema.default !== undefined) {
    return paramSchema.default;
  }

  if(paramSchema.example !== undefined) {
    return paramSchema.example;
  }

  if (paramSchema.enum && paramSchema.enum.length > 0) {
    return getEnumValue(paramSchema);
  }

  const paramType = getParamType(paramSchema);
  return getDefaultValueForType(paramType, paramSchema);
};

export const getKeyValueDataTypeFromParam = (paramSchema: any): KeyValueDataType => {
  if (paramSchema) {
    switch (paramSchema.type) {
      case "string":
        return KeyValueDataType.STRING;
      case "integer":
        return KeyValueDataType.INTEGER;
      case "boolean":
        return KeyValueDataType.BOOLEAN;
      case "number":
        return KeyValueDataType.NUMBER;
      default:
        return KeyValueDataType.STRING;
    }
  }
  return KeyValueDataType.STRING;
};
