import { supabase } from "../../libs/supabase.js";
import { getCache, setCache } from "../services/cacheService-v2.js";
export async function loadBusinessDict(lang) {
    const baseKey = lang === "th" ? "rag:businessDict:th" : "rag:businessDict:en";
    const tableKeys = ["table_name"];
    const columnKeys = ["column_name"];
    const displayKey = lang === "th" ? "display_name_th" : "display_name_en";
    tableKeys.push(displayKey);
    columnKeys.push(displayKey);
    const cached = await getCache(baseKey);
    console.log("cached", baseKey, cached);
    if (Array.isArray(cached))
        return cached;
    const businessDict = [];
    const [tablesRes, colsRes] = await Promise.all([
        supabase.from("rag_tables").select(tableKeys.join(",")),
        supabase.from("rag_columns").select(columnKeys.join(",")),
    ]);
    if (tablesRes.error || colsRes.error) {
        console.error("Supabase errors", tablesRes.error, colsRes.error);
        return [];
    }
    if (tablesRes.data) {
        for (const t of tablesRes.data) {
            // @ts-ignore
            businessDict.push(t.table_name.toLowerCase());
            // @ts-ignore
            if (t[displayKey])
                businessDict.push(t[displayKey].toLowerCase());
        }
    }
    if (colsRes.data) {
        for (const c of colsRes.data) {
            // @ts-ignore
            businessDict.push(c.column_name.toLowerCase());
            // @ts-ignore
            if (c[displayKey])
                businessDict.push(c[displayKey].toLowerCase());
        }
    }
    const result = Array.from(new Set(businessDict));
    await setCache(baseKey, result, 300);
    return result;
}
