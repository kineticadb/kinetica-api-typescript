/**
 * Utility functions for the Kinetica API.
 */
import type { GPUdb as GPUdbClass } from './GPUdb';
/**
 * Encodes a JSON object or array of objects into JSON string(s).
 */
export declare function encode(data: any | any[]): string | string[];
/**
 * Decodes JSON string(s) into objects.
 *
 * Throws on malformed input, like {@link decodeRegular} and
 * {@link decodeNoInfNan} and like the JavaScript API's `GPUdb.decode`.
 * Returning the undecoded string instead would put a string where every
 * response type declares an object, with nothing to signal it.
 */
export declare function decode(data: string | string[]): any | any[];
/**
 * Decodes JSON string(s) with no special handling of Infinity or NaN.
 *
 * Faster than {@link decodeNoInfNan}; the JavaScript API exposes this as
 * `GPUdb.decode_regular`.
 */
export declare function decodeRegular(data: string | string[]): any | any[];
/**
 * Decodes JSON string(s), turning the quoted values "Infinity", "-Infinity"
 * and "NaN" into null.
 *
 * Noticeably slower than {@link decodeRegular}, since every value passes
 * through a reviver. The JavaScript API exposes this as
 * `GPUdb.decode_no_inf_nan`.
 */
export declare function decodeNoInfNan(data: string | string[]): any | any[];
/**
 * Ring list for URL failover support.
 */
export declare class RingList<T> {
    private items;
    private currentIndex;
    constructor(items: T[], initialIndex?: number);
    getCurrentItem(): T;
    next(): T;
    getItems(): T[];
    size(): number;
}
/**
 * Base64 encoding that works in both browser and Node.js.
 */
export declare function base64Encode(str: string): string;
/**
 * Base64 decoding that works in both browser and Node.js.
 */
export declare function base64Decode(str: string): string;
/**
 * Metadata about a column that is part of a GPUdb type.
 */
export declare class Column {
    /** The name of the column */
    readonly name: string;
    /** The data type of the column */
    readonly type: string;
    /** The list of properties that apply to the column */
    readonly properties: string[];
    /**
     * Creates a Column object.
     *
     * @param name - The name of the column
     * @param type - The data type of the column
     * @param properties - The list of properties that apply to the column
     */
    constructor(name: string, type: string, ...properties: string[]);
    /**
     * Gets whether the column is nullable.
     */
    isNullable(): boolean;
}
/**
 * Metadata about a GPUdb type.
 */
export declare class Type {
    /** A user-defined description string */
    readonly label: string;
    /** The list of columns that the type comprises */
    readonly columns: Column[];
    /**
     * Creates a Type object.
     *
     * @param label - A user-defined description string
     * @param columns - The columns that make up the type
     */
    constructor(label: string, ...columns: Column[]);
    /**
     * Creates a Type object using data returned from GPUdb show_table or show_types.
     */
    static fromTypeInfo(label: string, typeSchema: string | {
        fields: Array<{
            name: string;
            type: string | string[];
        }>;
    }, properties: Record<string, string[]>): Type;
    /**
     * Generates an Avro record schema based on the metadata in the Type object.
     */
    generateSchema(): {
        type: string;
        name: string;
        fields: Array<{
            name: string;
            type: string | string[];
        }>;
    };
    /**
     * Creates a new type in GPUdb based on the metadata in the Type object.
     *
     * @param gpudb - GPUdb client instance
     * @returns Promise resolving to the type ID
     */
    create(gpudb: GPUdbClass): Promise<string>;
    /**
     * Creates a Type object containing metadata about the type stored in the specified table.
     *
     * @param gpudb - GPUdb client instance
     * @param tableName - The table from which to obtain type metadata
     * @returns Promise resolving to the Type object
     */
    static fromTable(gpudb: GPUdbClass, tableName: string): Promise<Type>;
    /**
     * Creates a Type object containing metadata about the specified type in GPUdb.
     *
     * @param gpudb - GPUdb client instance
     * @param typeId - The type for which to obtain metadata
     * @returns Promise resolving to the Type object
     */
    static fromType(gpudb: GPUdbClass, typeId: string): Promise<Type>;
}
export declare namespace Type {
    type Column = import('./utils').Column;
}
