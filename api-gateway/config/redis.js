const { createClient } = require('redis');

let isRedisConnected = false;
const stats = {
    hits: 0,
    misses: 0,
    writes: 0
};

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.warn('Redis reconnection limit reached. Falling back to non-cached execution.');
                return false;
            }
            return Math.min(retries * 500, 3000);
        }
    }
});

redisClient.on('error', (err) => {
    isRedisConnected = false;
    console.error('Redis Client Notice:', err.message);
});

redisClient.on('connect', () => {
    isRedisConnected = true;
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        isRedisConnected = true;
        console.log('Redis connected successfully to', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    } catch (err) {
        isRedisConnected = false;
        console.warn('Unable to connect to Redis cache at startup. System will operate in cache-bypass mode.');
    }
};

const safeGet = async (key) => {
    if (!isRedisConnected) {
        stats.misses++;
        return null;
    }
    try {
        const val = await redisClient.get(key);
        if (val) {
            stats.hits++;
        } else {
            stats.misses++;
        }
        return val;
    } catch (err) {
        stats.misses++;
        return null;
    }
};

const safeSet = async (key, seconds, value) => {
    if (!isRedisConnected) return;
    try {
        await redisClient.setEx(key, seconds, value);
        stats.writes++;
    } catch (err) {
        console.warn('Redis safeSet failed:', err.message);
    }
};

const invalidatePattern = async (pattern) => {
    if (!isRedisConnected) return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Invalidated ${keys.length} Redis cache keys matching '${pattern}'`);
        }
    } catch (err) {
        console.warn('Redis invalidatePattern error:', err.message);
    }
};

const getCacheStats = async () => {
    let totalKeys = 0;
    if (isRedisConnected) {
        try {
            const keys = await redisClient.keys('*');
            totalKeys = keys.length;
        } catch (e) {}
    }
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(1) + '%' : '0.0%';
    return {
        isConnected: isRedisConnected,
        totalKeys,
        hits: stats.hits,
        misses: stats.misses,
        writes: stats.writes,
        hitRate
    };
};

module.exports = {
    redisClient,
    connectRedis,
    safeGet,
    safeSet,
    invalidatePattern,
    getCacheStats
};