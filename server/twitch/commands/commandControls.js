import Roles from '../roles.js';
import { setRole } from '../../db/mongoDB.js';
import { sendMessage } from '../bot.js';
import { isCommand, updateCooldown } from './commands.js';

export async function setCooldown(args) {
    if (args.length < 2) {
        notify(`Wrong amount of arguments for setcooldown command`);
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
    if (args.length < 2) {
        notify(`Wrong amount of arguments for setrole command`);
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

function notify(message) {
    sendMessage(message);
    console.log(message);
}