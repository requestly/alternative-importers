export interface ImportFile {
    type: string;
    name: string;
    content: string
}

export enum ApiClientImporterType {
    OPEN_API = "open_api",
    SWAGGER_2 = "swagger_2",
}