import { ImportFile } from "../types";
import * as openApi3Importer from './openapi-3';
import * as swagger2Importer from './swagger-2';
import { ApiClientImporterOutput } from '~/importers/types';



export const openApiImporter = async (specs: ImportFile): Promise<ApiClientImporterOutput> => {
    const importers = [
        openApi3Importer,
        swagger2Importer
    ];


    for (const importer of importers) {
        try {
            const result = await importer.convert(specs);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // TODO: fix error message
    throw new Error("All importers failed to convert the spec");
}