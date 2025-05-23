const { PubSub } = require('@google-cloud/pubsub');
const { v4: uuidv4 } = require('uuid');

const pubsub = new PubSub({
    projectId: process.env.GCP_PROJECT_ID,
});

const TOPIC_NAME = 'paste-topic';
const SUBSCRIPTION_NAME = 'paste-subscription';
const RESPONSE_TOPIC_PREFIX = 'paste-response-';

let responseSubscription;
const pendingResponses = new Map();

const initPubSub = async () => {
    try {
        const [topics] = await pubsub.getTopics();
        const topicExists = topics.some(topic => topic.name.includes(TOPIC_NAME));
        
        if (!topicExists) {
            await pubsub.createTopic(TOPIC_NAME);
            console.log(`Topic ${TOPIC_NAME} created`);
        }

        const topic = pubsub.topic(TOPIC_NAME);
        const [subscriptions] = await topic.getSubscriptions();
        const subscriptionExists = subscriptions.some(sub => sub.name.includes(SUBSCRIPTION_NAME));

        if (!subscriptionExists) {
            await topic.createSubscription(SUBSCRIPTION_NAME);
            console.log(`Subscription ${SUBSCRIPTION_NAME} created`);
        }

        console.log('✅ Pub/Sub initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Pub/Sub:', error);
        throw error;
    }
};


const consumeMessages = async () => {
    const subscription = pubsub.subscription(SUBSCRIPTION_NAME);
    
    const messageHandler = async (message) => {
        try {
            const data = JSON.parse(message.data.toString());
            console.log('[Pub/Sub] Received message:', data);

            if (data.action === 'createPaste') {
                const pasteService = require('./paste.service');
                const result = await pasteService.createPaste(data.data);

                const response = {
                    status: 'success',
                    pasteId: result.id || result._id || null,
                };

                if (data.replyTo && data.correlationId) {
                    const responseTopic = pubsub.topic(data.replyTo);
                    await responseTopic.publishMessage({
                        data: Buffer.from(JSON.stringify(response)),
                        attributes: {
                            correlationId: data.correlationId
                        }
                    });
                }
            }

            message.ack();
        } catch (error) {
            console.error('[Pub/Sub] Error processing message:', error);
            message.nack();
        }
    };

    subscription.on('message', messageHandler);
    subscription.on('error', error => {
        console.error('[Pub/Sub] Subscription error:', error);
    });

    console.log('[Pub/Sub] Consumer started, listening for messages...');
};


const sendToQueueWithResponse = async (data, timeoutMs = 30000) => {
    try {
        const correlationId = uuidv4();
        const responseTopicName = `${RESPONSE_TOPIC_PREFIX}${correlationId}`;
        
    
        const responseTopic = pubsub.topic(responseTopicName);
        const [responseTopicExists] = await responseTopic.exists();
        if (!responseTopicExists) {
            await responseTopic.create();
        }

   
        const responseSubscription = responseTopic.subscription(`sub-${correlationId}`);
        const [responseSubExists] = await responseSubscription.exists();
        if (!responseSubExists) {
            await responseSubscription.create();
        }

        
        const responsePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, timeoutMs);

            const messageHandler = (message) => {
                try {
                    if (message.attributes.correlationId === correlationId) {
                        const response = JSON.parse(message.data.toString());
                        clearTimeout(timeout);
                        resolve(response);
                        message.ack();
                        
                        // Cleanup
                        responseSubscription.delete().catch(console.error);
                        responseTopic.delete().catch(console.error);
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                    message.nack();
                }
            };

            responseSubscription.on('message', messageHandler);
        });

        
        const topic = pubsub.topic(TOPIC_NAME);
        const messageData = {
            ...data,
            replyTo: responseTopicName,
            correlationId: correlationId
        };

        await topic.publishMessage({
            data: Buffer.from(JSON.stringify(messageData))
        });

        return await responsePromise;
    } catch (error) {
        console.error('[Pub/Sub] Error sending message with response:', error);
        throw error;
    }
};


const publishMessage = async (data) => {
    try {
        const topic = pubsub.topic(TOPIC_NAME);
        await topic.publishMessage({
            data: Buffer.from(JSON.stringify(data))
        });
        console.log('[Pub/Sub] Message published successfully');
    } catch (error) {
        console.error('[Pub/Sub] Error publishing message:', error);
        throw error;
    }
};

module.exports = {
    initPubSub,
    consumeMessages,
    sendToQueueWithResponse,
    publishMessage
};