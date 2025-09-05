import { getGuessEmoteLeaderboard } from "./guessEmote.js";

const commands = {
    leaderboard: getGuessEmoteLeaderboard,
    lb: getGuessEmoteLeaderboard
}

export function parseCommand(message) {
    if (!message.startsWith('!')) return null;

    const parts = message.slice(1).trim().split(/\s+/);
    const command = parts.shift()?.toLowerCase();
    const args = parts;

    return { command, args };
}

export function processCommand({ command, args }) {
    if (Object.keys(commands).includes(command)) {
        commands[command](args);
    }
}