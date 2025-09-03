import * as config from './config.js'

import { randomInt } from 'crypto';

export default {
    lastTriggered: 0,
    cooldown: 0,

    reloadConfig() {
        const cfg = config.getConfig();
        this.cooldown = cfg.cooldown;
    },

    shouldTrigger({ messageData }) {
        return messageData.emotes.length > 0;
    },

    trigger({ messageData, apiLink }) {
        const emote = messageData.emotes[randomInt(0, messageData.emotes.length)];
        fetch(`${apiLink}/showRandomEmote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: emote.key,
                duration: randomInt(3000, 6000)
            })
        });
    }
};