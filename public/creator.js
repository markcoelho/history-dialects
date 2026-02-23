// Store characters
let builtInCharacters = {};
let currentEditKey = null;
let currentEditIsBuiltIn = false;
let autoCloseTimer = null;

// Load existing config on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCharacters();
});

async function loadCharacters() {
    try {
        // Load the original config to get built-in characters
        const response = await fetch('/config.json');
        if (!response.ok) throw new Error('Failed to load configuration');
        
        const config = await response.json();
        builtInCharacters = config.voices || {};
        
        // Display all characters
        displayCharacters(builtInCharacters);
        
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

function displayCharacters(builtIn) {
    const grid = document.getElementById('charactersGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Check if grid exists
    if (!grid) {
        console.error('Characters grid not found');
        return;
    }
    
    // Check if there are any characters
    if (Object.keys(builtIn).length === 0) {
        grid.innerHTML = '';
        if (emptyState) {
            grid.appendChild(emptyState);
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // Hide empty state if it exists
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    grid.innerHTML = '';
    
    // Sort characters alphabetically by name
    const sortedEntries = Object.entries(builtIn).sort((a, b) => 
        a[1].name.localeCompare(b[1].name)
    );
    
    sortedEntries.forEach(([key, character]) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('data-key', key);
        
        // Create image
        const img = document.createElement('img');
        img.src = character.image_src || 'images/placeholder.png';
        img.alt = character.name;
        img.className = 'character-image';
        img.onerror = function() { this.src = 'images/placeholder.png'; };
        
        // Create info div
        const infoDiv = document.createElement('div');
        infoDiv.className = 'character-info';
        
        const nameH3 = document.createElement('h3');
        nameH3.className = 'character-name';
        nameH3.textContent = character.name;
        
        const descP = document.createElement('p');
        descP.className = 'character-description';
        descP.textContent = character.description || '';
        
        infoDiv.appendChild(nameH3);
        infoDiv.appendChild(descP);
        
        // Create actions div
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'character-actions';
        
        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'Edit';
        editButton.onclick = function(e) { 
            e.stopPropagation();
            openEditModal(key); 
        };
        actionsDiv.appendChild(editButton);
        
        // Delete button for ALL characters
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = function(e) { 
            e.stopPropagation();
            deleteCharacter(key); 
        };
        actionsDiv.appendChild(deleteButton);
        
        infoDiv.appendChild(actionsDiv);
        
        // Assemble card
        card.appendChild(img);
        card.appendChild(infoDiv);
        
        grid.appendChild(card);
    });
}

function openCreateModal() {
    // Clear any existing timer
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
    
    currentEditKey = null;
    currentEditIsBuiltIn = false;
    document.getElementById('modalTitle').textContent = 'Create New Character';
    document.getElementById('characterForm').reset();
    document.getElementById('characterId').value = '';
    document.getElementById('characterKey').value = '';
    document.getElementById('characterKey').readOnly = false;
    document.getElementById('characterKey').disabled = false;
    document.getElementById('stability').value = '0.7';
    document.getElementById('similarityBoost').value = '0.8';
    document.getElementById('speed').value = '0.9';
    document.getElementById('characterModal').classList.add('show');
}

function openEditModal(key) {
    // Clear any existing timer
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
    
    console.log('Opening edit modal for:', key);
    
    // Get character from builtInCharacters
    const character = builtInCharacters[key];
    if (!character) {
        console.error('Character not found:', key);
        return;
    }
    
    currentEditKey = key;
    currentEditIsBuiltIn = true;
    
    document.getElementById('modalTitle').textContent = 'Edit Character';
    document.getElementById('characterId').value = key;
    document.getElementById('characterKey').value = key;
    document.getElementById('characterKey').readOnly = true;
    document.getElementById('characterKey').disabled = true;
    
    // Load all existing data into the form
    document.getElementById('characterName').value = character.name || '';
    document.getElementById('characterImage').value = character.image_src || '';
    document.getElementById('characterDescription').value = character.description || '';
    document.getElementById('voiceId').value = character.id || '';
    document.getElementById('stability').value = character.parameters?.stability || 0.7;
    document.getElementById('similarityBoost').value = character.parameters?.similarity_boost || 0.8;
    document.getElementById('speed').value = character.parameters?.speed || 0.9;
    document.getElementById('promptTemplate').value = character.prompt_template || '';
    
    document.getElementById('characterModal').classList.add('show');
}

function closeModal() {
    document.getElementById('characterModal').classList.remove('show');
    document.getElementById('characterKey').readOnly = false;
    document.getElementById('characterKey').disabled = false;
    document.getElementById('characterForm').reset();
}

async function saveCharacter(event) {
    event.preventDefault();
    
    const key = document.getElementById('characterKey').value;
    
    // First, load the current config
    const response = await fetch('/config.json');
    if (!response.ok) throw new Error('Failed to load current configuration');
    
    const currentConfig = await response.json();
    
    const characterData = {
        id: document.getElementById('voiceId').value,
        name: document.getElementById('characterName').value,
        image_src: document.getElementById('characterImage').value,
        description: document.getElementById('characterDescription').value,
        parameters: {
            stability: parseFloat(document.getElementById('stability').value),
            similarity_boost: parseFloat(document.getElementById('similarityBoost').value),
            speed: parseFloat(document.getElementById('speed').value)
        },
        prompt_template: document.getElementById('promptTemplate').value
    };
    
    // Update the voices with the new/edited character
    const updatedConfig = {
        ...currentConfig,
        voices: {
            ...currentConfig.voices,
            [key]: characterData
        }
    };
    
    // Save directly to JSON file
    try {
        const saveResponse = await fetch('/api/save-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedConfig)
        });
        
        if (!saveResponse.ok) throw new Error('Failed to save configuration');
        
        console.log('✅ Character saved');
        
        // Close modal
        closeModal();
        
        // Show success message and auto-reload
        showSuccessModal('saved');
        
    } catch (error) {
        console.error('❌ Failed to save:', error);
        alert('Failed to save. Please try again.');
        
        // Close modal
        closeModal();
    }
}

async function deleteCharacter(key) {
    console.log('Delete called for key:', key);
    
    // Get character name
    const characterName = builtInCharacters[key]?.name;
    
    if (!characterName) {
        console.error('Character not found for deletion:', key);
        return;
    }
    
    if (confirm(`Are you sure you want to permanently delete "${characterName}"? This will remove it from config.json.`)) {
        
        try {
            // First, load the current config
            const response = await fetch('/config.json');
            if (!response.ok) throw new Error('Failed to load current configuration');
            
            const currentConfig = await response.json();
            
            // Remove the character from the voices object
            if (currentConfig.voices && currentConfig.voices[key]) {
                delete currentConfig.voices[key];
            }
            
            // Send the updated config directly to the server
            const saveResponse = await fetch('/api/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentConfig)
            });
            
            if (!saveResponse.ok) throw new Error('Failed to save configuration');
            
            console.log('✅ Character deleted');
            
            // Show success message for delete and auto-reload
            showSuccessModal('deleted');
            
        } catch (error) {
            console.error('❌ Failed to delete character:', error);
            alert('Failed to delete character. Please try again.');
        }
    }
}

function goBack() {
    window.location.href = 'index.html';
}

// Show success modal with appropriate message - auto closes and reloads
function showSuccessModal(action) {
    const modal = document.getElementById('saveSuccessModal');
    const messageEl = document.getElementById('successMessage');
    
    if (action === 'deleted') {
        messageEl.textContent = '✓ Character deleted';
    } else {
        messageEl.textContent = '✓ Character saved';
    }
    
    modal.classList.add('show');
    
    // Clear any existing timer
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
    }
    
    // Auto close after 1.5 seconds and reload
    autoCloseTimer = setTimeout(() => {
        modal.classList.remove('show');
        window.location.reload();
    }, 1500);
}

// Remove closeSuccessModal function as it's no longer needed