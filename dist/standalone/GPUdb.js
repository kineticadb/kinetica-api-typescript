"use strict";
var __kinetica = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // (disabled):url
  var require_url = __commonJS({
    "(disabled):url"() {
    }
  });

  // (disabled):https
  var require_https = __commonJS({
    "(disabled):https"() {
    }
  });

  // (disabled):http
  var require_http = __commonJS({
    "(disabled):http"() {
    }
  });

  // (disabled):os
  var require_os = __commonJS({
    "(disabled):os"() {
    }
  });

  // (disabled):path
  var require_path = __commonJS({
    "(disabled):path"() {
    }
  });

  // (disabled):fs
  var require_fs = __commonJS({
    "(disabled):fs"() {
    }
  });

  // dist/browser/standalone.js
  var standalone_exports = {};
  __export(standalone_exports, {
    AvroError: () => AvroError,
    AvroType: () => AvroType,
    BrowserHttpTransport: () => BrowserHttpTransport,
    Column: () => Column,
    END_OF_SET: () => END_OF_SET,
    FileHandler: () => FileHandler,
    GPUdb: () => GPUdb,
    JSON_ONLY_ENDPOINTS: () => JSON_ONLY_ENDPOINTS,
    NodeHttpTransport: () => NodeHttpTransport,
    ResponseTooLargeError: () => ResponseTooLargeError,
    RingList: () => RingList,
    Type: () => Type,
    base64Decode: () => base64Decode,
    base64Encode: () => base64Encode,
    createTransport: () => createTransport,
    decode: () => decode,
    decodeNoInfNan: () => decodeNoInfNan,
    decodeRegular: () => decodeRegular,
    encode: () => encode
  });

  // dist/browser/transport.js
  var ResponseTooLargeError = class extends Error {
    static {
      __name(this, "ResponseTooLargeError");
    }
    constructor(limit, received) {
      super(`Response exceeded max_response_bytes: the limit is ${limit} bytes, and at least ${received} were received. Narrow the query, page through the results, or raise max_response_bytes.`);
      this.name = "ResponseTooLargeError";
      this.limit = limit;
      this.received = received;
    }
  };
  function createTransport() {
    if (typeof process !== "undefined" && process.versions?.node) {
      return new NodeHttpTransport();
    }
    return new BrowserHttpTransport();
  }
  __name(createTransport, "createTransport");
  var BrowserHttpTransport = class _BrowserHttpTransport {
    static {
      __name(this, "BrowserHttpTransport");
    }
    async request(options) {
      const controller = new AbortController();
      let timeoutId;
      if (options.timeout && options.timeout > 0) {
        timeoutId = setTimeout(() => controller.abort(), options.timeout);
      }
      try {
        const response = await fetch(options.url, {
          method: options.method,
          headers: options.headers,
          // A Uint8Array is a valid body. The cast is only for the
          // typings, which want its buffer to be a plain ArrayBuffer
          body: options.bytes ?? options.body,
          signal: controller.signal
        });
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
        const limit = options.maxResponseBytes ?? 0;
        if (limit > 0) {
          const bytes = await _BrowserHttpTransport.readCapped(response, limit);
          return {
            status: response.status,
            statusText: response.statusText,
            body: options.responseType === "binary" ? "" : new TextDecoder().decode(bytes),
            headers,
            bytes: options.responseType === "binary" ? bytes : void 0
          };
        }
        if (options.responseType === "binary") {
          const bytes = new Uint8Array(await response.arrayBuffer());
          return {
            status: response.status,
            statusText: response.statusText,
            body: "",
            headers,
            bytes
          };
        }
        const body = await response.text();
        return {
          status: response.status,
          statusText: response.statusText,
          body,
          headers
        };
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }
    /**
     * Reads a response body, abandoning it once it passes `limit` bytes.
     *
     * Streaming is the point: the read stops partway rather than buffering the
     * whole payload and measuring it afterwards, which is what makes the
     * ceiling worth setting.
     */
    static async readCapped(response, limit) {
      const declared = Number(response.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > limit) {
        throw new ResponseTooLargeError(limit, declared);
      }
      if (!response.body) {
        const buffered = new Uint8Array(await response.arrayBuffer());
        if (buffered.length > limit) {
          throw new ResponseTooLargeError(limit, buffered.length);
        }
        return buffered;
      }
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (!value) {
          continue;
        }
        received += value.length;
        if (received > limit) {
          await reader.cancel();
          throw new ResponseTooLargeError(limit, received);
        }
        chunks.push(value);
      }
      const body = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.length;
      }
      return body;
    }
    /**
     * Blocking request, for legacy code that expects a return value rather
     * than a promise. Uses a synchronous XMLHttpRequest, which browsers still
     * support but have deprecated: it blocks the UI thread. Only reachable
     * when the client was constructed with `sync: true`, which the standalone
     * build does by default.
     *
     * XMLHttpRequest is looked up on globalThis so this file still compiles
     * for the Node build, whose lib does not include the DOM.
     */
    requestSync(options) {
      const XhrConstructor = globalThis.XMLHttpRequest;
      if (typeof XhrConstructor !== "function") {
        throw new Error("Synchronous requests need XMLHttpRequest, which this environment does not provide. Use the promise or callback form instead.");
      }
      const xhr = new XhrConstructor();
      xhr.open(options.method, options.url, false);
      for (const [name, value] of Object.entries(options.headers)) {
        if (name === "User-Agent" || name === "Cookie") {
          continue;
        }
        xhr.setRequestHeader(name, value);
      }
      const binary = options.responseType === "binary";
      if (binary) {
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
      }
      xhr.send(options.bytes ?? options.body ?? null);
      const headers = {};
      const raw = xhr.getAllResponseHeaders() || "";
      for (const line of raw.trim().split(/[\r\n]+/)) {
        const separator = line.indexOf(": ");
        if (separator > 0) {
          headers[line.slice(0, separator).toLowerCase()] = line.slice(separator + 2);
        }
      }
      const limit = options.maxResponseBytes ?? 0;
      if (limit > 0) {
        const declared = Number(headers["content-length"]);
        const size = Number.isFinite(declared) && declared > 0 ? declared : xhr.responseText.length;
        if (size > limit) {
          throw new ResponseTooLargeError(limit, size);
        }
      }
      if (binary) {
        const text = xhr.responseText;
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
          bytes[i] = text.charCodeAt(i) & 255;
        }
        return {
          status: xhr.status,
          statusText: xhr.statusText,
          body: "",
          headers,
          bytes
        };
      }
      return {
        status: xhr.status,
        statusText: xhr.statusText,
        body: xhr.responseText,
        headers
      };
    }
  };
  var NodeHttpTransport = class {
    static {
      __name(this, "NodeHttpTransport");
    }
    async request(options) {
      const url = await Promise.resolve().then(() => __toESM(require_url()));
      const parsedUrl = new url.URL(options.url);
      const isHttps = parsedUrl.protocol === "https:";
      const httpModule = isHttps ? await Promise.resolve().then(() => __toESM(require_https())) : await Promise.resolve().then(() => __toESM(require_http()));
      return new Promise((resolve, reject) => {
        const requestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method,
          headers: options.headers
        };
        const limit = options.maxResponseBytes ?? 0;
        let abandoned = false;
        const req = httpModule.request(requestOptions, (res) => {
          const chunks = [];
          let received = 0;
          res.on("data", (chunk) => {
            if (abandoned) {
              return;
            }
            received += chunk.length;
            if (limit > 0 && received > limit) {
              abandoned = true;
              req.destroy();
              reject(new ResponseTooLargeError(limit, received));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () => {
            if (abandoned) {
              return;
            }
            const headers = {};
            for (const [key, value] of Object.entries(res.headers)) {
              if (typeof value === "string") {
                headers[key.toLowerCase()] = value;
              } else if (Array.isArray(value)) {
                headers[key.toLowerCase()] = value.join(", ");
              }
            }
            const payload = Buffer.concat(chunks);
            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || "",
              // Decoding bytes as text would corrupt an image
              body: options.responseType === "binary" ? "" : payload.toString(),
              headers,
              // The Buffer is handed back as-is rather than copied
              // into a plain Uint8Array. Buffer is a Uint8Array
              // subclass, so the declared type still holds, and
              // keeping it means toString() decodes UTF-8 the way
              // the JavaScript API's callers expect -- a plain
              // Uint8Array joins its bytes as "60,63,120,...", which
              // turns a check like
              // `image.toString().includes('ServiceException')`
              // into a silent false.
              bytes: options.responseType === "binary" ? payload : void 0
            });
          });
        });
        req.on("error", (err) => {
          if (!abandoned) {
            reject(err);
          }
        });
        if (options.timeout && options.timeout > 0) {
          req.setTimeout(options.timeout, () => {
            req.destroy(new Error("Request timeout"));
          });
        }
        const body = options.bytes ?? options.body;
        if (body) {
          req.write(body);
        }
        req.end();
      });
    }
  };

  // dist/browser/utils.js
  function encode(data) {
    if (Array.isArray(data)) {
      return data.map((item) => JSON.stringify(item));
    }
    return JSON.stringify(data);
  }
  __name(encode, "encode");
  function decode(data) {
    if (Array.isArray(data)) {
      return data.map((item) => decode(item));
    }
    try {
      return JSON.parse(data);
    } catch (err) {
      throw new Error(`Unable to decode response payload: ${err}`);
    }
  }
  __name(decode, "decode");
  function decodeRegular(data) {
    if (Array.isArray(data)) {
      return data.map((item) => decodeRegular(item));
    }
    return JSON.parse(data);
  }
  __name(decodeRegular, "decodeRegular");
  function decodeNoInfNan(data) {
    if (Array.isArray(data)) {
      return data.map((item) => decodeNoInfNan(item));
    }
    return JSON.parse(data, (_key, value) => {
      if (value === "Infinity" || value === "-Infinity" || value === "NaN") {
        return null;
      }
      return value;
    });
  }
  __name(decodeNoInfNan, "decodeNoInfNan");
  var RingList = class {
    static {
      __name(this, "RingList");
    }
    constructor(items, initialIndex = 0) {
      if (!items || items.length === 0) {
        throw new Error("RingList requires at least one item");
      }
      this.items = [...items];
      this.currentIndex = initialIndex % items.length;
    }
    getCurrentItem() {
      return this.items[this.currentIndex];
    }
    next() {
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      return this.getCurrentItem();
    }
    getItems() {
      return [...this.items];
    }
    size() {
      return this.items.length;
    }
  };
  function base64Encode(str) {
    if (typeof btoa === "function") {
      return btoa(str);
    } else {
      return Buffer.from(str).toString("base64");
    }
  }
  __name(base64Encode, "base64Encode");
  function base64Decode(str) {
    if (typeof atob === "function") {
      return atob(str);
    } else {
      return Buffer.from(str, "base64").toString();
    }
  }
  __name(base64Decode, "base64Decode");
  var Column = class {
    static {
      __name(this, "Column");
    }
    /**
     * Creates a Column object.
     *
     * @param name - The name of the column
     * @param type - The data type of the column
     * @param properties - The list of properties that apply to the column
     */
    constructor(name, type, ...properties) {
      this.name = name;
      this.type = type;
      this.properties = properties;
    }
    /**
     * Gets whether the column is nullable.
     */
    isNullable() {
      return this.properties.includes("nullable");
    }
  };
  var Type = class _Type {
    static {
      __name(this, "Type");
    }
    /**
     * Creates a Type object.
     *
     * @param label - A user-defined description string
     * @param columns - The columns that make up the type
     */
    constructor(label, ...columns) {
      this.label = label;
      this.columns = columns;
    }
    /**
     * Creates a Type object using data returned from GPUdb show_table or show_types.
     */
    static fromTypeInfo(label, typeSchema, properties) {
      const schema = typeof typeSchema === "string" ? JSON.parse(typeSchema) : typeSchema;
      const columns = [];
      for (const field of schema.fields) {
        let fieldType = field.type;
        if (Array.isArray(fieldType)) {
          fieldType = fieldType.find((t) => t !== "null") || fieldType[0];
        }
        const props = properties[field.name] || [];
        columns.push(new Column(field.name, fieldType, ...props));
      }
      return new _Type(label, ...columns);
    }
    /**
     * Generates an Avro record schema based on the metadata in the Type object.
     */
    generateSchema() {
      return {
        type: "record",
        name: "type_name",
        fields: this.columns.map((col) => ({
          name: col.name,
          type: col.isNullable() ? [col.type, "null"] : col.type
        }))
      };
    }
    /**
     * Creates a new type in GPUdb based on the metadata in the Type object.
     *
     * @param gpudb - GPUdb client instance
     * @returns Promise resolving to the type ID
     */
    async create(gpudb) {
      const properties = {};
      for (const column of this.columns) {
        if (column.properties.length > 0) {
          properties[column.name] = column.properties;
        }
      }
      const response = await gpudb.create_type(JSON.stringify(this.generateSchema()), this.label, properties, {});
      return response.type_id;
    }
    /**
     * Creates a Type object containing metadata about the type stored in the specified table.
     *
     * @param gpudb - GPUdb client instance
     * @param tableName - The table from which to obtain type metadata
     * @returns Promise resolving to the Type object
     */
    static async fromTable(gpudb, tableName) {
      const response = await gpudb.show_table(tableName, {});
      if (response.type_ids.length === 0) {
        throw new Error(`Table ${tableName} does not exist.`);
      }
      if (response.type_ids.length > 1) {
        const typeId = response.type_ids[0];
        for (let i = 1; i < response.type_ids.length; i++) {
          if (response.type_ids[i] !== typeId) {
            throw new Error(`Table ${tableName} is not homogeneous.`);
          }
        }
      }
      return _Type.fromTypeInfo(response.type_labels[0], response.type_schemas[0], response.properties[0]);
    }
    /**
     * Creates a Type object containing metadata about the specified type in GPUdb.
     *
     * @param gpudb - GPUdb client instance
     * @param typeId - The type for which to obtain metadata
     * @returns Promise resolving to the Type object
     */
    static async fromType(gpudb, typeId) {
      const response = await gpudb.show_types(typeId, "", {});
      if (response.type_ids.length === 0) {
        throw new Error(`Type ${typeId} does not exist.`);
      }
      return _Type.fromTypeInfo(response.labels[0], response.type_schemas[0], response.properties[0]);
    }
  };
  Type.Column = Column;

  // dist/browser/avro.js
  var AvroError = class extends Error {
    static {
      __name(this, "AvroError");
    }
    constructor(reason) {
      super(reason);
      this.path = [];
      this.name = "AvroError";
      this.reason = reason;
    }
    /** @internal Records one more level of the path, outermost last. */
    prependPath(segment) {
      this.path.unshift(segment);
      this.message = `${this.reason} (at ${this.path.join(".")})`;
      return this;
    }
  };
  var textEncoder = new TextEncoder();
  var textDecoder = new TextDecoder("utf-8", { fatal: true });
  var FAST_LONG_LIMIT = 2 ** 52;
  var MIN_SAFE_BIG = BigInt(Number.MIN_SAFE_INTEGER);
  var MAX_SAFE_BIG = BigInt(Number.MAX_SAFE_INTEGER);
  var MIN_LONG = -(2n ** 63n);
  var MAX_LONG = 2n ** 63n - 1n;
  var MIN_INT = -(2 ** 31);
  var MAX_INT = 2 ** 31 - 1;
  var Writer = class {
    static {
      __name(this, "Writer");
    }
    constructor(capacity) {
      this.pos = 0;
      this.buf = new Uint8Array(capacity);
      this.view = new DataView(this.buf.buffer);
    }
    ensure(count) {
      const needed = this.pos + count;
      if (needed <= this.buf.length) {
        return;
      }
      const grown = new Uint8Array(Math.max(needed, this.buf.length * 2));
      grown.set(this.buf.subarray(0, this.pos));
      this.buf = grown;
      this.view = new DataView(grown.buffer);
    }
    writeByte(value) {
      this.ensure(1);
      this.buf[this.pos++] = value;
    }
    writeBytes(bytes) {
      this.writeLong(bytes.length);
      this.ensure(bytes.length);
      this.buf.set(bytes, this.pos);
      this.pos += bytes.length;
    }
    writeInt(value) {
      let zigzag = (value << 1 ^ value >> 31) >>> 0;
      this.ensure(5);
      while (zigzag > 127) {
        this.buf[this.pos++] = zigzag & 127 | 128;
        zigzag >>>= 7;
      }
      this.buf[this.pos++] = zigzag;
    }
    writeLong(value) {
      this.ensure(10);
      if (typeof value === "number" && value >= -FAST_LONG_LIMIT && value <= FAST_LONG_LIMIT) {
        let zigzag2 = value >= 0 ? value * 2 : -value * 2 - 1;
        while (zigzag2 > 127) {
          this.buf[this.pos++] = zigzag2 % 128 | 128;
          zigzag2 = Math.floor(zigzag2 / 128);
        }
        this.buf[this.pos++] = zigzag2;
        return;
      }
      const big = BigInt(value);
      let zigzag = BigInt.asUintN(64, big << 1n ^ big >> 63n);
      while (zigzag > 0x7fn) {
        this.buf[this.pos++] = Number(zigzag & 0x7fn) | 128;
        zigzag >>= 7n;
      }
      this.buf[this.pos++] = Number(zigzag);
    }
    writeString(value) {
      const length = value.length;
      if (length < 64) {
        this.ensure(length + 1);
        const start = this.pos;
        this.buf[this.pos++] = length * 2;
        let i = 0;
        for (; i < length; i++) {
          const code = value.charCodeAt(i);
          if (code > 127) {
            break;
          }
          this.buf[this.pos++] = code;
        }
        if (i === length) {
          return;
        }
        this.pos = start;
      }
      this.writeBytes(textEncoder.encode(value));
    }
  };
  var floatScratch = new Float64Array(1);
  var float32Scratch = new Float32Array(floatScratch.buffer, 0, 1);
  var floatBytes = new Uint8Array(floatScratch.buffer);
  var LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  var POWERS_OF_TEN = Array.from({ length: 23 }, (_, i) => 10 ** i);
  var MIN_NORMAL_FLOAT = 2 ** -126;
  function shortestFloat(value) {
    if (value === 0 || !Number.isFinite(value)) {
      return value;
    }
    const magnitude = Math.abs(value);
    const first = magnitude < MIN_NORMAL_FLOAT ? 1 : 6;
    const exponent = Math.floor(Math.log10(magnitude));
    for (let digits = first; digits <= 9; digits++) {
      const shift = digits - 1 - exponent;
      let candidate;
      if (shift >= 0 && shift < POWERS_OF_TEN.length) {
        const scale = POWERS_OF_TEN[shift];
        candidate = Math.round(magnitude * scale) / scale;
      } else if (shift < 0 && -shift < POWERS_OF_TEN.length) {
        const scale = POWERS_OF_TEN[-shift];
        candidate = Math.round(magnitude / scale) * scale;
      } else {
        candidate = Number(magnitude.toPrecision(digits));
      }
      if (Math.fround(candidate) === magnitude) {
        return value < 0 ? -candidate : candidate;
      }
    }
    return value;
  }
  __name(shortestFloat, "shortestFloat");
  var Reader = class {
    static {
      __name(this, "Reader");
    }
    constructor(buf) {
      this.pos = 0;
      this.buf = buf;
    }
    readFloat() {
      this.need(4);
      const buf = this.buf;
      const pos = this.pos;
      this.pos += 4;
      if (!LITTLE_ENDIAN) {
        return shortestFloat(new DataView(buf.buffer, buf.byteOffset + pos, 4).getFloat32(0, true));
      }
      floatBytes[0] = buf[pos];
      floatBytes[1] = buf[pos + 1];
      floatBytes[2] = buf[pos + 2];
      floatBytes[3] = buf[pos + 3];
      return shortestFloat(float32Scratch[0]);
    }
    readDouble() {
      this.need(8);
      const buf = this.buf;
      const pos = this.pos;
      this.pos += 8;
      if (!LITTLE_ENDIAN) {
        return new DataView(buf.buffer, buf.byteOffset + pos, 8).getFloat64(0, true);
      }
      for (let i = 0; i < 8; i++) {
        floatBytes[i] = buf[pos + i];
      }
      return floatScratch[0];
    }
    need(count) {
      if (this.pos + count > this.buf.length) {
        throw new AvroError(`Truncated Avro data: needed ${count} more byte(s) at offset ${this.pos}, but only ${this.buf.length - this.pos} remain`);
      }
    }
    readByte() {
      this.need(1);
      return this.buf[this.pos++];
    }
    readInt() {
      let zigzag = 0;
      for (let shift = 0; shift < 35; shift += 7) {
        const byte = this.readByte();
        zigzag |= (byte & 127) << shift;
        if (byte < 128) {
          return zigzag >>> 1 ^ -(zigzag & 1);
        }
      }
      throw new AvroError("Invalid Avro int: varint runs past 5 bytes");
    }
    readLong() {
      const start = this.pos;
      let zigzag = 0;
      let scale = 1;
      for (let i = 0; i < 7; i++) {
        const byte = this.readByte();
        zigzag += (byte & 127) * scale;
        if (byte < 128) {
          return zigzag % 2 === 0 ? zigzag / 2 : -(zigzag + 1) / 2;
        }
        scale *= 128;
      }
      this.pos = start;
      let big = 0n;
      for (let shift = 0n; shift < 70n; shift += 7n) {
        const byte = this.readByte();
        big |= BigInt(byte & 127) << shift;
        if (byte < 128) {
          big = BigInt.asUintN(64, big);
          const value = big >> 1n ^ -(big & 1n);
          return value >= MIN_SAFE_BIG && value <= MAX_SAFE_BIG ? Number(value) : value;
        }
      }
      throw new AvroError("Invalid Avro long: varint runs past 10 bytes");
    }
    /** A long used as a count or length, which must fit in a number */
    readSize() {
      const size = this.readLong();
      if (typeof size !== "number") {
        throw new AvroError(`Invalid Avro data: length ${size} is out of range`);
      }
      return size;
    }
    readBytes() {
      const length = this.readSize();
      if (length < 0) {
        throw new AvroError(`Invalid Avro data: negative length ${length}`);
      }
      this.need(length);
      return this.buf.slice(this.pos, this.pos += length);
    }
    readString() {
      const length = this.readSize();
      if (length < 0) {
        throw new AvroError(`Invalid Avro data: negative length ${length}`);
      }
      this.need(length);
      if (length < 64) {
        const buf = this.buf;
        const start = this.pos;
        let text = "";
        let i = start;
        for (const end = start + length; i < end; i++) {
          const byte = buf[i];
          if (byte > 127) {
            break;
          }
          text += String.fromCharCode(byte);
        }
        if (i === start + length) {
          this.pos = i;
          return text;
        }
      }
      const bytes = this.buf.subarray(this.pos, this.pos += length);
      try {
        return textDecoder.decode(bytes);
      } catch {
        throw new AvroError("Invalid Avro string: not valid UTF-8");
      }
    }
    /**
     * Item count of the next array or map block. A negative count is followed
     * by the block's size in bytes, which a reader that decodes every item
     * has no use for.
     */
    readBlockCount() {
      const count = this.readSize();
      if (count < 0) {
        this.readSize();
        return -count;
      }
      return count;
    }
  };
  function describe(value) {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    if (value instanceof Uint8Array) {
      return "Uint8Array";
    }
    return typeof value;
  }
  __name(describe, "describe");
  function mismatch(codec, value) {
    return new AvroError(`Expected ${codec.label}, got ${describe(value)}`);
  }
  __name(mismatch, "mismatch");
  function isInt(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= MIN_INT && value <= MAX_INT;
  }
  __name(isInt, "isInt");
  var NON_FINITE = Object.freeze({
    "Infinity": Infinity,
    "-Infinity": -Infinity,
    "NaN": NaN
  });
  function toFloating(value) {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && Object.prototype.hasOwnProperty.call(NON_FINITE, value)) {
      return NON_FINITE[value];
    }
    return void 0;
  }
  __name(toFloating, "toFloating");
  function isLong(value) {
    if (typeof value === "number") {
      return Number.isInteger(value) && value >= -(2 ** 63) && value < 2 ** 63;
    }
    return typeof value === "bigint" && value >= MIN_LONG && value <= MAX_LONG;
  }
  __name(isLong, "isLong");
  function toBytes(value) {
    if (value instanceof Uint8Array) {
      return value;
    }
    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return void 0;
  }
  __name(toBytes, "toBytes");
  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) && toBytes(value) === void 0;
  }
  __name(isPlainObject, "isPlainObject");
  function setKey(target, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
    } else {
      target[key] = value;
    }
  }
  __name(setKey, "setKey");
  var PRIMITIVES = {
    null: {
      label: "null",
      accepts: /* @__PURE__ */ __name((value) => value === null || value === void 0, "accepts"),
      write(_writer, value) {
        if (value !== null && value !== void 0) {
          throw mismatch(this, value);
        }
      },
      read: /* @__PURE__ */ __name(() => null, "read")
    },
    boolean: {
      label: "boolean",
      accepts: /* @__PURE__ */ __name((value) => typeof value === "boolean", "accepts"),
      write(writer, value) {
        if (typeof value !== "boolean") {
          throw mismatch(this, value);
        }
        writer.writeByte(value ? 1 : 0);
      },
      read(reader) {
        const byte = reader.readByte();
        if (byte > 1) {
          throw new AvroError(`Invalid Avro boolean: byte ${byte}`);
        }
        return byte === 1;
      }
    },
    int: {
      label: "int",
      accepts: isInt,
      write(writer, value) {
        if (!isInt(value)) {
          throw new AvroError(`Expected int (a 32-bit integer), got ${describe(value)} ${value}`);
        }
        writer.writeInt(value);
      },
      read: /* @__PURE__ */ __name((reader) => reader.readInt(), "read")
    },
    long: {
      label: "long",
      accepts: isLong,
      write(writer, value) {
        if (!isLong(value)) {
          throw new AvroError(`Expected long (a 64-bit integer, as number or bigint), got ${describe(value)} ${value}`);
        }
        writer.writeLong(value);
      },
      read: /* @__PURE__ */ __name((reader) => reader.readLong(), "read")
    },
    float: {
      label: "float",
      accepts: /* @__PURE__ */ __name((value) => toFloating(value) !== void 0, "accepts"),
      write(writer, value) {
        const number = toFloating(value);
        if (number === void 0) {
          throw mismatch(this, value);
        }
        writer.ensure(4);
        writer.view.setFloat32(writer.pos, number, true);
        writer.pos += 4;
      },
      read: /* @__PURE__ */ __name((reader) => reader.readFloat(), "read")
    },
    double: {
      label: "double",
      accepts: /* @__PURE__ */ __name((value) => toFloating(value) !== void 0, "accepts"),
      write(writer, value) {
        const number = toFloating(value);
        if (number === void 0) {
          throw mismatch(this, value);
        }
        writer.ensure(8);
        writer.view.setFloat64(writer.pos, number, true);
        writer.pos += 8;
      },
      read: /* @__PURE__ */ __name((reader) => reader.readDouble(), "read")
    },
    bytes: {
      label: "bytes",
      accepts: /* @__PURE__ */ __name((value) => toBytes(value) !== void 0, "accepts"),
      write(writer, value) {
        const bytes = toBytes(value);
        if (bytes === void 0) {
          throw new AvroError(`Expected bytes (a Uint8Array or ArrayBuffer), got ${describe(value)}`);
        }
        writer.writeBytes(bytes);
      },
      read: /* @__PURE__ */ __name((reader) => reader.readBytes(), "read")
    },
    string: {
      label: "string",
      accepts: /* @__PURE__ */ __name((value) => typeof value === "string", "accepts"),
      write(writer, value) {
        if (typeof value !== "string") {
          throw mismatch(this, value);
        }
        writer.writeString(value);
      },
      read: /* @__PURE__ */ __name((reader) => reader.readString(), "read")
    }
  };
  var ArrayCodec = class {
    static {
      __name(this, "ArrayCodec");
    }
    constructor(items) {
      this.items = items;
      this.label = "array";
    }
    accepts(value) {
      return Array.isArray(value);
    }
    write(writer, value) {
      if (!Array.isArray(value)) {
        throw mismatch(this, value);
      }
      if (value.length > 0) {
        writer.writeLong(value.length);
        for (let i = 0; i < value.length; i++) {
          try {
            this.items.write(writer, value[i]);
          } catch (err) {
            throw err instanceof AvroError ? err.prependPath(String(i)) : err;
          }
        }
      }
      writer.writeByte(0);
    }
    read(reader) {
      const result = [];
      for (let count = reader.readBlockCount(); count > 0; count = reader.readBlockCount()) {
        for (let i = 0; i < count; i++) {
          result.push(this.items.read(reader));
        }
      }
      return result;
    }
  };
  var MapCodec = class {
    static {
      __name(this, "MapCodec");
    }
    constructor(values) {
      this.values = values;
      this.label = "map";
    }
    accepts(value) {
      return value instanceof Map || isPlainObject(value);
    }
    write(writer, value) {
      if (!this.accepts(value)) {
        throw mismatch(this, value);
      }
      const entries = (value instanceof Map ? [...value.entries()] : Object.entries(value)).filter(([, item]) => item !== void 0);
      if (entries.length > 0) {
        writer.writeLong(entries.length);
        for (const [key, item] of entries) {
          writer.writeString(String(key));
          try {
            this.values.write(writer, item);
          } catch (err) {
            throw err instanceof AvroError ? err.prependPath(String(key)) : err;
          }
        }
      }
      writer.writeByte(0);
    }
    read(reader) {
      const result = {};
      for (let count = reader.readBlockCount(); count > 0; count = reader.readBlockCount()) {
        for (let i = 0; i < count; i++) {
          const key = reader.readString();
          setKey(result, key, this.values.read(reader));
        }
      }
      return result;
    }
  };
  var UnionCodec = class {
    static {
      __name(this, "UnionCodec");
    }
    constructor(branches) {
      this.branches = branches;
      this.label = `union [${branches.map((branch) => branch.label).join(", ")}]`;
      this.nullIndex = branches.indexOf(PRIMITIVES.null);
    }
    accepts(value) {
      return this.branches.some((branch) => branch.accepts(value));
    }
    write(writer, value) {
      let index = value === null || value === void 0 ? this.nullIndex : -1;
      if (index < 0) {
        index = this.branches.findIndex((branch) => branch.accepts(value));
      }
      if (index < 0) {
        throw mismatch(this, value);
      }
      writer.writeLong(index);
      this.branches[index].write(writer, value);
    }
    read(reader) {
      const index = reader.readLong();
      if (typeof index !== "number" || index < 0 || index >= this.branches.length) {
        throw new AvroError(`Invalid Avro union: branch ${index} of ${this.branches.length}`);
      }
      return this.branches[index].read(reader);
    }
  };
  var RecordCodec = class {
    static {
      __name(this, "RecordCodec");
    }
    constructor(name) {
      this.name = name;
      this.fields = [];
      this.label = `record ${name}`;
    }
    accepts(value) {
      return isPlainObject(value);
    }
    write(writer, value) {
      if (!isPlainObject(value)) {
        throw mismatch(this, value);
      }
      for (const field of this.fields) {
        const item = value[field.name];
        try {
          if (item === void 0 && !field.codec.accepts(void 0)) {
            throw new AvroError(`Missing required field of type ${field.codec.label}`);
          }
          field.codec.write(writer, item);
        } catch (err) {
          throw err instanceof AvroError ? err.prependPath(field.name) : err;
        }
      }
    }
    read(reader) {
      const result = {};
      const fields = this.fields;
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (field.name === "__proto__") {
          setKey(result, field.name, field.codec.read(reader));
        } else {
          result[field.name] = field.codec.read(reader);
        }
      }
      return result;
    }
  };
  var EnumCodec = class {
    static {
      __name(this, "EnumCodec");
    }
    constructor(name, symbols) {
      this.symbols = symbols;
      this.label = `enum ${name}`;
    }
    accepts(value) {
      return typeof value === "string" && this.symbols.includes(value);
    }
    write(writer, value) {
      const index = typeof value === "string" ? this.symbols.indexOf(value) : -1;
      if (index < 0) {
        throw new AvroError(`Expected one of ${this.symbols.join(", ")} for ${this.label}, got ${value}`);
      }
      writer.writeLong(index);
    }
    read(reader) {
      const index = reader.readLong();
      if (typeof index !== "number" || index < 0 || index >= this.symbols.length) {
        throw new AvroError(`Invalid Avro ${this.label}: symbol ${index} of ${this.symbols.length}`);
      }
      return this.symbols[index];
    }
  };
  var FixedCodec = class {
    static {
      __name(this, "FixedCodec");
    }
    constructor(name, size) {
      this.size = size;
      this.label = `fixed ${name} (${size} bytes)`;
    }
    accepts(value) {
      return toBytes(value)?.length === this.size;
    }
    write(writer, value) {
      const bytes = toBytes(value);
      if (bytes?.length !== this.size) {
        throw mismatch(this, value);
      }
      writer.ensure(this.size);
      writer.buf.set(bytes, writer.pos);
      writer.pos += this.size;
    }
    read(reader) {
      reader.need(this.size);
      return reader.buf.slice(reader.pos, reader.pos += this.size);
    }
  };
  function primitive(name) {
    return Object.prototype.hasOwnProperty.call(PRIMITIVES, name) ? PRIMITIVES[name] : void 0;
  }
  __name(primitive, "primitive");
  function fullName(name, namespace) {
    return name.includes(".") || !namespace ? name : `${namespace}.${name}`;
  }
  __name(fullName, "fullName");
  function compile(schema, named, namespace) {
    if (typeof schema === "string") {
      const codec = primitive(schema) ?? named.get(fullName(schema, namespace)) ?? named.get(schema);
      if (codec === void 0) {
        throw new AvroError(`Invalid Avro schema: unknown type "${schema}"`);
      }
      return codec;
    }
    if (Array.isArray(schema)) {
      return new UnionCodec(schema.map((branch) => compile(branch, named, namespace)));
    }
    if (schema === null || typeof schema !== "object") {
      throw new AvroError(`Invalid Avro schema: ${JSON.stringify(schema)}`);
    }
    const type = schema.type;
    const simple = typeof type === "string" ? primitive(type) : void 0;
    if (simple !== void 0) {
      return simple;
    }
    const register = /* @__PURE__ */ __name((codec) => {
      if (typeof schema.name !== "string" || schema.name === "") {
        throw new AvroError(`Invalid Avro schema: ${type} has no name`);
      }
      const name = fullName(schema.name, schema.namespace ?? namespace);
      named.set(name, codec);
      return name;
    }, "register");
    switch (type) {
      case "record":
      case "error": {
        if (!Array.isArray(schema.fields)) {
          throw new AvroError(`Invalid Avro schema: record ${schema.name} has no fields`);
        }
        const record = new RecordCodec(String(schema.name));
        const name = register(record);
        const inner = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : namespace;
        record.fields = schema.fields.map((field) => ({
          name: field.name,
          codec: compile(field.type, named, inner)
        }));
        return record;
      }
      case "enum": {
        if (!Array.isArray(schema.symbols)) {
          throw new AvroError(`Invalid Avro schema: enum ${schema.name} has no symbols`);
        }
        const codec = new EnumCodec(String(schema.name), schema.symbols);
        register(codec);
        return codec;
      }
      case "fixed": {
        if (!Number.isInteger(schema.size) || schema.size < 0) {
          throw new AvroError(`Invalid Avro schema: fixed ${schema.name} has no valid size`);
        }
        const codec = new FixedCodec(String(schema.name), schema.size);
        register(codec);
        return codec;
      }
      case "array":
        if (schema.items === void 0) {
          throw new AvroError("Invalid Avro schema: array has no items");
        }
        return new ArrayCodec(compile(schema.items, named, namespace));
      case "map":
        if (schema.values === void 0) {
          throw new AvroError("Invalid Avro schema: map has no values");
        }
        return new MapCodec(compile(schema.values, named, namespace));
      default:
        return compile(type, named, namespace);
    }
  }
  __name(compile, "compile");
  var SCRATCH_CAPACITY = 64 * 1024;
  var SCRATCH_RETAIN_LIMIT = 4 * 1024 * 1024;
  var scratch = new Writer(SCRATCH_CAPACITY);
  var CACHE_LIMIT = 512;
  var cache = /* @__PURE__ */ new Map();
  var AvroType = class _AvroType {
    static {
      __name(this, "AvroType");
    }
    constructor(schema) {
      this.schema = schema;
      this.codec = compile(schema, /* @__PURE__ */ new Map());
    }
    /**
     * Compiles a schema, or returns the type already compiled for it.
     *
     * @param schema The schema as an object, as JSON text, or as the bare name
     *   of a primitive type such as `"long"`
     * @throws AvroError if the schema is invalid
     */
    static forSchema(schema) {
      let key;
      let parsed = schema;
      if (typeof schema === "string") {
        key = schema;
        const head = schema.trimStart()[0];
        if (head === "{" || head === "[" || head === '"') {
          try {
            parsed = JSON.parse(schema);
          } catch (err) {
            throw new AvroError(`Invalid Avro schema: ${err}`);
          }
        }
      } else {
        key = JSON.stringify(schema);
      }
      let type = cache.get(key);
      if (type === void 0) {
        type = new _AvroType(parsed);
        if (cache.size >= CACHE_LIMIT) {
          cache.clear();
        }
        cache.set(key, type);
      }
      return type;
    }
    /**
     * Encodes a value to Avro binary.
     *
     * @throws AvroError if the value does not match the schema; its `path`
     *   names the offending field
     */
    encode(value) {
      const writer = scratch;
      writer.pos = 0;
      try {
        this.codec.write(writer, value);
        return writer.buf.slice(0, writer.pos);
      } finally {
        if (writer.buf.length > SCRATCH_RETAIN_LIMIT) {
          scratch = new Writer(SCRATCH_CAPACITY);
        }
      }
    }
    /**
     * Decodes one Avro binary value, which must take up the whole input.
     *
     * @throws AvroError if the data is truncated, has bytes left over, or
     *   otherwise does not match the schema
     */
    decode(data) {
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      const reader = new Reader(bytes);
      const value = this.codec.read(reader);
      if (reader.pos !== bytes.length) {
        throw new AvroError(`Invalid Avro data: ${bytes.length - reader.pos} byte(s) left over after decoding ${this.codec.label}`);
      }
      return value;
    }
  };

  // dist/browser/schemas.js
  var ENDPOINT_SCHEMAS = {
    "/admin/add/host": {
      request: '{"type":"record","name":"admin_add_host_request","fields":[{"name":"host_address","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_add_host_response","fields":[{"name":"added_host","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/add/ranks": {
      request: '{"type":"record","name":"admin_add_ranks_request","fields":[{"name":"hosts","type":{"type":"array","items":"string"}},{"name":"config_params","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_add_ranks_response","fields":[{"name":"added_ranks","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/alter/host": {
      request: '{"type":"record","name":"admin_alter_host_request","fields":[{"name":"host","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_alter_host_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/alter/jobs": {
      request: '{"type":"record","name":"admin_alter_jobs_request","fields":[{"name":"job_ids","type":{"type":"array","items":"long"}},{"name":"action","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_alter_jobs_response","fields":[{"name":"job_ids","type":{"type":"array","items":"long"}},{"name":"action","type":"string"},{"name":"status","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/backup/begin": {
      request: '{"type":"record","name":"admin_backup_begin_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_backup_begin_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/backup/end": {
      request: '{"type":"record","name":"admin_backup_end_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_backup_end_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/ha/offline": {
      request: '{"type":"record","name":"admin_ha_offline_request","fields":[{"name":"offline","type":"boolean"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_ha_offline_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/ha/refresh": {
      request: '{"type":"record","name":"admin_ha_refresh_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_ha_refresh_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/offline": {
      request: '{"type":"record","name":"admin_offline_request","fields":[{"name":"offline","type":"boolean"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_offline_response","fields":[{"name":"is_offline","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/rebalance": {
      request: '{"type":"record","name":"admin_rebalance_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_rebalance_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/remove/host": {
      request: '{"type":"record","name":"admin_remove_host_request","fields":[{"name":"host","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_remove_host_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/remove/ranks": {
      request: '{"type":"record","name":"admin_remove_ranks_request","fields":[{"name":"ranks","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_remove_ranks_response","fields":[{"name":"removed_ranks","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/repair/table": {
      request: '{"type":"record","name":"admin_repair_table_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"table_types","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_repair_table_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"repair_status","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/send/alert": {
      request: '{"type":"record","name":"admin_send_alert_request","fields":[{"name":"message","type":"string"},{"name":"label","type":"string"},{"name":"log_level","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_send_alert_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/show/alerts": {
      request: '{"type":"record","name":"admin_show_alerts_request","fields":[{"name":"num_alerts","type":"int"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_show_alerts_response","fields":[{"name":"timestamps","type":{"type":"array","items":"string"}},{"name":"types","type":{"type":"array","items":"string"}},{"name":"params","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/show/cluster/operations": {
      request: '{"type":"record","name":"admin_show_cluster_operations_request","fields":[{"name":"history_index","type":"int"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_show_cluster_operations_response","fields":[{"name":"history_index","type":"int"},{"name":"history_size","type":"int"},{"name":"in_progress","type":"boolean"},{"name":"start_time","type":"string"},{"name":"end_time","type":"string"},{"name":"endpoint","type":"string"},{"name":"endpoint_schema","type":"string"},{"name":"overall_status","type":"string"},{"name":"user_stopped","type":"boolean"},{"name":"percent_complete","type":"int"},{"name":"dry_run","type":"boolean"},{"name":"messages","type":{"type":"array","items":"string"}},{"name":"add_ranks","type":"boolean"},{"name":"add_ranks_status","type":"string"},{"name":"ranks_being_added","type":{"type":"array","items":"int"}},{"name":"rank_hosts","type":{"type":"array","items":"string"}},{"name":"add_ranks_percent_complete","type":"int"},{"name":"remove_ranks","type":"boolean"},{"name":"remove_ranks_status","type":"string"},{"name":"ranks_being_removed","type":{"type":"array","items":"int"}},{"name":"remove_ranks_percent_complete","type":"int"},{"name":"rebalance","type":"boolean"},{"name":"rebalance_unsharded_data","type":"boolean"},{"name":"rebalance_unsharded_data_status","type":"string"},{"name":"unsharded_rebalance_percent_complete","type":"int"},{"name":"rebalance_sharded_data","type":"boolean"},{"name":"shard_array_version","type":"long"},{"name":"rebalance_sharded_data_status","type":"string"},{"name":"num_shards_changing","type":"int"},{"name":"sharded_rebalance_percent_complete","type":"int"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/show/jobs": {
      request: '{"type":"record","name":"admin_show_jobs_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_show_jobs_response","fields":[{"name":"job_id","type":{"type":"array","items":"long"}},{"name":"status","type":{"type":"array","items":"string"}},{"name":"endpoint_name","type":{"type":"array","items":"string"}},{"name":"time_received","type":{"type":"array","items":"long"}},{"name":"auth_id","type":{"type":"array","items":"string"}},{"name":"source_ip","type":{"type":"array","items":"string"}},{"name":"query_text","type":{"type":"array","items":"string"}},{"name":"user_data","type":{"type":"array","items":"string"}},{"name":"flags","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/show/shards": {
      request: '{"type":"record","name":"admin_show_shards_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_show_shards_response","fields":[{"name":"version","type":"long"},{"name":"rank","type":{"type":"array","items":"int"}},{"name":"tom","type":{"type":"array","items":"int"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/shutdown": {
      request: '{"type":"record","name":"admin_shutdown_request","fields":[{"name":"exit_type","type":"string"},{"name":"authorization","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_shutdown_response","fields":[{"name":"exit_status","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/switchover": {
      request: '{"type":"record","name":"admin_switchover_request","fields":[{"name":"processes","type":{"type":"array","items":"string"}},{"name":"destinations","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_switchover_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/admin/verifydb": {
      request: '{"type":"record","name":"admin_verify_db_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"admin_verify_db_response","fields":[{"name":"verified_ok","type":"boolean"},{"name":"error_list","type":{"type":"array","items":"string"}},{"name":"orphaned_tables_total_size","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/convexhull": {
      request: '{"type":"record","name":"aggregate_convex_hull_request","fields":[{"name":"table_name","type":"string"},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_convex_hull_response","fields":[{"name":"x_vector","type":{"type":"array","items":"double"}},{"name":"y_vector","type":{"type":"array","items":"double"}},{"name":"count","type":"int"},{"name":"is_valid","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/groupby": {
      request: '{"type":"record","name":"aggregate_group_by_request","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_group_by_response","fields":[{"name":"response_schema_str","type":"string"},{"name":"binary_encoded_response","type":"bytes"},{"name":"json_encoded_response","type":"string"},{"name":"total_number_of_records","type":"long"},{"name":"has_more_records","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/histogram": {
      request: '{"type":"record","name":"aggregate_histogram_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"start","type":"double"},{"name":"end","type":"double"},{"name":"interval","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_histogram_response","fields":[{"name":"counts","type":{"type":"array","items":"double"}},{"name":"start","type":"double"},{"name":"end","type":"double"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/kmeans": {
      request: '{"type":"record","name":"aggregate_k_means_request","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"k","type":"int"},{"name":"tolerance","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_k_means_response","fields":[{"name":"means","type":{"type":"array","items":{"type":"array","items":"double"}}},{"name":"counts","type":{"type":"array","items":"long"}},{"name":"rms_dists","type":{"type":"array","items":"double"}},{"name":"count","type":"long"},{"name":"rms_dist","type":"double"},{"name":"tolerance","type":"double"},{"name":"num_iters","type":"int"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/minmax": {
      request: '{"type":"record","name":"aggregate_min_max_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_min_max_response","fields":[{"name":"min","type":"double"},{"name":"max","type":"double"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/minmax/geometry": {
      request: '{"type":"record","name":"aggregate_min_max_geometry_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_min_max_geometry_response","fields":[{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/statistics": {
      request: '{"type":"record","name":"aggregate_statistics_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"stats","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_statistics_response","fields":[{"name":"stats","type":{"type":"map","values":"double"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/statistics/byrange": {
      request: '{"type":"record","name":"aggregate_statistics_by_range_request","fields":[{"name":"table_name","type":"string"},{"name":"select_expression","type":"string"},{"name":"column_name","type":"string"},{"name":"value_column_name","type":"string"},{"name":"stats","type":"string"},{"name":"start","type":"double"},{"name":"end","type":"double"},{"name":"interval","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_statistics_by_range_response","fields":[{"name":"stats","type":{"type":"map","values":{"type":"array","items":"double"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/unique": {
      request: '{"type":"record","name":"aggregate_unique_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_unique_response","fields":[{"name":"table_name","type":"string"},{"name":"response_schema_str","type":"string"},{"name":"binary_encoded_response","type":"bytes"},{"name":"json_encoded_response","type":"string"},{"name":"has_more_records","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/aggregate/unpivot": {
      request: '{"type":"record","name":"aggregate_unpivot_request","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"variable_column_name","type":"string"},{"name":"value_column_name","type":"string"},{"name":"pivoted_columns","type":{"type":"array","items":"string"}},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"aggregate_unpivot_response","fields":[{"name":"table_name","type":"string"},{"name":"response_schema_str","type":"string"},{"name":"binary_encoded_response","type":"bytes"},{"name":"json_encoded_response","type":"string"},{"name":"total_number_of_records","type":"long"},{"name":"has_more_records","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/backup": {
      request: '{"type":"record","name":"alter_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"datasink_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_id","type":"long"},{"name":"total_bytes","type":"long"},{"name":"total_files","type":"long"},{"name":"total_number_of_records","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/credential": {
      request: '{"type":"record","name":"alter_credential_request","fields":[{"name":"credential_name","type":"string"},{"name":"credential_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_credential_response","fields":[{"name":"credential_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/datasink": {
      request: '{"type":"record","name":"alter_datasink_request","fields":[{"name":"name","type":"string"},{"name":"datasink_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_datasink_response","fields":[{"name":"updated_properties_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/datasource": {
      request: '{"type":"record","name":"alter_datasource_request","fields":[{"name":"name","type":"string"},{"name":"datasource_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_datasource_response","fields":[{"name":"updated_properties_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/directory": {
      request: '{"type":"record","name":"alter_directory_request","fields":[{"name":"directory_name","type":"string"},{"name":"directory_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_directory_response","fields":[{"name":"directory_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/environment": {
      request: '{"type":"record","name":"alter_environment_request","fields":[{"name":"environment_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_environment_response","fields":[{"name":"environment_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/graph": {
      request: '{"type":"record","name":"alter_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"action","type":"string"},{"name":"action_arg","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_graph_response","fields":[{"name":"action","type":"string"},{"name":"action_arg","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/model": {
      request: '{"type":"record","name":"alter_model_request","fields":[{"name":"model_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_model_response","fields":[{"name":"model_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/resourcegroup": {
      request: '{"type":"record","name":"alter_resource_group_request","fields":[{"name":"name","type":"string"},{"name":"tier_attributes","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"ranking","type":"string"},{"name":"adjoining_resource_group","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_resource_group_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/role": {
      request: '{"type":"record","name":"alter_role_request","fields":[{"name":"name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_role_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/schema": {
      request: '{"type":"record","name":"alter_schema_request","fields":[{"name":"schema_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_schema_response","fields":[{"name":"schema_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/system/properties": {
      request: '{"type":"record","name":"alter_system_properties_request","fields":[{"name":"property_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_system_properties_response","fields":[{"name":"updated_properties_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/table": {
      request: '{"type":"record","name":"alter_table_request","fields":[{"name":"table_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_table_response","fields":[{"name":"table_name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"label","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/table/columns": {
      request: '{"type":"record","name":"alter_table_columns_request","fields":[{"name":"table_name","type":"string"},{"name":"column_alterations","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_table_columns_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"label","type":"string"},{"name":"column_alterations","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/table/metadata": {
      request: '{"type":"record","name":"alter_table_metadata_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"metadata_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_table_metadata_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"metadata_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/tablemonitor": {
      request: '{"type":"record","name":"alter_table_monitor_request","fields":[{"name":"topic_id","type":"string"},{"name":"monitor_updates_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_table_monitor_response","fields":[{"name":"topic_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/tier": {
      request: '{"type":"record","name":"alter_tier_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_tier_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/user": {
      request: '{"type":"record","name":"alter_user_request","fields":[{"name":"name","type":"string"},{"name":"action","type":"string"},{"name":"value","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_user_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/video": {
      request: '{"type":"record","name":"alter_video_request","fields":[{"name":"path","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_video_response","fields":[{"name":"path","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/alter/wal": {
      request: '{"type":"record","name":"alter_wal_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"alter_wal_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/append/records": {
      request: '{"type":"record","name":"append_records_request","fields":[{"name":"table_name","type":"string"},{"name":"source_table_name","type":"string"},{"name":"field_map","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"append_records_response","fields":[{"name":"table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/check/table": {
      request: '{"type":"record","name":"check_table_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"check_table_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"ids","type":{"type":"array","items":"string"}},{"name":"locations","type":{"type":"array","items":"string"}},{"name":"errors","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/clear/statistics": {
      request: '{"type":"record","name":"clear_statistics_request","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"clear_statistics_response","fields":[{"name":"table_name","type":"string"},{"name":"column_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/clear/table": {
      request: '{"type":"record","name":"clear_table_request","fields":[{"name":"table_name","type":"string"},{"name":"authorization","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"clear_table_response","fields":[{"name":"table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/clear/tablemonitor": {
      request: '{"type":"record","name":"clear_table_monitor_request","fields":[{"name":"topic_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"clear_table_monitor_response","fields":[{"name":"topic_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/clear/tables": {
      request: '{"type":"record","name":"clear_tables_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"clear_tables_response","fields":[{"name":"tables","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/clear/trigger": {
      request: '{"type":"record","name":"clear_trigger_request","fields":[{"name":"trigger_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"clear_trigger_response","fields":[{"name":"trigger_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/collect/statistics": {
      request: '{"type":"record","name":"collect_statistics_request","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"collect_statistics_response","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/backup": {
      request: '{"type":"record","name":"create_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"backup_type","type":"string"},{"name":"backup_objects_map","type":{"type":"map","values":"string"}},{"name":"datasink_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_id","type":"long"},{"name":"copied_bytes","type":"long"},{"name":"copied_files","type":"long"},{"name":"copied_records","type":"long"},{"name":"total_number_of_records","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/catalog": {
      request: '{"type":"record","name":"create_catalog_request","fields":[{"name":"name","type":"string"},{"name":"table_format","type":"string"},{"name":"location","type":"string"},{"name":"type","type":"string"},{"name":"credential","type":"string"},{"name":"datasource","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_catalog_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/container/registry": {
      request: '{"type":"record","name":"create_container_registry_request","fields":[{"name":"registry_name","type":"string"},{"name":"uri","type":"string"},{"name":"credential","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_container_registry_response","fields":[{"name":"registry_name","type":"string"},{"name":"entity_id","type":"int"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/credential": {
      request: '{"type":"record","name":"create_credential_request","fields":[{"name":"credential_name","type":"string"},{"name":"type","type":"string"},{"name":"identity","type":"string"},{"name":"secret","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_credential_response","fields":[{"name":"credential_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/datasink": {
      request: '{"type":"record","name":"create_datasink_request","fields":[{"name":"name","type":"string"},{"name":"destination","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_datasink_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/datasource": {
      request: '{"type":"record","name":"create_datasource_request","fields":[{"name":"name","type":"string"},{"name":"location","type":"string"},{"name":"user_name","type":"string"},{"name":"password","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_datasource_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/deltatable": {
      request: '{"type":"record","name":"create_delta_table_request","fields":[{"name":"delta_table_name","type":"string"},{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_delta_table_response","fields":[{"name":"delta_table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/directory": {
      request: '{"type":"record","name":"create_directory_request","fields":[{"name":"directory_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_directory_response","fields":[{"name":"directory_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/environment": {
      request: '{"type":"record","name":"create_environment_request","fields":[{"name":"environment_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_environment_response","fields":[{"name":"environment_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/graph": {
      request: '{"type":"record","name":"create_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"directed_graph","type":"boolean"},{"name":"nodes","type":{"type":"array","items":"string"}},{"name":"edges","type":{"type":"array","items":"string"}},{"name":"weights","type":{"type":"array","items":"string"}},{"name":"restrictions","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"num_nodes","type":"long"},{"name":"num_edges","type":"long"},{"name":"edges_ids","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/job": {
      request: '{"type":"record","name":"create_job_request","fields":[{"name":"endpoint","type":"string"},{"name":"request_encoding","type":"string"},{"name":"data","type":"bytes"},{"name":"data_str","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_job_response","fields":[{"name":"job_id","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/jointable": {
      request: '{"type":"record","name":"create_join_table_request","fields":[{"name":"join_table_name","type":"string"},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"expressions","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_join_table_response","fields":[{"name":"join_table_name","type":"string"},{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/materializedview": {
      request: '{"type":"record","name":"create_materialized_view_request","fields":[{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_materialized_view_response","fields":[{"name":"table_name","type":"string"},{"name":"view_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/proc": {
      request: '{"type":"record","name":"create_proc_request","fields":[{"name":"proc_name","type":"string"},{"name":"execution_mode","type":"string"},{"name":"files","type":{"type":"map","values":"bytes"}},{"name":"command","type":"string"},{"name":"args","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_proc_response","fields":[{"name":"proc_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/projection": {
      request: '{"type":"record","name":"create_projection_request","fields":[{"name":"table_name","type":"string"},{"name":"projection_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_projection_response","fields":[{"name":"projection_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/resourcegroup": {
      request: '{"type":"record","name":"create_resource_group_request","fields":[{"name":"name","type":"string"},{"name":"tier_attributes","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"ranking","type":"string"},{"name":"adjoining_resource_group","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_resource_group_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/role": {
      request: '{"type":"record","name":"create_role_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_role_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/schema": {
      request: '{"type":"record","name":"create_schema_request","fields":[{"name":"schema_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_schema_response","fields":[{"name":"schema_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/statetable": {
      request: '{"type":"record","name":"create_state_table_request","fields":[{"name":"table_name","type":"string"},{"name":"input_table_name","type":"string"},{"name":"init_table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_state_table_response","fields":[{"name":"table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/table": {
      request: '{"type":"record","name":"create_table_request","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_table_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"is_collection","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/table/external": {
      request: '{"type":"record","name":"create_table_external_request","fields":[{"name":"table_name","type":"string"},{"name":"filepaths","type":{"type":"array","items":"string"}},{"name":"modify_columns","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"create_table_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_table_external_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"type_label","type":"string"},{"name":"type_properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"count_inserted","type":"long"},{"name":"count_skipped","type":"long"},{"name":"count_updated","type":"long"},{"name":"info","type":{"type":"map","values":"string"}},{"name":"files","type":{"type":"array","items":"string"}}]}'
    },
    "/create/tablemonitor": {
      request: '{"type":"record","name":"create_table_monitor_request","fields":[{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_table_monitor_response","fields":[{"name":"topic_id","type":"string"},{"name":"table_name","type":"string"},{"name":"type_schema","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/trigger/byarea": {
      request: '{"type":"record","name":"create_trigger_by_area_request","fields":[{"name":"request_id","type":"string"},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"x_column_name","type":"string"},{"name":"x_vector","type":{"type":"array","items":"double"}},{"name":"y_column_name","type":"string"},{"name":"y_vector","type":{"type":"array","items":"double"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_trigger_by_area_response","fields":[{"name":"trigger_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/trigger/byrange": {
      request: '{"type":"record","name":"create_trigger_by_range_request","fields":[{"name":"request_id","type":"string"},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"column_name","type":"string"},{"name":"min","type":"double"},{"name":"max","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_trigger_by_range_response","fields":[{"name":"trigger_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/type": {
      request: '{"type":"record","name":"create_type_request","fields":[{"name":"type_definition","type":"string"},{"name":"label","type":"string"},{"name":"properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_type_response","fields":[{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"label","type":"string"},{"name":"properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/union": {
      request: '{"type":"record","name":"create_union_request","fields":[{"name":"table_name","type":"string"},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"input_column_names","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"output_column_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_union_response","fields":[{"name":"table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/user/external": {
      request: '{"type":"record","name":"create_user_external_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_user_external_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/user/internal": {
      request: '{"type":"record","name":"create_user_internal_request","fields":[{"name":"name","type":"string"},{"name":"password","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_user_internal_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/create/video": {
      request: '{"type":"record","name":"create_video_request","fields":[{"name":"attribute","type":"string"},{"name":"begin","type":"string"},{"name":"duration_seconds","type":"double"},{"name":"end","type":"string"},{"name":"frames_per_second","type":"double"},{"name":"style","type":"string"},{"name":"path","type":"string"},{"name":"style_parameters","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"create_video_response","fields":[{"name":"job_id","type":"long"},{"name":"path","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/directory": {
      request: '{"type":"record","name":"delete_directory_request","fields":[{"name":"directory_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_directory_response","fields":[{"name":"directory_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/files": {
      request: '{"type":"record","name":"delete_files_request","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_files_response","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/graph": {
      request: '{"type":"record","name":"delete_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/proc": {
      request: '{"type":"record","name":"delete_proc_request","fields":[{"name":"proc_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_proc_response","fields":[{"name":"proc_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/records": {
      request: '{"type":"record","name":"delete_records_request","fields":[{"name":"table_name","type":"string"},{"name":"expressions","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_records_response","fields":[{"name":"count_deleted","type":"long"},{"name":"counts_deleted","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/resourcegroup": {
      request: '{"type":"record","name":"delete_resource_group_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_resource_group_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/role": {
      request: '{"type":"record","name":"delete_role_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_role_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/delete/user": {
      request: '{"type":"record","name":"delete_user_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"delete_user_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/download/files": {
      request: '{"type":"record","name":"download_files_request","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"read_offsets","type":{"type":"array","items":"long"}},{"name":"read_lengths","type":{"type":"array","items":"long"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"download_files_response","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"file_data","type":{"type":"array","items":"bytes"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/backup": {
      request: '{"type":"record","name":"drop_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"datasink_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_names","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/catalog": {
      request: '{"type":"record","name":"drop_catalog_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_catalog_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/container/registry": {
      request: '{"type":"record","name":"drop_container_registry_request","fields":[{"name":"registry_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_container_registry_response","fields":[{"name":"registry_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/credential": {
      request: '{"type":"record","name":"drop_credential_request","fields":[{"name":"credential_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_credential_response","fields":[{"name":"credential_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/datasink": {
      request: '{"type":"record","name":"drop_datasink_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_datasink_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/datasource": {
      request: '{"type":"record","name":"drop_datasource_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_datasource_response","fields":[{"name":"name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/environment": {
      request: '{"type":"record","name":"drop_environment_request","fields":[{"name":"environment_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_environment_response","fields":[{"name":"environment_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/model": {
      request: '{"type":"record","name":"drop_model_request","fields":[{"name":"model_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_model_response","fields":[{"name":"model_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/schema": {
      request: '{"type":"record","name":"drop_schema_request","fields":[{"name":"schema_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_schema_response","fields":[{"name":"schema_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/drop/session": {
      request: '{"type":"record","name":"drop_session_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"drop_session_response","fields":[{"name":"session_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/evaluate/model": {
      request: '{"type":"record","name":"evaluate_model_request","fields":[{"name":"model_name","type":"string"},{"name":"replicas","type":"int"},{"name":"deployment_mode","type":"string"},{"name":"source_table","type":"string"},{"name":"destination_table","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"evaluate_model_response","fields":[{"name":"model_name","type":"string"},{"name":"destination_table","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/execute/proc": {
      request: '{"type":"record","name":"execute_proc_request","fields":[{"name":"proc_name","type":"string"},{"name":"params","type":{"type":"map","values":"string"}},{"name":"bin_params","type":{"type":"map","values":"bytes"}},{"name":"input_table_names","type":{"type":"array","items":"string"}},{"name":"input_column_names","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"output_table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"execute_proc_response","fields":[{"name":"run_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/execute/sql": {
      request: '{"type":"record","name":"execute_sql_request","fields":[{"name":"statement","type":"string"},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"request_schema_str","type":"string"},{"name":"data","type":{"type":"array","items":"bytes"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"execute_sql_response","fields":[{"name":"count_affected","type":"long"},{"name":"response_schema_str","type":"string"},{"name":"binary_encoded_response","type":"bytes"},{"name":"json_encoded_response","type":"string"},{"name":"total_number_of_records","type":"long"},{"name":"has_more_records","type":"boolean"},{"name":"paging_table","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/export/query/metrics": {
      request: '{"type":"record","name":"export_query_metrics_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"export_query_metrics_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/export/records/tofiles": {
      request: '{"type":"record","name":"export_records_to_files_request","fields":[{"name":"table_name","type":"string"},{"name":"filepath","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"export_records_to_files_response","fields":[{"name":"table_name","type":"string"},{"name":"count_exported","type":"long"},{"name":"count_skipped","type":"long"},{"name":"files","type":{"type":"array","items":"string"}},{"name":"last_timestamp","type":"long"},{"name":"data_text","type":{"type":"array","items":"string"}},{"name":"data_bytes","type":{"type":"array","items":"bytes"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/export/records/totable": {
      request: '{"type":"record","name":"export_records_to_table_request","fields":[{"name":"table_name","type":"string"},{"name":"remote_query","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"export_records_to_table_response","fields":[{"name":"table_name","type":"string"},{"name":"count_inserted","type":"long"},{"name":"count_skipped","type":"long"},{"name":"count_updated","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter": {
      request: '{"type":"record","name":"filter_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"expression","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byarea": {
      request: '{"type":"record","name":"filter_by_area_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"x_column_name","type":"string"},{"name":"x_vector","type":{"type":"array","items":"double"}},{"name":"y_column_name","type":"string"},{"name":"y_vector","type":{"type":"array","items":"double"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_area_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byarea/geometry": {
      request: '{"type":"record","name":"filter_by_area_geometry_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"x_vector","type":{"type":"array","items":"double"}},{"name":"y_vector","type":{"type":"array","items":"double"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_area_geometry_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/bybox": {
      request: '{"type":"record","name":"filter_by_box_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"x_column_name","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"y_column_name","type":"string"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_box_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/bybox/geometry": {
      request: '{"type":"record","name":"filter_by_box_geometry_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_box_geometry_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/bygeometry": {
      request: '{"type":"record","name":"filter_by_geometry_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"input_wkt","type":"string"},{"name":"operation","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_geometry_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/bylist": {
      request: '{"type":"record","name":"filter_by_list_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_values_map","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_list_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byradius": {
      request: '{"type":"record","name":"filter_by_radius_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"x_column_name","type":"string"},{"name":"x_center","type":"double"},{"name":"y_column_name","type":"string"},{"name":"y_center","type":"double"},{"name":"radius","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_radius_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byradius/geometry": {
      request: '{"type":"record","name":"filter_by_radius_geometry_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"x_center","type":"double"},{"name":"y_center","type":"double"},{"name":"radius","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_radius_geometry_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byrange": {
      request: '{"type":"record","name":"filter_by_range_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"lower_bound","type":"double"},{"name":"upper_bound","type":"double"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_range_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byseries": {
      request: '{"type":"record","name":"filter_by_series_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"track_id","type":"string"},{"name":"target_track_ids","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_series_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/bystring": {
      request: '{"type":"record","name":"filter_by_string_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"expression","type":"string"},{"name":"mode","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_string_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}},{"name":"stats_data","type":"bytes"}]}'
    },
    "/filter/bytable": {
      request: '{"type":"record","name":"filter_by_table_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"column_name","type":"string"},{"name":"source_table_name","type":"string"},{"name":"source_table_column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_table_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/filter/byvalue": {
      request: '{"type":"record","name":"filter_by_value_request","fields":[{"name":"table_name","type":"string"},{"name":"view_name","type":"string"},{"name":"is_string","type":"boolean"},{"name":"value","type":"double"},{"name":"value_str","type":"string"},{"name":"column_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"filter_by_value_response","fields":[{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/graph/entities": {
      request: '{"type":"record","name":"get_graph_entities_request","fields":[{"name":"graph_name","type":"string"},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_graph_entities_response","fields":[{"name":"result","type":"boolean"},{"name":"entities_int","type":{"type":"array","items":"long"}},{"name":"entities_string","type":{"type":"array","items":"string"}},{"name":"entities_double","type":{"type":"array","items":"double"}},{"name":"entities_weight","type":{"type":"array","items":"float"}},{"name":"labels","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/job": {
      request: '{"type":"record","name":"get_job_request","fields":[{"name":"job_id","type":"long"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_job_response","fields":[{"name":"endpoint","type":"string"},{"name":"job_status","type":"string"},{"name":"running","type":"boolean"},{"name":"progress","type":"int"},{"name":"successful","type":"boolean"},{"name":"response_encoding","type":"string"},{"name":"job_response","type":"bytes"},{"name":"job_response_str","type":"string"},{"name":"status_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/records": {
      request: '{"type":"record","name":"get_records_request","fields":[{"name":"table_name","type":"string"},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_records_response","fields":[{"name":"table_name","type":"string"},{"name":"type_name","type":"string"},{"name":"type_schema","type":"string"},{"name":"records_binary","type":{"type":"array","items":"bytes"}},{"name":"records_json","type":{"type":"array","items":"string"}},{"name":"total_number_of_records","type":"long"},{"name":"has_more_records","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/records/bycolumn": {
      request: '{"type":"record","name":"get_records_by_column_request","fields":[{"name":"table_name","type":"string"},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_records_by_column_response","fields":[{"name":"table_name","type":"string"},{"name":"response_schema_str","type":"string"},{"name":"binary_encoded_response","type":"bytes"},{"name":"json_encoded_response","type":"string"},{"name":"total_number_of_records","type":"long"},{"name":"has_more_records","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/records/byseries": {
      request: '{"type":"record","name":"get_records_by_series_request","fields":[{"name":"table_name","type":"string"},{"name":"world_table_name","type":"string"},{"name":"offset","type":"int"},{"name":"limit","type":"int"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_records_by_series_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"type_names","type":{"type":"array","items":"string"}},{"name":"type_schemas","type":{"type":"array","items":"string"}},{"name":"list_records_binary","type":{"type":"array","items":{"type":"array","items":"bytes"}}},{"name":"list_records_json","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/records/fromcollection": {
      request: '{"type":"record","name":"get_records_from_collection_request","fields":[{"name":"table_name","type":"string"},{"name":"offset","type":"long"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_records_from_collection_response","fields":[{"name":"table_name","type":"string"},{"name":"type_names","type":{"type":"array","items":"string"}},{"name":"records_binary","type":{"type":"array","items":"bytes"}},{"name":"records_json","type":{"type":"array","items":"string"}},{"name":"record_ids","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/get/vectortile": {
      request: '{"type":"record","name":"get_vectortile_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"column_names","type":{"type":"array","items":"string"}},{"name":"layers","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"tile_x","type":"int"},{"name":"tile_y","type":"int"},{"name":"zoom","type":"int"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"get_vectortile_response","fields":[{"name":"encoded_data","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission": {
      request: '{"type":"record","name":"grant_permission_request","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_response","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/credential": {
      request: '{"type":"record","name":"grant_permission_credential_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"credential_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_credential_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"credential_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/datasource": {
      request: '{"type":"record","name":"grant_permission_datasource_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"datasource_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_datasource_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"datasource_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/directory": {
      request: '{"type":"record","name":"grant_permission_directory_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"directory_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_directory_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"directory_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/proc": {
      request: '{"type":"record","name":"grant_permission_proc_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"proc_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_proc_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"proc_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/system": {
      request: '{"type":"record","name":"grant_permission_system_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_system_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/permission/table": {
      request: '{"type":"record","name":"grant_permission_table_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"table_name","type":"string"},{"name":"filter_expression","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_permission_table_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"table_name","type":"string"},{"name":"filter_expression","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/grant/role": {
      request: '{"type":"record","name":"grant_role_request","fields":[{"name":"role","type":"string"},{"name":"member","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"grant_role_response","fields":[{"name":"role","type":"string"},{"name":"member","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/permission": {
      request: '{"type":"record","name":"has_permission_request","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_permission_response","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"has_permission","type":"boolean"},{"name":"filters","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/proc": {
      request: '{"type":"record","name":"has_proc_request","fields":[{"name":"proc_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_proc_response","fields":[{"name":"proc_name","type":"string"},{"name":"proc_exists","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/role": {
      request: '{"type":"record","name":"has_role_request","fields":[{"name":"principal","type":"string"},{"name":"role","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_role_response","fields":[{"name":"principal","type":"string"},{"name":"role","type":"string"},{"name":"has_role","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/schema": {
      request: '{"type":"record","name":"has_schema_request","fields":[{"name":"schema_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_schema_response","fields":[{"name":"schema_name","type":"string"},{"name":"schema_exists","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/table": {
      request: '{"type":"record","name":"has_table_request","fields":[{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_table_response","fields":[{"name":"table_name","type":"string"},{"name":"table_exists","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/has/type": {
      request: '{"type":"record","name":"has_type_request","fields":[{"name":"type_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"has_type_response","fields":[{"name":"type_id","type":"string"},{"name":"type_exists","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/import/model": {
      request: '{"type":"record","name":"import_model_request","fields":[{"name":"model_name","type":"string"},{"name":"registry_name","type":"string"},{"name":"container","type":"string"},{"name":"run_function","type":"string"},{"name":"model_type","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"import_model_response","fields":[{"name":"model_name","type":"string"},{"name":"entity_id","type":"int"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/insert/records": {
      request: '{"type":"record","name":"insert_records_request","fields":[{"name":"table_name","type":"string"},{"name":"list","type":{"type":"array","items":"bytes"}},{"name":"list_str","type":{"type":"array","items":"string"}},{"name":"list_encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"insert_records_response","fields":[{"name":"record_ids","type":{"type":"array","items":"string"}},{"name":"count_inserted","type":"int"},{"name":"count_updated","type":"int"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/insert/records/fromfiles": {
      request: '{"type":"record","name":"insert_records_from_files_request","fields":[{"name":"table_name","type":"string"},{"name":"filepaths","type":{"type":"array","items":"string"}},{"name":"modify_columns","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"create_table_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"insert_records_from_files_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"type_label","type":"string"},{"name":"type_properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"count_inserted","type":"long"},{"name":"count_skipped","type":"long"},{"name":"count_updated","type":"long"},{"name":"info","type":{"type":"map","values":"string"}},{"name":"files","type":{"type":"array","items":"string"}}]}'
    },
    "/insert/records/frompayload": {
      request: '{"type":"record","name":"insert_records_from_payload_request","fields":[{"name":"table_name","type":"string"},{"name":"data_text","type":"string"},{"name":"data_bytes","type":"bytes"},{"name":"modify_columns","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"create_table_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"insert_records_from_payload_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"type_label","type":"string"},{"name":"type_properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"count_inserted","type":"long"},{"name":"count_skipped","type":"long"},{"name":"count_updated","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/insert/records/fromquery": {
      request: '{"type":"record","name":"insert_records_from_query_request","fields":[{"name":"table_name","type":"string"},{"name":"remote_query","type":"string"},{"name":"modify_columns","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"create_table_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"insert_records_from_query_response","fields":[{"name":"table_name","type":"string"},{"name":"type_id","type":"string"},{"name":"type_definition","type":"string"},{"name":"type_label","type":"string"},{"name":"type_properties","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"count_inserted","type":"long"},{"name":"count_skipped","type":"long"},{"name":"count_updated","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/insert/records/random": {
      request: '{"type":"record","name":"insert_records_random_request","fields":[{"name":"table_name","type":"string"},{"name":"count","type":"long"},{"name":"options","type":{"type":"map","values":{"type":"map","values":"double"}}}]}',
      response: '{"type":"record","name":"insert_records_random_response","fields":[{"name":"table_name","type":"string"},{"name":"count","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/insert/symbol": {
      request: '{"type":"record","name":"insert_symbol_request","fields":[{"name":"symbol_id","type":"string"},{"name":"symbol_format","type":"string"},{"name":"symbol_data","type":"bytes"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"insert_symbol_response","fields":[{"name":"symbol_id","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/kill/proc": {
      request: '{"type":"record","name":"kill_proc_request","fields":[{"name":"run_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"kill_proc_response","fields":[{"name":"run_ids","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/list/graph": {
      request: '{"type":"record","name":"list_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"list_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"graph_names","type":{"type":"array","items":"string"}},{"name":"num_nodes","type":{"type":"array","items":"long"}},{"name":"num_edges","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/lock/table": {
      request: '{"type":"record","name":"lock_table_request","fields":[{"name":"table_name","type":"string"},{"name":"lock_type","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"lock_table_response","fields":[{"name":"lock_type","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/match/graph": {
      request: '{"type":"record","name":"match_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"sample_points","type":{"type":"array","items":"string"}},{"name":"solve_method","type":"string"},{"name":"solution_table","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"match_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"match_score","type":"float"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/modify/graph": {
      request: '{"type":"record","name":"modify_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"nodes","type":{"type":"array","items":"string"}},{"name":"edges","type":{"type":"array","items":"string"}},{"name":"weights","type":{"type":"array","items":"string"}},{"name":"restrictions","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"modify_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"num_nodes","type":"long"},{"name":"num_edges","type":"long"},{"name":"edges_ids","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/query/graph": {
      request: '{"type":"record","name":"query_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"queries","type":{"type":"array","items":"string"}},{"name":"restrictions","type":{"type":"array","items":"string"}},{"name":"adjacency_table","type":"string"},{"name":"rings","type":"int"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"query_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"adjacency_list_int_array","type":{"type":"array","items":"long"}},{"name":"adjacency_list_string_array","type":{"type":"array","items":"string"}},{"name":"adjacency_list_wkt_array","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/repartition/graph": {
      request: '{"type":"record","name":"repartition_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"repartition_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/reserve/resource": {
      request: '{"type":"record","name":"reserve_resource_request","fields":[{"name":"component","type":"string"},{"name":"name","type":"string"},{"name":"action","type":"string"},{"name":"bytes_requested","type":"long"},{"name":"owner_id","type":"long"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"reserve_resource_response","fields":[{"name":"component","type":"string"},{"name":"name","type":"string"},{"name":"reservation","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/restore/backup": {
      request: '{"type":"record","name":"restore_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"restore_objects_map","type":{"type":"map","values":"string"}},{"name":"datasource_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"restore_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_id","type":"long"},{"name":"restored_bytes","type":"long"},{"name":"restored_files","type":"long"},{"name":"restored_records","type":"long"},{"name":"restored_objects","type":{"type":"map","values":"string"}},{"name":"renamed_objects","type":{"type":"map","values":"string"}},{"name":"failed_objects","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission": {
      request: '{"type":"record","name":"revoke_permission_request","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_response","fields":[{"name":"principal","type":"string"},{"name":"object","type":"string"},{"name":"object_type","type":"string"},{"name":"permission","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/credential": {
      request: '{"type":"record","name":"revoke_permission_credential_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"credential_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_credential_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"credential_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/datasource": {
      request: '{"type":"record","name":"revoke_permission_datasource_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"datasource_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_datasource_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"datasource_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/directory": {
      request: '{"type":"record","name":"revoke_permission_directory_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"directory_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_directory_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"directory_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/proc": {
      request: '{"type":"record","name":"revoke_permission_proc_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"proc_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_proc_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"proc_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/system": {
      request: '{"type":"record","name":"revoke_permission_system_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_system_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/permission/table": {
      request: '{"type":"record","name":"revoke_permission_table_request","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_permission_table_response","fields":[{"name":"name","type":"string"},{"name":"permission","type":"string"},{"name":"table_name","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/revoke/role": {
      request: '{"type":"record","name":"revoke_role_request","fields":[{"name":"role","type":"string"},{"name":"member","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"revoke_role_response","fields":[{"name":"role","type":"string"},{"name":"member","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/backup": {
      request: '{"type":"record","name":"show_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"datasource_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_description","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"backup_ids","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"backup_contents","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"deleted_backup_ids","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/container/registry": {
      request: '{"type":"record","name":"show_container_registry_request","fields":[{"name":"registry_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_container_registry_response","fields":[{"name":"registry_name","type":"string"},{"name":"registry_names","type":{"type":"array","items":"string"}},{"name":"entity_ids","type":{"type":"array","items":"int"}},{"name":"uri_list","type":{"type":"array","items":"string"}},{"name":"credential_list","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/credential": {
      request: '{"type":"record","name":"show_credential_request","fields":[{"name":"credential_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_credential_response","fields":[{"name":"credential_names","type":{"type":"array","items":"string"}},{"name":"credential_types","type":{"type":"array","items":"string"}},{"name":"credential_identities","type":{"type":"array","items":"string"}},{"name":"credentials","type":{"type":"array","items":"string"}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/datasink": {
      request: '{"type":"record","name":"show_datasink_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_datasink_response","fields":[{"name":"datasink_names","type":{"type":"array","items":"string"}},{"name":"destination_types","type":{"type":"array","items":"string"}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/datasource": {
      request: '{"type":"record","name":"show_datasource_request","fields":[{"name":"name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_datasource_response","fields":[{"name":"datasource_names","type":{"type":"array","items":"string"}},{"name":"storage_provider_types","type":{"type":"array","items":"string"}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/directories": {
      request: '{"type":"record","name":"show_directories_request","fields":[{"name":"directory_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_directories_response","fields":[{"name":"directories","type":{"type":"array","items":"string"}},{"name":"users","type":{"type":"array","items":"string"}},{"name":"creation_times","type":{"type":"array","items":"long"}},{"name":"data_usages","type":{"type":"array","items":"long"}},{"name":"data_limits","type":{"type":"array","items":"long"}},{"name":"permissions","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/environment": {
      request: '{"type":"record","name":"show_environment_request","fields":[{"name":"environment_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_environment_response","fields":[{"name":"environment_names","type":{"type":"array","items":"string"}},{"name":"packages","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/files": {
      request: '{"type":"record","name":"show_files_request","fields":[{"name":"paths","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_files_response","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"sizes","type":{"type":"array","items":"long"}},{"name":"users","type":{"type":"array","items":"string"}},{"name":"creation_times","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/functions": {
      request: '{"type":"record","name":"show_functions_request","fields":[{"name":"names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_functions_response","fields":[{"name":"function_names","type":{"type":"array","items":"string"}},{"name":"return_types","type":{"type":"array","items":"string"}},{"name":"parameters","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"optional_parameter_count","type":{"type":"array","items":"int"}},{"name":"flags","type":{"type":"array","items":"int"}},{"name":"type_schemas","type":{"type":"array","items":"string"}},{"name":"properties","type":{"type":"array","items":{"type":"map","values":{"type":"array","items":"string"}}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/graph": {
      request: '{"type":"record","name":"show_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"load","type":{"type":"array","items":"int"}},{"name":"memory","type":{"type":"array","items":"long"}},{"name":"graph_names","type":{"type":"array","items":"string"}},{"name":"graph_server_ids","type":{"type":"array","items":"int"}},{"name":"graph_owner_user_names","type":{"type":"array","items":"string"}},{"name":"graph_owner_resource_groups","type":{"type":"array","items":"string"}},{"name":"directed","type":{"type":"array","items":"boolean"}},{"name":"num_nodes","type":{"type":"array","items":"long"}},{"name":"num_edges","type":{"type":"array","items":"long"}},{"name":"num_bytes","type":{"type":"array","items":"long"}},{"name":"resource_capacity","type":{"type":"array","items":"long"}},{"name":"is_persisted","type":{"type":"array","items":"boolean"}},{"name":"is_partitioned","type":{"type":"array","items":"boolean"}},{"name":"is_sync_db","type":{"type":"array","items":"boolean"}},{"name":"has_insert_table_monitor","type":{"type":"array","items":"boolean"}},{"name":"original_request","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/graph/grammar": {
      request: '{"type":"record","name":"show_graph_grammar_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_graph_grammar_response","fields":[{"name":"result","type":"boolean"},{"name":"components_json","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/model": {
      request: '{"type":"record","name":"show_model_request","fields":[{"name":"model_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_model_response","fields":[{"name":"model_names","type":{"type":"array","items":"string"}},{"name":"entity_ids","type":{"type":"array","items":"int"}},{"name":"input_schemas","type":{"type":"array","items":"string"}},{"name":"output_schemas","type":{"type":"array","items":"string"}},{"name":"registry_list","type":{"type":"array","items":"string"}},{"name":"container_list","type":{"type":"array","items":"string"}},{"name":"run_function_list","type":{"type":"array","items":"string"}},{"name":"deployments","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/proc": {
      request: '{"type":"record","name":"show_proc_request","fields":[{"name":"proc_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_proc_response","fields":[{"name":"proc_names","type":{"type":"array","items":"string"}},{"name":"execution_modes","type":{"type":"array","items":"string"}},{"name":"files","type":{"type":"array","items":{"type":"map","values":"bytes"}}},{"name":"commands","type":{"type":"array","items":"string"}},{"name":"args","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/proc/status": {
      request: '{"type":"record","name":"show_proc_status_request","fields":[{"name":"run_id","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_proc_status_response","fields":[{"name":"proc_names","type":{"type":"map","values":"string"}},{"name":"params","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"bin_params","type":{"type":"map","values":{"type":"map","values":"bytes"}}},{"name":"input_table_names","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"input_column_names","type":{"type":"map","values":{"type":"map","values":{"type":"array","items":"string"}}}},{"name":"output_table_names","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"overall_statuses","type":{"type":"map","values":"string"}},{"name":"statuses","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"messages","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"results","type":{"type":"map","values":{"type":"map","values":{"type":"map","values":"string"}}}},{"name":"bin_results","type":{"type":"map","values":{"type":"map","values":{"type":"map","values":"bytes"}}}},{"name":"output","type":{"type":"map","values":{"type":"map","values":{"type":"map","values":{"type":"array","items":"string"}}}}},{"name":"timings","type":{"type":"map","values":{"type":"map","values":{"type":"map","values":"long"}}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/resource/objects": {
      request: '{"type":"record","name":"show_resource_objects_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_resource_objects_response","fields":[{"name":"rank_objects","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/resource/statistics": {
      request: '{"type":"record","name":"show_resource_statistics_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_resource_statistics_response","fields":[{"name":"statistics_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/resourcegroups": {
      request: '{"type":"record","name":"show_resource_groups_request","fields":[{"name":"names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_resource_groups_response","fields":[{"name":"groups","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"rank_usage","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/schema": {
      request: '{"type":"record","name":"show_schema_request","fields":[{"name":"schema_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_schema_response","fields":[{"name":"schema_name","type":"string"},{"name":"schema_names","type":{"type":"array","items":"string"}},{"name":"schema_tables","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/security": {
      request: '{"type":"record","name":"show_security_request","fields":[{"name":"names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_security_response","fields":[{"name":"types","type":{"type":"map","values":"string"}},{"name":"roles","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"permissions","type":{"type":"map","values":{"type":"array","items":{"type":"map","values":"string"}}}},{"name":"resource_groups","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/sql/proc": {
      request: '{"type":"record","name":"show_sql_proc_request","fields":[{"name":"procedure_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_sql_proc_response","fields":[{"name":"procedure_names","type":{"type":"array","items":"string"}},{"name":"procedure_definitions","type":{"type":"array","items":"string"}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/statistics": {
      request: '{"type":"record","name":"show_statistics_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_statistics_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"stastistics_map","type":{"type":"array","items":{"type":"array","items":{"type":"map","values":"string"}}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/system/properties": {
      request: '{"type":"record","name":"show_system_properties_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_system_properties_response","fields":[{"name":"property_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/system/status": {
      request: '{"type":"record","name":"show_system_status_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_system_status_response","fields":[{"name":"status_map","type":{"type":"map","values":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/system/timing": {
      request: '{"type":"record","name":"show_system_timing_request","fields":[{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_system_timing_response","fields":[{"name":"endpoints","type":{"type":"array","items":"string"}},{"name":"time_in_ms","type":{"type":"array","items":"float"}},{"name":"jobIds","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/table": {
      request: '{"type":"record","name":"show_table_request","fields":[{"name":"table_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_table_response","fields":[{"name":"table_name","type":"string"},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"table_descriptions","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"type_ids","type":{"type":"array","items":"string"}},{"name":"type_schemas","type":{"type":"array","items":"string"}},{"name":"type_labels","type":{"type":"array","items":"string"}},{"name":"properties","type":{"type":"array","items":{"type":"map","values":{"type":"array","items":"string"}}}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"sizes","type":{"type":"array","items":"long"}},{"name":"full_sizes","type":{"type":"array","items":"long"}},{"name":"join_sizes","type":{"type":"array","items":"double"}},{"name":"total_size","type":"long"},{"name":"total_full_size","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/table/metadata": {
      request: '{"type":"record","name":"show_table_metadata_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_table_metadata_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"metadata_maps","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/tablemonitors": {
      request: '{"type":"record","name":"show_table_monitors_request","fields":[{"name":"monitor_ids","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_table_monitors_response","fields":[{"name":"monitor_ids","type":{"type":"array","items":"string"}},{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"events","type":{"type":"array","items":"string"}},{"name":"increasing_columns","type":{"type":"array","items":"string"}},{"name":"filter_expressions","type":{"type":"array","items":"string"}},{"name":"join_table_names","type":{"type":"array","items":"string"}},{"name":"join_column_names","type":{"type":"array","items":"string"}},{"name":"join_expressions","type":{"type":"array","items":"string"}},{"name":"refresh_method","type":{"type":"array","items":"string"}},{"name":"refresh_period","type":{"type":"array","items":"string"}},{"name":"refresh_start_time","type":{"type":"array","items":"string"}},{"name":"datasink_names","type":{"type":"array","items":"string"}},{"name":"max_consecutive_failures","type":{"type":"array","items":"int"}},{"name":"failed_notifications_table_names","type":{"type":"array","items":"string"}},{"name":"statuses","type":{"type":"array","items":"string"}},{"name":"additional_info","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/tables/bytype": {
      request: '{"type":"record","name":"show_tables_by_type_request","fields":[{"name":"type_id","type":"string"},{"name":"label","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_tables_by_type_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/triggers": {
      request: '{"type":"record","name":"show_triggers_request","fields":[{"name":"trigger_ids","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_triggers_response","fields":[{"name":"trigger_map","type":{"type":"map","values":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/types": {
      request: '{"type":"record","name":"show_types_request","fields":[{"name":"type_id","type":"string"},{"name":"label","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_types_response","fields":[{"name":"type_ids","type":{"type":"array","items":"string"}},{"name":"type_schemas","type":{"type":"array","items":"string"}},{"name":"labels","type":{"type":"array","items":"string"}},{"name":"properties","type":{"type":"array","items":{"type":"map","values":{"type":"array","items":"string"}}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/video": {
      request: '{"type":"record","name":"show_video_request","fields":[{"name":"paths","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_video_response","fields":[{"name":"creation_times","type":{"type":"array","items":"string"}},{"name":"elapsed_render_time_seconds","type":{"type":"array","items":"long"}},{"name":"job_ids","type":{"type":"array","items":"long"}},{"name":"paths","type":{"type":"array","items":"string"}},{"name":"rendered_bytes","type":{"type":"array","items":"long"}},{"name":"rendered_frames","type":{"type":"array","items":"long"}},{"name":"rendered_percents","type":{"type":"array","items":"long"}},{"name":"requests","type":{"type":"array","items":"string"}},{"name":"status","type":{"type":"array","items":"string"}},{"name":"ttls","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/show/wal": {
      request: '{"type":"record","name":"show_wal_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"show_wal_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"sizes","type":{"type":"array","items":{"type":"array","items":"long"}}},{"name":"capacities","type":{"type":"array","items":"long"}},{"name":"uncommitted","type":{"type":"array","items":{"type":"array","items":"long"}}},{"name":"settings","type":{"type":"array","items":{"type":"map","values":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/solve/graph": {
      request: '{"type":"record","name":"solve_graph_request","fields":[{"name":"graph_name","type":"string"},{"name":"weights_on_edges","type":{"type":"array","items":"string"}},{"name":"restrictions","type":{"type":"array","items":"string"}},{"name":"solver_type","type":"string"},{"name":"source_nodes","type":{"type":"array","items":"string"}},{"name":"destination_nodes","type":{"type":"array","items":"string"}},{"name":"solution_table","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"solve_graph_response","fields":[{"name":"result","type":"boolean"},{"name":"result_per_destination_node","type":{"type":"array","items":"float"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/update/records": {
      request: '{"type":"record","name":"update_records_request","fields":[{"name":"table_name","type":"string"},{"name":"expressions","type":{"type":"array","items":"string"}},{"name":"new_values_maps","type":{"type":"array","items":{"type":"map","values":["string","null"]}}},{"name":"records_to_insert","type":{"type":"array","items":"bytes"}},{"name":"records_to_insert_str","type":{"type":"array","items":"string"}},{"name":"record_encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"update_records_response","fields":[{"name":"count_updated","type":"long"},{"name":"counts_updated","type":{"type":"array","items":"long"}},{"name":"count_inserted","type":"long"},{"name":"counts_inserted","type":{"type":"array","items":"long"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/upload/files": {
      request: '{"type":"record","name":"upload_files_request","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"file_data","type":{"type":"array","items":"bytes"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"upload_files_response","fields":[{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/upload/files/fromurl": {
      request: '{"type":"record","name":"upload_files_fromurl_request","fields":[{"name":"file_names","type":{"type":"array","items":"string"}},{"name":"urls","type":{"type":"array","items":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"upload_files_fromurl_response","fields":[{"name":"successful_file_names","type":{"type":"array","items":"string"}},{"name":"successful_urls","type":{"type":"array","items":"string"}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/verify/backup": {
      request: '{"type":"record","name":"verify_backup_request","fields":[{"name":"backup_name","type":"string"},{"name":"datasource_name","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"verify_backup_response","fields":[{"name":"backup_name","type":"string"},{"name":"backup_names","type":{"type":"array","items":"string"}},{"name":"backup_ids","type":{"type":"array","items":{"type":"array","items":"long"}}},{"name":"errors","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/getfeatureinfo": {
      request: '{"type":"record","name":"visualize_get_feature_info_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"x_column_names","type":{"type":"array","items":"string"}},{"name":"y_column_names","type":{"type":"array","items":"string"}},{"name":"geometry_column_names","type":{"type":"array","items":"string"}},{"name":"query_column_names","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"projection","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"x","type":"int"},{"name":"y","type":"int"},{"name":"radius","type":"int"},{"name":"limit","type":"long"},{"name":"encoding","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_get_feature_info_response","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"type_schemas","type":{"type":"array","items":"string"}},{"name":"records_binary","type":{"type":"array","items":"bytes"}},{"name":"records_json","type":{"type":"array","items":"string"}},{"name":"geojson_encoded_response","type":"string"},{"name":"text_encoded_response","type":"string"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image": {
      request: '{"type":"record","name":"visualize_image_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"world_table_names","type":{"type":"array","items":"string"}},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"symbol_column_name","type":"string"},{"name":"geometry_column_name","type":"string"},{"name":"track_ids","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"projection","type":"string"},{"name":"bg_color","type":"long"},{"name":"style_options","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_image_response","fields":[{"name":"width","type":"double"},{"name":"height","type":"double"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image/chart": {
      request: '{"type":"record","name":"visualize_image_chart_request","fields":[{"name":"table_name","type":"string"},{"name":"x_column_names","type":{"type":"array","items":"string"}},{"name":"y_column_names","type":{"type":"array","items":"string"}},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"bg_color","type":"string"},{"name":"style_options","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_image_chart_response","fields":[{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"bg_color","type":"string"},{"name":"image_data","type":"bytes"},{"name":"axes_info","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image/classbreak": {
      request: '{"type":"record","name":"visualize_image_classbreak_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"world_table_names","type":{"type":"array","items":"string"}},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"symbol_column_name","type":"string"},{"name":"geometry_column_name","type":"string"},{"name":"track_ids","type":{"type":"array","items":{"type":"array","items":"string"}}},{"name":"cb_attr","type":"string"},{"name":"cb_vals","type":{"type":"array","items":"string"}},{"name":"cb_pointcolor_attr","type":"string"},{"name":"cb_pointcolor_vals","type":{"type":"array","items":"string"}},{"name":"cb_pointalpha_attr","type":"string"},{"name":"cb_pointalpha_vals","type":{"type":"array","items":"string"}},{"name":"cb_pointsize_attr","type":"string"},{"name":"cb_pointsize_vals","type":{"type":"array","items":"string"}},{"name":"cb_pointshape_attr","type":"string"},{"name":"cb_pointshape_vals","type":{"type":"array","items":"string"}},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"projection","type":"string"},{"name":"bg_color","type":"long"},{"name":"style_options","type":{"type":"map","values":{"type":"array","items":"string"}}},{"name":"options","type":{"type":"map","values":"string"}},{"name":"cb_transparency_vec","type":{"type":"array","items":"int"}}]}',
      response: '{"type":"record","name":"visualize_image_classbreak_response","fields":[{"name":"width","type":"double"},{"name":"height","type":"double"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image/contour": {
      request: '{"type":"record","name":"visualize_image_contour_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"value_column_name","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"projection","type":"string"},{"name":"style_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_image_contour_response","fields":[{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"grid_data","type":"bytes"},{"name":"fill_n0","type":"double"},{"name":"fill_nn","type":"double"},{"name":"min_level","type":"double"},{"name":"max_level","type":"double"},{"name":"samples_used","type":"long"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image/heatmap": {
      request: '{"type":"record","name":"visualize_image_heatmap_request","fields":[{"name":"table_names","type":{"type":"array","items":"string"}},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"value_column_name","type":"string"},{"name":"geometry_column_name","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"projection","type":"string"},{"name":"style_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_image_heatmap_response","fields":[{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/image/labels": {
      request: '{"type":"record","name":"visualize_image_labels_request","fields":[{"name":"table_name","type":"string"},{"name":"x_column_name","type":"string"},{"name":"y_column_name","type":"string"},{"name":"x_offset","type":"string"},{"name":"y_offset","type":"string"},{"name":"text_string","type":"string"},{"name":"font","type":"string"},{"name":"text_color","type":"string"},{"name":"text_angle","type":"string"},{"name":"text_scale","type":"string"},{"name":"draw_box","type":"string"},{"name":"draw_leader","type":"string"},{"name":"line_width","type":"string"},{"name":"line_color","type":"string"},{"name":"fill_color","type":"string"},{"name":"leader_x_column_name","type":"string"},{"name":"leader_y_column_name","type":"string"},{"name":"filter","type":"string"},{"name":"min_x","type":"double"},{"name":"max_x","type":"double"},{"name":"min_y","type":"double"},{"name":"max_y","type":"double"},{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"projection","type":"string"},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_image_labels_response","fields":[{"name":"width","type":"double"},{"name":"height","type":"double"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"info","type":{"type":"map","values":"string"}}]}'
    },
    "/visualize/isochrone": {
      request: '{"type":"record","name":"visualize_isochrone_request","fields":[{"name":"graph_name","type":"string"},{"name":"source_node","type":"string"},{"name":"max_solution_radius","type":"double"},{"name":"weights_on_edges","type":{"type":"array","items":"string"}},{"name":"restrictions","type":{"type":"array","items":"string"}},{"name":"num_levels","type":"int"},{"name":"generate_image","type":"boolean"},{"name":"levels_table","type":"string"},{"name":"style_options","type":{"type":"map","values":"string"}},{"name":"solve_options","type":{"type":"map","values":"string"}},{"name":"contour_options","type":{"type":"map","values":"string"}},{"name":"options","type":{"type":"map","values":"string"}}]}',
      response: '{"type":"record","name":"visualize_isochrone_response","fields":[{"name":"width","type":"int"},{"name":"height","type":"int"},{"name":"bg_color","type":"long"},{"name":"image_data","type":"bytes"},{"name":"info","type":{"type":"map","values":"string"}},{"name":"solve_info","type":{"type":"map","values":"string"}},{"name":"contour_info","type":{"type":"map","values":"string"}}]}'
    }
  };
  var JSON_ONLY_ENDPOINTS = /* @__PURE__ */ new Set([
    "/create/job",
    "/create/proc",
    "/download/files",
    "/execute/proc",
    "/export/records/tofiles",
    "/filter/bystring",
    "/get/job",
    "/insert/records/frompayload",
    "/insert/symbol",
    "/show/proc",
    "/show/proc/status",
    "/upload/files",
    "/visualize/getfeatureinfo",
    "/visualize/image",
    "/visualize/image/chart",
    "/visualize/image/classbreak",
    "/visualize/image/contour",
    "/visualize/image/heatmap",
    "/visualize/image/labels",
    "/visualize/isochrone"
  ]);
  var BINARY_RECORD_ENDPOINTS = /* @__PURE__ */ new Set([
    "/aggregate/groupby",
    "/aggregate/unique",
    "/aggregate/unpivot",
    "/execute/sql",
    "/get/records",
    "/get/records/bycolumn",
    "/insert/records",
    "/update/records"
  ]);

  // dist/browser/GPUdb.js
  var END_OF_SET = -9999;
  function toError(err) {
    if (!(err instanceof Error)) {
      return new Error(String(err));
    }
    const parts = err.errors;
    if (err.message !== "" || !Array.isArray(parts) || parts.length === 0) {
      return err;
    }
    const joined = parts.map((part) => part instanceof Error ? part.message : String(part)).filter((message) => message !== "").join("; ");
    if (joined === "") {
      return err;
    }
    const flattened = new Error(joined);
    flattened.cause = err;
    const code = err.code;
    if (code !== void 0) {
      flattened.code = code;
    }
    return flattened;
  }
  __name(toError, "toError");
  var WMS_EXCEPTION_CONTENT_TYPES = [
    "application/vnd.ogc.se_xml",
    "application/se_xml",
    "text/xml",
    "application/xml"
  ];
  function isWmsExceptionBody(headers) {
    const contentType = (headers["content-type"] ?? "").toLowerCase();
    return WMS_EXCEPTION_CONTENT_TYPES.some((type) => contentType.indexOf(type) !== -1);
  }
  __name(isWmsExceptionBody, "isWmsExceptionBody");
  var AVRO_CONTENT_TYPE = "application/octet-stream";
  var RESPONSE_ENVELOPE_SCHEMA = '{"type":"record","name":"gpudb_response","fields":[{"name":"status","type":"string"},{"name":"message","type":"string"},{"name":"data_type","type":"string"},{"name":"data","type":"bytes"},{"name":"data_str","type":"string"}]}';
  function avroContext(err, context) {
    if (!(err instanceof AvroError)) {
      return err;
    }
    const wrapped = new AvroError(`${context}: ${err.message}`);
    wrapped.path.push(...err.path);
    return wrapped;
  }
  __name(avroContext, "avroContext");
  var DEFAULT_SYNC = false;
  function setDefaultSync(value) {
    DEFAULT_SYNC = value;
  }
  __name(setDefaultSync, "setDefaultSync");
  var GPUdb = class _GPUdb {
    static {
      __name(this, "GPUdb");
    }
    /**
     * Normalizes the `ha_failover_order` option, defaulting to sequential.
     *
     * The value is lowercased before validation, so a JavaScript caller
     * passing `'RANDOM'` is still accepted as it was by the JavaScript API.
     */
    static parseHaFailoverOrder(options) {
      const supplied = options?.ha_failover_order;
      if (supplied === void 0 || supplied === null) {
        return _GPUdb.HA_FAILOVER_ORDER.SEQUENTIAL;
      }
      const order = String(supplied).toLowerCase();
      if (order !== _GPUdb.HA_FAILOVER_ORDER.SEQUENTIAL && order !== _GPUdb.HA_FAILOVER_ORDER.RANDOM) {
        throw new Error(`Invalid 'ha_failover_order' option: '${supplied}'; must be '${_GPUdb.HA_FAILOVER_ORDER.SEQUENTIAL}' or '${_GPUdb.HA_FAILOVER_ORDER.RANDOM}'.`);
      }
      return order;
    }
    /**
     * Normalizes the `encoding` option, defaulting to JSON. Case-insensitive,
     * so the Python API's `'BINARY'` is accepted too.
     */
    static parseEncoding(options) {
      const supplied = options?.encoding;
      if (supplied === void 0 || supplied === null) {
        return _GPUdb.ENCODING.JSON;
      }
      const encoding = String(supplied).toLowerCase();
      if (encoding !== _GPUdb.ENCODING.JSON && encoding !== _GPUdb.ENCODING.BINARY) {
        throw new Error(`Invalid 'encoding' option: '${supplied}'; must be '${_GPUdb.ENCODING.JSON}' or '${_GPUdb.ENCODING.BINARY}'.`);
      }
      return encoding;
    }
    /**
     * Copies the URL list into the configured order. Sequential keeps the
     * caller's order; random shuffles it.
     */
    static orderUrls(items, order) {
      const ordered = items.slice();
      if (order === _GPUdb.HA_FAILOVER_ORDER.RANDOM) {
        for (let i = ordered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        }
      }
      return ordered;
    }
    /**
     * Whether a server message names a recoverable condition, and so should
     * fail over rather than being returned to the caller.
     */
    static isFailoverMessage(message) {
      if (message === void 0 || message === null) {
        return false;
      }
      const text = String(message);
      return _GPUdb.FAILOVER_TRIGGER_MESSAGES.some((trigger) => text.includes(trigger));
    }
    /**
     * Whether a response body is empty. Nothing where a parseable response was
     * expected means the cluster did not serve the request, so another may.
     */
    static isEmptyBody(body) {
      return body === void 0 || body === null || String(body).trim() === "";
    }
    /**
     * Creates a new GPUdb client instance.
     *
     * @param url - URL or array of URLs for the Kinetica server(s)
     * @param options - Configuration options
     */
    constructor(url, options = {}) {
      this.tableTypes = /* @__PURE__ */ new Map();
      this.protectedHeaders = [
        "Accept",
        "Authorization",
        "Content-Type",
        "X-Kinetica-Group"
      ];
      const urls = (Array.isArray(url) ? url : [url]).map((one) => one.replace(/\/+$/, ""));
      for (const one of urls) {
        const protocol = _GPUdb.parseServerUrl(one).protocol;
        if (protocol !== "http:" && protocol !== "https:") {
          throw new Error(`Invalid URL specified: '${one}'; expected http:// or https://`);
        }
      }
      this.ha_failover_order = _GPUdb.parseHaFailoverOrder(options);
      this.urls = new RingList(_GPUdb.orderUrls(urls, this.ha_failover_order));
      this.username = options.username ?? "";
      this.password = options.password ?? "";
      this.oauthToken = options.oauth_token ?? "";
      this.timeout = options.timeout ?? 0;
      this.jobTimeout = options.job_timeout ?? 0;
      this.jobEndpoints = _GPUdb.resolveJobEndpoints(options.job_endpoints);
      this.maxResponseBytes = options.max_response_bytes ?? 0;
      this.customHeaders = options.headers ?? {};
      this.clientName = options.client_name ?? "";
      this.clientVersion = options.client_version ?? "";
      this.getCookie = options.getCookie;
      this.setCookie = options.setCookie;
      this.sync = options.sync ?? DEFAULT_SYNC;
      this.force_infinity_nan_conversion_to_null = options.force_infinity_nan_conversion_to_null ?? false;
      this.encoding = _GPUdb.parseEncoding(options);
      if (this.oauthToken) {
        this.authorization = `Bearer ${this.oauthToken}`;
      } else if (this.username || this.password) {
        this.authorization = `Basic ${base64Encode(`${this.username}:${this.password}`)}`;
      } else {
        this.authorization = "";
      }
      this.transport = options.transport ?? createTransport();
    }
    /**
     * Gets the current server URL.
     */
    get url() {
      return this.urls.getCurrentItem();
    }
    /**
     * The protocol of the current server URL, with its colon: `"http:"` or
     * `"https:"`. Like {@link hostname}, {@link port} and {@link pathname},
     * this matches the JavaScript API's property of the same name, which
     * existing code reads.
     */
    get protocol() {
      return _GPUdb.parseServerUrl(this.url).protocol;
    }
    /**
     * The host name of the current server URL, lower-cased and without its
     * port; an IPv6 address without its brackets.
     */
    get hostname() {
      return _GPUdb.parseServerUrl(this.url).hostname;
    }
    /**
     * The port of the current server URL as written in it -- a string, such
     * as `"9191"` -- or null when the URL names none.
     */
    get port() {
      return _GPUdb.parseServerUrl(this.url).port;
    }
    /**
     * The path of the current server URL, without a trailing slash: `""` for
     * `http://host:9191`, `"/gpudb-0"` behind a reverse proxy.
     */
    get pathname() {
      return _GPUdb.parseServerUrl(this.url).pathname;
    }
    /**
     * Splits a server URL into the parts the JavaScript API exposed, matching
     * what its Node.js build got from url.parse(): the protocol lower-cased
     * with its colon, credentials dropped, an explicit port kept even when it
     * is the default (`http://host:80` gives `"80"`, which WHATWG URL would
     * normalise away), IPv6 brackets removed, and no query or fragment.
     */
    static parseServerUrl(url) {
      const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)/i.exec(url);
      if (!match) {
        return { protocol: "", hostname: "", port: null, pathname: "" };
      }
      const authority = match[2].slice(match[2].lastIndexOf("@") + 1);
      const bracketed = /^\[([^\]]*)\](?::(\d*))?$/.exec(authority);
      let hostname;
      let port;
      if (bracketed) {
        hostname = bracketed[1];
        port = bracketed[2] || null;
      } else {
        const colon = authority.lastIndexOf(":");
        hostname = colon < 0 ? authority : authority.slice(0, colon);
        port = colon < 0 ? null : authority.slice(colon + 1) || null;
      }
      return {
        protocol: match[1].toLowerCase() + ":",
        hostname: hostname.toLowerCase(),
        port,
        pathname: match[3].replace(/\/+$/, "")
      };
    }
    /**
     * Adds a custom HTTP header.
     */
    addHttpHeader(header, value) {
      if (!header || typeof header !== "string") {
        throw new Error("Header must be a non-empty string");
      }
      if (this.protectedHeaders.includes(header)) {
        throw new Error(`Cannot override protected header: ${header}`);
      }
      this.customHeaders[header] = value;
    }
    /**
     * Removes a custom HTTP header.
     */
    removeHttpHeader(header) {
      if (this.protectedHeaders.includes(header)) {
        throw new Error(`Cannot remove protected header: ${header}`);
      }
      delete this.customHeaders[header];
    }
    /**
     * Gets all custom HTTP headers.
     */
    getHttpHeaders() {
      return { ...this.customHeaders };
    }
    /**
     * Adds a custom HTTP header.
     *
     * Alias of {@link GPUdb.addHttpHeader}, under the name the JavaScript API
     * uses.
     */
    add_http_header(header, value) {
      this.addHttpHeader(header, value);
    }
    /**
     * Removes a custom HTTP header.
     *
     * Alias of {@link GPUdb.removeHttpHeader}, under the name the JavaScript
     * API uses.
     */
    remove_http_header(header) {
      this.removeHttpHeader(header);
    }
    /**
     * Gets all custom HTTP headers.
     *
     * Alias of {@link GPUdb.getHttpHeaders}, under the name the JavaScript API
     * uses.
     */
    get_http_headers() {
      return this.getHttpHeaders();
    }
    /**
     * Encodes data for transmission.
     */
    encode(data) {
      return encode(data);
    }
    /**
     * Decodes received data.
     *
     * Routes through the null-converting decoder when
     * `force_infinity_nan_conversion_to_null` is set, matching the JavaScript
     * API's GPUdb.prototype.decode.
     */
    decode(data) {
      return this.force_infinity_nan_conversion_to_null ? decodeNoInfNan(data) : decode(data);
    }
    /**
     * Unwraps the payload from a Kinetica response envelope.
     *
     * `data_str` is parsed as-is. Kinetica sends Infinity, -Infinity and NaN
     * as quoted JSON strings, so the payload is always valid JSON and needs no
     * fix-up. To turn those strings into null, construct the client with
     * `force_infinity_nan_conversion_to_null`.
     */
    unwrapResponse(body, headers) {
      let envelope;
      try {
        envelope = JSON.parse(body);
      } catch (err) {
        throw new Error(`Unable to parse response: ${err}`);
      }
      if (envelope.status !== "OK") {
        throw new Error(envelope.message || "Request failed");
      }
      if (typeof envelope.data_str === "string") {
        try {
          return this.attachRequestTime(JSON.parse(envelope.data_str), headers);
        } catch (err) {
          throw new Error(`Unable to parse response: ${err}`);
        }
      }
      if (envelope.data !== void 0 && envelope.data !== null) {
        return this.attachRequestTime(envelope.data, headers);
      }
      throw new Error("Unable to parse response: no payload returned");
    }
    /**
     * Attaches the server's reported request time to a decoded payload, the
     * way the JavaScript API does. Callers that time their queries read it off
     * the response; dropping it silently would break them on migration.
     *
     * Only objects can carry it -- a payload that decoded to a primitive is
     * returned untouched.
     */
    attachRequestTime(payload, headers) {
      const reported = headers?.["x-request-time-secs"];
      if (reported !== void 0 && payload !== null && typeof payload === "object") {
        payload.request_time_secs = Number(reported);
      }
      return payload;
    }
    /**
     * Whether a request to this endpoint is sent as Avro. Not when it runs as
     * a job: the job carries its request as JSON text.
     */
    usesBinary(endpoint) {
      return this.encoding === _GPUdb.ENCODING.BINARY && Object.prototype.hasOwnProperty.call(ENDPOINT_SCHEMAS, endpoint) && !JSON_ONLY_ENDPOINTS.has(endpoint) && this.jobEndpoints.indexOf(endpoint) === -1;
    }
    /**
     * The record encoding to request from an endpoint: 'binary' when this
     * client can encode or decode its records as Avro, 'json' otherwise.
     */
    recordEncoding(endpoint) {
      return this.usesBinary(endpoint) && BINARY_RECORD_ENDPOINTS.has(endpoint) ? _GPUdb.ENCODING.BINARY : _GPUdb.ENCODING.JSON;
    }
    /** Encodes a request body as JSON, or as Avro for a binary endpoint. */
    encodeRequest(endpoint, request) {
      if (!this.usesBinary(endpoint)) {
        return JSON.stringify(request);
      }
      try {
        return AvroType.forSchema(ENDPOINT_SCHEMAS[endpoint].request).encode(request);
      } catch (err) {
        throw avroContext(err, `Invalid ${endpoint} request`);
      }
    }
    /**
     * Unwraps the payload from an Avro response envelope: the binary
     * counterpart of unwrapResponse.
     */
    unwrapBinaryResponse(endpoint, response) {
      if (response.bytes === void 0) {
        return this.unwrapResponse(response.body, response.headers);
      }
      const bytes = response.bytes;
      const contentType = (response.headers["content-type"] ?? "").toLowerCase();
      if (contentType.indexOf("json") !== -1) {
        return this.unwrapResponse(new TextDecoder().decode(bytes), response.headers);
      }
      let envelope;
      try {
        _GPUdb.envelopeType ?? (_GPUdb.envelopeType = AvroType.forSchema(RESPONSE_ENVELOPE_SCHEMA));
        envelope = _GPUdb.envelopeType.decode(bytes);
      } catch (err) {
        throw new Error(`Unable to parse response: ${err instanceof Error ? err.message : err}`);
      }
      if (envelope.status !== "OK") {
        throw new Error(envelope.message || "Request failed");
      }
      if (envelope.data_type === "none") {
        return this.attachRequestTime({}, response.headers);
      }
      let payload;
      try {
        payload = AvroType.forSchema(ENDPOINT_SCHEMAS[endpoint].response).decode(envelope.data);
      } catch (err) {
        throw new Error(`Unable to parse response: ${err instanceof Error ? err.message : err}. Check that the client and server versions match.`);
      }
      return this.attachRequestTime(payload, response.headers);
    }
    /**
     * Decodes the records of a response, from whichever of its record fields
     * the server filled, and removes the encoded copies.
     *
     * Avro records are decoded with the type schema sent alongside them. A
     * binary field holding anything but bytes -- the server's reply to an
     * explicit `encoding: 'binary'` over a JSON request -- is left alone, as
     * it always was.
     */
    decodeRecords(response, jsonField, binaryField, schemaField) {
      const encoded = response[binaryField];
      if (Array.isArray(encoded) && encoded.length > 0 && encoded[0] instanceof Uint8Array) {
        let records2;
        try {
          const type = AvroType.forSchema(response[schemaField]);
          records2 = encoded.map((bytes) => type.decode(bytes));
        } catch (err) {
          throw avroContext(err, "Unable to decode records");
        }
        if (this.force_infinity_nan_conversion_to_null) {
          for (const record of records2) {
            for (const key of Object.keys(record)) {
              const value = record[key];
              if (typeof value === "number" && !Number.isFinite(value)) {
                record[key] = null;
              }
            }
          }
        }
        delete response[binaryField];
        delete response[jsonField];
        return records2;
      }
      const records = this.decode(response[jsonField] ?? []);
      delete response[jsonField];
      return records;
    }
    /**
     * Decodes the column-major payload of a dynamic-schema endpoint, such as
     * execute_sql, from whichever of its fields the server filled, and
     * removes the encoded copies.
     *
     * Avro data is decoded with the schema the server sends alongside it
     * (`response_schema_str`), into the same shape the JSON encoding gives.
     */
    decodeDynamic(response, jsonField, binaryField, schemaField) {
      const encoded = response[binaryField];
      if (encoded instanceof Uint8Array && encoded.length > 0) {
        let data2;
        try {
          data2 = AvroType.forSchema(response[schemaField]).decode(encoded);
        } catch (err) {
          throw avroContext(err, "Unable to decode the response data");
        }
        if (this.force_infinity_nan_conversion_to_null) {
          for (const key of Object.keys(data2)) {
            const column = data2[key];
            if (key.startsWith("column_") && Array.isArray(column)) {
              for (let i = 0; i < column.length; i++) {
                if (typeof column[i] === "number" && !Number.isFinite(column[i])) {
                  column[i] = null;
                }
              }
            }
          }
        }
        delete response[binaryField];
        delete response[jsonField];
        return data2;
      }
      const data = this.decode(response[jsonField]);
      delete response[jsonField];
      return data;
    }
    /**
     * Forgets the cached type of one table, or of every table.
     *
     * A client using binary encoding looks a table's type up on its first
     * insert into that table and reuses it for later ones. A failed insert
     * drops the table's entry by itself. Call this after altering a table's
     * columns, so the next insert is not encoded in the old layout.
     *
     * @param table_name - The table to forget; every table when omitted
     */
    clear_type_cache(table_name) {
      if (table_name === void 0) {
        this.tableTypes.clear();
      } else {
        this.tableTypes.delete(table_name);
      }
    }
    /** The Avro type of a table, from its show_table response. */
    static tableTypeFrom(tableName, response) {
      const schemas = response.type_schemas ?? [];
      if (schemas.length === 0) {
        throw new Error(`Table ${tableName} does not exist.`);
      }
      if (schemas.some((schema) => schema !== schemas[0])) {
        throw new Error(`${tableName} is not a single table; its members differ in type.`);
      }
      return AvroType.forSchema(schemas[0]);
    }
    /** Whether submitRequest would block for this endpoint. */
    blocks(endpoint, wantsCallback) {
      return this.sync && !wantsCallback && !!this.transport.requestSync && this.jobEndpoints.indexOf(endpoint) === -1;
    }
    /**
     * Submits a request that carries records, encoding them as Avro when the
     * request asks for binary and this client can, and as JSON otherwise.
     *
     * Avro needs the table's type, which comes from the cache or from one
     * show_table call. Any failure drops the cached type, so a table whose
     * columns changed is looked up afresh on the next insert.
     */
    submitRecords(endpoint, request, tableName, records, fields, wantsCallback) {
      const presupplied = request[fields.binary];
      const binary = request[fields.encoding] === _GPUdb.ENCODING.BINARY && this.usesBinary(endpoint) && BINARY_RECORD_ENDPOINTS.has(endpoint) && Array.isArray(records) && records.length > 0 && !(Array.isArray(presupplied) && presupplied.length > 0);
      if (!binary) {
        if (records) {
          request[fields.json] = encode(records);
        }
        return this.submitRequest(endpoint, request, wantsCallback);
      }
      const encodeInto = /* @__PURE__ */ __name((type) => {
        request[fields.binary] = records.map((record, index) => {
          try {
            return type.encode(record);
          } catch (err) {
            throw avroContext(err, `Record ${index} does not match the type of table ${tableName}`);
          }
        });
        request[fields.json] = [];
      }, "encodeInto");
      const showTable = { table_name: tableName, options: {} };
      if (this.blocks(endpoint, wantsCallback)) {
        try {
          let type = this.tableTypes.get(tableName);
          if (type === void 0) {
            const shown = this.submitRequest("/show/table", showTable, false);
            type = _GPUdb.tableTypeFrom(tableName, shown);
            this.tableTypes.set(tableName, type);
          }
          encodeInto(type);
          return this.submitRequest(endpoint, request, wantsCallback);
        } catch (err) {
          this.tableTypes.delete(tableName);
          throw err;
        }
      }
      return (async () => {
        try {
          let type = this.tableTypes.get(tableName);
          if (type === void 0) {
            const shown = await this.submitRequest("/show/table", showTable, true);
            type = _GPUdb.tableTypeFrom(tableName, shown);
            this.tableTypes.set(tableName, type);
          }
          encodeInto(type);
          return await this.submitRequest(endpoint, request, wantsCallback);
        } catch (err) {
          this.tableTypes.delete(tableName);
          throw err;
        }
      })();
    }
    /**
     * Builds the User-Agent header, cached after the first call.
     *
     * Node.js only: browsers forbid setting User-Agent, and `fetch` drops it.
     * Format matches the other Kinetica APIs:
     *   [client/version ]kinetica-api-nodejs/<ver> (Node.js/x; os/rel; arch)
     */
    async buildUserAgent() {
      if (this.userAgent !== void 0) {
        return this.userAgent || void 0;
      }
      if (typeof process === "undefined" || !process.versions?.node) {
        this.userAgent = "";
        return void 0;
      }
      let release = "";
      try {
        const os = await Promise.resolve().then(() => __toESM(require_os()));
        release = os.release();
      } catch {
      }
      const platform = `${process.platform}/${release}`;
      let agent = `kinetica-api-nodejs/${_GPUdb.api_version} (Node.js/${process.version.slice(1)}; ${platform}; ${process.arch})`;
      if (this.clientName && this.clientVersion) {
        agent = `${_GPUdb.sanitizeUaToken(this.clientName)}/${_GPUdb.sanitizeUaToken(this.clientVersion)} ${agent}`;
      }
      this.userAgent = agent;
      return agent;
    }
    /** Strips characters that do not belong in a User-Agent token. */
    static sanitizeUaToken(value) {
      return value.replace(/[^\w.\-/ ]/g, "_");
    }
    /**
     * Headers common to every request, minus the User-Agent, which needs an
     * async import under Node and is forbidden in browsers anyway.
     */
    buildHeadersSync(extra) {
      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...this.customHeaders,
        ...extra ?? {}
      };
      if (this.authorization) {
        headers["Authorization"] = this.authorization;
      }
      if (this.getCookie) {
        const cookie = this.getCookie();
        if (cookie) {
          headers["Cookie"] = cookie;
        }
      }
      return headers;
    }
    /** Headers common to every request this client sends. */
    async buildHeaders(extra) {
      const headers = this.buildHeadersSync(extra);
      const agent = await this.buildUserAgent();
      if (agent) {
        headers["User-Agent"] = agent;
      }
      return headers;
    }
    /** Applies a transform to a result that may be a value or a promise. */
    afterResponse(result, transform) {
      if (result && typeof result.then === "function") {
        return result.then(transform);
      }
      return transform(result);
    }
    /** Hands the outcome to a callback, for either flavour of result. */
    notify(result, callback) {
      if (!callback) {
        return;
      }
      if (result && typeof result.then === "function") {
        result.then((value) => callback(null, value), (error) => callback(error, null));
      } else {
        callback(null, result);
      }
    }
    /** Hands any Set-Cookie back to the caller's cookie jar. */
    captureCookie(response) {
      if (this.setCookie) {
        this.setCookie(response.headers["set-cookie"]);
      }
    }
    /**
     * Turns the `job_endpoints` option into the list this client wraps.
     *
     * Copied rather than aliased so a caller mutating the array they passed --
     * or DEFAULT_JOB_ENDPOINTS -- cannot change a live client's behaviour.
     */
    static resolveJobEndpoints(option) {
      if (option === true) {
        return _GPUdb.DEFAULT_JOB_ENDPOINTS.slice();
      }
      if (Array.isArray(option)) {
        return option.slice();
      }
      return [];
    }
    /**
     * Submits a request to the server.
     *
     * If more than one URL was given to the constructor, a request that fails
     * at the transport level (connection refused, timeout, unexpected HTTP
     * status) is retried against the next URL in the ring until every URL has
     * been tried. Errors reported by the server itself are returned to the
     * caller immediately, without failing over.
     *
     * Endpoints that can run long -- /alter/table and /alter/table/columns --
     * are submitted as jobs instead, so the HTTP request does not have to stay
     * open for the duration.
     */
    submitRequest(endpoint, request, wantsCallback = false) {
      if (this.blocks(endpoint, wantsCallback)) {
        return this.submitRequestSync(endpoint, request);
      }
      return this.submitRequestAsync(endpoint, request);
    }
    /** Blocking counterpart of submitRequestAsync, for legacy browser code. */
    submitRequestSync(endpoint, request) {
      const binary = this.usesBinary(endpoint);
      const headers = this.buildHeadersSync(binary ? _GPUdb.AVRO_HEADERS : void 0);
      const body = this.encodeRequest(endpoint, request);
      const initialUrl = this.urls.getCurrentItem();
      let lastError = new Error("Request failed");
      do {
        const url = this.urls.getCurrentItem();
        let response;
        try {
          response = this.transport.requestSync({
            method: "POST",
            url: url + endpoint,
            headers,
            ...typeof body === "string" ? { body } : { bytes: body, responseType: "binary" },
            timeout: this.timeout,
            maxResponseBytes: this.maxResponseBytes
          });
        } catch (err) {
          if (err instanceof ResponseTooLargeError) {
            throw err;
          }
          lastError = toError(err);
          continue;
        }
        this.captureCookie(response);
        if (response.status !== 200 && response.status !== 400) {
          lastError = new Error(`Request failed with HTTP ${response.status} (${response.statusText})`);
          continue;
        }
        if (binary && response.bytes !== void 0 ? response.bytes.length === 0 : _GPUdb.isEmptyBody(response.body)) {
          lastError = new Error("Empty response from server");
          continue;
        }
        try {
          return binary ? this.unwrapBinaryResponse(endpoint, response) : this.unwrapResponse(response.body, response.headers);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!_GPUdb.isFailoverMessage(message)) {
            throw err;
          }
          lastError = err instanceof Error ? err : new Error(message);
          continue;
        }
      } while (this.urls.next() !== initialUrl);
      throw lastError;
    }
    async submitRequestAsync(endpoint, request) {
      if (this.jobEndpoints.indexOf(endpoint) !== -1) {
        return this.submitJobRequest(endpoint, request);
      }
      const binary = this.usesBinary(endpoint);
      const headers = await this.buildHeaders(binary ? _GPUdb.AVRO_HEADERS : void 0);
      const body = this.encodeRequest(endpoint, request);
      const initialUrl = this.urls.getCurrentItem();
      let lastError = new Error("Request failed");
      do {
        const url = this.urls.getCurrentItem();
        let response;
        try {
          response = await this.transport.request({
            method: "POST",
            url: url + endpoint,
            headers,
            ...typeof body === "string" ? { body } : { bytes: body, responseType: "binary" },
            timeout: this.timeout,
            maxResponseBytes: this.maxResponseBytes
          });
        } catch (err) {
          if (err instanceof ResponseTooLargeError) {
            throw err;
          }
          lastError = toError(err);
          continue;
        }
        this.captureCookie(response);
        if (response.status !== 200 && response.status !== 400) {
          lastError = new Error(`Request failed with HTTP ${response.status} (${response.statusText})`);
          continue;
        }
        if (binary && response.bytes !== void 0 ? response.bytes.length === 0 : _GPUdb.isEmptyBody(response.body)) {
          lastError = new Error("Empty response from server");
          continue;
        }
        try {
          return binary ? this.unwrapBinaryResponse(endpoint, response) : this.unwrapResponse(response.body, response.headers);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!_GPUdb.isFailoverMessage(message)) {
            throw err;
          }
          lastError = err instanceof Error ? err : new Error(message);
          continue;
        }
      } while (this.urls.next() !== initialUrl);
      throw lastError;
    }
    /**
     * Runs an endpoint as a job: /create/job, then /get/job until it finishes.
     *
     * Long-running operations would otherwise hold an HTTP request open for
     * their whole duration, which proxies and load balancers cut short.
     */
    async submitJobRequest(endpoint, request) {
      const created = await this.create_job(endpoint, "json", "", JSON.stringify(request), {});
      const deadline = this.jobTimeout > 0 ? Date.now() + this.jobTimeout : 0;
      for (; ; ) {
        const job = await this.get_job(created.job_id, {});
        if (job.successful) {
          try {
            return JSON.parse(job.job_response_str);
          } catch (err) {
            throw new Error(`Unable to parse response: ${err}`);
          }
        }
        if (!job.running) {
          if (job.job_status === "ERROR") {
            throw new Error(`Error during job execution: ${job.status_map?.error_message ?? ""}`);
          }
          if (job.job_status === "CANCELLED") {
            throw new Error("Job was cancelled.");
          }
          throw new Error(`Unknown status: ${job.job_status}`);
        }
        if (deadline > 0 && Date.now() + _GPUdb.JOB_POLL_INTERVAL >= deadline) {
          throw new Error(`Job ${created.job_id} for ${endpoint} did not finish within ${this.jobTimeout} ms and is still running on the server.`);
        }
        await new Promise((resolve) => setTimeout(resolve, _GPUdb.JOB_POLL_INTERVAL));
      }
    }
    /**
     * Requests a map image from the WMS endpoint.
     *
     * Returns the raw image bytes rather than JSON, with the server's reported
     * request time attached as `request_time_secs` -- the same shape the
     * JavaScript API returns. Fails over across URLs like any other request.
     *
     * @param request - WMS parameters, sent as the query string
     * @param callback - Optional callback function
     * @returns Promise resolving to the image bytes
     *
     * @example
     * ```typescript
     * const image = await gpudb.wms_request({
     *     request: 'GetMap', width: 512, height: 512,
     *     bbox: '-180,-90,180,90', layers: 'my_table'
     * });
     * fs.writeFileSync('map.png', image);
     * ```
     */
    async wms_request(request, callback) {
      if (callback) {
        try {
          const result = await this.wms_request(request);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(request ?? {})) {
        query.append(key, String(value));
      }
      const headers = await this.buildHeaders({ "Accept": "image/*" });
      const initialUrl = this.urls.getCurrentItem();
      let lastError = new Error("Request failed");
      do {
        const url = this.urls.getCurrentItem();
        let response;
        try {
          response = await this.transport.request({
            method: "GET",
            url: `${url}/wms?${query.toString()}`,
            headers,
            timeout: this.timeout,
            maxResponseBytes: this.maxResponseBytes,
            responseType: "binary"
          });
        } catch (err) {
          if (err instanceof ResponseTooLargeError) {
            throw err;
          }
          lastError = toError(err);
          continue;
        }
        this.captureCookie(response);
        const isWmsException = response.status === 400 && isWmsExceptionBody(response.headers);
        if (response.status !== 200 && !isWmsException) {
          lastError = new Error(`Request failed with HTTP ${response.status} (${response.statusText})`);
          continue;
        }
        const image = response.bytes ?? new Uint8Array();
        const reportedTime = response.headers["x-request-time-secs"];
        if (reportedTime !== void 0) {
          image.request_time_secs = Number(reportedTime);
        }
        return image;
      } while (this.urls.next() !== initialUrl);
      throw lastError;
    }
    /**
     * Adds a host to an existing cluster.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAddHostResponse> - Promise resolving to the response
     */
    admin_add_host_request(request, callback) {
      const actualRequest = {
        host_address: request.host_address,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/add/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Adds a host to an existing cluster.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param host_address IP address of the host that will be added to the cluster. This host must have installed the same version of Kinetica as the cluster to which it is being added.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAddHostResponse> - Promise resolving to the response
     */
    admin_add_host(host_address, options, callback) {
      const actualRequest = {
        host_address,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/add/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Add one or more ranks to an existing Kinetica cluster. The new ranks
     * will not contain any data initially (other than replicated tables) and
     * will not be assigned any shards. To rebalance data and shards across the
     * cluster, use `admin_rebalance`.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * For example, if attempting to add three new ranks (two ranks on host
     * 172.123.45.67 and one rank on host 172.123.45.68) to a Kinetica cluster
     * with additional configuration parameters:
     *
     * * `hosts` would be an array including 172.123.45.67 in the first two
     *   indices (signifying two ranks being added to host 172.123.45.67) and
     *   172.123.45.68 in the last index (signifying one rank being added to
     *   host 172.123.45.67)
     * * `config_params` would be an array of maps, with each map corresponding
     *   to the ranks being added in `hosts`. The key of each map would be the
     *   configuration parameter name and the value would be the parameter's
     *   value, e.g. '{"rank.gpu":"1"}'
     *
     * This endpoint's processing includes copying all replicated table data to
     * the new rank(s) and therefore could take a long time. The API call may
     * time out if run directly.  It is recommended to run this endpoint
     * asynchronously via `create_job`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAddRanksResponse> - Promise resolving to the response
     */
    admin_add_ranks_request(request, callback) {
      const actualRequest = {
        hosts: request.hosts,
        config_params: request.config_params,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/add/ranks", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Add one or more ranks to an existing Kinetica cluster. The new ranks
     * will not contain any data initially (other than replicated tables) and
     * will not be assigned any shards. To rebalance data and shards across the
     * cluster, use `admin_rebalance`.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * For example, if attempting to add three new ranks (two ranks on host
     * 172.123.45.67 and one rank on host 172.123.45.68) to a Kinetica cluster
     * with additional configuration parameters:
     *
     * * `hosts` would be an array including 172.123.45.67 in the first two
     *   indices (signifying two ranks being added to host 172.123.45.67) and
     *   172.123.45.68 in the last index (signifying one rank being added to
     *   host 172.123.45.67)
     * * `config_params` would be an array of maps, with each map corresponding
     *   to the ranks being added in `hosts`. The key of each map would be the
     *   configuration parameter name and the value would be the parameter's
     *   value, e.g. '{"rank.gpu":"1"}'
     *
     * This endpoint's processing includes copying all replicated table data to
     * the new rank(s) and therefore could take a long time. The API call may
     * time out if run directly.  It is recommended to run this endpoint
     * asynchronously via `create_job`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param hosts Array of host IP addresses (matching a hostN.address from the gpudb.conf file), or host identifiers (e.g. 'host0' from the gpudb.conf file), on which to add ranks to the cluster. The hosts must already be in the cluster. If needed beforehand, to add a new host to the cluster use `admin_add_host`. Include the same entry as many times as there are ranks to add to the cluster, e.g., if two ranks on host 172.123.45.67 should be added, `hosts` could look like '["172.123.45.67", "172.123.45.67"]'. All ranks will be added simultaneously, i.e. they're not added in the order of this array. Each entry in this array corresponds to the entry at the same index in the `config_params`.
     * @param config_params Array of maps containing configuration parameters
     * to apply to the new ranks found in `hosts`. For example,
     * '{"rank.gpu":"2", "tier.ram.rank.limit":"10000000000"}'. Currently, the
     * available parameters are rank-specific parameters in the Network,
     * Hardware, Text Search, and RAM Tiered Storage sections in the gpudb.conf
     * file, with the key exception of the 'rankN.host' settings in the Network
     * section that will be determined by `hosts` instead. Though many of these
     * configuration parameters typically are affixed with 'rankN' in the
     * gpudb.conf file (where N is the rank number), the 'N' should be omitted
     * in `config_params` as the new rank number(s) are not allocated until the
     * ranks have been added to the cluster. Each entry in this array
     * corresponds to the entry at the same index in the `hosts`. This array
     * must either be completely empty or have the same number of elements as
     * the `hosts`.  An empty `config_params` array will result in the new
     * ranks being set with default parameters.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAddRanksResponse> - Promise resolving to the response
     */
    admin_add_ranks(hosts, config_params, options, callback) {
      const actualRequest = {
        hosts,
        config_params,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/add/ranks", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alter properties on an existing host in the cluster. Currently, the only
     * property that can be altered is a hosts ability to accept failover
     * processes.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAlterHostResponse> - Promise resolving to the response
     */
    admin_alter_host_request(request, callback) {
      const actualRequest = {
        host: request.host,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/alter/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alter properties on an existing host in the cluster. Currently, the only
     * property that can be altered is a hosts ability to accept failover
     * processes.
     *
     * @param host Identifies the host this applies to. Can be the host address, or formatted as 'hostN' where N is the host number as specified in gpudb.conf.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAlterHostResponse> - Promise resolving to the response
     */
    admin_alter_host(host, options, callback) {
      const actualRequest = {
        host,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/alter/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Perform the requested action on a list of one or more job(s). Based on
     * the type of job and the current state of execution, the action may not
     * be successfully executed. The final result of the attempted actions for
     * each specified job is returned in the status array of the response. See
     * Job Manager for more information.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAlterJobsResponse> - Promise resolving to the response
     */
    admin_alter_jobs_request(request, callback) {
      const actualRequest = {
        job_ids: request.job_ids,
        action: request.action,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/alter/jobs", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Perform the requested action on a list of one or more job(s). Based on
     * the type of job and the current state of execution, the action may not
     * be successfully executed. The final result of the attempted actions for
     * each specified job is returned in the status array of the response. See
     * Job Manager for more information.
     *
     * @param job_ids Jobs to be modified.
     * @param action Action to be performed on the jobs specified by job_ids.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminAlterJobsResponse> - Promise resolving to the response
     */
    admin_alter_jobs(job_ids, action, options, callback) {
      const actualRequest = {
        job_ids,
        action,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/alter/jobs", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Prepares the system for a backup by closing all open file handles after
     * allowing current active jobs to complete. When the database is in backup
     * mode, queries that result in a disk write operation will be blocked
     * until backup mode has been completed by using `admin_backup_end`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminBackupBeginResponse> - Promise resolving to the response
     */
    admin_backup_begin_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/backup/begin", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Prepares the system for a backup by closing all open file handles after
     * allowing current active jobs to complete. When the database is in backup
     * mode, queries that result in a disk write operation will be blocked
     * until backup mode has been completed by using `admin_backup_end`.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminBackupBeginResponse> - Promise resolving to the response
     */
    admin_backup_begin(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/backup/begin", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restores the system to normal operating mode after a backup has
     * completed, allowing any queries that were blocked to complete.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminBackupEndResponse> - Promise resolving to the response
     */
    admin_backup_end_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/backup/end", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restores the system to normal operating mode after a backup has
     * completed, allowing any queries that were blocked to complete.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminBackupEndResponse> - Promise resolving to the response
     */
    admin_backup_end(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/backup/end", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Pauses consumption of messages from other HA clusters to support data
     * repair/recovery scenarios. In-flight queries may fail to replicate to
     * other clusters in the ring when going offline.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminHaOfflineResponse> - Promise resolving to the response
     */
    admin_ha_offline_request(request, callback) {
      const actualRequest = {
        offline: request.offline,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/ha/offline", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Pauses consumption of messages from other HA clusters to support data
     * repair/recovery scenarios. In-flight queries may fail to replicate to
     * other clusters in the ring when going offline.
     *
     * @param offline Set to true if desired state is offline.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminHaOfflineResponse> - Promise resolving to the response
     */
    admin_ha_offline(offline, options, callback) {
      const actualRequest = {
        offline,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/ha/offline", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restarts the HA processing on the given cluster as a mechanism of
     * accepting breaking HA conf changes. Additionally the cluster is put into
     * read-only while HA is restarting.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminHaRefreshResponse> - Promise resolving to the response
     */
    admin_ha_refresh_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/ha/refresh", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restarts the HA processing on the given cluster as a mechanism of
     * accepting breaking HA conf changes. Additionally the cluster is put into
     * read-only while HA is restarting.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminHaRefreshResponse> - Promise resolving to the response
     */
    admin_ha_refresh(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/ha/refresh", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Take the system offline. When the system is offline, no user operations
     * can be performed with the exception of a system shutdown.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminOfflineResponse> - Promise resolving to the response
     */
    admin_offline_request(request, callback) {
      const actualRequest = {
        offline: request.offline,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/offline", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Take the system offline. When the system is offline, no user operations
     * can be performed with the exception of a system shutdown.
     *
     * @param offline Set to true if desired state is offline.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminOfflineResponse> - Promise resolving to the response
     */
    admin_offline(offline, options, callback) {
      const actualRequest = {
        offline,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/offline", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Rebalance the data in the cluster so that all nodes contain an equal
     * number of records approximately and/or rebalance the shards to be
     * equally distributed (as much as possible) across all the ranks.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * * If `admin_rebalance` is invoked after a change is made to the cluster,
     *   e.g., a host was added or removed, sharded data will be evenly
     *   redistributed across the cluster by number of shards per rank while
     *   unsharded data will be redistributed across the cluster by data size
     *   per rank
     * * If `admin_rebalance` is invoked at some point when unsharded data
     *   (a.k.a. randomly-sharded) in the cluster is unevenly distributed over
     *   time, sharded data will not move while unsharded data will be
     *   redistributed across the cluster by data size per rank
     *
     * NOTE: Replicated data will not move as a result of this call
     *
     * This endpoint's processing time depends on the amount of data in the
     * system, thus the API call may time out if run directly.  It is
     * recommended to run this endpoint asynchronously via `create_job`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRebalanceResponse> - Promise resolving to the response
     */
    admin_rebalance_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/rebalance", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Rebalance the data in the cluster so that all nodes contain an equal
     * number of records approximately and/or rebalance the shards to be
     * equally distributed (as much as possible) across all the ranks.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * * If `admin_rebalance` is invoked after a change is made to the cluster,
     *   e.g., a host was added or removed, sharded data will be evenly
     *   redistributed across the cluster by number of shards per rank while
     *   unsharded data will be redistributed across the cluster by data size
     *   per rank
     * * If `admin_rebalance` is invoked at some point when unsharded data
     *   (a.k.a. randomly-sharded) in the cluster is unevenly distributed over
     *   time, sharded data will not move while unsharded data will be
     *   redistributed across the cluster by data size per rank
     *
     * NOTE: Replicated data will not move as a result of this call
     *
     * This endpoint's processing time depends on the amount of data in the
     * system, thus the API call may time out if run directly.  It is
     * recommended to run this endpoint asynchronously via `create_job`.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRebalanceResponse> - Promise resolving to the response
     */
    admin_rebalance(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/rebalance", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Removes a host from an existing cluster. If the host to be removed has
     * any ranks running on it, the ranks must be removed using
     * `admin_remove_ranks` or manually switched over to a new host using
     * `admin_switchover` prior to host removal. If the host to be removed has
     * the graph server or SQL planner running on it, these must be manually
     * switched over to a new host using `admin_switchover`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRemoveHostResponse> - Promise resolving to the response
     */
    admin_remove_host_request(request, callback) {
      const actualRequest = {
        host: request.host,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/remove/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Removes a host from an existing cluster. If the host to be removed has
     * any ranks running on it, the ranks must be removed using
     * `admin_remove_ranks` or manually switched over to a new host using
     * `admin_switchover` prior to host removal. If the host to be removed has
     * the graph server or SQL planner running on it, these must be manually
     * switched over to a new host using `admin_switchover`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param host Identifies the host this applies to. Can be the host address, or formatted as 'hostN' where N is the host number as specified in gpudb.conf.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRemoveHostResponse> - Promise resolving to the response
     */
    admin_remove_host(host, options, callback) {
      const actualRequest = {
        host,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/remove/host", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Remove one or more ranks from an existing Kinetica cluster. All data
     * will be rebalanced to other ranks before the rank(s) is removed unless
     * the rebalance_sharded_data or rebalance_unsharded_data parameters are
     * set to false in the `options`, in which case the corresponding sharded
     * data and/or unsharded data (a.k.a. randomly-sharded) will be deleted.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * This endpoint's processing time depends on the amount of data in the
     * system, thus the API call may time out if run directly.  It is
     * recommended to run this endpoint asynchronously via `create_job`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRemoveRanksResponse> - Promise resolving to the response
     */
    admin_remove_ranks_request(request, callback) {
      const actualRequest = {
        ranks: request.ranks,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/remove/ranks", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Remove one or more ranks from an existing Kinetica cluster. All data
     * will be rebalanced to other ranks before the rank(s) is removed unless
     * the rebalance_sharded_data or rebalance_unsharded_data parameters are
     * set to false in the `options`, in which case the corresponding sharded
     * data and/or unsharded data (a.k.a. randomly-sharded) will be deleted.
     *
     * The database must be offline for this operation, see `admin_offline`
     *
     * This endpoint's processing time depends on the amount of data in the
     * system, thus the API call may time out if run directly.  It is
     * recommended to run this endpoint asynchronously via `create_job`.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param ranks Each array value designates one or more ranks to remove from the cluster. Values can be formatted as 'rankN' for a specific rank, 'hostN' (from the gpudb.conf file) to remove all ranks on that host, or the host IP address (hostN.address from the gpub.conf file) which also removes all ranks on that host. Rank 0 (the head rank) cannot be removed (but can be moved to another host using `admin_switchover`). At least one worker rank must be left in the cluster after the operation.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRemoveRanksResponse> - Promise resolving to the response
     */
    admin_remove_ranks(ranks, options, callback) {
      const actualRequest = {
        ranks,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/remove/ranks", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manually repair a corrupted table.
     *
     * Returns information about affected tables.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRepairTableResponse> - Promise resolving to the response
     */
    admin_repair_table_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        table_types: request.table_types,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/repair/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manually repair a corrupted table.
     *
     * Returns information about affected tables.
     *
     * @param table_names List of tables to query. An asterisk returns all tables.
     * @param table_types ID of the type per table.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminRepairTableResponse> - Promise resolving to the response
     */
    admin_repair_table(table_names, table_types, options, callback) {
      const actualRequest = {
        table_names,
        table_types,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/repair/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sends a user generated alert to the monitoring system.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminSendAlertResponse> - Promise resolving to the response
     */
    admin_send_alert_request(request, callback) {
      const actualRequest = {
        message: request.message ?? "",
        label: request.label ?? "",
        log_level: request.log_level,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/send/alert", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sends a user generated alert to the monitoring system.
     *
     * @param message Alert message body.
     * @param label Label to add to alert message.
     * @param log_level Alert message logging criteria.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminSendAlertResponse> - Promise resolving to the response
     */
    admin_send_alert(message, label, log_level, options, callback) {
      const actualRequest = {
        message: message ?? "",
        label: label ?? "",
        log_level,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/send/alert", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests a list of the most recent alerts.
     *
     * Returns lists of alert data, including timestamp and type.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowAlertsResponse> - Promise resolving to the response
     */
    admin_show_alerts_request(request, callback) {
      const actualRequest = {
        num_alerts: request.num_alerts,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/alerts", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests a list of the most recent alerts.
     *
     * Returns lists of alert data, including timestamp and type.
     *
     * @param num_alerts Number of most recent alerts to request. The response will include up to `num_alerts` depending on how many alerts there are in the system. A value of 0 returns all stored alerts.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowAlertsResponse> - Promise resolving to the response
     */
    admin_show_alerts(num_alerts, options, callback) {
      const actualRequest = {
        num_alerts,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/alerts", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests the detailed status of the current operation (by default) or a
     * prior cluster operation specified by `history_index`.
     *
     * Returns details on the requested cluster operation.
     *
     * The response will also indicate how many cluster operations are stored
     * in the history.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowClusterOperationsResponse> - Promise resolving to the response
     */
    admin_show_cluster_operations_request(request, callback) {
      const actualRequest = {
        history_index: request.history_index ?? 0,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/cluster/operations", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests the detailed status of the current operation (by default) or a
     * prior cluster operation specified by `history_index`.
     *
     * Returns details on the requested cluster operation.
     *
     * The response will also indicate how many cluster operations are stored
     * in the history.
     *
     * @param history_index Indicates which cluster operation to retrieve.  Use 0 for the most recent.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowClusterOperationsResponse> - Promise resolving to the response
     */
    admin_show_cluster_operations(history_index, options, callback) {
      const actualRequest = {
        history_index: history_index ?? 0,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/cluster/operations", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Get a list of the current jobs in GPUdb.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowJobsResponse> - Promise resolving to the response
     */
    admin_show_jobs_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/jobs", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Get a list of the current jobs in GPUdb.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowJobsResponse> - Promise resolving to the response
     */
    admin_show_jobs(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/jobs", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Show the mapping of shards to the corresponding rank and tom.  The
     * response message contains list of 16384 (total number of shards in the
     * system) Rank and TOM numbers corresponding to each shard.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowShardsResponse> - Promise resolving to the response
     */
    admin_show_shards_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/shards", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Show the mapping of shards to the corresponding rank and tom.  The
     * response message contains list of 16384 (total number of shards in the
     * system) Rank and TOM numbers corresponding to each shard.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShowShardsResponse> - Promise resolving to the response
     */
    admin_show_shards(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/show/shards", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Exits the database server application.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShutdownResponse> - Promise resolving to the response
     */
    admin_shutdown_request(request, callback) {
      const actualRequest = {
        exit_type: request.exit_type,
        authorization: request.authorization,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/shutdown", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Exits the database server application.
     *
     * @param exit_type Reserved for future use. User can pass an empty string.
     * @param authorization No longer used. User can pass an empty string.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminShutdownResponse> - Promise resolving to the response
     */
    admin_shutdown(exit_type, authorization, options, callback) {
      const actualRequest = {
        exit_type,
        authorization,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/shutdown", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manually switch over one or more processes to another host. Individual
     * ranks or entire hosts may be moved to another host.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminSwitchoverResponse> - Promise resolving to the response
     */
    admin_switchover_request(request, callback) {
      const actualRequest = {
        processes: request.processes,
        destinations: request.destinations,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/switchover", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manually switch over one or more processes to another host. Individual
     * ranks or entire hosts may be moved to another host.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param processes Indicates the process identifier to switch over to
     * another host. Options are 'hostN' and 'rankN' where 'N' corresponds to
     * the number associated with a host or rank in the Network section of the
     * gpudb.conf file; e.g., 'host[N].address' or 'rank[N].host'. If 'hostN'
     * is provided, all processes on that host will be moved to another host.
     * Each entry in this array will be switched over to the corresponding host
     * entry at the same index in `destinations`.
     * @param destinations Indicates to which host to switch over each
     * corresponding process given in `processes`. Each index must be specified
     * as 'hostN' where 'N' corresponds to the number associated with a host or
     * rank in the Network section of the gpudb.conf file; e.g.,
     * 'host[N].address'. Each entry in this array will receive the
     * corresponding process entry at the same index in `processes`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminSwitchoverResponse> - Promise resolving to the response
     */
    admin_switchover(processes, destinations, options, callback) {
      const actualRequest = {
        processes,
        destinations,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/switchover", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Verify database is in a consistent state.  When inconsistencies or
     * errors are found, the verified_ok flag in the response is set to false
     * and the list of errors found is provided in the error_list.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AdminVerifyDbResponse> - Promise resolving to the response
     */
    admin_verify_db_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/admin/verifydb", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Verify database is in a consistent state.  When inconsistencies or
     * errors are found, the verified_ok flag in the response is set to false
     * and the list of errors found is provided in the error_list.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AdminVerifyDbResponse> - Promise resolving to the response
     */
    admin_verify_db(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/admin/verifydb", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the convex hull for the values in a table
     * specified by `table_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateConvexHullResponse> - Promise resolving to the response
     */
    aggregate_convex_hull_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/convexhull", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the convex hull for the values in a table
     * specified by `table_name`.
     *
     * @param table_name Name of table on which the operation will be performed. Must be an existing table, in [schema_name.]table_name format, using standard name resolution rules.
     * @param x_column_name Name of the column containing the x coordinates of the points for the operation being performed.
     * @param y_column_name Name of the column containing the y coordinates of the points for the operation being performed.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateConvexHullResponse> - Promise resolving to the response
     */
    aggregate_convex_hull(table_name, x_column_name, y_column_name, options, callback) {
      const actualRequest = {
        table_name,
        x_column_name,
        y_column_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/convexhull", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates unique combinations (groups) of values for the given columns
     * in a given table or view and computes aggregates on each unique
     * combination. This is somewhat analogous to an SQL-style SELECT...GROUP
     * BY.
     *
     * For aggregation details and examples, see Aggregation.  For limitations,
     * see Aggregation Limitations.
     *
     * Any column(s) can be grouped on, and all column types except
     * unrestricted-length strings may be used for computing applicable
     * aggregates.
     *
     * The results can be paged via the `offset` and `limit` parameters. For
     * example, to get 10 groups with the largest counts the inputs would be:
     * limit=10, options={"sort_order":"descending", "sort_by":"value"}.
     *
     * `options` can be used to customize behavior of this call e.g. filtering
     * or sorting the results.
     *
     * To group by columns 'x' and 'y' and compute the number of objects within
     * each group, use:  column_names=['x','y','count(*)'].
     *
     * To also compute the sum of 'z' over each group, use:
     * column_names=['x','y','count(*)','sum(z)'].
     *
     * Available aggregation functions are: count(*), sum, min, max, avg, mean,
     * stddev, stddev_pop, stddev_samp, var, var_pop, var_samp, arg_min,
     * arg_max and count_distinct.
     *
     * Available grouping functions are Rollup, Cube, and Grouping Sets
     *
     * This service also provides support for Pivot operations.
     *
     * Filtering on aggregates is supported via expressions using aggregation
     * functions supplied to having.
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * If a result_table name is specified in the `options`, the results are
     * stored in a new table with that name--no results are returned in the
     * response.  Both the table name and resulting column names must adhere to
     * standard naming conventions; column/aggregation expressions will need to
     * be aliased.  If the source table's shard key is used as the grouping
     * column(s) and all result records are selected (`offset` is 0 and `limit`
     * is -9999), the result table will be sharded, in all other cases it will
     * be replicated.  Sorting will properly function only if the result table
     * is replicated or if there is only one processing node and should not be
     * relied upon in other cases.  Not available when any of the values of
     * `column_names` is an unrestricted-length string.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateGroupByResponse> - Promise resolving to the response
     */
    aggregate_group_by_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_names: request.column_names,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/aggregate/groupby"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/groupby", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Calculates unique combinations (groups) of values for the given columns
     * in a given table or view and computes aggregates on each unique
     * combination. This is somewhat analogous to an SQL-style SELECT...GROUP
     * BY.
     *
     * For aggregation details and examples, see Aggregation.  For limitations,
     * see Aggregation Limitations.
     *
     * Any column(s) can be grouped on, and all column types except
     * unrestricted-length strings may be used for computing applicable
     * aggregates.
     *
     * The results can be paged via the `offset` and `limit` parameters. For
     * example, to get 10 groups with the largest counts the inputs would be:
     * limit=10, options={"sort_order":"descending", "sort_by":"value"}.
     *
     * `options` can be used to customize behavior of this call e.g. filtering
     * or sorting the results.
     *
     * To group by columns 'x' and 'y' and compute the number of objects within
     * each group, use:  column_names=['x','y','count(*)'].
     *
     * To also compute the sum of 'z' over each group, use:
     * column_names=['x','y','count(*)','sum(z)'].
     *
     * Available aggregation functions are: count(*), sum, min, max, avg, mean,
     * stddev, stddev_pop, stddev_samp, var, var_pop, var_samp, arg_min,
     * arg_max and count_distinct.
     *
     * Available grouping functions are Rollup, Cube, and Grouping Sets
     *
     * This service also provides support for Pivot operations.
     *
     * Filtering on aggregates is supported via expressions using aggregation
     * functions supplied to having.
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * If a result_table name is specified in the `options`, the results are
     * stored in a new table with that name--no results are returned in the
     * response.  Both the table name and resulting column names must adhere to
     * standard naming conventions; column/aggregation expressions will need to
     * be aliased.  If the source table's shard key is used as the grouping
     * column(s) and all result records are selected (`offset` is 0 and `limit`
     * is -9999), the result table will be sharded, in all other cases it will
     * be replicated.  Sorting will properly function only if the result table
     * is replicated or if there is only one processing node and should not be
     * relied upon in other cases.  Not available when any of the values of
     * `column_names` is an unrestricted-length string.
     *
     * @param table_name Name of an existing table or view on which the operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_names List of one or more column names, expressions, and aggregate expressions.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `has_more_records` to see if more records exist in the result to be
     * fetched, and `offset` and `limit` to request subsequent pages of
     * results.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateGroupByResponse> - Promise resolving to the response
     */
    aggregate_group_by(table_name, column_names, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        column_names,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/aggregate/groupby"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/groupby", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Performs a histogram calculation given a table, a column, and an
     * interval function. The `interval` is used to produce bins of that size
     * and the result, computed over the records falling within each bin, is
     * returned. For each bin, the start value is inclusive, but the end value
     * is exclusive--except for the very last bin for which the end value is
     * also inclusive.  The value returned for each bin is the number of
     * records in it, except when a column name is provided as a value_column.
     * In this latter case the sum of the values corresponding to the
     * value_column is used as the result instead.  The total number of bins
     * requested cannot exceed 10,000.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service a request that specifies a value_column.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateHistogramResponse> - Promise resolving to the response
     */
    aggregate_histogram_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_name: request.column_name,
        start: request.start,
        end: request.end,
        interval: request.interval,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/histogram", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Performs a histogram calculation given a table, a column, and an
     * interval function. The `interval` is used to produce bins of that size
     * and the result, computed over the records falling within each bin, is
     * returned. For each bin, the start value is inclusive, but the end value
     * is exclusive--except for the very last bin for which the end value is
     * also inclusive.  The value returned for each bin is the number of
     * records in it, except when a column name is provided as a value_column.
     * In this latter case the sum of the values corresponding to the
     * value_column is used as the result instead.  The total number of bins
     * requested cannot exceed 10,000.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service a request that specifies a value_column.
     *
     * @param table_name Name of the table on which the operation will be performed. Must be an existing table, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of a column or an expression of one or more column names over which the histogram will be calculated.
     * @param start Lower end value of the histogram interval, inclusive.
     * @param end Upper end value of the histogram interval, inclusive.
     * @param interval The size of each bin within the start and end parameters.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateHistogramResponse> - Promise resolving to the response
     */
    aggregate_histogram(table_name, column_name, start, end, interval, options, callback) {
      const actualRequest = {
        table_name,
        column_name,
        start,
        end,
        interval,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/histogram", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * This endpoint runs the k-means algorithm - a heuristic algorithm that
     * attempts to do k-means clustering.  An ideal k-means clustering
     * algorithm selects k points such that the sum of the mean squared
     * distances of each member of the set to the nearest of the k points is
     * minimized.  The k-means algorithm however does not necessarily produce
     * such an ideal cluster.   It begins with a randomly selected set of k
     * points and then refines the location of the points iteratively and
     * settles to a local minimum.  Various parameters and options are provided
     * to control the heuristic search.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service this request.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateKMeansResponse> - Promise resolving to the response
     */
    aggregate_k_means_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_names: request.column_names,
        k: request.k,
        tolerance: request.tolerance,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/kmeans", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * This endpoint runs the k-means algorithm - a heuristic algorithm that
     * attempts to do k-means clustering.  An ideal k-means clustering
     * algorithm selects k points such that the sum of the mean squared
     * distances of each member of the set to the nearest of the k points is
     * minimized.  The k-means algorithm however does not necessarily produce
     * such an ideal cluster.   It begins with a randomly selected set of k
     * points and then refines the location of the points iteratively and
     * settles to a local minimum.  Various parameters and options are provided
     * to control the heuristic search.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service this request.
     *
     * @param table_name Name of the table on which the operation will be performed. Must be an existing table, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_names List of column names on which the operation would be performed. If n columns are provided then each of the k result points will have n dimensions corresponding to the n columns.
     * @param k The number of mean points to be determined by the algorithm.
     * @param tolerance Stop iterating when the distances between successive points is less than the given tolerance.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateKMeansResponse> - Promise resolving to the response
     */
    aggregate_k_means(table_name, column_names, k, tolerance, options, callback) {
      const actualRequest = {
        table_name,
        column_names,
        k,
        tolerance,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/kmeans", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the minimum and maximum values of a particular
     * column in a table.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateMinMaxResponse> - Promise resolving to the response
     */
    aggregate_min_max_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_name: request.column_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/minmax", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the minimum and maximum values of a particular
     * column in a table.
     *
     * @param table_name Name of the table on which the operation will be performed. Must be an existing table, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of a column or an expression of one or more column on which the min-max will be calculated.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateMinMaxResponse> - Promise resolving to the response
     */
    aggregate_min_max(table_name, column_name, options, callback) {
      const actualRequest = {
        table_name,
        column_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/minmax", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the minimum and maximum x- and y-coordinates of a
     * particular geospatial geometry column in a table.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateMinMaxGeometryResponse> - Promise resolving to the response
     */
    aggregate_min_max_geometry_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_name: request.column_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/minmax/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates and returns the minimum and maximum x- and y-coordinates of a
     * particular geospatial geometry column in a table.
     *
     * @param table_name Name of the table on which the operation will be performed. Must be an existing table, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of a geospatial geometry column on which the min-max will be calculated.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateMinMaxGeometryResponse> - Promise resolving to the response
     */
    aggregate_min_max_geometry(table_name, column_name, options, callback) {
      const actualRequest = {
        table_name,
        column_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/minmax/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates the requested statistics of the given column(s) in a given
     * table.
     *
     * The available statistics are: count (number of total objects), mean,
     * stdv (standard deviation), variance, skew, kurtosis, sum, min, max,
     * weighted_average, cardinality (unique count), estimated_cardinality,
     * percentile, and percentile_rank.
     *
     * Estimated cardinality is calculated by using the hyperloglog
     * approximation technique.
     *
     * Percentiles and percentile ranks are approximate and are calculated
     * using the t-digest algorithm. They must include the desired
     * percentile/percentile_rank. To compute multiple percentiles each value
     * must be specified separately (i.e.
     * 'percentile(75.0),percentile(99.0),percentile_rank(1234.56),percentile_rank(-5)').
     *
     * A second, comma-separated value can be added to the percentile statistic
     * to calculate percentile resolution, e.g., a 50th percentile with 200
     * resolution would be 'percentile(50,200)'.
     *
     * The weighted average statistic requires a weight column to be specified
     * in weight_column_name.  The weighted average is then defined as the sum
     * of the products of `column_name` times the weight_column_name values
     * divided by the sum of the weight_column_name values.
     *
     * Additional columns can be used in the calculation of statistics via
     * additional_column_names.  Values in these columns will be included in
     * the overall aggregate calculation--individual aggregates will not be
     * calculated per additional column.  For instance, requesting the count
     * and mean of `column_name` x and additional_column_names y and z, where x
     * holds the numbers 1-10, y holds 11-20, and z holds 21-30, would return
     * the total number of x, y, and z values (30), and the single average
     * value across all x, y, and z values (15.5).
     *
     * The response includes a list of key/value pairs of each statistic
     * requested and its corresponding value.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateStatisticsResponse> - Promise resolving to the response
     */
    aggregate_statistics_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_name: request.column_name,
        stats: request.stats,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates the requested statistics of the given column(s) in a given
     * table.
     *
     * The available statistics are: count (number of total objects), mean,
     * stdv (standard deviation), variance, skew, kurtosis, sum, min, max,
     * weighted_average, cardinality (unique count), estimated_cardinality,
     * percentile, and percentile_rank.
     *
     * Estimated cardinality is calculated by using the hyperloglog
     * approximation technique.
     *
     * Percentiles and percentile ranks are approximate and are calculated
     * using the t-digest algorithm. They must include the desired
     * percentile/percentile_rank. To compute multiple percentiles each value
     * must be specified separately (i.e.
     * 'percentile(75.0),percentile(99.0),percentile_rank(1234.56),percentile_rank(-5)').
     *
     * A second, comma-separated value can be added to the percentile statistic
     * to calculate percentile resolution, e.g., a 50th percentile with 200
     * resolution would be 'percentile(50,200)'.
     *
     * The weighted average statistic requires a weight column to be specified
     * in weight_column_name.  The weighted average is then defined as the sum
     * of the products of `column_name` times the weight_column_name values
     * divided by the sum of the weight_column_name values.
     *
     * Additional columns can be used in the calculation of statistics via
     * additional_column_names.  Values in these columns will be included in
     * the overall aggregate calculation--individual aggregates will not be
     * calculated per additional column.  For instance, requesting the count
     * and mean of `column_name` x and additional_column_names y and z, where x
     * holds the numbers 1-10, y holds 11-20, and z holds 21-30, would return
     * the total number of x, y, and z values (30), and the single average
     * value across all x, y, and z values (15.5).
     *
     * The response includes a list of key/value pairs of each statistic
     * requested and its corresponding value.
     *
     * @param table_name Name of the table on which the statistics operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of the primary column for which the statistics are to be calculated.
     * @param stats Comma separated list of the statistics to calculate, e.g. "sum,mean".
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateStatisticsResponse> - Promise resolving to the response
     */
    aggregate_statistics(table_name, column_name, stats, options, callback) {
      const actualRequest = {
        table_name,
        column_name,
        stats,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Divides the given set into bins and calculates statistics of the values
     * of a value-column in each bin.  The bins are based on the values of a
     * given binning-column.  The statistics that may be requested are mean,
     * stdv (standard deviation), variance, skew, kurtosis, sum, min, max,
     * first, last and weighted average. In addition to the requested
     * statistics the count of total samples in each bin is returned. This
     * counts vector is just the histogram of the column used to divide the set
     * members into bins. The weighted average statistic requires a weight
     * column to be specified in weight_column_name. The weighted average is
     * then defined as the sum of the products of the value column times the
     * weight column divided by the sum of the weight column.
     *
     * There are two methods for binning the set members. In the first, which
     * can be used for numeric valued binning-columns, a min, max and interval
     * are specified. The number of bins, nbins, is the integer upper bound of
     * (max-min)/interval. Values that fall in the range
     * [min+n*interval,min+(n+1)*interval) are placed in the nth bin where n
     * ranges from 0..nbin-2. The final bin is [min+(nbin-1)*interval,max]. In
     * the second method, bin_values specifies a list of binning column values.
     * Binning-columns whose value matches the nth member of the bin_values
     * list are placed in the nth bin. When a list is provided, the
     * binning-column must be of type string or int.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service this request.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateStatisticsByRangeResponse> - Promise resolving to the response
     */
    aggregate_statistics_by_range_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        select_expression: request.select_expression ?? "",
        column_name: request.column_name,
        value_column_name: request.value_column_name,
        stats: request.stats,
        start: request.start,
        end: request.end,
        interval: request.interval,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/statistics/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Divides the given set into bins and calculates statistics of the values
     * of a value-column in each bin.  The bins are based on the values of a
     * given binning-column.  The statistics that may be requested are mean,
     * stdv (standard deviation), variance, skew, kurtosis, sum, min, max,
     * first, last and weighted average. In addition to the requested
     * statistics the count of total samples in each bin is returned. This
     * counts vector is just the histogram of the column used to divide the set
     * members into bins. The weighted average statistic requires a weight
     * column to be specified in weight_column_name. The weighted average is
     * then defined as the sum of the products of the value column times the
     * weight column divided by the sum of the weight column.
     *
     * There are two methods for binning the set members. In the first, which
     * can be used for numeric valued binning-columns, a min, max and interval
     * are specified. The number of bins, nbins, is the integer upper bound of
     * (max-min)/interval. Values that fall in the range
     * [min+n*interval,min+(n+1)*interval) are placed in the nth bin where n
     * ranges from 0..nbin-2. The final bin is [min+(nbin-1)*interval,max]. In
     * the second method, bin_values specifies a list of binning column values.
     * Binning-columns whose value matches the nth member of the bin_values
     * list are placed in the nth bin. When a list is provided, the
     * binning-column must be of type string or int.
     *
     * NOTE:  The Kinetica instance being accessed must be running a CUDA
     * (GPU-based) build to service this request.
     *
     * @param table_name Name of the table on which the ranged-statistics operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.
     * @param select_expression For a non-empty expression statistics are calculated for those records for which the expression is true.
     * @param column_name Name of the binning-column used to divide the set samples into bins.
     * @param value_column_name Name of the value-column for which statistics are to be computed.
     * @param stats A string of comma separated list of the statistics to calculate, e.g. 'sum,mean'. Available statistics: mean, stdv (standard deviation), variance, skew, kurtosis, sum.
     * @param start The lower bound of the binning-column.
     * @param end The upper bound of the binning-column.
     * @param interval The interval of a bin. Set members fall into bin i if the binning-column falls in the range [start+interval*i, start+interval*(i+1)).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateStatisticsByRangeResponse> - Promise resolving to the response
     */
    aggregate_statistics_by_range(table_name, select_expression, column_name, value_column_name, stats, start, end, interval, options, callback) {
      const actualRequest = {
        table_name,
        select_expression: select_expression ?? "",
        column_name,
        value_column_name,
        stats,
        start,
        end,
        interval,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/statistics/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns all the unique values from a particular column (specified by
     * `column_name`) of a particular table or view (specified by
     * `table_name`). If `column_name` is a numeric column, the values will be
     * in `binary_encoded_response`. Otherwise if `column_name` is a string
     * column, the values will be in `json_encoded_response`.  The results can
     * be paged via `offset` and `limit` parameters.
     *
     *     {"limit":"10","sort_order":"descending"}
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * If a result_table name is specified in the `options`, the results are
     * stored in a new table with that name--no results are returned in the
     * response.  Both the table name and resulting column name must adhere to
     * standard naming conventions; any column expression will need to be
     * aliased.  If the source table's shard key is used as the `column_name`,
     * the result table will be sharded, in all other cases it will be
     * replicated.  Sorting will properly function only if the result table is
     * replicated or if there is only one processing node and should not be
     * relied upon in other cases.  Not available if the value of `column_name`
     * is an unrestricted-length string.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateUniqueResponse> - Promise resolving to the response
     */
    aggregate_unique_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_name: request.column_name,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/aggregate/unique"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/unique", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Returns all the unique values from a particular column (specified by
     * `column_name`) of a particular table or view (specified by
     * `table_name`). If `column_name` is a numeric column, the values will be
     * in `binary_encoded_response`. Otherwise if `column_name` is a string
     * column, the values will be in `json_encoded_response`.  The results can
     * be paged via `offset` and `limit` parameters.
     *
     *     {"limit":"10","sort_order":"descending"}
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * If a result_table name is specified in the `options`, the results are
     * stored in a new table with that name--no results are returned in the
     * response.  Both the table name and resulting column name must adhere to
     * standard naming conventions; any column expression will need to be
     * aliased.  If the source table's shard key is used as the `column_name`,
     * the result table will be sharded, in all other cases it will be
     * replicated.  Sorting will properly function only if the result table is
     * replicated or if there is only one processing node and should not be
     * relied upon in other cases.  Not available if the value of `column_name`
     * is an unrestricted-length string.
     *
     * @param table_name Name of an existing table or view on which the operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of the column or an expression containing one or more column names on which the unique function would be applied.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `has_more_records` to see if more records exist in the result to be
     * fetched, and `offset` and `limit` to request subsequent pages of
     * results.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateUniqueResponse> - Promise resolving to the response
     */
    aggregate_unique(table_name, column_name, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        column_name,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/aggregate/unique"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/unique", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Rotate the column values into rows values.
     *
     * For unpivot details and examples, see Unpivot.  For limitations, see
     * Unpivot Limitations.
     *
     * Unpivot is used to normalize tables that are built for cross tabular
     * reporting purposes. The unpivot operator rotates the column values for
     * all the pivoted columns. A variable column, value column and all columns
     * from the source table except the unpivot columns are projected into the
     * result table. The variable column and value columns in the result table
     * indicate the pivoted column name and values respectively.
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateUnpivotResponse> - Promise resolving to the response
     */
    aggregate_unpivot_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_names: request.column_names,
        variable_column_name: request.variable_column_name ?? "",
        value_column_name: request.value_column_name ?? "",
        pivoted_columns: request.pivoted_columns,
        encoding: request.encoding ?? this.recordEncoding("/aggregate/unpivot"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/unpivot", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Rotate the column values into rows values.
     *
     * For unpivot details and examples, see Unpivot.  For limitations, see
     * Unpivot Limitations.
     *
     * Unpivot is used to normalize tables that are built for cross tabular
     * reporting purposes. The unpivot operator rotates the column values for
     * all the pivoted columns. A variable column, value column and all columns
     * from the source table except the unpivot columns are projected into the
     * result table. The variable column and value columns in the result table
     * indicate the pivoted column name and values respectively.
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * @param table_name Name of the table on which the operation will be performed. Must be an existing table/view, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_names List of column names or expressions. A wildcard '*' can be used to include all the non-pivoted columns from the source table.
     * @param variable_column_name Specifies the variable/parameter column name.
     * @param value_column_name Specifies the value column name.
     * @param pivoted_columns List of one or more values typically the column names of the input table. All the columns in the source table must have the same data type.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AggregateUnpivotResponse> - Promise resolving to the response
     */
    aggregate_unpivot(table_name, column_names, variable_column_name, value_column_name, pivoted_columns, options, callback) {
      const actualRequest = {
        table_name,
        column_names,
        variable_column_name: variable_column_name ?? "",
        value_column_name: value_column_name ?? "",
        pivoted_columns,
        encoding: this.recordEncoding("/aggregate/unpivot"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/aggregate/unpivot", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Alters an existing database backup, accessible via the data sink
     * specified by `datasink_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterBackupResponse> - Promise resolving to the response
     */
    alter_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name,
        action: request.action,
        value: request.value,
        datasink_name: request.datasink_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters an existing database backup, accessible via the data sink
     * specified by `datasink_name`.
     *
     * @param backup_name Name of the backup to be altered.
     * @param action Operation to be applied.
     * @param value Value of the modification, depending on `action`.
     * @param datasink_name Data sink through which the backup is accessible.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterBackupResponse> - Promise resolving to the response
     */
    alter_backup(backup_name, action, value, datasink_name, options, callback) {
      const actualRequest = {
        backup_name,
        action,
        value,
        datasink_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alter the properties of an existing credential.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterCredentialResponse> - Promise resolving to the response
     */
    alter_credential_request(request, callback) {
      const actualRequest = {
        credential_name: request.credential_name,
        credential_updates_map: request.credential_updates_map,
        options: request.options
      };
      const dispatched = this.submitRequest("/alter/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alter the properties of an existing credential.
     *
     * @param credential_name Name of the credential to be altered. Must be an existing credential.
     * @param credential_updates_map Map containing the properties of the credential to be updated. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterCredentialResponse> - Promise resolving to the response
     */
    alter_credential(credential_name, credential_updates_map, options, callback) {
      const actualRequest = {
        credential_name,
        credential_updates_map,
        options
      };
      const dispatched = this.submitRequest("/alter/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing data sink.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDatasinkResponse> - Promise resolving to the response
     */
    alter_datasink_request(request, callback) {
      const actualRequest = {
        name: request.name,
        datasink_updates_map: request.datasink_updates_map,
        options: request.options
      };
      const dispatched = this.submitRequest("/alter/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing data sink.
     *
     * @param name Name of the data sink to be altered. Must be an existing data sink.
     * @param datasink_updates_map Map containing the properties of the data sink to be updated. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDatasinkResponse> - Promise resolving to the response
     */
    alter_datasink(name, datasink_updates_map, options, callback) {
      const actualRequest = {
        name,
        datasink_updates_map,
        options
      };
      const dispatched = this.submitRequest("/alter/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing data source.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDatasourceResponse> - Promise resolving to the response
     */
    alter_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        datasource_updates_map: request.datasource_updates_map,
        options: request.options
      };
      const dispatched = this.submitRequest("/alter/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing data source.
     *
     * @param name Name of the data source to be altered. Must be an existing data source.
     * @param datasource_updates_map Map containing the properties of the data source to be updated. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDatasourceResponse> - Promise resolving to the response
     */
    alter_datasource(name, datasource_updates_map, options, callback) {
      const actualRequest = {
        name,
        datasource_updates_map,
        options
      };
      const dispatched = this.submitRequest("/alter/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters an existing directory in KiFS.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDirectoryResponse> - Promise resolving to the response
     */
    alter_directory_request(request, callback) {
      const actualRequest = {
        directory_name: request.directory_name,
        directory_updates_map: request.directory_updates_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters an existing directory in KiFS.
     *
     * @param directory_name Name of the directory in KiFS to be altered.
     * @param directory_updates_map Map containing the properties of the directory to be altered. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterDirectoryResponse> - Promise resolving to the response
     */
    alter_directory(directory_name, directory_updates_map, options, callback) {
      const actualRequest = {
        directory_name,
        directory_updates_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters an existing environment which can be referenced by a user-defined
     * function (UDF).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterEnvironmentResponse> - Promise resolving to the response
     */
    alter_environment_request(request, callback) {
      const actualRequest = {
        environment_name: request.environment_name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters an existing environment which can be referenced by a user-defined
     * function (UDF).
     *
     * @param environment_name Name of the environment to be altered.
     * @param action Modification operation to be applied.
     * @param value The value of the modification, depending on `action`.  For
     * example, if `action` is install_package, this would be the python
     * package name.
     *
     * If `action` is install_requirements, this would be the path of a
     * requirements file from which to install packages.
     *
     * If an external data source is specified in datasource_name, this can be
     * the path to a wheel file or source archive. Alternatively, if installing
     * from a file (wheel or source archive), the value may be a reference to a
     * file in KiFS.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterEnvironmentResponse> - Promise resolving to the response
     */
    alter_environment(environment_name, action, value, options, callback) {
      const actualRequest = {
        environment_name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only: Graph server admin command.
     *
     * For internal use only: Graph server admin command.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterGraphResponse> - Promise resolving to the response
     */
    alter_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        action: request.action,
        action_arg: request.action_arg,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only: Graph server admin command.
     *
     * For internal use only: Graph server admin command.
     *
     * @param graph_name Graph on which the operation should be applied.
     *
     * If empty, then it will apply to all graphs.
     *
     * This request can be sent from the graph server to the graph client, or
     * from the client to the server depending on the type of operation.
     * @param action Operation to be applied.
     * @param action_arg Action specific argument.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterGraphResponse> - Promise resolving to the response
     */
    alter_graph(graph_name, action, action_arg, options, callback) {
      const actualRequest = {
        graph_name,
        action,
        action_arg,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only: Alter an imported model.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterModelResponse> - Promise resolving to the response
     */
    alter_model_request(request, callback) {
      const actualRequest = {
        model_name: request.model_name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only: Alter an imported model.
     *
     * @param model_name Model on which the operation should be applied.
     * @param action Operation to be applied.
     * @param value Action specific argument.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterModelResponse> - Promise resolving to the response
     */
    alter_model(model_name, action, value, options, callback) {
      const actualRequest = {
        model_name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing resource group to facilitate
     * resource management.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterResourceGroupResponse> - Promise resolving to the response
     */
    alter_resource_group_request(request, callback) {
      const actualRequest = {
        name: request.name,
        tier_attributes: request.tier_attributes ?? {},
        ranking: request.ranking ?? "",
        adjoining_resource_group: request.adjoining_resource_group ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters the properties of an existing resource group to facilitate
     * resource management.
     *
     * @param name Name of the group to be altered. Must be an existing resource group name or an empty string when used in conjunction with is_default_group.
     * @param tier_attributes Optional map containing tier names and their
     * respective attribute group limits.  The only valid attribute limit that
     * can be set is max_memory (in bytes) for the VRAM and RAM tiers.
     *
     * For instance, to set max VRAM capacity to 1GB per rank per GPU and max
     * RAM capacity to 10GB per rank, use:
     * {'VRAM':{'max_memory':'1000000000'}, 'RAM':{'max_memory':'10000000000'}}
     * @param ranking If the resource group ranking is to be updated, this indicates the relative ranking among existing resource groups where this resource group will be placed.
     * @param adjoining_resource_group If `ranking` is before or after, this field indicates the resource group before or after which the current group will be placed; otherwise, leave blank.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterResourceGroupResponse> - Promise resolving to the response
     */
    alter_resource_group(name, tier_attributes, ranking, adjoining_resource_group, options, callback) {
      const actualRequest = {
        name,
        tier_attributes: tier_attributes ?? {},
        ranking: ranking ?? "",
        adjoining_resource_group: adjoining_resource_group ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a Role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterRoleResponse> - Promise resolving to the response
     */
    alter_role_request(request, callback) {
      const actualRequest = {
        name: request.name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a Role.
     *
     * @param name Name of the role to be altered. Must be an existing role.
     * @param action Modification operation to be applied to the role.
     * @param value The value of the modification, depending on `action`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterRoleResponse> - Promise resolving to the response
     */
    alter_role(name, action, value, options, callback) {
      const actualRequest = {
        name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Used to change the name of a SQL-style schema, specified in
     * `schema_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterSchemaResponse> - Promise resolving to the response
     */
    alter_schema_request(request, callback) {
      const actualRequest = {
        schema_name: request.schema_name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Used to change the name of a SQL-style schema, specified in
     * `schema_name`.
     *
     * @param schema_name Name of the schema to be altered.
     * @param action Modification operation to be applied.
     * @param value The value of the modification, depending on `action`.  For now the only value of `action` is rename_schema.  In this case the value is the new name of the schema.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterSchemaResponse> - Promise resolving to the response
     */
    alter_schema(schema_name, action, value, options, callback) {
      const actualRequest = {
        schema_name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * The `alter_system_properties` endpoint is primarily used to simplify the
     * testing of the system and is not expected to be used during normal
     * execution.  Commands are given through the `property_updates_map` whose
     * keys are commands and values are strings representing integer values
     * (for example '8000') or boolean values ('true' or 'false').
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterSystemPropertiesResponse> - Promise resolving to the response
     */
    alter_system_properties_request(request, callback) {
      const actualRequest = {
        property_updates_map: request.property_updates_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/system/properties", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * The `alter_system_properties` endpoint is primarily used to simplify the
     * testing of the system and is not expected to be used during normal
     * execution.  Commands are given through the `property_updates_map` whose
     * keys are commands and values are strings representing integer values
     * (for example '8000') or boolean values ('true' or 'false').
     *
     * @param property_updates_map Map containing the properties of the system to be updated. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterSystemPropertiesResponse> - Promise resolving to the response
     */
    alter_system_properties(property_updates_map, options, callback) {
      const actualRequest = {
        property_updates_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/system/properties", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Apply various modifications to a table or view.  The available
     * modifications include the following:
     *
     * Manage a table's columns--a column can be added, removed, or have its
     * type and properties modified, including whether it is dictionary encoded
     * or not.
     *
     * External tables cannot be modified except for their refresh method.
     *
     * Create or delete a column, low-cardinality index, chunk skip,
     * geospatial, CAGRA, or HNSW index. This can speed up certain operations
     * when using expressions containing equality or relational operators on
     * indexed columns. This only applies to tables.
     *
     * Create or delete a foreign key on a particular column.
     *
     * Manage a range-partitioned or a manual list-partitioned table's
     * partitions.
     *
     * Set (or reset) the tier strategy of a table or view.
     *
     * Refresh and manage the refresh mode of a materialized view or an
     * external table.
     *
     * Set the time-to-live (TTL). This can be applied to tables or views.
     *
     * Set the global access mode (i.e. locking) for a table. This setting
     * trumps any role-based access controls that may be in place; e.g., a user
     * with write access to a table marked read-only will not be able to insert
     * records into it. The mode can be set to read-only, write-only,
     * read/write, and no access.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableResponse> - Promise resolving to the response
     */
    alter_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Apply various modifications to a table or view.  The available
     * modifications include the following:
     *
     * Manage a table's columns--a column can be added, removed, or have its
     * type and properties modified, including whether it is dictionary encoded
     * or not.
     *
     * External tables cannot be modified except for their refresh method.
     *
     * Create or delete a column, low-cardinality index, chunk skip,
     * geospatial, CAGRA, or HNSW index. This can speed up certain operations
     * when using expressions containing equality or relational operators on
     * indexed columns. This only applies to tables.
     *
     * Create or delete a foreign key on a particular column.
     *
     * Manage a range-partitioned or a manual list-partitioned table's
     * partitions.
     *
     * Set (or reset) the tier strategy of a table or view.
     *
     * Refresh and manage the refresh mode of a materialized view or an
     * external table.
     *
     * Set the time-to-live (TTL). This can be applied to tables or views.
     *
     * Set the global access mode (i.e. locking) for a table. This setting
     * trumps any role-based access controls that may be in place; e.g., a user
     * with write access to a table marked read-only will not be able to insert
     * records into it. The mode can be set to read-only, write-only,
     * read/write, and no access.
     *
     * @param table_name Table on which the operation will be performed, in
     * [schema_name.]table_name format, using standard name resolution rules.
     * Must be an existing table or view.
     * @param action Modification operation to be applied.
     * @param value The value of the modification, depending on `action`. For
     * example, if `action` is add_column, this would be the column name; while
     * the column's definition would be covered by the column_type,
     * column_properties, column_default_value, and add_column_expression in
     * `options`. If `action` is ttl, it would be the number of minutes for the
     * new TTL. If `action` is refresh, this field would be blank.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableResponse> - Promise resolving to the response
     */
    alter_table(table_name, action, value, options, callback) {
      const actualRequest = {
        table_name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Apply various modifications to columns in a table, view.  The available
     * modifications include the following:
     *
     * Create or delete an index on a particular column. This can speed up
     * certain operations when using expressions containing equality or
     * relational operators on indexed columns. This only applies to tables.
     *
     * Manage a table's columns--a column can be added, removed, or have its
     * type and properties modified, including whether it is dictionary encoded
     * or not.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableColumnsResponse> - Promise resolving to the response
     */
    alter_table_columns_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_alterations: request.column_alterations,
        options: request.options
      };
      const dispatched = this.submitRequest("/alter/table/columns", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Apply various modifications to columns in a table, view.  The available
     * modifications include the following:
     *
     * Create or delete an index on a particular column. This can speed up
     * certain operations when using expressions containing equality or
     * relational operators on indexed columns. This only applies to tables.
     *
     * Manage a table's columns--a column can be added, removed, or have its
     * type and properties modified, including whether it is dictionary encoded
     * or not.
     *
     * @param table_name Table on which the operation will be performed. Must be an existing table or view, in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_alterations List of alter table add/delete/change column requests - all for the same table. Each request is a map that includes 'column_name', 'action' and the options specific for the action. Note that the same options as in alter table requests but in the same map as the column name and the action. For example: [{'column_name':'col_1','action':'change_column','rename_column':'col_2'},{'column_name':'col_1','action':'add_column', 'type':'int','default_value':'1'}].
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableColumnsResponse> - Promise resolving to the response
     */
    alter_table_columns(table_name, column_alterations, options, callback) {
      const actualRequest = {
        table_name,
        column_alterations,
        options
      };
      const dispatched = this.submitRequest("/alter/table/columns", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Updates (adds or changes) metadata for tables. The metadata key and
     * values must both be strings. This is an easy way to annotate whole
     * tables rather than single records within tables.  Some examples of
     * metadata are owner of the table, table creation timestamp etc.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableMetadataResponse> - Promise resolving to the response
     */
    alter_table_metadata_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        metadata_map: request.metadata_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/table/metadata", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Updates (adds or changes) metadata for tables. The metadata key and
     * values must both be strings. This is an easy way to annotate whole
     * tables rather than single records within tables.  Some examples of
     * metadata are owner of the table, table creation timestamp etc.
     *
     * @param table_names Names of the tables whose metadata will be updated, in [schema_name.]table_name format, using standard name resolution rules.  All specified tables must exist, or an error will be returned.
     * @param metadata_map A map which contains the metadata of the tables that are to be updated. Note that only one map is provided for all the tables; so the change will be applied to every table. If the provided map is empty, then all existing metadata for the table(s) will be cleared.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableMetadataResponse> - Promise resolving to the response
     */
    alter_table_metadata(table_names, metadata_map, options, callback) {
      const actualRequest = {
        table_names,
        metadata_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/table/metadata", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a table monitor previously created with `create_table_monitor`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableMonitorResponse> - Promise resolving to the response
     */
    alter_table_monitor_request(request, callback) {
      const actualRequest = {
        topic_id: request.topic_id,
        monitor_updates_map: request.monitor_updates_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a table monitor previously created with `create_table_monitor`.
     *
     * @param topic_id The topic ID returned by `create_table_monitor`.
     * @param monitor_updates_map Map containing the properties of the table monitor to be updated. Error if empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTableMonitorResponse> - Promise resolving to the response
     */
    alter_table_monitor(topic_id, monitor_updates_map, options, callback) {
      const actualRequest = {
        topic_id,
        monitor_updates_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters properties of an existing tier to facilitate resource management.
     *
     * To disable watermark-based eviction, set both high_watermark and
     * low_watermark to 100.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTierResponse> - Promise resolving to the response
     */
    alter_tier_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/tier", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters properties of an existing tier to facilitate resource management.
     *
     * To disable watermark-based eviction, set both high_watermark and
     * low_watermark to 100.
     *
     * @param name Name of the tier to be altered. Must be an existing tier group name:  vram, ram, disk[n], persist, cold[n].
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterTierResponse> - Promise resolving to the response
     */
    alter_tier(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/tier", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a user.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterUserResponse> - Promise resolving to the response
     */
    alter_user_request(request, callback) {
      const actualRequest = {
        name: request.name,
        action: request.action,
        value: request.value,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/user", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a user.
     *
     * @param name Name of the user to be altered. Must be an existing user.
     * @param action Modification operation to be applied to the user.
     * @param value The value of the modification, depending on `action`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterUserResponse> - Promise resolving to the response
     */
    alter_user(name, action, value, options, callback) {
      const actualRequest = {
        name,
        action,
        value,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/user", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a video.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterVideoResponse> - Promise resolving to the response
     */
    alter_video_request(request, callback) {
      const actualRequest = {
        path: request.path,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters a video.
     *
     * @param path Fully-qualified KiFS path to the video to be altered.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterVideoResponse> - Promise resolving to the response
     */
    alter_video(path, options, callback) {
      const actualRequest = {
        path,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters table write-ahead log (WAL) settings.
     *
     * Returns information about the requested table WAL modifications.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AlterWalResponse> - Promise resolving to the response
     */
    alter_wal_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/alter/wal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Alters table write-ahead log (WAL) settings.
     *
     * Returns information about the requested table WAL modifications.
     *
     * @param table_names List of tables to modify. An asterisk changes the system settings.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AlterWalResponse> - Promise resolving to the response
     */
    alter_wal(table_names, options, callback) {
      const actualRequest = {
        table_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/alter/wal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Append (or insert) all records from a source table (specified by
     * `source_table_name`) to a particular target table (specified by
     * `table_name`). The field map (specified by `field_map`) holds the user
     * specified map of target table column names with their mapped source
     * column names.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.AppendRecordsResponse> - Promise resolving to the response
     */
    append_records_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        source_table_name: request.source_table_name,
        field_map: request.field_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/append/records", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Append (or insert) all records from a source table (specified by
     * `source_table_name`) to a particular target table (specified by
     * `table_name`). The field map (specified by `field_map`) holds the user
     * specified map of target table column names with their mapped source
     * column names.
     *
     * @param table_name The table name for the records to be appended, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param source_table_name The source table name to get records from, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table name.
     * @param field_map Contains the mapping of column names from the target table (specified by `table_name`) as the keys, and corresponding column names or expressions (e.g., 'col_name+1') from the source table (specified by `source_table_name`). Must be existing column names in source table and target table, and their types must be matched. For details on using expressions, see Expressions.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.AppendRecordsResponse> - Promise resolving to the response
     */
    append_records(table_name, source_table_name, field_map, options, callback) {
      const actualRequest = {
        table_name,
        source_table_name,
        field_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/append/records", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Scans the requested tables as specified in `table_names` for integrity.
     * Any table chunks which fail the check will be marked as corrupt. By
     * default the database will automatically repair corrupt tables (via
     * truncating). Note that since this reads every table column from disk it
     * may be a potentially long-running operation. The option local_only can
     * be used to skip any table files already written to a remote storage.
     *
     * Returns table corruption results.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CheckTableResponse> - Promise resolving to the response
     */
    check_table_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/check/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Scans the requested tables as specified in `table_names` for integrity.
     * Any table chunks which fail the check will be marked as corrupt. By
     * default the database will automatically repair corrupt tables (via
     * truncating). Note that since this reads every table column from disk it
     * may be a potentially long-running operation. The option local_only can
     * be used to skip any table files already written to a remote storage.
     *
     * Returns table corruption results.
     *
     * @param table_names List of tables to query. An asterisk returns all tables.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CheckTableResponse> - Promise resolving to the response
     */
    check_table(table_names, options, callback) {
      const actualRequest = {
        table_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/check/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears statistics (cardinality, mean value, etc.) for a column in a
     * specified table.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ClearStatisticsResponse> - Promise resolving to the response
     */
    clear_statistics_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name ?? "",
        column_name: request.column_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/clear/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears statistics (cardinality, mean value, etc.) for a column in a
     * specified table.
     *
     * @param table_name Name of a table, in [schema_name.]table_name format,
     * using standard name resolution rules. Must be an existing table.  A
     * value of '*' clears statistics on every user table the caller may read
     * (excluding system schemas, views, and temporary tables); when used,
     * `column_name` must be empty.
     * @param column_name Name of the column in `table_name` for which to clear
     * statistics. The column must be from an existing table. An empty string
     * clears statistics for all columns in the table.  Must be empty when
     * `table_name` is '*'.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ClearStatisticsResponse> - Promise resolving to the response
     */
    clear_statistics(table_name, column_name, options, callback) {
      const actualRequest = {
        table_name: table_name ?? "",
        column_name: column_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/clear/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears (drops) one or all tables in the database cluster. The operation
     * is synchronous meaning that the table will be cleared before the
     * function returns. The response payload returns the status of the
     * operation along with the name of the table that was cleared.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTableResponse> - Promise resolving to the response
     */
    clear_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name ?? "",
        authorization: request.authorization ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/clear/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears (drops) one or all tables in the database cluster. The operation
     * is synchronous meaning that the table will be cleared before the
     * function returns. The response payload returns the status of the
     * operation along with the name of the table that was cleared.
     *
     * @param table_name Name of the table to be cleared, in [schema_name.]table_name format, using standard name resolution rules. Must be an existing table. Empty string clears all available tables, though this behavior is prevented by default via system configuration parameter disable_clear_all.
     * @param authorization No longer used. User can pass an empty string.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTableResponse> - Promise resolving to the response
     */
    clear_table(table_name, authorization, options, callback) {
      const actualRequest = {
        table_name: table_name ?? "",
        authorization: authorization ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/clear/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deactivates a table monitor previously created with
     * `create_table_monitor`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTableMonitorResponse> - Promise resolving to the response
     */
    clear_table_monitor_request(request, callback) {
      const actualRequest = {
        topic_id: request.topic_id,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/clear/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deactivates a table monitor previously created with
     * `create_table_monitor`.
     *
     * @param topic_id The topic ID returned by `create_table_monitor`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTableMonitorResponse> - Promise resolving to the response
     */
    clear_table_monitor(topic_id, options, callback) {
      const actualRequest = {
        topic_id,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/clear/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears (drops) tables in the database cluster. The operation is
     * synchronous meaning that the tables will be cleared before the function
     * returns. The response payload returns the status of the operation for
     * each table requested.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTablesResponse> - Promise resolving to the response
     */
    clear_tables_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/clear/tables", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears (drops) tables in the database cluster. The operation is
     * synchronous meaning that the tables will be cleared before the function
     * returns. The response payload returns the status of the operation for
     * each table requested.
     *
     * @param table_names Names of the tables to be cleared, in [schema_name.]table_name format, using standard name resolution rules. Must be existing tables. Empty list clears all available tables, though this behavior is prevented by default via system configuration parameter disable_clear_all.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTablesResponse> - Promise resolving to the response
     */
    clear_tables(table_names, options, callback) {
      const actualRequest = {
        table_names: table_names ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/clear/tables", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears or cancels the trigger identified by the specified handle. The
     * output returns the handle of the trigger cleared as well as indicating
     * success or failure of the trigger deactivation.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTriggerResponse> - Promise resolving to the response
     */
    clear_trigger_request(request, callback) {
      const actualRequest = {
        trigger_id: request.trigger_id,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/clear/trigger", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Clears or cancels the trigger identified by the specified handle. The
     * output returns the handle of the trigger cleared as well as indicating
     * success or failure of the trigger deactivation.
     *
     * @param trigger_id ID for the trigger to be deactivated.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ClearTriggerResponse> - Promise resolving to the response
     */
    clear_trigger(trigger_id, options, callback) {
      const actualRequest = {
        trigger_id,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/clear/trigger", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Collect statistics for a column(s) in a specified table.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CollectStatisticsResponse> - Promise resolving to the response
     */
    collect_statistics_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_names: request.column_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/collect/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Collect statistics for a column(s) in a specified table.
     *
     * @param table_name Name of a table, in [schema_name.]table_name format,
     * using standard name resolution rules. Must be an existing table.  A
     * value of '*' collects statistics on every user table the caller may read
     * (excluding system schemas, views, and temporary tables); when used,
     * `column_names` must be '*'.
     * @param column_names List of one or more column names in `table_name` for
     * which to collect statistics (cardinality, mean value, etc.). A single
     * entry of '*' expands to every collectable column on the table (geometry,
     * vector, JSON, and array columns are skipped).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CollectStatisticsResponse> - Promise resolving to the response
     */
    collect_statistics(table_name, column_names, options, callback) {
      const actualRequest = {
        table_name,
        column_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/collect/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a database backup, containing a snapshot of existing objects, at
     * the remote file store accessible via the data sink specified by
     * `datasink_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateBackupResponse> - Promise resolving to the response
     */
    create_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name,
        backup_type: request.backup_type,
        backup_objects_map: request.backup_objects_map ?? {},
        datasink_name: request.datasink_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a database backup, containing a snapshot of existing objects, at
     * the remote file store accessible via the data sink specified by
     * `datasink_name`.
     *
     * @param backup_name Name for this backup. If the backup already exists,
     * only an incremental or differential backup can be made, unless recreate
     * is set to true.
     * @param backup_type Type of snapshot to create.
     * @param backup_objects_map Map of objects to be captured in the backup;
     * must be specified when creating a full snapshot and left unspecified
     * when creating an incremental or differential snapshot.
     * @param datasink_name Data sink through which the backup will be stored.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateBackupResponse> - Promise resolving to the response
     */
    create_backup(backup_name, backup_type, backup_objects_map, datasink_name, options, callback) {
      const actualRequest = {
        backup_name,
        backup_type,
        backup_objects_map: backup_objects_map ?? {},
        datasink_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a catalog, which contains the location and connection
     * information for a deltalake catalog that is external to the database.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateCatalogResponse> - Promise resolving to the response
     */
    create_catalog_request(request, callback) {
      const actualRequest = {
        name: request.name,
        table_format: request.table_format,
        location: request.location,
        type: request.type,
        credential: request.credential,
        datasource: request.datasource,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/catalog", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a catalog, which contains the location and connection
     * information for a deltalake catalog that is external to the database.
     *
     * @param name Name of the catalog to be created.
     * @param table_format Table format (iceberg, hudi, deltalake).
     * @param location Location of the catalog in 'http[s]://[server[:port]]]' format.
     * @param type Type of the catalog (REST (unity, polaris, tabular), nessie, hive, glue).
     * @param credential Name of the credential object to be used in catalog.
     * @param datasource Password for the remote system user; may be an empty string.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateCatalogResponse> - Promise resolving to the response
     */
    create_catalog(name, table_format, location, type, credential, datasource, options, callback) {
      const actualRequest = {
        name,
        table_format,
        location,
        type,
        credential,
        datasource,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/catalog", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateContainerRegistryResponse> - Promise resolving to the response
     */
    create_container_registry_request(request, callback) {
      const actualRequest = {
        registry_name: request.registry_name,
        uri: request.uri,
        credential: request.credential,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param registry_name Name of the registry to be created.
     * @param uri The URI of the registry.
     * @param credential Credential name to connect to the registry.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateContainerRegistryResponse> - Promise resolving to the response
     */
    create_container_registry(registry_name, uri, credential, options, callback) {
      const actualRequest = {
        registry_name,
        uri,
        credential,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Create a new credential.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateCredentialResponse> - Promise resolving to the response
     */
    create_credential_request(request, callback) {
      const actualRequest = {
        credential_name: request.credential_name,
        type: request.type,
        identity: request.identity,
        secret: request.secret,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Create a new credential.
     *
     * @param credential_name Name of the credential to be created. Must contain only letters, digits, and underscores, and cannot begin with a digit. Must not match an existing credential name.
     * @param type Type of the credential to be created.
     * @param identity User of the credential to be created.
     * @param secret Password of the credential to be created.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateCredentialResponse> - Promise resolving to the response
     */
    create_credential(credential_name, type, identity, secret, options, callback) {
      const actualRequest = {
        credential_name,
        type,
        identity,
        secret,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a data sink, which contains the destination information for a
     * data sink that is external to the database.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDatasinkResponse> - Promise resolving to the response
     */
    create_datasink_request(request, callback) {
      const actualRequest = {
        name: request.name,
        destination: request.destination,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a data sink, which contains the destination information for a
     * data sink that is external to the database.
     *
     * @param name Name of the data sink to be created.
     * @param destination Destination for the output data in format
     * 'storage_provider_type://path[:port]'.
     *
     * Supported storage provider types are 'azure', 'gcs', 'hdfs', 'http',
     * 'https', 'jdbc', 'kafka', and 's3'.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDatasinkResponse> - Promise resolving to the response
     */
    create_datasink(name, destination, options, callback) {
      const actualRequest = {
        name,
        destination,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a data source, which contains the location and connection
     * information for a data store that is external to the database.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDatasourceResponse> - Promise resolving to the response
     */
    create_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        location: request.location,
        user_name: request.user_name,
        password: request.password,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a data source, which contains the location and connection
     * information for a data store that is external to the database.
     *
     * @param name Name of the data source to be created.
     * @param location Location of the remote storage in
     * 'storage_provider_type://[storage_path[:storage_port]]' format.
     *
     * Supported storage provider types are 'azure', 'gcs', 'hdfs', 'jdbc',
     * 'kafka', 'confluent', and 's3'.
     * @param user_name Name of the remote system user; may be an empty string.
     * @param password Password for the remote system user; may be an empty string.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDatasourceResponse> - Promise resolving to the response
     */
    create_datasource(name, location, user_name, password, options, callback) {
      const actualRequest = {
        name,
        location,
        user_name,
        password,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDeltaTableResponse> - Promise resolving to the response
     */
    create_delta_table_request(request, callback) {
      const actualRequest = {
        delta_table_name: request.delta_table_name,
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/deltatable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param delta_table_name Name of the table to be created.
     * @param table_name Name of the input table whose changes will be forwared to the delta_table_name output.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDeltaTableResponse> - Promise resolving to the response
     */
    create_delta_table(delta_table_name, table_name, options, callback) {
      const actualRequest = {
        delta_table_name,
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/deltatable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new directory in KiFS. The new directory serves as a location
     * in which the user can upload files using `upload_files`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDirectoryResponse> - Promise resolving to the response
     */
    create_directory_request(request, callback) {
      const actualRequest = {
        directory_name: request.directory_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new directory in KiFS. The new directory serves as a location
     * in which the user can upload files using `upload_files`.
     *
     * @param directory_name Name of the directory in KiFS to be created.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateDirectoryResponse> - Promise resolving to the response
     */
    create_directory(directory_name, options, callback) {
      const actualRequest = {
        directory_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new environment which can be used by user-defined functions
     * (UDF).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateEnvironmentResponse> - Promise resolving to the response
     */
    create_environment_request(request, callback) {
      const actualRequest = {
        environment_name: request.environment_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new environment which can be used by user-defined functions
     * (UDF).
     *
     * @param environment_name Name of the environment to be created.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateEnvironmentResponse> - Promise resolving to the response
     */
    create_environment(environment_name, options, callback) {
      const actualRequest = {
        environment_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new graph network using given nodes, edges, weights, and
     * restrictions.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * graph examples before using this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateGraphResponse> - Promise resolving to the response
     */
    create_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        directed_graph: request.directed_graph ?? true,
        nodes: request.nodes,
        edges: request.edges,
        weights: request.weights,
        restrictions: request.restrictions,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new graph network using given nodes, edges, weights, and
     * restrictions.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * graph examples before using this endpoint.
     *
     * @param graph_name Name of the graph resource to generate.
     * @param directed_graph If set to true, the graph will be directed. If set to false, the graph will not be directed. Consult Directed Graphs for more details.
     * @param nodes Nodes represent fundamental topological units of a graph.
     * Nodes must be specified using identifiers; identifiers are grouped as
     * combinations. Identifiers can be used with existing column names, e.g.,
     * 'table.column AS NODE_ID', expressions, e.g., 'ST_MAKEPOINT(column1,
     * column2) AS NODE_WKTPOINT', or constant values, e.g., '{9, 10, 11} AS
     * NODE_ID'. If using constant values in an identifier combination, the
     * number of values specified must match across the combination.
     * @param edges Edges represent the required fundamental topological unit
     * of a graph that typically connect nodes. Edges must be specified using
     * identifiers; identifiers are grouped as combinations. Identifiers can be
     * used with existing column names, e.g., 'table.column AS EDGE_ID',
     * expressions, e.g., 'SUBSTR(column, 1, 6) AS EDGE_NODE1_NAME', or
     * constant values, e.g., "{'family', 'coworker'} AS EDGE_LABEL". If using
     * constant values in an identifier combination, the number of values
     * specified must match across the combination.
     * @param weights Weights represent a method of informing the graph solver
     * of the cost of including a given edge in a solution. Weights must be
     * specified using identifiers; identifiers are grouped as combinations.
     * Identifiers can be used with existing column names, e.g., 'table.column
     * AS WEIGHTS_EDGE_ID', expressions, e.g., 'ST_LENGTH(wkt) AS
     * WEIGHTS_VALUESPECIFIED', or constant values, e.g., '{4, 15} AS
     * WEIGHTS_VALUESPECIFIED'. If using constant values in an identifier
     * combination, the number of values specified must match across the
     * combination.
     * @param restrictions Restrictions represent a method of informing the
     * graph solver which edges and/or nodes should be ignored for the
     * solution. Restrictions must be specified using identifiers; identifiers
     * are grouped as combinations. Identifiers can be used with existing
     * column names, e.g., 'table.column AS RESTRICTIONS_EDGE_ID', expressions,
     * e.g., 'column/2 AS RESTRICTIONS_VALUECOMPARED', or constant values,
     * e.g., '{0, 0, 0, 1} AS RESTRICTIONS_ONOFFCOMPARED'. If using constant
     * values in an identifier combination, the number of values specified must
     * match across the combination.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateGraphResponse> - Promise resolving to the response
     */
    create_graph(graph_name, directed_graph, nodes, edges, weights, restrictions, options, callback) {
      const actualRequest = {
        graph_name,
        directed_graph: directed_graph ?? true,
        nodes,
        edges,
        weights,
        restrictions,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Create a job which will run asynchronously. The response returns a job
     * ID, which can be used to query the status and result of the job. The
     * status and the result of the job upon completion can be requested by
     * `get_job`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateJobResponse> - Promise resolving to the response
     */
    create_job_request(request, callback) {
      const actualRequest = {
        endpoint: request.endpoint,
        request_encoding: request.request_encoding ?? "binary",
        data: request.data,
        data_str: request.data_str,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/job", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Create a job which will run asynchronously. The response returns a job
     * ID, which can be used to query the status and result of the job. The
     * status and the result of the job upon completion can be requested by
     * `get_job`.
     *
     * @param endpoint Indicates which endpoint to execute, e.g. '/alter/table'.
     * @param request_encoding The encoding of the request payload for the job.
     * @param data Binary-encoded payload for the job to be run asynchronously.  The payload must contain the relevant input parameters for the endpoint indicated in `endpoint`.  Please see the documentation for the appropriate endpoint to see what values must (or can) be specified.  If this parameter is used, then `request_encoding` must be binary or snappy.
     * @param data_str JSON-encoded payload for the job to be run asynchronously.  The payload must contain the relevant input parameters for the endpoint indicated in `endpoint`.  Please see the documentation for the appropriate endpoint to see what values must (or can) be specified.  If this parameter is used, then `request_encoding` must be json.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateJobResponse> - Promise resolving to the response
     */
    create_job(endpoint, request_encoding, data, data_str, options, callback) {
      const actualRequest = {
        endpoint,
        request_encoding: request_encoding ?? "binary",
        data,
        data_str,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/job", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a table that is the result of a SQL JOIN.
     *
     * For join details and examples see: Joins.  For limitations, see Join
     * Limitations and Cautions.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateJoinTableResponse> - Promise resolving to the response
     */
    create_join_table_request(request, callback) {
      const actualRequest = {
        join_table_name: request.join_table_name,
        table_names: request.table_names,
        column_names: request.column_names,
        expressions: request.expressions ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/jointable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a table that is the result of a SQL JOIN.
     *
     * For join details and examples see: Joins.  For limitations, see Join
     * Limitations and Cautions.
     *
     * @param join_table_name Name of the join table to be created, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.
     * @param table_names The list of table names composing the join, each in [schema_name.]table_name format, using standard name resolution rules.  Corresponds to a SQL statement FROM clause.
     * @param column_names List of member table columns or column expressions to be included in the join. Columns can be prefixed with 'table_id.column_name', where 'table_id' is the table name or alias.  Columns can be aliased via the syntax 'column_name as alias'. Wild cards '*' can be used to include all columns across member tables or 'table_id.*' for all of a single table's columns.  Columns and column expressions composing the join must be uniquely named or aliased--therefore, the '*' wild card cannot be used if column names aren't unique across all tables.
     * @param expressions An optional list of expressions to combine and filter the joined tables.  Corresponds to a SQL statement WHERE clause. For details see: expressions.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateJoinTableResponse> - Promise resolving to the response
     */
    create_join_table(join_table_name, table_names, column_names, expressions, options, callback) {
      const actualRequest = {
        join_table_name,
        table_names,
        column_names,
        expressions: expressions ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/jointable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Initiates the process of creating a materialized view, reserving the
     * view's name to prevent other views or tables from being created with
     * that name.
     *
     * For materialized view details and examples, see Materialized Views.
     *
     * The response contains `view_id`, which is used to tag each subsequent
     * operation (projection, union, aggregation, filter, or join) that will
     * compose the view.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateMaterializedViewResponse> - Promise resolving to the response
     */
    create_materialized_view_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/materializedview", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Initiates the process of creating a materialized view, reserving the
     * view's name to prevent other views or tables from being created with
     * that name.
     *
     * For materialized view details and examples, see Materialized Views.
     *
     * The response contains `view_id`, which is used to tag each subsequent
     * operation (projection, union, aggregation, filter, or join) that will
     * compose the view.
     *
     * @param table_name Name of the table to be created that is the top-level table of the materialized view, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateMaterializedViewResponse> - Promise resolving to the response
     */
    create_materialized_view(table_name, options, callback) {
      const actualRequest = {
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/materializedview", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates an instance (proc) of the user-defined functions (UDF) specified
     * by the given command, options, and files, and makes it available for
     * execution.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateProcResponse> - Promise resolving to the response
     */
    create_proc_request(request, callback) {
      const actualRequest = {
        proc_name: request.proc_name,
        execution_mode: request.execution_mode ?? "distributed",
        files: request.files ?? {},
        command: request.command ?? "",
        args: request.args ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates an instance (proc) of the user-defined functions (UDF) specified
     * by the given command, options, and files, and makes it available for
     * execution.
     *
     * @param proc_name Name of the proc to be created. Must not be the name of a currently existing proc.
     * @param execution_mode The execution mode of the proc.
     * @param files A map of the files that make up the proc. The keys of the
     * map are file names, and the values are the binary contents of the files.
     * The file names may include subdirectory names (e.g. 'subdir/file') but
     * must not resolve to a directory above the root for the proc.
     *
     * Files may be loaded from existing files in KiFS. Those file names should
     * be prefixed with the uri kifs:// and the values in the map should be
     * empty
     * @param command The command (excluding arguments) that will be invoked
     * when the proc is executed. It will be invoked from the directory
     * containing the proc `files` and may be any command that can be resolved
     * from that directory. It need not refer to a file actually in that
     * directory; for example, it could be 'java' if the proc is a Java
     * application; however, any necessary external programs must be
     * preinstalled on every database node. If the command refers to a file in
     * that directory, it must be preceded with './' as per Linux convention.
     * If not specified, and exactly one file is provided in `files`, that file
     * will be invoked.
     * @param args An array of command-line arguments that will be passed to `command` when the proc is executed.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateProcResponse> - Promise resolving to the response
     */
    create_proc(proc_name, execution_mode, files, command, args, options, callback) {
      const actualRequest = {
        proc_name,
        execution_mode: execution_mode ?? "distributed",
        files: files ?? {},
        command: command ?? "",
        args: args ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new projection of an existing table. A projection represents a
     * subset of the columns (potentially including derived columns) of a
     * table.
     *
     * For projection details and examples, see Projections.  For limitations,
     * see Projection Limitations and Cautions.
     *
     * Window functions, which can perform operations like moving averages, are
     * available through this endpoint as well as `get_records_by_column`.
     *
     * A projection can be created with a different shard key than the source
     * table. By specifying shard_key, the projection will be sharded according
     * to the specified columns, regardless of how the source table is sharded.
     * The source table can even be unsharded or replicated.
     *
     * If `table_name` is empty, selection is performed against a single-row
     * virtual table.  This can be useful in executing temporal (NOW()),
     * identity (USER()), or constant-based functions (GEODIST(-77.11, 38.88,
     * -71.06, 42.36)).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateProjectionResponse> - Promise resolving to the response
     */
    create_projection_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        projection_name: request.projection_name,
        column_names: request.column_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/projection", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new projection of an existing table. A projection represents a
     * subset of the columns (potentially including derived columns) of a
     * table.
     *
     * For projection details and examples, see Projections.  For limitations,
     * see Projection Limitations and Cautions.
     *
     * Window functions, which can perform operations like moving averages, are
     * available through this endpoint as well as `get_records_by_column`.
     *
     * A projection can be created with a different shard key than the source
     * table. By specifying shard_key, the projection will be sharded according
     * to the specified columns, regardless of how the source table is sharded.
     * The source table can even be unsharded or replicated.
     *
     * If `table_name` is empty, selection is performed against a single-row
     * virtual table.  This can be useful in executing temporal (NOW()),
     * identity (USER()), or constant-based functions (GEODIST(-77.11, 38.88,
     * -71.06, 42.36)).
     *
     * @param table_name Name of the existing table on which the projection is to be applied, in [schema_name.]table_name format, using standard name resolution rules.  An empty table name creates a projection from a single-row virtual table, where columns specified should be constants or constant expressions.
     * @param projection_name Name of the projection to be created, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.
     * @param column_names List of columns from `table_name` to be included in the projection. Can include derived columns. Can be specified as aliased via the syntax 'column_name as alias'.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateProjectionResponse> - Promise resolving to the response
     */
    create_projection(table_name, projection_name, column_names, options, callback) {
      const actualRequest = {
        table_name,
        projection_name,
        column_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/projection", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new resource group to facilitate resource management.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateResourceGroupResponse> - Promise resolving to the response
     */
    create_resource_group_request(request, callback) {
      const actualRequest = {
        name: request.name,
        tier_attributes: request.tier_attributes ?? {},
        ranking: request.ranking,
        adjoining_resource_group: request.adjoining_resource_group ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new resource group to facilitate resource management.
     *
     * @param name Name of the group to be created. Must contain only letters, digits, and underscores, and cannot begin with a digit. Must not match existing resource group name.
     * @param tier_attributes Optional map containing tier names and their
     * respective attribute group limits.  The only valid attribute limit that
     * can be set is max_memory (in bytes) for the VRAM and RAM tiers.
     *
     * For instance, to set max VRAM capacity to 1GB per rank per GPU and max
     * RAM capacity to 10GB per rank, use:
     * {'VRAM':{'max_memory':'1000000000'}, 'RAM':{'max_memory':'10000000000'}}
     * @param ranking Indicates the relative ranking among existing resource groups where this new resource group will be placed.
     * @param adjoining_resource_group If `ranking` is before or after, this field indicates the resource group before or after which the current group will be placed; otherwise, leave blank.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateResourceGroupResponse> - Promise resolving to the response
     */
    create_resource_group(name, tier_attributes, ranking, adjoining_resource_group, options, callback) {
      const actualRequest = {
        name,
        tier_attributes: tier_attributes ?? {},
        ranking,
        adjoining_resource_group: adjoining_resource_group ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new role.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateRoleResponse> - Promise resolving to the response
     */
    create_role_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new role.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param name Name of the role to be created. Must contain only lowercase letters, digits, and underscores, and cannot begin with a digit. Must not be the same name as an existing user or role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateRoleResponse> - Promise resolving to the response
     */
    create_role(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a SQL-style schema. Schemas are containers for tables and views.
     * Multiple tables and views can be defined with the same name in different
     * schemas.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateSchemaResponse> - Promise resolving to the response
     */
    create_schema_request(request, callback) {
      const actualRequest = {
        schema_name: request.schema_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a SQL-style schema. Schemas are containers for tables and views.
     * Multiple tables and views can be defined with the same name in different
     * schemas.
     *
     * @param schema_name Name of the schema to be created.  Has the same naming restrictions as tables.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateSchemaResponse> - Promise resolving to the response
     */
    create_schema(schema_name, options, callback) {
      const actualRequest = {
        schema_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a state table in a materialized view allowing a materialized
     * view to maintain state between refreshes. The state table must be a
     * materialized view member.  The state table can be part of a feedback
     * loop including input_table_name. To facilitate such feedback loops the
     * create_state_table can be called before the input_table_name is created
     * but must be created after init_table_name is created.  During the
     * initial call to create the state table init_table_name is copied to
     * table_name, setting the initial state output of the table.   On refresh
     * the create_state_table runs before the endpoint that creates the
     * input_table_name and copies the input_table_name to table_name, setting
     * the state to the version of the input_table from the last refresh.  A
     * materialized view is not complete (ready to refresh and query) until
     * both the root table of the view is created and all the input tables to
     * the state tables have been created.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateStateTableResponse> - Promise resolving to the response
     */
    create_state_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        input_table_name: request.input_table_name,
        init_table_name: request.init_table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/statetable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a state table in a materialized view allowing a materialized
     * view to maintain state between refreshes. The state table must be a
     * materialized view member.  The state table can be part of a feedback
     * loop including input_table_name. To facilitate such feedback loops the
     * create_state_table can be called before the input_table_name is created
     * but must be created after init_table_name is created.  During the
     * initial call to create the state table init_table_name is copied to
     * table_name, setting the initial state output of the table.   On refresh
     * the create_state_table runs before the endpoint that creates the
     * input_table_name and copies the input_table_name to table_name, setting
     * the state to the version of the input_table from the last refresh.  A
     * materialized view is not complete (ready to refresh and query) until
     * both the root table of the view is created and all the input tables to
     * the state tables have been created.
     *
     * @param table_name Name of the table to be created.
     * @param input_table_name Name of the input table to be copied to the output table on refresh.
     * @param init_table_name Name of the initialization table to be copied to the output table during materialized view creation.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateStateTableResponse> - Promise resolving to the response
     */
    create_state_table(table_name, input_table_name, init_table_name, options, callback) {
      const actualRequest = {
        table_name,
        input_table_name,
        init_table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/statetable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new table with the given type (definition of columns).  The
     * type is specified in `type_id` as either a numerical type ID (as
     * returned by `create_type`) or as a list of columns, each specified as a
     * list of the column name, data type, and any column attributes.
     *
     * Example of a type definition with some parameters::
     *
     *     [
     *         ["id", "int8", "primary_key"],
     *         ["dept_id", "int8", "primary_key", "shard_key"],
     *         ["manager_id", "int8", "nullable"],
     *         ["first_name", "char32"],
     *         ["last_name", "char64"],
     *         ["salary", "decimal"],
     *         ["hire_date", "date"]
     *     ]
     *
     * Each column definition consists of the column name (which should meet
     * the standard column naming criteria), the column's specific type (int,
     * long, float, double, string, bytes, or any of the properties map values
     * from `create_type`), and any data handling, data key, or data
     * replacement properties.
     *
     * A table may optionally be designated to use a replicated distribution
     * scheme, or be assigned: foreign keys to other tables, a partitioning
     * scheme, and/or a tier strategy.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableResponse> - Promise resolving to the response
     */
    create_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        type_id: request.type_id,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new table with the given type (definition of columns).  The
     * type is specified in `type_id` as either a numerical type ID (as
     * returned by `create_type`) or as a list of columns, each specified as a
     * list of the column name, data type, and any column attributes.
     *
     * Example of a type definition with some parameters::
     *
     *     [
     *         ["id", "int8", "primary_key"],
     *         ["dept_id", "int8", "primary_key", "shard_key"],
     *         ["manager_id", "int8", "nullable"],
     *         ["first_name", "char32"],
     *         ["last_name", "char64"],
     *         ["salary", "decimal"],
     *         ["hire_date", "date"]
     *     ]
     *
     * Each column definition consists of the column name (which should meet
     * the standard column naming criteria), the column's specific type (int,
     * long, float, double, string, bytes, or any of the properties map values
     * from `create_type`), and any data handling, data key, or data
     * replacement properties.
     *
     * A table may optionally be designated to use a replicated distribution
     * scheme, or be assigned: foreign keys to other tables, a partitioning
     * scheme, and/or a tier strategy.
     *
     * @param table_name Name of the table to be created, in
     * [schema_name.]table_name format, using standard name resolution rules
     * and meeting table naming criteria. Error for requests with existing
     * table of the same name and type ID may be suppressed by using the
     * no_error_if_exists option.
     * @param type_id The type for the table, specified as either an existing
     * table's numerical type ID (as returned by `create_type`) or a type
     * definition (as described above).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableResponse> - Promise resolving to the response
     */
    create_table(table_name, type_id, options, callback) {
      const actualRequest = {
        table_name,
        type_id,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new external table, which is a local database object whose
     * source data is located externally to the database.  The source data can
     * be located either in KiFS; on the cluster, accessible to the database;
     * or remotely, accessible via a pre-defined external data source.
     *
     * The external table can have its structure defined explicitly, via
     * `create_table_options`, which contains many of the options from
     * `create_table`; or defined implicitly, inferred from the source data.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableExternalResponse> - Promise resolving to the response
     */
    create_table_external_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        filepaths: request.filepaths,
        modify_columns: request.modify_columns ?? {},
        create_table_options: request.create_table_options ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/table/external", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new external table, which is a local database object whose
     * source data is located externally to the database.  The source data can
     * be located either in KiFS; on the cluster, accessible to the database;
     * or remotely, accessible via a pre-defined external data source.
     *
     * The external table can have its structure defined explicitly, via
     * `create_table_options`, which contains many of the options from
     * `create_table`; or defined implicitly, inferred from the source data.
     *
     * @param table_name Name of the table to be created, in
     * [schema_name.]table_name format, using standard name resolution rules
     * and meeting table naming criteria.
     * @param filepaths A list of file paths from which data will be sourced;
     *
     * For paths in KiFS, use the URI prefix of kifs:// followed by the path to
     * a file or directory. File matching by prefix is supported, e.g.
     * kifs://dir/file would match dir/file_1 and dir/file_2. When prefix
     * matching is used, the path must start with a full, valid KiFS directory
     * name.
     *
     * If an external data source is specified in datasource_name, these file
     * paths must resolve to accessible files at that data source location.
     * Prefix matching is supported. If the data source is hdfs, prefixes must
     * be aligned with directories, i.e. partial file names will not match.
     *
     * If no data source is specified, the files are assumed to be local to the
     * database and must all be accessible to the gpudb user, residing on the
     * path (or relative to the path) specified by the external files directory
     * in the Kinetica configuration file. Wildcards (*) can be used to specify
     * a group of files.  Prefix matching is supported, the prefixes must be
     * aligned with directories.
     *
     * If the first path ends in .tsv, the text delimiter will be defaulted to
     * a tab character. If the first path ends in .psv, the text delimiter will
     * be defaulted to a pipe character (|).
     * @param modify_columns Not implemented yet.
     * @param create_table_options Options from `create_table`, allowing the
     * structure of the table to be defined independently of the data source
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableExternalResponse> - Promise resolving to the response
     */
    create_table_external(table_name, filepaths, modify_columns, create_table_options, options, callback) {
      const actualRequest = {
        table_name,
        filepaths,
        modify_columns: modify_columns ?? {},
        create_table_options: create_table_options ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/table/external", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a monitor that watches for a single table modification event
     * type (insert, update, or delete) on a particular table (identified by
     * `table_name`) and forwards event notifications to subscribers via ZMQ.
     * After this call completes, subscribe to the returned `topic_id` on the
     * ZMQ table monitor port (default 9002). Each time an operation of the
     * given type on the table completes, a multipart message is published for
     * that topic; the first part contains only the topic ID, and each
     * subsequent part contains one binary-encoded Avro object that corresponds
     * to the event and can be decoded using `type_schema`. The monitor will
     * continue to run (regardless of whether or not there are any subscribers)
     * until deactivated with `clear_table_monitor`.
     *
     * For more information on table monitors, see Table Monitors.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableMonitorResponse> - Promise resolving to the response
     */
    create_table_monitor_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a monitor that watches for a single table modification event
     * type (insert, update, or delete) on a particular table (identified by
     * `table_name`) and forwards event notifications to subscribers via ZMQ.
     * After this call completes, subscribe to the returned `topic_id` on the
     * ZMQ table monitor port (default 9002). Each time an operation of the
     * given type on the table completes, a multipart message is published for
     * that topic; the first part contains only the topic ID, and each
     * subsequent part contains one binary-encoded Avro object that corresponds
     * to the event and can be decoded using `type_schema`. The monitor will
     * continue to run (regardless of whether or not there are any subscribers)
     * until deactivated with `clear_table_monitor`.
     *
     * For more information on table monitors, see Table Monitors.
     *
     * @param table_name Name of the table to monitor, in [schema_name.]table_name format, using standard name resolution rules.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTableMonitorResponse> - Promise resolving to the response
     */
    create_table_monitor(table_name, options, callback) {
      const actualRequest = {
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/tablemonitor", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sets up an area trigger mechanism for two column_names for one or more
     * tables. (This function is essentially the two-dimensional version of
     * `create_trigger_by_range`.) Once the trigger has been activated, any
     * record added to the listed tables(s) via `insert_records` with the
     * chosen columns' values falling within the specified region will trip the
     * trigger. All such records will be queued at the trigger port (by default
     * '9001' but able to be retrieved via `show_system_status`) for any
     * listening client to collect. Active triggers can be cancelled by using
     * the `clear_trigger` endpoint or by clearing all relevant tables.
     *
     * The output returns the trigger handle as well as indicating success or
     * failure of the trigger activation.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTriggerByAreaResponse> - Promise resolving to the response
     */
    create_trigger_by_area_request(request, callback) {
      const actualRequest = {
        request_id: request.request_id,
        table_names: request.table_names,
        x_column_name: request.x_column_name,
        x_vector: request.x_vector,
        y_column_name: request.y_column_name,
        y_vector: request.y_vector,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/trigger/byarea", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sets up an area trigger mechanism for two column_names for one or more
     * tables. (This function is essentially the two-dimensional version of
     * `create_trigger_by_range`.) Once the trigger has been activated, any
     * record added to the listed tables(s) via `insert_records` with the
     * chosen columns' values falling within the specified region will trip the
     * trigger. All such records will be queued at the trigger port (by default
     * '9001' but able to be retrieved via `show_system_status`) for any
     * listening client to collect. Active triggers can be cancelled by using
     * the `clear_trigger` endpoint or by clearing all relevant tables.
     *
     * The output returns the trigger handle as well as indicating success or
     * failure of the trigger activation.
     *
     * @param request_id User-created ID for the trigger. The ID can be alphanumeric, contain symbols, and must contain at least one character.
     * @param table_names Names of the tables on which the trigger will be activated and maintained, each in [schema_name.]table_name format, using standard name resolution rules.
     * @param x_column_name Name of a numeric column on which the trigger is activated. Usually 'x' for geospatial data points.
     * @param x_vector The respective coordinate values for the region on which the trigger is activated. This usually translates to the x-coordinates of a geospatial region.
     * @param y_column_name Name of a second numeric column on which the trigger is activated. Usually 'y' for geospatial data points.
     * @param y_vector The respective coordinate values for the region on which the trigger is activated. This usually translates to the y-coordinates of a geospatial region. Must be the same length as xvals.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTriggerByAreaResponse> - Promise resolving to the response
     */
    create_trigger_by_area(request_id, table_names, x_column_name, x_vector, y_column_name, y_vector, options, callback) {
      const actualRequest = {
        request_id,
        table_names,
        x_column_name,
        x_vector,
        y_column_name,
        y_vector,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/trigger/byarea", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sets up a simple range trigger for a column_name for one or more tables.
     * Once the trigger has been activated, any record added to the listed
     * tables(s) via `insert_records` with the chosen column_name's value
     * falling within the specified range will trip the trigger. All such
     * records will be queued at the trigger port (by default '9001' but able
     * to be retrieved via `show_system_status`) for any listening client to
     * collect. Active triggers can be cancelled by using the `clear_trigger`
     * endpoint or by clearing all relevant tables.
     *
     * The output returns the trigger handle as well as indicating success or
     * failure of the trigger activation.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTriggerByRangeResponse> - Promise resolving to the response
     */
    create_trigger_by_range_request(request, callback) {
      const actualRequest = {
        request_id: request.request_id,
        table_names: request.table_names,
        column_name: request.column_name,
        min: request.min,
        max: request.max,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/trigger/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Sets up a simple range trigger for a column_name for one or more tables.
     * Once the trigger has been activated, any record added to the listed
     * tables(s) via `insert_records` with the chosen column_name's value
     * falling within the specified range will trip the trigger. All such
     * records will be queued at the trigger port (by default '9001' but able
     * to be retrieved via `show_system_status`) for any listening client to
     * collect. Active triggers can be cancelled by using the `clear_trigger`
     * endpoint or by clearing all relevant tables.
     *
     * The output returns the trigger handle as well as indicating success or
     * failure of the trigger activation.
     *
     * @param request_id User-created ID for the trigger. The ID can be alphanumeric, contain symbols, and must contain at least one character.
     * @param table_names Tables on which the trigger will be active, each in [schema_name.]table_name format, using standard name resolution rules.
     * @param column_name Name of a numeric column_name on which the trigger is activated.
     * @param min The lower bound (inclusive) for the trigger range.
     * @param max The upper bound (inclusive) for the trigger range.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTriggerByRangeResponse> - Promise resolving to the response
     */
    create_trigger_by_range(request_id, table_names, column_name, min, max, options, callback) {
      const actualRequest = {
        request_id,
        table_names,
        column_name,
        min,
        max,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/trigger/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new type describing the columns of a table. The type
     * definition is specified as a list of columns, each specified as a list
     * of the column name, data type, and any column attributes.
     *
     * Example of a type definition with some parameters::
     *
     *     [
     *         ["id", "int8", "primary_key"],
     *         ["dept_id", "int8", "primary_key", "shard_key"],
     *         ["manager_id", "int8", "nullable"],
     *         ["first_name", "char32"],
     *         ["last_name", "char64"],
     *         ["salary", "decimal"],
     *         ["hire_date", "date"]
     *     ]
     *
     * Each column definition consists of the column name (which should meet
     * the standard column naming criteria), the column's specific type (int,
     * long, float, double, string, bytes, or any of the possible values for
     * `properties`), and any data handling, data key, or data replacement
     * properties.
     *
     * Note that some properties are mutually exclusive--i.e. they cannot be
     * specified for any given column simultaneously.  One example of mutually
     * exclusive properties are primary_key and nullable.
     *
     * A single primary key and/or single shard key can be set across one or
     * more columns. If a primary key is specified, then a uniqueness
     * constraint is enforced, in that only a single object can exist with a
     * given primary key column value (or set of values for the key columns, if
     * using a composite primary key). When `insert_records` data into a table
     * with a primary key, depending on the parameters in the request, incoming
     * objects with primary key values that match existing objects will either
     * overwrite (i.e. update) the existing object or will be skipped and not
     * added into the set.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTypeResponse> - Promise resolving to the response
     */
    create_type_request(request, callback) {
      const actualRequest = {
        type_definition: request.type_definition,
        label: request.label,
        properties: request.properties ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/type", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new type describing the columns of a table. The type
     * definition is specified as a list of columns, each specified as a list
     * of the column name, data type, and any column attributes.
     *
     * Example of a type definition with some parameters::
     *
     *     [
     *         ["id", "int8", "primary_key"],
     *         ["dept_id", "int8", "primary_key", "shard_key"],
     *         ["manager_id", "int8", "nullable"],
     *         ["first_name", "char32"],
     *         ["last_name", "char64"],
     *         ["salary", "decimal"],
     *         ["hire_date", "date"]
     *     ]
     *
     * Each column definition consists of the column name (which should meet
     * the standard column naming criteria), the column's specific type (int,
     * long, float, double, string, bytes, or any of the possible values for
     * `properties`), and any data handling, data key, or data replacement
     * properties.
     *
     * Note that some properties are mutually exclusive--i.e. they cannot be
     * specified for any given column simultaneously.  One example of mutually
     * exclusive properties are primary_key and nullable.
     *
     * A single primary key and/or single shard key can be set across one or
     * more columns. If a primary key is specified, then a uniqueness
     * constraint is enforced, in that only a single object can exist with a
     * given primary key column value (or set of values for the key columns, if
     * using a composite primary key). When `insert_records` data into a table
     * with a primary key, depending on the parameters in the request, incoming
     * objects with primary key values that match existing objects will either
     * overwrite (i.e. update) the existing object or will be skipped and not
     * added into the set.
     *
     * @param type_definition JSON string defining the columns of the type to be registered, as described above.
     * @param label A user-defined description string which can be used to
     * differentiate between tables and types with otherwise identical schemas.
     * @param properties [DEPRECATED--please use these property values in the
     * `type_definition` directly, as described at the top, instead]  Each
     * key-value pair specifies the properties to use for a given column where
     * the key is the column name.  All keys used must be relevant column names
     * for the given table.  Specifying any property overrides the default
     * properties for that column (which is based on the column's data type).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateTypeResponse> - Promise resolving to the response
     */
    create_type(type_definition, label, properties, options, callback) {
      const actualRequest = {
        type_definition,
        label,
        properties: properties ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/type", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Merges data from one or more tables with comparable data types into a
     * new table.
     *
     * The following merges are supported:
     *
     * UNION (DISTINCT/ALL) - For data set union details and examples, see
     * Union. For limitations, see Union Limitations and Cautions.
     *
     * INTERSECT (DISTINCT/ALL) - For data set intersection details and
     * examples, see Intersect. For limitations, see Intersect Limitations.
     *
     * EXCEPT (DISTINCT/ALL) - For data set subtraction details and examples,
     * see Except. For limitations, see Except Limitations.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUnionResponse> - Promise resolving to the response
     */
    create_union_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        table_names: request.table_names,
        input_column_names: request.input_column_names,
        output_column_names: request.output_column_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/union", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Merges data from one or more tables with comparable data types into a
     * new table.
     *
     * The following merges are supported:
     *
     * UNION (DISTINCT/ALL) - For data set union details and examples, see
     * Union. For limitations, see Union Limitations and Cautions.
     *
     * INTERSECT (DISTINCT/ALL) - For data set intersection details and
     * examples, see Intersect. For limitations, see Intersect Limitations.
     *
     * EXCEPT (DISTINCT/ALL) - For data set subtraction details and examples,
     * see Except. For limitations, see Except Limitations.
     *
     * @param table_name Name of the table to be created, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.
     * @param table_names The list of table names to merge, in [schema_name.]table_name format, using standard name resolution rules.  Must contain the names of one or more existing tables.
     * @param input_column_names The list of columns from each of the corresponding input tables.
     * @param output_column_names The list of names of the columns to be stored in the output table.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUnionResponse> - Promise resolving to the response
     */
    create_union(table_name, table_names, input_column_names, output_column_names, options, callback) {
      const actualRequest = {
        table_name,
        table_names,
        input_column_names,
        output_column_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/union", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new external user (a user whose credentials are managed by an
     * external LDAP).
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUserExternalResponse> - Promise resolving to the response
     */
    create_user_external_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/user/external", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new external user (a user whose credentials are managed by an
     * external LDAP).
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param name Name of the user to be created. Must exactly match the user's name in the external LDAP, prefixed with a @. Must not be the same name as an existing user.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUserExternalResponse> - Promise resolving to the response
     */
    create_user_external(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/user/external", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new internal user (a user whose credentials are managed by the
     * database system).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUserInternalResponse> - Promise resolving to the response
     */
    create_user_internal_request(request, callback) {
      const actualRequest = {
        name: request.name,
        password: request.password,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/user/internal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a new internal user (a user whose credentials are managed by the
     * database system).
     *
     * @param name Name of the user to be created. Must contain only lowercase letters, digits, and underscores, and cannot begin with a digit. Must not be the same name as an existing user or role.
     * @param password Initial password of the user to be created. May be an empty string for no password.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateUserInternalResponse> - Promise resolving to the response
     */
    create_user_internal(name, password, options, callback) {
      const actualRequest = {
        name,
        password,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/user/internal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a job to generate a sequence of raster images that visualize
     * data over a specified time.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.CreateVideoResponse> - Promise resolving to the response
     */
    create_video_request(request, callback) {
      const actualRequest = {
        attribute: request.attribute,
        begin: request.begin,
        duration_seconds: request.duration_seconds,
        end: request.end,
        frames_per_second: request.frames_per_second,
        style: request.style,
        path: request.path,
        style_parameters: request.style_parameters,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/create/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Creates a job to generate a sequence of raster images that visualize
     * data over a specified time.
     *
     * @param attribute The animated attribute to map to the video's frames. Must be present in the LAYERS specified for the visualization. This is often a time-related field but may be any numeric type.
     * @param begin The start point for the video. Accepts an expression evaluable over the `attribute`.
     * @param duration_seconds Seconds of video to produce.
     * @param end The end point for the video. Accepts an expression evaluable over the `attribute`.
     * @param frames_per_second The presentation frame rate of the encoded video in frames per second.
     * @param style The name of the visualize mode; should correspond to the schema used for the `style_parameters` field.
     * @param path Fully-qualified KiFS path.  Write access is required. A file must not exist at that path, unless replace_if_exists is true.
     * @param style_parameters A string containing the JSON-encoded visualize request.  Must correspond to the visualize mode specified in the `style` field.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.CreateVideoResponse> - Promise resolving to the response
     */
    create_video(attribute, begin, duration_seconds, end, frames_per_second, style, path, style_parameters, options, callback) {
      const actualRequest = {
        attribute,
        begin,
        duration_seconds,
        end,
        frames_per_second,
        style,
        path,
        style_parameters,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/create/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a directory from KiFS.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteDirectoryResponse> - Promise resolving to the response
     */
    delete_directory_request(request, callback) {
      const actualRequest = {
        directory_name: request.directory_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a directory from KiFS.
     *
     * @param directory_name Name of the directory in KiFS to be deleted. The directory must contain no files, unless recursive is true.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteDirectoryResponse> - Promise resolving to the response
     */
    delete_directory(directory_name, options, callback) {
      const actualRequest = {
        directory_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes one or more files from KiFS.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteFilesResponse> - Promise resolving to the response
     */
    delete_files_request(request, callback) {
      const actualRequest = {
        file_names: request.file_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes one or more files from KiFS.
     *
     * @param file_names An array of names of files to be deleted. File paths
     * may contain wildcard characters after the KiFS directory delimiter.
     *
     * Accepted wildcard characters are asterisk (*) to represent any string of
     * zero or more characters, and question mark (?) to indicate a single
     * character.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteFilesResponse> - Promise resolving to the response
     */
    delete_files(file_names, options, callback) {
      const actualRequest = {
        file_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing graph from the graph server and/or persist.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteGraphResponse> - Promise resolving to the response
     */
    delete_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing graph from the graph server and/or persist.
     *
     * @param graph_name Name of the graph to be deleted.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteGraphResponse> - Promise resolving to the response
     */
    delete_graph(graph_name, options, callback) {
      const actualRequest = {
        graph_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a proc. Any currently running instances of the proc will be
     * killed.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteProcResponse> - Promise resolving to the response
     */
    delete_proc_request(request, callback) {
      const actualRequest = {
        proc_name: request.proc_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a proc. Any currently running instances of the proc will be
     * killed.
     *
     * @param proc_name Name of the proc to be deleted. Must be the name of a currently existing proc.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteProcResponse> - Promise resolving to the response
     */
    delete_proc(proc_name, options, callback) {
      const actualRequest = {
        proc_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes record(s) matching the provided criteria from the given table.
     * The record selection criteria can either be one or more  `expressions`
     * (matching multiple records), a single record identified by record_id
     * options, or all records when using delete_all_records.  Note that the
     * three selection criteria are mutually exclusive.  This operation cannot
     * be run on a view.  The operation is synchronous meaning that a response
     * will not be available until the request is completely processed and all
     * the matching records are deleted.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteRecordsResponse> - Promise resolving to the response
     */
    delete_records_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        expressions: request.expressions,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/records", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes record(s) matching the provided criteria from the given table.
     * The record selection criteria can either be one or more  `expressions`
     * (matching multiple records), a single record identified by record_id
     * options, or all records when using delete_all_records.  Note that the
     * three selection criteria are mutually exclusive.  This operation cannot
     * be run on a view.  The operation is synchronous meaning that a response
     * will not be available until the request is completely processed and all
     * the matching records are deleted.
     *
     * @param table_name Name of the table from which to delete records, in [schema_name.]table_name format, using standard name resolution rules. Must contain the name of an existing table; not applicable to views.
     * @param expressions A list of the actual predicates, one for each select; format should follow the guidelines provided here. Specifying one or more `expressions` is mutually exclusive to specifying record_id in the `options`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteRecordsResponse> - Promise resolving to the response
     */
    delete_records(table_name, expressions, options, callback) {
      const actualRequest = {
        table_name,
        expressions,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/records", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a resource group.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteResourceGroupResponse> - Promise resolving to the response
     */
    delete_resource_group_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes a resource group.
     *
     * @param name Name of the resource group to be deleted.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteResourceGroupResponse> - Promise resolving to the response
     */
    delete_resource_group(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/resourcegroup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing role.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteRoleResponse> - Promise resolving to the response
     */
    delete_role_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing role.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param name Name of the role to be deleted. Must be an existing role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteRoleResponse> - Promise resolving to the response
     */
    delete_role(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing user.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteUserResponse> - Promise resolving to the response
     */
    delete_user_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/delete/user", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes an existing user.
     *
     * **Note:** This method should be used for on-premise deployments only.
     *
     * @param name Name of the user to be deleted. Must be an existing user.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DeleteUserResponse> - Promise resolving to the response
     */
    delete_user(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/delete/user", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Downloads one or more files from KiFS.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DownloadFilesResponse> - Promise resolving to the response
     */
    download_files_request(request, callback) {
      const actualRequest = {
        file_names: request.file_names,
        read_offsets: request.read_offsets,
        read_lengths: request.read_lengths,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/download/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Downloads one or more files from KiFS.
     *
     * @param file_names An array of the file names to download from KiFS. File
     * paths may contain wildcard characters after the KiFS directory
     * delimiter.
     *
     * Accepted wildcard characters are asterisk (*) to represent any string of
     * zero or more characters, and question mark (?) to indicate a single
     * character.
     * @param read_offsets An array of starting byte offsets from which to read
     * each respective file in `file_names`. Must either be empty or the same
     * length as `file_names`. If empty, files are downloaded in their
     * entirety. If not empty, `read_lengths` must also not be empty.
     * @param read_lengths Array of number of bytes to read from each
     * respective file in `file_names`. Must either be empty or the same length
     * as `file_names`. If empty, files are downloaded in their entirety. If
     * not empty, `read_offsets` must also not be empty.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DownloadFilesResponse> - Promise resolving to the response
     */
    download_files(file_names, read_offsets, read_lengths, options, callback) {
      const actualRequest = {
        file_names,
        read_offsets,
        read_lengths,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/download/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes one or more existing database backups and contained snapshots,
     * accessible via the data sink specified by `datasink_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropBackupResponse> - Promise resolving to the response
     */
    drop_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name,
        datasink_name: request.datasink_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Deletes one or more existing database backups and contained snapshots,
     * accessible via the data sink specified by `datasink_name`.
     *
     * @param backup_name Name of the backup to be deleted. An empty string or
     * '*' will delete all existing backups. Any text followed by a '*' will
     * delete backups whose name starts with that text.  When deleting multiple
     * backups, delete_all_backups must be set to true.
     * @param datasink_name Data sink through which the backup is accessible.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropBackupResponse> - Promise resolving to the response
     */
    drop_backup(backup_name, datasink_name, options, callback) {
      const actualRequest = {
        backup_name,
        datasink_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing catalog.  Any external tables that depend on the
     * catalog must be dropped before it can be dropped.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropCatalogResponse> - Promise resolving to the response
     */
    drop_catalog_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/catalog", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing catalog.  Any external tables that depend on the
     * catalog must be dropped before it can be dropped.
     *
     * @param name Name of the catalog to be dropped. Must be an existing catalog.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropCatalogResponse> - Promise resolving to the response
     */
    drop_catalog(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/catalog", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropContainerRegistryResponse> - Promise resolving to the response
     */
    drop_container_registry_request(request, callback) {
      const actualRequest = {
        registry_name: request.registry_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param registry_name Name of the registry to be dropped.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropContainerRegistryResponse> - Promise resolving to the response
     */
    drop_container_registry(registry_name, options, callback) {
      const actualRequest = {
        registry_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drop an existing credential.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropCredentialResponse> - Promise resolving to the response
     */
    drop_credential_request(request, callback) {
      const actualRequest = {
        credential_name: request.credential_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drop an existing credential.
     *
     * @param credential_name Name of the credential to be dropped. Must be an existing credential.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropCredentialResponse> - Promise resolving to the response
     */
    drop_credential(credential_name, options, callback) {
      const actualRequest = {
        credential_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing data sink.
     *
     * By default, if any table monitors use this sink as a destination, the
     * request will be blocked unless option clear_table_monitors is true.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropDatasinkResponse> - Promise resolving to the response
     */
    drop_datasink_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing data sink.
     *
     * By default, if any table monitors use this sink as a destination, the
     * request will be blocked unless option clear_table_monitors is true.
     *
     * @param name Name of the data sink to be dropped. Must be an existing data sink.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropDatasinkResponse> - Promise resolving to the response
     */
    drop_datasink(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing data source.  Any external tables that depend on the
     * data source must be dropped before it can be dropped.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropDatasourceResponse> - Promise resolving to the response
     */
    drop_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing data source.  Any external tables that depend on the
     * data source must be dropped before it can be dropped.
     *
     * @param name Name of the data source to be dropped. Must be an existing data source.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropDatasourceResponse> - Promise resolving to the response
     */
    drop_datasource(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drop an existing user-defined function (UDF) environment.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropEnvironmentResponse> - Promise resolving to the response
     */
    drop_environment_request(request, callback) {
      const actualRequest = {
        environment_name: request.environment_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drop an existing user-defined function (UDF) environment.
     *
     * @param environment_name Name of the environment to be dropped. Must be an existing environment.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropEnvironmentResponse> - Promise resolving to the response
     */
    drop_environment(environment_name, options, callback) {
      const actualRequest = {
        environment_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropModelResponse> - Promise resolving to the response
     */
    drop_model_request(request, callback) {
      const actualRequest = {
        model_name: request.model_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param model_name Name of the model to be imported.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropModelResponse> - Promise resolving to the response
     */
    drop_model(model_name, options, callback) {
      const actualRequest = {
        model_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing SQL-style schema, specified in `schema_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropSchemaResponse> - Promise resolving to the response
     */
    drop_schema_request(request, callback) {
      const actualRequest = {
        schema_name: request.schema_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Drops an existing SQL-style schema, specified in `schema_name`.
     *
     * @param schema_name Name of the schema to be dropped. Must be an existing schema.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropSchemaResponse> - Promise resolving to the response
     */
    drop_schema(schema_name, options, callback) {
      const actualRequest = {
        schema_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Ends the client session named by the X-Kinetica-Session HTTP header of
     * this request, dropping every session temp table (a table created in SQL
     * as #name) that belongs to it.  Objects outside the session that depend
     * on those tables are invalidated, not dropped.
     *
     * A client sends its session ID in the X-Kinetica-Session HTTP header to
     * every endpoint (e.g., /execute/sql), and needs to call this endpoint
     * only when a response's info map has carried session_id_used set to true.
     *
     * Only the user that owns the session, or a system administrator, may drop
     * it.  Dropping an unknown session is a no-op.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.DropSessionResponse> - Promise resolving to the response
     */
    drop_session_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/drop/session", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Ends the client session named by the X-Kinetica-Session HTTP header of
     * this request, dropping every session temp table (a table created in SQL
     * as #name) that belongs to it.  Objects outside the session that depend
     * on those tables are invalidated, not dropped.
     *
     * A client sends its session ID in the X-Kinetica-Session HTTP header to
     * every endpoint (e.g., /execute/sql), and needs to call this endpoint
     * only when a response's info map has carried session_id_used set to true.
     *
     * Only the user that owns the session, or a system administrator, may drop
     * it.  Dropping an unknown session is a no-op.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.DropSessionResponse> - Promise resolving to the response
     */
    drop_session(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/drop/session", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.EvaluateModelResponse> - Promise resolving to the response
     */
    evaluate_model_request(request, callback) {
      const actualRequest = {
        model_name: request.model_name,
        replicas: request.replicas,
        deployment_mode: request.deployment_mode,
        source_table: request.source_table,
        destination_table: request.destination_table,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/evaluate/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param model_name Name of the model to be evaluated.
     * @param replicas Number of replicas.
     * @param deployment_mode Type of the deployment.
     * @param source_table Name of the source table.
     * @param destination_table Output table.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.EvaluateModelResponse> - Promise resolving to the response
     */
    evaluate_model(model_name, replicas, deployment_mode, source_table, destination_table, options, callback) {
      const actualRequest = {
        model_name,
        replicas,
        deployment_mode,
        source_table,
        destination_table,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/evaluate/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Executes a proc. This endpoint is asynchronous and does not wait for the
     * proc to complete before returning.
     *
     * If the proc being executed is distributed, `input_table_names` and
     * `input_column_names` may be passed to the proc to use for reading data,
     * and `output_table_names` may be passed to the proc to use for writing
     * data.
     *
     * If the proc being executed is non-distributed, these table parameters
     * will be ignored.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ExecuteProcResponse> - Promise resolving to the response
     */
    execute_proc_request(request, callback) {
      const actualRequest = {
        proc_name: request.proc_name,
        params: request.params ?? {},
        bin_params: request.bin_params ?? {},
        input_table_names: request.input_table_names ?? [],
        input_column_names: request.input_column_names ?? {},
        output_table_names: request.output_table_names ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/execute/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Executes a proc. This endpoint is asynchronous and does not wait for the
     * proc to complete before returning.
     *
     * If the proc being executed is distributed, `input_table_names` and
     * `input_column_names` may be passed to the proc to use for reading data,
     * and `output_table_names` may be passed to the proc to use for writing
     * data.
     *
     * If the proc being executed is non-distributed, these table parameters
     * will be ignored.
     *
     * @param proc_name Name of the proc to execute. Must be the name of a currently existing proc.
     * @param params A map containing named parameters to pass to the proc. Each key/value pair specifies the name of a parameter and its value.
     * @param bin_params A map containing named binary parameters to pass to the proc. Each key/value pair specifies the name of a parameter and its value.
     * @param input_table_names Names of the tables containing data to be
     * passed to the proc. Each name specified must be the name of a currently
     * existing table, in [schema_name.]table_name format, using standard name
     * resolution rules. If no table names are specified, no data will be
     * passed to the proc.  This parameter is ignored if the proc has a
     * non-distributed execution mode.
     * @param input_column_names Map of table names from `input_table_names` to
     * lists of names of columns from those tables that will be passed to the
     * proc. Each column name specified must be the name of an existing column
     * in the corresponding table. If a table name from `input_table_names` is
     * not included, all columns from that table will be passed to the proc.
     * This parameter is ignored if the proc has a non-distributed execution
     * mode.
     * @param output_table_names Names of the tables to which output data from
     * the proc will be written, each in [schema_name.]table_name format, using
     * standard name resolution rules and meeting table naming criteria. If a
     * specified table does not exist, it will automatically be created with
     * the same schema as the corresponding table (by order) from
     * `input_table_names`, excluding any primary and shard keys. If a
     * specified table is a non-persistent result table, it must not have
     * primary or shard keys. If no table names are specified, no output data
     * can be returned from the proc. This parameter is ignored if the proc has
     * a non-distributed execution mode.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ExecuteProcResponse> - Promise resolving to the response
     */
    execute_proc(proc_name, params, bin_params, input_table_names, input_column_names, output_table_names, options, callback) {
      const actualRequest = {
        proc_name,
        params: params ?? {},
        bin_params: bin_params ?? {},
        input_table_names: input_table_names ?? [],
        input_column_names: input_column_names ?? {},
        output_table_names: output_table_names ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/execute/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Execute a SQL statement (query, DML, or DDL).
     *
     * See SQL Support for the complete set of supported SQL commands.
     *
     * When a caller wants all the results from a large query (e.g., more than
     * max_get_records_size records), they can make multiple calls to this
     * endpoint using the `offset` and `limit` parameters to page through the
     * results.  Normally, this will execute the `statement` query each time.
     * To avoid re-executing the query each time and to keep the results in the
     * same order, the caller should specify a paging_table name to hold the
     * results of the query between calls and specify the paging_table on
     * subsequent calls. When this is done, the caller should clear the paging
     * table and any other tables in the result_table_list (both returned in
     * the response) when they are done paging through the results.
     * `paging_table` (and result_table_list) will be empty if no paging table
     * was created (e.g., when all the query results were returned in the first
     * call).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ExecuteSqlResponse> - Promise resolving to the response
     */
    execute_sql_request(request, callback) {
      const actualRequest = {
        statement: request.statement,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/execute/sql"),
        request_schema_str: request.request_schema_str ?? "",
        data: request.data ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/execute/sql", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Execute a SQL statement (query, DML, or DDL).
     *
     * See SQL Support for the complete set of supported SQL commands.
     *
     * When a caller wants all the results from a large query (e.g., more than
     * max_get_records_size records), they can make multiple calls to this
     * endpoint using the `offset` and `limit` parameters to page through the
     * results.  Normally, this will execute the `statement` query each time.
     * To avoid re-executing the query each time and to keep the results in the
     * same order, the caller should specify a paging_table name to hold the
     * results of the query between calls and specify the paging_table on
     * subsequent calls. When this is done, the caller should clear the paging
     * table and any other tables in the result_table_list (both returned in
     * the response) when they are done paging through the results.
     * `paging_table` (and result_table_list) will be empty if no paging table
     * was created (e.g., when all the query results were returned in the first
     * call).
     *
     * @param statement SQL statement (query, DML, or DDL) to be executed.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `has_more_records` to see if more records exist in the result to be
     * fetched, and `offset` and `limit` to request subsequent pages of
     * results.
     * @param request_schema_str Avro schema of `data`.
     * @param data An array of binary-encoded data for the records to be binded to the SQL query.  Or use query_parameters to pass the data in JSON format.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ExecuteSqlResponse> - Promise resolving to the response
     */
    execute_sql(statement, offset, limit, request_schema_str, data, options, callback) {
      const actualRequest = {
        statement,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/execute/sql"),
        request_schema_str: request_schema_str ?? "",
        data: data ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/execute/sql", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Export query metrics to a given destination.
     *
     * Returns query metrics.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ExportQueryMetricsResponse> - Promise resolving to the response
     */
    export_query_metrics_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/export/query/metrics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Export query metrics to a given destination.
     *
     * Returns query metrics.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ExportQueryMetricsResponse> - Promise resolving to the response
     */
    export_query_metrics(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/export/query/metrics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Export records from a table to files. All tables can be exported, in
     * full or partial (see columns_to_export and columns_to_skip). Additional
     * filtering can be applied when using export table with expression through
     * SQL. Default destination is KIFS, though other storage types (Azure, S3,
     * GCS, and HDFS) are supported through datasink_name; see
     * `create_datasink`.
     *
     * Server's local file system is not supported.  Default file format is
     * delimited text. See options for different file types and different
     * options for each file type.  Table is saved to a single file if within
     * max file size limits (may vary depending on datasink type).  If not,
     * then table is split into multiple files; these may be smaller than the
     * max size limit.
     *
     * All filenames created are returned in the response.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ExportRecordsToFilesResponse> - Promise resolving to the response
     */
    export_records_to_files_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        filepath: request.filepath,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/export/records/tofiles", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Export records from a table to files. All tables can be exported, in
     * full or partial (see columns_to_export and columns_to_skip). Additional
     * filtering can be applied when using export table with expression through
     * SQL. Default destination is KIFS, though other storage types (Azure, S3,
     * GCS, and HDFS) are supported through datasink_name; see
     * `create_datasink`.
     *
     * Server's local file system is not supported.  Default file format is
     * delimited text. See options for different file types and different
     * options for each file type.  Table is saved to a single file if within
     * max file size limits (may vary depending on datasink type).  If not,
     * then table is split into multiple files; these may be smaller than the
     * max size limit.
     *
     * All filenames created are returned in the response.
     *
     * @param table_name The name of the table whose records are to be exported.
     * @param filepath Path to data export target.  If `filepath` has a file
     * extension, it is read as the name of a file. If `filepath` is a
     * directory, then the source table name with a random UUID appended will
     * be used as the name of each exported file, all written to that
     * directory. If filepath is a filename, then all exported files will have
     * a random UUID appended to the given name.  In either case, the target
     * directory specified or implied must exist.  The names of all exported
     * files are returned in the response.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ExportRecordsToFilesResponse> - Promise resolving to the response
     */
    export_records_to_files(table_name, filepath, options, callback) {
      const actualRequest = {
        table_name,
        filepath,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/export/records/tofiles", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Exports records from source table to the specified target table in an
     * external database.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ExportRecordsToTableResponse> - Promise resolving to the response
     */
    export_records_to_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        remote_query: request.remote_query ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/export/records/totable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Exports records from source table to the specified target table in an
     * external database.
     *
     * @param table_name Name of the table from which the data will be exported
     * to remote database, in [schema_name.]table_name format, using standard
     * name resolution rules.
     * @param remote_query Parameterized insert query to export gpudb table data into remote database.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ExportRecordsToTableResponse> - Promise resolving to the response
     */
    export_records_to_table(table_name, remote_query, options, callback) {
      const actualRequest = {
        table_name,
        remote_query: remote_query ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/export/records/totable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters data based on the specified expression.  The results are stored
     * in a result set with the given `view_name`.
     *
     * For details see Expressions.
     *
     * The response message contains the number of points for which the
     * expression evaluated to be true, which is equivalent to the size of the
     * result view.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterResponse> - Promise resolving to the response
     */
    filter_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        expression: request.expression,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters data based on the specified expression.  The results are stored
     * in a result set with the given `view_name`.
     *
     * For details see Expressions.
     *
     * The response message contains the number of points for which the
     * expression evaluated to be true, which is equivalent to the size of the
     * result view.
     *
     * @param table_name Name of the table to filter, in [schema_name.]table_name format, using standard name resolution rules.  This may be the name of a table or a view (when chaining queries).
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param expression The select expression to filter the specified table.  For details see Expressions.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterResponse> - Promise resolving to the response
     */
    filter(table_name, view_name, expression, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        expression,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table are within a named area of
     * interest (NAI/polygon). The operation is synchronous, meaning that a
     * response will not be returned until all the matching objects are fully
     * available. The response payload provides the count of the resulting set.
     * A new resultant set (view) which satisfies the input NAI restriction
     * specification is created with the name `view_name` passed in as part of
     * the input.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByAreaResponse> - Promise resolving to the response
     */
    filter_by_area_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        x_column_name: request.x_column_name,
        x_vector: request.x_vector,
        y_column_name: request.y_column_name,
        y_vector: request.y_vector,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byarea", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table are within a named area of
     * interest (NAI/polygon). The operation is synchronous, meaning that a
     * response will not be returned until all the matching objects are fully
     * available. The response payload provides the count of the resulting set.
     * A new resultant set (view) which satisfies the input NAI restriction
     * specification is created with the name `view_name` passed in as part of
     * the input.
     *
     * @param table_name Name of the table to filter, in [schema_name.]table_name format, using standard name resolution rules.  This may be the name of a table or a view (when chaining queries).
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param x_column_name Name of the column containing the x values to be filtered.
     * @param x_vector List of x coordinates of the vertices of the polygon representing the area to be filtered.
     * @param y_column_name Name of the column containing the y values to be filtered.
     * @param y_vector List of y coordinates of the vertices of the polygon representing the area to be filtered.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByAreaResponse> - Promise resolving to the response
     */
    filter_by_area(table_name, view_name, x_column_name, x_vector, y_column_name, y_vector, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        x_column_name,
        x_vector,
        y_column_name,
        y_vector,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byarea", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * named area of interest (NAI/polygon). The operation is synchronous,
     * meaning that a response will not be returned until all the matching
     * objects are fully available. The response payload provides the count of
     * the resulting set. A new resultant set (view) which satisfies the input
     * NAI restriction specification is created with the name `view_name`
     * passed in as part of the input.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByAreaGeometryResponse> - Promise resolving to the response
     */
    filter_by_area_geometry_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        x_vector: request.x_vector,
        y_vector: request.y_vector,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byarea/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * named area of interest (NAI/polygon). The operation is synchronous,
     * meaning that a response will not be returned until all the matching
     * objects are fully available. The response payload provides the count of
     * the resulting set. A new resultant set (view) which satisfies the input
     * NAI restriction specification is created with the name `view_name`
     * passed in as part of the input.
     *
     * @param table_name Name of the table to filter, in [schema_name.]table_name format, using standard name resolution rules.  This may be the name of a table or a view (when chaining queries).
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of the geospatial geometry column to be filtered.
     * @param x_vector List of x coordinates of the vertices of the polygon representing the area to be filtered.
     * @param y_vector List of y coordinates of the vertices of the polygon representing the area to be filtered.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByAreaGeometryResponse> - Promise resolving to the response
     */
    filter_by_area_geometry(table_name, view_name, column_name, x_vector, y_vector, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        x_vector,
        y_vector,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byarea/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates how many objects within the given table lie in a rectangular
     * box. The operation is synchronous, meaning that a response will not be
     * returned until all the objects are fully available. The response payload
     * provides the count of the resulting set. A new resultant set which
     * satisfies the input NAI restriction specification is also created when a
     * `view_name` is passed in as part of the input payload.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByBoxResponse> - Promise resolving to the response
     */
    filter_by_box_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        x_column_name: request.x_column_name,
        min_x: request.min_x,
        max_x: request.max_x,
        y_column_name: request.y_column_name,
        min_y: request.min_y,
        max_y: request.max_y,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bybox", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates how many objects within the given table lie in a rectangular
     * box. The operation is synchronous, meaning that a response will not be
     * returned until all the objects are fully available. The response payload
     * provides the count of the resulting set. A new resultant set which
     * satisfies the input NAI restriction specification is also created when a
     * `view_name` is passed in as part of the input payload.
     *
     * @param table_name Name of the table on which the bounding box operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param x_column_name Name of the column on which to perform the bounding box query. Must be a valid numeric column.
     * @param min_x Lower bound for the column chosen by `x_column_name`.  Must be less than or equal to `max_x`.
     * @param max_x Upper bound for `x_column_name`.  Must be greater than or equal to `min_x`.
     * @param y_column_name Name of a column on which to perform the bounding box query. Must be a valid numeric column.
     * @param min_y Lower bound for `y_column_name`. Must be less than or equal to `max_y`.
     * @param max_y Upper bound for `y_column_name`. Must be greater than or equal to `min_y`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByBoxResponse> - Promise resolving to the response
     */
    filter_by_box(table_name, view_name, x_column_name, min_x, max_x, y_column_name, min_y, max_y, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        x_column_name,
        min_x,
        max_x,
        y_column_name,
        min_y,
        max_y,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bybox", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * rectangular box. The operation is synchronous, meaning that a response
     * will not be returned until all the objects are fully available. The
     * response payload provides the count of the resulting set. A new
     * resultant set which satisfies the input NAI restriction specification is
     * also created when a `view_name` is passed in as part of the input
     * payload.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByBoxGeometryResponse> - Promise resolving to the response
     */
    filter_by_box_geometry_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bybox/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * rectangular box. The operation is synchronous, meaning that a response
     * will not be returned until all the objects are fully available. The
     * response payload provides the count of the resulting set. A new
     * resultant set which satisfies the input NAI restriction specification is
     * also created when a `view_name` is passed in as part of the input
     * payload.
     *
     * @param table_name Name of the table on which the bounding box operation will be performed, in [schema_name.]table_name format, using standard name resolution rules. Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of the geospatial geometry column to be filtered.
     * @param min_x Lower bound for the x-coordinate of the rectangular box.  Must be less than or equal to `max_x`.
     * @param max_x Upper bound for the x-coordinate of the rectangular box.  Must be greater than or equal to `min_x`.
     * @param min_y Lower bound for the y-coordinate of the rectangular box. Must be less than or equal to `max_y`.
     * @param max_y Upper bound for the y-coordinate of the rectangular box. Must be greater than or equal to `min_y`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByBoxGeometryResponse> - Promise resolving to the response
     */
    filter_by_box_geometry(table_name, view_name, column_name, min_x, max_x, min_y, max_y, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        min_x,
        max_x,
        min_y,
        max_y,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bybox/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Applies a geometry filter against a geospatial geometry column in a
     * given table or view. The filtering geometry is provided by `input_wkt`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByGeometryResponse> - Promise resolving to the response
     */
    filter_by_geometry_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        input_wkt: request.input_wkt ?? "",
        operation: request.operation,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bygeometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Applies a geometry filter against a geospatial geometry column in a
     * given table or view. The filtering geometry is provided by `input_wkt`.
     *
     * @param table_name Name of the table on which the filter by geometry will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table or view containing a geospatial geometry column.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of the column to be used in the filter. Must be a geospatial geometry column.
     * @param input_wkt A geometry in WKT format that will be used to filter the objects in `table_name`.
     * @param operation The geometric filtering operation to perform.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByGeometryResponse> - Promise resolving to the response
     */
    filter_by_geometry(table_name, view_name, column_name, input_wkt, operation, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        input_wkt: input_wkt ?? "",
        operation,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bygeometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which records from a table have values in the given list for
     * the corresponding column. The operation is synchronous, meaning that a
     * response will not be returned until all the objects are fully available.
     * The response payload provides the count of the resulting set. A new
     * resultant set (view) which satisfies the input filter specification is
     * also created if a `view_name` is passed in as part of the request.
     *
     * For example, if a type definition has the columns 'x' and 'y', then a
     * filter by list query with the column map {"x":["10.1", "2.3"],
     * "y":["0.0", "-31.5", "42.0"]} will return the count of all data points
     * whose x and y values match both in the respective x- and y-lists, e.g.,
     * "x = 10.1 and y = 0.0", "x = 2.3 and y = -31.5", etc. However, a record
     * with "x = 10.1 and y = -31.5" or "x = 2.3 and y = 0.0" would not be
     * returned because the values in the given lists do not correspond.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByListResponse> - Promise resolving to the response
     */
    filter_by_list_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_values_map: request.column_values_map,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bylist", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which records from a table have values in the given list for
     * the corresponding column. The operation is synchronous, meaning that a
     * response will not be returned until all the objects are fully available.
     * The response payload provides the count of the resulting set. A new
     * resultant set (view) which satisfies the input filter specification is
     * also created if a `view_name` is passed in as part of the request.
     *
     * For example, if a type definition has the columns 'x' and 'y', then a
     * filter by list query with the column map {"x":["10.1", "2.3"],
     * "y":["0.0", "-31.5", "42.0"]} will return the count of all data points
     * whose x and y values match both in the respective x- and y-lists, e.g.,
     * "x = 10.1 and y = 0.0", "x = 2.3 and y = -31.5", etc. However, a record
     * with "x = 10.1 and y = -31.5" or "x = 2.3 and y = 0.0" would not be
     * returned because the values in the given lists do not correspond.
     *
     * @param table_name Name of the table to filter, in [schema_name.]table_name format, using standard name resolution rules.  This may be the name of a table or a view (when chaining queries).
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_values_map List of values for the corresponding column in the table.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByListResponse> - Promise resolving to the response
     */
    filter_by_list(table_name, view_name, column_values_map, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_values_map,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bylist", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table lie within a circle with the given
     * radius and center point (i.e. circular NAI). The operation is
     * synchronous, meaning that a response will not be returned until all the
     * objects are fully available. The response payload provides the count of
     * the resulting set. A new resultant set (view) which satisfies the input
     * circular NAI restriction specification is also created if a `view_name`
     * is passed in as part of the request.
     *
     * For track data, all track points that lie within the circle plus one
     * point on either side of the circle (if the track goes beyond the circle)
     * will be included in the result.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRadiusResponse> - Promise resolving to the response
     */
    filter_by_radius_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        x_column_name: request.x_column_name,
        x_center: request.x_center,
        y_column_name: request.y_column_name,
        y_center: request.y_center,
        radius: request.radius,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byradius", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table lie within a circle with the given
     * radius and center point (i.e. circular NAI). The operation is
     * synchronous, meaning that a response will not be returned until all the
     * objects are fully available. The response payload provides the count of
     * the resulting set. A new resultant set (view) which satisfies the input
     * circular NAI restriction specification is also created if a `view_name`
     * is passed in as part of the request.
     *
     * For track data, all track points that lie within the circle plus one
     * point on either side of the circle (if the track goes beyond the circle)
     * will be included in the result.
     *
     * @param table_name Name of the table on which the filter by radius operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param x_column_name Name of the column to be used for the x-coordinate (the longitude) of the center.
     * @param x_center Value of the longitude of the center. Must be within [-180.0, 180.0].
     * @param y_column_name Name of the column to be used for the y-coordinate-the latitude-of the center.
     * @param y_center Value of the latitude of the center. Must be within [-90.0, 90.0].
     * @param radius The radius of the circle within which the search will be performed. Must be a non-zero positive value. It is in meters; so, for example, a value of '42000' means 42 km.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRadiusResponse> - Promise resolving to the response
     */
    filter_by_radius(table_name, view_name, x_column_name, x_center, y_column_name, y_center, radius, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        x_column_name,
        x_center,
        y_column_name,
        y_center,
        radius,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byradius", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * circle with the given radius and center point (i.e. circular NAI). The
     * operation is synchronous, meaning that a response will not be returned
     * until all the objects are fully available. The response payload provides
     * the count of the resulting set. A new resultant set (view) which
     * satisfies the input circular NAI restriction specification is also
     * created if a `view_name` is passed in as part of the request.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRadiusGeometryResponse> - Promise resolving to the response
     */
    filter_by_radius_geometry_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        x_center: request.x_center,
        y_center: request.y_center,
        radius: request.radius,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byradius/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which geospatial geometry objects from a table intersect a
     * circle with the given radius and center point (i.e. circular NAI). The
     * operation is synchronous, meaning that a response will not be returned
     * until all the objects are fully available. The response payload provides
     * the count of the resulting set. A new resultant set (view) which
     * satisfies the input circular NAI restriction specification is also
     * created if a `view_name` is passed in as part of the request.
     *
     * @param table_name Name of the table on which the filter by radius operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of the geospatial geometry column to be filtered.
     * @param x_center Value of the longitude of the center. Must be within [-180.0, 180.0].
     * @param y_center Value of the latitude of the center. Must be within [-90.0, 90.0].
     * @param radius The radius of the circle within which the search will be performed. Must be a non-zero positive value. It is in meters; so, for example, a value of '42000' means 42 km.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRadiusGeometryResponse> - Promise resolving to the response
     */
    filter_by_radius_geometry(table_name, view_name, column_name, x_center, y_center, radius, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        x_center,
        y_center,
        radius,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byradius/geometry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table have a column that is within the
     * given bounds. An object from the table identified by `table_name` is
     * added to the view `view_name` if its column is within [`lower_bound`,
     * `upper_bound`] (inclusive). The operation is synchronous. The response
     * provides a count of the number of objects which passed the bound filter.
     * Although this functionality can also be accomplished with the standard
     * filter function, it is more efficient.
     *
     * For track objects, the count reflects how many points fall within the
     * given bounds (which may not include all the track points of any given
     * track).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRangeResponse> - Promise resolving to the response
     */
    filter_by_range_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        lower_bound: request.lower_bound,
        upper_bound: request.upper_bound,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table have a column that is within the
     * given bounds. An object from the table identified by `table_name` is
     * added to the view `view_name` if its column is within [`lower_bound`,
     * `upper_bound`] (inclusive). The operation is synchronous. The response
     * provides a count of the number of objects which passed the bound filter.
     * Although this functionality can also be accomplished with the standard
     * filter function, it is more efficient.
     *
     * For track objects, the count reflects how many points fall within the
     * given bounds (which may not include all the track points of any given
     * track).
     *
     * @param table_name Name of the table on which the filter by range operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of a column on which the operation would be applied.
     * @param lower_bound Value of the lower bound (inclusive).
     * @param upper_bound Value of the upper bound (inclusive).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByRangeResponse> - Promise resolving to the response
     */
    filter_by_range(table_name, view_name, column_name, lower_bound, upper_bound, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        lower_bound,
        upper_bound,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byrange", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters objects matching all points of the given track (works only on
     * track type data).  It allows users to specify a particular track to find
     * all other points in the table that fall within specified ranges (spatial
     * and temporal) of all points of the given track. Additionally, the user
     * can specify another track to see if the two intersect (or go close to
     * each other within the specified ranges). The user also has the
     * flexibility of using different metrics for the spatial distance
     * calculation: Euclidean (flat geometry) or Great Circle (spherical
     * geometry to approximate the Earth's surface distances). The filtered
     * points are stored in a newly created result set. The return value of the
     * function is the number of points in the resultant set (view).
     *
     * This operation is synchronous, meaning that a response will not be
     * returned until all the objects are fully available.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterBySeriesResponse> - Promise resolving to the response
     */
    filter_by_series_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        track_id: request.track_id,
        target_track_ids: request.target_track_ids,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byseries", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters objects matching all points of the given track (works only on
     * track type data).  It allows users to specify a particular track to find
     * all other points in the table that fall within specified ranges (spatial
     * and temporal) of all points of the given track. Additionally, the user
     * can specify another track to see if the two intersect (or go close to
     * each other within the specified ranges). The user also has the
     * flexibility of using different metrics for the spatial distance
     * calculation: Euclidean (flat geometry) or Great Circle (spherical
     * geometry to approximate the Earth's surface distances). The filtered
     * points are stored in a newly created result set. The return value of the
     * function is the number of points in the resultant set (view).
     *
     * This operation is synchronous, meaning that a response will not be
     * returned until all the objects are fully available.
     *
     * @param table_name Name of the table on which the filter by track operation will be performed, in [schema_name.]table_name format, using standard name resolution rules. Must be a currently existing table with a track present.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param track_id The ID of the track which will act as the filtering points. Must be an existing track within the given table.
     * @param target_track_ids Up to one track ID to intersect with the "filter" track. If any provided, it must be an valid track ID within the given set.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterBySeriesResponse> - Promise resolving to the response
     */
    filter_by_series(table_name, view_name, track_id, target_track_ids, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        track_id,
        target_track_ids,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byseries", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table or view match a string expression
     * for the given string columns. Setting case_sensitive can modify case
     * sensitivity in matching for all modes except search. For search mode
     * details and limitations, see Full Text Search.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByStringResponse> - Promise resolving to the response
     */
    filter_by_string_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        expression: request.expression,
        mode: request.mode,
        column_names: request.column_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bystring", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table or view match a string expression
     * for the given string columns. Setting case_sensitive can modify case
     * sensitivity in matching for all modes except search. For search mode
     * details and limitations, see Full Text Search.
     *
     * @param table_name Name of the table on which the filter operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table or view.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param expression The expression with which to filter the table.
     * @param mode The string filtering mode to apply. See below for details.
     * @param column_names List of columns on which to apply the filter. Ignored for search mode.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByStringResponse> - Promise resolving to the response
     */
    filter_by_string(table_name, view_name, expression, mode, column_names, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        expression,
        mode,
        column_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bystring", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters objects in one table based on objects in another table. The user
     * must specify matching column types from the two tables (i.e. the target
     * table from which objects will be filtered and the source table based on
     * which the filter will be created); the column names need not be the
     * same. If a `view_name` is specified, then the filtered objects will then
     * be put in a newly created view. The operation is synchronous, meaning
     * that a response will not be returned until all objects are fully
     * available in the result view. The return value contains the count (i.e.
     * the size) of the resulting view.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByTableResponse> - Promise resolving to the response
     */
    filter_by_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        column_name: request.column_name,
        source_table_name: request.source_table_name,
        source_table_column_name: request.source_table_column_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bytable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Filters objects in one table based on objects in another table. The user
     * must specify matching column types from the two tables (i.e. the target
     * table from which objects will be filtered and the source table based on
     * which the filter will be created); the column names need not be the
     * same. If a `view_name` is specified, then the filtered objects will then
     * be put in a newly created view. The operation is synchronous, meaning
     * that a response will not be returned until all objects are fully
     * available in the result view. The return value contains the count (i.e.
     * the size) of the resulting view.
     *
     * @param table_name Name of the table whose data will be filtered, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param column_name Name of the column by whose value the data will be filtered from the table designated by `table_name`.
     * @param source_table_name Name of the table whose data will be compared against in the table called `table_name`, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param source_table_column_name Name of the column in the `source_table_name` whose values will be used as the filter for table `table_name`. Must be a geospatial geometry column if in 'spatial' mode; otherwise, Must match the type of the `column_name`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByTableResponse> - Promise resolving to the response
     */
    filter_by_table(table_name, view_name, column_name, source_table_name, source_table_column_name, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        column_name,
        source_table_name,
        source_table_column_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/bytable", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table has a particular value for a
     * particular column. The input parameters provide a way to specify either
     * a String or a Double valued column and a desired value for the column on
     * which the filter is performed. The operation is synchronous, meaning
     * that a response will not be returned until all the objects are fully
     * available. The response payload provides the count of the resulting set.
     * A new result view which satisfies the input filter restriction
     * specification is also created with a view name passed in as part of the
     * input payload.  Although this functionality can also be accomplished
     * with the standard filter function, it is more efficient.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByValueResponse> - Promise resolving to the response
     */
    filter_by_value_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        view_name: request.view_name ?? "",
        is_string: request.is_string,
        value: request.value ?? 0,
        value_str: request.value_str ?? "",
        column_name: request.column_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byvalue", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Calculates which objects from a table has a particular value for a
     * particular column. The input parameters provide a way to specify either
     * a String or a Double valued column and a desired value for the column on
     * which the filter is performed. The operation is synchronous, meaning
     * that a response will not be returned until all the objects are fully
     * available. The response payload provides the count of the resulting set.
     * A new result view which satisfies the input filter restriction
     * specification is also created with a view name passed in as part of the
     * input payload.  Although this functionality can also be accomplished
     * with the standard filter function, it is more efficient.
     *
     * @param table_name Name of an existing table on which to perform the calculation, in [schema_name.]table_name format, using standard name resolution rules.
     * @param view_name If provided, then this will be the name of the view containing the results, in [schema_name.]view_name format, using standard name resolution rules and meeting table naming criteria.  Must not be an already existing table or view.
     * @param is_string Indicates whether the value being searched for is string or numeric.
     * @param value The value to search for.
     * @param value_str The string value to search for.
     * @param column_name Name of a column on which the filter by value would be applied.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.FilterByValueResponse> - Promise resolving to the response
     */
    filter_by_value(table_name, view_name, is_string, value, value_str, column_name, options, callback) {
      const actualRequest = {
        table_name,
        view_name: view_name ?? "",
        is_string,
        value: value ?? 0,
        value_str: value_str ?? "",
        column_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/filter/byvalue", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves node or edge entities from an existing graph, with pagination
     * support via offset and limit. Use `show_graph` to obtain the total
     * number of nodes and edges.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetGraphEntitiesResponse> - Promise resolving to the response
     */
    get_graph_entities_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        offset: request.offset ?? 0,
        limit: request.limit ?? 1e4,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/graph/entities", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves node or edge entities from an existing graph, with pagination
     * support via offset and limit. Use `show_graph` to obtain the total
     * number of nodes and edges.
     *
     * @param graph_name Name of the graph from which to retrieve entities.
     * @param offset Starting index of the entities to retrieve (0-based).
     * @param limit Number of entities to retrieve starting from `offset`. A value of -1 returns all entities from the offset to the end. Note: the `entities_int` or `entities_string` array size will be 2x this value for nodes (stride 2) or 4x for edges (stride 4).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GetGraphEntitiesResponse> - Promise resolving to the response
     */
    get_graph_entities(graph_name, offset, limit, options, callback) {
      const actualRequest = {
        graph_name,
        offset: offset ?? 0,
        limit: limit ?? 1e4,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/graph/entities", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Get the status and result of asynchronously running job.  See the
     * `create_job` for starting an asynchronous job.  Some fields of the
     * response are filled only after the submitted job has finished execution.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetJobResponse> - Promise resolving to the response
     */
    get_job_request(request, callback) {
      const actualRequest = {
        job_id: request.job_id,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/job", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Get the status and result of asynchronously running job.  See the
     * `create_job` for starting an asynchronous job.  Some fields of the
     * response are filled only after the submitted job has finished execution.
     *
     * @param job_id A unique identifier for the job whose status and result is to be fetched.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GetJobResponse> - Promise resolving to the response
     */
    get_job(job_id, options, callback) {
      const actualRequest = {
        job_id,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/job", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves records from a given table, optionally filtered by an
     * expression and/or sorted by a column. This operation can be performed on
     * tables and views. Records can be returned encoded as binary, json, or
     * geojson.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.  Note that when paging through a table, if the table
     * (or the underlying table in case of a view) is updated (records are
     * inserted, deleted or modified) the records retrieved may differ between
     * calls based on the updates applied.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsResponse> - Promise resolving to the response
     */
    get_records_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/get/records"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/records", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeRecords(response, "records_json", "records_binary", "type_schema");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Retrieves records from a given table, optionally filtered by an
     * expression and/or sorted by a column. This operation can be performed on
     * tables and views. Records can be returned encoded as binary, json, or
     * geojson.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.  Note that when paging through a table, if the table
     * (or the underlying table in case of a view) is updated (records are
     * inserted, deleted or modified) the records retrieved may differ between
     * calls based on the updates applied.
     *
     * @param table_name Name of the table or view from which the records will be fetched, in [schema_name.]table_name format, using standard name resolution rules.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `has_more_records` to see if more records exist in the result to be
     * fetched, and `offset` and `limit` to request subsequent pages of
     * results.
     * @param options
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsResponse> - Promise resolving to the response
     */
    get_records(table_name, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/get/records"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/records", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeRecords(response, "records_json", "records_binary", "type_schema");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * For a given table, retrieves the values from the requested column(s).
     * Maps of column name to the array of values as well as the column data
     * type are returned. This endpoint supports pagination with the `offset`
     * and `limit` parameters.
     *
     * Window functions, which can perform operations like moving averages, are
     * available through this endpoint as well as `create_projection`.
     *
     * When using pagination, if the table (or the underlying table in the case
     * of a view) is modified (records are inserted, updated, or deleted)
     * during a call to the endpoint, the records or values retrieved may
     * differ between calls based on the type of the update, e.g., the
     * contiguity across pages cannot be relied upon.
     *
     * If `table_name` is empty, selection is performed against a single-row
     * virtual table.  This can be useful in executing temporal (NOW()),
     * identity (USER()), or constant-based functions (GEODIST(-77.11, 38.88,
     * -71.06, 42.36)).
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsByColumnResponse> - Promise resolving to the response
     */
    get_records_by_column_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        column_names: request.column_names,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/get/records/bycolumn"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/bycolumn", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * For a given table, retrieves the values from the requested column(s).
     * Maps of column name to the array of values as well as the column data
     * type are returned. This endpoint supports pagination with the `offset`
     * and `limit` parameters.
     *
     * Window functions, which can perform operations like moving averages, are
     * available through this endpoint as well as `create_projection`.
     *
     * When using pagination, if the table (or the underlying table in the case
     * of a view) is modified (records are inserted, updated, or deleted)
     * during a call to the endpoint, the records or values retrieved may
     * differ between calls based on the type of the update, e.g., the
     * contiguity across pages cannot be relied upon.
     *
     * If `table_name` is empty, selection is performed against a single-row
     * virtual table.  This can be useful in executing temporal (NOW()),
     * identity (USER()), or constant-based functions (GEODIST(-77.11, 38.88,
     * -71.06, 42.36)).
     *
     * The response is returned as a dynamic schema. For details see: dynamic
     * schemas documentation.
     *
     * @param table_name Name of the table or view on which this operation will be performed, in [schema_name.]table_name format, using standard name resolution rules.  An empty table name retrieves one record from a single-row virtual table, where columns specified should be constants or constant expressions.
     * @param column_names The list of column values to retrieve.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `has_more_records` to see if more records exist in the result to be
     * fetched, and `offset` and `limit` to request subsequent pages of
     * results.
     * @param options
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsByColumnResponse> - Promise resolving to the response
     */
    get_records_by_column(table_name, column_names, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        column_names,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/get/records/bycolumn"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/bycolumn", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decodeDynamic(response, "json_encoded_response", "binary_encoded_response", "response_schema_str");
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Retrieves the complete series/track records from the given
     * `world_table_name` based on the partial track information contained in
     * the `table_name`.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.
     *
     * In contrast to `get_records` this returns records grouped by
     * series/track. So if `offset` is 0 and `limit` is 5 this operation would
     * return the first 5 series/tracks in `table_name`. Each series/track will
     * be returned sorted by their TIMESTAMP column.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsBySeriesResponse> - Promise resolving to the response
     */
    get_records_by_series_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        world_table_name: request.world_table_name,
        offset: request.offset ?? 0,
        limit: request.limit ?? 250,
        encoding: request.encoding ?? this.recordEncoding("/get/records/byseries"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/byseries", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = (response.list_records_json ?? []).map((series) => this.decode(series));
        delete response.list_records_json;
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Retrieves the complete series/track records from the given
     * `world_table_name` based on the partial track information contained in
     * the `table_name`.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.
     *
     * In contrast to `get_records` this returns records grouped by
     * series/track. So if `offset` is 0 and `limit` is 5 this operation would
     * return the first 5 series/tracks in `table_name`. Each series/track will
     * be returned sorted by their TIMESTAMP column.
     *
     * @param table_name Name of the table or view for which series/tracks will be fetched, in [schema_name.]table_name format, using standard name resolution rules.
     * @param world_table_name Name of the table containing the complete series/track information to be returned for the tracks present in the `table_name`, in [schema_name.]table_name format, using standard name resolution rules.  Typically this is used when retrieving series/tracks from a view (which contains partial series/tracks) but the user wants to retrieve the entire original series/tracks. Can be blank.
     * @param offset A positive integer indicating the number of initial series/tracks to skip (useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of series/tracks to be returned. Or END_OF_SET (-9999) to indicate that the max number of results should be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsBySeriesResponse> - Promise resolving to the response
     */
    get_records_by_series(table_name, world_table_name, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        world_table_name,
        offset: offset ?? 0,
        limit: limit ?? 250,
        encoding: this.recordEncoding("/get/records/byseries"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/byseries", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = (response.list_records_json ?? []).map((series) => this.decode(series));
        delete response.list_records_json;
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Retrieves records from a collection. The operation can optionally return
     * the record IDs which can be used in certain queries such as
     * `delete_records`.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.
     *
     * Note that when using the Java API, it is not possible to retrieve
     * records from join views using this operation.
     *
     * (DEPRECATED)
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsFromCollectionResponse> - Promise resolving to the response
     */
    get_records_from_collection_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        offset: request.offset ?? 0,
        limit: request.limit ?? -9999,
        encoding: request.encoding ?? this.recordEncoding("/get/records/fromcollection"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/fromcollection", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decode(response.records_json);
        delete response.records_json;
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * Retrieves records from a collection. The operation can optionally return
     * the record IDs which can be used in certain queries such as
     * `delete_records`.
     *
     * This operation supports paging through the data via the `offset` and
     * `limit` parameters.
     *
     * Note that when using the Java API, it is not possible to retrieve
     * records from join views using this operation.
     *
     * (DEPRECATED)
     *
     * @param table_name Name of the collection or table from which records are to be retrieved, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing collection or table.
     * @param offset A positive integer indicating the number of initial results to skip (this can be useful for paging through the results).
     * @param limit A positive integer indicating the maximum number of results
     * to be returned, or END_OF_SET (-9999) to indicate that the maximum
     * number of results allowed by the server should be returned.  The number
     * of records returned will never exceed the server's own limit, defined by
     * the max_get_records_size parameter in the server configuration. Use
     * `offset` and `limit` to request subsequent pages of results.
     * @param options
     * @param callback Optional callback function
     * @returns Promise<Types.GetRecordsFromCollectionResponse> - Promise resolving to the response
     */
    get_records_from_collection(table_name, offset, limit, options, callback) {
      const actualRequest = {
        table_name,
        offset: offset ?? 0,
        limit: limit ?? -9999,
        encoding: this.recordEncoding("/get/records/fromcollection"),
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/records/fromcollection", actualRequest, callback !== void 0);
      const decoded = this.afterResponse(dispatched, (response) => {
        response.data = this.decode(response.records_json);
        delete response.records_json;
        return response;
      });
      this.notify(decoded, callback);
      return decoded;
    }
    /**
     * For internal use only. Generates the vector tiles requested using the
     * given tables and parameters.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GetVectortileResponse> - Promise resolving to the response
     */
    get_vectortile_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        column_names: request.column_names,
        layers: request.layers,
        tile_x: request.tile_x,
        tile_y: request.tile_y,
        zoom: request.zoom,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/get/vectortile", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only. Generates the vector tiles requested using the
     * given tables and parameters.
     *
     * @param table_names Names of the tables containing the data for generating vector tiles.
     * @param column_names Names of the columns containing geometric feature data.
     * @param layers A map of tables to colums from which vector tile layers are being generated.
     * @param tile_x Horizontal tile index.
     * @param tile_y Vertical tile index.
     * @param zoom Zoom level of the tile requested.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GetVectortileResponse> - Promise resolving to the response
     */
    get_vectortile(table_names, column_names, layers, tile_x, tile_y, zoom, options, callback) {
      const actualRequest = {
        table_names,
        column_names,
        layers,
        tile_x,
        tile_y,
        zoom,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/get/vectortile", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Grant user or role the specified permission on the specified object.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionResponse> - Promise resolving to the response
     */
    grant_permission_request(request, callback) {
      const actualRequest = {
        principal: request.principal ?? "",
        object: request.object,
        object_type: request.object_type,
        permission: request.permission,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Grant user or role the specified permission on the specified object.
     *
     * @param principal Name of the user or role for which the permission is being granted.  Must be an existing user or role.
     * @param object Name of object permission is being granted to.  It is recommended to use a fully-qualified name when possible.
     * @param object_type The type of object being granted to.
     * @param permission Permission being granted.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionResponse> - Promise resolving to the response
     */
    grant_permission(principal, object, object_type, permission, options, callback) {
      const actualRequest = {
        principal: principal ?? "",
        object,
        object_type,
        permission,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * credential-level permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionCredentialResponse> - Promise resolving to the response
     */
    grant_permission_credential_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        credential_name: request.credential_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * credential-level permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param credential_name Name of the credential on which the permission will be granted. Must be an existing credential, or an empty string to grant access on all credentials.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionCredentialResponse> - Promise resolving to the response
     */
    grant_permission_credential(name, permission, credential_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        credential_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a data
     * source permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionDatasourceResponse> - Promise resolving to the response
     */
    grant_permission_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        datasource_name: request.datasource_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a data
     * source permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param datasource_name Name of the data source on which the permission will be granted. Must be an existing data source, or an empty string to grant permission on all data sources.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionDatasourceResponse> - Promise resolving to the response
     */
    grant_permission_datasource(name, permission, datasource_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        datasource_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a KiFS
     * directory-level permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionDirectoryResponse> - Promise resolving to the response
     */
    grant_permission_directory_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        directory_name: request.directory_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a KiFS
     * directory-level permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param directory_name Name of the KiFS directory to which the permission grants access. An empty directory name grants access to all KiFS directories.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionDirectoryResponse> - Promise resolving to the response
     */
    grant_permission_directory(name, permission, directory_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        directory_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a proc-level
     * permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionProcResponse> - Promise resolving to the response
     */
    grant_permission_proc_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        proc_name: request.proc_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a proc-level
     * permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param proc_name Name of the proc to which the permission grants access. Must be an existing proc, or an empty string to grant access to all procs.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionProcResponse> - Promise resolving to the response
     */
    grant_permission_proc(name, permission, proc_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        proc_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * system-level permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionSystemResponse> - Promise resolving to the response
     */
    grant_permission_system_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/system", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * system-level permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionSystemResponse> - Promise resolving to the response
     */
    grant_permission_system(name, permission, options, callback) {
      const actualRequest = {
        name,
        permission,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/system", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * table-level permission to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionTableResponse> - Promise resolving to the response
     */
    grant_permission_table_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        table_name: request.table_name,
        filter_expression: request.filter_expression ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `grant_permission` instead]  Grants a
     * table-level permission to a user or role.
     *
     * @param name Name of the user or role to which the permission will be granted. Must be an existing user or role.
     * @param permission Permission to grant to the user or role.
     * @param table_name Name of the table to which the permission grants access, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table, view, or schema. If a schema, the permission also applies to tables and views in the schema.
     * @param filter_expression Optional filter expression to apply to this grant.  Only rows that match the filter will be affected.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantPermissionTableResponse> - Promise resolving to the response
     */
    grant_permission_table(name, permission, table_name, filter_expression, options, callback) {
      const actualRequest = {
        name,
        permission,
        table_name,
        filter_expression: filter_expression ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/permission/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Grants membership in a role to a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.GrantRoleResponse> - Promise resolving to the response
     */
    grant_role_request(request, callback) {
      const actualRequest = {
        role: request.role,
        member: request.member,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/grant/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Grants membership in a role to a user or role.
     *
     * @param role Name of the role in which membership will be granted. Must be an existing role.
     * @param member Name of the user or role that will be granted membership in `role`. Must be an existing user or role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.GrantRoleResponse> - Promise resolving to the response
     */
    grant_role(role, member, options, callback) {
      const actualRequest = {
        role,
        member,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/grant/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks if the specified user has the specified permission on the
     * specified object.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasPermissionResponse> - Promise resolving to the response
     */
    has_permission_request(request, callback) {
      const actualRequest = {
        principal: request.principal ?? "",
        object: request.object,
        object_type: request.object_type,
        permission: request.permission,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks if the specified user has the specified permission on the
     * specified object.
     *
     * @param principal Name of the user for which the permission is being checked. Must be an existing user. If blank, will use the current user.
     * @param object Name of object to check for the requested permission.  It is recommended to use a fully-qualified name when possible.
     * @param object_type The type of object being checked.
     * @param permission Permission to check for.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasPermissionResponse> - Promise resolving to the response
     */
    has_permission(principal, object, object_type, permission, options, callback) {
      const actualRequest = {
        principal: principal ?? "",
        object,
        object_type,
        permission,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks the existence of a proc with the given name.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasProcResponse> - Promise resolving to the response
     */
    has_proc_request(request, callback) {
      const actualRequest = {
        proc_name: request.proc_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks the existence of a proc with the given name.
     *
     * @param proc_name Name of the proc to check for existence.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasProcResponse> - Promise resolving to the response
     */
    has_proc(proc_name, options, callback) {
      const actualRequest = {
        proc_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks if the specified user has the specified role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasRoleResponse> - Promise resolving to the response
     */
    has_role_request(request, callback) {
      const actualRequest = {
        principal: request.principal ?? "",
        role: request.role,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks if the specified user has the specified role.
     *
     * @param principal Name of the user for which role membership is being checked. Must be an existing user. If blank, will use the current user.
     * @param role Name of role to check for membership.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasRoleResponse> - Promise resolving to the response
     */
    has_role(principal, role, options, callback) {
      const actualRequest = {
        principal: principal ?? "",
        role,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks for the existence of a schema with the given name.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasSchemaResponse> - Promise resolving to the response
     */
    has_schema_request(request, callback) {
      const actualRequest = {
        schema_name: request.schema_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks for the existence of a schema with the given name.
     *
     * @param schema_name Name of the schema to check for existence, in root, using standard name resolution rules.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasSchemaResponse> - Promise resolving to the response
     */
    has_schema(schema_name, options, callback) {
      const actualRequest = {
        schema_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks for the existence of a table with the given name.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasTableResponse> - Promise resolving to the response
     */
    has_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Checks for the existence of a table with the given name.
     *
     * @param table_name Name of the table to check for existence, in [schema_name.]table_name format, using standard name resolution rules.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasTableResponse> - Promise resolving to the response
     */
    has_table(table_name, options, callback) {
      const actualRequest = {
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Check for the existence of a type.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.HasTypeResponse> - Promise resolving to the response
     */
    has_type_request(request, callback) {
      const actualRequest = {
        type_id: request.type_id,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/has/type", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Check for the existence of a type.
     *
     * @param type_id Id of the type returned in response to `create_type` request.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.HasTypeResponse> - Promise resolving to the response
     */
    has_type(type_id, options, callback) {
      const actualRequest = {
        type_id,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/has/type", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ImportModelResponse> - Promise resolving to the response
     */
    import_model_request(request, callback) {
      const actualRequest = {
        model_name: request.model_name,
        registry_name: request.registry_name,
        container: request.container,
        run_function: request.run_function,
        model_type: request.model_type,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/import/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param model_name Name of the model to be imported.
     * @param registry_name Name of the registry that has the container.
     * @param container Name of the container that has the model.
     * @param run_function The absolute path to the run_function.
     * @param model_type Type of the deployment.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ImportModelResponse> - Promise resolving to the response
     */
    import_model(model_name, registry_name, container, run_function, model_type, options, callback) {
      const actualRequest = {
        model_name,
        registry_name,
        container,
        run_function,
        model_type,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/import/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Adds multiple records to the specified table. The operation is
     * synchronous, meaning that a response will not be returned until all the
     * records are fully inserted and available. The response payload provides
     * the counts of the number of records actually inserted and/or updated,
     * and can provide the unique identifier of each added record.
     *
     * The `options` parameter can be used to customize this function's
     * behavior.
     *
     * The update_on_existing_pk option specifies the record collision policy
     * for inserting into a table with a primary key, but is ignored if no
     * primary key exists.
     *
     * The return_record_ids option indicates that the database should return
     * the unique identifiers of inserted records.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsResponse> - Promise resolving to the response
     */
    insert_records_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        list: request.list ?? [],
        list_str: [],
        list_encoding: request.list_encoding ?? this.recordEncoding("/insert/records"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRecords("/insert/records", actualRequest, request.table_name, request.data, { binary: "list", json: "list_str", encoding: "list_encoding" }, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Adds multiple records to the specified table. The operation is
     * synchronous, meaning that a response will not be returned until all the
     * records are fully inserted and available. The response payload provides
     * the counts of the number of records actually inserted and/or updated,
     * and can provide the unique identifier of each added record.
     *
     * The `options` parameter can be used to customize this function's
     * behavior.
     *
     * The update_on_existing_pk option specifies the record collision policy
     * for inserting into a table with a primary key, but is ignored if no
     * primary key exists.
     *
     * The return_record_ids option indicates that the database should return
     * the unique identifiers of inserted records.
     *
     * @param table_name Name of table to which the records are to be added, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table.
     * @param data Data records to process
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsResponse> - Promise resolving to the response
     */
    insert_records(table_name, data, options, callback) {
      const actualRequest = {
        table_name,
        list: [],
        list_str: [],
        list_encoding: this.recordEncoding("/insert/records"),
        options: options ?? {}
      };
      const dispatched = this.submitRecords("/insert/records", actualRequest, table_name, data, { binary: "list", json: "list_str", encoding: "list_encoding" }, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Reads from one or more files and inserts the data into a new or existing
     * table. The source data can be located either in KiFS; on the cluster,
     * accessible to the database; or remotely, accessible via a pre-defined
     * external data source.
     *
     * For delimited text files, there are two loading schemes: positional and
     * name-based. The name-based loading scheme is enabled when the file has a
     * header present and text_has_header is set to true. In this scheme, the
     * source file(s) field names must match the target table's column names
     * exactly; however, the source file can have more fields than the target
     * table has columns. If error_handling is set to permissive, the source
     * file can have fewer fields than the target table has columns. If the
     * name-based loading scheme is being used, names matching the file
     * header's names may be provided to columns_to_load instead of numbers,
     * but ranges are not supported.
     *
     * Note: Due to data being loaded in parallel, there is no insertion order
     * guaranteed.  For tables with primary keys, in the case of a primary key
     * collision, this means it is indeterminate which record will be inserted
     * first and remain, while the rest of the colliding key records are
     * discarded.
     *
     * Returns once all files are processed.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromFilesResponse> - Promise resolving to the response
     */
    insert_records_from_files_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        filepaths: request.filepaths,
        modify_columns: request.modify_columns ?? {},
        create_table_options: request.create_table_options ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/fromfiles", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Reads from one or more files and inserts the data into a new or existing
     * table. The source data can be located either in KiFS; on the cluster,
     * accessible to the database; or remotely, accessible via a pre-defined
     * external data source.
     *
     * For delimited text files, there are two loading schemes: positional and
     * name-based. The name-based loading scheme is enabled when the file has a
     * header present and text_has_header is set to true. In this scheme, the
     * source file(s) field names must match the target table's column names
     * exactly; however, the source file can have more fields than the target
     * table has columns. If error_handling is set to permissive, the source
     * file can have fewer fields than the target table has columns. If the
     * name-based loading scheme is being used, names matching the file
     * header's names may be provided to columns_to_load instead of numbers,
     * but ranges are not supported.
     *
     * Note: Due to data being loaded in parallel, there is no insertion order
     * guaranteed.  For tables with primary keys, in the case of a primary key
     * collision, this means it is indeterminate which record will be inserted
     * first and remain, while the rest of the colliding key records are
     * discarded.
     *
     * Returns once all files are processed.
     *
     * @param table_name Name of the table into which the data will be
     * inserted, in [schema_name.]table_name format, using standard name
     * resolution rules. If the table does not exist, the table will be created
     * using either an existing type_id or the type inferred from the file, and
     * the new table name will have to meet standard table naming criteria.
     * @param filepaths A list of file paths from which data will be sourced;
     *
     * For paths in KiFS, use the URI prefix of kifs:// followed by the path to
     * a file or directory. File matching by prefix is supported, e.g.
     * kifs://dir/file would match dir/file_1 and dir/file_2. When prefix
     * matching is used, the path must start with a full, valid KiFS directory
     * name.
     *
     * If an external data source is specified in datasource_name, these file
     * paths must resolve to accessible files at that data source location.
     * Prefix matching is supported. If the data source is hdfs, prefixes must
     * be aligned with directories, i.e. partial file names will not match.
     *
     * If no data source is specified, the files are assumed to be local to the
     * database and must all be accessible to the gpudb user, residing on the
     * path (or relative to the path) specified by the external files directory
     * in the Kinetica configuration file. Wildcards (*) can be used to specify
     * a group of files.  Prefix matching is supported, the prefixes must be
     * aligned with directories.
     *
     * If the first path ends in .tsv, the text delimiter will be defaulted to
     * a tab character. If the first path ends in .psv, the text delimiter will
     * be defaulted to a pipe character (|).
     * @param modify_columns Not implemented yet.
     * @param create_table_options Options from `create_table`, allowing the
     * structure of the table to be defined independently of the data source,
     * when creating the target table
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromFilesResponse> - Promise resolving to the response
     */
    insert_records_from_files(table_name, filepaths, modify_columns, create_table_options, options, callback) {
      const actualRequest = {
        table_name,
        filepaths,
        modify_columns: modify_columns ?? {},
        create_table_options: create_table_options ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/fromfiles", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Reads from the given text-based or binary payload and inserts the data
     * into a new or existing table.  The table will be created if it doesn't
     * already exist.
     *
     * Returns once all records are processed.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromPayloadResponse> - Promise resolving to the response
     */
    insert_records_from_payload_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        data_text: request.data_text,
        data_bytes: request.data_bytes,
        modify_columns: request.modify_columns ?? {},
        create_table_options: request.create_table_options ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/frompayload", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Reads from the given text-based or binary payload and inserts the data
     * into a new or existing table.  The table will be created if it doesn't
     * already exist.
     *
     * Returns once all records are processed.
     *
     * @param table_name Name of the table into which the data will be
     * inserted, in [schema_name.]table_name format, using standard name
     * resolution rules. If the table does not exist, the table will be created
     * using either an existing type_id or the type inferred from the payload,
     * and the new table name will have to meet standard table naming criteria.
     * @param data_text Records formatted as delimited text.
     * @param data_bytes Records formatted as binary data.
     * @param modify_columns Not implemented yet.
     * @param create_table_options Options used when creating the target table. Includes type to use. The other options match those in `create_table`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromPayloadResponse> - Promise resolving to the response
     */
    insert_records_from_payload(table_name, data_text, data_bytes, modify_columns, create_table_options, options, callback) {
      const actualRequest = {
        table_name,
        data_text,
        data_bytes,
        modify_columns: modify_columns ?? {},
        create_table_options: create_table_options ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/frompayload", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Computes remote query result and inserts the result data into a new or
     * existing table.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromQueryResponse> - Promise resolving to the response
     */
    insert_records_from_query_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        remote_query: request.remote_query,
        modify_columns: request.modify_columns ?? {},
        create_table_options: request.create_table_options ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/fromquery", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Computes remote query result and inserts the result data into a new or
     * existing table.
     *
     * @param table_name Name of the table into which the data will be
     * inserted, in [schema_name.]table_name format, using standard name
     * resolution rules. If the table does not exist, the table will be created
     * using either an existing type_id or the type inferred from the remote
     * query, and the new table name will have to meet standard table naming
     * criteria.
     * @param remote_query Query for which result data needs to be imported.
     * @param modify_columns Not implemented yet.
     * @param create_table_options Options used when creating the target table.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsFromQueryResponse> - Promise resolving to the response
     */
    insert_records_from_query(table_name, remote_query, modify_columns, create_table_options, options, callback) {
      const actualRequest = {
        table_name,
        remote_query,
        modify_columns: modify_columns ?? {},
        create_table_options: create_table_options ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/fromquery", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Generates a specified number of random records and adds them to the
     * given table. There is an optional parameter that allows the user to
     * customize the ranges of the column values. It also allows the user to
     * specify linear profiles for some or all columns in which case linear
     * values are generated rather than random ones. Only individual tables are
     * supported for this operation.
     *
     * This operation is synchronous, meaning that a response will not be
     * returned until all random records are fully available.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsRandomResponse> - Promise resolving to the response
     */
    insert_records_random_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        count: request.count,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/random", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Generates a specified number of random records and adds them to the
     * given table. There is an optional parameter that allows the user to
     * customize the ranges of the column values. It also allows the user to
     * specify linear profiles for some or all columns in which case linear
     * values are generated rather than random ones. Only individual tables are
     * supported for this operation.
     *
     * This operation is synchronous, meaning that a response will not be
     * returned until all random records are fully available.
     *
     * @param table_name Table to which random records will be added, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table, not a view.
     * @param count Number of records to generate.
     * @param options Optional parameter to pass in specifications for the randomness of the values.  This map is different from the *options* parameter of most other endpoints in that it is a map of string to map of string to doubles, while most others are maps of string to string.  In this map, the top level keys represent which column's parameters are being specified, while the internal keys represents which parameter is being specified.  These parameters take on different meanings depending on the type of the column.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertRecordsRandomResponse> - Promise resolving to the response
     */
    insert_records_random(table_name, count, options, callback) {
      const actualRequest = {
        table_name,
        count,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/insert/records/random", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Adds a symbol or icon (i.e. an image) to represent data points when data
     * is rendered visually. Users must provide the symbol identifier (string),
     * a format (currently supported: 'svg' and 'svg_path'), the data for the
     * symbol, and any additional optional parameter (e.g. color). To have a
     * symbol used for rendering create a table with a string column named
     * 'SYMBOLCODE' (along with 'x' or 'y' for example). Then when the table is
     * rendered (via WMS) if the 'dosymbology' parameter is 'true' then the
     * value of the 'SYMBOLCODE' column is used to pick the symbol displayed
     * for each point.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.InsertSymbolResponse> - Promise resolving to the response
     */
    insert_symbol_request(request, callback) {
      const actualRequest = {
        symbol_id: request.symbol_id,
        symbol_format: request.symbol_format,
        symbol_data: request.symbol_data,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/insert/symbol", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Adds a symbol or icon (i.e. an image) to represent data points when data
     * is rendered visually. Users must provide the symbol identifier (string),
     * a format (currently supported: 'svg' and 'svg_path'), the data for the
     * symbol, and any additional optional parameter (e.g. color). To have a
     * symbol used for rendering create a table with a string column named
     * 'SYMBOLCODE' (along with 'x' or 'y' for example). Then when the table is
     * rendered (via WMS) if the 'dosymbology' parameter is 'true' then the
     * value of the 'SYMBOLCODE' column is used to pick the symbol displayed
     * for each point.
     *
     * @param symbol_id The id of the symbol being added. This is the same id that should be in the 'SYMBOLCODE' column for objects using this symbol.
     * @param symbol_format Specifies the symbol format. Must be either 'svg' or 'svg_path'.
     * @param symbol_data The actual symbol data. If `symbol_format` is 'svg' then this should be the raw bytes representing an svg file. If `symbol_format` is svg path then this should be an svg path string; for example: 'M25.979,12.896,5.979,12.896,5.979,19.562,25.979,19.562z'.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.InsertSymbolResponse> - Promise resolving to the response
     */
    insert_symbol(symbol_id, symbol_format, symbol_data, options, callback) {
      const actualRequest = {
        symbol_id,
        symbol_format,
        symbol_data,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/insert/symbol", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Kills a running proc instance.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.KillProcResponse> - Promise resolving to the response
     */
    kill_proc_request(request, callback) {
      const actualRequest = {
        run_id: request.run_id ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/kill/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Kills a running proc instance.
     *
     * @param run_id The run ID of a running proc instance. If a proc with a matching run ID is not found or the proc instance has already completed, no procs will be killed. If not specified, all running proc instances will be killed.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.KillProcResponse> - Promise resolving to the response
     */
    kill_proc(run_id, options, callback) {
      const actualRequest = {
        run_id: run_id ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/kill/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Lists basic information about one or all graphs that exist on the graph
     * server.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ListGraphResponse> - Promise resolving to the response
     */
    list_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/list/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Lists basic information about one or all graphs that exist on the graph
     * server.
     *
     * @param graph_name Name of the graph on which to retrieve information. If empty, information about all graphs is returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ListGraphResponse> - Promise resolving to the response
     */
    list_graph(graph_name, options, callback) {
      const actualRequest = {
        graph_name: graph_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/list/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manages global access to a table's data.  By default a table has a
     * `lock_type` of read_write, indicating all operations are permitted.  A
     * user may request a read_only or a write_only lock, after which only read
     * or write operations, respectively, are permitted on the table until the
     * lock is removed.  When `lock_type` is no_access then no operations are
     * permitted on the table.  The lock status can be queried by setting
     * `lock_type` to status.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.LockTableResponse> - Promise resolving to the response
     */
    lock_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        lock_type: request.lock_type ?? "status",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/lock/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Manages global access to a table's data.  By default a table has a
     * `lock_type` of read_write, indicating all operations are permitted.  A
     * user may request a read_only or a write_only lock, after which only read
     * or write operations, respectively, are permitted on the table until the
     * lock is removed.  When `lock_type` is no_access then no operations are
     * permitted on the table.  The lock status can be queried by setting
     * `lock_type` to status.
     *
     * @param table_name Name of the table to be locked, in [schema_name.]table_name format, using standard name resolution rules.  It must be a currently existing table or view.
     * @param lock_type The type of lock being applied to the table. Setting it to status will return the current lock status of the table without changing it.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.LockTableResponse> - Promise resolving to the response
     */
    lock_table(table_name, lock_type, options, callback) {
      const actualRequest = {
        table_name,
        lock_type: lock_type ?? "status",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/lock/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Matches a directed route implied by a given set of latitude/longitude
     * points to an existing underlying road network graph using a given
     * solution type.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /match/graph examples before using this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.MatchGraphResponse> - Promise resolving to the response
     */
    match_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        sample_points: request.sample_points,
        solve_method: request.solve_method ?? "markov_chain",
        solution_table: request.solution_table ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/match/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Matches a directed route implied by a given set of latitude/longitude
     * points to an existing underlying road network graph using a given
     * solution type.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /match/graph examples before using this endpoint.
     *
     * @param graph_name Name of the underlying geospatial graph resource to match to using `sample_points`.
     * @param sample_points Sample points used to match to an underlying
     * geospatial graph. Sample points must be specified using identifiers;
     * identifiers are grouped as combinations. Identifiers can be used with:
     * existing column names, e.g., 'table.column AS SAMPLE_X'; expressions,
     * e.g., 'ST_MAKEPOINT(table.x, table.y) AS SAMPLE_WKTPOINT'; or constant
     * values, e.g., '{1, 2, 10} AS SAMPLE_TRIPID'.
     * @param solve_method The type of solver to use for graph matching.
     * @param solution_table The name of the table used to store the results, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.  This table contains a track of geospatial points for the matched portion of the graph, a track ID, and a score value. Also outputs a details table containing a trip ID (that matches the track ID), the latitude/longitude pair, the timestamp the point was recorded at, and an edge ID corresponding to the matched road segment. Must not be an existing table of the same name.
     * @param options Additional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.MatchGraphResponse> - Promise resolving to the response
     */
    match_graph(graph_name, sample_points, solve_method, solution_table, options, callback) {
      const actualRequest = {
        graph_name,
        sample_points,
        solve_method: solve_method ?? "markov_chain",
        solution_table: solution_table ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/match/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Update an existing graph network using given nodes, edges, weights,
     * restrictions, and options.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, and Graph REST Tutorial before using
     * this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ModifyGraphResponse> - Promise resolving to the response
     */
    modify_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        nodes: request.nodes,
        edges: request.edges,
        weights: request.weights,
        restrictions: request.restrictions,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/modify/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Update an existing graph network using given nodes, edges, weights,
     * restrictions, and options.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, and Graph REST Tutorial before using
     * this endpoint.
     *
     * @param graph_name Name of the graph resource to modify.
     * @param nodes Nodes with which to update existing `nodes` in graph specified by `graph_name`. Review Nodes for more information. Nodes must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS NODE_ID', expressions, e.g., 'ST_MAKEPOINT(column1, column2) AS NODE_WKTPOINT', or raw values, e.g., '{9, 10, 11} AS NODE_ID'. If using raw values in an identifier combination, the number of values specified must match across the combination. Identifier combination(s) do not have to match the method used to create the graph, e.g., if column names were specified to create the graph, expressions or raw values could also be used to modify the graph.
     * @param edges Edges with which to update existing `edges` in graph specified by `graph_name`. Review Edges for more information. Edges must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS EDGE_ID', expressions, e.g., 'SUBSTR(column, 1, 6) AS EDGE_NODE1_NAME', or raw values, e.g., "{'family', 'coworker'} AS EDGE_LABEL". If using raw values in an identifier combination, the number of values specified must match across the combination. Identifier combination(s) do not have to match the method used to create the graph, e.g., if column names were specified to create the graph, expressions or raw values could also be used to modify the graph.
     * @param weights Weights with which to update existing `weights` in graph specified by `graph_name`. Review Weights for more information. Weights must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS WEIGHTS_EDGE_ID', expressions, e.g., 'ST_LENGTH(wkt) AS WEIGHTS_VALUESPECIFIED', or raw values, e.g., '{4, 15} AS WEIGHTS_VALUESPECIFIED'. If using raw values in an identifier combination, the number of values specified must match across the combination. Identifier combination(s) do not have to match the method used to create the graph, e.g., if column names were specified to create the graph, expressions or raw values could also be used to modify the graph.
     * @param restrictions Restrictions with which to update existing `restrictions` in graph specified by `graph_name`. Review Restrictions for more information. Restrictions must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS RESTRICTIONS_EDGE_ID', expressions, e.g., 'column/2 AS RESTRICTIONS_VALUECOMPARED', or raw values, e.g., '{0, 0, 0, 1} AS RESTRICTIONS_ONOFFCOMPARED'. If using raw values in an identifier combination, the number of values specified must match across the combination. Identifier combination(s) do not have to match the method used to create the graph, e.g., if column names were specified to create the graph, expressions or raw values could also be used to modify the graph.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ModifyGraphResponse> - Promise resolving to the response
     */
    modify_graph(graph_name, nodes, edges, weights, restrictions, options, callback) {
      const actualRequest = {
        graph_name,
        nodes,
        edges,
        weights,
        restrictions,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/modify/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Employs a topological query on a graph generated a-priori by
     * `create_graph` and returns a list of adjacent edge(s) or node(s), also
     * known as an adjacency list, depending on what's been provided to the
     * endpoint; providing edges will return nodes and providing nodes will
     * return edges.
     *
     * To determine the node(s) or edge(s) adjacent to a value from a given
     * column, provide a list of values to `queries`. This field can be
     * populated with column values from any table as long as the type is
     * supported by the given identifier. See Query Identifiers for more
     * information.
     *
     * To return the adjacency list in the response, leave `adjacency_table`
     * empty.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /match/graph examples before using this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.QueryGraphResponse> - Promise resolving to the response
     */
    query_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        queries: request.queries,
        restrictions: request.restrictions ?? [],
        adjacency_table: request.adjacency_table ?? "",
        rings: request.rings ?? 1,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/query/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Employs a topological query on a graph generated a-priori by
     * `create_graph` and returns a list of adjacent edge(s) or node(s), also
     * known as an adjacency list, depending on what's been provided to the
     * endpoint; providing edges will return nodes and providing nodes will
     * return edges.
     *
     * To determine the node(s) or edge(s) adjacent to a value from a given
     * column, provide a list of values to `queries`. This field can be
     * populated with column values from any table as long as the type is
     * supported by the given identifier. See Query Identifiers for more
     * information.
     *
     * To return the adjacency list in the response, leave `adjacency_table`
     * empty.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /match/graph examples before using this endpoint.
     *
     * @param graph_name Name of the graph resource to query.
     * @param queries Nodes or edges to be queried specified using query identifiers. Identifiers can be used with existing column names, e.g., 'table.column AS QUERY_NODE_ID', raw values, e.g., '{0, 2} AS QUERY_NODE_ID', or expressions, e.g., 'ST_MAKEPOINT(table.x, table.y) AS QUERY_NODE_WKTPOINT'. Multiple values can be provided as long as the same identifier is used for all values. If using raw values in an identifier combination, the number of values specified must match across the combination.
     * @param restrictions Additional restrictions to apply to the nodes/edges of an existing graph. Restrictions must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS RESTRICTIONS_EDGE_ID', expressions, e.g., 'column/2 AS RESTRICTIONS_VALUECOMPARED', or raw values, e.g., '{0, 0, 0, 1} AS RESTRICTIONS_ONOFFCOMPARED'. If using raw values in an identifier combination, the number of values specified must match across the combination.
     * @param adjacency_table Name of the table to store the resulting adjacencies, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.  If left blank, the query results are instead returned in the response. If the 'QUERY_TARGET_NODE_LABEL' query identifier is used in `queries`, then two additional columns will be available: 'PATH_ID' and 'RING_ID'. See Using Labels for more information.
     * @param rings Sets the number of rings around the node to query for adjacency, with '1' being the edges directly attached to the queried node. Also known as number of hops. For example, if it is set to '2', the edge(s) directly attached to the queried node(s) will be returned; in addition, the edge(s) attached to the node(s) attached to the initial ring of edge(s) surrounding the queried node(s) will be returned. If the value is set to '0', any nodes that meet the criteria in `queries` and `restrictions` will be returned. This parameter is only applicable when querying nodes.
     * @param options Additional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.QueryGraphResponse> - Promise resolving to the response
     */
    query_graph(graph_name, queries, restrictions, adjacency_table, rings, options, callback) {
      const actualRequest = {
        graph_name,
        queries,
        restrictions: restrictions ?? [],
        adjacency_table: adjacency_table ?? "",
        rings: rings ?? 1,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/query/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Rebalances an existing partitioned graph.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * graph examples before using this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RepartitionGraphResponse> - Promise resolving to the response
     */
    repartition_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/repartition/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Rebalances an existing partitioned graph.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * graph examples before using this endpoint.
     *
     * @param graph_name Name of the graph resource to rebalance.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RepartitionGraphResponse> - Promise resolving to the response
     */
    repartition_graph(graph_name, options, callback) {
      const actualRequest = {
        graph_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/repartition/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Request for a component reserve a resource on a gpudb node. Currently
     * only memory is supported.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ReserveResourceResponse> - Promise resolving to the response
     */
    reserve_resource_request(request, callback) {
      const actualRequest = {
        component: request.component,
        name: request.name,
        action: request.action,
        bytes_requested: request.bytes_requested ?? 0,
        owner_id: request.owner_id ?? 0,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/reserve/resource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Request for a component reserve a resource on a gpudb node. Currently
     * only memory is supported.
     *
     * @param component Component requesting a resource reservation e.g. graph0. This may be a new reservation or change from a previous reservation.
     * @param name Identifier for the resource.
     * @param action Modification operation to be applied.
     * @param bytes_requested Absolute number of bytes requested for the reservation. Not used for evicted/deleted statuses.
     * @param owner_id Owner identifier. Only needed for new resources or change owner.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ReserveResourceResponse> - Promise resolving to the response
     */
    reserve_resource(component, name, action, bytes_requested, owner_id, options, callback) {
      const actualRequest = {
        component,
        name,
        action,
        bytes_requested: bytes_requested ?? 0,
        owner_id: owner_id ?? 0,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/reserve/resource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restores database objects from a backup accessible via the data source
     * specified by `datasource_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RestoreBackupResponse> - Promise resolving to the response
     */
    restore_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name ?? "",
        restore_objects_map: request.restore_objects_map,
        datasource_name: request.datasource_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/restore/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Restores database objects from a backup accessible via the data source
     * specified by `datasource_name`.
     *
     * @param backup_name Name of the backup to restore from, which must refer to an existing backup.
     * @param restore_objects_map Map of database objects to be restored from the backup.
     * @param datasource_name Data source through which the backup will be restored.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RestoreBackupResponse> - Promise resolving to the response
     */
    restore_backup(backup_name, restore_objects_map, datasource_name, options, callback) {
      const actualRequest = {
        backup_name: backup_name ?? "",
        restore_objects_map,
        datasource_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/restore/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Revoke user or role the specified permission on the specified object.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionResponse> - Promise resolving to the response
     */
    revoke_permission_request(request, callback) {
      const actualRequest = {
        principal: request.principal ?? "",
        object: request.object,
        object_type: request.object_type,
        permission: request.permission,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Revoke user or role the specified permission on the specified object.
     *
     * @param principal Name of the user or role for which the permission is being revoked.  Must be an existing user or role.
     * @param object Name of object permission is being revoked from.  It is recommended to use a fully-qualified name when possible.
     * @param object_type The type of object being revoked.
     * @param permission Permission being revoked.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionResponse> - Promise resolving to the response
     */
    revoke_permission(principal, object, object_type, permission, options, callback) {
      const actualRequest = {
        principal: principal ?? "",
        object,
        object_type,
        permission,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * credential-level permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionCredentialResponse> - Promise resolving to the response
     */
    revoke_permission_credential_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        credential_name: request.credential_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * credential-level permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param credential_name Name of the credential on which the permission will be revoked. Must be an existing credential, or an empty string to revoke access on all credentials.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionCredentialResponse> - Promise resolving to the response
     */
    revoke_permission_credential(name, permission, credential_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        credential_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a data
     * source permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionDatasourceResponse> - Promise resolving to the response
     */
    revoke_permission_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        datasource_name: request.datasource_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a data
     * source permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param datasource_name Name of the data source on which the permission will be revoked. Must be an existing data source, or an empty string to revoke permission from all data sources.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionDatasourceResponse> - Promise resolving to the response
     */
    revoke_permission_datasource(name, permission, datasource_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        datasource_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a KiFS
     * directory-level permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionDirectoryResponse> - Promise resolving to the response
     */
    revoke_permission_directory_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        directory_name: request.directory_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a KiFS
     * directory-level permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param directory_name Name of the KiFS directory to which the permission revokes access.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionDirectoryResponse> - Promise resolving to the response
     */
    revoke_permission_directory(name, permission, directory_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        directory_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/directory", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * proc-level permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionProcResponse> - Promise resolving to the response
     */
    revoke_permission_proc_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        proc_name: request.proc_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * proc-level permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param proc_name Name of the proc to which the permission grants access. Must be an existing proc, or an empty string if the permission grants access to all procs.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionProcResponse> - Promise resolving to the response
     */
    revoke_permission_proc(name, permission, proc_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        proc_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * system-level permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionSystemResponse> - Promise resolving to the response
     */
    revoke_permission_system_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/system", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * system-level permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionSystemResponse> - Promise resolving to the response
     */
    revoke_permission_system(name, permission, options, callback) {
      const actualRequest = {
        name,
        permission,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/system", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * table-level permission from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionTableResponse> - Promise resolving to the response
     */
    revoke_permission_table_request(request, callback) {
      const actualRequest = {
        name: request.name,
        permission: request.permission,
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * [DEPRECATED--please use `revoke_permission` instead]  Revokes a
     * table-level permission from a user or role.
     *
     * @param name Name of the user or role from which the permission will be revoked. Must be an existing user or role.
     * @param permission Permission to revoke from the user or role.
     * @param table_name Name of the table to which the permission grants access, in [schema_name.]table_name format, using standard name resolution rules.  Must be an existing table, view or schema.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokePermissionTableResponse> - Promise resolving to the response
     */
    revoke_permission_table(name, permission, table_name, options, callback) {
      const actualRequest = {
        name,
        permission,
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/permission/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Revokes membership in a role from a user or role.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.RevokeRoleResponse> - Promise resolving to the response
     */
    revoke_role_request(request, callback) {
      const actualRequest = {
        role: request.role,
        member: request.member,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Revokes membership in a role from a user or role.
     *
     * @param role Name of the role in which membership will be revoked. Must be an existing role.
     * @param member Name of the user or role that will be revoked membership in `role`. Must be an existing user or role.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.RevokeRoleResponse> - Promise resolving to the response
     */
    revoke_role(role, member, options, callback) {
      const actualRequest = {
        role,
        member,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/revoke/role", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about one or more backups accessible via the data
     * source specified by `datasource_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowBackupResponse> - Promise resolving to the response
     */
    show_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name ?? "",
        datasource_name: request.datasource_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about one or more backups accessible via the data
     * source specified by `datasource_name`.
     *
     * @param backup_name Name of the backup. An empty string or '*' will show
     * all existing backups. Any text followed by a '*' will show backups whose
     * name starts with that text.
     * @param datasource_name Data source through which the backup is accessible.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowBackupResponse> - Promise resolving to the response
     */
    show_backup(backup_name, datasource_name, options, callback) {
      const actualRequest = {
        backup_name: backup_name ?? "",
        datasource_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowContainerRegistryResponse> - Promise resolving to the response
     */
    show_container_registry_request(request, callback) {
      const actualRequest = {
        registry_name: request.registry_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param registry_name Name of the container registry.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowContainerRegistryResponse> - Promise resolving to the response
     */
    show_container_registry(registry_name, options, callback) {
      const actualRequest = {
        registry_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/container/registry", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified credential or all credentials.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowCredentialResponse> - Promise resolving to the response
     */
    show_credential_request(request, callback) {
      const actualRequest = {
        credential_name: request.credential_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified credential or all credentials.
     *
     * @param credential_name Name of the credential on which to retrieve information. The name must refer to a currently existing credential. If '*' is specified, information about all credentials will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowCredentialResponse> - Promise resolving to the response
     */
    show_credential(credential_name, options, callback) {
      const actualRequest = {
        credential_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/credential", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified data sink or all data sinks.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDatasinkResponse> - Promise resolving to the response
     */
    show_datasink_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified data sink or all data sinks.
     *
     * @param name Name of the data sink for which to retrieve information. The name must refer to a currently existing data sink. If '*' is specified, information about all data sinks will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDatasinkResponse> - Promise resolving to the response
     */
    show_datasink(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/datasink", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified data source or all data sources.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDatasourceResponse> - Promise resolving to the response
     */
    show_datasource_request(request, callback) {
      const actualRequest = {
        name: request.name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified data source or all data sources.
     *
     * @param name Name of the data source for which to retrieve information. The name must refer to a currently existing data source. If '*' is specified, information about all data sources will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDatasourceResponse> - Promise resolving to the response
     */
    show_datasource(name, options, callback) {
      const actualRequest = {
        name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/datasource", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about directories in KiFS. Can be used to show a
     * single directory, or all directories.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDirectoriesResponse> - Promise resolving to the response
     */
    show_directories_request(request, callback) {
      const actualRequest = {
        directory_name: request.directory_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/directories", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about directories in KiFS. Can be used to show a
     * single directory, or all directories.
     *
     * @param directory_name The KiFS directory name to show. If empty, shows all directories.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowDirectoriesResponse> - Promise resolving to the response
     */
    show_directories(directory_name, options, callback) {
      const actualRequest = {
        directory_name: directory_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/directories", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified user-defined function (UDF)
     * environment or all environments.
     *
     * Returns detailed information about existing environments.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowEnvironmentResponse> - Promise resolving to the response
     */
    show_environment_request(request, callback) {
      const actualRequest = {
        environment_name: request.environment_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a specified user-defined function (UDF)
     * environment or all environments.
     *
     * Returns detailed information about existing environments.
     *
     * @param environment_name Name of the environment on which to retrieve information. The name must refer to a currently existing environment. If '*' or an empty value is specified, information about all environments will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowEnvironmentResponse> - Promise resolving to the response
     */
    show_environment(environment_name, options, callback) {
      const actualRequest = {
        environment_name: environment_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/environment", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about files in KiFS. Can be used for individual files,
     * or to show all files in a given directory.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowFilesResponse> - Promise resolving to the response
     */
    show_files_request(request, callback) {
      const actualRequest = {
        paths: request.paths,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about files in KiFS. Can be used for individual files,
     * or to show all files in a given directory.
     *
     * @param paths File paths to show. Each path can be a KiFS directory name,
     * or a full path to a KiFS file. File paths may contain wildcard
     * characters after the KiFS directory delimiter.
     *
     * Accepted wildcard characters are asterisk (*) to represent any string of
     * zero or more characters, and question mark (?) to indicate a single
     * character.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowFilesResponse> - Promise resolving to the response
     */
    show_files(paths, options, callback) {
      const actualRequest = {
        paths,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Return the list of GPUdb functions for the SQL
     * Planner.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowFunctionsResponse> - Promise resolving to the response
     */
    show_functions_request(request, callback) {
      const actualRequest = {
        names: request.names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/functions", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Return the list of GPUdb functions for the SQL
     * Planner.
     *
     * @param names List of names of function to be shown.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowFunctionsResponse> - Promise resolving to the response
     */
    show_functions(names, options, callback) {
      const actualRequest = {
        names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/functions", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information and characteristics of graphs that exist on the graph
     * server.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowGraphResponse> - Promise resolving to the response
     */
    show_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information and characteristics of graphs that exist on the graph
     * server.
     *
     * @param graph_name Name of the graph on which to retrieve information. If left as the default value, information about all graphs is returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowGraphResponse> - Promise resolving to the response
     */
    show_graph(graph_name, options, callback) {
      const actualRequest = {
        graph_name: graph_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Request to retrieve the graph component grammar for graph end-points.
     *
     * Component configuration identifiers and options for all graph endpoints
     * as JSON string.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowGraphGrammarResponse> - Promise resolving to the response
     */
    show_graph_grammar_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/graph/grammar", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Request to retrieve the graph component grammar for graph end-points.
     *
     * Component configuration identifiers and options for all graph endpoints
     * as JSON string.
     *
     * @param options Additional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowGraphGrammarResponse> - Promise resolving to the response
     */
    show_graph_grammar(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/graph/grammar", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowModelResponse> - Promise resolving to the response
     */
    show_model_request(request, callback) {
      const actualRequest = {
        model_names: request.model_names ?? [],
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * @param model_names List of model names.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowModelResponse> - Promise resolving to the response
     */
    show_model(model_names, options, callback) {
      const actualRequest = {
        model_names: model_names ?? [],
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/model", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a proc.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowProcResponse> - Promise resolving to the response
     */
    show_proc_request(request, callback) {
      const actualRequest = {
        proc_name: request.proc_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about a proc.
     *
     * @param proc_name Name of the proc to show information about. If specified, must be the name of a currently existing proc. If not specified, information about all procs will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowProcResponse> - Promise resolving to the response
     */
    show_proc(proc_name, options, callback) {
      const actualRequest = {
        proc_name: proc_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows the statuses of running or completed proc instances. Results are
     * grouped by run ID (as returned from `execute_proc`) and data segment ID
     * (each invocation of the proc command on a data segment is assigned a
     * data segment ID).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowProcStatusResponse> - Promise resolving to the response
     */
    show_proc_status_request(request, callback) {
      const actualRequest = {
        run_id: request.run_id ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/proc/status", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows the statuses of running or completed proc instances. Results are
     * grouped by run ID (as returned from `execute_proc`) and data segment ID
     * (each invocation of the proc command on a data segment is assigned a
     * data segment ID).
     *
     * @param run_id The run ID of a specific proc instance for which the status will be returned. If a proc with a matching run ID is not found, the response will be empty. If not specified, the statuses of all executed proc instances will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowProcStatusResponse> - Promise resolving to the response
     */
    show_proc_status(run_id, options, callback) {
      const actualRequest = {
        run_id: run_id ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/proc/status", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns information about the internal sub-components (tiered objects)
     * which use resources of the system. The request can either return results
     * from actively used objects (default) or it can be used to query the
     * status of the objects of a given list of tables.
     *
     * Returns detailed information about the requested resource objects.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceObjectsResponse> - Promise resolving to the response
     */
    show_resource_objects_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/resource/objects", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns information about the internal sub-components (tiered objects)
     * which use resources of the system. The request can either return results
     * from actively used objects (default) or it can be used to query the
     * status of the objects of a given list of tables.
     *
     * Returns detailed information about the requested resource objects.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceObjectsResponse> - Promise resolving to the response
     */
    show_resource_objects(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/resource/objects", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests various statistics for storage/memory tiers and resource
     * groups.
     *
     * Returns statistics on a per-rank basis.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceStatisticsResponse> - Promise resolving to the response
     */
    show_resource_statistics_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/resource/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests various statistics for storage/memory tiers and resource
     * groups.
     *
     * Returns statistics on a per-rank basis.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceStatisticsResponse> - Promise resolving to the response
     */
    show_resource_statistics(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/resource/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests resource group properties.
     *
     * Returns detailed information about the requested resource groups.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceGroupsResponse> - Promise resolving to the response
     */
    show_resource_groups_request(request, callback) {
      const actualRequest = {
        names: request.names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/resourcegroups", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests resource group properties.
     *
     * Returns detailed information about the requested resource groups.
     *
     * @param names List of names of groups to be shown. A single entry with an empty string returns all groups.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowResourceGroupsResponse> - Promise resolving to the response
     */
    show_resource_groups(names, options, callback) {
      const actualRequest = {
        names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/resourcegroups", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information about a schema (or all schemas), as specified in
     * `schema_name`.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSchemaResponse> - Promise resolving to the response
     */
    show_schema_request(request, callback) {
      const actualRequest = {
        schema_name: request.schema_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information about a schema (or all schemas), as specified in
     * `schema_name`.
     *
     * @param schema_name Name of the schema for which to retrieve the information. If blank, then info for all schemas is returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSchemaResponse> - Promise resolving to the response
     */
    show_schema(schema_name, options, callback) {
      const actualRequest = {
        schema_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/schema", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows security information relating to users and/or roles. If the caller
     * is not a system administrator, only information relating to the caller
     * and their roles is returned.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSecurityResponse> - Promise resolving to the response
     */
    show_security_request(request, callback) {
      const actualRequest = {
        names: request.names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/security", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows security information relating to users and/or roles. If the caller
     * is not a system administrator, only information relating to the caller
     * and their roles is returned.
     *
     * @param names A list of names of users and/or roles about which security information is requested. If none are provided, information about all users and roles will be returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSecurityResponse> - Promise resolving to the response
     */
    show_security(names, options, callback) {
      const actualRequest = {
        names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/security", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about SQL procedures, including the full definition of
     * each requested procedure.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSqlProcResponse> - Promise resolving to the response
     */
    show_sql_proc_request(request, callback) {
      const actualRequest = {
        procedure_name: request.procedure_name ?? "",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/sql/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Shows information about SQL procedures, including the full definition of
     * each requested procedure.
     *
     * @param procedure_name Name of the procedure for which to retrieve the information. If blank, then information about all procedures is returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSqlProcResponse> - Promise resolving to the response
     */
    show_sql_proc(procedure_name, options, callback) {
      const actualRequest = {
        procedure_name: procedure_name ?? "",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/sql/proc", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves the collected column statistics for the specified table(s).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowStatisticsResponse> - Promise resolving to the response
     */
    show_statistics_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves the collected column statistics for the specified table(s).
     *
     * @param table_names Names of tables whose metadata will be fetched, each
     * in [schema_name.]table_name format, using standard name resolution
     * rules. All provided tables must exist, or an error is returned.  A
     * single entry of '*' expands to every user table the caller may read
     * (excluding system schemas, views, and temporary tables); when used it
     * must be the only entry.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowStatisticsResponse> - Promise resolving to the response
     */
    show_statistics(table_names, options, callback) {
      const actualRequest = {
        table_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/statistics", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns server configuration and version related information to the
     * caller. The admin tool uses it to present server related information to
     * the user.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemPropertiesResponse> - Promise resolving to the response
     */
    show_system_properties_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/properties", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns server configuration and version related information to the
     * caller. The admin tool uses it to present server related information to
     * the user.
     *
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemPropertiesResponse> - Promise resolving to the response
     */
    show_system_properties(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/properties", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Provides server configuration and health related status to the caller.
     * The admin tool uses it to present server related information to the
     * user.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemStatusResponse> - Promise resolving to the response
     */
    show_system_status_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/status", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Provides server configuration and health related status to the caller.
     * The admin tool uses it to present server related information to the
     * user.
     *
     * @param options Optional parameters, currently unused.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemStatusResponse> - Promise resolving to the response
     */
    show_system_status(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/status", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns the last 100 database requests along with the request timing and
     * internal job ID. The admin tool uses it to present request timing
     * information to the user.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemTimingResponse> - Promise resolving to the response
     */
    show_system_timing_request(request, callback) {
      const actualRequest = {
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/timing", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Returns the last 100 database requests along with the request timing and
     * internal job ID. The admin tool uses it to present request timing
     * information to the user.
     *
     * @param options Optional parameters, currently unused.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowSystemTimingResponse> - Promise resolving to the response
     */
    show_system_timing(options, callback) {
      const actualRequest = {
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/system/timing", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves detailed information about a table, view, or schema, specified
     * in `table_name`. If the supplied `table_name` is a schema the call can
     * return information about either the schema itself or the tables and
     * views it contains. If `table_name` is empty, information about all
     * schemas will be returned.
     *
     * If the option get_sizes is set to true, then the number of records in
     * each table is returned (in `sizes` and `full_sizes`), along with the
     * total number of objects across all requested tables (in `total_size` and
     * `total_full_size`).
     *
     * For a schema, setting the show_children option to false returns only
     * information about the schema itself; setting show_children to true
     * returns a list of tables and views contained in the schema, along with
     * their corresponding detail.
     *
     * To retrieve a list of every table, view, and schema in the database, set
     * `table_name` to '*' and show_children to true.  When doing this, the
     * returned `total_size` and `total_full_size` will not include the sizes
     * of non-base tables (e.g., filters, views, joins, etc.).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableResponse> - Promise resolving to the response
     */
    show_table_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves detailed information about a table, view, or schema, specified
     * in `table_name`. If the supplied `table_name` is a schema the call can
     * return information about either the schema itself or the tables and
     * views it contains. If `table_name` is empty, information about all
     * schemas will be returned.
     *
     * If the option get_sizes is set to true, then the number of records in
     * each table is returned (in `sizes` and `full_sizes`), along with the
     * total number of objects across all requested tables (in `total_size` and
     * `total_full_size`).
     *
     * For a schema, setting the show_children option to false returns only
     * information about the schema itself; setting show_children to true
     * returns a list of tables and views contained in the schema, along with
     * their corresponding detail.
     *
     * To retrieve a list of every table, view, and schema in the database, set
     * `table_name` to '*' and show_children to true.  When doing this, the
     * returned `total_size` and `total_full_size` will not include the sizes
     * of non-base tables (e.g., filters, views, joins, etc.).
     *
     * @param table_name Name of the table for which to retrieve the information, in [schema_name.]table_name format, using standard name resolution rules.  If blank, then returns information about all tables and views.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableResponse> - Promise resolving to the response
     */
    show_table(table_name, options, callback) {
      const actualRequest = {
        table_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/table", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves the user provided metadata for the specified tables.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableMetadataResponse> - Promise resolving to the response
     */
    show_table_metadata_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/table/metadata", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves the user provided metadata for the specified tables.
     *
     * @param table_names Names of tables whose metadata will be fetched, in [schema_name.]table_name format, using standard name resolution rules.  All provided tables must exist, or an error is returned.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableMetadataResponse> - Promise resolving to the response
     */
    show_table_metadata(table_names, options, callback) {
      const actualRequest = {
        table_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/table/metadata", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Show table monitors and their properties. Table monitors are created
     * using `create_table_monitor`.
     *
     * Returns detailed information about existing table monitors.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableMonitorsResponse> - Promise resolving to the response
     */
    show_table_monitors_request(request, callback) {
      const actualRequest = {
        monitor_ids: request.monitor_ids,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/tablemonitors", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Show table monitors and their properties. Table monitors are created
     * using `create_table_monitor`.
     *
     * Returns detailed information about existing table monitors.
     *
     * @param monitor_ids List of monitors to be shown. An empty list or a single entry with an empty string returns all table monitors.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTableMonitorsResponse> - Promise resolving to the response
     */
    show_table_monitors(monitor_ids, options, callback) {
      const actualRequest = {
        monitor_ids,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/tablemonitors", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Gets names of the tables whose type matches the given criteria. Each
     * table has a particular type. This type comprises the schema and
     * properties of the table and sometimes a type label. This function allows
     * a look up of the existing tables based on full or partial type
     * information. The operation is synchronous.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTablesByTypeResponse> - Promise resolving to the response
     */
    show_tables_by_type_request(request, callback) {
      const actualRequest = {
        type_id: request.type_id,
        label: request.label,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/tables/bytype", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Gets names of the tables whose type matches the given criteria. Each
     * table has a particular type. This type comprises the schema and
     * properties of the table and sometimes a type label. This function allows
     * a look up of the existing tables based on full or partial type
     * information. The operation is synchronous.
     *
     * @param type_id Type id returned by a call to `create_type`.
     * @param label Optional user supplied label which can be used instead of the type_id to retrieve all tables with the given label.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTablesByTypeResponse> - Promise resolving to the response
     */
    show_tables_by_type(type_id, label, options, callback) {
      const actualRequest = {
        type_id,
        label,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/tables/bytype", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information regarding the specified triggers or all existing
     * triggers currently active.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTriggersResponse> - Promise resolving to the response
     */
    show_triggers_request(request, callback) {
      const actualRequest = {
        trigger_ids: request.trigger_ids,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/triggers", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information regarding the specified triggers or all existing
     * triggers currently active.
     *
     * @param trigger_ids List of IDs of the triggers whose information is to be retrieved. An empty list means information will be retrieved on all active triggers.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTriggersResponse> - Promise resolving to the response
     */
    show_triggers(trigger_ids, options, callback) {
      const actualRequest = {
        trigger_ids,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/triggers", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information for the specified data type ID or type label. For
     * all data types that match the input criteria, the database returns the
     * type ID, the type schema, the label (if available), and the type's
     * column properties.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTypesResponse> - Promise resolving to the response
     */
    show_types_request(request, callback) {
      const actualRequest = {
        type_id: request.type_id,
        label: request.label,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/types", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information for the specified data type ID or type label. For
     * all data types that match the input criteria, the database returns the
     * type ID, the type schema, the label (if available), and the type's
     * column properties.
     *
     * @param type_id Type Id returned in response to a call to `create_type`.
     * @param label Option string that was supplied by user in a call to `create_type`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowTypesResponse> - Promise resolving to the response
     */
    show_types(type_id, label, options, callback) {
      const actualRequest = {
        type_id,
        label,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/types", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information about rendered videos.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowVideoResponse> - Promise resolving to the response
     */
    show_video_request(request, callback) {
      const actualRequest = {
        paths: request.paths,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves information about rendered videos.
     *
     * @param paths The fully-qualified KiFS paths for the videos to show. If empty, shows all videos.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowVideoResponse> - Promise resolving to the response
     */
    show_video(paths, options, callback) {
      const actualRequest = {
        paths,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/video", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests table write-ahead log (WAL) properties.
     *
     * Returns information about the requested table WAL entries.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.ShowWalResponse> - Promise resolving to the response
     */
    show_wal_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/show/wal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Requests table write-ahead log (WAL) properties.
     *
     * Returns information about the requested table WAL entries.
     *
     * @param table_names List of tables to query. An asterisk returns all tables.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.ShowWalResponse> - Promise resolving to the response
     */
    show_wal(table_names, options, callback) {
      const actualRequest = {
        table_names,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/show/wal", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Solves an existing graph for a type of problem (e.g., shortest path,
     * page rank, traveling salesman, etc.) using source nodes, destination
     * nodes, and additional, optional weights and restrictions.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /solve/graph examples before using this endpoint.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.SolveGraphResponse> - Promise resolving to the response
     */
    solve_graph_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        weights_on_edges: request.weights_on_edges ?? [],
        restrictions: request.restrictions ?? [],
        solver_type: request.solver_type ?? "SHORTEST_PATH",
        source_nodes: request.source_nodes ?? [],
        destination_nodes: request.destination_nodes ?? [],
        solution_table: request.solution_table ?? "graph_solutions",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/solve/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Solves an existing graph for a type of problem (e.g., shortest path,
     * page rank, traveling salesman, etc.) using source nodes, destination
     * nodes, and additional, optional weights and restrictions.
     *
     * IMPORTANT: It's highly recommended that you review the Graphs and
     * Solvers concepts documentation, the Graph REST Tutorial, and/or some
     * /solve/graph examples before using this endpoint.
     *
     * @param graph_name Name of the graph resource to solve.
     * @param weights_on_edges Additional weights to apply to the edges of an
     * existing graph. Weights must be specified using identifiers; identifiers
     * are grouped as combinations. Identifiers can be used with existing
     * column names, e.g., 'table.column AS WEIGHTS_EDGE_ID', expressions,
     * e.g., 'ST_LENGTH(wkt) AS WEIGHTS_VALUESPECIFIED', or constant values,
     * e.g., '{4, 15, 2} AS WEIGHTS_VALUESPECIFIED'. Any provided weights will
     * be added (in the case of 'WEIGHTS_VALUESPECIFIED') to or multiplied with
     * (in the case of 'WEIGHTS_FACTORSPECIFIED') the existing weight(s). If
     * using constant values in an identifier combination, the number of values
     * specified must match across the combination.
     * @param restrictions Additional restrictions to apply to the nodes/edges
     * of an existing graph. Restrictions must be specified using identifiers;
     * identifiers are grouped as combinations. Identifiers can be used with
     * existing column names, e.g., 'table.column AS RESTRICTIONS_EDGE_ID',
     * expressions, e.g., 'column/2 AS RESTRICTIONS_VALUECOMPARED', or constant
     * values, e.g., '{0, 0, 0, 1} AS RESTRICTIONS_ONOFFCOMPARED'. If using
     * constant values in an identifier combination, the number of values
     * specified must match across the combination. If
     * remove_previous_restrictions option is set to true, any provided
     * restrictions will replace the existing restrictions. Otherwise, any
     * provided restrictions will be added (in the case of
     * 'RESTRICTIONS_VALUECOMPARED') to or replaced (in the case of
     * 'RESTRICTIONS_ONOFFCOMPARED').
     * @param solver_type The type of solver to use for the graph.
     * @param source_nodes It can be one of the nodal identifiers - e.g: 'NODE_WKTPOINT' for source nodes. For BACKHAUL_ROUTING, this list depicts the fixed assets.
     * @param destination_nodes It can be one of the nodal identifiers - e.g: 'NODE_WKTPOINT' for destination (target) nodes. For BACKHAUL_ROUTING, this list depicts the remote assets.
     * @param solution_table Name of the table to store the solution, in [schema_name.]table_name format, using standard name resolution rules.
     * @param options Additional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.SolveGraphResponse> - Promise resolving to the response
     */
    solve_graph(graph_name, weights_on_edges, restrictions, solver_type, source_nodes, destination_nodes, solution_table, options, callback) {
      const actualRequest = {
        graph_name,
        weights_on_edges: weights_on_edges ?? [],
        restrictions: restrictions ?? [],
        solver_type: solver_type ?? "SHORTEST_PATH",
        source_nodes: source_nodes ?? [],
        destination_nodes: destination_nodes ?? [],
        solution_table: solution_table ?? "graph_solutions",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/solve/graph", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Runs multiple predicate-based updates in a single call.  With the list
     * of given expressions, any matching record's column values will be
     * updated as provided in `new_values_maps`.  There is also an optional
     * 'upsert' capability where if a particular predicate doesn't match any
     * existing record, then a new record can be inserted.
     *
     * Note that this operation can only be run on an original table and not on
     * a result view.
     *
     * This operation can update primary key values.  By default only 'pure
     * primary key' predicates are allowed when updating primary key values. If
     * the primary key for a table is the column 'attr1', then the operation
     * will only accept predicates of the form: "attr1 == 'foo'" if the attr1
     * column is being updated.  For a composite primary key (e.g. columns
     * 'attr1' and 'attr2') then this operation will only accept predicates of
     * the form: "(attr1 == 'foo') and (attr2 == 'bar')".  Meaning, all primary
     * key columns must appear in an equality predicate in the expressions.
     * Furthermore each 'pure primary key' predicate must be unique within a
     * given request.  These restrictions can be removed by utilizing some
     * available options through `options`.
     *
     * The update_on_existing_pk option specifies the record primary key
     * collision policy for tables with a primary key, while ignore_existing_pk
     * specifies the record primary key collision error-suppression policy when
     * those collisions result in the update being rejected.  Both are ignored
     * on tables with no primary key.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.UpdateRecordsResponse> - Promise resolving to the response
     */
    update_records_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        expressions: request.expressions,
        new_values_maps: request.new_values_maps,
        records_to_insert: request.records_to_insert ?? [],
        records_to_insert_str: [],
        record_encoding: request.record_encoding ?? this.recordEncoding("/update/records"),
        options: request.options ?? {}
      };
      const dispatched = this.submitRecords("/update/records", actualRequest, request.table_name, request.data, { binary: "records_to_insert", json: "records_to_insert_str", encoding: "record_encoding" }, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Runs multiple predicate-based updates in a single call.  With the list
     * of given expressions, any matching record's column values will be
     * updated as provided in `new_values_maps`.  There is also an optional
     * 'upsert' capability where if a particular predicate doesn't match any
     * existing record, then a new record can be inserted.
     *
     * Note that this operation can only be run on an original table and not on
     * a result view.
     *
     * This operation can update primary key values.  By default only 'pure
     * primary key' predicates are allowed when updating primary key values. If
     * the primary key for a table is the column 'attr1', then the operation
     * will only accept predicates of the form: "attr1 == 'foo'" if the attr1
     * column is being updated.  For a composite primary key (e.g. columns
     * 'attr1' and 'attr2') then this operation will only accept predicates of
     * the form: "(attr1 == 'foo') and (attr2 == 'bar')".  Meaning, all primary
     * key columns must appear in an equality predicate in the expressions.
     * Furthermore each 'pure primary key' predicate must be unique within a
     * given request.  These restrictions can be removed by utilizing some
     * available options through `options`.
     *
     * The update_on_existing_pk option specifies the record primary key
     * collision policy for tables with a primary key, while ignore_existing_pk
     * specifies the record primary key collision error-suppression policy when
     * those collisions result in the update being rejected.  Both are ignored
     * on tables with no primary key.
     *
     * @param table_name Name of table to be updated, in
     * [schema_name.]table_name format, using standard name resolution rules.
     * Must be a currently existing table and not a view.
     * @param expressions A list of the actual predicates, one for each update; format should follow the guidelines `filter`.
     * @param new_values_maps List of new values for the matching records.
     * Each element is a map with (key, value) pairs where the keys are the
     * names of the columns whose values are to be updated; the values are the
     * new values.  The number of elements in the list should match the length
     * of `expressions`.
     * @param data Data records to process
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.UpdateRecordsResponse> - Promise resolving to the response
     */
    update_records(table_name, expressions, new_values_maps, data, options, callback) {
      const actualRequest = {
        table_name,
        expressions,
        new_values_maps,
        records_to_insert: [],
        records_to_insert_str: [],
        record_encoding: this.recordEncoding("/update/records"),
        options: options ?? {}
      };
      const dispatched = this.submitRecords("/update/records", actualRequest, table_name, data, { binary: "records_to_insert", json: "records_to_insert_str", encoding: "record_encoding" }, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Uploads one or more files to KiFS. There are two methods for uploading
     * files: load files in their entirety, or load files in parts. The latter
     * is recommended for files of approximately 60 MB or larger.
     *
     * To upload files in their entirety, populate `file_names` with the file
     * names to upload into on KiFS, and their respective byte content in
     * `file_data`.
     *
     * Multiple steps are involved when uploading in multiple parts. Only one
     * file at a time can be uploaded in this manner. A user-provided UUID is
     * utilized to tie all the upload steps together for a given file.  To
     * upload a file in multiple parts:
     *
     * 1. Provide the file name in `file_names`, the UUID in the
     *    multipart_upload_uuid key in `options`, and a multipart_operation
     *    value of init.
     * 2. Upload one or more parts by providing the file name, the part data in
     *    `file_data`, the UUID, a multipart_operation value of upload_part,
     *    and the part number in the multipart_upload_part_number. The part
     *    numbers must start at 1 and increase incrementally. Parts may not be
     *    uploaded out of order.
     * 3. Complete the upload by providing the file name, the UUID, and a
     *    multipart_operation value of complete.
     *
     * Multipart uploads in progress may be canceled by providing the file
     * name, the UUID, and a multipart_operation value of cancel.  If an new
     * upload is initialized with a different UUID for an existing upload in
     * progress, the pre-existing upload is automatically canceled in favor of
     * the new upload.
     *
     * The multipart upload must be completed for the file to be usable in
     * KiFS. Information about multipart uploads in progress is available in
     * `show_files`.
     *
     * File data may be pre-encoded using base64 encoding. This should be
     * indicated using the file_encoding option, and is recommended when using
     * JSON serialization.
     *
     * Each file path must reside in a top-level KiFS directory, i.e. one of
     * the directories listed in `show_directories`. The user must have write
     * permission on the directory. Nested directories are permitted in file
     * name paths. Directories are delineated with the directory separator of
     * '/'.  For example, given the file path '/a/b/c/d.txt', 'a' must be a
     * KiFS directory.
     *
     * These characters are allowed in file name paths: letters, numbers,
     * spaces, the path delimiter of '/', and the characters: '.' '-' ':' '['
     * ']' '(' ')' '#' '='.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.UploadFilesResponse> - Promise resolving to the response
     */
    upload_files_request(request, callback) {
      const actualRequest = {
        file_names: request.file_names,
        file_data: request.file_data,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/upload/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Uploads one or more files to KiFS. There are two methods for uploading
     * files: load files in their entirety, or load files in parts. The latter
     * is recommended for files of approximately 60 MB or larger.
     *
     * To upload files in their entirety, populate `file_names` with the file
     * names to upload into on KiFS, and their respective byte content in
     * `file_data`.
     *
     * Multiple steps are involved when uploading in multiple parts. Only one
     * file at a time can be uploaded in this manner. A user-provided UUID is
     * utilized to tie all the upload steps together for a given file.  To
     * upload a file in multiple parts:
     *
     * 1. Provide the file name in `file_names`, the UUID in the
     *    multipart_upload_uuid key in `options`, and a multipart_operation
     *    value of init.
     * 2. Upload one or more parts by providing the file name, the part data in
     *    `file_data`, the UUID, a multipart_operation value of upload_part,
     *    and the part number in the multipart_upload_part_number. The part
     *    numbers must start at 1 and increase incrementally. Parts may not be
     *    uploaded out of order.
     * 3. Complete the upload by providing the file name, the UUID, and a
     *    multipart_operation value of complete.
     *
     * Multipart uploads in progress may be canceled by providing the file
     * name, the UUID, and a multipart_operation value of cancel.  If an new
     * upload is initialized with a different UUID for an existing upload in
     * progress, the pre-existing upload is automatically canceled in favor of
     * the new upload.
     *
     * The multipart upload must be completed for the file to be usable in
     * KiFS. Information about multipart uploads in progress is available in
     * `show_files`.
     *
     * File data may be pre-encoded using base64 encoding. This should be
     * indicated using the file_encoding option, and is recommended when using
     * JSON serialization.
     *
     * Each file path must reside in a top-level KiFS directory, i.e. one of
     * the directories listed in `show_directories`. The user must have write
     * permission on the directory. Nested directories are permitted in file
     * name paths. Directories are delineated with the directory separator of
     * '/'.  For example, given the file path '/a/b/c/d.txt', 'a' must be a
     * KiFS directory.
     *
     * These characters are allowed in file name paths: letters, numbers,
     * spaces, the path delimiter of '/', and the characters: '.' '-' ':' '['
     * ']' '(' ')' '#' '='.
     *
     * @param file_names An array of full file name paths to be used for the
     * files uploaded to KiFS. File names may have any number of nested
     * directories in their paths, but the top-level directory must be an
     * existing KiFS directory. Each file must reside in or under a top-level
     * directory. A full file name path cannot be larger than 1024 characters.
     * @param file_data File data for the files being uploaded, for the respective files in `file_names`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.UploadFilesResponse> - Promise resolving to the response
     */
    upload_files(file_names, file_data, options, callback) {
      const actualRequest = {
        file_names,
        file_data,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/upload/files", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Uploads one or more files to KiFS.
     *
     * Each file path must reside in a top-level KiFS directory, i.e. one of
     * the directories listed in `show_directories`. The user must have write
     * permission on the directory. Nested directories are permitted in file
     * name paths. Directories are delineated with the directory separator of
     * '/'.  For example, given the file path '/a/b/c/d.txt', 'a' must be a
     * KiFS directory.
     *
     * These characters are allowed in file name paths: letters, numbers,
     * spaces, the path delimiter of '/', and the characters: '.' '-' ':' '['
     * ']' '(' ')' '#' '='.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.UploadFilesFromurlResponse> - Promise resolving to the response
     */
    upload_files_fromurl_request(request, callback) {
      const actualRequest = {
        file_names: request.file_names,
        urls: request.urls,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/upload/files/fromurl", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Uploads one or more files to KiFS.
     *
     * Each file path must reside in a top-level KiFS directory, i.e. one of
     * the directories listed in `show_directories`. The user must have write
     * permission on the directory. Nested directories are permitted in file
     * name paths. Directories are delineated with the directory separator of
     * '/'.  For example, given the file path '/a/b/c/d.txt', 'a' must be a
     * KiFS directory.
     *
     * These characters are allowed in file name paths: letters, numbers,
     * spaces, the path delimiter of '/', and the characters: '.' '-' ':' '['
     * ']' '(' ')' '#' '='.
     *
     * @param file_names An array of full file name paths to be used for the
     * files uploaded to KiFS. File names may have any number of nested
     * directories in their paths, but the top-level directory must be an
     * existing KiFS directory. Each file must reside in or under a top-level
     * directory. A full file name path cannot be larger than 1024 characters.
     * @param urls List of URLs to upload, for each respective file in `file_names`.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.UploadFilesFromurlResponse> - Promise resolving to the response
     */
    upload_files_fromurl(file_names, urls, options, callback) {
      const actualRequest = {
        file_names,
        urls,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/upload/files/fromurl", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Inspects the requested database backup(s) for conformity at the remote
     * file store accessible via the data source specified by
     * `datasource_name`. By default all snapshots are inspected unless the
     * option backup_id is used to target a specific instance.
     *
     * Returns backup verification results.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VerifyBackupResponse> - Promise resolving to the response
     */
    verify_backup_request(request, callback) {
      const actualRequest = {
        backup_name: request.backup_name ?? "",
        datasource_name: request.datasource_name,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/verify/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Inspects the requested database backup(s) for conformity at the remote
     * file store accessible via the data source specified by
     * `datasource_name`. By default all snapshots are inspected unless the
     * option backup_id is used to target a specific instance.
     *
     * Returns backup verification results.
     *
     * @param backup_name Name of the backup. An empty string or '*' will check
     * all existing backups. Any text followed by a '*' will inspect backups
     * whose name starts with that text.
     * @param datasource_name Data source through which the backup is accessible.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VerifyBackupResponse> - Promise resolving to the response
     */
    verify_backup(backup_name, datasource_name, options, callback) {
      const actualRequest = {
        backup_name: backup_name ?? "",
        datasource_name,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/verify/backup", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeGetFeatureInfoResponse> - Promise resolving to the response
     */
    visualize_get_feature_info_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        x_column_names: request.x_column_names,
        y_column_names: request.y_column_names,
        geometry_column_names: request.geometry_column_names,
        query_column_names: request.query_column_names,
        projection: request.projection,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        x: request.x,
        y: request.y,
        radius: request.radius,
        limit: request.limit,
        encoding: request.encoding,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/getfeatureinfo", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.
     *
     * @param table_names Names of the tables containing the data to be retrieved.
     * @param x_column_names For each table, name of the column containing X coordinates, if applicable, empty string otherwise.
     * @param y_column_names For each table, name of the column containing Y coordinates, if applicable, empty string otherwise.
     * @param geometry_column_names For each table, name of the column containing geometry data, if applicable, empty string otherwise.
     * @param query_column_names For each table, list of names of the columns to retrieve; '*' indicates all columns in the table other than the geometry column (which may be requested directly if desired).
     * @param projection Projection of the spatial data in the image.
     * @param min_x Lower bound of the projected X coordinates in the image.
     * @param max_x Upper bound of the projected X coordinates in the image.
     * @param min_y Lower bound of the projected Y coordinates in the image.
     * @param max_y Upper bound of the projected Y coordinates in the image.
     * @param width Width of the image in pixels.
     * @param height Height of the image in pixels.
     * @param x Pixel X coordinate within the image for which to retrieve data.
     * @param y Pixel Y coordinate within the image for which to retrieve data.
     * @param radius Radius in pixels around the X and Y coordinates for which to retrieve data.
     * @param limit The maximum number of results to be returned, or END_OF_SET (-9999) for the maximum allowed by the server.
     * @param encoding Encoding for returned records.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeGetFeatureInfoResponse> - Promise resolving to the response
     */
    visualize_get_feature_info(table_names, x_column_names, y_column_names, geometry_column_names, query_column_names, projection, min_x, max_x, min_y, max_y, width, height, x, y, radius, limit, encoding, options, callback) {
      const actualRequest = {
        table_names,
        x_column_names,
        y_column_names,
        geometry_column_names,
        query_column_names,
        projection,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        x,
        y,
        radius,
        limit,
        encoding,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/getfeatureinfo", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates rasterized image tiles for an area of
     * interest using the given tables and the provided parameters.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageResponse> - Promise resolving to the response
     */
    visualize_image_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        world_table_names: request.world_table_names,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        symbol_column_name: request.symbol_column_name,
        geometry_column_name: request.geometry_column_name,
        track_ids: request.track_ids,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        projection: request.projection ?? "PLATE_CARREE",
        bg_color: request.bg_color,
        style_options: request.style_options,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates rasterized image tiles for an area of
     * interest using the given tables and the provided parameters.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * @param table_names Name of the table containing the data for the various layers to be rendered.
     * @param world_table_names Optional name of the tables containing the data for the entire track when the `table_names` contains only part of the track data, but the entire track has to be rendered.
     * @param x_column_name Name of the column containing the x coordinates.
     * @param y_column_name Name of the column containing the y coordinates.
     * @param symbol_column_name Name of the column containing the symbol code coordinates.
     * @param geometry_column_name Name of the column containing geometry data.
     * @param track_ids Tracks from the `table_names` to be rendered.
     * @param min_x Lower bound for the x values.
     * @param max_x Upper bound for the x values.
     * @param min_y Lower bound for the y values.
     * @param max_y Upper bound for the y values.
     * @param width Width of the generated image.
     * @param height Height of the generated image.
     * @param projection Spatial Reference System (i.e. EPSG Code).
     * @param bg_color Background color of the generated image.
     * @param style_options Styling options for the image.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageResponse> - Promise resolving to the response
     */
    visualize_image(table_names, world_table_names, x_column_name, y_column_name, symbol_column_name, geometry_column_name, track_ids, min_x, max_x, min_y, max_y, width, height, projection, bg_color, style_options, options, callback) {
      const actualRequest = {
        table_names,
        world_table_names,
        x_column_name,
        y_column_name,
        symbol_column_name,
        geometry_column_name,
        track_ids,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        projection: projection ?? "PLATE_CARREE",
        bg_color,
        style_options,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Scatter plot is the only plot type currently supported. A non-numeric
     * column can be specified as x or y column and jitters can be added to
     * them to avoid excessive overlapping. All color values must be in the
     * format RRGGBB or AARRGGBB (to specify the alpha value).
     *
     * The image is contained in the `image_data` field.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageChartResponse> - Promise resolving to the response
     */
    visualize_image_chart_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        x_column_names: request.x_column_names,
        y_column_names: request.y_column_names,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        bg_color: request.bg_color,
        style_options: request.style_options,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/chart", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Scatter plot is the only plot type currently supported. A non-numeric
     * column can be specified as x or y column and jitters can be added to
     * them to avoid excessive overlapping. All color values must be in the
     * format RRGGBB or AARRGGBB (to specify the alpha value).
     *
     * The image is contained in the `image_data` field.
     *
     * @param table_name Name of the table containing the data to be drawn as a chart, in [schema_name.]table_name format, using standard name resolution rules.
     * @param x_column_names Names of the columns containing the data mapped to the x axis of a chart.
     * @param y_column_names Names of the columns containing the data mapped to the y axis of a chart.
     * @param min_x Lower bound for the x column values. For non-numeric x column, each x column item is mapped to an integral value starting from 0.
     * @param max_x Upper bound for the x column values. For non-numeric x column, each x column item is mapped to an integral value starting from 0.
     * @param min_y Lower bound for the y column values. For non-numeric y column, each y column item is mapped to an integral value starting from 0.
     * @param max_y Upper bound for the y column values. For non-numeric y column, each y column item is mapped to an integral value starting from 0.
     * @param width Width of the generated image in pixels.
     * @param height Height of the generated image in pixels.
     * @param bg_color Background color of the generated image.
     * @param style_options Rendering style options for a chart.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageChartResponse> - Promise resolving to the response
     */
    visualize_image_chart(table_name, x_column_names, y_column_names, min_x, max_x, min_y, max_y, width, height, bg_color, style_options, options, callback) {
      const actualRequest = {
        table_name,
        x_column_names,
        y_column_names,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        bg_color,
        style_options,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/chart", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates 'class break' rasterized image tiles
     * for an area of interest using the given tables and the provided
     * parameters.
     *
     * A class break rendering is where data from one or more tables is
     * rasterized with styling applied on a per-class basis. Class breaks based
     * on one or more data columns are supported. Distinct values (for strings)
     * or ranges (for numeric attributes) must be provided in the
     * cb_column_name1/cb_vals1 and cb_column_name2/cb_vals2 parameters. The
     * styling parameters must be specified for each class.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * The image is contained in the `image_data` field.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageClassbreakResponse> - Promise resolving to the response
     */
    visualize_image_classbreak_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        world_table_names: request.world_table_names,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        symbol_column_name: request.symbol_column_name,
        geometry_column_name: request.geometry_column_name,
        track_ids: request.track_ids,
        cb_attr: request.cb_attr,
        cb_vals: request.cb_vals,
        cb_pointcolor_attr: request.cb_pointcolor_attr,
        cb_pointcolor_vals: request.cb_pointcolor_vals,
        cb_pointalpha_attr: request.cb_pointalpha_attr,
        cb_pointalpha_vals: request.cb_pointalpha_vals,
        cb_pointsize_attr: request.cb_pointsize_attr,
        cb_pointsize_vals: request.cb_pointsize_vals,
        cb_pointshape_attr: request.cb_pointshape_attr,
        cb_pointshape_vals: request.cb_pointshape_vals,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        projection: request.projection ?? "PLATE_CARREE",
        bg_color: request.bg_color,
        style_options: request.style_options,
        options: request.options ?? {},
        cb_transparency_vec: request.cb_transparency_vec
      };
      const dispatched = this.submitRequest("/visualize/image/classbreak", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates 'class break' rasterized image tiles
     * for an area of interest using the given tables and the provided
     * parameters.
     *
     * A class break rendering is where data from one or more tables is
     * rasterized with styling applied on a per-class basis. Class breaks based
     * on one or more data columns are supported. Distinct values (for strings)
     * or ranges (for numeric attributes) must be provided in the
     * cb_column_name1/cb_vals1 and cb_column_name2/cb_vals2 parameters. The
     * styling parameters must be specified for each class.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * The image is contained in the `image_data` field.
     *
     * @param table_names Name of the table containing the data for the various layers to be rendered.
     * @param world_table_names Optional name of the tables containing the data for the entire track when the `table_names` contains only part of the track data, but the entire track has to be rendered.
     * @param x_column_name Name of the column containing the x coordinates.
     * @param y_column_name Name of the column containing the y coordinates.
     * @param symbol_column_name Name of the column containing the symbol code coordinates.
     * @param geometry_column_name Name of the column containing geometry data.
     * @param track_ids Tracks from the `table_names` to be rendered.
     * @param cb_attr Name of the column for the generic class break.
     * @param cb_vals A list of class break values or ranges (e.g. '0:5,5:10,15:30').
     * @param cb_pointcolor_attr Name of the column for the point color class break.
     * @param cb_pointcolor_vals A list of class break values or ranges (e.g. '0:5,5:10,15:30').
     * @param cb_pointalpha_attr Name of the column for the point alpha class break.
     * @param cb_pointalpha_vals A list of class break values or ranges (e.g. '0:5,5:10,15:30').
     * @param cb_pointsize_attr Name of the column for the point size class break.
     * @param cb_pointsize_vals A list of class break values or ranges (e.g. '0:5,5:10,15:30').
     * @param cb_pointshape_attr Name of the column for the point shape class break.
     * @param cb_pointshape_vals A list of class break values or ranges (e.g. '0:5,5:10,15:30').
     * @param min_x Lower bound for the x values.
     * @param max_x Upper bound for the x values.
     * @param min_y Lower bound for the y values.
     * @param max_y Upper bound for the y values.
     * @param width Width of the generated image.
     * @param height Height of the generated image.
     * @param projection Spatial Reference System (i.e. EPSG Code).
     * @param bg_color Background color of the generated image.
     * @param style_options Styling options for the image.
     * @param options Optional parameters.
     * @param cb_transparency_vec Used for internal purpose. Indicating the color of each class is semi-transparent or not (0: opaque or completely transparent, 1: semi-transparent).
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageClassbreakResponse> - Promise resolving to the response
     */
    visualize_image_classbreak(table_names, world_table_names, x_column_name, y_column_name, symbol_column_name, geometry_column_name, track_ids, cb_attr, cb_vals, cb_pointcolor_attr, cb_pointcolor_vals, cb_pointalpha_attr, cb_pointalpha_vals, cb_pointsize_attr, cb_pointsize_vals, cb_pointshape_attr, cb_pointshape_vals, min_x, max_x, min_y, max_y, width, height, projection, bg_color, style_options, options, cb_transparency_vec, callback) {
      const actualRequest = {
        table_names,
        world_table_names,
        x_column_name,
        y_column_name,
        symbol_column_name,
        geometry_column_name,
        track_ids,
        cb_attr,
        cb_vals,
        cb_pointcolor_attr,
        cb_pointcolor_vals,
        cb_pointalpha_attr,
        cb_pointalpha_vals,
        cb_pointsize_attr,
        cb_pointsize_vals,
        cb_pointshape_attr,
        cb_pointshape_vals,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        projection: projection ?? "PLATE_CARREE",
        bg_color,
        style_options,
        options: options ?? {},
        cb_transparency_vec
      };
      const dispatched = this.submitRequest("/visualize/image/classbreak", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only. Generates equipotential curves in an area of
     * interest for a set of tables.
     *
     * The isolines are contained in the `image_data` field.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageContourResponse> - Promise resolving to the response
     */
    visualize_image_contour_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        value_column_name: request.value_column_name,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        projection: request.projection ?? "PLATE_CARREE",
        style_options: request.style_options,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/contour", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only. Generates equipotential curves in an area of
     * interest for a set of tables.
     *
     * The isolines are contained in the `image_data` field.
     *
     * @param table_names Name of the table containing the data to be represented.
     * @param x_column_name Name of the column containing the x coordinates.
     * @param y_column_name Name of the column containing the y coordinates.
     * @param value_column_name
     * @param min_x Lower bound for the x values.
     * @param max_x Upper bound for the x values.
     * @param min_y Lower bound for the y values.
     * @param max_y Upper bound for the y values.
     * @param width Width of the generated image.
     * @param height Height of the generated image.
     * @param projection Spatial Reference System (i.e. EPSG Code).
     * @param style_options Various style related options.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageContourResponse> - Promise resolving to the response
     */
    visualize_image_contour(table_names, x_column_name, y_column_name, value_column_name, min_x, max_x, min_y, max_y, width, height, projection, style_options, options, callback) {
      const actualRequest = {
        table_names,
        x_column_name,
        y_column_name,
        value_column_name,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        projection: projection ?? "PLATE_CARREE",
        style_options,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/contour", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates rasterized heatmap image tiles for an
     * area of interest using the given tables and the provided parameters.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * The heatmap image is contained in the `image_data` field.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageHeatmapResponse> - Promise resolving to the response
     */
    visualize_image_heatmap_request(request, callback) {
      const actualRequest = {
        table_names: request.table_names,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        value_column_name: request.value_column_name,
        geometry_column_name: request.geometry_column_name,
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        projection: request.projection ?? "PLATE_CARREE",
        style_options: request.style_options,
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/heatmap", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates rasterized heatmap image tiles for an
     * area of interest using the given tables and the provided parameters.
     *
     * All color values must be in the format RRGGBB or AARRGGBB (to specify
     * the alpha value).
     *
     * The heatmap image is contained in the `image_data` field.
     *
     * @param table_names Name of the table containing the data for the various layers to be rendered.
     * @param x_column_name Name of the column containing the x coordinates.
     * @param y_column_name Name of the column containing the y coordinates.
     * @param value_column_name
     * @param geometry_column_name Name of the column containing geometry data.
     * @param min_x Lower bound for the x values.
     * @param max_x Upper bound for the x values.
     * @param min_y Lower bound for the y values.
     * @param max_y Upper bound for the y values.
     * @param width Width of the generated image.
     * @param height Height of the generated image.
     * @param projection Spatial Reference System (i.e. EPSG Code).
     * @param style_options Various style related options.
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageHeatmapResponse> - Promise resolving to the response
     */
    visualize_image_heatmap(table_names, x_column_name, y_column_name, value_column_name, geometry_column_name, min_x, max_x, min_y, max_y, width, height, projection, style_options, options, callback) {
      const actualRequest = {
        table_names,
        x_column_name,
        y_column_name,
        value_column_name,
        geometry_column_name,
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        projection: projection ?? "PLATE_CARREE",
        style_options,
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/heatmap", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates a rasterized image tile containing
     * text labels defined by data contained in the given table, suitable for
     * overlaying onto a feature image tile covering the same area (for example
     * one generated using `visualize_image`).
     *
     * All color values must be integers encoded in the format AARRGGBB when
     * represented in hexadecimal.
     *
     * Fonts are specified as strings of the form 'FAMILY STYLE-OPTIONS SIZE',
     * where FAMILY is the font family, STYLE-OPTIONS is a whitespace separated
     * list of words defining style, variant, weight, stretch, or gravity, and
     * SIZE is a decimal number (size in points) or optionally followed by the
     * unit modifier 'px' for absolute size. All three sub-fields are optional;
     * default values will be used for omitted sub-fields. (For example,
     * 'Helvetica Bold Italic 10' specifies Helvetica, Bold and Italic, 10
     * points.) A substitute font will be used if a requested font is not
     * installed.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageLabelsResponse> - Promise resolving to the response
     */
    visualize_image_labels_request(request, callback) {
      const actualRequest = {
        table_name: request.table_name,
        x_column_name: request.x_column_name,
        y_column_name: request.y_column_name,
        x_offset: request.x_offset ?? "",
        y_offset: request.y_offset ?? "",
        text_string: request.text_string,
        font: request.font ?? "",
        text_color: request.text_color ?? "",
        text_angle: request.text_angle ?? "",
        text_scale: request.text_scale ?? "",
        draw_box: request.draw_box ?? "",
        draw_leader: request.draw_leader ?? "",
        line_width: request.line_width ?? "",
        line_color: request.line_color ?? "",
        fill_color: request.fill_color ?? "",
        leader_x_column_name: request.leader_x_column_name ?? "",
        leader_y_column_name: request.leader_y_column_name ?? "",
        filter: request.filter ?? "",
        min_x: request.min_x,
        max_x: request.max_x,
        min_y: request.min_y,
        max_y: request.max_y,
        width: request.width,
        height: request.height,
        projection: request.projection ?? "PLATE_CARREE",
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/labels", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * For internal use only.  Generates a rasterized image tile containing
     * text labels defined by data contained in the given table, suitable for
     * overlaying onto a feature image tile covering the same area (for example
     * one generated using `visualize_image`).
     *
     * All color values must be integers encoded in the format AARRGGBB when
     * represented in hexadecimal.
     *
     * Fonts are specified as strings of the form 'FAMILY STYLE-OPTIONS SIZE',
     * where FAMILY is the font family, STYLE-OPTIONS is a whitespace separated
     * list of words defining style, variant, weight, stretch, or gravity, and
     * SIZE is a decimal number (size in points) or optionally followed by the
     * unit modifier 'px' for absolute size. All three sub-fields are optional;
     * default values will be used for omitted sub-fields. (For example,
     * 'Helvetica Bold Italic 10' specifies Helvetica, Bold and Italic, 10
     * points.) A substitute font will be used if a requested font is not
     * installed.
     *
     * @param table_name Name of the table containing the data defining the labels to render.
     * @param x_column_name Double, float or decimal expression that evaluates to the x coordinates of the center points of the labels.
     * @param y_column_name Double, float or decimal expression that evaluates to the y coordinates of the center points of the labels.
     * @param x_offset Numeric expression that evaluates to the number of output pixels by which the labels will be offset horizontally from their specified x coordinates. If blank, an offset of 0 will be used.
     * @param y_offset Numeric expression that evaluates to the number of output pixels by which the labels will be offset vertically from their specified y coordinates. If blank, an offset of 0 will be used.
     * @param text_string Expression that evaluates to the text for the labels.
     * @param font Expression that evaluates to the fonts for the labels. If blank, a default system font will be used.
     * @param text_color Numeric expression that evaluates to the text color for the labels. If blank, opaque black will be used.
     * @param text_angle Numeric expression that evaluates to the angle of clockwise rotation (in degrees) for the labels. If blank, an angle of 0 will be used.
     * @param text_scale Numeric expression that evaluates to the scaling factor for the labels. (1 is normal size, 0.5 is half size, 2 is double size, etc.) If blank, a scaling factor of 1 will be used.
     * @param draw_box Boolean expression indicating whether boxes will be drawn around the labels. If blank, no boxes will be drawn.
     * @param draw_leader Boolean expression indicating whether leader lines will be drawn from the labels to points specified using `leader_x_column_name` and `leader_y_column_name`. If blank, no leader lines will be drawn.
     * @param line_width Numeric expression that evaluates to the line width in output pixels for the labels' boxes and leader lines. If blank, a line width of 1 will be used.
     * @param line_color Numeric expression that evaluates to the line color for the labels' boxes and leader lines. If blank, opaque black will be used.
     * @param fill_color Numeric expression that evaluates to the fill color for the labels' boxes. If blank, the boxes will not be filled.
     * @param leader_x_column_name Double, float or decimal expression that evaluates to the x coordinates of the points to which the labels' leader lines will be drawn. May be left blank if no leader lines are to be drawn.
     * @param leader_y_column_name Double, float or decimal expression that evaluates to the y coordinates of the points to which the labels' leader lines will be drawn. May be left blank if no leader lines are to be drawn.
     * @param filter Boolean expression indicating which labels to include in the image. If blank, all labels will be included.
     * @param min_x Lower bound for the x coordinates of labels to include in the image.
     * @param max_x Upper bound for the x coordinates of labels to include in the image.
     * @param min_y Lower bound for the y coordinates of labels to include in the image.
     * @param max_y Upper bound for the y coordinates of labels to include in the image.
     * @param width Width of the generated image.
     * @param height Height of the generated image.
     * @param projection Spatial Reference System (i.e. EPSG Code).
     * @param options Optional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeImageLabelsResponse> - Promise resolving to the response
     */
    visualize_image_labels(table_name, x_column_name, y_column_name, x_offset, y_offset, text_string, font, text_color, text_angle, text_scale, draw_box, draw_leader, line_width, line_color, fill_color, leader_x_column_name, leader_y_column_name, filter, min_x, max_x, min_y, max_y, width, height, projection, options, callback) {
      const actualRequest = {
        table_name,
        x_column_name,
        y_column_name,
        x_offset: x_offset ?? "",
        y_offset: y_offset ?? "",
        text_string,
        font: font ?? "",
        text_color: text_color ?? "",
        text_angle: text_angle ?? "",
        text_scale: text_scale ?? "",
        draw_box: draw_box ?? "",
        draw_leader: draw_leader ?? "",
        line_width: line_width ?? "",
        line_color: line_color ?? "",
        fill_color: fill_color ?? "",
        leader_x_column_name: leader_x_column_name ?? "",
        leader_y_column_name: leader_y_column_name ?? "",
        filter: filter ?? "",
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        projection: projection ?? "PLATE_CARREE",
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/image/labels", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Generate an image containing isolines for travel results using an
     * existing graph. Isolines represent curves of equal cost, with cost
     * typically referring to the time or distance assigned as the weights of
     * the underlying graph. See Graphs and Solvers for more information on
     * graphs.
     *
     * @param request Request object containing the parameters for the operation
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeIsochroneResponse> - Promise resolving to the response
     */
    visualize_isochrone_request(request, callback) {
      const actualRequest = {
        graph_name: request.graph_name,
        source_node: request.source_node,
        max_solution_radius: request.max_solution_radius ?? -1,
        weights_on_edges: request.weights_on_edges ?? [],
        restrictions: request.restrictions ?? [],
        num_levels: request.num_levels ?? 1,
        generate_image: request.generate_image ?? true,
        levels_table: request.levels_table ?? "",
        style_options: request.style_options,
        solve_options: request.solve_options ?? {},
        contour_options: request.contour_options ?? {},
        options: request.options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/isochrone", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Generate an image containing isolines for travel results using an
     * existing graph. Isolines represent curves of equal cost, with cost
     * typically referring to the time or distance assigned as the weights of
     * the underlying graph. See Graphs and Solvers for more information on
     * graphs.
     *
     * @param graph_name Name of the graph on which the isochrone is to be computed.
     * @param source_node Starting vertex on the underlying graph from/to which the isochrones are created.
     * @param max_solution_radius Extent of the search radius around `source_node`. Set to '-1.0' for unrestricted search radius.
     * @param weights_on_edges Additional weights to apply to the edges of an existing graph. Weights must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS WEIGHTS_EDGE_ID', or expressions, e.g., 'ST_LENGTH(wkt) AS WEIGHTS_VALUESPECIFIED'. Any provided weights will be added (in the case of 'WEIGHTS_VALUESPECIFIED') to or multiplied with (in the case of 'WEIGHTS_FACTORSPECIFIED') the existing weight(s).
     * @param restrictions Additional restrictions to apply to the nodes/edges of an existing graph. Restrictions must be specified using identifiers; identifiers are grouped as combinations. Identifiers can be used with existing column names, e.g., 'table.column AS RESTRICTIONS_EDGE_ID', or expressions, e.g., 'column/2 AS RESTRICTIONS_VALUECOMPARED'. If remove_previous_restrictions is set to true, any provided restrictions will replace the existing restrictions. If remove_previous_restrictions is set to false, any provided restrictions will be added (in the case of 'RESTRICTIONS_VALUECOMPARED') to or replaced (in the case of 'RESTRICTIONS_ONOFFCOMPARED').
     * @param num_levels Number of equally-separated isochrones to compute.
     * @param generate_image If set to true, generates a PNG image of the isochrones in the response.
     * @param levels_table Name of the table to output the isochrones to, in [schema_name.]table_name format, using standard name resolution rules and meeting table naming criteria.  The table will contain levels and their corresponding WKT geometry. If no value is provided, the table is not generated.
     * @param style_options Various style related options of the isochrone image.
     * @param solve_options Solver specific parameters.
     * @param contour_options Contour specific parameters.
     * @param options Additional parameters.
     * @param callback Optional callback function
     * @returns Promise<Types.VisualizeIsochroneResponse> - Promise resolving to the response
     */
    visualize_isochrone(graph_name, source_node, max_solution_radius, weights_on_edges, restrictions, num_levels, generate_image, levels_table, style_options, solve_options, contour_options, options, callback) {
      const actualRequest = {
        graph_name,
        source_node,
        max_solution_radius: max_solution_radius ?? -1,
        weights_on_edges: weights_on_edges ?? [],
        restrictions: restrictions ?? [],
        num_levels: num_levels ?? 1,
        generate_image: generate_image ?? true,
        levels_table: levels_table ?? "",
        style_options,
        solve_options: solve_options ?? {},
        contour_options: contour_options ?? {},
        options: options ?? {}
      };
      const dispatched = this.submitRequest("/visualize/isochrone", actualRequest, callback !== void 0);
      this.notify(dispatched, callback);
      return dispatched;
    }
    /**
     * Retrieves records from a table as a GeoJSON FeatureCollection.
     *
     * A convenience wrapper over `/get/records` with `encoding` forced to
     * `geojson`, unwrapping the single encoded document the server returns.
     *
     * @param table_name - Table to read from
     * @param offset - Record offset; defaults to 0
     * @param limit - Maximum records to return; defaults to 10000
     * @param options - Optional parameters for `/get/records`
     * @param callback - Optional callback function
     * @returns Promise resolving to the GeoJSON FeatureCollection
     *
     * @example
     * ```typescript
     * const geo = await gpudb.get_geo_json('shapes', 0, 100, {});
     * geo.type;        // 'FeatureCollection'
     * geo.features;    // [...]
     * ```
     */
    async get_geo_json(table_name, offset, limit, options, callback) {
      if (callback) {
        try {
          const result = await this.get_geo_json(table_name, offset, limit, options);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      const actualRequest = {
        table_name,
        offset: offset ?? 0,
        limit: limit ?? 1e4,
        encoding: "geojson",
        options: options ?? {}
      };
      const response = await this.submitRequest("/get/records", actualRequest);
      const decoded = this.decode(response.records_json);
      return Array.isArray(decoded) ? decoded[0] : decoded;
    }
    /**
     * Inserts records supplied as JSON, via `/insert/records/json`.
     *
     * Accepts a single record, an array of records, or a JSON string holding
     * either. The endpoint takes its parameters in the query string rather
     * than the request body, which carries the records themselves.
     *
     * @param records - A record, an array of records, or a JSON string
     * @param table_name - Table to insert into; created if the options say so
     * @param create_table_options - `create_table_options` for the endpoint
     * @param options - `options` for the endpoint
     * @param callback - Optional callback function
     * @returns Promise resolving to the insertion counts
     *
     * @example
     * ```typescript
     * await gpudb.insert_records_from_json(
     *     [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
     *     'my_table',
     *     { type_inference_mode: 'speed' },
     *     {}
     * );
     * ```
     */
    async insert_records_from_json(records, table_name, create_table_options, options, callback) {
      if (callback) {
        try {
          const result = await this.insert_records_from_json(records, table_name, create_table_options, options);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      if (records === void 0 || records === null) {
        throw new Error("Records cannot be undefined or null");
      }
      if (!table_name) {
        throw new Error("'table_name' cannot be undefined or null");
      }
      let jsonRecords = records;
      if (typeof jsonRecords === "string") {
        try {
          jsonRecords = JSON.parse(jsonRecords);
        } catch (err) {
          const detail = err instanceof SyntaxError ? `Syntax error : ${err.message}` : `Error : ${err}`;
          throw new Error(detail);
        }
      }
      const params = {
        ...options ?? {},
        ...create_table_options ?? {},
        table_name
      };
      const queryString = Object.keys(params).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join("&");
      return this.submitRequest(`/insert/records/json?${queryString}`, jsonRecords);
    }
    /**
     * Retrieves records as JSON, via `/get/records/json`.
     *
     * Only `table_name` is required; every other parameter is optional. Like
     * `insert_records_from_json`, this endpoint takes its parameters in the
     * query string and is sent with an empty body.
     *
     * @param table_name - Table to read from
     * @param column_names - Columns to return; all columns if omitted
     * @param offset - Record offset; negative values are treated as 0
     * @param limit - Maximum records; negative values mean END_OF_SET
     * @param expression - Optional filter expression
     * @param orderby_columns - Optional ordering columns
     * @param having_clause - Optional HAVING clause
     * @param callback - Optional callback function
     * @returns Promise resolving to the matching records
     *
     * @example
     * ```typescript
     * const response = await gpudb.get_records_json(
     *     'my_table', ['id', 'name'], 0, 100, 'value > 10', ['id'], '');
     * response.records;                  // [{ id: 3, name: 'Charlie' }, ...]
     * response.total_number_of_records;  // matches ignoring the limit
     * ```
     */
    async get_records_json(table_name, column_names, offset, limit, expression, orderby_columns, having_clause, callback) {
      if (callback) {
        try {
          const result = await this.get_records_json(table_name, column_names, offset, limit, expression, orderby_columns, having_clause);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      if (!table_name) {
        throw new Error(`Table name ${table_name} is null or empty`);
      }
      if (column_names !== void 0 && column_names !== null && !Array.isArray(column_names)) {
        throw new Error(`column_names ${column_names} must be an array of string or null`);
      }
      if (orderby_columns !== void 0 && orderby_columns !== null && !Array.isArray(orderby_columns)) {
        throw new Error(`orderby_columns ${orderby_columns} must be an array of string or null`);
      }
      if (expression !== void 0 && expression !== null && typeof expression !== "string") {
        throw new Error(`expression ${expression} must be a string`);
      }
      if (having_clause !== void 0 && having_clause !== null && typeof having_clause !== "string") {
        throw new Error(`having_clause ${having_clause} must be a string`);
      }
      const params = { table_name };
      if (column_names && column_names.length > 0) {
        params.column_names = column_names.join(",");
      }
      params.offset = offset === void 0 || offset === null || offset < 0 ? 0 : offset;
      params.limit = limit === void 0 || limit === null || limit < 0 ? END_OF_SET : limit;
      if (expression) {
        params.expression = expression;
      }
      if (orderby_columns && orderby_columns.length > 0) {
        params.order_by = orderby_columns.join(",");
      }
      if (having_clause) {
        params.having = having_clause;
      }
      const queryString = Object.keys(params).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join("&");
      return this.submitRequest(`/get/records/json?${queryString}`, null);
    }
    /**
     * Iterates the results of an SQL statement, fetching in batches.
     *
     * Pages through the result set so arbitrarily large queries can be
     * consumed without holding everything in memory at once, cleaning up any
     * server-side paging tables when iteration finishes -- including when the
     * caller breaks out of the loop early.
     *
     * Records are yielded as objects keyed by column name. This differs from
     * the JavaScript API, which yields positional arrays; use
     * `Object.values(record)` if you need those.
     *
     * @param sql - The SQL statement to execute
     * @param batchSize - Records to fetch per batch; defaults to 10000
     * @param sqlOptions - Options passed through to `/execute/sql`
     *
     * @example
     * ```typescript
     * for await (const row of gpudb.SqlIterator('SELECT * FROM big_table')) {
     *     console.log(row.id, row.name);
     * }
     * ```
     */
    async *SqlIterator(sql, batchSize = 1e4, sqlOptions = {}) {
      const records = [];
      const pagingTableNames = [];
      let offset = 0;
      let position = 0;
      let totalNumberOfRecords = 0;
      const fetchBatch = /* @__PURE__ */ __name(async () => {
        const response = await this.execute_sql(sql, offset, batchSize, "", [], sqlOptions);
        if (totalNumberOfRecords === 0 && response.total_number_of_records !== 0) {
          totalNumberOfRecords = response.total_number_of_records;
        }
        const data = response.data;
        const headers = data?.column_headers ?? [];
        const columns = headers.map((_, index) => data?.[`column_${index + 1}`] ?? []);
        const rowCount = columns.length > 0 ? columns[0].length : 0;
        for (let row = 0; row < rowCount; row++) {
          const record = {};
          headers.forEach((header, column) => {
            record[header] = columns[column][row];
          });
          records.push(record);
        }
        if (response.paging_table && response.paging_table.length > 0) {
          pagingTableNames.push(response.paging_table);
        }
        offset += rowCount;
        if (rowCount === 0) {
          totalNumberOfRecords = records.length;
        }
      }, "fetchBatch");
      try {
        await fetchBatch();
        while (position < totalNumberOfRecords) {
          if (position >= records.length) {
            await fetchBatch();
          }
          yield records[position++];
        }
      } finally {
        for (const pagingTable of pagingTableNames) {
          try {
            await this.clear_table(pagingTable, "", { no_error_if_not_exists: "true" });
          } catch {
          }
        }
      }
    }
  };
  GPUdb.VERSION = "7.2.3.3";
  GPUdb.END_OF_SET = END_OF_SET;
  GPUdb.encode = encode;
  GPUdb.decode = decode;
  GPUdb.decode_regular = decodeRegular;
  GPUdb.decode_no_inf_nan = decodeNoInfNan;
  GPUdb.api_version = "7.2.3.3";
  GPUdb.Type = Type;
  GPUdb.RingList = RingList;
  GPUdb.HA_FAILOVER_ORDER = Object.freeze({
    SEQUENTIAL: "sequential",
    RANDOM: "random"
  });
  GPUdb.ENCODING = Object.freeze({
    JSON: "json",
    BINARY: "binary"
  });
  GPUdb.FAILOVER_TRIGGER_MESSAGES = Object.freeze([
    "System shutting down",
    "Unavailable: Draining HA queue",
    "Kinetica is exiting",
    "Connection refused",
    "Connection reset",
    "system-limited-fatal",
    "Kinetica is offline",
    "Query planner is not running"
  ]);
  GPUdb.DEFAULT_JOB_ENDPOINTS = ["/alter/table", "/alter/table/columns"];
  GPUdb.JOB_POLL_INTERVAL = 5e3;
  GPUdb.AVRO_HEADERS = Object.freeze({
    "Accept": AVRO_CONTENT_TYPE,
    "Content-Type": AVRO_CONTENT_TYPE
  });
  var FileHandler = class _FileHandler {
    static {
      __name(this, "FileHandler");
    }
    /**
     * Creates a FileHandler.
     *
     * @param gpuDB - Client providing access to the server
     */
    constructor(gpuDB) {
      this.chunkSize = 60 * 1024 * 1024;
      if (!gpuDB || !(gpuDB instanceof GPUdb)) {
        throw new Error("Invalid GPUdb reference specified");
      }
      this.gpuDB = gpuDB;
    }
    /**
     * Returns the last segment of a path.
     *
     * @param full_path - Path to take the name from
     * @param sep - Separator to split on
     */
    static extract_filename(full_path, sep = "/") {
      const parts = full_path.split(sep);
      return parts[parts.length - 1];
    }
    /**
     * Normalises a KIFS directory so it starts and ends with a slash.
     *
     * @param destination - Directory path, possibly missing its slashes
     */
    parse_dir_destination(destination) {
      if (typeof destination !== "string" || destination.length === 0) {
        return "/";
      }
      let result = destination;
      if (result.indexOf("/") !== 0) {
        result = `/${result}`;
      }
      if (result.lastIndexOf("/") !== result.length - 1) {
        result += "/";
      }
      return result;
    }
    /**
     * Coerces a flag to the string form the server expects.
     *
     * @param value - Boolean or string flag
     * @param default_value - Returned when the value is absent or unusable
     */
    parse_flag_to_str(value, default_value) {
      if (value === void 0 || value === null) {
        return default_value;
      }
      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }
      if (typeof value === "string") {
        return value;
      }
      return default_value;
    }
    /**
     * Builds the options for a KIFS call, forcing the encoding this handler
     * transfers in. Caller options are preserved, unlike the JavaScript API,
     * which discards them.
     *
     * @param incoming_options - Options supplied by the caller
     * @param endpoint - 'upload' or 'download'
     */
    parse_options(incoming_options, endpoint) {
      const options = { ...incoming_options ?? {} };
      if (endpoint === "upload" || endpoint === "download") {
        options.file_encoding = options.file_encoding ?? "base64";
      }
      return options;
    }
    /**
     * Uploads files to KIFS.
     *
     * Accepts local paths (Node.js only) or Blob/File objects (any
     * environment), singly or as an array. Unlike the JavaScript API, file
     * contents are read as binary rather than UTF-8, so images, archives and
     * other non-text files survive the round trip.
     *
     * Anything larger than {@link chunkSize} is sent through
     * {@link upload_multipart} rather than in a single request, so a big file
     * does not have to be held in one payload -- the same threshold the
     * JavaScript API applied. Everything smaller goes in one batched call.
     *
     * `progress_callback` reports the chunked portion of the work only, as a
     * percentage from 0 to 100. When several files need chunking the
     * percentage spans the whole set rather than restarting per file, so it
     * rises monotonically to 100.
     *
     * @param files - Local paths, or Blob/File objects
     * @param destination - KIFS directory; defaults to the root
     * @param options - Options for `/upload/files`
     * @param progress_callback - Percent complete; chunked uploads only
     * @param callback - Optional callback function
     * @returns Promise resolving to true when every file was accepted
     *
     * @example
     * ```typescript
     * await files.upload(['/local/a.csv', '/local/b.csv'], '/kifs_dir/');
     * await files.upload(inputElement.files[0], '/kifs_dir/');   // browser
     *
     * // A file over chunkSize is chunked automatically
     * await files.upload(bigFile, '/kifs_dir/', {},
     *     percent => console.log(`${percent.toFixed(1)}%`));
     * ```
     */
    async upload(files, destination, options, progress_callback, callback) {
      if (callback) {
        try {
          const result = await this.upload(files, destination, options, progress_callback);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      const fileList = Array.isArray(files) ? files : [files];
      if (fileList.length === 0) {
        throw new Error("'files' argument is an empty Array that cannot be uploaded.");
      }
      const uploadOptions = this.parse_options(options, "upload");
      const destPath = this.parse_dir_destination(destination);
      const batched = [];
      const chunked = [];
      for (const file of fileList) {
        const size = await _FileHandler.sizeOf(file);
        if (size > this.chunkSize) {
          chunked.push({ file, size });
        } else {
          batched.push(file);
        }
      }
      let accepted = true;
      if (batched.length > 0) {
        const fileNames = [];
        const fileData = [];
        for (const file of batched) {
          if (typeof file === "string") {
            fileNames.push(destPath + _FileHandler.extract_filename(file, "/"));
            fileData.push(await _FileHandler.readLocalFileAsBase64(file));
          } else {
            const name = file.name ?? "file";
            fileNames.push(destPath + _FileHandler.extract_filename(String(name), "/"));
            const bytes = new Uint8Array(await file.arrayBuffer());
            fileData.push(_FileHandler.bytesToBase64(bytes));
          }
        }
        const response = await this.gpuDB.upload_files(fileNames, fileData, uploadOptions);
        accepted = response.info !== void 0 && response.info !== null;
      }
      const chunkedBytes = chunked.reduce((total, entry) => total + entry.size, 0);
      let sentBytes = 0;
      for (const { file, size } of chunked) {
        const alreadySent = sentBytes;
        await this.upload_multipart(file, destPath, this.chunkSize, uploadOptions, progress_callback === void 0 ? void 0 : (percent) => {
          progress_callback((alreadySent + percent / 100 * size) / chunkedBytes * 100);
        });
        sentBytes += size;
      }
      return accepted;
    }
    /**
     * Uploads one large file to KIFS in chunks.
     *
     * Initiates a multipart upload, sends each chunk in order, then completes
     * it. If any chunk fails the upload is cancelled server-side before the
     * error is rethrown, so no partial upload is left behind.
     *
     * @param file - Blob/File to upload, or a local path under Node.js
     * @param destination - KIFS directory; defaults to the root
     * @param chunk_size - Bytes per chunk; defaults to 8 MB
     * @param options - Options for `/upload/files`
     * @param progress_callback - Called with percent complete after each chunk
     * @param callback - Optional callback function
     * @returns Promise resolving to the multipart upload's UUID
     *
     * @example
     * ```typescript
     * await files.upload_multipart(bigFile, '/kifs_dir/', 8 * 1024 * 1024, {},
     *     percent => console.log(`${percent.toFixed(1)}%`));
     * ```
     */
    async upload_multipart(file, destination, chunk_size = 8 * 1024 * 1024, options, progress_callback, callback) {
      if (callback) {
        try {
          const result = await this.upload_multipart(file, destination, chunk_size, options, progress_callback);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      if (!chunk_size || chunk_size <= 0) {
        throw new Error("chunk_size must be a positive number of bytes");
      }
      const destPath = this.parse_dir_destination(destination);
      const uploadOptions = this.parse_options(options, "upload");
      let bytes;
      let baseName;
      if (typeof file === "string") {
        bytes = await _FileHandler.readLocalFileAsBytes(file);
        baseName = _FileHandler.extract_filename(file, "/");
      } else {
        bytes = new Uint8Array(await file.arrayBuffer());
        baseName = _FileHandler.extract_filename(String(file.name ?? "file"), "/");
      }
      const fileName = destPath + baseName;
      const uuid = _FileHandler.createUploadId();
      const numChunks = Math.max(1, Math.ceil(bytes.length / chunk_size));
      await this.gpuDB.upload_files([fileName], [], {
        ...uploadOptions,
        multipart_upload_uuid: uuid,
        multipart_operation: "init"
      });
      try {
        for (let index = 0; index < numChunks; index++) {
          const start = index * chunk_size;
          const chunk = bytes.subarray(start, Math.min(start + chunk_size, bytes.length));
          await this.gpuDB.upload_files([fileName], [_FileHandler.bytesToBase64(chunk)], {
            ...uploadOptions,
            multipart_upload_uuid: uuid,
            multipart_upload_part_number: String(index + 1),
            multipart_operation: "upload_part"
          });
          if (progress_callback) {
            progress_callback((index + 1) / numChunks * 100);
          }
        }
      } catch (err) {
        try {
          await this.gpuDB.upload_files([fileName], [], {
            ...uploadOptions,
            multipart_upload_uuid: uuid,
            multipart_operation: "cancel"
          });
        } catch {
        }
        throw err;
      }
      await this.gpuDB.upload_files([fileName], [], {
        ...uploadOptions,
        multipart_upload_uuid: uuid,
        multipart_operation: "complete"
      });
      return uuid;
    }
    /**
     * Downloads files from KIFS and returns their base64-encoded contents.
     *
     * @param filenames - KIFS path, or an array of paths
     * @param options - Options for `/download/files`
     * @param callback - Optional callback function
     * @returns Promise resolving to the base64 contents, in request order
     *
     * @example
     * ```typescript
     * const [encoded] = await files.download('/kifs_dir/data.csv');
     * const text = atob(encoded);
     * ```
     */
    async download(filenames, options, callback) {
      if (callback) {
        try {
          const result = await this.download(filenames, options);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      const fileNames = _FileHandler.normaliseFilenames(filenames);
      const response = await this.gpuDB.download_files(fileNames, [], [], this.parse_options(options, "download"));
      return response.file_data;
    }
    /**
     * Downloads files from KIFS and writes them to a local directory.
     *
     * Node.js only -- a browser cannot write to the filesystem. The directory
     * is created if it does not exist.
     *
     * @param filenames - KIFS path, or an array of paths
     * @param destination - Local directory to write into
     * @param options - Options for `/download/files`
     * @param callback - Optional callback function
     * @returns Promise resolving to the paths written
     *
     * @example
     * ```typescript
     * const written = await files.download_and_save(
     *     ['/kifs_dir/a.csv', '/kifs_dir/b.csv'], '/local/dir');
     * ```
     */
    async download_and_save(filenames, destination, options, callback) {
      if (callback) {
        try {
          const result = await this.download_and_save(filenames, destination, options);
          callback(null, result);
          return result;
        } catch (err) {
          callback(err, null);
          throw err;
        }
      }
      const fs = await _FileHandler.requireFs("download_and_save");
      const path = await Promise.resolve().then(() => __toESM(require_path()));
      const fileNames = _FileHandler.normaliseFilenames(filenames);
      const response = await this.gpuDB.download_files(fileNames, [], [], this.parse_options(options, "download"));
      if (!Array.isArray(response.file_names) || !Array.isArray(response.file_data) || response.file_names.length !== response.file_data.length) {
        throw new Error("Server returned mismatched file names and file data");
      }
      const destDir = destination && destination.length > 0 ? destination : ".";
      await fs.promises.mkdir(destDir, { recursive: true });
      const written = [];
      for (let i = 0; i < response.file_names.length; i++) {
        const name = _FileHandler.extract_filename(response.file_names[i], "/");
        const target = path.join(destDir, name);
        await fs.promises.writeFile(target, Buffer.from(response.file_data[i], "base64"));
        written.push(target);
      }
      return written;
    }
    /**
     * Size in bytes of one upload candidate, rejecting anything that is
     * neither a local path nor a Blob. Sizing a local path costs a stat rather
     * than a read, so deciding whether to chunk does not pull the file into
     * memory first.
     */
    static async sizeOf(file) {
      if (typeof file === "string") {
        const fs = await _FileHandler.requireFs("upload");
        return (await fs.promises.stat(file)).size;
      }
      if (file && typeof file.arrayBuffer === "function") {
        return file.size;
      }
      throw new Error("One of 'files' argument values was provided in a bad format. Only Blob/File objects or string filepaths are allowed as 'files' value.");
    }
    /** Accepts a single path or an array, rejecting anything else. */
    static normaliseFilenames(filenames) {
      if (typeof filenames === "string" && filenames.length > 0) {
        return [filenames];
      }
      if (Array.isArray(filenames) && filenames.length > 0 && filenames.every((name) => typeof name === "string")) {
        return filenames;
      }
      throw new Error("One of the 'files' arguments is not a string filepath and is unsafe to process. Wrong input format is provided.");
    }
    /** Loads Node's fs, with a clear message when it is not usable. */
    static async requireFs(method) {
      const unavailable = /* @__PURE__ */ __name(() => new Error(`FileHandler.${method}() needs the local filesystem and is available under Node.js only. In a browser, use download() and save the returned data yourself.`), "unavailable");
      if (typeof process === "undefined" || !process.versions?.node) {
        throw unavailable();
      }
      const fs = await Promise.resolve().then(() => __toESM(require_fs()));
      if (!fs || !fs.promises) {
        throw unavailable();
      }
      return fs;
    }
    /** Reads a local file as raw bytes. */
    static async readLocalFileAsBytes(filePath) {
      const fs = await _FileHandler.requireFs("upload");
      return new Uint8Array(await fs.promises.readFile(filePath));
    }
    /** Reads a local file and base64-encodes it. */
    static async readLocalFileAsBase64(filePath) {
      return _FileHandler.bytesToBase64(await _FileHandler.readLocalFileAsBytes(filePath));
    }
    /** Base64-encodes bytes in either environment. */
    static bytesToBase64(bytes) {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
      }
      let binary = "";
      const chunkSize = 32768;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }
    /** Identifier for a multipart upload; unique per call. */
    static createUploadId() {
      const cryptoRef = globalThis.crypto;
      if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
        return cryptoRef.randomUUID();
      }
      const bytes = new Uint8Array(16);
      if (cryptoRef && typeof cryptoRef.getRandomValues === "function") {
        cryptoRef.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
      bytes[6] = bytes[6] & 15 | 64;
      bytes[8] = bytes[8] & 63 | 128;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  };
  GPUdb.FileHandler = FileHandler;

  // dist/browser/standalone.js
  setDefaultSync(true);
  return __toCommonJS(standalone_exports);
})();
globalThis.GPUdb=__kinetica.GPUdb
