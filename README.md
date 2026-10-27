<h3 align="center" style="margin:0px">
	<img width="200" src="https://kinetica-web-assets.s3.us-east-1.amazonaws.com/assets/kinetica_logo_gray.svg" alt="Kinetica Logo"/>
</h3>
<h5 align="center" style="margin:0px">
	<a href="https://www.kinetica.com/">Website</a>
	|
	<a href="https://docs.kinetica.com/">Docs</a>
	|
	<a href="https://docs.kinetica.com/content/api/javascript/">JavaScript API Docs</a>
	|
	<a href="https://docs.kinetica.com/content/api/nodejs/">Node.js API Docs</a>
	|
	<a href="https://docs.kinetica.com/content/api/typescript/">TypeScript API Docs</a>
	|
	<a href="https://join.slack.com/t/kinetica-community/shared_invite/zt-1bt9x3mvr-uMKrXlSDXfy3oU~sKi84qg">Community Slack</a>
</h5>


# Kinetica TypeScript API

-  [Overview](#overview)
-  [JavaScript](#javascript)
-  [Node.js](#nodejs)
-  [TypeScript](#typescript)
-  [Requirements](#requirements)
-  [Installation](#installation)
-  [Quick start](#quick-start)
-  [Module loading](#module-loading)
-  [Connecting](#connecting)
-  [Calling endpoints](#calling-endpoints)
-  [Types and tables](#types-and-tables)
-  [Reading data](#reading-data)
-  [Helper methods](#helper-methods)
-  [KIFS files](#kifs-files)
-  [Map images (WMS)](#map-images-wms)
-  [Error handling](#error-handling)
-  [Failover](#failover)
-  [Custom transports](#custom-transports)
-  [Utilities](#utilities)
-  [Migrating from @kinetica/gpudb](#migrating-from-kineticagpudb)
-  [Running the examples](#running-the-examples)
-  [Building](#building)
-  [Project layout](#project-layout)
-  [Known limitations](#known-limitations)
-  [Support](#support)
-  [Contact Us](#contact-us)
 

## Overview

This repository contains the *Kinetica* client-side API for *JavaScript*,
*Node.js* and *TypeScript*, as well as examples of their use. All three are
built from one *TypeScript* source, covering all 216 endpoints of the 7.2.3.9
schema as 432 methods (each endpoint has both a parameter-list and a
request-object form).

At a high level, the difference between them is:

*   The *JavaScript* API's script-tag build allows synchronous calls:
    *   If the user provides a callback, the API will make an asynchronous call.
    *   If the user does not provide a callback, the API will make a
        synchronous call, although doing this is discouraged; pass
        ``sync: false`` to get a promise instead.
*   The *Node.js* API, and the *JavaScript* API built with a bundler, use
    promises:
    *   If the user provides a callback, the API will use it (and make an
        asynchronous call).
    *   If the user does not provide a callback, the API will return a promise
        (also asynchronous).
*   The *TypeScript* API is the same code, with type declarations for every
    request and response.

How to use the API is covered below. The Kinetica documentation can be found
at https://docs.kinetica.com/.

For changes to the client-side API, please refer to
[CHANGELOG.md](CHANGELOG.md).  For
changes to Kinetica functions, please refer to
[CHANGELOG-FUNCTIONS.md](CHANGELOG-FUNCTIONS.md).


## JavaScript

The *JavaScript* API for a web page is a single file in this repository:

* ``<dist/standalone/GPUdb.js>``

Load it with a ``<script>`` tag; it defines a global ``GPUdb``. An application
built with a bundler (webpack, Vite, esbuild) imports the package instead, and
the bundler picks ``dist/browser``. See [Module loading](#module-loading).


## Node.js

The *Node.js* API is published to npm as ``@kinetica/gpudb-api``:

    npm install @kinetica/gpudb-api

In this repository it consists of:

* ``<dist/node>`` (CommonJS, for ``require()``)
* ``<dist/esm>`` (ES modules, for ``import``)

Code written for the former *Node.js* package, ``@kinetica/gpudb``, keeps
working through a compatibility wrapper, in ``<compat>``; see
[Migrating from @kinetica/gpudb](#migrating-from-kineticagpudb).

The example *Node.js* program that demonstrates the API is here:

* ``<examples/esm-example.mjs>``

To run the example, run the following at the command line from the
repository's top directory:

    node examples/esm-example.mjs [<url> [<username> [<password>]]]

Processing will be logged to standard output.

The following are required for using the library:

* ``nodejs`` (16 or later; 18 or later recommended)
* ``npm`` (the *Node.js* package manager)


## TypeScript

The *TypeScript* declarations for every request and response ship with the
package, in ``<dist/types>``, and are picked up automatically when it is
installed.

The example *TypeScript* programs that demonstrate the API are here:

* ``<examples/nodejs-example.ts>``
* ``<examples/esm-typescript-example.mts>`` (typed ES module usage, compiled
  rather than run)

See [Running the examples](#running-the-examples) for how to run them.


## Requirements

- Node.js >= 16 (18+ recommended: the browser transport uses `fetch`)
- TypeScript >= 5 to build from source

## Installation

```bash
npm install @kinetica/gpudb-api
```

The package ships four builds, plus the type declarations:

| Build | Entry | Format | Consumer |
| --- | --- | --- | --- |
| `dist/node` | `require` condition, `main` | CommonJS | Node.js `require()` |
| `dist/esm` | `import` condition, `module` | ES modules | Node.js `import` |
| `dist/browser` | `browser` condition | ES modules | browsers, **via a bundler** |
| `dist/standalone` | — | IIFE, global `GPUdb` | browsers, `<script src>`, synchronous by default |
| `dist/types` | `types` | `.d.ts` | TypeScript |

Existing `@kinetica/gpudb` users need no changes yet — see
[Migrating](#migrating-from-kineticagpudb).


### Which build does what

| | `dist/node` | `dist/browser` | `dist/standalone` |
| --- | --- | --- | --- |
| Loaded by | `require` / `import` | a bundler | `<script src>` |
| Format | CommonJS | ES modules | IIFE, global `GPUdb` |
| Transport | `http`/`https` | `fetch` | `fetch`, or blocking XHR |
| Promises / callbacks | yes | yes | yes |
| Synchronous calls | no | no | **yes, by default** |
| `User-Agent`, `Cookie` | yes | no (browsers forbid) | no (browsers forbid) |
| `FileHandler` local files | yes | no | no |
| Types | via `dist/types` | via `dist/types` | — |

`@kinetica/gpudb` resolves to `dist/node` through the compatibility wrapper;
see [Migrating](#migrating-from-kineticagpudb).

## Quick start

```javascript
const { GPUdb, END_OF_SET } = require('@kinetica/gpudb-api');

const db = new GPUdb('http://localhost:9191', {
    username: 'admin',
    password: 'secret'
});

const props = await db.show_system_properties({});
console.log(props.property_map['version.gpudb_core_version']);

const records = await db.get_records('my_table', 0, END_OF_SET, {});
console.log(records.data);          // [{ id: 1, name: 'Alice' }, ...]
```

## Module loading

### CommonJS (Node.js)

```javascript
const { GPUdb, Type, Column, END_OF_SET } = require('@kinetica/gpudb-api');

// or as a namespace
const kinetica = require('@kinetica/gpudb-api');
const db = new kinetica.GPUdb('http://localhost:9191');
```

Code compiled by Babel or a bundler sees `__esModule`, so an interop default
import resolves to the default export — the `GPUdb` class:

```javascript
import GPUdb from '@kinetica/gpudb-api';   // the class, as in the old package
```

### ES modules (Node.js)

The package declares an `exports` map, so `import` resolves to a real ES
module entry — no `createRequire` shim, in a `.mjs` file or a package with
`"type": "module"`:

```javascript
import { GPUdb, Type, Column, END_OF_SET } from '@kinetica/gpudb-api';

// the default export is the GPUdb class, the shape the old package had
import GPUdb from '@kinetica/gpudb-api';
const db = new GPUdb('http://localhost:9191');

// the whole namespace, if you want it
import * as kinetica from '@kinetica/gpudb-api';
```

The default export is the **same class object** as the named one in every
build — CommonJS, ESM and browser — so `instanceof` holds whichever way a
given file imported it.

That entry re-exports the CommonJS build rather than duplicating it, so a
program that loads the package both ways still has **one** `GPUdb` class:
`instanceof` holds across the boundary and `GPUdb.Type` is the same object.
Shipping two independent bundles would break both.

Both forms are verified against the packed tarball, not just the source tree.

Because the `exports` map is an encapsulation boundary, deep imports such as
`@kinetica/gpudb-api/dist/node/GPUdb.js` no longer resolve. Import the package
name; `@kinetica/gpudb-api/package.json` remains reachable for tooling that
reads it.

### TypeScript

Types resolve automatically through the package's `types` entry. No
`@types/...` package is needed.

```typescript
import { GPUdb, GPUdbOptions, DynamicSchemaData, END_OF_SET } from '@kinetica/gpudb-api';

const options: GPUdbOptions = { username: 'admin', password: 'secret' };
const db = new GPUdb('http://localhost:9191', options);

const sql = await db.execute_sql('SELECT * FROM my_table', 0, 10, '', [], {});
const data: DynamicSchemaData = sql.data;       // always set; no null-guard needed
const elapsed: number | undefined = sql.request_time_secs;
```

Works with `"moduleResolution": "node"`, `"node16"`, or `"bundler"`.

### Browser (bundler)

`dist/browser` is ES module source intended for a bundler — webpack, vite,
rollup, esbuild, or anything else that resolves extensionless imports. Import
by package name and let the bundler pick the build:

```javascript
import { GPUdb } from '@kinetica/gpudb-api';
// or: import GPUdb from '@kinetica/gpudb-api';   -- the same class

const db = new GPUdb('https://kinetica.example.com:9191', {
    oauth_token: token
});
const props = await db.show_system_properties({});
```

The `browser` field in `package.json` does two jobs: it redirects the Node
entry to `dist/browser`, and it maps `http`, `https`, `url`, `fs` and `path` to
`false`. Those Node built-ins are imported by `NodeHttpTransport` and by
`FileHandler`'s filesystem methods, neither of which is reachable in a browser
— but bundlers resolve the imports statically, so without those entries the
build fails with `Could not resolve "http"`.

In the browser, `createTransport()` selects `BrowserHttpTransport` (`fetch`)
automatically, because `process` does not exist.

### Browser (plain `<script>` tag)

Use `dist/standalone/GPUdb.js`: a single file defining a global `GPUdb`, like
the JavaScript API's `GPUdb.js`. It is in the
[kinetica-api-typescript](https://github.com/kineticadb/kinetica-api-typescript)
repository, ready to download, and in the npm package.

```html
<script src="GPUdb.js"></script>
<script>
  var db = new GPUdb('http://localhost:9191');
  db.show_system_properties({}, function (err, data) { console.log(data); });
</script>
```

`dist/browser` cannot be loaded directly by a browser — its relative imports
carry no `.js` extension, which native ES modules require. To bundle it
yourself instead, as an IIFE:

```bash
npx esbuild ./dist/browser/index.js --bundle --format=iife \
    --global-name=GPUdbAPI --platform=browser --outfile=gpudb-api.js
```

```html
<script src="gpudb-api.js"></script>
<script>
  const db = new GPUdbAPI.GPUdb('http://localhost:9191');
  db.show_system_properties({}).then(r => console.log(r.property_map));
</script>
```

This is exactly what `npm run build:tests:browser` produces for the in-browser
test page.

## Connecting

```javascript
// single server
const db = new GPUdb('http://localhost:9191');

// several servers -- see Failover
const ha = new GPUdb([
    'http://host-1:9191',
    'http://host-2:9191',
    'http://host-3:9191'
]);
```

All options:

```javascript
const db = new GPUdb('http://localhost:9191', {
    username: 'admin',            // basic auth
    password: 'secret',
    oauth_token: 'ey...',         // bearer auth; takes precedence over user/pass
    timeout: 30000,               // milliseconds; 0 (default) means no timeout
    job_endpoints: false,         // wrap long ALTERs in /create/job; false (default) = call directly
    job_timeout: 600000,          // ms to poll a job-wrapped endpoint; 0 (default) = no deadline
    max_response_bytes: 67108864, // 0 (default) means no ceiling
    headers: { 'X-Trace-Id': 'abc123' },
    session_id: 'shared-sql-session', // share SQL #temp tables; see Sessions
    transport: myTransport,       // see Custom transports
    client_name: 'my-app',        // prefixes the User-Agent (Node.js)
    client_version: '1.0.0',
    getCookie: () => cookie,      // session affinity (Node.js)
    setCookie: value => { cookie = value; },
    sync: false                   // blocking calls; standalone build only
});
```

Headers can also be managed after construction. `Accept`, `Authorization`,
`Content-Type`, `X-Kinetica-Group` and `X-Kinetica-Session` are protected and
throw if you try to set or remove them:

```javascript
db.addHttpHeader('X-Trace-Id', 'abc123');
db.getHttpHeaders();              // { 'X-Trace-Id': 'abc123' }
db.removeHttpHeader('X-Trace-Id');

// The JavaScript API's spellings work too, unchanged
db.add_http_header('X-Trace-Id', 'abc123');
db.get_http_headers();
db.remove_http_header('X-Trace-Id');

db.url;                           // the server currently at the head of the ring
GPUdb.VERSION;                    // '7.2.3.3'
GPUdb.api_version;                // same value, under the old name
```

### Sessions

Each client is a server session of its own, which the SQL `#name` temp
tables it creates belong to alone. `close()` drops them, and the client
cannot be used afterwards:

```javascript
const db = new GPUdb(url);
await db.execute_sql('CREATE TABLE #scratch AS SELECT * FROM orders', 0, -9999, '', [], {});
// ...
await db.close();                 // drops #scratch; db.is_closed() is now true
```

A client that is never closed has its temp tables dropped when it is garbage
collected, on a best-effort basis; failing that, the server reclaims them.
Against a server without session support nothing is dropped.

To share one session's temp tables among several clients, give each the same
`session_id`. That session is the caller's to drop, with `drop_session()` on
any client given it; neither `close()` nor collection drops it:

```javascript
const a = new GPUdb(url, { session_id: 'shared-sql-session' });
const b = new GPUdb(url, { session_id: 'shared-sql-session' });
// ...
await a.drop_session();           // drops the session's temp tables, for both
```

A session ID may contain only letters, digits and `-`, as a UUID does.

### Identifying your application

Under Node.js the client sends a `User-Agent` naming the API, and
`client_name` / `client_version` prefix it:

```javascript
new GPUdb(url, { client_name: 'my-app', client_version: '1.0.0' });
// User-Agent: my-app/1.0.0 kinetica-api-nodejs/7.2.3.3 (Node.js/22.14.0; linux/6.8.0; x64)
```

Browsers forbid setting `User-Agent`, so it is sent from Node.js only.

### Cookies

For session affinity behind a load balancer, supply a cookie jar. Also
Node.js only — browsers manage cookies themselves and reject the header:

```javascript
let cookie;
const db = new GPUdb(url, {
    getCookie: () => cookie,                 // sent as the Cookie header
    setCookie: value => { cookie = value; }  // receives Set-Cookie
});
```

### Capping the response size

One unbounded `execute_sql` can return more than the process has memory for,
and what follows is an out-of-memory kill rather than an error you can catch.
`max_response_bytes` puts a ceiling on it:

```javascript
const { GPUdb, ResponseTooLargeError } = require('@kinetica/gpudb-api');

const db = new GPUdb(url, { max_response_bytes: 64 * 1024 * 1024 });

try {
    await db.execute_sql('SELECT * FROM enormous', 0, -9999, '', [], {});
} catch (err) {
    if (err instanceof ResponseTooLargeError) {
        console.error(`over ${err.limit} bytes; saw ${err.received}`);
    }
}
```

The read is abandoned as soon as the body passes the limit — the payload is
not buffered and then measured — so the memory the guard is there to protect
is never committed. `err.received` is a lower bound on the true size, unless
it came from a `Content-Length` header.

The request is **not** retried against another URL. An oversized result
follows from the query, not from the node that served it, so failing over
would run the same expensive query against every server in the ring. Ordinary
transport failures still fail over as usual.

Default is `0`, meaning no ceiling. Two caveats: a custom transport has to
honour `maxResponseBytes` on `HttpRequestOptions` itself, and in the
standalone build's synchronous mode the browser has already buffered the whole
body before the client sees it, so the limit is reported rather than enforced.

### Binary (Avro) encoding

By default requests and responses travel as JSON. `encoding: 'binary'`
switches to Avro, the encoding the Java and Python APIs use:

```javascript
const db = new GPUdb(url, { encoding: 'binary' });

await db.insert_records('readings', [
    { id: 1, sensor: 'a', value: 21.5 },
    { id: 2, sensor: 'b', value: null },
], {});

const { data } = await db.get_records('readings', 0, 1000, {});
```

Payloads are smaller and quicker to encode and decode. The gain is largest
when inserting and reading records: on 200,000 six-column records, the Avro
payload is about a third the size of the JSON one, and encoding and decoding
are faster than `JSON.stringify`/`JSON.parse`. Call sites do not change, but
a few things behave differently:

- **Inserts need the table's type.** `insert_records` and `update_records`
  encode records with it. The client looks it up with `show_table` on the first
  insert into each table and caches it. A failed insert drops the cached entry,
  and after altering a table's columns, `db.clear_type_cache('readings')` (or
  `clear_type_cache()` for every table) makes the next insert look it up again.
- **Values must match their columns.** A number given for a string column, or a
  record missing a non-nullable column, is rejected with an `AvroError`
  before anything is sent. `err.path` names the field. A nullable column may be
  left out and is sent as null. Floats and doubles also accept Kinetica's
  `'Infinity'`, `'-Infinity'` and `'NaN'` strings.
- **Longs beyond 2^53 decode to `bigint`.** A JSON client gets a rounded number
  for these. Smaller longs stay `number`. Note that `JSON.stringify` throws on a
  `bigint`.
- **Infinity and NaN decode as numbers.** JSON returns them as the quoted
  strings described under [Infinity and NaN](#infinity-and-nan).
  `force_infinity_nan_conversion_to_null` turns them into null under either
  encoding.
- **Column-major results are Avro too.** `execute_sql`, `aggregate_group_by`,
  `aggregate_unique`, `aggregate_unpivot` and `get_records_by_column` decode
  into the same [`DynamicSchemaData`](#column-major--a-dynamic-schema) shape
  JSON gives, with the same exactness for longs.
- **Some endpoints stay JSON.** Those listed in `JSON_ONLY_ENDPOINTS` carry
  file contents, job payloads or images that the JSON API passes as strings:
  KIFS transfers, jobs, procs and visualization. The records of
  `get_records_by_series` and `get_records_from_collection` are still JSON,
  sent inside the Avro envelope.

`AvroType` and `AvroError` are exported for working with Avro data directly,
for instance a table's `type_schema`:

```javascript
const { AvroType } = require('@kinetica/gpudb-api');

const type = AvroType.forSchema(showTableResponse.type_schemas[0]);
const bytes = type.encode({ id: 1, sensor: 'a', value: 21.5 });
type.decode(bytes);
```

#### The codec has no dependencies

The Avro codec (`src/avro.ts`) is part of this package and needs nothing
else at runtime. [avsc](https://github.com/mtth/avsc), an independent Avro
implementation, is used only during development, to check that both codecs
produce the same bytes. It is a `devDependency`, so npm does not install it
for this package's users, and it is never built into `dist/`.

### Running long ALTERs as a job

A slow `alter_table` can outlast the idle timeout of a proxy sitting in front
of Kinetica. `job_endpoints` submits those calls through `/create/job` and
polls `/get/job` instead, so the HTTP request stays short:

```javascript
const db = new GPUdb(url, { job_endpoints: true, job_timeout: 10 * 60 * 1000 });
```

**It is off by default.** Wrapping only helps where such a proxy exists — a
client talking to Kinetica directly pays two extra round trips, and the poll
interval is 5 s, so an ALTER finishing in milliseconds either costs one extra
request or waits out a full interval. Neither the JavaScript nor the Python API
wraps these endpoints, so leaving it on by default would also diverge silently
from every other Kinetica API.

`true` uses `GPUdb.DEFAULT_JOB_ENDPOINTS` — `/alter/table` and
`/alter/table/columns`. Pass an array to choose your own, including endpoints
beyond that set:

```javascript
GPUdb.DEFAULT_JOB_ENDPOINTS;                                  // the default two
new GPUdb(url, { job_endpoints: ['/alter/table'] });          // just one
new GPUdb(url, { job_endpoints: [...GPUdb.DEFAULT_JOB_ENDPOINTS, '/other'] });
```

The call returns the same response either way — `submitJobRequest` unwraps
`job_response_str`, which is the endpoint's own response. Two differences are
worth knowing: a failed ALTER arrives as `Error during job execution: …` rather
than the bare server message, and `request_time_secs` is not attached on the
job path.

### Bounding a job-wrapped endpoint

`timeout` bounds each poll, not the loop, so a job that never finishes is
waited on indefinitely. `job_timeout` puts a deadline on the whole thing —
set it whenever you set `job_endpoints`:

```javascript
const db = new GPUdb(url, { job_endpoints: true, job_timeout: 10 * 60 * 1000 });

try {
    await db.alter_table('t', 'add_column', 'c', { column_type: 'int' });
} catch (err) {
    // "Job 42 for /alter/table did not finish within 600000 ms and is still
    //  running on the server."
}
```

It defaults to `0`, meaning no deadline, and is separate from `timeout` on
purpose: outlasting a per-request timeout is the reason to job-wrap an endpoint
at all, so inheriting it would defeat the feature. Giving up does not cancel
the job — the server keeps running it.

## Calling endpoints

Every endpoint has two forms.

**Parameter list** — the common case:

```javascript
const response = await db.get_records('my_table', 0, END_OF_SET, {});
```

**Request object** — same endpoint, one object argument, method suffixed
`_request`:

```javascript
const response = await db.get_records_request({
    table_name: 'my_table',
    offset: 0,
    limit: END_OF_SET,
    options: {}
});
```

Both forms accept an optional trailing callback instead of returning a promise:

```javascript
db.show_system_properties({}, (err, response) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log(response.property_map);
});
```

> **Argument order gotcha.** Parameters with schema defaults are moved to the
> end of the parameter list and made optional, so the order does **not** always
> match the underlying request object. `filter` is the one that catches people
> out:
>
> ```javascript
> // signature: filter(table_name, expression, view_name?, options?)
> await db.filter('my_table', 'value > 200', '', {});
> ```
>
> Passing the view name second — the order used by the JavaScript API — makes
> the server reject the expression as a table name. When in doubt, use the
> `_request` form, whose keys are unambiguous.

Signatures of commonly used endpoints:

```typescript
get_records(table_name, offset?, limit?, options?, callback?)
get_records_by_series(table_name, world_table_name, offset?, limit?, options?, callback?)
insert_records(table_name, data, options?, callback?)
execute_sql(statement, offset?, limit?, request_schema_str?, data?, options?, callback?)
aggregate_group_by(table_name, column_names, offset?, limit?, options?, callback?)
aggregate_unique(table_name, column_name, offset?, limit?, options?, callback?)
filter(table_name, expression, view_name?, options?, callback?)
create_table(table_name, type_id, options?, callback?)
create_type(type_definition, label, properties?, options?, callback?)
show_table(table_name, options?, callback?)
show_types(type_id, label, options?, callback?)
clear_table(table_name?, authorization?, options?, callback?)
```

## Types and tables

```javascript
const { GPUdb, Type, Column } = require('@kinetica/gpudb-api');

const myType = new Type('my_label',
    new Column('id', 'int', 'primary_key'),
    new Column('name', 'string', 'char64'),
    new Column('value', 'double'),
    new Column('note', 'string', 'nullable')
);

const typeId = await myType.create(db);
await db.create_table('my_table', typeId, {});

await db.insert_records('my_table', [
    { id: 1, name: 'Alice', value: 100.5, note: null },
    { id: 2, name: 'Bob',   value: 200.3, note: 'vip' }
], { return_record_ids: 'true' });
```

Reading type metadata back:

```javascript
const fromTable = await Type.fromTable(db, 'my_table');
const fromType  = await Type.fromType(db, typeId);

fromTable.label;                        // 'my_label'
fromTable.columns.map(c => c.name);     // ['id', 'name', 'value', 'note']
fromTable.columns[3].isNullable();      // true
fromTable.generateSchema();             // Avro record schema
```

`Column` is also reachable as `Type.Column`, matching the JavaScript API.

## Reading data

Responses that carry records decode into a `data` property, **but the shape
depends on the endpoint**. Getting this wrong is the most common mistake.

### Row-major — an array of records

`get_records` and `get_records_from_collection` decode `records_json` into an
array of objects:

```javascript
const response = await db.get_records('my_table', 0, END_OF_SET, {});

for (const record of response.data) {
    console.log(record.id, record.name);
}
```

### Column-major — a dynamic schema

`execute_sql`, `aggregate_group_by`, `aggregate_unique`, `aggregate_unpivot`
and `get_records_by_column` return a **single column-major object**, typed as
`DynamicSchemaData` — not an array:

```javascript
const response = await db.execute_sql(
    'SELECT category, COUNT(*) AS n FROM my_table GROUP BY category',
    0, 100, '', [], {}
);

response.data.column_headers;    // ['category', 'n']
response.data.column_1;          // ['A', 'B']        values for column_headers[0]
response.data.column_2;          // [3, 2]            values for column_headers[1]
response.data.column_datatypes;  // ['string', 'long']
```

Under [binary encoding](#binary-avro-encoding) the shape is the same, except
that a long beyond 2^53 is an exact `bigint` where JSON gives a rounded
number.

To iterate rows, zip the columns against the headers:

```javascript
function toRows(data) {
    if (!data || !Array.isArray(data.column_headers)) return [];
    const headers = data.column_headers;
    const columns = headers.map((_, i) => data[`column_${i + 1}`] ?? []);
    const rowCount = columns.length ? columns[0].length : 0;

    const rows = [];
    for (let i = 0; i < rowCount; i++) {
        const row = {};
        headers.forEach((header, col) => { row[header] = columns[col][i]; });
        rows.push(row);
    }
    return rows;
}

toRows(response.data);      // [{ category: 'A', n: 3 }, { category: 'B', n: 2 }]
```

`examples/nodejs-example.ts` contains a typed version of this helper.

### Series — an array per track

`get_records_by_series` returns one array of records per series:

```javascript
const response = await db.get_records_by_series('track_table', '', 0, 10, {});

response.data.length;          // number of series
response.data[0];              // [{ TRACKID: 'track_a', x: 1, y: 2 }, ...]
```

## Helper methods

Four hand-written conveniences beyond the generated endpoints, ported from the
JavaScript API.

### `SqlIterator` — page through a large result set

An async generator that fetches in batches, so a query larger than memory can
be consumed a record at a time. Server-side paging tables are dropped when
iteration ends, **including when you break out early**.

```javascript
for await (const row of db.SqlIterator('SELECT * FROM big_table', 10000, {})) {
    console.log(row.id, row.name);
    if (done) break;                 // paging tables still get cleaned up
}
```

Records are yielded as objects keyed by column name. This differs from the
JavaScript API, which yields positional arrays — use `Object.values(row)` if
you need those.

### `get_geo_json` — read a table as GeoJSON

```javascript
const geo = await db.get_geo_json('shapes', 0, 100, {});
geo.type;              // 'FeatureCollection'
geo.features;          // [{ type: 'Feature', geometry: {...}, ... }, ...]
```

Wraps `/get/records` with `encoding: 'geojson'` and unwraps the single encoded
document the server returns.

### `insert_records_from_json` — insert without declaring a type

Takes a record, an array of records, or a JSON string holding either. The table
is created from the data if the options ask for it.

```javascript
await db.insert_records_from_json(
    [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    'my_table',
    {},          // create_table_options
    {}           // options
);

// a JSON string works too
await db.insert_records_from_json('[{"id":3,"name":"Charlie"}]', 'my_table', {}, {});
```

### `get_records_json` — read records as JSON

Only `table_name` is required; the rest narrow the query.

```javascript
const response = await db.get_records_json(
    'my_table',
    ['id', 'name'],      // columns; null for all
    0,                   // offset
    100,                 // limit; negative means END_OF_SET
    'value > 200',       // expression
    ['id'],              // order by
    null                 // having
);

response.records;                   // [{ id: 2, name: 'Bob' }, ...]
response.total_number_of_records;   // matches ignoring the limit
response.has_more_records;          // false
```

Without an `order_by`, record order is not guaranteed.

## KIFS files

`FileHandler` provides KIFS access. The JavaScript API ships two versions of it
-- one for Node, one for the browser; here it is a single class carrying both
sets of behaviour, including the browser version's progress reporting and
automatic chunking. Uploads and downloads work in both environments, while the
two methods that touch the local filesystem are Node-only and say so if called
elsewhere.

```javascript
const { GPUdb, FileHandler } = require('@kinetica/gpudb-api');

const db = new GPUdb('http://localhost:9191', { username: 'admin', password: 'secret' });
const files = new FileHandler(db);          // also GPUdb.FileHandler, as in the JS API
```

### Upload

```javascript
// local paths (Node.js)
await files.upload('/local/data.csv', '/kifs_dir/');
await files.upload(['/local/a.csv', '/local/b.csv'], '/kifs_dir/');

// Blob or File objects (any environment)
await files.upload(inputElement.files[0], '/kifs_dir/');

// full signature, matching the JavaScript API
await files.upload(bigFile, '/kifs_dir/', {},
    percent => console.log(`${percent.toFixed(1)}%`),   // progress
    (err, ok) => { /* completion */ });                 // optional callback
```

Contents are read as **binary**, so images, archives and other non-text files
survive the round trip -- the JavaScript API reads as UTF-8 and corrupts them.
A batch is sent in a single request, and the promise resolves once.

Anything larger than `files.chunkSize` is sent as a chunked multipart upload
instead, exactly as the JavaScript API did, and `progress_callback` reports
that portion of the work as a percentage from 0 to 100. When several files in
one call need chunking the percentage spans the whole set rather than
restarting per file.

`chunkSize` defaults to **60 MB**, the JavaScript API's value, and is writable
there and here alike, so code that sets its own threshold carries over
unchanged:

```javascript
files.chunkSize = 16 * 1024 * 1024;
```

### Chunked upload, with progress

`upload` reaches for this on its own past `chunkSize`; call it directly to
chunk a file regardless of size, or to choose a chunk size for one upload.
It splits the file and sends each chunk in order. If a chunk fails, the upload
is cancelled server-side before the error is rethrown, so no partial file is
left behind.

```javascript
const uuid = await files.upload_multipart(
    bigFile,                 // Blob/File, or a local path under Node.js
    '/kifs_dir/',
    8 * 1024 * 1024,         // chunk size in bytes; default 8 MB
    {},
    percent => console.log(`${percent.toFixed(1)}%`)
);
```

### Download

```javascript
// base64-encoded contents, in request order
const [encoded] = await files.download('/kifs_dir/data.csv');
const text = Buffer.from(encoded, 'base64').toString();      // Node
const bytes = atob(encoded);                                 // browser

// write straight to disk (Node.js only); the directory is created if needed
const written = await files.download_and_save(
    ['/kifs_dir/a.csv', '/kifs_dir/b.csv'], '/local/dir');
```

Calling `download_and_save` from a browser build throws an explanatory error
rather than failing obscurely.

### Path helpers

```javascript
files.parse_dir_destination('dir');            // '/dir/'  -- adds both slashes
FileHandler.extract_filename('/a/b/c.csv');    // 'c.csv'
files.parse_options({ custom: 'x' }, 'upload'); // { custom: 'x', file_encoding: 'base64' }
```

`parse_options` keeps the options you pass. The JavaScript API discards them.

## Map images (WMS)

`wms_request` returns the raw image bytes rather than JSON, failing over
across URLs like any other call. The server's reported render time is attached
as `request_time_secs`, matching the JavaScript API.

```javascript
const image = await db.wms_request({
    request: 'GetMap',
    version: '1.3.0',
    layers: 'my_table',
    styles: 'raster',
    bbox: '-180,-90,180,90',
    srs: 'plate_carree',      // Kinetica expects this, not crs=EPSG:4326
    width: 512,
    height: 512,
    format: 'image/png'
});

fs.writeFileSync('map.png', image);            // Node.js
img.src = URL.createObjectURL(new Blob([image], { type: 'image/png' }));  // browser
```

The layer needs renderable geometry — x/y columns or a `GEOMETRY` column.

### The return is typed `Uint8Array`, and is a `Buffer` under Node

The declared type is `Uint8Array`, so that one source tree serves the browser
too. Under Node the value you actually get is a `Buffer` — a `Uint8Array`
subclass — exactly as the JavaScript API returned, so `Buffer` methods and the
UTF-8 decode in `toString()` work without a wrapper:

```javascript
const image = await db.wms_request(params);
image.toString('utf8', 0, 5);        // '<?xml' -- Node.js
```

In the browser it is a plain `Uint8Array`. `fs.writeFileSync` and `Blob` accept
either unchanged, but the `Buffer` methods are not there, and
`Uint8Array.prototype.toString()` ignores its argument and joins the bytes as
`"60,63,120,..."` — so a check like
`image.toString('utf8').startsWith('<?xml')` fails *silently* rather than
throwing. For code that has to read the bytes as text in both environments,
decode explicitly:

```javascript
const text = new TextDecoder().decode(await db.wms_request(params));
```

### WMS errors arrive in the body

Kinetica reports a bad GetMap with an XML `ServiceExceptionReport`, the same
way the JSON endpoints report errors through the response envelope. Which
status carries it depends on the build — 7.2.3 sends HTTP 200, others send
HTTP 400. Those bytes are handed back rather than thrown away, so the message
is yours to read.

A non-200 body is only treated this way when its content type says XML
(`application/vnd.ogc.se_xml`, which is what the OGC specifies, or a generic
`text/xml` / `application/xml`). A reverse proxy or gateway returning HTML
under the same status is a transport failure and fails over, rather than being
handed back as an image that no longer renders.

```javascript
const image = await db.wms_request(params);
const text = new TextDecoder().decode(image);     // works in both environments

if (text.startsWith('<?xml')) {
    const match = text.match(/<ServiceException>(.*?)<\/ServiceException>/s);
    throw new Error(match?.[1] ?? 'WMS service exception');
}
```

### Infinity and NaN

Kinetica returns those values as the quoted strings `"Infinity"`, `"-Infinity"`
and `"NaN"`, so a `double` column holding one decodes to a JavaScript string
rather than a number:

```javascript
const response = await db.execute_sql_request({ statement: "SELECT CAST('Infinity' AS DOUBLE) AS v" });
response.data.column_1;                    // ['Infinity']
```

Pass `force_infinity_nan_conversion_to_null` to get `null` instead. It is off
by default because the conversion walks every key and value of the payload:

```javascript
const db = new GPUdb(url, { username, password, force_infinity_nan_conversion_to_null: true });
response.data.column_1;                    // [null]

db.force_infinity_nan_conversion_to_null = false;   // settable after construction too
```

This matches the JavaScript API's property of the same name.

## Error handling

Kinetica reports its own errors inside a response envelope, which the client
unwraps. A failed call rejects with the **server's message**:

```javascript
try {
    await db.get_records('no_such_table', 0, 10, {});
} catch (err) {
    console.error(err.message);
    // Table does not exist: ki_home.no_such_table (TM/SMc:7588)
}
```

Transport failures — connection refused, timeouts, unexpected HTTP status —
reject too, but the wording is platform-specific. Node's transport passes the
socket error through (`ECONNREFUSED`), while `fetch` rejects with
`TypeError: fetch failed` (`Failed to fetch` in browsers) and puts the cause in
`err.cause`. Match on both if you need to tell them apart:

```javascript
const TRANSPORT_ERROR = /ECONNREFUSED|Request failed|timeout|fetch failed|Failed to fetch/i;
```

## Failover

When constructed with several URLs, the client keeps them in a ring and starts
at a random index, spreading load across the cluster. A request that fails at
the **transport** level is retried against the next URL until every URL has
been tried; only then does it reject.

Errors reported by the server itself do **not** trigger failover — a missing
table is a real answer, not a reason to try another node.

```javascript
const db = new GPUdb([
    'http://host-1:9191',
    'http://host-2:9191',
    'http://host-3:9191'
], { username: 'admin', password: 'secret' });

// transparently uses whichever host answers
await db.show_system_properties({});
```

## Custom transports

Supply a `transport` to route requests through a proxy, add instrumentation,
or stub the network in tests:

```typescript
import {
    GPUdb, HttpTransport, HttpRequestOptions, HttpResponse, NodeHttpTransport
} from '@kinetica/gpudb-api';

class LoggingTransport implements HttpTransport {
    async request(options: HttpRequestOptions): Promise<HttpResponse> {
        console.log(options.method, options.url);
        const start = Date.now();
        const response = await new NodeHttpTransport().request(options);
        console.log(`  ${response.status} in ${Date.now() - start}ms`);
        return response;
    }
}

const db = new GPUdb('http://localhost:9191', { transport: new LoggingTransport() });
```

`BrowserHttpTransport` (fetch) and `NodeHttpTransport` (http/https) are both
exported, so either can be forced regardless of environment — useful for
exercising the fetch path under Node.

A transport that delegates, like the one above, inherits everything the client
puts on `HttpRequestOptions`. One that does its own I/O must send
`options.bytes` when it is set. A client using binary encoding puts its Avro
request body there instead of in `options.body`, and asks for
`responseType: 'binary'`, expecting the reply in `bytes`. One that reads the network itself owns
`options.maxResponseBytes`: nothing above it enforces the ceiling, so a
transport that ignores the field silently drops the guard. Reject with
`ResponseTooLargeError` when the body passes it — the client treats that type
as fatal rather than failing over.

### Testing without a server

A stub transport lets a suite drive the client end to end — decoding, auth
headers, timeouts, failover, error shapes — with no Kinetica running. Return
whatever the server would have sent:

```typescript
const calls: HttpRequestOptions[] = [];

const stub: HttpTransport = {
    async request(options) {
        calls.push(options);
        return {
            status: 200, statusText: 'OK', headers: {},
            body: JSON.stringify({
                status: 'OK',
                data_str: JSON.stringify({
                    count_affected: 0, has_more_records: false, paging_table: '',
                    response_schema_str: '', binary_encoded_response: '',
                    total_number_of_records: 2, info: {},
                    json_encoded_response: JSON.stringify({
                        column_headers: ['id'], column_datatypes: ['int'], column_1: [1, 2],
                    }),
                }),
            }),
        };
    },
};

const db = new GPUdb('http://stub:9191', { username: 'u', password: 'p', transport: stub });
const response = await db.execute_sql_request({ statement: 'SELECT id FROM t' });

response.data.column_1;                  // [1, 2]
calls[0].headers['Authorization'];       // 'Basic dTpw'
```

For WMS, set `bytes` on the response instead of `body`.

## Utilities

```javascript
const {
    encode, decode, decodeRegular, decodeNoInfNan,
    base64Encode, base64Decode, RingList, END_OF_SET
} = require('@kinetica/gpudb-api');

// Also reachable as statics, as in the JavaScript API:
// GPUdb.encode, GPUdb.decode, GPUdb.decode_regular, GPUdb.decode_no_inf_nan,
// GPUdb.Type, GPUdb.RingList, GPUdb.FileHandler, GPUdb.END_OF_SET

encode({ a: 1 });                  // '{"a":1}'      (arrays map element-wise)
decode('{"a":1}');                 // { a: 1 }       (throws on invalid JSON)
decodeRegular('{"a":1}');          // { a: 1 }       (throws on invalid JSON)
decodeNoInfNan('{"a":"NaN"}');     // { a: null }    ("Infinity"/"NaN" -> null)
base64Encode('admin:secret');      // works in Node and the browser
END_OF_SET;                        // -9999, "all records" for limit arguments

const ring = new RingList(['a', 'b', 'c'], 0);
ring.getCurrentItem();             // 'a'
ring.next();                       // 'b'
ring.size();                       // 3
```

## Migrating from @kinetica/gpudb

This package replaces `@kinetica/gpudb` (the `gpudb-api-javascript` repo). For
a transition period the old entry points keep working, so existing code needs
no changes.

### Node.js — no change required

`@kinetica/gpudb` is now a thin wrapper that re-exports this package in the old
shape, where the module **is** the constructor:

```javascript
const GPUdb = require('@kinetica/gpudb');       // unchanged
const db = new GPUdb('http://localhost:9191', { username: 'admin' });
```

Everything the old API hung off the constructor is still there:
`GPUdb.Type` (and `GPUdb.Type.Column`), `GPUdb.RingList`, `GPUdb.FileHandler`,
`GPUdb.encode` / `decode` / `decode_regular` / `decode_no_inf_nan`,
`GPUdb.END_OF_SET`, `GPUdb.api_version`.

When you are ready, switch to this package directly. Both forms give the same
class, so the constructor-shaped import survives the move:

```javascript
const { GPUdb, Type, Column } = require('@kinetica/gpudb-api');

import GPUdb from '@kinetica/gpudb-api';        // default export, as before
```

### Browser — change the script path

The old build was a single file exposing a global `GPUdb`. So is
`dist/standalone/GPUdb.js`:

```html
<script src="node_modules/@kinetica/gpudb-api/dist/standalone/GPUdb.js"></script>
<script>
  var db = new GPUdb('http://localhost:9191');
  db.show_system_properties({}, function (err, data) { console.log(data); });
</script>
```

Download it from the
[kinetica-api-typescript](https://github.com/kineticadb/kinetica-api-typescript)
repository, or build it with `npm run build:standalone`. Bundler users should import
the package by name instead and let the `browser` field select the build.

### Synchronous calls still work in the standalone build

The old browser build returned data directly when no callback was given, and
`dist/standalone/GPUdb.js` keeps that behaviour — it defaults to `sync: true`,
falling back to a blocking `XMLHttpRequest` where `fetch` has no synchronous
mode. All three styles work off the same method:

```javascript
var response = db.show_table('my_table', {});          // returns the value
const response = await db.show_table('my_table', {});  // await of a value works
db.show_table('my_table', {}, function (err, response) { ... });
```

Errors throw where a value would have been returned, exactly as before.
Passing a callback keeps the request off the blocking path.

**Treat this as a migration aid.** Synchronous requests block the UI thread
and browsers have deprecated them. New code should use promises or callbacks,
and bundler users get the asynchronous build by default. To opt out
explicitly:

```javascript
var db = new GPUdb(url, { sync: false });
```

The current server's address is still `url`, `protocol`, `hostname`, `port`
and `pathname`, but `url` now includes the server URL's path, if it has one
(`https://proxy/gpudb-0` rather than `https://proxy`).

Three things have no equivalent: `GPUdb.ConnectionToken`, an internal helper
of the old Node transport; the public `urls` list of them; and synchronous
forms of the helper methods
(`get_geo_json`, `insert_records_from_json`, `get_records_json`) and
`FileHandler`, which return promises in every build.

### Delete your hand-written type shim

The old package shipped no types, so many projects carry a local
`declare module '@kinetica/gpudb' { ... }`. TypeScript prefers that ambient
declaration over the types this package ships — **with no error and no
warning** — so the project keeps compiling against stale hand-written types
indefinitely. Delete the shim as part of the upgrade.

### One behaviour change to check for

`wms_request` is now typed `Uint8Array` where the old API's type was a Node
`Buffer` — see [Map images (WMS)](#map-images-wms). Under Node the value is
still a `Buffer`, so existing code keeps working; TypeScript callers that
declared the result as `Buffer` need the type widened, or a cast.

## Running the examples

Three, one per way of consuming the package. All default to
`http://localhost:9191` with no credentials, and each creates and drops its
own table.

### TypeScript

`examples/nodejs-example.ts` walks through system properties, type and table
creation, inserts, reads, SQL, filtering, aggregation and cleanup.

```bash
npx ts-node examples/nodejs-example.ts [url] [username] [password]

# for example
npx ts-node examples/nodejs-example.ts http://localhost:9191 admin secret
```

### ES modules

`examples/esm-example.mjs` covers the same ground in plain ESM JavaScript,
plus top-level `await` and `for await` over `SqlIterator`:

```bash
npm run build                 # dist/esm is what the example imports
node examples/esm-example.mjs http://localhost:9191 admin secret
```

It imports the built entry point so it runs from a checkout; in your own
project the import is just the package name. It also asserts that the named
and default imports are the same objects — the single-instance property the
wrapper exists to preserve.

### TypeScript with ES modules

`examples/esm-typescript-example.mts` is compiled rather than run, and shows
typed ESM usage under `nodenext` — the resolution mode that needs
per-condition declarations:

```bash
npm run build                 # the example imports dist/esm
npx tsc --noEmit --strict --target ES2022 --lib ES2022,DOM --types node \
    --module nodenext --moduleResolution nodenext \
    examples/esm-typescript-example.mts
```

## Building

`dist/` already holds the built API. To rebuild it from `src/`:

```bash
npm ci                   # the build tools; package-lock.json pins them
npm run build            # dist/node, dist/types, dist/browser and dist/esm
npm run build:node       # dist/node (CommonJS) + dist/types (declarations)
npm run build:browser    # dist/browser (ES modules, for bundlers)
npm run build:esm        # dist/esm (the import condition; copies src/esm)
npm run build:standalone # dist/standalone/GPUdb.js (script tag, global GPUdb)
npm run clean            # remove dist/
```

## Project layout

```
src/                    the client's TypeScript source; (gen) = generated
                        from Kinetica's endpoint schemas
  GPUdb.ts        (gen) 216 endpoints, the helpers, FileHandler
  types.ts        (gen) request/response interfaces, DynamicSchemaData
  schemas.ts      (gen) Avro schema of every endpoint's request and response
  transport.ts          HttpTransport, browser (fetch) and Node implementations
  utils.ts              Type, Column, RingList, encode/decode, base64
  avro.ts               AvroType and AvroError
  index.ts              the public exports (the package entry point)
  standalone.ts         the script-tag bundle's entry; defaults to sync
  esm/index.mjs         ES module entry; re-exports dist/node, copied to dist/
  esm/index.d.mts       its declarations, for the import condition
dist/                   the built API
  node/                 CommonJS, for require()
  esm/                  ES modules, for import
  browser/              ES modules, for bundlers
  standalone/GPUdb.js   one file for a <script> tag, global GPUdb
  types/                type declarations
examples/
  nodejs-example.ts             end-to-end walkthrough (TypeScript)
  esm-example.mjs               the same, in ES modules
  esm-typescript-example.mts    typed ESM usage; compiled, not run
compat/                 the @kinetica/gpudb wrapper package, published
                        separately so existing require() callers keep
                        working
scripts/                build helpers (copy-esm.js)
```

## Known limitations

- **`dist/browser` requires a bundler.** It is emitted with
  `"moduleResolution": "bundler"`, so its relative imports have no `.js`
  extension and no browser or Node ESM loader can resolve them directly. Bundle
  it, or use the IIFE recipe above.
- **Binary encoding leaves some record data as JSON.** Under
  `encoding: 'binary'`, `get_records_by_series` and
  `get_records_from_collection` still return their records as JSON, and
  `JSON_ONLY_ENDPOINTS` go entirely as JSON. Snappy compression is not
  supported.


## Support

For bugs, please submit an
[issue on Github](https://github.com/kineticadb/kinetica-api-typescript/issues).

For support, you can post on
[stackoverflow](https://stackoverflow.com/questions/tagged/kinetica) under the
``kinetica`` tag or
[Slack](https://join.slack.com/t/kinetica-community/shared_invite/zt-1bt9x3mvr-uMKrXlSDXfy3oU~sKi84qg).


## Contact Us

* Ask a question on Slack:
  [Slack](https://join.slack.com/t/kinetica-community/shared_invite/zt-1bt9x3mvr-uMKrXlSDXfy3oU~sKi84qg)
* Follow on GitHub:
  [Follow @kineticadb](https://github.com/kineticadb)
* Email us:  <support@kinetica.com>
* Visit:  <https://www.kinetica.com/contact/>
