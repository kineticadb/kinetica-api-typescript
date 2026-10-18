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
export type AvroSchema = string | AvroSchema[] | {
    type: AvroSchema;
    name?: string;
    namespace?: string;
    fields?: Array<{
        name: string;
        type: AvroSchema;
        [key: string]: any;
    }>;
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
export declare class AvroError extends Error {
    /** Field names and array/map positions leading to the offending value */
    readonly path: string[];
    private readonly reason;
    constructor(reason: string);
    /** @internal Records one more level of the path, outermost last. */
    prependPath(segment: string): this;
}
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
export declare class AvroType {
    /** The schema this type was compiled from */
    readonly schema: AvroSchema;
    private readonly codec;
    private constructor();
    /**
     * Compiles a schema, or returns the type already compiled for it.
     *
     * @param schema The schema as an object, as JSON text, or as the bare name
     *   of a primitive type such as `"long"`
     * @throws AvroError if the schema is invalid
     */
    static forSchema(schema: AvroSchema): AvroType;
    /**
     * Encodes a value to Avro binary.
     *
     * @throws AvroError if the value does not match the schema; its `path`
     *   names the offending field
     */
    encode(value: any): Uint8Array;
    /**
     * Decodes one Avro binary value, which must take up the whole input.
     *
     * @throws AvroError if the data is truncated, has bytes left over, or
     *   otherwise does not match the schema
     */
    decode(data: Uint8Array | ArrayBuffer): any;
}
