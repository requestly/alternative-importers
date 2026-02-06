import { describe, it, expect, beforeEach } from "vitest";
import EnvironmentImporter from "../environment_importer";
import { VariableScope, EnvironmentVariableType } from "@requestly/shared/types/entities/apiClient";
import type { PostmanEnvironment } from "../schemas/environment";

// Fixtures - cast to correct type since JSON imports lose literal types
import basicEnvironmentJson from "./fixtures/valid/basic-environment.json";
import environmentWithSecretsJson from "./fixtures/valid/environment-with-secrets.json";
import globalScopeJson from "./fixtures/valid/global-scope.json";
import emptyValuesJson from "./fixtures/valid/empty-values.json";
import disabledVariablesJson from "./fixtures/valid/disabled-variables.json";
import emptyKeysJson from "./fixtures/edge-cases/empty-keys.json";
import specialCharactersJson from "./fixtures/edge-cases/special-characters.json";
import largeEnvironmentJson from "./fixtures/edge-cases/large-environment.json";
import missingOptionalValuesJson from "./fixtures/edge-cases/missing-optional-values.json";
import missingRequiredFields from "./fixtures/invalid/missing-required-fields.json";
import invalidTypes from "./fixtures/invalid/invalid-types.json";
import malformedData from "./fixtures/invalid/malformed-data.json";

// Type assertions for valid fixtures
const basicEnvironment = basicEnvironmentJson as PostmanEnvironment;
const environmentWithSecrets = environmentWithSecretsJson as PostmanEnvironment;
const globalScope = globalScopeJson as PostmanEnvironment;
const emptyValues = emptyValuesJson as PostmanEnvironment;
const disabledVariables = disabledVariablesJson as PostmanEnvironment;
const emptyKeys = emptyKeysJson as PostmanEnvironment;
const specialCharacters = specialCharactersJson as PostmanEnvironment;
const largeEnvironment = largeEnvironmentJson as PostmanEnvironment;
const missingOptionalValues = missingOptionalValuesJson as PostmanEnvironment;

// Helpers
import {
  createMockEnvironment,
  createMockVariable,
  createMockVariables,
  createGlobalEnvironment,
} from "./helpers";

describe("EnvironmentImporter", () => {
  let importer: EnvironmentImporter;

  beforeEach(() => {
    importer = new EnvironmentImporter();
  });

  describe("convert()", () => {
    describe("valid environments", () => {
      it("should convert basic environment correctly", async () => {
        const result = await importer.convert(basicEnvironment);
        const env = result.data[0];
        const baseUrlVar = basicEnvironment.values.find(v => v.key === "baseUrl")!;

        expect(env.name).toBe(basicEnvironment.name);
        expect(env.scope).toBe(VariableScope.ENVIRONMENT);
        expect(Object.keys(env.variables)).toHaveLength(basicEnvironment.values.length);
        expect(env.variables.baseUrl).toMatchObject({
          isPersisted: true,
          syncValue: baseUrlVar.value,
          type: EnvironmentVariableType.String,
        });
      });

      it("should handle environment with secrets", async () => {
        const result = await importer.convert(environmentWithSecrets);
        const env = result.data[0];
        const apiSecretVar = environmentWithSecrets.values.find(v => v.key === "apiSecret")!;

        expect(env.name).toBe(environmentWithSecrets.name);
        expect(env.variables.apiSecret).toMatchObject({
          isPersisted: true,
          syncValue: apiSecretVar.value,
          type: EnvironmentVariableType.Secret,
        });
        expect(env.variables.apiKey).toMatchObject({
          type: EnvironmentVariableType.String,
        });
      });

      it("should handle global scope correctly", async () => {
        const result = await importer.convert(globalScope);
        const env = result.data[0];

        expect(env.scope).toBe(VariableScope.GLOBAL);
        expect(env.name).toBe(globalScope.name);
      });

      it("should handle empty values array", async () => {
        const result = await importer.convert(emptyValues);
        const env = result.data[0];

        expect(env.name).toBe(emptyValues.name);
        expect(Object.keys(env.variables)).toHaveLength(emptyValues.values.length);
      });

      it("should convert all enabled variables regardless of disabled flag", async () => {
        const result = await importer.convert(disabledVariables);
        const env = result.data[0];

        expect(Object.keys(env.variables)).toHaveLength(2);
        expect(env.variables.enabledVar).toBeDefined();
        expect(env.variables.disabledVar).toBeDefined();
      });
    });

    describe("edge cases", () => {
      it("should filter out variables with empty keys", async () => {
        const result = await importer.convert(emptyKeys);
        const env = result.data[0];

        expect(Object.keys(env.variables)).toHaveLength(1);
        expect(env.variables.validKey).toBeDefined();
        expect(env.variables[""]).toBeUndefined();
      });

      it("should handle special characters in keys and values", async () => {
        const result = await importer.convert(specialCharacters);
        const env = result.data[0];
        const unicodeVar = specialCharacters.values.find(v => v.key === "keyWithUnicode🔑")!;

        // Verify all special character keys are present
        specialCharacters.values.forEach(v => {
          expect(env.variables[v.key]).toBeDefined();
        });
        expect(env.variables[unicodeVar.key].syncValue).toBe(unicodeVar.value);
      });

      it("should handle large environments efficiently", async () => {
        const result = await importer.convert(largeEnvironment);
        const env = result.data[0];

        expect(Object.keys(env.variables)).toHaveLength(15);
        expect(env.variables.var1).toBeDefined();
        expect(env.variables.var15).toBeDefined();
        expect(env.variables.var11.type).toBe(EnvironmentVariableType.Secret);
      });

      it("should handle missing optional values with defaults", async () => {
        const result = await importer.convert(missingOptionalValues);
        const env = result.data[0];
        const minimalVar = missingOptionalValues.values.find(v => v.key === "minimalVar")!;
        const noValueVar = missingOptionalValues.values.find(v => v.key === "noValue")!;

        expect(env.variables.minimalVar).toMatchObject({
          isPersisted: true,
          syncValue: minimalVar.value,
          type: EnvironmentVariableType.String,
        });
        expect(env.variables.noValue).toMatchObject({
          syncValue: noValueVar.value,
        });
      });
    });

    describe("variable type mapping", () => {
      it("should map secret type to Secret", async () => {
        const mockEnv = createMockEnvironment({
          values: [createMockVariable("secret", "value", { type: "secret" })],
        });

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.variables.secret.type).toBe(EnvironmentVariableType.Secret);
      });

      it("should map default type to String", async () => {
        const mockEnv = createMockEnvironment({
          values: [createMockVariable("default", "value", { type: "default" })],
        });

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.variables.default.type).toBe(EnvironmentVariableType.String);
      });

      it("should map text type to String", async () => {
        const mockEnv = createMockEnvironment({
          values: [createMockVariable("other", "value", { type: "text" })],
        });

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.variables.other.type).toBe(EnvironmentVariableType.String);
      });
    });

    describe("scope detection", () => {
      it("should default to ENVIRONMENT scope when _postman_variable_scope is missing", async () => {
        const mockEnv = createMockEnvironment();

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.scope).toBe(VariableScope.ENVIRONMENT);
      });

      it("should set GLOBAL scope when _postman_variable_scope is globals", async () => {
        const mockEnv = createGlobalEnvironment();

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.scope).toBe(VariableScope.GLOBAL);
      });

      it("should set ENVIRONMENT scope for any other _postman_variable_scope value", async () => {
        const mockEnv = createMockEnvironment({
          _postman_variable_scope: "environment",
        });

        const result = await importer.convert(mockEnv);
        const env = result.data[0];

        expect(env.scope).toBe(VariableScope.ENVIRONMENT);
      });
    });

    describe("output structure", () => {
      it("should return data as an array", async () => {
        const result = await importer.convert(basicEnvironment);

        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);
      });

      it("should include errors array", async () => {
        const result = await importer.convert(basicEnvironment);

        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      });

      it("should include warnings array", async () => {
        const result = await importer.convert(basicEnvironment);

        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
      });

      it("should include notSupportedFeatures array", async () => {
        const result = await importer.convert(basicEnvironment);

        expect(result.notSupportedFeatures).toBeDefined();
        expect(Array.isArray(result.notSupportedFeatures)).toBe(true);
      });
    });
  });

  describe("schema validation", () => {
    describe("canParseRecord()", () => {
      it("should validate correct environment data", () => {
        expect(importer.canParseRecord(basicEnvironment)).toBe(true);
      });

      it("should reject data missing required fields", () => {
        expect(importer.canParseRecord(missingRequiredFields as any)).toBe(false);
      });

      it("should reject data with invalid types", () => {
        expect(importer.canParseRecord(invalidTypes as any)).toBe(false);
      });

      it("should reject malformed data", () => {
        expect(importer.canParseRecord(malformedData as any)).toBe(false);
      });

      it("should reject null or undefined", () => {
        expect(importer.canParseRecord(null as any)).toBe(false);
        expect(importer.canParseRecord(undefined as any)).toBe(false);
      });
    });

    describe("safeParse()", () => {
      it("should return success for valid data", () => {
        const result = importer.safeParse(basicEnvironment);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe(basicEnvironment.name);
        }
      });

      it("should return detailed errors for invalid data", () => {
        const result = importer.safeParse(missingRequiredFields as any);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe("parse()", () => {
      it("should parse and return valid data", () => {
        const parsed = importer.parse(basicEnvironment);

        expect(parsed.id).toBe(basicEnvironment.id);
        expect(parsed.name).toBe(basicEnvironment.name);
        expect(parsed.values).toHaveLength(basicEnvironment.values.length);
      });

      it("should throw error for invalid data", () => {
        expect(() => importer.parse(missingRequiredFields as any)).toThrow();
      });
    });
  });

  describe("helpers utilities", () => {
    it("createMockEnvironment should create valid environment", () => {
      const mockEnv = createMockEnvironment({ name: "Custom Name" });

      expect(importer.canParseRecord(mockEnv)).toBe(true);
      expect(mockEnv.name).toBe("Custom Name");
    });

    it("createMockVariable should create valid variable", () => {
      const variable = createMockVariable("key", "value", {
        type: "secret",
        description: "Test description",
      });

      expect(variable.key).toBe("key");
      expect(variable.value).toBe("value");
      expect(variable.type).toBe("secret");
      expect(variable.description).toBe("Test description");
    });

    it("createMockVariables should create multiple variables", () => {
      const variables = createMockVariables(5, "test");

      expect(variables).toHaveLength(5);
      expect(variables[0].key).toBe("test1");
      expect(variables[4].key).toBe("test5");
    });
  });
});
