# History Tellers

A creative web application that brings historical events to life through AI-generated narratives, images, and videos—each told in unique character styles and dialects.

**Live Demo:** [Watch the Demo Video](https://youtu.be/Gc6b3Db6738)

## ✨ Features

- **9 Unique Storytelling Styles** - From Gen Z brainrot to Shakespearean, pirate to robot historian
- **AI-Powered Content Generation**:
  - 📝 **Text Narration** - DeepSeek API generates contextual historical descriptions
  - 🎨 **Dual Image Generation** - Two complementary DALL-E images per event (different perspectives)
  - 🎙️ **Voice Synthesis** - ElevenLabs TTS with character-appropriate voices and dialects
  - 🎬 **Automated Video Creation** - Combines images, audio, and word-by-word highlighted subtitles
- **Interactive Interface**:
  - Visual style selection with character avatars
  - Real-time generation progress indicators
  - Video playback with synchronized subtitles
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🚀 Features in Detail

### Available Storytelling Styles
| Style | Voice Characteristics | Visual Avatar |
|-------|----------------------|---------------|
| Gen Z Brainrot | Rapid-fire slang, chaotic energy | Brainrot icon |
| Italian Brainrot | Chaotic Italian nonsense, food references | Italian brainrot icon |
| Pirate Speak | Swaggering sailor talk, salty expressions | Pirate icon |
| Shakespearean | Elizabethan poetry, olden tongue | Shakespeare icon |
| African American Vernacular | Authentic street-smart flow | AAVE icon |
| Wise Storyteller | Elder metaphors, ancient rhythm | Storyteller icon |
| Factual, Serious | Academic precision, neutral tone | Factual icon |
| AI Historian | Mechanical clarity, statistical focus | Robot icon |
| Sarcastic | Witty gossip, historical snark | Sarcastic icon |

### Generated Output
- **Text Description**: 2-3 sentence paragraph in chosen style
- **Two Images**: 
  - First: Primary interpretation of the event/person
  - Second: Complementary perspective (different scene, angle, or detail)
- **Video**: 
  - 1080×1920 vertical format (optimized for mobile viewing)
  - Word-by-word highlighted subtitles
  - Character-appropriate voice narration
  - Seamless transition between both images

## 📋 Prerequisites

- **Node.js** (v16 or later)
- **npm** or **yarn** package manager
- **FFmpeg** (for video processing)
- **Roboto Black** font (for subtitles)
- **API Keys** from:
  - [OpenAI](https://platform.openai.com/) (DALL-E image generation)
  - [ElevenLabs](https://elevenlabs.io/) (Text-to-Speech)
  - [DeepSeek](https://deepseek.com/) (Prompt and text generation)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/history-tellers.git
cd history-tellers
```

### 2. Install Node Dependencies
```bash
npm install
```

This installs:
- `express` - Web server framework
- `axios` - HTTP client for API calls
- `dotenv` - Environment variable management
- `openai` - OpenAI SDK for DALL-E
- `elevenlabs-node` - ElevenLabs API wrapper
- `fluent-ffmpeg` - FFmpeg wrapper for video processing
- `@ffmpeg-installer/ffmpeg` - FFmpeg binary installer

### 3. Install FFmpeg

**Windows:**
- Download from [FFmpeg official site](https://ffmpeg.org/download.html)
- Extract to a folder (e.g., `C:\ffmpeg`)
- Add the `bin` folder to your system PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### 4. Install Roboto Black Font

**Windows:**
- Download from [Google Fonts - Roboto](https://fonts.google.com/specimen/Roboto)
- Extract and right-click `Roboto-Black.ttf` → **Install**

**macOS:**
- Download from Google Fonts
- Double-click `Roboto-Black.ttf` → **Install Font**

**Linux:**
```bash
# Create fonts directory if it doesn't exist
mkdir -p ~/.fonts

# Download and install
wget https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Black.ttf
mv Roboto-Black.ttf ~/.fonts/

# Update font cache
fc-cache -f -v
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Optional: Server Port (defaults to 3000)
PORT=3000
```

## 🎮 Usage

### Starting the Application

1. **Launch the server:**
   ```bash
   node server.js
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

### How to Use

1. **Enter an event or person**: e.g., "Moon Landing", "French Revolution", "Cleopatra"
2. **Select a storyteller style**: Click on any character avatar
3. **Click "Describe Event"** and wait for generation (typically 15-30 seconds)
4. **View results**:
   - Text description appears first
   - Two AI-generated images load
   - Video auto-plays with narration and subtitles

## ⚙️ Configuration Options

### Image Generation Settings

All image generation parameters are centralized in `config/constants.js`:

```javascript
// config/constants.js
const IMAGE_CONFIG = {
    MODEL: "dall-e-2",           // Change to "dall-e-3" for higher quality
    SIZE: "256x256",              // Options: "256x256", "512x512", "1024x1024", 
                                  // "1792x1024", "1024x1792" (DALL-E 3 only)
    N: 1                          // Number of images per request
};
```

**DALL-E 3 Configuration Example:**
```javascript
const IMAGE_CONFIG = {
    MODEL: "dall-e-3",
    SIZE: "1024x1024",            // DALL-E 3 supports larger sizes
    QUALITY: "hd",                 // "standard" or "hd" (DALL-E 3 only)
    STYLE: "vivid",                // "vivid" or "natural" (DALL-E 3 only)
    N: 1
};
```

### Voice Configuration

#### Voice Parameters

Modify `config/voices.js` to adjust voice parameters:

```javascript
// config/voices.js - Voice parameter adjustments
const settingsMap = {
    brainrot: {
        params: { 
            stability: 1,           // 0-1 (lower = more expressive/variable)
            similarity_boost: 1,     // 0-1 (closeness to original voice)
            style: 1,                // 0-1 (style exaggeration)
            speed: 0.9               // Playback speed multiplier
        }
    },
    italian_brainrot: {
        params: { 
            stability: 0.4, 
            similarity_boost: 0.7, 
            speed: 0.90, 
            speaker_boost: true      // Enhances speaker clarity
        }
    },
    // ... other styles
};
```

#### Voice ID Changes

To use different ElevenLabs voices, update the IDs in `config/constants.js`:

```javascript
// config/constants.js
const VOICE_IDS = {
    BRAINROT: "new-voice-id-here",     // Replace with your preferred voice ID
    ITALIAN_BRAINROT: "new-voice-id",
    PIRATE: "new-voice-id",
    SHAKESPEARE: "new-voice-id",
    AFRICAN_AMERICAN: "new-voice-id",
    STORYTELLER: "new-voice-id",
    MATTER_OF_FACT: "new-voice-id",
    ROBOT: "new-voice-id",
    SARCASTIC: "new-voice-id"
};
```

#### ElevenLabs Model Selection

The application uses ElevenLabs' text-to-speech API with configurable models. Modify `server.js` to change the TTS model:

```javascript
// In server.js - /api/generate-speech endpoint
// Current configuration (line ~78):
const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
        text: cleanText,
        model_id: "eleven_monolingual_v1",  // ← Change this value
        voice_settings: params
    },
    // ... rest of request
);
```

**Available ElevenLabs Models:**

| Model ID | Description | Best For |
|----------|-------------|----------|
| `eleven_monolingual_v1` | English-only, high quality | English narration, fastest |
| `eleven_multilingual_v1` | Multiple languages support | Non-English content |
| `eleven_multilingual_v2` | Enhanced multilingual, better quality | Professional multilingual |
| `eleven_turbo_v2` | Fastest generation, slightly lower quality | Real-time applications |
| `eleven_turbo_v2_5` | Latest turbo model, balanced speed/quality | Quick previews |
| `eleven_flash_v2` | Very fast, lower quality | Testing, drafts |
| `eleven_flash_v2_5` | Updated flash model | Rapid prototyping |

**Model Selection Examples:**

```javascript
// For high-quality English-only narration
model_id: "eleven_monolingual_v1"

// For Italian Brainrot style (supports Italian)
model_id: "eleven_multilingual_v2"

// For faster generation (lower quality)
model_id: "eleven_turbo_v2"

// For multiple languages with good quality
model_id: "eleven_multilingual_v2"
```

**Per-Style Model Configuration:**

To use different models per style, modify the TTS request in `server.js`:

```javascript
// In server.js - /api/generate-speech endpoint
const { voiceId, params, model } = voiceManager.getVoiceSettings(style);

const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
        text: cleanText,
        model_id: model || "eleven_monolingual_v1",  // Use style-specific model
        voice_settings: params
    },
    // ... rest of request
);
```

Then update `config/voices.js`:

```javascript
// config/voices.js
getVoiceSettings(style) {
    // ... existing code
    
    // Add model selection per style
    const modelMap = {
        brainrot: "eleven_monolingual_v1",
        italian_brainrot: "eleven_multilingual_v2",
        pirate: "eleven_monolingual_v1",
        shakespeare: "eleven_monolingual_v1",
        african_american: "eleven_monolingual_v1",
        storyteller: "eleven_monolingual_v1",
        matter_of_fact: "eleven_monolingual_v1",
        robot_historian: "eleven_turbo_v2",  // Robot voice faster
        sarcastic: "eleven_monolingual_v1"
    };

    return {
        voiceId: voice.voiceId,
        params: settings.params,
        model: modelMap[style] || "eleven_monolingual_v1"
    };
}
```

### Video Settings

Video parameters are configured in `config/constants.js`:

```javascript
// config/constants.js
const VIDEO_CONFIG = {
    RESOLUTION: {
        WIDTH: 1080,            // Video width in pixels
        HEIGHT: 1920            // Video height in pixels (portrait/vertical)
    },
    FPS: 30                      // Frames per second
};
```

### Subtitle Font Configuration

To change the subtitle font, modify `videoService.js`:

```javascript
// In videoService.js - generateAssSubtitles method (line ~210)
Style: Default,Roboto Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1
// Change "Roboto Black" to any system font, e.g., "Arial", "Helvetica", "Times New Roman"
```

### DeepSeek Text Generation Settings

Text generation parameters in `config/constants.js`:

```javascript
// config/constants.js
const DEEPSEEK_CONFIG = {
    MODEL: "deepseek-chat",       // DeepSeek model
    TEMPERATURE: 0.7,             // Creativity (0 = factual, 1 = creative)
    MAX_TOKENS: 200                // Maximum response length
};
```

### Adding New Story Styles

1. **Add voice ID** in `config/constants.js`:
   ```javascript
   VOICE_IDS: {
       // ... existing voices
       NEW_STYLE: "voice-id-here"
   }
   ```

2. **Add voice instance** in `config/voices.js`:
   ```javascript
   // In initializeVoices() method
   this.newStyleVoice = new ElevenLabs({
       apiKey: this.apiKey,
       voiceId: VOICE_IDS.NEW_STYLE
   });
   ```

3. **Add style mapping** in `getVoiceSettings`:
   ```javascript
   const voiceMap = {
       // ... existing mappings
       new_style: this.newStyleVoice
   };
   
   const settingsMap = {
       // ... existing settings
       new_style: {
           params: { stability: 0.7, similarity_boost: 0.8, speed: 1.0 }
       }
   };
   
   // Optional: Add model selection
   const modelMap = {
       // ... existing models
       new_style: "eleven_monolingual_v1"
   };
   ```

4. **Add prompt template** in `services/textService.js`:
   ```javascript
   // In buildPrompt() method
   case "new_style":
       prompt += this.getNewStylePrompt();
       break;
   
   // Add new method
   getNewStylePrompt() {
       return "YOUR STYLE INSTRUCTIONS HERE\n" +
              "Include specific vocabulary, tone, and character guidelines.\n";
   }
   ```

5. **Add to HTML** in `public/index.html`:
   ```html
   <div class="style-option" data-value="new_style" style="--order: 10;">
       <img src="images/new_style.png" alt="New Style" />
       <span>New Style Name</span>
   </div>
   ```

## 📁 Project Structure

```
history-tellers/
├── server.js                 # Main server entry point
├── config/
│   ├── constants.js          # Central configuration (API keys, sizes, models)
│   └── voices.js             # Voice management and parameters
├── services/
│   ├── textService.js        # DeepSeek text generation
│   ├── imageService.js       # DALL-E image generation (uses constants)
│   └── videoService.js       # FFmpeg video creation (uses constants)
├── public/
│   ├── index.html            # Main page
│   ├── style.css             # Styles
│   ├── script.js             # Client logic
│   ├── select.js             # Style selection
│   └── images/               # Character avatars
├── .env                       # Environment variables (API keys)
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 💰 Cost Estimation

| Service | Pricing | Cost per Request (est.) |
|---------|---------|------------------------|
| **DeepSeek** | $0.14 per 1M tokens | ~$0.001 |
| **OpenAI DALL-E 2** | $0.04 per image (1024×1024) | $0.08 (2 images) |
| **OpenAI DALL-E 3** | $0.08 per image (1024×1024) | $0.16 (2 images) |
| **ElevenLabs** | Free tier: 10,000 characters/month<br>Starter: $5/month for 30,000 chars | Free tier available |

**Typical total cost per request:** 
- **DALL-E 2:** ~$0.08-0.10 (with paid tiers)
- **DALL-E 3:** ~$0.16-0.18 (with paid tiers)

## 🐛 Troubleshooting

### Common Issues

**Font Not Found / Subtitles Missing**
```
Error: Could not find font "Roboto Black"
```
**Solution:** 
- Ensure Roboto Black is installed system-wide
- Or modify the font in `videoService.js` (line ~210) to use a different system font

**FFmpeg Not Found**
```
Error: Cannot find ffmpeg
```
**Solution:** 
- Verify FFmpeg installation: `ffmpeg -version`
- Check system PATH includes FFmpeg
- Restart terminal/command prompt after installation

**API Key Errors**
```
Error: 401 Unauthorized
```
**Solution:**
- Verify API keys in `.env` file (no spaces or quotes)
- Check API key dashboards for active status and credits
- Ensure correct environment file is loaded

**DALL-E Safety Filter**
```
Error: Your request was rejected as a result of our safety system
```
**Solution:** 
- Try rephrasing the historical event with less graphic language
- Avoid sensitive terms or explicit violence
- Be more abstract in description

**Video Generation Failed**
```
Error: Video generation failed
```
**Solution:** 
- Check FFmpeg installation
- Ensure sufficient disk space in temp directory
- Check file permissions for temp directory

**Images Not Loading**
```
Error: Failed to generate image
```
**Solution:**
- Verify OpenAI API key has DALL-E access
- Check if prompt is too long (>1000 characters)
- Ensure image size in constants is valid for selected model

**ElevenLabs Model Errors**
```
Error: Invalid model_id
```
**Solution:**
- Verify model name is correct (case-sensitive)
- Check if your ElevenLabs plan supports the selected model
- Some models require specific subscription tiers

**No Audio / TTS Fails**
```
Error: TTS generation failed
```
**Solution:**
- Verify ElevenLabs API key is valid
- Check character count (some plans have limits)
- Try a different model (e.g., switch from v2 to v1)

## 📊 Performance Notes

- **Generation time**: 15-30 seconds per request (varies by API response times)
- **Video size**: ~5-10 MB per video (depending on duration)
- **Memory usage**: ~200-300 MB during video processing
- **Temp files**: Automatically cleaned up after each request (located in system temp)
- **ElevenLabs model speed** (fastest to slowest): 
  - Flash > Turbo > Monolingual > Multilingual


## 📄 License

This project is licensed under the MIT License

## 🙏 Acknowledgments

- **OpenAI** for DALL-E image generation capabilities
- **ElevenLabs** for realistic text-to-speech synthesis
- **DeepSeek** for affordable and capable text generation
- **FFmpeg** for powerful video processing
- **Computational Creativity for Design 2025** course for inspiration and context

---
