import 'dotenv/config'
import fs from 'fs';
import path from 'path';
import { randomInt } from 'crypto';
import { channelsIdList } from '../twitch/channels.js';

const SEVENTV_API = 'https://7tv.io/v3';
const GLOBAL_EMOTES_SET_ID = '01HKQT8EWR000ESSWF3625XCS4';

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache', 'emotes');

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

let channelEmotes = {};

(async () => {
    for (const channelId of channelsIdList) {
        let globalData = await getGlobalEmotesData();
        let channelData = await getTwitchChannelData(channelId);
        parseEmotes(channelId, globalData, channelData);
        await cacheEmotes();
    }

})();

async function getGlobalEmotesData() {
    let response = await fetch(`${SEVENTV_API}/emote-sets/${GLOBAL_EMOTES_SET_ID}`, {
        method: 'GET'
    });

    if (response.status != 200) {
        console.error(`Couldn't recieve global emotes 7tv data. Response status: ${response.status}`);
        return;
    }

    return await response.json();
}

async function getTwitchChannelData(id) {
    let response = await fetch(`${SEVENTV_API}/users/twitch/${id}`, {
        method: 'GET'
    });

    if (response.status != 200) {
        console.error(`Couldn't recieve 7tv data. Response status: ${response.status}`);
        return;
    }

    return await response.json();
}

function parseEmotes(channelId, globalData, channelData) {
    if (!channelData?.emote_set && !globalData?.emotes) {
        return;
    }

    if (!channelEmotes[channelId]) {
        channelEmotes[channelId] = {}
    }

    channelData.emote_set.emotes.forEach(emote => {
        channelEmotes[channelId][emote.id] = {
            name: emote.name,
            animated: emote.data.animated,
            overlaying: Number.parseInt(emote.flags) === 1,
            cdnLink: 'https:' + emote.data.host.url + '/4x.webp'
        }
    });

    globalData.emotes.forEach(emote => {
        channelEmotes[channelId][emote.id] = {
            name: emote.name,
            animated: emote.data.animated,
            overlaying: Number.parseInt(emote.flags) === 1,
            cdnLink: 'https:' + emote.data.host.url + '/4x.webp'
        }
    });

}

// TODO: make a fallback in case there's no webp or 4x
function isWebpAvailable(emote) {

}

async function cacheEmotes() {
    for (const [channelId, emotesData] of Object.entries(channelEmotes)) {
        for (const [id, emote] of Object.entries(emotesData)) {
            const filename = path.join(CACHE_DIR, `${id}.webp`);

            if (fs.existsSync(filename)) {
                channelEmotes[channelId][id].dir = filename;
                continue;
            }

            try {
                const res = await fetch(emote.cdnLink);
                if (!res.ok) {
                    console.error(`Failed to fetch emote ${emote.name}: ${res.status}`);
                    continue;
                }

                const buffer = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(filename, buffer);
                channelEmotes[channelId][id].dir = filename;
                console.log(`Cached emote ${emote.name} -> ${filename}`);
            } catch (err) {
                console.error(`Error caching emote ${emote.name}:`, err);
            }
        }
    }
}

export default function getChannelEmotes(channelId) {
    return channelEmotes[channelId];
}

export function getEmoteImage({ id }) {
    if (!id) {
        return console.warn('To get an emote id should be specified');
    }

    if (id) {
        return fs.readFileSync(path.join(CACHE_DIR, `${id}.webp`));
    }
}

export function getRandomEmote(channelId) {
    const entries = Object.entries(channelEmotes[channelId]);
    if (!entries.length) return null;

    const [id, data] = entries[randomInt(0, entries.length)];
    return { id, data };
}