"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = exports.os = exports.path = exports.fs = exports.url = exports.https = exports.http = void 0;
/**
 * The Node.js built-ins the API uses, imported in one place.
 *
 * Only Node-only code paths reach them: NodeHttpTransport, FileHandler's
 * filesystem methods, the User-Agent builder and the session-id fallback,
 * each guarded by a runtime check for Node. A browser build never runs them,
 * so package.json's "browser" field maps this module to
 * nodeBuiltins.browser.ts, whose exports are undefined, and a bundler never
 * sees an import of a Node built-in at all.
 *
 * Static imports, deliberately: a dynamic `import()` of each built-in, which
 * the "browser" field could stub to `false`, made webpack emit an empty async
 * chunk per import and add chunk-loading runtime to every consumer's bundle.
 */
const http = __importStar(require("http"));
exports.http = http;
const https = __importStar(require("https"));
exports.https = https;
const url = __importStar(require("url"));
exports.url = url;
const fs = __importStar(require("fs"));
exports.fs = fs;
const path = __importStar(require("path"));
exports.path = path;
const os = __importStar(require("os"));
exports.os = os;
const crypto = __importStar(require("crypto"));
exports.crypto = crypto;
