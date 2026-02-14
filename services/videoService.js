// services/videoService.js
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { VIDEO_CONFIG } = require('../config/constants');

class VideoService {
    constructor(voiceManager) {
        this.voiceManager = voiceManager;
    }

    async generateVideo(imageUrl, imageUrl2, text, style) {
        const { voiceId, params } = this.voiceManager.getVoiceSettings(style);

        // Get audio with timestamps
        const audioResponse = await this.getAudioWithTimestamps(text, voiceId, params);
        const audioBuffer = Buffer.from(audioResponse.data.audio_base64, 'base64');
        const alignment = audioResponse.data.alignment;

        // Process phrases
        const phrases = this.processPhrases(alignment);
        const totalDuration = phrases[phrases.length - 1].end;

        // Download and process images
        const tempDir = tmpdir();
        const paths = await this.downloadAndProcessImages(imageUrl, imageUrl2, tempDir);

        // Save audio
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        await fs.promises.writeFile(audioPath, audioBuffer);

        // Generate subtitles
        const assPath = await this.generateSubtitles(phrases, tempDir);

        // Create video
        const videoPath = await this.createVideo(paths, audioPath, assPath, totalDuration, tempDir);

        // Read video buffer
        const videoBuffer = await fs.promises.readFile(videoPath);

        // Cleanup
        await this.cleanupFiles([audioPath, videoPath, assPath, ...Object.values(paths)]);

        return videoBuffer;
    }

    async getAudioWithTimestamps(text, voiceId, params) {
        return await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                text: text,
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
    }

    processPhrases(alignment) {
        const phrases = [];
        let currentPhrase = { text: '', words: [], start: null, end: 0 };
        let currentWord = { text: '', start: null, end: 0, chars: [] };

        alignment.characters.forEach((char, index) => {
            const charStart = alignment.character_start_times_seconds[index];
            const charEnd = alignment.character_end_times_seconds[index];

            if (char !== ' ') {
                if (currentWord.text === '') currentWord.start = charStart;
                currentWord.text += char;
                currentWord.end = charEnd;
                return;
            }

            if (currentWord.text) {
                this.finalizeWord(currentWord, currentPhrase);
                currentWord = { text: '', start: null, end: 0, chars: [] };
            }

            if (char === '.' || char === '!' || char === '?') {
                if (currentPhrase.words.length > 0) {
                    this.finalizePhrase(currentPhrase, phrases);
                    currentPhrase = { text: '', words: [], start: null, end: 0 };
                }
            }
        });

        // Handle remaining words/phrases
        this.handleRemainingContent(currentWord, currentPhrase, phrases);

        return this.splitLongPhrases(phrases);
    }

    finalizeWord(currentWord, currentPhrase) {
        currentPhrase.words.push({
            text: currentWord.text,
            start: currentWord.start,
            end: currentWord.end
        });
        if (currentPhrase.start === null) currentPhrase.start = currentWord.start;
        currentPhrase.end = currentWord.end;
    }

    finalizePhrase(currentPhrase, phrases) {
        currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
        phrases.push({ ...currentPhrase });
    }

    handleRemainingContent(currentWord, currentPhrase, phrases) {
        if (currentWord.text) {
            this.finalizeWord(currentWord, currentPhrase);
        }
        if (currentPhrase.words.length > 0) {
            this.finalizePhrase(currentPhrase, phrases);
        }
    }

    splitLongPhrases(phrases) {
        const finalPhrases = [];
        phrases.forEach(phrase => {
            const avgWordLength = phrase.words.reduce((sum, word) => sum + word.text.length, 0) / phrase.words.length;
            const maxWords = avgWordLength > 4 ? 3 : avgWordLength > 2 ? 4 : 5;

            if (phrase.words.length <= maxWords) {
                finalPhrases.push(phrase);
                return;
            }

            this.splitPhrase(phrase, maxWords, finalPhrases);
        });
        return finalPhrases;
    }

    splitPhrase(phrase, maxWords, finalPhrases) {
        let currentSegment = {
            text: '',
            words: [],
            start: phrase.words[0].start,
            end: phrase.words[0].end
        };

        phrase.words.forEach((word, i) => {
            if (currentSegment.words.length >= maxWords) {
                currentSegment.text = currentSegment.words.map(w => w.text).join(' ');
                finalPhrases.push({ ...currentSegment });

                currentSegment = {
                    text: '',
                    words: [],
                    start: word.start,
                    end: word.end
                };
            }

            currentSegment.words.push(word);
            currentSegment.end = word.end;
        });

        if (currentSegment.words.length > 0) {
            currentSegment.text = currentSegment.words.map(w => w.text).join(' ');
            finalPhrases.push({ ...currentSegment });
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
                    .outputOptions(['-vf', 'scale=1080:1080:flags=lanczos'])
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

    async generateSubtitles(phrases, tempDir) {
        const assContent = this.generateAssSubtitles(phrases);
        const assPath = path.join(tempDir, `subtitles-${Date.now()}.ass`);
        await fs.promises.writeFile(assPath, assContent);
        return assPath;
    }

    generateAssSubtitles(phrases) {
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

    createHighlightedText(words, currentIndex) {
        let text = '';
        words.forEach((word, j) => {
            if (j === currentIndex) {
                text += `{\\c&H00FFFF&}${word.text}{\\c&HFFFFFF&}`;
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
                .videoCodec('libx264')
                .audioCodec('aac')
                .complexFilter([
                    '[0:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img1]',
                    '[1:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img2]',
                    '[img1][img2]concat=n=2:v=1:a=0[vid]',
                    `[vid]ass='${escapedAssPath}'[v]`
                ])
                .outputOptions([
                    '-map', '[v]',
                    '-map', '2:a',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    '-movflags', '+faststart',
                    '-r', VIDEO_CONFIG.FPS.toString()
                ])
                .output(videoPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        return videoPath;
    }

    async cleanupFiles(filePaths) {
        await Promise.all(filePaths.map(p => fs.promises.unlink(p).catch(console.error)));
    }
}

module.exports = VideoService;