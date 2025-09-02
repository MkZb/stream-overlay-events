import 'dotenv/config'
import fs from 'fs';
import path from 'path';

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


async function cacheEmotes() {
    for (const [id, emote] of Object.entries(channelEmotes)) {
        const filename = path.join(CACHE_DIR, `${id}.webp`);

        try {
            const res = await fetch(emote.cdnLink);
            if (!res.ok) {
                console.error(`Failed to fetch emote ${emote.name}: ${res.status}`);
                continue;
            }

            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(filename, buffer);
            channelEmotes['dir'] = filename;
            console.log(`Cached emote ${emote.name} -> ${filename}`);
        } catch (err) {
            console.error(`Error caching emote ${emote.name}:`, err);
        }
    }
}

export default function getChannelEmotes() {
    return channelEmotes;
}