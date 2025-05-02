const pasteService = require('../services/paste.service');

const createPaste = async (req, res) => {
    try {
        const {
            content,
            title = '',
            language = 'plaintext',
            expires_in,
            visibility = 'public'
        } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const result = await pasteService.createPaste({
            content: content.trim(),
            title: title.trim(),
            language: language.trim(),
            expiresIn: expires_in,
            visibility
        });

        return res.status(201).json({
            message: 'Paste created successfully',
            pasteId: result.id
        });
    } catch (error) {
        console.error('Error creating paste:', error);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

const getPaste = async (req, res) => {
    try {
        const result = await pasteService.getPasteById(req.params.id);

        if (result.status === 'not_found') {
            return res.status(404).json({
                error: 'Paste not found',
                pasteId: req.params.id
            });
        }

        return res.status(200).json({ paste: result.paste });
    } catch (error) {
        console.error(`Error retrieving paste ${req.params.id}:`, error.message);
        return res.status(500).json({
            error: error.message,
            pasteId: req.params.id
        });
    }
};

const getPublicPastes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await pasteService.getPublicPastes(page);
        return res.status(200).json({
            pastes: result.pastes,
            pagination: result.pagination
        });
    } catch (error) {
        console.error(`Error fetching public pastes (page ${req.query.page}):`, error.message);
        return res.status(500).json({
            pastes: [],
            error: error.message,
            page: req.query.page
        });
    }
};

const showCreateForm = (req, res) => {
    // Đây là API-only, nên chỉ trả JSON để frontend render form
    return res.status(200).json({ message: 'This endpoint supports paste creation via POST.' });
};

const getMonthlyStats = async (req, res) => {
    try {
        let month = req.params.month;

        if (!month) {
            const now = new Date();
            const year = now.getFullYear();
            const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
            month = `${year}-${currentMonth}`;
        }

        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
        }

        const stats = await pasteService.getMonthlyStats(month);
        return res.status(200).json({ stats });
    } catch (error) {
        console.error(`Error fetching stats for month ${req.params.month}:`, error.message);
        return res.status(500).json({
            error: error.message || 'Failed to fetch statistics',
            month: req.params.month
        });
    }
};

module.exports = {
    createPaste,
    getPaste,
    getPublicPastes,
    showCreateForm,
    getMonthlyStats
};
