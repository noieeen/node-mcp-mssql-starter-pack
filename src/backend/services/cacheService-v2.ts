export async function getCache<T>(key: string): Promise<T | null> {
    return null
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return;
}

export async function deleteCache(key: string): Promise<void> {
    return
}