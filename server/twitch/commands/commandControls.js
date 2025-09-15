import Roles from '../roles.js';
import { setRole } from '../../db/mongoDB.js';
import { sendMessage } from '../bot.js';
import { isCommand, toggle, updateCooldown } from './commands.js';

export async function setCooldown(args) {
    if (!isNumberOfArgumentsExpected(args, 2)) {
        return;
    }

    const command = args[0];
    const cooldown = Number(args[1]);

    if (!isCommand(command)) {
        notify(`Unknown command`);
        return;
    }

    if (!Number.isInteger(cooldown) || cooldown < 0) {
        notify(`Cooldown should be an integer`);
        return;
    }

    updateCooldown({ command, cooldown: cooldown * 1000 });
    notify(`Updated ${command} cooldown to ${cooldown} seconds`);
}

export async function setUserRole(args) {
    if (!isNumberOfArgumentsExpected(args, 2)) {
        return;
    }

    const userName = args[0];
    const role = Number(args[1]);

    if (!Number.isInteger(role) || role < 0) {
        notify(`Role should be an integer`);
        return;
    }

    if (!Object.values(Roles).includes(role)) {
        notify(`Unknown role ${role}`);
        return;
    }

    const result = await setRole({ userName, role });
    if (result) {
        const roleName = Object.keys(Roles).find(key => Roles[key] === role);
        notify(`Updated ${userName} role to ${roleName}`);
        return;
    }
}

export function toggleCommand(args) {
    if (!isNumberOfArgumentsExpected(args, 1)) {
        return;
    }

    const command = args[0];

    if (!isCommand(command)) {
        notify(`Unknown command`);
        return;
    }

    if (command === 'toggle') {
        notify(`Can't toggle toggle`);
        return;
    }

    const status = toggle({ command });
    notify(`${command} has been ${status ? 'enabled' : 'disabled'}`);
}

function notify(message) {
    sendMessage(message);
    console.log(message);
}

function isNumberOfArgumentsExpected(args, expected = 0) {
    if (args.length < expected) {
        notify(`Unexpected amount of arguments, at least ${expected} expected`);
        return false;
    }
    return true;
}