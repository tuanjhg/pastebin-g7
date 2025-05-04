require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { removeExpiredPastes } = require('./services/cleanup.service');
const { consumeQueue } = require('./consumers/paste.consumer');

const app = express();
app.use(express.json());
app.use('/', require('./routes/paste.routes'));

// 🕛 Cron job: chạy lúc 0h00 mỗi ngày
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running cleanup of expired pastes at 00:00');
    await removeExpiredPastes();
});

const PORT = process.env.PORT || 3001;

// ✅ Khởi động server chỉ sau khi RabbitMQ kết nối thành công
consumeQueue()
    .then(() => {
        console.log('[RabbitMQ] Consumer started');
        app.listen(PORT, () => {
            console.log(`Paste Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('[RabbitMQ] Failed to connect:', err.message);
        process.exit(1); // Exit để Docker có thể restart container
    });
