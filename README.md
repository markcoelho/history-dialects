A web application that describes historical events in different character styles and dialects, complete with AI-generated images and narration.

demo: https://youtu.be/Gc6b3Db6738

```markdown


## Features

- Describe any historical event or figure in 9 different styles
- Generates two complementary AI images for each event
- Creates a video with synchronized subtitles and narration
- Multiple character voices with appropriate dialects
- Responsive design for desktop and mobile

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- FFmpeg (for video processing)
- Roboto Black font (for subtitles)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/history-tellers.git
   cd history-tellers
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install FFmpeg:
   - **Windows**: Download from [FFmpeg official site](https://ffmpeg.org/) and add to PATH
   - **Mac**: `brew install ffmpeg`
   - **Linux**: `sudo apt-get install ffmpeg`

4. Install Roboto Black font:
   - **Windows**: Download from [Google Fonts](https://fonts.google.com/specimen/Roboto) and install
   - **Linux**: Place the TTF file in `/usr/share/fonts/` or `~/.fonts/`

5. Create a `.env` file in the project root with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

## Configuration

### API Keys

You'll need accounts and API keys from:
- [OpenAI](https://platform.openai.com/) (for DALL-E image generation)
- [ElevenLabs](https://elevenlabs.io/) (for text-to-speech)
- [DeepSeek](https://deepseek.com/) (for prompt generation)

### Customization Options

1. **Image Generation**: Modify parameters in `server.js`:
   ```javascript
   const response = await openai.images.generate({
       model: "dall-e-3",
       prompt: prompt,
       size: "1024x1024",  // Can be "1024x1792" or "1792x1024" for DALL-E 3
       quality: "standard", // or "hd"
       style: "natural",    // or "vivid"
       n: 1
   });
   ```

2. **Voices**: Change voice IDs in `server.js` (line ~40):
   ```javascript
   const brainrotVoice = new ElevenLabs({
       apiKey: process.env.ELEVENLABS_API_KEY,
       voiceId: "mpgCuHlOy4oRiOklMDQ6" // Replace with preferred voice ID
   });
   ```

3. **Dialect Styles**: Modify prompts in the `describe-event` endpoint of `server.js`.

## Running the Application

1. Start the server:
   ```bash
   node server.js
   ```

2. Open your browser to:
   ```
   http://localhost:3000
   ```


## Pricing Notes

- **OpenAI DALL-E**: ~$0.04 per image (1024x1024 standard)
- **ElevenLabs**: Free tier available, then ~$0.30 per 1000 characters
- **DeepSeek**: Very low cost (~$0.001 per request)

## Troubleshooting

**Font Issues**:
- If subtitles don't appear correctly, ensure Roboto Black is installed system-wide
- Alternatively, modify line 800 in `server.js` to use a different font

**Video Generation Errors**:
- Verify FFmpeg is installed and in PATH
- Check available disk space in temp directory

**API Errors**:
- Verify all API keys are correct in `.env`
- Check each service's usage dashboard for quota limits

