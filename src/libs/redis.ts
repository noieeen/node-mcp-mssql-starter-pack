import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));

let isConnected = false;

async function connectRedis() {
    if (!isConnected) {
        await redis.connect();
        isConnected = true;
    }
}

export async function getRedisClient() {
    await connectRedis();
    return redis;
}

export default redis;