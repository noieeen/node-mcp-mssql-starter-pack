import redis from "../../libs/redis.js"

export async function getCache<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttlSeconds) {
        await redis.set(key, stringValue, {EX: ttlSeconds});
    } else {
        await redis.set(key, stringValue);
    }
}

export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key)
    } catch (error) {
        console.error("Cache delete error:", error)
    }
}