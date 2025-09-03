import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Default config
let config = {
    'cooldown': 10000
};

// Load config from disk if available
if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config = { ...config, ...saved };
    console.log('Config successfully loaded');
}

// Watch for changes to config.json
fs.watchFile(CONFIG_FILE, async () => {
    config = { ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    console.log('Config reloaded!');
});

// Getter & Setter
export function getConfig() {
    return config;
}

export function updateConfig(newValues) {
    config = { ...config, ...newValues };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return config;
}
