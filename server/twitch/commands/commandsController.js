import { setCooldown, setUserRole, toggleCommand } from './administrativeCommands.js';
import { getGuessEmoteLeaderboard } from './guessEmote.js';
import Roles from '../roles.js';
import { sendMessage } from '../bot.js';
import { distract } from './variousCommands.js';

const commandConfig = {
    leaderboard: {
        enabled: true,
        cooldown: 5000,
        lastUsed: 0,
        access: Roles.USER,
        handler: getGuessEmoteLeaderboard
    },

    setrole: {
        enabled: true,
        cooldown: 0,
        lastUsed: 0,
        access: Roles.ADMIN,
        handler: setUserRole
    },

    setcooldown: {
        enabled: true,
        cooldown: 0,
        lastUsed: 0,
        access: Roles.MODERATOR,
        handler: setCooldown
    },

    toggle: {
        enabled: true,
        cooldown: 0,
        lastUsed: 0,
        access: Roles.MODERATOR,
        handler: toggleCommand
    },

    distract: {
        enabled: true,
        cooldown: 0,
        lastUsed: 0,
        access: Roles.USER,
        handler: distract
    }
};

const aliases = {
    lb: 'leaderboard',
    setcd: 'setcooldown'
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

export async function processCommand({ role, command, args }) {
    const cmd = commandConfig[command];

    if (!cmd) {
        return notify('', `Command ${command} not found`);
    }

    if (role > cmd.access) {
        return notify(
            `You don't have access to this command`,
            `User access level of ${role} is to low to access command ${command} with minimum level ${cmd.access}.`
        )
    }

    if (!cmd.enabled) {
        return notify('', `Command ${command} is disabled.`);
    }

    const now = Date.now();
    if (now - cmd.lastUsed < cmd.cooldown) {
        return notify('', `Command ${command} is on cooldown. ${(cmd.cooldown - (now - cmd.lastUsed)) / 1000} seconds left`);
    }

    cmd.lastUsed = now;

    try {
        await cmd.handler(args);
    } catch (err) {
        console.error(`Error in command ${command}:`, err);
    }
}

function getCommand(command) {
    return aliases[command] ? commandConfig[aliases[command]] : commandConfig[command];
}

export function isCommand(command) {
    return aliases[command] || commandConfig[command];
}

export function updateCooldown({ command, cooldown }) {
    const cmdConfig = getCommand(command);
    cmdConfig.cooldown = cooldown;
}

export function toggle({ command }) {
    const cmdConfig = getCommand(command);
    cmdConfig.enabled = !cmdConfig.enabled;
    return cmdConfig.enabled;
}

export function isNumberOfArgumentsExpected(args, expected = 0) {
    if (args.length < expected) {
        return notify(`Unexpected amount of arguments, at least ${expected} expected`);
    }
}

export async function notify(chatMessage, consoleMessage = chatMessage) {
    if (chatMessage) {
        await sendMessage(chatMessage);
    }

    if (consoleMessage) {
        console.log(consoleMessage);
    }
}