import * as config from './config.js'

import { randomInt } from 'crypto';

export default {
    name: 'show_emote',
    lastTriggered: 0,
    cooldown: 0,
    durationMin: 3000,
    durationMax: 6000,

    reloadConfig() {
        const cfg = config.getConfig();
        this.cooldown = cfg.cooldown;
        this.durationMin = cfg.durationMin;
        this.durationMax = cfg.durationMax;
    },

    shouldTrigger({ messageData }) {
        return messageData.emotes.length > 0;
    },

    trigger({ messageData, apiLink }) {
        const emote = messageData.emotes[randomInt(0, messageData.emotes.length)];
        fetch(`${apiLink}/showEmote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: emote.key,
                duration: randomInt(this.durationMin, this.durationMax)
            })
        });
        console.log(`[${this.name}] Event triggered`);
    }
};