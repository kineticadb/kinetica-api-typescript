/**
 * Kinetica API example for TypeScript with ES modules
 *
 * Compiled, not run directly:
 *
 *   npm run build                 # dist/esm and dist/types are what this uses
 *   npm run test:types:esm        # type-checks this file under nodenext
 *
 * It imports the built entry point so it resolves from a checkout. In your own
 * project, install the package and import it by name -- declarations resolve
 * through the `types` condition, with no @types package and no ambient module
 * declaration:
 *
 *   import { GPUdb, type GPUdbOptions } from '@kinetica/gpudb-api';
 *
 * This is the arrangement that fails against a CommonJS-only package: under
 * "moduleResolution": "nodenext" TypeScript needs per-condition declarations,
 * which the exports map supplies (.d.mts for import, .d.ts for require).
 */

import {
    GPUdb,
    Type,
    Column,
    FileHandler,
    END_OF_SET
} from '../dist/esm/index.mjs';

// The default export is the GPUdb class, the shape the package this replaces
// had. Either import works; the named one is clearer alongside the others.
import GPUdbDefault from '../dist/esm/index.mjs';
const sameClass: typeof GPUdb = GPUdbDefault;

import type {
    GPUdbOptions,
    DynamicSchemaData,
    GetRecordsResponse,
    HttpTransport,
    HttpRequestOptions,
    HttpResponse
} from '../dist/esm/index.mjs';

const options: GPUdbOptions = {
    username: 'admin',
    password: 'secret',
    timeout: 30000,
    client_name: 'my-app',
    client_version: '1.0.0'
};

const db = new GPUdb('http://localhost:9191', options);

async function readRecords(): Promise<void> {
    // Row-major: an array of records
    const records: GetRecordsResponse = await db.get_records('my_table', 0, END_OF_SET, {});
    const rows: Record<string, any>[] | undefined = records.data;
    const firstName: unknown = rows?.[0]?.name;

    // Column-major: a dynamic schema, typed as such so the difference is
    // visible at compile time rather than at 3am
    const sql = await db.execute_sql('SELECT name FROM my_table', 0, 10, '', [], {});
    const data: DynamicSchemaData | undefined = sql.data;
    const headers: string[] | undefined = data?.column_headers;
    const values: unknown[] | undefined = data?.column_1;

    // Async iteration over a paged result set
    for await (const row of db.SqlIterator('SELECT * FROM my_table', 10000, {})) {
        console.log(row.id, row.name);
    }
}

async function defineTable(): Promise<string> {
    const recordType = new Type('my_type',
        new Column('id', 'int', 'primary_key'),
        new Column('name', 'string', 'char64')
    );
    const typeId: string = await recordType.create(db);
    await db.create_table('my_table', typeId, {});
    return typeId;
}

async function kifs(): Promise<void> {
    const files = new FileHandler(db);
    await files.upload('/local/data.csv', '/kifs_dir/');
    const [encoded]: string[] = await files.download('/kifs_dir/data.csv');
    console.log(encoded.length);
}

/** A custom transport, to route requests or instrument them. */
class LoggingTransport implements HttpTransport {
    constructor(private readonly inner: HttpTransport) {}

    async request(request: HttpRequestOptions): Promise<HttpResponse> {
        const started = Date.now();
        const response = await this.inner.request(request);
        console.log(`${request.method} ${request.url} -> ${response.status}`
            + ` in ${Date.now() - started}ms`);
        return response;
    }
}

async function errors(): Promise<void> {
    try {
        await db.get_records('no_such_table', 0, 10, {});
    } catch (error) {
        // The server's own message, unwrapped from the response envelope
        console.error((error as Error).message);
    }
}

export { readRecords, defineTable, kifs, errors, LoggingTransport };
