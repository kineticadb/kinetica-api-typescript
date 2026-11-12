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
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export { http, https, url, fs, path, os, crypto };
