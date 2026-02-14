// config/constants.js
const path = require('path');

const PORT = 3000;

const VOICE_IDS = {
    BRAINROT: "mpgCuHlOy4oRiOklMDQ6",
    ITALIAN_BRAINROT: "pNInz6obpgDQGcFmaJgB",
    PIRATE: "PPzYpIqttlTYA83688JI",
    SHAKESPEARE: "qg9068uIPhh2zLXgBEgX",
    AFRICAN_AMERICAN: "GssEzYMmDFv83efAVpiS",
    STORYTELLER: "dPah2VEoifKnZT37774q",
    MATTER_OF_FACT: "eocRDMaLbjKENGPdXXsM",
    ROBOT: "oEXg2pQBebQumRmUTPX4",
    SARCASTIC: "JYgUf5ey0r1KhoCN2txT"
};

const DEEPSEEK_CONFIG = {
    MODEL: "deepseek-chat",
    TEMPERATURE: 0.7,
    MAX_TOKENS: 200
};

const IMAGE_CONFIG = {
    MODEL: "dall-e-2",
    SIZE: "256x256",
    N: 1
};

const VIDEO_CONFIG = {
    RESOLUTION: {
        WIDTH: 1080,
        HEIGHT: 1920
    },
    FPS: 30
};

module.exports = {
    PORT,
    VOICE_IDS,
    DEEPSEEK_CONFIG,
    IMAGE_CONFIG,
    VIDEO_CONFIG
};