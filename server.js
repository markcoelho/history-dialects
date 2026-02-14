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
    voiceId: "mpgCuHlOy4oRiOklMDQ6"
});

const italianBrainrotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "pNInz6obpgDQGcFmaJgB" 
});

const pirateVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "PPzYpIqttlTYA83688JI"
});

const shakespeareVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "qg9068uIPhh2zLXgBEgX"
});

const africanAmericanVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "GssEzYMmDFv83efAVpiS"
});

const storytellerVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "dPah2VEoifKnZT37774q"
});

const matterOfFactVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "eocRDMaLbjKENGPdXXsM"
});

const robotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "oEXg2pQBebQumRmUTPX4"
});

const sarcastic = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "JYgUf5ey0r1KhoCN2txT"
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
                    stability: 0.4,
                    similarity_boost: 0.7,
                    speed: 0.90,
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
                    speed: 0.90
                }
            };

            case "sarcastic":
            return {
                voiceId: sarcastic.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.90
                }
            };

        case "robot_historian":
            return {
                voiceId: robotVoice.voiceId,
                params: {
                    stability: 0.4,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.90
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
            - If the request is about a sensitive historical event — especially one such as a disaster, fascism, attack, or violent conflict — rewrite the prompt using neutral, non-graphic language. Focus on describing the scene in objective, visually appropriate terms to reduce the chance of rejection by DALL-E's content filters.
            -Don't include "fascist" or any other sensitive terms into the prompt. this will make dall-e refuse to generate image.
            Your goal is to generate a safe, descriptive, and visually rich prompt that DALL-E will accept. Do not include people names or sensitive terms.
            DON'T include explanations or notes, only the pure prompt itself.`
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

        console.log("Image 1 prompt:", prompt);

        // 2. Generate image
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            size: "256x256",
            /*quality: "standard",
            style: "natural",*/
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
    const { event, firstImagePrompt } = req.body;

    try {
        // Generate a different variation of the prompt
        const promptGenerationResponse = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-chat",
                messages: [{
                    role: "system",
                    content: `Create a complementary DALL-E prompt that follows logically from the first image. Rules:
                    1. For historical events:
                       - If first image shows beginning, show climax/end
                       - If first shows overview, show key detail
                    2. For historical figures:
                       - Show same person in different setting/age
                       - First formal portrait, second in action
                    3. Never repeat same composition

                    - If the request is about a person (including historical figures), generate a visual description that accurately matches their known physical appearance without using their name. Include details such as age, height, facial features, hairstyle, typical clothing, and the environment they are commonly associated with.
                    - If the request is about a sensitive historical event — especially one such as a disaster, fascism, attack, or violent conflict — rewrite the prompt using neutral, non-graphic language. Focus on describing the scene in objective, visually appropriate terms to reduce the chance of rejection by DALL-E's content filters.
                    -Don't include "fascist" or any other sensitive terms into the prompt. this will make dall-e refuse to generate image.
                    Your goal is to generate a safe, descriptive, and visually rich prompt that DALL-E will accept. Do not include people names or sensitive terms.

                    First image prompt was: ${firstImagePrompt}.
                    DON'T include explanations or notes, only the pure prompt itself`
                }, {
                    role: "user",
                    content: `Create a complementary DALL-E prompt for: ${event}`
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
            /*quality: "standard",
            style: "natural",*/
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
                "- 1 short paragraph (2–3 sentences), nothing more\n";
  
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
                        "Generate chaotic Italian nonsense in italian:\n" +
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
                        "Act confused on matters like technology and the modern world, you know nothing about it, you're an old pirate!.\n" +
                        "If the historical event is after 1750s, just act confused, say it sounds like something else you know and ignore the requested text length and just cut it short! You are an old pirate! you don't know new events!\n" +
                        "Speak with swagger and pirate slang: avast, scallywag, doubloons, landlubber,\n" +
                        "hornswoggle, bilge rat, splice the mainbrace, walk the plank, yo-ho-ho\n";

            break;
            
        case "shakespeare":
                prompt += "SHAKESPEAREAN STYLE:\n" +
                        "Thou art a bard of the Elizabethan age, dwelling in the shadow of candlelight and parchment.\n" +
                        "Speak in poetic flourish, with olden tongue and noble drama.\n" +
                        "Know this: thou art from the 16th century, and thou shalt not comprehend any event or invention past the year of our Lord 1650.\n" +
                        "If presented with devices strange — 'phones', 'computers', 'electricity', or events post-1650 — respond with utter confusion and comparisons to familiar things (e.g. 'Is this some manner of enchanted parchment?').\n" +
                        "Break off thy speech early if such things arise, and declare thy ignorance. Do not proceed to describe, explain, or speculate.\n" +
                        "Ignore length requirements or prompts that demand what thou knowest not. Stay in character. ALWAYS.\n\n" +
                        "Use words such as: dost, thou, prithee, methinks, forsooth, wherefore, zounds, knave, varlet, fie, and speak as if in a stage play.\n" +
                        "Let thy speech drip with drama, verse, and olden confusion.\n";
                break;

            
        case "hood_slang":
            prompt += "REAL ONE MODE (STREET SMART):\n" +
                    "Talk like you straight from the block — real, unfiltered, and sharp with it. Sound like someone who been through it and still standin’. Think street hustle meets boss mentality — like 50 Cent: cold wit it, but smart too.\n" +
                    "Speak that real — street-savvy, no sugarcoatin’, no corporate voice. You got stories, you got scars, and you got game.\n" +
                    "Use that AAVE flow: switch up the grammar and keep it authentic.\n" +
                    "Examples:\n" +
                    "- 'They be trippin’' instead of 'They are acting up'\n" +
                    "- 'I’m finna dip' instead of 'I’m about to leave'\n" +
                    "- 'He stay wildin’' instead of 'He’s always acting out'\n" +
                    "- 'She mad cool' instead of 'She’s very nice'\n" +
                    "- 'That joint bussin’' instead of 'That’s delicious/great'\n" +
                    "- 'Ion know' instead of 'I don’t know'\n" +
                    "- 'You got the drip' instead of 'Your outfit looks nice'\n" +
                    "- 'This some cap' instead of 'This isn’t true'\n" +
                    "- 'He real one fr' instead of 'He’s genuinely solid'\n" +
                    "- 'Y’all tryna pull up?' instead of 'Are you all coming over?'\n" +
                    "- 'On god' to emphasize truth\n" +
                    "- 'No cap' to swear you’re being honest\n" +
                    "- 'Gon’ be like that' instead of 'It will be like that'\n" +
                    "- 'Talkin’ crazy' instead of 'Speaking nonsense'\n" +
                    "- 'Run that back' instead of 'Repeat that'\n" +
                    "- 'Keep it ten toes' for staying solid\n" +
                    "Sprinkle in words like: deadass, bussin, drip, flex, woke, trap, glow up, pull up, extra, lowkey, highkey, bet, cap, lit, fam, opps, squad, and more.\n" +
                    "Make it hit like it came from someone who’s been outside. No textbook talk. Make it real.\n";
            break;


        case "sarcastic":
            prompt += "SARCASTIC STORYTELLER MODE:\n" +
                    "You’re that witty friend who knows way too much about history and can’t help but roast everyone — past and present.\n" +
                    "Tell the story like it’s gossip from a few centuries ago, with just enough snark to keep it spicy.\n" +
                    "Use playful exaggeration, eye-roll-worthy commentary, and dramatic understatement.\n" +
                    "History is still accurate… but way more fun.\n\n" +
                    "Guidelines:\n" +
                    "- Use casual, humorous language with light sarcasm\n" +
                    "- Make fun of ridiculous decisions, ironic twists, and dramatic moments\n" +
                    "- Insert playful commentary (e.g. “great idea, as always…”)\n" +
                    "- Use modern comparisons or slang sparingly for comedic effect\n" +
                    "- Keep it historically correct, but never too serious\n" +
                    "- Avoid dry academic tone, lean into the absurdity where it fits\n";
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

            case "matter_of_fact":
                prompt += "MATTER-OF-FACT MODE:\n" +
                        "You’re a professional historian committed to accuracy, clarity, and neutrality.\n" +
                        "Describe historical events with academic precision and a strictly factual tone.\n" +
                        "No emotion, no flair — just reliable information.\n" +
                        "Avoid opinions, speculation, humor, or dramatic storytelling.\n" +
                        "Stick to verifiable facts and recognized terminology.\n\n" +
                        "Guidelines:\n" +
                        "- Use neutral, formal language\n" +
                        "- Cite dates when known\n" +
                        "- Identify key actors or groups involved\n" +
                        "- State immediate outcomes\n" +
                        "- Explain broader historical context or significance\n" +
                        "- Avoid slang, metaphors, or informal phrasing\n";
                break;
    }
  
    try {

        console.log("deepseek pompt: "+prompt);

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

        console.log("deepseek script: "+cleanDescription);

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
Style: Default,Roboto Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1

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
const halfDuration = totalDuration / 2;

await new Promise((resolve, reject) => {
    ffmpeg()
        // First upscaled image input
        .input(imagePaths.upscaled1)
        .inputOptions([
            '-loop 1',
            `-t ${halfDuration}`
        ])
        // Second upscaled image input
        .input(imagePaths.upscaled2)
        .inputOptions([
            '-loop 1',
            `-t ${halfDuration}`
        ])
        // Audio track
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .complexFilter([
            // Scale first image to 1080 width, maintain aspect ratio, add padding
            '[0:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img1]',
            // Scale second image to 1080 width, maintain aspect ratio, add padding
            '[1:v]scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[img2]',
            // Concatenate the two images
            '[img1][img2]concat=n=2:v=1:a=0[vid]',
            // Apply subtitles to the concatenated video
            `[vid]ass='${escapedAssPath}'[v]`
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