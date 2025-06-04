/**
 * Converts Header Editor JSON export to Requestly export format.
 * @param input The parsed JSON from Header Editor (input.json)
 * @returns The Requestly export JSON structure
 */
export function headerEditorImporter(input: any): any {
  const rules: any[] = [];

  // Helper for status
  const getStatus = (enable: boolean | undefined) =>
    enable === false ? "Inactive" : "Active";

  // --- Redirect & Cancel rules ---
  (input.request || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    if (rule.ruleType === "redirect") {
      let pattern = rule.pattern;
      rules.push({
        createdBy: DEFAULT_USER,
        creationDate: Date.now(),
        currentOwner: DEFAULT_USER,
        description:
          "Redirect Rule imported from Header Editor",
        extensionRules: [
          {
            action: {
              redirect: { url: rule.to },
              type: "redirect",
            },
            condition: {
              excludedInitiatorDomains: ["requestly.io"],
              excludedRequestDomains: ["requestly.io"],
              isUrlFilterCaseSensitive: true,
              [filterField]: filterField==='regexFilter' ? '.*?' + pattern + '.*' : pattern,
            },
          },
        ],
        groupId: DEFAULT_GROUP_ID,
        id: randomId("Redirect"),
        isReadOnly: true,
        lastModifiedBy: DEFAULT_USER,
        modificationDate: Date.now(),
        name: rule.name || "Redirect Rule",
        objectType: "rule",
        pairs: [
          {
            destination: rule.to,
            destinationType: "url",
            id: randomId("id"),
            source: {
              key: "Url",
              operator,
              value: filterField === 'regexFilter' ? '/' + pattern + '/' : pattern,
            },
          },
        ],
        preserveCookie: false,
        ruleType: "Redirect",
        sampleId: "fHdTHi18fWcnPAhUOeL7",
        schemaVersion: "3.0.0",
        status: getStatus(rule.enable),
      });
    } else if (rule.ruleType === "cancel") {
      let pattern = rule.pattern;
      rules.push({
        createdBy: DEFAULT_USER,
        creationDate: Date.now(),
        currentOwner: DEFAULT_USER,
        description: "Block all the outgoing requests to the products API",
        extensionRules: [
          {
            action: { type: "block" },
            condition: {
              excludedInitiatorDomains: ["requestly.io"],
              excludedRequestDomains: ["requestly.io"],
              isUrlFilterCaseSensitive: true,
              [filterField]: pattern,
            },
          },
        ],
        groupId: DEFAULT_GROUP_ID,
        id: randomId("Cancel"),
        isSample: false,
        lastModifiedBy: DEFAULT_USER,
        modificationDate: Date.now(),
        name: rule.name || "Cancel Rule",
        objectType: "rule",
        pairs: [
          {
            id: randomId("id"),
            source: {
              key: "Url",
              operator,
              value: pattern,
            },
          },
        ],
        ruleType: "Cancel",
        schemaVersion: "3.0.0",
        status: getStatus(rule.enable),
      });
    }
  });

  // --- Header modification rules ---
  // Handle sendHeader rules
  (input.sendHeader || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    rules.push({
      createdBy: DEFAULT_USER,
      creationDate: Date.now(),
      currentOwner: DEFAULT_USER,
      description: rule.name || "Modify Request Header imported from Header Editor",
      extensionRules: [
        {
          action: {
            requestHeaders: [
              {
                header: rule.action?.name || "",
                operation: "set",
                value: rule.action?.value || "",
              },
            ],
            type: "modifyHeaders",
          },
          condition: {
            excludedInitiatorDomains: ["requestly.io"],
            excludedRequestDomains: ["requestly.io"],
            isUrlFilterCaseSensitive: true,
            [filterField]: rule.pattern,
          },
        },
      ],
      groupId: DEFAULT_GROUP_ID,
      id: randomId("Headers"),
      isSample: false,
      lastModifiedBy: DEFAULT_USER,
      modificationDate: Date.now(),
      name: rule.name || "Request Header Rule",
      objectType: "rule",
      pairs: [
        {
          id: randomId("id"),
          modifications: {
            Request: [
              {
                header: rule.action?.name || "",
                id: randomId("id"),
                type: "Add",
                value: rule.action?.value || "",
              },
            ],
          },
          source: {
            key: "Url",
            operator,
            value: rule.pattern,
          },
        },
      ],
      ruleType: "Headers",
      schemaVersion: "3.0.0",
      status: getStatus(rule.enable),
      version: 2,
    });
  });

  // Handle receiveHeader rules
  (input.receiveHeader || []).forEach((rule: any) => {
    const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
    rules.push({
      createdBy: DEFAULT_USER,
      creationDate: Date.now(),
      currentOwner: DEFAULT_USER,
      description: rule.name || "Modify Response Header imported from Header Editor",
      extensionRules: [
        {
          action: {
            responseHeaders: [
              {
                header: rule.action?.name || "",
                operation: "set",
                value: rule.action?.value || "",
              },
            ],
            type: "modifyHeaders",
          },
          condition: {
            excludedInitiatorDomains: ["requestly.io"],
            excludedRequestDomains: ["requestly.io"],
            isUrlFilterCaseSensitive: true,
            [filterField]: rule.pattern,
          },
        },
      ],
      groupId: DEFAULT_GROUP_ID,
      id: randomId("Headers"),
      isSample: false,
      lastModifiedBy: DEFAULT_USER,
      modificationDate: Date.now(),
      name: rule.name || "Response Header Rule",
      objectType: "rule",
      pairs: [
        {
          id: randomId("id"),
          modifications: {
            Response: [
              {
                header: rule.action?.name || "",
                id: randomId("id"),
                type: "Add",
                value: rule.action?.value || "",
              },
            ],
          },
          source: {
            key: "Url",
            operator,
            value: rule.pattern,
          },
        },
      ],
      ruleType: "Headers",
      schemaVersion: "3.0.0",
      status: getStatus(rule.enable),
      version: 2,
    });
  });

  // --- Group ---
  rules.push({
    createdBy: DEFAULT_USER,
    creationDate: Date.now(),
    currentOwner: DEFAULT_USER,
    description: "",
    id: DEFAULT_GROUP_ID,
    lastModifiedBy: DEFAULT_USER,
    modificationDate: Date.now(),
    name: "Header Editor Import",
    objectType: "group",
    status: "Inactive",
    children: [],
  });

  return rules;
}

function mapMatchTypeToOperator(matchType: string | undefined): { operator: string, filterField: string } {
  switch ((matchType || '').toLowerCase()) {
    case 'all':
      return { operator: 'Equals', filterField: 'urlFilter' };
    case 'prefix':
      return { operator: 'Contains', filterField: 'urlFilter' };
    case 'domain':
      return { operator: 'Contains', filterField: 'urlFilter' };
    case 'url':
      return { operator: 'Equals', filterField: 'urlFilter' };
    case 'regexp':
      return { operator: 'Matches', filterField: 'regexFilter' };
    case 'wildcard':
      return { operator: 'Wildcard', filterField: 'urlFilter' };
    default:
      return { operator: 'Contains', filterField: 'urlFilter' };
  }
}

function randomId(prefix: string) {
  return (
    prefix +
    "_" +
    Math.random().toString(36).substring(2, 7)
  );
}


const DEFAULT_USER = "";
const DEFAULT_GROUP_ID = randomId("Group");