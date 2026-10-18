/**
 * Backward-compatible entry point for the legacy @kinetica/gpudb package.
 *
 * The old NodeJS API exported the constructor itself:
 *
 *     const GPUdb = require('@kinetica/gpudb');
 *     const db = new GPUdb('http://localhost:9191');
 *
 * whereas @kinetica/gpudb-api exports a namespace. This module restores the
 * old shape so existing code keeps working unchanged, while the modern
 * destructured form works too:
 *
 *     const { GPUdb, Type, Column } = require('@kinetica/gpudb');
 *
 * Everything the old API hung off the constructor -- Type, RingList,
 * FileHandler, encode/decode and their variants, END_OF_SET, api_version --
 * is already attached as a static, so no further wiring is needed here.
 *
 * Synchronous calls are not a concern on this path: the old NodeJS API
 * returned a promise when no callback was given, exactly as this does. The
 * browser build's synchronous behaviour is preserved separately, in
 * dist/standalone/GPUdb.js.
 *
 * The parts of the current server URL that the old API exposed as instance
 * properties -- url, protocol, hostname, port and pathname -- are there too,
 * from the class. Two things have no equivalent: GPUdb.ConnectionToken, an
 * internal helper of the old Node transport, and the public `urls` list of
 * them.
 */

// Normally resolved through npm, where @kinetica/gpudb-api is a dependency.
// In a filesystem install -- /opt/gpudb/api/typescript, from the RPM, DEB or
// tarball -- there is no node_modules, but the implementation sits alongside
// this file, so fall back to it rather than failing to load.
let api;
try {
    api = require('@kinetica/gpudb-api');
} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
    }
    api = require('../dist/node');
}

const GPUdb = api.GPUdb;

// The legacy shape: module.exports IS the constructor
module.exports = GPUdb;

// ...and the named exports, for code already migrating
for (const key of Object.keys(api)) {
    if (!Object.prototype.hasOwnProperty.call(GPUdb, key)) {
        GPUdb[key] = api[key];
    }
}
