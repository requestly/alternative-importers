export const GLOBAL_CONSTANTS = {
  OBJECT_TYPES: {
    GROUP: "group",
    RULE: "rule",
  },
  RULE_STATUS: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
  },
  RULE_TYPES: {
    REDIRECT : "Redirect",
    REPLACE : "Replace",
    QUERYPARAM : "QueryParam",
    CANCEL : "Cancel",
    DELAY : "Delay",
    HEADERS : "Headers",
    USERAGENT : "UserAgent",
    REQUEST : "Request",
    RESPONSE : "Response",
    SCRIPT : "Script",
    HEADERS_V1 : "HeadersV1",
  },
  RULE_KEYS: {
    URL: "Url",
    HOST: "host",
    PATH: "path",
    HEADER: "Header",
    OVERWRITE: "Overwrite",
    IGNORE: "Ignore",
    PARAM: "param",
    VALUE: "value",
  },
  RULE_OPERATORS: {
    EQUALS: "Equals",
    CONTAINS: "Contains",
    MATCHES: "Matches",
    WILDCARD_MATCHES: "Wildcard_Matches",
  }
};
