// config/constants.js - Central configuration file for all constants used in the application

const path = require('path');  // Path module for file path handling

// Server configuration
const PORT = 3000;  // Port on which the server will run

// ElevenLabs Voice IDs - each corresponds to a specific voice in ElevenLabs
const VOICE_IDS = {
    BRAINROT: "mpgCuHlOy4oRiOklMDQ6",           // Gen Z brainrot voice
    ITALIAN_BRAINROT: "pNInz6obpgDQGcFmaJgB",   // Italian-accented brainrot
    PIRATE: "PPzYpIqttlTYA83688JI",              // Pirate voice
    SHAKESPEARE: "qg9068uIPhh2zLXgBEgX",         // Shakespearean voice
    AFRICAN_AMERICAN: "GssEzYMmDFv83efAVpiS",    // African American vernacular voice
    STORYTELLER: "dPah2VEoifKnZT37774q",         // Wise storyteller voice
    MATTER_OF_FACT: "eocRDMaLbjKENGPdXXsM",      // Serious, factual voice
    ROBOT: "oEXg2pQBebQumRmUTPX4",               // Robotic voice
    SARCASTIC: "JYgUf5ey0r1KhoCN2txT"            // Sarcastic voice
};

// DeepSeek API configuration for text generation
const DEEPSEEK_CONFIG = {
    MODEL: "deepseek-chat",       // Model identifier for DeepSeek API
    TEMPERATURE: 0.7,             // Creativity/randomness level (0-1)
    MAX_TOKENS: 200                // Maximum response length
};

// DALL-E image generation configuration
const IMAGE_CONFIG = {
    MODEL: "dall-e-2",            // DALL-E model version
    SIZE: "256x256",              // Image dimensions (small for speed)
    N: 1                           // Number of images to generate
};

// Video generation configuration
const VIDEO_CONFIG = {
    RESOLUTION: {
        WIDTH: 1080,               // Video width in pixels
        HEIGHT: 1920                // Video height in pixels (portrait/vertical)
    },
    FPS: 30                         // Frames per second
};

// Export all constants for use in other modules
module.exports = {
    PORT,
    VOICE_IDS,
    DEEPSEEK_CONFIG,
    IMAGE_CONFIG,
    VIDEO_CONFIG
};