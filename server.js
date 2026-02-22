// server.js - Main server entry point

const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const TextService = require('./services/textService');
const ImageService = require('./services/imageService');
const VoiceManager = require('./config/voices');
const SpeechService = require('./services/speechService');
const VideoService = require('./services/videoService');
const { PORT } = require('./config/constants'); // Still just get PORT from constants

const app = express();

// Initialize service instances with API keys from environment variables
const textService = new TextService(process.env.DEEPSEEK_API_KEY);
const imageService = new ImageService(process.env.DEEPSEEK_API_KEY, process.env.OPENAI_API_KEY);
const voiceManager = new VoiceManager(process.env.ELEVENLABS_API_KEY);
const speechService = new SpeechService(process.env.ELEVENLABS_API_KEY, voiceManager);
const videoService = new VideoService(speechService);

// Middleware setup
app.use(express.json());
app.use(express.static('public'));
app.use('/config.json', express.static(path.join(__dirname, 'config.json')));

// API Routes (these stay exactly the same)
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
            details: error.response?.data || error.message
        });
    }
});

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

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});