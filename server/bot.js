import WebSocket from 'ws'
import 'dotenv/config'

import * as configModule from './config.js';
let config = configModule;
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

// TODO:
async function handleExpiredToken() {

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


// Track consecutive keyword streaks
let keywordStreaks = {};
let lastMatchedKeyword = null;

function handleChatMessageEvent(data) {
    const message = data.message.text.trim();
    const cfg = config.getConfig();
    let matchedKeyword = null;
    let matchedKeywordObj = null;

    // Find the first keyword that matches
    // Possibly change that to match all keywords, not sure yet
    for (const kw of cfg.keywords || []) {
        if (message.includes(kw.word)) {
            matchedKeyword = kw.word;
            matchedKeywordObj = kw;
            break;
        }
    }

    if (matchedKeyword) {
        // If same as last, increment, else reset
        if (lastMatchedKeyword === matchedKeyword) {
            keywordStreaks[matchedKeyword] = (keywordStreaks[matchedKeyword] || 0) + 1;
        } else {
            keywordStreaks[matchedKeyword] = 1;
        }
        lastMatchedKeyword = matchedKeyword;

        // Use per-keyword threshold or global
        const threshold = matchedKeywordObj.threshold || cfg.globalThreshold || 3;
        if (keywordStreaks[matchedKeyword] >= threshold) {
            // Play sound via API
            fetch(`${API_URL}/trigger-sound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sound: matchedKeywordObj.sound,
                    playbackSpeed: Math.random() * (2 - 0.5) + 0.5,
                    volume: matchedKeywordObj.volume
                })
            });
            keywordStreaks[matchedKeyword] = 0; // reset streak
        }
    } else {
        // No keyword matched, reset streaks
        lastMatchedKeyword = null;
        Object.keys(keywordStreaks).forEach(k => keywordStreaks[k] = 0);
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