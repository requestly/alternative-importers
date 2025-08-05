interface RequestlyExport {
  schema_version: string;
  records: RequestlyRecord[];
}

interface RequestlyRecord {
  name: string;
  type: string;
  data: any; 
  collectionId?: string;
  deleted: boolean;
  description?: string;
  id: string;
}

interface PostmanExport {
  info: PostmanInfo;
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

interface PostmanInfo {
  _postman_id: string;
  name: string;
  description?: string;
  schema: string;
  _exporter_id?: string;
  _collection_link?: string;
}

interface PostmanItem {
  name: string;
  event?: PostmanEvent[];
  request: PostmanRequest;
  response: any[];
  description?: string;
}

interface PostmanEvent {
  listen: string;
  script: PostmanScript;
}

interface PostmanScript {
  exec: string[];
  type: string;
  packages?: Record<string, any>;
}

interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  body?: PostmanBody;
  url: PostmanUrl;
  description?: string;
}

interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
}

interface PostmanBody {
  mode: string;
  raw?: string;
  options?: {
    raw?: {
      language: string;
    };
  };
}

interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
  query?: PostmanQueryParam[];
}

interface PostmanQueryParam {
  key: string;
  value: string;
}

interface PostmanVariable {
  key: string;
  value: string;
  type: string;
}


export function convertRequestlyToPostman(requestlyExport: RequestlyExport): PostmanExport {
  if (!requestlyExport || !requestlyExport.records) {
    throw new Error('Invalid Requestly export: missing records');
  }

  const collections = requestlyExport.records.filter(record => record.type === 'collection');
  const apis = requestlyExport.records.filter(record => record.type === 'api');

  if (collections.length === 0) {
    throw new Error('No collection found in Requestly export');
  }

  const collection = collections[0]; 
  const collectionData = collection.data;

  
  const postmanInfo: PostmanInfo = {
    _postman_id: crypto.randomUUID(),
    name: collection.name,
    description: collection.description,
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  };

  
  const postmanVariables: PostmanVariable[] = [];
  if (collectionData.variables) {
    Object.entries(collectionData.variables).forEach(([key, variable]: [string, any]) => {
      postmanVariables.push({
        key,
        value: variable.syncValue,
        type: variable.type
      });
    });
  }

  
  const allCollectionIds = collections.map(col => col.id);
  
  
  const postmanItems: PostmanItem[] = apis
    .filter(api => !api.deleted && api.collectionId && allCollectionIds.includes(api.collectionId))
    .map(api => convertApiToPostmanItem(api));

  const postmanExport: PostmanExport = {
    info: postmanInfo,
    item: postmanItems
  };

  if (postmanVariables.length > 0) {
    postmanExport.variable = postmanVariables;
  }

  return postmanExport;
}

function convertApiToPostmanItem(api: RequestlyRecord): PostmanItem {
  const apiData = api.data;
  const request = apiData.request;

  
  const url = parseRequestlyUrl(request.url, request.queryParams || []);

  
  const headers: PostmanHeader[] = (request.headers || [])
    .filter((header: any) => header.isEnabled)
    .map((header: any) => ({
      key: header.key,
      value: header.value,
      type: "text"
    }));

  
  let body: PostmanBody | undefined;
  if (request.body && request.body.trim() !== '') {
    const language = getLanguageFromContentType(request.contentType || 'text/plain');
    body = {
      mode: "raw",
      raw: request.body,
      options: {
        raw: {
          language
        }
      }
    };
  }

  
  const events: PostmanEvent[] = [];
  if (apiData.scripts) {
    if (apiData.scripts.preRequest && apiData.scripts.preRequest.trim() !== '') {
      events.push({
        listen: "prerequest",
        script: {
          exec: convertRequestlyScriptToPostman(apiData.scripts.preRequest),
          type: "text/javascript",
          packages: {}
        }
      });
    }

    if (apiData.scripts.postResponse && apiData.scripts.postResponse.trim() !== '') {
      events.push({
        listen: "test",
        script: {
          exec: convertRequestlyScriptToPostman(apiData.scripts.postResponse),
          type: "text/javascript",
          packages: {}
        }
      });
    }
  }

  const postmanRequest: PostmanRequest = {
    method: request.method,
    header: headers,
    url
  };

  if (body) {
    postmanRequest.body = body;
  }

  const postmanItem: PostmanItem = {
    name: api.name,
    request: postmanRequest,
    response: []
  };

  if (events.length > 0) {
    postmanItem.event = events;
  }

  return postmanItem;
}

function parseRequestlyUrl(urlString: string, queryParams: any[] = []): PostmanUrl {
  try {
    
    const url = new URL(urlString.replace(/\{\{[^}]+\}\}/g, 'http://placeholder'));
    
    const hostParts = urlString.includes('{{') 
      ? [urlString.split('/')[0]] 
      : url.hostname.split('.');

    const pathParts = url.pathname.split('/').filter(part => part !== '');

    
    const query: PostmanQueryParam[] = queryParams
      .filter((param: any) => param && param.isEnabled)
      .map((param: any) => ({
        key: param.key,
        value: param.value
      }));

    const postmanUrl: PostmanUrl = {
      raw: urlString,
      host: hostParts,
      path: pathParts
    };

    if (query.length > 0) {
      postmanUrl.query = query;
    }

    return postmanUrl;
  } catch (error) {
    
    return {
      raw: urlString,
      host: [urlString],
      path: []
    };
  }
}

function getLanguageFromContentType(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case 'application/json':
      return 'json';
    case 'application/xml':
    case 'text/xml':
      return 'xml';
    case 'text/html':
      return 'html';
    case 'text/javascript':
      return 'javascript';
    default:
      return 'text';
  }
}

function convertRequestlyScriptToPostman(requestlyScript: string): string[] {
  
  let convertedScript = requestlyScript
    .replace(/rq\./g, 'pm.')
    .replace(/rq\.response\./g, 'pm.response.')
    .replace(/rq\.request\./g, 'pm.request.')
    .replace(/rq\.test\(/g, 'pm.test(')
    .replace(/rq\.expect\(/g, 'pm.expect(');

  
  return convertedScript
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
}
