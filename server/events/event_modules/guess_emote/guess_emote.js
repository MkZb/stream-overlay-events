import * as config from './config.js'

export default {
    lastTriggered: 0,
    name: 'guess_emote',
    isEnabled: true,
    cooldown: 10 * 60 * 1000,
    duration: 1 * 60 * 1000,
    x: 0,
    y: 0,

    reloadConfig() {
        const cfg = config.getConfig();
        this.isEnabled = cfg.isEnabled;
        this.cooldown = cfg.cooldown;
        this.duration = cfg.duration;
        this.x = cfg.x;
        this.y = cfg.y;
    },

    shouldTrigger(context) {
        return true;
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