import getChannelEmotes from '../7tv/7tv.js'
import { getRole } from '../db/mongoDB.js';
import { parseCommand } from './commands/commands.js';
import Roles from './roles.js';

export async function parseMessage(data) {
    const messageData = {
        userName: data.chatter_user_name,
        userId: data.chatter_user_id,
        message: data.message.text,
        timestamp: Date.now()
    }

    messageData.emotes = getMessageEmotes(data.message.text);
    messageData.type = data.message.text[0] === '!' ? 'command' : 'message';
    messageData.command = parseCommand(data.message.text);
    messageData.role = await getRole({ userId: messageData.userId }) ?? Roles.USER;
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