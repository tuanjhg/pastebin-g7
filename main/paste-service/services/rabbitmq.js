const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

let channel;
let responseQueue;
const pendingResponses = new Map();

const connectRabbitMQ = async () => {
    const connection = await amqp.connect('amqp://rabbitmq');
    channel = await connection.createChannel();

    // Queue để gửi message chính
    await channel.assertQueue('paste_queue', { durable: true });

    // Queue tạm để nhận phản hồi
    const { queue } = await channel.assertQueue('', { exclusive: true });
    responseQueue = queue;

    // Lắng nghe phản hồi từ server
    channel.consume(responseQueue, (msg) => {
        const correlationId = msg.properties.correlationId;
        const resolve = pendingResponses.get(correlationId);
        if (resolve) {
            const response = JSON.parse(msg.content.toString());
            resolve(response);
            pendingResponses.delete(correlationId);
        }
    }, { noAck: true });

    console.log('✅ RabbitMQ connected and reply listener ready');
};

const sendToQueueWithResponse = async (data) => {
    if (!channel) throw new Error('RabbitMQ not connected');

    const correlationId = uuidv4();

    const response = new Promise((resolve) => {
        pendingResponses.set(correlationId, resolve);

        channel.sendToQueue('paste_queue', Buffer.from(JSON.stringify(data)), {
            replyTo: responseQueue,
            correlationId: correlationId,
            persistent: true,
        });
    });

    return response; // trả về Promise, đợi server phản hồi
};

module.exports = { connectRabbitMQ, sendToQueueWithResponse };
