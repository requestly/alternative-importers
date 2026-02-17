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
    type?: "text" | "file";
}
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
/**
 * Export result for multiple collections
 */
interface MultipleCollectionsResult {
    type: 'multiple';
    zipData: Uint8Array;
    collections: {
        name: string;
        data: PostmanCollection;
    }[];
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
export declare function convertRequestlyCollectionToPostman(requestlyData: RQExport): SingleCollectionResult | Promise<MultipleCollectionsResult>;
export type { RQExport as RequestlyExport, RQRecord as RequestlyRecord, PostmanCollection, PostmanItem, MultipleCollectionsResult, SingleCollectionResult, };
