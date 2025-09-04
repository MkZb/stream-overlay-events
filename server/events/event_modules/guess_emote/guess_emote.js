import getChannelEmotes from '../../../7tv/7tv.js';
import * as config from './config.js'
import { randomInt } from 'crypto';

export default {
    lastTriggered: 0,
    name: 'guess_emote',
    isEnabled: true,
    cooldown: 10 * 60 * 1000,
    duration: 1 * 60 * 1000,
    x: 0,
    y: 0,

    activeGame: null,

    reloadConfig() {
        const cfg = config.getConfig();
        this.isEnabled = cfg.isEnabled;
        this.cooldown = cfg.cooldown;
        this.duration = cfg.duration;
        this.x = cfg.x;
        this.y = cfg.y;
    },

    shouldTrigger(context) {
        return this.isEnabled;
    },

    trigger({ apiLink }) {
        const gameId = Date.now().toString();

        // Pick random image/answer
        const channelEmotes = Object.entries(getChannelEmotes());
        if (!channelEmotes) {
            console.warn('No channel emotes found');
            return;
        }
        const emoteEntry = channelEmotes[randomInt(0, channelEmotes.length)];
        const emoteId = emoteEntry[0];
        const emoteData = emoteEntry[1];

        const game = {
            answer: emoteData.name,
            id: `${emoteId}`,
            expiresAt: Date.now() + this.duration
        };

        this.activeGame = game;

        fetch(`${apiLink}/guessEmote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'guess_emote',
                id: game.id,
                duration: this.duration,
                x: this.x,
                y: this.y
            })
        });

        console.log(`[${this.name}] Game started. Current answer: ${this.activeGame.answer}`);
    },

    onMessage({ messageData, apiLink }) {
        if (!this.activeGame) return;
        if (Date.now() > this.activeGame.expiresAt) {
            this.activeGame = null; // expired
            return;
        }

        if (messageData.emotes.some(obj => obj.word === this.activeGame.answer)) {
            // Correct guess
            fetch(`${apiLink}/overlay/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'guess_update',
                    id: this.activeGame.id,
                    answer: this.activeGame.answer,
                    user: messageData.username,
                })
            });

            console.log(`[${this.name}] ${messageData.username} guessed correctly!`);
            this.activeGame = null;
        }
    }
};