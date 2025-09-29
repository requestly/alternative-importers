import { RQAPI } from '@requestly/shared/types/entities/apiClient';
import { ImportFile } from "../types";
import * as openApi3Importer from './openapi-3';
import * as swagger2Importer from './swagger-2';



export const parseOpenApiSpecToRQRecords = async (specs: ImportFile): Promise<RQAPI.CollectionRecord> => {
    console.log("Starting API spec parsing...");
    console.log("Input specs file:", {
        name: specs.name,
        type: specs.type,
        contentLength: specs.content.length
    });

    const importers = [
        openApi3Importer,
        swagger2Importer
    ];


    for (const importer of importers) {
        try {
            const result = await importer.convert(specs);
            console.log("Collection record:", result);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // TODO: fix error message
    throw new Error("All importers failed to convert the spec");
}