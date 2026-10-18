/**
 * Entry point for the standalone browser build.
 *
 * Identical to the package's main entry, except that clients default to
 * synchronous requests when no callback is given -- the behaviour the
 * JavaScript API had, which existing <script> tag code relies on.
 */
import { setDefaultSync } from './GPUdb';
export * from './index';
setDefaultSync(true);
