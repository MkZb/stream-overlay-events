import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates a config manager for a given module.
 * @param {string} moduleName - Folder or module name (e.g. "show_emote").
 * @param {object} defaultConfig - Default config values.
 */
export function createConfig(moduleName, defaultConfig = {}) {
    const CONFIG_FILE = path.join(__dirname, "../events/event_modules", moduleName, "config.json");

    let config = { ...defaultConfig };

    // Load from disk if exists
    if (fs.existsSync(CONFIG_FILE)) {
        const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
        config = { ...config, ...saved };
        console.log(`[${moduleName}] Config successfully loaded`);
    }

    // Watch for changes
    fs.watchFile(CONFIG_FILE, () => {
        try {
            const updated = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
            config = { ...updated };
            console.log(`[${moduleName}] Config reloaded!`);
        } catch (err) {
            console.error(`[${moduleName}] Failed to reload config:`, err);
        }
    });

    return {
        getConfig: () => config,
        updateConfig: (newValues) => {
            config = { ...config, ...newValues };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            return config;
        }
    };
}
