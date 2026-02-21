// public/loadConfig.js - Loads character configurations from config.json and generates the UI dynamically

// Fetch the configuration when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the config.json file from the server
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Failed to load configuration');
        
        const config = await response.json();
        
        // Generate the style grid from the voices data
        generateStyleGrid(config.voices);
        
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback: show error message in the style grid
        const styleGrid = document.getElementById('styleGrid');
        if (styleGrid) {
            styleGrid.innerHTML = '<div class="error">Failed to load character options. Please refresh the page.</div>';
        }
    }
});

/**
 * Generate the style grid HTML from the voices configuration
 * @param {Object} voices - The voices object from config.json
 */
function generateStyleGrid(voices) {
    const styleGrid = document.getElementById('styleGrid');
    if (!styleGrid) return;

    // Clear any existing content
    styleGrid.innerHTML = '';

    // Convert voices object to array and sort by name or maintain order
    const voiceEntries = Object.entries(voices);
    
    // Generate HTML for each voice
    voiceEntries.forEach(([key, voice], index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'style-option';
        optionDiv.setAttribute('data-value', key);
        optionDiv.style.setProperty('--order', index + 1);
        
        // Create image element
        const img = document.createElement('img');
        img.src = voice.image_src;
        img.alt = voice.name;
        
        // Create span for the name
        const span = document.createElement('span');
        span.textContent = voice.name;
        
        // Append elements
        optionDiv.appendChild(img);
        optionDiv.appendChild(span);
        
        // Add to grid
        styleGrid.appendChild(optionDiv);
    });
    
    console.log(`✅ Loaded ${voiceEntries.length} character options from config`);
}