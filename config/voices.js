// config/voices.js - Manages ElevenLabs voice configurations and settings

const ElevenLabs = require('elevenlabs-node');  // ElevenLabs API wrapper
const { VOICE_IDS } = require('./constants');    // Voice ID constants

class VoiceManager {
    /**
     * Initialize VoiceManager with ElevenLabs API key
     * @param {string} apiKey - ElevenLabs API key
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.initializeVoices();  // Create voice instances
    }

    /**
     * Initialize all voice instances with their respective IDs
     * Creates individual ElevenLabs instances for each voice style
     */
    initializeVoices() {
        this.brainrotVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.BRAINROT
        });

        this.italianBrainrotVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.ITALIAN_BRAINROT
        });

        this.pirateVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.PIRATE
        });

        this.shakespeareVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.SHAKESPEARE
        });

        this.africanAmericanVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.AFRICAN_AMERICAN
        });

        this.storytellerVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.STORYTELLER
        });

        this.matterOfFactVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.MATTER_OF_FACT
        });

        this.robotVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.ROBOT
        });

        this.sarcasticVoice = new ElevenLabs({
            apiKey: this.apiKey,
            voiceId: VOICE_IDS.SARCASTIC
        });
    }

    /**
     * Get voice settings for a specific style
     * @param {string} style - The narrative style (e.g., 'brainrot', 'pirate')
     * @returns {Object} Object containing voiceId and voice parameters
     */
    getVoiceSettings(style) {
        // Map style names to voice instances
        const voiceMap = {
            brainrot: this.brainrotVoice,
            italian_brainrot: this.italianBrainrotVoice,
            pirate: this.pirateVoice,
            shakespeare: this.shakespeareVoice,
            african_american: this.africanAmericanVoice,
            storyteller: this.storytellerVoice,
            matter_of_fact: this.matterOfFactVoice,
            robot_historian: this.robotVoice,
            sarcastic: this.sarcasticVoice
        };

        // Voice parameter settings for each style
        // stability: 0-1 (lower = more expressive/variable)
        // similarity_boost: 0-1 (how closely to match the original voice)
        // style: 0-1 (exaggeration of voice style)
        // speed: playback speed multiplier
        const settingsMap = {
            brainrot: {
                params: { stability: 1, similarity_boost: 1, style: 1, speed: 0.9 }
            },
            italian_brainrot: {
                params: { stability: 0.4, similarity_boost: 0.7, speed: 0.90, speaker_boost: true }
            },
            pirate: {
                params: { speed: 1 }
            },
            shakespeare: {
                params: { stability: 0.6, similarity_boost: 0.75, style: 0, speed: 0.9 }
            },
            african_american: {
                params: { stability: 0.5, similarity_boost: 0.7, style: 0, speed: 0.9 }
            },
            matter_of_fact: {
                params: { stability: 0.7, similarity_boost: 0.8, style: 0, speed: 0.90 }
            },
            sarcastic: {
                params: { stability: 0.7, similarity_boost: 0.8, style: 0, speed: 0.90 }
            },
            robot_historian: {
                params: { stability: 0.4, similarity_boost: 0.8, style: 0, speed: 0.90 }
            },
            storyteller: {
                params: { stability: 0.7, similarity_boost: 0.8, style: 0, speed: 0.9 }
            }
        };

        // Get voice instance for the requested style (default to storyteller)
        const voice = voiceMap[style] || this.storytellerVoice;
        // Get settings for the requested style (default to storyteller)
        const settings = settingsMap[style] || settingsMap.storyteller;

        return {
            voiceId: voice.voiceId,  // ElevenLabs voice ID
            params: settings.params   // Voice parameters
        };
    }
}

module.exports = VoiceManager;