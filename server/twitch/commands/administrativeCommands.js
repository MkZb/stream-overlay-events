import Roles from '../roles.js';
import { setRole } from '../../db/mongoDB.js';
import { isCommand, isNumberOfArgumentsExpected, toggle, updateCooldown } from './commandsController.js';

export async function setCooldown(args, notify) {
    if (!isNumberOfArgumentsExpected(args, 2)) {
        return;
    }

    const command = args[0];
    const cooldown = Number(args[1]);

    if (!isCommand(command)) {
        return notify(`Unknown command`);
    }

    if (!Number.isInteger(cooldown) || cooldown < 0) {
        return notify(`Cooldown should be an integer`);
    }

    updateCooldown({ command, cooldown: cooldown * 1000 });
    notify(`Updated ${command} cooldown to ${cooldown} seconds`);
}

export async function setUserRole(args, notify) {
    if (!isNumberOfArgumentsExpected(args, 2)) {
        return;
    }

    const userName = args[0];
    const role = Number(args[1]);

    if (!Number.isInteger(role) || role < 0) {
        return notify(`Role should be an integer`);
    }

    if (!Object.values(Roles).includes(role)) {
        return notify(`Unknown role ${role}`);
    }

    const result = await setRole({ userName, role });
    if (result) {
        const roleName = Object.keys(Roles).find(key => Roles[key] === role);
        return notify(`Updated ${userName} role to ${roleName}`);
    }
}

export function toggleCommand(args, notify) {
    if (!isNumberOfArgumentsExpected(args, 1)) {
        return;
    }

    const command = args[0];

    if (!isCommand(command)) {
        return notify(`Unknown command`);
    }

    if (command === 'toggle') {
        return notify(`Can't toggle toggle`);
    }

    const status = toggle({ command });
    notify(`${command} has been ${status ? 'enabled' : 'disabled'}`);
}