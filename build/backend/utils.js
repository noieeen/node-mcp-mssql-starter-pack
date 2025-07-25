function reduceMetadata(fullMetadata) {
    if (!Array.isArray(fullMetadata.result))
        return [];
    return fullMetadata.result
        .map((col) => {
        const role = inferRole(col);
        return {
            table: col.table_name,
            column: col.column_name,
            type: col.data_type,
            role,
        };
    })
        .filter((c) => c.role !== "irrelevant");
}
function inferRole(col) {
    if (col.is_primary_key)
        return "primary_key";
    if (/id|ref/i.test(col.column_name))
        return "foreign_key_or_id";
    if (/name|title/i.test(col.column_name))
        return "text";
    if (/email|mobile/i.test(col.column_name))
        return "contact";
    if (/spending|point|balance/i.test(col.column_name))
        return "metric";
    if (col.data_type.includes("datetime"))
        return "datetime";
    if (/note/i.test(col.column_name))
        return "irrelevant";
    if (/isdeleted|isdummy/i.test(col.column_name))
        return "irrelevant";
    return "other";
}
// Example usage:
const fullSchemaJson = { result: [] }; // Replace with actual schema data as needed
const reduced = reduceMetadata(fullSchemaJson);
console.log(JSON.stringify(reduced, null, 2));
const fullTypeTransform = (data_type, max_length) => {
    if (!max_length)
        return data_type;
    return max_length === -1 ? `${data_type}(MAX)` : `${data_type}(${max_length})`;
};
// TODO:
// import { rawQueryMssql } from "@/lib/mssql-client"
// import { callProvider } from "@/lib/ai"
// import { insertColumnsToSupabase } from "@/lib/supabase"
// import { splitIntoChunks } from "@/utils/array-utils"
//
// const MAX_CONCURRENT = 5
//
// export const captureTableBatch = async (tableNames: string[], dbName: string) => {
//     const tableChunks = splitIntoChunks(tableNames, MAX_CONCURRENT)
//
//     for (const chunk of tableChunks) {
//         const promises = chunk.map(async (tableName) => {
//             // Step 1: get column schema
//             const schema = await getTableSchema(tableName, dbName)
//
//             // Step 2: send to OpenAI to enrich metadata
//             const enriched = await callProvider({
//                 model: "gpt-4o",
//                 prompt: buildPromptFromSchema(tableName, schema)
//             })
//
//             // Step 3: Parse and insert to Supabase
//             await insertColumnsToSupabase(dbName, enriched)
//         })
//
//         await Promise.all(promises)
//     }
// }
// --- HELPER FUNCTIONS ---
/**
 * Detects if the text contains Thai, English, or both.
 * @param text The input string.
 * @returns 'th', 'en', or 'mixed'.
 */
const langDetect = (text) => {
    const hasThai = /[\u0E00-\u0E7F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    let lang = "en";
    if (hasThai && hasEnglish)
        lang = "mixed";
    else if (hasThai)
        lang = "th";
    return lang;
};
const hasThai = (text) => {
    const hasThai = /[\u0E00-\u0E7F]/.test(text);
    // Simple check: if Thai characters exist, assume Thai preference.
    // A more sophisticated approach could be used if needed.
    return hasThai ? "th" : "en";
};
// ==================================
// --- MANUAL TOKENIZER ---
/**
 * Greedy longest-match tokenizer for Thai (or any language without spaces)
 * @param text Input string
 * @param businessDict
 * @returns Array of matched tokens
 */
function manualCut(text, businessDict) {
    const dict = [...businessDict].sort((a, b) => b.length - a.length);
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        let matched = '';
        for (const word of dict) {
            if (text.toLowerCase().startsWith(word, i)) {
                matched = word;
                break;
            }
        }
        if (matched) {
            tokens.push(matched);
            i += matched.length;
        }
        else {
            // If no match, take 1 char (or handle as unknown)
            tokens.push(text[i]);
            i++;
        }
    }
    return tokens.filter(w => businessDict.includes(w)); // Only keep known words
}
export { reduceMetadata, fullTypeTransform, langDetect, hasThai, manualCut };
