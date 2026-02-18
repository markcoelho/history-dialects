// services/videoService.js - Handles video generation with subtitles synchronized to audio

const axios = require('axios');                       // HTTP client for downloading images
const ffmpeg = require('fluent-ffmpeg');              // FFmpeg wrapper for video processing
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path; // Path to FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);                     // Configure FFmpeg path
const fs = require('fs');                              // File system operations
const path = require('path');                           // Path utilities
const { tmpdir } = require('os');                       // Temporary directory utilities
const { VIDEO_CONFIG } = require('../config/constants'); // Video configuration constants

class VideoService {
    /**
     * Initialize VideoService with SpeechService for TTS
     * @param {SpeechService} speechService - Speech service instance
     */
    constructor(speechService) {
        this.speechService = speechService;
    }

    /**
     * Generate complete video with images, audio, and subtitles
     * @param {string} imageUrl - URL of first image
     * @param {string} imageUrl2 - URL of second image
     * @param {string} text - Narration text
     * @param {string} style - Narrative style for voice settings
     * @returns {Promise<Buffer>} Video file as buffer
     */
    async generateVideo(imageUrl, imageUrl2, text, style) {
        // Step 1: Get audio with character-level timestamps from SpeechService
        const { audioBuffer, alignment } = await this.speechService.generateSpeechWithTimestamps(text, style);

        // Step 2: Process character timings into word/phrase segments
        const phrases = this.speechService.processPhrases(alignment);
        const totalDuration = phrases[phrases.length - 1].end;

        // Step 3: Download and process images
        const tempDir = tmpdir();  // Get system temporary directory
        const paths = await this.downloadAndProcessImages(imageUrl, imageUrl2, tempDir);

        // Step 4: Save audio to temporary file
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        await fs.promises.writeFile(audioPath, audioBuffer);

        // Step 5: Generate subtitles in ASS format
        const assPath = await this.generateSubtitles(phrases, tempDir);

        // Step 6: Create video using FFmpeg
        const videoPath = await this.createVideo(paths, audioPath, assPath, totalDuration, tempDir);

        // Step 7: Read video into buffer for response
        const videoBuffer = await fs.promises.readFile(videoPath);

        // Step 8: Clean up temporary files
        await this.cleanupFiles([audioPath, videoPath, assPath, ...Object.values(paths)]);

        return videoBuffer;
    }

    /**
     * Download images and prepare them for video processing
     * @param {string} imageUrl - First image URL
     * @param {string} imageUrl2 - Second image URL
     * @param {string} tempDir - Temporary directory path
     * @returns {Promise<Object>} Paths to downloaded and processed images
     */
    async downloadAndProcessImages(imageUrl, imageUrl2, tempDir) {
        // Download both images in parallel
        const [imageResponse, imageResponse2] = await Promise.all([
            axios.get(imageUrl, { responseType: 'arraybuffer' }),
            axios.get(imageUrl2, { responseType: 'arraybuffer' })
        ]);

        const timestamp = Date.now();
        const paths = {
            original1: path.join(tempDir, `image1-${timestamp}.png`),
            original2: path.join(tempDir, `image2-${timestamp}.png`),
            upscaled1: path.join(tempDir, `upscaled1-${timestamp}.png`),
            upscaled2: path.join(tempDir, `upscaled2-${timestamp}.png`)
        };

        // Save original images
        await Promise.all([
            fs.promises.writeFile(paths.original1, imageResponse.data),
            fs.promises.writeFile(paths.original2, imageResponse2.data)
        ]);

        // Upscale images to video resolution
        await this.upscaleImages(paths);
        return paths;
    }

    /**
     * Upscale images to video resolution using FFmpeg
     * @param {Object} paths - Object containing image paths
     */
    async upscaleImages(paths) {
        await Promise.all([
            new Promise((resolve, reject) => {
                ffmpeg(paths.original1)
                    .outputOptions(['-vf', 'scale=1080:1080:flags=lanczos'])  // Lanczos scaling for quality
                    .output(paths.upscaled1)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            }),
            new Promise((resolve, reject) => {
                ffmpeg(paths.original2)
                    .outputOptions(['-vf', 'scale=1080:1080:flags=lanczos'])
                    .output(paths.upscaled2)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            })
        ]);
    }

    /**
     * Generate ASS (Advanced SubStation Alpha) subtitle file
     * @param {Array} phrases - Phrase objects with timing
     * @param {string} tempDir - Temporary directory path
     * @returns {Promise<string>} Path to generated ASS file
     */
    async generateSubtitles(phrases, tempDir) {
        const assContent = this.generateAssSubtitles(phrases);
        const assPath = path.join(tempDir, `subtitles-${Date.now()}.ass`);
        await fs.promises.writeFile(assPath, assContent);
        return assPath;
    }

    /**
     * Generate ASS subtitle content with word-by-word highlighting
     * @param {Array} phrases - Phrase objects
     * @returns {string} ASS format subtitle content
     */
    generateAssSubtitles(phrases) {
        // ASS header with styling information
        let assContent = `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Roboto Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

        // Generate subtitle events for each word with highlighting
        phrases.forEach(phrase => {
            const processedWords = this.processWordTimings(phrase.words);

            processedWords.forEach((word, i) => {
                if (!word.text.trim()) return;

                const wordStart = this.secondsToAssTime(word.start);
                const wordEnd = this.secondsToAssTime(word.end);
                const highlightedText = this.createHighlightedText(processedWords, i);

                assContent += `Dialogue: 0,${wordStart},${wordEnd},Default,,0,0,700,,${highlightedText}\n`;
            });
        });

        return assContent;
    }

    /**
     * Process word timings to ensure proper end times
     * Sets word end time to next word's start time for continuous highlighting
     * @param {Array} words - Word objects
     * @returns {Array} Processed words with adjusted timings
     */
    processWordTimings(words) {
        const processedWords = [];
        for (let i = 0; i < words.length; i++) {
            const currentWord = words[i];
            let wordEnd = currentWord.end;
            
            if (i < words.length - 1) {
                wordEnd = words[i + 1].start;
            }
            
            processedWords.push({
                text: currentWord.text,
                start: currentWord.start,
                end: wordEnd
            });
        }
        return processedWords;
    }

    /**
     * Create highlighted text for current word in ASS format
     * @param {Array} words - All words in phrase
     * @param {number} currentIndex - Index of word to highlight
     * @returns {string} ASS formatted text with highlighting
     */
    createHighlightedText(words, currentIndex) {
        let text = '';
        words.forEach((word, j) => {
            if (j === currentIndex) {
                // Highlight current word in yellow (ASS color format: &HBBGGRR&)
                text += `{\\c&H00FFFF&}${word.text}{\\c&HFFFFFF&}`;
            } else {
                text += word.text;
            }
            if (j < words.length - 1) text += ' ';
        });
        return text;
    }

    /**
     * Convert seconds to ASS time format (H:MM:SS.cc)
     * @param {number} seconds - Time in seconds
     * @returns {string} ASS formatted time
     */
    secondsToAssTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    /**
     * Create final video using FFmpeg
     * @param {Object} paths - Image paths
     * @param {string} audioPath - Audio file path
     * @param {string} assPath - Subtitle file path
     * @param {number} totalDuration - Total audio duration
     * @param {string} tempDir - Temporary directory
     * @returns {Promise<string>} Path to generated video
     */
    async createVideo(paths, audioPath, assPath, totalDuration, tempDir) {
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        const halfDuration = totalDuration / 2;  // Each image gets half the video duration
        
        // Escape ASS path for FFmpeg filter complex
        const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

        // FFmpeg command to create video
        await new Promise((resolve, reject) => {
            ffmpeg()
                // Input first image, loop for half duration
                .input(paths.upscaled1).inputOptions(['-loop 1', `-t ${halfDuration}`])
                // Input second image, loop for half duration
                .input(paths.upscaled2).inputOptions(['-loop 1', `-t ${halfDuration}`])
                // Input audio
                .input(audioPath)
                // Video codec
                .videoCodec('libx264')
                // Audio codec
                .audioCodec('aac')
                // Complex filter for combining images and adding subtitles
                .complexFilter([
                    // Scale first image and pad to 1080x1920 (centered)
                    '[0:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img1]',
                    // Scale second image and pad
                    '[1:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img2]',
                    // Concatenate the two images
                    '[img1][img2]concat=n=2:v=1:a=0[vid]',
                    // Add subtitles
                    `[vid]ass='${escapedAssPath}'[v]`
                ])
                .outputOptions([
                    '-map', '[v]',           // Map video stream
                    '-map', '2:a',            // Map audio stream
                    '-pix_fmt', 'yuv420p',    // Pixel format for compatibility
                    '-shortest',               // End when shortest stream ends
                    '-movflags', '+faststart', // Optimize for web streaming
                    '-r', VIDEO_CONFIG.FPS.toString()  // Frame rate
                ])
                .output(videoPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        return videoPath;
    }

    /**
     * Clean up temporary files
     * @param {Array} filePaths - Paths to files to delete
     */
    async cleanupFiles(filePaths) {
        await Promise.all(filePaths.map(p => fs.promises.unlink(p).catch(console.error)));
    }
}

module.exports = VideoService;