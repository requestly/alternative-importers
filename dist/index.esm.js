import { parse as parse$1 } from 'yaml';
import require$$0$3 from 'util';
import require$$1$2 from 'path';

const notSupportedFeatures$1 = [];
const modheaderImporter = (profiles) => {
    const outputRecords = [];
    const errors = [];
    profiles.forEach((profile) => {
        try {
            const records = parseModheaderProfile(profile);
            outputRecords.push(...records);
        }
        catch (err) {
            errors.push({
                message: `Failed to import profile "${profile?.title}": ${err?.message}`,
            });
        }
    });
    return {
        data: outputRecords,
        notSupportedFeatures: notSupportedFeatures$1,
        errors,
    };
};
const parseModheaderProfile = (profile) => {
    // TODO
    return [];
};

var RecordType;
(function (RecordType) {
    RecordType["RULE"] = "rule";
    RecordType["GROUP"] = "group";
})(RecordType || (RecordType = {}));
var RecordStatus;
(function (RecordStatus) {
    RecordStatus["ACTIVE"] = "Active";
    RecordStatus["INACTIVE"] = "Inactive";
})(RecordStatus || (RecordStatus = {}));

var RedirectRule;
(function (RedirectRule) {
    (function (DestinationType) {
        DestinationType["URL"] = "url";
        DestinationType["MAP_LOCAL"] = "map_local";
        DestinationType["MOCK_OR_FILE_PICKER"] = "mock_or_file_picker";
    })(RedirectRule.DestinationType || (RedirectRule.DestinationType = {}));
})(RedirectRule || (RedirectRule = {}));
var QueryParamRule;
(function (QueryParamRule) {
    (function (ModificationType) {
        ModificationType["ADD"] = "Add";
        ModificationType["REMOVE"] = "Remove";
        ModificationType["REMOVE_ALL"] = "Remove All";
    })(QueryParamRule.ModificationType || (QueryParamRule.ModificationType = {}));
})(QueryParamRule || (QueryParamRule = {}));
var HeaderRule;
(function (HeaderRule) {
    (function (ModificationType) {
        ModificationType["ADD"] = "Add";
        ModificationType["REMOVE"] = "Remove";
        ModificationType["MODIFY"] = "Modify";
    })(HeaderRule.ModificationType || (HeaderRule.ModificationType = {}));
})(HeaderRule || (HeaderRule = {}));
var RequestRule;
(function (RequestRule) {
    let BodyType;
    (function (BodyType) {
        BodyType["CODE"] = "code";
        BodyType["STATIC"] = "static";
    })(BodyType || (BodyType = {}));
    (function (ResourceType) {
        ResourceType["UNKNOWN"] = "unknown";
        ResourceType["REST_API"] = "restApi";
        ResourceType["GRAPHQL_API"] = "graphqlApi";
    })(RequestRule.ResourceType || (RequestRule.ResourceType = {}));
})(RequestRule || (RequestRule = {}));
var ResponseRule;
(function (ResponseRule) {
    (function (BodyType) {
        BodyType["CODE"] = "code";
        BodyType["STATIC"] = "static";
    })(ResponseRule.BodyType || (ResponseRule.BodyType = {}));
    (function (ResourceType) {
        ResourceType["UNKNOWN"] = "unknown";
        ResourceType["REST_API"] = "restApi";
        ResourceType["GRAPHQL_API"] = "graphqlApi";
        ResourceType["STATIC"] = "static";
    })(ResponseRule.ResourceType || (ResponseRule.ResourceType = {}));
})(ResponseRule || (ResponseRule = {}));
var ScriptRule;
(function (ScriptRule) {
    (function (ScriptType) {
        ScriptType["JS"] = "js";
        ScriptType["CSS"] = "css";
    })(ScriptRule.ScriptType || (ScriptRule.ScriptType = {}));
    (function (ScriptLoadTime) {
        ScriptLoadTime["BEFORE_PAGE_LOAD"] = "beforePageLoad";
        ScriptLoadTime["AFTER_PAGE_LOAD"] = "afterPageLoad";
        ScriptLoadTime["AS_SOON_AS_POSSIBLE"] = "asSoonAsPossible";
    })(ScriptRule.ScriptLoadTime || (ScriptRule.ScriptLoadTime = {}));
    (function (ScriptValueType) {
        ScriptValueType["URL"] = "url";
        ScriptValueType["CODE"] = "code";
    })(ScriptRule.ScriptValueType || (ScriptRule.ScriptValueType = {}));
})(ScriptRule || (ScriptRule = {}));
/** Common **/
var RuleType;
(function (RuleType) {
    RuleType["REDIRECT"] = "Redirect";
    RuleType["REPLACE"] = "Replace";
    RuleType["QUERYPARAM"] = "QueryParam";
    RuleType["CANCEL"] = "Cancel";
    RuleType["DELAY"] = "Delay";
    RuleType["HEADERS"] = "Headers";
    RuleType["USERAGENT"] = "UserAgent";
    RuleType["REQUEST"] = "Request";
    RuleType["RESPONSE"] = "Response";
    RuleType["SCRIPT"] = "Script";
})(RuleType || (RuleType = {}));
var RuleSourceKey;
(function (RuleSourceKey) {
    RuleSourceKey["URL"] = "Url";
    RuleSourceKey["HOST"] = "host";
    RuleSourceKey["PATH"] = "path";
})(RuleSourceKey || (RuleSourceKey = {}));
var RuleSourceOperator;
(function (RuleSourceOperator) {
    RuleSourceOperator["EQUALS"] = "Equals";
    RuleSourceOperator["CONTAINS"] = "Contains";
    RuleSourceOperator["MATCHES"] = "Matches";
    RuleSourceOperator["WILDCARD_MATCHES"] = "Wildcard_Matches";
})(RuleSourceOperator || (RuleSourceOperator = {}));

/**
 * Converts Header Editor JSON export to Requestly export format.
 * @param input The parsed JSON from Header Editor (input.json)
 * @returns The Requestly export JSON structure
 */
const notSupportedFeatures = ["receiveBody"];
const headerEditorImporter = (profile) => {
    const result = parseHeaderEditorProfile(profile);
    return {
        data: result.data,
        notSupportedFeatures,
        errors: result.errors,
    };
};
const parseHeaderEditorProfile = (profile) => {
    const result = {};
    const outputRecords = [];
    // Helper for status
    const getStatus = (enable) => enable === false ? RecordStatus.INACTIVE : RecordStatus.ACTIVE;
    // --- Redirect & Cancel rules ---
    (profile.request || []).forEach((rule) => {
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
                            value: filterField === "regexFilter" ? "/" + pattern + "/" : pattern,
                        },
                    },
                ],
                ruleType: RuleType.REDIRECT,
                schemaVersion: "3.0.0",
                status: getStatus(rule.enable),
            });
        }
        else if (rule.ruleType === "cancel") {
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
    (profile.sendHeader || []).forEach((rule) => {
        const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
        outputRecords.push({
            creationDate: Date.now(),
            description: rule.name || "Modify Request Header imported from Header Editor",
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
    (profile.receiveHeader || []).forEach((rule) => {
        const { operator, filterField } = mapMatchTypeToOperator(rule.matchType);
        outputRecords.push({
            creationDate: Date.now(),
            description: rule.name || "Modify Response Header imported from Header Editor",
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
function mapMatchTypeToOperator(matchType) {
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
function randomId(prefix) {
    return prefix + "_" + Math.random().toString(36).substring(2, 7);
}
const GROUP_ID = randomId("Group");

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var jszip_min = {exports: {}};

/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

var hasRequiredJszip_min;

function requireJszip_min () {
	if (hasRequiredJszip_min) return jszip_min.exports;
	hasRequiredJszip_min = 1;
	(function (module, exports) {
		!function(e){module.exports=e();}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t="function"==typeof commonjsRequire&&commonjsRequire;if(!e&&t)return t(r,true);if(l)return l(r,true);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h);}return o[r].exports}for(var l="function"==typeof commonjsRequire&&commonjsRequire,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l};},{"./support":30,"./utils":32}],2:[function(e,t,r){var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i;}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o;},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate");},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e;}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return  -1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return  -1^e}(0|t,e,e.length,0):0};},{"./utils":32}],5:[function(e,t,r){r.base64=false,r.binary=false,r.dir=false,r.createFolders=true,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null;},{}],6:[function(e,t,r){var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n};},{lie:37}],7:[function(e,t,r){var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={};}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),false);},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],true);},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null;},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:true,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta});};},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})};},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=false,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[];}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}));},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,false,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}});}else this.accumulate=true;},s.prototype.closedSource=function(e){this.accumulate=false;var t=this.streamFiles&&!e.file.dir,r=n(e,t,true,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null;},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}});},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume();},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e);}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end();}),e.on("error",function(e){t.error(e);}),this},s.prototype.resume=function(){return !!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),true):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),true))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return  false;for(var r=0;r<t.length;r++)try{t[r].error(e);}catch(e){}return  true},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock();},t.exports=s;},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o);}),o.entriesCount=h;}catch(e){o.error(e);}return o};},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e};}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return (new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n;},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e);}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e();}).resume();})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:false,checkCRC32:false,optimizedBinaryString:false,createFolders:false,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,true,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:true,optimizedBinaryString:true,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s);}return t.zipComment.length&&(h.comment=t.zipComment),h})};},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=false,this._bindStream(t);}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}});}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e);}).on("end",function(){t.isPaused?t._upstreamEnded=true:t.end();});},s.prototype.pause=function(){return !!i.prototype.pause.call(this)&&(this._stream.pause(),true)},s.prototype.resume=function(){return !!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),true)},t.exports=s;},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t);}).on("error",function(e){n.emit("error",e);}).on("end",function(){n.push(null);});}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume();},t.exports=n;},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}};},{}],15:[function(e,t,r){function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=true),s.dosPermissions&&16&s.dosPermissions&&(s.dir=true),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,true);var a="string"===i&&false===s.binary&&false===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=false,s.binary=true,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h;}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return "/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:true,createFolders:t}),this.files[e]};function h(e){return "[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n);},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t);}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return !t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n);}catch(e){(t=new l("error")).error(e);}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return (e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n;},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){t.exports=e("stream");},{stream:void 0}],17:[function(e,t,r){var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t];}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return  -1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return [];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i;},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0;}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e);},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e;},skip:function(e){this.setIndex(this.index+e);},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i;},{"../utils":32}],19:[function(e,t,r){var n=e("./Uint8ArrayReader");function i(e){n.call(this,e);}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i;},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){var n=e("./DataReader");function i(e){n.call(this,e);}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i;},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){var n=e("./ArrayReader");function i(e){n.call(this,e);}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i;},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)};},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b";},{}],24:[function(e,t,r){var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e;}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta});},t.exports=s;},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0);}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e);},t.exports=s;},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0);}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length;}i.prototype.processChunk.call(this,e);},t.exports=s;},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=false,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=false,e.then(function(e){t.dataIsReady=true,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat();},function(e){t.error(e);});}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null;},s.prototype.resume=function(){return !!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=true,n.delay(this._tickAndRepeat,[],this)),true)},s.prototype._tickAndRepeat=function(){this._tickScheduled=false,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=true));},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return  false;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case "string":e=this.data.substring(this.index,t);break;case "uint8array":e=this.data.subarray(this.index,t);break;case "array":case "nodebuffer":e=this.data.slice(this.index,t);}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s;},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=true,this.isFinished=false,this.isLocked=false,this._listeners={data:[],end:[],error:[]},this.previous=null;}n.prototype={push:function(e){this.emit("data",e);},end:function(){if(this.isFinished)return  false;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0;}catch(e){this.emit("error",e);}return  true},error:function(e){return !this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=true,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),true)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[];},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t);},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e);}),e.on("end",function(){t.end();}),e.on("error",function(e){t.error(e);}),this},pause:function(){return !this.isPaused&&!this.isFinished&&(this.isPaused=true,this.previous&&this.previous.pause(),true)},resume:function(){if(!this.isPaused||this.isFinished)return  false;var e=this.isPaused=false;return this.generatedError&&(this.error(this.generatedError),e=true),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e);},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e]);},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=true,this.previous&&this.previous.lock();},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n;},{}],29:[function(e,t,r){var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter");}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t);}).on("error",function(e){n=[],r(e);}).on("end",function(){try{var e=function(e,t,r){switch(e){case "blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case "base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case "string":return t.join("");case "array":return Array.prototype.concat.apply([],t);case "uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case "nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e);}catch(e){r(e);}n=[];}).resume();})}function f(e,t,r){var n=t;switch(t){case "blob":case "arraybuffer":n="uint8array";break;case "base64":n="string";}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock();}catch(e){this._worker=new s("error"),this._worker.error(e);}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return "data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta);}):this._worker.on(e,function(){h.delay(t,arguments,r);}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f;},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){if(r.base64=true,r.array=true,r.string=true,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=false;else {var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size;}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size;}catch(e){r.blob=false;}}}try{r.nodestream=!!e("readable-stream").Readable;}catch(e){r.nodestream=false;}},{"readable-stream":16}],31:[function(e,t,s){for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null;}function l(){n.call(this,"utf-8 encode");}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else {for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n);}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length);}else t=this.leftOver.concat(t);this.leftOver=null;}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta});},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null);},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta});},s.Utf8EncodeWorker=l;},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return  false}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return  false}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=true;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2);}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i));}return r.join("/")},a.getTypeOf=function(e){return "string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[]);});},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r;},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result);},e.onerror=function(e){r(e.target.error);},e.readAsArrayBuffer(n);}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&true!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})};},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e;}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r);},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r};},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes();},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw !this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=true,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral();}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e);},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles();}},t.exports=h;},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t;}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize));},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength);},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=true);},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4));}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i);},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else {var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else {var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r);}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else {var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i);}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l;},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions};}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker));}catch(e){(t=new h("error")).error(e);}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n;},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:true}),r=function(){a.data=i=++i%2;};}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null;},t.document.documentElement.appendChild(e);}:function(){setTimeout(u,0);};else {var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0);};}var h=[];function u(){var e,t;n=true;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length;}n=false;}l.exports=function(e){1!==h.push(e)||n||r();};}).call(this,"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{}],37:[function(e,t,r){var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e);}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected);}function f(t,r,n){i(function(){var e;try{e=r(n);}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e);});}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments);}}function d(t,e){var r=false;function n(e){r||(r=true,l.reject(t,e));}function i(e){r||(r=true,l.resolve(t,e));}var s=p(function(){e(i,n);});"error"===s.status&&n(s.value);}function p(e,t){var r={};try{r.value=e(t),r.status="success";}catch(e){r.status="error",r.value=e;}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e);},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e);},h.prototype.callRejected=function(e){l.reject(this.promise,e);},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e);},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else {e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t);}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=false;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=true,l.resolve(o,s));},function(e){i||(i=true,l.reject(o,e));});}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=false;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=true,l.resolve(s,e));},function(e){n||(n=true,l.reject(s,e));});var a;return s};},{immediate:36}],38:[function(e,t,r){var n={};(0, e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n;},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=false,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=true;}}function n(e,t){var r=new p(t);if(r.push(e,true),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return  false;n=t===~~t?t:true===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=true);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)));}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=true,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e);},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg;},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return (t=t||{}).raw=true,n(e,t)},r.gzip=function(e,t){return (t=t||{}).gzip=true,n(e,t)};},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=false,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header);}function o(e,t){var r=new a(t);if(r.push(e,true),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=false;if(this.ended)return  false;n=t===~~t?t:true===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&true===f&&(r=m.Z_OK,f=false),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=true);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=true);}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=true,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e);},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg;},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return (t=t||{}).raw=true,o(e,t)},r.ungzip=o;},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s];},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s];},flattenChunks:function(e){return [].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s));},r.setTyped(n);},{}],42:[function(e,t,r){var h=e("./common"),i=true,s=true;try{String.fromCharCode.apply(null,[0]);}catch(e){i=false;}try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(e){s=false;}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else {for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i);}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t};},{"./common":41}],43:[function(e,t,r){t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521;}return i|s<<16|0};},{}],44:[function(e,t,r){t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},{}],45:[function(e,t,r){var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e;}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return  -1^e};},{}],46:[function(e,t,r){var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return (e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0;}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0));}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm);}function U(e,t){e.pending_buf[e.pending++]=t;}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t;}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a];}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f;}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++;}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,false),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,true),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,false),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,false),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,false),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--;}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,true),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,false),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i;}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0;}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0;}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return (e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,false),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,false),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,true),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,false),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else {var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1;}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73);}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s);}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91);}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s);}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103);}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,false),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,true),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,false),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead);}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,false),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,true),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,false),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,false),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r);}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)";},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=false;};},{}],48:[function(e,t,r){t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else {if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C;}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C;}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C;}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]));}else {for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]));}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p;};},{}],49:[function(e,t,r){var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return (e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=false,this.wrap=0,this.havedict=false,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=true;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=false;}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5;}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=false),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0;}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0;}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=true),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30;}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3;}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else {if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2;}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3;}else {for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7;}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k;}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}u>>>=v,l-=v,r.back+=v;}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra;}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}u>>>=v,l-=v,r.back+=v;}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra;}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window;}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8;}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0;}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8;}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0;}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return  -4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=false,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)";},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return  -1;if(0<z&&(0===e||1!==w))return  -1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]];}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0;}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0};},{"../utils/common":41}],51:[function(e,t,r){t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"};},{}],52:[function(e,t,r){var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0;}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length;}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t;}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255;}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r);}function L(e,t,r){P(e,r[2*t],r[2*t+1]);}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o));}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0;}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0;}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n;}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t);}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2;}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--);}}(e,t),Z(s,u,e.bl_count);}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4));}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4);}}n(T);var q=false;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r;}(e,t,r);}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p);}(),q=true),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e);},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1);}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e);},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8);}(e);};},{"../utils/common":41}],53:[function(e,t,r){t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0;};},{}],54:[function(e,t,r){(function(e){!function(r,n){if(!r.setImmediate){var i,s,t,a,o=1,h={},u=false,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e);});}:function(){if(r.postMessage&&!r.importScripts){var e=true,t=r.onmessage;return r.onmessage=function(){e=false;},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,false):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*");}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data);},function(e){t.port2.postMessage(e);}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null;},s.appendChild(t);}):function(e){setTimeout(c,0,e);},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f;}function f(e){delete h[e];}function c(e){if(u)setTimeout(c,0,e);else {var t=h[e];if(t){u=true;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r);}}(t);}finally{f(e),u=false;}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length));}}("undefined"==typeof self?void 0===e?this:e:self);}).call(this,"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{}]},{},[10])(10)}); 
	} (jszip_min));
	return jszip_min.exports;
}

var jszip_minExports = requireJszip_min();
var JSZip = /*@__PURE__*/getDefaultExportFromCjs(jszip_minExports);

function convertAuth(requestlyAuth) {
    if (!requestlyAuth || requestlyAuth.currentAuthType === "INHERIT") {
        return undefined;
    }
    const authType = requestlyAuth.currentAuthType;
    const authConfig = requestlyAuth.authConfigStore[authType];
    switch (authType) {
        case "BEARER_TOKEN":
            return {
                type: "bearer",
                bearer: [
                    {
                        key: "token",
                        value: authConfig?.bearer || "",
                        type: "string",
                    },
                ],
            };
        case "BASIC_AUTH":
            return {
                type: "basic",
                basic: [
                    {
                        key: "username",
                        value: authConfig?.username || "",
                        type: "string",
                    },
                    {
                        key: "password",
                        value: authConfig?.password || "",
                        type: "string",
                    },
                ],
            };
        case "API_KEY":
            return {
                type: "apikey",
                apikey: [
                    {
                        key: "key",
                        value: authConfig?.key || "",
                        type: "string",
                    },
                    {
                        key: "value",
                        value: authConfig?.value || "",
                        type: "string",
                    },
                    ...(authConfig?.addTo
                        ? [
                            {
                                key: "in",
                                value: authConfig.addTo.toLowerCase(),
                                type: "string",
                            },
                        ]
                        : []),
                ],
            };
        default:
            return undefined;
    }
}
function convertVariables(requestlyVariables) {
    if (!requestlyVariables) {
        return [];
    }
    return Object.entries(requestlyVariables).map(([key, variable]) => ({
        id: crypto.randomUUID(),
        key,
        value: variable.syncValue,
        type: variable.type === "string" ? "default" : variable.type,
    }));
}
/**
 * Converts Requestly script to Postman script format by replacing 'rq' with 'pm'
 */
function convertScript(script) {
    return script
        .replace(/\brq\./g, "pm.")
        .replace(/\brq\b/g, "pm");
}
function convertScripts(requestlyScripts) {
    const events = [];
    if (requestlyScripts?.preRequest) {
        const convertedPreRequest = convertScript(requestlyScripts.preRequest);
        events.push({
            listen: "prerequest",
            script: {
                id: crypto.randomUUID(),
                type: "text/javascript",
                exec: convertedPreRequest.split("\n").filter((line) => line.trim()),
                packages: {},
            },
        });
    }
    if (requestlyScripts?.postResponse) {
        const convertedPostResponse = convertScript(requestlyScripts.postResponse);
        events.push({
            listen: "test",
            script: {
                id: crypto.randomUUID(),
                type: "text/javascript",
                exec: convertedPostResponse.split("\n").filter((line) => line.trim()),
                packages: {},
            },
        });
    }
    return events;
}
/**
 * Parses a Requestly URL and extracts components for Postman format
 */
function parseUrl$1(url) {
    try {
        const pathVariables = [];
        const pathVarMatches = url.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
        if (pathVarMatches) {
            pathVarMatches.forEach((match) => {
                const varName = match.substring(1);
                pathVariables.push({
                    key: varName,
                    value: "",
                    description: `(Required) ${varName}`,
                });
            });
        }
        const [baseUrl] = url.split("?");
        const cleanUrl = baseUrl.replace(/\{\{[^}]+\}\}/g, "placeholder");
        let host = [];
        let path = [];
        let protocol = 'https'; // Default to https
        if (cleanUrl.includes("://")) {
            const urlObj = new URL(cleanUrl);
            protocol = urlObj.protocol.replace(':', '');
            if (urlObj.hostname === "placeholder") {
                host = ["{{url}}"];
            }
            else {
                host = urlObj.hostname.split(".");
            }
            path = urlObj.pathname.split("/").filter(Boolean);
        }
        else {
            if (baseUrl.startsWith("{{")) {
                host = [baseUrl.split("/")[0]];
                path = baseUrl.split("/").slice(1).filter(Boolean);
            }
            else {
                const parts = baseUrl.split("/").filter(Boolean);
                if (parts.length > 0) {
                    host = parts[0].split(".");
                    path = parts.slice(1);
                }
            }
        }
        return { host, path, protocol, variables: pathVariables };
    }
    catch (error) {
        const parts = url.split("/").filter(Boolean);
        return {
            host: parts.length > 0 ? [parts[0]] : ["{{url}}"],
            path: parts.slice(1),
            protocol: 'https', // Default to https
            variables: [],
        };
    }
}
/**
 * Converts Requestly request to Postman request format
 */
function convertRequest(requestlyRecord) {
    const requestData = requestlyRecord.data.request;
    if (!requestData) {
        return undefined;
    }
    const { host, path, protocol, variables } = parseUrl$1(requestData.url);
    const [, queryString] = requestData.url.split("?");
    const queryParamsMap = new Map();
    // First, add URL query parameters (disabled by default)
    if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        urlParams.forEach((value, key) => {
            queryParamsMap.set(key, {
                key,
                value,
                disabled: true,
            });
        });
    }
    // Then, add/override with request query parameters (respecting their enabled state)
    requestData.queryParams.forEach((param) => {
        queryParamsMap.set(param.key, {
            key: param.key,
            value: param.value,
            disabled: !param.isEnabled,
            description: param.description,
        });
    });
    const allQueryParams = Array.from(queryParamsMap.values());
    const headers = requestData.headers.map((header) => ({
        key: header.key,
        value: header.value,
        type: header.type || "text",
        disabled: !header.isEnabled,
        description: header.description,
    }));
    let body;
    // Handle different body types based on content type and body structure
    if (requestData.body !== null && requestData.body !== undefined) {
        if (requestData.contentType === "multipart/form-data") {
            // Handle multipart form data
            const formFields = Array.isArray(requestData.body) ? requestData.body : requestData.bodyContainer?.multipartForm || [];
            body = {
                mode: "formdata",
                formdata: formFields.map((field) => {
                    // Determine field type: if value is an array, it's a file field, otherwise text
                    const fieldType = ('type' in field && field.type) || (Array.isArray(field.value) ? "file" : "text");
                    const postmanField = {
                        key: field.key,
                        disabled: !field.isEnabled,
                        type: fieldType,
                    };
                    if (fieldType === "file" && Array.isArray(field.value)) {
                        // Handle file fields
                        const fileInfo = field.value[0]; // Take the first file
                        postmanField.src = fileInfo?.path || "";
                        postmanField.value = fileInfo?.name || "";
                    }
                    else {
                        // Handle text fields
                        postmanField.value = typeof field.value === "string" ? field.value : "";
                    }
                    return postmanField;
                }),
            };
        }
        else if (requestData.contentType === "application/x-www-form-urlencoded") {
            // Handle URL encoded form data - these are always simple text fields
            const formFields = Array.isArray(requestData.body) ? requestData.body : [];
            body = {
                mode: "urlencoded",
                urlencoded: formFields.map((field) => ({
                    key: field.key,
                    value: typeof field.value === "string" ? field.value : String(field.value),
                    disabled: !field.isEnabled,
                    type: "text",
                })),
            };
        }
        else if (typeof requestData.body === "string" && requestData.body.trim()) {
            // Handle raw body (JSON or raw text)
            let language = requestData.contentType === "application/json" ? "json" : "text";
            body = {
                mode: "raw",
                raw: requestData.body,
                options: {
                    raw: {
                        language,
                    },
                },
            };
        }
    }
    const postmanUrl = {
        raw: requestData.url,
        host,
        path,
        protocol,
        ...(allQueryParams.length > 0 && { query: allQueryParams }),
        ...(variables.length > 0 && { variable: variables }),
    };
    return {
        method: requestData.method,
        header: headers,
        ...(body && { body }),
        url: postmanUrl,
        ...(requestlyRecord.description && {
            description: requestlyRecord.description,
        }),
        ...(requestlyRecord.data.auth && {
            auth: convertAuth(requestlyRecord.data.auth),
        }),
    };
}
/**
 * Builds a hierarchical structure from flat Requestly records
 */
function buildHierarchy(records) {
    const hierarchy = new Map();
    records.forEach((record) => {
        const parentId = record.collectionId || "root";
        if (!hierarchy.has(parentId)) {
            hierarchy.set(parentId, []);
        }
        hierarchy.get(parentId).push(record);
    });
    return hierarchy;
}
/**
 * Converts records to Postman items recursively
 */
function convertToPostmanItems(records, hierarchy) {
    return records.map((record) => {
        const item = {
            id: crypto.randomUUID(),
            name: record.name,
            ...(record.description && { description: record.description }),
        };
        if (record.type === "collection") {
            const children = hierarchy.get(record.id) || [];
            item.item = convertToPostmanItems(children, hierarchy);
            if (record.data.auth) {
                item.auth = convertAuth(record.data.auth);
            }
            if (record.data.variables) {
                item.variable = convertVariables(record.data.variables);
            }
            if (record.data.scripts) {
                item.event = convertScripts(record.data.scripts);
            }
        }
        else if (record.type === "api") {
            item.request = convertRequest(record);
            item.response = [];
            if (record.data.scripts) {
                item.event = convertScripts(record.data.scripts);
            }
        }
        return item;
    });
}
/**
 * Creates a single Postman collection from a root collection
 */
function createCollectionFromRoot(rootCollection, hierarchy) {
    const children = hierarchy.get(rootCollection.id) || [];
    const allItems = convertToPostmanItems(children, hierarchy);
    const collectionAuth = rootCollection.data.auth
        ? convertAuth(rootCollection.data.auth)
        : undefined;
    const collectionVariables = rootCollection.data.variables
        ? convertVariables(rootCollection.data.variables)
        : [];
    const collectionEvents = rootCollection.data.scripts
        ? convertScripts(rootCollection.data.scripts)
        : [];
    return {
        info: {
            _postman_id: crypto.randomUUID(),
            name: rootCollection.name,
            ...(rootCollection.description && { description: rootCollection.description }),
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: allItems,
        ...(collectionVariables.length > 0 && {
            variable: collectionVariables,
        }),
        ...(collectionAuth && { auth: collectionAuth }),
        ...(collectionEvents.length > 0 && { event: collectionEvents }),
    };
}
/**
 * Creates a ZIP file containing multiple JSON files using JSZip
 */
async function createZipFile(collections) {
    const zip = new JSZip();
    // Create the archive.json file with collection metadata
    const archiveData = {
        collection: collections.reduce((acc, collection) => {
            acc[collection.data.info._postman_id] = true;
            return acc;
        }, {})
    };
    zip.file('archive.json', JSON.stringify(archiveData, null, 2));
    // Create collection folder and add each collection as a JSON file
    const collectionFolder = zip.folder('collection');
    collections.forEach(collection => {
        const fileName = `${collection.data.info._postman_id}.json`;
        const jsonContent = JSON.stringify(collection.data, null, 2);
        collectionFolder.file(fileName, jsonContent);
    });
    // Generate the ZIP file as Uint8Array
    return zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 6
        }
    });
}
/**
 * Main function to convert Requestly export to Postman collection(s)
 */
function convertRequestlyCollectionToPostman(requestlyData) {
    const records = requestlyData.records.filter((record) => !record.deleted);
    // Get all collection IDs to check for orphaned collections
    const existingCollectionIds = new Set(records
        .filter((record) => record.type === "collection")
        .map((record) => record.id));
    const rootCollections = records.filter((record) => record.type === "collection" &&
        (!record.collectionId || !existingCollectionIds.has(record.collectionId)));
    const hierarchy = buildHierarchy(records);
    // If there are multiple root collections, create separate collections and zip them
    if (rootCollections.length > 1) {
        const collections = rootCollections.map(rootCollection => ({
            name: rootCollection.name,
            data: createCollectionFromRoot(rootCollection, hierarchy)
        }));
        return createZipFile(collections).then(zipData => ({
            type: 'multiple',
            zipData,
            collections
        }));
    }
    // Single collection case (existing behavior)
    const mainCollection = rootCollections[0];
    const collectionName = mainCollection?.name || (records.length === 0 ? "Imported Collection" : "Requestly Collection");
    const collectionDescription = mainCollection?.description;
    let allItems = [];
    if (mainCollection) {
        const children = hierarchy.get(mainCollection.id) || [];
        allItems = convertToPostmanItems(children, hierarchy);
        const mainCollectionAuth = mainCollection.data.auth
            ? convertAuth(mainCollection.data.auth)
            : undefined;
        const mainCollectionVariables = mainCollection.data.variables
            ? convertVariables(mainCollection.data.variables)
            : [];
        const mainCollectionEvents = mainCollection.data.scripts
            ? convertScripts(mainCollection.data.scripts)
            : [];
        return {
            type: 'single',
            collection: {
                info: {
                    _postman_id: crypto.randomUUID(),
                    name: collectionName,
                    ...(collectionDescription && { description: collectionDescription }),
                    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                },
                item: allItems,
                ...(mainCollectionVariables.length > 0 && {
                    variable: mainCollectionVariables,
                }),
                ...(mainCollectionAuth && { auth: mainCollectionAuth }),
                ...(mainCollectionEvents.length > 0 && { event: mainCollectionEvents }),
            }
        };
    }
    else {
        allItems = convertToPostmanItems(records, hierarchy);
        return {
            type: 'single',
            collection: {
                info: {
                    _postman_id: crypto.randomUUID(),
                    name: collectionName,
                    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                },
                item: allItems,
            }
        };
    }
}

// Environment specific types and functions for Postman conversion
/**
 * Converts Requestly environment to Postman environment format
 */
function convertEnvironment(requestlyEnv) {
    const values = Object.entries(requestlyEnv.variables).map(([key, variable]) => ({
        key,
        value: variable.syncValue,
        type: variable.type === "secret" ? "secret" : "default",
        enabled: true,
    }));
    return {
        id: crypto.randomUUID(),
        name: requestlyEnv.name,
        values,
        _postman_variable_scope: "environment",
        _postman_exported_at: new Date().toISOString(),
        _postman_exported_using: "Requestly Exporter",
    };
}
/**
 * Converts Requestly environments to Postman environment format
 */
function convertRequestlyEnvironmentsToPostman(requestlyData) {
    if (!requestlyData.environments || requestlyData.environments.length === 0) {
        return [];
    }
    return requestlyData.environments.map(convertEnvironment);
}

var Authorization;
(function (Authorization) {
    let Type;
    (function (Type) {
        Type["INHERIT"] = "INHERIT";
        Type["NO_AUTH"] = "NO_AUTH";
        Type["API_KEY"] = "API_KEY";
        Type["BEARER_TOKEN"] = "BEARER_TOKEN";
        Type["BASIC_AUTH"] = "BASIC_AUTH";
    })(Type = Authorization.Type || (Authorization.Type = {}));
    Authorization.requiresConfig = (type) => {
        return ![Type.NO_AUTH, Type.INHERIT].includes(type);
    };
    Authorization.hasNoConfig = (type) => {
        return [Type.NO_AUTH, Type.INHERIT].includes(type);
    };
})(Authorization || (Authorization = {}));
var TestStatus;
(function (TestStatus) {
    TestStatus["PASSED"] = "passed";
    TestStatus["FAILED"] = "failed";
    TestStatus["SKIPPED"] = "skipped";
})(TestStatus || (TestStatus = {}));
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["GET"] = "GET";
    RequestMethod["POST"] = "POST";
    RequestMethod["PUT"] = "PUT";
    RequestMethod["PATCH"] = "PATCH";
    RequestMethod["DELETE"] = "DELETE";
    RequestMethod["HEAD"] = "HEAD";
    RequestMethod["OPTIONS"] = "OPTIONS";
})(RequestMethod || (RequestMethod = {}));
var FormDropDownOptions;
(function (FormDropDownOptions) {
    FormDropDownOptions["FILE"] = "file";
    FormDropDownOptions["TEXT"] = "text";
})(FormDropDownOptions || (FormDropDownOptions = {}));
var RequestContentType;
(function (RequestContentType) {
    RequestContentType["RAW"] = "text/plain";
    RequestContentType["JSON"] = "application/json";
    RequestContentType["FORM"] = "application/x-www-form-urlencoded";
    RequestContentType["MULTIPART_FORM"] = "multipart/form-data";
    RequestContentType["HTML"] = "text/html";
    RequestContentType["XML"] = "application/xml";
    RequestContentType["JAVASCRIPT"] = "application/javascript";
})(RequestContentType || (RequestContentType = {}));
var KeyValueDataType;
(function (KeyValueDataType) {
    KeyValueDataType["STRING"] = "string";
    KeyValueDataType["NUMBER"] = "number";
    KeyValueDataType["INTEGER"] = "integer";
    KeyValueDataType["BOOLEAN"] = "boolean";
})(KeyValueDataType || (KeyValueDataType = {}));
var KeyValueFormType;
(function (KeyValueFormType) {
    KeyValueFormType["HEADERS"] = "headers";
    KeyValueFormType["QUERY_PARAMS"] = "queryParams";
    KeyValueFormType["FORM"] = "form";
})(KeyValueFormType || (KeyValueFormType = {}));
var QueryParamSyncType;
(function (QueryParamSyncType) {
    QueryParamSyncType["SYNC"] = "sync";
    QueryParamSyncType["URL"] = "url";
    QueryParamSyncType["TABLE"] = "table";
})(QueryParamSyncType || (QueryParamSyncType = {}));
var CreateType;
(function (CreateType) {
    CreateType["API"] = "api";
    CreateType["COLLECTION"] = "collection";
    CreateType["ENVIRONMENT"] = "environment";
})(CreateType || (CreateType = {}));
var BulkActions;
(function (BulkActions) {
    BulkActions["DUPLICATE"] = "DUPLICATE";
    BulkActions["DELETE"] = "DELETE";
    BulkActions["MOVE"] = "MOVE";
    BulkActions["EXPORT"] = "EXPORT";
    BulkActions["EXPORT_REQUESTLY"] = "EXPORT_REQUESTLY";
    BulkActions["EXPORT_POSTMAN"] = "EXPORT_POSTMAN";
    BulkActions["SELECT_ALL"] = "SELECT_ALL";
})(BulkActions || (BulkActions = {}));
var ApiClientImporterType;
(function (ApiClientImporterType) {
    ApiClientImporterType["REQUESTLY"] = "REQUESTLY";
    ApiClientImporterType["POSTMAN"] = "POSTMAN";
    ApiClientImporterType["BRUNO"] = "BRUNO";
    ApiClientImporterType["CURL"] = "CURL";
    ApiClientImporterType["OPENAPI"] = "OPENAPI";
})(ApiClientImporterType || (ApiClientImporterType = {}));
var RQAPI;
(function (RQAPI) {
    (function (RecordType) {
        RecordType["API"] = "api";
        RecordType["COLLECTION"] = "collection";
        RecordType["ENVIRONMENT"] = "environment";
    })(RQAPI.RecordType || (RQAPI.RecordType = {}));
    (function (ScriptType) {
        ScriptType["PRE_REQUEST"] = "preRequest";
        ScriptType["POST_RESPONSE"] = "postResponse";
    })(RQAPI.ScriptType || (RQAPI.ScriptType = {}));
    (function (ApiEntryType) {
        ApiEntryType["HTTP"] = "http";
        ApiEntryType["GRAPHQL"] = "graphql";
    })(RQAPI.ApiEntryType || (RQAPI.ApiEntryType = {}));
    (function (ExecutionStatus) {
        ExecutionStatus["SUCCESS"] = "success";
        ExecutionStatus["ERROR"] = "error";
    })(RQAPI.ExecutionStatus || (RQAPI.ExecutionStatus = {}));
    (function (FileType) {
        FileType["API"] = "api";
        FileType["ENVIRONMENT"] = "environment";
        FileType["COLLECTION_VARIABLES"] = "collection_variables";
        FileType["DESCRIPTION"] = "description";
        FileType["AUTH"] = "auth";
        FileType["UNKNOWN"] = "unknown";
    })(RQAPI.FileType || (RQAPI.FileType = {}));
    (function (ApiClientErrorType) {
        ApiClientErrorType["PRE_VALIDATION"] = "pre_validation";
        ApiClientErrorType["CORE"] = "core";
        ApiClientErrorType["ABORT"] = "abort";
        ApiClientErrorType["SCRIPT"] = "script";
        ApiClientErrorType["MISSING_FILE"] = "missing_file";
    })(RQAPI.ApiClientErrorType || (RQAPI.ApiClientErrorType = {}));
})(RQAPI || (RQAPI = {}));

var EnvironmentVariableType;
(function (EnvironmentVariableType) {
    EnvironmentVariableType["String"] = "string";
    EnvironmentVariableType["Number"] = "number";
    EnvironmentVariableType["Boolean"] = "boolean";
    EnvironmentVariableType["Secret"] = "secret";
})(EnvironmentVariableType || (EnvironmentVariableType = {}));
var VariableScope;
(function (VariableScope) {
    VariableScope["RUNTIME"] = "runtime";
    VariableScope["ENVIRONMENT"] = "environment";
    VariableScope["COLLECTION"] = "collection";
    VariableScope["GLOBAL"] = "global";
})(VariableScope || (VariableScope = {}));

/**
 * Parse URL into components
 */
function parseUrl(url) {
    try {
        // If URL doesn't have protocol, add a temporary one for parsing
        let processedUrl = url;
        if (!url.match(/^[^:]+(?=:\/\/)/)) {
            processedUrl = `http://${url}`;
        }
        const urlObj = new URL(processedUrl);
        const protocol = urlObj.protocol.replace(":", "");
        let host = urlObj.hostname + (urlObj.port ? `:${urlObj.port}` : "");
        let path = urlObj.pathname;
        try {
            path = decodeURIComponent(urlObj.pathname);
            host = decodeURIComponent(host);
        }
        catch {
            // If decoding fails, use original values
        }
        const queryString = urlObj.search.substring(1); // Remove '?'
        return { protocol, host, path, queryString };
    }
    catch {
        // If URL parsing fails (e.g., contains variables), do basic string parsing
        // match everything before :// as protocol
        const protocolMatch = url.match(/^[^:]+(?=:\/\/)/);
        const protocol = protocolMatch ? protocolMatch[0] : "https";
        const withoutProtocol = url.replace(/.*:\/\//, "");
        const [hostAndPath, queryString = ""] = withoutProtocol.split("?");
        const [host, ...pathParts] = hostAndPath.split("/");
        const path = "/" + pathParts.join("/");
        return { protocol, host, path, queryString };
    }
}
/**
 * Infer OpenAPI schema from a parsed JSON value
 */
function inferSchemaFromValue(value) {
    if (value === null) {
        return { type: "string", nullable: true };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { type: "array", items: {} };
        }
        // Infer schema from first item
        return {
            type: "array",
            items: inferSchemaFromValue(value[0]),
        };
    }
    const type = typeof value;
    if (type === "object") {
        const properties = {};
        for (const key in value) {
            properties[key] = inferSchemaFromValue(value[key]);
        }
        return {
            type: "object",
            properties,
        };
    }
    if (type === "number") {
        return { type: Number.isInteger(value) ? "integer" : "number" };
    }
    if (type === "boolean") {
        return { type: "boolean" };
    }
    // Default to string
    return { type: "string" };
}
/**
 * Extract all API records from collection hierarchy with their inherited auth
 */
function extractApiRecords(collection, parentAuth) {
    const result = [];
    if (!collection.children) {
        return result;
    }
    for (const child of collection.children) {
        if (child.type === RQAPI.RecordType.COLLECTION) {
            // For collections, pass down auth and recurse
            const childAuth = child.data.auth;
            const collectionAuth = !childAuth || childAuth.currentAuthType === Authorization.Type.INHERIT
                ? parentAuth
                : childAuth;
            result.push(...extractApiRecords(child.data, collectionAuth));
        }
        else if (child.type === RQAPI.RecordType.API) {
            // Add API records with parent auth
            result.push({ record: child, parentAuth });
        }
    }
    return result;
}

/**
 * Headers that are skipped during OpenAPI export
 */
const SKIP_HEADERS = [
    "host",
    "content-length",
    "content-type",
    "accept",
    "user-agent",
    "connection",
];

/**
 * Convert path with {{variable}} to OpenAPI path with {variable}
 * Also extracts path parameters
 */
function convertPathVariables(path, pathVariables) {
    const parameters = [];
    // Convert {{variable}} to {variable} and collect parameters
    const openApiPath = path.replace(/\{\{([^}]+)\}\}|:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, var1, var2) => {
        const varName = var1 || var2;
        // Only add parameter if we haven't seen it before
        if (!parameters.find((p) => p.name === varName)) {
            const pathVar = pathVariables?.find((pv) => pv.key === varName);
            parameters.push({
                name: varName,
                in: "path",
                required: true,
                schema: {
                    type: pathVar?.dataType || "string",
                },
                description: pathVar?.description,
            });
        }
        return `{${varName}}`;
    });
    return { openApiPath, parameters };
}
/**
 * Convert query parameters to OpenAPI format
 */
function convertQueryParameters(queryParams) {
    return queryParams
        .filter((param) => param.isEnabled)
        .map((param) => ({
        name: param.key,
        in: "query",
        schema: {
            type: param.dataType || "string",
        },
        description: param.description,
        example: param.value || undefined,
    }));
}
/**
 * Convert headers to OpenAPI format
 * Skips common headers that are typically handled by the client
 */
function convertHeaders(headers) {
    return headers
        .filter((header) => header.isEnabled && !SKIP_HEADERS.includes(header.key.toLowerCase()))
        .map((header) => ({
        name: header.key,
        in: "header",
        schema: {
            type: "string",
        },
        description: header.description,
        example: header.value || undefined,
    }));
}
/**
 * Convert request body to OpenAPI format
 */
function convertRequestBody(request) {
    // Use request.contentType or infer from enabled Content-Type header
    let contentType = request.headers?.find((h) => h.key.toLowerCase() === "content-type")
        ?.value || request.contentType;
    if (!request.body && !request.bodyContainer) {
        return undefined;
    }
    const content = {};
    switch (contentType) {
        case RequestContentType.JSON: {
            let schema = { type: "object" };
            // Infer schema from body
            if (request.body && typeof request.body === "string") {
                try {
                    const parsed = JSON.parse(request.body);
                    schema = inferSchemaFromValue(parsed);
                }
                catch {
                    // If parsing fails, keep generic object schema
                }
            }
            content["application/json"] = {
                schema,
            };
            break;
        }
        case RequestContentType.RAW:
        case RequestContentType.HTML:
        case RequestContentType.XML:
        case RequestContentType.JAVASCRIPT: {
            const mimeType = contentType || "text/plain";
            content[mimeType] = {
                schema: {
                    type: "string",
                },
                example: typeof request.body === "string" ? request.body : undefined,
            };
            break;
        }
        case RequestContentType.FORM: {
            content["application/x-www-form-urlencoded"] = {
                schema: {
                    type: "object",
                    properties: {},
                },
            };
            if (Array.isArray(request.body)) {
                const properties = {};
                request.body.forEach((field) => {
                    if (field.isEnabled) {
                        properties[field.key] = {
                            type: "string",
                            example: field.value,
                        };
                    }
                });
                content["application/x-www-form-urlencoded"].schema = {
                    type: "object",
                    properties,
                };
            }
            break;
        }
        case RequestContentType.MULTIPART_FORM: {
            content["multipart/form-data"] = {
                schema: {
                    type: "object",
                    properties: {},
                },
            };
            if (Array.isArray(request.body)) {
                const properties = {};
                request.body.forEach((field) => {
                    if (field.isEnabled) {
                        // Check if it's a file field
                        const isFile = Array.isArray(field.value);
                        properties[field.key] = isFile
                            ? {
                                type: "string",
                                format: "binary",
                            }
                            : {
                                type: "string",
                                example: field.value,
                            };
                    }
                });
                content["multipart/form-data"].schema = {
                    type: "object",
                    properties,
                };
            }
            break;
        }
    }
    return Object.keys(content).length > 0 ? { content } : undefined;
}
/**
 * Get authentication for a request (handles inheritance)
 */
function getEffectiveAuth(record, parentAuth) {
    const recordAuth = record.data.auth;
    if (!recordAuth) {
        return parentAuth;
    }
    // Check if it's inherited
    if (recordAuth.currentAuthType === Authorization.Type.INHERIT) {
        return parentAuth;
    }
    return recordAuth;
}
/**
 * Convert RQAPI auth to OpenAPI security scheme
 */
function convertAuthToSecurityScheme(auth) {
    switch (auth.currentAuthType) {
        case Authorization.Type.BEARER_TOKEN: {
            auth.authConfigStore[Authorization.Type.BEARER_TOKEN];
            return {
                schemeName: "bearerAuth",
                scheme: {
                    type: "http",
                    scheme: "bearer",
                },
            };
        }
        case Authorization.Type.BASIC_AUTH: {
            return {
                schemeName: "basicAuth",
                scheme: {
                    type: "http",
                    scheme: "basic",
                },
            };
        }
        case Authorization.Type.API_KEY: {
            const config = auth.authConfigStore[Authorization.Type.API_KEY];
            if (config?.key) {
                const sanitizedName = config.key.replace(/[^a-zA-Z0-9]/g, "_");
                const schemeName = `apiKey_${sanitizedName}`;
                return {
                    schemeName,
                    scheme: {
                        type: "apiKey",
                        name: config.key,
                        in: config.addTo === "HEADER" ? "header" : "query",
                    },
                };
            }
            return null;
        }
        default:
            return null;
    }
}

/**
 * Process a single API request and add it to OpenAPI paths
 */
function processRequest(apiRecord, parentAuth) {
    const entry = apiRecord.data;
    if (entry.type === RQAPI.ApiEntryType.GRAPHQL) {
        return { serverUrl: "", paths: {}, openApiPath: "" };
    }
    const request = entry.request;
    const { protocol, host, path } = parseUrl(request.url);
    console.log("Parsed URL:", { protocol, host, path });
    // Convert path variables
    const { openApiPath, parameters: pathParams } = convertPathVariables(path, request.pathVariables);
    // Convert parameters
    const queryParams = request.queryParams
        ? convertQueryParameters(request.queryParams)
        : [];
    const headerParams = request.headers ? convertHeaders(request.headers) : [];
    const allParameters = [...pathParams, ...queryParams, ...headerParams];
    // Convert request body
    const requestBody = convertRequestBody(request);
    // Handle authentication
    const effectiveAuth = getEffectiveAuth(apiRecord, parentAuth);
    let security;
    let securityScheme;
    if (effectiveAuth) {
        const authScheme = convertAuthToSecurityScheme(effectiveAuth);
        if (authScheme) {
            securityScheme = authScheme;
            security = [{ [authScheme.schemeName]: [] }];
        }
    }
    // Create operation object
    const operation = {
        summary: apiRecord.name,
        description: apiRecord.description,
        parameters: allParameters.length > 0 ? allParameters : undefined,
        requestBody,
        responses: {
            "200": {
                description: "Successful response",
            },
        },
        security,
    };
    const serverUrl = `${protocol}://${host}`;
    const result = {
        serverUrl,
        paths: {},
        openApiPath,
        securityScheme,
    };
    if (!result.paths[openApiPath]) {
        result.paths[openApiPath] = {};
    }
    const methodKey = request.method.toLowerCase();
    result.paths[openApiPath][methodKey] = operation;
    return result;
}
/**
 * Main export function to convert Requestly Collection to OpenAPI 3.0
 */
function convertToOpenAPI(collection) {
    // Create base OpenAPI document
    const openApiDoc = {
        openapi: "3.0.0",
        info: {
            title: collection.name || "Exported API Collection",
            description: collection.description || "Exported from Requestly API Client",
            version: "1.0.0",
        },
        paths: {},
        servers: [],
        components: {
            securitySchemes: {},
        },
    };
    const collectionData = collection.data;
    // Track paths, servers, and security schemes
    const pathsMap = new Map();
    const serversSet = new Set();
    const securitySchemesMap = new Map();
    // Extract all API records from the collection hierarchy
    const apiRecords = extractApiRecords(collectionData, collectionData.auth);
    // Process each API record
    for (const { record, parentAuth } of apiRecords) {
        // Skip GraphQL requests
        if (record.data.type === RQAPI.ApiEntryType.GRAPHQL) {
            continue;
        }
        const result = processRequest(record, parentAuth);
        // Add server URL
        if (result.serverUrl) {
            serversSet.add(result.serverUrl);
        }
        // Add security scheme if present
        if (result.securityScheme) {
            securitySchemesMap.set(result.securityScheme.schemeName, result.securityScheme.scheme);
        }
        const entry = record.data;
        const request = entry.request;
        // Check for duplicate path + method
        if (!pathsMap.has(result.openApiPath)) {
            pathsMap.set(result.openApiPath, new Set());
        }
        const methodsForPath = pathsMap.get(result.openApiPath);
        if (methodsForPath.has(request.method)) {
            // Skip duplicate
            continue;
        }
        methodsForPath.add(request.method);
        // Merge paths properly and avoid overwriting methods
        for (const [path, methods] of Object.entries(result.paths)) {
            if (!openApiDoc.paths[path]) {
                openApiDoc.paths[path] = {};
            }
            openApiDoc.paths[path] = {
                ...openApiDoc.paths[path],
                ...methods,
            };
        }
    }
    // Add servers to document
    openApiDoc.servers = Array.from(serversSet).map((url) => ({ url }));
    // Add security schemes to document
    if (securitySchemesMap.size > 0) {
        openApiDoc.components = {
            securitySchemes: Object.fromEntries(securitySchemesMap),
        };
    }
    else {
        // Remove empty components
        delete openApiDoc.components;
    }
    return openApiDoc;
}

const unthrowableParseJson = (rawData) => {
    try {
        return JSON.parse(rawData);
    }
    catch (err) {
        return null;
    }
};
const getParamType = (paramSchema) => {
    if (paramSchema) {
        switch (paramSchema.type) {
            case "string":
                return "string";
            case "integer":
                return "number";
            case "boolean":
                return "boolean";
            case "number":
                return "number";
            default:
                return "string";
        }
    }
    return "string";
};
const getDefaultValueForType = (paramType, paramSchema) => {
    switch (paramType) {
        case "string":
            return "string";
        case "number":
            return paramSchema.minimum ?? 0;
        case "boolean":
            return false;
        default:
            return "string";
    }
};
const getEnumValue = (paramSchema) => {
    return paramSchema.enum?.[0] ?? "string";
};
const getParamValue = (paramSchema) => {
    if (!paramSchema) {
        return "string";
    }
    if (paramSchema.default !== undefined) {
        return paramSchema.default;
    }
    if (paramSchema.example !== undefined) {
        return paramSchema.example;
    }
    if (paramSchema.enum && paramSchema.enum.length > 0) {
        return getEnumValue(paramSchema);
    }
    const paramType = getParamType(paramSchema);
    return getDefaultValueForType(paramType, paramSchema);
};
const getKeyValueDataTypeFromParam = (paramSchema) => {
    if (paramSchema && paramSchema.type) {
        switch (paramSchema.type) {
            case "string":
                return KeyValueDataType.STRING;
            case "integer":
                return KeyValueDataType.INTEGER;
            case "boolean":
                return KeyValueDataType.BOOLEAN;
            case "number":
                return KeyValueDataType.NUMBER;
            default:
                return KeyValueDataType.STRING;
        }
    }
    return KeyValueDataType.STRING;
};

var util$1 = {};

var hasRequiredUtil$1;

function requireUtil$1 () {
	if (hasRequiredUtil$1) return util$1;
	hasRequiredUtil$1 = 1;

	const util = require$$0$3;

	util$1.format = util.format;
	util$1.inherits = util.inherits;
	const parse = (u) => new URL(u);

	/**
	 * Regular Expression that matches Swagger path params.
	 */
	util$1.swaggerParamRegExp = /\{([^/}]+)}/g;

	/**
	 * List of HTTP verbs used for OperationItem as per the Swagger specification
	 */
	const operationsList = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];

	/**
	 * This function takes in a Server object, checks if it has relative path
	 * and then fixes it as per the path url
	 *
	 * @param {object} server - The server object to be fixed
	 * @param {string} path - The path (an http/https url) from where the file was downloaded
	 * @returns {object} - The fixed server object
	 */
	function fixServers(server, path) {
	  // Server url starting with "/" tells that it is not an http(s) url
	  if (server.url && server.url.startsWith("/")) {
	    const inUrl = parse(path);
	    const finalUrl = inUrl.protocol + "//" + inUrl.hostname + server.url;
	    server.url = finalUrl;
	    return server;
	  }
	}

	/**
	 * This function helps fix the relative servers in the API definition file
	 * be at root, path or operation's level
	 */
	function fixOasRelativeServers(schema, filePath) {
	  if (schema.openapi && filePath && (filePath.startsWith("http:") || filePath.startsWith("https:"))) {
	    /**
	     * From OpenAPI v3 spec for Server object's url property: "REQUIRED. A URL to the target host.
	     * This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where
	     * the OpenAPI document is being served."
	     * Further, the spec says that "servers" property can show up at root level, in 'Path Item' object or in 'Operation' object.
	     * However, interpretation of the spec says that relative paths for servers should take into account the hostname that
	     * serves the OpenAPI file.
	     */
	    if (schema.servers) {
	      schema.servers.map((server) => fixServers(server, filePath)); // Root level servers array's fixup
	    }

	    // Path, Operation, or Webhook level servers array's fixup
	    ["paths", "webhooks"].forEach((component) => {
	      Object.keys(schema[component] || []).forEach((path) => {
	        const pathItem = schema[component][path];
	        Object.keys(pathItem).forEach((opItem) => {
	          if (opItem === "servers") {
	            // servers at pathitem level
	            pathItem[opItem].map((server) => fixServers(server, filePath));
	          } else if (operationsList.includes(opItem)) {
	            // servers at operation level
	            if (pathItem[opItem].servers) {
	              pathItem[opItem].servers.map((server) => fixServers(server, filePath));
	            }
	          }
	        });
	      });
	    });
	  }
	}

	util$1.fixOasRelativeServers = fixOasRelativeServers;
	return util$1;
}

var _2020 = {exports: {}};

var core$3 = {};

var validate = {};

var boolSchema = {};

var errors$1 = {};

var codegen = {};

var code$1 = {};

var hasRequiredCode$1;

function requireCode$1 () {
	if (hasRequiredCode$1) return code$1;
	hasRequiredCode$1 = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		class _CodeOrName {
		}
		exports._CodeOrName = _CodeOrName;
		exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
		class Name extends _CodeOrName {
		    constructor(s) {
		        super();
		        if (!exports.IDENTIFIER.test(s))
		            throw new Error("CodeGen: name must be a valid identifier");
		        this.str = s;
		    }
		    toString() {
		        return this.str;
		    }
		    emptyStr() {
		        return false;
		    }
		    get names() {
		        return { [this.str]: 1 };
		    }
		}
		exports.Name = Name;
		class _Code extends _CodeOrName {
		    constructor(code) {
		        super();
		        this._items = typeof code === "string" ? [code] : code;
		    }
		    toString() {
		        return this.str;
		    }
		    emptyStr() {
		        if (this._items.length > 1)
		            return false;
		        const item = this._items[0];
		        return item === "" || item === '""';
		    }
		    get str() {
		        var _a;
		        return ((_a = this._str) !== null && _a !== void 0 ? _a : (this._str = this._items.reduce((s, c) => `${s}${c}`, "")));
		    }
		    get names() {
		        var _a;
		        return ((_a = this._names) !== null && _a !== void 0 ? _a : (this._names = this._items.reduce((names, c) => {
		            if (c instanceof Name)
		                names[c.str] = (names[c.str] || 0) + 1;
		            return names;
		        }, {})));
		    }
		}
		exports._Code = _Code;
		exports.nil = new _Code("");
		function _(strs, ...args) {
		    const code = [strs[0]];
		    let i = 0;
		    while (i < args.length) {
		        addCodeArg(code, args[i]);
		        code.push(strs[++i]);
		    }
		    return new _Code(code);
		}
		exports._ = _;
		const plus = new _Code("+");
		function str(strs, ...args) {
		    const expr = [safeStringify(strs[0])];
		    let i = 0;
		    while (i < args.length) {
		        expr.push(plus);
		        addCodeArg(expr, args[i]);
		        expr.push(plus, safeStringify(strs[++i]));
		    }
		    optimize(expr);
		    return new _Code(expr);
		}
		exports.str = str;
		function addCodeArg(code, arg) {
		    if (arg instanceof _Code)
		        code.push(...arg._items);
		    else if (arg instanceof Name)
		        code.push(arg);
		    else
		        code.push(interpolate(arg));
		}
		exports.addCodeArg = addCodeArg;
		function optimize(expr) {
		    let i = 1;
		    while (i < expr.length - 1) {
		        if (expr[i] === plus) {
		            const res = mergeExprItems(expr[i - 1], expr[i + 1]);
		            if (res !== undefined) {
		                expr.splice(i - 1, 3, res);
		                continue;
		            }
		            expr[i++] = "+";
		        }
		        i++;
		    }
		}
		function mergeExprItems(a, b) {
		    if (b === '""')
		        return a;
		    if (a === '""')
		        return b;
		    if (typeof a == "string") {
		        if (b instanceof Name || a[a.length - 1] !== '"')
		            return;
		        if (typeof b != "string")
		            return `${a.slice(0, -1)}${b}"`;
		        if (b[0] === '"')
		            return a.slice(0, -1) + b.slice(1);
		        return;
		    }
		    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
		        return `"${a}${b.slice(1)}`;
		    return;
		}
		function strConcat(c1, c2) {
		    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str `${c1}${c2}`;
		}
		exports.strConcat = strConcat;
		// TODO do not allow arrays here
		function interpolate(x) {
		    return typeof x == "number" || typeof x == "boolean" || x === null
		        ? x
		        : safeStringify(Array.isArray(x) ? x.join(",") : x);
		}
		function stringify(x) {
		    return new _Code(safeStringify(x));
		}
		exports.stringify = stringify;
		function safeStringify(x) {
		    return JSON.stringify(x)
		        .replace(/\u2028/g, "\\u2028")
		        .replace(/\u2029/g, "\\u2029");
		}
		exports.safeStringify = safeStringify;
		function getProperty(key) {
		    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _ `[${key}]`;
		}
		exports.getProperty = getProperty;
		//Does best effort to format the name properly
		function getEsmExportName(key) {
		    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
		        return new _Code(`${key}`);
		    }
		    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
		}
		exports.getEsmExportName = getEsmExportName;
		function regexpCode(rx) {
		    return new _Code(rx.toString());
		}
		exports.regexpCode = regexpCode;
		
	} (code$1));
	return code$1;
}

var scope = {};

var hasRequiredScope;

function requireScope () {
	if (hasRequiredScope) return scope;
	hasRequiredScope = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
		const code_1 = requireCode$1();
		class ValueError extends Error {
		    constructor(name) {
		        super(`CodeGen: "code" for ${name} not defined`);
		        this.value = name.value;
		    }
		}
		var UsedValueState;
		(function (UsedValueState) {
		    UsedValueState[UsedValueState["Started"] = 0] = "Started";
		    UsedValueState[UsedValueState["Completed"] = 1] = "Completed";
		})(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
		exports.varKinds = {
		    const: new code_1.Name("const"),
		    let: new code_1.Name("let"),
		    var: new code_1.Name("var"),
		};
		class Scope {
		    constructor({ prefixes, parent } = {}) {
		        this._names = {};
		        this._prefixes = prefixes;
		        this._parent = parent;
		    }
		    toName(nameOrPrefix) {
		        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
		    }
		    name(prefix) {
		        return new code_1.Name(this._newName(prefix));
		    }
		    _newName(prefix) {
		        const ng = this._names[prefix] || this._nameGroup(prefix);
		        return `${prefix}${ng.index++}`;
		    }
		    _nameGroup(prefix) {
		        var _a, _b;
		        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || (this._prefixes && !this._prefixes.has(prefix))) {
		            throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
		        }
		        return (this._names[prefix] = { prefix, index: 0 });
		    }
		}
		exports.Scope = Scope;
		class ValueScopeName extends code_1.Name {
		    constructor(prefix, nameStr) {
		        super(nameStr);
		        this.prefix = prefix;
		    }
		    setValue(value, { property, itemIndex }) {
		        this.value = value;
		        this.scopePath = (0, code_1._) `.${new code_1.Name(property)}[${itemIndex}]`;
		    }
		}
		exports.ValueScopeName = ValueScopeName;
		const line = (0, code_1._) `\n`;
		class ValueScope extends Scope {
		    constructor(opts) {
		        super(opts);
		        this._values = {};
		        this._scope = opts.scope;
		        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
		    }
		    get() {
		        return this._scope;
		    }
		    name(prefix) {
		        return new ValueScopeName(prefix, this._newName(prefix));
		    }
		    value(nameOrPrefix, value) {
		        var _a;
		        if (value.ref === undefined)
		            throw new Error("CodeGen: ref must be passed in value");
		        const name = this.toName(nameOrPrefix);
		        const { prefix } = name;
		        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
		        let vs = this._values[prefix];
		        if (vs) {
		            const _name = vs.get(valueKey);
		            if (_name)
		                return _name;
		        }
		        else {
		            vs = this._values[prefix] = new Map();
		        }
		        vs.set(valueKey, name);
		        const s = this._scope[prefix] || (this._scope[prefix] = []);
		        const itemIndex = s.length;
		        s[itemIndex] = value.ref;
		        name.setValue(value, { property: prefix, itemIndex });
		        return name;
		    }
		    getValue(prefix, keyOrRef) {
		        const vs = this._values[prefix];
		        if (!vs)
		            return;
		        return vs.get(keyOrRef);
		    }
		    scopeRefs(scopeName, values = this._values) {
		        return this._reduceValues(values, (name) => {
		            if (name.scopePath === undefined)
		                throw new Error(`CodeGen: name "${name}" has no value`);
		            return (0, code_1._) `${scopeName}${name.scopePath}`;
		        });
		    }
		    scopeCode(values = this._values, usedValues, getCode) {
		        return this._reduceValues(values, (name) => {
		            if (name.value === undefined)
		                throw new Error(`CodeGen: name "${name}" has no value`);
		            return name.value.code;
		        }, usedValues, getCode);
		    }
		    _reduceValues(values, valueCode, usedValues = {}, getCode) {
		        let code = code_1.nil;
		        for (const prefix in values) {
		            const vs = values[prefix];
		            if (!vs)
		                continue;
		            const nameSet = (usedValues[prefix] = usedValues[prefix] || new Map());
		            vs.forEach((name) => {
		                if (nameSet.has(name))
		                    return;
		                nameSet.set(name, UsedValueState.Started);
		                let c = valueCode(name);
		                if (c) {
		                    const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
		                    code = (0, code_1._) `${code}${def} ${name} = ${c};${this.opts._n}`;
		                }
		                else if ((c = getCode === null || getCode === void 0 ? void 0 : getCode(name))) {
		                    code = (0, code_1._) `${code}${c}${this.opts._n}`;
		                }
		                else {
		                    throw new ValueError(name);
		                }
		                nameSet.set(name, UsedValueState.Completed);
		            });
		        }
		        return code;
		    }
		}
		exports.ValueScope = ValueScope;
		
	} (scope));
	return scope;
}

var hasRequiredCodegen;

function requireCodegen () {
	if (hasRequiredCodegen) return codegen;
	hasRequiredCodegen = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
		const code_1 = requireCode$1();
		const scope_1 = requireScope();
		var code_2 = requireCode$1();
		Object.defineProperty(exports, "_", { enumerable: true, get: function () { return code_2._; } });
		Object.defineProperty(exports, "str", { enumerable: true, get: function () { return code_2.str; } });
		Object.defineProperty(exports, "strConcat", { enumerable: true, get: function () { return code_2.strConcat; } });
		Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return code_2.nil; } });
		Object.defineProperty(exports, "getProperty", { enumerable: true, get: function () { return code_2.getProperty; } });
		Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return code_2.stringify; } });
		Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function () { return code_2.regexpCode; } });
		Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return code_2.Name; } });
		var scope_2 = requireScope();
		Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return scope_2.Scope; } });
		Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function () { return scope_2.ValueScope; } });
		Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function () { return scope_2.ValueScopeName; } });
		Object.defineProperty(exports, "varKinds", { enumerable: true, get: function () { return scope_2.varKinds; } });
		exports.operators = {
		    GT: new code_1._Code(">"),
		    GTE: new code_1._Code(">="),
		    LT: new code_1._Code("<"),
		    LTE: new code_1._Code("<="),
		    EQ: new code_1._Code("==="),
		    NEQ: new code_1._Code("!=="),
		    NOT: new code_1._Code("!"),
		    OR: new code_1._Code("||"),
		    AND: new code_1._Code("&&"),
		    ADD: new code_1._Code("+"),
		};
		class Node {
		    optimizeNodes() {
		        return this;
		    }
		    optimizeNames(_names, _constants) {
		        return this;
		    }
		}
		class Def extends Node {
		    constructor(varKind, name, rhs) {
		        super();
		        this.varKind = varKind;
		        this.name = name;
		        this.rhs = rhs;
		    }
		    render({ es5, _n }) {
		        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
		        const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
		        return `${varKind} ${this.name}${rhs};` + _n;
		    }
		    optimizeNames(names, constants) {
		        if (!names[this.name.str])
		            return;
		        if (this.rhs)
		            this.rhs = optimizeExpr(this.rhs, names, constants);
		        return this;
		    }
		    get names() {
		        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
		    }
		}
		class Assign extends Node {
		    constructor(lhs, rhs, sideEffects) {
		        super();
		        this.lhs = lhs;
		        this.rhs = rhs;
		        this.sideEffects = sideEffects;
		    }
		    render({ _n }) {
		        return `${this.lhs} = ${this.rhs};` + _n;
		    }
		    optimizeNames(names, constants) {
		        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
		            return;
		        this.rhs = optimizeExpr(this.rhs, names, constants);
		        return this;
		    }
		    get names() {
		        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
		        return addExprNames(names, this.rhs);
		    }
		}
		class AssignOp extends Assign {
		    constructor(lhs, op, rhs, sideEffects) {
		        super(lhs, rhs, sideEffects);
		        this.op = op;
		    }
		    render({ _n }) {
		        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
		    }
		}
		class Label extends Node {
		    constructor(label) {
		        super();
		        this.label = label;
		        this.names = {};
		    }
		    render({ _n }) {
		        return `${this.label}:` + _n;
		    }
		}
		class Break extends Node {
		    constructor(label) {
		        super();
		        this.label = label;
		        this.names = {};
		    }
		    render({ _n }) {
		        const label = this.label ? ` ${this.label}` : "";
		        return `break${label};` + _n;
		    }
		}
		class Throw extends Node {
		    constructor(error) {
		        super();
		        this.error = error;
		    }
		    render({ _n }) {
		        return `throw ${this.error};` + _n;
		    }
		    get names() {
		        return this.error.names;
		    }
		}
		class AnyCode extends Node {
		    constructor(code) {
		        super();
		        this.code = code;
		    }
		    render({ _n }) {
		        return `${this.code};` + _n;
		    }
		    optimizeNodes() {
		        return `${this.code}` ? this : undefined;
		    }
		    optimizeNames(names, constants) {
		        this.code = optimizeExpr(this.code, names, constants);
		        return this;
		    }
		    get names() {
		        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
		    }
		}
		class ParentNode extends Node {
		    constructor(nodes = []) {
		        super();
		        this.nodes = nodes;
		    }
		    render(opts) {
		        return this.nodes.reduce((code, n) => code + n.render(opts), "");
		    }
		    optimizeNodes() {
		        const { nodes } = this;
		        let i = nodes.length;
		        while (i--) {
		            const n = nodes[i].optimizeNodes();
		            if (Array.isArray(n))
		                nodes.splice(i, 1, ...n);
		            else if (n)
		                nodes[i] = n;
		            else
		                nodes.splice(i, 1);
		        }
		        return nodes.length > 0 ? this : undefined;
		    }
		    optimizeNames(names, constants) {
		        const { nodes } = this;
		        let i = nodes.length;
		        while (i--) {
		            // iterating backwards improves 1-pass optimization
		            const n = nodes[i];
		            if (n.optimizeNames(names, constants))
		                continue;
		            subtractNames(names, n.names);
		            nodes.splice(i, 1);
		        }
		        return nodes.length > 0 ? this : undefined;
		    }
		    get names() {
		        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
		    }
		}
		class BlockNode extends ParentNode {
		    render(opts) {
		        return "{" + opts._n + super.render(opts) + "}" + opts._n;
		    }
		}
		class Root extends ParentNode {
		}
		class Else extends BlockNode {
		}
		Else.kind = "else";
		class If extends BlockNode {
		    constructor(condition, nodes) {
		        super(nodes);
		        this.condition = condition;
		    }
		    render(opts) {
		        let code = `if(${this.condition})` + super.render(opts);
		        if (this.else)
		            code += "else " + this.else.render(opts);
		        return code;
		    }
		    optimizeNodes() {
		        super.optimizeNodes();
		        const cond = this.condition;
		        if (cond === true)
		            return this.nodes; // else is ignored here
		        let e = this.else;
		        if (e) {
		            const ns = e.optimizeNodes();
		            e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
		        }
		        if (e) {
		            if (cond === false)
		                return e instanceof If ? e : e.nodes;
		            if (this.nodes.length)
		                return this;
		            return new If(not(cond), e instanceof If ? [e] : e.nodes);
		        }
		        if (cond === false || !this.nodes.length)
		            return undefined;
		        return this;
		    }
		    optimizeNames(names, constants) {
		        var _a;
		        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
		        if (!(super.optimizeNames(names, constants) || this.else))
		            return;
		        this.condition = optimizeExpr(this.condition, names, constants);
		        return this;
		    }
		    get names() {
		        const names = super.names;
		        addExprNames(names, this.condition);
		        if (this.else)
		            addNames(names, this.else.names);
		        return names;
		    }
		}
		If.kind = "if";
		class For extends BlockNode {
		}
		For.kind = "for";
		class ForLoop extends For {
		    constructor(iteration) {
		        super();
		        this.iteration = iteration;
		    }
		    render(opts) {
		        return `for(${this.iteration})` + super.render(opts);
		    }
		    optimizeNames(names, constants) {
		        if (!super.optimizeNames(names, constants))
		            return;
		        this.iteration = optimizeExpr(this.iteration, names, constants);
		        return this;
		    }
		    get names() {
		        return addNames(super.names, this.iteration.names);
		    }
		}
		class ForRange extends For {
		    constructor(varKind, name, from, to) {
		        super();
		        this.varKind = varKind;
		        this.name = name;
		        this.from = from;
		        this.to = to;
		    }
		    render(opts) {
		        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
		        const { name, from, to } = this;
		        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
		    }
		    get names() {
		        const names = addExprNames(super.names, this.from);
		        return addExprNames(names, this.to);
		    }
		}
		class ForIter extends For {
		    constructor(loop, varKind, name, iterable) {
		        super();
		        this.loop = loop;
		        this.varKind = varKind;
		        this.name = name;
		        this.iterable = iterable;
		    }
		    render(opts) {
		        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
		    }
		    optimizeNames(names, constants) {
		        if (!super.optimizeNames(names, constants))
		            return;
		        this.iterable = optimizeExpr(this.iterable, names, constants);
		        return this;
		    }
		    get names() {
		        return addNames(super.names, this.iterable.names);
		    }
		}
		class Func extends BlockNode {
		    constructor(name, args, async) {
		        super();
		        this.name = name;
		        this.args = args;
		        this.async = async;
		    }
		    render(opts) {
		        const _async = this.async ? "async " : "";
		        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
		    }
		}
		Func.kind = "func";
		class Return extends ParentNode {
		    render(opts) {
		        return "return " + super.render(opts);
		    }
		}
		Return.kind = "return";
		class Try extends BlockNode {
		    render(opts) {
		        let code = "try" + super.render(opts);
		        if (this.catch)
		            code += this.catch.render(opts);
		        if (this.finally)
		            code += this.finally.render(opts);
		        return code;
		    }
		    optimizeNodes() {
		        var _a, _b;
		        super.optimizeNodes();
		        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
		        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
		        return this;
		    }
		    optimizeNames(names, constants) {
		        var _a, _b;
		        super.optimizeNames(names, constants);
		        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
		        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
		        return this;
		    }
		    get names() {
		        const names = super.names;
		        if (this.catch)
		            addNames(names, this.catch.names);
		        if (this.finally)
		            addNames(names, this.finally.names);
		        return names;
		    }
		}
		class Catch extends BlockNode {
		    constructor(error) {
		        super();
		        this.error = error;
		    }
		    render(opts) {
		        return `catch(${this.error})` + super.render(opts);
		    }
		}
		Catch.kind = "catch";
		class Finally extends BlockNode {
		    render(opts) {
		        return "finally" + super.render(opts);
		    }
		}
		Finally.kind = "finally";
		class CodeGen {
		    constructor(extScope, opts = {}) {
		        this._values = {};
		        this._blockStarts = [];
		        this._constants = {};
		        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
		        this._extScope = extScope;
		        this._scope = new scope_1.Scope({ parent: extScope });
		        this._nodes = [new Root()];
		    }
		    toString() {
		        return this._root.render(this.opts);
		    }
		    // returns unique name in the internal scope
		    name(prefix) {
		        return this._scope.name(prefix);
		    }
		    // reserves unique name in the external scope
		    scopeName(prefix) {
		        return this._extScope.name(prefix);
		    }
		    // reserves unique name in the external scope and assigns value to it
		    scopeValue(prefixOrName, value) {
		        const name = this._extScope.value(prefixOrName, value);
		        const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set());
		        vs.add(name);
		        return name;
		    }
		    getScopeValue(prefix, keyOrRef) {
		        return this._extScope.getValue(prefix, keyOrRef);
		    }
		    // return code that assigns values in the external scope to the names that are used internally
		    // (same names that were returned by gen.scopeName or gen.scopeValue)
		    scopeRefs(scopeName) {
		        return this._extScope.scopeRefs(scopeName, this._values);
		    }
		    scopeCode() {
		        return this._extScope.scopeCode(this._values);
		    }
		    _def(varKind, nameOrPrefix, rhs, constant) {
		        const name = this._scope.toName(nameOrPrefix);
		        if (rhs !== undefined && constant)
		            this._constants[name.str] = rhs;
		        this._leafNode(new Def(varKind, name, rhs));
		        return name;
		    }
		    // `const` declaration (`var` in es5 mode)
		    const(nameOrPrefix, rhs, _constant) {
		        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
		    }
		    // `let` declaration with optional assignment (`var` in es5 mode)
		    let(nameOrPrefix, rhs, _constant) {
		        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
		    }
		    // `var` declaration with optional assignment
		    var(nameOrPrefix, rhs, _constant) {
		        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
		    }
		    // assignment code
		    assign(lhs, rhs, sideEffects) {
		        return this._leafNode(new Assign(lhs, rhs, sideEffects));
		    }
		    // `+=` code
		    add(lhs, rhs) {
		        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
		    }
		    // appends passed SafeExpr to code or executes Block
		    code(c) {
		        if (typeof c == "function")
		            c();
		        else if (c !== code_1.nil)
		            this._leafNode(new AnyCode(c));
		        return this;
		    }
		    // returns code for object literal for the passed argument list of key-value pairs
		    object(...keyValues) {
		        const code = ["{"];
		        for (const [key, value] of keyValues) {
		            if (code.length > 1)
		                code.push(",");
		            code.push(key);
		            if (key !== value || this.opts.es5) {
		                code.push(":");
		                (0, code_1.addCodeArg)(code, value);
		            }
		        }
		        code.push("}");
		        return new code_1._Code(code);
		    }
		    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
		    if(condition, thenBody, elseBody) {
		        this._blockNode(new If(condition));
		        if (thenBody && elseBody) {
		            this.code(thenBody).else().code(elseBody).endIf();
		        }
		        else if (thenBody) {
		            this.code(thenBody).endIf();
		        }
		        else if (elseBody) {
		            throw new Error('CodeGen: "else" body without "then" body');
		        }
		        return this;
		    }
		    // `else if` clause - invalid without `if` or after `else` clauses
		    elseIf(condition) {
		        return this._elseNode(new If(condition));
		    }
		    // `else` clause - only valid after `if` or `else if` clauses
		    else() {
		        return this._elseNode(new Else());
		    }
		    // end `if` statement (needed if gen.if was used only with condition)
		    endIf() {
		        return this._endBlockNode(If, Else);
		    }
		    _for(node, forBody) {
		        this._blockNode(node);
		        if (forBody)
		            this.code(forBody).endFor();
		        return this;
		    }
		    // a generic `for` clause (or statement if `forBody` is passed)
		    for(iteration, forBody) {
		        return this._for(new ForLoop(iteration), forBody);
		    }
		    // `for` statement for a range of values
		    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
		        const name = this._scope.toName(nameOrPrefix);
		        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
		    }
		    // `for-of` statement (in es5 mode replace with a normal for loop)
		    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
		        const name = this._scope.toName(nameOrPrefix);
		        if (this.opts.es5) {
		            const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
		            return this.forRange("_i", 0, (0, code_1._) `${arr}.length`, (i) => {
		                this.var(name, (0, code_1._) `${arr}[${i}]`);
		                forBody(name);
		            });
		        }
		        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
		    }
		    // `for-in` statement.
		    // With option `ownProperties` replaced with a `for-of` loop for object keys
		    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
		        if (this.opts.ownProperties) {
		            return this.forOf(nameOrPrefix, (0, code_1._) `Object.keys(${obj})`, forBody);
		        }
		        const name = this._scope.toName(nameOrPrefix);
		        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
		    }
		    // end `for` loop
		    endFor() {
		        return this._endBlockNode(For);
		    }
		    // `label` statement
		    label(label) {
		        return this._leafNode(new Label(label));
		    }
		    // `break` statement
		    break(label) {
		        return this._leafNode(new Break(label));
		    }
		    // `return` statement
		    return(value) {
		        const node = new Return();
		        this._blockNode(node);
		        this.code(value);
		        if (node.nodes.length !== 1)
		            throw new Error('CodeGen: "return" should have one node');
		        return this._endBlockNode(Return);
		    }
		    // `try` statement
		    try(tryBody, catchCode, finallyCode) {
		        if (!catchCode && !finallyCode)
		            throw new Error('CodeGen: "try" without "catch" and "finally"');
		        const node = new Try();
		        this._blockNode(node);
		        this.code(tryBody);
		        if (catchCode) {
		            const error = this.name("e");
		            this._currNode = node.catch = new Catch(error);
		            catchCode(error);
		        }
		        if (finallyCode) {
		            this._currNode = node.finally = new Finally();
		            this.code(finallyCode);
		        }
		        return this._endBlockNode(Catch, Finally);
		    }
		    // `throw` statement
		    throw(error) {
		        return this._leafNode(new Throw(error));
		    }
		    // start self-balancing block
		    block(body, nodeCount) {
		        this._blockStarts.push(this._nodes.length);
		        if (body)
		            this.code(body).endBlock(nodeCount);
		        return this;
		    }
		    // end the current self-balancing block
		    endBlock(nodeCount) {
		        const len = this._blockStarts.pop();
		        if (len === undefined)
		            throw new Error("CodeGen: not in self-balancing block");
		        const toClose = this._nodes.length - len;
		        if (toClose < 0 || (nodeCount !== undefined && toClose !== nodeCount)) {
		            throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
		        }
		        this._nodes.length = len;
		        return this;
		    }
		    // `function` heading (or definition if funcBody is passed)
		    func(name, args = code_1.nil, async, funcBody) {
		        this._blockNode(new Func(name, args, async));
		        if (funcBody)
		            this.code(funcBody).endFunc();
		        return this;
		    }
		    // end function definition
		    endFunc() {
		        return this._endBlockNode(Func);
		    }
		    optimize(n = 1) {
		        while (n-- > 0) {
		            this._root.optimizeNodes();
		            this._root.optimizeNames(this._root.names, this._constants);
		        }
		    }
		    _leafNode(node) {
		        this._currNode.nodes.push(node);
		        return this;
		    }
		    _blockNode(node) {
		        this._currNode.nodes.push(node);
		        this._nodes.push(node);
		    }
		    _endBlockNode(N1, N2) {
		        const n = this._currNode;
		        if (n instanceof N1 || (N2 && n instanceof N2)) {
		            this._nodes.pop();
		            return this;
		        }
		        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
		    }
		    _elseNode(node) {
		        const n = this._currNode;
		        if (!(n instanceof If)) {
		            throw new Error('CodeGen: "else" without "if"');
		        }
		        this._currNode = n.else = node;
		        return this;
		    }
		    get _root() {
		        return this._nodes[0];
		    }
		    get _currNode() {
		        const ns = this._nodes;
		        return ns[ns.length - 1];
		    }
		    set _currNode(node) {
		        const ns = this._nodes;
		        ns[ns.length - 1] = node;
		    }
		}
		exports.CodeGen = CodeGen;
		function addNames(names, from) {
		    for (const n in from)
		        names[n] = (names[n] || 0) + (from[n] || 0);
		    return names;
		}
		function addExprNames(names, from) {
		    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
		}
		function optimizeExpr(expr, names, constants) {
		    if (expr instanceof code_1.Name)
		        return replaceName(expr);
		    if (!canOptimize(expr))
		        return expr;
		    return new code_1._Code(expr._items.reduce((items, c) => {
		        if (c instanceof code_1.Name)
		            c = replaceName(c);
		        if (c instanceof code_1._Code)
		            items.push(...c._items);
		        else
		            items.push(c);
		        return items;
		    }, []));
		    function replaceName(n) {
		        const c = constants[n.str];
		        if (c === undefined || names[n.str] !== 1)
		            return n;
		        delete names[n.str];
		        return c;
		    }
		    function canOptimize(e) {
		        return (e instanceof code_1._Code &&
		            e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined));
		    }
		}
		function subtractNames(names, from) {
		    for (const n in from)
		        names[n] = (names[n] || 0) - (from[n] || 0);
		}
		function not(x) {
		    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._) `!${par(x)}`;
		}
		exports.not = not;
		const andCode = mappend(exports.operators.AND);
		// boolean AND (&&) expression with the passed arguments
		function and(...args) {
		    return args.reduce(andCode);
		}
		exports.and = and;
		const orCode = mappend(exports.operators.OR);
		// boolean OR (||) expression with the passed arguments
		function or(...args) {
		    return args.reduce(orCode);
		}
		exports.or = or;
		function mappend(op) {
		    return (x, y) => (x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._) `${par(x)} ${op} ${par(y)}`);
		}
		function par(x) {
		    return x instanceof code_1.Name ? x : (0, code_1._) `(${x})`;
		}
		
	} (codegen));
	return codegen;
}

var util = {};

var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;
	Object.defineProperty(util, "__esModule", { value: true });
	util.checkStrictMode = util.getErrorPath = util.Type = util.useFunc = util.setEvaluated = util.evaluatedPropsToName = util.mergeEvaluated = util.eachItem = util.unescapeJsonPointer = util.escapeJsonPointer = util.escapeFragment = util.unescapeFragment = util.schemaRefOrVal = util.schemaHasRulesButRef = util.schemaHasRules = util.checkUnknownRules = util.alwaysValidSchema = util.toHash = void 0;
	const codegen_1 = requireCodegen();
	const code_1 = requireCode$1();
	// TODO refactor to use Set
	function toHash(arr) {
	    const hash = {};
	    for (const item of arr)
	        hash[item] = true;
	    return hash;
	}
	util.toHash = toHash;
	function alwaysValidSchema(it, schema) {
	    if (typeof schema == "boolean")
	        return schema;
	    if (Object.keys(schema).length === 0)
	        return true;
	    checkUnknownRules(it, schema);
	    return !schemaHasRules(schema, it.self.RULES.all);
	}
	util.alwaysValidSchema = alwaysValidSchema;
	function checkUnknownRules(it, schema = it.schema) {
	    const { opts, self } = it;
	    if (!opts.strictSchema)
	        return;
	    if (typeof schema === "boolean")
	        return;
	    const rules = self.RULES.keywords;
	    for (const key in schema) {
	        if (!rules[key])
	            checkStrictMode(it, `unknown keyword: "${key}"`);
	    }
	}
	util.checkUnknownRules = checkUnknownRules;
	function schemaHasRules(schema, rules) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (rules[key])
	            return true;
	    return false;
	}
	util.schemaHasRules = schemaHasRules;
	function schemaHasRulesButRef(schema, RULES) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (key !== "$ref" && RULES.all[key])
	            return true;
	    return false;
	}
	util.schemaHasRulesButRef = schemaHasRulesButRef;
	function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
	    if (!$data) {
	        if (typeof schema == "number" || typeof schema == "boolean")
	            return schema;
	        if (typeof schema == "string")
	            return (0, codegen_1._) `${schema}`;
	    }
	    return (0, codegen_1._) `${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
	}
	util.schemaRefOrVal = schemaRefOrVal;
	function unescapeFragment(str) {
	    return unescapeJsonPointer(decodeURIComponent(str));
	}
	util.unescapeFragment = unescapeFragment;
	function escapeFragment(str) {
	    return encodeURIComponent(escapeJsonPointer(str));
	}
	util.escapeFragment = escapeFragment;
	function escapeJsonPointer(str) {
	    if (typeof str == "number")
	        return `${str}`;
	    return str.replace(/~/g, "~0").replace(/\//g, "~1");
	}
	util.escapeJsonPointer = escapeJsonPointer;
	function unescapeJsonPointer(str) {
	    return str.replace(/~1/g, "/").replace(/~0/g, "~");
	}
	util.unescapeJsonPointer = unescapeJsonPointer;
	function eachItem(xs, f) {
	    if (Array.isArray(xs)) {
	        for (const x of xs)
	            f(x);
	    }
	    else {
	        f(xs);
	    }
	}
	util.eachItem = eachItem;
	function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName, }) {
	    return (gen, from, to, toName) => {
	        const res = to === undefined
	            ? from
	            : to instanceof codegen_1.Name
	                ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to)
	                : from instanceof codegen_1.Name
	                    ? (mergeToName(gen, to, from), from)
	                    : mergeValues(from, to);
	        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
	    };
	}
	util.mergeEvaluated = {
	    props: makeMergeEvaluated({
	        mergeNames: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true && ${from} !== undefined`, () => {
	            gen.if((0, codegen_1._) `${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._) `${to} || {}`).code((0, codegen_1._) `Object.assign(${to}, ${from})`));
	        }),
	        mergeToName: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true`, () => {
	            if (from === true) {
	                gen.assign(to, true);
	            }
	            else {
	                gen.assign(to, (0, codegen_1._) `${to} || {}`);
	                setEvaluated(gen, to, from);
	            }
	        }),
	        mergeValues: (from, to) => (from === true ? true : { ...from, ...to }),
	        resultToName: evaluatedPropsToName,
	    }),
	    items: makeMergeEvaluated({
	        mergeNames: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._) `${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
	        mergeToName: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._) `${to} > ${from} ? ${to} : ${from}`)),
	        mergeValues: (from, to) => (from === true ? true : Math.max(from, to)),
	        resultToName: (gen, items) => gen.var("items", items),
	    }),
	};
	function evaluatedPropsToName(gen, ps) {
	    if (ps === true)
	        return gen.var("props", true);
	    const props = gen.var("props", (0, codegen_1._) `{}`);
	    if (ps !== undefined)
	        setEvaluated(gen, props, ps);
	    return props;
	}
	util.evaluatedPropsToName = evaluatedPropsToName;
	function setEvaluated(gen, props, ps) {
	    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._) `${props}${(0, codegen_1.getProperty)(p)}`, true));
	}
	util.setEvaluated = setEvaluated;
	const snippets = {};
	function useFunc(gen, f) {
	    return gen.scopeValue("func", {
	        ref: f,
	        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code)),
	    });
	}
	util.useFunc = useFunc;
	var Type;
	(function (Type) {
	    Type[Type["Num"] = 0] = "Num";
	    Type[Type["Str"] = 1] = "Str";
	})(Type || (util.Type = Type = {}));
	function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
	    // let path
	    if (dataProp instanceof codegen_1.Name) {
	        const isNumber = dataPropType === Type.Num;
	        return jsPropertySyntax
	            ? isNumber
	                ? (0, codegen_1._) `"[" + ${dataProp} + "]"`
	                : (0, codegen_1._) `"['" + ${dataProp} + "']"`
	            : isNumber
	                ? (0, codegen_1._) `"/" + ${dataProp}`
	                : (0, codegen_1._) `"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`; // TODO maybe use global escapePointer
	    }
	    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
	}
	util.getErrorPath = getErrorPath;
	function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
	    if (!mode)
	        return;
	    msg = `strict mode: ${msg}`;
	    if (mode === true)
	        throw new Error(msg);
	    it.self.logger.warn(msg);
	}
	util.checkStrictMode = checkStrictMode;
	
	return util;
}

var names = {};

var hasRequiredNames;

function requireNames () {
	if (hasRequiredNames) return names;
	hasRequiredNames = 1;
	Object.defineProperty(names, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const names$1 = {
	    // validation function arguments
	    data: new codegen_1.Name("data"), // data passed to validation function
	    // args passed from referencing schema
	    valCxt: new codegen_1.Name("valCxt"), // validation/data context - should not be used directly, it is destructured to the names below
	    instancePath: new codegen_1.Name("instancePath"),
	    parentData: new codegen_1.Name("parentData"),
	    parentDataProperty: new codegen_1.Name("parentDataProperty"),
	    rootData: new codegen_1.Name("rootData"), // root data - same as the data passed to the first/top validation function
	    dynamicAnchors: new codegen_1.Name("dynamicAnchors"), // used to support recursiveRef and dynamicRef
	    // function scoped variables
	    vErrors: new codegen_1.Name("vErrors"), // null or array of validation errors
	    errors: new codegen_1.Name("errors"), // counter of validation errors
	    this: new codegen_1.Name("this"),
	    // "globals"
	    self: new codegen_1.Name("self"),
	    scope: new codegen_1.Name("scope"),
	    // JTD serialize/parse name for JSON string and position
	    json: new codegen_1.Name("json"),
	    jsonPos: new codegen_1.Name("jsonPos"),
	    jsonLen: new codegen_1.Name("jsonLen"),
	    jsonPart: new codegen_1.Name("jsonPart"),
	};
	names.default = names$1;
	
	return names;
}

var hasRequiredErrors$1;

function requireErrors$1 () {
	if (hasRequiredErrors$1) return errors$1;
	hasRequiredErrors$1 = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
		const codegen_1 = requireCodegen();
		const util_1 = requireUtil();
		const names_1 = requireNames();
		exports.keywordError = {
		    message: ({ keyword }) => (0, codegen_1.str) `must pass "${keyword}" keyword validation`,
		};
		exports.keyword$DataError = {
		    message: ({ keyword, schemaType }) => schemaType
		        ? (0, codegen_1.str) `"${keyword}" keyword must be ${schemaType} ($data)`
		        : (0, codegen_1.str) `"${keyword}" keyword is invalid ($data)`,
		};
		function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
		    const { it } = cxt;
		    const { gen, compositeRule, allErrors } = it;
		    const errObj = errorObjectCode(cxt, error, errorPaths);
		    if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : (compositeRule || allErrors)) {
		        addError(gen, errObj);
		    }
		    else {
		        returnErrors(it, (0, codegen_1._) `[${errObj}]`);
		    }
		}
		exports.reportError = reportError;
		function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
		    const { it } = cxt;
		    const { gen, compositeRule, allErrors } = it;
		    const errObj = errorObjectCode(cxt, error, errorPaths);
		    addError(gen, errObj);
		    if (!(compositeRule || allErrors)) {
		        returnErrors(it, names_1.default.vErrors);
		    }
		}
		exports.reportExtraError = reportExtraError;
		function resetErrorsCount(gen, errsCount) {
		    gen.assign(names_1.default.errors, errsCount);
		    gen.if((0, codegen_1._) `${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._) `${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
		}
		exports.resetErrorsCount = resetErrorsCount;
		function extendErrors({ gen, keyword, schemaValue, data, errsCount, it, }) {
		    /* istanbul ignore if */
		    if (errsCount === undefined)
		        throw new Error("ajv implementation error");
		    const err = gen.name("err");
		    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
		        gen.const(err, (0, codegen_1._) `${names_1.default.vErrors}[${i}]`);
		        gen.if((0, codegen_1._) `${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._) `${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
		        gen.assign((0, codegen_1._) `${err}.schemaPath`, (0, codegen_1.str) `${it.errSchemaPath}/${keyword}`);
		        if (it.opts.verbose) {
		            gen.assign((0, codegen_1._) `${err}.schema`, schemaValue);
		            gen.assign((0, codegen_1._) `${err}.data`, data);
		        }
		    });
		}
		exports.extendErrors = extendErrors;
		function addError(gen, errObj) {
		    const err = gen.const("err", errObj);
		    gen.if((0, codegen_1._) `${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._) `[${err}]`), (0, codegen_1._) `${names_1.default.vErrors}.push(${err})`);
		    gen.code((0, codegen_1._) `${names_1.default.errors}++`);
		}
		function returnErrors(it, errs) {
		    const { gen, validateName, schemaEnv } = it;
		    if (schemaEnv.$async) {
		        gen.throw((0, codegen_1._) `new ${it.ValidationError}(${errs})`);
		    }
		    else {
		        gen.assign((0, codegen_1._) `${validateName}.errors`, errs);
		        gen.return(false);
		    }
		}
		const E = {
		    keyword: new codegen_1.Name("keyword"),
		    schemaPath: new codegen_1.Name("schemaPath"), // also used in JTD errors
		    params: new codegen_1.Name("params"),
		    propertyName: new codegen_1.Name("propertyName"),
		    message: new codegen_1.Name("message"),
		    schema: new codegen_1.Name("schema"),
		    parentSchema: new codegen_1.Name("parentSchema"),
		};
		function errorObjectCode(cxt, error, errorPaths) {
		    const { createErrors } = cxt.it;
		    if (createErrors === false)
		        return (0, codegen_1._) `{}`;
		    return errorObject(cxt, error, errorPaths);
		}
		function errorObject(cxt, error, errorPaths = {}) {
		    const { gen, it } = cxt;
		    const keyValues = [
		        errorInstancePath(it, errorPaths),
		        errorSchemaPath(cxt, errorPaths),
		    ];
		    extraErrorProps(cxt, error, keyValues);
		    return gen.object(...keyValues);
		}
		function errorInstancePath({ errorPath }, { instancePath }) {
		    const instPath = instancePath
		        ? (0, codegen_1.str) `${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}`
		        : errorPath;
		    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
		}
		function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
		    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str) `${errSchemaPath}/${keyword}`;
		    if (schemaPath) {
		        schPath = (0, codegen_1.str) `${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
		    }
		    return [E.schemaPath, schPath];
		}
		function extraErrorProps(cxt, { params, message }, keyValues) {
		    const { keyword, data, schemaValue, it } = cxt;
		    const { opts, propertyName, topSchemaRef, schemaPath } = it;
		    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._) `{}`]);
		    if (opts.messages) {
		        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
		    }
		    if (opts.verbose) {
		        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._) `${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
		    }
		    if (propertyName)
		        keyValues.push([E.propertyName, propertyName]);
		}
		
	} (errors$1));
	return errors$1;
}

var hasRequiredBoolSchema;

function requireBoolSchema () {
	if (hasRequiredBoolSchema) return boolSchema;
	hasRequiredBoolSchema = 1;
	Object.defineProperty(boolSchema, "__esModule", { value: true });
	boolSchema.boolOrEmptySchema = boolSchema.topBoolOrEmptySchema = void 0;
	const errors_1 = requireErrors$1();
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const boolError = {
	    message: "boolean schema is false",
	};
	function topBoolOrEmptySchema(it) {
	    const { gen, schema, validateName } = it;
	    if (schema === false) {
	        falseSchemaError(it, false);
	    }
	    else if (typeof schema == "object" && schema.$async === true) {
	        gen.return(names_1.default.data);
	    }
	    else {
	        gen.assign((0, codegen_1._) `${validateName}.errors`, null);
	        gen.return(true);
	    }
	}
	boolSchema.topBoolOrEmptySchema = topBoolOrEmptySchema;
	function boolOrEmptySchema(it, valid) {
	    const { gen, schema } = it;
	    if (schema === false) {
	        gen.var(valid, false); // TODO var
	        falseSchemaError(it);
	    }
	    else {
	        gen.var(valid, true); // TODO var
	    }
	}
	boolSchema.boolOrEmptySchema = boolOrEmptySchema;
	function falseSchemaError(it, overrideAllErrors) {
	    const { gen, data } = it;
	    // TODO maybe some other interface should be used for non-keyword validation errors...
	    const cxt = {
	        gen,
	        keyword: "false schema",
	        data,
	        schema: false,
	        schemaCode: false,
	        schemaValue: false,
	        params: {},
	        it,
	    };
	    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
	}
	
	return boolSchema;
}

var dataType = {};

var rules = {};

var hasRequiredRules;

function requireRules () {
	if (hasRequiredRules) return rules;
	hasRequiredRules = 1;
	Object.defineProperty(rules, "__esModule", { value: true });
	rules.getRules = rules.isJSONType = void 0;
	const _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
	const jsonTypes = new Set(_jsonTypes);
	function isJSONType(x) {
	    return typeof x == "string" && jsonTypes.has(x);
	}
	rules.isJSONType = isJSONType;
	function getRules() {
	    const groups = {
	        number: { type: "number", rules: [] },
	        string: { type: "string", rules: [] },
	        array: { type: "array", rules: [] },
	        object: { type: "object", rules: [] },
	    };
	    return {
	        types: { ...groups, integer: true, boolean: true, null: true },
	        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
	        post: { rules: [] },
	        all: {},
	        keywords: {},
	    };
	}
	rules.getRules = getRules;
	
	return rules;
}

var applicability = {};

var hasRequiredApplicability;

function requireApplicability () {
	if (hasRequiredApplicability) return applicability;
	hasRequiredApplicability = 1;
	Object.defineProperty(applicability, "__esModule", { value: true });
	applicability.shouldUseRule = applicability.shouldUseGroup = applicability.schemaHasRulesForType = void 0;
	function schemaHasRulesForType({ schema, self }, type) {
	    const group = self.RULES.types[type];
	    return group && group !== true && shouldUseGroup(schema, group);
	}
	applicability.schemaHasRulesForType = schemaHasRulesForType;
	function shouldUseGroup(schema, group) {
	    return group.rules.some((rule) => shouldUseRule(schema, rule));
	}
	applicability.shouldUseGroup = shouldUseGroup;
	function shouldUseRule(schema, rule) {
	    var _a;
	    return (schema[rule.keyword] !== undefined ||
	        ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== undefined)));
	}
	applicability.shouldUseRule = shouldUseRule;
	
	return applicability;
}

var hasRequiredDataType;

function requireDataType () {
	if (hasRequiredDataType) return dataType;
	hasRequiredDataType = 1;
	Object.defineProperty(dataType, "__esModule", { value: true });
	dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
	const rules_1 = requireRules();
	const applicability_1 = requireApplicability();
	const errors_1 = requireErrors$1();
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	var DataType;
	(function (DataType) {
	    DataType[DataType["Correct"] = 0] = "Correct";
	    DataType[DataType["Wrong"] = 1] = "Wrong";
	})(DataType || (dataType.DataType = DataType = {}));
	function getSchemaTypes(schema) {
	    const types = getJSONTypes(schema.type);
	    const hasNull = types.includes("null");
	    if (hasNull) {
	        if (schema.nullable === false)
	            throw new Error("type: null contradicts nullable: false");
	    }
	    else {
	        if (!types.length && schema.nullable !== undefined) {
	            throw new Error('"nullable" cannot be used without "type"');
	        }
	        if (schema.nullable === true)
	            types.push("null");
	    }
	    return types;
	}
	dataType.getSchemaTypes = getSchemaTypes;
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
	function getJSONTypes(ts) {
	    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
	    if (types.every(rules_1.isJSONType))
	        return types;
	    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
	}
	dataType.getJSONTypes = getJSONTypes;
	function coerceAndCheckDataType(it, types) {
	    const { gen, data, opts } = it;
	    const coerceTo = coerceToTypes(types, opts.coerceTypes);
	    const checkTypes = types.length > 0 &&
	        !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
	    if (checkTypes) {
	        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
	        gen.if(wrongType, () => {
	            if (coerceTo.length)
	                coerceData(it, types, coerceTo);
	            else
	                reportTypeError(it);
	        });
	    }
	    return checkTypes;
	}
	dataType.coerceAndCheckDataType = coerceAndCheckDataType;
	const COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
	function coerceToTypes(types, coerceTypes) {
	    return coerceTypes
	        ? types.filter((t) => COERCIBLE.has(t) || (coerceTypes === "array" && t === "array"))
	        : [];
	}
	function coerceData(it, types, coerceTo) {
	    const { gen, data, opts } = it;
	    const dataType = gen.let("dataType", (0, codegen_1._) `typeof ${data}`);
	    const coerced = gen.let("coerced", (0, codegen_1._) `undefined`);
	    if (opts.coerceTypes === "array") {
	        gen.if((0, codegen_1._) `${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen
	            .assign(data, (0, codegen_1._) `${data}[0]`)
	            .assign(dataType, (0, codegen_1._) `typeof ${data}`)
	            .if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
	    }
	    gen.if((0, codegen_1._) `${coerced} !== undefined`);
	    for (const t of coerceTo) {
	        if (COERCIBLE.has(t) || (t === "array" && opts.coerceTypes === "array")) {
	            coerceSpecificType(t);
	        }
	    }
	    gen.else();
	    reportTypeError(it);
	    gen.endIf();
	    gen.if((0, codegen_1._) `${coerced} !== undefined`, () => {
	        gen.assign(data, coerced);
	        assignParentData(it, coerced);
	    });
	    function coerceSpecificType(t) {
	        switch (t) {
	            case "string":
	                gen
	                    .elseIf((0, codegen_1._) `${dataType} == "number" || ${dataType} == "boolean"`)
	                    .assign(coerced, (0, codegen_1._) `"" + ${data}`)
	                    .elseIf((0, codegen_1._) `${data} === null`)
	                    .assign(coerced, (0, codegen_1._) `""`);
	                return;
	            case "number":
	                gen
	                    .elseIf((0, codegen_1._) `${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`)
	                    .assign(coerced, (0, codegen_1._) `+${data}`);
	                return;
	            case "integer":
	                gen
	                    .elseIf((0, codegen_1._) `${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`)
	                    .assign(coerced, (0, codegen_1._) `+${data}`);
	                return;
	            case "boolean":
	                gen
	                    .elseIf((0, codegen_1._) `${data} === "false" || ${data} === 0 || ${data} === null`)
	                    .assign(coerced, false)
	                    .elseIf((0, codegen_1._) `${data} === "true" || ${data} === 1`)
	                    .assign(coerced, true);
	                return;
	            case "null":
	                gen.elseIf((0, codegen_1._) `${data} === "" || ${data} === 0 || ${data} === false`);
	                gen.assign(coerced, null);
	                return;
	            case "array":
	                gen
	                    .elseIf((0, codegen_1._) `${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`)
	                    .assign(coerced, (0, codegen_1._) `[${data}]`);
	        }
	    }
	}
	function assignParentData({ gen, parentData, parentDataProperty }, expr) {
	    // TODO use gen.property
	    gen.if((0, codegen_1._) `${parentData} !== undefined`, () => gen.assign((0, codegen_1._) `${parentData}[${parentDataProperty}]`, expr));
	}
	function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
	    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
	    let cond;
	    switch (dataType) {
	        case "null":
	            return (0, codegen_1._) `${data} ${EQ} null`;
	        case "array":
	            cond = (0, codegen_1._) `Array.isArray(${data})`;
	            break;
	        case "object":
	            cond = (0, codegen_1._) `${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
	            break;
	        case "integer":
	            cond = numCond((0, codegen_1._) `!(${data} % 1) && !isNaN(${data})`);
	            break;
	        case "number":
	            cond = numCond();
	            break;
	        default:
	            return (0, codegen_1._) `typeof ${data} ${EQ} ${dataType}`;
	    }
	    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
	    function numCond(_cond = codegen_1.nil) {
	        return (0, codegen_1.and)((0, codegen_1._) `typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._) `isFinite(${data})` : codegen_1.nil);
	    }
	}
	dataType.checkDataType = checkDataType;
	function checkDataTypes(dataTypes, data, strictNums, correct) {
	    if (dataTypes.length === 1) {
	        return checkDataType(dataTypes[0], data, strictNums, correct);
	    }
	    let cond;
	    const types = (0, util_1.toHash)(dataTypes);
	    if (types.array && types.object) {
	        const notObj = (0, codegen_1._) `typeof ${data} != "object"`;
	        cond = types.null ? notObj : (0, codegen_1._) `!${data} || ${notObj}`;
	        delete types.null;
	        delete types.array;
	        delete types.object;
	    }
	    else {
	        cond = codegen_1.nil;
	    }
	    if (types.number)
	        delete types.integer;
	    for (const t in types)
	        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
	    return cond;
	}
	dataType.checkDataTypes = checkDataTypes;
	const typeError = {
	    message: ({ schema }) => `must be ${schema}`,
	    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._) `{type: ${schema}}` : (0, codegen_1._) `{type: ${schemaValue}}`,
	};
	function reportTypeError(it) {
	    const cxt = getTypeErrorContext(it);
	    (0, errors_1.reportError)(cxt, typeError);
	}
	dataType.reportTypeError = reportTypeError;
	function getTypeErrorContext(it) {
	    const { gen, data, schema } = it;
	    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
	    return {
	        gen,
	        keyword: "type",
	        data,
	        schema: schema.type,
	        schemaCode,
	        schemaValue: schemaCode,
	        parentSchema: schema,
	        params: {},
	        it,
	    };
	}
	
	return dataType;
}

var defaults = {};

var hasRequiredDefaults;

function requireDefaults () {
	if (hasRequiredDefaults) return defaults;
	hasRequiredDefaults = 1;
	Object.defineProperty(defaults, "__esModule", { value: true });
	defaults.assignDefaults = void 0;
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	function assignDefaults(it, ty) {
	    const { properties, items } = it.schema;
	    if (ty === "object" && properties) {
	        for (const key in properties) {
	            assignDefault(it, key, properties[key].default);
	        }
	    }
	    else if (ty === "array" && Array.isArray(items)) {
	        items.forEach((sch, i) => assignDefault(it, i, sch.default));
	    }
	}
	defaults.assignDefaults = assignDefaults;
	function assignDefault(it, prop, defaultValue) {
	    const { gen, compositeRule, data, opts } = it;
	    if (defaultValue === undefined)
	        return;
	    const childData = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(prop)}`;
	    if (compositeRule) {
	        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
	        return;
	    }
	    let condition = (0, codegen_1._) `${childData} === undefined`;
	    if (opts.useDefaults === "empty") {
	        condition = (0, codegen_1._) `${condition} || ${childData} === null || ${childData} === ""`;
	    }
	    // `${childData} === undefined` +
	    // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
	    gen.if(condition, (0, codegen_1._) `${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
	}
	
	return defaults;
}

var keyword = {};

var code = {};

var hasRequiredCode;

function requireCode () {
	if (hasRequiredCode) return code;
	hasRequiredCode = 1;
	Object.defineProperty(code, "__esModule", { value: true });
	code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const names_1 = requireNames();
	const util_2 = requireUtil();
	function checkReportMissingProp(cxt, prop) {
	    const { gen, data, it } = cxt;
	    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
	        cxt.setParams({ missingProperty: (0, codegen_1._) `${prop}` }, true);
	        cxt.error();
	    });
	}
	code.checkReportMissingProp = checkReportMissingProp;
	function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
	    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._) `${missing} = ${prop}`)));
	}
	code.checkMissingProp = checkMissingProp;
	function reportMissingProp(cxt, missing) {
	    cxt.setParams({ missingProperty: missing }, true);
	    cxt.error();
	}
	code.reportMissingProp = reportMissingProp;
	function hasPropFunc(gen) {
	    return gen.scopeValue("func", {
	        // eslint-disable-next-line @typescript-eslint/unbound-method
	        ref: Object.prototype.hasOwnProperty,
	        code: (0, codegen_1._) `Object.prototype.hasOwnProperty`,
	    });
	}
	code.hasPropFunc = hasPropFunc;
	function isOwnProperty(gen, data, property) {
	    return (0, codegen_1._) `${hasPropFunc(gen)}.call(${data}, ${property})`;
	}
	code.isOwnProperty = isOwnProperty;
	function propertyInData(gen, data, property, ownProperties) {
	    const cond = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
	    return ownProperties ? (0, codegen_1._) `${cond} && ${isOwnProperty(gen, data, property)}` : cond;
	}
	code.propertyInData = propertyInData;
	function noPropertyInData(gen, data, property, ownProperties) {
	    const cond = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(property)} === undefined`;
	    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
	}
	code.noPropertyInData = noPropertyInData;
	function allSchemaProperties(schemaMap) {
	    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
	}
	code.allSchemaProperties = allSchemaProperties;
	function schemaProperties(it, schemaMap) {
	    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
	}
	code.schemaProperties = schemaProperties;
	function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
	    const dataAndSchema = passSchema ? (0, codegen_1._) `${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
	    const valCxt = [
	        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
	        [names_1.default.parentData, it.parentData],
	        [names_1.default.parentDataProperty, it.parentDataProperty],
	        [names_1.default.rootData, names_1.default.rootData],
	    ];
	    if (it.opts.dynamicRef)
	        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
	    const args = (0, codegen_1._) `${dataAndSchema}, ${gen.object(...valCxt)}`;
	    return context !== codegen_1.nil ? (0, codegen_1._) `${func}.call(${context}, ${args})` : (0, codegen_1._) `${func}(${args})`;
	}
	code.callValidateCode = callValidateCode;
	const newRegExp = (0, codegen_1._) `new RegExp`;
	function usePattern({ gen, it: { opts } }, pattern) {
	    const u = opts.unicodeRegExp ? "u" : "";
	    const { regExp } = opts.code;
	    const rx = regExp(pattern, u);
	    return gen.scopeValue("pattern", {
	        key: rx.toString(),
	        ref: rx,
	        code: (0, codegen_1._) `${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`,
	    });
	}
	code.usePattern = usePattern;
	function validateArray(cxt) {
	    const { gen, data, keyword, it } = cxt;
	    const valid = gen.name("valid");
	    if (it.allErrors) {
	        const validArr = gen.let("valid", true);
	        validateItems(() => gen.assign(validArr, false));
	        return validArr;
	    }
	    gen.var(valid, true);
	    validateItems(() => gen.break());
	    return valid;
	    function validateItems(notValid) {
	        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
	        gen.forRange("i", 0, len, (i) => {
	            cxt.subschema({
	                keyword,
	                dataProp: i,
	                dataPropType: util_1.Type.Num,
	            }, valid);
	            gen.if((0, codegen_1.not)(valid), notValid);
	        });
	    }
	}
	code.validateArray = validateArray;
	function validateUnion(cxt) {
	    const { gen, schema, keyword, it } = cxt;
	    /* istanbul ignore if */
	    if (!Array.isArray(schema))
	        throw new Error("ajv implementation error");
	    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
	    if (alwaysValid && !it.opts.unevaluated)
	        return;
	    const valid = gen.let("valid", false);
	    const schValid = gen.name("_valid");
	    gen.block(() => schema.forEach((_sch, i) => {
	        const schCxt = cxt.subschema({
	            keyword,
	            schemaProp: i,
	            compositeRule: true,
	        }, schValid);
	        gen.assign(valid, (0, codegen_1._) `${valid} || ${schValid}`);
	        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
	        // can short-circuit if `unevaluatedProperties/Items` not supported (opts.unevaluated !== true)
	        // or if all properties and items were evaluated (it.props === true && it.items === true)
	        if (!merged)
	            gen.if((0, codegen_1.not)(valid));
	    }));
	    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
	}
	code.validateUnion = validateUnion;
	
	return code;
}

var hasRequiredKeyword;

function requireKeyword () {
	if (hasRequiredKeyword) return keyword;
	hasRequiredKeyword = 1;
	Object.defineProperty(keyword, "__esModule", { value: true });
	keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const code_1 = requireCode();
	const errors_1 = requireErrors$1();
	function macroKeywordCode(cxt, def) {
	    const { gen, keyword, schema, parentSchema, it } = cxt;
	    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
	    const schemaRef = useKeyword(gen, keyword, macroSchema);
	    if (it.opts.validateSchema !== false)
	        it.self.validateSchema(macroSchema, true);
	    const valid = gen.name("valid");
	    cxt.subschema({
	        schema: macroSchema,
	        schemaPath: codegen_1.nil,
	        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
	        topSchemaRef: schemaRef,
	        compositeRule: true,
	    }, valid);
	    cxt.pass(valid, () => cxt.error(true));
	}
	keyword.macroKeywordCode = macroKeywordCode;
	function funcKeywordCode(cxt, def) {
	    var _a;
	    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
	    checkAsyncKeyword(it, def);
	    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
	    const validateRef = useKeyword(gen, keyword, validate);
	    const valid = gen.let("valid");
	    cxt.block$data(valid, validateKeyword);
	    cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
	    function validateKeyword() {
	        if (def.errors === false) {
	            assignValid();
	            if (def.modifying)
	                modifyData(cxt);
	            reportErrs(() => cxt.error());
	        }
	        else {
	            const ruleErrs = def.async ? validateAsync() : validateSync();
	            if (def.modifying)
	                modifyData(cxt);
	            reportErrs(() => addErrs(cxt, ruleErrs));
	        }
	    }
	    function validateAsync() {
	        const ruleErrs = gen.let("ruleErrs", null);
	        gen.try(() => assignValid((0, codegen_1._) `await `), (e) => gen.assign(valid, false).if((0, codegen_1._) `${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._) `${e}.errors`), () => gen.throw(e)));
	        return ruleErrs;
	    }
	    function validateSync() {
	        const validateErrs = (0, codegen_1._) `${validateRef}.errors`;
	        gen.assign(validateErrs, null);
	        assignValid(codegen_1.nil);
	        return validateErrs;
	    }
	    function assignValid(_await = def.async ? (0, codegen_1._) `await ` : codegen_1.nil) {
	        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
	        const passSchema = !(("compile" in def && !$data) || def.schema === false);
	        gen.assign(valid, (0, codegen_1._) `${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
	    }
	    function reportErrs(errors) {
	        var _a;
	        gen.if((0, codegen_1.not)((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
	    }
	}
	keyword.funcKeywordCode = funcKeywordCode;
	function modifyData(cxt) {
	    const { gen, data, it } = cxt;
	    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._) `${it.parentData}[${it.parentDataProperty}]`));
	}
	function addErrs(cxt, errs) {
	    const { gen } = cxt;
	    gen.if((0, codegen_1._) `Array.isArray(${errs})`, () => {
	        gen
	            .assign(names_1.default.vErrors, (0, codegen_1._) `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`)
	            .assign(names_1.default.errors, (0, codegen_1._) `${names_1.default.vErrors}.length`);
	        (0, errors_1.extendErrors)(cxt);
	    }, () => cxt.error());
	}
	function checkAsyncKeyword({ schemaEnv }, def) {
	    if (def.async && !schemaEnv.$async)
	        throw new Error("async keyword in sync schema");
	}
	function useKeyword(gen, keyword, result) {
	    if (result === undefined)
	        throw new Error(`keyword "${keyword}" failed to compile`);
	    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
	}
	function validSchemaType(schema, schemaType, allowUndefined = false) {
	    // TODO add tests
	    return (!schemaType.length ||
	        schemaType.some((st) => st === "array"
	            ? Array.isArray(schema)
	            : st === "object"
	                ? schema && typeof schema == "object" && !Array.isArray(schema)
	                : typeof schema == st || (allowUndefined && typeof schema == "undefined")));
	}
	keyword.validSchemaType = validSchemaType;
	function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
	    /* istanbul ignore if */
	    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
	        throw new Error("ajv implementation error");
	    }
	    const deps = def.dependencies;
	    if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
	        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
	    }
	    if (def.validateSchema) {
	        const valid = def.validateSchema(schema[keyword]);
	        if (!valid) {
	            const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` +
	                self.errorsText(def.validateSchema.errors);
	            if (opts.validateSchema === "log")
	                self.logger.error(msg);
	            else
	                throw new Error(msg);
	        }
	    }
	}
	keyword.validateKeywordUsage = validateKeywordUsage;
	
	return keyword;
}

var subschema = {};

var hasRequiredSubschema;

function requireSubschema () {
	if (hasRequiredSubschema) return subschema;
	hasRequiredSubschema = 1;
	Object.defineProperty(subschema, "__esModule", { value: true });
	subschema.extendSubschemaMode = subschema.extendSubschemaData = subschema.getSubschema = void 0;
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
	    if (keyword !== undefined && schema !== undefined) {
	        throw new Error('both "keyword" and "schema" passed, only one allowed');
	    }
	    if (keyword !== undefined) {
	        const sch = it.schema[keyword];
	        return schemaProp === undefined
	            ? {
	                schema: sch,
	                schemaPath: (0, codegen_1._) `${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
	                errSchemaPath: `${it.errSchemaPath}/${keyword}`,
	            }
	            : {
	                schema: sch[schemaProp],
	                schemaPath: (0, codegen_1._) `${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
	                errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`,
	            };
	    }
	    if (schema !== undefined) {
	        if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
	            throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
	        }
	        return {
	            schema,
	            schemaPath,
	            topSchemaRef,
	            errSchemaPath,
	        };
	    }
	    throw new Error('either "keyword" or "schema" must be passed');
	}
	subschema.getSubschema = getSubschema;
	function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
	    if (data !== undefined && dataProp !== undefined) {
	        throw new Error('both "data" and "dataProp" passed, only one allowed');
	    }
	    const { gen } = it;
	    if (dataProp !== undefined) {
	        const { errorPath, dataPathArr, opts } = it;
	        const nextData = gen.let("data", (0, codegen_1._) `${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
	        dataContextProps(nextData);
	        subschema.errorPath = (0, codegen_1.str) `${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
	        subschema.parentDataProperty = (0, codegen_1._) `${dataProp}`;
	        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
	    }
	    if (data !== undefined) {
	        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true); // replaceable if used once?
	        dataContextProps(nextData);
	        if (propertyName !== undefined)
	            subschema.propertyName = propertyName;
	        // TODO something is possibly wrong here with not changing parentDataProperty and not appending dataPathArr
	    }
	    if (dataTypes)
	        subschema.dataTypes = dataTypes;
	    function dataContextProps(_nextData) {
	        subschema.data = _nextData;
	        subschema.dataLevel = it.dataLevel + 1;
	        subschema.dataTypes = [];
	        it.definedProperties = new Set();
	        subschema.parentData = it.data;
	        subschema.dataNames = [...it.dataNames, _nextData];
	    }
	}
	subschema.extendSubschemaData = extendSubschemaData;
	function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
	    if (compositeRule !== undefined)
	        subschema.compositeRule = compositeRule;
	    if (createErrors !== undefined)
	        subschema.createErrors = createErrors;
	    if (allErrors !== undefined)
	        subschema.allErrors = allErrors;
	    subschema.jtdDiscriminator = jtdDiscriminator; // not inherited
	    subschema.jtdMetadata = jtdMetadata; // not inherited
	}
	subschema.extendSubschemaMode = extendSubschemaMode;
	
	return subschema;
}

var resolve = {};

var fastDeepEqual;
var hasRequiredFastDeepEqual;

function requireFastDeepEqual () {
	if (hasRequiredFastDeepEqual) return fastDeepEqual;
	hasRequiredFastDeepEqual = 1;

	// do not edit .js files directly - edit src/index.jst



	fastDeepEqual = function equal(a, b) {
	  if (a === b) return true;

	  if (a && b && typeof a == 'object' && typeof b == 'object') {
	    if (a.constructor !== b.constructor) return false;

	    var length, i, keys;
	    if (Array.isArray(a)) {
	      length = a.length;
	      if (length != b.length) return false;
	      for (i = length; i-- !== 0;)
	        if (!equal(a[i], b[i])) return false;
	      return true;
	    }



	    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
	    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
	    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

	    keys = Object.keys(a);
	    length = keys.length;
	    if (length !== Object.keys(b).length) return false;

	    for (i = length; i-- !== 0;)
	      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

	    for (i = length; i-- !== 0;) {
	      var key = keys[i];

	      if (!equal(a[key], b[key])) return false;
	    }

	    return true;
	  }

	  // true if both NaN, false otherwise
	  return a!==a && b!==b;
	};
	return fastDeepEqual;
}

var jsonSchemaTraverse = {exports: {}};

var hasRequiredJsonSchemaTraverse;

function requireJsonSchemaTraverse () {
	if (hasRequiredJsonSchemaTraverse) return jsonSchemaTraverse.exports;
	hasRequiredJsonSchemaTraverse = 1;

	var traverse = jsonSchemaTraverse.exports = function (schema, opts, cb) {
	  // Legacy support for v0.3.1 and earlier.
	  if (typeof opts == 'function') {
	    cb = opts;
	    opts = {};
	  }

	  cb = opts.cb || cb;
	  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
	  var post = cb.post || function() {};

	  _traverse(opts, pre, post, schema, '', schema);
	};


	traverse.keywords = {
	  additionalItems: true,
	  items: true,
	  contains: true,
	  additionalProperties: true,
	  propertyNames: true,
	  not: true,
	  if: true,
	  then: true,
	  else: true
	};

	traverse.arrayKeywords = {
	  items: true,
	  allOf: true,
	  anyOf: true,
	  oneOf: true
	};

	traverse.propsKeywords = {
	  $defs: true,
	  definitions: true,
	  properties: true,
	  patternProperties: true,
	  dependencies: true
	};

	traverse.skipKeywords = {
	  default: true,
	  enum: true,
	  const: true,
	  required: true,
	  maximum: true,
	  minimum: true,
	  exclusiveMaximum: true,
	  exclusiveMinimum: true,
	  multipleOf: true,
	  maxLength: true,
	  minLength: true,
	  pattern: true,
	  format: true,
	  maxItems: true,
	  minItems: true,
	  uniqueItems: true,
	  maxProperties: true,
	  minProperties: true
	};


	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
	  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
	    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	    for (var key in schema) {
	      var sch = schema[key];
	      if (Array.isArray(sch)) {
	        if (key in traverse.arrayKeywords) {
	          for (var i=0; i<sch.length; i++)
	            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
	        }
	      } else if (key in traverse.propsKeywords) {
	        if (sch && typeof sch == 'object') {
	          for (var prop in sch)
	            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
	        }
	      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
	        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
	      }
	    }
	    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	  }
	}


	function escapeJsonPtr(str) {
	  return str.replace(/~/g, '~0').replace(/\//g, '~1');
	}
	return jsonSchemaTraverse.exports;
}

var hasRequiredResolve;

function requireResolve () {
	if (hasRequiredResolve) return resolve;
	hasRequiredResolve = 1;
	Object.defineProperty(resolve, "__esModule", { value: true });
	resolve.getSchemaRefs = resolve.resolveUrl = resolve.normalizeId = resolve._getFullPath = resolve.getFullPath = resolve.inlineRef = void 0;
	const util_1 = requireUtil();
	const equal = requireFastDeepEqual();
	const traverse = requireJsonSchemaTraverse();
	// TODO refactor to use keyword definitions
	const SIMPLE_INLINED = new Set([
	    "type",
	    "format",
	    "pattern",
	    "maxLength",
	    "minLength",
	    "maxProperties",
	    "minProperties",
	    "maxItems",
	    "minItems",
	    "maximum",
	    "minimum",
	    "uniqueItems",
	    "multipleOf",
	    "required",
	    "enum",
	    "const",
	]);
	function inlineRef(schema, limit = true) {
	    if (typeof schema == "boolean")
	        return true;
	    if (limit === true)
	        return !hasRef(schema);
	    if (!limit)
	        return false;
	    return countKeys(schema) <= limit;
	}
	resolve.inlineRef = inlineRef;
	const REF_KEYWORDS = new Set([
	    "$ref",
	    "$recursiveRef",
	    "$recursiveAnchor",
	    "$dynamicRef",
	    "$dynamicAnchor",
	]);
	function hasRef(schema) {
	    for (const key in schema) {
	        if (REF_KEYWORDS.has(key))
	            return true;
	        const sch = schema[key];
	        if (Array.isArray(sch) && sch.some(hasRef))
	            return true;
	        if (typeof sch == "object" && hasRef(sch))
	            return true;
	    }
	    return false;
	}
	function countKeys(schema) {
	    let count = 0;
	    for (const key in schema) {
	        if (key === "$ref")
	            return Infinity;
	        count++;
	        if (SIMPLE_INLINED.has(key))
	            continue;
	        if (typeof schema[key] == "object") {
	            (0, util_1.eachItem)(schema[key], (sch) => (count += countKeys(sch)));
	        }
	        if (count === Infinity)
	            return Infinity;
	    }
	    return count;
	}
	function getFullPath(resolver, id = "", normalize) {
	    if (normalize !== false)
	        id = normalizeId(id);
	    const p = resolver.parse(id);
	    return _getFullPath(resolver, p);
	}
	resolve.getFullPath = getFullPath;
	function _getFullPath(resolver, p) {
	    const serialized = resolver.serialize(p);
	    return serialized.split("#")[0] + "#";
	}
	resolve._getFullPath = _getFullPath;
	const TRAILING_SLASH_HASH = /#\/?$/;
	function normalizeId(id) {
	    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
	}
	resolve.normalizeId = normalizeId;
	function resolveUrl(resolver, baseId, id) {
	    id = normalizeId(id);
	    return resolver.resolve(baseId, id);
	}
	resolve.resolveUrl = resolveUrl;
	const ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
	function getSchemaRefs(schema, baseId) {
	    if (typeof schema == "boolean")
	        return {};
	    const { schemaId, uriResolver } = this.opts;
	    const schId = normalizeId(schema[schemaId] || baseId);
	    const baseIds = { "": schId };
	    const pathPrefix = getFullPath(uriResolver, schId, false);
	    const localRefs = {};
	    const schemaRefs = new Set();
	    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
	        if (parentJsonPtr === undefined)
	            return;
	        const fullPath = pathPrefix + jsonPtr;
	        let innerBaseId = baseIds[parentJsonPtr];
	        if (typeof sch[schemaId] == "string")
	            innerBaseId = addRef.call(this, sch[schemaId]);
	        addAnchor.call(this, sch.$anchor);
	        addAnchor.call(this, sch.$dynamicAnchor);
	        baseIds[jsonPtr] = innerBaseId;
	        function addRef(ref) {
	            // eslint-disable-next-line @typescript-eslint/unbound-method
	            const _resolve = this.opts.uriResolver.resolve;
	            ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
	            if (schemaRefs.has(ref))
	                throw ambiguos(ref);
	            schemaRefs.add(ref);
	            let schOrRef = this.refs[ref];
	            if (typeof schOrRef == "string")
	                schOrRef = this.refs[schOrRef];
	            if (typeof schOrRef == "object") {
	                checkAmbiguosRef(sch, schOrRef.schema, ref);
	            }
	            else if (ref !== normalizeId(fullPath)) {
	                if (ref[0] === "#") {
	                    checkAmbiguosRef(sch, localRefs[ref], ref);
	                    localRefs[ref] = sch;
	                }
	                else {
	                    this.refs[ref] = fullPath;
	                }
	            }
	            return ref;
	        }
	        function addAnchor(anchor) {
	            if (typeof anchor == "string") {
	                if (!ANCHOR.test(anchor))
	                    throw new Error(`invalid anchor "${anchor}"`);
	                addRef.call(this, `#${anchor}`);
	            }
	        }
	    });
	    return localRefs;
	    function checkAmbiguosRef(sch1, sch2, ref) {
	        if (sch2 !== undefined && !equal(sch1, sch2))
	            throw ambiguos(ref);
	    }
	    function ambiguos(ref) {
	        return new Error(`reference "${ref}" resolves to more than one schema`);
	    }
	}
	resolve.getSchemaRefs = getSchemaRefs;
	
	return resolve;
}

var hasRequiredValidate;

function requireValidate () {
	if (hasRequiredValidate) return validate;
	hasRequiredValidate = 1;
	Object.defineProperty(validate, "__esModule", { value: true });
	validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
	const boolSchema_1 = requireBoolSchema();
	const dataType_1 = requireDataType();
	const applicability_1 = requireApplicability();
	const dataType_2 = requireDataType();
	const defaults_1 = requireDefaults();
	const keyword_1 = requireKeyword();
	const subschema_1 = requireSubschema();
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const resolve_1 = requireResolve();
	const util_1 = requireUtil();
	const errors_1 = requireErrors$1();
	// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
	function validateFunctionCode(it) {
	    if (isSchemaObj(it)) {
	        checkKeywords(it);
	        if (schemaCxtHasRules(it)) {
	            topSchemaObjCode(it);
	            return;
	        }
	    }
	    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
	}
	validate.validateFunctionCode = validateFunctionCode;
	function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
	    if (opts.code.es5) {
	        gen.func(validateName, (0, codegen_1._) `${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
	            gen.code((0, codegen_1._) `"use strict"; ${funcSourceUrl(schema, opts)}`);
	            destructureValCxtES5(gen, opts);
	            gen.code(body);
	        });
	    }
	    else {
	        gen.func(validateName, (0, codegen_1._) `${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
	    }
	}
	function destructureValCxt(opts) {
	    return (0, codegen_1._) `{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._) `, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
	}
	function destructureValCxtES5(gen, opts) {
	    gen.if(names_1.default.valCxt, () => {
	        gen.var(names_1.default.instancePath, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.instancePath}`);
	        gen.var(names_1.default.parentData, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.parentData}`);
	        gen.var(names_1.default.parentDataProperty, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
	        gen.var(names_1.default.rootData, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.rootData}`);
	        if (opts.dynamicRef)
	            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
	    }, () => {
	        gen.var(names_1.default.instancePath, (0, codegen_1._) `""`);
	        gen.var(names_1.default.parentData, (0, codegen_1._) `undefined`);
	        gen.var(names_1.default.parentDataProperty, (0, codegen_1._) `undefined`);
	        gen.var(names_1.default.rootData, names_1.default.data);
	        if (opts.dynamicRef)
	            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._) `{}`);
	    });
	}
	function topSchemaObjCode(it) {
	    const { schema, opts, gen } = it;
	    validateFunction(it, () => {
	        if (opts.$comment && schema.$comment)
	            commentKeyword(it);
	        checkNoDefault(it);
	        gen.let(names_1.default.vErrors, null);
	        gen.let(names_1.default.errors, 0);
	        if (opts.unevaluated)
	            resetEvaluated(it);
	        typeAndKeywords(it);
	        returnResults(it);
	    });
	    return;
	}
	function resetEvaluated(it) {
	    // TODO maybe some hook to execute it in the end to check whether props/items are Name, as in assignEvaluated
	    const { gen, validateName } = it;
	    it.evaluated = gen.const("evaluated", (0, codegen_1._) `${validateName}.evaluated`);
	    gen.if((0, codegen_1._) `${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._) `${it.evaluated}.props`, (0, codegen_1._) `undefined`));
	    gen.if((0, codegen_1._) `${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._) `${it.evaluated}.items`, (0, codegen_1._) `undefined`));
	}
	function funcSourceUrl(schema, opts) {
	    const schId = typeof schema == "object" && schema[opts.schemaId];
	    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._) `/*# sourceURL=${schId} */` : codegen_1.nil;
	}
	// schema compilation - this function is used recursively to generate code for sub-schemas
	function subschemaCode(it, valid) {
	    if (isSchemaObj(it)) {
	        checkKeywords(it);
	        if (schemaCxtHasRules(it)) {
	            subSchemaObjCode(it, valid);
	            return;
	        }
	    }
	    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
	}
	function schemaCxtHasRules({ schema, self }) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (self.RULES.all[key])
	            return true;
	    return false;
	}
	function isSchemaObj(it) {
	    return typeof it.schema != "boolean";
	}
	function subSchemaObjCode(it, valid) {
	    const { schema, gen, opts } = it;
	    if (opts.$comment && schema.$comment)
	        commentKeyword(it);
	    updateContext(it);
	    checkAsyncSchema(it);
	    const errsCount = gen.const("_errs", names_1.default.errors);
	    typeAndKeywords(it, errsCount);
	    // TODO var
	    gen.var(valid, (0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
	}
	function checkKeywords(it) {
	    (0, util_1.checkUnknownRules)(it);
	    checkRefsAndKeywords(it);
	}
	function typeAndKeywords(it, errsCount) {
	    if (it.opts.jtd)
	        return schemaKeywords(it, [], false, errsCount);
	    const types = (0, dataType_1.getSchemaTypes)(it.schema);
	    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
	    schemaKeywords(it, types, !checkedTypes, errsCount);
	}
	function checkRefsAndKeywords(it) {
	    const { schema, errSchemaPath, opts, self } = it;
	    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
	        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
	    }
	}
	function checkNoDefault(it) {
	    const { schema, opts } = it;
	    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
	        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
	    }
	}
	function updateContext(it) {
	    const schId = it.schema[it.opts.schemaId];
	    if (schId)
	        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
	}
	function checkAsyncSchema(it) {
	    if (it.schema.$async && !it.schemaEnv.$async)
	        throw new Error("async schema in sync schema");
	}
	function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
	    const msg = schema.$comment;
	    if (opts.$comment === true) {
	        gen.code((0, codegen_1._) `${names_1.default.self}.logger.log(${msg})`);
	    }
	    else if (typeof opts.$comment == "function") {
	        const schemaPath = (0, codegen_1.str) `${errSchemaPath}/$comment`;
	        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
	        gen.code((0, codegen_1._) `${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
	    }
	}
	function returnResults(it) {
	    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
	    if (schemaEnv.$async) {
	        // TODO assign unevaluated
	        gen.if((0, codegen_1._) `${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._) `new ${ValidationError}(${names_1.default.vErrors})`));
	    }
	    else {
	        gen.assign((0, codegen_1._) `${validateName}.errors`, names_1.default.vErrors);
	        if (opts.unevaluated)
	            assignEvaluated(it);
	        gen.return((0, codegen_1._) `${names_1.default.errors} === 0`);
	    }
	}
	function assignEvaluated({ gen, evaluated, props, items }) {
	    if (props instanceof codegen_1.Name)
	        gen.assign((0, codegen_1._) `${evaluated}.props`, props);
	    if (items instanceof codegen_1.Name)
	        gen.assign((0, codegen_1._) `${evaluated}.items`, items);
	}
	function schemaKeywords(it, types, typeErrors, errsCount) {
	    const { gen, schema, data, allErrors, opts, self } = it;
	    const { RULES } = self;
	    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
	        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition)); // TODO typecast
	        return;
	    }
	    if (!opts.jtd)
	        checkStrictTypes(it, types);
	    gen.block(() => {
	        for (const group of RULES.rules)
	            groupKeywords(group);
	        groupKeywords(RULES.post);
	    });
	    function groupKeywords(group) {
	        if (!(0, applicability_1.shouldUseGroup)(schema, group))
	            return;
	        if (group.type) {
	            gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
	            iterateKeywords(it, group);
	            if (types.length === 1 && types[0] === group.type && typeErrors) {
	                gen.else();
	                (0, dataType_2.reportTypeError)(it);
	            }
	            gen.endIf();
	        }
	        else {
	            iterateKeywords(it, group);
	        }
	        // TODO make it "ok" call?
	        if (!allErrors)
	            gen.if((0, codegen_1._) `${names_1.default.errors} === ${errsCount || 0}`);
	    }
	}
	function iterateKeywords(it, group) {
	    const { gen, schema, opts: { useDefaults }, } = it;
	    if (useDefaults)
	        (0, defaults_1.assignDefaults)(it, group.type);
	    gen.block(() => {
	        for (const rule of group.rules) {
	            if ((0, applicability_1.shouldUseRule)(schema, rule)) {
	                keywordCode(it, rule.keyword, rule.definition, group.type);
	            }
	        }
	    });
	}
	function checkStrictTypes(it, types) {
	    if (it.schemaEnv.meta || !it.opts.strictTypes)
	        return;
	    checkContextTypes(it, types);
	    if (!it.opts.allowUnionTypes)
	        checkMultipleTypes(it, types);
	    checkKeywordTypes(it, it.dataTypes);
	}
	function checkContextTypes(it, types) {
	    if (!types.length)
	        return;
	    if (!it.dataTypes.length) {
	        it.dataTypes = types;
	        return;
	    }
	    types.forEach((t) => {
	        if (!includesType(it.dataTypes, t)) {
	            strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
	        }
	    });
	    narrowSchemaTypes(it, types);
	}
	function checkMultipleTypes(it, ts) {
	    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
	        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
	    }
	}
	function checkKeywordTypes(it, ts) {
	    const rules = it.self.RULES.all;
	    for (const keyword in rules) {
	        const rule = rules[keyword];
	        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
	            const { type } = rule.definition;
	            if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
	                strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
	            }
	        }
	    }
	}
	function hasApplicableType(schTs, kwdT) {
	    return schTs.includes(kwdT) || (kwdT === "number" && schTs.includes("integer"));
	}
	function includesType(ts, t) {
	    return ts.includes(t) || (t === "integer" && ts.includes("number"));
	}
	function narrowSchemaTypes(it, withTypes) {
	    const ts = [];
	    for (const t of it.dataTypes) {
	        if (includesType(withTypes, t))
	            ts.push(t);
	        else if (withTypes.includes("integer") && t === "number")
	            ts.push("integer");
	    }
	    it.dataTypes = ts;
	}
	function strictTypesError(it, msg) {
	    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
	    msg += ` at "${schemaPath}" (strictTypes)`;
	    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
	}
	class KeywordCxt {
	    constructor(it, def, keyword) {
	        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
	        this.gen = it.gen;
	        this.allErrors = it.allErrors;
	        this.keyword = keyword;
	        this.data = it.data;
	        this.schema = it.schema[keyword];
	        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
	        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
	        this.schemaType = def.schemaType;
	        this.parentSchema = it.schema;
	        this.params = {};
	        this.it = it;
	        this.def = def;
	        if (this.$data) {
	            this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
	        }
	        else {
	            this.schemaCode = this.schemaValue;
	            if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
	                throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
	            }
	        }
	        if ("code" in def ? def.trackErrors : def.errors !== false) {
	            this.errsCount = it.gen.const("_errs", names_1.default.errors);
	        }
	    }
	    result(condition, successAction, failAction) {
	        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
	    }
	    failResult(condition, successAction, failAction) {
	        this.gen.if(condition);
	        if (failAction)
	            failAction();
	        else
	            this.error();
	        if (successAction) {
	            this.gen.else();
	            successAction();
	            if (this.allErrors)
	                this.gen.endIf();
	        }
	        else {
	            if (this.allErrors)
	                this.gen.endIf();
	            else
	                this.gen.else();
	        }
	    }
	    pass(condition, failAction) {
	        this.failResult((0, codegen_1.not)(condition), undefined, failAction);
	    }
	    fail(condition) {
	        if (condition === undefined) {
	            this.error();
	            if (!this.allErrors)
	                this.gen.if(false); // this branch will be removed by gen.optimize
	            return;
	        }
	        this.gen.if(condition);
	        this.error();
	        if (this.allErrors)
	            this.gen.endIf();
	        else
	            this.gen.else();
	    }
	    fail$data(condition) {
	        if (!this.$data)
	            return this.fail(condition);
	        const { schemaCode } = this;
	        this.fail((0, codegen_1._) `${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
	    }
	    error(append, errorParams, errorPaths) {
	        if (errorParams) {
	            this.setParams(errorParams);
	            this._error(append, errorPaths);
	            this.setParams({});
	            return;
	        }
	        this._error(append, errorPaths);
	    }
	    _error(append, errorPaths) {
	        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
	    }
	    $dataError() {
	        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
	    }
	    reset() {
	        if (this.errsCount === undefined)
	            throw new Error('add "trackErrors" to keyword definition');
	        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
	    }
	    ok(cond) {
	        if (!this.allErrors)
	            this.gen.if(cond);
	    }
	    setParams(obj, assign) {
	        if (assign)
	            Object.assign(this.params, obj);
	        else
	            this.params = obj;
	    }
	    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
	        this.gen.block(() => {
	            this.check$data(valid, $dataValid);
	            codeBlock();
	        });
	    }
	    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
	        if (!this.$data)
	            return;
	        const { gen, schemaCode, schemaType, def } = this;
	        gen.if((0, codegen_1.or)((0, codegen_1._) `${schemaCode} === undefined`, $dataValid));
	        if (valid !== codegen_1.nil)
	            gen.assign(valid, true);
	        if (schemaType.length || def.validateSchema) {
	            gen.elseIf(this.invalid$data());
	            this.$dataError();
	            if (valid !== codegen_1.nil)
	                gen.assign(valid, false);
	        }
	        gen.else();
	    }
	    invalid$data() {
	        const { gen, schemaCode, schemaType, def, it } = this;
	        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
	        function wrong$DataType() {
	            if (schemaType.length) {
	                /* istanbul ignore if */
	                if (!(schemaCode instanceof codegen_1.Name))
	                    throw new Error("ajv implementation error");
	                const st = Array.isArray(schemaType) ? schemaType : [schemaType];
	                return (0, codegen_1._) `${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
	            }
	            return codegen_1.nil;
	        }
	        function invalid$DataSchema() {
	            if (def.validateSchema) {
	                const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema }); // TODO value.code for standalone
	                return (0, codegen_1._) `!${validateSchemaRef}(${schemaCode})`;
	            }
	            return codegen_1.nil;
	        }
	    }
	    subschema(appl, valid) {
	        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
	        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
	        (0, subschema_1.extendSubschemaMode)(subschema, appl);
	        const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
	        subschemaCode(nextContext, valid);
	        return nextContext;
	    }
	    mergeEvaluated(schemaCxt, toName) {
	        const { it, gen } = this;
	        if (!it.opts.unevaluated)
	            return;
	        if (it.props !== true && schemaCxt.props !== undefined) {
	            it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
	        }
	        if (it.items !== true && schemaCxt.items !== undefined) {
	            it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
	        }
	    }
	    mergeValidEvaluated(schemaCxt, valid) {
	        const { it, gen } = this;
	        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
	            gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
	            return true;
	        }
	    }
	}
	validate.KeywordCxt = KeywordCxt;
	function keywordCode(it, keyword, def, ruleType) {
	    const cxt = new KeywordCxt(it, def, keyword);
	    if ("code" in def) {
	        def.code(cxt, ruleType);
	    }
	    else if (cxt.$data && def.validate) {
	        (0, keyword_1.funcKeywordCode)(cxt, def);
	    }
	    else if ("macro" in def) {
	        (0, keyword_1.macroKeywordCode)(cxt, def);
	    }
	    else if (def.compile || def.validate) {
	        (0, keyword_1.funcKeywordCode)(cxt, def);
	    }
	}
	const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
	const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
	function getData($data, { dataLevel, dataNames, dataPathArr }) {
	    let jsonPointer;
	    let data;
	    if ($data === "")
	        return names_1.default.rootData;
	    if ($data[0] === "/") {
	        if (!JSON_POINTER.test($data))
	            throw new Error(`Invalid JSON-pointer: ${$data}`);
	        jsonPointer = $data;
	        data = names_1.default.rootData;
	    }
	    else {
	        const matches = RELATIVE_JSON_POINTER.exec($data);
	        if (!matches)
	            throw new Error(`Invalid JSON-pointer: ${$data}`);
	        const up = +matches[1];
	        jsonPointer = matches[2];
	        if (jsonPointer === "#") {
	            if (up >= dataLevel)
	                throw new Error(errorMsg("property/index", up));
	            return dataPathArr[dataLevel - up];
	        }
	        if (up > dataLevel)
	            throw new Error(errorMsg("data", up));
	        data = dataNames[dataLevel - up];
	        if (!jsonPointer)
	            return data;
	    }
	    let expr = data;
	    const segments = jsonPointer.split("/");
	    for (const segment of segments) {
	        if (segment) {
	            data = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
	            expr = (0, codegen_1._) `${expr} && ${data}`;
	        }
	    }
	    return expr;
	    function errorMsg(pointerType, up) {
	        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
	    }
	}
	validate.getData = getData;
	
	return validate;
}

var validation_error = {};

var hasRequiredValidation_error;

function requireValidation_error () {
	if (hasRequiredValidation_error) return validation_error;
	hasRequiredValidation_error = 1;
	Object.defineProperty(validation_error, "__esModule", { value: true });
	class ValidationError extends Error {
	    constructor(errors) {
	        super("validation failed");
	        this.errors = errors;
	        this.ajv = this.validation = true;
	    }
	}
	validation_error.default = ValidationError;
	
	return validation_error;
}

var ref_error = {};

var hasRequiredRef_error;

function requireRef_error () {
	if (hasRequiredRef_error) return ref_error;
	hasRequiredRef_error = 1;
	Object.defineProperty(ref_error, "__esModule", { value: true });
	const resolve_1 = requireResolve();
	class MissingRefError extends Error {
	    constructor(resolver, baseId, ref, msg) {
	        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
	        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
	        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
	    }
	}
	ref_error.default = MissingRefError;
	
	return ref_error;
}

var compile = {};

var hasRequiredCompile;

function requireCompile () {
	if (hasRequiredCompile) return compile;
	hasRequiredCompile = 1;
	Object.defineProperty(compile, "__esModule", { value: true });
	compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
	const codegen_1 = requireCodegen();
	const validation_error_1 = requireValidation_error();
	const names_1 = requireNames();
	const resolve_1 = requireResolve();
	const util_1 = requireUtil();
	const validate_1 = requireValidate();
	class SchemaEnv {
	    constructor(env) {
	        var _a;
	        this.refs = {};
	        this.dynamicAnchors = {};
	        let schema;
	        if (typeof env.schema == "object")
	            schema = env.schema;
	        this.schema = env.schema;
	        this.schemaId = env.schemaId;
	        this.root = env.root || this;
	        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
	        this.schemaPath = env.schemaPath;
	        this.localRefs = env.localRefs;
	        this.meta = env.meta;
	        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
	        this.refs = {};
	    }
	}
	compile.SchemaEnv = SchemaEnv;
	// let codeSize = 0
	// let nodeCount = 0
	// Compiles schema in SchemaEnv
	function compileSchema(sch) {
	    // TODO refactor - remove compilations
	    const _sch = getCompilingSchema.call(this, sch);
	    if (_sch)
	        return _sch;
	    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId); // TODO if getFullPath removed 1 tests fails
	    const { es5, lines } = this.opts.code;
	    const { ownProperties } = this.opts;
	    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
	    let _ValidationError;
	    if (sch.$async) {
	        _ValidationError = gen.scopeValue("Error", {
	            ref: validation_error_1.default,
	            code: (0, codegen_1._) `require("ajv/dist/runtime/validation_error").default`,
	        });
	    }
	    const validateName = gen.scopeName("validate");
	    sch.validateName = validateName;
	    const schemaCxt = {
	        gen,
	        allErrors: this.opts.allErrors,
	        data: names_1.default.data,
	        parentData: names_1.default.parentData,
	        parentDataProperty: names_1.default.parentDataProperty,
	        dataNames: [names_1.default.data],
	        dataPathArr: [codegen_1.nil], // TODO can its length be used as dataLevel if nil is removed?
	        dataLevel: 0,
	        dataTypes: [],
	        definedProperties: new Set(),
	        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true
	            ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) }
	            : { ref: sch.schema }),
	        validateName,
	        ValidationError: _ValidationError,
	        schema: sch.schema,
	        schemaEnv: sch,
	        rootId,
	        baseId: sch.baseId || rootId,
	        schemaPath: codegen_1.nil,
	        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
	        errorPath: (0, codegen_1._) `""`,
	        opts: this.opts,
	        self: this,
	    };
	    let sourceCode;
	    try {
	        this._compilations.add(sch);
	        (0, validate_1.validateFunctionCode)(schemaCxt);
	        gen.optimize(this.opts.code.optimize);
	        // gen.optimize(1)
	        const validateCode = gen.toString();
	        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
	        // console.log((codeSize += sourceCode.length), (nodeCount += gen.nodeCount))
	        if (this.opts.code.process)
	            sourceCode = this.opts.code.process(sourceCode, sch);
	        // console.log("\n\n\n *** \n", sourceCode)
	        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
	        const validate = makeValidate(this, this.scope.get());
	        this.scope.value(validateName, { ref: validate });
	        validate.errors = null;
	        validate.schema = sch.schema;
	        validate.schemaEnv = sch;
	        if (sch.$async)
	            validate.$async = true;
	        if (this.opts.code.source === true) {
	            validate.source = { validateName, validateCode, scopeValues: gen._values };
	        }
	        if (this.opts.unevaluated) {
	            const { props, items } = schemaCxt;
	            validate.evaluated = {
	                props: props instanceof codegen_1.Name ? undefined : props,
	                items: items instanceof codegen_1.Name ? undefined : items,
	                dynamicProps: props instanceof codegen_1.Name,
	                dynamicItems: items instanceof codegen_1.Name,
	            };
	            if (validate.source)
	                validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
	        }
	        sch.validate = validate;
	        return sch;
	    }
	    catch (e) {
	        delete sch.validate;
	        delete sch.validateName;
	        if (sourceCode)
	            this.logger.error("Error compiling schema, function code:", sourceCode);
	        // console.log("\n\n\n *** \n", sourceCode, this.opts)
	        throw e;
	    }
	    finally {
	        this._compilations.delete(sch);
	    }
	}
	compile.compileSchema = compileSchema;
	function resolveRef(root, baseId, ref) {
	    var _a;
	    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
	    const schOrFunc = root.refs[ref];
	    if (schOrFunc)
	        return schOrFunc;
	    let _sch = resolve.call(this, root, ref);
	    if (_sch === undefined) {
	        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref]; // TODO maybe localRefs should hold SchemaEnv
	        const { schemaId } = this.opts;
	        if (schema)
	            _sch = new SchemaEnv({ schema, schemaId, root, baseId });
	    }
	    if (_sch === undefined)
	        return;
	    return (root.refs[ref] = inlineOrCompile.call(this, _sch));
	}
	compile.resolveRef = resolveRef;
	function inlineOrCompile(sch) {
	    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
	        return sch.schema;
	    return sch.validate ? sch : compileSchema.call(this, sch);
	}
	// Index of schema compilation in the currently compiled list
	function getCompilingSchema(schEnv) {
	    for (const sch of this._compilations) {
	        if (sameSchemaEnv(sch, schEnv))
	            return sch;
	    }
	}
	compile.getCompilingSchema = getCompilingSchema;
	function sameSchemaEnv(s1, s2) {
	    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
	}
	// resolve and compile the references ($ref)
	// TODO returns AnySchemaObject (if the schema can be inlined) or validation function
	function resolve(root, // information about the root schema for the current schema
	ref // reference to resolve
	) {
	    let sch;
	    while (typeof (sch = this.refs[ref]) == "string")
	        ref = sch;
	    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
	}
	// Resolve schema, its root and baseId
	function resolveSchema(root, // root object with properties schema, refs TODO below SchemaEnv is assigned to it
	ref // reference to resolve
	) {
	    const p = this.opts.uriResolver.parse(ref);
	    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
	    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
	    // TODO `Object.keys(root.schema).length > 0` should not be needed - but removing breaks 2 tests
	    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
	        return getJsonPointer.call(this, p, root);
	    }
	    const id = (0, resolve_1.normalizeId)(refPath);
	    const schOrRef = this.refs[id] || this.schemas[id];
	    if (typeof schOrRef == "string") {
	        const sch = resolveSchema.call(this, root, schOrRef);
	        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
	            return;
	        return getJsonPointer.call(this, p, sch);
	    }
	    if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
	        return;
	    if (!schOrRef.validate)
	        compileSchema.call(this, schOrRef);
	    if (id === (0, resolve_1.normalizeId)(ref)) {
	        const { schema } = schOrRef;
	        const { schemaId } = this.opts;
	        const schId = schema[schemaId];
	        if (schId)
	            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
	        return new SchemaEnv({ schema, schemaId, root, baseId });
	    }
	    return getJsonPointer.call(this, p, schOrRef);
	}
	compile.resolveSchema = resolveSchema;
	const PREVENT_SCOPE_CHANGE = new Set([
	    "properties",
	    "patternProperties",
	    "enum",
	    "dependencies",
	    "definitions",
	]);
	function getJsonPointer(parsedRef, { baseId, schema, root }) {
	    var _a;
	    if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
	        return;
	    for (const part of parsedRef.fragment.slice(1).split("/")) {
	        if (typeof schema === "boolean")
	            return;
	        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
	        if (partSchema === undefined)
	            return;
	        schema = partSchema;
	        // TODO PREVENT_SCOPE_CHANGE could be defined in keyword def?
	        const schId = typeof schema === "object" && schema[this.opts.schemaId];
	        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
	            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
	        }
	    }
	    let env;
	    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
	        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
	        env = resolveSchema.call(this, root, $ref);
	    }
	    // even though resolution failed we need to return SchemaEnv to throw exception
	    // so that compileAsync loads missing schema.
	    const { schemaId } = this.opts;
	    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
	    if (env.schema !== env.root.schema)
	        return env;
	    return undefined;
	}
	
	return compile;
}

var $id$9 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
var description$2 = "Meta-schema for $data reference (JSON AnySchema extension proposal)";
var type$e = "object";
var required$5 = [
	"$data"
];
var properties$e = {
	$data: {
		type: "string",
		anyOf: [
			{
				format: "relative-json-pointer"
			},
			{
				format: "json-pointer"
			}
		]
	}
};
var additionalProperties$4 = false;
var require$$9 = {
	$id: $id$9,
	description: description$2,
	type: type$e,
	required: required$5,
	properties: properties$e,
	additionalProperties: additionalProperties$4
};

var uri = {};

var fastUri = {exports: {}};

var utils;
var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;

	/** @type {(value: string) => boolean} */
	const isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);

	/** @type {(value: string) => boolean} */
	const isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);

	/**
	 * @param {Array<string>} input
	 * @returns {string}
	 */
	function stringArrayToHexStripped (input) {
	  let acc = '';
	  let code = 0;
	  let i = 0;

	  for (i = 0; i < input.length; i++) {
	    code = input[i].charCodeAt(0);
	    if (code === 48) {
	      continue
	    }
	    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
	      return ''
	    }
	    acc += input[i];
	    break
	  }

	  for (i += 1; i < input.length; i++) {
	    code = input[i].charCodeAt(0);
	    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
	      return ''
	    }
	    acc += input[i];
	  }
	  return acc
	}

	/**
	 * @typedef {Object} GetIPV6Result
	 * @property {boolean} error - Indicates if there was an error parsing the IPv6 address.
	 * @property {string} address - The parsed IPv6 address.
	 * @property {string} [zone] - The zone identifier, if present.
	 */

	/**
	 * @param {string} value
	 * @returns {boolean}
	 */
	const nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);

	/**
	 * @param {Array<string>} buffer
	 * @returns {boolean}
	 */
	function consumeIsZone (buffer) {
	  buffer.length = 0;
	  return true
	}

	/**
	 * @param {Array<string>} buffer
	 * @param {Array<string>} address
	 * @param {GetIPV6Result} output
	 * @returns {boolean}
	 */
	function consumeHextets (buffer, address, output) {
	  if (buffer.length) {
	    const hex = stringArrayToHexStripped(buffer);
	    if (hex !== '') {
	      address.push(hex);
	    } else {
	      output.error = true;
	      return false
	    }
	    buffer.length = 0;
	  }
	  return true
	}

	/**
	 * @param {string} input
	 * @returns {GetIPV6Result}
	 */
	function getIPV6 (input) {
	  let tokenCount = 0;
	  const output = { error: false, address: '', zone: '' };
	  /** @type {Array<string>} */
	  const address = [];
	  /** @type {Array<string>} */
	  const buffer = [];
	  let endipv6Encountered = false;
	  let endIpv6 = false;

	  let consume = consumeHextets;

	  for (let i = 0; i < input.length; i++) {
	    const cursor = input[i];
	    if (cursor === '[' || cursor === ']') { continue }
	    if (cursor === ':') {
	      if (endipv6Encountered === true) {
	        endIpv6 = true;
	      }
	      if (!consume(buffer, address, output)) { break }
	      if (++tokenCount > 7) {
	        // not valid
	        output.error = true;
	        break
	      }
	      if (i > 0 && input[i - 1] === ':') {
	        endipv6Encountered = true;
	      }
	      address.push(':');
	      continue
	    } else if (cursor === '%') {
	      if (!consume(buffer, address, output)) { break }
	      // switch to zone detection
	      consume = consumeIsZone;
	    } else {
	      buffer.push(cursor);
	      continue
	    }
	  }
	  if (buffer.length) {
	    if (consume === consumeIsZone) {
	      output.zone = buffer.join('');
	    } else if (endIpv6) {
	      address.push(buffer.join(''));
	    } else {
	      address.push(stringArrayToHexStripped(buffer));
	    }
	  }
	  output.address = address.join('');
	  return output
	}

	/**
	 * @typedef {Object} NormalizeIPv6Result
	 * @property {string} host - The normalized host.
	 * @property {string} [escapedHost] - The escaped host.
	 * @property {boolean} isIPV6 - Indicates if the host is an IPv6 address.
	 */

	/**
	 * @param {string} host
	 * @returns {NormalizeIPv6Result}
	 */
	function normalizeIPv6 (host) {
	  if (findToken(host, ':') < 2) { return { host, isIPV6: false } }
	  const ipv6 = getIPV6(host);

	  if (!ipv6.error) {
	    let newHost = ipv6.address;
	    let escapedHost = ipv6.address;
	    if (ipv6.zone) {
	      newHost += '%' + ipv6.zone;
	      escapedHost += '%25' + ipv6.zone;
	    }
	    return { host: newHost, isIPV6: true, escapedHost }
	  } else {
	    return { host, isIPV6: false }
	  }
	}

	/**
	 * @param {string} str
	 * @param {string} token
	 * @returns {number}
	 */
	function findToken (str, token) {
	  let ind = 0;
	  for (let i = 0; i < str.length; i++) {
	    if (str[i] === token) ind++;
	  }
	  return ind
	}

	/**
	 * @param {string} path
	 * @returns {string}
	 *
	 * @see https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
	 */
	function removeDotSegments (path) {
	  let input = path;
	  const output = [];
	  let nextSlash = -1;
	  let len = 0;

	  // eslint-disable-next-line no-cond-assign
	  while (len = input.length) {
	    if (len === 1) {
	      if (input === '.') {
	        break
	      } else if (input === '/') {
	        output.push('/');
	        break
	      } else {
	        output.push(input);
	        break
	      }
	    } else if (len === 2) {
	      if (input[0] === '.') {
	        if (input[1] === '.') {
	          break
	        } else if (input[1] === '/') {
	          input = input.slice(2);
	          continue
	        }
	      } else if (input[0] === '/') {
	        if (input[1] === '.' || input[1] === '/') {
	          output.push('/');
	          break
	        }
	      }
	    } else if (len === 3) {
	      if (input === '/..') {
	        if (output.length !== 0) {
	          output.pop();
	        }
	        output.push('/');
	        break
	      }
	    }
	    if (input[0] === '.') {
	      if (input[1] === '.') {
	        if (input[2] === '/') {
	          input = input.slice(3);
	          continue
	        }
	      } else if (input[1] === '/') {
	        input = input.slice(2);
	        continue
	      }
	    } else if (input[0] === '/') {
	      if (input[1] === '.') {
	        if (input[2] === '/') {
	          input = input.slice(2);
	          continue
	        } else if (input[2] === '.') {
	          if (input[3] === '/') {
	            input = input.slice(3);
	            if (output.length !== 0) {
	              output.pop();
	            }
	            continue
	          }
	        }
	      }
	    }

	    // Rule 2E: Move normal path segment to output
	    if ((nextSlash = input.indexOf('/', 1)) === -1) {
	      output.push(input);
	      break
	    } else {
	      output.push(input.slice(0, nextSlash));
	      input = input.slice(nextSlash);
	    }
	  }

	  return output.join('')
	}

	/**
	 * @param {import('../types/index').URIComponent} component
	 * @param {boolean} esc
	 * @returns {import('../types/index').URIComponent}
	 */
	function normalizeComponentEncoding (component, esc) {
	  const func = esc !== true ? escape : unescape;
	  if (component.scheme !== undefined) {
	    component.scheme = func(component.scheme);
	  }
	  if (component.userinfo !== undefined) {
	    component.userinfo = func(component.userinfo);
	  }
	  if (component.host !== undefined) {
	    component.host = func(component.host);
	  }
	  if (component.path !== undefined) {
	    component.path = func(component.path);
	  }
	  if (component.query !== undefined) {
	    component.query = func(component.query);
	  }
	  if (component.fragment !== undefined) {
	    component.fragment = func(component.fragment);
	  }
	  return component
	}

	/**
	 * @param {import('../types/index').URIComponent} component
	 * @returns {string|undefined}
	 */
	function recomposeAuthority (component) {
	  const uriTokens = [];

	  if (component.userinfo !== undefined) {
	    uriTokens.push(component.userinfo);
	    uriTokens.push('@');
	  }

	  if (component.host !== undefined) {
	    let host = unescape(component.host);
	    if (!isIPv4(host)) {
	      const ipV6res = normalizeIPv6(host);
	      if (ipV6res.isIPV6 === true) {
	        host = `[${ipV6res.escapedHost}]`;
	      } else {
	        host = component.host;
	      }
	    }
	    uriTokens.push(host);
	  }

	  if (typeof component.port === 'number' || typeof component.port === 'string') {
	    uriTokens.push(':');
	    uriTokens.push(String(component.port));
	  }

	  return uriTokens.length ? uriTokens.join('') : undefined
	}
	utils = {
	  nonSimpleDomain,
	  recomposeAuthority,
	  normalizeComponentEncoding,
	  removeDotSegments,
	  isIPv4,
	  isUUID,
	  normalizeIPv6,
	  stringArrayToHexStripped
	};
	return utils;
}

var schemes;
var hasRequiredSchemes;

function requireSchemes () {
	if (hasRequiredSchemes) return schemes;
	hasRequiredSchemes = 1;

	const { isUUID } = requireUtils();
	const URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;

	const supportedSchemeNames = /** @type {const} */ (['http', 'https', 'ws',
	  'wss', 'urn', 'urn:uuid']);

	/** @typedef {supportedSchemeNames[number]} SchemeName */

	/**
	 * @param {string} name
	 * @returns {name is SchemeName}
	 */
	function isValidSchemeName (name) {
	  return supportedSchemeNames.indexOf(/** @type {*} */ (name)) !== -1
	}

	/**
	 * @callback SchemeFn
	 * @param {import('../types/index').URIComponent} component
	 * @param {import('../types/index').Options} options
	 * @returns {import('../types/index').URIComponent}
	 */

	/**
	 * @typedef {Object} SchemeHandler
	 * @property {SchemeName} scheme - The scheme name.
	 * @property {boolean} [domainHost] - Indicates if the scheme supports domain hosts.
	 * @property {SchemeFn} parse - Function to parse the URI component for this scheme.
	 * @property {SchemeFn} serialize - Function to serialize the URI component for this scheme.
	 * @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
	 * @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
	 * @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
	 */

	/**
	 * @param {import('../types/index').URIComponent} wsComponent
	 * @returns {boolean}
	 */
	function wsIsSecure (wsComponent) {
	  if (wsComponent.secure === true) {
	    return true
	  } else if (wsComponent.secure === false) {
	    return false
	  } else if (wsComponent.scheme) {
	    return (
	      wsComponent.scheme.length === 3 &&
	      (wsComponent.scheme[0] === 'w' || wsComponent.scheme[0] === 'W') &&
	      (wsComponent.scheme[1] === 's' || wsComponent.scheme[1] === 'S') &&
	      (wsComponent.scheme[2] === 's' || wsComponent.scheme[2] === 'S')
	    )
	  } else {
	    return false
	  }
	}

	/** @type {SchemeFn} */
	function httpParse (component) {
	  if (!component.host) {
	    component.error = component.error || 'HTTP URIs must have a host.';
	  }

	  return component
	}

	/** @type {SchemeFn} */
	function httpSerialize (component) {
	  const secure = String(component.scheme).toLowerCase() === 'https';

	  // normalize the default port
	  if (component.port === (secure ? 443 : 80) || component.port === '') {
	    component.port = undefined;
	  }

	  // normalize the empty path
	  if (!component.path) {
	    component.path = '/';
	  }

	  // NOTE: We do not parse query strings for HTTP URIs
	  // as WWW Form Url Encoded query strings are part of the HTML4+ spec,
	  // and not the HTTP spec.

	  return component
	}

	/** @type {SchemeFn} */
	function wsParse (wsComponent) {
	// indicate if the secure flag is set
	  wsComponent.secure = wsIsSecure(wsComponent);

	  // construct resouce name
	  wsComponent.resourceName = (wsComponent.path || '/') + (wsComponent.query ? '?' + wsComponent.query : '');
	  wsComponent.path = undefined;
	  wsComponent.query = undefined;

	  return wsComponent
	}

	/** @type {SchemeFn} */
	function wsSerialize (wsComponent) {
	// normalize the default port
	  if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === '') {
	    wsComponent.port = undefined;
	  }

	  // ensure scheme matches secure flag
	  if (typeof wsComponent.secure === 'boolean') {
	    wsComponent.scheme = (wsComponent.secure ? 'wss' : 'ws');
	    wsComponent.secure = undefined;
	  }

	  // reconstruct path from resource name
	  if (wsComponent.resourceName) {
	    const [path, query] = wsComponent.resourceName.split('?');
	    wsComponent.path = (path && path !== '/' ? path : undefined);
	    wsComponent.query = query;
	    wsComponent.resourceName = undefined;
	  }

	  // forbid fragment component
	  wsComponent.fragment = undefined;

	  return wsComponent
	}

	/** @type {SchemeFn} */
	function urnParse (urnComponent, options) {
	  if (!urnComponent.path) {
	    urnComponent.error = 'URN can not be parsed';
	    return urnComponent
	  }
	  const matches = urnComponent.path.match(URN_REG);
	  if (matches) {
	    const scheme = options.scheme || urnComponent.scheme || 'urn';
	    urnComponent.nid = matches[1].toLowerCase();
	    urnComponent.nss = matches[2];
	    const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
	    const schemeHandler = getSchemeHandler(urnScheme);
	    urnComponent.path = undefined;

	    if (schemeHandler) {
	      urnComponent = schemeHandler.parse(urnComponent, options);
	    }
	  } else {
	    urnComponent.error = urnComponent.error || 'URN can not be parsed.';
	  }

	  return urnComponent
	}

	/** @type {SchemeFn} */
	function urnSerialize (urnComponent, options) {
	  if (urnComponent.nid === undefined) {
	    throw new Error('URN without nid cannot be serialized')
	  }
	  const scheme = options.scheme || urnComponent.scheme || 'urn';
	  const nid = urnComponent.nid.toLowerCase();
	  const urnScheme = `${scheme}:${options.nid || nid}`;
	  const schemeHandler = getSchemeHandler(urnScheme);

	  if (schemeHandler) {
	    urnComponent = schemeHandler.serialize(urnComponent, options);
	  }

	  const uriComponent = urnComponent;
	  const nss = urnComponent.nss;
	  uriComponent.path = `${nid || options.nid}:${nss}`;

	  options.skipEscape = true;
	  return uriComponent
	}

	/** @type {SchemeFn} */
	function urnuuidParse (urnComponent, options) {
	  const uuidComponent = urnComponent;
	  uuidComponent.uuid = uuidComponent.nss;
	  uuidComponent.nss = undefined;

	  if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
	    uuidComponent.error = uuidComponent.error || 'UUID is not valid.';
	  }

	  return uuidComponent
	}

	/** @type {SchemeFn} */
	function urnuuidSerialize (uuidComponent) {
	  const urnComponent = uuidComponent;
	  // normalize UUID
	  urnComponent.nss = (uuidComponent.uuid || '').toLowerCase();
	  return urnComponent
	}

	const http = /** @type {SchemeHandler} */ ({
	  scheme: 'http',
	  domainHost: true,
	  parse: httpParse,
	  serialize: httpSerialize
	});

	const https = /** @type {SchemeHandler} */ ({
	  scheme: 'https',
	  domainHost: http.domainHost,
	  parse: httpParse,
	  serialize: httpSerialize
	});

	const ws = /** @type {SchemeHandler} */ ({
	  scheme: 'ws',
	  domainHost: true,
	  parse: wsParse,
	  serialize: wsSerialize
	});

	const wss = /** @type {SchemeHandler} */ ({
	  scheme: 'wss',
	  domainHost: ws.domainHost,
	  parse: ws.parse,
	  serialize: ws.serialize
	});

	const urn = /** @type {SchemeHandler} */ ({
	  scheme: 'urn',
	  parse: urnParse,
	  serialize: urnSerialize,
	  skipNormalize: true
	});

	const urnuuid = /** @type {SchemeHandler} */ ({
	  scheme: 'urn:uuid',
	  parse: urnuuidParse,
	  serialize: urnuuidSerialize,
	  skipNormalize: true
	});

	const SCHEMES = /** @type {Record<SchemeName, SchemeHandler>} */ ({
	  http,
	  https,
	  ws,
	  wss,
	  urn,
	  'urn:uuid': urnuuid
	});

	Object.setPrototypeOf(SCHEMES, null);

	/**
	 * @param {string|undefined} scheme
	 * @returns {SchemeHandler|undefined}
	 */
	function getSchemeHandler (scheme) {
	  return (
	    scheme && (
	      SCHEMES[/** @type {SchemeName} */ (scheme)] ||
	      SCHEMES[/** @type {SchemeName} */(scheme.toLowerCase())])
	  ) ||
	    undefined
	}

	schemes = {
	  wsIsSecure,
	  SCHEMES,
	  isValidSchemeName,
	  getSchemeHandler,
	};
	return schemes;
}

var hasRequiredFastUri;

function requireFastUri () {
	if (hasRequiredFastUri) return fastUri.exports;
	hasRequiredFastUri = 1;

	const { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = requireUtils();
	const { SCHEMES, getSchemeHandler } = requireSchemes();

	/**
	 * @template {import('./types/index').URIComponent|string} T
	 * @param {T} uri
	 * @param {import('./types/index').Options} [options]
	 * @returns {T}
	 */
	function normalize (uri, options) {
	  if (typeof uri === 'string') {
	    uri = /** @type {T} */ (serialize(parse(uri, options), options));
	  } else if (typeof uri === 'object') {
	    uri = /** @type {T} */ (parse(serialize(uri, options), options));
	  }
	  return uri
	}

	/**
	 * @param {string} baseURI
	 * @param {string} relativeURI
	 * @param {import('./types/index').Options} [options]
	 * @returns {string}
	 */
	function resolve (baseURI, relativeURI, options) {
	  const schemelessOptions = options ? Object.assign({ scheme: 'null' }, options) : { scheme: 'null' };
	  const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
	  schemelessOptions.skipEscape = true;
	  return serialize(resolved, schemelessOptions)
	}

	/**
	 * @param {import ('./types/index').URIComponent} base
	 * @param {import ('./types/index').URIComponent} relative
	 * @param {import('./types/index').Options} [options]
	 * @param {boolean} [skipNormalization=false]
	 * @returns {import ('./types/index').URIComponent}
	 */
	function resolveComponent (base, relative, options, skipNormalization) {
	  /** @type {import('./types/index').URIComponent} */
	  const target = {};
	  if (!skipNormalization) {
	    base = parse(serialize(base, options), options); // normalize base component
	    relative = parse(serialize(relative, options), options); // normalize relative component
	  }
	  options = options || {};

	  if (!options.tolerant && relative.scheme) {
	    target.scheme = relative.scheme;
	    // target.authority = relative.authority;
	    target.userinfo = relative.userinfo;
	    target.host = relative.host;
	    target.port = relative.port;
	    target.path = removeDotSegments(relative.path || '');
	    target.query = relative.query;
	  } else {
	    if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
	      // target.authority = relative.authority;
	      target.userinfo = relative.userinfo;
	      target.host = relative.host;
	      target.port = relative.port;
	      target.path = removeDotSegments(relative.path || '');
	      target.query = relative.query;
	    } else {
	      if (!relative.path) {
	        target.path = base.path;
	        if (relative.query !== undefined) {
	          target.query = relative.query;
	        } else {
	          target.query = base.query;
	        }
	      } else {
	        if (relative.path[0] === '/') {
	          target.path = removeDotSegments(relative.path);
	        } else {
	          if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
	            target.path = '/' + relative.path;
	          } else if (!base.path) {
	            target.path = relative.path;
	          } else {
	            target.path = base.path.slice(0, base.path.lastIndexOf('/') + 1) + relative.path;
	          }
	          target.path = removeDotSegments(target.path);
	        }
	        target.query = relative.query;
	      }
	      // target.authority = base.authority;
	      target.userinfo = base.userinfo;
	      target.host = base.host;
	      target.port = base.port;
	    }
	    target.scheme = base.scheme;
	  }

	  target.fragment = relative.fragment;

	  return target
	}

	/**
	 * @param {import ('./types/index').URIComponent|string} uriA
	 * @param {import ('./types/index').URIComponent|string} uriB
	 * @param {import ('./types/index').Options} options
	 * @returns {boolean}
	 */
	function equal (uriA, uriB, options) {
	  if (typeof uriA === 'string') {
	    uriA = unescape(uriA);
	    uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
	  } else if (typeof uriA === 'object') {
	    uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
	  }

	  if (typeof uriB === 'string') {
	    uriB = unescape(uriB);
	    uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
	  } else if (typeof uriB === 'object') {
	    uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
	  }

	  return uriA.toLowerCase() === uriB.toLowerCase()
	}

	/**
	 * @param {Readonly<import('./types/index').URIComponent>} cmpts
	 * @param {import('./types/index').Options} [opts]
	 * @returns {string}
	 */
	function serialize (cmpts, opts) {
	  const component = {
	    host: cmpts.host,
	    scheme: cmpts.scheme,
	    userinfo: cmpts.userinfo,
	    port: cmpts.port,
	    path: cmpts.path,
	    query: cmpts.query,
	    nid: cmpts.nid,
	    nss: cmpts.nss,
	    uuid: cmpts.uuid,
	    fragment: cmpts.fragment,
	    reference: cmpts.reference,
	    resourceName: cmpts.resourceName,
	    secure: cmpts.secure,
	    error: ''
	  };
	  const options = Object.assign({}, opts);
	  const uriTokens = [];

	  // find scheme handler
	  const schemeHandler = getSchemeHandler(options.scheme || component.scheme);

	  // perform scheme specific serialization
	  if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);

	  if (component.path !== undefined) {
	    if (!options.skipEscape) {
	      component.path = escape(component.path);

	      if (component.scheme !== undefined) {
	        component.path = component.path.split('%3A').join(':');
	      }
	    } else {
	      component.path = unescape(component.path);
	    }
	  }

	  if (options.reference !== 'suffix' && component.scheme) {
	    uriTokens.push(component.scheme, ':');
	  }

	  const authority = recomposeAuthority(component);
	  if (authority !== undefined) {
	    if (options.reference !== 'suffix') {
	      uriTokens.push('//');
	    }

	    uriTokens.push(authority);

	    if (component.path && component.path[0] !== '/') {
	      uriTokens.push('/');
	    }
	  }
	  if (component.path !== undefined) {
	    let s = component.path;

	    if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
	      s = removeDotSegments(s);
	    }

	    if (
	      authority === undefined &&
	      s[0] === '/' &&
	      s[1] === '/'
	    ) {
	      // don't allow the path to start with "//"
	      s = '/%2F' + s.slice(2);
	    }

	    uriTokens.push(s);
	  }

	  if (component.query !== undefined) {
	    uriTokens.push('?', component.query);
	  }

	  if (component.fragment !== undefined) {
	    uriTokens.push('#', component.fragment);
	  }
	  return uriTokens.join('')
	}

	const URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;

	/**
	 * @param {string} uri
	 * @param {import('./types/index').Options} [opts]
	 * @returns
	 */
	function parse (uri, opts) {
	  const options = Object.assign({}, opts);
	  /** @type {import('./types/index').URIComponent} */
	  const parsed = {
	    scheme: undefined,
	    userinfo: undefined,
	    host: '',
	    port: undefined,
	    path: '',
	    query: undefined,
	    fragment: undefined
	  };

	  let isIP = false;
	  if (options.reference === 'suffix') {
	    if (options.scheme) {
	      uri = options.scheme + ':' + uri;
	    } else {
	      uri = '//' + uri;
	    }
	  }

	  const matches = uri.match(URI_PARSE);

	  if (matches) {
	    // store each component
	    parsed.scheme = matches[1];
	    parsed.userinfo = matches[3];
	    parsed.host = matches[4];
	    parsed.port = parseInt(matches[5], 10);
	    parsed.path = matches[6] || '';
	    parsed.query = matches[7];
	    parsed.fragment = matches[8];

	    // fix port number
	    if (isNaN(parsed.port)) {
	      parsed.port = matches[5];
	    }
	    if (parsed.host) {
	      const ipv4result = isIPv4(parsed.host);
	      if (ipv4result === false) {
	        const ipv6result = normalizeIPv6(parsed.host);
	        parsed.host = ipv6result.host.toLowerCase();
	        isIP = ipv6result.isIPV6;
	      } else {
	        isIP = true;
	      }
	    }
	    if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
	      parsed.reference = 'same-document';
	    } else if (parsed.scheme === undefined) {
	      parsed.reference = 'relative';
	    } else if (parsed.fragment === undefined) {
	      parsed.reference = 'absolute';
	    } else {
	      parsed.reference = 'uri';
	    }

	    // check for reference errors
	    if (options.reference && options.reference !== 'suffix' && options.reference !== parsed.reference) {
	      parsed.error = parsed.error || 'URI is not a ' + options.reference + ' reference.';
	    }

	    // find scheme handler
	    const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);

	    // check if scheme can't handle IRIs
	    if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
	      // if host component is a domain name
	      if (parsed.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost)) && isIP === false && nonSimpleDomain(parsed.host)) {
	        // convert Unicode IDN -> ASCII IDN
	        try {
	          parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
	        } catch (e) {
	          parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
	        }
	      }
	      // convert IRI -> URI
	    }

	    if (!schemeHandler || (schemeHandler && !schemeHandler.skipNormalize)) {
	      if (uri.indexOf('%') !== -1) {
	        if (parsed.scheme !== undefined) {
	          parsed.scheme = unescape(parsed.scheme);
	        }
	        if (parsed.host !== undefined) {
	          parsed.host = unescape(parsed.host);
	        }
	      }
	      if (parsed.path) {
	        parsed.path = escape(unescape(parsed.path));
	      }
	      if (parsed.fragment) {
	        parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
	      }
	    }

	    // perform scheme specific parsing
	    if (schemeHandler && schemeHandler.parse) {
	      schemeHandler.parse(parsed, options);
	    }
	  } else {
	    parsed.error = parsed.error || 'URI can not be parsed.';
	  }
	  return parsed
	}

	const fastUri$1 = {
	  SCHEMES,
	  normalize,
	  resolve,
	  resolveComponent,
	  equal,
	  serialize,
	  parse
	};

	fastUri.exports = fastUri$1;
	fastUri.exports.default = fastUri$1;
	fastUri.exports.fastUri = fastUri$1;
	return fastUri.exports;
}

var hasRequiredUri;

function requireUri () {
	if (hasRequiredUri) return uri;
	hasRequiredUri = 1;
	Object.defineProperty(uri, "__esModule", { value: true });
	const uri$1 = requireFastUri();
	uri$1.code = 'require("ajv/dist/runtime/uri").default';
	uri.default = uri$1;
	
	return uri;
}

var hasRequiredCore$3;

function requireCore$3 () {
	if (hasRequiredCore$3) return core$3;
	hasRequiredCore$3 = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
		var validate_1 = requireValidate();
		Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return validate_1.KeywordCxt; } });
		var codegen_1 = requireCodegen();
		Object.defineProperty(exports, "_", { enumerable: true, get: function () { return codegen_1._; } });
		Object.defineProperty(exports, "str", { enumerable: true, get: function () { return codegen_1.str; } });
		Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return codegen_1.stringify; } });
		Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return codegen_1.nil; } });
		Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return codegen_1.Name; } });
		Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return codegen_1.CodeGen; } });
		const validation_error_1 = requireValidation_error();
		const ref_error_1 = requireRef_error();
		const rules_1 = requireRules();
		const compile_1 = requireCompile();
		const codegen_2 = requireCodegen();
		const resolve_1 = requireResolve();
		const dataType_1 = requireDataType();
		const util_1 = requireUtil();
		const $dataRefSchema = require$$9;
		const uri_1 = requireUri();
		const defaultRegExp = (str, flags) => new RegExp(str, flags);
		defaultRegExp.code = "new RegExp";
		const META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
		const EXT_SCOPE_NAMES = new Set([
		    "validate",
		    "serialize",
		    "parse",
		    "wrapper",
		    "root",
		    "schema",
		    "keyword",
		    "pattern",
		    "formats",
		    "validate$data",
		    "func",
		    "obj",
		    "Error",
		]);
		const removedOptions = {
		    errorDataPath: "",
		    format: "`validateFormats: false` can be used instead.",
		    nullable: '"nullable" keyword is supported by default.',
		    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
		    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
		    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
		    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
		    sourceCode: "Use option `code: {source: true}`",
		    strictDefaults: "It is default now, see option `strict`.",
		    strictKeywords: "It is default now, see option `strict`.",
		    uniqueItems: '"uniqueItems" keyword is always validated.',
		    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
		    cache: "Map is used as cache, schema object as key.",
		    serialize: "Map is used as cache, schema object as key.",
		    ajvErrors: "It is default now.",
		};
		const deprecatedOptions = {
		    ignoreKeywordsWithRef: "",
		    jsPropertySyntax: "",
		    unicode: '"minLength"/"maxLength" account for unicode characters by default.',
		};
		const MAX_EXPRESSION = 200;
		// eslint-disable-next-line complexity
		function requiredOptions(o) {
		    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
		    const s = o.strict;
		    const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
		    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
		    const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
		    const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
		    return {
		        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
		        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
		        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
		        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
		        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
		        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
		        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
		        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
		        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
		        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
		        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
		        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
		        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
		        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
		        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
		        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
		        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
		        uriResolver: uriResolver,
		    };
		}
		class Ajv {
		    constructor(opts = {}) {
		        this.schemas = {};
		        this.refs = {};
		        this.formats = {};
		        this._compilations = new Set();
		        this._loading = {};
		        this._cache = new Map();
		        opts = this.opts = { ...opts, ...requiredOptions(opts) };
		        const { es5, lines } = this.opts.code;
		        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
		        this.logger = getLogger(opts.logger);
		        const formatOpt = opts.validateFormats;
		        opts.validateFormats = false;
		        this.RULES = (0, rules_1.getRules)();
		        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
		        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
		        this._metaOpts = getMetaSchemaOptions.call(this);
		        if (opts.formats)
		            addInitialFormats.call(this);
		        this._addVocabularies();
		        this._addDefaultMetaSchema();
		        if (opts.keywords)
		            addInitialKeywords.call(this, opts.keywords);
		        if (typeof opts.meta == "object")
		            this.addMetaSchema(opts.meta);
		        addInitialSchemas.call(this);
		        opts.validateFormats = formatOpt;
		    }
		    _addVocabularies() {
		        this.addKeyword("$async");
		    }
		    _addDefaultMetaSchema() {
		        const { $data, meta, schemaId } = this.opts;
		        let _dataRefSchema = $dataRefSchema;
		        if (schemaId === "id") {
		            _dataRefSchema = { ...$dataRefSchema };
		            _dataRefSchema.id = _dataRefSchema.$id;
		            delete _dataRefSchema.$id;
		        }
		        if (meta && $data)
		            this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
		    }
		    defaultMeta() {
		        const { meta, schemaId } = this.opts;
		        return (this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined);
		    }
		    validate(schemaKeyRef, // key, ref or schema object
		    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
		    data // to be validated
		    ) {
		        let v;
		        if (typeof schemaKeyRef == "string") {
		            v = this.getSchema(schemaKeyRef);
		            if (!v)
		                throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
		        }
		        else {
		            v = this.compile(schemaKeyRef);
		        }
		        const valid = v(data);
		        if (!("$async" in v))
		            this.errors = v.errors;
		        return valid;
		    }
		    compile(schema, _meta) {
		        const sch = this._addSchema(schema, _meta);
		        return (sch.validate || this._compileSchemaEnv(sch));
		    }
		    compileAsync(schema, meta) {
		        if (typeof this.opts.loadSchema != "function") {
		            throw new Error("options.loadSchema should be a function");
		        }
		        const { loadSchema } = this.opts;
		        return runCompileAsync.call(this, schema, meta);
		        async function runCompileAsync(_schema, _meta) {
		            await loadMetaSchema.call(this, _schema.$schema);
		            const sch = this._addSchema(_schema, _meta);
		            return sch.validate || _compileAsync.call(this, sch);
		        }
		        async function loadMetaSchema($ref) {
		            if ($ref && !this.getSchema($ref)) {
		                await runCompileAsync.call(this, { $ref }, true);
		            }
		        }
		        async function _compileAsync(sch) {
		            try {
		                return this._compileSchemaEnv(sch);
		            }
		            catch (e) {
		                if (!(e instanceof ref_error_1.default))
		                    throw e;
		                checkLoaded.call(this, e);
		                await loadMissingSchema.call(this, e.missingSchema);
		                return _compileAsync.call(this, sch);
		            }
		        }
		        function checkLoaded({ missingSchema: ref, missingRef }) {
		            if (this.refs[ref]) {
		                throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
		            }
		        }
		        async function loadMissingSchema(ref) {
		            const _schema = await _loadSchema.call(this, ref);
		            if (!this.refs[ref])
		                await loadMetaSchema.call(this, _schema.$schema);
		            if (!this.refs[ref])
		                this.addSchema(_schema, ref, meta);
		        }
		        async function _loadSchema(ref) {
		            const p = this._loading[ref];
		            if (p)
		                return p;
		            try {
		                return await (this._loading[ref] = loadSchema(ref));
		            }
		            finally {
		                delete this._loading[ref];
		            }
		        }
		    }
		    // Adds schema to the instance
		    addSchema(schema, // If array is passed, `key` will be ignored
		    key, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
		    _meta, // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
		    _validateSchema = this.opts.validateSchema // false to skip schema validation. Used internally, option validateSchema should be used instead.
		    ) {
		        if (Array.isArray(schema)) {
		            for (const sch of schema)
		                this.addSchema(sch, undefined, _meta, _validateSchema);
		            return this;
		        }
		        let id;
		        if (typeof schema === "object") {
		            const { schemaId } = this.opts;
		            id = schema[schemaId];
		            if (id !== undefined && typeof id != "string") {
		                throw new Error(`schema ${schemaId} must be string`);
		            }
		        }
		        key = (0, resolve_1.normalizeId)(key || id);
		        this._checkUnique(key);
		        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
		        return this;
		    }
		    // Add schema that will be used to validate other schemas
		    // options in META_IGNORE_OPTIONS are alway set to false
		    addMetaSchema(schema, key, // schema key
		    _validateSchema = this.opts.validateSchema // false to skip schema validation, can be used to override validateSchema option for meta-schema
		    ) {
		        this.addSchema(schema, key, true, _validateSchema);
		        return this;
		    }
		    //  Validate schema against its meta-schema
		    validateSchema(schema, throwOrLogError) {
		        if (typeof schema == "boolean")
		            return true;
		        let $schema;
		        $schema = schema.$schema;
		        if ($schema !== undefined && typeof $schema != "string") {
		            throw new Error("$schema must be a string");
		        }
		        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
		        if (!$schema) {
		            this.logger.warn("meta-schema not available");
		            this.errors = null;
		            return true;
		        }
		        const valid = this.validate($schema, schema);
		        if (!valid && throwOrLogError) {
		            const message = "schema is invalid: " + this.errorsText();
		            if (this.opts.validateSchema === "log")
		                this.logger.error(message);
		            else
		                throw new Error(message);
		        }
		        return valid;
		    }
		    // Get compiled schema by `key` or `ref`.
		    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
		    getSchema(keyRef) {
		        let sch;
		        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
		            keyRef = sch;
		        if (sch === undefined) {
		            const { schemaId } = this.opts;
		            const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
		            sch = compile_1.resolveSchema.call(this, root, keyRef);
		            if (!sch)
		                return;
		            this.refs[keyRef] = sch;
		        }
		        return (sch.validate || this._compileSchemaEnv(sch));
		    }
		    // Remove cached schema(s).
		    // If no parameter is passed all schemas but meta-schemas are removed.
		    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
		    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
		    removeSchema(schemaKeyRef) {
		        if (schemaKeyRef instanceof RegExp) {
		            this._removeAllSchemas(this.schemas, schemaKeyRef);
		            this._removeAllSchemas(this.refs, schemaKeyRef);
		            return this;
		        }
		        switch (typeof schemaKeyRef) {
		            case "undefined":
		                this._removeAllSchemas(this.schemas);
		                this._removeAllSchemas(this.refs);
		                this._cache.clear();
		                return this;
		            case "string": {
		                const sch = getSchEnv.call(this, schemaKeyRef);
		                if (typeof sch == "object")
		                    this._cache.delete(sch.schema);
		                delete this.schemas[schemaKeyRef];
		                delete this.refs[schemaKeyRef];
		                return this;
		            }
		            case "object": {
		                const cacheKey = schemaKeyRef;
		                this._cache.delete(cacheKey);
		                let id = schemaKeyRef[this.opts.schemaId];
		                if (id) {
		                    id = (0, resolve_1.normalizeId)(id);
		                    delete this.schemas[id];
		                    delete this.refs[id];
		                }
		                return this;
		            }
		            default:
		                throw new Error("ajv.removeSchema: invalid parameter");
		        }
		    }
		    // add "vocabulary" - a collection of keywords
		    addVocabulary(definitions) {
		        for (const def of definitions)
		            this.addKeyword(def);
		        return this;
		    }
		    addKeyword(kwdOrDef, def // deprecated
		    ) {
		        let keyword;
		        if (typeof kwdOrDef == "string") {
		            keyword = kwdOrDef;
		            if (typeof def == "object") {
		                this.logger.warn("these parameters are deprecated, see docs for addKeyword");
		                def.keyword = keyword;
		            }
		        }
		        else if (typeof kwdOrDef == "object" && def === undefined) {
		            def = kwdOrDef;
		            keyword = def.keyword;
		            if (Array.isArray(keyword) && !keyword.length) {
		                throw new Error("addKeywords: keyword must be string or non-empty array");
		            }
		        }
		        else {
		            throw new Error("invalid addKeywords parameters");
		        }
		        checkKeyword.call(this, keyword, def);
		        if (!def) {
		            (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
		            return this;
		        }
		        keywordMetaschema.call(this, def);
		        const definition = {
		            ...def,
		            type: (0, dataType_1.getJSONTypes)(def.type),
		            schemaType: (0, dataType_1.getJSONTypes)(def.schemaType),
		        };
		        (0, util_1.eachItem)(keyword, definition.type.length === 0
		            ? (k) => addRule.call(this, k, definition)
		            : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
		        return this;
		    }
		    getKeyword(keyword) {
		        const rule = this.RULES.all[keyword];
		        return typeof rule == "object" ? rule.definition : !!rule;
		    }
		    // Remove keyword
		    removeKeyword(keyword) {
		        // TODO return type should be Ajv
		        const { RULES } = this;
		        delete RULES.keywords[keyword];
		        delete RULES.all[keyword];
		        for (const group of RULES.rules) {
		            const i = group.rules.findIndex((rule) => rule.keyword === keyword);
		            if (i >= 0)
		                group.rules.splice(i, 1);
		        }
		        return this;
		    }
		    // Add format
		    addFormat(name, format) {
		        if (typeof format == "string")
		            format = new RegExp(format);
		        this.formats[name] = format;
		        return this;
		    }
		    errorsText(errors = this.errors, // optional array of validation errors
		    { separator = ", ", dataVar = "data" } = {} // optional options with properties `separator` and `dataVar`
		    ) {
		        if (!errors || errors.length === 0)
		            return "No errors";
		        return errors
		            .map((e) => `${dataVar}${e.instancePath} ${e.message}`)
		            .reduce((text, msg) => text + separator + msg);
		    }
		    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
		        const rules = this.RULES.all;
		        metaSchema = JSON.parse(JSON.stringify(metaSchema));
		        for (const jsonPointer of keywordsJsonPointers) {
		            const segments = jsonPointer.split("/").slice(1); // first segment is an empty string
		            let keywords = metaSchema;
		            for (const seg of segments)
		                keywords = keywords[seg];
		            for (const key in rules) {
		                const rule = rules[key];
		                if (typeof rule != "object")
		                    continue;
		                const { $data } = rule.definition;
		                const schema = keywords[key];
		                if ($data && schema)
		                    keywords[key] = schemaOrData(schema);
		            }
		        }
		        return metaSchema;
		    }
		    _removeAllSchemas(schemas, regex) {
		        for (const keyRef in schemas) {
		            const sch = schemas[keyRef];
		            if (!regex || regex.test(keyRef)) {
		                if (typeof sch == "string") {
		                    delete schemas[keyRef];
		                }
		                else if (sch && !sch.meta) {
		                    this._cache.delete(sch.schema);
		                    delete schemas[keyRef];
		                }
		            }
		        }
		    }
		    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
		        let id;
		        const { schemaId } = this.opts;
		        if (typeof schema == "object") {
		            id = schema[schemaId];
		        }
		        else {
		            if (this.opts.jtd)
		                throw new Error("schema must be object");
		            else if (typeof schema != "boolean")
		                throw new Error("schema must be object or boolean");
		        }
		        let sch = this._cache.get(schema);
		        if (sch !== undefined)
		            return sch;
		        baseId = (0, resolve_1.normalizeId)(id || baseId);
		        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
		        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
		        this._cache.set(sch.schema, sch);
		        if (addSchema && !baseId.startsWith("#")) {
		            // TODO atm it is allowed to overwrite schemas without id (instead of not adding them)
		            if (baseId)
		                this._checkUnique(baseId);
		            this.refs[baseId] = sch;
		        }
		        if (validateSchema)
		            this.validateSchema(schema, true);
		        return sch;
		    }
		    _checkUnique(id) {
		        if (this.schemas[id] || this.refs[id]) {
		            throw new Error(`schema with key or id "${id}" already exists`);
		        }
		    }
		    _compileSchemaEnv(sch) {
		        if (sch.meta)
		            this._compileMetaSchema(sch);
		        else
		            compile_1.compileSchema.call(this, sch);
		        /* istanbul ignore if */
		        if (!sch.validate)
		            throw new Error("ajv implementation error");
		        return sch.validate;
		    }
		    _compileMetaSchema(sch) {
		        const currentOpts = this.opts;
		        this.opts = this._metaOpts;
		        try {
		            compile_1.compileSchema.call(this, sch);
		        }
		        finally {
		            this.opts = currentOpts;
		        }
		    }
		}
		Ajv.ValidationError = validation_error_1.default;
		Ajv.MissingRefError = ref_error_1.default;
		exports.default = Ajv;
		function checkOptions(checkOpts, options, msg, log = "error") {
		    for (const key in checkOpts) {
		        const opt = key;
		        if (opt in options)
		            this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
		    }
		}
		function getSchEnv(keyRef) {
		    keyRef = (0, resolve_1.normalizeId)(keyRef); // TODO tests fail without this line
		    return this.schemas[keyRef] || this.refs[keyRef];
		}
		function addInitialSchemas() {
		    const optsSchemas = this.opts.schemas;
		    if (!optsSchemas)
		        return;
		    if (Array.isArray(optsSchemas))
		        this.addSchema(optsSchemas);
		    else
		        for (const key in optsSchemas)
		            this.addSchema(optsSchemas[key], key);
		}
		function addInitialFormats() {
		    for (const name in this.opts.formats) {
		        const format = this.opts.formats[name];
		        if (format)
		            this.addFormat(name, format);
		    }
		}
		function addInitialKeywords(defs) {
		    if (Array.isArray(defs)) {
		        this.addVocabulary(defs);
		        return;
		    }
		    this.logger.warn("keywords option as map is deprecated, pass array");
		    for (const keyword in defs) {
		        const def = defs[keyword];
		        if (!def.keyword)
		            def.keyword = keyword;
		        this.addKeyword(def);
		    }
		}
		function getMetaSchemaOptions() {
		    const metaOpts = { ...this.opts };
		    for (const opt of META_IGNORE_OPTIONS)
		        delete metaOpts[opt];
		    return metaOpts;
		}
		const noLogs = { log() { }, warn() { }, error() { } };
		function getLogger(logger) {
		    if (logger === false)
		        return noLogs;
		    if (logger === undefined)
		        return console;
		    if (logger.log && logger.warn && logger.error)
		        return logger;
		    throw new Error("logger must implement log, warn and error methods");
		}
		const KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
		function checkKeyword(keyword, def) {
		    const { RULES } = this;
		    (0, util_1.eachItem)(keyword, (kwd) => {
		        if (RULES.keywords[kwd])
		            throw new Error(`Keyword ${kwd} is already defined`);
		        if (!KEYWORD_NAME.test(kwd))
		            throw new Error(`Keyword ${kwd} has invalid name`);
		    });
		    if (!def)
		        return;
		    if (def.$data && !("code" in def || "validate" in def)) {
		        throw new Error('$data keyword must have "code" or "validate" function');
		    }
		}
		function addRule(keyword, definition, dataType) {
		    var _a;
		    const post = definition === null || definition === void 0 ? void 0 : definition.post;
		    if (dataType && post)
		        throw new Error('keyword with "post" flag cannot have "type"');
		    const { RULES } = this;
		    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
		    if (!ruleGroup) {
		        ruleGroup = { type: dataType, rules: [] };
		        RULES.rules.push(ruleGroup);
		    }
		    RULES.keywords[keyword] = true;
		    if (!definition)
		        return;
		    const rule = {
		        keyword,
		        definition: {
		            ...definition,
		            type: (0, dataType_1.getJSONTypes)(definition.type),
		            schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType),
		        },
		    };
		    if (definition.before)
		        addBeforeRule.call(this, ruleGroup, rule, definition.before);
		    else
		        ruleGroup.rules.push(rule);
		    RULES.all[keyword] = rule;
		    (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
		}
		function addBeforeRule(ruleGroup, rule, before) {
		    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
		    if (i >= 0) {
		        ruleGroup.rules.splice(i, 0, rule);
		    }
		    else {
		        ruleGroup.rules.push(rule);
		        this.logger.warn(`rule ${before} is not defined`);
		    }
		}
		function keywordMetaschema(def) {
		    let { metaSchema } = def;
		    if (metaSchema === undefined)
		        return;
		    if (def.$data && this.opts.$data)
		        metaSchema = schemaOrData(metaSchema);
		    def.validateSchema = this.compile(metaSchema, true);
		}
		const $dataRef = {
		    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
		};
		function schemaOrData(schema) {
		    return { anyOf: [schema, $dataRef] };
		}
		
	} (core$3));
	return core$3;
}

var draft2020 = {};

var core$2 = {};

var id$4 = {};

var hasRequiredId;

function requireId () {
	if (hasRequiredId) return id$4;
	hasRequiredId = 1;
	Object.defineProperty(id$4, "__esModule", { value: true });
	const def = {
	    keyword: "id",
	    code() {
	        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
	    },
	};
	id$4.default = def;
	
	return id$4;
}

var ref$1 = {};

var hasRequiredRef$1;

function requireRef$1 () {
	if (hasRequiredRef$1) return ref$1;
	hasRequiredRef$1 = 1;
	Object.defineProperty(ref$1, "__esModule", { value: true });
	ref$1.callRef = ref$1.getValidate = void 0;
	const ref_error_1 = requireRef_error();
	const code_1 = requireCode();
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const compile_1 = requireCompile();
	const util_1 = requireUtil();
	const def = {
	    keyword: "$ref",
	    schemaType: "string",
	    code(cxt) {
	        const { gen, schema: $ref, it } = cxt;
	        const { baseId, schemaEnv: env, validateName, opts, self } = it;
	        const { root } = env;
	        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
	            return callRootRef();
	        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
	        if (schOrEnv === undefined)
	            throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
	        if (schOrEnv instanceof compile_1.SchemaEnv)
	            return callValidate(schOrEnv);
	        return inlineRefSchema(schOrEnv);
	        function callRootRef() {
	            if (env === root)
	                return callRef(cxt, validateName, env, env.$async);
	            const rootName = gen.scopeValue("root", { ref: root });
	            return callRef(cxt, (0, codegen_1._) `${rootName}.validate`, root, root.$async);
	        }
	        function callValidate(sch) {
	            const v = getValidate(cxt, sch);
	            callRef(cxt, v, sch, sch.$async);
	        }
	        function inlineRefSchema(sch) {
	            const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
	            const valid = gen.name("valid");
	            const schCxt = cxt.subschema({
	                schema: sch,
	                dataTypes: [],
	                schemaPath: codegen_1.nil,
	                topSchemaRef: schName,
	                errSchemaPath: $ref,
	            }, valid);
	            cxt.mergeEvaluated(schCxt);
	            cxt.ok(valid);
	        }
	    },
	};
	function getValidate(cxt, sch) {
	    const { gen } = cxt;
	    return sch.validate
	        ? gen.scopeValue("validate", { ref: sch.validate })
	        : (0, codegen_1._) `${gen.scopeValue("wrapper", { ref: sch })}.validate`;
	}
	ref$1.getValidate = getValidate;
	function callRef(cxt, v, sch, $async) {
	    const { gen, it } = cxt;
	    const { allErrors, schemaEnv: env, opts } = it;
	    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
	    if ($async)
	        callAsyncRef();
	    else
	        callSyncRef();
	    function callAsyncRef() {
	        if (!env.$async)
	            throw new Error("async schema referenced by sync schema");
	        const valid = gen.let("valid");
	        gen.try(() => {
	            gen.code((0, codegen_1._) `await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
	            addEvaluatedFrom(v); // TODO will not work with async, it has to be returned with the result
	            if (!allErrors)
	                gen.assign(valid, true);
	        }, (e) => {
	            gen.if((0, codegen_1._) `!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
	            addErrorsFrom(e);
	            if (!allErrors)
	                gen.assign(valid, false);
	        });
	        cxt.ok(valid);
	    }
	    function callSyncRef() {
	        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
	    }
	    function addErrorsFrom(source) {
	        const errs = (0, codegen_1._) `${source}.errors`;
	        gen.assign(names_1.default.vErrors, (0, codegen_1._) `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`); // TODO tagged
	        gen.assign(names_1.default.errors, (0, codegen_1._) `${names_1.default.vErrors}.length`);
	    }
	    function addEvaluatedFrom(source) {
	        var _a;
	        if (!it.opts.unevaluated)
	            return;
	        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
	        // TODO refactor
	        if (it.props !== true) {
	            if (schEvaluated && !schEvaluated.dynamicProps) {
	                if (schEvaluated.props !== undefined) {
	                    it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
	                }
	            }
	            else {
	                const props = gen.var("props", (0, codegen_1._) `${source}.evaluated.props`);
	                it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
	            }
	        }
	        if (it.items !== true) {
	            if (schEvaluated && !schEvaluated.dynamicItems) {
	                if (schEvaluated.items !== undefined) {
	                    it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
	                }
	            }
	            else {
	                const items = gen.var("items", (0, codegen_1._) `${source}.evaluated.items`);
	                it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
	            }
	        }
	    }
	}
	ref$1.callRef = callRef;
	ref$1.default = def;
	
	return ref$1;
}

var hasRequiredCore$2;

function requireCore$2 () {
	if (hasRequiredCore$2) return core$2;
	hasRequiredCore$2 = 1;
	Object.defineProperty(core$2, "__esModule", { value: true });
	const id_1 = requireId();
	const ref_1 = requireRef$1();
	const core = [
	    "$schema",
	    "$id",
	    "$defs",
	    "$vocabulary",
	    { keyword: "$comment" },
	    "definitions",
	    id_1.default,
	    ref_1.default,
	];
	core$2.default = core;
	
	return core$2;
}

var validation$1 = {};

var limitNumber$1 = {};

var hasRequiredLimitNumber$1;

function requireLimitNumber$1 () {
	if (hasRequiredLimitNumber$1) return limitNumber$1;
	hasRequiredLimitNumber$1 = 1;
	Object.defineProperty(limitNumber$1, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const ops = codegen_1.operators;
	const KWDs = {
	    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
	    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
	    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
	    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE },
	};
	const error = {
	    message: ({ keyword, schemaCode }) => (0, codegen_1.str) `must be ${KWDs[keyword].okStr} ${schemaCode}`,
	    params: ({ keyword, schemaCode }) => (0, codegen_1._) `{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`,
	};
	const def = {
	    keyword: Object.keys(KWDs),
	    type: "number",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        cxt.fail$data((0, codegen_1._) `${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
	    },
	};
	limitNumber$1.default = def;
	
	return limitNumber$1;
}

var multipleOf = {};

var hasRequiredMultipleOf;

function requireMultipleOf () {
	if (hasRequiredMultipleOf) return multipleOf;
	hasRequiredMultipleOf = 1;
	Object.defineProperty(multipleOf, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const error = {
	    message: ({ schemaCode }) => (0, codegen_1.str) `must be multiple of ${schemaCode}`,
	    params: ({ schemaCode }) => (0, codegen_1._) `{multipleOf: ${schemaCode}}`,
	};
	const def = {
	    keyword: "multipleOf",
	    type: "number",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { gen, data, schemaCode, it } = cxt;
	        // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
	        const prec = it.opts.multipleOfPrecision;
	        const res = gen.let("res");
	        const invalid = prec
	            ? (0, codegen_1._) `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
	            : (0, codegen_1._) `${res} !== parseInt(${res})`;
	        cxt.fail$data((0, codegen_1._) `(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
	    },
	};
	multipleOf.default = def;
	
	return multipleOf;
}

var limitLength = {};

var ucs2length = {};

var hasRequiredUcs2length;

function requireUcs2length () {
	if (hasRequiredUcs2length) return ucs2length;
	hasRequiredUcs2length = 1;
	Object.defineProperty(ucs2length, "__esModule", { value: true });
	// https://mathiasbynens.be/notes/javascript-encoding
	// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
	function ucs2length$1(str) {
	    const len = str.length;
	    let length = 0;
	    let pos = 0;
	    let value;
	    while (pos < len) {
	        length++;
	        value = str.charCodeAt(pos++);
	        if (value >= 0xd800 && value <= 0xdbff && pos < len) {
	            // high surrogate, and there is a next character
	            value = str.charCodeAt(pos);
	            if ((value & 0xfc00) === 0xdc00)
	                pos++; // low surrogate
	        }
	    }
	    return length;
	}
	ucs2length.default = ucs2length$1;
	ucs2length$1.code = 'require("ajv/dist/runtime/ucs2length").default';
	
	return ucs2length;
}

var hasRequiredLimitLength;

function requireLimitLength () {
	if (hasRequiredLimitLength) return limitLength;
	hasRequiredLimitLength = 1;
	Object.defineProperty(limitLength, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const ucs2length_1 = requireUcs2length();
	const error = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxLength" ? "more" : "fewer";
	        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} characters`;
	    },
	    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
	};
	const def = {
	    keyword: ["maxLength", "minLength"],
	    type: "string",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { keyword, data, schemaCode, it } = cxt;
	        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
	        const len = it.opts.unicode === false ? (0, codegen_1._) `${data}.length` : (0, codegen_1._) `${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
	        cxt.fail$data((0, codegen_1._) `${len} ${op} ${schemaCode}`);
	    },
	};
	limitLength.default = def;
	
	return limitLength;
}

var pattern = {};

var hasRequiredPattern;

function requirePattern () {
	if (hasRequiredPattern) return pattern;
	hasRequiredPattern = 1;
	Object.defineProperty(pattern, "__esModule", { value: true });
	const code_1 = requireCode();
	const codegen_1 = requireCodegen();
	const error = {
	    message: ({ schemaCode }) => (0, codegen_1.str) `must match pattern "${schemaCode}"`,
	    params: ({ schemaCode }) => (0, codegen_1._) `{pattern: ${schemaCode}}`,
	};
	const def = {
	    keyword: "pattern",
	    type: "string",
	    schemaType: "string",
	    $data: true,
	    error,
	    code(cxt) {
	        const { data, $data, schema, schemaCode, it } = cxt;
	        // TODO regexp should be wrapped in try/catchs
	        const u = it.opts.unicodeRegExp ? "u" : "";
	        const regExp = $data ? (0, codegen_1._) `(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
	        cxt.fail$data((0, codegen_1._) `!${regExp}.test(${data})`);
	    },
	};
	pattern.default = def;
	
	return pattern;
}

var limitProperties = {};

var hasRequiredLimitProperties;

function requireLimitProperties () {
	if (hasRequiredLimitProperties) return limitProperties;
	hasRequiredLimitProperties = 1;
	Object.defineProperty(limitProperties, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const error = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxProperties" ? "more" : "fewer";
	        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} properties`;
	    },
	    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
	};
	const def = {
	    keyword: ["maxProperties", "minProperties"],
	    type: "object",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
	        cxt.fail$data((0, codegen_1._) `Object.keys(${data}).length ${op} ${schemaCode}`);
	    },
	};
	limitProperties.default = def;
	
	return limitProperties;
}

var required$4 = {};

var hasRequiredRequired;

function requireRequired () {
	if (hasRequiredRequired) return required$4;
	hasRequiredRequired = 1;
	Object.defineProperty(required$4, "__esModule", { value: true });
	const code_1 = requireCode();
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params: { missingProperty } }) => (0, codegen_1.str) `must have required property '${missingProperty}'`,
	    params: ({ params: { missingProperty } }) => (0, codegen_1._) `{missingProperty: ${missingProperty}}`,
	};
	const def = {
	    keyword: "required",
	    type: "object",
	    schemaType: "array",
	    $data: true,
	    error,
	    code(cxt) {
	        const { gen, schema, schemaCode, data, $data, it } = cxt;
	        const { opts } = it;
	        if (!$data && schema.length === 0)
	            return;
	        const useLoop = schema.length >= opts.loopRequired;
	        if (it.allErrors)
	            allErrorsMode();
	        else
	            exitOnErrorMode();
	        if (opts.strictRequired) {
	            const props = cxt.parentSchema.properties;
	            const { definedProperties } = cxt.it;
	            for (const requiredKey of schema) {
	                if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
	                    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
	                    const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
	                    (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
	                }
	            }
	        }
	        function allErrorsMode() {
	            if (useLoop || $data) {
	                cxt.block$data(codegen_1.nil, loopAllRequired);
	            }
	            else {
	                for (const prop of schema) {
	                    (0, code_1.checkReportMissingProp)(cxt, prop);
	                }
	            }
	        }
	        function exitOnErrorMode() {
	            const missing = gen.let("missing");
	            if (useLoop || $data) {
	                const valid = gen.let("valid", true);
	                cxt.block$data(valid, () => loopUntilMissing(missing, valid));
	                cxt.ok(valid);
	            }
	            else {
	                gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
	                (0, code_1.reportMissingProp)(cxt, missing);
	                gen.else();
	            }
	        }
	        function loopAllRequired() {
	            gen.forOf("prop", schemaCode, (prop) => {
	                cxt.setParams({ missingProperty: prop });
	                gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
	            });
	        }
	        function loopUntilMissing(missing, valid) {
	            cxt.setParams({ missingProperty: missing });
	            gen.forOf(missing, schemaCode, () => {
	                gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
	                gen.if((0, codegen_1.not)(valid), () => {
	                    cxt.error();
	                    gen.break();
	                });
	            }, codegen_1.nil);
	        }
	    },
	};
	required$4.default = def;
	
	return required$4;
}

var limitItems = {};

var hasRequiredLimitItems;

function requireLimitItems () {
	if (hasRequiredLimitItems) return limitItems;
	hasRequiredLimitItems = 1;
	Object.defineProperty(limitItems, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const error = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxItems" ? "more" : "fewer";
	        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} items`;
	    },
	    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
	};
	const def = {
	    keyword: ["maxItems", "minItems"],
	    type: "array",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
	        cxt.fail$data((0, codegen_1._) `${data}.length ${op} ${schemaCode}`);
	    },
	};
	limitItems.default = def;
	
	return limitItems;
}

var uniqueItems = {};

var equal = {};

var hasRequiredEqual;

function requireEqual () {
	if (hasRequiredEqual) return equal;
	hasRequiredEqual = 1;
	Object.defineProperty(equal, "__esModule", { value: true });
	// https://github.com/ajv-validator/ajv/issues/889
	const equal$1 = requireFastDeepEqual();
	equal$1.code = 'require("ajv/dist/runtime/equal").default';
	equal.default = equal$1;
	
	return equal;
}

var hasRequiredUniqueItems;

function requireUniqueItems () {
	if (hasRequiredUniqueItems) return uniqueItems;
	hasRequiredUniqueItems = 1;
	Object.defineProperty(uniqueItems, "__esModule", { value: true });
	const dataType_1 = requireDataType();
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const equal_1 = requireEqual();
	const error = {
	    message: ({ params: { i, j } }) => (0, codegen_1.str) `must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
	    params: ({ params: { i, j } }) => (0, codegen_1._) `{i: ${i}, j: ${j}}`,
	};
	const def = {
	    keyword: "uniqueItems",
	    type: "array",
	    schemaType: "boolean",
	    $data: true,
	    error,
	    code(cxt) {
	        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
	        if (!$data && !schema)
	            return;
	        const valid = gen.let("valid");
	        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
	        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._) `${schemaCode} === false`);
	        cxt.ok(valid);
	        function validateUniqueItems() {
	            const i = gen.let("i", (0, codegen_1._) `${data}.length`);
	            const j = gen.let("j");
	            cxt.setParams({ i, j });
	            gen.assign(valid, true);
	            gen.if((0, codegen_1._) `${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
	        }
	        function canOptimize() {
	            return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
	        }
	        function loopN(i, j) {
	            const item = gen.name("item");
	            const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
	            const indices = gen.const("indices", (0, codegen_1._) `{}`);
	            gen.for((0, codegen_1._) `;${i}--;`, () => {
	                gen.let(item, (0, codegen_1._) `${data}[${i}]`);
	                gen.if(wrongType, (0, codegen_1._) `continue`);
	                if (itemTypes.length > 1)
	                    gen.if((0, codegen_1._) `typeof ${item} == "string"`, (0, codegen_1._) `${item} += "_"`);
	                gen
	                    .if((0, codegen_1._) `typeof ${indices}[${item}] == "number"`, () => {
	                    gen.assign(j, (0, codegen_1._) `${indices}[${item}]`);
	                    cxt.error();
	                    gen.assign(valid, false).break();
	                })
	                    .code((0, codegen_1._) `${indices}[${item}] = ${i}`);
	            });
	        }
	        function loopN2(i, j) {
	            const eql = (0, util_1.useFunc)(gen, equal_1.default);
	            const outer = gen.name("outer");
	            gen.label(outer).for((0, codegen_1._) `;${i}--;`, () => gen.for((0, codegen_1._) `${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._) `${eql}(${data}[${i}], ${data}[${j}])`, () => {
	                cxt.error();
	                gen.assign(valid, false).break(outer);
	            })));
	        }
	    },
	};
	uniqueItems.default = def;
	
	return uniqueItems;
}

var _const = {};

var hasRequired_const;

function require_const () {
	if (hasRequired_const) return _const;
	hasRequired_const = 1;
	Object.defineProperty(_const, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const equal_1 = requireEqual();
	const error = {
	    message: "must be equal to constant",
	    params: ({ schemaCode }) => (0, codegen_1._) `{allowedValue: ${schemaCode}}`,
	};
	const def = {
	    keyword: "const",
	    $data: true,
	    error,
	    code(cxt) {
	        const { gen, data, $data, schemaCode, schema } = cxt;
	        if ($data || (schema && typeof schema == "object")) {
	            cxt.fail$data((0, codegen_1._) `!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
	        }
	        else {
	            cxt.fail((0, codegen_1._) `${schema} !== ${data}`);
	        }
	    },
	};
	_const.default = def;
	
	return _const;
}

var _enum = {};

var hasRequired_enum;

function require_enum () {
	if (hasRequired_enum) return _enum;
	hasRequired_enum = 1;
	Object.defineProperty(_enum, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const equal_1 = requireEqual();
	const error = {
	    message: "must be equal to one of the allowed values",
	    params: ({ schemaCode }) => (0, codegen_1._) `{allowedValues: ${schemaCode}}`,
	};
	const def = {
	    keyword: "enum",
	    schemaType: "array",
	    $data: true,
	    error,
	    code(cxt) {
	        const { gen, data, $data, schema, schemaCode, it } = cxt;
	        if (!$data && schema.length === 0)
	            throw new Error("enum must have non-empty array");
	        const useLoop = schema.length >= it.opts.loopEnum;
	        let eql;
	        const getEql = () => (eql !== null && eql !== void 0 ? eql : (eql = (0, util_1.useFunc)(gen, equal_1.default)));
	        let valid;
	        if (useLoop || $data) {
	            valid = gen.let("valid");
	            cxt.block$data(valid, loopEnum);
	        }
	        else {
	            /* istanbul ignore if */
	            if (!Array.isArray(schema))
	                throw new Error("ajv implementation error");
	            const vSchema = gen.const("vSchema", schemaCode);
	            valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
	        }
	        cxt.pass(valid);
	        function loopEnum() {
	            gen.assign(valid, false);
	            gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._) `${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
	        }
	        function equalCode(vSchema, i) {
	            const sch = schema[i];
	            return typeof sch === "object" && sch !== null
	                ? (0, codegen_1._) `${getEql()}(${data}, ${vSchema}[${i}])`
	                : (0, codegen_1._) `${data} === ${sch}`;
	        }
	    },
	};
	_enum.default = def;
	
	return _enum;
}

var hasRequiredValidation$1;

function requireValidation$1 () {
	if (hasRequiredValidation$1) return validation$1;
	hasRequiredValidation$1 = 1;
	Object.defineProperty(validation$1, "__esModule", { value: true });
	const limitNumber_1 = requireLimitNumber$1();
	const multipleOf_1 = requireMultipleOf();
	const limitLength_1 = requireLimitLength();
	const pattern_1 = requirePattern();
	const limitProperties_1 = requireLimitProperties();
	const required_1 = requireRequired();
	const limitItems_1 = requireLimitItems();
	const uniqueItems_1 = requireUniqueItems();
	const const_1 = require_const();
	const enum_1 = require_enum();
	const validation = [
	    // number
	    limitNumber_1.default,
	    multipleOf_1.default,
	    // string
	    limitLength_1.default,
	    pattern_1.default,
	    // object
	    limitProperties_1.default,
	    required_1.default,
	    // array
	    limitItems_1.default,
	    uniqueItems_1.default,
	    // any
	    { keyword: "type", schemaType: ["string", "array"] },
	    { keyword: "nullable", schemaType: "boolean" },
	    const_1.default,
	    enum_1.default,
	];
	validation$1.default = validation;
	
	return validation$1;
}

var applicator = {};

var additionalItems = {};

var hasRequiredAdditionalItems;

function requireAdditionalItems () {
	if (hasRequiredAdditionalItems) return additionalItems;
	hasRequiredAdditionalItems = 1;
	Object.defineProperty(additionalItems, "__esModule", { value: true });
	additionalItems.validateAdditionalItems = void 0;
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
	    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
	};
	const def = {
	    keyword: "additionalItems",
	    type: "array",
	    schemaType: ["boolean", "object"],
	    before: "uniqueItems",
	    error,
	    code(cxt) {
	        const { parentSchema, it } = cxt;
	        const { items } = parentSchema;
	        if (!Array.isArray(items)) {
	            (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
	            return;
	        }
	        validateAdditionalItems(cxt, items);
	    },
	};
	function validateAdditionalItems(cxt, items) {
	    const { gen, schema, data, keyword, it } = cxt;
	    it.items = true;
	    const len = gen.const("len", (0, codegen_1._) `${data}.length`);
	    if (schema === false) {
	        cxt.setParams({ len: items.length });
	        cxt.pass((0, codegen_1._) `${len} <= ${items.length}`);
	    }
	    else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
	        const valid = gen.var("valid", (0, codegen_1._) `${len} <= ${items.length}`); // TODO var
	        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
	        cxt.ok(valid);
	    }
	    function validateItems(valid) {
	        gen.forRange("i", items.length, len, (i) => {
	            cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
	            if (!it.allErrors)
	                gen.if((0, codegen_1.not)(valid), () => gen.break());
	        });
	    }
	}
	additionalItems.validateAdditionalItems = validateAdditionalItems;
	additionalItems.default = def;
	
	return additionalItems;
}

var prefixItems = {};

var items = {};

var hasRequiredItems;

function requireItems () {
	if (hasRequiredItems) return items;
	hasRequiredItems = 1;
	Object.defineProperty(items, "__esModule", { value: true });
	items.validateTuple = void 0;
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const code_1 = requireCode();
	const def = {
	    keyword: "items",
	    type: "array",
	    schemaType: ["object", "array", "boolean"],
	    before: "uniqueItems",
	    code(cxt) {
	        const { schema, it } = cxt;
	        if (Array.isArray(schema))
	            return validateTuple(cxt, "additionalItems", schema);
	        it.items = true;
	        if ((0, util_1.alwaysValidSchema)(it, schema))
	            return;
	        cxt.ok((0, code_1.validateArray)(cxt));
	    },
	};
	function validateTuple(cxt, extraItems, schArr = cxt.schema) {
	    const { gen, parentSchema, data, keyword, it } = cxt;
	    checkStrictTuple(parentSchema);
	    if (it.opts.unevaluated && schArr.length && it.items !== true) {
	        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
	    }
	    const valid = gen.name("valid");
	    const len = gen.const("len", (0, codegen_1._) `${data}.length`);
	    schArr.forEach((sch, i) => {
	        if ((0, util_1.alwaysValidSchema)(it, sch))
	            return;
	        gen.if((0, codegen_1._) `${len} > ${i}`, () => cxt.subschema({
	            keyword,
	            schemaProp: i,
	            dataProp: i,
	        }, valid));
	        cxt.ok(valid);
	    });
	    function checkStrictTuple(sch) {
	        const { opts, errSchemaPath } = it;
	        const l = schArr.length;
	        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
	        if (opts.strictTuples && !fullTuple) {
	            const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
	            (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
	        }
	    }
	}
	items.validateTuple = validateTuple;
	items.default = def;
	
	return items;
}

var hasRequiredPrefixItems;

function requirePrefixItems () {
	if (hasRequiredPrefixItems) return prefixItems;
	hasRequiredPrefixItems = 1;
	Object.defineProperty(prefixItems, "__esModule", { value: true });
	const items_1 = requireItems();
	const def = {
	    keyword: "prefixItems",
	    type: "array",
	    schemaType: ["array"],
	    before: "uniqueItems",
	    code: (cxt) => (0, items_1.validateTuple)(cxt, "items"),
	};
	prefixItems.default = def;
	
	return prefixItems;
}

var items2020 = {};

var hasRequiredItems2020;

function requireItems2020 () {
	if (hasRequiredItems2020) return items2020;
	hasRequiredItems2020 = 1;
	Object.defineProperty(items2020, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const code_1 = requireCode();
	const additionalItems_1 = requireAdditionalItems();
	const error = {
	    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
	    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
	};
	const def = {
	    keyword: "items",
	    type: "array",
	    schemaType: ["object", "boolean"],
	    before: "uniqueItems",
	    error,
	    code(cxt) {
	        const { schema, parentSchema, it } = cxt;
	        const { prefixItems } = parentSchema;
	        it.items = true;
	        if ((0, util_1.alwaysValidSchema)(it, schema))
	            return;
	        if (prefixItems)
	            (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
	        else
	            cxt.ok((0, code_1.validateArray)(cxt));
	    },
	};
	items2020.default = def;
	
	return items2020;
}

var contains = {};

var hasRequiredContains;

function requireContains () {
	if (hasRequiredContains) return contains;
	hasRequiredContains = 1;
	Object.defineProperty(contains, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params: { min, max } }) => max === undefined
	        ? (0, codegen_1.str) `must contain at least ${min} valid item(s)`
	        : (0, codegen_1.str) `must contain at least ${min} and no more than ${max} valid item(s)`,
	    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._) `{minContains: ${min}}` : (0, codegen_1._) `{minContains: ${min}, maxContains: ${max}}`,
	};
	const def = {
	    keyword: "contains",
	    type: "array",
	    schemaType: ["object", "boolean"],
	    before: "uniqueItems",
	    trackErrors: true,
	    error,
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        let min;
	        let max;
	        const { minContains, maxContains } = parentSchema;
	        if (it.opts.next) {
	            min = minContains === undefined ? 1 : minContains;
	            max = maxContains;
	        }
	        else {
	            min = 1;
	        }
	        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
	        cxt.setParams({ min, max });
	        if (max === undefined && min === 0) {
	            (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
	            return;
	        }
	        if (max !== undefined && min > max) {
	            (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
	            cxt.fail();
	            return;
	        }
	        if ((0, util_1.alwaysValidSchema)(it, schema)) {
	            let cond = (0, codegen_1._) `${len} >= ${min}`;
	            if (max !== undefined)
	                cond = (0, codegen_1._) `${cond} && ${len} <= ${max}`;
	            cxt.pass(cond);
	            return;
	        }
	        it.items = true;
	        const valid = gen.name("valid");
	        if (max === undefined && min === 1) {
	            validateItems(valid, () => gen.if(valid, () => gen.break()));
	        }
	        else if (min === 0) {
	            gen.let(valid, true);
	            if (max !== undefined)
	                gen.if((0, codegen_1._) `${data}.length > 0`, validateItemsWithCount);
	        }
	        else {
	            gen.let(valid, false);
	            validateItemsWithCount();
	        }
	        cxt.result(valid, () => cxt.reset());
	        function validateItemsWithCount() {
	            const schValid = gen.name("_valid");
	            const count = gen.let("count", 0);
	            validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
	        }
	        function validateItems(_valid, block) {
	            gen.forRange("i", 0, len, (i) => {
	                cxt.subschema({
	                    keyword: "contains",
	                    dataProp: i,
	                    dataPropType: util_1.Type.Num,
	                    compositeRule: true,
	                }, _valid);
	                block();
	            });
	        }
	        function checkLimits(count) {
	            gen.code((0, codegen_1._) `${count}++`);
	            if (max === undefined) {
	                gen.if((0, codegen_1._) `${count} >= ${min}`, () => gen.assign(valid, true).break());
	            }
	            else {
	                gen.if((0, codegen_1._) `${count} > ${max}`, () => gen.assign(valid, false).break());
	                if (min === 1)
	                    gen.assign(valid, true);
	                else
	                    gen.if((0, codegen_1._) `${count} >= ${min}`, () => gen.assign(valid, true));
	            }
	        }
	    },
	};
	contains.default = def;
	
	return contains;
}

var dependencies$1 = {};

var hasRequiredDependencies;

function requireDependencies () {
	if (hasRequiredDependencies) return dependencies$1;
	hasRequiredDependencies = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
		const codegen_1 = requireCodegen();
		const util_1 = requireUtil();
		const code_1 = requireCode();
		exports.error = {
		    message: ({ params: { property, depsCount, deps } }) => {
		        const property_ies = depsCount === 1 ? "property" : "properties";
		        return (0, codegen_1.str) `must have ${property_ies} ${deps} when property ${property} is present`;
		    },
		    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._) `{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`, // TODO change to reference
		};
		const def = {
		    keyword: "dependencies",
		    type: "object",
		    schemaType: "object",
		    error: exports.error,
		    code(cxt) {
		        const [propDeps, schDeps] = splitDependencies(cxt);
		        validatePropertyDeps(cxt, propDeps);
		        validateSchemaDeps(cxt, schDeps);
		    },
		};
		function splitDependencies({ schema }) {
		    const propertyDeps = {};
		    const schemaDeps = {};
		    for (const key in schema) {
		        if (key === "__proto__")
		            continue;
		        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
		        deps[key] = schema[key];
		    }
		    return [propertyDeps, schemaDeps];
		}
		function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
		    const { gen, data, it } = cxt;
		    if (Object.keys(propertyDeps).length === 0)
		        return;
		    const missing = gen.let("missing");
		    for (const prop in propertyDeps) {
		        const deps = propertyDeps[prop];
		        if (deps.length === 0)
		            continue;
		        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
		        cxt.setParams({
		            property: prop,
		            depsCount: deps.length,
		            deps: deps.join(", "),
		        });
		        if (it.allErrors) {
		            gen.if(hasProperty, () => {
		                for (const depProp of deps) {
		                    (0, code_1.checkReportMissingProp)(cxt, depProp);
		                }
		            });
		        }
		        else {
		            gen.if((0, codegen_1._) `${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
		            (0, code_1.reportMissingProp)(cxt, missing);
		            gen.else();
		        }
		    }
		}
		exports.validatePropertyDeps = validatePropertyDeps;
		function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
		    const { gen, data, keyword, it } = cxt;
		    const valid = gen.name("valid");
		    for (const prop in schemaDeps) {
		        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
		            continue;
		        gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
		            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
		            cxt.mergeValidEvaluated(schCxt, valid);
		        }, () => gen.var(valid, true) // TODO var
		        );
		        cxt.ok(valid);
		    }
		}
		exports.validateSchemaDeps = validateSchemaDeps;
		exports.default = def;
		
	} (dependencies$1));
	return dependencies$1;
}

var propertyNames = {};

var hasRequiredPropertyNames;

function requirePropertyNames () {
	if (hasRequiredPropertyNames) return propertyNames;
	hasRequiredPropertyNames = 1;
	Object.defineProperty(propertyNames, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: "property name must be valid",
	    params: ({ params }) => (0, codegen_1._) `{propertyName: ${params.propertyName}}`,
	};
	const def = {
	    keyword: "propertyNames",
	    type: "object",
	    schemaType: ["object", "boolean"],
	    error,
	    code(cxt) {
	        const { gen, schema, data, it } = cxt;
	        if ((0, util_1.alwaysValidSchema)(it, schema))
	            return;
	        const valid = gen.name("valid");
	        gen.forIn("key", data, (key) => {
	            cxt.setParams({ propertyName: key });
	            cxt.subschema({
	                keyword: "propertyNames",
	                data: key,
	                dataTypes: ["string"],
	                propertyName: key,
	                compositeRule: true,
	            }, valid);
	            gen.if((0, codegen_1.not)(valid), () => {
	                cxt.error(true);
	                if (!it.allErrors)
	                    gen.break();
	            });
	        });
	        cxt.ok(valid);
	    },
	};
	propertyNames.default = def;
	
	return propertyNames;
}

var additionalProperties$3 = {};

var hasRequiredAdditionalProperties;

function requireAdditionalProperties () {
	if (hasRequiredAdditionalProperties) return additionalProperties$3;
	hasRequiredAdditionalProperties = 1;
	Object.defineProperty(additionalProperties$3, "__esModule", { value: true });
	const code_1 = requireCode();
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const util_1 = requireUtil();
	const error = {
	    message: "must NOT have additional properties",
	    params: ({ params }) => (0, codegen_1._) `{additionalProperty: ${params.additionalProperty}}`,
	};
	const def = {
	    keyword: "additionalProperties",
	    type: ["object"],
	    schemaType: ["boolean", "object"],
	    allowUndefined: true,
	    trackErrors: true,
	    error,
	    code(cxt) {
	        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
	        /* istanbul ignore if */
	        if (!errsCount)
	            throw new Error("ajv implementation error");
	        const { allErrors, opts } = it;
	        it.props = true;
	        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
	            return;
	        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
	        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
	        checkAdditionalProperties();
	        cxt.ok((0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
	        function checkAdditionalProperties() {
	            gen.forIn("key", data, (key) => {
	                if (!props.length && !patProps.length)
	                    additionalPropertyCode(key);
	                else
	                    gen.if(isAdditional(key), () => additionalPropertyCode(key));
	            });
	        }
	        function isAdditional(key) {
	            let definedProp;
	            if (props.length > 8) {
	                // TODO maybe an option instead of hard-coded 8?
	                const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
	                definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
	            }
	            else if (props.length) {
	                definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._) `${key} === ${p}`));
	            }
	            else {
	                definedProp = codegen_1.nil;
	            }
	            if (patProps.length) {
	                definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._) `${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
	            }
	            return (0, codegen_1.not)(definedProp);
	        }
	        function deleteAdditional(key) {
	            gen.code((0, codegen_1._) `delete ${data}[${key}]`);
	        }
	        function additionalPropertyCode(key) {
	            if (opts.removeAdditional === "all" || (opts.removeAdditional && schema === false)) {
	                deleteAdditional(key);
	                return;
	            }
	            if (schema === false) {
	                cxt.setParams({ additionalProperty: key });
	                cxt.error();
	                if (!allErrors)
	                    gen.break();
	                return;
	            }
	            if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
	                const valid = gen.name("valid");
	                if (opts.removeAdditional === "failing") {
	                    applyAdditionalSchema(key, valid, false);
	                    gen.if((0, codegen_1.not)(valid), () => {
	                        cxt.reset();
	                        deleteAdditional(key);
	                    });
	                }
	                else {
	                    applyAdditionalSchema(key, valid);
	                    if (!allErrors)
	                        gen.if((0, codegen_1.not)(valid), () => gen.break());
	                }
	            }
	        }
	        function applyAdditionalSchema(key, valid, errors) {
	            const subschema = {
	                keyword: "additionalProperties",
	                dataProp: key,
	                dataPropType: util_1.Type.Str,
	            };
	            if (errors === false) {
	                Object.assign(subschema, {
	                    compositeRule: true,
	                    createErrors: false,
	                    allErrors: false,
	                });
	            }
	            cxt.subschema(subschema, valid);
	        }
	    },
	};
	additionalProperties$3.default = def;
	
	return additionalProperties$3;
}

var properties$d = {};

var hasRequiredProperties;

function requireProperties () {
	if (hasRequiredProperties) return properties$d;
	hasRequiredProperties = 1;
	Object.defineProperty(properties$d, "__esModule", { value: true });
	const validate_1 = requireValidate();
	const code_1 = requireCode();
	const util_1 = requireUtil();
	const additionalProperties_1 = requireAdditionalProperties();
	const def = {
	    keyword: "properties",
	    type: "object",
	    schemaType: "object",
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
	            additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
	        }
	        const allProps = (0, code_1.allSchemaProperties)(schema);
	        for (const prop of allProps) {
	            it.definedProperties.add(prop);
	        }
	        if (it.opts.unevaluated && allProps.length && it.props !== true) {
	            it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
	        }
	        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
	        if (properties.length === 0)
	            return;
	        const valid = gen.name("valid");
	        for (const prop of properties) {
	            if (hasDefault(prop)) {
	                applyPropertySchema(prop);
	            }
	            else {
	                gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
	                applyPropertySchema(prop);
	                if (!it.allErrors)
	                    gen.else().var(valid, true);
	                gen.endIf();
	            }
	            cxt.it.definedProperties.add(prop);
	            cxt.ok(valid);
	        }
	        function hasDefault(prop) {
	            return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
	        }
	        function applyPropertySchema(prop) {
	            cxt.subschema({
	                keyword: "properties",
	                schemaProp: prop,
	                dataProp: prop,
	            }, valid);
	        }
	    },
	};
	properties$d.default = def;
	
	return properties$d;
}

var patternProperties$2 = {};

var hasRequiredPatternProperties;

function requirePatternProperties () {
	if (hasRequiredPatternProperties) return patternProperties$2;
	hasRequiredPatternProperties = 1;
	Object.defineProperty(patternProperties$2, "__esModule", { value: true });
	const code_1 = requireCode();
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const util_2 = requireUtil();
	const def = {
	    keyword: "patternProperties",
	    type: "object",
	    schemaType: "object",
	    code(cxt) {
	        const { gen, schema, data, parentSchema, it } = cxt;
	        const { opts } = it;
	        const patterns = (0, code_1.allSchemaProperties)(schema);
	        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
	        if (patterns.length === 0 ||
	            (alwaysValidPatterns.length === patterns.length &&
	                (!it.opts.unevaluated || it.props === true))) {
	            return;
	        }
	        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
	        const valid = gen.name("valid");
	        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
	            it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
	        }
	        const { props } = it;
	        validatePatternProperties();
	        function validatePatternProperties() {
	            for (const pat of patterns) {
	                if (checkProperties)
	                    checkMatchingProperties(pat);
	                if (it.allErrors) {
	                    validateProperties(pat);
	                }
	                else {
	                    gen.var(valid, true); // TODO var
	                    validateProperties(pat);
	                    gen.if(valid);
	                }
	            }
	        }
	        function checkMatchingProperties(pat) {
	            for (const prop in checkProperties) {
	                if (new RegExp(pat).test(prop)) {
	                    (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
	                }
	            }
	        }
	        function validateProperties(pat) {
	            gen.forIn("key", data, (key) => {
	                gen.if((0, codegen_1._) `${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
	                    const alwaysValid = alwaysValidPatterns.includes(pat);
	                    if (!alwaysValid) {
	                        cxt.subschema({
	                            keyword: "patternProperties",
	                            schemaProp: pat,
	                            dataProp: key,
	                            dataPropType: util_2.Type.Str,
	                        }, valid);
	                    }
	                    if (it.opts.unevaluated && props !== true) {
	                        gen.assign((0, codegen_1._) `${props}[${key}]`, true);
	                    }
	                    else if (!alwaysValid && !it.allErrors) {
	                        // can short-circuit if `unevaluatedProperties` is not supported (opts.next === false)
	                        // or if all properties were evaluated (props === true)
	                        gen.if((0, codegen_1.not)(valid), () => gen.break());
	                    }
	                });
	            });
	        }
	    },
	};
	patternProperties$2.default = def;
	
	return patternProperties$2;
}

var not = {};

var hasRequiredNot;

function requireNot () {
	if (hasRequiredNot) return not;
	hasRequiredNot = 1;
	Object.defineProperty(not, "__esModule", { value: true });
	const util_1 = requireUtil();
	const def = {
	    keyword: "not",
	    schemaType: ["object", "boolean"],
	    trackErrors: true,
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        if ((0, util_1.alwaysValidSchema)(it, schema)) {
	            cxt.fail();
	            return;
	        }
	        const valid = gen.name("valid");
	        cxt.subschema({
	            keyword: "not",
	            compositeRule: true,
	            createErrors: false,
	            allErrors: false,
	        }, valid);
	        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
	    },
	    error: { message: "must NOT be valid" },
	};
	not.default = def;
	
	return not;
}

var anyOf$1 = {};

var hasRequiredAnyOf;

function requireAnyOf () {
	if (hasRequiredAnyOf) return anyOf$1;
	hasRequiredAnyOf = 1;
	Object.defineProperty(anyOf$1, "__esModule", { value: true });
	const code_1 = requireCode();
	const def = {
	    keyword: "anyOf",
	    schemaType: "array",
	    trackErrors: true,
	    code: code_1.validateUnion,
	    error: { message: "must match a schema in anyOf" },
	};
	anyOf$1.default = def;
	
	return anyOf$1;
}

var oneOf = {};

var hasRequiredOneOf;

function requireOneOf () {
	if (hasRequiredOneOf) return oneOf;
	hasRequiredOneOf = 1;
	Object.defineProperty(oneOf, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: "must match exactly one schema in oneOf",
	    params: ({ params }) => (0, codegen_1._) `{passingSchemas: ${params.passing}}`,
	};
	const def = {
	    keyword: "oneOf",
	    schemaType: "array",
	    trackErrors: true,
	    error,
	    code(cxt) {
	        const { gen, schema, parentSchema, it } = cxt;
	        /* istanbul ignore if */
	        if (!Array.isArray(schema))
	            throw new Error("ajv implementation error");
	        if (it.opts.discriminator && parentSchema.discriminator)
	            return;
	        const schArr = schema;
	        const valid = gen.let("valid", false);
	        const passing = gen.let("passing", null);
	        const schValid = gen.name("_valid");
	        cxt.setParams({ passing });
	        // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas
	        gen.block(validateOneOf);
	        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
	        function validateOneOf() {
	            schArr.forEach((sch, i) => {
	                let schCxt;
	                if ((0, util_1.alwaysValidSchema)(it, sch)) {
	                    gen.var(schValid, true);
	                }
	                else {
	                    schCxt = cxt.subschema({
	                        keyword: "oneOf",
	                        schemaProp: i,
	                        compositeRule: true,
	                    }, schValid);
	                }
	                if (i > 0) {
	                    gen
	                        .if((0, codegen_1._) `${schValid} && ${valid}`)
	                        .assign(valid, false)
	                        .assign(passing, (0, codegen_1._) `[${passing}, ${i}]`)
	                        .else();
	                }
	                gen.if(schValid, () => {
	                    gen.assign(valid, true);
	                    gen.assign(passing, i);
	                    if (schCxt)
	                        cxt.mergeEvaluated(schCxt, codegen_1.Name);
	                });
	            });
	        }
	    },
	};
	oneOf.default = def;
	
	return oneOf;
}

var allOf$1 = {};

var hasRequiredAllOf;

function requireAllOf () {
	if (hasRequiredAllOf) return allOf$1;
	hasRequiredAllOf = 1;
	Object.defineProperty(allOf$1, "__esModule", { value: true });
	const util_1 = requireUtil();
	const def = {
	    keyword: "allOf",
	    schemaType: "array",
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        /* istanbul ignore if */
	        if (!Array.isArray(schema))
	            throw new Error("ajv implementation error");
	        const valid = gen.name("valid");
	        schema.forEach((sch, i) => {
	            if ((0, util_1.alwaysValidSchema)(it, sch))
	                return;
	            const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
	            cxt.ok(valid);
	            cxt.mergeEvaluated(schCxt);
	        });
	    },
	};
	allOf$1.default = def;
	
	return allOf$1;
}

var _if = {};

var hasRequired_if;

function require_if () {
	if (hasRequired_if) return _if;
	hasRequired_if = 1;
	Object.defineProperty(_if, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params }) => (0, codegen_1.str) `must match "${params.ifClause}" schema`,
	    params: ({ params }) => (0, codegen_1._) `{failingKeyword: ${params.ifClause}}`,
	};
	const def = {
	    keyword: "if",
	    schemaType: ["object", "boolean"],
	    trackErrors: true,
	    error,
	    code(cxt) {
	        const { gen, parentSchema, it } = cxt;
	        if (parentSchema.then === undefined && parentSchema.else === undefined) {
	            (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
	        }
	        const hasThen = hasSchema(it, "then");
	        const hasElse = hasSchema(it, "else");
	        if (!hasThen && !hasElse)
	            return;
	        const valid = gen.let("valid", true);
	        const schValid = gen.name("_valid");
	        validateIf();
	        cxt.reset();
	        if (hasThen && hasElse) {
	            const ifClause = gen.let("ifClause");
	            cxt.setParams({ ifClause });
	            gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
	        }
	        else if (hasThen) {
	            gen.if(schValid, validateClause("then"));
	        }
	        else {
	            gen.if((0, codegen_1.not)(schValid), validateClause("else"));
	        }
	        cxt.pass(valid, () => cxt.error(true));
	        function validateIf() {
	            const schCxt = cxt.subschema({
	                keyword: "if",
	                compositeRule: true,
	                createErrors: false,
	                allErrors: false,
	            }, schValid);
	            cxt.mergeEvaluated(schCxt);
	        }
	        function validateClause(keyword, ifClause) {
	            return () => {
	                const schCxt = cxt.subschema({ keyword }, schValid);
	                gen.assign(valid, schValid);
	                cxt.mergeValidEvaluated(schCxt, valid);
	                if (ifClause)
	                    gen.assign(ifClause, (0, codegen_1._) `${keyword}`);
	                else
	                    cxt.setParams({ ifClause: keyword });
	            };
	        }
	    },
	};
	function hasSchema(it, keyword) {
	    const schema = it.schema[keyword];
	    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
	}
	_if.default = def;
	
	return _if;
}

var thenElse = {};

var hasRequiredThenElse;

function requireThenElse () {
	if (hasRequiredThenElse) return thenElse;
	hasRequiredThenElse = 1;
	Object.defineProperty(thenElse, "__esModule", { value: true });
	const util_1 = requireUtil();
	const def = {
	    keyword: ["then", "else"],
	    schemaType: ["object", "boolean"],
	    code({ keyword, parentSchema, it }) {
	        if (parentSchema.if === undefined)
	            (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
	    },
	};
	thenElse.default = def;
	
	return thenElse;
}

var hasRequiredApplicator;

function requireApplicator () {
	if (hasRequiredApplicator) return applicator;
	hasRequiredApplicator = 1;
	Object.defineProperty(applicator, "__esModule", { value: true });
	const additionalItems_1 = requireAdditionalItems();
	const prefixItems_1 = requirePrefixItems();
	const items_1 = requireItems();
	const items2020_1 = requireItems2020();
	const contains_1 = requireContains();
	const dependencies_1 = requireDependencies();
	const propertyNames_1 = requirePropertyNames();
	const additionalProperties_1 = requireAdditionalProperties();
	const properties_1 = requireProperties();
	const patternProperties_1 = requirePatternProperties();
	const not_1 = requireNot();
	const anyOf_1 = requireAnyOf();
	const oneOf_1 = requireOneOf();
	const allOf_1 = requireAllOf();
	const if_1 = require_if();
	const thenElse_1 = requireThenElse();
	function getApplicator(draft2020 = false) {
	    const applicator = [
	        // any
	        not_1.default,
	        anyOf_1.default,
	        oneOf_1.default,
	        allOf_1.default,
	        if_1.default,
	        thenElse_1.default,
	        // object
	        propertyNames_1.default,
	        additionalProperties_1.default,
	        dependencies_1.default,
	        properties_1.default,
	        patternProperties_1.default,
	    ];
	    // array
	    if (draft2020)
	        applicator.push(prefixItems_1.default, items2020_1.default);
	    else
	        applicator.push(additionalItems_1.default, items_1.default);
	    applicator.push(contains_1.default);
	    return applicator;
	}
	applicator.default = getApplicator;
	
	return applicator;
}

var dynamic = {};

var dynamicAnchor = {};

var hasRequiredDynamicAnchor;

function requireDynamicAnchor () {
	if (hasRequiredDynamicAnchor) return dynamicAnchor;
	hasRequiredDynamicAnchor = 1;
	Object.defineProperty(dynamicAnchor, "__esModule", { value: true });
	dynamicAnchor.dynamicAnchor = void 0;
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const compile_1 = requireCompile();
	const ref_1 = requireRef$1();
	const def = {
	    keyword: "$dynamicAnchor",
	    schemaType: "string",
	    code: (cxt) => dynamicAnchor$1(cxt, cxt.schema),
	};
	function dynamicAnchor$1(cxt, anchor) {
	    const { gen, it } = cxt;
	    it.schemaEnv.root.dynamicAnchors[anchor] = true;
	    const v = (0, codegen_1._) `${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
	    const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
	    gen.if((0, codegen_1._) `!${v}`, () => gen.assign(v, validate));
	}
	dynamicAnchor.dynamicAnchor = dynamicAnchor$1;
	function _getValidate(cxt) {
	    const { schemaEnv, schema, self } = cxt.it;
	    const { root, baseId, localRefs, meta } = schemaEnv.root;
	    const { schemaId } = self.opts;
	    const sch = new compile_1.SchemaEnv({ schema, schemaId, root, baseId, localRefs, meta });
	    compile_1.compileSchema.call(self, sch);
	    return (0, ref_1.getValidate)(cxt, sch);
	}
	dynamicAnchor.default = def;
	
	return dynamicAnchor;
}

var dynamicRef = {};

var hasRequiredDynamicRef;

function requireDynamicRef () {
	if (hasRequiredDynamicRef) return dynamicRef;
	hasRequiredDynamicRef = 1;
	Object.defineProperty(dynamicRef, "__esModule", { value: true });
	dynamicRef.dynamicRef = void 0;
	const codegen_1 = requireCodegen();
	const names_1 = requireNames();
	const ref_1 = requireRef$1();
	const def = {
	    keyword: "$dynamicRef",
	    schemaType: "string",
	    code: (cxt) => dynamicRef$1(cxt, cxt.schema),
	};
	function dynamicRef$1(cxt, ref) {
	    const { gen, keyword, it } = cxt;
	    if (ref[0] !== "#")
	        throw new Error(`"${keyword}" only supports hash fragment reference`);
	    const anchor = ref.slice(1);
	    if (it.allErrors) {
	        _dynamicRef();
	    }
	    else {
	        const valid = gen.let("valid", false);
	        _dynamicRef(valid);
	        cxt.ok(valid);
	    }
	    function _dynamicRef(valid) {
	        // TODO the assumption here is that `recursiveRef: #` always points to the root
	        // of the schema object, which is not correct, because there may be $id that
	        // makes # point to it, and the target schema may not contain dynamic/recursiveAnchor.
	        // Because of that 2 tests in recursiveRef.json fail.
	        // This is a similar problem to #815 (`$id` doesn't alter resolution scope for `{ "$ref": "#" }`).
	        // (This problem is not tested in JSON-Schema-Test-Suite)
	        if (it.schemaEnv.root.dynamicAnchors[anchor]) {
	            const v = gen.let("_v", (0, codegen_1._) `${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
	            gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
	        }
	        else {
	            _callRef(it.validateName, valid)();
	        }
	    }
	    function _callRef(validate, valid) {
	        return valid
	            ? () => gen.block(() => {
	                (0, ref_1.callRef)(cxt, validate);
	                gen.let(valid, true);
	            })
	            : () => (0, ref_1.callRef)(cxt, validate);
	    }
	}
	dynamicRef.dynamicRef = dynamicRef$1;
	dynamicRef.default = def;
	
	return dynamicRef;
}

var recursiveAnchor = {};

var hasRequiredRecursiveAnchor;

function requireRecursiveAnchor () {
	if (hasRequiredRecursiveAnchor) return recursiveAnchor;
	hasRequiredRecursiveAnchor = 1;
	Object.defineProperty(recursiveAnchor, "__esModule", { value: true });
	const dynamicAnchor_1 = requireDynamicAnchor();
	const util_1 = requireUtil();
	const def = {
	    keyword: "$recursiveAnchor",
	    schemaType: "boolean",
	    code(cxt) {
	        if (cxt.schema)
	            (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
	        else
	            (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
	    },
	};
	recursiveAnchor.default = def;
	
	return recursiveAnchor;
}

var recursiveRef = {};

var hasRequiredRecursiveRef;

function requireRecursiveRef () {
	if (hasRequiredRecursiveRef) return recursiveRef;
	hasRequiredRecursiveRef = 1;
	Object.defineProperty(recursiveRef, "__esModule", { value: true });
	const dynamicRef_1 = requireDynamicRef();
	const def = {
	    keyword: "$recursiveRef",
	    schemaType: "string",
	    code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema),
	};
	recursiveRef.default = def;
	
	return recursiveRef;
}

var hasRequiredDynamic;

function requireDynamic () {
	if (hasRequiredDynamic) return dynamic;
	hasRequiredDynamic = 1;
	Object.defineProperty(dynamic, "__esModule", { value: true });
	const dynamicAnchor_1 = requireDynamicAnchor();
	const dynamicRef_1 = requireDynamicRef();
	const recursiveAnchor_1 = requireRecursiveAnchor();
	const recursiveRef_1 = requireRecursiveRef();
	const dynamic$1 = [dynamicAnchor_1.default, dynamicRef_1.default, recursiveAnchor_1.default, recursiveRef_1.default];
	dynamic.default = dynamic$1;
	
	return dynamic;
}

var next$2 = {};

var dependentRequired = {};

var hasRequiredDependentRequired;

function requireDependentRequired () {
	if (hasRequiredDependentRequired) return dependentRequired;
	hasRequiredDependentRequired = 1;
	Object.defineProperty(dependentRequired, "__esModule", { value: true });
	const dependencies_1 = requireDependencies();
	const def = {
	    keyword: "dependentRequired",
	    type: "object",
	    schemaType: "object",
	    error: dependencies_1.error,
	    code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt),
	};
	dependentRequired.default = def;
	
	return dependentRequired;
}

var dependentSchemas = {};

var hasRequiredDependentSchemas;

function requireDependentSchemas () {
	if (hasRequiredDependentSchemas) return dependentSchemas;
	hasRequiredDependentSchemas = 1;
	Object.defineProperty(dependentSchemas, "__esModule", { value: true });
	const dependencies_1 = requireDependencies();
	const def = {
	    keyword: "dependentSchemas",
	    type: "object",
	    schemaType: "object",
	    code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt),
	};
	dependentSchemas.default = def;
	
	return dependentSchemas;
}

var limitContains = {};

var hasRequiredLimitContains;

function requireLimitContains () {
	if (hasRequiredLimitContains) return limitContains;
	hasRequiredLimitContains = 1;
	Object.defineProperty(limitContains, "__esModule", { value: true });
	const util_1 = requireUtil();
	const def = {
	    keyword: ["maxContains", "minContains"],
	    type: "array",
	    schemaType: "number",
	    code({ keyword, parentSchema, it }) {
	        if (parentSchema.contains === undefined) {
	            (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
	        }
	    },
	};
	limitContains.default = def;
	
	return limitContains;
}

var hasRequiredNext$2;

function requireNext$2 () {
	if (hasRequiredNext$2) return next$2;
	hasRequiredNext$2 = 1;
	Object.defineProperty(next$2, "__esModule", { value: true });
	const dependentRequired_1 = requireDependentRequired();
	const dependentSchemas_1 = requireDependentSchemas();
	const limitContains_1 = requireLimitContains();
	const next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
	next$2.default = next;
	
	return next$2;
}

var unevaluated = {};

var unevaluatedProperties$1 = {};

var hasRequiredUnevaluatedProperties;

function requireUnevaluatedProperties () {
	if (hasRequiredUnevaluatedProperties) return unevaluatedProperties$1;
	hasRequiredUnevaluatedProperties = 1;
	Object.defineProperty(unevaluatedProperties$1, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const names_1 = requireNames();
	const error = {
	    message: "must NOT have unevaluated properties",
	    params: ({ params }) => (0, codegen_1._) `{unevaluatedProperty: ${params.unevaluatedProperty}}`,
	};
	const def = {
	    keyword: "unevaluatedProperties",
	    type: "object",
	    schemaType: ["boolean", "object"],
	    trackErrors: true,
	    error,
	    code(cxt) {
	        const { gen, schema, data, errsCount, it } = cxt;
	        /* istanbul ignore if */
	        if (!errsCount)
	            throw new Error("ajv implementation error");
	        const { allErrors, props } = it;
	        if (props instanceof codegen_1.Name) {
	            gen.if((0, codegen_1._) `${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
	        }
	        else if (props !== true) {
	            gen.forIn("key", data, (key) => props === undefined
	                ? unevaluatedPropCode(key)
	                : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
	        }
	        it.props = true;
	        cxt.ok((0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
	        function unevaluatedPropCode(key) {
	            if (schema === false) {
	                cxt.setParams({ unevaluatedProperty: key });
	                cxt.error();
	                if (!allErrors)
	                    gen.break();
	                return;
	            }
	            if (!(0, util_1.alwaysValidSchema)(it, schema)) {
	                const valid = gen.name("valid");
	                cxt.subschema({
	                    keyword: "unevaluatedProperties",
	                    dataProp: key,
	                    dataPropType: util_1.Type.Str,
	                }, valid);
	                if (!allErrors)
	                    gen.if((0, codegen_1.not)(valid), () => gen.break());
	            }
	        }
	        function unevaluatedDynamic(evaluatedProps, key) {
	            return (0, codegen_1._) `!${evaluatedProps} || !${evaluatedProps}[${key}]`;
	        }
	        function unevaluatedStatic(evaluatedProps, key) {
	            const ps = [];
	            for (const p in evaluatedProps) {
	                if (evaluatedProps[p] === true)
	                    ps.push((0, codegen_1._) `${key} !== ${p}`);
	            }
	            return (0, codegen_1.and)(...ps);
	        }
	    },
	};
	unevaluatedProperties$1.default = def;
	
	return unevaluatedProperties$1;
}

var unevaluatedItems = {};

var hasRequiredUnevaluatedItems;

function requireUnevaluatedItems () {
	if (hasRequiredUnevaluatedItems) return unevaluatedItems;
	hasRequiredUnevaluatedItems = 1;
	Object.defineProperty(unevaluatedItems, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
	    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
	};
	const def = {
	    keyword: "unevaluatedItems",
	    type: "array",
	    schemaType: ["boolean", "object"],
	    error,
	    code(cxt) {
	        const { gen, schema, data, it } = cxt;
	        const items = it.items || 0;
	        if (items === true)
	            return;
	        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
	        if (schema === false) {
	            cxt.setParams({ len: items });
	            cxt.fail((0, codegen_1._) `${len} > ${items}`);
	        }
	        else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
	            const valid = gen.var("valid", (0, codegen_1._) `${len} <= ${items}`);
	            gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
	            cxt.ok(valid);
	        }
	        it.items = true;
	        function validateItems(valid, from) {
	            gen.forRange("i", from, len, (i) => {
	                cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
	                if (!it.allErrors)
	                    gen.if((0, codegen_1.not)(valid), () => gen.break());
	            });
	        }
	    },
	};
	unevaluatedItems.default = def;
	
	return unevaluatedItems;
}

var hasRequiredUnevaluated;

function requireUnevaluated () {
	if (hasRequiredUnevaluated) return unevaluated;
	hasRequiredUnevaluated = 1;
	Object.defineProperty(unevaluated, "__esModule", { value: true });
	const unevaluatedProperties_1 = requireUnevaluatedProperties();
	const unevaluatedItems_1 = requireUnevaluatedItems();
	const unevaluated$1 = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
	unevaluated.default = unevaluated$1;
	
	return unevaluated;
}

var format$1 = {};

var format = {};

var hasRequiredFormat$1;

function requireFormat$1 () {
	if (hasRequiredFormat$1) return format;
	hasRequiredFormat$1 = 1;
	Object.defineProperty(format, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const error = {
	    message: ({ schemaCode }) => (0, codegen_1.str) `must match format "${schemaCode}"`,
	    params: ({ schemaCode }) => (0, codegen_1._) `{format: ${schemaCode}}`,
	};
	const def = {
	    keyword: "format",
	    type: ["number", "string"],
	    schemaType: "string",
	    $data: true,
	    error,
	    code(cxt, ruleType) {
	        const { gen, data, $data, schema, schemaCode, it } = cxt;
	        const { opts, errSchemaPath, schemaEnv, self } = it;
	        if (!opts.validateFormats)
	            return;
	        if ($data)
	            validate$DataFormat();
	        else
	            validateFormat();
	        function validate$DataFormat() {
	            const fmts = gen.scopeValue("formats", {
	                ref: self.formats,
	                code: opts.code.formats,
	            });
	            const fDef = gen.const("fDef", (0, codegen_1._) `${fmts}[${schemaCode}]`);
	            const fType = gen.let("fType");
	            const format = gen.let("format");
	            // TODO simplify
	            gen.if((0, codegen_1._) `typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._) `${fDef}.type || "string"`).assign(format, (0, codegen_1._) `${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._) `"string"`).assign(format, fDef));
	            cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
	            function unknownFmt() {
	                if (opts.strictSchema === false)
	                    return codegen_1.nil;
	                return (0, codegen_1._) `${schemaCode} && !${format}`;
	            }
	            function invalidFmt() {
	                const callFormat = schemaEnv.$async
	                    ? (0, codegen_1._) `(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))`
	                    : (0, codegen_1._) `${format}(${data})`;
	                const validData = (0, codegen_1._) `(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
	                return (0, codegen_1._) `${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
	            }
	        }
	        function validateFormat() {
	            const formatDef = self.formats[schema];
	            if (!formatDef) {
	                unknownFormat();
	                return;
	            }
	            if (formatDef === true)
	                return;
	            const [fmtType, format, fmtRef] = getFormat(formatDef);
	            if (fmtType === ruleType)
	                cxt.pass(validCondition());
	            function unknownFormat() {
	                if (opts.strictSchema === false) {
	                    self.logger.warn(unknownMsg());
	                    return;
	                }
	                throw new Error(unknownMsg());
	                function unknownMsg() {
	                    return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
	                }
	            }
	            function getFormat(fmtDef) {
	                const code = fmtDef instanceof RegExp
	                    ? (0, codegen_1.regexpCode)(fmtDef)
	                    : opts.code.formats
	                        ? (0, codegen_1._) `${opts.code.formats}${(0, codegen_1.getProperty)(schema)}`
	                        : undefined;
	                const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
	                if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
	                    return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._) `${fmt}.validate`];
	                }
	                return ["string", fmtDef, fmt];
	            }
	            function validCondition() {
	                if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
	                    if (!schemaEnv.$async)
	                        throw new Error("async format in sync schema");
	                    return (0, codegen_1._) `await ${fmtRef}(${data})`;
	                }
	                return typeof format == "function" ? (0, codegen_1._) `${fmtRef}(${data})` : (0, codegen_1._) `${fmtRef}.test(${data})`;
	            }
	        }
	    },
	};
	format.default = def;
	
	return format;
}

var hasRequiredFormat;

function requireFormat () {
	if (hasRequiredFormat) return format$1;
	hasRequiredFormat = 1;
	Object.defineProperty(format$1, "__esModule", { value: true });
	const format_1 = requireFormat$1();
	const format = [format_1.default];
	format$1.default = format;
	
	return format$1;
}

var metadata = {};

var hasRequiredMetadata;

function requireMetadata () {
	if (hasRequiredMetadata) return metadata;
	hasRequiredMetadata = 1;
	Object.defineProperty(metadata, "__esModule", { value: true });
	metadata.contentVocabulary = metadata.metadataVocabulary = void 0;
	metadata.metadataVocabulary = [
	    "title",
	    "description",
	    "default",
	    "deprecated",
	    "readOnly",
	    "writeOnly",
	    "examples",
	];
	metadata.contentVocabulary = [
	    "contentMediaType",
	    "contentEncoding",
	    "contentSchema",
	];
	
	return metadata;
}

var hasRequiredDraft2020;

function requireDraft2020 () {
	if (hasRequiredDraft2020) return draft2020;
	hasRequiredDraft2020 = 1;
	Object.defineProperty(draft2020, "__esModule", { value: true });
	const core_1 = requireCore$2();
	const validation_1 = requireValidation$1();
	const applicator_1 = requireApplicator();
	const dynamic_1 = requireDynamic();
	const next_1 = requireNext$2();
	const unevaluated_1 = requireUnevaluated();
	const format_1 = requireFormat();
	const metadata_1 = requireMetadata();
	const draft2020Vocabularies = [
	    dynamic_1.default,
	    core_1.default,
	    validation_1.default,
	    (0, applicator_1.default)(true),
	    format_1.default,
	    metadata_1.metadataVocabulary,
	    metadata_1.contentVocabulary,
	    next_1.default,
	    unevaluated_1.default,
	];
	draft2020.default = draft2020Vocabularies;
	
	return draft2020;
}

var discriminator = {};

var types = {};

var hasRequiredTypes;

function requireTypes () {
	if (hasRequiredTypes) return types;
	hasRequiredTypes = 1;
	Object.defineProperty(types, "__esModule", { value: true });
	types.DiscrError = void 0;
	var DiscrError;
	(function (DiscrError) {
	    DiscrError["Tag"] = "tag";
	    DiscrError["Mapping"] = "mapping";
	})(DiscrError || (types.DiscrError = DiscrError = {}));
	
	return types;
}

var hasRequiredDiscriminator;

function requireDiscriminator () {
	if (hasRequiredDiscriminator) return discriminator;
	hasRequiredDiscriminator = 1;
	Object.defineProperty(discriminator, "__esModule", { value: true });
	const codegen_1 = requireCodegen();
	const types_1 = requireTypes();
	const compile_1 = requireCompile();
	const ref_error_1 = requireRef_error();
	const util_1 = requireUtil();
	const error = {
	    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag
	        ? `tag "${tagName}" must be string`
	        : `value of tag "${tagName}" must be in oneOf`,
	    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._) `{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`,
	};
	const def = {
	    keyword: "discriminator",
	    type: "object",
	    schemaType: "object",
	    error,
	    code(cxt) {
	        const { gen, data, schema, parentSchema, it } = cxt;
	        const { oneOf } = parentSchema;
	        if (!it.opts.discriminator) {
	            throw new Error("discriminator: requires discriminator option");
	        }
	        const tagName = schema.propertyName;
	        if (typeof tagName != "string")
	            throw new Error("discriminator: requires propertyName");
	        if (schema.mapping)
	            throw new Error("discriminator: mapping is not supported");
	        if (!oneOf)
	            throw new Error("discriminator: requires oneOf keyword");
	        const valid = gen.let("valid", false);
	        const tag = gen.const("tag", (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(tagName)}`);
	        gen.if((0, codegen_1._) `typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
	        cxt.ok(valid);
	        function validateMapping() {
	            const mapping = getMapping();
	            gen.if(false);
	            for (const tagValue in mapping) {
	                gen.elseIf((0, codegen_1._) `${tag} === ${tagValue}`);
	                gen.assign(valid, applyTagSchema(mapping[tagValue]));
	            }
	            gen.else();
	            cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
	            gen.endIf();
	        }
	        function applyTagSchema(schemaProp) {
	            const _valid = gen.name("valid");
	            const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
	            cxt.mergeEvaluated(schCxt, codegen_1.Name);
	            return _valid;
	        }
	        function getMapping() {
	            var _a;
	            const oneOfMapping = {};
	            const topRequired = hasRequired(parentSchema);
	            let tagRequired = true;
	            for (let i = 0; i < oneOf.length; i++) {
	                let sch = oneOf[i];
	                if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
	                    const ref = sch.$ref;
	                    sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
	                    if (sch instanceof compile_1.SchemaEnv)
	                        sch = sch.schema;
	                    if (sch === undefined)
	                        throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
	                }
	                const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
	                if (typeof propSch != "object") {
	                    throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
	                }
	                tagRequired = tagRequired && (topRequired || hasRequired(sch));
	                addMappings(propSch, i);
	            }
	            if (!tagRequired)
	                throw new Error(`discriminator: "${tagName}" must be required`);
	            return oneOfMapping;
	            function hasRequired({ required }) {
	                return Array.isArray(required) && required.includes(tagName);
	            }
	            function addMappings(sch, i) {
	                if (sch.const) {
	                    addMapping(sch.const, i);
	                }
	                else if (sch.enum) {
	                    for (const tagValue of sch.enum) {
	                        addMapping(tagValue, i);
	                    }
	                }
	                else {
	                    throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
	                }
	            }
	            function addMapping(tagValue, i) {
	                if (typeof tagValue != "string" || tagValue in oneOfMapping) {
	                    throw new Error(`discriminator: "${tagName}" values must be unique strings`);
	                }
	                oneOfMapping[tagValue] = i;
	            }
	        }
	    },
	};
	discriminator.default = def;
	
	return discriminator;
}

var jsonSchema202012 = {};

var $schema$c = "https://json-schema.org/draft/2020-12/schema";
var $id$8 = "https://json-schema.org/draft/2020-12/schema";
var $vocabulary$7 = {
	"https://json-schema.org/draft/2020-12/vocab/core": true,
	"https://json-schema.org/draft/2020-12/vocab/applicator": true,
	"https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
	"https://json-schema.org/draft/2020-12/vocab/validation": true,
	"https://json-schema.org/draft/2020-12/vocab/meta-data": true,
	"https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
	"https://json-schema.org/draft/2020-12/vocab/content": true
};
var $dynamicAnchor$7 = "meta";
var title$8 = "Core and Validation specifications meta-schema";
var allOf = [
	{
		$ref: "meta/core"
	},
	{
		$ref: "meta/applicator"
	},
	{
		$ref: "meta/unevaluated"
	},
	{
		$ref: "meta/validation"
	},
	{
		$ref: "meta/meta-data"
	},
	{
		$ref: "meta/format-annotation"
	},
	{
		$ref: "meta/content"
	}
];
var type$d = [
	"object",
	"boolean"
];
var $comment = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.";
var properties$c = {
	definitions: {
		$comment: "\"definitions\" has been replaced by \"$defs\".",
		type: "object",
		additionalProperties: {
			$dynamicRef: "#meta"
		},
		deprecated: true,
		"default": {
		}
	},
	dependencies: {
		$comment: "\"dependencies\" has been split and replaced by \"dependentSchemas\" and \"dependentRequired\" in order to serve their differing semantics.",
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$dynamicRef: "#meta"
				},
				{
					$ref: "meta/validation#/$defs/stringArray"
				}
			]
		},
		deprecated: true,
		"default": {
		}
	},
	$recursiveAnchor: {
		$comment: "\"$recursiveAnchor\" has been replaced by \"$dynamicAnchor\".",
		$ref: "meta/core#/$defs/anchorString",
		deprecated: true
	},
	$recursiveRef: {
		$comment: "\"$recursiveRef\" has been replaced by \"$dynamicRef\".",
		$ref: "meta/core#/$defs/uriReferenceString",
		deprecated: true
	}
};
var require$$0$2 = {
	$schema: $schema$c,
	$id: $id$8,
	$vocabulary: $vocabulary$7,
	$dynamicAnchor: $dynamicAnchor$7,
	title: title$8,
	allOf: allOf,
	type: type$d,
	$comment: $comment,
	properties: properties$c
};

var $schema$b = "https://json-schema.org/draft/2020-12/schema";
var $id$7 = "https://json-schema.org/draft/2020-12/meta/applicator";
var $vocabulary$6 = {
	"https://json-schema.org/draft/2020-12/vocab/applicator": true
};
var $dynamicAnchor$6 = "meta";
var title$7 = "Applicator vocabulary meta-schema";
var type$c = [
	"object",
	"boolean"
];
var properties$b = {
	prefixItems: {
		$ref: "#/$defs/schemaArray"
	},
	items: {
		$dynamicRef: "#meta"
	},
	contains: {
		$dynamicRef: "#meta"
	},
	additionalProperties: {
		$dynamicRef: "#meta"
	},
	properties: {
		type: "object",
		additionalProperties: {
			$dynamicRef: "#meta"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$dynamicRef: "#meta"
		},
		propertyNames: {
			format: "regex"
		},
		"default": {
		}
	},
	dependentSchemas: {
		type: "object",
		additionalProperties: {
			$dynamicRef: "#meta"
		},
		"default": {
		}
	},
	propertyNames: {
		$dynamicRef: "#meta"
	},
	"if": {
		$dynamicRef: "#meta"
	},
	then: {
		$dynamicRef: "#meta"
	},
	"else": {
		$dynamicRef: "#meta"
	},
	allOf: {
		$ref: "#/$defs/schemaArray"
	},
	anyOf: {
		$ref: "#/$defs/schemaArray"
	},
	oneOf: {
		$ref: "#/$defs/schemaArray"
	},
	not: {
		$dynamicRef: "#meta"
	}
};
var $defs$3 = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$dynamicRef: "#meta"
		}
	}
};
var require$$1$1 = {
	$schema: $schema$b,
	$id: $id$7,
	$vocabulary: $vocabulary$6,
	$dynamicAnchor: $dynamicAnchor$6,
	title: title$7,
	type: type$c,
	properties: properties$b,
	$defs: $defs$3
};

var $schema$a = "https://json-schema.org/draft/2020-12/schema";
var $id$6 = "https://json-schema.org/draft/2020-12/meta/unevaluated";
var $vocabulary$5 = {
	"https://json-schema.org/draft/2020-12/vocab/unevaluated": true
};
var $dynamicAnchor$5 = "meta";
var title$6 = "Unevaluated applicator vocabulary meta-schema";
var type$b = [
	"object",
	"boolean"
];
var properties$a = {
	unevaluatedItems: {
		$dynamicRef: "#meta"
	},
	unevaluatedProperties: {
		$dynamicRef: "#meta"
	}
};
var require$$2$1 = {
	$schema: $schema$a,
	$id: $id$6,
	$vocabulary: $vocabulary$5,
	$dynamicAnchor: $dynamicAnchor$5,
	title: title$6,
	type: type$b,
	properties: properties$a
};

var $schema$9 = "https://json-schema.org/draft/2020-12/schema";
var $id$5 = "https://json-schema.org/draft/2020-12/meta/content";
var $vocabulary$4 = {
	"https://json-schema.org/draft/2020-12/vocab/content": true
};
var $dynamicAnchor$4 = "meta";
var title$5 = "Content vocabulary meta-schema";
var type$a = [
	"object",
	"boolean"
];
var properties$9 = {
	contentEncoding: {
		type: "string"
	},
	contentMediaType: {
		type: "string"
	},
	contentSchema: {
		$dynamicRef: "#meta"
	}
};
var require$$3$2 = {
	$schema: $schema$9,
	$id: $id$5,
	$vocabulary: $vocabulary$4,
	$dynamicAnchor: $dynamicAnchor$4,
	title: title$5,
	type: type$a,
	properties: properties$9
};

var $schema$8 = "https://json-schema.org/draft/2020-12/schema";
var $id$4 = "https://json-schema.org/draft/2020-12/meta/core";
var $vocabulary$3 = {
	"https://json-schema.org/draft/2020-12/vocab/core": true
};
var $dynamicAnchor$3 = "meta";
var title$4 = "Core vocabulary meta-schema";
var type$9 = [
	"object",
	"boolean"
];
var properties$8 = {
	$id: {
		$ref: "#/$defs/uriReferenceString",
		$comment: "Non-empty fragments not allowed.",
		pattern: "^[^#]*#?$"
	},
	$schema: {
		$ref: "#/$defs/uriString"
	},
	$ref: {
		$ref: "#/$defs/uriReferenceString"
	},
	$anchor: {
		$ref: "#/$defs/anchorString"
	},
	$dynamicRef: {
		$ref: "#/$defs/uriReferenceString"
	},
	$dynamicAnchor: {
		$ref: "#/$defs/anchorString"
	},
	$vocabulary: {
		type: "object",
		propertyNames: {
			$ref: "#/$defs/uriString"
		},
		additionalProperties: {
			type: "boolean"
		}
	},
	$comment: {
		type: "string"
	},
	$defs: {
		type: "object",
		additionalProperties: {
			$dynamicRef: "#meta"
		}
	}
};
var $defs$2 = {
	anchorString: {
		type: "string",
		pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
	},
	uriString: {
		type: "string",
		format: "uri"
	},
	uriReferenceString: {
		type: "string",
		format: "uri-reference"
	}
};
var require$$4 = {
	$schema: $schema$8,
	$id: $id$4,
	$vocabulary: $vocabulary$3,
	$dynamicAnchor: $dynamicAnchor$3,
	title: title$4,
	type: type$9,
	properties: properties$8,
	$defs: $defs$2
};

var $schema$7 = "https://json-schema.org/draft/2020-12/schema";
var $id$3 = "https://json-schema.org/draft/2020-12/meta/format-annotation";
var $vocabulary$2 = {
	"https://json-schema.org/draft/2020-12/vocab/format-annotation": true
};
var $dynamicAnchor$2 = "meta";
var title$3 = "Format vocabulary meta-schema for annotation results";
var type$8 = [
	"object",
	"boolean"
];
var properties$7 = {
	format: {
		type: "string"
	}
};
var require$$5 = {
	$schema: $schema$7,
	$id: $id$3,
	$vocabulary: $vocabulary$2,
	$dynamicAnchor: $dynamicAnchor$2,
	title: title$3,
	type: type$8,
	properties: properties$7
};

var $schema$6 = "https://json-schema.org/draft/2020-12/schema";
var $id$2 = "https://json-schema.org/draft/2020-12/meta/meta-data";
var $vocabulary$1 = {
	"https://json-schema.org/draft/2020-12/vocab/meta-data": true
};
var $dynamicAnchor$1 = "meta";
var title$2 = "Meta-data vocabulary meta-schema";
var type$7 = [
	"object",
	"boolean"
];
var properties$6 = {
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": true,
	deprecated: {
		type: "boolean",
		"default": false
	},
	readOnly: {
		type: "boolean",
		"default": false
	},
	writeOnly: {
		type: "boolean",
		"default": false
	},
	examples: {
		type: "array",
		items: true
	}
};
var require$$6 = {
	$schema: $schema$6,
	$id: $id$2,
	$vocabulary: $vocabulary$1,
	$dynamicAnchor: $dynamicAnchor$1,
	title: title$2,
	type: type$7,
	properties: properties$6
};

var $schema$5 = "https://json-schema.org/draft/2020-12/schema";
var $id$1 = "https://json-schema.org/draft/2020-12/meta/validation";
var $vocabulary = {
	"https://json-schema.org/draft/2020-12/vocab/validation": true
};
var $dynamicAnchor = "meta";
var title$1 = "Validation vocabulary meta-schema";
var type$6 = [
	"object",
	"boolean"
];
var properties$5 = {
	type: {
		anyOf: [
			{
				$ref: "#/$defs/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/$defs/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	"const": true,
	"enum": {
		type: "array",
		items: true
	},
	multipleOf: {
		type: "number",
		exclusiveMinimum: 0
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "number"
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "number"
	},
	maxLength: {
		$ref: "#/$defs/nonNegativeInteger"
	},
	minLength: {
		$ref: "#/$defs/nonNegativeIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	maxItems: {
		$ref: "#/$defs/nonNegativeInteger"
	},
	minItems: {
		$ref: "#/$defs/nonNegativeIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	maxContains: {
		$ref: "#/$defs/nonNegativeInteger"
	},
	minContains: {
		$ref: "#/$defs/nonNegativeInteger",
		"default": 1
	},
	maxProperties: {
		$ref: "#/$defs/nonNegativeInteger"
	},
	minProperties: {
		$ref: "#/$defs/nonNegativeIntegerDefault0"
	},
	required: {
		$ref: "#/$defs/stringArray"
	},
	dependentRequired: {
		type: "object",
		additionalProperties: {
			$ref: "#/$defs/stringArray"
		}
	}
};
var $defs$1 = {
	nonNegativeInteger: {
		type: "integer",
		minimum: 0
	},
	nonNegativeIntegerDefault0: {
		$ref: "#/$defs/nonNegativeInteger",
		"default": 0
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		uniqueItems: true,
		"default": [
		]
	}
};
var require$$7 = {
	$schema: $schema$5,
	$id: $id$1,
	$vocabulary: $vocabulary,
	$dynamicAnchor: $dynamicAnchor,
	title: title$1,
	type: type$6,
	properties: properties$5,
	$defs: $defs$1
};

var hasRequiredJsonSchema202012;

function requireJsonSchema202012 () {
	if (hasRequiredJsonSchema202012) return jsonSchema202012;
	hasRequiredJsonSchema202012 = 1;
	Object.defineProperty(jsonSchema202012, "__esModule", { value: true });
	const metaSchema = require$$0$2;
	const applicator = require$$1$1;
	const unevaluated = require$$2$1;
	const content = require$$3$2;
	const core = require$$4;
	const format = require$$5;
	const metadata = require$$6;
	const validation = require$$7;
	const META_SUPPORT_DATA = ["/properties"];
	function addMetaSchema2020($data) {
	    [
	        metaSchema,
	        applicator,
	        unevaluated,
	        content,
	        core,
	        with$data(this, format),
	        metadata,
	        with$data(this, validation),
	    ].forEach((sch) => this.addMetaSchema(sch, undefined, false));
	    return this;
	    function with$data(ajv, sch) {
	        return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
	    }
	}
	jsonSchema202012.default = addMetaSchema2020;
	
	return jsonSchema202012;
}

var hasRequired_2020;

function require_2020 () {
	if (hasRequired_2020) return _2020.exports;
	hasRequired_2020 = 1;
	(function (module, exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
		const core_1 = requireCore$3();
		const draft2020_1 = requireDraft2020();
		const discriminator_1 = requireDiscriminator();
		const json_schema_2020_12_1 = requireJsonSchema202012();
		const META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
		class Ajv2020 extends core_1.default {
		    constructor(opts = {}) {
		        super({
		            ...opts,
		            dynamicRef: true,
		            next: true,
		            unevaluated: true,
		        });
		    }
		    _addVocabularies() {
		        super._addVocabularies();
		        draft2020_1.default.forEach((v) => this.addVocabulary(v));
		        if (this.opts.discriminator)
		            this.addKeyword(discriminator_1.default);
		    }
		    _addDefaultMetaSchema() {
		        super._addDefaultMetaSchema();
		        const { $data, meta } = this.opts;
		        if (!meta)
		            return;
		        json_schema_2020_12_1.default.call(this, $data);
		        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
		    }
		    defaultMeta() {
		        return (this.opts.defaultMeta =
		            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
		    }
		}
		exports.Ajv2020 = Ajv2020;
		module.exports = exports = Ajv2020;
		module.exports.Ajv2020 = Ajv2020;
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.default = Ajv2020;
		var validate_1 = requireValidate();
		Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return validate_1.KeywordCxt; } });
		var codegen_1 = requireCodegen();
		Object.defineProperty(exports, "_", { enumerable: true, get: function () { return codegen_1._; } });
		Object.defineProperty(exports, "str", { enumerable: true, get: function () { return codegen_1.str; } });
		Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return codegen_1.stringify; } });
		Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return codegen_1.nil; } });
		Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return codegen_1.Name; } });
		Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return codegen_1.CodeGen; } });
		var validation_error_1 = requireValidation_error();
		Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return validation_error_1.default; } });
		var ref_error_1 = requireRef_error();
		Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function () { return ref_error_1.default; } });
		
	} (_2020, _2020.exports));
	return _2020.exports;
}

var lib$3 = {exports: {}};

var id$3 = "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/schemas/v1.2/apiDeclaration.json#";
var $schema$4 = "http://json-schema.org/draft-04/schema#";
var type$5 = "object";
var required$3 = [
	"swaggerVersion",
	"basePath",
	"apis"
];
var properties$4 = {
	swaggerVersion: {
		"enum": [
			"1.2"
		]
	},
	apiVersion: {
		type: "string"
	},
	basePath: {
		type: "string",
		format: "uri",
		pattern: "^https?://"
	},
	resourcePath: {
		type: "string",
		format: "uri",
		pattern: "^/"
	},
	apis: {
		type: "array",
		items: {
			$ref: "#/definitions/apiObject"
		}
	},
	models: {
		type: "object",
		additionalProperties: {
			$ref: "modelsObject.json#"
		}
	},
	produces: {
		$ref: "#/definitions/mimeTypeArray"
	},
	consumes: {
		$ref: "#/definitions/mimeTypeArray"
	},
	authorizations: {
		$ref: "authorizationObject.json#"
	}
};
var additionalProperties$2 = false;
var definitions$3 = {
	apiObject: {
		type: "object",
		required: [
			"path",
			"operations"
		],
		properties: {
			path: {
				type: "string",
				format: "uri-template",
				pattern: "^/"
			},
			description: {
				type: "string"
			},
			operations: {
				type: "array",
				items: {
					$ref: "operationObject.json#"
				}
			}
		},
		additionalProperties: false
	},
	mimeTypeArray: {
		type: "array",
		items: {
			type: "string",
			format: "mime-type"
		},
		uniqueItems: true
	}
};
var require$$0$1 = {
	id: id$3,
	$schema: $schema$4,
	type: type$5,
	required: required$3,
	properties: properties$4,
	additionalProperties: additionalProperties$2,
	definitions: definitions$3
};

var title = "A JSON Schema for Swagger 2.0 API.";
var id$2 = "http://swagger.io/v2/schema.json#";
var $schema$3 = "http://json-schema.org/draft-04/schema#";
var type$4 = "object";
var required$2 = [
	"swagger",
	"info",
	"paths"
];
var additionalProperties$1 = false;
var patternProperties$1 = {
	"^x-": {
		$ref: "#/definitions/vendorExtension"
	}
};
var properties$3 = {
	swagger: {
		type: "string",
		"enum": [
			"2.0"
		],
		description: "The Swagger version of this document."
	},
	info: {
		$ref: "#/definitions/info"
	},
	host: {
		type: "string",
		pattern: "^[^{}/ :\\\\]+(?::\\d+)?$",
		description: "The host (name or ip) of the API. Example: 'swagger.io'"
	},
	basePath: {
		type: "string",
		pattern: "^/",
		description: "The base path to the API. Example: '/api'."
	},
	schemes: {
		$ref: "#/definitions/schemesList"
	},
	consumes: {
		description: "A list of MIME types accepted by the API.",
		allOf: [
			{
				$ref: "#/definitions/mediaTypeList"
			}
		]
	},
	produces: {
		description: "A list of MIME types the API can produce.",
		allOf: [
			{
				$ref: "#/definitions/mediaTypeList"
			}
		]
	},
	paths: {
		$ref: "#/definitions/paths"
	},
	definitions: {
		$ref: "#/definitions/definitions"
	},
	parameters: {
		$ref: "#/definitions/parameterDefinitions"
	},
	responses: {
		$ref: "#/definitions/responseDefinitions"
	},
	security: {
		$ref: "#/definitions/security"
	},
	securityDefinitions: {
		$ref: "#/definitions/securityDefinitions"
	},
	tags: {
		type: "array",
		items: {
			$ref: "#/definitions/tag"
		},
		uniqueItems: true
	},
	externalDocs: {
		$ref: "#/definitions/externalDocs"
	}
};
var definitions$2 = {
	info: {
		type: "object",
		description: "General information about the API.",
		required: [
			"version",
			"title"
		],
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			title: {
				type: "string",
				description: "A unique and precise title of the API."
			},
			version: {
				type: "string",
				description: "A semantic version number of the API."
			},
			description: {
				type: "string",
				description: "A longer description of the API. Should be different from the title.  GitHub Flavored Markdown is allowed."
			},
			termsOfService: {
				type: "string",
				description: "The terms of service for the API."
			},
			contact: {
				$ref: "#/definitions/contact"
			},
			license: {
				$ref: "#/definitions/license"
			}
		}
	},
	contact: {
		type: "object",
		description: "Contact information for the owners of the API.",
		additionalProperties: false,
		properties: {
			name: {
				type: "string",
				description: "The identifying name of the contact person/organization."
			},
			url: {
				type: "string",
				description: "The URL pointing to the contact information.",
				format: "uri"
			},
			email: {
				type: "string",
				description: "The email address of the contact person/organization.",
				format: "email"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	license: {
		type: "object",
		required: [
			"name"
		],
		additionalProperties: false,
		properties: {
			name: {
				type: "string",
				description: "The name of the license type. It's encouraged to use an OSI compatible license."
			},
			url: {
				type: "string",
				description: "The URL pointing to the license.",
				format: "uri"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	paths: {
		type: "object",
		description: "Relative paths to the individual endpoints. They must be relative to the 'basePath'.",
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			},
			"^/": {
				$ref: "#/definitions/pathItem"
			}
		},
		additionalProperties: false
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#/definitions/schema"
		},
		description: "One or more JSON objects describing the schemas being consumed and produced by the API."
	},
	parameterDefinitions: {
		type: "object",
		additionalProperties: {
			$ref: "#/definitions/parameter"
		},
		description: "One or more JSON representations for parameters"
	},
	responseDefinitions: {
		type: "object",
		additionalProperties: {
			$ref: "#/definitions/response"
		},
		description: "One or more JSON representations for responses"
	},
	externalDocs: {
		type: "object",
		additionalProperties: false,
		description: "information about external documentation",
		required: [
			"url"
		],
		properties: {
			description: {
				type: "string"
			},
			url: {
				type: "string",
				format: "uri"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	examples: {
		type: "object",
		additionalProperties: true
	},
	mimeType: {
		type: "string",
		description: "The MIME type of the HTTP message."
	},
	operation: {
		type: "object",
		required: [
			"responses"
		],
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			tags: {
				type: "array",
				items: {
					type: "string"
				},
				uniqueItems: true
			},
			summary: {
				type: "string",
				description: "A brief summary of the operation."
			},
			description: {
				type: "string",
				description: "A longer description of the operation, GitHub Flavored Markdown is allowed."
			},
			externalDocs: {
				$ref: "#/definitions/externalDocs"
			},
			operationId: {
				type: "string",
				description: "A unique identifier of the operation."
			},
			produces: {
				description: "A list of MIME types the API can produce.",
				allOf: [
					{
						$ref: "#/definitions/mediaTypeList"
					}
				]
			},
			consumes: {
				description: "A list of MIME types the API can consume.",
				allOf: [
					{
						$ref: "#/definitions/mediaTypeList"
					}
				]
			},
			parameters: {
				$ref: "#/definitions/parametersList"
			},
			responses: {
				$ref: "#/definitions/responses"
			},
			schemes: {
				$ref: "#/definitions/schemesList"
			},
			deprecated: {
				type: "boolean",
				"default": false
			},
			security: {
				$ref: "#/definitions/security"
			}
		}
	},
	pathItem: {
		type: "object",
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			$ref: {
				type: "string"
			},
			get: {
				$ref: "#/definitions/operation"
			},
			put: {
				$ref: "#/definitions/operation"
			},
			post: {
				$ref: "#/definitions/operation"
			},
			"delete": {
				$ref: "#/definitions/operation"
			},
			options: {
				$ref: "#/definitions/operation"
			},
			head: {
				$ref: "#/definitions/operation"
			},
			patch: {
				$ref: "#/definitions/operation"
			},
			parameters: {
				$ref: "#/definitions/parametersList"
			}
		}
	},
	responses: {
		type: "object",
		description: "Response objects names can either be any valid HTTP status code or 'default'.",
		minProperties: 1,
		additionalProperties: false,
		patternProperties: {
			"^([0-9]{3})$|^(default)$": {
				$ref: "#/definitions/responseValue"
			},
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		not: {
			type: "object",
			additionalProperties: false,
			patternProperties: {
				"^x-": {
					$ref: "#/definitions/vendorExtension"
				}
			}
		}
	},
	responseValue: {
		oneOf: [
			{
				$ref: "#/definitions/response"
			},
			{
				$ref: "#/definitions/jsonReference"
			}
		]
	},
	response: {
		type: "object",
		required: [
			"description"
		],
		properties: {
			description: {
				type: "string"
			},
			schema: {
				oneOf: [
					{
						$ref: "#/definitions/schema"
					},
					{
						$ref: "#/definitions/fileSchema"
					}
				]
			},
			headers: {
				$ref: "#/definitions/headers"
			},
			examples: {
				$ref: "#/definitions/examples"
			}
		},
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	headers: {
		type: "object",
		additionalProperties: {
			$ref: "#/definitions/header"
		}
	},
	header: {
		type: "object",
		additionalProperties: false,
		required: [
			"type"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"integer",
					"boolean",
					"array"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormat"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	vendorExtension: {
		description: "Any property starting with x- is valid.",
		additionalProperties: true,
		additionalItems: true
	},
	bodyParameter: {
		type: "object",
		required: [
			"name",
			"in",
			"schema"
		],
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			description: {
				type: "string",
				description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
			},
			name: {
				type: "string",
				description: "The name of the parameter."
			},
			"in": {
				type: "string",
				description: "Determines the location of the parameter.",
				"enum": [
					"body"
				]
			},
			required: {
				type: "boolean",
				description: "Determines whether or not this parameter is required or optional.",
				"default": false
			},
			schema: {
				$ref: "#/definitions/schema"
			}
		},
		additionalProperties: false
	},
	headerParameterSubSchema: {
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			required: {
				type: "boolean",
				description: "Determines whether or not this parameter is required or optional.",
				"default": false
			},
			"in": {
				type: "string",
				description: "Determines the location of the parameter.",
				"enum": [
					"header"
				]
			},
			description: {
				type: "string",
				description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
			},
			name: {
				type: "string",
				description: "The name of the parameter."
			},
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"boolean",
					"integer",
					"array"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormat"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			}
		}
	},
	queryParameterSubSchema: {
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			required: {
				type: "boolean",
				description: "Determines whether or not this parameter is required or optional.",
				"default": false
			},
			"in": {
				type: "string",
				description: "Determines the location of the parameter.",
				"enum": [
					"query"
				]
			},
			description: {
				type: "string",
				description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
			},
			name: {
				type: "string",
				description: "The name of the parameter."
			},
			allowEmptyValue: {
				type: "boolean",
				"default": false,
				description: "allows sending a parameter by name only or with an empty value."
			},
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"boolean",
					"integer",
					"array"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormatWithMulti"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			}
		}
	},
	formDataParameterSubSchema: {
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			required: {
				type: "boolean",
				description: "Determines whether or not this parameter is required or optional.",
				"default": false
			},
			"in": {
				type: "string",
				description: "Determines the location of the parameter.",
				"enum": [
					"formData"
				]
			},
			description: {
				type: "string",
				description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
			},
			name: {
				type: "string",
				description: "The name of the parameter."
			},
			allowEmptyValue: {
				type: "boolean",
				"default": false,
				description: "allows sending a parameter by name only or with an empty value."
			},
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"boolean",
					"integer",
					"array",
					"file"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormatWithMulti"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			}
		}
	},
	pathParameterSubSchema: {
		additionalProperties: false,
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		required: [
			"required"
		],
		properties: {
			required: {
				type: "boolean",
				"enum": [
					true
				],
				description: "Determines whether or not this parameter is required or optional."
			},
			"in": {
				type: "string",
				description: "Determines the location of the parameter.",
				"enum": [
					"path"
				]
			},
			description: {
				type: "string",
				description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
			},
			name: {
				type: "string",
				description: "The name of the parameter."
			},
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"boolean",
					"integer",
					"array"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormat"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			}
		}
	},
	nonBodyParameter: {
		type: "object",
		required: [
			"name",
			"in",
			"type"
		],
		oneOf: [
			{
				$ref: "#/definitions/headerParameterSubSchema"
			},
			{
				$ref: "#/definitions/formDataParameterSubSchema"
			},
			{
				$ref: "#/definitions/queryParameterSubSchema"
			},
			{
				$ref: "#/definitions/pathParameterSubSchema"
			}
		]
	},
	parameter: {
		oneOf: [
			{
				$ref: "#/definitions/bodyParameter"
			},
			{
				$ref: "#/definitions/nonBodyParameter"
			}
		]
	},
	schema: {
		type: "object",
		description: "A deterministic version of a JSON Schema object.",
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		properties: {
			$ref: {
				type: "string"
			},
			format: {
				type: "string"
			},
			title: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/title"
			},
			description: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/description"
			},
			"default": {
				$ref: "http://json-schema.org/draft-04/schema#/properties/default"
			},
			multipleOf: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
			},
			maximum: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
			},
			exclusiveMaximum: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
			},
			minimum: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
			},
			exclusiveMinimum: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
			},
			maxLength: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
			},
			minLength: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
			},
			pattern: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
			},
			maxItems: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
			},
			minItems: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
			},
			uniqueItems: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
			},
			maxProperties: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
			},
			minProperties: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
			},
			required: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
			},
			"enum": {
				$ref: "http://json-schema.org/draft-04/schema#/properties/enum"
			},
			additionalProperties: {
				anyOf: [
					{
						$ref: "#/definitions/schema"
					},
					{
						type: "boolean"
					}
				],
				"default": {
				}
			},
			type: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/type"
			},
			items: {
				anyOf: [
					{
						$ref: "#/definitions/schema"
					},
					{
						type: "array",
						minItems: 1,
						items: {
							$ref: "#/definitions/schema"
						}
					}
				],
				"default": {
				}
			},
			allOf: {
				type: "array",
				minItems: 1,
				items: {
					$ref: "#/definitions/schema"
				}
			},
			properties: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/schema"
				},
				"default": {
				}
			},
			discriminator: {
				type: "string"
			},
			readOnly: {
				type: "boolean",
				"default": false
			},
			xml: {
				$ref: "#/definitions/xml"
			},
			externalDocs: {
				$ref: "#/definitions/externalDocs"
			},
			example: {
			}
		},
		additionalProperties: false
	},
	fileSchema: {
		type: "object",
		description: "A deterministic version of a JSON Schema object.",
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		},
		required: [
			"type"
		],
		properties: {
			format: {
				type: "string"
			},
			title: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/title"
			},
			description: {
				$ref: "http://json-schema.org/draft-04/schema#/properties/description"
			},
			"default": {
				$ref: "http://json-schema.org/draft-04/schema#/properties/default"
			},
			required: {
				$ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
			},
			type: {
				type: "string",
				"enum": [
					"file"
				]
			},
			readOnly: {
				type: "boolean",
				"default": false
			},
			externalDocs: {
				$ref: "#/definitions/externalDocs"
			},
			example: {
			}
		},
		additionalProperties: false
	},
	primitivesItems: {
		type: "object",
		additionalProperties: false,
		properties: {
			type: {
				type: "string",
				"enum": [
					"string",
					"number",
					"integer",
					"boolean",
					"array"
				]
			},
			format: {
				type: "string"
			},
			items: {
				$ref: "#/definitions/primitivesItems"
			},
			collectionFormat: {
				$ref: "#/definitions/collectionFormat"
			},
			"default": {
				$ref: "#/definitions/default"
			},
			maximum: {
				$ref: "#/definitions/maximum"
			},
			exclusiveMaximum: {
				$ref: "#/definitions/exclusiveMaximum"
			},
			minimum: {
				$ref: "#/definitions/minimum"
			},
			exclusiveMinimum: {
				$ref: "#/definitions/exclusiveMinimum"
			},
			maxLength: {
				$ref: "#/definitions/maxLength"
			},
			minLength: {
				$ref: "#/definitions/minLength"
			},
			pattern: {
				$ref: "#/definitions/pattern"
			},
			maxItems: {
				$ref: "#/definitions/maxItems"
			},
			minItems: {
				$ref: "#/definitions/minItems"
			},
			uniqueItems: {
				$ref: "#/definitions/uniqueItems"
			},
			"enum": {
				$ref: "#/definitions/enum"
			},
			multipleOf: {
				$ref: "#/definitions/multipleOf"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	security: {
		type: "array",
		items: {
			$ref: "#/definitions/securityRequirement"
		},
		uniqueItems: true
	},
	securityRequirement: {
		type: "object",
		additionalProperties: {
			type: "array",
			items: {
				type: "string"
			},
			uniqueItems: true
		}
	},
	xml: {
		type: "object",
		additionalProperties: false,
		properties: {
			name: {
				type: "string"
			},
			namespace: {
				type: "string"
			},
			prefix: {
				type: "string"
			},
			attribute: {
				type: "boolean",
				"default": false
			},
			wrapped: {
				type: "boolean",
				"default": false
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	tag: {
		type: "object",
		additionalProperties: false,
		required: [
			"name"
		],
		properties: {
			name: {
				type: "string"
			},
			description: {
				type: "string"
			},
			externalDocs: {
				$ref: "#/definitions/externalDocs"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	securityDefinitions: {
		type: "object",
		additionalProperties: {
			oneOf: [
				{
					$ref: "#/definitions/basicAuthenticationSecurity"
				},
				{
					$ref: "#/definitions/apiKeySecurity"
				},
				{
					$ref: "#/definitions/oauth2ImplicitSecurity"
				},
				{
					$ref: "#/definitions/oauth2PasswordSecurity"
				},
				{
					$ref: "#/definitions/oauth2ApplicationSecurity"
				},
				{
					$ref: "#/definitions/oauth2AccessCodeSecurity"
				}
			]
		}
	},
	basicAuthenticationSecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"basic"
				]
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	apiKeySecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type",
			"name",
			"in"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"apiKey"
				]
			},
			name: {
				type: "string"
			},
			"in": {
				type: "string",
				"enum": [
					"header",
					"query"
				]
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	oauth2ImplicitSecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type",
			"flow",
			"authorizationUrl"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"oauth2"
				]
			},
			flow: {
				type: "string",
				"enum": [
					"implicit"
				]
			},
			scopes: {
				$ref: "#/definitions/oauth2Scopes"
			},
			authorizationUrl: {
				type: "string",
				format: "uri"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	oauth2PasswordSecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type",
			"flow",
			"tokenUrl"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"oauth2"
				]
			},
			flow: {
				type: "string",
				"enum": [
					"password"
				]
			},
			scopes: {
				$ref: "#/definitions/oauth2Scopes"
			},
			tokenUrl: {
				type: "string",
				format: "uri"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	oauth2ApplicationSecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type",
			"flow",
			"tokenUrl"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"oauth2"
				]
			},
			flow: {
				type: "string",
				"enum": [
					"application"
				]
			},
			scopes: {
				$ref: "#/definitions/oauth2Scopes"
			},
			tokenUrl: {
				type: "string",
				format: "uri"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	oauth2AccessCodeSecurity: {
		type: "object",
		additionalProperties: false,
		required: [
			"type",
			"flow",
			"authorizationUrl",
			"tokenUrl"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"oauth2"
				]
			},
			flow: {
				type: "string",
				"enum": [
					"accessCode"
				]
			},
			scopes: {
				$ref: "#/definitions/oauth2Scopes"
			},
			authorizationUrl: {
				type: "string",
				format: "uri"
			},
			tokenUrl: {
				type: "string",
				format: "uri"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
				$ref: "#/definitions/vendorExtension"
			}
		}
	},
	oauth2Scopes: {
		type: "object",
		additionalProperties: {
			type: "string"
		}
	},
	mediaTypeList: {
		type: "array",
		items: {
			$ref: "#/definitions/mimeType"
		},
		uniqueItems: true
	},
	parametersList: {
		type: "array",
		description: "The parameters needed to send a valid API call.",
		additionalItems: false,
		items: {
			oneOf: [
				{
					$ref: "#/definitions/parameter"
				},
				{
					$ref: "#/definitions/jsonReference"
				}
			]
		},
		uniqueItems: true
	},
	schemesList: {
		type: "array",
		description: "The transfer protocol of the API.",
		items: {
			type: "string",
			"enum": [
				"http",
				"https",
				"ws",
				"wss"
			]
		},
		uniqueItems: true
	},
	collectionFormat: {
		type: "string",
		"enum": [
			"csv",
			"ssv",
			"tsv",
			"pipes"
		],
		"default": "csv"
	},
	collectionFormatWithMulti: {
		type: "string",
		"enum": [
			"csv",
			"ssv",
			"tsv",
			"pipes",
			"multi"
		],
		"default": "csv"
	},
	title: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/title"
	},
	description: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/description"
	},
	"default": {
		$ref: "http://json-schema.org/draft-04/schema#/properties/default"
	},
	multipleOf: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
	},
	maximum: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
	},
	exclusiveMaximum: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
	},
	minimum: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
	},
	exclusiveMinimum: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
	},
	maxLength: {
		$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
	},
	minLength: {
		$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
	},
	pattern: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
	},
	maxItems: {
		$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
	},
	minItems: {
		$ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
	},
	uniqueItems: {
		$ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
	},
	"enum": {
		$ref: "http://json-schema.org/draft-04/schema#/properties/enum"
	},
	jsonReference: {
		type: "object",
		required: [
			"$ref"
		],
		additionalProperties: false,
		properties: {
			$ref: {
				type: "string"
			}
		}
	}
};
var require$$1 = {
	title: title,
	id: id$2,
	$schema: $schema$3,
	type: type$4,
	required: required$2,
	additionalProperties: additionalProperties$1,
	patternProperties: patternProperties$1,
	properties: properties$3,
	definitions: definitions$2
};

var id$1 = "https://spec.openapis.org/oas/3.0/schema/2019-04-02";
var $schema$2 = "http://json-schema.org/draft-04/schema#";
var description$1 = "Validation schema for OpenAPI Specification 3.0.X.";
var type$3 = "object";
var required$1 = [
	"openapi",
	"info",
	"paths"
];
var properties$2 = {
	openapi: {
		type: "string",
		pattern: "^3\\.0\\.\\d(-.+)?$"
	},
	info: {
		$ref: "#/definitions/Info"
	},
	externalDocs: {
		$ref: "#/definitions/ExternalDocumentation"
	},
	servers: {
		type: "array",
		items: {
			$ref: "#/definitions/Server"
		}
	},
	security: {
		type: "array",
		items: {
			$ref: "#/definitions/SecurityRequirement"
		}
	},
	tags: {
		type: "array",
		items: {
			$ref: "#/definitions/Tag"
		},
		uniqueItems: true
	},
	paths: {
		$ref: "#/definitions/Paths"
	},
	components: {
		$ref: "#/definitions/Components"
	}
};
var patternProperties = {
	"^x-": {
	}
};
var additionalProperties = false;
var definitions$1 = {
	Reference: {
		type: "object",
		required: [
			"$ref"
		],
		patternProperties: {
			"^\\$ref$": {
				type: "string",
				format: "uri-reference"
			}
		}
	},
	Info: {
		type: "object",
		required: [
			"title",
			"version"
		],
		properties: {
			title: {
				type: "string"
			},
			description: {
				type: "string"
			},
			termsOfService: {
				type: "string",
				format: "uri-reference"
			},
			contact: {
				$ref: "#/definitions/Contact"
			},
			license: {
				$ref: "#/definitions/License"
			},
			version: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Contact: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			url: {
				type: "string",
				format: "uri-reference"
			},
			email: {
				type: "string",
				format: "email"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	License: {
		type: "object",
		required: [
			"name"
		],
		properties: {
			name: {
				type: "string"
			},
			url: {
				type: "string",
				format: "uri-reference"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Server: {
		type: "object",
		required: [
			"url"
		],
		properties: {
			url: {
				type: "string"
			},
			description: {
				type: "string"
			},
			variables: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/ServerVariable"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	ServerVariable: {
		type: "object",
		required: [
			"default"
		],
		properties: {
			"enum": {
				type: "array",
				items: {
					type: "string"
				}
			},
			"default": {
				type: "string"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Components: {
		type: "object",
		properties: {
			schemas: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Schema"
							},
							{
								$ref: "#/definitions/Reference"
							}
						]
					}
				}
			},
			responses: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Response"
							}
						]
					}
				}
			},
			parameters: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Parameter"
							}
						]
					}
				}
			},
			examples: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Example"
							}
						]
					}
				}
			},
			requestBodies: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/RequestBody"
							}
						]
					}
				}
			},
			headers: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Header"
							}
						]
					}
				}
			},
			securitySchemes: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/SecurityScheme"
							}
						]
					}
				}
			},
			links: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Link"
							}
						]
					}
				}
			},
			callbacks: {
				type: "object",
				patternProperties: {
					"^[a-zA-Z0-9\\.\\-_]+$": {
						oneOf: [
							{
								$ref: "#/definitions/Reference"
							},
							{
								$ref: "#/definitions/Callback"
							}
						]
					}
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Schema: {
		type: "object",
		properties: {
			title: {
				type: "string"
			},
			multipleOf: {
				type: "number",
				minimum: 0,
				exclusiveMinimum: true
			},
			maximum: {
				type: "number"
			},
			exclusiveMaximum: {
				type: "boolean",
				"default": false
			},
			minimum: {
				type: "number"
			},
			exclusiveMinimum: {
				type: "boolean",
				"default": false
			},
			maxLength: {
				type: "integer",
				minimum: 0
			},
			minLength: {
				type: "integer",
				minimum: 0,
				"default": 0
			},
			pattern: {
				type: "string",
				format: "regex"
			},
			maxItems: {
				type: "integer",
				minimum: 0
			},
			minItems: {
				type: "integer",
				minimum: 0,
				"default": 0
			},
			uniqueItems: {
				type: "boolean",
				"default": false
			},
			maxProperties: {
				type: "integer",
				minimum: 0
			},
			minProperties: {
				type: "integer",
				minimum: 0,
				"default": 0
			},
			required: {
				type: "array",
				items: {
					type: "string"
				},
				minItems: 1,
				uniqueItems: true
			},
			"enum": {
				type: "array",
				items: {
				},
				minItems: 1,
				uniqueItems: false
			},
			type: {
				type: "string",
				"enum": [
					"array",
					"boolean",
					"integer",
					"number",
					"object",
					"string"
				]
			},
			not: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			allOf: {
				type: "array",
				items: {
					oneOf: [
						{
							$ref: "#/definitions/Schema"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			oneOf: {
				type: "array",
				items: {
					oneOf: [
						{
							$ref: "#/definitions/Schema"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			anyOf: {
				type: "array",
				items: {
					oneOf: [
						{
							$ref: "#/definitions/Schema"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			items: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			properties: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Schema"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			additionalProperties: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					},
					{
						type: "boolean"
					}
				],
				"default": true
			},
			description: {
				type: "string"
			},
			format: {
				type: "string"
			},
			"default": {
			},
			nullable: {
				type: "boolean",
				"default": false
			},
			discriminator: {
				$ref: "#/definitions/Discriminator"
			},
			readOnly: {
				type: "boolean",
				"default": false
			},
			writeOnly: {
				type: "boolean",
				"default": false
			},
			example: {
			},
			externalDocs: {
				$ref: "#/definitions/ExternalDocumentation"
			},
			deprecated: {
				type: "boolean",
				"default": false
			},
			xml: {
				$ref: "#/definitions/XML"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Discriminator: {
		type: "object",
		required: [
			"propertyName"
		],
		properties: {
			propertyName: {
				type: "string"
			},
			mapping: {
				type: "object",
				additionalProperties: {
					type: "string"
				}
			}
		}
	},
	XML: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			namespace: {
				type: "string",
				format: "uri"
			},
			prefix: {
				type: "string"
			},
			attribute: {
				type: "boolean",
				"default": false
			},
			wrapped: {
				type: "boolean",
				"default": false
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Response: {
		type: "object",
		required: [
			"description"
		],
		properties: {
			description: {
				type: "string"
			},
			headers: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Header"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			content: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/MediaType"
				}
			},
			links: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Link"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	MediaType: {
		type: "object",
		properties: {
			schema: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			example: {
			},
			examples: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Example"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			encoding: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/Encoding"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false,
		allOf: [
			{
				$ref: "#/definitions/ExampleXORExamples"
			}
		]
	},
	Example: {
		type: "object",
		properties: {
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			value: {
			},
			externalValue: {
				type: "string",
				format: "uri-reference"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Header: {
		type: "object",
		properties: {
			description: {
				type: "string"
			},
			required: {
				type: "boolean",
				"default": false
			},
			deprecated: {
				type: "boolean",
				"default": false
			},
			allowEmptyValue: {
				type: "boolean",
				"default": false
			},
			style: {
				type: "string",
				"enum": [
					"simple"
				],
				"default": "simple"
			},
			explode: {
				type: "boolean"
			},
			allowReserved: {
				type: "boolean",
				"default": false
			},
			schema: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			content: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/MediaType"
				},
				minProperties: 1,
				maxProperties: 1
			},
			example: {
			},
			examples: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Example"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false,
		allOf: [
			{
				$ref: "#/definitions/ExampleXORExamples"
			},
			{
				$ref: "#/definitions/SchemaXORContent"
			}
		]
	},
	Paths: {
		type: "object",
		patternProperties: {
			"^\\/": {
				$ref: "#/definitions/PathItem"
			},
			"^x-": {
			}
		},
		additionalProperties: false
	},
	PathItem: {
		type: "object",
		properties: {
			$ref: {
				type: "string"
			},
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			servers: {
				type: "array",
				items: {
					$ref: "#/definitions/Server"
				}
			},
			parameters: {
				type: "array",
				items: {
					oneOf: [
						{
							$ref: "#/definitions/Parameter"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				},
				uniqueItems: true
			}
		},
		patternProperties: {
			"^(get|put|post|delete|options|head|patch|trace)$": {
				$ref: "#/definitions/Operation"
			},
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Operation: {
		type: "object",
		required: [
			"responses"
		],
		properties: {
			tags: {
				type: "array",
				items: {
					type: "string"
				}
			},
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			externalDocs: {
				$ref: "#/definitions/ExternalDocumentation"
			},
			operationId: {
				type: "string"
			},
			parameters: {
				type: "array",
				items: {
					oneOf: [
						{
							$ref: "#/definitions/Parameter"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				},
				uniqueItems: true
			},
			requestBody: {
				oneOf: [
					{
						$ref: "#/definitions/RequestBody"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			responses: {
				$ref: "#/definitions/Responses"
			},
			callbacks: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Callback"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			},
			deprecated: {
				type: "boolean",
				"default": false
			},
			security: {
				type: "array",
				items: {
					$ref: "#/definitions/SecurityRequirement"
				}
			},
			servers: {
				type: "array",
				items: {
					$ref: "#/definitions/Server"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Responses: {
		type: "object",
		properties: {
			"default": {
				oneOf: [
					{
						$ref: "#/definitions/Response"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			}
		},
		patternProperties: {
			"^[1-5](?:\\d{2}|XX)$": {
				oneOf: [
					{
						$ref: "#/definitions/Response"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			"^x-": {
			}
		},
		minProperties: 1,
		additionalProperties: false
	},
	SecurityRequirement: {
		type: "object",
		additionalProperties: {
			type: "array",
			items: {
				type: "string"
			}
		}
	},
	Tag: {
		type: "object",
		required: [
			"name"
		],
		properties: {
			name: {
				type: "string"
			},
			description: {
				type: "string"
			},
			externalDocs: {
				$ref: "#/definitions/ExternalDocumentation"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	ExternalDocumentation: {
		type: "object",
		required: [
			"url"
		],
		properties: {
			description: {
				type: "string"
			},
			url: {
				type: "string",
				format: "uri-reference"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	ExampleXORExamples: {
		description: "Example and examples are mutually exclusive",
		not: {
			required: [
				"example",
				"examples"
			]
		}
	},
	SchemaXORContent: {
		description: "Schema and content are mutually exclusive, at least one is required",
		not: {
			required: [
				"schema",
				"content"
			]
		},
		oneOf: [
			{
				required: [
					"schema"
				]
			},
			{
				required: [
					"content"
				],
				description: "Some properties are not allowed if content is present",
				allOf: [
					{
						not: {
							required: [
								"style"
							]
						}
					},
					{
						not: {
							required: [
								"explode"
							]
						}
					},
					{
						not: {
							required: [
								"allowReserved"
							]
						}
					},
					{
						not: {
							required: [
								"example"
							]
						}
					},
					{
						not: {
							required: [
								"examples"
							]
						}
					}
				]
			}
		]
	},
	Parameter: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			"in": {
				type: "string"
			},
			description: {
				type: "string"
			},
			required: {
				type: "boolean",
				"default": false
			},
			deprecated: {
				type: "boolean",
				"default": false
			},
			allowEmptyValue: {
				type: "boolean",
				"default": false
			},
			style: {
				type: "string"
			},
			explode: {
				type: "boolean"
			},
			allowReserved: {
				type: "boolean",
				"default": false
			},
			schema: {
				oneOf: [
					{
						$ref: "#/definitions/Schema"
					},
					{
						$ref: "#/definitions/Reference"
					}
				]
			},
			content: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/MediaType"
				},
				minProperties: 1,
				maxProperties: 1
			},
			example: {
			},
			examples: {
				type: "object",
				additionalProperties: {
					oneOf: [
						{
							$ref: "#/definitions/Example"
						},
						{
							$ref: "#/definitions/Reference"
						}
					]
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false,
		required: [
			"name",
			"in"
		],
		allOf: [
			{
				$ref: "#/definitions/ExampleXORExamples"
			},
			{
				$ref: "#/definitions/SchemaXORContent"
			},
			{
				$ref: "#/definitions/ParameterLocation"
			}
		]
	},
	ParameterLocation: {
		description: "Parameter location",
		oneOf: [
			{
				description: "Parameter in path",
				required: [
					"required"
				],
				properties: {
					"in": {
						"enum": [
							"path"
						]
					},
					style: {
						"enum": [
							"matrix",
							"label",
							"simple"
						],
						"default": "simple"
					},
					required: {
						"enum": [
							true
						]
					}
				}
			},
			{
				description: "Parameter in query",
				properties: {
					"in": {
						"enum": [
							"query"
						]
					},
					style: {
						"enum": [
							"form",
							"spaceDelimited",
							"pipeDelimited",
							"deepObject"
						],
						"default": "form"
					}
				}
			},
			{
				description: "Parameter in header",
				properties: {
					"in": {
						"enum": [
							"header"
						]
					},
					style: {
						"enum": [
							"simple"
						],
						"default": "simple"
					}
				}
			},
			{
				description: "Parameter in cookie",
				properties: {
					"in": {
						"enum": [
							"cookie"
						]
					},
					style: {
						"enum": [
							"form"
						],
						"default": "form"
					}
				}
			}
		]
	},
	RequestBody: {
		type: "object",
		required: [
			"content"
		],
		properties: {
			description: {
				type: "string"
			},
			content: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/MediaType"
				}
			},
			required: {
				type: "boolean",
				"default": false
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	SecurityScheme: {
		oneOf: [
			{
				$ref: "#/definitions/APIKeySecurityScheme"
			},
			{
				$ref: "#/definitions/HTTPSecurityScheme"
			},
			{
				$ref: "#/definitions/OAuth2SecurityScheme"
			},
			{
				$ref: "#/definitions/OpenIdConnectSecurityScheme"
			}
		]
	},
	APIKeySecurityScheme: {
		type: "object",
		required: [
			"type",
			"name",
			"in"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"apiKey"
				]
			},
			name: {
				type: "string"
			},
			"in": {
				type: "string",
				"enum": [
					"header",
					"query",
					"cookie"
				]
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	HTTPSecurityScheme: {
		type: "object",
		required: [
			"scheme",
			"type"
		],
		properties: {
			scheme: {
				type: "string"
			},
			bearerFormat: {
				type: "string"
			},
			description: {
				type: "string"
			},
			type: {
				type: "string",
				"enum": [
					"http"
				]
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false,
		oneOf: [
			{
				description: "Bearer",
				properties: {
					scheme: {
						"enum": [
							"bearer"
						]
					}
				}
			},
			{
				description: "Non Bearer",
				not: {
					required: [
						"bearerFormat"
					]
				},
				properties: {
					scheme: {
						not: {
							"enum": [
								"bearer"
							]
						}
					}
				}
			}
		]
	},
	OAuth2SecurityScheme: {
		type: "object",
		required: [
			"type",
			"flows"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"oauth2"
				]
			},
			flows: {
				$ref: "#/definitions/OAuthFlows"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	OpenIdConnectSecurityScheme: {
		type: "object",
		required: [
			"type",
			"openIdConnectUrl"
		],
		properties: {
			type: {
				type: "string",
				"enum": [
					"openIdConnect"
				]
			},
			openIdConnectUrl: {
				type: "string",
				format: "uri-reference"
			},
			description: {
				type: "string"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	OAuthFlows: {
		type: "object",
		properties: {
			implicit: {
				$ref: "#/definitions/ImplicitOAuthFlow"
			},
			password: {
				$ref: "#/definitions/PasswordOAuthFlow"
			},
			clientCredentials: {
				$ref: "#/definitions/ClientCredentialsFlow"
			},
			authorizationCode: {
				$ref: "#/definitions/AuthorizationCodeOAuthFlow"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	ImplicitOAuthFlow: {
		type: "object",
		required: [
			"authorizationUrl",
			"scopes"
		],
		properties: {
			authorizationUrl: {
				type: "string",
				format: "uri-reference"
			},
			refreshUrl: {
				type: "string",
				format: "uri-reference"
			},
			scopes: {
				type: "object",
				additionalProperties: {
					type: "string"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	PasswordOAuthFlow: {
		type: "object",
		required: [
			"tokenUrl"
		],
		properties: {
			tokenUrl: {
				type: "string",
				format: "uri-reference"
			},
			refreshUrl: {
				type: "string",
				format: "uri-reference"
			},
			scopes: {
				type: "object",
				additionalProperties: {
					type: "string"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	ClientCredentialsFlow: {
		type: "object",
		required: [
			"tokenUrl"
		],
		properties: {
			tokenUrl: {
				type: "string",
				format: "uri-reference"
			},
			refreshUrl: {
				type: "string",
				format: "uri-reference"
			},
			scopes: {
				type: "object",
				additionalProperties: {
					type: "string"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	AuthorizationCodeOAuthFlow: {
		type: "object",
		required: [
			"authorizationUrl",
			"tokenUrl"
		],
		properties: {
			authorizationUrl: {
				type: "string",
				format: "uri-reference"
			},
			tokenUrl: {
				type: "string",
				format: "uri-reference"
			},
			refreshUrl: {
				type: "string",
				format: "uri-reference"
			},
			scopes: {
				type: "object",
				additionalProperties: {
					type: "string"
				}
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false
	},
	Link: {
		type: "object",
		properties: {
			operationId: {
				type: "string"
			},
			operationRef: {
				type: "string",
				format: "uri-reference"
			},
			parameters: {
				type: "object",
				additionalProperties: {
				}
			},
			requestBody: {
			},
			description: {
				type: "string"
			},
			server: {
				$ref: "#/definitions/Server"
			}
		},
		patternProperties: {
			"^x-": {
			}
		},
		additionalProperties: false,
		not: {
			description: "Operation Id and Operation Ref are mutually exclusive",
			required: [
				"operationId",
				"operationRef"
			]
		}
	},
	Callback: {
		type: "object",
		additionalProperties: {
			$ref: "#/definitions/PathItem"
		},
		patternProperties: {
			"^x-": {
			}
		}
	},
	Encoding: {
		type: "object",
		properties: {
			contentType: {
				type: "string"
			},
			headers: {
				type: "object",
				additionalProperties: {
					$ref: "#/definitions/Header"
				}
			},
			style: {
				type: "string",
				"enum": [
					"form",
					"spaceDelimited",
					"pipeDelimited",
					"deepObject"
				]
			},
			explode: {
				type: "boolean"
			},
			allowReserved: {
				type: "boolean",
				"default": false
			}
		},
		additionalProperties: false
	}
};
var require$$2 = {
	id: id$1,
	$schema: $schema$2,
	description: description$1,
	type: type$3,
	required: required$1,
	properties: properties$2,
	patternProperties: patternProperties,
	additionalProperties: additionalProperties,
	definitions: definitions$1
};

var $id = "https://spec.openapis.org/oas/3.1/schema/2021-04-15";
var $schema$1 = "https://json-schema.org/draft/2020-12/schema";
var type$2 = "object";
var properties$1 = {
	openapi: {
		type: "string",
		pattern: "^3\\.1\\.\\d+(-.+)?$"
	},
	info: {
		$ref: "#/$defs/info"
	},
	jsonSchemaDialect: {
		$ref: "#/$defs/uri",
		"default": "https://spec.openapis.org/oas/3.1/dialect/base"
	},
	servers: {
		type: "array",
		items: {
			$ref: "#/$defs/server"
		}
	},
	paths: {
		$ref: "#/$defs/paths"
	},
	webhooks: {
		type: "object",
		additionalProperties: {
			$ref: "#/$defs/path-item-or-reference"
		}
	},
	components: {
		$ref: "#/$defs/components"
	},
	security: {
		type: "array",
		items: {
			$ref: "#/$defs/security-requirement"
		}
	},
	tags: {
		type: "array",
		items: {
			$ref: "#/$defs/tag"
		}
	},
	externalDocs: {
		$ref: "#/$defs/external-documentation"
	}
};
var required = [
	"openapi",
	"info"
];
var anyOf = [
	{
		required: [
			"paths"
		]
	},
	{
		required: [
			"components"
		]
	},
	{
		required: [
			"webhooks"
		]
	}
];
var $ref = "#/$defs/specification-extensions";
var unevaluatedProperties = false;
var $defs = {
	info: {
		type: "object",
		properties: {
			title: {
				type: "string"
			},
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			termsOfService: {
				type: "string"
			},
			contact: {
				$ref: "#/$defs/contact"
			},
			license: {
				$ref: "#/$defs/license"
			},
			version: {
				type: "string"
			}
		},
		required: [
			"title",
			"version"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	contact: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			url: {
				type: "string"
			},
			email: {
				type: "string"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	license: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			identifier: {
				type: "string"
			},
			url: {
				$ref: "#/$defs/uri"
			}
		},
		required: [
			"name"
		],
		oneOf: [
			{
				required: [
					"identifier"
				]
			},
			{
				required: [
					"url"
				]
			}
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	server: {
		type: "object",
		properties: {
			url: {
				$ref: "#/$defs/uri"
			},
			description: {
				type: "string"
			},
			variables: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/server-variable"
				}
			}
		},
		required: [
			"url"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"server-variable": {
		type: "object",
		properties: {
			"enum": {
				type: "array",
				items: {
					type: "string"
				},
				minItems: 1
			},
			"default": {
				type: "string"
			},
			descriptions: {
				type: "string"
			}
		},
		required: [
			"default"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	components: {
		type: "object",
		properties: {
			schemas: {
				type: "object",
				additionalProperties: {
					$dynamicRef: "#meta"
				}
			},
			responses: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/response-or-reference"
				}
			},
			parameters: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/parameter-or-reference"
				}
			},
			examples: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/example-or-reference"
				}
			},
			requestBodies: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/request-body-or-reference"
				}
			},
			headers: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/header-or-reference"
				}
			},
			securitySchemes: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/security-scheme-or-reference"
				}
			},
			links: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/link-or-reference"
				}
			},
			callbacks: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/callbacks-or-reference"
				}
			},
			pathItems: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/path-item-or-reference"
				}
			}
		},
		patternProperties: {
			"^(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks|pathItems)$": {
				$comment: "Enumerating all of the property names in the regex above is necessary for unevaluatedProperties to work as expected",
				propertyNames: {
					pattern: "^[a-zA-Z0-9._-]+$"
				}
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	paths: {
		type: "object",
		patternProperties: {
			"^/": {
				$ref: "#/$defs/path-item"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"path-item": {
		type: "object",
		properties: {
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			servers: {
				type: "array",
				items: {
					$ref: "#/$defs/server"
				}
			},
			parameters: {
				type: "array",
				items: {
					$ref: "#/$defs/parameter-or-reference"
				}
			}
		},
		patternProperties: {
			"^(get|put|post|delete|options|head|patch|trace)$": {
				$ref: "#/$defs/operation"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"path-item-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/path-item"
		}
	},
	operation: {
		type: "object",
		properties: {
			tags: {
				type: "array",
				items: {
					type: "string"
				}
			},
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			externalDocs: {
				$ref: "#/$defs/external-documentation"
			},
			operationId: {
				type: "string"
			},
			parameters: {
				type: "array",
				items: {
					$ref: "#/$defs/parameter-or-reference"
				}
			},
			requestBody: {
				$ref: "#/$defs/request-body-or-reference"
			},
			responses: {
				$ref: "#/$defs/responses"
			},
			callbacks: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/callbacks-or-reference"
				}
			},
			deprecated: {
				"default": false,
				type: "boolean"
			},
			security: {
				type: "array",
				items: {
					$ref: "#/$defs/security-requirement"
				}
			},
			servers: {
				type: "array",
				items: {
					$ref: "#/$defs/server"
				}
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"external-documentation": {
		type: "object",
		properties: {
			description: {
				type: "string"
			},
			url: {
				$ref: "#/$defs/uri"
			}
		},
		required: [
			"url"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	parameter: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			"in": {
				"enum": [
					"query",
					"header",
					"path",
					"cookie"
				]
			},
			description: {
				type: "string"
			},
			required: {
				"default": false,
				type: "boolean"
			},
			deprecated: {
				"default": false,
				type: "boolean"
			},
			allowEmptyValue: {
				"default": false,
				type: "boolean"
			},
			schema: {
				$dynamicRef: "#meta"
			},
			content: {
				$ref: "#/$defs/content"
			}
		},
		required: [
			"in"
		],
		oneOf: [
			{
				required: [
					"schema"
				]
			},
			{
				required: [
					"content"
				]
			}
		],
		dependentSchemas: {
			schema: {
				properties: {
					style: {
						type: "string"
					},
					explode: {
						type: "boolean"
					},
					allowReserved: {
						"default": false,
						type: "boolean"
					}
				},
				allOf: [
					{
						$ref: "#/$defs/examples"
					},
					{
						$ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-path"
					},
					{
						$ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-header"
					},
					{
						$ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-query"
					},
					{
						$ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-cookie"
					},
					{
						$ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-form"
					}
				],
				$defs: {
					"styles-for-path": {
						"if": {
							properties: {
								"in": {
									"const": "path"
								}
							},
							required: [
								"in"
							]
						},
						then: {
							properties: {
								style: {
									"default": "simple",
									"enum": [
										"matrix",
										"label",
										"simple"
									]
								},
								required: {
									"const": true
								}
							},
							required: [
								"required"
							]
						}
					},
					"styles-for-header": {
						"if": {
							properties: {
								"in": {
									"const": "header"
								}
							},
							required: [
								"in"
							]
						},
						then: {
							properties: {
								style: {
									"default": "simple",
									"enum": [
										"simple"
									]
								}
							}
						}
					},
					"styles-for-query": {
						"if": {
							properties: {
								"in": {
									"const": "query"
								}
							},
							required: [
								"in"
							]
						},
						then: {
							properties: {
								style: {
									"default": "form",
									"enum": [
										"form",
										"spaceDelimited",
										"pipeDelimited",
										"deepObject"
									]
								}
							}
						}
					},
					"styles-for-cookie": {
						"if": {
							properties: {
								"in": {
									"const": "cookie"
								}
							},
							required: [
								"in"
							]
						},
						then: {
							properties: {
								style: {
									"default": "form",
									"enum": [
										"form"
									]
								}
							}
						}
					},
					"styles-for-form": {
						"if": {
							properties: {
								style: {
									"const": "form"
								}
							},
							required: [
								"style"
							]
						},
						then: {
							properties: {
								explode: {
									"default": true
								}
							}
						},
						"else": {
							properties: {
								explode: {
									"default": false
								}
							}
						}
					}
				}
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"parameter-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/parameter"
		}
	},
	"request-body": {
		type: "object",
		properties: {
			description: {
				type: "string"
			},
			content: {
				$ref: "#/$defs/content"
			},
			required: {
				"default": false,
				type: "boolean"
			}
		},
		required: [
			"content"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"request-body-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/request-body"
		}
	},
	content: {
		type: "object",
		additionalProperties: {
			$ref: "#/$defs/media-type"
		},
		propertyNames: {
			format: "media-range"
		}
	},
	"media-type": {
		type: "object",
		properties: {
			schema: {
				$dynamicRef: "#meta"
			},
			encoding: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/encoding"
				}
			}
		},
		allOf: [
			{
				$ref: "#/$defs/specification-extensions"
			},
			{
				$ref: "#/$defs/examples"
			}
		],
		unevaluatedProperties: false
	},
	encoding: {
		type: "object",
		properties: {
			contentType: {
				type: "string",
				format: "media-range"
			},
			headers: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/header-or-reference"
				}
			},
			style: {
				"default": "form",
				"enum": [
					"form",
					"spaceDelimited",
					"pipeDelimited",
					"deepObject"
				]
			},
			explode: {
				type: "boolean"
			},
			allowReserved: {
				"default": false,
				type: "boolean"
			}
		},
		allOf: [
			{
				$ref: "#/$defs/specification-extensions"
			},
			{
				$ref: "#/$defs/encoding/$defs/explode-default"
			}
		],
		unevaluatedProperties: false,
		$defs: {
			"explode-default": {
				"if": {
					properties: {
						style: {
							"const": "form"
						}
					},
					required: [
						"style"
					]
				},
				then: {
					properties: {
						explode: {
							"default": true
						}
					}
				},
				"else": {
					properties: {
						explode: {
							"default": false
						}
					}
				}
			}
		}
	},
	responses: {
		type: "object",
		properties: {
			"default": {
				$ref: "#/$defs/response-or-reference"
			}
		},
		patternProperties: {
			"^[1-5][0-9X]{2}$": {
				$ref: "#/$defs/response-or-reference"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	response: {
		type: "object",
		properties: {
			description: {
				type: "string"
			},
			headers: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/header-or-reference"
				}
			},
			content: {
				$ref: "#/$defs/content"
			},
			links: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/link-or-reference"
				}
			}
		},
		required: [
			"description"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"response-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/response"
		}
	},
	callbacks: {
		type: "object",
		$ref: "#/$defs/specification-extensions",
		additionalProperties: {
			$ref: "#/$defs/path-item-or-reference"
		}
	},
	"callbacks-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/callbacks"
		}
	},
	example: {
		type: "object",
		properties: {
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			},
			value: true,
			externalValue: {
				$ref: "#/$defs/uri"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"example-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/example"
		}
	},
	link: {
		type: "object",
		properties: {
			operationRef: {
				$ref: "#/$defs/uri"
			},
			operationId: true,
			parameters: {
				$ref: "#/$defs/map-of-strings"
			},
			requestBody: true,
			description: {
				type: "string"
			},
			body: {
				$ref: "#/$defs/server"
			}
		},
		oneOf: [
			{
				required: [
					"operationRef"
				]
			},
			{
				required: [
					"operationId"
				]
			}
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"link-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/link"
		}
	},
	header: {
		type: "object",
		properties: {
			description: {
				type: "string"
			},
			required: {
				"default": false,
				type: "boolean"
			},
			deprecated: {
				"default": false,
				type: "boolean"
			},
			allowEmptyValue: {
				"default": false,
				type: "boolean"
			}
		},
		dependentSchemas: {
			schema: {
				properties: {
					style: {
						"default": "simple",
						"enum": [
							"simple"
						]
					},
					explode: {
						"default": false,
						type: "boolean"
					},
					allowReserved: {
						"default": false,
						type: "boolean"
					},
					schema: {
						$dynamicRef: "#meta"
					}
				},
				$ref: "#/$defs/examples"
			},
			content: {
				properties: {
					content: {
						$ref: "#/$defs/content"
					}
				}
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	"header-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/header"
		}
	},
	tag: {
		type: "object",
		properties: {
			name: {
				type: "string"
			},
			description: {
				type: "string"
			},
			externalDocs: {
				$ref: "#/$defs/external-documentation"
			}
		},
		required: [
			"name"
		],
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false
	},
	reference: {
		type: "object",
		properties: {
			$ref: {
				$ref: "#/$defs/uri"
			},
			summary: {
				type: "string"
			},
			description: {
				type: "string"
			}
		},
		unevaluatedProperties: false
	},
	schema: {
		$dynamicAnchor: "meta",
		type: [
			"object",
			"boolean"
		]
	},
	"security-scheme": {
		type: "object",
		properties: {
			type: {
				"enum": [
					"apiKey",
					"http",
					"mutualTLS",
					"oauth2",
					"openIdConnect"
				]
			},
			description: {
				type: "string"
			}
		},
		required: [
			"type"
		],
		allOf: [
			{
				$ref: "#/$defs/specification-extensions"
			},
			{
				$ref: "#/$defs/security-scheme/$defs/type-apikey"
			},
			{
				$ref: "#/$defs/security-scheme/$defs/type-http"
			},
			{
				$ref: "#/$defs/security-scheme/$defs/type-http-bearer"
			},
			{
				$ref: "#/$defs/security-scheme/$defs/type-oauth2"
			},
			{
				$ref: "#/$defs/security-scheme/$defs/type-oidc"
			}
		],
		unevaluatedProperties: false,
		$defs: {
			"type-apikey": {
				"if": {
					properties: {
						type: {
							"const": "apiKey"
						}
					},
					required: [
						"type"
					]
				},
				then: {
					properties: {
						name: {
							type: "string"
						},
						"in": {
							"enum": [
								"query",
								"header",
								"cookie"
							]
						}
					},
					required: [
						"name",
						"in"
					]
				}
			},
			"type-http": {
				"if": {
					properties: {
						type: {
							"const": "http"
						}
					},
					required: [
						"type"
					]
				},
				then: {
					properties: {
						scheme: {
							type: "string"
						}
					},
					required: [
						"scheme"
					]
				}
			},
			"type-http-bearer": {
				"if": {
					properties: {
						type: {
							"const": "http"
						},
						scheme: {
							"const": "bearer"
						}
					},
					required: [
						"type",
						"scheme"
					]
				},
				then: {
					properties: {
						bearerFormat: {
							type: "string"
						}
					},
					required: [
						"scheme"
					]
				}
			},
			"type-oauth2": {
				"if": {
					properties: {
						type: {
							"const": "oauth2"
						}
					},
					required: [
						"type"
					]
				},
				then: {
					properties: {
						flows: {
							$ref: "#/$defs/oauth-flows"
						}
					},
					required: [
						"flows"
					]
				}
			},
			"type-oidc": {
				"if": {
					properties: {
						type: {
							"const": "openIdConnect"
						}
					},
					required: [
						"type"
					]
				},
				then: {
					properties: {
						openIdConnectUrl: {
							$ref: "#/$defs/uri"
						}
					},
					required: [
						"openIdConnectUrl"
					]
				}
			}
		}
	},
	"security-scheme-or-reference": {
		"if": {
			required: [
				"$ref"
			]
		},
		then: {
			$ref: "#/$defs/reference"
		},
		"else": {
			$ref: "#/$defs/security-scheme"
		}
	},
	"oauth-flows": {
		type: "object",
		properties: {
			implicit: {
				$ref: "#/$defs/oauth-flows/$defs/implicit"
			},
			password: {
				$ref: "#/$defs/oauth-flows/$defs/password"
			},
			clientCredentials: {
				$ref: "#/$defs/oauth-flows/$defs/client-credentials"
			},
			authorizationCode: {
				$ref: "#/$defs/oauth-flows/$defs/authorization-code"
			}
		},
		$ref: "#/$defs/specification-extensions",
		unevaluatedProperties: false,
		$defs: {
			implicit: {
				type: "object",
				properties: {
					authorizationUrl: {
						type: "string"
					},
					refreshUrl: {
						type: "string"
					},
					scopes: {
						$ref: "#/$defs/map-of-strings"
					}
				},
				required: [
					"authorizationUrl",
					"scopes"
				],
				$ref: "#/$defs/specification-extensions",
				unevaluatedProperties: false
			},
			password: {
				type: "object",
				properties: {
					tokenUrl: {
						type: "string"
					},
					refreshUrl: {
						type: "string"
					},
					scopes: {
						$ref: "#/$defs/map-of-strings"
					}
				},
				required: [
					"tokenUrl",
					"scopes"
				],
				$ref: "#/$defs/specification-extensions",
				unevaluatedProperties: false
			},
			"client-credentials": {
				type: "object",
				properties: {
					tokenUrl: {
						type: "string"
					},
					refreshUrl: {
						type: "string"
					},
					scopes: {
						$ref: "#/$defs/map-of-strings"
					}
				},
				required: [
					"tokenUrl",
					"scopes"
				],
				$ref: "#/$defs/specification-extensions",
				unevaluatedProperties: false
			},
			"authorization-code": {
				type: "object",
				properties: {
					authorizationUrl: {
						type: "string"
					},
					tokenUrl: {
						type: "string"
					},
					refreshUrl: {
						type: "string"
					},
					scopes: {
						$ref: "#/$defs/map-of-strings"
					}
				},
				required: [
					"authorizationUrl",
					"tokenUrl",
					"scopes"
				],
				$ref: "#/$defs/specification-extensions",
				unevaluatedProperties: false
			}
		}
	},
	"security-requirement": {
		type: "object",
		additionalProperties: {
			type: "array",
			items: {
				type: "string"
			}
		}
	},
	"specification-extensions": {
		patternProperties: {
			"^x-": true
		}
	},
	examples: {
		properties: {
			example: true,
			examples: {
				type: "object",
				additionalProperties: {
					$ref: "#/$defs/example-or-reference"
				}
			}
		}
	},
	uri: {
		type: "string",
		format: "uri"
	},
	"map-of-strings": {
		type: "object",
		additionalProperties: {
			type: "string"
		}
	}
};
var require$$3$1 = {
	$id: $id,
	$schema: $schema$1,
	type: type$2,
	properties: properties$1,
	required: required,
	anyOf: anyOf,
	$ref: $ref,
	unevaluatedProperties: unevaluatedProperties,
	$defs: $defs
};

var hasRequiredLib$3;

function requireLib$3 () {
	if (hasRequiredLib$3) return lib$3.exports;
	hasRequiredLib$3 = 1;
	(function (module, exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.openapi = exports.openapiV31 = exports.openapiV3 = exports.openapiV2 = exports.openapiV1 = void 0;
		/**
		 * JSON Schema for OpenAPI Specification v1.2
		 */
		exports.openapiV1 = require$$0$1;
		/**
		 * JSON Schema for OpenAPI Specification v2.0
		 */
		exports.openapiV2 = require$$1;
		/**
		 * JSON Schema for OpenAPI Specification v3.0
		 */
		exports.openapiV3 = require$$2;
		/**
		 * JSON Schema for OpenAPI Specification v3.1
		 */
		exports.openapiV31 = require$$3$1;
		/**
		 * JSON Schemas for every version of the OpenAPI Specification
		 */
		exports.openapi = {
		    v1: exports.openapiV1,
		    v2: exports.openapiV2,
		    v3: exports.openapiV3,
		    v31: exports.openapiV31,
		};
		// Export `openapi` as the default export
		exports.default = exports.openapi;
		// CommonJS default export hack
		/* eslint-env commonjs */
		{
		    module.exports = Object.assign(module.exports.default, module.exports);
		}
		
	} (lib$3, lib$3.exports));
	return lib$3.exports;
}

var dist = {exports: {}};

var draft4 = {};

var core$1 = {};

var hasRequiredCore$1;

function requireCore$1 () {
	if (hasRequiredCore$1) return core$1;
	hasRequiredCore$1 = 1;
	Object.defineProperty(core$1, "__esModule", { value: true });
	const ref_1 = requireRef$1();
	const core = [
	    "$schema",
	    "id",
	    "$defs",
	    { keyword: "$comment" },
	    "definitions",
	    ref_1.default,
	];
	core$1.default = core;
	
	return core$1;
}

var validation = {};

var limitNumber = {};

var hasRequiredLimitNumber;

function requireLimitNumber () {
	if (hasRequiredLimitNumber) return limitNumber;
	hasRequiredLimitNumber = 1;
	Object.defineProperty(limitNumber, "__esModule", { value: true });
	const core_1 = requireCore$3();
	const codegen_1 = requireCodegen();
	const ops = codegen_1.operators;
	const KWDs = {
	    maximum: {
	        exclusive: "exclusiveMaximum",
	        ops: [
	            { okStr: "<=", ok: ops.LTE, fail: ops.GT },
	            { okStr: "<", ok: ops.LT, fail: ops.GTE },
	        ],
	    },
	    minimum: {
	        exclusive: "exclusiveMinimum",
	        ops: [
	            { okStr: ">=", ok: ops.GTE, fail: ops.LT },
	            { okStr: ">", ok: ops.GT, fail: ops.LTE },
	        ],
	    },
	};
	const error = {
	    message: (cxt) => core_1.str `must be ${kwdOp(cxt).okStr} ${cxt.schemaCode}`,
	    params: (cxt) => core_1._ `{comparison: ${kwdOp(cxt).okStr}, limit: ${cxt.schemaCode}}`,
	};
	const def = {
	    keyword: Object.keys(KWDs),
	    type: "number",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { data, schemaCode } = cxt;
	        cxt.fail$data(core_1._ `${data} ${kwdOp(cxt).fail} ${schemaCode} || isNaN(${data})`);
	    },
	};
	function kwdOp(cxt) {
	    var _a;
	    const keyword = cxt.keyword;
	    const opsIdx = ((_a = cxt.parentSchema) === null || _a === void 0 ? void 0 : _a[KWDs[keyword].exclusive]) ? 1 : 0;
	    return KWDs[keyword].ops[opsIdx];
	}
	limitNumber.default = def;
	
	return limitNumber;
}

var limitNumberExclusive = {};

var hasRequiredLimitNumberExclusive;

function requireLimitNumberExclusive () {
	if (hasRequiredLimitNumberExclusive) return limitNumberExclusive;
	hasRequiredLimitNumberExclusive = 1;
	Object.defineProperty(limitNumberExclusive, "__esModule", { value: true });
	const KWDs = {
	    exclusiveMaximum: "maximum",
	    exclusiveMinimum: "minimum",
	};
	const def = {
	    keyword: Object.keys(KWDs),
	    type: "number",
	    schemaType: "boolean",
	    code({ keyword, parentSchema }) {
	        const limitKwd = KWDs[keyword];
	        if (parentSchema[limitKwd] === undefined) {
	            throw new Error(`${keyword} can only be used with ${limitKwd}`);
	        }
	    },
	};
	limitNumberExclusive.default = def;
	
	return limitNumberExclusive;
}

var hasRequiredValidation;

function requireValidation () {
	if (hasRequiredValidation) return validation;
	hasRequiredValidation = 1;
	Object.defineProperty(validation, "__esModule", { value: true });
	const limitNumber_1 = requireLimitNumber();
	const limitNumberExclusive_1 = requireLimitNumberExclusive();
	const multipleOf_1 = requireMultipleOf();
	const limitLength_1 = requireLimitLength();
	const pattern_1 = requirePattern();
	const limitProperties_1 = requireLimitProperties();
	const required_1 = requireRequired();
	const limitItems_1 = requireLimitItems();
	const uniqueItems_1 = requireUniqueItems();
	const const_1 = require_const();
	const enum_1 = require_enum();
	const validation$1 = [
	    // number
	    limitNumber_1.default,
	    limitNumberExclusive_1.default,
	    multipleOf_1.default,
	    // string
	    limitLength_1.default,
	    pattern_1.default,
	    // object
	    limitProperties_1.default,
	    required_1.default,
	    // array
	    limitItems_1.default,
	    uniqueItems_1.default,
	    // any
	    { keyword: "type", schemaType: ["string", "array"] },
	    { keyword: "nullable", schemaType: "boolean" },
	    const_1.default,
	    enum_1.default,
	];
	validation.default = validation$1;
	
	return validation;
}

var hasRequiredDraft4;

function requireDraft4 () {
	if (hasRequiredDraft4) return draft4;
	hasRequiredDraft4 = 1;
	Object.defineProperty(draft4, "__esModule", { value: true });
	const core_1 = requireCore$1();
	const validation_1 = requireValidation();
	const applicator_1 = requireApplicator();
	const format_1 = requireFormat();
	const metadataVocabulary = ["title", "description", "default"];
	const draft4Vocabularies = [
	    core_1.default,
	    validation_1.default,
	    applicator_1.default(),
	    format_1.default,
	    metadataVocabulary,
	];
	draft4.default = draft4Vocabularies;
	
	return draft4;
}

var id = "http://json-schema.org/draft-04/schema#";
var $schema = "http://json-schema.org/draft-04/schema#";
var description = "Core schema meta-schema";
var definitions = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	positiveInteger: {
		type: "integer",
		minimum: 0
	},
	positiveIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/positiveInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		minItems: 1,
		uniqueItems: true
	}
};
var type$1 = "object";
var properties = {
	id: {
		type: "string",
		format: "uri"
	},
	$schema: {
		type: "string",
		format: "uri"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": {
	},
	multipleOf: {
		type: "number",
		minimum: 0,
		exclusiveMinimum: true
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "boolean",
		"default": false
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "boolean",
		"default": false
	},
	maxLength: {
		$ref: "#/definitions/positiveInteger"
	},
	minLength: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		anyOf: [
			{
				type: "boolean"
			},
			{
				$ref: "#"
			}
		],
		"default": {
		}
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": {
		}
	},
	maxItems: {
		$ref: "#/definitions/positiveInteger"
	},
	minItems: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	maxProperties: {
		$ref: "#/definitions/positiveInteger"
	},
	minProperties: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		anyOf: [
			{
				type: "boolean"
			},
			{
				$ref: "#"
			}
		],
		"default": {
		}
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	"enum": {
		type: "array",
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var dependencies = {
	exclusiveMaximum: [
		"maximum"
	],
	exclusiveMinimum: [
		"minimum"
	]
};
var require$$3 = {
	id: id,
	$schema: $schema,
	description: description,
	definitions: definitions,
	type: type$1,
	properties: properties,
	dependencies: dependencies,
	"default": {
}
};

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist.exports;
	hasRequiredDist = 1;
	(function (module, exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
		const core_1 = requireCore$3();
		const draft4_1 = requireDraft4();
		const discriminator_1 = requireDiscriminator();
		const draft4MetaSchema = require$$3;
		const META_SUPPORT_DATA = ["/properties"];
		const META_SCHEMA_ID = "http://json-schema.org/draft-04/schema";
		class Ajv extends core_1.default {
		    constructor(opts = {}) {
		        super({
		            ...opts,
		            schemaId: "id",
		        });
		    }
		    _addVocabularies() {
		        super._addVocabularies();
		        draft4_1.default.forEach((v) => this.addVocabulary(v));
		        if (this.opts.discriminator)
		            this.addKeyword(discriminator_1.default);
		    }
		    _addDefaultMetaSchema() {
		        super._addDefaultMetaSchema();
		        if (!this.opts.meta)
		            return;
		        const metaSchema = this.opts.$data
		            ? this.$dataMetaSchema(draft4MetaSchema, META_SUPPORT_DATA)
		            : draft4MetaSchema;
		        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
		        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
		    }
		    defaultMeta() {
		        return (this.opts.defaultMeta =
		            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
		    }
		}
		module.exports = exports = Ajv;
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.default = Ajv;
		var core_2 = requireCore$3();
		Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function () { return core_2.KeywordCxt; } });
		var core_3 = requireCore$3();
		Object.defineProperty(exports, "_", { enumerable: true, get: function () { return core_3._; } });
		Object.defineProperty(exports, "str", { enumerable: true, get: function () { return core_3.str; } });
		Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return core_3.stringify; } });
		Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return core_3.nil; } });
		Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return core_3.Name; } });
		Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return core_3.CodeGen; } });
		
	} (dist, dist.exports));
	return dist.exports;
}

var schema$1;
var hasRequiredSchema$1;

function requireSchema$1 () {
	if (hasRequiredSchema$1) return schema$1;
	hasRequiredSchema$1 = 1;

	const util = requireUtil$1();
	const Ajv = require_2020();
	const { openapi } = requireLib$3();

	schema$1 = validateSchema;

	/**
	 * Validates the given Swagger API against the Swagger 2.0 or OpenAPI 3.0 and 3.1 schemas.
	 *
	 * @param {SwaggerObject} api
	 */
	function validateSchema(api) {
	  let ajv;

	  // Choose the appropriate schema (Swagger or OpenAPI)
	  let schema;

	  if (api.swagger) {
	    schema = openapi.v2;
	    ajv = initializeAjv();
	  } else {
	    if (api.openapi.startsWith("3.1")) {
	      schema = openapi.v31;

	      // There's a bug with Ajv in how it handles `$dynamicRef` in the way that it's used within the 3.1 schema so we
	      // need to do some adhoc workarounds.
	      // https://github.com/OAI/OpenAPI-Specification/issues/2689
	      // https://github.com/ajv-validator/ajv/issues/1573
	      const schemaDynamicRef = schema.$defs.schema;
	      delete schemaDynamicRef.$dynamicAnchor;

	      schema.$defs.components.properties.schemas.additionalProperties = schemaDynamicRef;
	      schema.$defs.header.dependentSchemas.schema.properties.schema = schemaDynamicRef;
	      schema.$defs["media-type"].properties.schema = schemaDynamicRef;
	      schema.$defs.parameter.properties.schema = schemaDynamicRef;

	      ajv = initializeAjv(false);
	    } else {
	      schema = openapi.v3;
	      ajv = initializeAjv();
	    }
	  }

	  // Validate against the schema
	  let isValid = ajv.validate(schema, api);
	  if (!isValid) {
	    let err = ajv.errors;
	    let message = "Swagger schema validation failed.\n" + formatAjvError(err);
	    const error = new SyntaxError(message);
	    error.details = err;
	    throw error;
	  }
	}

	/**
	 * Determines which version of Ajv to load and prepares it for use.
	 *
	 * @param {bool} draft04
	 * @returns {Ajv}
	 */
	function initializeAjv(draft04 = true) {
	  const opts = {
	    allErrors: true,
	    strict: false,
	    validateFormats: false,
	  };

	  if (draft04) {
	    const AjvDraft4 = requireDist();
	    return new AjvDraft4(opts);
	  }

	  return new Ajv(opts);
	}

	/**
	 * Run through a set of Ajv errors and compile them into an error message string.
	 *
	 * @param {object[]}  errors     - The Ajv errors
	 * @param {string}    [indent]   - The whitespace used to indent the error message
	 * @returns {string}
	 */
	function formatAjvError(errors, indent) {
	  indent = indent || "  ";
	  let message = "";
	  for (let error of errors) {
	    message += util.format(`${indent}#${error.instancePath.length ? error.instancePath : "/"} ${error.message}\n`);
	  }
	  return message;
	}
	return schema$1;
}

var lib$2;
var hasRequiredLib$2;

function requireLib$2 () {
	if (hasRequiredLib$2) return lib$2;
	hasRequiredLib$2 = 1;

	lib$2 = [
	  "get", "put", "post", "delete", "options", "head", "patch"
	];
	return lib$2;
}

var spec;
var hasRequiredSpec;

function requireSpec () {
	if (hasRequiredSpec) return spec;
	hasRequiredSpec = 1;

	const util = requireUtil$1();
	const swaggerMethods = requireLib$2();
	const primitiveTypes = ["array", "boolean", "integer", "number", "string"];
	const schemaTypes = ["array", "boolean", "integer", "number", "string", "object", "null", undefined];

	spec = validateSpec;

	/**
	 * Validates parts of the Swagger 2.0 spec that aren't covered by the Swagger 2.0 JSON Schema.
	 *
	 * @param {SwaggerObject} api
	 */
	function validateSpec(api) {
	  if (api.openapi) {
	    // We don't (yet) support validating against the OpenAPI spec
	    return;
	  }

	  let paths = Object.keys(api.paths || {});
	  let operationIds = [];
	  for (let pathName of paths) {
	    let path = api.paths[pathName];
	    let pathId = "/paths" + pathName;

	    if (path && pathName.indexOf("/") === 0) {
	      validatePath(api, path, pathId, operationIds);
	    }
	  }

	  let definitions = Object.keys(api.definitions || {});
	  for (let definitionName of definitions) {
	    let definition = api.definitions[definitionName];
	    let definitionId = "/definitions/" + definitionName;
	    validateRequiredPropertiesExist(definition, definitionId);
	  }
	}

	/**
	 * Validates the given path.
	 *
	 * @param {SwaggerObject} api           - The entire Swagger API object
	 * @param {object}        path          - A Path object, from the Swagger API
	 * @param {string}        pathId        - A value that uniquely identifies the path
	 * @param {string}        operationIds  - An array of collected operationIds found in other paths
	 */
	function validatePath(api, path, pathId, operationIds) {
	  for (let operationName of swaggerMethods) {
	    let operation = path[operationName];
	    let operationId = pathId + "/" + operationName;

	    if (operation) {
	      let declaredOperationId = operation.operationId;
	      if (declaredOperationId) {
	        if (operationIds.indexOf(declaredOperationId) === -1) {
	          operationIds.push(declaredOperationId);
	        } else {
	          throw new SyntaxError(`Validation failed. Duplicate operation id '${declaredOperationId}'`);
	        }
	      }
	      validateParameters(api, path, pathId, operation, operationId);

	      let responses = Object.keys(operation.responses || {});
	      for (let responseName of responses) {
	        let response = operation.responses[responseName];
	        let responseId = operationId + "/responses/" + responseName;
	        validateResponse(responseName, response || {}, responseId);
	      }
	    }
	  }
	}

	/**
	 * Validates the parameters for the given operation.
	 *
	 * @param {SwaggerObject} api           - The entire Swagger API object
	 * @param {object}        path          - A Path object, from the Swagger API
	 * @param {string}        pathId        - A value that uniquely identifies the path
	 * @param {object}        operation     - An Operation object, from the Swagger API
	 * @param {string}        operationId   - A value that uniquely identifies the operation
	 */
	function validateParameters(api, path, pathId, operation, operationId) {
	  let pathParams = path.parameters || [];
	  let operationParams = operation.parameters || [];

	  // Check for duplicate path parameters
	  try {
	    checkForDuplicates(pathParams);
	  } catch (e) {
	    throw new SyntaxError(e, `Validation failed. ${pathId} has duplicate parameters`);
	  }

	  // Check for duplicate operation parameters
	  try {
	    checkForDuplicates(operationParams);
	  } catch (e) {
	    throw new SyntaxError(e, `Validation failed. ${operationId} has duplicate parameters`);
	  }

	  // Combine the path and operation parameters,
	  // with the operation params taking precedence over the path params
	  let params = pathParams.reduce((combinedParams, value) => {
	    let duplicate = combinedParams.some((param) => {
	      return param.in === value.in && param.name === value.name;
	    });
	    if (!duplicate) {
	      combinedParams.push(value);
	    }
	    return combinedParams;
	  }, operationParams.slice());

	  validateBodyParameters(params, operationId);
	  validatePathParameters(params, pathId, operationId);
	  validateParameterTypes(params, api, operation, operationId);
	}

	/**
	 * Validates body and formData parameters for the given operation.
	 *
	 * @param   {object[]}  params       -  An array of Parameter objects
	 * @param   {string}    operationId  -  A value that uniquely identifies the operation
	 */
	function validateBodyParameters(params, operationId) {
	  let bodyParams = params.filter((param) => {
	    return param.in === "body";
	  });
	  let formParams = params.filter((param) => {
	    return param.in === "formData";
	  });

	  // There can only be one "body" parameter
	  if (bodyParams.length > 1) {
	    throw new SyntaxError(
	      `Validation failed. ${operationId} has ${bodyParams.length} body parameters. Only one is allowed.`,
	    );
	  } else if (bodyParams.length > 0 && formParams.length > 0) {
	    // "body" params and "formData" params are mutually exclusive
	    throw new SyntaxError(
	      `Validation failed. ${operationId} has body parameters and formData parameters. Only one or the other is allowed.`,
	    );
	  }
	}

	/**
	 * Validates path parameters for the given path.
	 *
	 * @param   {object[]}  params        - An array of Parameter objects
	 * @param   {string}    pathId        - A value that uniquely identifies the path
	 * @param   {string}    operationId   - A value that uniquely identifies the operation
	 */
	function validatePathParameters(params, pathId, operationId) {
	  // Find all {placeholders} in the path string
	  let placeholders = pathId.match(util.swaggerParamRegExp) || [];

	  // Check for duplicates
	  for (let i = 0; i < placeholders.length; i++) {
	    for (let j = i + 1; j < placeholders.length; j++) {
	      if (placeholders[i] === placeholders[j]) {
	        throw new SyntaxError(
	          `Validation failed. ${operationId} has multiple path placeholders named ${placeholders[i]}`,
	        );
	      }
	    }
	  }

	  params = params.filter((param) => {
	    return param.in === "path";
	  });

	  for (let param of params) {
	    if (param.required !== true) {
	      throw new SyntaxError(
	        "Validation failed. Path parameters cannot be optional. " +
	          `Set required=true for the "${param.name}" parameter at ${operationId}`,
	      );
	    }
	    let match = placeholders.indexOf("{" + param.name + "}");
	    if (match === -1) {
	      throw new SyntaxError(
	        `Validation failed. ${operationId} has a path parameter named "${param.name}", ` +
	          `but there is no corresponding {${param.name}} in the path string`,
	      );
	    }
	    placeholders.splice(match, 1);
	  }

	  if (placeholders.length > 0) {
	    throw new SyntaxError(`Validation failed. ${operationId} is missing path parameter(s) for ${placeholders}`);
	  }
	}

	/**
	 * Validates data types of parameters for the given operation.
	 *
	 * @param   {object[]}  params       -  An array of Parameter objects
	 * @param   {object}    api          -  The entire Swagger API object
	 * @param   {object}    operation    -  An Operation object, from the Swagger API
	 * @param   {string}    operationId  -  A value that uniquely identifies the operation
	 */
	function validateParameterTypes(params, api, operation, operationId) {
	  for (let param of params) {
	    let parameterId = operationId + "/parameters/" + param.name;
	    let schema, validTypes;

	    switch (param.in) {
	      case "body":
	        schema = param.schema;
	        validTypes = schemaTypes;
	        break;
	      case "formData":
	        schema = param;
	        validTypes = primitiveTypes.concat("file");
	        break;
	      default:
	        schema = param;
	        validTypes = primitiveTypes;
	    }

	    validateSchema(schema, parameterId, validTypes);
	    validateRequiredPropertiesExist(schema, parameterId);

	    if (schema.type === "file") {
	      // "file" params must consume at least one of these MIME types
	      let formData = /multipart\/(.*\+)?form-data/;
	      let urlEncoded = /application\/(.*\+)?x-www-form-urlencoded/;

	      let consumes = operation.consumes || api.consumes || [];

	      let hasValidMimeType = consumes.some((consume) => {
	        return formData.test(consume) || urlEncoded.test(consume);
	      });

	      if (!hasValidMimeType) {
	        throw new SyntaxError(
	          `Validation failed. ${operationId} has a file parameter, so it must consume multipart/form-data ` +
	            "or application/x-www-form-urlencoded",
	        );
	      }
	    }
	  }
	}

	/**
	 * Checks the given parameter list for duplicates, and throws an error if found.
	 *
	 * @param   {object[]}  params  - An array of Parameter objects
	 */
	function checkForDuplicates(params) {
	  for (let i = 0; i < params.length - 1; i++) {
	    let outer = params[i];
	    for (let j = i + 1; j < params.length; j++) {
	      let inner = params[j];
	      if (outer.name === inner.name && outer.in === inner.in) {
	        throw new SyntaxError(`Validation failed. Found multiple ${outer.in} parameters named "${outer.name}"`);
	      }
	    }
	  }
	}

	/**
	 * Validates the given response object.
	 *
	 * @param   {string}    code        -  The HTTP response code (or "default")
	 * @param   {object}    response    -  A Response object, from the Swagger API
	 * @param   {string}    responseId  -  A value that uniquely identifies the response
	 */
	function validateResponse(code, response, responseId) {
	  if (code !== "default" && (code < 100 || code > 599)) {
	    throw new SyntaxError(`Validation failed. ${responseId} has an invalid response code (${code})`);
	  }

	  let headers = Object.keys(response.headers || {});
	  for (let headerName of headers) {
	    let header = response.headers[headerName];
	    let headerId = responseId + "/headers/" + headerName;
	    validateSchema(header, headerId, primitiveTypes);
	  }

	  if (response.schema) {
	    let validTypes = schemaTypes.concat("file");
	    if (validTypes.indexOf(response.schema.type) === -1) {
	      throw new SyntaxError(
	        `Validation failed. ${responseId} has an invalid response schema type (${response.schema.type})`,
	      );
	    } else {
	      validateSchema(response.schema, responseId + "/schema", validTypes);
	    }
	  }
	}

	/**
	 * Validates the given Swagger schema object.
	 *
	 * @param {object}    schema      - A Schema object, from the Swagger API
	 * @param {string}    schemaId    - A value that uniquely identifies the schema object
	 * @param {string[]}  validTypes  - An array of the allowed schema types
	 */
	function validateSchema(schema, schemaId, validTypes) {
	  if (validTypes.indexOf(schema.type) === -1) {
	    throw new SyntaxError(`Validation failed. ${schemaId} has an invalid type (${schema.type})`);
	  }

	  if (schema.type === "array" && !schema.items) {
	    throw new SyntaxError(`Validation failed. ${schemaId} is an array, so it must include an "items" schema`);
	  }
	}

	/**
	 * Validates that the declared properties of the given Swagger schema object actually exist.
	 *
	 * @param {object}    schema      - A Schema object, from the Swagger API
	 * @param {string}    schemaId    - A value that uniquely identifies the schema object
	 */
	function validateRequiredPropertiesExist(schema, schemaId) {
	  /**
	   * Recursively collects all properties of the schema and its ancestors. They are added to the props object.
	   */
	  function collectProperties(schemaObj, props) {
	    if (schemaObj.properties) {
	      for (let property in schemaObj.properties) {
	        if (schemaObj.properties.hasOwnProperty(property)) {
	          props[property] = schemaObj.properties[property];
	        }
	      }
	    }
	    if (schemaObj.allOf) {
	      for (let parent of schemaObj.allOf) {
	        collectProperties(parent, props);
	      }
	    }
	  }

	  // The "required" keyword is only applicable for objects
	  if (Array.isArray(schema.type) && !schema.type.includes("object")) {
	    return;
	  } else if (!Array.isArray(schema.type) && schema.type !== "object") {
	    return;
	  }

	  if (schema.required && Array.isArray(schema.required)) {
	    let props = {};
	    collectProperties(schema, props);
	    for (let requiredProperty of schema.required) {
	      if (!props[requiredProperty]) {
	        throw new SyntaxError(
	          `Validation failed. Property '${requiredProperty}' listed as required but does not exist in '${schemaId}'`,
	        );
	      }
	    }
	  }
	}
	return spec;
}

var lib$1 = {};

var refs = {};

var ref = {};

var pointer = {};

var url = {};

var convertPathToPosix = {};

var hasRequiredConvertPathToPosix;

function requireConvertPathToPosix () {
	if (hasRequiredConvertPathToPosix) return convertPathToPosix;
	hasRequiredConvertPathToPosix = 1;
	var __importDefault = (convertPathToPosix && convertPathToPosix.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(convertPathToPosix, "__esModule", { value: true });
	convertPathToPosix.default = convertPathToPosix$1;
	const path_1 = __importDefault(require$$1$2);
	function convertPathToPosix$1(filePath) {
	    const isExtendedLengthPath = filePath.startsWith("\\\\?\\");
	    if (isExtendedLengthPath) {
	        return filePath;
	    }
	    return filePath.split(path_1.default?.win32?.sep).join(path_1.default?.posix?.sep ?? "/");
	}
	return convertPathToPosix;
}

var isWindows = {};

var hasRequiredIsWindows;

function requireIsWindows () {
	if (hasRequiredIsWindows) return isWindows;
	hasRequiredIsWindows = 1;
	Object.defineProperty(isWindows, "__esModule", { value: true });
	isWindows.isWindows = void 0;
	const isWindowsConst = /^win/.test(globalThis.process ? globalThis.process.platform : "");
	const isWindows$1 = () => isWindowsConst;
	isWindows.isWindows = isWindows$1;
	return isWindows;
}

var hasRequiredUrl;

function requireUrl () {
	if (hasRequiredUrl) return url;
	hasRequiredUrl = 1;
	var __createBinding = (url && url.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (url && url.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (url && url.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (url && url.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(url, "__esModule", { value: true });
	url.parse = void 0;
	url.resolve = resolve;
	url.cwd = cwd;
	url.getProtocol = getProtocol;
	url.getExtension = getExtension;
	url.stripQuery = stripQuery;
	url.getHash = getHash;
	url.stripHash = stripHash;
	url.isHttp = isHttp;
	url.isUnsafeUrl = isUnsafeUrl;
	url.isFileSystemPath = isFileSystemPath;
	url.fromFileSystemPath = fromFileSystemPath;
	url.toFileSystemPath = toFileSystemPath;
	url.safePointerToPath = safePointerToPath;
	url.relative = relative;
	const convert_path_to_posix_1 = __importDefault(requireConvertPathToPosix());
	const path_1 = __importStar(require$$1$2);
	const forwardSlashPattern = /\//g;
	const protocolPattern = /^(\w{2,}):\/\//i;
	const jsonPointerSlash = /~1/g;
	const jsonPointerTilde = /~0/g;
	const path_2 = require$$1$2;
	const is_windows_1 = requireIsWindows();
	// RegExp patterns to URL-encode special characters in local filesystem paths
	const urlEncodePatterns = [
	    [/\?/g, "%3F"],
	    [/#/g, "%23"],
	];
	// RegExp patterns to URL-decode special characters for local filesystem paths
	const urlDecodePatterns = [/%23/g, "#", /%24/g, "$", /%26/g, "&", /%2C/g, ",", /%40/g, "@"];
	const parse = (u) => new URL(u);
	url.parse = parse;
	/**
	 * Returns resolved target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.
	 *
	 * @returns
	 */
	function resolve(from, to) {
	    // we use a non-existent URL to check if its a relative URL
	    const fromUrl = new URL((0, convert_path_to_posix_1.default)(from), "https://aaa.nonexistanturl.com");
	    const resolvedUrl = new URL((0, convert_path_to_posix_1.default)(to), fromUrl);
	    const endSpaces = to.match(/(\s*)$/)?.[1] || "";
	    if (resolvedUrl.hostname === "aaa.nonexistanturl.com") {
	        // `from` is a relative URL.
	        const { pathname, search, hash } = resolvedUrl;
	        return pathname + search + hash + endSpaces;
	    }
	    return resolvedUrl.toString() + endSpaces;
	}
	/**
	 * Returns the current working directory (in Node) or the current page URL (in browsers).
	 *
	 * @returns
	 */
	function cwd() {
	    if (typeof window !== "undefined" && window.location && window.location.href) {
	        const href = window.location.href;
	        if (!href || !href.startsWith("http")) {
	            // try parsing as url, and if it fails, return root url /
	            try {
	                new URL(href);
	                return href;
	            }
	            catch {
	                return "/";
	            }
	        }
	        return href;
	    }
	    if (typeof process !== "undefined" && process.cwd) {
	        const path = process.cwd();
	        const lastChar = path.slice(-1);
	        if (lastChar === "/" || lastChar === "\\") {
	            return path;
	        }
	        else {
	            return path + "/";
	        }
	    }
	    return "/";
	}
	/**
	 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
	 *
	 * @param path
	 * @returns
	 */
	function getProtocol(path) {
	    const match = protocolPattern.exec(path || "");
	    if (match) {
	        return match[1].toLowerCase();
	    }
	    return undefined;
	}
	/**
	 * Returns the lowercased file extension of the given URL,
	 * or an empty string if it has no extension.
	 *
	 * @param path
	 * @returns
	 */
	function getExtension(path) {
	    const lastDot = path.lastIndexOf(".");
	    if (lastDot >= 0) {
	        return stripQuery(path.substr(lastDot).toLowerCase());
	    }
	    return "";
	}
	/**
	 * Removes the query, if any, from the given path.
	 *
	 * @param path
	 * @returns
	 */
	function stripQuery(path) {
	    const queryIndex = path.indexOf("?");
	    if (queryIndex >= 0) {
	        path = path.substr(0, queryIndex);
	    }
	    return path;
	}
	/**
	 * Returns the hash (URL fragment), of the given path.
	 * If there is no hash, then the root hash ("#") is returned.
	 *
	 * @param path
	 * @returns
	 */
	function getHash(path) {
	    if (!path) {
	        return "#";
	    }
	    const hashIndex = path.indexOf("#");
	    if (hashIndex >= 0) {
	        return path.substring(hashIndex);
	    }
	    return "#";
	}
	/**
	 * Removes the hash (URL fragment), if any, from the given path.
	 *
	 * @param path
	 * @returns
	 */
	function stripHash(path) {
	    if (!path) {
	        return "";
	    }
	    const hashIndex = path.indexOf("#");
	    if (hashIndex >= 0) {
	        path = path.substring(0, hashIndex);
	    }
	    return path;
	}
	/**
	 * Determines whether the given path is an HTTP(S) URL.
	 *
	 * @param path
	 * @returns
	 */
	function isHttp(path) {
	    const protocol = getProtocol(path);
	    if (protocol === "http" || protocol === "https") {
	        return true;
	    }
	    else if (protocol === undefined) {
	        // There is no protocol.  If we're running in a browser, then assume it's HTTP.
	        return typeof window !== "undefined";
	    }
	    else {
	        // It's some other protocol, such as "ftp://", "mongodb://", etc.
	        return false;
	    }
	}
	/**
	 * Determines whether the given url is an unsafe or internal url.
	 *
	 * @param path - The URL or path to check
	 * @returns true if the URL is unsafe/internal, false otherwise
	 */
	function isUnsafeUrl(path) {
	    if (!path || typeof path !== "string") {
	        return true;
	    }
	    // Trim whitespace and convert to lowercase for comparison
	    const normalizedPath = path.trim().toLowerCase();
	    // Empty or just whitespace
	    if (!normalizedPath) {
	        return true;
	    }
	    // JavaScript protocols
	    if (normalizedPath.startsWith("javascript:") ||
	        normalizedPath.startsWith("vbscript:") ||
	        normalizedPath.startsWith("data:")) {
	        return true;
	    }
	    // File protocol
	    if (normalizedPath.startsWith("file:")) {
	        return true;
	    }
	    // if we're in the browser, we assume that it is safe
	    if (typeof window !== "undefined" && window.location && window.location.href) {
	        return false;
	    }
	    // Local/internal network addresses
	    const localPatterns = [
	        // Localhost variations
	        "localhost",
	        "127.0.0.1",
	        "::1",
	        // Private IP ranges (RFC 1918)
	        "10.",
	        "172.16.",
	        "172.17.",
	        "172.18.",
	        "172.19.",
	        "172.20.",
	        "172.21.",
	        "172.22.",
	        "172.23.",
	        "172.24.",
	        "172.25.",
	        "172.26.",
	        "172.27.",
	        "172.28.",
	        "172.29.",
	        "172.30.",
	        "172.31.",
	        "192.168.",
	        // Link-local addresses
	        "169.254.",
	        // Internal domains
	        ".local",
	        ".internal",
	        ".intranet",
	        ".corp",
	        ".home",
	        ".lan",
	    ];
	    try {
	        // Try to parse as URL
	        const url = new URL(normalizedPath.startsWith("//") ? "http:" + normalizedPath : normalizedPath);
	        const hostname = url.hostname.toLowerCase();
	        // Check against local patterns
	        for (const pattern of localPatterns) {
	            if (hostname === pattern || hostname.startsWith(pattern) || hostname.endsWith(pattern)) {
	                return true;
	            }
	        }
	        // Check for IP addresses in private ranges
	        if (isPrivateIP(hostname)) {
	            return true;
	        }
	        // Check for non-standard ports that might indicate internal services
	        const port = url.port;
	        if (port && isInternalPort(parseInt(port))) {
	            return true;
	        }
	    }
	    catch (e) {
	        // If URL parsing fails, check if it's a relative path or contains suspicious patterns
	        // Relative paths starting with / are generally safe for same-origin
	        if (normalizedPath.startsWith("/") && !normalizedPath.startsWith("//")) {
	            return false;
	        }
	        // Check for localhost patterns in non-URL strings
	        for (const pattern of localPatterns) {
	            if (normalizedPath.includes(pattern)) {
	                return true;
	            }
	        }
	    }
	    return false;
	}
	/**
	 * Helper function to check if an IP address is in a private range
	 */
	function isPrivateIP(ip) {
	    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
	    const match = ip.match(ipRegex);
	    if (!match) {
	        return false;
	    }
	    const [, a, b, c, d] = match.map(Number);
	    // Validate IP format
	    if (a > 255 || b > 255 || c > 255 || d > 255) {
	        return false;
	    }
	    // Private IP ranges
	    return (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) // Link-local
	    );
	}
	/**
	 * Helper function to check if a port is typically used for internal services
	 */
	function isInternalPort(port) {
	    const internalPorts = [
	        22, // SSH
	        23, // Telnet
	        25, // SMTP
	        53, // DNS
	        135, // RPC
	        139, // NetBIOS
	        445, // SMB
	        993, // IMAPS
	        995, // POP3S
	        1433, // SQL Server
	        1521, // Oracle
	        3306, // MySQL
	        3389, // RDP
	        5432, // PostgreSQL
	        5900, // VNC
	        6379, // Redis
	        8080, // Common internal web
	        8443, // Common internal HTTPS
	        9200, // Elasticsearch
	        27017, // MongoDB
	    ];
	    return internalPorts.includes(port);
	}
	/**
	 * Determines whether the given path is a filesystem path.
	 * This includes "file://" URLs.
	 *
	 * @param path
	 * @returns
	 */
	function isFileSystemPath(path) {
	    // @ts-ignore
	    if (typeof window !== "undefined" || (typeof process !== "undefined" && process.browser)) {
	        // We're running in a browser, so assume that all paths are URLs.
	        // This way, even relative paths will be treated as URLs rather than as filesystem paths
	        return false;
	    }
	    const protocol = getProtocol(path);
	    return protocol === undefined || protocol === "file";
	}
	/**
	 * Converts a filesystem path to a properly-encoded URL.
	 *
	 * This is intended to handle situations where JSON Schema $Ref Parser is called
	 * with a filesystem path that contains characters which are not allowed in URLs.
	 *
	 * @example
	 * The following filesystem paths would be converted to the following URLs:
	 *
	 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
	 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
	 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
	 *
	 * @param path
	 * @returns
	 */
	function fromFileSystemPath(path) {
	    // Step 1: On Windows, replace backslashes with forward slashes,
	    // rather than encoding them as "%5C"
	    if ((0, is_windows_1.isWindows)()) {
	        const projectDir = cwd();
	        const upperPath = path.toUpperCase();
	        const projectDirPosixPath = (0, convert_path_to_posix_1.default)(projectDir);
	        const posixUpper = projectDirPosixPath.toUpperCase();
	        const hasProjectDir = upperPath.includes(posixUpper);
	        const hasProjectUri = upperPath.includes(posixUpper);
	        const isAbsolutePath = path_1.win32?.isAbsolute(path) ||
	            path.startsWith("http://") ||
	            path.startsWith("https://") ||
	            path.startsWith("file://");
	        if (!(hasProjectDir || hasProjectUri || isAbsolutePath) && !projectDir.startsWith("http")) {
	            path = (0, path_2.join)(projectDir, path);
	        }
	        path = (0, convert_path_to_posix_1.default)(path);
	    }
	    // Step 2: `encodeURI` will take care of MOST characters
	    path = encodeURI(path);
	    // Step 3: Manually encode characters that are not encoded by `encodeURI`.
	    // This includes characters such as "#" and "?", which have special meaning in URLs,
	    // but are just normal characters in a filesystem path.
	    for (const pattern of urlEncodePatterns) {
	        path = path.replace(pattern[0], pattern[1]);
	    }
	    return path;
	}
	/**
	 * Converts a URL to a local filesystem path.
	 */
	function toFileSystemPath(path, keepFileProtocol) {
	    // Step 1: `decodeURI` will decode characters such as Cyrillic characters, spaces, etc.
	    path = decodeURI(path);
	    // Step 2: Manually decode characters that are not decoded by `decodeURI`.
	    // This includes characters such as "#" and "?", which have special meaning in URLs,
	    // but are just normal characters in a filesystem path.
	    for (let i = 0; i < urlDecodePatterns.length; i += 2) {
	        path = path.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
	    }
	    // Step 3: If it's a "file://" URL, then format it consistently
	    // or convert it to a local filesystem path
	    let isFileUrl = path.substr(0, 7).toLowerCase() === "file://";
	    if (isFileUrl) {
	        // Strip-off the protocol, and the initial "/", if there is one
	        path = path[7] === "/" ? path.substr(8) : path.substr(7);
	        // insert a colon (":") after the drive letter on Windows
	        if ((0, is_windows_1.isWindows)() && path[1] === "/") {
	            path = path[0] + ":" + path.substr(1);
	        }
	        if (keepFileProtocol) {
	            // Return the consistently-formatted "file://" URL
	            path = "file:///" + path;
	        }
	        else {
	            // Convert the "file://" URL to a local filesystem path.
	            // On Windows, it will start with something like "C:/".
	            // On Posix, it will start with "/"
	            isFileUrl = false;
	            path = (0, is_windows_1.isWindows)() ? path : "/" + path;
	        }
	    }
	    // Step 4: Normalize Windows paths (unless it's a "file://" URL)
	    if ((0, is_windows_1.isWindows)() && !isFileUrl) {
	        // Replace forward slashes with backslashes
	        path = path.replace(forwardSlashPattern, "\\");
	        // Capitalize the drive letter
	        if (path.substr(1, 2) === ":\\") {
	            path = path[0].toUpperCase() + path.substr(1);
	        }
	    }
	    return path;
	}
	/**
	 * Converts a $ref pointer to a valid JSON Path.
	 *
	 * @param pointer
	 * @returns
	 */
	function safePointerToPath(pointer) {
	    if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
	        return [];
	    }
	    return pointer
	        .slice(2)
	        .split("/")
	        .map((value) => {
	        return decodeURIComponent(value).replace(jsonPointerSlash, "/").replace(jsonPointerTilde, "~");
	    });
	}
	function relative(from, to) {
	    if (!isFileSystemPath(from) || !isFileSystemPath(to)) {
	        return resolve(from, to);
	    }
	    const fromDir = path_1.default.dirname(stripHash(from));
	    const toPath = stripHash(to);
	    const result = path_1.default.relative(fromDir, toPath);
	    return result + getHash(to);
	}
	return url;
}

var errors = {};

var hasRequiredErrors;

function requireErrors () {
	if (hasRequiredErrors) return errors;
	hasRequiredErrors = 1;
	Object.defineProperty(errors, "__esModule", { value: true });
	errors.InvalidPointerError = errors.TimeoutError = errors.MissingPointerError = errors.UnmatchedResolverError = errors.ResolverError = errors.UnmatchedParserError = errors.ParserError = errors.JSONParserErrorGroup = errors.JSONParserError = void 0;
	errors.toJSON = toJSON;
	errors.getDeepKeys = getDeepKeys;
	errors.isHandledError = isHandledError;
	errors.normalizeError = normalizeError;
	const url_js_1 = requireUrl();
	const nonJsonTypes = ["function", "symbol", "undefined"];
	const protectedProps = ["constructor", "prototype", "__proto__"];
	const objectPrototype = Object.getPrototypeOf({});
	/**
	 * Custom JSON serializer for Error objects.
	 * Returns all built-in error properties, as well as extended properties.
	 */
	function toJSON() {
	    // HACK: We have to cast the objects to `any` so we can use symbol indexers.
	    // see https://github.com/Microsoft/TypeScript/issues/1863
	    const pojo = {};
	    const error = this;
	    for (const key of getDeepKeys(error)) {
	        if (typeof key === "string") {
	            const value = error[key];
	            const type = typeof value;
	            if (!nonJsonTypes.includes(type)) {
	                pojo[key] = value;
	            }
	        }
	    }
	    return pojo;
	}
	/**
	 * Returns own, inherited, enumerable, non-enumerable, string, and symbol keys of `obj`.
	 * Does NOT return members of the base Object prototype, or the specified omitted keys.
	 */
	function getDeepKeys(obj, omit = []) {
	    let keys = [];
	    // Crawl the prototype chain, finding all the string and symbol keys
	    while (obj && obj !== objectPrototype) {
	        keys = keys.concat(Object.getOwnPropertyNames(obj), Object.getOwnPropertySymbols(obj));
	        obj = Object.getPrototypeOf(obj);
	    }
	    // De-duplicate the list of keys
	    const uniqueKeys = new Set(keys);
	    // Remove any omitted keys
	    for (const key of omit.concat(protectedProps)) {
	        uniqueKeys.delete(key);
	    }
	    return uniqueKeys;
	}
	class JSONParserError extends Error {
	    constructor(message, source) {
	        super();
	        this.toJSON = toJSON.bind(this);
	        this.code = "EUNKNOWN";
	        this.name = "JSONParserError";
	        this.message = message;
	        this.source = source;
	        this.path = null;
	    }
	    get footprint() {
	        return `${this.path}+${this.source}+${this.code}+${this.message}`;
	    }
	}
	errors.JSONParserError = JSONParserError;
	class JSONParserErrorGroup extends Error {
	    constructor(parser) {
	        super();
	        this.toJSON = toJSON.bind(this);
	        this.files = parser;
	        this.name = "JSONParserErrorGroup";
	        this.message = `${this.errors.length} error${this.errors.length > 1 ? "s" : ""} occurred while reading '${(0, url_js_1.toFileSystemPath)(parser.$refs._root$Ref.path)}'`;
	    }
	    static getParserErrors(parser) {
	        const errors = [];
	        for (const $ref of Object.values(parser.$refs._$refs)) {
	            if ($ref.errors) {
	                errors.push(...$ref.errors);
	            }
	        }
	        return errors;
	    }
	    get errors() {
	        return JSONParserErrorGroup.getParserErrors(this.files);
	    }
	}
	errors.JSONParserErrorGroup = JSONParserErrorGroup;
	class ParserError extends JSONParserError {
	    constructor(message, source) {
	        super(`Error parsing ${source}: ${message}`, source);
	        this.code = "EPARSER";
	        this.name = "ParserError";
	    }
	}
	errors.ParserError = ParserError;
	class UnmatchedParserError extends JSONParserError {
	    constructor(source) {
	        super(`Could not find parser for "${source}"`, source);
	        this.code = "EUNMATCHEDPARSER";
	        this.name = "UnmatchedParserError";
	    }
	}
	errors.UnmatchedParserError = UnmatchedParserError;
	class ResolverError extends JSONParserError {
	    constructor(ex, source) {
	        super(ex.message || `Error reading file "${source}"`, source);
	        this.code = "ERESOLVER";
	        this.name = "ResolverError";
	        if ("code" in ex) {
	            this.ioErrorCode = String(ex.code);
	        }
	    }
	}
	errors.ResolverError = ResolverError;
	class UnmatchedResolverError extends JSONParserError {
	    constructor(source) {
	        super(`Could not find resolver for "${source}"`, source);
	        this.code = "EUNMATCHEDRESOLVER";
	        this.name = "UnmatchedResolverError";
	    }
	}
	errors.UnmatchedResolverError = UnmatchedResolverError;
	class MissingPointerError extends JSONParserError {
	    constructor(token, path, targetRef, targetFound, parentPath) {
	        super(`Missing $ref pointer "${(0, url_js_1.getHash)(path)}". Token "${token}" does not exist.`, (0, url_js_1.stripHash)(path));
	        this.code = "EMISSINGPOINTER";
	        this.name = "MissingPointerError";
	        this.targetToken = token;
	        this.targetRef = targetRef;
	        this.targetFound = targetFound;
	        this.parentPath = parentPath;
	    }
	}
	errors.MissingPointerError = MissingPointerError;
	class TimeoutError extends JSONParserError {
	    constructor(timeout) {
	        super(`Dereferencing timeout reached: ${timeout}ms`);
	        this.code = "ETIMEOUT";
	        this.name = "TimeoutError";
	    }
	}
	errors.TimeoutError = TimeoutError;
	class InvalidPointerError extends JSONParserError {
	    constructor(pointer, path) {
	        super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, (0, url_js_1.stripHash)(path));
	        this.code = "EUNMATCHEDRESOLVER";
	        this.name = "InvalidPointerError";
	    }
	}
	errors.InvalidPointerError = InvalidPointerError;
	function isHandledError(err) {
	    return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
	}
	function normalizeError(err) {
	    if (err.path === null) {
	        err.path = [];
	    }
	    return err;
	}
	return errors;
}

var hasRequiredPointer;

function requirePointer () {
	if (hasRequiredPointer) return pointer;
	hasRequiredPointer = 1;
	(function (exports) {
		var __createBinding = (pointer && pointer.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (pointer && pointer.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (pointer && pointer.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __importDefault = (pointer && pointer.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.nullSymbol = void 0;
		const ref_js_1 = __importDefault(requireRef());
		const url = __importStar(requireUrl());
		const errors_js_1 = requireErrors();
		exports.nullSymbol = Symbol("null");
		const slashes = /\//g;
		const tildes = /~/g;
		const escapedSlash = /~1/g;
		const escapedTilde = /~0/g;
		const safeDecodeURIComponent = (encodedURIComponent) => {
		    try {
		        return decodeURIComponent(encodedURIComponent);
		    }
		    catch {
		        return encodedURIComponent;
		    }
		};
		/**
		 * This class represents a single JSON pointer and its resolved value.
		 *
		 * @param $ref
		 * @param path
		 * @param [friendlyPath] - The original user-specified path (used for error messages)
		 * @class
		 */
		class Pointer {
		    constructor($ref, path, friendlyPath) {
		        this.$ref = $ref;
		        this.path = path;
		        this.originalPath = friendlyPath || path;
		        this.value = undefined;
		        this.circular = false;
		        this.indirections = 0;
		    }
		    /**
		     * Resolves the value of a nested property within the given object.
		     *
		     * @param obj - The object that will be crawled
		     * @param options
		     * @param pathFromRoot - the path of place that initiated resolving
		     *
		     * @returns
		     * Returns a JSON pointer whose {@link Pointer#value} is the resolved value.
		     * If resolving this value required resolving other JSON references, then
		     * the {@link Pointer#$ref} and {@link Pointer#path} will reflect the resolution path
		     * of the resolved value.
		     */
		    resolve(obj, options, pathFromRoot) {
		        const tokens = Pointer.parse(this.path, this.originalPath);
		        const found = [];
		        // Crawl the object, one token at a time
		        this.value = unwrapOrThrow(obj);
		        for (let i = 0; i < tokens.length; i++) {
		            if (resolveIf$Ref(this, options, pathFromRoot)) {
		                // The $ref path has changed, so append the remaining tokens to the path
		                this.path = Pointer.join(this.path, tokens.slice(i));
		            }
		            const token = tokens[i];
		            if (this.value[token] === undefined || (this.value[token] === null && i === tokens.length - 1)) {
		                // one final case is if the entry itself includes slashes, and was parsed out as a token - we can join the remaining tokens and try again
		                let didFindSubstringSlashMatch = false;
		                for (let j = tokens.length - 1; j > i; j--) {
		                    const joinedToken = tokens.slice(i, j + 1).join("/");
		                    if (this.value[joinedToken] !== undefined) {
		                        this.value = this.value[joinedToken];
		                        i = j;
		                        didFindSubstringSlashMatch = true;
		                        break;
		                    }
		                }
		                if (didFindSubstringSlashMatch) {
		                    continue;
		                }
		                // If the token we're looking for ended up not containing any slashes but is
		                // actually instead pointing to an existing `null` value then we should use that
		                // `null` value.
		                if (token in this.value && this.value[token] === null) {
		                    // We use a `null` symbol for internal tracking to differntiate between a general `null`
		                    // value and our expected `null` value.
		                    this.value = exports.nullSymbol;
		                    continue;
		                }
		                this.value = null;
		                const path = this.$ref.path || "";
		                const targetRef = this.path.replace(path, "");
		                const targetFound = Pointer.join("", found);
		                const parentPath = pathFromRoot?.replace(path, "");
		                throw new errors_js_1.MissingPointerError(token, decodeURI(this.originalPath), targetRef, targetFound, parentPath);
		            }
		            else {
		                this.value = this.value[token];
		            }
		            found.push(token);
		        }
		        // Resolve the final value
		        if (!this.value || (this.value.$ref && url.resolve(this.path, this.value.$ref) !== pathFromRoot)) {
		            resolveIf$Ref(this, options, pathFromRoot);
		        }
		        return this;
		    }
		    /**
		     * Sets the value of a nested property within the given object.
		     *
		     * @param obj - The object that will be crawled
		     * @param value - the value to assign
		     * @param options
		     *
		     * @returns
		     * Returns the modified object, or an entirely new object if the entire object is overwritten.
		     */
		    set(obj, value, options) {
		        const tokens = Pointer.parse(this.path);
		        let token;
		        if (tokens.length === 0) {
		            // There are no tokens, replace the entire object with the new value
		            this.value = value;
		            return value;
		        }
		        // Crawl the object, one token at a time
		        this.value = unwrapOrThrow(obj);
		        for (let i = 0; i < tokens.length - 1; i++) {
		            resolveIf$Ref(this, options);
		            token = tokens[i];
		            if (this.value && this.value[token] !== undefined) {
		                // The token exists
		                this.value = this.value[token];
		            }
		            else {
		                // The token doesn't exist, so create it
		                this.value = setValue(this, token, {});
		            }
		        }
		        // Set the value of the final token
		        resolveIf$Ref(this, options);
		        token = tokens[tokens.length - 1];
		        setValue(this, token, value);
		        // Return the updated object
		        return obj;
		    }
		    /**
		     * Parses a JSON pointer (or a path containing a JSON pointer in the hash)
		     * and returns an array of the pointer's tokens.
		     * (e.g. "schema.json#/definitions/person/name" => ["definitions", "person", "name"])
		     *
		     * The pointer is parsed according to RFC 6901
		     * {@link https://tools.ietf.org/html/rfc6901#section-3}
		     *
		     * @param path
		     * @param [originalPath]
		     * @returns
		     */
		    static parse(path, originalPath) {
		        // Get the JSON pointer from the path's hash
		        const pointer = url.getHash(path).substring(1);
		        // If there's no pointer, then there are no tokens,
		        // so return an empty array
		        if (!pointer) {
		            return [];
		        }
		        // Split into an array
		        const split = pointer.split("/");
		        // Decode each part, according to RFC 6901
		        for (let i = 0; i < split.length; i++) {
		            split[i] = safeDecodeURIComponent(split[i].replace(escapedSlash, "/").replace(escapedTilde, "~"));
		        }
		        if (split[0] !== "") {
		            throw new errors_js_1.InvalidPointerError(pointer, originalPath === undefined ? path : originalPath);
		        }
		        return split.slice(1);
		    }
		    /**
		     * Creates a JSON pointer path, by joining one or more tokens to a base path.
		     *
		     * @param base - The base path (e.g. "schema.json#/definitions/person")
		     * @param tokens - The token(s) to append (e.g. ["name", "first"])
		     * @returns
		     */
		    static join(base, tokens) {
		        // Ensure that the base path contains a hash
		        if (base.indexOf("#") === -1) {
		            base += "#";
		        }
		        // Append each token to the base path
		        tokens = Array.isArray(tokens) ? tokens : [tokens];
		        for (let i = 0; i < tokens.length; i++) {
		            const token = tokens[i];
		            // Encode the token, according to RFC 6901
		            base += "/" + encodeURIComponent(token.replace(tildes, "~0").replace(slashes, "~1"));
		        }
		        return base;
		    }
		}
		/**
		 * If the given pointer's {@link Pointer#value} is a JSON reference,
		 * then the reference is resolved and {@link Pointer#value} is replaced with the resolved value.
		 * In addition, {@link Pointer#path} and {@link Pointer#$ref} are updated to reflect the
		 * resolution path of the new value.
		 *
		 * @param pointer
		 * @param options
		 * @param [pathFromRoot] - the path of place that initiated resolving
		 * @returns - Returns `true` if the resolution path changed
		 */
		function resolveIf$Ref(pointer, options, pathFromRoot) {
		    // Is the value a JSON reference? (and allowed?)
		    if (ref_js_1.default.isAllowed$Ref(pointer.value, options)) {
		        const $refPath = url.resolve(pointer.path, pointer.value.$ref);
		        if ($refPath === pointer.path && !isRootPath(pathFromRoot)) {
		            // The value is a reference to itself, so there's nothing to do.
		            pointer.circular = true;
		        }
		        else {
		            const resolved = pointer.$ref.$refs._resolve($refPath, pointer.path, options);
		            if (resolved === null) {
		                return false;
		            }
		            pointer.indirections += resolved.indirections + 1;
		            if (ref_js_1.default.isExtended$Ref(pointer.value)) {
		                // This JSON reference "extends" the resolved value, rather than simply pointing to it.
		                // So the resolved path does NOT change.  Just the value does.
		                pointer.value = ref_js_1.default.dereference(pointer.value, resolved.value);
		                return false;
		            }
		            else {
		                // Resolve the reference
		                pointer.$ref = resolved.$ref;
		                pointer.path = resolved.path;
		                pointer.value = resolved.value;
		            }
		            return true;
		        }
		    }
		    return undefined;
		}
		exports.default = Pointer;
		/**
		 * Sets the specified token value of the {@link Pointer#value}.
		 *
		 * The token is evaluated according to RFC 6901.
		 * {@link https://tools.ietf.org/html/rfc6901#section-4}
		 *
		 * @param pointer - The JSON Pointer whose value will be modified
		 * @param token - A JSON Pointer token that indicates how to modify `obj`
		 * @param value - The value to assign
		 * @returns - Returns the assigned value
		 */
		function setValue(pointer, token, value) {
		    if (pointer.value && typeof pointer.value === "object") {
		        if (token === "-" && Array.isArray(pointer.value)) {
		            pointer.value.push(value);
		        }
		        else {
		            pointer.value[token] = value;
		        }
		    }
		    else {
		        throw new errors_js_1.JSONParserError(`Error assigning $ref pointer "${pointer.path}". \nCannot set "${token}" of a non-object.`);
		    }
		    return value;
		}
		function unwrapOrThrow(value) {
		    if ((0, errors_js_1.isHandledError)(value)) {
		        throw value;
		    }
		    return value;
		}
		function isRootPath(pathFromRoot) {
		    return typeof pathFromRoot == "string" && Pointer.parse(pathFromRoot).length == 0;
		} 
	} (pointer));
	return pointer;
}

var hasRequiredRef;

function requireRef () {
	if (hasRequiredRef) return ref;
	hasRequiredRef = 1;
	var __createBinding = (ref && ref.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (ref && ref.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (ref && ref.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(ref, "__esModule", { value: true });
	const pointer_js_1 = __importStar(requirePointer());
	const errors_js_1 = requireErrors();
	const url_js_1 = requireUrl();
	/**
	 * This class represents a single JSON reference and its resolved value.
	 *
	 * @class
	 */
	class $Ref {
	    constructor($refs) {
	        /**
	         * List of all errors. Undefined if no errors.
	         */
	        this.errors = [];
	        this.$refs = $refs;
	    }
	    /**
	     * Pushes an error to errors array.
	     *
	     * @param err - The error to be pushed
	     * @returns
	     */
	    addError(err) {
	        if (this.errors === undefined) {
	            this.errors = [];
	        }
	        const existingErrors = this.errors.map(({ footprint }) => footprint);
	        // the path has been almost certainly set at this point,
	        // but just in case something went wrong, normalizeError injects path if necessary
	        // moreover, certain errors might point at the same spot, so filter them out to reduce noise
	        if ("errors" in err && Array.isArray(err.errors)) {
	            this.errors.push(...err.errors.map(errors_js_1.normalizeError).filter(({ footprint }) => !existingErrors.includes(footprint)));
	        }
	        else if (!("footprint" in err) || !existingErrors.includes(err.footprint)) {
	            this.errors.push((0, errors_js_1.normalizeError)(err));
	        }
	    }
	    /**
	     * Determines whether the given JSON reference exists within this {@link $Ref#value}.
	     *
	     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
	     * @param options
	     * @returns
	     */
	    exists(path, options) {
	        try {
	            this.resolve(path, options);
	            return true;
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Resolves the given JSON reference within this {@link $Ref#value} and returns the resolved value.
	     *
	     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
	     * @param options
	     * @returns - Returns the resolved value
	     */
	    get(path, options) {
	        return this.resolve(path, options)?.value;
	    }
	    /**
	     * Resolves the given JSON reference within this {@link $Ref#value}.
	     *
	     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
	     * @param options
	     * @param friendlyPath - The original user-specified path (used for error messages)
	     * @param pathFromRoot - The path of `obj` from the schema root
	     * @returns
	     */
	    resolve(path, options, friendlyPath, pathFromRoot) {
	        const pointer = new pointer_js_1.default(this, path, friendlyPath);
	        try {
	            const resolved = pointer.resolve(this.value, options, pathFromRoot);
	            if (resolved.value === pointer_js_1.nullSymbol) {
	                resolved.value = null;
	            }
	            return resolved;
	        }
	        catch (err) {
	            if (!options || !options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
	                throw err;
	            }
	            if (err.path === null) {
	                err.path = (0, url_js_1.safePointerToPath)((0, url_js_1.getHash)(pathFromRoot));
	            }
	            if (err instanceof errors_js_1.InvalidPointerError) {
	                err.source = decodeURI((0, url_js_1.stripHash)(pathFromRoot));
	            }
	            this.addError(err);
	            return null;
	        }
	    }
	    /**
	     * Sets the value of a nested property within this {@link $Ref#value}.
	     * If the property, or any of its parents don't exist, they will be created.
	     *
	     * @param path - The full path of the property to set, optionally with a JSON pointer in the hash
	     * @param value - The value to assign
	     */
	    set(path, value) {
	        const pointer = new pointer_js_1.default(this, path);
	        this.value = pointer.set(this.value, value);
	        if (this.value === pointer_js_1.nullSymbol) {
	            this.value = null;
	        }
	    }
	    /**
	     * Determines whether the given value is a JSON reference.
	     *
	     * @param value - The value to inspect
	     * @returns
	     */
	    static is$Ref(value) {
	        return (Boolean(value) &&
	            typeof value === "object" &&
	            value !== null &&
	            "$ref" in value &&
	            typeof value.$ref === "string" &&
	            value.$ref.length > 0);
	    }
	    /**
	     * Determines whether the given value is an external JSON reference.
	     *
	     * @param value - The value to inspect
	     * @returns
	     */
	    static isExternal$Ref(value) {
	        return $Ref.is$Ref(value) && value.$ref[0] !== "#";
	    }
	    /**
	     * Determines whether the given value is a JSON reference, and whether it is allowed by the options.
	     * For example, if it references an external file, then options.resolve.external must be true.
	     *
	     * @param value - The value to inspect
	     * @param options
	     * @returns
	     */
	    static isAllowed$Ref(value, options) {
	        if (this.is$Ref(value)) {
	            if (value.$ref.substring(0, 2) === "#/" || value.$ref === "#") {
	                // It's a JSON Pointer reference, which is always allowed
	                return true;
	            }
	            else if (value.$ref[0] !== "#" && (!options || options.resolve?.external)) {
	                // It's an external reference, which is allowed by the options
	                return true;
	            }
	        }
	        return undefined;
	    }
	    /**
	     * Determines whether the given value is a JSON reference that "extends" its resolved value.
	     * That is, it has extra properties (in addition to "$ref"), so rather than simply pointing to
	     * an existing value, this $ref actually creates a NEW value that is a shallow copy of the resolved
	     * value, plus the extra properties.
	     *
	     * @example: {
	       person: {
	         properties: {
	           firstName: { type: string }
	           lastName: { type: string }
	         }
	       }
	       employee: {
	         properties: {
	           $ref: #/person/properties
	           salary: { type: number }
	         }
	       }
	     }
	     *  In this example, "employee" is an extended $ref, since it extends "person" with an additional
	     *  property (salary).  The result is a NEW value that looks like this:
	     *
	     *  {
	     *    properties: {
	     *      firstName: { type: string }
	     *      lastName: { type: string }
	     *      salary: { type: number }
	     *    }
	     *  }
	     *
	     * @param value - The value to inspect
	     * @returns
	     */
	    static isExtended$Ref(value) {
	        return $Ref.is$Ref(value) && Object.keys(value).length > 1;
	    }
	    /**
	     * Returns the resolved value of a JSON Reference.
	     * If necessary, the resolved value is merged with the JSON Reference to create a new object
	     *
	     * @example: {
	    person: {
	      properties: {
	        firstName: { type: string }
	        lastName: { type: string }
	      }
	    }
	    employee: {
	      properties: {
	        $ref: #/person/properties
	        salary: { type: number }
	      }
	    }
	    } When "person" and "employee" are merged, you end up with the following object:
	     *
	     *  {
	     *    properties: {
	     *      firstName: { type: string }
	     *      lastName: { type: string }
	     *      salary: { type: number }
	     *    }
	     *  }
	     *
	     * @param $ref - The JSON reference object (the one with the "$ref" property)
	     * @param resolvedValue - The resolved value, which can be any type
	     * @returns - Returns the dereferenced value
	     */
	    static dereference($ref, resolvedValue) {
	        if (resolvedValue && typeof resolvedValue === "object" && $Ref.isExtended$Ref($ref)) {
	            const merged = {};
	            for (const key of Object.keys($ref)) {
	                if (key !== "$ref") {
	                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
	                    merged[key] = $ref[key];
	                }
	            }
	            for (const key of Object.keys(resolvedValue)) {
	                if (!(key in merged)) {
	                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
	                    merged[key] = resolvedValue[key];
	                }
	            }
	            return merged;
	        }
	        else {
	            // Completely replace the original reference with the resolved value
	            return resolvedValue;
	        }
	    }
	}
	ref.default = $Ref;
	return ref;
}

var hasRequiredRefs;

function requireRefs () {
	if (hasRequiredRefs) return refs;
	hasRequiredRefs = 1;
	var __createBinding = (refs && refs.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (refs && refs.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (refs && refs.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (refs && refs.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(refs, "__esModule", { value: true });
	const ref_js_1 = __importDefault(requireRef());
	const url = __importStar(requireUrl());
	const convert_path_to_posix_1 = __importDefault(requireConvertPathToPosix());
	/**
	 * When you call the resolve method, the value that gets passed to the callback function (or Promise) is a $Refs object. This same object is accessible via the parser.$refs property of $RefParser objects.
	 *
	 * This object is a map of JSON References and their resolved values. It also has several convenient helper methods that make it easy for you to navigate and manipulate the JSON References.
	 *
	 * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html
	 */
	class $Refs {
	    /**
	     * Returns the paths/URLs of all the files in your schema (including the main schema file).
	     *
	     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#pathstypes
	     *
	     * @param types (optional) Optionally only return certain types of paths ("file", "http", etc.)
	     */
	    paths(...types) {
	        const paths = getPaths(this._$refs, types.flat());
	        return paths.map((path) => {
	            return (0, convert_path_to_posix_1.default)(path.decoded);
	        });
	    }
	    /**
	     * Returns a map of paths/URLs and their correspond values.
	     *
	     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#valuestypes
	     *
	     * @param types (optional) Optionally only return values from certain locations ("file", "http", etc.)
	     */
	    values(...types) {
	        const $refs = this._$refs;
	        const paths = getPaths($refs, types.flat());
	        return paths.reduce((obj, path) => {
	            obj[(0, convert_path_to_posix_1.default)(path.decoded)] = $refs[path.encoded].value;
	            return obj;
	        }, {});
	    }
	    /**
	     * Returns `true` if the given path exists in the schema; otherwise, returns `false`
	     *
	     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#existsref
	     *
	     * @param $ref The JSON Reference path, optionally with a JSON Pointer in the hash
	     */
	    /**
	     * Determines whether the given JSON reference exists.
	     *
	     * @param path - The path being resolved, optionally with a JSON pointer in the hash
	     * @param [options]
	     * @returns
	     */
	    exists(path, options) {
	        try {
	            this._resolve(path, "", options);
	            return true;
	        }
	        catch {
	            return false;
	        }
	    }
	    /**
	     * Resolves the given JSON reference and returns the resolved value.
	     *
	     * @param path - The path being resolved, with a JSON pointer in the hash
	     * @param [options]
	     * @returns - Returns the resolved value
	     */
	    get(path, options) {
	        return this._resolve(path, "", options).value;
	    }
	    /**
	     * Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.
	     *
	     * @param path The JSON Reference path, optionally with a JSON Pointer in the hash
	     * @param value The value to assign. Can be anything (object, string, number, etc.)
	     */
	    set(path, value) {
	        const absPath = url.resolve(this._root$Ref.path, path);
	        const withoutHash = url.stripHash(absPath);
	        const $ref = this._$refs[withoutHash];
	        if (!$ref) {
	            throw new Error(`Error resolving $ref pointer "${path}". \n"${withoutHash}" not found.`);
	        }
	        $ref.set(absPath, value);
	    }
	    /**
	     * Returns the specified {@link $Ref} object, or undefined.
	     *
	     * @param path - The path being resolved, optionally with a JSON pointer in the hash
	     * @returns
	     * @protected
	     */
	    _get$Ref(path) {
	        path = url.resolve(this._root$Ref.path, path);
	        const withoutHash = url.stripHash(path);
	        return this._$refs[withoutHash];
	    }
	    /**
	     * Creates a new {@link $Ref} object and adds it to this {@link $Refs} object.
	     *
	     * @param path  - The file path or URL of the referenced file
	     */
	    _add(path) {
	        const withoutHash = url.stripHash(path);
	        const $ref = new ref_js_1.default(this);
	        $ref.path = withoutHash;
	        this._$refs[withoutHash] = $ref;
	        this._root$Ref = this._root$Ref || $ref;
	        return $ref;
	    }
	    /**
	     * Resolves the given JSON reference.
	     *
	     * @param path - The path being resolved, optionally with a JSON pointer in the hash
	     * @param pathFromRoot - The path of `obj` from the schema root
	     * @param [options]
	     * @returns
	     * @protected
	     */
	    _resolve(path, pathFromRoot, options) {
	        const absPath = url.resolve(this._root$Ref.path, path);
	        const withoutHash = url.stripHash(absPath);
	        const $ref = this._$refs[withoutHash];
	        if (!$ref) {
	            throw new Error(`Error resolving $ref pointer "${path}". \n"${withoutHash}" not found.`);
	        }
	        return $ref.resolve(absPath, options, path, pathFromRoot);
	    }
	    constructor() {
	        /**
	         * A map of paths/urls to {@link $Ref} objects
	         *
	         * @type {object}
	         * @protected
	         */
	        this._$refs = {};
	        /**
	         * Returns the paths of all the files/URLs that are referenced by the JSON schema,
	         * including the schema itself.
	         *
	         * @param [types] - Only return paths of the given types ("file", "http", etc.)
	         * @returns
	         */
	        /**
	         * Returns the map of JSON references and their resolved values.
	         *
	         * @param [types] - Only return references of the given types ("file", "http", etc.)
	         * @returns
	         */
	        /**
	         * Returns a POJO (plain old JavaScript object) for serialization as JSON.
	         *
	         * @returns {object}
	         */
	        this.toJSON = this.values;
	        /**
	         * Indicates whether the schema contains any circular references.
	         *
	         * @type {boolean}
	         */
	        this.circular = false;
	        this._$refs = {};
	        // @ts-ignore
	        this._root$Ref = null;
	    }
	}
	refs.default = $Refs;
	/**
	 * Returns the encoded and decoded paths keys of the given object.
	 *
	 * @param $refs - The object whose keys are URL-encoded paths
	 * @param [types] - Only return paths of the given types ("file", "http", etc.)
	 * @returns
	 */
	function getPaths($refs, types) {
	    let paths = Object.keys($refs);
	    // Filter the paths by type
	    types = Array.isArray(types[0]) ? types[0] : Array.prototype.slice.call(types);
	    if (types.length > 0 && types[0]) {
	        paths = paths.filter((key) => {
	            return types.includes($refs[key].pathType);
	        });
	    }
	    // Decode local filesystem paths
	    return paths.map((path) => {
	        return {
	            encoded: path,
	            decoded: $refs[path].pathType === "file" ? url.toFileSystemPath(path, true) : path,
	        };
	    });
	}
	return refs;
}

var parse = {};

var plugins = {};

var hasRequiredPlugins;

function requirePlugins () {
	if (hasRequiredPlugins) return plugins;
	hasRequiredPlugins = 1;
	Object.defineProperty(plugins, "__esModule", { value: true });
	plugins.all = all;
	plugins.filter = filter;
	plugins.sort = sort;
	plugins.run = run;
	/**
	 * Returns the given plugins as an array, rather than an object map.
	 * All other methods in this module expect an array of plugins rather than an object map.
	 *
	 * @returns
	 */
	function all(plugins) {
	    return Object.keys(plugins || {})
	        .filter((key) => {
	        return typeof plugins[key] === "object";
	    })
	        .map((key) => {
	        plugins[key].name = key;
	        return plugins[key];
	    });
	}
	/**
	 * Filters the given plugins, returning only the ones return `true` for the given method.
	 */
	function filter(plugins, method, file) {
	    return plugins.filter((plugin) => {
	        return !!getResult(plugin, method, file);
	    });
	}
	/**
	 * Sorts the given plugins, in place, by their `order` property.
	 */
	function sort(plugins) {
	    for (const plugin of plugins) {
	        plugin.order = plugin.order || Number.MAX_SAFE_INTEGER;
	    }
	    return plugins.sort((a, b) => {
	        return a.order - b.order;
	    });
	}
	/**
	 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
	 * Each method can return a synchronous value, a Promise, or call an error-first callback.
	 * If the promise resolves successfully, or the callback is called without an error, then the result
	 * is immediately returned and no further plugins are called.
	 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
	 * If ALL plugins fail, then the last error is thrown.
	 */
	async function run(plugins, method, file, $refs) {
	    let plugin;
	    let lastError;
	    let index = 0;
	    return new Promise((resolve, reject) => {
	        runNextPlugin();
	        function runNextPlugin() {
	            plugin = plugins[index++];
	            if (!plugin) {
	                // There are no more functions, so re-throw the last error
	                return reject(lastError);
	            }
	            try {
	                // console.log('  %s', plugin.name);
	                const result = getResult(plugin, method, file, callback, $refs);
	                if (result && typeof result.then === "function") {
	                    // A promise was returned
	                    result.then(onSuccess, onError);
	                }
	                else if (result !== undefined) {
	                    // A synchronous result was returned
	                    onSuccess(result);
	                }
	                else if (index === plugins.length) {
	                    throw new Error("No promise has been returned or callback has been called.");
	                }
	            }
	            catch (e) {
	                onError(e);
	            }
	        }
	        function callback(err, result) {
	            if (err) {
	                onError(err);
	            }
	            else {
	                onSuccess(result);
	            }
	        }
	        function onSuccess(result) {
	            // console.log('    success');
	            resolve({
	                plugin,
	                result,
	            });
	        }
	        function onError(error) {
	            // console.log('    %s', err.message || err);
	            lastError = {
	                plugin,
	                error,
	            };
	            runNextPlugin();
	        }
	    });
	}
	/**
	 * Returns the value of the given property.
	 * If the property is a function, then the result of the function is returned.
	 * If the value is a RegExp, then it will be tested against the file URL.
	 * If the value is an array, then it will be compared against the file extension.
	 */
	function getResult(obj, prop, file, callback, $refs) {
	    const value = obj[prop];
	    if (typeof value === "function") {
	        return value.apply(obj, [file, callback, $refs]);
	    }
	    if (!callback) {
	        // The synchronous plugin functions (canParse and canRead)
	        // allow a "shorthand" syntax, where the user can match
	        // files by RegExp or by file extension.
	        if (value instanceof RegExp) {
	            return value.test(file.url);
	        }
	        else if (typeof value === "string") {
	            return value === file.extension;
	        }
	        else if (Array.isArray(value)) {
	            return value.indexOf(file.extension) !== -1;
	        }
	    }
	    return value;
	}
	return plugins;
}

var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse;
	hasRequiredParse = 1;
	var __createBinding = (parse && parse.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (parse && parse.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (parse && parse.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(parse, "__esModule", { value: true });
	const url = __importStar(requireUrl());
	const plugins = __importStar(requirePlugins());
	const errors_js_1 = requireErrors();
	/**
	 * Reads and parses the specified file path or URL.
	 */
	async function parse$1(path, $refs, options) {
	    // Remove the URL fragment, if any
	    const hashIndex = path.indexOf("#");
	    let hash = "";
	    if (hashIndex >= 0) {
	        hash = path.substring(hashIndex);
	        // Remove the URL fragment, if any
	        path = path.substring(0, hashIndex);
	    }
	    // Add a new $Ref for this file, even though we don't have the value yet.
	    // This ensures that we don't simultaneously read & parse the same file multiple times
	    const $ref = $refs._add(path);
	    // This "file object" will be passed to all resolvers and parsers.
	    const file = {
	        url: path,
	        hash,
	        extension: url.getExtension(path),
	    };
	    // Read the file and then parse the data
	    try {
	        const resolver = await readFile(file, options, $refs);
	        $ref.pathType = resolver.plugin.name;
	        file.data = resolver.result;
	        const parser = await parseFile(file, options, $refs);
	        $ref.value = parser.result;
	        return parser.result;
	    }
	    catch (err) {
	        if ((0, errors_js_1.isHandledError)(err)) {
	            $ref.value = err;
	        }
	        throw err;
	    }
	}
	/**
	 * Reads the given file, using the configured resolver plugins
	 *
	 * @param file           - An object containing information about the referenced file
	 * @param file.url       - The full URL of the referenced file
	 * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
	 * @param options
	 * @param $refs
	 * @returns
	 * The promise resolves with the raw file contents and the resolver that was used.
	 */
	async function readFile(file, options, $refs) {
	    // console.log('Reading %s', file.url);
	    // Find the resolvers that can read this file
	    let resolvers = plugins.all(options.resolve);
	    resolvers = plugins.filter(resolvers, "canRead", file);
	    // Run the resolvers, in order, until one of them succeeds
	    plugins.sort(resolvers);
	    try {
	        const data = await plugins.run(resolvers, "read", file, $refs);
	        return data;
	    }
	    catch (err) {
	        if (!err && options.continueOnError) {
	            // No resolver could be matched
	            throw new errors_js_1.UnmatchedResolverError(file.url);
	        }
	        else if (!err || !("error" in err)) {
	            // Throw a generic, friendly error.
	            throw new SyntaxError(`Unable to resolve $ref pointer "${file.url}"`);
	        }
	        // Throw the original error, if it's one of our own (user-friendly) errors.
	        else if (err.error instanceof errors_js_1.ResolverError) {
	            throw err.error;
	        }
	        else {
	            throw new errors_js_1.ResolverError(err, file.url);
	        }
	    }
	}
	/**
	 * Parses the given file's contents, using the configured parser plugins.
	 *
	 * @param file           - An object containing information about the referenced file
	 * @param file.url       - The full URL of the referenced file
	 * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
	 * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
	 * @param options
	 * @param $refs
	 *
	 * @returns
	 * The promise resolves with the parsed file contents and the parser that was used.
	 */
	async function parseFile(file, options, $refs) {
	    // Find the parsers that can read this file type.
	    // If none of the parsers are an exact match for this file, then we'll try ALL of them.
	    // This handles situations where the file IS a supported type, just with an unknown extension.
	    const allParsers = plugins.all(options.parse);
	    const filteredParsers = plugins.filter(allParsers, "canParse", file);
	    const parsers = filteredParsers.length > 0 ? filteredParsers : allParsers;
	    // Run the parsers, in order, until one of them succeeds
	    plugins.sort(parsers);
	    try {
	        const parser = await plugins.run(parsers, "parse", file, $refs);
	        if (!parser.plugin.allowEmpty && isEmpty(parser.result)) {
	            throw new SyntaxError(`Error parsing "${file.url}" as ${parser.plugin.name}. \nParsed value is empty`);
	        }
	        else {
	            return parser;
	        }
	    }
	    catch (err) {
	        if (!err && options.continueOnError) {
	            // No resolver could be matched
	            throw new errors_js_1.UnmatchedParserError(file.url);
	        }
	        else if (err && err.message && err.message.startsWith("Error parsing")) {
	            throw err;
	        }
	        else if (!err || !("error" in err)) {
	            throw new SyntaxError(`Unable to parse ${file.url}`);
	        }
	        else if (err.error instanceof errors_js_1.ParserError) {
	            throw err.error;
	        }
	        else {
	            throw new errors_js_1.ParserError(err.error.message, file.url);
	        }
	    }
	}
	/**
	 * Determines whether the parsed value is "empty".
	 *
	 * @param value
	 * @returns
	 */
	function isEmpty(value) {
	    return (value === undefined ||
	        (typeof value === "object" && Object.keys(value).length === 0) ||
	        (typeof value === "string" && value.trim().length === 0) ||
	        (Buffer.isBuffer(value) && value.length === 0));
	}
	parse.default = parse$1;
	return parse;
}

var normalizeArgs = {};

var options$1 = {};

var json$1 = {};

var hasRequiredJson$1;

function requireJson$1 () {
	if (hasRequiredJson$1) return json$1;
	hasRequiredJson$1 = 1;
	Object.defineProperty(json$1, "__esModule", { value: true });
	const errors_js_1 = requireErrors();
	json$1.default = {
	    /**
	     * The order that this parser will run, in relation to other parsers.
	     */
	    order: 100,
	    /**
	     * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
	     */
	    allowEmpty: true,
	    /**
	     * Determines whether this parser can parse a given file reference.
	     * Parsers that match will be tried, in order, until one successfully parses the file.
	     * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
	     * every parser will be tried.
	     */
	    canParse: ".json",
	    /**
	     * Allow JSON files with byte order marks (BOM)
	     */
	    allowBOM: true,
	    /**
	     * Parses the given file as JSON
	     */
	    async parse(file) {
	        let data = file.data;
	        if (Buffer.isBuffer(data)) {
	            data = data.toString();
	        }
	        if (typeof data === "string") {
	            if (data.trim().length === 0) {
	                return; // This mirrors the YAML behavior
	            }
	            else {
	                try {
	                    return JSON.parse(data);
	                }
	                catch (e) {
	                    if (this.allowBOM) {
	                        try {
	                            // find the first curly brace
	                            const firstCurlyBrace = data.indexOf("{");
	                            // remove any characters before the first curly brace
	                            data = data.slice(firstCurlyBrace);
	                            return JSON.parse(data);
	                        }
	                        catch (e) {
	                            throw new errors_js_1.ParserError(e.message, file.url);
	                        }
	                    }
	                    throw new errors_js_1.ParserError(e.message, file.url);
	                }
	            }
	        }
	        else {
	            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
	            return data;
	        }
	    },
	};
	return json$1;
}

var yaml = {};

var jsYaml = {};

var loader = {};

var common = {};

var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;


	function isNothing(subject) {
	  return (typeof subject === 'undefined') || (subject === null);
	}


	function isObject(subject) {
	  return (typeof subject === 'object') && (subject !== null);
	}


	function toArray(sequence) {
	  if (Array.isArray(sequence)) return sequence;
	  else if (isNothing(sequence)) return [];

	  return [ sequence ];
	}


	function extend(target, source) {
	  var index, length, key, sourceKeys;

	  if (source) {
	    sourceKeys = Object.keys(source);

	    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
	      key = sourceKeys[index];
	      target[key] = source[key];
	    }
	  }

	  return target;
	}


	function repeat(string, count) {
	  var result = '', cycle;

	  for (cycle = 0; cycle < count; cycle += 1) {
	    result += string;
	  }

	  return result;
	}


	function isNegativeZero(number) {
	  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
	}


	common.isNothing      = isNothing;
	common.isObject       = isObject;
	common.toArray        = toArray;
	common.repeat         = repeat;
	common.isNegativeZero = isNegativeZero;
	common.extend         = extend;
	return common;
}

var exception;
var hasRequiredException;

function requireException () {
	if (hasRequiredException) return exception;
	hasRequiredException = 1;


	function formatError(exception, compact) {
	  var where = '', message = exception.reason || '(unknown reason)';

	  if (!exception.mark) return message;

	  if (exception.mark.name) {
	    where += 'in "' + exception.mark.name + '" ';
	  }

	  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

	  if (!compact && exception.mark.snippet) {
	    where += '\n\n' + exception.mark.snippet;
	  }

	  return message + ' ' + where;
	}


	function YAMLException(reason, mark) {
	  // Super constructor
	  Error.call(this);

	  this.name = 'YAMLException';
	  this.reason = reason;
	  this.mark = mark;
	  this.message = formatError(this, false);

	  // Include stack trace in error object
	  if (Error.captureStackTrace) {
	    // Chrome and NodeJS
	    Error.captureStackTrace(this, this.constructor);
	  } else {
	    // FF, IE 10+ and Safari 6+. Fallback for others
	    this.stack = (new Error()).stack || '';
	  }
	}


	// Inherit from Error
	YAMLException.prototype = Object.create(Error.prototype);
	YAMLException.prototype.constructor = YAMLException;


	YAMLException.prototype.toString = function toString(compact) {
	  return this.name + ': ' + formatError(this, compact);
	};


	exception = YAMLException;
	return exception;
}

var snippet;
var hasRequiredSnippet;

function requireSnippet () {
	if (hasRequiredSnippet) return snippet;
	hasRequiredSnippet = 1;


	var common = requireCommon();


	// get snippet for a single line, respecting maxLength
	function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
	  var head = '';
	  var tail = '';
	  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

	  if (position - lineStart > maxHalfLength) {
	    head = ' ... ';
	    lineStart = position - maxHalfLength + head.length;
	  }

	  if (lineEnd - position > maxHalfLength) {
	    tail = ' ...';
	    lineEnd = position + maxHalfLength - tail.length;
	  }

	  return {
	    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
	    pos: position - lineStart + head.length // relative position
	  };
	}


	function padStart(string, max) {
	  return common.repeat(' ', max - string.length) + string;
	}


	function makeSnippet(mark, options) {
	  options = Object.create(options || null);

	  if (!mark.buffer) return null;

	  if (!options.maxLength) options.maxLength = 79;
	  if (typeof options.indent      !== 'number') options.indent      = 1;
	  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
	  if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

	  var re = /\r?\n|\r|\0/g;
	  var lineStarts = [ 0 ];
	  var lineEnds = [];
	  var match;
	  var foundLineNo = -1;

	  while ((match = re.exec(mark.buffer))) {
	    lineEnds.push(match.index);
	    lineStarts.push(match.index + match[0].length);

	    if (mark.position <= match.index && foundLineNo < 0) {
	      foundLineNo = lineStarts.length - 2;
	    }
	  }

	  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

	  var result = '', i, line;
	  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
	  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

	  for (i = 1; i <= options.linesBefore; i++) {
	    if (foundLineNo - i < 0) break;
	    line = getLine(
	      mark.buffer,
	      lineStarts[foundLineNo - i],
	      lineEnds[foundLineNo - i],
	      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
	      maxLineLength
	    );
	    result = common.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
	      ' | ' + line.str + '\n' + result;
	  }

	  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
	  result += common.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
	    ' | ' + line.str + '\n';
	  result += common.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

	  for (i = 1; i <= options.linesAfter; i++) {
	    if (foundLineNo + i >= lineEnds.length) break;
	    line = getLine(
	      mark.buffer,
	      lineStarts[foundLineNo + i],
	      lineEnds[foundLineNo + i],
	      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
	      maxLineLength
	    );
	    result += common.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
	      ' | ' + line.str + '\n';
	  }

	  return result.replace(/\n$/, '');
	}


	snippet = makeSnippet;
	return snippet;
}

var type;
var hasRequiredType;

function requireType () {
	if (hasRequiredType) return type;
	hasRequiredType = 1;

	var YAMLException = requireException();

	var TYPE_CONSTRUCTOR_OPTIONS = [
	  'kind',
	  'multi',
	  'resolve',
	  'construct',
	  'instanceOf',
	  'predicate',
	  'represent',
	  'representName',
	  'defaultStyle',
	  'styleAliases'
	];

	var YAML_NODE_KINDS = [
	  'scalar',
	  'sequence',
	  'mapping'
	];

	function compileStyleAliases(map) {
	  var result = {};

	  if (map !== null) {
	    Object.keys(map).forEach(function (style) {
	      map[style].forEach(function (alias) {
	        result[String(alias)] = style;
	      });
	    });
	  }

	  return result;
	}

	function Type(tag, options) {
	  options = options || {};

	  Object.keys(options).forEach(function (name) {
	    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
	      throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
	    }
	  });

	  // TODO: Add tag format check.
	  this.options       = options; // keep original options in case user wants to extend this type later
	  this.tag           = tag;
	  this.kind          = options['kind']          || null;
	  this.resolve       = options['resolve']       || function () { return true; };
	  this.construct     = options['construct']     || function (data) { return data; };
	  this.instanceOf    = options['instanceOf']    || null;
	  this.predicate     = options['predicate']     || null;
	  this.represent     = options['represent']     || null;
	  this.representName = options['representName'] || null;
	  this.defaultStyle  = options['defaultStyle']  || null;
	  this.multi         = options['multi']         || false;
	  this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

	  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
	    throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
	  }
	}

	type = Type;
	return type;
}

var schema;
var hasRequiredSchema;

function requireSchema () {
	if (hasRequiredSchema) return schema;
	hasRequiredSchema = 1;

	/*eslint-disable max-len*/

	var YAMLException = requireException();
	var Type          = requireType();


	function compileList(schema, name) {
	  var result = [];

	  schema[name].forEach(function (currentType) {
	    var newIndex = result.length;

	    result.forEach(function (previousType, previousIndex) {
	      if (previousType.tag === currentType.tag &&
	          previousType.kind === currentType.kind &&
	          previousType.multi === currentType.multi) {

	        newIndex = previousIndex;
	      }
	    });

	    result[newIndex] = currentType;
	  });

	  return result;
	}


	function compileMap(/* lists... */) {
	  var result = {
	        scalar: {},
	        sequence: {},
	        mapping: {},
	        fallback: {},
	        multi: {
	          scalar: [],
	          sequence: [],
	          mapping: [],
	          fallback: []
	        }
	      }, index, length;

	  function collectType(type) {
	    if (type.multi) {
	      result.multi[type.kind].push(type);
	      result.multi['fallback'].push(type);
	    } else {
	      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
	    }
	  }

	  for (index = 0, length = arguments.length; index < length; index += 1) {
	    arguments[index].forEach(collectType);
	  }
	  return result;
	}


	function Schema(definition) {
	  return this.extend(definition);
	}


	Schema.prototype.extend = function extend(definition) {
	  var implicit = [];
	  var explicit = [];

	  if (definition instanceof Type) {
	    // Schema.extend(type)
	    explicit.push(definition);

	  } else if (Array.isArray(definition)) {
	    // Schema.extend([ type1, type2, ... ])
	    explicit = explicit.concat(definition);

	  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
	    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
	    if (definition.implicit) implicit = implicit.concat(definition.implicit);
	    if (definition.explicit) explicit = explicit.concat(definition.explicit);

	  } else {
	    throw new YAMLException('Schema.extend argument should be a Type, [ Type ], ' +
	      'or a schema definition ({ implicit: [...], explicit: [...] })');
	  }

	  implicit.forEach(function (type) {
	    if (!(type instanceof Type)) {
	      throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
	    }

	    if (type.loadKind && type.loadKind !== 'scalar') {
	      throw new YAMLException('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
	    }

	    if (type.multi) {
	      throw new YAMLException('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
	    }
	  });

	  explicit.forEach(function (type) {
	    if (!(type instanceof Type)) {
	      throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
	    }
	  });

	  var result = Object.create(Schema.prototype);

	  result.implicit = (this.implicit || []).concat(implicit);
	  result.explicit = (this.explicit || []).concat(explicit);

	  result.compiledImplicit = compileList(result, 'implicit');
	  result.compiledExplicit = compileList(result, 'explicit');
	  result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

	  return result;
	};


	schema = Schema;
	return schema;
}

var str;
var hasRequiredStr;

function requireStr () {
	if (hasRequiredStr) return str;
	hasRequiredStr = 1;

	var Type = requireType();

	str = new Type('tag:yaml.org,2002:str', {
	  kind: 'scalar',
	  construct: function (data) { return data !== null ? data : ''; }
	});
	return str;
}

var seq;
var hasRequiredSeq;

function requireSeq () {
	if (hasRequiredSeq) return seq;
	hasRequiredSeq = 1;

	var Type = requireType();

	seq = new Type('tag:yaml.org,2002:seq', {
	  kind: 'sequence',
	  construct: function (data) { return data !== null ? data : []; }
	});
	return seq;
}

var map;
var hasRequiredMap;

function requireMap () {
	if (hasRequiredMap) return map;
	hasRequiredMap = 1;

	var Type = requireType();

	map = new Type('tag:yaml.org,2002:map', {
	  kind: 'mapping',
	  construct: function (data) { return data !== null ? data : {}; }
	});
	return map;
}

var failsafe;
var hasRequiredFailsafe;

function requireFailsafe () {
	if (hasRequiredFailsafe) return failsafe;
	hasRequiredFailsafe = 1;


	var Schema = requireSchema();


	failsafe = new Schema({
	  explicit: [
	    requireStr(),
	    requireSeq(),
	    requireMap()
	  ]
	});
	return failsafe;
}

var _null;
var hasRequired_null;

function require_null () {
	if (hasRequired_null) return _null;
	hasRequired_null = 1;

	var Type = requireType();

	function resolveYamlNull(data) {
	  if (data === null) return true;

	  var max = data.length;

	  return (max === 1 && data === '~') ||
	         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
	}

	function constructYamlNull() {
	  return null;
	}

	function isNull(object) {
	  return object === null;
	}

	_null = new Type('tag:yaml.org,2002:null', {
	  kind: 'scalar',
	  resolve: resolveYamlNull,
	  construct: constructYamlNull,
	  predicate: isNull,
	  represent: {
	    canonical: function () { return '~';    },
	    lowercase: function () { return 'null'; },
	    uppercase: function () { return 'NULL'; },
	    camelcase: function () { return 'Null'; },
	    empty:     function () { return '';     }
	  },
	  defaultStyle: 'lowercase'
	});
	return _null;
}

var bool;
var hasRequiredBool;

function requireBool () {
	if (hasRequiredBool) return bool;
	hasRequiredBool = 1;

	var Type = requireType();

	function resolveYamlBoolean(data) {
	  if (data === null) return false;

	  var max = data.length;

	  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
	         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
	}

	function constructYamlBoolean(data) {
	  return data === 'true' ||
	         data === 'True' ||
	         data === 'TRUE';
	}

	function isBoolean(object) {
	  return Object.prototype.toString.call(object) === '[object Boolean]';
	}

	bool = new Type('tag:yaml.org,2002:bool', {
	  kind: 'scalar',
	  resolve: resolveYamlBoolean,
	  construct: constructYamlBoolean,
	  predicate: isBoolean,
	  represent: {
	    lowercase: function (object) { return object ? 'true' : 'false'; },
	    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
	    camelcase: function (object) { return object ? 'True' : 'False'; }
	  },
	  defaultStyle: 'lowercase'
	});
	return bool;
}

var int;
var hasRequiredInt;

function requireInt () {
	if (hasRequiredInt) return int;
	hasRequiredInt = 1;

	var common = requireCommon();
	var Type   = requireType();

	function isHexCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
	         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
	         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
	}

	function isOctCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
	}

	function isDecCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
	}

	function resolveYamlInteger(data) {
	  if (data === null) return false;

	  var max = data.length,
	      index = 0,
	      hasDigits = false,
	      ch;

	  if (!max) return false;

	  ch = data[index];

	  // sign
	  if (ch === '-' || ch === '+') {
	    ch = data[++index];
	  }

	  if (ch === '0') {
	    // 0
	    if (index + 1 === max) return true;
	    ch = data[++index];

	    // base 2, base 8, base 16

	    if (ch === 'b') {
	      // base 2
	      index++;

	      for (; index < max; index++) {
	        ch = data[index];
	        if (ch === '_') continue;
	        if (ch !== '0' && ch !== '1') return false;
	        hasDigits = true;
	      }
	      return hasDigits && ch !== '_';
	    }


	    if (ch === 'x') {
	      // base 16
	      index++;

	      for (; index < max; index++) {
	        ch = data[index];
	        if (ch === '_') continue;
	        if (!isHexCode(data.charCodeAt(index))) return false;
	        hasDigits = true;
	      }
	      return hasDigits && ch !== '_';
	    }


	    if (ch === 'o') {
	      // base 8
	      index++;

	      for (; index < max; index++) {
	        ch = data[index];
	        if (ch === '_') continue;
	        if (!isOctCode(data.charCodeAt(index))) return false;
	        hasDigits = true;
	      }
	      return hasDigits && ch !== '_';
	    }
	  }

	  // base 10 (except 0)

	  // value should not start with `_`;
	  if (ch === '_') return false;

	  for (; index < max; index++) {
	    ch = data[index];
	    if (ch === '_') continue;
	    if (!isDecCode(data.charCodeAt(index))) {
	      return false;
	    }
	    hasDigits = true;
	  }

	  // Should have digits and should not end with `_`
	  if (!hasDigits || ch === '_') return false;

	  return true;
	}

	function constructYamlInteger(data) {
	  var value = data, sign = 1, ch;

	  if (value.indexOf('_') !== -1) {
	    value = value.replace(/_/g, '');
	  }

	  ch = value[0];

	  if (ch === '-' || ch === '+') {
	    if (ch === '-') sign = -1;
	    value = value.slice(1);
	    ch = value[0];
	  }

	  if (value === '0') return 0;

	  if (ch === '0') {
	    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
	    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
	    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
	  }

	  return sign * parseInt(value, 10);
	}

	function isInteger(object) {
	  return (Object.prototype.toString.call(object)) === '[object Number]' &&
	         (object % 1 === 0 && !common.isNegativeZero(object));
	}

	int = new Type('tag:yaml.org,2002:int', {
	  kind: 'scalar',
	  resolve: resolveYamlInteger,
	  construct: constructYamlInteger,
	  predicate: isInteger,
	  represent: {
	    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
	    octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
	    decimal:     function (obj) { return obj.toString(10); },
	    /* eslint-disable max-len */
	    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
	  },
	  defaultStyle: 'decimal',
	  styleAliases: {
	    binary:      [ 2,  'bin' ],
	    octal:       [ 8,  'oct' ],
	    decimal:     [ 10, 'dec' ],
	    hexadecimal: [ 16, 'hex' ]
	  }
	});
	return int;
}

var float;
var hasRequiredFloat;

function requireFloat () {
	if (hasRequiredFloat) return float;
	hasRequiredFloat = 1;

	var common = requireCommon();
	var Type   = requireType();

	var YAML_FLOAT_PATTERN = new RegExp(
	  // 2.5e4, 2.5 and integers
	  '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
	  // .2e4, .2
	  // special case, seems not from spec
	  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
	  // .inf
	  '|[-+]?\\.(?:inf|Inf|INF)' +
	  // .nan
	  '|\\.(?:nan|NaN|NAN))$');

	function resolveYamlFloat(data) {
	  if (data === null) return false;

	  if (!YAML_FLOAT_PATTERN.test(data) ||
	      // Quick hack to not allow integers end with `_`
	      // Probably should update regexp & check speed
	      data[data.length - 1] === '_') {
	    return false;
	  }

	  return true;
	}

	function constructYamlFloat(data) {
	  var value, sign;

	  value  = data.replace(/_/g, '').toLowerCase();
	  sign   = value[0] === '-' ? -1 : 1;

	  if ('+-'.indexOf(value[0]) >= 0) {
	    value = value.slice(1);
	  }

	  if (value === '.inf') {
	    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

	  } else if (value === '.nan') {
	    return NaN;
	  }
	  return sign * parseFloat(value, 10);
	}


	var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

	function representYamlFloat(object, style) {
	  var res;

	  if (isNaN(object)) {
	    switch (style) {
	      case 'lowercase': return '.nan';
	      case 'uppercase': return '.NAN';
	      case 'camelcase': return '.NaN';
	    }
	  } else if (Number.POSITIVE_INFINITY === object) {
	    switch (style) {
	      case 'lowercase': return '.inf';
	      case 'uppercase': return '.INF';
	      case 'camelcase': return '.Inf';
	    }
	  } else if (Number.NEGATIVE_INFINITY === object) {
	    switch (style) {
	      case 'lowercase': return '-.inf';
	      case 'uppercase': return '-.INF';
	      case 'camelcase': return '-.Inf';
	    }
	  } else if (common.isNegativeZero(object)) {
	    return '-0.0';
	  }

	  res = object.toString(10);

	  // JS stringifier can build scientific format without dots: 5e-100,
	  // while YAML requres dot: 5.e-100. Fix it with simple hack

	  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
	}

	function isFloat(object) {
	  return (Object.prototype.toString.call(object) === '[object Number]') &&
	         (object % 1 !== 0 || common.isNegativeZero(object));
	}

	float = new Type('tag:yaml.org,2002:float', {
	  kind: 'scalar',
	  resolve: resolveYamlFloat,
	  construct: constructYamlFloat,
	  predicate: isFloat,
	  represent: representYamlFloat,
	  defaultStyle: 'lowercase'
	});
	return float;
}

var json;
var hasRequiredJson;

function requireJson () {
	if (hasRequiredJson) return json;
	hasRequiredJson = 1;


	json = requireFailsafe().extend({
	  implicit: [
	    require_null(),
	    requireBool(),
	    requireInt(),
	    requireFloat()
	  ]
	});
	return json;
}

var core;
var hasRequiredCore;

function requireCore () {
	if (hasRequiredCore) return core;
	hasRequiredCore = 1;


	core = requireJson();
	return core;
}

var timestamp;
var hasRequiredTimestamp;

function requireTimestamp () {
	if (hasRequiredTimestamp) return timestamp;
	hasRequiredTimestamp = 1;

	var Type = requireType();

	var YAML_DATE_REGEXP = new RegExp(
	  '^([0-9][0-9][0-9][0-9])'          + // [1] year
	  '-([0-9][0-9])'                    + // [2] month
	  '-([0-9][0-9])$');                   // [3] day

	var YAML_TIMESTAMP_REGEXP = new RegExp(
	  '^([0-9][0-9][0-9][0-9])'          + // [1] year
	  '-([0-9][0-9]?)'                   + // [2] month
	  '-([0-9][0-9]?)'                   + // [3] day
	  '(?:[Tt]|[ \\t]+)'                 + // ...
	  '([0-9][0-9]?)'                    + // [4] hour
	  ':([0-9][0-9])'                    + // [5] minute
	  ':([0-9][0-9])'                    + // [6] second
	  '(?:\\.([0-9]*))?'                 + // [7] fraction
	  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
	  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

	function resolveYamlTimestamp(data) {
	  if (data === null) return false;
	  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
	  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
	  return false;
	}

	function constructYamlTimestamp(data) {
	  var match, year, month, day, hour, minute, second, fraction = 0,
	      delta = null, tz_hour, tz_minute, date;

	  match = YAML_DATE_REGEXP.exec(data);
	  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

	  if (match === null) throw new Error('Date resolve error');

	  // match: [1] year [2] month [3] day

	  year = +(match[1]);
	  month = +(match[2]) - 1; // JS month starts with 0
	  day = +(match[3]);

	  if (!match[4]) { // no hour
	    return new Date(Date.UTC(year, month, day));
	  }

	  // match: [4] hour [5] minute [6] second [7] fraction

	  hour = +(match[4]);
	  minute = +(match[5]);
	  second = +(match[6]);

	  if (match[7]) {
	    fraction = match[7].slice(0, 3);
	    while (fraction.length < 3) { // milli-seconds
	      fraction += '0';
	    }
	    fraction = +fraction;
	  }

	  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

	  if (match[9]) {
	    tz_hour = +(match[10]);
	    tz_minute = +(match[11] || 0);
	    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
	    if (match[9] === '-') delta = -delta;
	  }

	  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

	  if (delta) date.setTime(date.getTime() - delta);

	  return date;
	}

	function representYamlTimestamp(object /*, style*/) {
	  return object.toISOString();
	}

	timestamp = new Type('tag:yaml.org,2002:timestamp', {
	  kind: 'scalar',
	  resolve: resolveYamlTimestamp,
	  construct: constructYamlTimestamp,
	  instanceOf: Date,
	  represent: representYamlTimestamp
	});
	return timestamp;
}

var merge;
var hasRequiredMerge;

function requireMerge () {
	if (hasRequiredMerge) return merge;
	hasRequiredMerge = 1;

	var Type = requireType();

	function resolveYamlMerge(data) {
	  return data === '<<' || data === null;
	}

	merge = new Type('tag:yaml.org,2002:merge', {
	  kind: 'scalar',
	  resolve: resolveYamlMerge
	});
	return merge;
}

var binary$1;
var hasRequiredBinary$1;

function requireBinary$1 () {
	if (hasRequiredBinary$1) return binary$1;
	hasRequiredBinary$1 = 1;

	/*eslint-disable no-bitwise*/


	var Type = requireType();


	// [ 64, 65, 66 ] -> [ padding, CR, LF ]
	var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


	function resolveYamlBinary(data) {
	  if (data === null) return false;

	  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

	  // Convert one by one.
	  for (idx = 0; idx < max; idx++) {
	    code = map.indexOf(data.charAt(idx));

	    // Skip CR/LF
	    if (code > 64) continue;

	    // Fail on illegal characters
	    if (code < 0) return false;

	    bitlen += 6;
	  }

	  // If there are any bits left, source was corrupted
	  return (bitlen % 8) === 0;
	}

	function constructYamlBinary(data) {
	  var idx, tailbits,
	      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
	      max = input.length,
	      map = BASE64_MAP,
	      bits = 0,
	      result = [];

	  // Collect by 6*4 bits (3 bytes)

	  for (idx = 0; idx < max; idx++) {
	    if ((idx % 4 === 0) && idx) {
	      result.push((bits >> 16) & 0xFF);
	      result.push((bits >> 8) & 0xFF);
	      result.push(bits & 0xFF);
	    }

	    bits = (bits << 6) | map.indexOf(input.charAt(idx));
	  }

	  // Dump tail

	  tailbits = (max % 4) * 6;

	  if (tailbits === 0) {
	    result.push((bits >> 16) & 0xFF);
	    result.push((bits >> 8) & 0xFF);
	    result.push(bits & 0xFF);
	  } else if (tailbits === 18) {
	    result.push((bits >> 10) & 0xFF);
	    result.push((bits >> 2) & 0xFF);
	  } else if (tailbits === 12) {
	    result.push((bits >> 4) & 0xFF);
	  }

	  return new Uint8Array(result);
	}

	function representYamlBinary(object /*, style*/) {
	  var result = '', bits = 0, idx, tail,
	      max = object.length,
	      map = BASE64_MAP;

	  // Convert every three bytes to 4 ASCII characters.

	  for (idx = 0; idx < max; idx++) {
	    if ((idx % 3 === 0) && idx) {
	      result += map[(bits >> 18) & 0x3F];
	      result += map[(bits >> 12) & 0x3F];
	      result += map[(bits >> 6) & 0x3F];
	      result += map[bits & 0x3F];
	    }

	    bits = (bits << 8) + object[idx];
	  }

	  // Dump tail

	  tail = max % 3;

	  if (tail === 0) {
	    result += map[(bits >> 18) & 0x3F];
	    result += map[(bits >> 12) & 0x3F];
	    result += map[(bits >> 6) & 0x3F];
	    result += map[bits & 0x3F];
	  } else if (tail === 2) {
	    result += map[(bits >> 10) & 0x3F];
	    result += map[(bits >> 4) & 0x3F];
	    result += map[(bits << 2) & 0x3F];
	    result += map[64];
	  } else if (tail === 1) {
	    result += map[(bits >> 2) & 0x3F];
	    result += map[(bits << 4) & 0x3F];
	    result += map[64];
	    result += map[64];
	  }

	  return result;
	}

	function isBinary(obj) {
	  return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
	}

	binary$1 = new Type('tag:yaml.org,2002:binary', {
	  kind: 'scalar',
	  resolve: resolveYamlBinary,
	  construct: constructYamlBinary,
	  predicate: isBinary,
	  represent: representYamlBinary
	});
	return binary$1;
}

var omap;
var hasRequiredOmap;

function requireOmap () {
	if (hasRequiredOmap) return omap;
	hasRequiredOmap = 1;

	var Type = requireType();

	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var _toString       = Object.prototype.toString;

	function resolveYamlOmap(data) {
	  if (data === null) return true;

	  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
	      object = data;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];
	    pairHasKey = false;

	    if (_toString.call(pair) !== '[object Object]') return false;

	    for (pairKey in pair) {
	      if (_hasOwnProperty.call(pair, pairKey)) {
	        if (!pairHasKey) pairHasKey = true;
	        else return false;
	      }
	    }

	    if (!pairHasKey) return false;

	    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
	    else return false;
	  }

	  return true;
	}

	function constructYamlOmap(data) {
	  return data !== null ? data : [];
	}

	omap = new Type('tag:yaml.org,2002:omap', {
	  kind: 'sequence',
	  resolve: resolveYamlOmap,
	  construct: constructYamlOmap
	});
	return omap;
}

var pairs;
var hasRequiredPairs;

function requirePairs () {
	if (hasRequiredPairs) return pairs;
	hasRequiredPairs = 1;

	var Type = requireType();

	var _toString = Object.prototype.toString;

	function resolveYamlPairs(data) {
	  if (data === null) return true;

	  var index, length, pair, keys, result,
	      object = data;

	  result = new Array(object.length);

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];

	    if (_toString.call(pair) !== '[object Object]') return false;

	    keys = Object.keys(pair);

	    if (keys.length !== 1) return false;

	    result[index] = [ keys[0], pair[keys[0]] ];
	  }

	  return true;
	}

	function constructYamlPairs(data) {
	  if (data === null) return [];

	  var index, length, pair, keys, result,
	      object = data;

	  result = new Array(object.length);

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];

	    keys = Object.keys(pair);

	    result[index] = [ keys[0], pair[keys[0]] ];
	  }

	  return result;
	}

	pairs = new Type('tag:yaml.org,2002:pairs', {
	  kind: 'sequence',
	  resolve: resolveYamlPairs,
	  construct: constructYamlPairs
	});
	return pairs;
}

var set;
var hasRequiredSet;

function requireSet () {
	if (hasRequiredSet) return set;
	hasRequiredSet = 1;

	var Type = requireType();

	var _hasOwnProperty = Object.prototype.hasOwnProperty;

	function resolveYamlSet(data) {
	  if (data === null) return true;

	  var key, object = data;

	  for (key in object) {
	    if (_hasOwnProperty.call(object, key)) {
	      if (object[key] !== null) return false;
	    }
	  }

	  return true;
	}

	function constructYamlSet(data) {
	  return data !== null ? data : {};
	}

	set = new Type('tag:yaml.org,2002:set', {
	  kind: 'mapping',
	  resolve: resolveYamlSet,
	  construct: constructYamlSet
	});
	return set;
}

var _default;
var hasRequired_default;

function require_default () {
	if (hasRequired_default) return _default;
	hasRequired_default = 1;


	_default = requireCore().extend({
	  implicit: [
	    requireTimestamp(),
	    requireMerge()
	  ],
	  explicit: [
	    requireBinary$1(),
	    requireOmap(),
	    requirePairs(),
	    requireSet()
	  ]
	});
	return _default;
}

var hasRequiredLoader;

function requireLoader () {
	if (hasRequiredLoader) return loader;
	hasRequiredLoader = 1;

	/*eslint-disable max-len,no-use-before-define*/

	var common              = requireCommon();
	var YAMLException       = requireException();
	var makeSnippet         = requireSnippet();
	var DEFAULT_SCHEMA      = require_default();


	var _hasOwnProperty = Object.prototype.hasOwnProperty;


	var CONTEXT_FLOW_IN   = 1;
	var CONTEXT_FLOW_OUT  = 2;
	var CONTEXT_BLOCK_IN  = 3;
	var CONTEXT_BLOCK_OUT = 4;


	var CHOMPING_CLIP  = 1;
	var CHOMPING_STRIP = 2;
	var CHOMPING_KEEP  = 3;


	var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
	var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
	var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
	var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


	function _class(obj) { return Object.prototype.toString.call(obj); }

	function is_EOL(c) {
	  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
	}

	function is_WHITE_SPACE(c) {
	  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
	}

	function is_WS_OR_EOL(c) {
	  return (c === 0x09/* Tab */) ||
	         (c === 0x20/* Space */) ||
	         (c === 0x0A/* LF */) ||
	         (c === 0x0D/* CR */);
	}

	function is_FLOW_INDICATOR(c) {
	  return c === 0x2C/* , */ ||
	         c === 0x5B/* [ */ ||
	         c === 0x5D/* ] */ ||
	         c === 0x7B/* { */ ||
	         c === 0x7D/* } */;
	}

	function fromHexCode(c) {
	  var lc;

	  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
	    return c - 0x30;
	  }

	  /*eslint-disable no-bitwise*/
	  lc = c | 0x20;

	  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
	    return lc - 0x61 + 10;
	  }

	  return -1;
	}

	function escapedHexLen(c) {
	  if (c === 0x78/* x */) { return 2; }
	  if (c === 0x75/* u */) { return 4; }
	  if (c === 0x55/* U */) { return 8; }
	  return 0;
	}

	function fromDecimalCode(c) {
	  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
	    return c - 0x30;
	  }

	  return -1;
	}

	function simpleEscapeSequence(c) {
	  /* eslint-disable indent */
	  return (c === 0x30/* 0 */) ? '\x00' :
	        (c === 0x61/* a */) ? '\x07' :
	        (c === 0x62/* b */) ? '\x08' :
	        (c === 0x74/* t */) ? '\x09' :
	        (c === 0x09/* Tab */) ? '\x09' :
	        (c === 0x6E/* n */) ? '\x0A' :
	        (c === 0x76/* v */) ? '\x0B' :
	        (c === 0x66/* f */) ? '\x0C' :
	        (c === 0x72/* r */) ? '\x0D' :
	        (c === 0x65/* e */) ? '\x1B' :
	        (c === 0x20/* Space */) ? ' ' :
	        (c === 0x22/* " */) ? '\x22' :
	        (c === 0x2F/* / */) ? '/' :
	        (c === 0x5C/* \ */) ? '\x5C' :
	        (c === 0x4E/* N */) ? '\x85' :
	        (c === 0x5F/* _ */) ? '\xA0' :
	        (c === 0x4C/* L */) ? '\u2028' :
	        (c === 0x50/* P */) ? '\u2029' : '';
	}

	function charFromCodepoint(c) {
	  if (c <= 0xFFFF) {
	    return String.fromCharCode(c);
	  }
	  // Encode UTF-16 surrogate pair
	  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
	  return String.fromCharCode(
	    ((c - 0x010000) >> 10) + 0xD800,
	    ((c - 0x010000) & 0x03FF) + 0xDC00
	  );
	}

	var simpleEscapeCheck = new Array(256); // integer, for fast access
	var simpleEscapeMap = new Array(256);
	for (var i = 0; i < 256; i++) {
	  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
	  simpleEscapeMap[i] = simpleEscapeSequence(i);
	}


	function State(input, options) {
	  this.input = input;

	  this.filename  = options['filename']  || null;
	  this.schema    = options['schema']    || DEFAULT_SCHEMA;
	  this.onWarning = options['onWarning'] || null;
	  // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
	  // if such documents have no explicit %YAML directive
	  this.legacy    = options['legacy']    || false;

	  this.json      = options['json']      || false;
	  this.listener  = options['listener']  || null;

	  this.implicitTypes = this.schema.compiledImplicit;
	  this.typeMap       = this.schema.compiledTypeMap;

	  this.length     = input.length;
	  this.position   = 0;
	  this.line       = 0;
	  this.lineStart  = 0;
	  this.lineIndent = 0;

	  // position of first leading tab in the current line,
	  // used to make sure there are no tabs in the indentation
	  this.firstTabInLine = -1;

	  this.documents = [];

	  /*
	  this.version;
	  this.checkLineBreaks;
	  this.tagMap;
	  this.anchorMap;
	  this.tag;
	  this.anchor;
	  this.kind;
	  this.result;*/

	}


	function generateError(state, message) {
	  var mark = {
	    name:     state.filename,
	    buffer:   state.input.slice(0, -1), // omit trailing \0
	    position: state.position,
	    line:     state.line,
	    column:   state.position - state.lineStart
	  };

	  mark.snippet = makeSnippet(mark);

	  return new YAMLException(message, mark);
	}

	function throwError(state, message) {
	  throw generateError(state, message);
	}

	function throwWarning(state, message) {
	  if (state.onWarning) {
	    state.onWarning.call(null, generateError(state, message));
	  }
	}


	var directiveHandlers = {

	  YAML: function handleYamlDirective(state, name, args) {

	    var match, major, minor;

	    if (state.version !== null) {
	      throwError(state, 'duplication of %YAML directive');
	    }

	    if (args.length !== 1) {
	      throwError(state, 'YAML directive accepts exactly one argument');
	    }

	    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

	    if (match === null) {
	      throwError(state, 'ill-formed argument of the YAML directive');
	    }

	    major = parseInt(match[1], 10);
	    minor = parseInt(match[2], 10);

	    if (major !== 1) {
	      throwError(state, 'unacceptable YAML version of the document');
	    }

	    state.version = args[0];
	    state.checkLineBreaks = (minor < 2);

	    if (minor !== 1 && minor !== 2) {
	      throwWarning(state, 'unsupported YAML version of the document');
	    }
	  },

	  TAG: function handleTagDirective(state, name, args) {

	    var handle, prefix;

	    if (args.length !== 2) {
	      throwError(state, 'TAG directive accepts exactly two arguments');
	    }

	    handle = args[0];
	    prefix = args[1];

	    if (!PATTERN_TAG_HANDLE.test(handle)) {
	      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
	    }

	    if (_hasOwnProperty.call(state.tagMap, handle)) {
	      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
	    }

	    if (!PATTERN_TAG_URI.test(prefix)) {
	      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
	    }

	    try {
	      prefix = decodeURIComponent(prefix);
	    } catch (err) {
	      throwError(state, 'tag prefix is malformed: ' + prefix);
	    }

	    state.tagMap[handle] = prefix;
	  }
	};


	function captureSegment(state, start, end, checkJson) {
	  var _position, _length, _character, _result;

	  if (start < end) {
	    _result = state.input.slice(start, end);

	    if (checkJson) {
	      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
	        _character = _result.charCodeAt(_position);
	        if (!(_character === 0x09 ||
	              (0x20 <= _character && _character <= 0x10FFFF))) {
	          throwError(state, 'expected valid JSON character');
	        }
	      }
	    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
	      throwError(state, 'the stream contains non-printable characters');
	    }

	    state.result += _result;
	  }
	}

	function mergeMappings(state, destination, source, overridableKeys) {
	  var sourceKeys, key, index, quantity;

	  if (!common.isObject(source)) {
	    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
	  }

	  sourceKeys = Object.keys(source);

	  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
	    key = sourceKeys[index];

	    if (!_hasOwnProperty.call(destination, key)) {
	      destination[key] = source[key];
	      overridableKeys[key] = true;
	    }
	  }
	}

	function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
	  startLine, startLineStart, startPos) {

	  var index, quantity;

	  // The output is a plain object here, so keys can only be strings.
	  // We need to convert keyNode to a string, but doing so can hang the process
	  // (deeply nested arrays that explode exponentially using aliases).
	  if (Array.isArray(keyNode)) {
	    keyNode = Array.prototype.slice.call(keyNode);

	    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
	      if (Array.isArray(keyNode[index])) {
	        throwError(state, 'nested arrays are not supported inside keys');
	      }

	      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
	        keyNode[index] = '[object Object]';
	      }
	    }
	  }

	  // Avoid code execution in load() via toString property
	  // (still use its own toString for arrays, timestamps,
	  // and whatever user schema extensions happen to have @@toStringTag)
	  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
	    keyNode = '[object Object]';
	  }


	  keyNode = String(keyNode);

	  if (_result === null) {
	    _result = {};
	  }

	  if (keyTag === 'tag:yaml.org,2002:merge') {
	    if (Array.isArray(valueNode)) {
	      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
	        mergeMappings(state, _result, valueNode[index], overridableKeys);
	      }
	    } else {
	      mergeMappings(state, _result, valueNode, overridableKeys);
	    }
	  } else {
	    if (!state.json &&
	        !_hasOwnProperty.call(overridableKeys, keyNode) &&
	        _hasOwnProperty.call(_result, keyNode)) {
	      state.line = startLine || state.line;
	      state.lineStart = startLineStart || state.lineStart;
	      state.position = startPos || state.position;
	      throwError(state, 'duplicated mapping key');
	    }

	    // used for this specific key only because Object.defineProperty is slow
	    if (keyNode === '__proto__') {
	      Object.defineProperty(_result, keyNode, {
	        configurable: true,
	        enumerable: true,
	        writable: true,
	        value: valueNode
	      });
	    } else {
	      _result[keyNode] = valueNode;
	    }
	    delete overridableKeys[keyNode];
	  }

	  return _result;
	}

	function readLineBreak(state) {
	  var ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x0A/* LF */) {
	    state.position++;
	  } else if (ch === 0x0D/* CR */) {
	    state.position++;
	    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
	      state.position++;
	    }
	  } else {
	    throwError(state, 'a line break is expected');
	  }

	  state.line += 1;
	  state.lineStart = state.position;
	  state.firstTabInLine = -1;
	}

	function skipSeparationSpace(state, allowComments, checkIndent) {
	  var lineBreaks = 0,
	      ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {
	    while (is_WHITE_SPACE(ch)) {
	      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
	        state.firstTabInLine = state.position;
	      }
	      ch = state.input.charCodeAt(++state.position);
	    }

	    if (allowComments && ch === 0x23/* # */) {
	      do {
	        ch = state.input.charCodeAt(++state.position);
	      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
	    }

	    if (is_EOL(ch)) {
	      readLineBreak(state);

	      ch = state.input.charCodeAt(state.position);
	      lineBreaks++;
	      state.lineIndent = 0;

	      while (ch === 0x20/* Space */) {
	        state.lineIndent++;
	        ch = state.input.charCodeAt(++state.position);
	      }
	    } else {
	      break;
	    }
	  }

	  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
	    throwWarning(state, 'deficient indentation');
	  }

	  return lineBreaks;
	}

	function testDocumentSeparator(state) {
	  var _position = state.position,
	      ch;

	  ch = state.input.charCodeAt(_position);

	  // Condition state.position === state.lineStart is tested
	  // in parent on each call, for efficiency. No needs to test here again.
	  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
	      ch === state.input.charCodeAt(_position + 1) &&
	      ch === state.input.charCodeAt(_position + 2)) {

	    _position += 3;

	    ch = state.input.charCodeAt(_position);

	    if (ch === 0 || is_WS_OR_EOL(ch)) {
	      return true;
	    }
	  }

	  return false;
	}

	function writeFoldedLines(state, count) {
	  if (count === 1) {
	    state.result += ' ';
	  } else if (count > 1) {
	    state.result += common.repeat('\n', count - 1);
	  }
	}


	function readPlainScalar(state, nodeIndent, withinFlowCollection) {
	  var preceding,
	      following,
	      captureStart,
	      captureEnd,
	      hasPendingContent,
	      _line,
	      _lineStart,
	      _lineIndent,
	      _kind = state.kind,
	      _result = state.result,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (is_WS_OR_EOL(ch)      ||
	      is_FLOW_INDICATOR(ch) ||
	      ch === 0x23/* # */    ||
	      ch === 0x26/* & */    ||
	      ch === 0x2A/* * */    ||
	      ch === 0x21/* ! */    ||
	      ch === 0x7C/* | */    ||
	      ch === 0x3E/* > */    ||
	      ch === 0x27/* ' */    ||
	      ch === 0x22/* " */    ||
	      ch === 0x25/* % */    ||
	      ch === 0x40/* @ */    ||
	      ch === 0x60/* ` */) {
	    return false;
	  }

	  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
	    following = state.input.charCodeAt(state.position + 1);

	    if (is_WS_OR_EOL(following) ||
	        withinFlowCollection && is_FLOW_INDICATOR(following)) {
	      return false;
	    }
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  captureStart = captureEnd = state.position;
	  hasPendingContent = false;

	  while (ch !== 0) {
	    if (ch === 0x3A/* : */) {
	      following = state.input.charCodeAt(state.position + 1);

	      if (is_WS_OR_EOL(following) ||
	          withinFlowCollection && is_FLOW_INDICATOR(following)) {
	        break;
	      }

	    } else if (ch === 0x23/* # */) {
	      preceding = state.input.charCodeAt(state.position - 1);

	      if (is_WS_OR_EOL(preceding)) {
	        break;
	      }

	    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
	               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
	      break;

	    } else if (is_EOL(ch)) {
	      _line = state.line;
	      _lineStart = state.lineStart;
	      _lineIndent = state.lineIndent;
	      skipSeparationSpace(state, false, -1);

	      if (state.lineIndent >= nodeIndent) {
	        hasPendingContent = true;
	        ch = state.input.charCodeAt(state.position);
	        continue;
	      } else {
	        state.position = captureEnd;
	        state.line = _line;
	        state.lineStart = _lineStart;
	        state.lineIndent = _lineIndent;
	        break;
	      }
	    }

	    if (hasPendingContent) {
	      captureSegment(state, captureStart, captureEnd, false);
	      writeFoldedLines(state, state.line - _line);
	      captureStart = captureEnd = state.position;
	      hasPendingContent = false;
	    }

	    if (!is_WHITE_SPACE(ch)) {
	      captureEnd = state.position + 1;
	    }

	    ch = state.input.charCodeAt(++state.position);
	  }

	  captureSegment(state, captureStart, captureEnd, false);

	  if (state.result) {
	    return true;
	  }

	  state.kind = _kind;
	  state.result = _result;
	  return false;
	}

	function readSingleQuotedScalar(state, nodeIndent) {
	  var ch,
	      captureStart, captureEnd;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x27/* ' */) {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  state.position++;
	  captureStart = captureEnd = state.position;

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    if (ch === 0x27/* ' */) {
	      captureSegment(state, captureStart, state.position, true);
	      ch = state.input.charCodeAt(++state.position);

	      if (ch === 0x27/* ' */) {
	        captureStart = state.position;
	        state.position++;
	        captureEnd = state.position;
	      } else {
	        return true;
	      }

	    } else if (is_EOL(ch)) {
	      captureSegment(state, captureStart, captureEnd, true);
	      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
	      captureStart = captureEnd = state.position;

	    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
	      throwError(state, 'unexpected end of the document within a single quoted scalar');

	    } else {
	      state.position++;
	      captureEnd = state.position;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a single quoted scalar');
	}

	function readDoubleQuotedScalar(state, nodeIndent) {
	  var captureStart,
	      captureEnd,
	      hexLength,
	      hexResult,
	      tmp,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x22/* " */) {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  state.position++;
	  captureStart = captureEnd = state.position;

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    if (ch === 0x22/* " */) {
	      captureSegment(state, captureStart, state.position, true);
	      state.position++;
	      return true;

	    } else if (ch === 0x5C/* \ */) {
	      captureSegment(state, captureStart, state.position, true);
	      ch = state.input.charCodeAt(++state.position);

	      if (is_EOL(ch)) {
	        skipSeparationSpace(state, false, nodeIndent);

	        // TODO: rework to inline fn with no type cast?
	      } else if (ch < 256 && simpleEscapeCheck[ch]) {
	        state.result += simpleEscapeMap[ch];
	        state.position++;

	      } else if ((tmp = escapedHexLen(ch)) > 0) {
	        hexLength = tmp;
	        hexResult = 0;

	        for (; hexLength > 0; hexLength--) {
	          ch = state.input.charCodeAt(++state.position);

	          if ((tmp = fromHexCode(ch)) >= 0) {
	            hexResult = (hexResult << 4) + tmp;

	          } else {
	            throwError(state, 'expected hexadecimal character');
	          }
	        }

	        state.result += charFromCodepoint(hexResult);

	        state.position++;

	      } else {
	        throwError(state, 'unknown escape sequence');
	      }

	      captureStart = captureEnd = state.position;

	    } else if (is_EOL(ch)) {
	      captureSegment(state, captureStart, captureEnd, true);
	      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
	      captureStart = captureEnd = state.position;

	    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
	      throwError(state, 'unexpected end of the document within a double quoted scalar');

	    } else {
	      state.position++;
	      captureEnd = state.position;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a double quoted scalar');
	}

	function readFlowCollection(state, nodeIndent) {
	  var readNext = true,
	      _line,
	      _lineStart,
	      _pos,
	      _tag     = state.tag,
	      _result,
	      _anchor  = state.anchor,
	      following,
	      terminator,
	      isPair,
	      isExplicitPair,
	      isMapping,
	      overridableKeys = Object.create(null),
	      keyNode,
	      keyTag,
	      valueNode,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x5B/* [ */) {
	    terminator = 0x5D;/* ] */
	    isMapping = false;
	    _result = [];
	  } else if (ch === 0x7B/* { */) {
	    terminator = 0x7D;/* } */
	    isMapping = true;
	    _result = {};
	  } else {
	    return false;
	  }

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(++state.position);

	  while (ch !== 0) {
	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if (ch === terminator) {
	      state.position++;
	      state.tag = _tag;
	      state.anchor = _anchor;
	      state.kind = isMapping ? 'mapping' : 'sequence';
	      state.result = _result;
	      return true;
	    } else if (!readNext) {
	      throwError(state, 'missed comma between flow collection entries');
	    } else if (ch === 0x2C/* , */) {
	      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
	      throwError(state, "expected the node content, but found ','");
	    }

	    keyTag = keyNode = valueNode = null;
	    isPair = isExplicitPair = false;

	    if (ch === 0x3F/* ? */) {
	      following = state.input.charCodeAt(state.position + 1);

	      if (is_WS_OR_EOL(following)) {
	        isPair = isExplicitPair = true;
	        state.position++;
	        skipSeparationSpace(state, true, nodeIndent);
	      }
	    }

	    _line = state.line; // Save the current line.
	    _lineStart = state.lineStart;
	    _pos = state.position;
	    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
	    keyTag = state.tag;
	    keyNode = state.result;
	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
	      isPair = true;
	      ch = state.input.charCodeAt(++state.position);
	      skipSeparationSpace(state, true, nodeIndent);
	      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
	      valueNode = state.result;
	    }

	    if (isMapping) {
	      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
	    } else if (isPair) {
	      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
	    } else {
	      _result.push(keyNode);
	    }

	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if (ch === 0x2C/* , */) {
	      readNext = true;
	      ch = state.input.charCodeAt(++state.position);
	    } else {
	      readNext = false;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a flow collection');
	}

	function readBlockScalar(state, nodeIndent) {
	  var captureStart,
	      folding,
	      chomping       = CHOMPING_CLIP,
	      didReadContent = false,
	      detectedIndent = false,
	      textIndent     = nodeIndent,
	      emptyLines     = 0,
	      atMoreIndented = false,
	      tmp,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x7C/* | */) {
	    folding = false;
	  } else if (ch === 0x3E/* > */) {
	    folding = true;
	  } else {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';

	  while (ch !== 0) {
	    ch = state.input.charCodeAt(++state.position);

	    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
	      if (CHOMPING_CLIP === chomping) {
	        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
	      } else {
	        throwError(state, 'repeat of a chomping mode identifier');
	      }

	    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
	      if (tmp === 0) {
	        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
	      } else if (!detectedIndent) {
	        textIndent = nodeIndent + tmp - 1;
	        detectedIndent = true;
	      } else {
	        throwError(state, 'repeat of an indentation width identifier');
	      }

	    } else {
	      break;
	    }
	  }

	  if (is_WHITE_SPACE(ch)) {
	    do { ch = state.input.charCodeAt(++state.position); }
	    while (is_WHITE_SPACE(ch));

	    if (ch === 0x23/* # */) {
	      do { ch = state.input.charCodeAt(++state.position); }
	      while (!is_EOL(ch) && (ch !== 0));
	    }
	  }

	  while (ch !== 0) {
	    readLineBreak(state);
	    state.lineIndent = 0;

	    ch = state.input.charCodeAt(state.position);

	    while ((!detectedIndent || state.lineIndent < textIndent) &&
	           (ch === 0x20/* Space */)) {
	      state.lineIndent++;
	      ch = state.input.charCodeAt(++state.position);
	    }

	    if (!detectedIndent && state.lineIndent > textIndent) {
	      textIndent = state.lineIndent;
	    }

	    if (is_EOL(ch)) {
	      emptyLines++;
	      continue;
	    }

	    // End of the scalar.
	    if (state.lineIndent < textIndent) {

	      // Perform the chomping.
	      if (chomping === CHOMPING_KEEP) {
	        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
	      } else if (chomping === CHOMPING_CLIP) {
	        if (didReadContent) { // i.e. only if the scalar is not empty.
	          state.result += '\n';
	        }
	      }

	      // Break this `while` cycle and go to the funciton's epilogue.
	      break;
	    }

	    // Folded style: use fancy rules to handle line breaks.
	    if (folding) {

	      // Lines starting with white space characters (more-indented lines) are not folded.
	      if (is_WHITE_SPACE(ch)) {
	        atMoreIndented = true;
	        // except for the first content line (cf. Example 8.1)
	        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

	      // End of more-indented block.
	      } else if (atMoreIndented) {
	        atMoreIndented = false;
	        state.result += common.repeat('\n', emptyLines + 1);

	      // Just one line break - perceive as the same line.
	      } else if (emptyLines === 0) {
	        if (didReadContent) { // i.e. only if we have already read some scalar content.
	          state.result += ' ';
	        }

	      // Several line breaks - perceive as different lines.
	      } else {
	        state.result += common.repeat('\n', emptyLines);
	      }

	    // Literal style: just add exact number of line breaks between content lines.
	    } else {
	      // Keep all line breaks except the header line break.
	      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
	    }

	    didReadContent = true;
	    detectedIndent = true;
	    emptyLines = 0;
	    captureStart = state.position;

	    while (!is_EOL(ch) && (ch !== 0)) {
	      ch = state.input.charCodeAt(++state.position);
	    }

	    captureSegment(state, captureStart, state.position, false);
	  }

	  return true;
	}

	function readBlockSequence(state, nodeIndent) {
	  var _line,
	      _tag      = state.tag,
	      _anchor   = state.anchor,
	      _result   = [],
	      following,
	      detected  = false,
	      ch;

	  // there is a leading tab before this token, so it can't be a block sequence/mapping;
	  // it can still be flow sequence/mapping or a scalar
	  if (state.firstTabInLine !== -1) return false;

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {
	    if (state.firstTabInLine !== -1) {
	      state.position = state.firstTabInLine;
	      throwError(state, 'tab characters must not be used in indentation');
	    }

	    if (ch !== 0x2D/* - */) {
	      break;
	    }

	    following = state.input.charCodeAt(state.position + 1);

	    if (!is_WS_OR_EOL(following)) {
	      break;
	    }

	    detected = true;
	    state.position++;

	    if (skipSeparationSpace(state, true, -1)) {
	      if (state.lineIndent <= nodeIndent) {
	        _result.push(null);
	        ch = state.input.charCodeAt(state.position);
	        continue;
	      }
	    }

	    _line = state.line;
	    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
	    _result.push(state.result);
	    skipSeparationSpace(state, true, -1);

	    ch = state.input.charCodeAt(state.position);

	    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
	      throwError(state, 'bad indentation of a sequence entry');
	    } else if (state.lineIndent < nodeIndent) {
	      break;
	    }
	  }

	  if (detected) {
	    state.tag = _tag;
	    state.anchor = _anchor;
	    state.kind = 'sequence';
	    state.result = _result;
	    return true;
	  }
	  return false;
	}

	function readBlockMapping(state, nodeIndent, flowIndent) {
	  var following,
	      allowCompact,
	      _line,
	      _keyLine,
	      _keyLineStart,
	      _keyPos,
	      _tag          = state.tag,
	      _anchor       = state.anchor,
	      _result       = {},
	      overridableKeys = Object.create(null),
	      keyTag        = null,
	      keyNode       = null,
	      valueNode     = null,
	      atExplicitKey = false,
	      detected      = false,
	      ch;

	  // there is a leading tab before this token, so it can't be a block sequence/mapping;
	  // it can still be flow sequence/mapping or a scalar
	  if (state.firstTabInLine !== -1) return false;

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {
	    if (!atExplicitKey && state.firstTabInLine !== -1) {
	      state.position = state.firstTabInLine;
	      throwError(state, 'tab characters must not be used in indentation');
	    }

	    following = state.input.charCodeAt(state.position + 1);
	    _line = state.line; // Save the current line.

	    //
	    // Explicit notation case. There are two separate blocks:
	    // first for the key (denoted by "?") and second for the value (denoted by ":")
	    //
	    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

	      if (ch === 0x3F/* ? */) {
	        if (atExplicitKey) {
	          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
	          keyTag = keyNode = valueNode = null;
	        }

	        detected = true;
	        atExplicitKey = true;
	        allowCompact = true;

	      } else if (atExplicitKey) {
	        // i.e. 0x3A/* : */ === character after the explicit key.
	        atExplicitKey = false;
	        allowCompact = true;

	      } else {
	        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
	      }

	      state.position += 1;
	      ch = following;

	    //
	    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
	    //
	    } else {
	      _keyLine = state.line;
	      _keyLineStart = state.lineStart;
	      _keyPos = state.position;

	      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
	        // Neither implicit nor explicit notation.
	        // Reading is done. Go to the epilogue.
	        break;
	      }

	      if (state.line === _line) {
	        ch = state.input.charCodeAt(state.position);

	        while (is_WHITE_SPACE(ch)) {
	          ch = state.input.charCodeAt(++state.position);
	        }

	        if (ch === 0x3A/* : */) {
	          ch = state.input.charCodeAt(++state.position);

	          if (!is_WS_OR_EOL(ch)) {
	            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
	          }

	          if (atExplicitKey) {
	            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
	            keyTag = keyNode = valueNode = null;
	          }

	          detected = true;
	          atExplicitKey = false;
	          allowCompact = false;
	          keyTag = state.tag;
	          keyNode = state.result;

	        } else if (detected) {
	          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

	        } else {
	          state.tag = _tag;
	          state.anchor = _anchor;
	          return true; // Keep the result of `composeNode`.
	        }

	      } else if (detected) {
	        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

	      } else {
	        state.tag = _tag;
	        state.anchor = _anchor;
	        return true; // Keep the result of `composeNode`.
	      }
	    }

	    //
	    // Common reading code for both explicit and implicit notations.
	    //
	    if (state.line === _line || state.lineIndent > nodeIndent) {
	      if (atExplicitKey) {
	        _keyLine = state.line;
	        _keyLineStart = state.lineStart;
	        _keyPos = state.position;
	      }

	      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
	        if (atExplicitKey) {
	          keyNode = state.result;
	        } else {
	          valueNode = state.result;
	        }
	      }

	      if (!atExplicitKey) {
	        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
	        keyTag = keyNode = valueNode = null;
	      }

	      skipSeparationSpace(state, true, -1);
	      ch = state.input.charCodeAt(state.position);
	    }

	    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
	      throwError(state, 'bad indentation of a mapping entry');
	    } else if (state.lineIndent < nodeIndent) {
	      break;
	    }
	  }

	  //
	  // Epilogue.
	  //

	  // Special case: last mapping's node contains only the key in explicit notation.
	  if (atExplicitKey) {
	    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
	  }

	  // Expose the resulting mapping.
	  if (detected) {
	    state.tag = _tag;
	    state.anchor = _anchor;
	    state.kind = 'mapping';
	    state.result = _result;
	  }

	  return detected;
	}

	function readTagProperty(state) {
	  var _position,
	      isVerbatim = false,
	      isNamed    = false,
	      tagHandle,
	      tagName,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x21/* ! */) return false;

	  if (state.tag !== null) {
	    throwError(state, 'duplication of a tag property');
	  }

	  ch = state.input.charCodeAt(++state.position);

	  if (ch === 0x3C/* < */) {
	    isVerbatim = true;
	    ch = state.input.charCodeAt(++state.position);

	  } else if (ch === 0x21/* ! */) {
	    isNamed = true;
	    tagHandle = '!!';
	    ch = state.input.charCodeAt(++state.position);

	  } else {
	    tagHandle = '!';
	  }

	  _position = state.position;

	  if (isVerbatim) {
	    do { ch = state.input.charCodeAt(++state.position); }
	    while (ch !== 0 && ch !== 0x3E/* > */);

	    if (state.position < state.length) {
	      tagName = state.input.slice(_position, state.position);
	      ch = state.input.charCodeAt(++state.position);
	    } else {
	      throwError(state, 'unexpected end of the stream within a verbatim tag');
	    }
	  } else {
	    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

	      if (ch === 0x21/* ! */) {
	        if (!isNamed) {
	          tagHandle = state.input.slice(_position - 1, state.position + 1);

	          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
	            throwError(state, 'named tag handle cannot contain such characters');
	          }

	          isNamed = true;
	          _position = state.position + 1;
	        } else {
	          throwError(state, 'tag suffix cannot contain exclamation marks');
	        }
	      }

	      ch = state.input.charCodeAt(++state.position);
	    }

	    tagName = state.input.slice(_position, state.position);

	    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
	      throwError(state, 'tag suffix cannot contain flow indicator characters');
	    }
	  }

	  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
	    throwError(state, 'tag name cannot contain such characters: ' + tagName);
	  }

	  try {
	    tagName = decodeURIComponent(tagName);
	  } catch (err) {
	    throwError(state, 'tag name is malformed: ' + tagName);
	  }

	  if (isVerbatim) {
	    state.tag = tagName;

	  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
	    state.tag = state.tagMap[tagHandle] + tagName;

	  } else if (tagHandle === '!') {
	    state.tag = '!' + tagName;

	  } else if (tagHandle === '!!') {
	    state.tag = 'tag:yaml.org,2002:' + tagName;

	  } else {
	    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
	  }

	  return true;
	}

	function readAnchorProperty(state) {
	  var _position,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x26/* & */) return false;

	  if (state.anchor !== null) {
	    throwError(state, 'duplication of an anchor property');
	  }

	  ch = state.input.charCodeAt(++state.position);
	  _position = state.position;

	  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
	    ch = state.input.charCodeAt(++state.position);
	  }

	  if (state.position === _position) {
	    throwError(state, 'name of an anchor node must contain at least one character');
	  }

	  state.anchor = state.input.slice(_position, state.position);
	  return true;
	}

	function readAlias(state) {
	  var _position, alias,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x2A/* * */) return false;

	  ch = state.input.charCodeAt(++state.position);
	  _position = state.position;

	  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
	    ch = state.input.charCodeAt(++state.position);
	  }

	  if (state.position === _position) {
	    throwError(state, 'name of an alias node must contain at least one character');
	  }

	  alias = state.input.slice(_position, state.position);

	  if (!_hasOwnProperty.call(state.anchorMap, alias)) {
	    throwError(state, 'unidentified alias "' + alias + '"');
	  }

	  state.result = state.anchorMap[alias];
	  skipSeparationSpace(state, true, -1);
	  return true;
	}

	function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
	  var allowBlockStyles,
	      allowBlockScalars,
	      allowBlockCollections,
	      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
	      atNewLine  = false,
	      hasContent = false,
	      typeIndex,
	      typeQuantity,
	      typeList,
	      type,
	      flowIndent,
	      blockIndent;

	  if (state.listener !== null) {
	    state.listener('open', state);
	  }

	  state.tag    = null;
	  state.anchor = null;
	  state.kind   = null;
	  state.result = null;

	  allowBlockStyles = allowBlockScalars = allowBlockCollections =
	    CONTEXT_BLOCK_OUT === nodeContext ||
	    CONTEXT_BLOCK_IN  === nodeContext;

	  if (allowToSeek) {
	    if (skipSeparationSpace(state, true, -1)) {
	      atNewLine = true;

	      if (state.lineIndent > parentIndent) {
	        indentStatus = 1;
	      } else if (state.lineIndent === parentIndent) {
	        indentStatus = 0;
	      } else if (state.lineIndent < parentIndent) {
	        indentStatus = -1;
	      }
	    }
	  }

	  if (indentStatus === 1) {
	    while (readTagProperty(state) || readAnchorProperty(state)) {
	      if (skipSeparationSpace(state, true, -1)) {
	        atNewLine = true;
	        allowBlockCollections = allowBlockStyles;

	        if (state.lineIndent > parentIndent) {
	          indentStatus = 1;
	        } else if (state.lineIndent === parentIndent) {
	          indentStatus = 0;
	        } else if (state.lineIndent < parentIndent) {
	          indentStatus = -1;
	        }
	      } else {
	        allowBlockCollections = false;
	      }
	    }
	  }

	  if (allowBlockCollections) {
	    allowBlockCollections = atNewLine || allowCompact;
	  }

	  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
	    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
	      flowIndent = parentIndent;
	    } else {
	      flowIndent = parentIndent + 1;
	    }

	    blockIndent = state.position - state.lineStart;

	    if (indentStatus === 1) {
	      if (allowBlockCollections &&
	          (readBlockSequence(state, blockIndent) ||
	           readBlockMapping(state, blockIndent, flowIndent)) ||
	          readFlowCollection(state, flowIndent)) {
	        hasContent = true;
	      } else {
	        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
	            readSingleQuotedScalar(state, flowIndent) ||
	            readDoubleQuotedScalar(state, flowIndent)) {
	          hasContent = true;

	        } else if (readAlias(state)) {
	          hasContent = true;

	          if (state.tag !== null || state.anchor !== null) {
	            throwError(state, 'alias node should not have any properties');
	          }

	        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
	          hasContent = true;

	          if (state.tag === null) {
	            state.tag = '?';
	          }
	        }

	        if (state.anchor !== null) {
	          state.anchorMap[state.anchor] = state.result;
	        }
	      }
	    } else if (indentStatus === 0) {
	      // Special case: block sequences are allowed to have same indentation level as the parent.
	      // http://www.yaml.org/spec/1.2/spec.html#id2799784
	      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
	    }
	  }

	  if (state.tag === null) {
	    if (state.anchor !== null) {
	      state.anchorMap[state.anchor] = state.result;
	    }

	  } else if (state.tag === '?') {
	    // Implicit resolving is not allowed for non-scalar types, and '?'
	    // non-specific tag is only automatically assigned to plain scalars.
	    //
	    // We only need to check kind conformity in case user explicitly assigns '?'
	    // tag, for example like this: "!<?> [0]"
	    //
	    if (state.result !== null && state.kind !== 'scalar') {
	      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
	    }

	    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
	      type = state.implicitTypes[typeIndex];

	      if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
	        state.result = type.construct(state.result);
	        state.tag = type.tag;
	        if (state.anchor !== null) {
	          state.anchorMap[state.anchor] = state.result;
	        }
	        break;
	      }
	    }
	  } else if (state.tag !== '!') {
	    if (_hasOwnProperty.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
	      type = state.typeMap[state.kind || 'fallback'][state.tag];
	    } else {
	      // looking for multi type
	      type = null;
	      typeList = state.typeMap.multi[state.kind || 'fallback'];

	      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
	        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
	          type = typeList[typeIndex];
	          break;
	        }
	      }
	    }

	    if (!type) {
	      throwError(state, 'unknown tag !<' + state.tag + '>');
	    }

	    if (state.result !== null && type.kind !== state.kind) {
	      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
	    }

	    if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
	      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
	    } else {
	      state.result = type.construct(state.result, state.tag);
	      if (state.anchor !== null) {
	        state.anchorMap[state.anchor] = state.result;
	      }
	    }
	  }

	  if (state.listener !== null) {
	    state.listener('close', state);
	  }
	  return state.tag !== null ||  state.anchor !== null || hasContent;
	}

	function readDocument(state) {
	  var documentStart = state.position,
	      _position,
	      directiveName,
	      directiveArgs,
	      hasDirectives = false,
	      ch;

	  state.version = null;
	  state.checkLineBreaks = state.legacy;
	  state.tagMap = Object.create(null);
	  state.anchorMap = Object.create(null);

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    skipSeparationSpace(state, true, -1);

	    ch = state.input.charCodeAt(state.position);

	    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
	      break;
	    }

	    hasDirectives = true;
	    ch = state.input.charCodeAt(++state.position);
	    _position = state.position;

	    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
	      ch = state.input.charCodeAt(++state.position);
	    }

	    directiveName = state.input.slice(_position, state.position);
	    directiveArgs = [];

	    if (directiveName.length < 1) {
	      throwError(state, 'directive name must not be less than one character in length');
	    }

	    while (ch !== 0) {
	      while (is_WHITE_SPACE(ch)) {
	        ch = state.input.charCodeAt(++state.position);
	      }

	      if (ch === 0x23/* # */) {
	        do { ch = state.input.charCodeAt(++state.position); }
	        while (ch !== 0 && !is_EOL(ch));
	        break;
	      }

	      if (is_EOL(ch)) break;

	      _position = state.position;

	      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
	        ch = state.input.charCodeAt(++state.position);
	      }

	      directiveArgs.push(state.input.slice(_position, state.position));
	    }

	    if (ch !== 0) readLineBreak(state);

	    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
	      directiveHandlers[directiveName](state, directiveName, directiveArgs);
	    } else {
	      throwWarning(state, 'unknown document directive "' + directiveName + '"');
	    }
	  }

	  skipSeparationSpace(state, true, -1);

	  if (state.lineIndent === 0 &&
	      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
	      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
	      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
	    state.position += 3;
	    skipSeparationSpace(state, true, -1);

	  } else if (hasDirectives) {
	    throwError(state, 'directives end mark is expected');
	  }

	  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
	  skipSeparationSpace(state, true, -1);

	  if (state.checkLineBreaks &&
	      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
	    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
	  }

	  state.documents.push(state.result);

	  if (state.position === state.lineStart && testDocumentSeparator(state)) {

	    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
	      state.position += 3;
	      skipSeparationSpace(state, true, -1);
	    }
	    return;
	  }

	  if (state.position < (state.length - 1)) {
	    throwError(state, 'end of the stream or a document separator is expected');
	  } else {
	    return;
	  }
	}


	function loadDocuments(input, options) {
	  input = String(input);
	  options = options || {};

	  if (input.length !== 0) {

	    // Add tailing `\n` if not exists
	    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
	        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
	      input += '\n';
	    }

	    // Strip BOM
	    if (input.charCodeAt(0) === 0xFEFF) {
	      input = input.slice(1);
	    }
	  }

	  var state = new State(input, options);

	  var nullpos = input.indexOf('\0');

	  if (nullpos !== -1) {
	    state.position = nullpos;
	    throwError(state, 'null byte is not allowed in input');
	  }

	  // Use 0 as string terminator. That significantly simplifies bounds check.
	  state.input += '\0';

	  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
	    state.lineIndent += 1;
	    state.position += 1;
	  }

	  while (state.position < (state.length - 1)) {
	    readDocument(state);
	  }

	  return state.documents;
	}


	function loadAll(input, iterator, options) {
	  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
	    options = iterator;
	    iterator = null;
	  }

	  var documents = loadDocuments(input, options);

	  if (typeof iterator !== 'function') {
	    return documents;
	  }

	  for (var index = 0, length = documents.length; index < length; index += 1) {
	    iterator(documents[index]);
	  }
	}


	function load(input, options) {
	  var documents = loadDocuments(input, options);

	  if (documents.length === 0) {
	    /*eslint-disable no-undefined*/
	    return undefined;
	  } else if (documents.length === 1) {
	    return documents[0];
	  }
	  throw new YAMLException('expected a single document in the stream, but found more');
	}


	loader.loadAll = loadAll;
	loader.load    = load;
	return loader;
}

var dumper = {};

var hasRequiredDumper;

function requireDumper () {
	if (hasRequiredDumper) return dumper;
	hasRequiredDumper = 1;

	/*eslint-disable no-use-before-define*/

	var common              = requireCommon();
	var YAMLException       = requireException();
	var DEFAULT_SCHEMA      = require_default();

	var _toString       = Object.prototype.toString;
	var _hasOwnProperty = Object.prototype.hasOwnProperty;

	var CHAR_BOM                  = 0xFEFF;
	var CHAR_TAB                  = 0x09; /* Tab */
	var CHAR_LINE_FEED            = 0x0A; /* LF */
	var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
	var CHAR_SPACE                = 0x20; /* Space */
	var CHAR_EXCLAMATION          = 0x21; /* ! */
	var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
	var CHAR_SHARP                = 0x23; /* # */
	var CHAR_PERCENT              = 0x25; /* % */
	var CHAR_AMPERSAND            = 0x26; /* & */
	var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
	var CHAR_ASTERISK             = 0x2A; /* * */
	var CHAR_COMMA                = 0x2C; /* , */
	var CHAR_MINUS                = 0x2D; /* - */
	var CHAR_COLON                = 0x3A; /* : */
	var CHAR_EQUALS               = 0x3D; /* = */
	var CHAR_GREATER_THAN         = 0x3E; /* > */
	var CHAR_QUESTION             = 0x3F; /* ? */
	var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
	var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
	var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
	var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
	var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
	var CHAR_VERTICAL_LINE        = 0x7C; /* | */
	var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

	var ESCAPE_SEQUENCES = {};

	ESCAPE_SEQUENCES[0x00]   = '\\0';
	ESCAPE_SEQUENCES[0x07]   = '\\a';
	ESCAPE_SEQUENCES[0x08]   = '\\b';
	ESCAPE_SEQUENCES[0x09]   = '\\t';
	ESCAPE_SEQUENCES[0x0A]   = '\\n';
	ESCAPE_SEQUENCES[0x0B]   = '\\v';
	ESCAPE_SEQUENCES[0x0C]   = '\\f';
	ESCAPE_SEQUENCES[0x0D]   = '\\r';
	ESCAPE_SEQUENCES[0x1B]   = '\\e';
	ESCAPE_SEQUENCES[0x22]   = '\\"';
	ESCAPE_SEQUENCES[0x5C]   = '\\\\';
	ESCAPE_SEQUENCES[0x85]   = '\\N';
	ESCAPE_SEQUENCES[0xA0]   = '\\_';
	ESCAPE_SEQUENCES[0x2028] = '\\L';
	ESCAPE_SEQUENCES[0x2029] = '\\P';

	var DEPRECATED_BOOLEANS_SYNTAX = [
	  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
	  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
	];

	var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

	function compileStyleMap(schema, map) {
	  var result, keys, index, length, tag, style, type;

	  if (map === null) return {};

	  result = {};
	  keys = Object.keys(map);

	  for (index = 0, length = keys.length; index < length; index += 1) {
	    tag = keys[index];
	    style = String(map[tag]);

	    if (tag.slice(0, 2) === '!!') {
	      tag = 'tag:yaml.org,2002:' + tag.slice(2);
	    }
	    type = schema.compiledTypeMap['fallback'][tag];

	    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
	      style = type.styleAliases[style];
	    }

	    result[tag] = style;
	  }

	  return result;
	}

	function encodeHex(character) {
	  var string, handle, length;

	  string = character.toString(16).toUpperCase();

	  if (character <= 0xFF) {
	    handle = 'x';
	    length = 2;
	  } else if (character <= 0xFFFF) {
	    handle = 'u';
	    length = 4;
	  } else if (character <= 0xFFFFFFFF) {
	    handle = 'U';
	    length = 8;
	  } else {
	    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
	  }

	  return '\\' + handle + common.repeat('0', length - string.length) + string;
	}


	var QUOTING_TYPE_SINGLE = 1,
	    QUOTING_TYPE_DOUBLE = 2;

	function State(options) {
	  this.schema        = options['schema'] || DEFAULT_SCHEMA;
	  this.indent        = Math.max(1, (options['indent'] || 2));
	  this.noArrayIndent = options['noArrayIndent'] || false;
	  this.skipInvalid   = options['skipInvalid'] || false;
	  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
	  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
	  this.sortKeys      = options['sortKeys'] || false;
	  this.lineWidth     = options['lineWidth'] || 80;
	  this.noRefs        = options['noRefs'] || false;
	  this.noCompatMode  = options['noCompatMode'] || false;
	  this.condenseFlow  = options['condenseFlow'] || false;
	  this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
	  this.forceQuotes   = options['forceQuotes'] || false;
	  this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

	  this.implicitTypes = this.schema.compiledImplicit;
	  this.explicitTypes = this.schema.compiledExplicit;

	  this.tag = null;
	  this.result = '';

	  this.duplicates = [];
	  this.usedDuplicates = null;
	}

	// Indents every line in a string. Empty lines (\n only) are not indented.
	function indentString(string, spaces) {
	  var ind = common.repeat(' ', spaces),
	      position = 0,
	      next = -1,
	      result = '',
	      line,
	      length = string.length;

	  while (position < length) {
	    next = string.indexOf('\n', position);
	    if (next === -1) {
	      line = string.slice(position);
	      position = length;
	    } else {
	      line = string.slice(position, next + 1);
	      position = next + 1;
	    }

	    if (line.length && line !== '\n') result += ind;

	    result += line;
	  }

	  return result;
	}

	function generateNextLine(state, level) {
	  return '\n' + common.repeat(' ', state.indent * level);
	}

	function testImplicitResolving(state, str) {
	  var index, length, type;

	  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
	    type = state.implicitTypes[index];

	    if (type.resolve(str)) {
	      return true;
	    }
	  }

	  return false;
	}

	// [33] s-white ::= s-space | s-tab
	function isWhitespace(c) {
	  return c === CHAR_SPACE || c === CHAR_TAB;
	}

	// Returns true if the character can be printed without escaping.
	// From YAML 1.2: "any allowed characters known to be non-printable
	// should also be escaped. [However,] This isn’t mandatory"
	// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
	function isPrintable(c) {
	  return  (0x00020 <= c && c <= 0x00007E)
	      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
	      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
	      ||  (0x10000 <= c && c <= 0x10FFFF);
	}

	// [34] ns-char ::= nb-char - s-white
	// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
	// [26] b-char  ::= b-line-feed | b-carriage-return
	// Including s-white (for some reason, examples doesn't match specs in this aspect)
	// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
	function isNsCharOrWhitespace(c) {
	  return isPrintable(c)
	    && c !== CHAR_BOM
	    // - b-char
	    && c !== CHAR_CARRIAGE_RETURN
	    && c !== CHAR_LINE_FEED;
	}

	// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
	//                             c = flow-in   ⇒ ns-plain-safe-in
	//                             c = block-key ⇒ ns-plain-safe-out
	//                             c = flow-key  ⇒ ns-plain-safe-in
	// [128] ns-plain-safe-out ::= ns-char
	// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
	// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
	//                            | ( /* An ns-char preceding */ “#” )
	//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
	function isPlainSafe(c, prev, inblock) {
	  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
	  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
	  return (
	    // ns-plain-safe
	    inblock ? // c = flow-in
	      cIsNsCharOrWhitespace
	      : cIsNsCharOrWhitespace
	        // - c-flow-indicator
	        && c !== CHAR_COMMA
	        && c !== CHAR_LEFT_SQUARE_BRACKET
	        && c !== CHAR_RIGHT_SQUARE_BRACKET
	        && c !== CHAR_LEFT_CURLY_BRACKET
	        && c !== CHAR_RIGHT_CURLY_BRACKET
	  )
	    // ns-plain-char
	    && c !== CHAR_SHARP // false on '#'
	    && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
	    || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
	    || (prev === CHAR_COLON && cIsNsChar); // change to true on ':[^ ]'
	}

	// Simplified test for values allowed as the first character in plain style.
	function isPlainSafeFirst(c) {
	  // Uses a subset of ns-char - c-indicator
	  // where ns-char = nb-char - s-white.
	  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
	  return isPrintable(c) && c !== CHAR_BOM
	    && !isWhitespace(c) // - s-white
	    // - (c-indicator ::=
	    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
	    && c !== CHAR_MINUS
	    && c !== CHAR_QUESTION
	    && c !== CHAR_COLON
	    && c !== CHAR_COMMA
	    && c !== CHAR_LEFT_SQUARE_BRACKET
	    && c !== CHAR_RIGHT_SQUARE_BRACKET
	    && c !== CHAR_LEFT_CURLY_BRACKET
	    && c !== CHAR_RIGHT_CURLY_BRACKET
	    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
	    && c !== CHAR_SHARP
	    && c !== CHAR_AMPERSAND
	    && c !== CHAR_ASTERISK
	    && c !== CHAR_EXCLAMATION
	    && c !== CHAR_VERTICAL_LINE
	    && c !== CHAR_EQUALS
	    && c !== CHAR_GREATER_THAN
	    && c !== CHAR_SINGLE_QUOTE
	    && c !== CHAR_DOUBLE_QUOTE
	    // | “%” | “@” | “`”)
	    && c !== CHAR_PERCENT
	    && c !== CHAR_COMMERCIAL_AT
	    && c !== CHAR_GRAVE_ACCENT;
	}

	// Simplified test for values allowed as the last character in plain style.
	function isPlainSafeLast(c) {
	  // just not whitespace or colon, it will be checked to be plain character later
	  return !isWhitespace(c) && c !== CHAR_COLON;
	}

	// Same as 'string'.codePointAt(pos), but works in older browsers.
	function codePointAt(string, pos) {
	  var first = string.charCodeAt(pos), second;
	  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
	    second = string.charCodeAt(pos + 1);
	    if (second >= 0xDC00 && second <= 0xDFFF) {
	      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
	    }
	  }
	  return first;
	}

	// Determines whether block indentation indicator is required.
	function needIndentIndicator(string) {
	  var leadingSpaceRe = /^\n* /;
	  return leadingSpaceRe.test(string);
	}

	var STYLE_PLAIN   = 1,
	    STYLE_SINGLE  = 2,
	    STYLE_LITERAL = 3,
	    STYLE_FOLDED  = 4,
	    STYLE_DOUBLE  = 5;

	// Determines which scalar styles are possible and returns the preferred style.
	// lineWidth = -1 => no limit.
	// Pre-conditions: str.length > 0.
	// Post-conditions:
	//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
	//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
	//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
	function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
	  testAmbiguousType, quotingType, forceQuotes, inblock) {

	  var i;
	  var char = 0;
	  var prevChar = null;
	  var hasLineBreak = false;
	  var hasFoldableLine = false; // only checked if shouldTrackWidth
	  var shouldTrackWidth = lineWidth !== -1;
	  var previousLineBreak = -1; // count the first line correctly
	  var plain = isPlainSafeFirst(codePointAt(string, 0))
	          && isPlainSafeLast(codePointAt(string, string.length - 1));

	  if (singleLineOnly || forceQuotes) {
	    // Case: no block styles.
	    // Check for disallowed characters to rule out plain and single.
	    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
	      char = codePointAt(string, i);
	      if (!isPrintable(char)) {
	        return STYLE_DOUBLE;
	      }
	      plain = plain && isPlainSafe(char, prevChar, inblock);
	      prevChar = char;
	    }
	  } else {
	    // Case: block styles permitted.
	    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
	      char = codePointAt(string, i);
	      if (char === CHAR_LINE_FEED) {
	        hasLineBreak = true;
	        // Check if any line can be folded.
	        if (shouldTrackWidth) {
	          hasFoldableLine = hasFoldableLine ||
	            // Foldable line = too long, and not more-indented.
	            (i - previousLineBreak - 1 > lineWidth &&
	             string[previousLineBreak + 1] !== ' ');
	          previousLineBreak = i;
	        }
	      } else if (!isPrintable(char)) {
	        return STYLE_DOUBLE;
	      }
	      plain = plain && isPlainSafe(char, prevChar, inblock);
	      prevChar = char;
	    }
	    // in case the end is missing a \n
	    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
	      (i - previousLineBreak - 1 > lineWidth &&
	       string[previousLineBreak + 1] !== ' '));
	  }
	  // Although every style can represent \n without escaping, prefer block styles
	  // for multiline, since they're more readable and they don't add empty lines.
	  // Also prefer folding a super-long line.
	  if (!hasLineBreak && !hasFoldableLine) {
	    // Strings interpretable as another type have to be quoted;
	    // e.g. the string 'true' vs. the boolean true.
	    if (plain && !forceQuotes && !testAmbiguousType(string)) {
	      return STYLE_PLAIN;
	    }
	    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
	  }
	  // Edge case: block indentation indicator can only have one digit.
	  if (indentPerLevel > 9 && needIndentIndicator(string)) {
	    return STYLE_DOUBLE;
	  }
	  // At this point we know block styles are valid.
	  // Prefer literal style unless we want to fold.
	  if (!forceQuotes) {
	    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
	  }
	  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
	}

	// Note: line breaking/folding is implemented for only the folded style.
	// NB. We drop the last trailing newline (if any) of a returned block scalar
	//  since the dumper adds its own newline. This always works:
	//    • No ending newline => unaffected; already using strip "-" chomping.
	//    • Ending newline    => removed then restored.
	//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
	function writeScalar(state, string, level, iskey, inblock) {
	  state.dump = (function () {
	    if (string.length === 0) {
	      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
	    }
	    if (!state.noCompatMode) {
	      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
	        return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
	      }
	    }

	    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
	    // As indentation gets deeper, let the width decrease monotonically
	    // to the lower bound min(state.lineWidth, 40).
	    // Note that this implies
	    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
	    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
	    // This behaves better than a constant minimum width which disallows narrower options,
	    // or an indent threshold which causes the width to suddenly increase.
	    var lineWidth = state.lineWidth === -1
	      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

	    // Without knowing if keys are implicit/explicit, assume implicit for safety.
	    var singleLineOnly = iskey
	      // No block styles in flow mode.
	      || (state.flowLevel > -1 && level >= state.flowLevel);
	    function testAmbiguity(string) {
	      return testImplicitResolving(state, string);
	    }

	    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
	      testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

	      case STYLE_PLAIN:
	        return string;
	      case STYLE_SINGLE:
	        return "'" + string.replace(/'/g, "''") + "'";
	      case STYLE_LITERAL:
	        return '|' + blockHeader(string, state.indent)
	          + dropEndingNewline(indentString(string, indent));
	      case STYLE_FOLDED:
	        return '>' + blockHeader(string, state.indent)
	          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
	      case STYLE_DOUBLE:
	        return '"' + escapeString(string) + '"';
	      default:
	        throw new YAMLException('impossible error: invalid scalar style');
	    }
	  }());
	}

	// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
	function blockHeader(string, indentPerLevel) {
	  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

	  // note the special case: the string '\n' counts as a "trailing" empty line.
	  var clip =          string[string.length - 1] === '\n';
	  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
	  var chomp = keep ? '+' : (clip ? '' : '-');

	  return indentIndicator + chomp + '\n';
	}

	// (See the note for writeScalar.)
	function dropEndingNewline(string) {
	  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
	}

	// Note: a long line without a suitable break point will exceed the width limit.
	// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
	function foldString(string, width) {
	  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
	  // unless they're before or after a more-indented line, or at the very
	  // beginning or end, in which case $k$ maps to $k$.
	  // Therefore, parse each chunk as newline(s) followed by a content line.
	  var lineRe = /(\n+)([^\n]*)/g;

	  // first line (possibly an empty line)
	  var result = (function () {
	    var nextLF = string.indexOf('\n');
	    nextLF = nextLF !== -1 ? nextLF : string.length;
	    lineRe.lastIndex = nextLF;
	    return foldLine(string.slice(0, nextLF), width);
	  }());
	  // If we haven't reached the first content line yet, don't add an extra \n.
	  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
	  var moreIndented;

	  // rest of the lines
	  var match;
	  while ((match = lineRe.exec(string))) {
	    var prefix = match[1], line = match[2];
	    moreIndented = (line[0] === ' ');
	    result += prefix
	      + (!prevMoreIndented && !moreIndented && line !== ''
	        ? '\n' : '')
	      + foldLine(line, width);
	    prevMoreIndented = moreIndented;
	  }

	  return result;
	}

	// Greedy line breaking.
	// Picks the longest line under the limit each time,
	// otherwise settles for the shortest line over the limit.
	// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
	function foldLine(line, width) {
	  if (line === '' || line[0] === ' ') return line;

	  // Since a more-indented line adds a \n, breaks can't be followed by a space.
	  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
	  var match;
	  // start is an inclusive index. end, curr, and next are exclusive.
	  var start = 0, end, curr = 0, next = 0;
	  var result = '';

	  // Invariants: 0 <= start <= length-1.
	  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
	  // Inside the loop:
	  //   A match implies length >= 2, so curr and next are <= length-2.
	  while ((match = breakRe.exec(line))) {
	    next = match.index;
	    // maintain invariant: curr - start <= width
	    if (next - start > width) {
	      end = (curr > start) ? curr : next; // derive end <= length-2
	      result += '\n' + line.slice(start, end);
	      // skip the space that was output as \n
	      start = end + 1;                    // derive start <= length-1
	    }
	    curr = next;
	  }

	  // By the invariants, start <= length-1, so there is something left over.
	  // It is either the whole string or a part starting from non-whitespace.
	  result += '\n';
	  // Insert a break if the remainder is too long and there is a break available.
	  if (line.length - start > width && curr > start) {
	    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
	  } else {
	    result += line.slice(start);
	  }

	  return result.slice(1); // drop extra \n joiner
	}

	// Escapes a double-quoted string.
	function escapeString(string) {
	  var result = '';
	  var char = 0;
	  var escapeSeq;

	  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
	    char = codePointAt(string, i);
	    escapeSeq = ESCAPE_SEQUENCES[char];

	    if (!escapeSeq && isPrintable(char)) {
	      result += string[i];
	      if (char >= 0x10000) result += string[i + 1];
	    } else {
	      result += escapeSeq || encodeHex(char);
	    }
	  }

	  return result;
	}

	function writeFlowSequence(state, level, object) {
	  var _result = '',
	      _tag    = state.tag,
	      index,
	      length,
	      value;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    value = object[index];

	    if (state.replacer) {
	      value = state.replacer.call(object, String(index), value);
	    }

	    // Write only valid elements, put null instead of invalid elements.
	    if (writeNode(state, level, value, false, false) ||
	        (typeof value === 'undefined' &&
	         writeNode(state, level, null, false, false))) {

	      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
	      _result += state.dump;
	    }
	  }

	  state.tag = _tag;
	  state.dump = '[' + _result + ']';
	}

	function writeBlockSequence(state, level, object, compact) {
	  var _result = '',
	      _tag    = state.tag,
	      index,
	      length,
	      value;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    value = object[index];

	    if (state.replacer) {
	      value = state.replacer.call(object, String(index), value);
	    }

	    // Write only valid elements, put null instead of invalid elements.
	    if (writeNode(state, level + 1, value, true, true, false, true) ||
	        (typeof value === 'undefined' &&
	         writeNode(state, level + 1, null, true, true, false, true))) {

	      if (!compact || _result !== '') {
	        _result += generateNextLine(state, level);
	      }

	      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	        _result += '-';
	      } else {
	        _result += '- ';
	      }

	      _result += state.dump;
	    }
	  }

	  state.tag = _tag;
	  state.dump = _result || '[]'; // Empty sequence if no valid values.
	}

	function writeFlowMapping(state, level, object) {
	  var _result       = '',
	      _tag          = state.tag,
	      objectKeyList = Object.keys(object),
	      index,
	      length,
	      objectKey,
	      objectValue,
	      pairBuffer;

	  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

	    pairBuffer = '';
	    if (_result !== '') pairBuffer += ', ';

	    if (state.condenseFlow) pairBuffer += '"';

	    objectKey = objectKeyList[index];
	    objectValue = object[objectKey];

	    if (state.replacer) {
	      objectValue = state.replacer.call(object, objectKey, objectValue);
	    }

	    if (!writeNode(state, level, objectKey, false, false)) {
	      continue; // Skip this pair because of invalid key;
	    }

	    if (state.dump.length > 1024) pairBuffer += '? ';

	    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

	    if (!writeNode(state, level, objectValue, false, false)) {
	      continue; // Skip this pair because of invalid value.
	    }

	    pairBuffer += state.dump;

	    // Both key and value are valid.
	    _result += pairBuffer;
	  }

	  state.tag = _tag;
	  state.dump = '{' + _result + '}';
	}

	function writeBlockMapping(state, level, object, compact) {
	  var _result       = '',
	      _tag          = state.tag,
	      objectKeyList = Object.keys(object),
	      index,
	      length,
	      objectKey,
	      objectValue,
	      explicitPair,
	      pairBuffer;

	  // Allow sorting keys so that the output file is deterministic
	  if (state.sortKeys === true) {
	    // Default sorting
	    objectKeyList.sort();
	  } else if (typeof state.sortKeys === 'function') {
	    // Custom sort function
	    objectKeyList.sort(state.sortKeys);
	  } else if (state.sortKeys) {
	    // Something is wrong
	    throw new YAMLException('sortKeys must be a boolean or a function');
	  }

	  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
	    pairBuffer = '';

	    if (!compact || _result !== '') {
	      pairBuffer += generateNextLine(state, level);
	    }

	    objectKey = objectKeyList[index];
	    objectValue = object[objectKey];

	    if (state.replacer) {
	      objectValue = state.replacer.call(object, objectKey, objectValue);
	    }

	    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
	      continue; // Skip this pair because of invalid key.
	    }

	    explicitPair = (state.tag !== null && state.tag !== '?') ||
	                   (state.dump && state.dump.length > 1024);

	    if (explicitPair) {
	      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	        pairBuffer += '?';
	      } else {
	        pairBuffer += '? ';
	      }
	    }

	    pairBuffer += state.dump;

	    if (explicitPair) {
	      pairBuffer += generateNextLine(state, level);
	    }

	    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
	      continue; // Skip this pair because of invalid value.
	    }

	    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	      pairBuffer += ':';
	    } else {
	      pairBuffer += ': ';
	    }

	    pairBuffer += state.dump;

	    // Both key and value are valid.
	    _result += pairBuffer;
	  }

	  state.tag = _tag;
	  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
	}

	function detectType(state, object, explicit) {
	  var _result, typeList, index, length, type, style;

	  typeList = explicit ? state.explicitTypes : state.implicitTypes;

	  for (index = 0, length = typeList.length; index < length; index += 1) {
	    type = typeList[index];

	    if ((type.instanceOf  || type.predicate) &&
	        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
	        (!type.predicate  || type.predicate(object))) {

	      if (explicit) {
	        if (type.multi && type.representName) {
	          state.tag = type.representName(object);
	        } else {
	          state.tag = type.tag;
	        }
	      } else {
	        state.tag = '?';
	      }

	      if (type.represent) {
	        style = state.styleMap[type.tag] || type.defaultStyle;

	        if (_toString.call(type.represent) === '[object Function]') {
	          _result = type.represent(object, style);
	        } else if (_hasOwnProperty.call(type.represent, style)) {
	          _result = type.represent[style](object, style);
	        } else {
	          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
	        }

	        state.dump = _result;
	      }

	      return true;
	    }
	  }

	  return false;
	}

	// Serializes `object` and writes it to global `result`.
	// Returns true on success, or false on invalid object.
	//
	function writeNode(state, level, object, block, compact, iskey, isblockseq) {
	  state.tag = null;
	  state.dump = object;

	  if (!detectType(state, object, false)) {
	    detectType(state, object, true);
	  }

	  var type = _toString.call(state.dump);
	  var inblock = block;
	  var tagStr;

	  if (block) {
	    block = (state.flowLevel < 0 || state.flowLevel > level);
	  }

	  var objectOrArray = type === '[object Object]' || type === '[object Array]',
	      duplicateIndex,
	      duplicate;

	  if (objectOrArray) {
	    duplicateIndex = state.duplicates.indexOf(object);
	    duplicate = duplicateIndex !== -1;
	  }

	  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
	    compact = false;
	  }

	  if (duplicate && state.usedDuplicates[duplicateIndex]) {
	    state.dump = '*ref_' + duplicateIndex;
	  } else {
	    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
	      state.usedDuplicates[duplicateIndex] = true;
	    }
	    if (type === '[object Object]') {
	      if (block && (Object.keys(state.dump).length !== 0)) {
	        writeBlockMapping(state, level, state.dump, compact);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + state.dump;
	        }
	      } else {
	        writeFlowMapping(state, level, state.dump);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
	        }
	      }
	    } else if (type === '[object Array]') {
	      if (block && (state.dump.length !== 0)) {
	        if (state.noArrayIndent && !isblockseq && level > 0) {
	          writeBlockSequence(state, level - 1, state.dump, compact);
	        } else {
	          writeBlockSequence(state, level, state.dump, compact);
	        }
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + state.dump;
	        }
	      } else {
	        writeFlowSequence(state, level, state.dump);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
	        }
	      }
	    } else if (type === '[object String]') {
	      if (state.tag !== '?') {
	        writeScalar(state, state.dump, level, iskey, inblock);
	      }
	    } else if (type === '[object Undefined]') {
	      return false;
	    } else {
	      if (state.skipInvalid) return false;
	      throw new YAMLException('unacceptable kind of an object to dump ' + type);
	    }

	    if (state.tag !== null && state.tag !== '?') {
	      // Need to encode all characters except those allowed by the spec:
	      //
	      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
	      // [36] ns-hex-digit    ::=  ns-dec-digit
	      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
	      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
	      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
	      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
	      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
	      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
	      //
	      // Also need to encode '!' because it has special meaning (end of tag prefix).
	      //
	      tagStr = encodeURI(
	        state.tag[0] === '!' ? state.tag.slice(1) : state.tag
	      ).replace(/!/g, '%21');

	      if (state.tag[0] === '!') {
	        tagStr = '!' + tagStr;
	      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
	        tagStr = '!!' + tagStr.slice(18);
	      } else {
	        tagStr = '!<' + tagStr + '>';
	      }

	      state.dump = tagStr + ' ' + state.dump;
	    }
	  }

	  return true;
	}

	function getDuplicateReferences(object, state) {
	  var objects = [],
	      duplicatesIndexes = [],
	      index,
	      length;

	  inspectNode(object, objects, duplicatesIndexes);

	  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
	    state.duplicates.push(objects[duplicatesIndexes[index]]);
	  }
	  state.usedDuplicates = new Array(length);
	}

	function inspectNode(object, objects, duplicatesIndexes) {
	  var objectKeyList,
	      index,
	      length;

	  if (object !== null && typeof object === 'object') {
	    index = objects.indexOf(object);
	    if (index !== -1) {
	      if (duplicatesIndexes.indexOf(index) === -1) {
	        duplicatesIndexes.push(index);
	      }
	    } else {
	      objects.push(object);

	      if (Array.isArray(object)) {
	        for (index = 0, length = object.length; index < length; index += 1) {
	          inspectNode(object[index], objects, duplicatesIndexes);
	        }
	      } else {
	        objectKeyList = Object.keys(object);

	        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
	          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
	        }
	      }
	    }
	  }
	}

	function dump(input, options) {
	  options = options || {};

	  var state = new State(options);

	  if (!state.noRefs) getDuplicateReferences(input, state);

	  var value = input;

	  if (state.replacer) {
	    value = state.replacer.call({ '': value }, '', value);
	  }

	  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

	  return '';
	}

	dumper.dump = dump;
	return dumper;
}

var hasRequiredJsYaml;

function requireJsYaml () {
	if (hasRequiredJsYaml) return jsYaml;
	hasRequiredJsYaml = 1;


	var loader = requireLoader();
	var dumper = requireDumper();


	function renamed(from, to) {
	  return function () {
	    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
	      'Use yaml.' + to + ' instead, which is now safe by default.');
	  };
	}


	jsYaml.Type                = requireType();
	jsYaml.Schema              = requireSchema();
	jsYaml.FAILSAFE_SCHEMA     = requireFailsafe();
	jsYaml.JSON_SCHEMA         = requireJson();
	jsYaml.CORE_SCHEMA         = requireCore();
	jsYaml.DEFAULT_SCHEMA      = require_default();
	jsYaml.load                = loader.load;
	jsYaml.loadAll             = loader.loadAll;
	jsYaml.dump                = dumper.dump;
	jsYaml.YAMLException       = requireException();

	// Re-export all types in case user wants to create custom schema
	jsYaml.types = {
	  binary:    requireBinary$1(),
	  float:     requireFloat(),
	  map:       requireMap(),
	  null:      require_null(),
	  pairs:     requirePairs(),
	  set:       requireSet(),
	  timestamp: requireTimestamp(),
	  bool:      requireBool(),
	  int:       requireInt(),
	  merge:     requireMerge(),
	  omap:      requireOmap(),
	  seq:       requireSeq(),
	  str:       requireStr()
	};

	// Removed functions from JS-YAML 3.0.x
	jsYaml.safeLoad            = renamed('safeLoad', 'load');
	jsYaml.safeLoadAll         = renamed('safeLoadAll', 'loadAll');
	jsYaml.safeDump            = renamed('safeDump', 'dump');
	return jsYaml;
}

var hasRequiredYaml;

function requireYaml () {
	if (hasRequiredYaml) return yaml;
	hasRequiredYaml = 1;
	var __importDefault = (yaml && yaml.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(yaml, "__esModule", { value: true });
	const errors_js_1 = requireErrors();
	const js_yaml_1 = __importDefault(requireJsYaml());
	const js_yaml_2 = requireJsYaml();
	yaml.default = {
	    /**
	     * The order that this parser will run, in relation to other parsers.
	     */
	    order: 200,
	    /**
	     * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
	     */
	    allowEmpty: true,
	    /**
	     * Determines whether this parser can parse a given file reference.
	     * Parsers that match will be tried, in order, until one successfully parses the file.
	     * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
	     * every parser will be tried.
	     */
	    canParse: [".yaml", ".yml", ".json"], // JSON is valid YAML
	    /**
	     * Parses the given file as YAML
	     *
	     * @param file           - An object containing information about the referenced file
	     * @param file.url       - The full URL of the referenced file
	     * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
	     * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
	     * @returns
	     */
	    async parse(file) {
	        let data = file.data;
	        if (Buffer.isBuffer(data)) {
	            data = data.toString();
	        }
	        if (typeof data === "string") {
	            try {
	                return js_yaml_1.default.load(data, { schema: js_yaml_2.JSON_SCHEMA });
	            }
	            catch (e) {
	                throw new errors_js_1.ParserError(e?.message || "Parser Error", file.url);
	            }
	        }
	        else {
	            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
	            return data;
	        }
	    },
	};
	return yaml;
}

var text = {};

var hasRequiredText;

function requireText () {
	if (hasRequiredText) return text;
	hasRequiredText = 1;
	Object.defineProperty(text, "__esModule", { value: true });
	const errors_js_1 = requireErrors();
	const TEXT_REGEXP = /\.(txt|htm|html|md|xml|js|min|map|css|scss|less|svg)$/i;
	text.default = {
	    /**
	     * The order that this parser will run, in relation to other parsers.
	     */
	    order: 300,
	    /**
	     * Whether to allow "empty" files (zero bytes).
	     */
	    allowEmpty: true,
	    /**
	     * The encoding that the text is expected to be in.
	     */
	    encoding: "utf8",
	    /**
	     * Determines whether this parser can parse a given file reference.
	     * Parsers that return true will be tried, in order, until one successfully parses the file.
	     * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
	     * every parser will be tried.
	     */
	    canParse(file) {
	        // Use this parser if the file is a string or Buffer, and has a known text-based extension
	        return (typeof file.data === "string" || Buffer.isBuffer(file.data)) && TEXT_REGEXP.test(file.url);
	    },
	    /**
	     * Parses the given file as text
	     */
	    parse(file) {
	        if (typeof file.data === "string") {
	            return file.data;
	        }
	        else if (Buffer.isBuffer(file.data)) {
	            return file.data.toString(this.encoding);
	        }
	        else {
	            throw new errors_js_1.ParserError("data is not text", file.url);
	        }
	    },
	};
	return text;
}

var binary = {};

var hasRequiredBinary;

function requireBinary () {
	if (hasRequiredBinary) return binary;
	hasRequiredBinary = 1;
	Object.defineProperty(binary, "__esModule", { value: true });
	const BINARY_REGEXP = /\.(jpeg|jpg|gif|png|bmp|ico)$/i;
	binary.default = {
	    /**
	     * The order that this parser will run, in relation to other parsers.
	     */
	    order: 400,
	    /**
	     * Whether to allow "empty" files (zero bytes).
	     */
	    allowEmpty: true,
	    /**
	     * Determines whether this parser can parse a given file reference.
	     * Parsers that return true will be tried, in order, until one successfully parses the file.
	     * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
	     * every parser will be tried.
	     */
	    canParse(file) {
	        // Use this parser if the file is a Buffer, and has a known binary extension
	        return Buffer.isBuffer(file.data) && BINARY_REGEXP.test(file.url);
	    },
	    /**
	     * Parses the given data as a Buffer (byte array).
	     */
	    parse(file) {
	        if (Buffer.isBuffer(file.data)) {
	            return file.data;
	        }
	        else {
	            // This will reject if data is anything other than a string or typed array
	            return Buffer.from(file.data);
	        }
	    },
	};
	return binary;
}

var file = {};

var _nodeResolve_empty = {};

var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: _nodeResolve_empty
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

var hasRequiredFile;

function requireFile () {
	if (hasRequiredFile) return file;
	hasRequiredFile = 1;
	var __createBinding = (file && file.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (file && file.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (file && file.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (file && file.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(file, "__esModule", { value: true });
	const fs_1 = __importDefault(require$$0);
	const url = __importStar(requireUrl());
	const errors_js_1 = requireErrors();
	file.default = {
	    /**
	     * The order that this resolver will run, in relation to other resolvers.
	     */
	    order: 100,
	    /**
	     * Determines whether this resolver can read a given file reference.
	     * Resolvers that return true will be tried, in order, until one successfully resolves the file.
	     * Resolvers that return false will not be given a chance to resolve the file.
	     */
	    canRead(file) {
	        return url.isFileSystemPath(file.url);
	    },
	    /**
	     * Reads the given file and returns its raw contents as a Buffer.
	     */
	    async read(file) {
	        let path;
	        try {
	            path = url.toFileSystemPath(file.url);
	        }
	        catch (err) {
	            const e = err;
	            e.message = `Malformed URI: ${file.url}: ${e.message}`;
	            throw new errors_js_1.ResolverError(e, file.url);
	        }
	        try {
	            return await fs_1.default.promises.readFile(path);
	        }
	        catch (err) {
	            const e = err;
	            e.message = `Error opening file ${path}: ${e.message}`;
	            throw new errors_js_1.ResolverError(e, path);
	        }
	    },
	};
	return file;
}

var http = {};

var hasRequiredHttp;

function requireHttp () {
	if (hasRequiredHttp) return http;
	hasRequiredHttp = 1;
	var __createBinding = (http && http.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (http && http.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (http && http.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(http, "__esModule", { value: true });
	const url = __importStar(requireUrl());
	const errors_js_1 = requireErrors();
	http.default = {
	    /**
	     * The order that this resolver will run, in relation to other resolvers.
	     */
	    order: 200,
	    /**
	     * HTTP headers to send when downloading files.
	     *
	     * @example:
	     * {
	     *   "User-Agent": "JSON Schema $Ref Parser",
	     *   Accept: "application/json"
	     * }
	     */
	    headers: null,
	    /**
	     * HTTP request timeout (in milliseconds).
	     */
	    timeout: 60000, // 60 seconds
	    /**
	     * The maximum number of HTTP redirects to follow.
	     * To disable automatic following of redirects, set this to zero.
	     */
	    redirects: 5,
	    /**
	     * The `withCredentials` option of XMLHttpRequest.
	     * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
	     */
	    withCredentials: false,
	    /**
	     * Set this to `false` if you want to allow unsafe URLs (e.g., `127.0.0.1`, localhost, and other internal URLs).
	     */
	    safeUrlResolver: true,
	    /**
	     * Determines whether this resolver can read a given file reference.
	     * Resolvers that return true will be tried in order, until one successfully resolves the file.
	     * Resolvers that return false will not be given a chance to resolve the file.
	     */
	    canRead(file) {
	        return url.isHttp(file.url) && (!this.safeUrlResolver || !url.isUnsafeUrl(file.url));
	    },
	    /**
	     * Reads the given URL and returns its raw contents as a Buffer.
	     */
	    read(file) {
	        const u = url.parse(file.url);
	        if (typeof window !== "undefined" && !u.protocol) {
	            // Use the protocol of the current page
	            u.protocol = url.parse(location.href).protocol;
	        }
	        return download(u, this);
	    },
	};
	/**
	 * Downloads the given file.
	 * @returns
	 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
	 */
	async function download(u, httpOptions, _redirects) {
	    u = url.parse(u);
	    const redirects = _redirects || [];
	    redirects.push(u.href);
	    try {
	        const res = await get(u, httpOptions);
	        if (res.status >= 400) {
	            const error = new Error(`HTTP ERROR ${res.status}`);
	            error.status = res.status;
	            throw error;
	        }
	        else if (res.status >= 300) {
	            if (!Number.isNaN(httpOptions.redirects) && redirects.length > httpOptions.redirects) {
	                const error = new Error(`Error downloading ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`);
	                error.status = res.status;
	                throw new errors_js_1.ResolverError(error);
	            }
	            else if (!("location" in res.headers) || !res.headers.location) {
	                const error = new Error(`HTTP ${res.status} redirect with no location header`);
	                error.status = res.status;
	                throw error;
	            }
	            else {
	                const redirectTo = url.resolve(u.href, res.headers.location);
	                return download(redirectTo, httpOptions, redirects);
	            }
	        }
	        else {
	            if (res.body) {
	                const buf = await res.arrayBuffer();
	                return Buffer.from(buf);
	            }
	            return Buffer.alloc(0);
	        }
	    }
	    catch (err) {
	        const e = err;
	        e.message = `Error downloading ${u.href}: ${e.message}`;
	        throw new errors_js_1.ResolverError(e, u.href);
	    }
	}
	/**
	 * Sends an HTTP GET request.
	 * The promise resolves with the HTTP Response object.
	 */
	async function get(u, httpOptions) {
	    let controller;
	    let timeoutId;
	    if (httpOptions.timeout) {
	        controller = new AbortController();
	        timeoutId = setTimeout(() => controller.abort(), httpOptions.timeout);
	    }
	    const response = await fetch(u, {
	        method: "GET",
	        headers: httpOptions.headers || {},
	        credentials: httpOptions.withCredentials ? "include" : "same-origin",
	        signal: controller ? controller.signal : null,
	    });
	    if (timeoutId) {
	        clearTimeout(timeoutId);
	    }
	    return response;
	}
	return http;
}

var hasRequiredOptions$1;

function requireOptions$1 () {
	if (hasRequiredOptions$1) return options$1;
	hasRequiredOptions$1 = 1;
	(function (exports) {
		var __importDefault = (options$1 && options$1.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.getNewOptions = exports.getJsonSchemaRefParserDefaultOptions = void 0;
		const json_js_1 = __importDefault(requireJson$1());
		const yaml_js_1 = __importDefault(requireYaml());
		const text_js_1 = __importDefault(requireText());
		const binary_js_1 = __importDefault(requireBinary());
		const file_js_1 = __importDefault(requireFile());
		const http_js_1 = __importDefault(requireHttp());
		const getJsonSchemaRefParserDefaultOptions = () => {
		    const defaults = {
		        /**
		         * Determines how different types of files will be parsed.
		         *
		         * You can add additional parsers of your own, replace an existing one with
		         * your own implementation, or disable any parser by setting it to false.
		         */
		        parse: {
		            json: { ...json_js_1.default },
		            yaml: { ...yaml_js_1.default },
		            text: { ...text_js_1.default },
		            binary: { ...binary_js_1.default },
		        },
		        /**
		         * Determines how JSON References will be resolved.
		         *
		         * You can add additional resolvers of your own, replace an existing one with
		         * your own implementation, or disable any resolver by setting it to false.
		         */
		        resolve: {
		            file: { ...file_js_1.default },
		            http: { ...http_js_1.default },
		            /**
		             * Determines whether external $ref pointers will be resolved.
		             * If this option is disabled, then none of above resolvers will be called.
		             * Instead, external $ref pointers will simply be ignored.
		             *
		             * @type {boolean}
		             */
		            external: true,
		        },
		        /**
		         * By default, JSON Schema $Ref Parser throws the first error it encounters. Setting `continueOnError` to `true`
		         * causes it to keep processing as much as possible and then throw a single error that contains all errors
		         * that were encountered.
		         */
		        continueOnError: false,
		        /**
		         * Determines the types of JSON references that are allowed.
		         */
		        dereference: {
		            /**
		             * Dereference circular (recursive) JSON references?
		             * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
		             * If "ignore", then circular references will not be dereferenced.
		             *
		             * @type {boolean|string}
		             */
		            circular: true,
		            /**
		             * A function, called for each path, which can return true to stop this path and all
		             * subpaths from being dereferenced further. This is useful in schemas where some
		             * subpaths contain literal $ref keys that should not be dereferenced.
		             *
		             * @type {function}
		             */
		            excludedPathMatcher: () => false,
		            referenceResolution: "relative",
		        },
		        mutateInputSchema: true,
		    };
		    return defaults;
		};
		exports.getJsonSchemaRefParserDefaultOptions = getJsonSchemaRefParserDefaultOptions;
		const getNewOptions = (options) => {
		    const newOptions = (0, exports.getJsonSchemaRefParserDefaultOptions)();
		    if (options) {
		        merge(newOptions, options);
		    }
		    return newOptions;
		};
		exports.getNewOptions = getNewOptions;
		/**
		 * Merges the properties of the source object into the target object.
		 *
		 * @param target - The object that we're populating
		 * @param source - The options that are being merged
		 * @returns
		 */
		function merge(target, source) {
		    if (isMergeable(source)) {
		        // prevent prototype pollution
		        const keys = Object.keys(source).filter((key) => !["__proto__", "constructor", "prototype"].includes(key));
		        for (let i = 0; i < keys.length; i++) {
		            const key = keys[i];
		            const sourceSetting = source[key];
		            const targetSetting = target[key];
		            if (isMergeable(sourceSetting)) {
		                // It's a nested object, so merge it recursively
		                target[key] = merge(targetSetting || {}, sourceSetting);
		            }
		            else if (sourceSetting !== undefined) {
		                // It's a scalar value, function, or array. No merging necessary. Just overwrite the target value.
		                target[key] = sourceSetting;
		            }
		        }
		    }
		    return target;
		}
		/**
		 * Determines whether the given value can be merged,
		 * or if it is a scalar value that should just override the target value.
		 *
		 * @param val
		 * @returns
		 */
		function isMergeable(val) {
		    return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date);
		} 
	} (options$1));
	return options$1;
}

var hasRequiredNormalizeArgs;

function requireNormalizeArgs () {
	if (hasRequiredNormalizeArgs) return normalizeArgs;
	hasRequiredNormalizeArgs = 1;
	Object.defineProperty(normalizeArgs, "__esModule", { value: true });
	normalizeArgs.normalizeArgs = normalizeArgs$1;
	const options_js_1 = requireOptions$1();
	/**
	 * Normalizes the given arguments, accounting for optional args.
	 */
	function normalizeArgs$1(_args) {
	    let path;
	    let schema;
	    let options;
	    let callback;
	    const args = Array.prototype.slice.call(_args);
	    if (typeof args[args.length - 1] === "function") {
	        // The last parameter is a callback function
	        callback = args.pop();
	    }
	    if (typeof args[0] === "string") {
	        // The first parameter is the path
	        path = args[0];
	        if (typeof args[2] === "object") {
	            // The second parameter is the schema, and the third parameter is the options
	            schema = args[1];
	            options = args[2];
	        }
	        else {
	            // The second parameter is the options
	            schema = undefined;
	            options = args[1];
	        }
	    }
	    else {
	        // The first parameter is the schema
	        path = "";
	        schema = args[0];
	        options = args[1];
	    }
	    try {
	        options = (0, options_js_1.getNewOptions)(options);
	    }
	    catch (e) {
	        console.error(`JSON Schema Ref Parser: Error normalizing options: ${e}`);
	    }
	    if (!options.mutateInputSchema && typeof schema === "object") {
	        // Make a deep clone of the schema, so that we don't alter the original object
	        schema = JSON.parse(JSON.stringify(schema));
	    }
	    return {
	        path,
	        schema,
	        options,
	        callback,
	    };
	}
	normalizeArgs.default = normalizeArgs$1;
	return normalizeArgs;
}

var resolveExternal = {};

var hasRequiredResolveExternal;

function requireResolveExternal () {
	if (hasRequiredResolveExternal) return resolveExternal;
	hasRequiredResolveExternal = 1;
	var __createBinding = (resolveExternal && resolveExternal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (resolveExternal && resolveExternal.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (resolveExternal && resolveExternal.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (resolveExternal && resolveExternal.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(resolveExternal, "__esModule", { value: true });
	const ref_js_1 = __importDefault(requireRef());
	const pointer_js_1 = __importDefault(requirePointer());
	const parse_js_1 = __importDefault(requireParse());
	const url = __importStar(requireUrl());
	const errors_js_1 = requireErrors();
	/**
	 * Crawls the JSON schema, finds all external JSON references, and resolves their values.
	 * This method does not mutate the JSON schema. The resolved values are added to {@link $RefParser#$refs}.
	 *
	 * NOTE: We only care about EXTERNAL references here. INTERNAL references are only relevant when dereferencing.
	 *
	 * @returns
	 * The promise resolves once all JSON references in the schema have been resolved,
	 * including nested references that are contained in externally-referenced files.
	 */
	function resolveExternal$1(parser, options) {
	    if (!options.resolve?.external) {
	        // Nothing to resolve, so exit early
	        return Promise.resolve();
	    }
	    try {
	        // console.log('Resolving $ref pointers in %s', parser.$refs._root$Ref.path);
	        const promises = crawl(parser.schema, parser.$refs._root$Ref.path + "#", parser.$refs, options);
	        return Promise.all(promises);
	    }
	    catch (e) {
	        return Promise.reject(e);
	    }
	}
	/**
	 * Recursively crawls the given value, and resolves any external JSON references.
	 *
	 * @param obj - The value to crawl. If it's not an object or array, it will be ignored.
	 * @param path - The full path of `obj`, possibly with a JSON Pointer in the hash
	 * @param {boolean} external - Whether `obj` was found in an external document.
	 * @param $refs
	 * @param options
	 * @param seen - Internal.
	 *
	 * @returns
	 * Returns an array of promises. There will be one promise for each JSON reference in `obj`.
	 * If `obj` does not contain any JSON references, then the array will be empty.
	 * If any of the JSON references point to files that contain additional JSON references,
	 * then the corresponding promise will internally reference an array of promises.
	 */
	function crawl(obj, path, $refs, options, seen, external) {
	    seen || (seen = new Set());
	    let promises = [];
	    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !seen.has(obj)) {
	        seen.add(obj); // Track previously seen objects to avoid infinite recursion
	        if (ref_js_1.default.isExternal$Ref(obj)) {
	            promises.push(resolve$Ref(obj, path, $refs, options));
	        }
	        const keys = Object.keys(obj);
	        for (const key of keys) {
	            const keyPath = pointer_js_1.default.join(path, key);
	            const value = obj[key];
	            promises = promises.concat(crawl(value, keyPath, $refs, options, seen));
	        }
	    }
	    return promises;
	}
	/**
	 * Resolves the given JSON Reference, and then crawls the resulting value.
	 *
	 * @param $ref - The JSON Reference to resolve
	 * @param path - The full path of `$ref`, possibly with a JSON Pointer in the hash
	 * @param $refs
	 * @param options
	 *
	 * @returns
	 * The promise resolves once all JSON references in the object have been resolved,
	 * including nested references that are contained in externally-referenced files.
	 */
	async function resolve$Ref($ref, path, $refs, options) {
	    const shouldResolveOnCwd = options.dereference?.externalReferenceResolution === "root";
	    const resolvedPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
	    const withoutHash = url.stripHash(resolvedPath);
	    // $ref.$ref = url.relative($refs._root$Ref.path, resolvedPath);
	    // Do we already have this $ref?
	    const ref = $refs._$refs[withoutHash];
	    if (ref) {
	        // We've already parsed this $ref, so use the existing value
	        return Promise.resolve(ref.value);
	    }
	    // Parse the $referenced file/url
	    try {
	        const result = await (0, parse_js_1.default)(resolvedPath, $refs, options);
	        // Crawl the parsed value
	        // console.log('Resolving $ref pointers in %s', withoutHash);
	        const promises = crawl(result, withoutHash + "#", $refs, options, new Set(), true);
	        return Promise.all(promises);
	    }
	    catch (err) {
	        if (!options?.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
	            throw err;
	        }
	        if ($refs._$refs[withoutHash]) {
	            err.source = decodeURI(url.stripHash(path));
	            err.path = url.safePointerToPath(url.getHash(path));
	        }
	        return [];
	    }
	}
	resolveExternal.default = resolveExternal$1;
	return resolveExternal;
}

var bundle = {};

var hasRequiredBundle;

function requireBundle () {
	if (hasRequiredBundle) return bundle;
	hasRequiredBundle = 1;
	var __createBinding = (bundle && bundle.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (bundle && bundle.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (bundle && bundle.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (bundle && bundle.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(bundle, "__esModule", { value: true });
	const ref_js_1 = __importDefault(requireRef());
	const pointer_js_1 = __importDefault(requirePointer());
	const url = __importStar(requireUrl());
	/**
	 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
	 * only has *internal* references, not any *external* references.
	 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
	 *
	 * @param parser
	 * @param options
	 */
	function bundle$1(parser, options) {
	    // console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);
	    // Build an inventory of all $ref pointers in the JSON Schema
	    const inventory = [];
	    crawl(parser, "schema", parser.$refs._root$Ref.path + "#", "#", 0, inventory, parser.$refs, options);
	    // Remap all $ref pointers
	    remap(inventory);
	}
	/**
	 * Recursively crawls the given value, and inventories all JSON references.
	 *
	 * @param parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
	 * @param key - The property key of `parent` to be crawled
	 * @param path - The full path of the property being crawled, possibly with a JSON Pointer in the hash
	 * @param pathFromRoot - The path of the property being crawled, from the schema root
	 * @param indirections
	 * @param inventory - An array of already-inventoried $ref pointers
	 * @param $refs
	 * @param options
	 */
	function crawl(parent, key, path, pathFromRoot, indirections, inventory, $refs, options) {
	    const obj = key === null ? parent : parent[key];
	    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
	        if (ref_js_1.default.isAllowed$Ref(obj)) {
	            inventory$Ref(parent, key, path, pathFromRoot, indirections, inventory, $refs, options);
	        }
	        else {
	            // Crawl the object in a specific order that's optimized for bundling.
	            // This is important because it determines how `pathFromRoot` gets built,
	            // which later determines which keys get dereferenced and which ones get remapped
	            const keys = Object.keys(obj).sort((a, b) => {
	                // Most people will expect references to be bundled into the the "definitions" property,
	                // so we always crawl that property first, if it exists.
	                if (a === "definitions" || a === "$defs") {
	                    return -1;
	                }
	                else if (b === "definitions" || b === "$defs") {
	                    return 1;
	                }
	                else {
	                    // Otherwise, crawl the keys based on their length.
	                    // This produces the shortest possible bundled references
	                    return a.length - b.length;
	                }
	            });
	            for (const key of keys) {
	                const keyPath = pointer_js_1.default.join(path, key);
	                const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
	                const value = obj[key];
	                if (ref_js_1.default.isAllowed$Ref(value)) {
	                    inventory$Ref(obj, key, path, keyPathFromRoot, indirections, inventory, $refs, options);
	                }
	                else {
	                    crawl(obj, key, keyPath, keyPathFromRoot, indirections, inventory, $refs, options);
	                }
	            }
	        }
	    }
	}
	/**
	 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
	 * optimize all $refs in the schema), and then crawls the resolved value.
	 *
	 * @param $refParent - The object that contains a JSON Reference as one of its keys
	 * @param $refKey - The key in `$refParent` that is a JSON Reference
	 * @param path - The full path of the JSON Reference at `$refKey`, possibly with a JSON Pointer in the hash
	 * @param indirections - unknown
	 * @param pathFromRoot - The path of the JSON Reference at `$refKey`, from the schema root
	 * @param inventory - An array of already-inventoried $ref pointers
	 * @param $refs
	 * @param options
	 */
	function inventory$Ref($refParent, $refKey, path, pathFromRoot, indirections, inventory, $refs, options) {
	    const $ref = $refKey === null ? $refParent : $refParent[$refKey];
	    const $refPath = url.resolve(path, $ref.$ref);
	    const pointer = $refs._resolve($refPath, pathFromRoot, options);
	    if (pointer === null) {
	        return;
	    }
	    const parsed = pointer_js_1.default.parse(pathFromRoot);
	    const depth = parsed.length;
	    const file = url.stripHash(pointer.path);
	    const hash = url.getHash(pointer.path);
	    const external = file !== $refs._root$Ref.path;
	    const extended = ref_js_1.default.isExtended$Ref($ref);
	    indirections += pointer.indirections;
	    const existingEntry = findInInventory(inventory, $refParent, $refKey);
	    if (existingEntry) {
	        // This $Ref has already been inventoried, so we don't need to process it again
	        if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
	            removeFromInventory(inventory, existingEntry);
	        }
	        else {
	            return;
	        }
	    }
	    inventory.push({
	        $ref, // The JSON Reference (e.g. {$ref: string})
	        parent: $refParent, // The object that contains this $ref pointer
	        key: $refKey, // The key in `parent` that is the $ref pointer
	        pathFromRoot, // The path to the $ref pointer, from the JSON Schema root
	        depth, // How far from the JSON Schema root is this $ref pointer?
	        file, // The file that the $ref pointer resolves to
	        hash, // The hash within `file` that the $ref pointer resolves to
	        value: pointer.value, // The resolved value of the $ref pointer
	        circular: pointer.circular, // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
	        extended, // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
	        external, // Does this $ref pointer point to a file other than the main JSON Schema file?
	        indirections, // The number of indirect references that were traversed to resolve the value
	    });
	    // Recursively crawl the resolved value
	    if (!existingEntry || external) {
	        crawl(pointer.value, null, pointer.path, pathFromRoot, indirections + 1, inventory, $refs, options);
	    }
	}
	/**
	 * Re-maps every $ref pointer, so that they're all relative to the root of the JSON Schema.
	 * Each referenced value is dereferenced EXACTLY ONCE.  All subsequent references to the same
	 * value are re-mapped to point to the first reference.
	 *
	 * @example: {
	 *    first: { $ref: somefile.json#/some/part },
	 *    second: { $ref: somefile.json#/another/part },
	 *    third: { $ref: somefile.json },
	 *    fourth: { $ref: somefile.json#/some/part/sub/part }
	 *  }
	 *
	 * In this example, there are four references to the same file, but since the third reference points
	 * to the ENTIRE file, that's the only one we need to dereference.  The other three can just be
	 * remapped to point inside the third one.
	 *
	 * On the other hand, if the third reference DIDN'T exist, then the first and second would both need
	 * to be dereferenced, since they point to different parts of the file. The fourth reference does NOT
	 * need to be dereferenced, because it can be remapped to point inside the first one.
	 *
	 * @param inventory
	 */
	function remap(inventory) {
	    // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
	    inventory.sort((a, b) => {
	        if (a.file !== b.file) {
	            // Group all the $refs that point to the same file
	            return a.file < b.file ? -1 : 1;
	        }
	        else if (a.hash !== b.hash) {
	            // Group all the $refs that point to the same part of the file
	            return a.hash < b.hash ? -1 : 1;
	        }
	        else if (a.circular !== b.circular) {
	            // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
	            return a.circular ? -1 : 1;
	        }
	        else if (a.extended !== b.extended) {
	            // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
	            return a.extended ? 1 : -1;
	        }
	        else if (a.indirections !== b.indirections) {
	            // Sort direct references higher than indirect references
	            return a.indirections - b.indirections;
	        }
	        else if (a.depth !== b.depth) {
	            // Sort $refs by how close they are to the JSON Schema root
	            return a.depth - b.depth;
	        }
	        else {
	            // Determine how far each $ref is from the "definitions" property.
	            // Most people will expect references to be bundled into the the "definitions" property if possible.
	            const aDefinitionsIndex = Math.max(a.pathFromRoot.lastIndexOf("/definitions"), a.pathFromRoot.lastIndexOf("/$defs"));
	            const bDefinitionsIndex = Math.max(b.pathFromRoot.lastIndexOf("/definitions"), b.pathFromRoot.lastIndexOf("/$defs"));
	            if (aDefinitionsIndex !== bDefinitionsIndex) {
	                // Give higher priority to the $ref that's closer to the "definitions" property
	                return bDefinitionsIndex - aDefinitionsIndex;
	            }
	            else {
	                // All else is equal, so use the shorter path, which will produce the shortest possible reference
	                return a.pathFromRoot.length - b.pathFromRoot.length;
	            }
	        }
	    });
	    let file, hash, pathFromRoot;
	    for (const entry of inventory) {
	        // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
	        if (!entry.external) {
	            // This $ref already resolves to the main JSON Schema file
	            entry.$ref.$ref = entry.hash;
	        }
	        else if (entry.file === file && entry.hash === hash) {
	            // This $ref points to the same value as the prevous $ref, so remap it to the same path
	            entry.$ref.$ref = pathFromRoot;
	        }
	        else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
	            // This $ref points to a sub-value of the prevous $ref, so remap it beneath that path
	            entry.$ref.$ref = pointer_js_1.default.join(pathFromRoot, pointer_js_1.default.parse(entry.hash.replace(hash, "#")));
	        }
	        else {
	            // We've moved to a new file or new hash
	            file = entry.file;
	            hash = entry.hash;
	            pathFromRoot = entry.pathFromRoot;
	            // This is the first $ref to point to this value, so dereference the value.
	            // Any other $refs that point to the same value will point to this $ref instead
	            entry.$ref = entry.parent[entry.key] = ref_js_1.default.dereference(entry.$ref, entry.value);
	            if (entry.circular) {
	                // This $ref points to itself
	                entry.$ref.$ref = entry.pathFromRoot;
	            }
	        }
	    }
	    // we want to ensure that any $refs that point to another $ref are remapped to point to the final value
	    // let hadChange = true;
	    // while (hadChange) {
	    //   hadChange = false;
	    //   for (const entry of inventory) {
	    //     if (entry.$ref && typeof entry.$ref === "object" && "$ref" in entry.$ref) {
	    //       const resolved = inventory.find((e: InventoryEntry) => e.pathFromRoot === entry.$ref.$ref);
	    //       if (resolved) {
	    //         const resolvedPointsToAnotherRef =
	    //           resolved.$ref && typeof resolved.$ref === "object" && "$ref" in resolved.$ref;
	    //         if (resolvedPointsToAnotherRef && entry.$ref.$ref !== resolved.$ref.$ref) {
	    //           // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
	    //           entry.$ref.$ref = resolved.$ref.$ref;
	    //           hadChange = true;
	    //         }
	    //       }
	    //     }
	    //   }
	    // }
	}
	/**
	 * TODO
	 */
	function findInInventory(inventory, $refParent, $refKey) {
	    for (const existingEntry of inventory) {
	        if (existingEntry && existingEntry.parent === $refParent && existingEntry.key === $refKey) {
	            return existingEntry;
	        }
	    }
	    return undefined;
	}
	function removeFromInventory(inventory, entry) {
	    const index = inventory.indexOf(entry);
	    inventory.splice(index, 1);
	}
	bundle.default = bundle$1;
	return bundle;
}

var dereference = {};

var hasRequiredDereference;

function requireDereference () {
	if (hasRequiredDereference) return dereference;
	hasRequiredDereference = 1;
	var __createBinding = (dereference && dereference.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (dereference && dereference.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (dereference && dereference.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __importDefault = (dereference && dereference.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(dereference, "__esModule", { value: true });
	const ref_js_1 = __importDefault(requireRef());
	const pointer_js_1 = __importDefault(requirePointer());
	const url = __importStar(requireUrl());
	const errors_1 = requireErrors();
	dereference.default = dereference$1;
	/**
	 * Crawls the JSON schema, finds all JSON references, and dereferences them.
	 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
	 *
	 * @param parser
	 * @param options
	 */
	function dereference$1(parser, options) {
	    const start = Date.now();
	    // console.log('Dereferencing $ref pointers in %s', parser.$refs._root$Ref.path);
	    const dereferenced = crawl(parser.schema, parser.$refs._root$Ref.path, "#", new Set(), new Set(), new Map(), parser.$refs, options, start);
	    parser.$refs.circular = dereferenced.circular;
	    parser.schema = dereferenced.value;
	}
	/**
	 * Recursively crawls the given value, and dereferences any JSON references.
	 *
	 * @param obj - The value to crawl. If it's not an object or array, it will be ignored.
	 * @param path - The full path of `obj`, possibly with a JSON Pointer in the hash
	 * @param pathFromRoot - The path of `obj` from the schema root
	 * @param parents - An array of the parent objects that have already been dereferenced
	 * @param processedObjects - An array of all the objects that have already been processed
	 * @param dereferencedCache - An map of all the dereferenced objects
	 * @param $refs
	 * @param options
	 * @param startTime - The time when the dereferencing started
	 * @returns
	 */
	function crawl(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
	    let dereferenced;
	    const result = {
	        value: obj,
	        circular: false,
	    };
	    checkDereferenceTimeout(startTime, options);
	    const derefOptions = (options.dereference || {});
	    const isExcludedPath = derefOptions.excludedPathMatcher || (() => false);
	    if (derefOptions?.circular === "ignore" || !processedObjects.has(obj)) {
	        if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !isExcludedPath(pathFromRoot)) {
	            parents.add(obj);
	            processedObjects.add(obj);
	            if (ref_js_1.default.isAllowed$Ref(obj, options)) {
	                dereferenced = dereference$Ref(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
	                result.circular = dereferenced.circular;
	                result.value = dereferenced.value;
	            }
	            else {
	                for (const key of Object.keys(obj)) {
	                    checkDereferenceTimeout(startTime, options);
	                    const keyPath = pointer_js_1.default.join(path, key);
	                    const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
	                    if (isExcludedPath(keyPathFromRoot)) {
	                        continue;
	                    }
	                    const value = obj[key];
	                    let circular = false;
	                    if (ref_js_1.default.isAllowed$Ref(value, options)) {
	                        dereferenced = dereference$Ref(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
	                        circular = dereferenced.circular;
	                        // Avoid pointless mutations; breaks frozen objects to no profit
	                        if (obj[key] !== dereferenced.value) {
	                            // If we have properties we want to preserve from our dereferenced schema then we need
	                            // to copy them over to our new object.
	                            const preserved = new Map();
	                            if (derefOptions?.preservedProperties) {
	                                if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
	                                    derefOptions?.preservedProperties.forEach((prop) => {
	                                        if (prop in obj[key]) {
	                                            preserved.set(prop, obj[key][prop]);
	                                        }
	                                    });
	                                }
	                            }
	                            obj[key] = dereferenced.value;
	                            // If we have data to preserve and our dereferenced object is still an object then
	                            // we need copy back our preserved data into our dereferenced schema.
	                            if (derefOptions?.preservedProperties) {
	                                if (preserved.size && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
	                                    preserved.forEach((value, prop) => {
	                                        obj[key][prop] = value;
	                                    });
	                                }
	                            }
	                            derefOptions?.onDereference?.(value.$ref, obj[key], obj, key);
	                        }
	                    }
	                    else {
	                        if (!parents.has(value)) {
	                            dereferenced = crawl(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
	                            circular = dereferenced.circular;
	                            // Avoid pointless mutations; breaks frozen objects to no profit
	                            if (obj[key] !== dereferenced.value) {
	                                obj[key] = dereferenced.value;
	                            }
	                        }
	                        else {
	                            circular = foundCircularReference(keyPath, $refs, options);
	                        }
	                    }
	                    // Set the "isCircular" flag if this or any other property is circular
	                    result.circular = result.circular || circular;
	                }
	            }
	            parents.delete(obj);
	        }
	    }
	    return result;
	}
	/**
	 * Dereferences the given JSON Reference, and then crawls the resulting value.
	 *
	 * @param $ref - The JSON Reference to resolve
	 * @param path - The full path of `$ref`, possibly with a JSON Pointer in the hash
	 * @param pathFromRoot - The path of `$ref` from the schema root
	 * @param parents - An array of the parent objects that have already been dereferenced
	 * @param processedObjects - An array of all the objects that have already been dereferenced
	 * @param dereferencedCache - An map of all the dereferenced objects
	 * @param $refs
	 * @param options
	 * @returns
	 */
	function dereference$Ref($ref, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
	    const isExternalRef = ref_js_1.default.isExternal$Ref($ref);
	    const shouldResolveOnCwd = isExternalRef && options?.dereference?.externalReferenceResolution === "root";
	    const $refPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
	    const cache = dereferencedCache.get($refPath);
	    if (cache) {
	        // If the object we found is circular we can immediately return it because it would have been
	        // cached with everything we need already and we don't need to re-process anything inside it.
	        //
	        // If the cached object however is _not_ circular and there are additional keys alongside our
	        // `$ref` pointer here we should merge them back in and return that.
	        if (!cache.circular) {
	            const refKeys = Object.keys($ref);
	            if (refKeys.length > 1) {
	                const extraKeys = {};
	                for (const key of refKeys) {
	                    if (key !== "$ref" && !(key in cache.value)) {
	                        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
	                        extraKeys[key] = $ref[key];
	                    }
	                }
	                return {
	                    circular: cache.circular,
	                    value: Object.assign({}, cache.value, extraKeys),
	                };
	            }
	            return cache;
	        }
	        // If both our cached value and our incoming `$ref` are the same then we can return what we
	        // got out of the cache, otherwise we should re-process this value. We need to do this because
	        // the current dereference caching mechanism doesn't take into account that `$ref` are neither
	        // unique or reference the same file.
	        //
	        // For example if `schema.yaml` references `definitions/child.yaml` and
	        // `definitions/parent.yaml` references `child.yaml` then `$ref: 'child.yaml'` may get cached
	        // for `definitions/child.yaml`, resulting in `schema.yaml` being having an invalid reference
	        // to `child.yaml`.
	        //
	        // This check is not perfect and the design of the dereference caching mechanism needs a total
	        // overhaul.
	        if (typeof cache.value === "object" && "$ref" in cache.value && "$ref" in $ref) {
	            if (cache.value.$ref === $ref.$ref) {
	                return cache;
	            }
	        }
	        else {
	            return cache;
	        }
	    }
	    const pointer = $refs._resolve($refPath, path, options);
	    if (pointer === null) {
	        return {
	            circular: false,
	            value: null,
	        };
	    }
	    // Check for circular references
	    const directCircular = pointer.circular;
	    let circular = directCircular || parents.has(pointer.value);
	    if (circular) {
	        foundCircularReference(path, $refs, options);
	    }
	    // Dereference the JSON reference
	    let dereferencedValue = ref_js_1.default.dereference($ref, pointer.value);
	    // Crawl the dereferenced value (unless it's circular)
	    if (!circular) {
	        // Determine if the dereferenced value is circular
	        const dereferenced = crawl(dereferencedValue, pointer.path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
	        circular = dereferenced.circular;
	        dereferencedValue = dereferenced.value;
	    }
	    if (circular && !directCircular && options.dereference?.circular === "ignore") {
	        // The user has chosen to "ignore" circular references, so don't change the value
	        dereferencedValue = $ref;
	    }
	    if (directCircular) {
	        // The pointer is a DIRECT circular reference (i.e. it references itself).
	        // So replace the $ref path with the absolute path from the JSON Schema root
	        dereferencedValue.$ref = pathFromRoot;
	    }
	    const dereferencedObject = {
	        circular,
	        value: dereferencedValue,
	    };
	    // only cache if no extra properties than $ref
	    if (Object.keys($ref).length === 1) {
	        dereferencedCache.set($refPath, dereferencedObject);
	    }
	    return dereferencedObject;
	}
	/**
	 * Check if we've run past our allowed timeout and throw an error if we have.
	 *
	 * @param startTime - The time when the dereferencing started.
	 * @param options
	 */
	function checkDereferenceTimeout(startTime, options) {
	    if (options && options.timeoutMs) {
	        if (Date.now() - startTime > options.timeoutMs) {
	            throw new errors_1.TimeoutError(options.timeoutMs);
	        }
	    }
	}
	/**
	 * Called when a circular reference is found.
	 * It sets the {@link $Refs#circular} flag, executes the options.dereference.onCircular callback,
	 * and throws an error if options.dereference.circular is false.
	 *
	 * @param keyPath - The JSON Reference path of the circular reference
	 * @param $refs
	 * @param options
	 * @returns - always returns true, to indicate that a circular reference was found
	 */
	function foundCircularReference(keyPath, $refs, options) {
	    $refs.circular = true;
	    options?.dereference?.onCircular?.(keyPath);
	    if (!options.dereference.circular) {
	        const error = new ReferenceError(`Circular $ref pointer found at ${keyPath}`);
	        throw error;
	    }
	    return true;
	}
	return dereference;
}

var maybe$1 = {};

var next$1 = {};

var hasRequiredNext$1;

function requireNext$1 () {
	if (hasRequiredNext$1) return next$1;
	hasRequiredNext$1 = 1;
	Object.defineProperty(next$1, "__esModule", { value: true });
	function makeNext() {
	    if (typeof process === "object" && typeof process.nextTick === "function") {
	        return process.nextTick;
	    }
	    else if (typeof setImmediate === "function") {
	        return setImmediate;
	    }
	    else {
	        return function next(f) {
	            setTimeout(f, 0);
	        };
	    }
	}
	next$1.default = makeNext();
	return next$1;
}

var hasRequiredMaybe$1;

function requireMaybe$1 () {
	if (hasRequiredMaybe$1) return maybe$1;
	hasRequiredMaybe$1 = 1;
	var __importDefault = (maybe$1 && maybe$1.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(maybe$1, "__esModule", { value: true });
	maybe$1.default = maybe;
	const next_js_1 = __importDefault(requireNext$1());
	function maybe(cb, promise) {
	    if (cb) {
	        promise.then(function (result) {
	            (0, next_js_1.default)(function () {
	                cb(null, result);
	            });
	        }, function (err) {
	            (0, next_js_1.default)(function () {
	                cb(err);
	            });
	        });
	        return undefined;
	    }
	    else {
	        return promise;
	    }
	}
	return maybe$1;
}

var hasRequiredLib$1;

function requireLib$1 () {
	if (hasRequiredLib$1) return lib$1;
	hasRequiredLib$1 = 1;
	(function (exports) {
		var __createBinding = (lib$1 && lib$1.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (lib$1 && lib$1.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (lib$1 && lib$1.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __importDefault = (lib$1 && lib$1.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.isUnsafeUrl = exports.$Refs = exports.getJsonSchemaRefParserDefaultOptions = exports.jsonSchemaParserNormalizeArgs = exports.dereferenceInternal = exports.JSONParserErrorGroup = exports.isHandledError = exports.UnmatchedParserError = exports.ParserError = exports.ResolverError = exports.MissingPointerError = exports.InvalidPointerError = exports.JSONParserError = exports.UnmatchedResolverError = exports.dereference = exports.bundle = exports.resolve = exports.parse = exports.$RefParser = void 0;
		const refs_js_1 = __importDefault(requireRefs());
		exports.$Refs = refs_js_1.default;
		const parse_js_1 = __importDefault(requireParse());
		const normalize_args_js_1 = __importDefault(requireNormalizeArgs());
		exports.jsonSchemaParserNormalizeArgs = normalize_args_js_1.default;
		const resolve_external_js_1 = __importDefault(requireResolveExternal());
		const bundle_js_1 = __importDefault(requireBundle());
		const dereference_js_1 = __importDefault(requireDereference());
		exports.dereferenceInternal = dereference_js_1.default;
		const url = __importStar(requireUrl());
		const errors_js_1 = requireErrors();
		Object.defineProperty(exports, "JSONParserError", { enumerable: true, get: function () { return errors_js_1.JSONParserError; } });
		Object.defineProperty(exports, "InvalidPointerError", { enumerable: true, get: function () { return errors_js_1.InvalidPointerError; } });
		Object.defineProperty(exports, "MissingPointerError", { enumerable: true, get: function () { return errors_js_1.MissingPointerError; } });
		Object.defineProperty(exports, "ResolverError", { enumerable: true, get: function () { return errors_js_1.ResolverError; } });
		Object.defineProperty(exports, "ParserError", { enumerable: true, get: function () { return errors_js_1.ParserError; } });
		Object.defineProperty(exports, "UnmatchedParserError", { enumerable: true, get: function () { return errors_js_1.UnmatchedParserError; } });
		Object.defineProperty(exports, "UnmatchedResolverError", { enumerable: true, get: function () { return errors_js_1.UnmatchedResolverError; } });
		Object.defineProperty(exports, "isHandledError", { enumerable: true, get: function () { return errors_js_1.isHandledError; } });
		Object.defineProperty(exports, "JSONParserErrorGroup", { enumerable: true, get: function () { return errors_js_1.JSONParserErrorGroup; } });
		const maybe_js_1 = __importDefault(requireMaybe$1());
		const options_js_1 = requireOptions$1();
		Object.defineProperty(exports, "getJsonSchemaRefParserDefaultOptions", { enumerable: true, get: function () { return options_js_1.getJsonSchemaRefParserDefaultOptions; } });
		const url_js_1 = requireUrl();
		Object.defineProperty(exports, "isUnsafeUrl", { enumerable: true, get: function () { return url_js_1.isUnsafeUrl; } });
		/**
		 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
		 * and provides methods for traversing, manipulating, and dereferencing those references.
		 *
		 * @class
		 */
		class $RefParser {
		    constructor() {
		        /**
		         * The parsed (and possibly dereferenced) JSON schema object
		         *
		         * @type {object}
		         * @readonly
		         */
		        this.schema = null;
		        /**
		         * The resolved JSON references
		         *
		         * @type {$Refs}
		         * @readonly
		         */
		        this.$refs = new refs_js_1.default();
		    }
		    async parse() {
		        const args = (0, normalize_args_js_1.default)(arguments);
		        let promise;
		        if (!args.path && !args.schema) {
		            const err = new Error(`Expected a file path, URL, or object. Got ${args.path || args.schema}`);
		            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
		        }
		        // Reset everything
		        this.schema = null;
		        this.$refs = new refs_js_1.default();
		        // If the path is a filesystem path, then convert it to a URL.
		        // NOTE: According to the JSON Reference spec, these should already be URLs,
		        // but, in practice, many people use local filesystem paths instead.
		        // So we're being generous here and doing the conversion automatically.
		        // This is not intended to be a 100% bulletproof solution.
		        // If it doesn't work for your use-case, then use a URL instead.
		        let pathType = "http";
		        if (url.isFileSystemPath(args.path)) {
		            args.path = url.fromFileSystemPath(args.path);
		            pathType = "file";
		        }
		        else if (!args.path && args.schema && "$id" in args.schema && args.schema.$id) {
		            // when schema id has defined an URL should use that hostname to request the references,
		            // instead of using the current page URL
		            const params = url.parse(args.schema.$id);
		            const port = params.protocol === "https:" ? 443 : 80;
		            args.path = `${params.protocol}//${params.hostname}:${port}`;
		        }
		        // Resolve the absolute path of the schema
		        args.path = url.resolve(url.cwd(), args.path);
		        if (args.schema && typeof args.schema === "object") {
		            // A schema object was passed-in.
		            // So immediately add a new $Ref with the schema object as its value
		            const $ref = this.$refs._add(args.path);
		            $ref.value = args.schema;
		            $ref.pathType = pathType;
		            promise = Promise.resolve(args.schema);
		        }
		        else {
		            // Parse the schema file/url
		            promise = (0, parse_js_1.default)(args.path, this.$refs, args.options);
		        }
		        try {
		            const result = await promise;
		            if (result !== null && typeof result === "object" && !Buffer.isBuffer(result)) {
		                this.schema = result;
		                return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
		            }
		            else if (args.options.continueOnError) {
		                this.schema = null; // it's already set to null at line 79, but let's set it again for the sake of readability
		                return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
		            }
		            else {
		                throw new SyntaxError(`"${this.$refs._root$Ref.path || result}" is not a valid JSON Schema`);
		            }
		        }
		        catch (err) {
		            if (!args.options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
		                return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
		            }
		            if (this.$refs._$refs[url.stripHash(args.path)]) {
		                this.$refs._$refs[url.stripHash(args.path)].addError(err);
		            }
		            return (0, maybe_js_1.default)(args.callback, Promise.resolve(null));
		        }
		    }
		    static parse() {
		        const parser = new $RefParser();
		        return parser.parse.apply(parser, arguments);
		    }
		    async resolve() {
		        const args = (0, normalize_args_js_1.default)(arguments);
		        try {
		            await this.parse(args.path, args.schema, args.options);
		            await (0, resolve_external_js_1.default)(this, args.options);
		            finalize(this);
		            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.$refs));
		        }
		        catch (err) {
		            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
		        }
		    }
		    static resolve() {
		        const instance = new $RefParser();
		        return instance.resolve.apply(instance, arguments);
		    }
		    static bundle() {
		        const instance = new $RefParser();
		        return instance.bundle.apply(instance, arguments);
		    }
		    async bundle() {
		        const args = (0, normalize_args_js_1.default)(arguments);
		        try {
		            await this.resolve(args.path, args.schema, args.options);
		            (0, bundle_js_1.default)(this, args.options);
		            finalize(this);
		            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
		        }
		        catch (err) {
		            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
		        }
		    }
		    static dereference() {
		        const instance = new $RefParser();
		        return instance.dereference.apply(instance, arguments);
		    }
		    async dereference() {
		        const args = (0, normalize_args_js_1.default)(arguments);
		        try {
		            await this.resolve(args.path, args.schema, args.options);
		            (0, dereference_js_1.default)(this, args.options);
		            finalize(this);
		            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
		        }
		        catch (err) {
		            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
		        }
		    }
		}
		exports.$RefParser = $RefParser;
		exports.default = $RefParser;
		function finalize(parser) {
		    const errors = errors_js_1.JSONParserErrorGroup.getParserErrors(parser);
		    if (errors.length > 0) {
		        throw new errors_js_1.JSONParserErrorGroup(parser);
		    }
		}
		exports.parse = $RefParser.parse;
		exports.resolve = $RefParser.resolve;
		exports.bundle = $RefParser.bundle;
		exports.dereference = $RefParser.dereference; 
	} (lib$1));
	return lib$1;
}

var options;
var hasRequiredOptions;

function requireOptions () {
	if (hasRequiredOptions) return options;
	hasRequiredOptions = 1;

	const { getJsonSchemaRefParserDefaultOptions } = requireLib$1();
	const schemaValidator = requireSchema$1();
	const specValidator = requireSpec();

	options = ParserOptions;

	/**
	 * Merges the properties of the source object into the target object.
	 *
	 * @param target - The object that we're populating
	 * @param source - The options that are being merged
	 * @returns
	 */
	function merge(target, source) {
	  if (isMergeable(source)) {
	    // prevent prototype pollution
	    const keys = Object.keys(source).filter((key) => !["__proto__", "constructor", "prototype"].includes(key));
	    for (let i = 0; i < keys.length; i++) {
	      const key = keys[i];
	      const sourceSetting = source[key];
	      const targetSetting = target[key];

	      if (isMergeable(sourceSetting)) {
	        // It's a nested object, so merge it recursively
	        target[key] = merge(targetSetting || {}, sourceSetting);
	      } else if (sourceSetting !== undefined) {
	        // It's a scalar value, function, or array. No merging necessary. Just overwrite the target value.
	        target[key] = sourceSetting;
	      }
	    }
	  }
	  return target;
	}
	/**
	 * Determines whether the given value can be merged,
	 * or if it is a scalar value that should just override the target value.
	 *
	 * @param val
	 * @returns
	 */
	function isMergeable(val) {
	  return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date);
	}

	/**
	 * Options that determine how Swagger APIs are parsed, resolved, dereferenced, and validated.
	 *
	 * @param {object|ParserOptions} [_options] - Overridden options
	 * @class
	 * @augments $RefParserOptions
	 */
	function ParserOptions(_options) {
	  const defaultOptions = getJsonSchemaRefParserDefaultOptions();
	  const options = merge(defaultOptions, ParserOptions.defaults);
	  return merge(options, _options);
	}

	ParserOptions.defaults = {
	  /**
	   * Determines how the API definition will be validated.
	   *
	   * You can add additional validators of your own, replace an existing one with
	   * your own implemenation, or disable any validator by setting it to false.
	   */
	  validate: {
	    schema: schemaValidator,
	    spec: specValidator,
	  },
	};
	return options;
}

var next;
var hasRequiredNext;

function requireNext () {
	if (hasRequiredNext) return next;
	hasRequiredNext = 1;

	function makeNext () {
	  if (typeof process === 'object' && typeof process.nextTick === 'function') {
	    return process.nextTick
	  } else if (typeof setImmediate === 'function') {
	    return setImmediate
	  } else {
	    return function next (f) {
	      setTimeout(f, 0);
	    }
	  }
	}

	next = makeNext();
	return next;
}

var maybe;
var hasRequiredMaybe;

function requireMaybe () {
	if (hasRequiredMaybe) return maybe;
	hasRequiredMaybe = 1;

	var next = requireNext();

	maybe = function maybe (cb, promise) {
	  if (cb) {
	    promise
	      .then(function (result) {
	        next(function () { cb(null, result); });
	      }, function (err) {
	        next(function () { cb(err); });
	      });
	    return undefined
	  }
	  else {
	    return promise
	  }
	};
	return maybe;
}

var lib;
var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib;
	hasRequiredLib = 1;

	const validateSchema = requireSchema$1();
	const validateSpec = requireSpec();
	const {
	  jsonSchemaParserNormalizeArgs: normalizeArgs,
	  dereferenceInternal: dereference,
	  $RefParser,
	} = requireLib$1();
	const util = requireUtil$1();
	const Options = requireOptions();
	const maybe = requireMaybe();

	const supported31Versions = ["3.1.0", "3.1.1"];
	const supported30Versions = ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4"];
	const supportedVersions = [...supported31Versions, ...supported30Versions];

	/**
	 * This class parses a Swagger 2.0 or 3.0 API, resolves its JSON references and their resolved values,
	 * and provides methods for traversing, dereferencing, and validating the API.
	 *
	 * @class
	 * @augments $RefParser
	 */
	class SwaggerParser extends $RefParser {
	  /**
	   * Parses the given Swagger API.
	   * This method does not resolve any JSON references.
	   * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
	   *
	   * @param {string} [path] - The file path or URL of the JSON schema
	   * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
	   * @param {ParserOptions} [options] - Options that determine how the API is parsed
	   * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
	   * @returns {Promise} - The returned promise resolves with the parsed API object.
	   */
	  async parse(path, api, options, callback) {
	    let args = normalizeArgs(arguments);
	    args.options = new Options(args.options);

	    try {
	      let schema = await super.parse(args.path, args.schema, args.options);

	      if (schema.swagger) {
	        if (typeof schema.swagger === "number") {
	          // This is a very common mistake, so give a helpful error message
	          throw new SyntaxError('Swagger version number must be a string (e.g. "2.0") not a number.');
	        } else if (schema.info && typeof schema.info.version === "number") {
	          // This is a very common mistake, so give a helpful error message
	          throw new SyntaxError('API version number must be a string (e.g. "1.0.0") not a number.');
	        } else if (schema.swagger !== "2.0") {
	          throw new SyntaxError(`Unrecognized Swagger version: ${schema.swagger}. Expected 2.0`);
	        }
	      } else {
	        if (schema.paths === undefined) {
	          if (supported31Versions.indexOf(schema.openapi) !== -1) {
	            if (schema.webhooks === undefined) {
	              throw new SyntaxError(`${args.path || args.schema} is not a valid Openapi API definition`);
	            }
	          } else {
	            throw new SyntaxError(`${args.path || args.schema} is not a valid Openapi API definition`);
	          }
	        } else if (typeof schema.openapi === "number") {
	          // This is a very common mistake, so give a helpful error message
	          throw new SyntaxError('Openapi version number must be a string (e.g. "3.0.0") not a number.');
	        } else if (schema.info && typeof schema.info.version === "number") {
	          // This is a very common mistake, so give a helpful error message
	          throw new SyntaxError('API version number must be a string (e.g. "1.0.0") not a number.');
	        } else if (supportedVersions.indexOf(schema.openapi) === -1) {
	          throw new SyntaxError(
	            `Unsupported OpenAPI version: ${schema.openapi}. ` +
	              `Swagger Parser only supports versions ${supportedVersions.join(", ")}`,
	          );
	        }

	        // This is an OpenAPI v3 schema, check if the "servers" have any relative paths and
	        // fix them if the content was pulled from a web resource
	        util.fixOasRelativeServers(schema, args.path);
	      }

	      // Looks good!
	      return maybe(args.callback, Promise.resolve(schema));
	    } catch (err) {
	      return maybe(args.callback, Promise.reject(err));
	    }
	  }

	  /**
	   * Parses, dereferences, and validates the given Swagger API.
	   * Depending on the options, validation can include JSON Schema validation and/or Swagger Spec validation.
	   *
	   * @param {string} [path] - The file path or URL of the JSON schema
	   * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
	   * @param {ParserOptions} [options] - Options that determine how the API is parsed, dereferenced, and validated
	   * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
	   * @returns {Promise} - The returned promise resolves with the parsed API object.
	   */
	  async validate(path, api, options, callback) {
	    let me = this;
	    let args = normalizeArgs(arguments);
	    args.options = new Options(args.options);

	    // ZSchema doesn't support circular objects, so don't dereference circular $refs yet
	    // (see https://github.com/zaggino/z-schema/issues/137)
	    let circular$RefOption = args.options.dereference.circular;
	    args.options.validate.schema && (args.options.dereference.circular = "ignore");

	    try {
	      await this.dereference(args.path, args.schema, args.options);

	      // Restore the original options, now that we're done dereferencing
	      args.options.dereference.circular = circular$RefOption;

	      if (args.options.validate.schema) {
	        // Validate the API against the Swagger schema
	        // NOTE: This is safe to do, because we haven't dereferenced circular $refs yet
	        validateSchema(me.api);

	        if (me.$refs.circular) {
	          if (circular$RefOption === true) {
	            // The API has circular references,
	            // so we need to do a second-pass to fully-dereference it
	            dereference(me, args.options);
	          } else if (circular$RefOption === false) {
	            // The API has circular references, and they're not allowed, so throw an error
	            throw new ReferenceError("The API contains circular references");
	          }
	        }
	      }

	      if (args.options.validate.spec) {
	        // Validate the API against the Swagger spec
	        validateSpec(me.api);
	      }

	      return maybe(args.callback, Promise.resolve(me.schema));
	    } catch (err) {
	      return maybe(args.callback, Promise.reject(err));
	    }
	  }
	}

	/**
	 * Alias {@link $RefParser#schema} as {@link SwaggerParser#api}
	 */
	Object.defineProperty(SwaggerParser.prototype, "api", {
	  configurable: true,
	  enumerable: true,
	  get() {
	    return this.schema;
	  },
	});

	/**
	 * The Swagger object
	 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object
	 *
	 * @typedef {{swagger: string, info: {}, paths: {}}} SwaggerObject
	 */

	const defaultExport = SwaggerParser;

	defaultExport.validate = (...args) => {
	  const defaultInstance = new SwaggerParser();
	  return defaultInstance.validate(...args);
	};
	defaultExport.dereference = (...args) => {
	  const defaultInstance = new SwaggerParser();
	  return defaultInstance.dereference(...args);
	};
	defaultExport.bundle = (...args) => {
	  const defaultInstance = new SwaggerParser();
	  return defaultInstance.bundle(...args);
	};
	defaultExport.parse = (...args) => {
	  const defaultInstance = new SwaggerParser();
	  return defaultInstance.parse(...args);
	};
	defaultExport.resolve = (...args) => {
	  const defaultInstance = new SwaggerParser();
	  return defaultInstance.resolve(...args);
	};
	defaultExport.default = defaultExport;
	defaultExport.SwaggerParser = defaultExport;

	lib = defaultExport;
	return lib;
}

var libExports = requireLib();
var SwaggerParser = /*@__PURE__*/getDefaultExportFromCjs(libExports);

const SUPPORTED_OPENAPI_SPEC_VERSION = /^3\.\d+\.\d+$/;
const preProcessSpecFile$1 = async (specFile) => {
    return (unthrowableParseJson(specFile.content) || parse$1(specFile.content));
};
const resolveServerUrlWithDefaultVariables = (server) => {
    const variables = server.variables || {};
    const url = server.url;
    return url.replace(/\{([^}]+)\}/g, (match, p1) => variables[p1]?.default || match);
};
const createServerVariables = (servers) => {
    const variables = {};
    if (!servers || servers.length === 0) {
        return variables;
    }
    servers.forEach((server, index) => {
        const variableName = index === 0 ? 'base_url' : `base_url${index + 1}`;
        variables[variableName] = {
            id: index + 1,
            isPersisted: true,
            type: EnvironmentVariableType.String,
            syncValue: resolveServerUrlWithDefaultVariables(server)
        };
    });
    return variables;
};
const getDescriptionFromTags$1 = (tags, basePath) => {
    return tags.find(tag => tag.name === basePath.split('/')[1])?.description || "Collection for " + basePath + " endpoints";
};
const buildNestedCollections$1 = (specData) => {
    const collections = {};
    if (!specData.paths) {
        return collections;
    }
    Object.entries(specData.paths).forEach(([path, pathItem]) => {
        if (!pathItem)
            return;
        const pathSegments = path.split('/').filter(segment => segment !== '');
        const methods = Object.keys(pathItem).filter(method => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase()));
        const pathGroup = {
            path,
            methods: methods.map(m => m.toUpperCase())
        };
        let currentLevel = collections;
        let currentPath = '';
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            const isParameter = segment.startsWith('{') && segment.endsWith('}');
            const collectionName = isParameter ? segment : segment;
            const fullPath = currentPath + '/' + segment;
            if (!currentLevel[collectionName]) {
                currentLevel[collectionName] = {
                    name: collectionName,
                    path: fullPath,
                    children: {},
                    requests: []
                };
            }
            if (i === pathSegments.length - 1) {
                currentLevel[collectionName].requests.push(pathGroup);
            }
            else {
                currentLevel = currentLevel[collectionName].children;
                currentPath = fullPath;
            }
        }
    });
    return collections;
};
const createAuthConfig$1 = (operation, specData) => {
    const createAuthConfigObject = (schemeData) => {
        const type = schemeData.type;
        switch (type) {
            case "apiKey":
                return {
                    currentAuthType: Authorization.Type.API_KEY,
                    authConfigStore: {
                        [Authorization.Type.API_KEY]: {
                            key: schemeData.name,
                            value: "",
                            addTo: schemeData.in === "header" ? "HEADER" : "QUERY"
                        }
                    }
                };
            case "http":
                if (schemeData.scheme === "bearer") {
                    return {
                        currentAuthType: Authorization.Type.BEARER_TOKEN,
                        authConfigStore: {
                            [Authorization.Type.BEARER_TOKEN]: {
                                bearer: schemeData.bearerFormat || ""
                            }
                        }
                    };
                }
                else if (schemeData.scheme === "basic") {
                    return {
                        currentAuthType: Authorization.Type.BASIC_AUTH,
                        authConfigStore: {}
                    };
                }
            default:
                return {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                };
        }
    };
    if (!operation.security) {
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        };
    }
    let authConfig = null;
    for (const securityScheme of operation.security) {
        const [key,] = Object.entries(securityScheme)[0];
        const schemeData = specData.components?.securitySchemes?.[key];
        if (schemeData && typeof schemeData === 'object' && 'type' in schemeData && (schemeData.type === "http" || schemeData.type === "apiKey")) {
            authConfig = createAuthConfigObject(schemeData);
            break;
        }
        else
            continue;
    }
    if (!authConfig) {
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        };
    }
    return authConfig;
};
const prepareParameters$1 = (parameters) => {
    if (!parameters)
        return { queryParams: [], headers: [], pathParams: [] };
    const queryParams = [];
    const headers = [];
    const pathParams = [];
    parameters.forEach((param, index) => {
        if (param.in === 'query') {
            queryParams.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if (param.in === 'header') {
            headers.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if (param.in === 'path') {
            pathParams.push({
                id: index + 1,
                key: param.name,
                value: String(getParamValue(param.schema)),
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
    });
    return { queryParams, headers, pathParams };
};
const getRawRequestBody = (schema) => {
    return schema.default ?? schema.example ?? "";
};
const getUrlEncodedRequestBody = (schema) => {
    const formData = [];
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property], index) => {
            if (property) {
                const propSchema = property;
                const value = propSchema.example ?? propSchema.default ?? '';
                formData.push({
                    id: index + 1,
                    key: key,
                    value: String(value),
                    isEnabled: true
                });
            }
        });
    }
    return formData;
};
const getMultipartFormRequestBody = (schema) => {
    const formData = [];
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property], index) => {
            if (property) {
                const propSchema = property;
                propSchema.example ?? propSchema.default ?? '';
                formData.push({
                    id: index + 1,
                    key: key,
                    value: "",
                    isEnabled: true
                });
            }
        });
    }
    return formData;
};
const getJsonValue = (schema) => {
    switch (schema.type) {
        case 'string':
            return schema.example ?? schema.default ?? '';
        case 'number':
        case 'integer':
            return schema.example ?? schema.default ?? 0;
        case 'boolean':
            return schema.example ?? schema.default ?? false;
        case 'array':
            if (schema.example !== undefined) {
                return schema.example;
            }
            if (schema.default !== undefined) {
                return schema.default;
            }
            if (schema.items) {
                const itemsSchema = schema.items;
                return [getJsonValue(itemsSchema)];
            }
            return [];
        case 'object':
            if (schema.properties) {
                const obj = {};
                Object.entries(schema.properties).forEach(([key, property]) => {
                    if (property) {
                        const propSchema = property;
                        obj[key] = getJsonValue(propSchema);
                    }
                });
                return obj;
            }
            return {};
        default:
            return null;
    }
};
const getJsonRequestBody = (schema) => {
    const json = {};
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, property]) => {
            if (property) {
                const propSchema = property;
                json[key] = getJsonValue(propSchema);
            }
        });
    }
    return JSON.stringify(json, null, 2);
};
const getRawTextFromSchema = (schema) => {
    return schema.example ?? schema.default ?? '';
};
const prepareRequestBody$1 = (operation) => {
    const requestBody = operation.requestBody;
    let body = null;
    const bodyContainer = {
        text: '',
        form: [],
        multipartForm: []
    };
    let contentType = null;
    if (!requestBody?.content) {
        return { contentType: RequestContentType.RAW, bodyContainer, body: null };
    }
    const content = requestBody.content;
    if (content[RequestContentType.RAW]) {
        contentType = RequestContentType.RAW;
        const parsedBody = getRawTextFromSchema(content[RequestContentType.RAW].schema);
        bodyContainer.text = parsedBody;
        body = parsedBody;
    }
    if (content[RequestContentType.JSON]) {
        contentType = RequestContentType.JSON;
        const parsedBody = getJsonRequestBody(content[RequestContentType.JSON].schema);
        bodyContainer.text = parsedBody;
        body = parsedBody;
    }
    if (content[RequestContentType.FORM]) {
        contentType = RequestContentType.FORM;
        const parsedBody = getUrlEncodedRequestBody(content[RequestContentType.FORM].schema);
        bodyContainer.form = parsedBody;
        body = parsedBody;
    }
    if (content[RequestContentType.MULTIPART_FORM]) {
        contentType = RequestContentType.MULTIPART_FORM;
        const parsedBody = getMultipartFormRequestBody(content[RequestContentType.MULTIPART_FORM].schema);
        bodyContainer.multipartForm = parsedBody;
        bodyContainer.multipartForm = getMultipartFormRequestBody(content[RequestContentType.MULTIPART_FORM].schema);
        body = parsedBody;
    }
    return { contentType: contentType || RequestContentType.RAW, bodyContainer, body };
};
const createApiRecord$1 = (operation, path, method, specData) => {
    const resolvedPath = path.replace(/\{([^}]+)\}/g, ':$1');
    const fullUrl = `{{base_url}}${resolvedPath}`;
    const { queryParams, headers, pathParams } = prepareParameters$1(operation.parameters);
    const pathVariables = [];
    const pathVarMatches = path.match(/\{([^}]+)\}/g);
    if (pathVarMatches) {
        pathVarMatches.forEach((match, index) => {
            const pathVarName = match.slice(1, -1); // Remove { and }
            pathVariables.push({
                id: index + 1,
                key: pathVarName,
                value: pathParams.find(param => param.key === pathVarName)?.value || '',
                description: pathParams.find(param => param.key === pathVarName)?.description || "",
                dataType: pathParams.find(param => param.key === pathVarName)?.dataType || KeyValueDataType.STRING,
            });
        });
    }
    const { contentType, bodyContainer, body } = prepareRequestBody$1(operation);
    const httpRequest = {
        url: fullUrl,
        queryParams,
        method,
        pathVariables,
        headers,
        /*
        TODO: fix this
        Accoring to our types we allow undefiend values for body, but this will cause issues whhen
        saving the record in firestore DB because it firebase does not allow undefiend values in documents.
        We need to fix this by adding a default value for body in the types or giving a null value to body
        */
        // @ts-ignore
        body,
        bodyContainer,
        contentType,
        includeCredentials: false
    };
    const httpApiEntry = {
        type: RQAPI.ApiEntryType.HTTP,
        request: httpRequest,
        response: null,
        testResults: [],
        scripts: {
            preRequest: '',
            postResponse: ''
        },
        auth: createAuthConfig$1(operation, specData)
    };
    const apiRecord = {
        id: "",
        name: operation.summary || operation?.operationId || `${method} ${path}`,
        description: operation.description || '',
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: Date.now(),
        updatedTs: Date.now(),
        type: RQAPI.RecordType.API,
        data: httpApiEntry
    };
    return apiRecord;
};
const convertNestedCollectionToRQAPI$1 = (collection, specData, currentTimestamp) => {
    const result = [];
    Object.values(collection).forEach(nestedCollection => {
        const apiRecords = [];
        // Add requests from this collection
        nestedCollection.requests.forEach(({ path, methods }) => {
            methods.forEach(method => {
                const operation = specData.paths?.[path]?.[method.toLowerCase()];
                if (operation) {
                    const apiRecord = createApiRecord$1(operation, path, method, specData);
                    apiRecords.push(apiRecord);
                }
            });
        });
        // Recursively convert child collections
        const childCollections = convertNestedCollectionToRQAPI$1(nestedCollection.children, specData, currentTimestamp);
        const collectionRecord = {
            id: "",
            name: nestedCollection.name,
            description: getDescriptionFromTags$1(specData.tags || [], nestedCollection.path),
            collectionId: "",
            isExample: false,
            ownerId: '',
            deleted: false,
            createdBy: '',
            updatedBy: '',
            createdTs: currentTimestamp,
            updatedTs: currentTimestamp,
            type: RQAPI.RecordType.COLLECTION,
            data: {
                children: [...apiRecords, ...childCollections],
                scripts: {
                    preRequest: '',
                    postResponse: ''
                },
                variables: {},
                auth: {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                }
            }
        };
        result.push(collectionRecord);
    });
    return result;
};
const parseSpecification$1 = (specData) => {
    const currentTimestamp = Date.now();
    const rootServers = specData.servers || [];
    const rootServerVariables = createServerVariables(rootServers);
    const collections = buildNestedCollections$1(specData);
    const subCollections = convertNestedCollectionToRQAPI$1(collections, specData, currentTimestamp);
    const rootCollection = {
        id: "",
        name: specData.info?.title || 'OpenAPI Collection',
        description: specData.info?.description || 'Collection imported from OpenAPI specification',
        collectionId: "",
        isExample: false,
        ownerId: '',
        deleted: false,
        createdBy: '',
        updatedBy: '',
        createdTs: currentTimestamp,
        updatedTs: currentTimestamp,
        type: RQAPI.RecordType.COLLECTION,
        data: {
            children: subCollections,
            scripts: {
                preRequest: '',
                postResponse: ''
            },
            variables: rootServerVariables,
            auth: {
                currentAuthType: Authorization.Type.NO_AUTH,
                authConfigStore: {}
            }
        }
    };
    return rootCollection;
};
const createServerEnvironment = (server, index, title) => {
    return {
        id: "",
        name: `${title} ${index > 0 ? `(${index + 1})` : ''}`,
        variables: createServerVariables([server]),
    };
};
const parseServerEnvironments = (servers, title) => {
    if (!servers || servers.length === 0)
        return [];
    return servers.map((server, index) => createServerEnvironment(server, index, title));
};
const convert$1 = async (specFile) => {
    let specData = await preProcessSpecFile$1(specFile);
    if (!specData || !SUPPORTED_OPENAPI_SPEC_VERSION.test(specData.openapi)) {
        throw new Error("Invalid OpenAPI specification");
    }
    try {
        specData = (await SwaggerParser.validate(specData, {
            dereference: {
                circular: "ignore"
            },
            validate: {
                schema: false,
                spec: true
            }
        }));
        const environments = parseServerEnvironments(specData.servers, specData.info.title);
        const collectionRecord = parseSpecification$1(specData);
        return {
            data: {
                collection: collectionRecord,
                environments
            }
        };
    }
    catch (error) {
        console.error("Error validating spec file:", error);
        throw new Error("Invalid OpenAPI specification");
    }
};

var openApi3Importer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    convert: convert$1,
    getJsonRequestBody: getJsonRequestBody,
    getMultipartFormRequestBody: getMultipartFormRequestBody,
    getRawRequestBody: getRawRequestBody,
    getUrlEncodedRequestBody: getUrlEncodedRequestBody,
    prepareParameters: prepareParameters$1,
    prepareRequestBody: prepareRequestBody$1
});

const SUPPORTED_SWAGGER_SPEC_VERSION = /^2\.\d+\.\d+$/;
const preProcessSpecFile = async (specFile) => {
    return (unthrowableParseJson(specFile.content) || parse$1(specFile.content));
};
const extractBaseUrl = (specData) => {
    const host = specData.host || '';
    const basePath = specData.basePath || '';
    const schemes = specData.schemes || ['https'];
    const scheme = schemes[0] || 'https';
    return `${scheme}://${host}${basePath}`;
};
const getDescriptionFromTags = (tags, basePath) => {
    return tags.find(tag => tag.name === basePath.split('/')[1])?.description || "Collection for " + basePath + " endpoints";
};
const buildNestedCollections = (specData) => {
    const collections = {};
    if (!specData.paths) {
        return collections;
    }
    Object.entries(specData.paths).forEach(([path, pathItem]) => {
        if (!pathItem)
            return;
        const pathSegments = path.split('/').filter(segment => segment !== '');
        const methods = Object.keys(pathItem).filter(method => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase()));
        const pathGroup = {
            path,
            methods: methods.map(m => m.toUpperCase())
        };
        let currentLevel = collections;
        let currentPath = '';
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            const isParameter = segment.startsWith('{') && segment.endsWith('}');
            const collectionName = isParameter ? segment : segment;
            const fullPath = currentPath + '/' + segment;
            if (!currentLevel[collectionName]) {
                currentLevel[collectionName] = {
                    name: collectionName,
                    path: fullPath,
                    children: {},
                    requests: []
                };
            }
            if (i === pathSegments.length - 1) {
                currentLevel[collectionName].requests.push(pathGroup);
            }
            else {
                currentLevel = currentLevel[collectionName].children;
                currentPath = fullPath;
            }
        }
    });
    return collections;
};
const createAuthConfig = (operation, specData) => {
    const createAuthConfigObject = (schemeData) => {
        const type = schemeData.type;
        switch (type) {
            case "apiKey":
                return {
                    currentAuthType: Authorization.Type.API_KEY,
                    authConfigStore: {}
                };
            case "basic":
                return {
                    currentAuthType: Authorization.Type.BASIC_AUTH,
                    authConfigStore: {}
                };
            case "oauth2":
                // For OAuth2, we'll default to Bearer token for simplicity
                return {
                    currentAuthType: Authorization.Type.BEARER_TOKEN,
                    authConfigStore: {}
                };
            default:
                return {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                };
        }
    };
    if (!operation.security) {
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        };
    }
    let authConfig = null;
    for (const securityScheme of operation.security) {
        const [key,] = Object.entries(securityScheme)[0];
        const schemeData = specData.securityDefinitions?.[key];
        if (schemeData && typeof schemeData === 'object' && 'type' in schemeData &&
            (schemeData.type === "basic" || schemeData.type === "apiKey" || schemeData.type === "oauth2")) {
            authConfig = createAuthConfigObject(schemeData);
            break;
        }
        else
            continue;
    }
    if (!authConfig) {
        return {
            currentAuthType: Authorization.Type.INHERIT,
            authConfigStore: {}
        };
    }
    return authConfig;
};
const prepareParameters = (parameters) => {
    if (!parameters)
        return { queryParams: [], headers: [], pathParams: [] };
    const queryParams = [];
    const headers = [];
    const pathParams = [];
    parameters.forEach((param, index) => {
        if (param.in === 'query') {
            queryParams.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if (param.in === 'header') {
            headers.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                isEnabled: true,
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
        else if (param.in === 'path') {
            pathParams.push({
                id: index + 1,
                key: param.name || '',
                value: String(getParamValue(param.schema)),
                description: param.description || "",
                dataType: getKeyValueDataTypeFromParam(param.schema),
            });
        }
    });
    return { queryParams, headers, pathParams };
};
const prepareRequestBody = (operation) => {
    let contentType = RequestContentType.JSON;
    let body = null;
    const bodyParam = operation.parameters?.find((param) => param && typeof param === 'object' && 'in' in param && param.in === 'body');
    if (bodyParam && 'schema' in bodyParam && bodyParam.schema) {
        contentType = RequestContentType.JSON;
        body = JSON.stringify(bodyParam.schema, null, 2);
    }
    else {
        const formDataParams = operation.parameters?.filter((param) => param && typeof param === 'object' && 'in' in param && param.in === 'formData');
        if (formDataParams && formDataParams.length > 0) {
            contentType = RequestContentType.MULTIPART_FORM;
            body = [];
        }
    }
    return { contentType, body };
};
const createApiRecord = (operation, path, method, specData) => {
    const fullUrl = `{{base_url}}${path}`;
    const { queryParams, headers, pathParams } = prepareParameters(operation.parameters);
    const pathVariables = [];
    const pathVarMatches = path.match(/\{([^}]+)\}/g);
    if (pathVarMatches) {
        pathVarMatches.forEach((match, index) => {
            const pathVarName = match.slice(1, -1); // Remove { and }
            pathVariables.push({
                id: index + 1,
                key: pathVarName,
                value: pathParams.find(param => param.key === pathVarName)?.value || '',
                description: pathParams.find(param => param.key === pathVarName)?.description || "",
                dataType: pathParams.find(param => param.key === pathVarName)?.dataType || KeyValueDataType.STRING,
            });
        });
    }
    const { contentType, body } = prepareRequestBody(operation);
    const requestData = {
        url: fullUrl,
        queryParams,
        method,
        pathVariables,
        headers,
        // @ts-ignore
        body,
        contentType,
        includeCredentials: false
    };
    const httpApiEntry = {
        type: RQAPI.ApiEntryType.HTTP,
        request: requestData,
        response: null,
        testResults: [],
        scripts: {
            preRequest: '',
            postResponse: ''
        },
        auth: createAuthConfig(operation, specData)
    };
    const apiRecord = {
        id: "",
        name: `${method} ${path}`,
        description: operation.description || '',
        collectionId: "",
        isExample: false,
        ownerId: "",
        deleted: false,
        createdBy: "",
        updatedBy: "",
        createdTs: Date.now(),
        updatedTs: Date.now(),
        type: RQAPI.RecordType.API,
        data: httpApiEntry
    };
    return apiRecord;
};
const convertNestedCollectionToRQAPI = (collection, specData, currentTimestamp) => {
    const result = [];
    Object.values(collection).forEach(nestedCollection => {
        const apiRecords = [];
        // Add requests from this collection
        nestedCollection.requests.forEach(({ path, methods }) => {
            methods.forEach(method => {
                const operation = specData.paths?.[path]?.[method.toLowerCase()];
                if (operation) {
                    const apiRecord = createApiRecord(operation, path, method, specData);
                    apiRecords.push(apiRecord);
                }
            });
        });
        // Recursively convert child collections
        const childCollections = convertNestedCollectionToRQAPI(nestedCollection.children, specData, currentTimestamp);
        const collectionRecord = {
            id: "",
            name: nestedCollection.name,
            description: getDescriptionFromTags(specData.tags || [], nestedCollection.path),
            collectionId: "",
            isExample: false,
            ownerId: '',
            deleted: false,
            createdBy: '',
            updatedBy: '',
            createdTs: currentTimestamp,
            updatedTs: currentTimestamp,
            type: RQAPI.RecordType.COLLECTION,
            data: {
                children: [...apiRecords, ...childCollections],
                scripts: {
                    preRequest: '',
                    postResponse: ''
                },
                variables: {},
                auth: {
                    currentAuthType: Authorization.Type.INHERIT,
                    authConfigStore: {}
                }
            }
        };
        result.push(collectionRecord);
    });
    return result;
};
const parseSpecification = (specData) => {
    const currentTimestamp = Date.now();
    const baseUrl = extractBaseUrl(specData);
    const nestedCollections = buildNestedCollections(specData);
    const childCollections = convertNestedCollectionToRQAPI(nestedCollections, specData, currentTimestamp);
    const rootCollection = {
        id: "",
        name: specData.info?.title || 'Swagger Collection',
        description: specData.info?.description || 'Collection imported from Swagger 2.0 specification',
        collectionId: "",
        isExample: false,
        ownerId: '',
        deleted: false,
        createdBy: '',
        updatedBy: '',
        createdTs: currentTimestamp,
        updatedTs: currentTimestamp,
        type: RQAPI.RecordType.COLLECTION,
        data: {
            children: childCollections,
            scripts: {
                preRequest: '',
                postResponse: ''
            },
            variables: {
                base_url: {
                    id: 1,
                    type: 'string',
                    isPersisted: true,
                    syncValue: baseUrl
                }
            },
            auth: {
                currentAuthType: Authorization.Type.NO_AUTH,
                authConfigStore: {}
            }
        }
    };
    return rootCollection;
};
const convert = async (specFile) => {
    let specData = await preProcessSpecFile(specFile);
    if (!specData || !SUPPORTED_SWAGGER_SPEC_VERSION.test(specData.swagger)) {
        throw new Error("Invalid Swagger 2.0 specification");
    }
    try {
        specData = (await SwaggerParser.validate(specData, {
            dereference: {
                circular: "ignore"
            }
        }));
        const collectionRecord = parseSpecification(specData);
        return {
            data: {
                collection: collectionRecord,
                environments: []
            }
        };
    }
    catch (error) {
        console.error("Error validating Swagger 2.0 spec file:", error);
        throw new Error("Invalid Swagger 2.0 specification");
    }
};

var swagger2Importer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    convert: convert
});

const openApiImporter = async (specs) => {
    const importers = [
        openApi3Importer,
        swagger2Importer
    ];
    for (const importer of importers) {
        try {
            const result = await importer.convert(specs);
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    // TODO: fix error message
    throw new Error("All importers failed to convert the spec");
};

export { headerEditorImporter as importHeaderEditor, modheaderImporter as importModheader, convertToOpenAPI as openApiExporter, openApiImporter, convertRequestlyCollectionToPostman as postmanCollectionExporter, convertRequestlyEnvironmentsToPostman as postmanEnvironmentExporter };
