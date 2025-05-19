import { generateObjectId, generateObjectCreationDate } from "./utils";
import { getRuleLevelInitialConfig } from "./utils";
import { GLOBAL_CONSTANTS } from "../../global";
import { getEmptyPairUsingRuleType } from "./utils";
import RULE_TYPES_CONFIG from "../../rule-types"
import { RuleType } from "@requestly/shared/types/entities/rules";
// const { RULE_TYPES_CONFIG } = APP_CONSTANTS;

export const getNewRule = (ruleType: RuleType) => {
  //rule type config
  const ruleConfig = RULE_TYPES_CONFIG[ruleType];
  if(!ruleConfig){
    return;
  }
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
    objectType: GLOBAL_CONSTANTS.OBJECT_TYPES.RULE,
    status: GLOBAL_CONSTANTS.RULE_STATUS.INACTIVE,
    ...extraRuleConfig,
  };
  //TODO: version issue to be fixed
  // if(ruleConfig.VERSION){
  //   newRule.version = ruleConfig.VERSION;
  // }
  //@ts-expect-error jkhk
  newRule.pairs.push(getEmptyPairUsingRuleType(ruleType));
  return newRule;
}


export const getNewGroup = (newGroupName: string) => {
  const newGroupId = `Group_${generateObjectId()}`;
  const newGroup = {
    creationDate: generateObjectCreationDate(),
    description: "",
    id: newGroupId,
    name: newGroupName,
    objectType: GLOBAL_CONSTANTS.OBJECT_TYPES.GROUP,
    status: GLOBAL_CONSTANTS.RULE_STATUS.ACTIVE,
  };
  return newGroup;
};
