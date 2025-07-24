import { query } from './db.js';
let tables = null;
let columns = null;
export async function loadSchema() {
    if (tables && columns)
        return { tables, columns };
    tables = await query(`
        SELECT TABLE_SCHEMA as 'schema', TABLE_NAME as 'table'
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    columns = await query(`
        SELECT TABLE_NAME as 'table', COLUMN_NAME as 'column', DATA_TYPE as 'type', CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable
        FROM INFORMATION_SCHEMA.COLUMNS
    `);
    return { tables, columns };
}
export async function getTableColumns(table) {
    await loadSchema();
    if (!columns)
        throw new Error('Schema not loaded');
    return columns.filter(c => c.table === table);
}
