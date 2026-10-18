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

export {
    GPUdb,
    FileHandler,
    END_OF_SET,
    GPUdbOptions,
    GPUdbCallback,
    GetRecordsJsonResponse,
    WmsImage,
    UploadProgressCallback
} from './GPUdb';
export * from './types';
export {
    RingList,
    encode,
    decode,
    decodeRegular,
    decodeNoInfNan,
    base64Encode,
    base64Decode,
    Type,
    Column
} from './utils';
export {
    createTransport,
    BrowserHttpTransport,
    NodeHttpTransport,
    ResponseTooLargeError,
    HttpTransport,
    HttpRequestOptions,
    HttpResponse
} from './transport';
export {
    AvroType,
    AvroError,
    AvroSchema
} from './avro';
export {
    JSON_ONLY_ENDPOINTS
} from './schemas';

import { GPUdb as GPUdbDefault } from './GPUdb';

/**
 * The GPUdb class, so `import GPUdb from '@kinetica/gpudb-api'` works like
 * the `require` of the package this replaces. The named export is the same
 * class; use either.
 */
export default GPUdbDefault;
