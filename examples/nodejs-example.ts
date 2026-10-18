/**
 * Kinetica TypeScript API Example for Node.js
 *
 * Converted from the original JavaScript example in gpudb-api-javascript/example/nodejs-example.js
 *
 * Usage:
 *   npx ts-node examples/nodejs-example.ts [url] [username] [password]
 *
 * Example:
 *   npx ts-node examples/nodejs-example.ts http://localhost:9191 admin password
 */

import { GPUdb, Type, Column, DynamicSchemaData, END_OF_SET } from '../src';

// Parse command line arguments
const url = process.argv[2] || 'http://localhost:9191';
const user = process.argv[3] || '';
const pass = process.argv[4] || '';

console.log('Kinetica TypeScript API Example');
console.log('================================\n');
console.log(`Connecting to: ${url}`);

// Create GPUdb connection
const db = new GPUdb(url, {
    username: user,
    password: pass
});

// Table configuration
const tableName = 'typescript_example_table';

/**
 * Endpoints that return a dynamic schema (execute_sql, aggregate_group_by,
 * aggregate_unique, ...) decode into a column-major object:
 *
 *   { column_1: [...], column_2: [...], column_headers: [...], column_datatypes: [...] }
 *
 * Turn that into an array of row objects keyed by column name. Endpoints that
 * return records directly, such as get_records, are already row-major and do
 * not need this.
 */
function toRows(data: DynamicSchemaData | undefined): Record<string, any>[] {
    if (!data || !Array.isArray(data.column_headers)) {
        return [];
    }

    const headers = data.column_headers;
    const columns = headers.map((_, i) => data[`column_${i + 1}`] ?? []);
    const rowCount = columns.length > 0 ? columns[0].length : 0;

    const rows: Record<string, any>[] = [];
    for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        headers.forEach((header, col) => {
            row[header] = columns[col][i];
        });
        rows.push(row);
    }
    return rows;
}

async function main() {
    try {
        // 1. Show system properties
        console.log('\n1. Getting system properties...');
        const sysProps = await db.show_system_properties({});
        console.log(`   Version: ${sysProps.property_map['version.gpudb_core_version']}`);

        // 2. Clear any existing table
        console.log(`\n2. Clearing table '${tableName}' if it exists...`);
        await db.clear_table(tableName, '', { no_error_if_not_exists: 'true' });
        console.log('   Done.');

        // 3. Create a type
        console.log('\n3. Creating type...');
        const myType = new Type('my_type',
            new Column('id', 'int'),
            new Column('name', 'string'),
            new Column('value', 'double'),
            new Column('category', 'string')
        );
        const typeId = await myType.create(db);
        console.log(`   Type ID: ${typeId}`);

        // 4. Create a table
        console.log(`\n4. Creating table '${tableName}'...`);
        const createResponse = await db.create_table(tableName, typeId, {});
        console.log(`   Table created: ${createResponse.table_name}`);

        // 5. Insert records
        console.log('\n5. Inserting records...');
        const records = [
            { id: 1, name: 'Alice', value: 100.5, category: 'A' },
            { id: 2, name: 'Bob', value: 200.3, category: 'B' },
            { id: 3, name: 'Charlie', value: 150.7, category: 'A' },
            { id: 4, name: 'Diana', value: 300.2, category: 'B' },
            { id: 5, name: 'Eve', value: 250.9, category: 'A' }
        ];

        const insertResponse = await db.insert_records(tableName, records, {
            return_record_ids: 'true'
        });
        console.log(`   Inserted ${insertResponse.count_inserted} records`);

        // 6. Get all records
        console.log('\n6. Retrieving all records...');
        const getResponse = await db.get_records(tableName, 0, END_OF_SET, {});
        console.log('   Retrieved records:');
        for (const record of getResponse.data || []) {
            console.log(`     ${JSON.stringify(record)}`);
        }

        // 7. Execute SQL query
        console.log('\n7. Executing SQL query...');
        const sqlResponse = await db.execute_sql(
            `SELECT category, COUNT(*) as count, AVG(value) as avg_value
             FROM ${tableName}
             GROUP BY category
             ORDER BY category`,
            0,
            100,
            '',
            [],
            {}
        );
        console.log('   SQL query results:');
        for (const row of toRows(sqlResponse.data)) {
            console.log(`     ${JSON.stringify(row)}`);
        }

        // 8. Filter records
        console.log('\n8. Filtering records (value > 200)...');
        const filterResponse = await db.filter(
            tableName,
            '',  // view_name - empty to not create a view
            'value > 200',
            {}
        );
        console.log(`   Found ${filterResponse.count} matching records`);

        // 9. Aggregate unique values
        console.log('\n9. Getting unique categories...');
        const uniqueResponse = await db.aggregate_unique(
            tableName,
            'category',
            0,
            100,
            {}
        );
        console.log('   Unique categories:');
        for (const record of toRows(uniqueResponse.data)) {
            console.log(`     ${JSON.stringify(record)}`);
        }

        // 10. Type.fromTable
        console.log('\n10. Getting type from table...');
        const retrievedType = await Type.fromTable(db, tableName);
        console.log(`    Label: ${retrievedType.label}`);
        console.log('    Columns:');
        for (const col of retrievedType.columns) {
            console.log(`      - ${col.name}: ${col.type}`);
        }

        // 11. Clean up
        console.log(`\n11. Cleaning up - clearing table '${tableName}'...`);
        await db.clear_table(tableName, '', {});
        console.log('    Done.');

        console.log('\n================================');
        console.log('Example completed successfully!');

    } catch (error) {
        console.error('\nError:', error);
        process.exit(1);
    }
}

// Run the example
main();
