import { HttpRuleImporterMethod } from "~/importers/types";
interface ModheaderProfile {
    title: string;
    headers?: any[];
    respHeaders?: any[];
    urlReplacements?: any[];
    cspDirectives?: any[];
    reqCookieAppend?: any[];
    urlFilters?: any[];
    resourceFilters?: any[];
    requestMethodFilters?: any[];
}
export declare const modheaderImporter: HttpRuleImporterMethod<ModheaderProfile[]>;
export {};
