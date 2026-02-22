// services/imageService.js - Handles image generation using DALL-E with prompts from DeepSeek

const axios = require('axios');
const { OpenAI } = require('openai');
const { DEEPSEEK_CONFIG, IMAGE_CONFIG, IMAGE_PROMPT_CONFIG } = require('../config/constants');

class ImageService {
    constructor(deepseekKey, openaiKey) {
        this.deepseekKey = deepseekKey;
        this.openai = new OpenAI({ apiKey: openaiKey });
    }

    async generateFirstImage(event) {
        console.log('\n=== GENERATING FIRST IMAGE ===');
        console.log('Event:', event);
        
        const prompt = await this.generateImagePrompt(event, false);
        
        console.log('\n--- FIRST IMAGE PROMPT ---');
        console.log(prompt);
        
        const imageUrl = await this.generateDallEImage(prompt);
        
        console.log('✅ First image generated successfully');
        
        return { imageUrl, promptUsed: prompt };
    }

    async generateSecondImage(event, firstImagePrompt) {
        console.log('\n=== GENERATING SECOND IMAGE ===');
        console.log('Event:', event);
        console.log('First image prompt (for context):', firstImagePrompt);
        
        const prompt = await this.generateImagePrompt(event, true, firstImagePrompt);
        
        console.log('\n--- SECOND IMAGE PROMPT ---');
        console.log(prompt);
        
        const imageUrl = await this.generateDallEImage(prompt);
        
        console.log('✅ Second image generated successfully');
        
        return { imageUrl, promptUsed: prompt };
    }

    async generateImagePrompt(event, isComplementary = false, firstPrompt = '') {
        let systemMessage;
        
        if (!isComplementary) {
            systemMessage = IMAGE_PROMPT_CONFIG.FIRST_IMAGE_SYSTEM_MESSAGE;
        } else {
            // Replace placeholder with actual first prompt if needed
            systemMessage = IMAGE_PROMPT_CONFIG.SECOND_IMAGE_SYSTEM_MESSAGE.replace(
                '{first_prompt}', 
                firstPrompt
            );
        }

        const temperature = isComplementary ? 
            IMAGE_PROMPT_CONFIG.TEMPERATURE.SECOND_IMAGE : 
            IMAGE_PROMPT_CONFIG.TEMPERATURE.FIRST_IMAGE;

        const response = await axios.post(
            DEEPSEEK_CONFIG.BASE_URL,
            {
                model: DEEPSEEK_CONFIG.MODEL,
                messages: [{
                    role: "system",
                    content: systemMessage
                }, {
                    role: "user",
                    content: `Create a DALL-E prompt for: ${event}`
                }],
                temperature: temperature,
                max_tokens: DEEPSEEK_CONFIG.MAX_TOKENS
            },
            {
                headers: {
                    "Authorization": `Bearer ${this.deepseekKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let prompt = response.data.choices[0].message.content;
        return prompt.slice(0, IMAGE_CONFIG.MAX_PROMPT_LENGTH).trim();
    }

    async generateDallEImage(prompt) {
        if (!prompt || prompt.length < 10) {
            throw new Error('Generated prompt is too short or empty');
        }

        const response = await this.openai.images.generate({
            model: IMAGE_CONFIG.MODEL,
            prompt: prompt,
            size: IMAGE_CONFIG.SIZE,
            n: IMAGE_CONFIG.N
        });

        if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error('Invalid response from DALL-E API');
        }

        return response.data[0].url;
    }
}

module.exports = ImageService;