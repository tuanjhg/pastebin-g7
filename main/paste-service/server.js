require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { removeExpiredPastes } = require('./services/cleanup.service');
const { startConsumer } = require('./consumers/paste.consumer');

const app = express();
app.use(express.json());
app.use('/', require('./routes/paste.routes'));

cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running cleanup of expired pastes at 00:00');
    await removeExpiredPastes();
});

const PORT = process.env.PORT || 3001;

startConsumer()
    .then(() => {
        console.log('[Pub/Sub] Consumer started successfully');
        app.listen(PORT, () => {
            console.log(`Paste Service running on port ${PORT}`);
            console.log('✅ Ready to receive messages from Google Cloud Pub/Sub');
        });
    })
    .catch(err => {
        console.error('[Pub/Sub] Failed to start consumer:', err.message);
        process.exit(1); 
    });