import WebSocket from 'ws'
import 'dotenv/config'

import * as oauth from './oauth.js';
import { parseMessage } from './messageParser.js';
import { handleMessageEvents } from '../events/events.js';
import { processCommand } from './commands/commandsController.js';

export const API_URL = `http://localhost:${process.env.SERVER_PORT}/api`;

const BOT_ID = process.env.TWITCH_BOT_USER_ID;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CHANNEL_ID = process.env.TWITCH_CHANNEL_ID;

const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';

if (!BOT_ID || !CLIENT_ID || !CHANNEL_ID) {
    console.error('Missing .env values. Please set TWITCH_BOT_USER_ID, TWITCH_CLIENT_ID, TWITCH_CHANNEL_ID.');
    process.exit(1);
}

let websocketSessionID;
let userToken;
let appToken;

(async () => {
    // Verify that the authentication is valid
    userToken = await oauth.getAuth();
    appToken = await oauth.getAppAccessToken();

    // Start WebSocket client and register handlers
    const websocketClient = startWebSocketClient();
})();

function startWebSocketClient() {
    let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);

    websocketClient.on('error', console.error);

    websocketClient.on('open', () => {
        console.log('WebSocket connection opened to ' + EVENTSUB_WEBSOCKET_URL);
    });

    websocketClient.on('message', (data) => {
        handleWebSocketMessage(JSON.parse(data.toString()));
    });

    return websocketClient;
}

function handleWebSocketMessage(data) {
    switch (data.metadata.message_type) {
        case 'session_welcome':
            websocketSessionID = data.payload.session.id;
            registerEventSubListeners();
            break;
        case 'session_reconnect':
        case 'revocation':
            console.log(`Unhandled websocket message type ${data.metadata.message_type} , connection most likely terminated`);
        case 'notification':
            switch (data.metadata.subscription_type) {
                case 'channel.chat.message':
                    handleChatMessage(data.payload.event)
                    break;
            }
            break;
    }
}

async function handleChatMessage(data) {
    const messageData = await parseMessage(data);
    handleMessageEvents({
        messageData: messageData,
        apiLink: API_URL
    });

    if (messageData.type === 'command') {
        processCommand({ role: messageData.role, ...messageData.command })
    }
}

export async function sendMessage(text) {
    let response = await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + appToken,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            broadcaster_id: CHANNEL_ID,
            sender_id: BOT_ID,
            message: text
        })
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error('Failed to send a chat message, API call returned status code ' + response.status);
        console.error(data);
    } else {
        console.log(`Sent a chat message`);
    }
}

async function registerEventSubListeners() {
    let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userToken,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'channel.chat.message',
            version: '1',
            condition: {
                broadcaster_user_id: CHANNEL_ID,
                user_id: BOT_ID
            },
            transport: {
                method: 'websocket',
                session_id: websocketSessionID
            }
        })
    });

    if (response.status != 202) {
        let data = await response.json();
        console.error('Failed to subscribe to channel.chat.message. API call returned status code ' + response.status);
        console.error(data);
        process.exit(1);
    } else {
        const data = await response.json();
        console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
    }
}