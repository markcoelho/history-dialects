// services/speechService.js - Handles all speech synthesis functionality using ElevenLabs

const axios = require('axios');
const { ELEVENLABS_CONFIG, RAW_CONFIG } = require('../config/constants');

class SpeechService {
    constructor(apiKey, voiceManager) {
        this.apiKey = apiKey;
        this.voiceManager = voiceManager;
    }

    async generateSpeechWithTimestamps(text, style) {
        console.log('\n=== ELEVENLABS TTS GENERATION ===');
        console.log('Style:', style);
        console.log('Text to synthesize:', text);

        try {
            const { voiceId, params } = this.voiceManager.getVoiceSettings(style);
            
            // Build URL using config
            const url = `${ELEVENLABS_CONFIG.BASE_URL}${ELEVENLABS_CONFIG.ENDPOINTS.text_to_speech_with_timestamps.replace('{voice_id}', voiceId)}`;

            const response = await axios.post(
                url,
                {
                    text: text,
                    model_id: ELEVENLABS_CONFIG.MODEL,
                    voice_settings: params
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json'
                }
            );

            console.log('✅ ElevenLabs TTS generated successfully');
            
            const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
            
            return {
                audioBuffer,
                alignment: response.data.alignment
            };

        } catch (error) {
            console.error("ElevenLabs TTS Error:", error.response?.data || error.message);
            throw new Error(`Speech generation failed: ${error.message}`);
        }
    }

    cleanText(text) {
        return text
            .replace(/[*_#/]/g, ' ')
            .replace(/\[.*?\]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
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
                this._finalizeWord(currentWord, currentPhrase);
                currentWord = { text: '', start: null, end: 0, chars: [] };
            }

            if (char === '.' || char === '!' || char === '?') {
                if (currentPhrase.words.length > 0) {
                    this._finalizePhrase(currentPhrase, phrases);
                    currentPhrase = { text: '', words: [], start: null, end: 0 };
                }
            }
        });

        this._handleRemainingContent(currentWord, currentPhrase, phrases);
        return this._splitLongPhrases(phrases);
    }

    _finalizeWord(currentWord, currentPhrase) {
        currentPhrase.words.push({
            text: currentWord.text,
            start: currentWord.start,
            end: currentWord.end
        });
        if (currentPhrase.start === null) currentPhrase.start = currentWord.start;
        currentPhrase.end = currentWord.end;
    }

    _finalizePhrase(currentPhrase, phrases) {
        currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
        phrases.push({ ...currentPhrase });
    }

    _handleRemainingContent(currentWord, currentPhrase, phrases) {
        if (currentWord.text) {
            this._finalizeWord(currentWord, currentPhrase);
        }
        if (currentPhrase.words.length > 0) {
            this._finalizePhrase(currentPhrase, phrases);
        }
    }

    _splitLongPhrases(phrases) {
        const finalPhrases = [];
        phrases.forEach(phrase => {
            const avgWordLength = phrase.words.reduce((sum, word) => sum + word.text.length, 0) / phrase.words.length;
            const maxWords = avgWordLength > 4 ? 3 : avgWordLength > 2 ? 4 : 5;

            if (phrase.words.length <= maxWords) {
                finalPhrases.push(phrase);
                return;
            }

            this._splitPhrase(phrase, maxWords, finalPhrases);
        });
        return finalPhrases;
    }

    _splitPhrase(phrase, maxWords, finalPhrases) {
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
}

module.exports = SpeechService;