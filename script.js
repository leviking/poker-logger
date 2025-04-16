// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const mainDisplayTextElement = document.getElementById('main-display-text');
    const counterElement = document.getElementById('hand-counter');
    // NEW: Stat value element references
    const foldPercentElement = document.getElementById('fold-percent');
    const winPercentElement = document.getElementById('win-percent');
    const losePercentElement = document.getElementById('lose-percent');
    // Button References (remain the same)
    const cardButtons = document.querySelectorAll('.btn-card');
    const modifierButtons = document.querySelectorAll('.btn-modifier');
    const outcomeButtons = document.querySelectorAll('.btn-outcome');
    const clearButton = document.querySelector('.btn-action.clear');
    const hideButton = document.querySelector('.btn-action:not(.clear)');

    // --- State Variables ---
    let card1 = null;
    let card2 = null;
    let suitModifier = null;
    let outcome = null; // 'Win~', 'Lose', 'Fold'
    let handCount = 0; // Total logged hands (Win+Lose+Fold)
    let isHidden = false;
    // NEW: State variables for win/loss/fold counts
    let winCount = 0;
    let loseCount = 0;
    let foldCount = 0;

    // --- Constants --- (Remain the same)
    const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const PLACEHOLDER_STRING = '~.~.~.:~.~.~.~.';
    const HIDE_CHAR = '*';

    // --- Helper Functions --- (maskHandDisplay, calculateRawDisplayString, stylizeDisplayString remain the same)

    function maskHandDisplay(displayStr, shouldMask) {
        if (!shouldMask) return displayStr;
        let chars = displayStr.split('');
        if (card1) chars[0] = HIDE_CHAR;
        if (card2) chars[2] = HIDE_CHAR;
        if (suitModifier) chars[4] = HIDE_CHAR;
        return chars.join('');
    }

    function calculateRawDisplayString() {
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

    function stylizeDisplayString(str) {
        let htmlString = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            let className = 'active';
            if (char === '~') className = 'muted';
            else if (char === '.' || char === ':') className = 'separator';
            else if (char === ' ') className = 'muted';
            htmlString += `<span class="display-char ${className}">${char}</span>`;
        }
        return htmlString;
    }

    function padNumber(num) {
	return String(num).padStart(3, '0');
    }

    // --- Main Update Function --- (Modified to include stats update)
    function updateDisplay() {
        // 1. Calculate the raw main display string
        const rawDisplayString = calculateRawDisplayString();
        // 2. Mask the hand part if needed
        const potentiallyMaskedString = maskHandDisplay(rawDisplayString, isHidden);
        // 3. Generate HTML with styled spans for the main display
        const styledHtml = stylizeDisplayString(potentiallyMaskedString);
        // 4. Update the main display DOM using innerHTML
        mainDisplayTextElement.innerHTML = styledHtml;

        // 5. Update overall hand counter
        counterElement.textContent = handCount;

        // --- NEW: Calculate and Update Stats ---
        if (handCount > 0) {
            const foldPercent = Math.round((foldCount / handCount) * 100);
            const winPercent = Math.round((winCount / handCount) * 100);
            const losePercent = Math.round((loseCount / handCount) * 100);
            // Update stats DOM elements
            foldPercentElement.textContent = `${padNumber(foldPercent)}%`;
	    winPercentElement.textContent = `${padNumber(winPercent)}%`;
            losePercentElement.textContent = `${padNumber(losePercent)}%`;
        } else {
            // Reset stats display if handCount is 0
            foldPercentElement.textContent = `000%`;
            winPercentElement.textContent = `000%`;
            losePercentElement.textContent = `000%`;
        }
    }

    // --- Event Handler Functions ---

    // handleCardClick, handleModifierClick (Remain the same)
     function handleCardClick(rank) {
        let handWasComplete = (card1 && card2);

        if (!card1) {
            card1 = rank;
            suitModifier = null;
        } else if (!card2) {
            card2 = rank;
            suitModifier = (card1 === card2) ? 'o' : null;
        } else {
            if (outcome) { // Start fresh if previous hand was logged
                card1 = rank;
                card2 = null;
                suitModifier = null;
                outcome = null; // Also clear outcome when starting fresh
            } else { // If previous hand wasn't logged, replace first card
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

    // handleOutcomeClick (Modified to update specific win/loss/fold counts)
    function handleOutcomeClick(selectedOutcomeText) {
        if (card1 && card2) {
            let currentOutcomeValue = null;
            let newlyLogged = false; // Flag to track if this click logs a new outcome

            // Determine outcome value and check if it's different from current
            if (selectedOutcomeText.startsWith('Win') && outcome !== 'Win~') {
                currentOutcomeValue = 'Win~';
                if (!outcome) newlyLogged = true; // Only count if no previous outcome
                 if (outcome === 'Lose') loseCount--; // Adjust counts if switching outcome
                 if (outcome === 'Fold') foldCount--;
                 winCount++;
            } else if (selectedOutcomeText.startsWith('Lose') && outcome !== 'Lose') {
                currentOutcomeValue = 'Lose';
                 if (!outcome) newlyLogged = true;
                 if (outcome === 'Win~') winCount--;
                 if (outcome === 'Fold') foldCount--;
                 loseCount++;
            } else if (selectedOutcomeText.startsWith('Fold') && outcome !== 'Fold') {
                currentOutcomeValue = 'Fold';
                 if (!outcome) newlyLogged = true;
                 if (outcome === 'Win~') winCount--;
                 if (outcome === 'Lose') loseCount--;
                 foldCount++;
            } else {
                 // If clicking the same outcome again, do nothing to counts
                 currentOutcomeValue = outcome;
            }


             if (newlyLogged) {
                handCount++; // Increment total ONLY if it's a new outcome for this hand
             }

             // Ensure counts don't go negative (shouldn't happen with this logic, but safe)
             winCount = Math.max(0, winCount);
             loseCount = Math.max(0, loseCount);
             foldCount = Math.max(0, foldCount);

            outcome = currentOutcomeValue; // Set/overwrite outcome state
            updateDisplay();
        }
    }

    // handleClearClick (Modified to potentially reset stats if needed - currently doesn't)
    function handleClearClick() {
        card1 = null;
        card2 = null;
        suitModifier = null;
        outcome = null;
        // Note: Stats (win/lose/fold counts) and handCount currently PERSIST on clear.
        // If you want to reset stats on clear, uncomment below:
        // winCount = 0; loseCount = 0; foldCount = 0; handCount = 0;
        updateDisplay();
    }

     // handleHideClick (Remains the same)
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
    if (clearButton) clearButton.addEventListener('click', handleClearClick);
    if (hideButton) hideButton.addEventListener('click', handleHideClick);

    // --- Initial Display Update ---
    updateDisplay();

}); // End DOMContentLoaded listener
