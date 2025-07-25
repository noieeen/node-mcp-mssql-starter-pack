// Add shared types here if needed
export interface BCRM_TableSchema {
    schema_name: string;
    table_name: string;
    column_name: string;
    data_type: string;
    max_length: number;
    is_nullable: boolean;
    is_identity: boolean;
    is_primary_key: number;
}
