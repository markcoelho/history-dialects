// config/voices.js
const fs = require('fs').promises;
const path = require('path');

class VoiceManager {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getVoice(style) {
        console.log(`\n🔍 Getting voice for style: "${style}"`);
        
        try {
            // Always read fresh config
            const configPath = path.join(__dirname, '..', 'config.json');
            console.log(`📁 Reading config from: ${configPath}`);
            
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            const availableVoices = Object.keys(config.voices);
            console.log(`📊 Available voices (${availableVoices.length}):`, availableVoices);
            
            const voice = config.voices[style];
            if (!voice) {
                console.error(`❌ Voice not found: "${style}"`);
                throw new Error(`Unknown style: ${style}`);
            }
            
            console.log(`✅ Found voice: "${voice.name}" (ID: ${voice.id})`);
            return voice;
            
        } catch (error) {
            console.error('❌ Error in getVoice:', error);
            throw error;
        }
    }

    async getVoiceById(voiceId) {
        console.log(`\n🔍 Getting voice by ID: "${voiceId}"`);
        
        try {
            const configPath = path.join(__dirname, '..', 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // Find voice by ID
            for (const [key, voice] of Object.entries(config.voices)) {
                if (voice.id === voiceId) {
                    console.log(`✅ Found voice: "${voice.name}"`);
                    return voice;
                }
            }
            
            console.error(`❌ Voice not found for ID: ${voiceId}`);
            throw new Error(`Unknown voice ID: ${voiceId}`);
            
        } catch (error) {
            console.error('❌ Error in getVoiceById:', error);
            throw error;
        }
    }

    async getVoiceSettings(style) {
        console.log(`\n🔍 Getting voice settings for style: "${style}"`);
        
        try {
            // Get the voice first
            const voice = await this.getVoice(style);
            
            // Return the voice settings in the format expected by speechService
            return {
                voiceId: voice.id,
                params: {
                    stability: voice.parameters?.stability || 0.5,
                    similarity_boost: voice.parameters?.similarity_boost || 0.75,
                    speed: voice.parameters?.speed || 1.0
                }
            };
            
        } catch (error) {
            console.error('❌ Error in getVoiceSettings:', error);
            throw error;
        }
    }

    async getVoiceSettingsById(voiceId) {
        console.log(`\n🔍 Getting voice settings by ID: "${voiceId}"`);
        
        try {
            // Get the voice first
            const voice = await this.getVoiceById(voiceId);
            
            // Return the voice settings in the format expected by speechService
            return {
                voiceId: voice.id,
                params: {
                    stability: voice.parameters?.stability || 0.5,
                    similarity_boost: voice.parameters?.similarity_boost || 0.75,
                    speed: voice.parameters?.speed || 1.0
                }
            };
            
        } catch (error) {
            console.error('❌ Error in getVoiceSettingsById:', error);
            throw error;
        }
    }
}

module.exports = VoiceManager;