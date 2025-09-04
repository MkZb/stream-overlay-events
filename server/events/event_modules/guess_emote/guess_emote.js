import getChannelEmotes, { getEmoteImage, getRandomEmote } from '../../../7tv/7tv.js';
import { broadcastOverlayEvent } from '../../../websocket.js';
import * as config from './config.js'
import { randomInt } from 'crypto';

export default {
    lastTriggered: 0,
    name: 'guess_emote',
    isEnabled: true,
    cooldown: 10 * 60 * 1000,
    duration: 1 * 60 * 1000,
    revealTime: 15 * 1000,
    x: 0,
    y: 0,

    activeGame: null,

    reloadConfig() {
        const cfg = config.getConfig();
        this.isEnabled = cfg.isEnabled;
        this.cooldown = cfg.cooldown > cfg.duration ? cfg.cooldown : cfg.duration;
        this.duration = cfg.duration;
        this.revealTime = cfg.revealTime;
        this.x = cfg.x;
        this.y = cfg.y;
    },

    shouldTrigger(context) {
        return this.isEnabled;
    },

    trigger(context) {
        const gameId = Date.now().toString();

        const { id, data } = getRandomEmote();

        if (!id) {
            console.warn('No channel emotes found');
            return;
        }

        const game = {
            answer: data.name,
            id,
            expiresAt: Date.now() + this.duration
        };

        this.activeGame = game;

        const imageBuffer = getEmoteImage({ id });
        if (!imageBuffer) {
            console.error(`[${this.name}]Couldn't find an image with id ${id}`);
            return;
        }
        const base64 = imageBuffer.toString('base64');

        broadcastOverlayEvent({
            type: 'guess_emote',
            id: game.id,
            duration: this.duration,
            revealTime: this.revealTime,
            x: this.x,
            y: this.y,
            data: `data:image/webp;base64,${base64}`
        });

        console.log(`[${this.name}] Game started. Current answer: ${this.activeGame.answer}`);
    },

    onMessage({ messageData }) {
        if (!this.activeGame) return;
        if (Date.now() > this.activeGame.expiresAt) {
            this.activeGame = null; // expired
            return;
        }

        if (messageData.emotes.some(obj => obj.word === this.activeGame.answer)) {
            // Correct guess
            broadcastOverlayEvent({
                type: 'guess_update',
                id: this.activeGame.id,
                answer: this.activeGame.answer,
                user: messageData.username,
            });

            console.log(`[${this.name}] ${messageData.username} guessed correctly!`);
            this.activeGame = null;
        }
    }
};