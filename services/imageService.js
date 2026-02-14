// services/imageService.js - Handles image generation using DALL-E with prompts from DeepSeek

const axios = require('axios');           // HTTP client for API calls
const { OpenAI } = require('openai');      // OpenAI SDK for DALL-E access
const { DEEPSEEK_CONFIG, IMAGE_CONFIG } = require('../config/constants'); // Configuration

class ImageService {
    /**
     * Initialize ImageService with API keys
     * @param {string} deepseekKey - DeepSeek API key for prompt generation
     * @param {string} openaiKey - OpenAI API key for DALL-E
     */
    constructor(deepseekKey, openaiKey) {
        this.deepseekKey = deepseekKey;
        this.openai = new OpenAI({ apiKey: openaiKey });  // Initialize OpenAI client
    }

    /**
     * Generate the first image for an event
     * @param {string} event - Historical event or person
     * @returns {Promise<Object>} Object with imageUrl and promptUsed
     */
    async generateFirstImage(event) {
        console.log('\n=== GENERATING FIRST IMAGE ===');
        console.log('Event:', event);
        
        // Generate prompt for the first image
        const prompt = await this.generateImagePrompt(event, false);
        
        console.log('\n--- FIRST IMAGE PROMPT ---');
        console.log(prompt);
        
        // Generate image using DALL-E
        const imageUrl = await this.generateDallEImage(prompt);
        
        console.log('✅ First image generated successfully');
        
        return { imageUrl, promptUsed: prompt };
    }

    /**
     * Generate a complementary second image based on the first
     * @param {string} event - Historical event or person
     * @param {string} firstImagePrompt - Prompt used for first image
     * @returns {Promise<Object>} Object with imageUrl and promptUsed
     */
    async generateSecondImage(event, firstImagePrompt) {
        console.log('\n=== GENERATING SECOND IMAGE ===');
        console.log('Event:', event);
        console.log('First image prompt (for context):', firstImagePrompt);
        
        // Generate complementary prompt using first prompt as context
        const prompt = await this.generateImagePrompt(event, true, firstImagePrompt);
        
        console.log('\n--- SECOND IMAGE PROMPT ---');
        console.log(prompt);
        
        // Generate image using DALL-E
        const imageUrl = await this.generateDallEImage(prompt);
        
        console.log('✅ Second image generated successfully');
        
        return { imageUrl, promptUsed: prompt };
    }

    /**
     * Generate an image prompt using DeepSeek API
     * @param {string} event - Historical event or person
     * @param {boolean} isComplementary - Whether this is the second/complementary image
     * @param {string} firstPrompt - First image prompt (for complementary images)
     * @returns {Promise<string>} Generated DALL-E prompt
     */
    async generateImagePrompt(event, isComplementary = false, firstPrompt = '') {
        // Build system message based on whether this is first or second image
        const systemMessage = this.buildPromptSystemMessage(isComplementary, firstPrompt);

        // Call DeepSeek API to generate prompt
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
                temperature: isComplementary ? 0.6 : 0.4,  // Higher temp for variety in second image
                max_tokens: DEEPSEEK_CONFIG.MAX_TOKENS
            },
            {
                headers: {
                    "Authorization": `Bearer ${this.deepseekKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Extract and trim prompt (DALL-E has 1000 char limit)
        let prompt = response.data.choices[0].message.content;
        return prompt.slice(0, 900).trim();
    }

    /**
     * Build system message for prompt generation based on context
     * @param {boolean} isComplementary - Whether this is second image
     * @param {string} firstPrompt - First image prompt for context
     * @returns {string} System message for DeepSeek
     */
    buildPromptSystemMessage(isComplementary, firstPrompt) {
        // First image: generate descriptive, safe prompt
        if (!isComplementary) {
            return `Transform user requests into a DALL-E image prompt by following these rules:
            - If the request is about a person, generate a visual description that accurately matches their known physical appearance without using their name.
            - If the request is about a sensitive historical event, rewrite the prompt using neutral, non-graphic language.
            - Don't include "fascist" or any other sensitive terms.
            Your goal is to generate a safe, descriptive, and visually rich prompt.`;
        }

        // Second image: generate complementary/different perspective
        return `Create a complementary DALL-E prompt that follows logically from the first image. Rules:
            1. For historical events: Show different perspective (beginning/climax, overview/detail)
            2. For historical figures: Show same person in different setting/age
            3. Never repeat same composition
            Follow the same safety guidelines for sensitive content.
            First image prompt was: ${firstPrompt}`;
    }

    /**
     * Generate image using DALL-E API
     * @param {string} prompt - Text prompt for DALL-E
     * @returns {Promise<string>} URL of generated image
     */
    async generateDallEImage(prompt) {
        // Validate prompt
        if (!prompt || prompt.length < 10) {
            throw new Error('Generated prompt is too short or empty');
        }

        // Call DALL-E API
        const response = await this.openai.images.generate({
            model: IMAGE_CONFIG.MODEL,
            prompt: prompt,
            size: IMAGE_CONFIG.SIZE,
            n: IMAGE_CONFIG.N
        });

        // Validate response
        if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error('Invalid response from DALL-E API');
        }

        return response.data[0].url;
    }
}

module.exports = ImageService;