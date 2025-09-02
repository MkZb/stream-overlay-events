import * as config from './config.js'

const keywordStreaks = {};
let lastMatchedKeyword = null;

export default {
    name: 'voicedStreaks',
    cooldown: 0,
    lastTriggered: 0,

    shouldTrigger({ messageData }) {
        const cfg = config.getConfig();
        const text = messageData.message;

        let matchedKeyword = null;
        let matchedKeywordObj = null;

        // Checking for the first possible keyword to match
        const words = text.split(/\s+/);
        for (const kw of cfg.keywords || []) {
            if (words.includes(kw.word)) {
                matchedKeyword = kw.word;
                matchedKeywordObj = kw;
                break;
            }
        }

        if (!matchedKeyword) {
            // No match, reset streaks
            lastMatchedKeyword = null;
            Object.keys(keywordStreaks).forEach(k => keywordStreaks[k] = 0);
            return false;
        }

        // Handle streak counting
        if (lastMatchedKeyword === matchedKeyword) {
            keywordStreaks[matchedKeyword] = (keywordStreaks[matchedKeyword] || 0) + 1;
        } else {
            keywordStreaks[matchedKeyword] = 1;
        }
        lastMatchedKeyword = matchedKeyword;

        const threshold = matchedKeywordObj.threshold || cfg.globalThreshold || 3;

        // Only trigger if streak reached threshold
        if (keywordStreaks[matchedKeyword] >= threshold) {
            keywordStreaks[matchedKeyword] = 0; // reset streak
            this._matchedKeywordObj = matchedKeywordObj; // store for trigger
            return true;
        }

        return false;
    },

    trigger({ apiLink }) {
        const kw = this._matchedKeywordObj;
        if (!kw) return;

        fetch(`${apiLink}/trigger-sound`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sound: kw.sound,
                playbackSpeed: Math.random() * (2 - 0.5) + 0.5,
                volume: kw.volume
            })
        });
    }
};