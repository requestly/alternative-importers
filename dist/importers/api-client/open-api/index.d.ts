import { ImportFile } from "../types";
import { ApiClientImporterOutput } from '~/importers/types';
export declare const openApiImporter: (specs: ImportFile) => Promise<ApiClientImporterOutput>;
