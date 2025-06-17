/**
 * Converts Header Editor JSON export to Requestly export format.
 * @param input The parsed JSON from Header Editor (input.json)
 * @returns The Requestly export JSON structure
 */
import {
  Rule,
  Group,
  RuleSourceKey,
  RecordType,
  RedirectRule,
  RuleSourceOperator,
  RuleType,
  RecordStatus,
  HeaderRule,
} from "@requestly/shared/types/entities/rules";
import {
  HttpRuleImporterMethod,
  HttpRuleImporterOutput,
} from "~/importers/types";

interface ModifyHeaderAction {
  name?: string;
  value?: string;
}

interface HeaderEditorRule {
  enable?: boolean;
  name?: string;
  ruleType:
    | "cancel"
    | "redirect"
    | "modifySendHeader"
    | "modifyReceiveHeader"
    | "modifyReceiveBody";
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

const notSupportedFeatures: string[] = ["receiveBody"];

export const headerEditorImporter: HttpRuleImporterMethod<
  HeaderEditorProfile
> = (profile) => {
  const outputRecords: (Rule | Group)[] = [];
  const errors: HttpRuleImporterOutput["errors"] = [];

  const result = parseHeaderEditorProfile(profile);

  return {
    data: result.data,
    notSupportedFeatures,
    errors: result.errors,
  };
};

const parseHeaderEditorProfile: HttpRuleImporterMethod<HeaderEditorProfile> = (
  profile: HeaderEditorProfile
) => {
  const result: HttpRuleImporterOutput = {};
  const outputRecords: (Rule | Group)[] = [];

  // Helper for status
  const getStatus = (enable: boolean | undefined) =>
    enable === false ? RecordStatus.INACTIVE : RecordStatus.ACTIVE;

  // --- Redirect & Cancel rules ---
  (profile.request || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    if (rule.ruleType === "redirect") {
      let pattern = rule.pattern;
      // TODO: Use use a common template in @requestly/shared for generating rules.
      outputRecords.push({
        creationDate: Date.now(),
        description: "Redirect Rule imported from Header Editor",
        groupId: GROUP_ID,
        id: randomId("Redirect"),
        isReadOnly: true,
        modificationDate: Date.now(),
        name: rule.name || "Redirect Rule",
        objectType: RecordType.RULE,
        pairs: [
          {
            destination: rule.to,
            destinationType: RedirectRule.DestinationType.URL,
            id: randomId("id"),
            source: {
              key: RuleSourceKey.URL,
              operator,
              value:
                filterField === "regexFilter" ? "/" + pattern + "/" : pattern,
            },
          },
        ],
        ruleType: RuleType.REDIRECT,
        schemaVersion: "3.0.0",
        status: getStatus(rule.enable),
      });
    } else if (rule.ruleType === "cancel") {
      let pattern = rule.pattern;
      outputRecords.push({
        creationDate: Date.now(),
        description: "Block all the outgoing requests to the products API",
        groupId: GROUP_ID,
        id: randomId("Cancel"),
        isSample: false,
        modificationDate: Date.now(),
        name: rule.name || "Cancel Rule",
        objectType: RecordType.RULE,
        pairs: [
          {
            id: randomId("id"),
            source: {
              key: RuleSourceKey.URL,
              operator,
              value: pattern,
            },
          },
        ],
        ruleType: RuleType.CANCEL,
        schemaVersion: "3.0.0",
        status: getStatus(rule.enable),
      });
    }
  });

  // --- Header modification rules ---
  // Handle sendHeader rules
  (profile.sendHeader || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    outputRecords.push({
      creationDate: Date.now(),
      description:
        rule.name || "Modify Request Header imported from Header Editor",
      groupId: GROUP_ID,
      id: randomId("Headers"),
      isSample: false,
      modificationDate: Date.now(),
      name: rule.name || "Request Header Rule",
      objectType: RecordType.RULE,
      pairs: [
        {
          id: randomId("id"),
          modifications: {
            Request: [
              {
                header: rule.action?.name || "",
                id: randomId("id"),
                type: HeaderRule.ModificationType.ADD,
                value: rule.action?.value || "",
              },
            ],
          },
          source: {
            key: RuleSourceKey.URL,
            operator,
            value: rule.pattern,
          },
        },
      ],
      ruleType: RuleType.HEADERS,
      schemaVersion: "3.0.0",
      status: getStatus(rule.enable),
      // @ts-ignore
      version: 2,
    });
  });

  // Handle receiveHeader rules
  (profile.receiveHeader || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    outputRecords.push({
      creationDate: Date.now(),
      description:
        rule.name || "Modify Response Header imported from Header Editor",
      groupId: GROUP_ID,
      id: randomId("Headers"),
      isSample: false,
      modificationDate: Date.now(),
      name: rule.name || "Response Header Rule",
      objectType: RecordType.RULE,
      pairs: [
        {
          id: randomId("id"),
          modifications: {
            Response: [
              {
                header: rule.action?.name || "",
                id: randomId("id"),
                type: HeaderRule.ModificationType.ADD,
                value: rule.action?.value || "",
              },
            ],
          },
          source: {
            key: RuleSourceKey.URL,
            operator,
            value: rule.pattern,
          },
        },
      ],
      ruleType: RuleType.HEADERS,
      schemaVersion: "3.0.0",
      status: getStatus(rule.enable),
      // @ts-ignore
      version: 2,
    });
  });

  // --- Group ---
  outputRecords.push({
    creationDate: Date.now(),
    description: "",
    id: GROUP_ID,
    modificationDate: Date.now(),
    name: "Header Editor Import",
    objectType: RecordType.GROUP,
    status: RecordStatus.INACTIVE,
  });

  result.data = outputRecords;
  result.errors = []; // Should be added if any of the above adapters fails.

  return result;
};

function mapMatchTypeToOperator(matchType: string | undefined): {
  operator: RuleSourceOperator;
  filterField: string;
} {
  switch ((matchType || "").toLowerCase()) {
    case "all":
      return { operator: RuleSourceOperator.EQUALS, filterField: "urlFilter" };
    case "prefix":
      return {
        operator: RuleSourceOperator.CONTAINS,
        filterField: "urlFilter",
      };
    case "domain":
      return {
        operator: RuleSourceOperator.CONTAINS,
        filterField: "urlFilter",
      };
    case "url":
      return { operator: RuleSourceOperator.EQUALS, filterField: "urlFilter" };
    case "regexp":
      return {
        operator: RuleSourceOperator.MATCHES,
        filterField: "regexFilter",
      };
    case "wildcard":
      return {
        operator: RuleSourceOperator.WILDCARD_MATCHES,
        filterField: "urlFilter",
      };
    default:
      return {
        operator: RuleSourceOperator.CONTAINS,
        filterField: "urlFilter",
      };
  }
}

function randomId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).substring(2, 7);
}

const GROUP_ID = randomId("Group");
