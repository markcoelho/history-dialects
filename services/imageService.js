// services/imageService.js
const axios = require('axios');
const { OpenAI } = require('openai');
const { DEEPSEEK_CONFIG, IMAGE_CONFIG } = require('../config/constants');

class ImageService {
    constructor(deepseekKey, openaiKey) {
        this.deepseekKey = deepseekKey;
        this.openai = new OpenAI({ apiKey: openaiKey });
    }

    async generateFirstImage(event) {
        const prompt = await this.generateImagePrompt(event, false);
        const imageUrl = await this.generateDallEImage(prompt);
        return { imageUrl, promptUsed: prompt };
    }

    async generateSecondImage(event, firstImagePrompt) {
        const prompt = await this.generateImagePrompt(event, true, firstImagePrompt);
        const imageUrl = await this.generateDallEImage(prompt);
        return { imageUrl, promptUsed: prompt };
    }

    async generateImagePrompt(event, isComplementary = false, firstPrompt = '') {
        const systemMessage = this.buildPromptSystemMessage(isComplementary, firstPrompt);

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: DEEPSEEK_CONFIG.MODEL,
                messages: [{
                    role: "system",
                    content: systemMessage
                }, {
                    role: "user",
                    content: `Create a DALL-E prompt for: ${event}`
                }],
                temperature: isComplementary ? 0.6 : 0.4,
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
        return prompt.slice(0, 900).trim();
    }

    buildPromptSystemMessage(isComplementary, firstPrompt) {
        if (!isComplementary) {
            return `Transform user requests into a DALL-E image prompt by following these rules:
            - If the request is about a person, generate a visual description that accurately matches their known physical appearance without using their name.
            - If the request is about a sensitive historical event, rewrite the prompt using neutral, non-graphic language.
            - Don't include "fascist" or any other sensitive terms.
            Your goal is to generate a safe, descriptive, and visually rich prompt.`;
        }

        return `Create a complementary DALL-E prompt that follows logically from the first image. Rules:
            1. For historical events: Show different perspective (beginning/climax, overview/detail)
            2. For historical figures: Show same person in different setting/age
            3. Never repeat same composition
            Follow the same safety guidelines for sensitive content.
            First image prompt was: ${firstPrompt}`;
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