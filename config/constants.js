// config/constants.js - Central configuration file that loads from config.json

const path = require('path');
const fs = require('fs');

// Load configuration from config.json - fail if missing
const configPath = path.join(__dirname, '..', 'config.json');

if (!fs.existsSync(configPath)) {
    console.error('❌ FATAL: config.json not found at', configPath);
    console.error('Please ensure config.json exists in the root directory');
    process.exit(1);
}

let config;
try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configFile);
    console.log('✅ Configuration loaded from config.json');
} catch (error) {
    console.error('❌ FATAL: Failed to parse config.json:', error.message);
    process.exit(1);
}

// Server configuration
const PORT = 3000;

// Extract voice IDs from config
const VOICE_IDS = {};
Object.entries(config.voices).forEach(([key, voice]) => {
    VOICE_IDS[key.toUpperCase()] = voice.id;
});

// DeepSeek API configuration from config.json
const DEEPSEEK_CONFIG = {
    MODEL: config.api.deepseek.model,
    TEMPERATURE: config.api.deepseek.temperature,
    MAX_TOKENS: config.api.deepseek.max_tokens,
    BASE_URL: config.api.deepseek.base_url
};

// DALL-E image generation configuration from config.json
const IMAGE_CONFIG = {
    MODEL: config.api.openai.dalle.model,
    SIZE: config.api.openai.dalle.size,
    N: config.api.openai.dalle.n,
    MAX_PROMPT_LENGTH: config.api.openai.dalle.max_prompt_length
};

// Video generation configuration from config.json
const VIDEO_CONFIG = {
    RESOLUTION: {
        WIDTH: config.video.resolution.width,
        HEIGHT: config.video.resolution.height
    },
    FPS: config.video.fps,
    CODEC: config.video.codec,
    AUDIO_CODEC: config.video.audio_codec,
    PIXEL_FORMAT: config.video.pixel_format,
    SUBTITLE: config.video.subtitle
};

// Image generation prompt system messages
const IMAGE_PROMPT_CONFIG = {
    FIRST_IMAGE_SYSTEM_MESSAGE: config.image_generation.prompt_system_messages.first_image,
    SECOND_IMAGE_SYSTEM_MESSAGE: config.image_generation.prompt_system_messages.second_image,
    TEMPERATURE: {
        FIRST_IMAGE: config.image_generation.temperature.first_image,
        SECOND_IMAGE: config.image_generation.temperature.second_image
    }
};

// Text generation base rules
const TEXT_GENERATION_CONFIG = {
    BASE_RULES: config.text_generation.base_rules
};

// ElevenLabs configuration
const ELEVENLABS_CONFIG = {
    MODEL: config.api.elevenlabs.model,
    BASE_URL: config.api.elevenlabs.base_url,
    ENDPOINTS: config.api.elevenlabs.endpoints
};

// Export all constants for use in other modules
module.exports = {
    PORT,
    VOICE_IDS,
    DEEPSEEK_CONFIG,
    IMAGE_CONFIG,
    VIDEO_CONFIG,
    IMAGE_PROMPT_CONFIG,
    TEXT_GENERATION_CONFIG,
    ELEVENLABS_CONFIG,
    
    // Also export the raw config for services that need more detailed access
    RAW_CONFIG: config
};