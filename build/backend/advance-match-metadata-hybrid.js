import { getReferenceMetadataHybrid } from "./supabaseRPC.js";
import { loadBusinessDict } from "./utils/matadata-dict.js";
import { hasThai as langDetect, manualCut } from "./utils.js";
let businessDict = [];
/**
 * Extracts meaningful keywords from a question, removing stopwords.
 * @param question The user's question.
 * @returns An array of keywords.
 */
function extractKeywords(question) {
    const hasThai = langDetect(question);
    // 1) Thai word segmentation
    businessDict.push("customer");
    // 1) Push your business terms up front (only once, not inside a ternary).
    if (hasThai === "th") {
        businessDict.push("ลูกค้า", "ที่อยู่", "อาศัย", "ยอดขาย", "ขาย", "ชื้อ", "รายได้", "สินค้า", "สมาชิก", "โปรโมชั่น", "ทั้งหมด", "ร้าน", "บืล", "สาขา", "วันนี้", "วีคนี้", "เดือนนี้", "ราคา", "ผิดปกติ", "ยกเลิก");
    }
    // 2) Run your tokenizer exactly once.
    const rawTokens = manualCut(question, businessDict);
    console.log('rawTokens', rawTokens);
    console.log('rawTokens', rawTokens);
    // 2) Stop-word + minimal stemming
    const stopWords = new Set([
        "the", "a", "is", "in", "at", "of", "to", "for", "show", "get", "find", "list", "what", "how", "when",
        "และ", "ใน", "ที่", "เป็น", "ของ", "ให้", "ได้", "จะ", "มี", "คือ", "แสดง", "หา", "อะไร", "อย่างไร", "เมื่อไหร่", "แต่ละ", "ข้อมูล", "ช่วย"
    ]);
    const clean = rawTokens
        .filter(w => !stopWords.has(w));
    // → [ "ข้อมูล", "ลูกค้า", "ทั้งหมด", "ยอดขาย", "ทั้งหมด" ]
    const unique = Array.from(new Set(clean));
    // → [ "ข้อมูล", "ลูกค้า", "ทั้งหมด", "ยอดขาย" ]
    const pattern = unique.join("|");
    // → "ข้อมูล|ลูกค้า|ทั้งหมด|ยอดขาย"
    console.log('pattern', pattern);
    const synonyms = {
        "ยอดขาย": ["sales", "revenue", "turnover", "total order", "total order item", "gross sales", "BP_Order"],
        "ขาย": ["order item", "order items", "BP_Order"],
        "ยอดขายเฉลี่ย": ["average sales", "avg sales", "mean sales"],
        "บิล": ["receipt", "invoice", "order", "bill", "check", "ticket"],
        "สาขา": ["BP_Store", "store ref", "branch", "location", "branch code", "shop"],
        "ร้าน": ["BP_Store", "store", "store name", "shop", "outlet"],
        "วีคนี้": ["this week", "this week name", "current week", "week-to-date"],
        "เดือนนี้": ["this month", "this month name", "current month", "month-to-date"],
        "วันนี้": ["today", "this day", "current day"],
        "ทั้งหมด": ["all", "total", "overall", "entire", "aggregate", "grand total"],
        "ผิดปกติ": ["abnormal", "spike", "outlier", "anomaly", "irregular"],
        "ยกเลิก": ["cancel", "canceled", "cancellation", "void", "voided", "voiding"],
        "สินค้า": ["product", "item", "sku", "article", "goods", "merchandise"],
        "โปรโมชั่น": ["promotion", "promo", "campaign", "discount", "deal", "offer"],
        "ลูกค้า": ["customer", "client", "consumer", "buyer", "CRM_Customer", "CRM_CustomerId"],
        "customer": ["customer", "client", "consumer", "buyer", "CRM_Customer", "CRM_CustomerId"],
        "ช่วงเวลา": ["time slot", "time period", "time range", "hour range"],
        "วันธรรมดา": ["weekday", "workday"],
        "เสาร์อาทิตย์": ["weekend", "saturday sunday", "sat sun"],
        "เปอร์เซ็น": ["percent", "%", "percentage", "pct"],
        "เฉลี่ย": ["average", "avg", "mean"],
        "ที่อยู่": ["address", "geolocation", "address", "province", "sub-district", "building", "street"],
        "อาศัย": ["address", "geolocation", "address", "province", "sub-district", "building", "street"],
    };
    const expanded = pattern.split("|").flatMap((w) => { var _a; return (_a = synonyms[w]) !== null && _a !== void 0 ? _a : [w]; });
    // Ensure expanded is string[] (type guard)
    const final = Array.from(new Set(expanded.filter((x) => typeof x === 'string'))).slice(0, 10);
    console.log('final', final);
    return final;
}
async function advanceMatchMetadataHybrid(config) {
    try {
        const { question, max_results, relevance_threshold } = config;
        // 1. Determine the language of the query
        const lang = langDetect(question);
        // 2. Generate a single embedding for the entire question
        // const qEmb = await embeddingQuery(question);
        businessDict = await loadBusinessDict(lang);
        // 3. Extract keywords to assist the database search
        const keywords = extractKeywords(question);
        if (keywords.length === 0) {
            // No keywords found, cannot perform a keyword search.
            // You could implement a pure vector search as a fallback here if desired.
            return [];
        }
        const searchPattern = keywords.join("|"); // Create a regex pattern (e.g., "sales|product")
        // 4. Call the single, powerful database function with all parameters
        const data = await getReferenceMetadataHybrid(question, searchPattern, lang, max_results, relevance_threshold);
        return data || []; // Return the data or an empty array if null
    }
    catch (error) {
        console.error("Hybrid search flow error:", error);
        return []; // Ensure a stable response type on failure
    }
}
export { advanceMatchMetadataHybrid, extractKeywords };
