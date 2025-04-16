// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const mainDisplayTextElement = document.getElementById('main-display-text');
    const counterElement = document.getElementById('hand-counter');
    const cardButtons = document.querySelectorAll('.btn-card');
    const modifierButtons = document.querySelectorAll('.btn-modifier');
    const outcomeButtons = document.querySelectorAll('.btn-outcome');
    const clearButton = document.querySelector('.btn-action.clear');
    const hideButton = document.querySelector('.btn-action:not(.clear)');

    // --- State Variables ---
    let card1 = null;
    let card2 = null;
    let suitModifier = null; // 's', 'o', or null
    let outcome = null;      // 'Win!', 'Lose', 'Fold', or null (Note: storing 'Win!' directly)
    let handCount = 0;
    let isHidden = false;    // Tracks the hide/show state

    // --- Constants ---
    const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const PLACEHOLDER_STRING = '~.~.~.:~.~.~.~.'; // Base "off" display (Length 18)
    const HIDE_CHAR = '*'; // Character to use for masking hand part

    // --- Helper Functions ---

    /**
     * Masks the hand portion (indices 0, 2, 4) of the fixed-width display string.
     * @param {string} displayStr - The calculated 18-character display string.
     * @param {boolean} shouldMask - Current value of the isHidden state.
     * @returns {string} - The potentially masked display string.
     */
    function maskHandDisplay(displayStr, shouldMask) {
        if (!shouldMask) {
            return displayStr; // Return original if not hidden
        }

        let chars = displayStr.split(''); // Work with characters

        // Mask hand parts only if they contain actual data (not '~')
        if (card1) chars[0] = HIDE_CHAR; // Mask Card 1 position
        if (card2) chars[2] = HIDE_CHAR; // Mask Card 2 position
        if (suitModifier) chars[4] = HIDE_CHAR; // Mask Suit Modifier position

        return chars.join(''); // Return the modified string
    }

    /**
     * Calculates the raw (unmasked) fixed-width display string based on current state.
     * @returns {string} The 18-character display string.
     */
    function calculateRawDisplayString() {
        let chars = PLACEHOLDER_STRING.split(''); // Start with the placeholder

        // Fill Card 1 slot
	if (card1) { 
		chars[0] = card1;
		chars[1] = '';
	}

        // Fill Card 2 slot
	if (card2) {
		chars[2] = card2;
		chars[3] = '';
	}

        // Fill Suit Modifier slot
	if (suitModifier) {
		chars[4] = suitModifier; // 's' or 'o'
		chars[5] = '';
	}

        // Fill Outcome slots (ensure 4 chars)
        let outcomeStr = outcome || ''; // Use outcome state, default to empty string if null

        // Normalize outcome representation if needed (already storing Win! directly)
        // This part assumes outcome state already holds 'Win!', 'Lose', or 'Fold'

        if (outcomeStr.length === 4) { // Check length just in case
            chars[7] = outcomeStr[0];
            chars[9] = outcomeStr[1];
            chars[11] = outcomeStr[2];
            chars[13] = outcomeStr[3];
	    chars[8] = ''
	    chars[10] = ''
	    chars[12] = ''
	    chars[14] = ''
        }

        return chars.join(''); // Combine characters back into the final string
    }

    // --- Main Update Function ---
    function updateDisplay() {
        // 1. Calculate the raw string based on state
        const rawDisplayString = calculateRawDisplayString();
        // 2. Mask the string if needed
        const finalDisplayString = maskHandDisplay(rawDisplayString, isHidden);

        // 3. Update the DOM
        mainDisplayTextElement.textContent = finalDisplayString;
        // Ensure counter updates correctly
        counterElement.textContent = handCount;
    }

    // --- Event Handler Functions ---

    function handleCardClick(rank) {
        let handWasComplete = (card1 && card2); // State before this click

        if (!card1) { // Selecting first card
            card1 = rank;
            suitModifier = null; // Clear modifier
            // Keep outcome from previous logged hand until new one logged or cleared
        } else if (!card2) { // Selecting second card
            card2 = rank;
            // Automatically set modifier based on pair vs non-pair
            suitModifier = (card1 === card2) ? 'o' : null; // null for pair, 'o' default otherwise
        } else { // Hand already complete (2 cards were selected)
            if (outcome) { // Start completely fresh if previous hand was logged
                card1 = rank;
                card2 = null;
                suitModifier = null;
                outcome = null;
            } else { // If previous hand wasn't logged, replace first card
                card1 = rank;
                card2 = null; // Force re-selection of second card
                suitModifier = null; // Clear modifier until second card re-selected
            }
        }

        // Clear outcome if hand structure changes after outcome was set
        let handIsNowComplete = (card1 && card2);
        if (outcome && ((handIsNowComplete && !handWasComplete) || (!handIsNowComplete && handWasComplete))) {
             outcome = null;
        }

        updateDisplay(); // Update after state change
    }

    function handleModifierClick(type) { // 's' or 'o'
        // Allow setting modifier only if 2 *different* cards are selected
        if (card1 && card2 && card1 !== card2) {
            suitModifier = type; // Explicitly set 's' or 'o'
            updateDisplay();
        }
        // Silently ignore if not applicable (e.g., pair or incomplete hand)
    }

    function handleOutcomeClick(selectedOutcomeText) {
        if (card1 && card2) { // Require two cards selected
            let currentOutcomeValue = null;
            // Ensure consistent internal state value ('Win!', 'Lose', 'Fold')
            if (selectedOutcomeText.startsWith('Win')) currentOutcomeValue = 'Win!';
            else if (selectedOutcomeText.startsWith('Lose')) currentOutcomeValue = 'Lose';
            else if (selectedOutcomeText.startsWith('Fold')) currentOutcomeValue = 'Fold';

            if (!outcome) { // Only count if setting outcome for the first time this hand
                handCount++;
            }
            outcome = currentOutcomeValue; // Set/overwrite outcome state
            updateDisplay();
        }
        // Silently ignore if clicked without two cards selected
    }

    function handleClearClick() {
        card1 = null;
        card2 = null;
        suitModifier = null;
        outcome = null;
        // isHidden state and handCount persist
        updateDisplay();
    }

    function handleHideClick() {
        isHidden = !isHidden; // Toggle state
        hideButton.textContent = isHidden ? 'Show' : 'Hide'; // Update button text
        updateDisplay(); // Re-render display with new mask state
    }

    // --- Attach Event Listeners ---
    cardButtons.forEach(button => {
        button.addEventListener('click', () => handleCardClick(button.textContent));
    });

    modifierButtons.forEach(button => {
        const type = button.textContent.trim().toLowerCase().startsWith('suited') ? 's' : 'o';
        button.addEventListener('click', () => handleModifierClick(type));
    });

    outcomeButtons.forEach(button => {
        // Pass the raw button text, handler will normalize if needed (for 'Win!')
        button.addEventListener('click', () => handleOutcomeClick(button.textContent));
    });

    if (clearButton) {
        clearButton.addEventListener('click', handleClearClick);
    }

    if (hideButton) {
        hideButton.addEventListener('click', handleHideClick);
    }

    // --- Initial Display Update ---
    updateDisplay();

}); // End DOMContentLoaded listener
