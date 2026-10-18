/**
 * Kinetica API example for ES modules (Node.js)
 *
 * Usage:
 *   npm run build                 # dist/esm is what this imports
 *   node examples/esm-example.mjs [url] [username] [password]
 *
 * Example:
 *   node examples/esm-example.mjs http://localhost:9191 admin password
 *
 * This file imports the built entry point directly so it runs from a checkout.
 * In your own project, install the package and import it by name -- no
 * createRequire shim, no bundler:
 *
 *   import { GPUdb, Type, Column, END_OF_SET } from '@kinetica/gpudb-api';
 *
 * A default import gives the whole namespace, and the legacy package name
 * works the same way:
 *
 *   import kinetica from '@kinetica/gpudb-api';   // kinetica.GPUdb
 *   import GPUdb from '@kinetica/gpudb';          // the constructor itself
 */

import { GPUdb, Type, Column, END_OF_SET } from '../dist/esm/index.mjs';
import kinetica from '../dist/esm/index.mjs';

const url = process.argv[2] || 'http://localhost:9191';
const user = process.argv[3] || '';
const pass = process.argv[4] || '';

const tableName = 'esm_example_table';

console.log('Kinetica API Example (ES modules)');
console.log('=================================\n');
console.log(`Connecting to: ${url}`);

// Named and default imports are the same objects: one module instance
console.log(`Named import matches default: ${GPUdb === kinetica.GPUdb}`);

const db = new GPUdb(url, { username: user, password: pass });

/** Dynamic-schema payloads are column-major; turn them into rows. */
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

try {
    // 1. Top-level await: an ES module can do this without an async wrapper
    console.log('\n1. Getting system properties...');
    const properties = await db.show_system_properties({});
    console.log(`   Version: ${properties.property_map['version.gpudb_core_version']}`);

    // 2. Define a type and create a table
    console.log(`\n2. Creating table '${tableName}'...`);
    await db.clear_table(tableName, '', { no_error_if_not_exists: 'true' });

    const recordType = new Type('esm_example_type',
        new Column('id', 'int'),
        new Column('name', 'string', 'char64'),
        new Column('value', 'double'),
        new Column('category', 'string', 'char16')
    );
    await db.create_table(tableName, await recordType.create(db), {});
    console.log('   Done.');

    // 3. Insert
    console.log('\n3. Inserting records...');
    const inserted = await db.insert_records(tableName, [
        { id: 1, name: 'Alice', value: 100.5, category: 'A' },
        { id: 2, name: 'Bob', value: 200.3, category: 'B' },
        { id: 3, name: 'Charlie', value: 300.1, category: 'A' },
        { id: 4, name: 'Diana', value: 400.7, category: 'B' }
    ], {});
    console.log(`   Inserted ${inserted.count_inserted} records`);

    // 4. Row-major: get_records returns an array of records
    console.log('\n4. Retrieving records...');
    const records = await db.get_records(tableName, 0, END_OF_SET, {});
    for (const record of records.data) {
        console.log(`     ${JSON.stringify(record)}`);
    }

    // 5. Column-major: SQL and the aggregates return a dynamic schema
    console.log('\n5. Aggregating by category...');
    const summary = await db.execute_sql(
        `SELECT category, COUNT(*) AS n, AVG(value) AS avg_value
         FROM ${tableName} GROUP BY category ORDER BY category`,
        0, 100, '', [], {});
    for (const row of toRows(summary.data)) {
        console.log(`     ${JSON.stringify(row)}`);
    }

    // 6. for await: SqlIterator pages through a result set
    console.log('\n6. Iterating with SqlIterator...');
    for await (const row of db.SqlIterator(
        `SELECT id, name FROM ${tableName} ORDER BY id`, 2, {})) {
        console.log(`     ${row.id}: ${row.name}`);
    }

    // 7. Errors reject with the server's own message
    console.log('\n7. Error handling...');
    try {
        await db.get_records('no_such_table_esm_example', 0, 10, {});
    } catch (error) {
        console.log(`   Caught: ${error.message}`);
    }

    console.log(`\n8. Cleaning up '${tableName}'...`);
    await db.clear_table(tableName, '', {});
    console.log('   Done.');

    console.log('\n=================================');
    console.log('Example completed successfully!');
} catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
}
