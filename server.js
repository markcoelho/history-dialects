// server.js - Main server entry point for the Historical Event Describer application

// Import required dependencies
const express = require('express');          // Web framework for Node.js
const axios = require('axios');               // HTTP client for API calls
const path = require('path');                  // Path utilities for file handling
require('dotenv').config();                    // Load environment variables from .env file

// Import custom service modules
const TextService = require('./services/textService');
const ImageService = require('./services/imageService');
const VoiceManager = require('./config/voices');
const SpeechService = require('./services/speechService'); // New import
const VideoService = require('./services/videoService');
const { PORT } = require('./config/constants');       // Port configuration constant

const app = express();  // Initialize Express application

// Initialize service instances with API keys from environment variables
const textService = new TextService(process.env.DEEPSEEK_API_KEY);
const imageService = new ImageService(process.env.DEEPSEEK_API_KEY, process.env.OPENAI_API_KEY);
const voiceManager = new VoiceManager(process.env.ELEVENLABS_API_KEY);
const speechService = new SpeechService(process.env.ELEVENLABS_API_KEY, voiceManager);
const videoService = new VideoService(speechService);

// Middleware setup
app.use(express.json());      // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/config.json', express.static(path.join(__dirname, 'config.json')));

// API Routes

/**
 * Generate a text description of a historical event in a specific style
 * Request body: { event, style }
 */
app.post('/api/describe-event', async (req, res) => {
    const { event, style } = req.body;
    try {
        const description = await textService.describeEvent(event, style);
        res.json({ description });
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "API request failed" });
    }
});

/**
 * Generate the first image for an event
 * Request body: { event }
 */
app.post('/api/generate-image', async (req, res) => {
    const { event } = req.body;
    try {
        const result = await imageService.generateFirstImage(event);
        res.json(result);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to generate image",
            details: error.response?.data || error.message
        });
    }
});

/**
 * Generate a complementary second image using context from first image
 * Request body: { event, firstImagePrompt }
 */
app.post('/api/generate-image2', async (req, res) => {
    const { event, firstImagePrompt } = req.body;
    try {
        const result = await imageService.generateSecondImage(event, firstImagePrompt);
        res.json(result);
    } catch (error) {
        console.error("Detailed error generating image 2:", {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        res.status(500).json({
            error: "Failed to generate second image",
            details: error.response?.data || error.message,
            suggestion: "The content might have triggered DALL-E's safety filters. Try a different event description."
        });
    }
});


/**
 * Generate a video combining images, audio, and subtitles
 * Request body: { imageUrl, imageUrl2, text, style }
 */
app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, imageUrl2, text, style } = req.body;
    
    try {
        const cleanText = speechService.cleanText(text);
        const videoBuffer = await videoService.generateVideo(imageUrl, imageUrl2, cleanText, style);
        
        res.setHeader('Content-Type', 'video/mp4');
        res.send(videoBuffer);
        
    } catch (error) {
        console.error("Video generation error:", error);
        res.status(500).json({ error: "Video generation failed" });
    }
});

// Start the server on configured port
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});