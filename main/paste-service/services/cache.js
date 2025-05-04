const redis = require('redis');

// Redis mặc định kết nối tới localhost:6379 — hoặc dùng REDIS_URL nếu có
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const client = redis.createClient({ url: redisUrl });

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

client.connect();

const get = async (key) => {
    try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error(`Redis get error for key ${key}:`, err);
        return null;
    }
};

const set = async (key, value, ttlSeconds = 300) => {
    try {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
        console.error(`Redis set error for key ${key}:`, err);
    }
};

const del = async (key) => {
    try {
        await client.del(key);
    } catch (err) {
        console.error(`Redis delete error for key ${key}:`, err);
    }
};

module.exports = {
    get,
    set,
    del
};
