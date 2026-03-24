import { RuleType, RuleSourceOperator } from "@requestly/shared/types/entities/rules"

const APP_MODE = {
    EXTENSION : "EXTENSION",
    DESKTOP: "DESKTOP"
}

const RULE_KEYS = {
    URL: "Url",
    HOST: "host",
    PATH: "path",
    HEADER: "Header",
    OVERWRITE: "Overwrite",
    IGNORE: "Ignore",
    PARAM: "param",
    VALUE: "value",
}

const getSourceFormat = () => ({
  filters: [],
  key: RULE_KEYS.URL,
  operator: RuleSourceOperator.CONTAINS,
  value: "",
});

export const isDesktopMode = () => {
  return false;
};


const modifyRequestDefaultCode = () => {
  let value =
    "function modifyRequestBody(args) {\n  const { method, url, body, bodyAsJson } = args;\n  // Change request body below depending upon request attributes received in args\n  \n  return body;\n}";

  // TODO: feature based request code
  /*if (isFeatureCompatible(FEATURES.ASYNC_MODIFY_RESPONSE_BODY)) {
    value = "async " + value;
  }*/

  return value;
};

const modifyResponseDefaultCode = () => {
  let value =
    "function modifyResponse(args) {\n  const {method, url, response, responseType, requestHeaders, requestData, responseJSON} = args;\n  // Change response below depending upon request attributes received in args\n  \n  return response;\n}";

    // TODO: feature based response code
    /*   if (isFeatureCompatible(FEATURES.ASYNC_MODIFY_RESPONSE_BODY)) {
        value = "async " + value;
    }*/

  return value;
};

// export const getAppDetails = () => {
//   let app_mode = null;
//   let app_version = null;
//   let ext_id = null;

//   if (document.documentElement.getAttribute("rq-ext-version")) {
//     // hard coded extension here
//     app_mode = APP_MODE.EXTENSION;
//     app_version = document.documentElement.getAttribute("rq-ext-version");
//     ext_id = document.documentElement.getAttribute("rq-ext-id");
//   } else if (window?.RQ?.MODE) {
//     app_mode = window.RQ.MODE;
//     app_version = window?.RQ?.DESKTOP?.VERSION;
//   } else {
//     app_mode = "EXTENSION";
//     app_version = "0.0.1"; // DUMMY VERSION for compatibility check
//   }

//   return { app_mode, app_version, ext_id };
// };


// const getHeaderMetadataConfig = () => {
//   return RULE_METADATA_CONFIG[RuleType.HEADERS]["V2"];
// };

// const RULE_METADATA_CONFIG = {
//     [RuleType.HEADERS]: {
//     V1: {
//       EMPTY_PAIR_FORMAT: {
//         header: "",
//         value: "",
//         type: "Add",
//         target: "Request",
//         source: getSourceFormat(),
//       },
//     },
//     V2: {
//       VERSION: 2,
//       EMPTY_PAIR_FORMAT: {
//         modifications: {
//           Request: [],
//           Response: [],
//         },
//         source: getSourceFormat(),
//       },
//       EMPTY_MODIFICATION_FORMAT: {
//         header: "",
//         value: "",
//         type: "Add",
//       },
//     },
//   },
// };

export type RuleTypeConfig = {
    ID: number;
    TYPE: string;
    NAME: string;
    DESCRIPTION: string;
    PRIMARY_COLOR: string;
    SECONDARY_COLOR: string;
    TOOL_TIP_PLACEMENT: string;
    PAIR_CONFIG: {
        TITLE: string;
    };
    EMPTY_PAIR_FORMAT: {
        [key: string]: any;
    };
    ALLOW_ADD_PAIR: boolean;
    HIDE_IN_EXTENSION: boolean;
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: boolean;
    ALLOW_APPLY_RULE_TO_ALL_URLS: boolean;
    ALLOW_REQUEST_SOURCE_FILTERS: boolean;
    VERSION?: number;
    EMPTY_MODIFICATION_FORMAT?: {
        [key: string]: any;
    };
    EMPTY_SCRIPT_FORMAT?: {
        [key: string]: any;
    };
    CUSTOM_SCRIPT_CHARACTER_LIMIT?: number;
    REMOVE_CSP_HEADER?: boolean;
    RESPONSE_BODY_CHARACTER_LIMIT?: number;
    RESPONSE_BODY_JAVASCRIPT_DEFAULT_VALUE?: string;
    REQUEST_BODY_CHARACTER_LIMIT?: number;
    REQUEST_BODY_JAVASCRIPT_DEFAULT_VALUE?: string;
};

const RULE_TYPES_CONFIG: Record<RuleType, RuleTypeConfig> = {
  [RuleType.REDIRECT]: {
    ID: 1,
    TYPE: RuleType.REDIRECT,
    NAME: "Redirect Request",
    DESCRIPTION: "Map Local or Redirect a matching pattern to another URL",
    PRIMARY_COLOR: "#5b9027",
    SECONDARY_COLOR: "#4E7C22",
    TOOL_TIP_PLACEMENT: "top",
    PAIR_CONFIG: {
      TITLE: "Rule Conditions",
    },
    EMPTY_PAIR_FORMAT: {
      destination: "",
      destinationType: "url",
      source: getSourceFormat(),
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_APPLY_RULE_TO_ALL_URLS: false,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.CANCEL]: {
    ID: 2,
    TYPE: RuleType.CANCEL,
    NAME: "Cancel Request",
    DESCRIPTION: "Block URLs by specifying keywords or entire URL",
    PRIMARY_COLOR: "#d32a0e",
    SECONDARY_COLOR: "#BB250C",
    TOOL_TIP_PLACEMENT: "top",
    PAIR_CONFIG: {
      TITLE: "Enter Keywords or URLs or Domains to be blocked",
    },
    EMPTY_PAIR_FORMAT: {
      source: getSourceFormat(),
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_APPLY_RULE_TO_ALL_URLS: false,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.REPLACE]: {
    ID: 3,
    TYPE: RuleType.REPLACE,
    NAME: "Replace String",
    DESCRIPTION: "Replace parts of URL like hostname, query value",
    PRIMARY_COLOR: "#2aa5e7",
    SECONDARY_COLOR: "#199ADE",
    TOOL_TIP_PLACEMENT: "top",
    PAIR_CONFIG: {
      TITLE: "Enter the part of URL that needs to be replaced",
    },
    EMPTY_PAIR_FORMAT: {
      from: "",
      to: "",
      source: getSourceFormat(),
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: false,
    ALLOW_APPLY_RULE_TO_ALL_URLS: true,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.HEADERS]: {
    ID: 4,
    TYPE: RuleType.HEADERS,
    NAME: "Modify Headers",
    DESCRIPTION: "Modify HTTP headers in request and response",
    PRIMARY_COLOR: "#dd9d12",
    SECONDARY_COLOR: "#C58C10",
    TOOL_TIP_PLACEMENT: "top",
    PAIR_CONFIG: {
      TITLE: "Headers Modification Rules",
    },
    VERSION: 2,
    EMPTY_PAIR_FORMAT: {
        modifications: {
            Request: [],
            Response: [],
        },
        source: getSourceFormat(),
    },
    EMPTY_MODIFICATION_FORMAT: {
        header: "",
        value: "",
        type: "Add",
    },
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    ALLOW_APPLY_RULE_TO_ALL_URLS: true,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.QUERYPARAM]: {
    ID: 5,
    TYPE: RuleType.QUERYPARAM,
    NAME: "Query Param",
    DESCRIPTION: "Add or Remove Query Parameters",
    PRIMARY_COLOR: "#AA66CC",
    SECONDARY_COLOR: "#9F53C6",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: "Query Parameter Modifications",
    },
    EMPTY_PAIR_FORMAT: {
      modifications: [],
      source: getSourceFormat(),
    },
    EMPTY_MODIFICATION_FORMAT: {
      actionWhenParamExists: RULE_KEYS.OVERWRITE,
      param: "",
      type: "Add",
      value: "",
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_APPLY_RULE_TO_ALL_URLS: true,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.SCRIPT]: {
    ID: 6,
    TYPE: RuleType.SCRIPT,
    NAME: "Insert Scripts",
    DESCRIPTION: "Inject Custom JavaScript (JS) or Styles (CSS) to any website",
    PRIMARY_COLOR: "#444340",
    SECONDARY_COLOR: "#373634",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: "Insert Scripts",
    },
    EMPTY_PAIR_FORMAT: {
      libraries: [],
      source: getSourceFormat(),
      scripts: [],
    },
    EMPTY_SCRIPT_FORMAT: {
      codeType: "js",
      fileName: "",
      loadTime: "afterPageLoad",
      type: "code",
      value: "",
    },
    ALLOW_ADD_PAIR: false,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: false,
    ALLOW_APPLY_RULE_TO_ALL_URLS: true,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
    CUSTOM_SCRIPT_CHARACTER_LIMIT: 500,
    REMOVE_CSP_HEADER: true,
  },
  [RuleType.RESPONSE]: {
    ID: 7,
    TYPE: RuleType.RESPONSE,
    NAME: isDesktopMode() ? "Modify Response" : "Modify API Response",
    DESCRIPTION: isDesktopMode() ? "Modify Response of any HTTP request" : "Modify Response of any XHR/Fetch request",
    PRIMARY_COLOR: "#880e4f",
    SECONDARY_COLOR: "#710C42",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: isDesktopMode()
        ? "Return any custom response through code, local files or as static JSON data"
        : "Modify response of an XHR/fetch request",
    },
    EMPTY_PAIR_FORMAT: {
      source: getSourceFormat(),
      response: {
        type: "static",
        value: "",
        statusCode: "",
        resourceType: "",
      },
    },
    ALLOW_ADD_PAIR: false,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: false,
    ALLOW_APPLY_RULE_TO_ALL_URLS: false,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
    RESPONSE_BODY_CHARACTER_LIMIT: 1500,
    RESPONSE_BODY_JAVASCRIPT_DEFAULT_VALUE: modifyResponseDefaultCode(),
  },

  [RuleType.REQUEST]: {
    ID: 10,
    TYPE: RuleType.REQUEST,
    NAME: "Modify Request Body",
    DESCRIPTION: "Override API request body with static or programmatic data",
    PRIMARY_COLOR: "#880e4f",
    SECONDARY_COLOR: "#710C42",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: "Modify POST Request",
    },
    EMPTY_PAIR_FORMAT: {
      source: getSourceFormat(),
      request: {
        type: "static",
        value: "",
        statusCode: "",
      },
    },
    ALLOW_ADD_PAIR: false,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: false,
    ALLOW_APPLY_RULE_TO_ALL_URLS: false,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
    REQUEST_BODY_CHARACTER_LIMIT: 1500,
    REQUEST_BODY_JAVASCRIPT_DEFAULT_VALUE: modifyRequestDefaultCode(),
  },

  [RuleType.USERAGENT]: {
    ID: 8,
    TYPE: RuleType.USERAGENT,
    NAME: "User-Agent",
    DESCRIPTION: "Emulate for different devices by varying user-agent",
    PRIMARY_COLOR: "#2bbbad",
    SECONDARY_COLOR: "#26A69A",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: "Rule Conditions",
    },
    EMPTY_PAIR_FORMAT: {
      source: getSourceFormat(),
      env: "",
      envType: "",
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_APPLY_RULE_TO_ALL_URLS: true,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },
  [RuleType.DELAY]: {
    ID: 9,
    TYPE: RuleType.DELAY,
    NAME: "Delay Network Requests",
    DESCRIPTION: "Introduce a lag or delay to the response from specific URLs",
    PRIMARY_COLOR: "#68ce35",
    SECONDARY_COLOR: "#5ab52d",
    TOOL_TIP_PLACEMENT: "bottom",
    PAIR_CONFIG: {
      TITLE: "Enter Request URL Pattern",
    },
    EMPTY_PAIR_FORMAT: {
      source: getSourceFormat(),
      delay: "100",
    },
    ALLOW_ADD_PAIR: true,
    HIDE_IN_EXTENSION: false,
    SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
    ALLOW_APPLY_RULE_TO_ALL_URLS: false,
    ALLOW_REQUEST_SOURCE_FILTERS: true,
  },


  // LEGACY
  // V1 Headers Schema
//   [RuleType.HEADERS_V1]: {
//     ID: 11,
//     TYPE: RuleType.HEADERS,
//     NAME: "Modify Headers",
//     DESCRIPTION: "Modify HTTP headers in request and response",
//     PRIMARY_COLOR: "#dd9d12",
//     SECONDARY_COLOR: "#C58C10",
//     TOOL_TIP_PLACEMENT: "top",
//     PAIR_CONFIG: {
//       TITLE: "Headers Modification Rules",
//     },
//     EMPTY_PAIR_FORMAT: {
//       header: "",
//       value: "",
//       type: "Add",
//       target: "Request",
//       source: getSourceFormat(),
//     },
//     SHOW_DELETE_PAIR_ICON_ON_SOURCE_ROW: true,
//     ALLOW_ADD_PAIR: true,
//     HIDE_IN_EXTENSION: false,
//     HIDE: true,
//     ALLOW_APPLY_RULE_TO_ALL_URLS: true,
//     ALLOW_REQUEST_SOURCE_FILTERS: true,
//   },
};

export default RULE_TYPES_CONFIG;