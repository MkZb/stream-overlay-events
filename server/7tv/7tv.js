import 'dotenv/config'
import fs from 'fs';
import path from 'path';
import { randomInt } from 'crypto';


const SEVENTV_API = 'https://7tv.io/v3';
const ID = process.env.TWITCH_CHANNEL_ID;
const GLOBAL_EMOTES_SET_ID = '01HKQT8EWR000ESSWF3625XCS4';

const CACHE_DIR = path.join(process.cwd(), 'server', 'cache', 'emotes');

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

let channelEmotes = {};

(async () => {
    let globalData = await getGlobalEmotesData();
    let channelData = await getTwitchChannelData(ID);
    parseEmotes(globalData, channelData);
    await cacheEmotes();
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

function parseEmotes(globalData, channelData) {
    if (!channelData?.emote_set && !globalData?.emotes) {
        return;
    }

    channelData.emote_set.emotes.forEach(emote => {
        channelEmotes[emote.id] = {
            name: emote.name,
            animated: emote.data.animated,
            overlaying: Number.parseInt(emote.flags) === 1,
            cdnLink: 'https:' + emote.data.host.url + '/4x.webp'
        }
    });

    globalData.emotes.forEach(emote => {
        channelEmotes[emote.id] = {
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
    for (const [id, emote] of Object.entries(channelEmotes)) {
        const filename = path.join(CACHE_DIR, `${id}.webp`);

        if (fs.existsSync(filename)) {
            channelEmotes[id].dir = filename;
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
            channelEmotes[id].dir = filename;
            console.log(`Cached emote ${emote.name} -> ${filename}`);
        } catch (err) {
            console.error(`Error caching emote ${emote.name}:`, err);
        }
    }
}

export default function getChannelEmotes() {
    return channelEmotes;
}

export function getEmoteImage({ id, name }) {
    if (!id && !name) {
        console.warn('To get an emote id or name should be specified');
        return;
    }

    if (id) {
        return fs.readFileSync(path.join(CACHE_DIR, `${id}.webp`));
    }

    if (name) {
        return fs.readFileSync(path.join(CACHE_DIR, `${getEmoteId({ name })}.webp`));
    }

}

function getEmoteId({ name }) {
    for (const [id, emote] of Object.entries(channelEmotes)) {
        if (emote.name === name) {
            return id;
        }
    }
    console.warn(`Emote ${name} wasn't  found in channel emotes`);
    return null;
}

export function getRandomEmote() {
    const entries = Object.entries(channelEmotes);
    if (!entries.length) return null;

    const [id, data] = entries[randomInt(0, entries.length)];
    return { id, data };
}