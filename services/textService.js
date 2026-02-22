// services/textService.js - Handles text generation using DeepSeek API with various narrative styles

const axios = require('axios');
const { DEEPSEEK_CONFIG, TEXT_GENERATION_CONFIG, RAW_CONFIG } = require('../config/constants');

class TextService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async describeEvent(event, style) {
        const prompt = this.buildPrompt(event, style);
        
        console.log('\n=== TEXT GENERATION PROMPT ===');
        console.log('Event:', event);
        console.log('Style:', style);
        console.log('Full Prompt:', prompt);
        
        try {
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

    buildPrompt(event, style) {
        // Get the voice config for the selected style
        const voiceConfig = RAW_CONFIG.voices[style];
        
        if (!voiceConfig) {
            throw new Error(`Unknown style: ${style}`);
        }

        // Build prompt using the template from config
        let prompt = `Describe "${event}" in this mode/style: ${style}.\n` +
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