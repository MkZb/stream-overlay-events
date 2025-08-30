import WebSocket from 'ws'
import 'dotenv/config'
import fs from 'fs';
import path from 'path';
//dotenv.config({ path: 'bot/.env' })

//const player = require('play-sound')();

let config = await import('./config.js');
const API_URL = 'http://localhost:3001/api';

const BOT_ID = process.env.TWITCH_BOT_USER_ID;
const TOKEN = process.env.TWITCH_OAUTH_TOKEN;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;

const CHANNEL_ID = process.env.TWITCH_CHANNEL_ID;

const EVENTSUB_WEBSOCKET_URL = 'wss://eventsub.wss.twitch.tv/ws';

if (!BOT_ID || !TOKEN || !CLIENT_ID || !CHANNEL_ID) {
    console.error('Missing .env values. Please set TWITCH_BOT_USER_ID, TWITCH_OAUTH_TOKEN, TWITCH_CLIENT_ID, TWITCH_CHANNEL_ID.');
    process.exit(1);
}

let websocketSessionID;

(async () => {
    // Verify that the authentication is valid
    await getAuth();

    // Start WebSocket client and register handlers
    const websocketClient = startWebSocketClient();
})();

async function getAuth() {
    let response = await fetch('https://id.twitch.tv/oauth2/validate', {
        method: 'GET',
        headers: {
            'Authorization': 'OAuth ' + TOKEN
        }
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error("Token is not valid. /oauth2/validate returned status code " + response.status);
        console.error(data);
        handleExpiredToken();
        process.exit(1);
    }

    console.log("Validated token.");
}

async function handleExpiredToken() {
    let response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TOKEN,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            broadcaster_id: CHANNEL_ID,
            sender_id: BOT_ID,
            message: chatMessage
        })
    });
}

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
        case 'notification':
            switch (data.metadata.subscription_type) {
                case 'channel.chat.message':
                    handleChatMessageEvent(data.payload.event)
                    break;
            }
            break;
    }
}

function handleChatMessageEvent(data) {
    console.log(`MSG #${data.broadcaster_user_login} <${data.chatter_user_login}> ${data.message.text}`);
    console.log(config.getConfig());

    if (data.message.text.trim() == "!test") {
        //sendChatMessage("test");
        fetch(`${API_URL}/trigger-sound`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sound: 'Boink.mp3' })
        });
    }
}

async function sendChatMessage(chatMessage) {
    let response = await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TOKEN,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            broadcaster_id: CHANNEL_ID,
            sender_id: BOT_ID,
            message: chatMessage
        })
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error("Failed to send chat message");
        console.error(data);
    } else {
        console.log("Sent chat message: " + chatMessage);
    }
}

async function registerEventSubListeners() {
    let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TOKEN,
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
        console.error("Failed to subscribe to channel.chat.message. API call returned status code " + response.status);
        console.error(data);
        process.exit(1);
    } else {
        const data = await response.json();
        console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
    }
}