import { createConfig } from '../../../utils/configManager.js';

const defaultConfig = {
    cooldown: 10000,
    durationMin: 3000,
    durationMax: 6000
};

export const { getConfig, updateConfig } = createConfig('show_emote', defaultConfig);