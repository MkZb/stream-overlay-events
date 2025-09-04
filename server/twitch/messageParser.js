import getChannelEmotes from '../7tv/7tv.js'

export function parseMessage(data) {
    const messageData = {
        username: data.chatter_user_name,
        message: data.message.text,
        timestamp: Date.now()
    }

    messageData.emotes = getMessageEmotes(data.message.text);

    return messageData;
}

function getMessageEmotes(text) {
    const channelEmotes = getChannelEmotes();
    const words = text.split(/\s+/);

    return words.flatMap(word => {
        return Object.entries(channelEmotes)
            .filter(([key, value]) => value.name === word)
            .map(([key, value]) => ({ word, key }));
    });
}