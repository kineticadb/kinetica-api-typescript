/**
 * Declarations for the ES module entry point.
 *
 * Node resolves declarations per export condition, so the `import` condition
 * needs its own .d.mts alongside the .d.ts used by `require`.
 */

export * from '../types/index.js';

import { GPUdb } from '../types/index.js';

/**
 * The GPUdb class, as the default export -- the same value the CommonJS and
 * browser builds default-export, and the shape of the package this replaces.
 */
export default GPUdb;
