import { RQAPI, EnvironmentData, VariableScope } from "@requestly/shared/types/entities/apiClient";

export interface BaseImporterOutput<T> {
  data: T[];
  notSupportedFeatures?: string[];
  errors?: string[];
  warnings?: string[];
}


// Environment Entity
export type Environment = EnvironmentData & { scope: VariableScope };
export type EnvironmentWithoutId = WithoutPrimaryKey<Environment, "id">;

export interface EnvironmentImporterOutput extends BaseImporterOutput<EnvironmentWithoutId> { }


// Collection Entity
export type APIClientRecordWithoutId = WithoutPrimaryKey<RQAPI.ApiClientRecord>;
export interface CollectionImporterOutput extends BaseImporterOutput<APIClientRecordWithoutId> { }


// Utils

// Removes id or any other primary key from the type. Generation should be handled by the consumer
export type WithoutPrimaryKey<T, PrimaryKey extends keyof T = keyof T & "id"> = Omit<T, PrimaryKey>;
