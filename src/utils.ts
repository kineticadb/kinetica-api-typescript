/**
 * Utility functions for the Kinetica API.
 */

import type { GPUdb as GPUdbClass } from './GPUdb';

/**
 * Encodes a JSON object or array of objects into JSON string(s).
 */
export function encode(data: any | any[]): string | string[] {
    if (Array.isArray(data)) {
        return data.map(item => JSON.stringify(item));
    }
    return JSON.stringify(data);
}

/**
 * Decodes JSON string(s) into objects.
 *
 * Throws on malformed input, like {@link decodeRegular} and
 * {@link decodeNoInfNan} and like the JavaScript API's `GPUdb.decode`.
 * Returning the undecoded string instead would put a string where every
 * response type declares an object, with nothing to signal it.
 */
export function decode(data: string | string[]): any | any[] {
    if (Array.isArray(data)) {
        return data.map(item => decode(item));
    }
    try {
        return JSON.parse(data);
    } catch (err) {
        throw new Error(`Unable to decode response payload: ${err}`);
    }
}

/**
 * Decodes JSON string(s) with no special handling of Infinity or NaN.
 *
 * Faster than {@link decodeNoInfNan}; the JavaScript API exposes this as
 * `GPUdb.decode_regular`.
 */
export function decodeRegular(data: string | string[]): any | any[] {
    if (Array.isArray(data)) {
        return data.map(item => decodeRegular(item));
    }
    return JSON.parse(data);
}

/**
 * Decodes JSON string(s), turning the quoted values "Infinity", "-Infinity"
 * and "NaN" into null.
 *
 * Noticeably slower than {@link decodeRegular}, since every value passes
 * through a reviver. The JavaScript API exposes this as
 * `GPUdb.decode_no_inf_nan`.
 */
export function decodeNoInfNan(data: string | string[]): any | any[] {
    if (Array.isArray(data)) {
        return data.map(item => decodeNoInfNan(item));
    }
    return JSON.parse(data, (_key, value) => {
        if (value === 'Infinity' || value === '-Infinity' || value === 'NaN') {
            return null;
        }
        return value;
    });
}

/**
 * Ring list for URL failover support.
 */
export class RingList<T> {
    private items: T[];
    private currentIndex: number;

    constructor(items: T[], initialIndex: number = 0) {
        if (!items || items.length === 0) {
            throw new Error('RingList requires at least one item');
        }
        this.items = [...items];
        this.currentIndex = initialIndex % items.length;
    }

    getCurrentItem(): T {
        return this.items[this.currentIndex];
    }

    next(): T {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        return this.getCurrentItem();
    }

    getItems(): T[] {
        return [...this.items];
    }

    size(): number {
        return this.items.length;
    }
}

/**
 * Base64 encoding that works in both browser and Node.js.
 */
export function base64Encode(str: string): string {
    if (typeof btoa === 'function') {
        // Browser
        return btoa(str);
    } else {
        // Node.js
        return Buffer.from(str).toString('base64');
    }
}

/**
 * Base64 decoding that works in both browser and Node.js.
 */
export function base64Decode(str: string): string {
    if (typeof atob === 'function') {
        // Browser
        return atob(str);
    } else {
        // Node.js
        return Buffer.from(str, 'base64').toString();
    }
}

/**
 * Metadata about a column that is part of a GPUdb type.
 */
export class Column {
    /** The name of the column */
    public readonly name: string;
    /** The data type of the column */
    public readonly type: string;
    /** The list of properties that apply to the column */
    public readonly properties: string[];

    /**
     * Creates a Column object.
     *
     * @param name - The name of the column
     * @param type - The data type of the column
     * @param properties - The list of properties that apply to the column
     */
    constructor(name: string, type: string, ...properties: string[]) {
        this.name = name;
        this.type = type;
        this.properties = properties;
    }

    /**
     * Gets whether the column is nullable.
     */
    isNullable(): boolean {
        return this.properties.includes('nullable');
    }
}

/**
 * Metadata about a GPUdb type.
 */
export class Type {
    /** A user-defined description string */
    public readonly label: string;
    /** The list of columns that the type comprises */
    public readonly columns: Column[];

    /**
     * Creates a Type object.
     *
     * @param label - A user-defined description string
     * @param columns - The columns that make up the type
     */
    constructor(label: string, ...columns: Column[]) {
        this.label = label;
        this.columns = columns;
    }

    /**
     * Creates a Type object using data returned from GPUdb show_table or show_types.
     */
    static fromTypeInfo(
        label: string,
        typeSchema: string | { fields: Array<{ name: string; type: string | string[] }> },
        properties: Record<string, string[]>
    ): Type {
        const schema = typeof typeSchema === 'string' ? JSON.parse(typeSchema) : typeSchema;
        const columns: Column[] = [];

        for (const field of schema.fields) {
            let fieldType = field.type;
            if (Array.isArray(fieldType)) {
                fieldType = fieldType.find((t: string) => t !== 'null') || fieldType[0];
            }
            const props = properties[field.name] || [];
            columns.push(new Column(field.name, fieldType, ...props));
        }

        return new Type(label, ...columns);
    }

    /**
     * Generates an Avro record schema based on the metadata in the Type object.
     */
    generateSchema(): { type: string; name: string; fields: Array<{ name: string; type: string | string[] }> } {
        return {
            type: 'record',
            name: 'type_name',
            fields: this.columns.map(col => ({
                name: col.name,
                type: col.isNullable() ? [col.type, 'null'] : col.type
            }))
        };
    }

    /**
     * Creates a new type in GPUdb based on the metadata in the Type object.
     *
     * @param gpudb - GPUdb client instance
     * @returns Promise resolving to the type ID
     */
    async create(gpudb: GPUdbClass): Promise<string> {
        const properties: Record<string, string[]> = {};
        for (const column of this.columns) {
            if (column.properties.length > 0) {
                properties[column.name] = column.properties;
            }
        }

        const response = await gpudb.create_type(
            JSON.stringify(this.generateSchema()),
            this.label,
            properties,
            {}
        );
        return response.type_id;
    }

    /**
     * Creates a Type object containing metadata about the type stored in the specified table.
     *
     * @param gpudb - GPUdb client instance
     * @param tableName - The table from which to obtain type metadata
     * @returns Promise resolving to the Type object
     */
    static async fromTable(gpudb: GPUdbClass, tableName: string): Promise<Type> {
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

        return Type.fromTypeInfo(
            response.type_labels[0],
            response.type_schemas[0],
            response.properties[0]
        );
    }

    /**
     * Creates a Type object containing metadata about the specified type in GPUdb.
     *
     * @param gpudb - GPUdb client instance
     * @param typeId - The type for which to obtain metadata
     * @returns Promise resolving to the Type object
     */
    static async fromType(gpudb: GPUdbClass, typeId: string): Promise<Type> {
        const response = await gpudb.show_types(typeId, '', {});

        if (response.type_ids.length === 0) {
            throw new Error(`Type ${typeId} does not exist.`);
        }

        return Type.fromTypeInfo(
            response.labels[0],
            response.type_schemas[0],
            response.properties[0]
        );
    }
}

// Make Column accessible as Type.Column for backwards compatibility
export namespace Type {
    export type Column = import('./utils').Column;
}

// Attach Column class to Type for runtime usage (GPUdb.Type.Column pattern)
(Type as any).Column = Column;
