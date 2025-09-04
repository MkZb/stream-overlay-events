import { createConfig } from '../../../utils/modulesConfigManager.js';

const defaultConfig = {
    isEnabled: true,
    cooldown: 10 * 60 * 1000,
    duration: 1 * 60 * 1000,
    revealTime: 1 * 60 * 1000,
    x: 0,
    y: 0
};

export const { getConfig, updateConfig } = createConfig('guess_emote', defaultConfig);