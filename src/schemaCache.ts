import { query } from './db.js';

export type TableInfo = { table: string; schema: string };
export type ColumnInfo = { table: string; column: string; type: string; nullable: boolean };

let tables: TableInfo[] | null = null;
let columns: ColumnInfo[] | null = null;

export async function loadSchema() {
  if (tables && columns) return { tables, columns };
  tables = await query<TableInfo>(`
    SELECT TABLE_SCHEMA as 'schema', TABLE_NAME as 'table'
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
  `);
  columns = await query<ColumnInfo>(`
    SELECT TABLE_NAME as 'table', COLUMN_NAME as 'column', DATA_TYPE as 'type',
           CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable
    FROM INFORMATION_SCHEMA.COLUMNS
  `);
  return { tables, columns };
}

export function getTableColumns(table: string) {
  if (!columns) throw new Error('Schema not loaded');
  return columns.filter(c => c.table === table);
}
