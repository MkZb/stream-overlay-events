import { createConfig } from '../../../utils/configManager.js';

const defaultConfig = {
    cooldown: 0,
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

export const { getConfig, updateConfig } = createConfig('voiced_streaks', defaultConfig);