// Environment specific types and functions for Postman conversion

interface RQVariable {
  id: number;
  syncValue: string;
  type: string;
}

interface RQEnvironment {
  id: string;
  name: string;
  variables: Record<string, RQVariable>;
  isGlobal: boolean;
}

interface RQExport {
  schema_version: string;
  records: any[];
  environments?: RQEnvironment[];
}

interface PostmanEnvironment {
  id: string;
  name: string;
  values: Array<{
    key: string;
    value: string;
    type: string;
    enabled: boolean;
  }>;
  _postman_variable_scope: string;
  _postman_exported_at?: string;
  _postman_exported_using?: string;
}

/**
 * Converts Requestly environment to Postman environment format
 */
function convertEnvironment(requestlyEnv: RQEnvironment): PostmanEnvironment {
  const values = Object.entries(requestlyEnv.variables).map(([key, variable]) => ({
    key,
    value: variable.syncValue,
    type: variable.type === "secret" ? "secret" : "default",
    enabled: true,
  }));

  return {
    id: crypto.randomUUID(),
    name: requestlyEnv.name,
    values,
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "Requestly Exporter",
  };
}

/**
 * Converts Requestly environments to Postman environment format
 */
export function convertRequestlyEnvironmentsToPostman(
  requestlyData: RQExport
): PostmanEnvironment[] {
  if (!requestlyData.environments || requestlyData.environments.length === 0) {
    return [];
  }

  return requestlyData.environments.map(convertEnvironment);
}

export type {
  RQExport as RequestlyExport,
  RQEnvironment as RequestlyEnvironment,
  PostmanEnvironment,
};
