// public/script.js - Main client-side logic for the Historical Event Describer

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const form = document.getElementById('eventForm');          // Main input form
    const resultDiv = document.getElementById('result');        // Results display container
    const styleOptions = document.querySelectorAll('.style-option'); // All style option elements
    const styleInput = document.getElementById('style');        // Hidden input for selected style
    
    // State variables
    let lastGeneratedText = '';          // Store the last generated text for TTS
    let currentAudio = null;              // Currently playing audio object
    let audioBlobCache = null;            // Cached audio blob for replay

    // Add click handlers to style options
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update the hidden input value with the selected style
            styleInput.value = option.dataset.value;
        });
    });

    /**
     * Main generation function that orchestrates the entire process
     * Generates text, two images, and a video for the given event and style
     */
    async function generateAndDisplay(event, style) {
        try {
            // Reset state for new generation
            audioBlobCache = null;
            stopPlayback();
            resultDiv.innerHTML = '<div class="spinner"></div><p>Generating description...</p>';

            // Step 1: Generate text description using DeepSeek API
            const textResponse = await fetch('/api/describe-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, style })
            });
            
            if (!textResponse.ok) throw new Error('Failed to generate description');
            const textData = await textResponse.json();
            lastGeneratedText = textData.description;

            // Update UI to show video generation in progress
            resultDiv.innerHTML = `
                <div class="spinner"></div>
                <p>Generating video...</p>
            `;
            
            // Step 2: Generate FIRST image using DALL-E
            const imgResponse = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, style })
            });
            if (!imgResponse.ok) throw new Error('Failed to generate first image');
            const imgData = await imgResponse.json();

            // Step 3: Generate SECOND image using first image's prompt as context
            const img2Response = await fetch('/api/generate-image2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    event, 
                    style,
                    firstImagePrompt: imgData.promptUsed // Pass first prompt for context
                })
            });
            if (!img2Response.ok) throw new Error('Failed to generate second image');
            const img2Data = await img2Response.json();

            // Step 4: Generate video with both images and the text narration
            const videoResponse = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imageUrl: imgData.imageUrl,
                    imageUrl2: img2Data.imageUrl,
                    text: textData.description,
                    style
                })
            });
            
            if (!videoResponse.ok) throw new Error('Failed to generate video');
            
            // Create blob URL for video playback
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // Display all generated content
            resultDiv.innerHTML = `
                <div class="text-output">${lastGeneratedText}</div>
                <div class="image-grid">
                    <div class="image-container">
                        <img src="${imgData.imageUrl}" alt="First interpretation" class="history-image">
                        <p class="image-caption">First interpretation</p>
                    </div>
                    <div class="image-container">
                        <img src="${img2Data.imageUrl}" alt="Second interpretation" class="history-image">
                        <p class="image-caption">Alternative interpretation</p>
                    </div>
                </div>
                <video controls autoplay class="history-video">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
            
        } catch (error) {
            // Handle any errors during generation
            console.error('Error:', error);
            resultDiv.innerHTML = `
                <div class="error-alert">⚠️</div>
                <div class="error">${error.message}</div>
                ${lastGeneratedText ? `<div class="text-output">${lastGeneratedText}</div>` : ''}
            `;
        }
    }

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();  // Prevent default form submission
        
        // Get and validate form inputs
        const event = document.getElementById('event').value.trim();
        const style = document.getElementById('style').value;
        
        if (!event) {
            resultDiv.innerHTML = '<div class="error">Please enter a historical event</div>';
            return;
        }
        
        if (!style) {
            resultDiv.innerHTML = '<div class="error">Please select a style</div>';
            return;
        }
        
        // Start generation process
        await generateAndDisplay(event, style);
    });

    // Audio playback functions (currently not fully implemented in this file)
    function addAudioControls() { /* Legacy function - not used */ }
    function handleAudioButtonClick() { /* Legacy function - not used */ }
    async function playTTS(text) { /* TTS playback logic would go here */ }
    function playCachedAudio() { /* Play cached audio if available */ }
    function stopPlayback() { /* Stop currently playing audio */ }
});