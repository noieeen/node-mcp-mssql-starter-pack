import { query } from "./libs/db.js";
let tables = null;
let columns = null;
let schemaLoadPromise = null;
/**
 * Load database schema information with caching and concurrent request handling
 */
export async function loadSchema() {
    // If already loaded, return cached data
    if (tables && columns) {
        return { tables, columns };
    }
    // If already loading, return the existing promise to avoid duplicate requests
    if (schemaLoadPromise) {
        return schemaLoadPromise;
    }
    // Start loading schema
    schemaLoadPromise = loadSchemaInternal();
    try {
        const result = await schemaLoadPromise;
        return result;
    }
    catch (error) {
        // Reset promise on error so next call will retry
        schemaLoadPromise = null;
        throw error;
    }
}
async function loadSchemaInternal() {
    try {
        const [tablesResult, columnsResult] = await Promise.all([
            query(`
                SELECT TABLE_SCHEMA as 'schema', TABLE_NAME as 'table'
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
            `),
            query(`
                SELECT t.name                                                   AS table_name,
                       c.name                                                   AS column_name,
                       ty.name                                                  AS type,
                       c.max_length                                             AS max_length,
                       c.is_nullable,
                       c.is_identity,
                       dc.definition                                            AS default_value,
                       CASE WHEN pk_col.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key
                FROM sys.columns c
                         JOIN sys.tables t ON c.object_id = t.object_id
                         JOIN sys.types ty ON c.user_type_id = ty.user_type_id
                         LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
                         LEFT JOIN (SELECT ic.object_id, ic.column_id
                                    FROM sys.indexes i
                                             JOIN sys.index_columns ic
                                                  ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                                    WHERE i.is_primary_key = 1) AS pk_col
                                   ON c.object_id = pk_col.object_id AND c.column_id = pk_col.column_id
            `)
        ]);
        // Cache the results
        tables = tablesResult;
        columns = columnsResult;
        return { tables, columns };
    }
    catch (error) {
        throw new Error(`Failed to load database schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Get column information for a specific table
 */
export async function getTableColumns(tableName) {
    if (!tableName || typeof tableName !== 'string') {
        throw new Error('Table name must be a non-empty string');
    }
    const { columns: allColumns } = await loadSchema();
    const tableColumns = allColumns.filter(c => c.table_name.toLowerCase() === tableName.toLowerCase());
    if (tableColumns.length === 0) {
        // Check if table exists at all
        const { tables: allTables } = await loadSchema();
        const tableExists = allTables.some(t => t.table.toLowerCase() === tableName.toLowerCase());
        if (!tableExists) {
            throw new Error(`Table '${tableName}' does not exist`);
        }
        else {
            // Table exists but has no columns (shouldn't happen in normal cases)
            throw new Error(`Table '${tableName}' exists but has no columns`);
        }
    }
    return tableColumns;
}
/**
 * Get all available tables
 */
export async function getTables() {
    const { tables: allTables } = await loadSchema();
    return allTables;
}
/**
 * Check if a table exists
 */
export async function tableExists(tableName) {
    if (!tableName || typeof tableName !== 'string') {
        return false;
    }
    const { tables: allTables } = await loadSchema();
    return allTables.some(t => t.table.toLowerCase() === tableName.toLowerCase());
}
/**
 * Clear the schema cache (useful for testing or when schema changes)
 */
export function clearSchemaCache() {
    tables = null;
    columns = null;
    schemaLoadPromise = null;
}
/**
 * Get schema statistics
 */
export async function getSchemaStats() {
    const { tables: allTables, columns: allColumns } = await loadSchema();
    return {
        tableCount: allTables.length,
        totalColumns: allColumns.length,
        averageColumnsPerTable: allTables.length > 0
            ? Math.round((allColumns.length / allTables.length) * 100) / 100
            : 0
    };
}
