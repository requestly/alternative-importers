import { HttpRuleImporterMethod } from "~/importers/types";
interface ModifyHeaderAction {
    name?: string;
    value?: string;
}
interface HeaderEditorRule {
    enable?: boolean;
    name?: string;
    ruleType: "cancel" | "redirect" | "modifySendHeader" | "modifyReceiveHeader" | "modifyReceiveBody";
    matchType: "domain" | "prefix" | "regexp" | "all" | "url";
    pattern: string;
    exclude: string;
    group: string;
    isFunction: boolean;
    action?: ModifyHeaderAction | "cancel" | "redirect";
    encoding?: string;
    to?: string;
    code?: string;
}
interface HeaderEditorProfile {
    request?: HeaderEditorRule[];
    sendHeader?: HeaderEditorRule[];
    receiveHeader?: HeaderEditorRule[];
    reveiveBody?: HeaderEditorRule[];
}
export declare const headerEditorImporter: HttpRuleImporterMethod<HeaderEditorProfile>;
export {};
