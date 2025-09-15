import { getGuessEmoteLeaderboard } from './guessEmote.js';

const commandConfig = {
    leaderboard: {
        enabled: true,
        cooldown: 5000,
        lastUsed: 0,
        handler: getGuessEmoteLeaderboard
    }
};

const aliases = {
    lb: "leaderboard"
};

export function parseCommand(message) {
    if (!message.startsWith('!')) return null;

    const parts = message.slice(1).trim().split(/\s+/);
    let command = parts.shift();
    const args = parts;

    if (aliases[command]) {
        command = aliases[command];
    }

    return { command, args };
}

export async function processCommand({ command, args }) {
    const cmd = commandConfig[command];

    if (!cmd.enabled) {
        return console.log(`Command ${command} is disabled.`);
    }

    const now = Date.now();
    if (now - cmd.lastUsed < cmd.cooldown) {
        return console.log(`Command ${command} is on cooldown.`);
    }

    cmd.lastUsed = now;

    try {
        await cmd.handler(args);
    } catch (err) {
        console.error(`Error in command ${command}:`, err);
    }
}