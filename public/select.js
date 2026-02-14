// public/select.js - Handles style selection interactions

// Get references to DOM elements
const styleGrid = document.getElementById('styleGrid');      // Container for style options
const hiddenInput = document.getElementById('style');        // Hidden input for form submission

// Add click event listener to the entire style grid (event delegation)
styleGrid.addEventListener('click', (event) => {
    // Find the closest style-option element that was clicked
    const clickedOption = event.target.closest('.style-option');
    
    if (clickedOption) {
        // Remove 'selected' class from all style options
        document.querySelectorAll('.style-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add 'selected' class to the clicked option for visual feedback
        clickedOption.classList.add('selected');

        // Update the hidden input value with the selected style's data-value attribute
        hiddenInput.value = clickedOption.dataset.value;
    }
});