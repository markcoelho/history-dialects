// services/videoService.js - Handles video generation with subtitles synchronized to audio

const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { VIDEO_CONFIG } = require('../config/constants');

class VideoService {
    constructor(speechService) {
        this.speechService = speechService;
    }

    async generateVideo(imageUrl, imageUrl2, text, style) {
        console.log('\n🎬 Starting video generation...');
        const startTime = Date.now();
        
        try {
            const { audioBuffer, alignment } = await this.speechService.generateSpeechWithTimestamps(text, style);
            
            const phrases = this.speechService.processPhrases(alignment);
            const totalDuration = phrases[phrases.length - 1].end;
            console.log(`  ⏱️  Duration: ${totalDuration.toFixed(2)}s, Phrases: ${phrases.length}`);

            console.log('  🖼️  Processing images...');
            const tempDir = tmpdir();
            const paths = await this.downloadAndProcessImages(imageUrl, imageUrl2, tempDir);

            const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
            await fs.promises.writeFile(audioPath, audioBuffer);

            const assPath = await this.generateSubtitles(phrases, tempDir);

            console.log('  🎥 Creating video...');
            const videoPath = await this.createVideo(paths, audioPath, assPath, totalDuration, tempDir);

            const videoBuffer = await fs.promises.readFile(videoPath);
            
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`  ✅ Video complete: ${(videoBuffer.length / 1024).toFixed(1)}KB in ${elapsedTime}s`);

            await this.cleanupFiles([audioPath, videoPath, assPath, ...Object.values(paths)]);

            return videoBuffer;
        } catch (error) {
            console.error('❌ Video generation failed:', error.message);
            throw error;
        }
    }

    async downloadAndProcessImages(imageUrl, imageUrl2, tempDir) {
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

        await Promise.all([
            fs.promises.writeFile(paths.original1, imageResponse.data),
            fs.promises.writeFile(paths.original2, imageResponse2.data)
        ]);

        await this.upscaleImages(paths);
        
        return paths;
    }

    async upscaleImages(paths) {
        await Promise.all([
            new Promise((resolve, reject) => {
                ffmpeg(paths.original1)
                    .outputOptions(['-vf', `scale=${VIDEO_CONFIG.RESOLUTION.WIDTH}:${VIDEO_CONFIG.RESOLUTION.HEIGHT}:flags=lanczos`])
                    .output(paths.upscaled1)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            }),
            new Promise((resolve, reject) => {
                ffmpeg(paths.original2)
                    .outputOptions(['-vf', `scale=${VIDEO_CONFIG.RESOLUTION.WIDTH}:${VIDEO_CONFIG.RESOLUTION.HEIGHT}:flags=lanczos`])
                    .output(paths.upscaled2)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            })
        ]);
    }

    async generateSubtitles(phrases, tempDir) {
        const assContent = this.generateAssSubtitles(phrases);
        const assPath = path.join(tempDir, `subtitles-${Date.now()}.ass`);
        await fs.promises.writeFile(assPath, assContent);
        return assPath;
    }

    generateAssSubtitles(phrases) {
        const { font, font_size, primary_color, highlight_color, alignment, margin_v } = VIDEO_CONFIG.SUBTITLE;

        let assContent = `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${VIDEO_CONFIG.RESOLUTION.WIDTH}
PlayResY: ${VIDEO_CONFIG.RESOLUTION.HEIGHT}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${font_size},${primary_color},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,${alignment},10,10,${margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

        phrases.forEach(phrase => {
            const processedWords = this.processWordTimings(phrase.words);

            processedWords.forEach((word, i) => {
                if (!word.text.trim()) return;

                const wordStart = this.secondsToAssTime(word.start);
                const wordEnd = this.secondsToAssTime(word.end);
                const highlightedText = this.createHighlightedText(processedWords, i, highlight_color, primary_color);

                assContent += `Dialogue: 0,${wordStart},${wordEnd},Default,,0,0,700,,${highlightedText}\n`;
            });
        });

        return assContent;
    }

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

    createHighlightedText(words, currentIndex, highlightColor, primaryColor) {
        let text = '';
        words.forEach((word, j) => {
            if (j === currentIndex) {
                text += `{\\c${highlightColor}}${word.text}{\\c${primaryColor}}`;
            } else {
                text += word.text;
            }
            if (j < words.length - 1) text += ' ';
        });
        return text;
    }

    secondsToAssTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    async createVideo(paths, audioPath, assPath, totalDuration, tempDir) {
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        const halfDuration = totalDuration / 2;

        const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(paths.upscaled1).inputOptions(['-loop 1', `-t ${halfDuration}`])
                .input(paths.upscaled2).inputOptions(['-loop 1', `-t ${halfDuration}`])
                .input(audioPath)
                .videoCodec(VIDEO_CONFIG.CODEC)
                .audioCodec(VIDEO_CONFIG.AUDIO_CODEC)
                .complexFilter([
                    `[0:v]scale=${VIDEO_CONFIG.RESOLUTION.WIDTH}:-1,pad=${VIDEO_CONFIG.RESOLUTION.WIDTH}:${VIDEO_CONFIG.RESOLUTION.HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black[img1]`,
                    `[1:v]scale=${VIDEO_CONFIG.RESOLUTION.WIDTH}:-1,pad=${VIDEO_CONFIG.RESOLUTION.WIDTH}:${VIDEO_CONFIG.RESOLUTION.HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black[img2]`,
                    '[img1][img2]concat=n=2:v=1:a=0[vid]',
                    `[vid]ass='${escapedAssPath}'[v]`
                ])
                .outputOptions([
                    '-map', '[v]',
                    '-map', '2:a',
                    '-pix_fmt', VIDEO_CONFIG.PIXEL_FORMAT,
                    '-shortest',
                    '-movflags', '+faststart',
                    '-r', VIDEO_CONFIG.FPS.toString()
                ])
                .output(videoPath)
                .on('end', resolve)
                .on('error', (err, stdout, stderr) => {
                    console.error('  ❌ FFmpeg error:', err.message);
                    console.error('  📄 FFmpeg stderr:', stderr);
                    reject(err);
                })
                .run();
        });

        return videoPath;
    }

    async cleanupFiles(filePaths) {
        await Promise.all(filePaths.map(p => fs.promises.unlink(p).catch(() => {})));
    }
}

module.exports = VideoService;