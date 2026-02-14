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

Modify `services/imageService.js` to adjust DALL-E parameters:

```javascript
// Change image size or quality
const response = await this.openai.images.generate({
    model: "dall-e-3",                    // or "dall-e-2"
    prompt: prompt,
    size: "1024x1024",                     // Options: "256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"
    quality: "standard",                    // or "hd" (DALL-E 3 only)
    style: "natural",                       // or "vivid" (DALL-E 3 only)
    n: 1
});
```

### Voice Configuration

Modify `config/voices.js` to:
- Change voice IDs
- Adjust voice parameters (stability, similarity boost, speed)

```javascript
// Example: Adjust voice settings
settingsMap.brainrot = {
    params: { 
        stability: 0.8,        // 0-1 (lower = more expressive)
        similarity_boost: 0.9,  // 0-1 (closeness to original voice)
        style: 0.5,             // 0-1 (style exaggeration)
        speed: 1.0              // Playback speed multiplier
    }
};
```

### Video Settings

Modify `config/constants.js`:

```javascript
const VIDEO_CONFIG = {
    RESOLUTION: {
        WIDTH: 1080,            // Video width in pixels
        HEIGHT: 1920            // Video height in pixels
    },
    FPS: 30                      // Frames per second
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
   this.newStyleVoice = new ElevenLabs({
       apiKey: this.apiKey,
       voiceId: VOICE_IDS.NEW_STYLE
   });
   ```

3. **Add style mapping** in `getVoiceSettings`:
   ```javascript
   voiceMap: {
       // ... existing mappings
       new_style: this.newStyleVoice
   }
   ```

4. **Add prompt template** in `services/textService.js`:
   ```javascript
   getNewStylePrompt() {
       return "YOUR STYLE INSTRUCTIONS HERE\n";
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
│   ├── constants.js          # Configuration constants
│   └── voices.js             # Voice management
├── services/
│   ├── textService.js        # DeepSeek text generation
│   ├── imageService.js       # DALL-E image generation
│   └── videoService.js       # FFmpeg video creation
├── public/
│   ├── index.html            # Main page
│   ├── style.css             # Styles
│   ├── script.js             # Client logic
│   ├── select.js             # Style selection
│   └── images/               # Character avatars
├── .env                       # Environment variables
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 💰 Cost Estimation

| Service | Pricing | Cost per Request (est.) |
|---------|---------|------------------------|
| **DeepSeek** | $0.14 per 1M tokens | ~$0.001 |
| **OpenAI DALL-E 2** | $0.04 per image (1024×1024) | $0.08 (2 images) |
| **ElevenLabs** | Free tier: 10,000 characters/month<br>Starter: $5/month for 30,000 chars | Free tier available |

**Typical total cost per request:** ~$0.08-0.10 (with paid tiers)

## 🐛 Troubleshooting

### Common Issues

**Font Not Found / Subtitles Missing**
```
Error: Could not find font "Roboto Black"
```
**Solution:** Ensure Roboto Black is installed system-wide or modify the font in `videoService.js` (line ~210)

**FFmpeg Not Found**
```
Error: Cannot find ffmpeg
```
**Solution:** 
- Verify FFmpeg installation: `ffmpeg -version`
- Check system PATH includes FFmpeg
- Restart terminal/command prompt

**API Key Errors**
```
Error: 401 Unauthorized
```
**Solution:**
- Verify API keys in `.env` file
- Check for spaces or quotes around keys
- Ensure API keys are active and have available credits

**DALL-E Safety Filter**
```
Error: Your request was rejected as a result of our safety system
```
**Solution:** Try rephrasing the historical event with less graphic or sensitive language

**Video Generation Failed**
```
Error: Video generation failed
```
**Solution:** Check FFmpeg installation and ensure enough disk space in temp directory

## 📊 Performance Notes

- **Generation time**: 15-30 seconds per request
- **Video size**: ~5-10 MB per video
- **Memory usage**: ~200-300 MB during video processing
- **Temp files**: Automatically cleaned up after each request

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for DALL-E image generation
- **ElevenLabs** for realistic text-to-speech
- **DeepSeek** for affordable text generation
- **FFmpeg** for video processing capabilities
- **Computational Creativity for Design 2025** course for inspiration

---

**Created with ❤️ for bringing history to life through creative AI**
