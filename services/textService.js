// services/textService.js - Handles text generation using DeepSeek API with various narrative styles

const axios = require('axios');
const { DEEPSEEK_CONFIG, TEXT_GENERATION_CONFIG } = require('../config/constants');
const fs = require('fs').promises;
const path = require('path');

class TextService {
    constructor(apiKey, voiceManager) {
        this.apiKey = apiKey;
        this.voiceManager = voiceManager; // Inject VoiceManager for fresh config
    }

    async describeEvent(event, style) {
        try {
            // Get fresh voice config from VoiceManager (reads file every time)
            const voiceConfig = await this.voiceManager.getVoice(style);
            
            const prompt = this.buildPrompt(event, voiceConfig);
            
            console.log('\n=== TEXT GENERATION PROMPT ===');
            console.log('Event:', event);
            console.log('Style:', style);
            console.log('Full Prompt:', prompt);
            
            const response = await axios.post(DEEPSEEK_CONFIG.BASE_URL, {
                model: DEEPSEEK_CONFIG.MODEL,
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: DEEPSEEK_CONFIG.TEMPERATURE,
                max_tokens: DEEPSEEK_CONFIG.MAX_TOKENS
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const generatedText = response.data.choices[0].message.content;
            
            console.log('\n=== GENERATED NARRATION ===');
            console.log(generatedText);
            
            return this.removeAsterisks(generatedText);
        } catch (error) {
            console.error("DeepSeek API Error:", error.response?.data || error.message);
            throw error;
        }
    }

    buildPrompt(event, voiceConfig) {
        // Build prompt using the template from fresh config
        let prompt = `Describe "${event}" in this mode/style.\n` +
                    `${TEXT_GENERATION_CONFIG.BASE_RULES}\n` +
                    `${voiceConfig.prompt_template}`;

        return prompt;
    }

    removeAsterisks(text) {
        return text.replace(/\*/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    cleanText(text) {
        return text
            .replace(/[*_#/]/g, ' ')
            .replace(/\[.*?\]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
}

module.exports = TextService;