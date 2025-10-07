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

  // Return default value if specified
  if (paramSchema.default !== undefined) {
    return paramSchema.default;
  }

  // Return first enum value if available
  if (paramSchema.enum && paramSchema.enum.length > 0) {
    return getEnumValue(paramSchema);
  }

  // Return type-specific default value
  const paramType = getParamType(paramSchema);
  return getDefaultValueForType(paramType, paramSchema);
};
