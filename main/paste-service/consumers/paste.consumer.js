const amqp = require('amqplib');
const pasteService = require('../services/paste.service');

const consumeQueue = async () => {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();

    await channel.assertQueue('paste_queue', { durable: true });

    channel.consume('paste_queue', async (msg) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString());

            if (content.action === 'createPaste') {
                console.log('[RabbitMQ] Creating paste:', content.data);

                // Gọi service xử lý
                const result = await pasteService.createPaste(content.data);

                // Chuẩn bị dữ liệu phản hồi
                const response = {
                    status: 'success',
                    pasteId: result.id || result._id || null, // tuỳ vào bạn dùng DB gì
                };

                // Gửi phản hồi nếu có replyTo
                if (msg.properties.replyTo) {
                    channel.sendToQueue(
                        msg.properties.replyTo,
                        Buffer.from(JSON.stringify(response)),
                        {
                            correlationId: msg.properties.correlationId,
                        }
                    );
                }
            }
        } catch (err) {
            console.error('[RabbitMQ] Error handling message:', err);
            // Có thể trả lỗi về client nếu cần
        } finally {
            channel.ack(msg); // đảm bảo ack dù thành công hay lỗi
        }
    });

    console.log('[Paste Service] Consumer with RPC support started');
};

module.exports = { consumeQueue };
