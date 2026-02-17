import { EnvironmentData, RQAPI } from "@requestly/shared/types/entities/apiClient";
import { Group, Rule } from "@requestly/shared/types/entities/rules";
export interface HttpRuleImporterOutput {
    data?: (Rule | Group)[];
    notSupportedFeatures?: string[];
    errors?: {
        message: string;
    }[];
}
export interface ApiClientImporterOutput {
    data: {
        collection: RQAPI.CollectionRecord;
        environments: EnvironmentData[];
    };
}
export type HttpRuleImporterMethod<T> = (input: T) => HttpRuleImporterOutput;
export type ApiClientImporterMethod<T> = (input: T) => Promise<ApiClientImporterOutput>;
