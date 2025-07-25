import { createClient } from 'redis';

// Create and configure Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect to Redis
export default redisClient;