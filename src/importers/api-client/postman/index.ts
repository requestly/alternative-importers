interface RequestlyVariable {
  id: number;
  syncValue: string;
  type: string;
}

interface RequestlyAuth {
  currentAuthType: string;
  authConfigStore: Record<string, any>;
}

interface RequestlyHeader {
  id?: number;
  key: string;
  value: string;
  isEnabled?: boolean;
  type?: string;
}

interface RequestlyQueryParam {
  id: number;
  key: string;
  value: string;
  isEnabled: boolean;
}

interface RequestlyRequest {
  url: string;
  method: string;
  queryParams: RequestlyQueryParam[];
  headers: RequestlyHeader[];
  body: string | null;
  contentType: string;
}

interface RequestlyScripts {
  preRequest: string;
  postResponse: string;
}

interface RequestlyRecord {
  name: string;
  type: "collection" | "api";
  data: {
    variables?: Record<string, RequestlyVariable>;
    auth?: RequestlyAuth;
    request?: RequestlyRequest;
    scripts?: RequestlyScripts;
  };
  collectionId: string;
  deleted: boolean;
  description?: string;
  id: string;
}

interface RequestlyEnvironment {
  id: string;
  name: string;
  variables: Record<string, RequestlyVariable>;
  isGlobal: boolean;
}

interface RequestlyExport {
  schema_version: string;
  records: RequestlyRecord[];
  environments?: RequestlyEnvironment[];
}

interface PostmanInfo {
  _postman_id: string;
  name: string;
  description?: string;
  schema: string;
}

interface PostmanVariable {
  id: string;
  key: string;
  value: string;
  type: string;
}

interface PostmanAuth {
  type: string;
  [key: string]: any;
}

interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
  query?: PostmanQueryParam[];
  variable?: Array<{
    key: string;
    value: string;
    description?: string;
  }>;
}

interface PostmanBody {
  mode: string;
  raw?: string;
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanScript {
  id: string;
  type: string;
  exec: string[];
  packages?: Record<string, any>;
}

interface PostmanEvent {
  listen: string;
  script: PostmanScript;
}

interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  body?: PostmanBody;
  url: PostmanUrl;
  description?: string;
  auth?: PostmanAuth;
}

interface PostmanItem {
  id: string;
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: any[];
  event?: PostmanEvent[];
  description?: string;
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
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

interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  variable?: PostmanVariable[];
  auth?: PostmanAuth;
  event?: PostmanEvent[];
}

function convertAuth(requestlyAuth?: RequestlyAuth): PostmanAuth | undefined {
  if (!requestlyAuth || requestlyAuth.currentAuthType === "INHERIT") {
    return undefined;
  }

  const authType = requestlyAuth.currentAuthType;
  const authConfig = requestlyAuth.authConfigStore[authType];

  switch (authType) {
    case "BEARER_TOKEN":
      return {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: authConfig?.bearer || "",
            type: "string",
          },
        ],
      };

    case "BASIC_AUTH":
      return {
        type: "basic",
        basic: [
          {
            key: "username",
            value: authConfig?.username || "",
            type: "string",
          },
          {
            key: "password",
            value: authConfig?.password || "",
            type: "string",
          },
        ],
      };

    case "API_KEY":
      return {
        type: "apikey",
        apikey: [
          {
            key: "key",
            value: authConfig?.key || "",
            type: "string",
          },
          {
            key: "value",
            value: authConfig?.value || "",
            type: "string",
          },
          ...(authConfig?.addTo
            ? [
                {
                  key: "in",
                  value: authConfig.addTo.toLowerCase(),
                  type: "string",
                },
              ]
            : []),
        ],
      };

    default:
      return undefined;
  }
}

function convertVariables(
  requestlyVariables?: Record<string, RequestlyVariable>
): PostmanVariable[] {
  if (!requestlyVariables) {
    return [];
  }

  return Object.entries(requestlyVariables).map(([key, variable]) => ({
    id: crypto.randomUUID(),
    key,
    value: variable.syncValue,
    type: variable.type === "string" ? "default" : variable.type,
  }));
}

function convertScripts(requestlyScripts?: RequestlyScripts): PostmanEvent[] {
  const events: PostmanEvent[] = [];

  if (requestlyScripts?.preRequest) {
    const convertedPreRequest = requestlyScripts.preRequest
      .replace(/\brq\./g, "pm.")
      .replace(/\brq\b/g, "pm");

    events.push({
      listen: "prerequest",
      script: {
        id: crypto.randomUUID(),
        type: "text/javascript",
        exec: convertedPreRequest.split("\n").filter((line) => line.trim()),
        packages: {},
      },
    });
  }

  if (requestlyScripts?.postResponse) {
    const convertedPostResponse = requestlyScripts.postResponse
      .replace(/\brq\./g, "pm.")
      .replace(/\brq\b/g, "pm");

    events.push({
      listen: "test",
      script: {
        id: crypto.randomUUID(),
        type: "text/javascript",
        exec: convertedPostResponse.split("\n").filter((line) => line.trim()),
        packages: {},
      },
    });
  }

  return events;
}

/**
 * Converts Requestly environment to Postman environment format
 */
function convertEnvironment(requestlyEnv: RequestlyEnvironment): PostmanEnvironment {
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
    _postman_exported_using: "Requestly Alternative Importer",
  };
}

/**
 * Converts Requestly environments to Postman environment format
 */
export function convertRequestlyEnvironmentsToPostman(
  requestlyData: RequestlyExport
): PostmanEnvironment[] {
  if (!requestlyData.environments || requestlyData.environments.length === 0) {
    return [];
  }

  return requestlyData.environments.map(convertEnvironment);
}

/**
 * Parses a Requestly URL and extracts components for Postman format
 */
function parseUrl(url: string): {
  host: string[];
  path: string[];
  variables: Array<{ key: string; value: string; description?: string }>;
} {
  try {
    const pathVariables: Array<{
      key: string;
      value: string;
      description?: string;
    }> = [];
    let processedUrl = url;

    const pathVarMatches = url.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (pathVarMatches) {
      pathVarMatches.forEach((match) => {
        const varName = match.substring(1);
        pathVariables.push({
          key: varName,
          value: "",
          description: `(Required) ${varName}`,
        });
      });
    }

    const [baseUrl] = processedUrl.split("?");

    const cleanUrl = baseUrl.replace(/\{\{[^}]+\}\}/g, "placeholder");

    let host: string[] = [];
    let path: string[] = [];

    if (cleanUrl.includes("://")) {
      const urlObj = new URL(cleanUrl);
      host =
        urlObj.hostname === "placeholder" ? ["{{url}}"] : [urlObj.hostname];
      path = urlObj.pathname.split("/").filter(Boolean);
    } else {
      if (baseUrl.startsWith("{{")) {
        host = [baseUrl.split("/")[0]];
        path = baseUrl.split("/").slice(1).filter(Boolean);
      } else {
        const parts = baseUrl.split("/").filter(Boolean);
        if (parts.length > 0) {
          host = [parts[0]];
          path = parts.slice(1);
        }
      }
    }

    return { host, path, variables: pathVariables };
  } catch (error) {
    const parts = url.split("/").filter(Boolean);
    return {
      host: parts.length > 0 ? [parts[0]] : ["{{url}}"],
      path: parts.slice(1),
      variables: [],
    };
  }
}

/**
 * Converts Requestly request to Postman request format
 */
function convertRequest(
  requestlyRecord: RequestlyRecord
): PostmanRequest | undefined {
  const requestData = requestlyRecord.data.request;
  if (!requestData) {
    return undefined;
  }

  const { host, path, variables } = parseUrl(requestData.url);

  const [, queryString] = requestData.url.split("?");
  const urlQueryParams: PostmanQueryParam[] = [];

  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    urlParams.forEach((value, key) => {
      urlQueryParams.push({
        key,
        value,
        disabled: true,
      });
    });
  }

  const requestQueryParams: PostmanQueryParam[] = requestData.queryParams.map(
    (param) => ({
      key: param.key,
      value: param.value,
      disabled: !param.isEnabled,
    })
  );

  const allQueryParams = [...urlQueryParams, ...requestQueryParams];

  const headers: PostmanHeader[] = requestData.headers.map((header) => ({
    key: header.key,
    value: header.value,
    type: header.type || "text",
    disabled: header.isEnabled === false,
  }));

  let body: PostmanBody | undefined;
  if (requestData.body && requestData.body.trim()) {
    const isJson =
      requestData.contentType === "application/json" ||
      (requestData.body.trim().startsWith("{") &&
        requestData.body.trim().endsWith("}"));

    body = {
      mode: "raw",
      raw: requestData.body,
      ...(isJson && {
        options: {
          raw: {
            language: "json",
          },
        },
      }),
    };
  }

  const postmanUrl: PostmanUrl = {
    raw: requestData.url,
    host,
    path,
    ...(allQueryParams.length > 0 && { query: allQueryParams }),
    ...(variables.length > 0 && { variable: variables }),
  };

  return {
    method: requestData.method,
    header: headers,
    ...(body && { body }),
    url: postmanUrl,
    ...(requestlyRecord.description && {
      description: requestlyRecord.description,
    }),
    ...(requestlyRecord.data.auth && {
      auth: convertAuth(requestlyRecord.data.auth),
    }),
  };
}

/**
 * Builds a hierarchical structure from flat Requestly records
 */
function buildHierarchy(
  records: RequestlyRecord[]
): Map<string, RequestlyRecord[]> {
  const hierarchy = new Map<string, RequestlyRecord[]>();

  records.forEach((record) => {
    const parentId = record.collectionId || "root";
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }
    hierarchy.get(parentId)!.push(record);
  });

  return hierarchy;
}

/**
 * Converts records to Postman items recursively
 */
function convertToPostmanItems(
  records: RequestlyRecord[],
  hierarchy: Map<string, RequestlyRecord[]>
): PostmanItem[] {
  return records.map((record) => {
    const item: PostmanItem = {
      id: crypto.randomUUID(),
      name: record.name,
      ...(record.description && { description: record.description }),
    };

    if (record.type === "collection") {
      const children = hierarchy.get(record.id) || [];
      item.item = convertToPostmanItems(children, hierarchy);

      if (record.data.auth) {
        item.auth = convertAuth(record.data.auth);
      }

      if (record.data.variables) {
        item.variable = convertVariables(record.data.variables);
      }

      if (record.data.scripts) {
        item.event = convertScripts(record.data.scripts);
      }
    } else if (record.type === "api") {
      item.request = convertRequest(record);
      item.response = [];

      if (record.data.scripts) {
        item.event = convertScripts(record.data.scripts);
      }
    }

    return item;
  });
}

/**
 * Main function to convert Requestly export to Postman collection
 */
export function convertRequestlyCollectionToPostman(
  requestlyData: RequestlyExport
): PostmanCollection {
  const records = requestlyData.records.filter((record) => !record.deleted);

  // Get all collection IDs to check for orphaned collections
  const existingCollectionIds = new Set(
    records
      .filter((record) => record.type === "collection")
      .map((record) => record.id)
  );

  const rootCollections = records.filter(
    (record) => record.type === "collection" && 
    (!record.collectionId || !existingCollectionIds.has(record.collectionId))
  );

  const hierarchy = buildHierarchy(records);

  const mainCollection = rootCollections[0];
  const collectionName = mainCollection?.name || (records.length === 0 ? "Imported Collection" : "Requestly Collection");
  const collectionDescription = mainCollection?.description;

  let allItems: PostmanItem[] = [];

  if (mainCollection) {
    const children = hierarchy.get(mainCollection.id) || [];
    allItems = convertToPostmanItems(children, hierarchy);

    const mainCollectionAuth = mainCollection.data.auth
      ? convertAuth(mainCollection.data.auth)
      : undefined;
    const mainCollectionVariables = mainCollection.data.variables
      ? convertVariables(mainCollection.data.variables)
      : [];
    const mainCollectionEvents = mainCollection.data.scripts
      ? convertScripts(mainCollection.data.scripts)
      : [];

    return {
      info: {
        _postman_id: crypto.randomUUID(),
        name: collectionName,
        ...(collectionDescription && { description: collectionDescription }),
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: allItems,
      ...(mainCollectionVariables.length > 0 && {
        variable: mainCollectionVariables,
      }),
      ...(mainCollectionAuth && { auth: mainCollectionAuth }),
      ...(mainCollectionEvents.length > 0 && { event: mainCollectionEvents }),
    };
  } else {
    allItems = convertToPostmanItems(records, hierarchy);

    return {
      info: {
        _postman_id: crypto.randomUUID(),
        name: collectionName,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: allItems,
    };
  }
}

export type {
  RequestlyExport,
  RequestlyEnvironment,
  PostmanCollection,
  PostmanEnvironment,
  RequestlyRecord,
  PostmanItem,
};
