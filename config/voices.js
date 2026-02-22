// config/voices.js - Manages ElevenLabs voice configurations and settings

const { VOICE_IDS, RAW_CONFIG } = require('./constants');

class VoiceManager {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.voices = {}; // Will store voice configs
        this.initializeVoices();
    }

    initializeVoices() {
        // Initialize voice configurations from RAW_CONFIG
        Object.entries(RAW_CONFIG.voices).forEach(([key, voiceConfig]) => {
            this.voices[key] = {
                voiceId: voiceConfig.id,
                params: voiceConfig.parameters
            };
        });
    }

    getVoiceSettings(style) {
        const voice = this.voices[style];
        
        if (!voice) {
            console.warn(`⚠️ Unknown style: ${style}, falling back to storyteller`);
            return {
                voiceId: this.voices.storyteller.voiceId,
                params: this.voices.storyteller.params
            };
        }

        return {
            voiceId: voice.voiceId,
            params: voice.params
        };
    }
}

module.exports = VoiceManager;