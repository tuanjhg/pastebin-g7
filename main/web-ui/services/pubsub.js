const { PubSub } = require('@google-cloud/pubsub');
const { v4: uuidv4 } = require('uuid');

const pubsub = new PubSub({
    projectId: process.env.GCP_PROJECT_ID,
});

const TOPIC_NAME = 'paste-topic';
const RESPONSE_TOPIC_PREFIX = 'paste-response-';

const initPubSub = async () => {
    try {

        const topic = pubsub.topic(TOPIC_NAME);
        const [exists] = await topic.exists();
        
        if (!exists) {
            await topic.create();
            console.log(`✅ Topic ${TOPIC_NAME} created`);
        }
        
        console.log('✅ Web UI Pub/Sub initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Pub/Sub:', error);
        throw error;
    }
};

const sendToQueueWithResponse = async (data, timeoutMs = 30000) => {
    try {
        const correlationId = uuidv4();
        const responseTopicName = `${RESPONSE_TOPIC_PREFIX}${correlationId}`;
        
        const responseTopic = pubsub.topic(responseTopicName);
        await responseTopic.create();
        
   
        const responseSubscription = responseTopic.subscription(`sub-${correlationId}`);
        await responseSubscription.create({
            messageRetentionDuration: 300,
            expirationPolicy: {
                ttl: 600 
            }
        });

        const responsePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Request timeout'));
            }, timeoutMs);

            const cleanup = async () => {
                clearTimeout(timeout);
                try {
                    await responseSubscription.delete();
                    await responseTopic.delete();
                } catch (err) {
                    console.warn('Cleanup warning:', err.message);
                }
            };

            const messageHandler = async (message) => {
                try {
                    if (message.attributes.correlationId === correlationId) {
                        const response = JSON.parse(message.data.toString());
                        message.ack();
                        await cleanup();
                        resolve(response);
                    } else {
                        message.nack();
                    }
                } catch (error) {
                    message.nack();
                    await cleanup();
                    reject(error);
                }
            };

            responseSubscription.on('message', messageHandler);
            responseSubscription.on('error', (error) => {
                cleanup();
                reject(error);
            });
        });

        const topic = pubsub.topic(TOPIC_NAME);
        const messageData = {
            ...data,
            replyTo: responseTopicName,
            correlationId: correlationId,
            timestamp: new Date().toISOString()
        };

        await topic.publishMessage({
            data: Buffer.from(JSON.stringify(messageData)),
            attributes: {
                correlationId: correlationId,
                action: data.action || 'unknown'
            }
        });

        console.log(`[Pub/Sub] Message sent with correlationId: ${correlationId}`);
        return await responsePromise;
        
    } catch (error) {
        console.error('[Pub/Sub] Error sending message with response:', error);
        throw error;
    }
};

module.exports = {
    initPubSub,
    sendToQueueWithResponse
};