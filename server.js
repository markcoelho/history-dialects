// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();

const VoiceManager = require('./config/voices');
const TextService = require('./services/textService');
const ImageService = require('./services/imageService');
const VideoService = require('./services/videoService');
const { PORT } = require('./config/constants');

const app = express();

// Initialize services
const voiceManager = new VoiceManager(process.env.ELEVENLABS_API_KEY);
const textService = new TextService(process.env.DEEPSEEK_API_KEY);
const imageService = new ImageService(
    process.env.DEEPSEEK_API_KEY, 
    process.env.OPENAI_API_KEY
);
const videoService = new VideoService(voiceManager);

app.use(express.json());
app.use(express.static('public'));

// Routes
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
            details: error.response?.data || error.message,
            suggestion: "The content might have triggered DALL-E's safety filters. Try a different event description."
        });
    }
});

app.post('/api/generate-speech', async (req, res) => {
    const { text, style } = req.body;
    try {
        const cleanText = textService.cleanText(text);
        const { voiceId, params } = voiceManager.getVoiceSettings(style);

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                text: cleanText,
                model_id: "eleven_monolingual_v2",
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

        const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
        
    } catch (error) {
        console.error("TTS Error:", error.response?.data || error.message);
        res.status(500).json({ error: "TTS generation failed" });
    }
});

app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, imageUrl2, text, style } = req.body;
    
    try {
        const videoBuffer = await videoService.generateVideo(imageUrl, imageUrl2, text, style);
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));