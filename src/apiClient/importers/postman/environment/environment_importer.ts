import { z } from "zod";

import { EnvironmentVariableData, EnvironmentVariableType, VariableScope } from "@requestly/shared/types/entities/apiClient";

import { PostmanEnvironmentSchema, PostmanEnvironmentValue } from "./schemas/environment";
import BaseImporter from "../../base-importer";
import { EnvironmentImporterOutput, EnvironmentWithoutId } from "~/apiClient/types";


class EnvironmentImporter extends BaseImporter<
  typeof PostmanEnvironmentSchema,
  EnvironmentWithoutId
> {

  schema = PostmanEnvironmentSchema;

  async convert(data: z.infer<typeof PostmanEnvironmentSchema>): Promise<EnvironmentImporterOutput> {
    const variables = data.values.reduce(
      (acc: Record<string, EnvironmentVariableData>, variable: PostmanEnvironmentValue, index: number) => {
        if (!variable.key) {
          return acc;
        }

        acc[variable.key] = {
          id: index,
          isPersisted: true,
          syncValue: variable.value ?? "",
          type:
            variable.type === EnvironmentVariableType.Secret
              ? EnvironmentVariableType.Secret
              : EnvironmentVariableType.String,
        };
        return acc;
      },
      {}
    );

    const environment: EnvironmentWithoutId = {
      name: data.name,
      variables,
      scope: data?._postman_variable_scope === "globals" ? VariableScope.GLOBAL : VariableScope.ENVIRONMENT,
    };

    return {
      data: [environment],
      errors: [], // TODO
      warnings: [], // TODO
      notSupportedFeatures: [], // TODO
    };
  }
}

export default EnvironmentImporter;