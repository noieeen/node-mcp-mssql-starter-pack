import { embeddingQuery } from "./utils/model/embedding.js";
import { supabase } from "../libs/supabase.js";
export const getReferenceMetadataHybrid = async (query, searchPattern, lang, max_results, relevance_threshold) => {
    const qEmb = await embeddingQuery(query);
    const { data, error } = await supabase.rpc("search_metadata_hybrid", {
        query_embedding: qEmb,
        search_pattern: searchPattern,
        query_lang: lang,
        match_count: max_results,
        relevance_threshold: relevance_threshold,
    });
    if (error) {
        console.error("Supabase RPC 'search_metadata_hybrid' error:", error);
        throw new Error(`Database search failed: ${error.message}`);
    }
    return data;
};
