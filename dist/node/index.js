"use strict";
/**
 * Kinetica Database API Client
 *
 * The package's public surface. Two files mirror it name by name and must be
 * kept in step by hand when an export is added or removed:
 *
 *   src/esm/index.mjs    re-exports every runtime value, for `import`
 *   src/esm/index.d.mts  declares every export, for `import`
 *
 * (src/standalone.ts and compat/GPUdb.js re-export this module wholesale and
 * need no change.)
 *
 * compat/index.d.ts is generated: a new exported type must also be listed in
 * templates/compat.d.ts, and the API regenerated, to reach it.
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON_ONLY_ENDPOINTS = exports.AvroError = exports.AvroType = exports.ResponseTooLargeError = exports.NodeHttpTransport = exports.BrowserHttpTransport = exports.createTransport = exports.Column = exports.Type = exports.base64Decode = exports.base64Encode = exports.decodeNoInfNan = exports.decodeRegular = exports.decode = exports.encode = exports.RingList = exports.END_OF_SET = exports.FileHandler = exports.GPUdb = void 0;
var GPUdb_1 = require("./GPUdb");
Object.defineProperty(exports, "GPUdb", { enumerable: true, get: function () { return GPUdb_1.GPUdb; } });
Object.defineProperty(exports, "FileHandler", { enumerable: true, get: function () { return GPUdb_1.FileHandler; } });
Object.defineProperty(exports, "END_OF_SET", { enumerable: true, get: function () { return GPUdb_1.END_OF_SET; } });
__exportStar(require("./types"), exports);
var utils_1 = require("./utils");
Object.defineProperty(exports, "RingList", { enumerable: true, get: function () { return utils_1.RingList; } });
Object.defineProperty(exports, "encode", { enumerable: true, get: function () { return utils_1.encode; } });
Object.defineProperty(exports, "decode", { enumerable: true, get: function () { return utils_1.decode; } });
Object.defineProperty(exports, "decodeRegular", { enumerable: true, get: function () { return utils_1.decodeRegular; } });
Object.defineProperty(exports, "decodeNoInfNan", { enumerable: true, get: function () { return utils_1.decodeNoInfNan; } });
Object.defineProperty(exports, "base64Encode", { enumerable: true, get: function () { return utils_1.base64Encode; } });
Object.defineProperty(exports, "base64Decode", { enumerable: true, get: function () { return utils_1.base64Decode; } });
Object.defineProperty(exports, "Type", { enumerable: true, get: function () { return utils_1.Type; } });
Object.defineProperty(exports, "Column", { enumerable: true, get: function () { return utils_1.Column; } });
var transport_1 = require("./transport");
Object.defineProperty(exports, "createTransport", { enumerable: true, get: function () { return transport_1.createTransport; } });
Object.defineProperty(exports, "BrowserHttpTransport", { enumerable: true, get: function () { return transport_1.BrowserHttpTransport; } });
Object.defineProperty(exports, "NodeHttpTransport", { enumerable: true, get: function () { return transport_1.NodeHttpTransport; } });
Object.defineProperty(exports, "ResponseTooLargeError", { enumerable: true, get: function () { return transport_1.ResponseTooLargeError; } });
var avro_1 = require("./avro");
Object.defineProperty(exports, "AvroType", { enumerable: true, get: function () { return avro_1.AvroType; } });
Object.defineProperty(exports, "AvroError", { enumerable: true, get: function () { return avro_1.AvroError; } });
var schemas_1 = require("./schemas");
Object.defineProperty(exports, "JSON_ONLY_ENDPOINTS", { enumerable: true, get: function () { return schemas_1.JSON_ONLY_ENDPOINTS; } });
const GPUdb_2 = require("./GPUdb");
/**
 * The GPUdb class, so `import GPUdb from '@kinetica/gpudb-api'` works like
 * the `require` of the package this replaces. The named export is the same
 * class; use either.
 */
exports.default = GPUdb_2.GPUdb;
