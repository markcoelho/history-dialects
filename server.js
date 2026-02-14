// server.js - Main server entry point for the Historical Event Describer application

// Import required dependencies
const express = require('express');          // Web framework for Node.js
const axios = require('axios');               // HTTP client for API calls
const path = require('path');                  // Path utilities for file handling
require('dotenv').config();                    // Load environment variables from .env file

// Import custom service modules
const VoiceManager = require('./config/voices');      // Manages ElevenLabs voice configurations
const TextService = require('./services/textService'); // Handles text generation via DeepSeek
const ImageService = require('./services/imageService'); // Manages DALL-E image generation
const VideoService = require('./services/videoService'); // Creates videos with subtitles
const { PORT } = require('./config/constants');       // Port configuration constant

const app = express();  // Initialize Express application

// Initialize service instances with API keys from environment variables
const voiceManager = new VoiceManager(process.env.ELEVENLABS_API_KEY);
const textService = new TextService(process.env.DEEPSEEK_API_KEY);
const imageService = new ImageService(
    process.env.DEEPSEEK_API_KEY, 
    process.env.OPENAI_API_KEY
);
const videoService = new VideoService(voiceManager);

// Middleware setup
app.use(express.json());      // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory

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
 * Generate speech audio from text using ElevenLabs TTS
 * Request body: { text, style }
 */
app.post('/api/generate-speech', async (req, res) => {
    const { text, style } = req.body;
    
    // Log the text being sent to ElevenLabs
    console.log('\n=== ELEVENLABS TTS INPUT ===');
    console.log('Style:', style);
    console.log('Text to synthesize:', text);
    
    try {
        const cleanText = textService.cleanText(text);
        const { voiceId, params } = voiceManager.getVoiceSettings(style);

        // Request TTS with timestamps for subtitle synchronization
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                text: cleanText,
                model_id: "eleven_monolingual_v1",
                voice_settings: params
            },
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'json'
            }
        );

        console.log('✅ ElevenLabs TTS generated successfully');
        
        // Convert base64 audio to buffer and send as MP3
        const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
        
    } catch (error) {
        console.error("TTS Error:", error.response?.data || error.message);
        res.status(500).json({ error: "TTS generation failed" });
    }
});

/**
 * Generate a video combining images, audio, and subtitles
 * Request body: { imageUrl, imageUrl2, text, style }
 */
app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, imageUrl2, text, style } = req.body;
    
    console.log('\n=== VIDEO GENERATION STARTED ===');
    console.log('Style:', style);
    console.log('Text length:', text.length, 'characters');
    console.log('First image URL:', imageUrl);
    console.log('Second image URL:', imageUrl2);
    
    try {
        const videoBuffer = await videoService.generateVideo(imageUrl, imageUrl2, text, style);
        
        console.log('\n✅ Video generated successfully');
        console.log('Video size:', videoBuffer.length, 'bytes');
        
        res.setHeader('Content-Type', 'video/mp4');
        res.send(videoBuffer);
    } catch (error) {
        console.error("Video generation error:", error);
        res.status(500).json({ 
            error: "Video generation failed", 
            details: error.message
        });
    }
});

// Start the server on configured port
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});