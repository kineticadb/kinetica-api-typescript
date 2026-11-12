"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = exports.os = exports.path = exports.fs = exports.url = exports.https = exports.http = void 0;
/**
 * What a browser build gets in place of nodeBuiltins.ts, through
 * package.json's "browser" field: the same names, all undefined.
 *
 * Nothing reads them in a browser -- every user of a Node built-in checks
 * for Node first -- so the casts only keep the two modules' types identical.
 */
exports.http = undefined;
exports.https = undefined;
exports.url = undefined;
exports.fs = undefined;
exports.path = undefined;
exports.os = undefined;
exports.crypto = undefined;
