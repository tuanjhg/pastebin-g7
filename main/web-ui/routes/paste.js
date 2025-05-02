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
        const result = await pasteService.createPaste(req.body);
        res.redirect(`/paste/${result.id}`);
    } catch (error) {
        console.error('Failed to create paste:', error.message);
        res.render('create_paste', { error: error.message || 'Server error' });
    }
});

// Hiển thị paste
router.get('/paste/:id', async (req, res) => {
    try {
        const paste = await pasteService.getPasteById(req.params.id);
        res.render('paste', { paste, error: null });
    } catch (error) {
        console.error('Failed to get paste:', error.message);
        res.render('paste_list', { error: error.message });
    }
});

// Trang public pastes
router.get('/public', async (req, res) => {
    try {
        const { pastes, pagination } = await pasteService.getPublicPastes(req.query.page || 1);
        res.render('public', { pastes, pagination, error: null });
    } catch (error) {
        res.render('public', { pastes: [], pagination: null, error: error.message });
    }
});

// Trang thống kê theo tháng
router.get('/stats/:month?', async (req, res) => {
    try {
        const stats = await pasteService.getMonthlyStats(req.params.month);
        res.render('stats', { stats, error: null });
    } catch (error) {
        res.render('monthly_stats', { stats: null, error: error.message });
    }
});

module.exports = router;
