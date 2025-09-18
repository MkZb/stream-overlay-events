import { setCooldown, setUserRole, toggleCommand } from './administrativeCommands.js';
import { getGuessEmoteLeaderboard } from './guessEmote.js';
import Roles from '../roles.js';
import { sendMessage } from '../bot.js';
import { distract } from './variousCommands.js';

// Default commands configuration
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

// Commands aliases
const aliases = {
    lb: 'leaderboard',
    setcd: 'setcooldown'
};

/**
 * Parse a command from the supplied message
 * @param {string} message a message to parse
 * @returns {{command:string, args:string[]}} command - a parsed command, args - a list of its arguments 
 */
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

/**
 * Processes and potentialy executes a command
 * @param {number} role user role 
 * @param {string} broadcasterId id of chat where message was sent
 * @param {object} Command a command data
 * @param {string} command a command being executed
 * @param {string[]} args a command arguments
 * @returns {void}
 */
export async function processCommand(role, broadcasterId, { command, args }) {
    const cmd = commandConfig[command];

    const notify = async function (chatMessage, consoleMessage = chatMessage) {
        if (chatMessage) {
            await sendMessage(chatMessage, broadcasterId);
        }

        if (consoleMessage) {
            console.log(consoleMessage);
        }
    }

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
        await cmd.handler(args, notify);
    } catch (err) {
        console.error(`Error in command ${command}:`, err);
    }
}

/**
 * Returns a command data
 * @param {string} command a command to get 
 * @returns {object} a command data
 */
function getCommand(command) {
    return aliases[command] ? commandConfig[aliases[command]] : commandConfig[command];
}

/**
 * Checks if specified string is a command
 * @param {string} command a string to check
 * @returns {boolean} whether command exists or not
 */
export function isCommand(command) {
    return aliases[command] || commandConfig[command];
}

/**
 * Sets a cooldown for a command
 * @param {string} command a command to set cooldown for
 * @param {number} cooldown a cooldown in miliseconds
 */
export function updateCooldown(command, cooldown) {
    const cmdConfig = getCommand(command);
    cmdConfig.cooldown = cooldown;
}

/**
 * Enables or disables specified command
 * @param {string} command a command to toggle 
 * @returns {boolean} true if command enabled, false otherwise
 */
export function toggle(command) {
    const cmdConfig = getCommand(command);
    cmdConfig.enabled = !cmdConfig.enabled;
    return cmdConfig.enabled;
}

/**
 * Checks if amount of passed arguments is expected (or less which in some cases is aplicable)
 * @param {string[]} args the passed arguments
 * @param {number} expected an expected amount of arguments
 * @returns {boolean} true if number of arguments is expected, false otherwise
 */
export function isNumberOfArgumentsExpected(args, expected = 0) {
    if (args.length < expected) {
        notify(`Unexpected amount of arguments, at least ${expected} expected`);
        return false;
    }

    return true;
}