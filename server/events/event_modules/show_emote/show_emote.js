import { getEmoteImage } from '../../../7tv/7tv.js';
import * as config from './config.js'
import sizeOf from 'image-size';
import { randomInt } from 'crypto';
import { broadcastOverlayEvent } from '../../../websocket.js';

export default {
    lastTriggered: 0,
    name: 'show_emote',
    isEnabled: true,
    cooldown: 0,
    durationMin: 3000,
    durationMax: 6000,

    reloadConfig() {
        const cfg = config.getConfig();
        this.isEnabled = cfg.isEnabled;
        this.cooldown = cfg.cooldown;
        this.durationMin = cfg.durationMin;
        this.durationMax = cfg.durationMax;
    },

    shouldTrigger({ messageData }) {
        return messageData.emotes.length > 0;
    },

    trigger({ messageData }) {
        const emote = messageData.emotes[randomInt(0, messageData.emotes.length)];
        const emoteId = emote.key;

        const imageBuffer = getEmoteImage(emoteId);

        if (!imageBuffer) {
            console.error(`[${this.name}]Couldn't find an image with id ${emoteId}`);
            return;
        }

        const dimensions = sizeOf(imageBuffer);
        const base64 = imageBuffer.toString('base64');
        const x = randomInt(0, 1920 - dimensions.width);
        const y = randomInt(0, 1080 - dimensions.height);

        broadcastOverlayEvent({
            type: 'show_emote',
            id: emote.key,
            duration: randomInt(this.durationMin, this.durationMax),
            x,
            y,
            data: `data:image/webp;base64,${base64}`
        })
        console.log(`[${this.name}] Event triggered`);
    }
};