import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsDir = path.join(__dirname, 'event_modules');

const events = [];

// Import all modules from events/event_modules which script names correspond to dir name
for (const dir of fs.readdirSync(eventsDir, { withFileTypes: true })) {
    if (dir.isDirectory()) {
        const moduleDir = path.join(eventsDir, dir.name);
        for (const file of fs.readdirSync(moduleDir)) {
            if (file.endsWith('js') && file === (dir.name + '.js')) {
                const modulePath = path.join(moduleDir, file);
                const moduleUrl = pathToFileURL(modulePath).href;

                const { default: event } = await import(moduleUrl);
                if (typeof event.shouldTrigger === 'function') {
                    events.push(event);
                }
                console.log(`Module ${file} imported`);
            }
        }
    }
}

/**
 * Runs all events on each new chat message.
 * @param {Object} context
 */
export function handleMessage(context) {
    for (const event of events) {
        const now = Date.now();
        event.reloadConfig();

        if (!event.isEnabled) {
            continue;
        }

        if (event.onMessage) {
            event.onMessage(context);
        }

        const cooldownReady = !event.lastTriggered || now - event.lastTriggered > (event.cooldown || 0);

        if (cooldownReady && event.shouldTrigger(context)) {
            event.trigger(context);
            event.lastTriggered = now;
        }

    }
}