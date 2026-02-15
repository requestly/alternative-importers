import { ImportFile } from "../types";
import * as soap from './soap';
import { ApiClientImporterOutput } from '~/importers/types';

export const soapImporter = async (Wsdl: ImportFile): Promise<ApiClientImporterOutput> => {
    return await soap.convert(Wsdl);
}