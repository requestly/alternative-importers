import { Group, Rule } from "@requestly/shared/types/entities/rules";

export interface HttpRuleImporterOutput {
  data?: (Rule | Group)[];
  notSupportedFeatures?: string[]; // Eg: ["mapLocal", "mapRemote"]. Depends on the type of importer
  errors?: {
    // Any errors that occurred during the import process but doesn't break the import
    message: string;
  }[];
}

export type HttpRuleImporterMethod<T> = (input: T) => HttpRuleImporterOutput;
