import type { Rule, Group } from "@requestly/shared/types/entities/rules";
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

export const importModheader: HttpRuleImporterMethod<ModheaderProfile[]> = (
  profiles
) => {
  const outputRecords: (Rule | Group)[] = [];
  const errors: HttpRuleImporterOutput["errors"] = [];

  profiles.forEach((profile) => {
    try {
      const records = importModheaderProfile(profile);
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

const importModheaderProfile = (
  profile: ModheaderProfile
): (Rule | Group)[] => {
  // TODO
  return [];
};
