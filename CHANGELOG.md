# Kinetica JavaScript, Node.js, and TypeScript API Changelog

## Version 7.2

### Version 7.2.3.4 - 2026-10-27

#### Added
-   Support for SQL session temp tables.

#### Fixed
-   Issue handling non-ASCII passwords.

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.2.3.3 - 2026-10-18

Adds the TypeScript API, which builds the JavaScript and Node.js APIs from a
single typed source. The three components are published together and share
this version.

#### Added

##### TypeScript API
-   Initial release. A typed, promise-based client covering all 216 endpoints,
    each callable as a parameter list or as a request object, with an optional
    callback. Type declarations for every request and response ship with it.
-   Published as CommonJS, as ES modules, and as a standalone script-tag build
    defining a global `GPUdb`. The `GPUdb` class is the default export of each,
    and is the same class object across them.
-   `SqlIterator`, for paging through a large result set with `for await`.
-   `max_response_bytes`, a ceiling on the size of a response body, raising a
    `ResponseTooLargeError` carrying `limit` and `received`. `0`, the default,
    means no ceiling. An oversized result is not retried against another
    cluster: it follows from the query rather than from the cluster that ran
    it.
-   `request_time_secs` on every response, when the server reports it. The
    JavaScript API exposed this on WMS requests only.
-   A pluggable transport, so requests can be routed through a proxy,
    instrumented, or stubbed in tests.
-   `FileHandler` chunks uploads larger than `chunkSize` (60 MB by default,
    and writable) and reports progress weighted by size across a batch.
-   `encoding: 'binary'` constructor option (also `GPUdb.ENCODING.BINARY`),
    sending requests and receiving responses as Avro. JSON stays the default.
    Results come back in the same shapes as with JSON, except that longs
    beyond 2^53 are `bigint` rather than losing precision, so code mixing
    them with numbers must convert. After altering a table's columns, call
    `clear_type_cache`, or the next insert into that table fails once.
    Endpoints carrying files, job payloads or images (`JSON_ONLY_ENDPOINTS`)
    stay JSON.
-   `AvroType` and `AvroError`, a dependency-free Avro binary codec, exported
    for working with Avro data directly.
-   `HttpRequestOptions.bytes`, carrying a binary request body. A custom
    transport serving a binary-encoding client must send it.

##### JavaScript, Node.js, & TypeScript APIs
-   `ha_failover_order` constructor option controlling the order in which
    clusters are selected from the supplied URL list, for both the initial
    cluster and the cluster chosen on failover. Values are `"sequential"`
    (default) and `"random"`; also exposed as
    `GPUdb.HA_FAILOVER_ORDER.{SEQUENTIAL,RANDOM}`.
-   Content-aware failover (always on): in addition to transport-level
    failures, the API now fails over to another cluster on recoverable server
    responses -- HTTP 500/504, an empty response body, or a non-OK response
    whose message matches `GPUdb.FAILOVER_TRIGGER_MESSAGES` (e.g.
    `Unavailable: Draining HA queue`, `System shutting down`). Normal
    application errors are still returned to the caller. No effect for
    single-URL clients (nowhere to fail over to).

#### Fixed

##### Node.js API
-   `GPUdb.encode` no longer converts numeric record values to strings. A
    blanket number-to-string conversion had been added for `decimal` support
    but was reverted in the JavaScript build (commit 362a142) without the
    matching revert in the Node.js build, causing inserts to be rejected by the
    server (e.g. `field: 'i': expected number`) and leaving tables empty.
    Node.js encoding now matches the JavaScript build (plain `JSON.stringify`);
    pass `decimal` values as strings to preserve full precision.

#### Changed

##### JavaScript, Node.js & TypeScript APIs
-   The initial cluster is now selected per `ha_failover_order` (default
    `"sequential"`, i.e. the first supplied URL) instead of always choosing a
    random URL. Pass `ha_failover_order: "random"` to restore randomized
    selection (which now also randomizes the failover order).

##### Node.js API
-   HTTP 500/504 responses now trigger failover (previously the Node build did
    not inspect the response status code, so 5xx did not fail over; the browser
    build already did).

##### TypeScript API

These differ from the JavaScript and Node.js APIs as they stood at 7.2.3.2.

-   Files are transferred as binary. The earlier implementation read them as
    UTF-8, which corrupted anything that was not text.
-   Records decoded from `list_records_json` (`get_records_by_series`) are one
    array per series, decoded rather than left as JSON strings.
-   `FileHandler.upload` sends a batch in one request and resolves once,
    instead of invoking the callback once per file. `FileHandler.parse_options`
    keeps caller-supplied options.
-   The helper methods (`get_geo_json`, `insert_records_from_json`,
    `get_records_json`) and `FileHandler` return promises in every build; their
    synchronous forms are not carried over. Synchronous requests are preserved
    in the standalone script-tag build, which defaults to `sync: true` and
    falls back to a blocking `XMLHttpRequest`; pass `sync: false` to opt out.
    A response-size ceiling can only be reported on that path, not enforced,
    because the body has already been buffered by the time the request returns.
-   `encoding: 'binary'` passed to one call of a JSON client throws rather
    than yielding an empty `data`, on the dynamic-schema endpoints
    (`execute_sql`, `aggregate_group_by`, `aggregate_unique`,
    `aggregate_unpivot`, `get_records_by_column`). For Avro, construct the
    client with `encoding: 'binary'` instead, which decodes it; otherwise omit
    the option. `get_records` still returns an empty `data` in this case, with
    the undecoded `records_binary` left on the response.
-   `wms_request` resolves to a `Uint8Array`. Under Node.js it is the response
    `Buffer` itself, so `toString()` decodes UTF-8 as before; in the browser it
    is a plain `Uint8Array`, where `toString()` joins the bytes as numbers
    instead. Use `new TextDecoder().decode(image)` in code that must read the
    bytes as text in both environments.
-   `GPUdb.ConnectionToken`, an internal helper of the Node transport, has no
    equivalent, and nor does the public `urls` list of them. The current
    server's address is still `url`, `protocol`, `hostname`, `port` and
    `pathname`. `url` now includes the server URL's path --
    `https://proxy/gpudb-0` rather than `https://proxy` -- so code that
    appended the path to `url` itself should stop.

#### Notes
-   `User-Agent` and `Cookie` are sent under Node.js only. Browsers forbid
    setting either, and `fetch` drops them silently.
-   Deep import paths such as `@kinetica/gpudb/dist/node/GPUdb.js` do not
    resolve; import the package name.
-   Check CHANGELOG-FUNCTIONS.md for endpoint related changes.


### Version 7.2.3.2 - 2026-07-14

#### Added
-   Passing of API name & version in Node.js HTTP headers.

#### Notes
-   Check CHANGELOG-FUNCTIONS.md for endpoint related changes


### Version 7.2.3.1 - 2025-12-01

#### Added
-   Support for 12-byte `DECIMAL` data type.

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.2.3.0 - 2025-09-03

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.2.2.1 - 2025-08-18

#### Fixed
-   Issue with `GPUdbSqlIterator` iterating over a batch size that is greater
    than the configured `max_get_records_size` on the server.

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.2.2.0 - 2024-10-15

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.2.1.0 - 2024-09-08

#### Added
-   OAuth2 authentication support.


### Version 7.2.0.0 - 2024-02-11

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.



## Version 7.1

### Version 7.1.10.0 - 2024-05-16

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.9.5 - 2024-01-05

#### Fixed
##### Node.js API
-   Issue with crypto library import.


### Version 7.1.9.4 - 2023-12-03

#### Added
##### JavaScript API
-   `SqlIterator` class for easily looping over the records of a SQL result set.

##### Node.js API
-   `SqlIterator` class for easily looping over the records of a SQL result set.


### Version 7.1.9.3 - 2023-09-06

#### Added
##### JavaScript API
-   Support for record sets as native maps/arrays in `insert_records_from_json`.

##### Node.js API
-   Support for record sets as native maps/arrays in `insert_records_from_json`.

#### Fixed
##### Node.js API
-   URL encoding of parameter values in `insert_records_from_json` &
    `get_records_json`.


### Version 7.1.9.2 - 2023-08-31

#### Fixed
##### JavaScript API
-   Sorting and aggregate filtering in `get_records_json`.

##### Node.js API
-   Sorting and aggregate filtering in `get_records_json`.


### Version 7.1.9.1 - 2023-08-20

#### Added
##### JavaScript API
-   A new function, `get_records_json`, for retrieving data in JSON format.

##### Node.js API
-   A new function, `get_records_json`, for retrieving data in JSON format.

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.9.0 - 2023-03-19

#### Added
##### JavaScript API
-   A new function, `insert_records_from_json`, for inserting JSON data.

##### Node.js API
-   A new function, `insert_records_from_json`, for inserting JSON data.

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.8.2 - 2023-03-03

#### JavaScript API

##### Changed
-   Fixed bug in error reporting of job processing

#### Node.js API

##### Changed
-   Updated packaging; added read me and change log files


### Version 7.1.8.0 - 2022-10-22

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.7.0 - 2022-07-18

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.6.0 - 2022-01-27

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.5.0 - 2021-10-13

#### Added
##### JavaScript API
-   A new class, `GPUdb.FileHandler`, to handle uploading files to KiFS.
    It has the following methods:
    -   ``upload``: Uploads local file objects from browsers to KiFS
    -   ``download``: Downloads files from KiFS into the local filesystem


### Version 7.1.4.0 - 2021-07-29

#### Added
##### Node.js API
-   A new class, `GPUdb.FileHandler`, to handle uploading and downloading
    files to KiFS.  It has the following useful methods:
    -   ``upload``: Uploads files or file objects to KiFS
    -   ``download``: Downloads KiFS file data
    -   ``download_and_save``: Downloads KiFS files into the local filesystem

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.3.0 - 2021-03-05

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.2.0 - 2021-01-25

#### Notes
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.1.1.0 - 2020-10-28

#### Added
##### JavaScript API
-   GPUdb methods for adding custom headers per endpoint call:
    -   ``add_http_header()``
    -   ``remove_http_header()``
    -   ``get_http_headers()``

##### Node.js API
-   GPUdb methods for adding custom headers per endpoint call:
    -   ``add_http_header()``
    -   ``remove_http_header()``
    -   ``get_http_headers()``


### Version 7.1.0.0 - 2020-08-18

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.



## Version 7.0

### Version 7.0.20.0 - 2020-11-25

#### JavaScript API

##### Added
-   GPUdb methods for adding custom headers per endpoint call:
    -   ``add_http_header()``
    -   ``remove_http_header()``
    -   ``get_http_headers()``

##### Fixed
-   Updated the examples to not clear *all* tables, but just the table
    being used in the example.


#### Node.js API

##### Added
-   GPUdb methods for adding custom headers per endpoint call:
    -   ``add_http_header()``
    -   ``remove_http_header()``
    -   ``get_http_headers()``

##### Fixed
-   Updated the examples to not clear *all* tables, but just the table
    being used in the example.
-   Buffer deprecation warning (using Buffer.from instead of new Buffer()).

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.19.0 - 2020-08-24

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.18.0 - 2020-07-30

#### Notes
-   Version release
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.17.0 - 2020-07-06

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.

### Version 7.0.16.0 - 2020-05-28

#### Fixed
-   Occassional data corruption issue with replacing `\U` with `\u`.

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.15.0 - 2020-04-27

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.14.0 - 2020-03-25

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.13.0 - 2020-03-10

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.12.0 - 2020-01-17

#### Note
-   Check `CHANGELOG-FUNCTIONS.md` for endpoint related changes.


### Version 7.0.5.0 - 2019-06-26

#### Added
-   Minor documentation and some options for some endpoints

#### Changed
-   Parameters for `/visualize/isoschrone`


### Version 7.0.4.0 - 2019-05-24

-   Added property, `force_infinity_nan_conversion_to_null`, to GPUdb that
    forces quoted string versions of "Infinity", "-Infinity", and "NaN"
    to null when decode query response.


### Version 7.0.3.0 - 2019-05-02

-   Version release


### Version 7.0.2.0 - 2019-04-17

-   Version release


### Version 7.0.0 - 2019-01-31

-   Version release



## Version 6.2

## Version 6.2.0.1 - 2019-05-22
-   Added a property, `force_infinity_nan_conversion_to_null`, to GPUdb that
    forces quoted string versions of "Infinity", "-Infinity", and "NaN"
    to null when decode query response.


### Version 6.2.0.0 - 2018-04-17

-   Added a convenience method `get_geo_json()` that returns a GeoJSON object
    from a table (to both the JavaScript and Node.js APIs).



## Version 6.1.0 - 2017-10-05

-   Releasing version



## Version 6.0.0 - 2017-01-24

-   Releasing version



## Version 5.4.0 - 2016-11-29

-   Releasing version



## Version 5.2.0 - 2016-10-12

-   Added nullable column support



## Version 5.1.0 - 2016-05-06

-   Updated documentation generation



## Version 4.2.0 - 2016-04-11

-   Refactor generation of the APIs
