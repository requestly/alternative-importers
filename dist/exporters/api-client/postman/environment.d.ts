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
 * Converts Requestly environments to Postman environment format
 */
export declare function convertRequestlyEnvironmentsToPostman(requestlyData: RQExport): PostmanEnvironment[];
export type { RQExport as RequestlyExport, RQEnvironment as RequestlyEnvironment, PostmanEnvironment, };
