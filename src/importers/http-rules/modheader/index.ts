import type {
  Rule,
  Group,
  ScriptRule,
} from "@requestly/shared/types/entities/rules";

import {
  HeaderRule,
  RecordStatus,
  RecordType,
  RuleType,
  RuleSourceKey,
  RuleSourceOperator,
  RuleSourceFilter,
  RedirectRule,
} from "@requestly/shared/types/entities/rules";
import RULE_TYPES_CONFIG, {
  RuleTypeConfig,
} from "~/importers/types/rule-types";

import {
  HttpRuleImporterMethod,
  HttpRuleImporterOutput,
} from "~/importers/types";

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

const notSupportedFeatures: string[] = [];

export const generateObjectId = () => {
  return Math.random().toString(36).substr(2, 5);
};

export const getCurrentTimeStamp = () => {
  return new Date().getTime();
};

export const generateObjectCreationDate = () => {
  return getCurrentTimeStamp();
};

export const getNewGroup = (newGroupName: string) => {
  const newGroupId = `Group_${generateObjectId()}`;
  const newGroup = {
    creationDate: generateObjectCreationDate(),
    description: "",
    id: newGroupId,
    name: newGroupName,
    objectType: RecordType.GROUP,
    status: RecordStatus.ACTIVE,
  };

  return newGroup;
};

export const getRuleLevelInitialConfig = (ruleType: RuleType) => {
  switch (ruleType) {
    case RuleType.REDIRECT:
      return {
        preserveCookies: false,
      };
    case RuleType.HEADERS:
      return {
        version: 2,
      };
    default:
      return {};
  }
};

export const getEmptyPairUsingRuleType = (ruleType: RuleType) => {
  return {
    ...RULE_TYPES_CONFIG[ruleType].EMPTY_PAIR_FORMAT,
    id: generateObjectId(),
  };
};

export function getExtensionManifestVersion() {
  return document.documentElement.getAttribute("rq-ext-mv");
}

export function isExtensionManifestVersion3() {
  return getExtensionManifestVersion() === "3";
}

export const getNewRule = (ruleType: RuleType) => {
  const ruleConfig: RuleTypeConfig = RULE_TYPES_CONFIG[ruleType];

  if (!ruleConfig) return;

  const extraRuleConfig = getRuleLevelInitialConfig(ruleType);
  const newRule = {
    name: "",
    groupId: "",
    description: "",
    isSample: false,
    pairs: [],
    ruleType: ruleType,
    id: `${ruleType}_${generateObjectId()}`,
    creationDate: generateObjectCreationDate(),
    objectType: RecordType.RULE,
    status: RecordStatus.INACTIVE,
    ...extraRuleConfig,
  };

  if (ruleType === RuleType.HEADERS) {
    if (ruleConfig.VERSION) {
      newRule.version = ruleConfig.VERSION;
    }
  }

  if (ruleType === RuleType.SCRIPT) {
    if (isExtensionManifestVersion3() && "REMOVE_CSP_HEADER" in ruleConfig) {
      (newRule as ScriptRule.Record).removeCSPHeader =
        ruleConfig.REMOVE_CSP_HEADER;
    }
  }

  //@ts-expect-error
  newRule.pairs.push(getEmptyPairUsingRuleType(ruleType));
  return newRule;
};

export const modheaderImporter: HttpRuleImporterMethod<ModheaderProfile[]> = (
  profiles
) => {
  const outputRecords: (Rule | Group)[] = [];
  const errors: HttpRuleImporterOutput["errors"] = [];

  profiles.forEach((profile) => {
    try {
      const records = parseModheaderProfile(profile);
      outputRecords.push(...records);
    } catch (err: any) {
      errors.push({
        message: `Failed to import profile "${profile?.title}": ${err?.message}`,
      });
    }
  });

  return {
    data: outputRecords,
    notSupportedFeatures,
    errors,
  };
};

const parseModheaderProfile = (profile: ModheaderProfile): (Rule | Group)[] => {
  // TODO
  const recordsParsed: (Rule | Group)[] = [];
  if (!profile.title) {
    throw new Error("Modheader profile title is missing");
  }

  const group = getNewGroup(`[Modheader] ${profile.title}`) as Group;
  recordsParsed.push(group);

  const headerRule = parseHeaders(profile);
  if (headerRule) {
    headerRule.groupId = group.id;
    recordsParsed.push(headerRule);
  }

  const cspHeaderRule = parseCSPHeaders(profile);
  if (cspHeaderRule) {
    cspHeaderRule.groupId = group.id;
    recordsParsed.push(cspHeaderRule);
  }

  const cookieHeaderRule = parseCookieHeaders(profile);
  if (cookieHeaderRule) {
    cookieHeaderRule.groupId = group.id;
    recordsParsed.push(cookieHeaderRule);
  }

  const redirectRules = parseRedirectRules(profile)?.map((rule) => {
    rule.groupId = group.id;
    return rule;
  });
  if (redirectRules) {
    recordsParsed.push(...redirectRules);
  }

  return recordsParsed;
};

const parseRedirectRules = (
  modheaderProfile: ModheaderProfile
): Rule[] | null => {
  const redirectRules = modheaderProfile.urlReplacements?.map(
    (redirect: any) => {
      const newRedirectRule = getNewRule(
        RuleType.REDIRECT
      ) as RedirectRule.Record;
      const newRedirectRulePair = newRedirectRule.pairs[0];
      newRedirectRulePair.source = {
        key: RuleSourceKey.URL,
        operator: RuleSourceOperator.CONTAINS,
        value: redirect.name,
        filters: parseFilters(modheaderProfile),
      };
      newRedirectRulePair.destination = redirect.value;
      newRedirectRule.name = `[Redirect] ${redirect.name}`;
      newRedirectRule.isModHeaderImport = true;
      return newRedirectRule;
    }
  );

  if (!redirectRules) {
    return null;
  }

  return redirectRules;
};

const parseHeaders = (modheaderProfile: ModheaderProfile): Rule | null => {
  const requestHeaders = modheaderProfile.headers?.map((header) => ({
    header: header.name,
    value: header.value,
    type:
      header.appendMode === false && header.sendEmptyHeader
        ? HeaderRule.ModificationType.REMOVE
        : HeaderRule.ModificationType.ADD,
  }));

  const responseHeaders = modheaderProfile.respHeaders?.map((header) => ({
    header: header.name,
    value: header.value,
    type:
      header.appendMode === false && header.sendEmptyHeader
        ? HeaderRule.ModificationType.REMOVE
        : HeaderRule.ModificationType.ADD,
  }));

  const newHeaderRule = getNewRule(RuleType.HEADERS) as HeaderRule.Record;
  newHeaderRule.name = `[Headers]`;
  newHeaderRule.isModHeaderImport = true;

  const newHeaderRulePair = newHeaderRule.pairs[0];

  if (!requestHeaders && !responseHeaders) {
    return null;
  }

  newHeaderRulePair.modifications.Request = requestHeaders ?? [];
  newHeaderRulePair.modifications.Response = responseHeaders ?? [];
  newHeaderRulePair.source = {
    ...parseSourceConditions(modheaderProfile),
    filters: parseFilters(modheaderProfile),
  };

  return newHeaderRule;
};

const parseCSPHeaders = (modheaderProfile: ModheaderProfile): Rule | null => {
  const enabledCSPDirectives = modheaderProfile.cspDirectives?.filter(
    (directive) => directive.enabled
  );

  const cspValueString = enabledCSPDirectives
    ?.map((directive) => `${directive.name} ${directive.value}`)
    ?.join(";");

  if (!cspValueString) {
    return null;
  }

  const newHeaderRule = getNewRule(RuleType.HEADERS) as HeaderRule.Record;
  newHeaderRule.name = `[CSP Header]`;
  newHeaderRule.isModHeaderImport = true;

  const newHeaderRulePair = newHeaderRule.pairs[0];

  newHeaderRulePair.modifications.Response = [
    {
      header: "Content-Security-Policy",
      value: cspValueString,
      type: HeaderRule.ModificationType.ADD,
    },
  ];

  newHeaderRulePair.source = {
    ...parseSourceConditions(modheaderProfile),
    filters: parseFilters(modheaderProfile),
  };

  return newHeaderRule;
};

const parseCookieHeaders = (
  modheaderProfile: ModheaderProfile
): Rule | null => {
  const enabledCookies = modheaderProfile.reqCookieAppend?.filter(
    (cookie) => cookie.enabled
  );

  const cookieString = enabledCookies
    ?.map((cookie) => `${cookie.name}=${cookie.value}`)
    .join(";");

  if (!cookieString) {
    return null;
  }

  const newHeaderRule = getNewRule(RuleType.HEADERS) as HeaderRule.Record;
  newHeaderRule.name = `[Cookie Header]`;
  newHeaderRule.isModHeaderImport = true;

  const newHeaderRulePair = newHeaderRule.pairs[0];
  newHeaderRulePair.modifications.Request = [
    {
      header: "Cookie",
      value: cookieString,
      type: HeaderRule.ModificationType.ADD,
    },
  ];

  newHeaderRulePair.source = {
    ...parseSourceConditions(modheaderProfile),
    filters: parseFilters(modheaderProfile),
  };

  return newHeaderRule;
};

const parseSourceConditions = (modheaderProfile: ModheaderProfile) => {
  const firstEnabledCondition = modheaderProfile.urlFilters?.find(
    (filter) => filter.enabled
  );

  if (!firstEnabledCondition) {
    return {
      key: RuleSourceKey.URL,
      operator: RuleSourceOperator.CONTAINS,
      value: "",
    };
  }

  return {
    key: RuleSourceKey.URL,
    operator: RuleSourceOperator.MATCHES,
    value: `/${firstEnabledCondition.urlRegex}/`,
  };
};

const parseFilters = (modheaderProfile: ModheaderProfile) => {
  const resourceFilters = modheaderProfile.resourceFilters?.find(
    (filter) => filter.enabled
  );
  const requestMethodFilters = modheaderProfile.requestMethodFilters?.find(
    (filter) => filter.enabled
  );

  const sourceFilters: RuleSourceFilter = {};
  if (resourceFilters) {
    sourceFilters.resourceType = resourceFilters.resourceType;
  }
  if (requestMethodFilters) {
    sourceFilters.requestMethod = requestMethodFilters.requestMethod;
  }

  return [sourceFilters];
};
