/**
 * Avro binary encoding for the Kinetica API.
 *
 * A self-contained codec rather than a dependency: Kinetica's endpoint and
 * table schemas use only a small part of Avro, and writing it here keeps the
 * package free of runtime dependencies and identical across the Node.js,
 * browser and ESM builds.
 *
 * Covers the binary encoding of null, boolean, int, long, float, double,
 * bytes, string, record, enum, array, map, union and fixed. A logical type is
 * read and written as its underlying type. A named-type reference resolves to
 * a record, enum or fixed defined earlier in the same schema.
 *
 * Longs decode to a `number` when they fit in Number's safe-integer range and
 * to a `bigint` when they do not, so no value ever silently loses precision.
 * The encoder takes either.
 *
 * Floats and doubles also take the strings "Infinity", "-Infinity" and "NaN",
 * Kinetica's own JSON spelling of those values. They always decode to numbers.
 */

/** An Avro schema, in its JSON form. */
export type AvroSchema =
    | string
    | AvroSchema[]
    | {
        type: AvroSchema;
        name?: string;
        namespace?: string;
        fields?: Array<{ name: string; type: AvroSchema; [key: string]: any }>;
        items?: AvroSchema;
        values?: AvroSchema;
        symbols?: string[];
        size?: number;
        [key: string]: any;
    };

/**
 * Thrown when a value does not fit its schema, when binary data cannot be
 * decoded with the schema given, or when a schema itself is invalid.
 */
export class AvroError extends Error {
    /** Field names and array/map positions leading to the offending value */
    public readonly path: string[] = [];

    private readonly reason: string;

    constructor(reason: string) {
        super(reason);
        this.name = 'AvroError';
        this.reason = reason;
    }

    /** @internal Records one more level of the path, outermost last. */
    prependPath(segment: string): this {
        this.path.unshift(segment);
        this.message = `${this.reason} (at ${this.path.join('.')})`;
        return this;
    }
}

// ---------------------------------------------------------------------------
// Buffers
// ---------------------------------------------------------------------------

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

// Longs whose zigzag form stays below 2^53 are encoded with Number arithmetic;
// anything larger goes through BigInt
const FAST_LONG_LIMIT = 2 ** 52;
const MIN_SAFE_BIG = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_BIG = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_LONG = -(2n ** 63n);
const MAX_LONG = 2n ** 63n - 1n;
const MIN_INT = -(2 ** 31);
const MAX_INT = 2 ** 31 - 1;

class Writer {
    buf: Uint8Array;
    view: DataView;
    pos = 0;

    constructor(capacity: number) {
        this.buf = new Uint8Array(capacity);
        this.view = new DataView(this.buf.buffer);
    }

    ensure(count: number): void {
        const needed = this.pos + count;
        if (needed <= this.buf.length) {
            return;
        }
        const grown = new Uint8Array(Math.max(needed, this.buf.length * 2));
        grown.set(this.buf.subarray(0, this.pos));
        this.buf = grown;
        this.view = new DataView(grown.buffer);
    }

    writeByte(value: number): void {
        this.ensure(1);
        this.buf[this.pos++] = value;
    }

    writeBytes(bytes: Uint8Array): void {
        this.writeLong(bytes.length);
        this.ensure(bytes.length);
        this.buf.set(bytes, this.pos);
        this.pos += bytes.length;
    }

    writeInt(value: number): void {
        let zigzag = ((value << 1) ^ (value >> 31)) >>> 0;
        this.ensure(5);
        while (zigzag > 0x7f) {
            this.buf[this.pos++] = (zigzag & 0x7f) | 0x80;
            zigzag >>>= 7;
        }
        this.buf[this.pos++] = zigzag;
    }

    writeLong(value: number | bigint): void {
        this.ensure(10);
        if (typeof value === 'number' && value >= -FAST_LONG_LIMIT && value <= FAST_LONG_LIMIT) {
            let zigzag = value >= 0 ? value * 2 : -value * 2 - 1;
            while (zigzag > 0x7f) {
                this.buf[this.pos++] = (zigzag % 128) | 0x80;
                zigzag = Math.floor(zigzag / 128);
            }
            this.buf[this.pos++] = zigzag;
            return;
        }
        const big = BigInt(value);
        let zigzag = BigInt.asUintN(64, (big << 1n) ^ (big >> 63n));
        while (zigzag > 0x7fn) {
            this.buf[this.pos++] = Number(zigzag & 0x7fn) | 0x80;
            zigzag >>= 7n;
        }
        this.buf[this.pos++] = Number(zigzag);
    }

    writeString(value: string): void {
        // ASCII fast path: short ASCII strings, the bulk of column names and
        // option values, need no TextEncoder round trip
        const length = value.length;
        if (length < 0x40) {
            this.ensure(length + 1);
            const start = this.pos;
            this.buf[this.pos++] = length * 2;
            let i = 0;
            for (; i < length; i++) {
                const code = value.charCodeAt(i);
                if (code > 0x7f) {
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
}

// Floats are read by copying their bytes into a shared typed array, which
// beats allocating a DataView over every value decoded. Typed arrays use the
// host's byte order, so a big-endian host reads through a DataView instead.
const floatScratch = new Float64Array(1);
const float32Scratch = new Float32Array(floatScratch.buffer, 0, 1);
const floatBytes = new Uint8Array(floatScratch.buffer);
const LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Powers of ten exactly representable as doubles */
const POWERS_OF_TEN = Array.from({ length: 23 }, (_, i) => 10 ** i);

/** Smallest normal float; below it a float carries fewer digits */
const MIN_NORMAL_FLOAT = 2 ** -126;

/**
 * The shortest decimal that reads back as the same 32-bit float.
 *
 * A float widened to a double shows digits the float never had: 0.88444674
 * stored as a float reads back as 0.8844467401504517. Kinetica's JSON gives
 * the short form, so decoding to it keeps values the same under either
 * encoding. Both forms encode to the same float.
 *
 * Rounds with arithmetic rather than toPrecision, which costs several times
 * as much: an integer divided or multiplied by an exact power of ten is
 * correctly rounded, so each candidate is the double nearest its decimal.
 */
function shortestFloat(value: number): number {
    if (value === 0 || !Number.isFinite(value)) {
        return value;
    }
    // A normal float holds over seven significant digits, so rounding it to
    // fewer than six never lands on a different float than six would; a
    // subnormal holds fewer, so its search starts at one
    // Rounded as a magnitude, so a tie goes away from zero either side of it
    const magnitude = Math.abs(value);
    const first = magnitude < MIN_NORMAL_FLOAT ? 1 : 6;
    const exponent = Math.floor(Math.log10(magnitude));

    for (let digits = first; digits <= 9; digits++) {
        const shift = digits - 1 - exponent;
        let candidate: number;
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

class Reader {
    readonly buf: Uint8Array;
    pos = 0;

    constructor(buf: Uint8Array) {
        this.buf = buf;
    }

    readFloat(): number {
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

    readDouble(): number {
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

    need(count: number): void {
        if (this.pos + count > this.buf.length) {
            throw new AvroError(
                `Truncated Avro data: needed ${count} more byte(s) at offset ${this.pos}, `
                + `but only ${this.buf.length - this.pos} remain`
            );
        }
    }

    readByte(): number {
        this.need(1);
        return this.buf[this.pos++];
    }

    readInt(): number {
        let zigzag = 0;
        for (let shift = 0; shift < 35; shift += 7) {
            const byte = this.readByte();
            zigzag |= (byte & 0x7f) << shift;
            if (byte < 0x80) {
                return (zigzag >>> 1) ^ -(zigzag & 1);
            }
        }
        throw new AvroError('Invalid Avro int: varint runs past 5 bytes');
    }

    readLong(): number | bigint {
        const start = this.pos;

        // Up to 7 bytes carry at most 49 bits, exact in a double
        let zigzag = 0;
        let scale = 1;
        for (let i = 0; i < 7; i++) {
            const byte = this.readByte();
            zigzag += (byte & 0x7f) * scale;
            if (byte < 0x80) {
                return zigzag % 2 === 0 ? zigzag / 2 : -(zigzag + 1) / 2;
            }
            scale *= 128;
        }

        // Wider: redo it in BigInt, and hand back a number if it fits
        this.pos = start;
        let big = 0n;
        for (let shift = 0n; shift < 70n; shift += 7n) {
            const byte = this.readByte();
            big |= BigInt(byte & 0x7f) << shift;
            if (byte < 0x80) {
                big = BigInt.asUintN(64, big);
                const value = (big >> 1n) ^ -(big & 1n);
                return value >= MIN_SAFE_BIG && value <= MAX_SAFE_BIG ? Number(value) : value;
            }
        }
        throw new AvroError('Invalid Avro long: varint runs past 10 bytes');
    }

    /** A long used as a count or length, which must fit in a number */
    readSize(): number {
        const size = this.readLong();
        if (typeof size !== 'number') {
            throw new AvroError(`Invalid Avro data: length ${size} is out of range`);
        }
        return size;
    }

    readBytes(): Uint8Array {
        const length = this.readSize();
        if (length < 0) {
            throw new AvroError(`Invalid Avro data: negative length ${length}`);
        }
        this.need(length);
        // A copy, so a decoded value never pins the whole response buffer
        return this.buf.slice(this.pos, (this.pos += length));
    }

    readString(): string {
        const length = this.readSize();
        if (length < 0) {
            throw new AvroError(`Invalid Avro data: negative length ${length}`);
        }
        this.need(length);

        // Short ASCII strings are built directly: TextDecoder's fixed cost per
        // call outweighs the work for the short values most columns hold
        if (length < 0x40) {
            const buf = this.buf;
            const start = this.pos;
            let text = '';
            let i = start;
            for (const end = start + length; i < end; i++) {
                const byte = buf[i];
                if (byte > 0x7f) {
                    break;
                }
                text += String.fromCharCode(byte);
            }
            if (i === start + length) {
                this.pos = i;
                return text;
            }
        }

        const bytes = this.buf.subarray(this.pos, (this.pos += length));
        try {
            return textDecoder.decode(bytes);
        } catch {
            throw new AvroError('Invalid Avro string: not valid UTF-8');
        }
    }

    /**
     * Item count of the next array or map block. A negative count is followed
     * by the block's size in bytes, which a reader that decodes every item
     * has no use for.
     */
    readBlockCount(): number {
        const count = this.readSize();
        if (count < 0) {
            this.readSize();
            return -count;
        }
        return count;
    }
}

// ---------------------------------------------------------------------------
// Codecs
// ---------------------------------------------------------------------------

interface Codec {
    /** Short description, for error messages */
    readonly label: string;
    /** Whether the value belongs to this type; picks the branch of a union */
    accepts(value: any): boolean;
    write(writer: Writer, value: any): void;
    read(reader: Reader): any;
}

function describe(value: any): string {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value instanceof Uint8Array) {
        return 'Uint8Array';
    }
    return typeof value;
}

function mismatch(codec: Codec, value: any): AvroError {
    return new AvroError(`Expected ${codec.label}, got ${describe(value)}`);
}

function isInt(value: any): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= MIN_INT && value <= MAX_INT;
}

/**
 * The quoted forms Kinetica uses for non-finite floating-point values in
 * JSON. Accepted for float and double, so records written for the JSON
 * encoding encode unchanged.
 */
const NON_FINITE: Readonly<Record<string, number>> = Object.freeze({
    'Infinity': Infinity,
    '-Infinity': -Infinity,
    'NaN': NaN,
});

/** A float or double value as a number, or undefined if it is neither. */
function toFloating(value: any): number | undefined {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(NON_FINITE, value)) {
        return NON_FINITE[value];
    }
    return undefined;
}

function isLong(value: any): boolean {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value >= -(2 ** 63) && value < 2 ** 63;
    }
    return typeof value === 'bigint' && value >= MIN_LONG && value <= MAX_LONG;
}

function toBytes(value: any): Uint8Array | undefined {
    if (value instanceof Uint8Array) {
        return value;
    }
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    if (ArrayBuffer.isView(value)) {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return undefined;
}

function isPlainObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        && toBytes(value) === undefined;
}

/** Sets a key on a decoded object, including one named __proto__. */
function setKey(target: Record<string, any>, key: string, value: any): void {
    if (key === '__proto__') {
        Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
    } else {
        target[key] = value;
    }
}

const PRIMITIVES: Record<string, Codec> = {
    null: {
        label: 'null',
        accepts: value => value === null || value === undefined,
        write(_writer, value) {
            if (value !== null && value !== undefined) {
                throw mismatch(this, value);
            }
        },
        read: () => null,
    },
    boolean: {
        label: 'boolean',
        accepts: value => typeof value === 'boolean',
        write(writer, value) {
            if (typeof value !== 'boolean') {
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
        },
    },
    int: {
        label: 'int',
        accepts: isInt,
        write(writer, value) {
            if (!isInt(value)) {
                throw new AvroError(`Expected int (a 32-bit integer), got ${describe(value)} ${value}`);
            }
            writer.writeInt(value);
        },
        read: reader => reader.readInt(),
    },
    long: {
        label: 'long',
        accepts: isLong,
        write(writer, value) {
            if (!isLong(value)) {
                throw new AvroError(
                    `Expected long (a 64-bit integer, as number or bigint), got ${describe(value)} ${value}`
                );
            }
            writer.writeLong(value);
        },
        read: reader => reader.readLong(),
    },
    float: {
        label: 'float',
        accepts: value => toFloating(value) !== undefined,
        write(writer, value) {
            const number = toFloating(value);
            if (number === undefined) {
                throw mismatch(this, value);
            }
            writer.ensure(4);
            writer.view.setFloat32(writer.pos, number, true);
            writer.pos += 4;
        },
        read: reader => reader.readFloat(),
    },
    double: {
        label: 'double',
        accepts: value => toFloating(value) !== undefined,
        write(writer, value) {
            const number = toFloating(value);
            if (number === undefined) {
                throw mismatch(this, value);
            }
            writer.ensure(8);
            writer.view.setFloat64(writer.pos, number, true);
            writer.pos += 8;
        },
        read: reader => reader.readDouble(),
    },
    bytes: {
        label: 'bytes',
        accepts: value => toBytes(value) !== undefined,
        write(writer, value) {
            const bytes = toBytes(value);
            if (bytes === undefined) {
                throw new AvroError(`Expected bytes (a Uint8Array or ArrayBuffer), got ${describe(value)}`);
            }
            writer.writeBytes(bytes);
        },
        read: reader => reader.readBytes(),
    },
    string: {
        label: 'string',
        accepts: value => typeof value === 'string',
        write(writer, value) {
            if (typeof value !== 'string') {
                throw mismatch(this, value);
            }
            writer.writeString(value);
        },
        read: reader => reader.readString(),
    },
};

class ArrayCodec implements Codec {
    readonly label = 'array';

    constructor(private readonly items: Codec) {}

    accepts(value: any): boolean {
        return Array.isArray(value);
    }

    write(writer: Writer, value: any): void {
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

    read(reader: Reader): any[] {
        const result: any[] = [];
        for (let count = reader.readBlockCount(); count > 0; count = reader.readBlockCount()) {
            for (let i = 0; i < count; i++) {
                result.push(this.items.read(reader));
            }
        }
        return result;
    }
}

class MapCodec implements Codec {
    readonly label = 'map';

    constructor(private readonly values: Codec) {}

    accepts(value: any): boolean {
        return value instanceof Map || isPlainObject(value);
    }

    write(writer: Writer, value: any): void {
        if (!this.accepts(value)) {
            throw mismatch(this, value);
        }
        // Entries whose value is undefined are left out, as JSON.stringify
        // leaves them out of the JSON encoding
        const entries = (value instanceof Map ? [...value.entries()] : Object.entries(value))
            .filter(([, item]) => item !== undefined);
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

    read(reader: Reader): Record<string, any> {
        const result: Record<string, any> = {};
        for (let count = reader.readBlockCount(); count > 0; count = reader.readBlockCount()) {
            for (let i = 0; i < count; i++) {
                const key = reader.readString();
                setKey(result, key, this.values.read(reader));
            }
        }
        return result;
    }
}

class UnionCodec implements Codec {
    readonly label: string;
    private readonly nullIndex: number;

    constructor(private readonly branches: Codec[]) {
        this.label = `union [${branches.map(branch => branch.label).join(', ')}]`;
        this.nullIndex = branches.indexOf(PRIMITIVES.null);
    }

    accepts(value: any): boolean {
        return this.branches.some(branch => branch.accepts(value));
    }

    write(writer: Writer, value: any): void {
        // A missing value is written as null, when the union allows one
        let index = (value === null || value === undefined) ? this.nullIndex : -1;
        if (index < 0) {
            index = this.branches.findIndex(branch => branch.accepts(value));
        }
        if (index < 0) {
            throw mismatch(this, value);
        }
        writer.writeLong(index);
        this.branches[index].write(writer, value);
    }

    read(reader: Reader): any {
        const index = reader.readLong();
        if (typeof index !== 'number' || index < 0 || index >= this.branches.length) {
            throw new AvroError(`Invalid Avro union: branch ${index} of ${this.branches.length}`);
        }
        return this.branches[index].read(reader);
    }
}

class RecordCodec implements Codec {
    readonly label: string;
    /** Filled in after construction, so a field may refer to the record */
    fields: Array<{ name: string; codec: Codec }> = [];

    constructor(readonly name: string) {
        this.label = `record ${name}`;
    }

    accepts(value: any): boolean {
        return isPlainObject(value);
    }

    write(writer: Writer, value: any): void {
        if (!isPlainObject(value)) {
            throw mismatch(this, value);
        }
        for (const field of this.fields) {
            const item = value[field.name];
            try {
                if (item === undefined && !field.codec.accepts(undefined)) {
                    throw new AvroError(`Missing required field of type ${field.codec.label}`);
                }
                field.codec.write(writer, item);
            } catch (err) {
                throw err instanceof AvroError ? err.prependPath(field.name) : err;
            }
        }
    }

    read(reader: Reader): Record<string, any> {
        const result: Record<string, any> = {};
        const fields = this.fields;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (field.name === '__proto__') {
                setKey(result, field.name, field.codec.read(reader));
            } else {
                result[field.name] = field.codec.read(reader);
            }
        }
        return result;
    }
}

class EnumCodec implements Codec {
    readonly label: string;

    constructor(name: string, private readonly symbols: string[]) {
        this.label = `enum ${name}`;
    }

    accepts(value: any): boolean {
        return typeof value === 'string' && this.symbols.includes(value);
    }

    write(writer: Writer, value: any): void {
        const index = typeof value === 'string' ? this.symbols.indexOf(value) : -1;
        if (index < 0) {
            throw new AvroError(`Expected one of ${this.symbols.join(', ')} for ${this.label}, got ${value}`);
        }
        writer.writeLong(index);
    }

    read(reader: Reader): string {
        const index = reader.readLong();
        if (typeof index !== 'number' || index < 0 || index >= this.symbols.length) {
            throw new AvroError(`Invalid Avro ${this.label}: symbol ${index} of ${this.symbols.length}`);
        }
        return this.symbols[index];
    }
}

class FixedCodec implements Codec {
    readonly label: string;

    constructor(name: string, private readonly size: number) {
        this.label = `fixed ${name} (${size} bytes)`;
    }

    accepts(value: any): boolean {
        return toBytes(value)?.length === this.size;
    }

    write(writer: Writer, value: any): void {
        const bytes = toBytes(value);
        if (bytes?.length !== this.size) {
            throw mismatch(this, value);
        }
        writer.ensure(this.size);
        writer.buf.set(bytes, writer.pos);
        writer.pos += this.size;
    }

    read(reader: Reader): Uint8Array {
        reader.need(this.size);
        return reader.buf.slice(reader.pos, (reader.pos += this.size));
    }
}

// ---------------------------------------------------------------------------
// Schema compilation
// ---------------------------------------------------------------------------

function primitive(name: string): Codec | undefined {
    return Object.prototype.hasOwnProperty.call(PRIMITIVES, name) ? PRIMITIVES[name] : undefined;
}

function fullName(name: string, namespace: string | undefined): string {
    return name.includes('.') || !namespace ? name : `${namespace}.${name}`;
}

function compile(schema: AvroSchema, named: Map<string, Codec>, namespace?: string): Codec {
    if (typeof schema === 'string') {
        const codec = primitive(schema) ?? named.get(fullName(schema, namespace)) ?? named.get(schema);
        if (codec === undefined) {
            throw new AvroError(`Invalid Avro schema: unknown type "${schema}"`);
        }
        return codec;
    }

    if (Array.isArray(schema)) {
        return new UnionCodec(schema.map(branch => compile(branch, named, namespace)));
    }

    if (schema === null || typeof schema !== 'object') {
        throw new AvroError(`Invalid Avro schema: ${JSON.stringify(schema)}`);
    }

    const type = schema.type;

    // A primitive in object form, possibly with a logical type over it
    const simple = typeof type === 'string' ? primitive(type) : undefined;
    if (simple !== undefined) {
        return simple;
    }

    const register = (codec: Codec): string => {
        if (typeof schema.name !== 'string' || schema.name === '') {
            throw new AvroError(`Invalid Avro schema: ${type} has no name`);
        }
        const name = fullName(schema.name, schema.namespace ?? namespace);
        named.set(name, codec);
        return name;
    };

    switch (type) {
        case 'record':
        case 'error': {
            if (!Array.isArray(schema.fields)) {
                throw new AvroError(`Invalid Avro schema: record ${schema.name} has no fields`);
            }
            const record = new RecordCodec(String(schema.name));
            const name = register(record);
            const inner = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : namespace;
            record.fields = schema.fields.map(field => ({
                name: field.name,
                codec: compile(field.type, named, inner),
            }));
            return record;
        }
        case 'enum': {
            if (!Array.isArray(schema.symbols)) {
                throw new AvroError(`Invalid Avro schema: enum ${schema.name} has no symbols`);
            }
            const codec = new EnumCodec(String(schema.name), schema.symbols);
            register(codec);
            return codec;
        }
        case 'fixed': {
            if (!Number.isInteger(schema.size) || (schema.size as number) < 0) {
                throw new AvroError(`Invalid Avro schema: fixed ${schema.name} has no valid size`);
            }
            const codec = new FixedCodec(String(schema.name), schema.size as number);
            register(codec);
            return codec;
        }
        case 'array':
            if (schema.items === undefined) {
                throw new AvroError('Invalid Avro schema: array has no items');
            }
            return new ArrayCodec(compile(schema.items, named, namespace));
        case 'map':
            if (schema.values === undefined) {
                throw new AvroError('Invalid Avro schema: map has no values');
            }
            return new MapCodec(compile(schema.values, named, namespace));
        default:
            // {"type": <schema>} wraps another schema, or names a defined type
            return compile(type, named, namespace);
    }
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

// Encoding goes through one shared buffer, copied out at the end, so encoding
// many small records does not allocate a fresh buffer for each
const SCRATCH_CAPACITY = 64 * 1024;
const SCRATCH_RETAIN_LIMIT = 4 * 1024 * 1024;
let scratch = new Writer(SCRATCH_CAPACITY);

const CACHE_LIMIT = 512;
const cache = new Map<string, AvroType>();

/**
 * An Avro type, compiled from its schema, that encodes values to Avro binary
 * and decodes them back.
 *
 * Values map to JavaScript as JSON-style data: records and maps to plain
 * objects, arrays to arrays, bytes and fixed to Uint8Array, enums to their
 * symbol strings, and null to null. A union takes the value as-is and is
 * written as its first branch that accepts it.
 *
 * @example
 * ```typescript
 * const type = AvroType.forSchema({
 *     type: 'record', name: 'point',
 *     fields: [{ name: 'x', type: 'double' }, { name: 'label', type: ['string', 'null'] }],
 * });
 * const bytes = type.encode({ x: 1.5, label: null });
 * type.decode(bytes); // { x: 1.5, label: null }
 * ```
 */
export class AvroType {
    /** The schema this type was compiled from */
    public readonly schema: AvroSchema;

    private readonly codec: Codec;

    private constructor(schema: AvroSchema) {
        this.schema = schema;
        this.codec = compile(schema, new Map());
    }

    /**
     * Compiles a schema, or returns the type already compiled for it.
     *
     * @param schema The schema as an object, as JSON text, or as the bare name
     *   of a primitive type such as `"long"`
     * @throws AvroError if the schema is invalid
     */
    static forSchema(schema: AvroSchema): AvroType {
        let key: string;
        let parsed: AvroSchema = schema;

        if (typeof schema === 'string') {
            key = schema;
            const head = schema.trimStart()[0];
            if (head === '{' || head === '[' || head === '"') {
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
        if (type === undefined) {
            type = new AvroType(parsed);
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
    encode(value: any): Uint8Array {
        const writer = scratch;
        writer.pos = 0;
        try {
            this.codec.write(writer, value);
            return writer.buf.slice(0, writer.pos);
        } finally {
            // A one-off huge payload should not stay allocated for good
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
    decode(data: Uint8Array | ArrayBuffer): any {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        const reader = new Reader(bytes);
        const value = this.codec.read(reader);
        if (reader.pos !== bytes.length) {
            throw new AvroError(
                `Invalid Avro data: ${bytes.length - reader.pos} byte(s) left over after decoding ${this.codec.label}`
            );
        }
        return value;
    }
}
