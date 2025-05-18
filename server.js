const express = require('express');
const axios = require('axios');

const assParser = require('ass-parser');
const assStringify = require('ass-stringify');

const app = express();
const PORT = 3000;

const { OpenAI } = require('openai');

app.use(express.json());
app.use(express.static('public'));

const ElevenLabs = require('elevenlabs-node');


const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');




require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Get from platform.openai.com
  });

// Initialize ElevenLabs (replace with your API key)
const voice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY, // Get from https://elevenlabs.io
    voiceId: "EXAVITQu4vr4xnSDxMaL" // Default voice ID
});

const brainrotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "pNInz6obpgDQGcFmaJgB"
});

const italianBrainrotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "pNInz6obpgDQGcFmaJgB" 
});

const pirateVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "tFEwp2OEgyZc3b1eWZ7e"
});

const shakespeareVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "qg9068uIPhh2zLXgBEgX"
});

const africanAmericanVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "6OzrBCQf8cjERkYgzSg8"
});

const storytellerVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "dPah2VEoifKnZT37774q"
});

const ukrainianManVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "BEprpS2vpgM32yNJpTXq"
});

const matterOfFactVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "dPah2VEoifKnZT37774q"
});


function getVoiceSettings(style) {
    switch(style) {
        case "brainrot":
            return {
                voiceId: brainrotVoice.voiceId,
                params: {
                    stability: 1,
                    similarity_boost: 1,
                    style: 1,
                    speed: 0.9
                }
            };
            
        case "italian_brainrot":
            return {
                voiceId: italianBrainrotVoice.voiceId,
                params: {
                    stability: 0.3,
                    similarity_boost: 0.7,
                    speed: 0.95,
                    speaker_boost: true
                }
            };
            
        case "pirate":
            return {
                voiceId: pirateVoice.voiceId,
                params: {
                    speed: 1
                }
            };
            
        case "shakespeare":
            return {
                voiceId: shakespeareVoice.voiceId,
                params: {
                    stability: 0.6,
                    similarity_boost: 0.75,
                    style: 0,
                    speed: 0.9
                }
            };
            
        case "african_american":
            return {
                voiceId: africanAmericanVoice.voiceId,
                params: {
                    stability: 0.5,
                    similarity_boost: 0.7,
                    style: 0,
                    speed: 0.9
                }
            };

        case "matter_of_fact":
            return {
                voiceId: matterOfFactVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.95
                }
            };

        case "robot_historian":
            return {
                voiceId: matterOfFactVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.95
                }
            };

        case "conspiracy_theorist":
            return {
                voiceId: matterOfFactVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.95
                }
            };
            
        case "storyteller":
            default:
            return {
                voiceId: storytellerVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.9
                }
            };
            
            
    }
}

function removeAsterisks(text) {
    // Remove all asterisks and any extra spaces they might leave
    return text.replace(/\*/g, '').replace(/\s{2,}/g, ' ').trim();
}

function cleanText(text) {
    return text
        .replace(/[*_#/]/g, ' ')  // Only replace specific formatting chars
        .replace(/\[.*?\]/g, '')   // Remove text in brackets
        .replace(/\s{2,}/g, ' ')   // Collapse multiple spaces into one
        .trim();
}

// Add this new endpoint
app.post('/api/generate-speech', async (req, res) => {
    const { text, style } = req.body;
    
    try {
        // Pre-process text
        const cleanText = cleanText(text);

        // Get voice settings
        const { voiceId, params } = getVoiceSettings(style);

        // Make API call to ElevenLabs with timestamps
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

      // [Rest of your existing code...]
      const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
      
  } catch (error) {
      console.error("TTS Error:", error.response?.data || error.message);
      res.status(500).json({ error: "TTS generation failed" });
  }
});


app.post('/api/generate-image', async (req, res) => {
    const { event } = req.body;

    try {
        // 1. Generate a policy-safe but accurate prompt
        const promptGenerationResponse = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
        model: "deepseek-chat",
        messages: [{
            role: "system",
            content: `Transform user requests into a DALL-E image prompt by following these rules:
            - If the request is about a person (including historical figures), generate a visual description that accurately matches their known physical appearance without using their name. Include details such as age, height, facial features, hairstyle, typical clothing, and the environment they are commonly associated with.
            - If the request is about a historical event — especially a sensitive one such as a disaster, attack, or violent conflict — rewrite the prompt using neutral, non-graphic language. Focus on describing the scene in objective, visually appropriate terms to reduce the chance of rejection by DALL-E's content filters.
            Your goal is to generate a safe, descriptive, and visually rich prompt that DALL-E will accept. Do not include people names or sensitive terms.`
                    }, {
            role: "user",
            content: `Create a DALL-E prompt for: ${event}`
        }],
        temperature: 0.4,  // Slightly higher for better creativity
        max_tokens: 200
    },
    {
        headers: {
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
        }
    }
);


        let prompt = promptGenerationResponse.data.choices[0].message.content;
        prompt = prompt.slice(0, 900);

        //console.log("Final prompt:", prompt);

        // 2. Generate image
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            size: "256x256",
            n: 1
        });

        res.json({
            imageUrl: response.data[0].url,
            promptUsed: prompt
        });

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to generate image",
            details: error.response?.data || error.message
        });
    }
});

// Add this new endpoint to server.js
app.post('/api/generate-image2', async (req, res) => {
    const { event } = req.body;

    try {
        // Generate a different variation of the prompt
        const promptGenerationResponse = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-chat",
                messages: [{
                    role: "system",
                    content: `Create a DIFFERENT visual interpretation of the requested event. Rules:
                    - Generate an alternative perspective or composition
                    - Use different visual elements than the first image
                    - Maintain historical accuracy but with creative variation
                    - Keep the same safety guidelines as the first image prompt
                    - Never include any harmful, violent, or inappropriate content`
                }, {
                    role: "user",
                    content: `Create a DALL-E prompt for: ${event}`
                }],
                temperature: 0.6,
                max_tokens: 200
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let prompt = promptGenerationResponse.data.choices[0].message.content;
        prompt = prompt.slice(0, 900).trim();

        // Validate prompt
        if (!prompt || prompt.length < 10) {
            throw new Error('Generated prompt is too short or empty');
        }

        console.log("Image 2 prompt:", prompt);

        // Generate image with additional safety checks
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            size: "256x256",
            n: 1
        });

        // Validate response
        if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error('Invalid response from DALL-E API');
        }

        res.json({
            imageUrl: response.data[0].url,
            promptUsed: prompt
        });

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



app.post('/api/describe-event', async (req, res) => {
    const { event, style } = req.body;
  
    // Base rules for ALL styles
    let prompt = `Describe "${event}" in this mode/style: ${style}. Rules:\n` +
                 "- Do NOT use asterisks or quotation marks\n" +
                "- Do NOT use dashes or bullet points\n" +
                "- Use era-appropriate slang or tone naturally\n" +
                "- Stay in character — your persona lives *in* that style’s world\n" +
                "- 1 sentence (3–5 words), nothing more\n";
  
    // Style-specific slang libraries
    switch(style) {
        case "brainrot":
            prompt +="GEN Z BRAINROT MODE:\n" +
                    "Use rapid-fire slang, chronically online energy, and chaotic Gen Z expressions.\n" +
                    "Speak like someone who scrolls 12 hours a day, thinks in memes, and never touches grass.\n" +
                    "Include at least one of these: rizz, ate, delulu, skibidi, W/L, it's giving ___, glow-up,\n" +
                    "cap/no cap, slay, fanum tax, sigma, main character energy, bussin’, based, touch grass, slaps,\n" +
                    "goofy ahh, low effort, goofy-core\n";
            break;

        case "italian_brainrot":
            prompt += "ITALIAN BRAINROT MODE:\n" +
                        "Generate chaotic Italian nonsense:\n" +
                        "1. Replace the event with a made-up Italian-sounding name\n" +
                        "2. Randomly mix food, pop culture, and false historical references\n" +
                        "3. Use drunk uncle logic and fractured grammar\n" +
                        "4. Rhyme by accident and abandon it immediately\n" +
                        "5. Include fake words and absurd phrases\n" +
                        "6. End in abrupt confusion\n";

            break;

        case "pirate":
            prompt += "PIRATE MODE:\n" +
                        "You’re a seasoned sailor with salt in yer veins and legends in yer beard.\n" +
                        "Ye understand power and treasure, not technology or landlubber nonsense.\n" +
                        "Speak with swagger and pirate slang: avast, scallywag, doubloons, landlubber,\n" +
                        "hornswoggle, bilge rat, splice the mainbrace, walk the plank, yo-ho-ho\n";

            break;
            
        case "shakespeare":
            prompt += "SHAKESPEAREAN STYLE:\n" +
                    "Thou art a bard, steeped in tragedy and stars, with no knowledge of modern tools.\n" +
                    "Speak in poetic flourish and Elizabethan drama.\n" +
                    "Use: dost, thou, zounds, varlet, knave, serpent, dove, wherefore, prithee, fie, methinks\n";

            break;
            
        case "hood_slang":
            prompt += "REAL ONE MODE (HOOD SLANG):\n" +
                    "Speak like you live it — honest, raw, grounded.\n" +
                    "You're from the block, no sugarcoating. Drop real wisdom.\n" +
                    "Use: deadass, bussin, flex, drip, on god, ten toes, cap, lit, woke, fam,\n" +
                    "trap, glow up, pull up, extra, lowkey, y’all, bet, no cap\n";

            break;

        case "matter_of_fact":
            prompt = "Describe the historical topic in a strictly factual, educational tone. Rules:\n" +
                        "- Use neutral, academic language\n" +
                        "- Present facts only\n" +
                        "- Avoid opinions, humor, or dramatic language\n" +
                        "- Maintain objective perspective\n" +
                        "- Use proper historical terminology\n\n" +
                        "Additional Guidelines:\n" +
                        "- Cite dates when known\n" +
                        "- Mention primary actors/parties involved\n" +
                        "- Note immediate consequences\n" +
                        "- Reference broader historical significance\n" +
                        "- Avoid colloquialisms and metaphors\n";

            break;
            
        case "storyteller":
            prompt += "STORYTELLER MODE:\n" +
                    "You’re a wise elder beside a fire, telling tales that echo across time.\n" +
                    "Use nature metaphors and ancient rhythm — rivers, winds, trees, fire.\n" +
                    "Speak with warmth, mystery, and slow-burning truth.\n" +
                    "Every line feels like a proverb.\n";

            break;

        case "robot_historian":
            prompt += "ROBOT HISTORIAN MODE:\n" +
                    "You are a precision-engineered data processor of historical events.\n" +
                    "Speak with mechanical clarity and statistical focus.\n" +
                    "Use awkward phrasing and formal analysis.\n" +
                    "Favor efficiency over eloquence.\n";

            break;

        case "conspiracy_theorist":
            prompt += "CONSPIRACY MODE:\n" +
                        "You know the truth the others won’t say out loud.\n" +
                        "Every event is a cover-up, a manipulation, a coded message.\n" +
                        "Use paranoid language, rhetorical questions, and shadowy suspicions.\n" +
                        "Mention secret societies, aliens, or ‘they’ often.\n";

            break;
    }
  
    try {

        console.log(prompt);

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Clean the response text
        const cleanDescription = removeAsterisks(response.data.choices[0].message.content);
        
        res.json({ 
            description: cleanDescription 
        });
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "API request failed" });
    }
});




  function secondsToAssTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}




  app.post('/api/generate-video', async (req, res) => {
        const { imageUrl, imageUrl2, text, style } = req.body;
    
    try {
        // Get voice settings
        const { voiceId, params } = getVoiceSettings(style);

        // 1. Get the audio stream WITH TIMESTAMPS
        const audioResponse = await axios.post(
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

        const audioBuffer = Buffer.from(audioResponse.data.audio_base64, 'base64');
        const alignment = audioResponse.data.alignment;

        // 2. Precise timestamp-based phrase splitting
        const phrases = [];
        let currentPhrase = {
            text: '',
            words: [],
            start: null,
            end: 0
        };

        // Track current word with precise timings
        let currentWord = {
            text: '',
            start: null,
            end: 0,
            chars: []
        };

        alignment.characters.forEach((char, index) => {
            const charStart = alignment.character_start_times_seconds[index];
            const charEnd = alignment.character_end_times_seconds[index];

            // Build current word
            if (char !== ' ') {
                if (currentWord.text === '') {
                    currentWord.start = charStart;
                }
                currentWord.text += char;
                currentWord.end = charEnd;
                currentWord.chars.push({ char, start: charStart, end: charEnd });
                return;
            }

            // Finalize current word if exists
            if (currentWord.text) {
                currentPhrase.words.push({
                    text: currentWord.text,
                    start: currentWord.start,
                    end: currentWord.end
                });
                
                if (currentPhrase.start === null) {
                    currentPhrase.start = currentWord.start;
                }
                currentPhrase.end = currentWord.end;
                
                currentWord = { text: '', start: null, end: 0, chars: [] };
            }

            // Finalize phrase at sentence boundaries
            if (char === '.' || char === '!' || char === '?') {
                if (currentPhrase.words.length > 0) {
                    currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
                    phrases.push({ ...currentPhrase });
                    currentPhrase = { text: '', words: [], start: null, end: 0 };
                }
            }
        });

        // Handle final word/phrase if exists
        if (currentWord.text) {
            currentPhrase.words.push({
                text: currentWord.text,
                start: currentWord.start,
                end: currentWord.end
            });
            if (currentPhrase.start === null) {
                currentPhrase.start = currentWord.start;
            }
            currentPhrase.end = currentWord.end;
        }
        if (currentPhrase.words.length > 0) {
            currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
            phrases.push({ ...currentPhrase });
        }

        // Now split long phrases while preserving original timestamps
        const finalPhrases = [];
        phrases.forEach(phrase => {
          // Calculate average word length in this phrase
          const avgWordLength = phrase.words.reduce((sum, word) => sum + word.text.length, 0) / phrase.words.length;
          
          // Determine max words based on average length
          let maxWords;
          if (avgWordLength > 4) {
              maxWords = 3; // Very long words - max 3 words per segment
          } else if (avgWordLength > 2) {
              maxWords = 4; // Medium-long words - max 4 words
          } else {
              maxWords = 5; // Short words - up to 5 words
          }
      
          // If phrase is short enough, keep as-is
          if (phrase.words.length <= maxWords) {
              finalPhrases.push(phrase);
              return;
          }
      
          // Split long phrases using original word timestamps
          let currentSegment = {
              text: '',
              words: [],
              start: phrase.words[0].start,
              end: phrase.words[0].end
          };
      
          phrase.words.forEach((word, i) => {
              // Start new segment if current one would exceed max words
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
      
          // Add final segment
          if (currentSegment.words.length > 0) {
              currentSegment.text = currentSegment.words.map(w => w.text).join(' ');
              finalPhrases.push({ ...currentSegment });
          }
      });





        //console.log("Final phrases with precise timings:", finalPhrases);

        const totalDuration = finalPhrases[finalPhrases.length - 1].end;

        // 3. Download the image
        const [imageResponse, imageResponse2] = await Promise.all([
            axios.get(imageUrl, { responseType: 'arraybuffer' }),
            axios.get(imageUrl2, { responseType: 'arraybuffer' })
        ]);

        const tempDir = tmpdir();
        const imagePaths = {
            original1: path.join(tempDir, `image1-${Date.now()}.png`),
            original2: path.join(tempDir, `image2-${Date.now()}.png`),
            upscaled1: path.join(tempDir, `upscaled1-${Date.now()}.png`),
            upscaled2: path.join(tempDir, `upscaled2-${Date.now()}.png`)
        };

        // Write original images
        await Promise.all([
            fs.promises.writeFile(imagePaths.original1, imageResponse.data),
            fs.promises.writeFile(imagePaths.original2, imageResponse2.data)
        ]);
        
        // 4. Create temp files
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        
        await fs.promises.writeFile(audioPath, audioBuffer);

        // 5. Upscale and pad the image (FIXED VERSION)
        await Promise.all([
    new Promise((resolve, reject) => {
        ffmpeg(imagePaths.original1)
            .outputOptions(['-vf', 'scale=1080:1080:flags=lanczos'])
            .output(imagePaths.upscaled1)
            .on('end', resolve)
            .on('error', reject)
            .run();
    }),
    new Promise((resolve, reject) => {
        ffmpeg(imagePaths.original2)
            .outputOptions(['-vf', 'scale=1080:1080:flags=lanczos'])
            .output(imagePaths.upscaled2)
            .on('end', resolve)
            .on('error', reject)
            .run();
    })
]);

      // 6. Generate ASS subtitles manually
function generateAssSubtitles(phrases) {
    let assContent = `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DM Serif Display Normal,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    phrases.forEach(phrase => {
        // First process words to get correct end times
        const processedWords = [];
        
        for (let i = 0; i < phrase.words.length; i++) {
            const currentWord = phrase.words[i];
            let wordEnd = currentWord.end;
            
            // If there's a next word, extend this word's end time 
            // to the next word's start time (including any space)
            if (i < phrase.words.length - 1) {
                wordEnd = phrase.words[i + 1].start;
            }
            
            processedWords.push({
                text: currentWord.text,
                start: currentWord.start,
                end: wordEnd
            });
        }

        // Generate karaoke subtitles with adjusted timings
        for (let i = 0; i < processedWords.length; i++) {
            const word = processedWords[i];
            const wordStart = secondsToAssTime(word.start);
            const wordEnd = secondsToAssTime(word.end);
            
            // Skip empty words (spaces)
            if (!word.text.trim()) continue;
            
            // Create highlighted version
            let highlightedText = '';
            for (let j = 0; j < processedWords.length; j++) {
                if (j === i) {
                    highlightedText += `{\\c&H00FFFF&}${processedWords[j].text}{\\c&HFFFFFF&}`;
                } else {
                    highlightedText += processedWords[j].text;
                }
                
                if (j < processedWords.length - 1) {
                    highlightedText += ' ';
                }
            }
            
            assContent += `Dialogue: 0,${wordStart},${wordEnd},Default,,0,0,700,,${highlightedText}\n`;
        }
    });

    return assContent;
}

function secondsToAssTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// Create ASS file
const assContent = generateAssSubtitles(finalPhrases);
const assPath = path.join(tempDir, `subtitles-${Date.now()}.ass`);
await fs.promises.writeFile(assPath, assContent);

// 7. Create video with ASS subtitles (Windows-specific path handling)
const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
await new Promise((resolve, reject) => {
    ffmpeg()
        // First upscaled image input
        .input(imagePaths.upscaled1)
        .inputOptions([
            '-loop 1',
            `-t ${totalDuration}`
        ])
        // Second upscaled image input
        .input(imagePaths.upscaled2)
        .inputOptions([
            '-loop 1',
            `-t ${totalDuration}`
        ])
        // Audio track
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .complexFilter([
            // Scale both images (though they're already scaled, this ensures consistency)
            '[0:v]scale=1080:1080[img1]',
            '[1:v]scale=1080:1080[img2]',
            // Stack vertically
            '[img1][img2]vstack=inputs=2[stacked]',
            // Apply subtitles
            `[stacked]ass='${escapedAssPath}'[v]`
        ])
        .outputOptions([
            '-map', '[v]',
            '-map', '2:a',  // Audio is now input 2 (since we have two image inputs)
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-movflags', '+faststart',
            '-r', '30'
        ])
        .output(videoPath)
        .on('end', () => {
            resolve();
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
        })
        .run();
});

// 8. Read and send video
const videoBuffer = await fs.promises.readFile(videoPath);

// 9. Clean up 
await Promise.all([
    fs.promises.unlink(audioPath),
    fs.promises.unlink(videoPath),
    fs.promises.unlink(assPath)
].map(p => p.catch(console.error)));
        
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