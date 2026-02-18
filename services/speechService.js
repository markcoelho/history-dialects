// services/speechService.js - Handles all speech synthesis functionality using ElevenLabs

const axios = require('axios');

class SpeechService {
    /**
     * Initialize SpeechService with ElevenLabs API key
     * @param {string} apiKey - ElevenLabs API key
     * @param {VoiceManager} voiceManager - Voice manager instance for voice settings
     */
    constructor(apiKey, voiceManager) {
        this.apiKey = apiKey;
        this.voiceManager = voiceManager;
    }

    /**
     * Generate speech with character-level timestamps for subtitle synchronization
     * @param {string} text - Text to synthesize
     * @param {string} style - Narrative style for voice selection
     * @returns {Promise<Object>} Object containing audio buffer and alignment data
     */
    async generateSpeechWithTimestamps(text, style) {
        console.log('\n=== ELEVENLABS TTS GENERATION ===');
        console.log('Style:', style);
        console.log('Text to synthesize:', text);

        try {
            // Get voice settings for the selected style
            const { voiceId, params } = this.voiceManager.getVoiceSettings(style);

            // Request TTS with timestamps from ElevenLabs
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
                {
                    text: text,
                    model_id: "eleven_monolingual_v1",
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
            
            // Convert base64 audio to buffer
            const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
            
            return {
                audioBuffer,
                alignment: response.data.alignment // Character timings for subtitles
            };

        } catch (error) {
            console.error("ElevenLabs TTS Error:", error.response?.data || error.message);
            throw new Error(`Speech generation failed: ${error.message}`);
        }
    }

    /**
     * Generate speech only (without timestamps) - useful for standalone TTS
     * @param {string} text - Text to synthesize
     * @param {string} style - Narrative style for voice selection
     * @returns {Promise<Buffer>} Audio buffer
     */
    async generateSpeech(text, style) {
        console.log('\n=== ELEVENLABS TTS (STANDALONE) ===');
        console.log('Style:', style);
        console.log('Text to synthesize:', text);

        try {
            const { voiceId, params } = this.voiceManager.getVoiceSettings(style);

            // Standard TTS endpoint (no timestamps)
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: params
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer' // Direct audio buffer
                }
            );

            console.log('✅ ElevenLabs TTS generated successfully');
            return Buffer.from(response.data);

        } catch (error) {
            console.error("ElevenLabs TTS Error:", error.response?.data || error.message);
            throw new Error(`Speech generation failed: ${error.message}`);
        }
    }

    /**
     * Clean text for TTS by removing special characters and formatting
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

    /**
     * Process character-level alignment data into word/phrase segments
     * @param {Object} alignment - Character timing data from ElevenLabs
     * @returns {Array} Array of phrase objects with start/end times
     */
    processPhrases(alignment) {
        const phrases = [];
        let currentPhrase = { text: '', words: [], start: null, end: 0 };
        let currentWord = { text: '', start: null, end: 0, chars: [] };

        // Iterate through characters to build words and phrases
        alignment.characters.forEach((char, index) => {
            const charStart = alignment.character_start_times_seconds[index];
            const charEnd = alignment.character_end_times_seconds[index];

            if (char !== ' ') {
                // Building a word
                if (currentWord.text === '') currentWord.start = charStart;
                currentWord.text += char;
                currentWord.end = charEnd;
                return;
            }

            // Space encountered - finalize current word
            if (currentWord.text) {
                this._finalizeWord(currentWord, currentPhrase);
                currentWord = { text: '', start: null, end: 0, chars: [] };
            }

            // Check for sentence-ending punctuation
            if (char === '.' || char === '!' || char === '?') {
                if (currentPhrase.words.length > 0) {
                    this._finalizePhrase(currentPhrase, phrases);
                    currentPhrase = { text: '', words: [], start: null, end: 0 };
                }
            }
        });

        // Handle any remaining words/phrases
        this._handleRemainingContent(currentWord, currentPhrase, phrases);

        // Split long phrases for better subtitle readability
        return this._splitLongPhrases(phrases);
    }

    /**
     * Add a completed word to the current phrase
     * @private
     */
    _finalizeWord(currentWord, currentPhrase) {
        currentPhrase.words.push({
            text: currentWord.text,
            start: currentWord.start,
            end: currentWord.end
        });
        if (currentPhrase.start === null) currentPhrase.start = currentWord.start;
        currentPhrase.end = currentWord.end;
    }

    /**
     * Finalize a complete phrase and add to phrases array
     * @private
     */
    _finalizePhrase(currentPhrase, phrases) {
        currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
        phrases.push({ ...currentPhrase });
    }

    /**
     * Handle any remaining content after processing all characters
     * @private
     */
    _handleRemainingContent(currentWord, currentPhrase, phrases) {
        if (currentWord.text) {
            this._finalizeWord(currentWord, currentPhrase);
        }
        if (currentPhrase.words.length > 0) {
            this._finalizePhrase(currentPhrase, phrases);
        }
    }

    /**
     * Split long phrases into smaller chunks for better subtitle readability
     * @private
     */
    _splitLongPhrases(phrases) {
        const finalPhrases = [];
        phrases.forEach(phrase => {
            // Calculate average word length to determine optimal phrase size
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

    /**
     * Split a single phrase into multiple smaller phrases
     * @private
     */
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