import 'dotenv/config'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import https from 'https'
import fs from 'fs'

const SERVER_PORT = process.env.SERVER_PORT || 3001;
const EVENTSUB_PORT = 443;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const eventSubApp = express();
const serverApp = express();

serverApp.use(express.static(path.join(__dirname, '../ui/build')));
//serverApp.use(cors());
serverApp.use(express.json());

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();
const SUBSCRIPTION_TYPE = 'Twitch-Eventsub-Subscription-Type'.toLowerCase();

// Notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
const MESSAGE_TYPE_NOTIFICATION = 'notification';
const MESSAGE_TYPE_REVOCATION = 'revocation';

// Prepend this string to the HMAC that's created from the message
const HMAC_PREFIX = 'sha256=';

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
}

eventSubApp.post('/eventsub',
    express.raw({ type: 'application/json' }),
    (req, res) => {
        let message = getHmacMessage(req);
        let hmac = HMAC_PREFIX + getHmac(CLIENT_SECRET, message);

        if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
            console.log("signatures match");

            let notification = JSON.parse(req.body);

            if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
                // TODO: Do something with the event's data.

                console.log(`Event type: ${notification.subscription.type}`);
                console.log(JSON.stringify(notification.event, null, 4));

                res.sendStatus(204);
            }
            else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
                res.set('Content-Type', 'text/plain').status(200).send(notification.challenge);
            }
            else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
                res.sendStatus(204);

                console.log(`${notification.subscription.type} notifications revoked!`);
                console.log(`reason: ${notification.subscription.status}`);
                console.log(`condition: ${JSON.stringify(notification.subscription.condition, null, 4)}`);
            }
            else {
                res.sendStatus(204);
                console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
            }
        }
        else {
            console.log('403');    // Signatures didn't match.
            res.sendStatus(403);
        }
    })

// Build the message used to get the HMAC.
function getHmacMessage(request) {
    return (request.headers[TWITCH_MESSAGE_ID] +
        request.headers[TWITCH_MESSAGE_TIMESTAMP] +
        request.body);
}

// Get the HMAC.
function getHmac(secret, message) {
    return crypto.createHmac('sha256', secret)
        .update(message)
        .digest('hex');
}

// Verify whether our hash matches the hash that Twitch passed in the header.
function verifyMessage(hmac, verifySignature) {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
}

https.createServer(sslOptions, eventSubApp).listen(EVENTSUB_PORT, () => {
    console.log(`Event server listening on port ${EVENTSUB_PORT}`);
});

serverApp.listen(SERVER_PORT, () => {
    console.log(`Server listening on port ${SERVER_PORT}`);
});