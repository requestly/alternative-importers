import JSZip from 'jszip';
import { RQAPI, EnvironmentData, Authorization, VariableData, EnvironmentVariables } from '@requestly/shared/types/entities/apiClient';
// Shared types for both collection and environment

interface RQExport {
  schema_version: string;
  records: RQAPI.ApiClientRecord[];
  environments?: EnvironmentData[];
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
  description?: string;
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
  protocol: 'http' | 'https';
  variable?: Array<{
    key: string;
    value: string;
    description?: string;
  }>;
}

interface PostmanFormField {
  key: string;
  value?: string;
  description?: string;
  type?: "text" | "file";
  disabled?: boolean;
  src?: string;
}

interface PostmanBody {
  mode: "raw" | "urlencoded" | "formdata";
  raw?: string;
  urlencoded?: PostmanFormField[];
  formdata?: PostmanFormField[];
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

interface PostmanResponse {
  id?: string;
  name: string;
  originalRequest?: PostmanRequest;
  status?: string;
  code?: number;
  header?: PostmanHeader[];
  cookie?: any[];
  body?: string;
  _postman_previewlanguage?: string;
}

interface PostmanItem {
  id: string;
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: PostmanResponse[];
  event?: PostmanEvent[];
  description?: string;
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
}

interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  variable?: PostmanVariable[];
  auth?: PostmanAuth;
  event?: PostmanEvent[];
}

function convertAuth(requestlyAuth?: RQAPI.Auth): PostmanAuth | undefined {
  if (!requestlyAuth || requestlyAuth.currentAuthType === "INHERIT") {
    return undefined;
  }

  const authType = requestlyAuth.currentAuthType;
  const authConfig = requestlyAuth.authConfigStore;

  switch (authType) {
    case Authorization.Type.BEARER_TOKEN:
      return {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: authConfig[Authorization.Type.BEARER_TOKEN]?.bearer || "",
            type: "string",
          },
        ],
      };

    case Authorization.Type.BASIC_AUTH:
      return {
        type: "basic",
        basic: [
          {
            key: "username",
            value: authConfig[Authorization.Type.BASIC_AUTH]?.username || "",
            type: "string",
          },
          {
            key: "password",
            value: authConfig[Authorization.Type.BASIC_AUTH]?.password || "",
            type: "string",
          },
        ],
      };

    case Authorization.Type.API_KEY:
      return {
        type: "apikey",
        apikey: [
          {
            key: "key",
            value: authConfig[Authorization.Type.API_KEY]?.key || "",
            type: "string",
          },
          {
            key: "value",
            value: authConfig[Authorization.Type.API_KEY]?.value || "",
            type: "string",
          },
          ...(authConfig[Authorization.Type.API_KEY]?.addTo
            ? [
                {
                  key: "in",
                  value: authConfig[Authorization.Type.API_KEY]?.addTo.toLowerCase(),
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
  requestlyVariables?: Omit<EnvironmentVariables, "localValue">
): PostmanVariable[] {
  if (!requestlyVariables) {
    return [];
  }

  return Object.entries(requestlyVariables).map(([key, variable]) => ({
    id: crypto.randomUUID(),
    key,
    value: String(variable.syncValue ?? ""),
    type: variable.type === "string" ? "default" : variable.type,
  }));
}

/**
 * Converts Requestly script to Postman script format by replacing 'rq' with 'pm'
 */
function convertScript(script: string): string {
  return script
  .replace(/\brq\./g, "pm.")
  .replace(/\brq\b/g, "pm");
}

function convertScripts(requestlyScripts?: { preRequest?: string; postResponse?: string }): PostmanEvent[] {
  const events: PostmanEvent[] = [];

  if (requestlyScripts?.preRequest) {
    const convertedPreRequest = convertScript(requestlyScripts.preRequest);

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
    const convertedPostResponse = convertScript(requestlyScripts.postResponse);

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
 * Parses a Requestly URL and extracts components for Postman format
 */
function parseUrl(url: string): {
  host: string[];
  path: string[];
  protocol: 'http' | 'https';
  variables: Array<{ key: string; value: string; description?: string }>;
} {
  try {
    const pathVariables: Array<{
      key: string;
      value: string;
      description?: string;
    }> = [];

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

    const [baseUrl] = url.split("?");

    const cleanUrl = baseUrl.replace(/\{\{[^}]+\}\}/g, "placeholder");
    let host: string[] = [];
    let path: string[] = [];
    let protocol: 'http' | 'https' = 'https'; // Default to https

    if (cleanUrl.includes("://")) {
      const urlObj = new URL(cleanUrl);
      protocol = urlObj.protocol.replace(':', '') as 'http' | 'https';
      if (urlObj.hostname === "placeholder") {
        host = ["{{url}}"];
      } else {
        host = urlObj.hostname.split(".");
      }
      path = urlObj.pathname.split("/").filter(Boolean);
    } else {
      if (baseUrl.startsWith("{{")) {
        host = [baseUrl.split("/")[0]];
        path = baseUrl.split("/").slice(1).filter(Boolean);
      } else {
        const parts = baseUrl.split("/").filter(Boolean);
        if (parts.length > 0) {
          host = parts[0].split(".");
          path = parts.slice(1);
        }
      }
    }

    return { host, path, protocol, variables: pathVariables };
  } catch (error) {
    const parts = url.split("/").filter(Boolean);
    return {
      host: parts.length > 0 ? [parts[0]] : ["{{url}}"],
      path: parts.slice(1),
      protocol: 'https', // Default to https
      variables: [],
    };
  }
}

/**
 * Converts Requestly request to Postman request format
 */
function convertRequest(
  requestlyRecord: RQAPI.ApiRecord
): PostmanRequest | undefined {
  const requestData = requestlyRecord.data;
  if (!requestData || requestData.type === RQAPI.ApiEntryType.GRAPHQL) {
    return undefined;
  }

  const { host, path, protocol, variables } = parseUrl(requestData.request.url);

  const [, queryString] = requestData.request.url.split("?");
  const queryParamsMap = new Map<string, PostmanQueryParam>();

  // First, add URL query parameters (disabled by default)
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    urlParams.forEach((value, key) => {
      queryParamsMap.set(key, {
        key,
        value,
        disabled: true,
      });
    });
  }

  if (requestData.type === RQAPI.ApiEntryType.HTTP) {
  // Then, add/override with request query parameters (respecting their enabled state)
  requestData.request.queryParams.forEach((param) => {
    queryParamsMap.set(param.key, {
      key: param.key,
      value: param.value,
      disabled: !param.isEnabled,
      description: param.description,
    });
  });
}

  const allQueryParams = Array.from(queryParamsMap.values());

  const headers: PostmanHeader[] = requestData.request.headers.map((header) => ({
    key: header.key,
    value: header.value,
    type: header.type || "text",
    disabled: !header.isEnabled,
    description: header.description,
  }));

  let body: PostmanBody | undefined;

  if(requestData.type === RQAPI.ApiEntryType.HTTP) {
  // Handle different body types based on content type and body structure
  if (requestData.request.body !== null && requestData.request.body !== undefined) {
    if (requestData.request.contentType === "multipart/form-data") {
      // Handle multipart form data
      const formFields = Array.isArray(requestData.request.body) ? requestData.request.body : requestData.request.bodyContainer?.multipartForm || [];
      
      body = {
        mode: "formdata",
        formdata: formFields.map((field) => {
          // Determine field type: if value is an array, it's a file field, otherwise text
          const fieldType = ('type' in field && field.type) || (Array.isArray(field.value) ? "file" : "text");
          
          const postmanField: PostmanFormField = {
            key: field.key,
            disabled: !field.isEnabled,
            type: fieldType as "text" | "file" | undefined,
          };

          if (fieldType === "file" && Array.isArray(field.value)) {
            // Handle file fields
            const fileInfo = field.value[0]; // Take the first file
            postmanField.src = fileInfo?.path || "";
            postmanField.value = fileInfo?.name || "";
          } else {
            // Handle text fields
            postmanField.value = typeof field.value === "string" ? field.value : "";
          }

          return postmanField;
        }),
      };
    } else if (requestData.request.contentType === "application/x-www-form-urlencoded") {
      // Handle URL encoded form data - these are always simple text fields
        const formFields = Array.isArray(requestData.request.body)
            ? requestData.request.body
            : requestData.request.bodyContainer?.form || [];
      
      body = {
        mode: "urlencoded",
        urlencoded: formFields.map((field) => ({
          key: field.key,
          value: typeof field.value === "string" ? field.value : String(field.value),
          disabled: !field.isEnabled,
          type: "text",
        })),
      };
    } else if (typeof requestData.request.body === "string" && requestData.request.body.trim()) {
      // Handle raw body (JSON or raw text)
      let language = requestData.request.contentType === "application/json" ? "json" : "text";

      body = {
        mode: "raw",
        raw: requestData.request.body,
        options: {
          raw: {
            language,
          },
        },
      };
    }
  }
}

  const postmanUrl: PostmanUrl = {
    raw: requestData.request.url,
    host,
    path,
    protocol,
    ...(allQueryParams.length > 0 && { query: allQueryParams }),
    ...(variables.length > 0 && { variable: variables }),
  };

  return {
    method: requestData.request.method,
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

function convertExample(
  example: RQAPI.ExampleApiRecord,
  parentRequest?: PostmanRequest,
): PostmanResponse {
  const exampleData = example.data || {};
  const exampleResponse = exampleData.response;

  const headers: PostmanHeader[] = (exampleResponse?.headers || []).map(
    (header) => ({
      key: header.key,
      value: header.value,
      type: header.type || "text",
      disabled: !header.isEnabled,
      description: header.description,
    }),
  );

  let previewLanguage = "text";
  const contentType =
    headers.find((h) => h.key.toLowerCase() === "content-type")?.value || "";
  if (contentType.includes("json")) previewLanguage = "json";
  else if (contentType.includes("xml")) previewLanguage = "xml";
  else if (contentType.includes("html")) previewLanguage = "html";

  // If example has its own request payload, wrap it in a mock record to safely reuse convertRequest
  let originalRequest = parentRequest;
  if (exampleData.request) {
    const mockRecord: RQAPI.HttpApiRecord = {
      id: "mock",
      name: "mock",
      type: RQAPI.RecordType.API,
      collectionId: "mock",
      deleted: false,
      data: {
        request: exampleData.request as RQAPI.HttpRequest,
        auth: exampleData.auth,
        type: RQAPI.ApiEntryType.HTTP,
        response: null,
      },
      ownerId: "mock",
      createdBy: "mock",
      updatedBy: "mock",
      createdTs: Date.now(),
      updatedTs: Date.now(),
    };
    originalRequest = convertRequest(mockRecord) || parentRequest;
  }

  return {
    id: example.id || crypto.randomUUID(),
    name: example.name || "Example",
    originalRequest,
    status: exampleResponse?.statusText || "OK",
    code: exampleResponse?.status || 200,
    header: headers,
    cookie: [],
    body: exampleResponse?.body || "",
    _postman_previewlanguage: previewLanguage,
  };
}
/**
 * Builds a hierarchical structure from flat Requestly records
 */
function buildHierarchy(
  records: RQAPI.ApiClientRecord[]
): Map<string, RQAPI.ApiClientRecord[]> {
  const hierarchy = new Map<string, RQAPI.ApiClientRecord[]>();

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
  records: RQAPI.ApiClientRecord[],
  hierarchy: Map<string, RQAPI.ApiClientRecord[]>
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
      const postmanRequest = convertRequest(record);
      if (!postmanRequest) {
        return null;
      }
        item.request = postmanRequest;

      item.response = record.data.examples
        ? record.data.examples.map((ex) => convertExample(ex, postmanRequest))
        : [];

      if (record.data.scripts) {
        item.event = convertScripts(record.data.scripts);
      }
    }

    return item;
  }).filter(Boolean) as PostmanItem[];;
}

/**
 * Creates a single Postman collection from a root collection
 */
function createCollectionFromRoot(
  rootCollection: RQAPI.CollectionRecord,
  hierarchy: Map<string, RQAPI.ApiClientRecord[]>
): PostmanCollection {
  const children = hierarchy.get(rootCollection.id) || [];
  const allItems = convertToPostmanItems(children, hierarchy);

  const collectionAuth = rootCollection.data.auth
    ? convertAuth(rootCollection.data.auth)
    : undefined;
  const collectionVariables = rootCollection.data.variables
    ? convertVariables(rootCollection.data.variables)
    : [];
  const collectionEvents = rootCollection.data.scripts
    ? convertScripts(rootCollection.data.scripts)
    : [];

  return {
    info: {
      _postman_id: crypto.randomUUID(),
      name: rootCollection.name,
      ...(rootCollection.description && { description: rootCollection.description }),
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: allItems,
    ...(collectionVariables.length > 0 && {
      variable: collectionVariables,
    }),
    ...(collectionAuth && { auth: collectionAuth }),
    ...(collectionEvents.length > 0 && { event: collectionEvents }),
  };
}

/**
 * Creates a ZIP file containing multiple JSON files using JSZip
 */
async function createZipFile(collections: { name: string; data: PostmanCollection }[]): Promise<Uint8Array> {
  const zip = new JSZip();

  // Create the archive.json file with collection metadata
  const archiveData = {
    collection: collections.reduce((acc, collection) => {
      acc[collection.data.info._postman_id] = true;
      return acc;
    }, {} as Record<string, boolean>)
  };

  zip.file('archive.json', JSON.stringify(archiveData, null, 2));

  // Create collection folder and add each collection as a JSON file
  const collectionFolder = zip.folder('collection');

  collections.forEach(collection => {
    const fileName = `${collection.data.info._postman_id}.json`;
    const jsonContent = JSON.stringify(collection.data, null, 2);
    collectionFolder!.file(fileName, jsonContent);
  });

  // Generate the ZIP file as Uint8Array
  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}

/**
 * Export result for multiple collections
 */
interface MultipleCollectionsResult {
  type: 'multiple';
  zipData: Uint8Array;
  collections: { name: string; data: PostmanCollection }[];
}

/**
 * Export result for single collection
 */
interface SingleCollectionResult {
  type: 'single';
  collection: PostmanCollection;
}

/**
 * Main function to convert Requestly export to Postman collection(s)
 */
export function convertRequestlyCollectionToPostman(
  requestlyData: RQExport
): SingleCollectionResult | Promise<MultipleCollectionsResult> {
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
  ) as RQAPI.CollectionRecord[];

  const hierarchy = buildHierarchy(records);

  // If there are multiple root collections, create separate collections and zip them
  if (rootCollections.length > 1) {
    const collections = rootCollections.map(rootCollection => ({
      name: rootCollection.name,
      data: createCollectionFromRoot(rootCollection, hierarchy)
    }));

    return createZipFile(collections).then(zipData => ({
      type: 'multiple' as const,
      zipData,
      collections
    }));
  }

  // Single collection case (existing behavior)
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
      type: 'single',
      collection: {
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
      }
    };
  } else {
    allItems = convertToPostmanItems(records, hierarchy);

    return {
      type: 'single',
      collection: {
        info: {
          _postman_id: crypto.randomUUID(),
          name: collectionName,
          schema:
            "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: allItems,
      }
    };
  }
}

export type {
  RQExport as RequestlyExport,
  PostmanCollection,
  PostmanItem,
  MultipleCollectionsResult,
  SingleCollectionResult,
};
