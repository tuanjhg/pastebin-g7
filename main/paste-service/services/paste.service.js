const Paste = require('../models');
const cache = require('./cache');

const CACHE_TTL_SECONDS = 300; // TTL: 5 phút

const createPaste = async (pasteData) => {
    try {
        const newPaste = await Paste.create(pasteData);

        // Invalidate cached public pastes (ví dụ: các trang 1–5)
        for (let page = 1; page <= 5; page++) {
            await cache.del(`public_pastes:page:${page}`);
        }

        return newPaste;
    } catch (error) {
        console.error('Create paste error:', error);
        throw new Error('Failed to create paste');
    }
};

const getPasteById = async (id) => {
    const cacheKey = `paste:${id}`;

    try {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const paste = await Paste.getById(id);
        if (!paste) throw new Error('Paste not found');

        await cache.set(cacheKey, paste, CACHE_TTL_SECONDS);
        return paste;
    } catch (error) {
        console.error('Get paste by id error:', error);
        throw error;
    }
};

const getPublicPastes = async (page = 1) => {
    page = parseInt(page) || 1;
    if (page < 1) page = 1;

    const cacheKey = `public_pastes:page:${page}`;

    try {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const data = await Paste.getPublic(page, 6);
        await cache.set(cacheKey, data, CACHE_TTL_SECONDS);
        return data;
    } catch (error) {
        console.error('Get paste list error:', error);
        throw new Error('Failed to fetch pastes list');
    }
};

const getMonthlyStats = async (month) => {
    try {
        return await Paste.getMonthlyStats(month);
    } catch (error) {
        console.error('Get monthly stats error:', error);
        throw new Error('Failed to fetch monthly statistics');
    }
};



module.exports = {
    createPaste,
    getPasteById,
    getPublicPastes,
    getMonthlyStats
};
