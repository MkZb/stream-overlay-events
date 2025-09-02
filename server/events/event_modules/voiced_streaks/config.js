import fs from "fs";

const CONFIG_FILE = "./server/events/event_modules/voiced_streaks/config.json";

// Default config
let config = {
    keywords: [
        {
            word: "Boink",
            sound: "spring.mp3",
            volume: 1,
            threshold: 3
        }
    ],
    globalThreshold: 3
};

// Load config from disk if available
if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    config = { ...config, ...saved };
    console.log('Config successfully loaded');
}

// Watch for changes to config.json
fs.watchFile(CONFIG_FILE, async () => {
    config = { ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) };
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
