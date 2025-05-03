const express = require('express');
const router = express.Router();
const pasteService = require('../services/paste.service');

// Hiển thị trang tạo paste
router.get('/', (req, res) => {
    res.render('index', { error: null });
});

// Tạo paste mới
router.post('/paste', async (req, res) => {
    try {
        const { content, title = '', expires_in, visibility = 'PUBLIC' } = req.body;

        if (!content?.trim()) {
            return res.status(400).render('index', { error: 'Content is required' });
        }

        const result = await pasteService.createPaste({
            content: content.trim(),
            title: title.trim(),
            expiresIn: expires_in,  // xử lý giá trị như "0.2"
            privacy: visibility.trim()          // truyền đúng `privacy` chứ không phải `visibility`
        });

        return res.redirect(302, `/paste/${result.pasteId}`);
    } catch (error) {
        console.error('Error creating paste:', error.message);
        return res.status(500).render('index', {
            error: 'Server error. Please try again later.'
        });
    }
});

// Hiển thị paste
router.get('/paste/:id', async (req, res) => {
    try {
        const paste = await pasteService.getPasteById(req.params.id);
        res.render('paste_detail', { paste, error: null });
    } catch (error) {
        console.error('Failed to get paste:', error.message);
        res.render('paste_detail', { error: error.message });
    }
});

// Trang public pastes
router.get('/public', async (req, res) => {
    try {
        const { pastes, pagination } = await pasteService.getPublicPastes(req.query.page || 1);
        res.render('paste_list', { pastes, pagination, error: null });
    } catch (error) {
        console.error('Failed to create paste:', error.message);
       // res.render('public', { pastes: [], pagination: null, error: error.message });
    }
});

// Trang thống kê theo tháng
router.get('/stats/:month?', async (req, res) => {
    try {
        const stats = await pasteService.getMonthlyStats(req.params.month);
        res.render('monthly_stats', { stats, error: null });
    } catch (error) {
        console.error('Failed to create paste:', error.message);
       // res.render('monthly_stats', { stats: null, error: error.message });
    }
});

module.exports = router;
