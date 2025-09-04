import { createConfig } from '../../../utils/modulesConfigManager.js';

const defaultConfig = {
    isEnabled: true,
    cooldown: 0,
    keywords: [],
    globalThreshold: 3
};

export const { getConfig, updateConfig } = createConfig('voiced_streaks', defaultConfig);