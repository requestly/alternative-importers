import { RuleType } from "@requestly/shared/types/entities/rules";
import { GLOBAL_CONSTANTS } from "../../global";
import RULE_TYPES_CONFIG from "../../rule-types";

export const generateObjectId = () => {
  return Math.random().toString(36).substr(2, 5);
};
export const getCurrentTimeStamp = () => {
  return new Date().getTime();
};

export const generateObjectCreationDate = () => {
  return getCurrentTimeStamp();
};

export const getRuleLevelInitialConfig = (ruleType: RuleType) => {
  switch (ruleType) {
    case GLOBAL_CONSTANTS.RULE_TYPES.REDIRECT:
      return {
        preserveCookies: false,
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
