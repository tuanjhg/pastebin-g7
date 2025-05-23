// const amqp = require('amqplib');
// const pasteService = require('../services/paste.service');

// const connectWithRetry = async (retries = 5, delay = 3000) => {
//     for (let i = 0; i < retries; i++) {
//         try {
//             const connection = await amqp.connect('amqp://rabbitmq');
//             console.log('[RabbitMQ] Connected successfully');
//             return connection;
//         } catch (err) {
//             console.error(`[RabbitMQ] Connection failed (${i + 1}/${retries}):`, err.message);
//             if (i === retries - 1) throw err;
//             await new Promise(res => setTimeout(res, delay));
//         }
//     }
// };

// const consumeQueue = async () => {
//     const connection = await connectWithRetry();
//     const channel = await connection.createChannel();

//     await channel.assertQueue('paste_queue', { durable: true });

//     channel.consume('paste_queue', async (msg) => {
//         if (!msg) return;

//         try {
//             const content = JSON.parse(msg.content.toString());

//             if (content.action === 'createPaste') {
//                 console.log('[RabbitMQ] Creating paste:', content.data);

//                 const result = await pasteService.createPaste(content.data);

//                 const response = {
//                     status: 'success',
//                     pasteId: result.id || result._id || null,
//                 };

//                 if (msg.properties.replyTo) {
//                     channel.sendToQueue(
//                         msg.properties.replyTo,
//                         Buffer.from(JSON.stringify(response)),
//                         {
//                             correlationId: msg.properties.correlationId,
//                         }
//                     );
//                 }
//             }
//         } catch (err) {
//             console.error('[RabbitMQ] Error handling message:', err);
//         } finally {
//             channel.ack(msg);
//         }
//     });

//     console.log('[Paste Service] Consumer with RPC support started');
// };

// module.exports = { consumeQueue };
const { initPubSub, consumeMessages } = require('../services/pubsub');

const startConsumer = async () => {
    try {
        console.log('[Pub/Sub] Initializing Google Cloud Pub/Sub...');
        await initPubSub();
        
        console.log('[Pub/Sub] Starting message consumer...');
        await consumeMessages();
        
        console.log('[Paste Service] Consumer with Pub/Sub started successfully');
    } catch (error) {
        console.error('[Pub/Sub] Failed to start consumer:', error);
        throw error;
    }
};

module.exports = { startConsumer };