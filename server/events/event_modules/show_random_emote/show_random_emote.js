import { randomInt } from 'crypto';

export default {
    name: 'showRandomEmote',
    cooldown: 30000,
    lastTriggered: 0,

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
                duration: randomInt(3000, 5000)
            })
        });
    }
};