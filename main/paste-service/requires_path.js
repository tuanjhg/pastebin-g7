const controller = require('./controller');
const db = require('../paste-service/db');
const pasteService = require('./services/paste.service');
const cleanupService = require('./services/cleanup.service');

module.exports = {
    controller,
    db,
    pasteService,
    cleanupService,
};