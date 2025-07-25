import redis from "../../libs/redis.js";
export async function getCache(key) {
    const raw = await redis.get(key);
    if (!raw)
        return null;
    return JSON.parse(raw);
}
export async function setCache(key, value, ttlSeconds) {
    const stringValue = JSON.stringify(value);
    if (ttlSeconds) {
        await redis.set(key, stringValue, { EX: ttlSeconds });
    }
    else {
        await redis.set(key, stringValue);
    }
}
export async function deleteCache(key) {
    try {
        await redis.del(key);
    }
    catch (error) {
        console.error("Cache delete error:", error);
    }
}
