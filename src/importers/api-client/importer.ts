import { parseOpenApiSpecToRQRecords } from "./open-api";
import { ApiClientImporterType, ImportFile } from "./types";

export const apiClientImporter = async (file: ImportFile, type: ApiClientImporterType) => {
    switch(type) {
        case ApiClientImporterType.OPEN_API:
        case ApiClientImporterType.SWAGGER_2:
            return parseOpenApiSpecToRQRecords(file);
    }
}
