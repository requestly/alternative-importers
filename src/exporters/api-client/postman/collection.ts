import JSZip from 'jszip';

// Shared types for both collection and environment
interface RQVariable {
  id: number;
  syncValue: string;
  type: string;
}

interface RQAuth {
  currentAuthType: string;
  authConfigStore: Record<string, any>;
}

interface RQHeader {
  id?: number;
  key: string;
  value: string;
  isEnabled?: boolean;
  type?: string;
  description?: string;
}

interface RQQueryParam {
  id: number;
  key: string;
  value: string;
  isEnabled: boolean;
  description?: string;
}

interface RQFormField {
  id: number;
  key: string;
  value: string | Array<{
    id: string;
    name: string;
    path: string;
    size: number;
    source: string;
  }>;
  isEnabled: boolean;
  type?: "text" | "file"; // Optional since many form fields don't have this
}

// For simpler form fields (like URL-encoded) that don't have type
interface RQSimpleFormField {
  id: number;
  key: string;
  value: string;
  isEnabled: boolean;
}

interface RQBodyContainer {
  text: string;
  form: RQFormField[];
  multipartForm: RQFormField[];
}

interface RQRequest {
  url: string;
  method: string;
  queryParams: RQQueryParam[];
  headers: RQHeader[];
  body: string | RQFormField[] | RQSimpleFormField[] | null;
  contentType: string;
  bodyContainer?: RQBodyContainer;
}

interface RQScripts {
  preRequest: string;
  postResponse: string;
}

interface RQRecord {
  name: string;
  type: "collection" | "api";
  data: {
    variables?: Record<string, RQVariable>;
    auth?: RQAuth;
    request?: RQRequest;
    scripts?: RQScripts;
  };
  collectionId: string;
  deleted: boolean;
  description?: string;
  id: string;
}

interface RQEnvironment {
  id: string;
  name: string;
  variables: Record<string, RQVariable>;
  isGlobal: boolean;
}

interface RQExport {
  schema_version: string;
  records: RQRecord[];
  environments?: RQEnvironment[];
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

interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  variable?: PostmanVariable[];
  auth?: PostmanAuth;
  event?: PostmanEvent[];
}

function convertAuth(requestlyAuth?: RQAuth): PostmanAuth | undefined {
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
  requestlyVariables?: Record<string, RQVariable>
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

/**
 * Converts Requestly script to Postman script format by replacing 'rq' with 'pm'
 */
function convertScript(script: string): string {
  return script
    .replace(/\brq\./g, "pm.")
    .replace(/\brq\b/g, "pm");
}

function convertScripts(requestlyScripts?: RQScripts): PostmanEvent[] {
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
  requestlyRecord: RQRecord
): PostmanRequest | undefined {
  const requestData = requestlyRecord.data.request;
  if (!requestData) {
    return undefined;
  }

  const { host, path, protocol, variables } = parseUrl(requestData.url);

  const [, queryString] = requestData.url.split("?");
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

  // Then, add/override with request query parameters (respecting their enabled state)
  requestData.queryParams.forEach((param) => {
    queryParamsMap.set(param.key, {
      key: param.key,
      value: param.value,
      disabled: !param.isEnabled,
      description: param.description,
    });
  });

  const allQueryParams = Array.from(queryParamsMap.values());

  const headers: PostmanHeader[] = requestData.headers.map((header) => ({
    key: header.key,
    value: header.value,
    type: header.type || "text",
    disabled: !header.isEnabled,
    description: header.description,
  }));

  let body: PostmanBody | undefined;
  
  // Handle different body types based on content type and body structure
  if (requestData.body !== null && requestData.body !== undefined) {
    if (requestData.contentType === "multipart/form-data") {
      // Handle multipart form data
      const formFields = Array.isArray(requestData.body) ? requestData.body : requestData.bodyContainer?.multipartForm || [];
      
      body = {
        mode: "formdata",
        formdata: formFields.map((field) => {
          // Determine field type: if value is an array, it's a file field, otherwise text
          const fieldType = ('type' in field && field.type) || (Array.isArray(field.value) ? "file" : "text");
          
          const postmanField: PostmanFormField = {
            key: field.key,
            disabled: !field.isEnabled,
            type: fieldType,
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
    } else if (requestData.contentType === "application/x-www-form-urlencoded") {
      // Handle URL encoded form data - these are always simple text fields
      const formFields = Array.isArray(requestData.body) ? requestData.body : [];
      
      body = {
        mode: "urlencoded",
        urlencoded: formFields.map((field) => ({
          key: field.key,
          value: typeof field.value === "string" ? field.value : String(field.value),
          disabled: !field.isEnabled,
          type: "text",
        })),
      };
    } else if (typeof requestData.body === "string" && requestData.body.trim()) {
      // Handle raw body (JSON or raw text)
      let language = requestData.contentType === "application/json" ? "json" : "text";

      body = {
        mode: "raw",
        raw: requestData.body,
        options: {
          raw: {
            language,
          },
        },
      };
    }
  }

  const postmanUrl: PostmanUrl = {
    raw: requestData.url,
    host,
    path,
    protocol,
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
  records: RQRecord[]
): Map<string, RQRecord[]> {
  const hierarchy = new Map<string, RQRecord[]>();

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
  records: RQRecord[],
  hierarchy: Map<string, RQRecord[]>
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
 * Creates a single Postman collection from a root collection
 */
function createCollectionFromRoot(
  rootCollection: RQRecord,
  hierarchy: Map<string, RQRecord[]>
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
  );

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
  RQRecord as RequestlyRecord,
  PostmanCollection,
  PostmanItem,
  MultipleCollectionsResult,
  SingleCollectionResult,
};
