import { ImportFile } from "../types";
import * as soap from './soap';
import { ApiClientImporterOutput } from '~/importers/types';

export const soapImporter = async (wsdl: ImportFile): Promise<ApiClientImporterOutput> => {
    return await soap.convert(wsdl);
}