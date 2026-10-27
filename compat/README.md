<h3 align="center" style="margin:0px">
	<img width="200" src="https://kinetica-web-assets.s3.us-east-1.amazonaws.com/assets/kinetica_logo_gray.svg" alt="Kinetica Logo"/>
</h3>
<h5 align="center" style="margin:0px">
	<a href="https://www.kinetica.com/">Website</a>
	|
	<a href="https://docs.kinetica.com/content/">Docs</a>
	|
	<a href="https://docs.kinetica.com/content/api/nodejs/">Node.js API Docs</a>
	|
	<a href="https://join.slack.com/t/kinetica-community/shared_invite/zt-1bt9x3mvr-uMKrXlSDXfy3oU~sKi84qg">Community Slack</a>
</h5>


# Kinetica Node.js API

-  [Overview](#overview)
-  [Usage](#usage)
-  [Documentation](#documentation)
-  [Moving off the wrapper](#moving-off-the-wrapper)
-  [Support](#support)
-  [Contact Us](#contact-us)
 

## Overview

This package, ``@kinetica/gpudb``, was the *Kinetica* client-side API for
*Node.js*.  From version 7.2.3-3, that API is
[``@kinetica/gpudb-api``](https://www.npmjs.com/package/@kinetica/gpudb-api),
and this package is a thin compatibility wrapper around it, kept so that
existing code using the old package name and shape keeps working unchanged.

There is no API code here.  Every request goes through
``@kinetica/gpudb-api``, which this package pins to the exact same version,
so the two always move together.

For changes to the client-side API, please refer to
[CHANGELOG.md](https://github.com/kineticadb/kinetica-api-typescript/blob/master/CHANGELOG.md).


## Usage

Install the package as before:

    npm install @kinetica/gpudb

and load it as before -- the module is the ``GPUdb`` constructor:

```javascript
const GPUdb = require('@kinetica/gpudb');
const db = new GPUdb('http://localhost:9191', { username: 'admin' });
```

What the wrapper adds is that shape: ``@kinetica/gpudb-api`` exports a
namespace (``const { GPUdb } = require('@kinetica/gpudb-api')``), while this
module *is* the ``GPUdb`` class.  Everything the old API hung off the
constructor is there:

* ``GPUdb.Type`` (and ``GPUdb.Type.Column``), ``GPUdb.RingList`` and
  ``GPUdb.FileHandler``
* ``GPUdb.encode``, ``GPUdb.decode`` and their variants
* ``GPUdb.END_OF_SET`` and ``GPUdb.api_version``

The destructured form works too, and so do the current server's ``url``,
``protocol``, ``hostname``, ``port`` and ``pathname``.  ``url`` now includes
the server URL's path, if it has one.

Two things have no equivalent:

* ``GPUdb.ConnectionToken``, an internal helper of the old *Node.js* transport
* the public ``urls`` list of those tokens

The following are required for using the library:

* ``nodejs`` (16 or later; 18 or later recommended)
* ``npm`` (the *Node.js* package manager)


## Documentation

The API itself -- connecting, calling endpoints, reading results, failover,
the browser builds, and migrating from this package -- is documented in the
main README:

* **GitHub**:
  <https://github.com/kineticadb/kinetica-api-typescript#readme>, in
  particular
  [Migrating from @kinetica/gpudb](https://github.com/kineticadb/kinetica-api-typescript#migrating-from-kineticagpudb)
* **npm**: <https://www.npmjs.com/package/@kinetica/gpudb-api>
* **Installed from the RPM, DEB or tarball** (``/opt/gpudb/api/typescript``):
  ``../README.md``, next to this directory.  There the wrapper loads the API
  from ``../dist/node``, so it works without npm.

The *Kinetica* documentation can be found at https://docs.kinetica.com/content/,
including the [Node.js API reference](https://docs.kinetica.com/content/api/nodejs/).


## Moving off the wrapper

New code should use ``@kinetica/gpudb-api`` directly.  Both give the same
class, so the switch is a change to the import:

```javascript
const { GPUdb, Type, Column } = require('@kinetica/gpudb-api');

import GPUdb from '@kinetica/gpudb-api';        // default export, as before
```


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
