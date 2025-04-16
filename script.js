// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const mainDisplayTextElement = document.getElementById('main-display-text');
    // No need for placeholderElement reference anymore
    const counterElement = document.getElementById('hand-counter');
    const cardButtons = document.querySelectorAll('.btn-card');
    const modifierButtons = document.querySelectorAll('.btn-modifier');
    const outcomeButtons = document.querySelectorAll('.btn-outcome');
    const clearButton = document.querySelector('.btn-action.clear');
    const hideButton = document.querySelector('.btn-action:not(.clear)');

    // --- State Variables --- (Remain the same)
    let card1 = null;
    let card2 = null;
    let suitModifier = null;
    let outcome = null;
    let handCount = 0;
    let isHidden = false;

    // --- Constants --- (Remain the same)
    const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const PLACEHOLDER_STRING = '~.~.~.:~.~.~.~.';
    const HIDE_CHAR = '*';

    // --- Helper Functions ---

    /**
     * Masks the hand portion (indices 0, 2, 4) of the fixed-width display string.
     * @param {string} displayStr - The calculated 18-character display string.
     * @param {boolean} shouldMask - Current value of the isHidden state.
     * @returns {string} - The potentially masked display string (e.g., "*.*.*.:~.K.~.~.").
     */
    function maskHandDisplay(displayStr, shouldMask) {
        // This function logic remains the same as the previous working version
        if (!shouldMask) {
            return displayStr;
        }
        let chars = displayStr.split('');
        if (card1) chars[0] = HIDE_CHAR;
        if (card2) chars[2] = HIDE_CHAR;
        if (suitModifier) chars[4] = HIDE_CHAR;
        return chars.join('');
    }

    /**
     * Calculates the raw (unmasked) fixed-width display string based on current state.
     * @returns {string} The 18-character display string (e.g., "~.~.A.:~.K.~.~.").
     */
    function calculateRawDisplayString() {
        // This function logic remains the same as the previous working version
        let chars = PLACEHOLDER_STRING.split('');

        if (card1) chars[0] = card1;
        if (card2) chars[2] = card2;
        if (suitModifier) chars[4] = suitModifier;

        let outcomeStr = outcome || '';
        if (outcomeStr.length === 4) {
            chars[7] = outcomeStr[0];
            chars[9] = outcomeStr[1];
            chars[11] = outcomeStr[2];
            chars[13] = outcomeStr[3];
        }
        return chars.join('');
    }

    /**
     * NEW: Takes a display string and wraps each character in a styled span.
     * @param {string} str - The string to stylize (e.g., "~.~.A.:~.K.~.~." or "*.*.*.:~.K.~.~.")
     * @returns {string} - An HTML string with styled spans.
     */
    function stylizeDisplayString(str) {
        let htmlString = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            let className = 'active'; // Default to active

            if (char === '~') {
                className = 'muted';
            } else if (char === '.' || char === ':') {
                className = 'separator';
            } else if (char === ' ') {
                // If we encounter spaces somehow, treat them as muted
                className = 'muted';
            } // Otherwise, it stays 'active' (covers A, K, *, W, !, etc.)

            htmlString += `<span class="display-char ${className}">${char}</span>`;
        }
        return htmlString;
    }


    // --- Main Update Function --- (Modified)
    function updateDisplay() {
        // 1. Calculate the raw string like "~.~.A.:~.K.~.~."
        const rawDisplayString = calculateRawDisplayString();

        // 2. Mask the hand part if needed -> "*.*.*.:~.K.~.~."
        const potentiallyMaskedString = maskHandDisplay(rawDisplayString, isHidden);

        // 3. Generate HTML with styled spans based on the potentially masked string
        const styledHtml = stylizeDisplayString(potentiallyMaskedString);

        // 4. Update the DOM using innerHTML for the main display
        mainDisplayTextElement.innerHTML = styledHtml; // Use innerHTML to render spans

        // 5. Update counter text
        counterElement.textContent = handCount;
    }

    // --- Event Handler Functions --- (Remain the same)
    function handleCardClick(rank) {
        let handWasComplete = (card1 && card2);

        if (!card1) {
            card1 = rank;
            suitModifier = null;
        } else if (!card2) {
            card2 = rank;
            suitModifier = (card1 === card2) ? null : 'o';
        } else {
            if (outcome) {
                card1 = rank;
                card2 = null;
                suitModifier = null;
                outcome = null;
            } else {
                card1 = rank;
                card2 = null;
                suitModifier = null;
            }
        }

        let handIsNowComplete = (card1 && card2);
        if (outcome && ((handIsNowComplete && !handWasComplete) || (!handIsNowComplete && handWasComplete))) {
             outcome = null;
        }

        updateDisplay();
    }

    function handleModifierClick(type) {
        if (card1 && card2 && card1 !== card2) {
            suitModifier = type;
            updateDisplay();
        }
    }

    function handleOutcomeClick(selectedOutcomeText) {
        if (card1 && card2) {
            let currentOutcomeValue = null;
            if (selectedOutcomeText.startsWith('Win')) currentOutcomeValue = 'Win~';
            else if (selectedOutcomeText.startsWith('Lose')) currentOutcomeValue = 'Lose';
            else if (selectedOutcomeText.startsWith('Fold')) currentOutcomeValue = 'Fold';

            if (!outcome) {
                handCount++;
            }
            outcome = currentOutcomeValue;
            updateDisplay();
        }
    }

    function handleClearClick() {
        card1 = null;
        card2 = null;
        suitModifier = null;
        outcome = null;
        updateDisplay();
    }

    function handleHideClick() {
        isHidden = !isHidden;
        hideButton.textContent = isHidden ? 'Show' : 'Hide';
        updateDisplay();
    }


    // --- Attach Event Listeners --- (Remain the same)
    cardButtons.forEach(button => {
        button.addEventListener('click', () => handleCardClick(button.textContent));
    });

    modifierButtons.forEach(button => {
        const type = button.textContent.trim().toLowerCase().startsWith('suited') ? 's' : 'o';
        button.addEventListener('click', () => handleModifierClick(type));
    });

    outcomeButtons.forEach(button => {
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
