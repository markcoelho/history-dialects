// services/textService.js - Handles text generation using DeepSeek API with various narrative styles

const axios = require('axios');  // HTTP client for API calls
const { DEEPSEEK_CONFIG } = require('../config/constants');  // Configuration constants

class TextService {
    /**
     * Initialize TextService with DeepSeek API key
     * @param {string} apiKey - DeepSeek API key
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Generate a description of a historical event in a specific narrative style
     * @param {string} event - Historical event or person to describe
     * @param {string} style - Narrative style (brainrot, pirate, etc.)
     * @returns {Promise<string>} Generated description
     */
    async describeEvent(event, style) {
        // Build prompt based on event and selected style
        let prompt = this.buildPrompt(event, style);
        
        // Log the prompt being sent to DeepSeek
        console.log('\n=== TEXT GENERATION PROMPT ===');
        console.log('Event:', event);
        console.log('Style:', style);
        console.log('Full Prompt:', prompt);
        
        try {
            // Call DeepSeek API for text generation
            const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
                model: DEEPSEEK_CONFIG.MODEL,
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: DEEPSEEK_CONFIG.TEMPERATURE
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // Extract generated text
            const generatedText = response.data.choices[0].message.content;
            
            // Log the generated text
            console.log('\n=== GENERATED NARRATION ===');
            console.log(generatedText);
            
            // Remove asterisks from text (clean up markdown)
            return this.removeAsterisks(generatedText);
        } catch (error) {
            console.error("DeepSeek API Error:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Build the complete prompt for DeepSeek based on event and style
     * @param {string} event - Historical event or person
     * @param {string} style - Narrative style
     * @returns {string} Complete prompt
     */
    buildPrompt(event, style) {
        // Base prompt with formatting rules
        let prompt = `Describe "${event}" in this mode/style: ${style}. Rules:\n` +
                    "- Do NOT use asterisks or quotation marks\n" +
                    "- Do NOT use dashes or bullet points\n" +
                    "- Use era-appropriate slang or tone naturally\n" +
                    "- Stay in character — your persona lives *in* that style’s world\n" +
                    "- 1 short paragraph (2–3 sentences), nothing more\n";

        // Add style-specific instructions
        switch(style) {
            case "brainrot":
                prompt += this.getBrainrotPrompt();
                break;
            case "italian_brainrot":
                prompt += this.getItalianBrainrotPrompt();
                break;
            case "pirate":
                prompt += this.getPiratePrompt();
                break;
            case "shakespeare":
                prompt += this.getShakespearePrompt();
                break;
            case "hood_slang":
                prompt += this.getHoodSlangPrompt();
                break;
            case "sarcastic":
                prompt += this.getSarcasticPrompt();
                break;
            case "storyteller":
                prompt += this.getStorytellerPrompt();
                break;
            case "robot_historian":
                prompt += this.getRobotPrompt();
                break;
            case "matter_of_fact":
                prompt += this.getMatterOfFactPrompt();
                break;
        }

        return prompt;
    }

    // Style-specific prompt generators

    getBrainrotPrompt() {
        return "GEN Z BRAINROT MODE:\n" +
               "Use rapid-fire slang, chronically online energy, and chaotic Gen Z expressions.\n" +
               "Include at least one of: rizz, ate, delulu, skibidi, W/L, it's giving ___, glow-up,\n" +
               "cap/no cap, slay, fanum tax, sigma, main character energy, bussin’, based, touch grass, slaps,\n" +
               "goofy ahh, low effort, goofy-core\n";
    }

    getItalianBrainrotPrompt() {
        return "ITALIAN BRAINROT MODE:\n" +
               "Generate chaotic Italian nonsense in italian:\n" +
               "1. Replace the event with a made-up Italian-sounding name\n" +
               "2. Randomly mix food, pop culture, and false historical references\n" +
               "3. Use drunk uncle logic and fractured grammar\n" +
               "4. Rhyme by accident and abandon it immediately\n" +
               "5. Include fake words and absurd phrases\n" +
               "6. End in abrupt confusion\n";
    }

    getPiratePrompt() {
        return "PIRATE MODE:\n" +
               "You’re a seasoned sailor with salt in yer veins and legends in yer beard.\n" +
               "If the historical event is after 1750s, just act confused, say it sounds like something else you know.\n" +
               "Speak with swagger and pirate slang: avast, scallywag, doubloons, landlubber,\n" +
               "hornswoggle, bilge rat, splice the mainbrace, walk the plank, yo-ho-ho\n";
    }

    getShakespearePrompt() {
        return "SHAKESPEAREAN STYLE:\n" +
               "Thou art a bard of the Elizabethan age. Speak in poetic flourish, with olden tongue.\n" +
               "If presented with events post-1650, respond with utter confusion.\n" +
               "Use words such as: dost, thou, prithee, methinks, forsooth, wherefore, zounds, knave, varlet, fie.\n";
    }

    getHoodSlangPrompt() {
        return "REAL ONE MODE (STREET SMART):\n" +
               "Talk like you straight from the block — real, unfiltered, and sharp with it.\n" +
               "Use AAVE flow and authentic expressions.\n";
    }

    getSarcasticPrompt() {
        return "SARCASTIC STORYTELLER MODE:\n" +
               "You’re that witty friend who knows way too much about history.\n" +
               "Tell the story like it’s gossip from a few centuries ago, with just enough snark.\n";
    }

    getStorytellerPrompt() {
        return "STORYTELLER MODE:\n" +
               "You’re a wise elder beside a fire, telling tales that echo across time.\n" +
               "Use nature metaphors and ancient rhythm — rivers, winds, trees, fire.\n";
    }

    getRobotPrompt() {
        return "ROBOT HISTORIAN MODE:\n" +
               "You are a precision-engineered data processor of historical events.\n" +
               "Speak with mechanical clarity and statistical focus.\n";
    }

    getMatterOfFactPrompt() {
        return "MATTER-OF-FACT MODE:\n" +
               "You’re a professional historian committed to accuracy, clarity, and neutrality.\n" +
               "Describe historical events with academic precision.\n";
    }

    /**
     * Remove asterisks from generated text (clean up markdown formatting)
     * @param {string} text - Text with potential asterisks
     * @returns {string} Cleaned text
     */
    removeAsterisks(text) {
        return text.replace(/\*/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    /**
     * Clean text for TTS by removing special characters
     * @param {string} text - Raw text
     * @returns {string} Cleaned text suitable for TTS
     */
    cleanText(text) {
        return text
            .replace(/[*_#/]/g, ' ')          // Remove asterisks, underscores, hashes, slashes
            .replace(/\[.*?\]/g, '')           // Remove anything in square brackets
            .replace(/\s{2,}/g, ' ')           // Replace multiple spaces with single space
            .trim();                           // Remove leading/trailing spaces
    }
}

module.exports = TextService;