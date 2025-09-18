import 'dotenv/config'
import fs from 'fs';
import path from 'path';
import { randomInt } from 'crypto';
import { channelsIdList } from '../twitch/channels.js';

const SEVENTV_API = 'https://7tv.io/v3';
const GLOBAL_EMOTES_SET_ID = '01HKQT8EWR000ESSWF3625XCS4';

// Directory of cached emotes
const CACHE_DIR = path.join(process.cwd(), 'server', 'cache', 'emotes');

// Create directory if it doesnt exist
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

let channelEmotes = {};

// Parse emotes from all listened channels during runtime
(async () => {
    for (const channelId of channelsIdList) {
        let globalData = await getGlobalEmotesData();
        let channelData = await getTwitchChannelData(channelId);
        parseEmotes(channelId, globalData, channelData);
        await cacheEmotes();
    }

})();

/**
 * Returns a json object representing global 7tv emotes data
 * @returns {object} global 7tv emotes data
 */
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

/**
 * Returns a json object representing channel 7tv emotes data
 * @param {string} id an id of a channel to get emotes data from 
 * @returns {object} channel 7tv emotes data
 */
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

/**
 * Updates a channel emotes information
 * @param {string} channelId an id of a channel which information is being updated
 * @param {object} globalData a 7tv API response json object with global emotes data
 * @param {object} channelData a 7tv API response json object with channel emotes data
 * @returns 
 */
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

/**
 * Caches all the emotes on disk drive from parsed channels
 */
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

/**
 * Returns data about all 7tv emotes from a specified channel
 * @param {string} channelId a channel id to get emotes from 
 * @returns {object} an object containing data about emotes on the channel
 */
export default function getChannelEmotes(channelId) {
    return channelEmotes[channelId];
}

/**
 * Returns an emote image by specified id
 * @param {string} id an id of an image to return 
 * @returns {NonSharedBuffer|null} an image or null
 */
export function getEmoteImage(id) {
    if (!id) {
        console.warn('To get an emote id should be specified');
        return null;
    }

    if (id) {
        return fs.readFileSync(path.join(CACHE_DIR, `${id}.webp`));
    }
}

/**
 * Returns a random emote from a specified channel
 * @param {string} channelId an id of a channel to get random emote from
 * @returns {{id: string, data:object}|null} an object containing emote id and its data or null
 */
export function getRandomEmote(channelId) {
    const entries = Object.entries(channelEmotes[channelId]);
    if (!entries.length) return null;

    const [id, data] = entries[randomInt(0, entries.length)];
    return { id, data };
}