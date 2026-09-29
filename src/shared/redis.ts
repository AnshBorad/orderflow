import IORedis from 'ioredis';
import { config } from './config.js';

export const redis = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));
