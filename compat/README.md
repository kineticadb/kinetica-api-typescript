# @kinetica/gpudb

**A compatibility wrapper.** This package was Kinetica's Node.js API. From
version 7.2.3-3 the API is [`@kinetica/gpudb-api`](https://www.npmjs.com/package/@kinetica/gpudb-api),
and this package is a thin wrapper around it, kept so that existing code using
the old package name and shape keeps working unchanged.

```javascript
const GPUdb = require('@kinetica/gpudb');       // the module is the constructor, as before
const db = new GPUdb('http://localhost:9191', { username: 'admin' });
```

What it adds is that shape: `@kinetica/gpudb-api` exports a namespace
(`const { GPUdb } = require('@kinetica/gpudb-api')`), while this module *is*
the `GPUdb` class. Everything the old API hung off the constructor is there —
`GPUdb.Type`, `GPUdb.RingList`, `GPUdb.FileHandler`, `GPUdb.encode` / `decode`
and their variants, `GPUdb.END_OF_SET`, `GPUdb.api_version` — and the
destructured form works too, and so do the current server's `url`,
`protocol`, `hostname`, `port` and `pathname`. Two things have no equivalent:
`GPUdb.ConnectionToken`, an internal helper of the old Node transport, and the
public `urls` list of them. `url` now includes the server URL's path, if it
has one.

There is no API code here. Every request goes through `@kinetica/gpudb-api`,
which this package pins to the exact same version, so the two always move
together.

## Documentation

The API itself — connecting, calling endpoints, reading results, failover, the
browser builds, and migrating from this package — is documented in the main
README:

- **GitHub:** [kinetica-api-typescript](https://github.com/kineticadb/kinetica-api-typescript#readme),
  in particular [Migrating from @kinetica/gpudb](https://github.com/kineticadb/kinetica-api-typescript#migrating-from-kineticagpudb)
- **npm:** [`@kinetica/gpudb-api`](https://www.npmjs.com/package/@kinetica/gpudb-api)
- **Installed from the RPM, DEB or tarball** (`/opt/gpudb/api/typescript`):
  `../README.md`, next to this directory. There the wrapper loads the API from
  `../dist/node`, so it works without npm.

## Moving off the wrapper

New code should use `@kinetica/gpudb-api` directly. Both give the same class,
so the switch is a change to the import:

```javascript
const { GPUdb, Type, Column } = require('@kinetica/gpudb-api');

import GPUdb from '@kinetica/gpudb-api';        // default export, as before
```

## License

MIT — see [LICENSE](LICENSE).
