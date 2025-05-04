const db = require('./db');
const { nanoid } = require('nanoid');
const cache = require('./services/cache');

class Paste {
    static async create({ content, title = 'Untitled', expiresIn, privacy = 'PUBLIC' }) {
        const expirationTime = expiresIn && !isNaN(expiresIn)
            ? new Date(Date.now() + expiresIn * 60 * 1000)
            : null;

        for (let i = 0; i < 10; i++) {
            const id = nanoid(8);
            try {
                await db.query(
                    'INSERT INTO paste (id, content, title, expires_at, privacy) VALUES (?, ?, ?, ?, ?)',
                    [id, content, title, expirationTime, privacy]
                );
                return { id };
            } catch (err) {
                if (err.code !== 'ER_DUP_ENTRY') throw err;
            }
        }
        throw new Error('Failed to insert unique paste after multiple attempts');
    }

    static async getById(id) {
        try {
            const paste = await this.getPasteData(id);
            if (!paste || (paste.expires_at && new Date(paste.expires_at) <= new Date())) {
                return { status: 'not_found' };
            }

            await this.incrementViews(id);
            return { status: 'active', paste };
        } catch (err) {
            console.error('Error fetching paste:', err);
            return { status: 'error', message: 'Something went wrong' };
        }
    }

    static async getPasteData(id) {
        const [rows] = await db.query(
            `SELECT id, content, title, created_at, expires_at, views, privacy 
             FROM paste WHERE id = ? LIMIT 1`, [id]
        );
        return rows[0] || null;
    }

    static async incrementViews(id) {
        try {
            await db.query(
                'UPDATE paste SET views = views + 1 WHERE id = ? LIMIT 1', [id]
            );
        } catch (err) {
            console.error('Error incrementing views:', err);
        }
    }

    static async syncViewsFromRedis() {
        const [rows] = await db.query('SELECT id FROM paste');
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            for (const { id } of rows) {
                const key = `paste:${id}:views`;
                const count = parseInt(await cache.get(key), 10);
                if (!isNaN(count) && count > 0) {
                    await conn.query('UPDATE paste SET views = views + ? WHERE id = ? LIMIT 1', [count, id]);
                    await cache.del(key);
                }
            }
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            console.error('Failed to sync Redis views:', err);
        } finally {
            conn.release();
        }
    }

    static async getPublic(page = 1, limit = 6) {
        const offset = (page - 1) * limit;

        const [pastes] = await db.query(
            `SELECT id, title, created_at 
             FROM paste 
             WHERE privacy = 'public' AND (expires_at IS NULL OR expires_at > NOW()) 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`, [limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total 
             FROM paste 
             WHERE privacy = 'public' AND (expires_at IS NULL OR expires_at > NOW())`
        );

        return {
            pastes,
            pagination: {
                page,
                limit,
                totalPastes: total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getMonthlyStats(month) {
        const [[stats]] = await db.query(
            `SELECT 
                COUNT(*) AS totalPastes,
                COALESCE(SUM(views), 0) AS totalViews,
                COALESCE(ROUND(AVG(views)), 0) AS avgViewsPerPaste,
                COALESCE(MIN(views), 0) AS minViews,
                COALESCE(MAX(views), 0) AS maxViews,
                SUM(CASE WHEN expires_at IS NULL OR expires_at > NOW() THEN 1 ELSE 0 END) AS activePastes,
                SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 ELSE 0 END) AS expiredPastes
             FROM paste 
             WHERE created_month = ?`, [month]
        );

        return { month, ...stats };
    }
}

module.exports = Paste;
