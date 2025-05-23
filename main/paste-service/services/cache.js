const redis = require('redis');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            console.error('Redis max attempts reached');
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    },
    connect_timeout: 60000,
    lazyConnect: true
};

const client = redis.createClient(redisConfig);


client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

client.on('connect', () => {
    console.log('✅ Connected to Google Cloud Memorystore (Redis)');
});

client.on('ready', () => {
    console.log('✅ Redis client ready');
});

client.on('end', () => {
    console.log('❌ Redis connection ended');
});

const connectWithRetry = async (maxRetries = 5, delay = 3000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await client.connect();
            console.log('✅ Successfully connected to Redis');
            return;
        } catch (err) {
            console.error(`❌ Redis connection attempt ${i + 1}/${maxRetries} failed:`, err.message);
            if (i === maxRetries - 1) {
                throw new Error('Failed to connect to Redis after multiple attempts');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

connectWithRetry().catch(err => {
    console.error('❌ Failed to initialize Redis connection:', err);
    process.exit(1);
});

const get = async (key) => {
    try {
        if (!client.isOpen) {
            console.warn('Redis client not connected, attempting to reconnect...');
            await connectWithRetry();
        }
        
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error(`Redis GET error for key ${key}:`, err);
        return null;
    }
};

const set = async (key, value, ttlSeconds = 300) => {
    try {
        if (!client.isOpen) {
            console.warn('Redis client not connected, attempting to reconnect...');
            await connectWithRetry();
        }
        
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error(`Redis SET error for key ${key}:`, err);
        return false;
    }
};

const del = async (key) => {
    try {
        if (!client.isOpen) {
            console.warn('Redis client not connected, attempting to reconnect...');
            await connectWithRetry();
        }
        
        const result = await client.del(key);
        return result > 0;
    } catch (err) {
        console.error(`Redis DELETE error for key ${key}:`, err);
        return false;
    }
};


process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await client.quit();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Closing Redis connection...');
    await client.quit();
    process.exit(0);
});

module.exports = {
    get,
    set,
    del,
};