// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const mainDisplayTextElement = document.getElementById('main-display-text');
    const counterElement = document.getElementById('hand-counter');
    // Stat value element references
    const foldPercentElement = document.getElementById('fold-percent');
    const winPercentElement = document.getElementById('win-percent');
    const losePercentElement = document.getElementById('lose-percent');
    // Button References
    const cardButtons = document.querySelectorAll('.btn-card');
    const modifierButtons = document.querySelectorAll('.btn-modifier');
    const outcomeButtons = document.querySelectorAll('.btn-outcome');
    const clearButton = document.querySelector('.btn-action.clear');
    const hideButton = document.querySelector('.btn-action:not(.clear)');
    // NEW: History View Elements
    const historyView = document.getElementById('history-view');
    const closeHistoryViewBtn = document.getElementById('close-history-view-btn');
    const copyHistoryBtn = document.getElementById('copy-history-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const resetHistoryBtn = document.getElementById('reset-history-btn');


    // --- State Variables ---
    let card1 = null;
    let card2 = null;
    let suitModifier = null;
    let outcome = null; // 'Win~', 'Lose', 'Fold'
    let handCount = 0; // Total logged hands (Win+Lose+Fold)
    let isHidden = false;
    // State variables for win/loss/fold counts
    let winCount = 0;
    let loseCount = 0;
    let foldCount = 0;
    // Hand history storage
    let handHistory = [];

    // --- Constants ---
    const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const PLACEHOLDER_STRING = '~.~.~.:~.~.~.~.';
    const HIDE_CHAR = '*';
    const STORAGE_KEY = 'pokerLoggerData';
    const HISTORY_KEY = 'pokerHandHistory';

    // --- Helper Functions ---

    // Load data from localStorage
    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Restore counts
                winCount = data.winCount || 0;
                loseCount = data.loseCount || 0;
                foldCount = data.foldCount || 0;
                handCount = data.handCount || 0;
                
                // Optionally restore current hand state
                card1 = data.card1 || null;
                card2 = data.card2 || null;
                suitModifier = data.suitModifier || null;
                outcome = data.outcome || null;
                isHidden = data.isHidden || false;
                
                // Update UI elements
                hideButton.textContent = isHidden ? 'Show' : 'Hide';
            } catch (e) {
                console.error('Error loading saved data:', e);
                // Reset to defaults if error
                resetCounts(); // Keep this behavior on load error
                resetHistory(); // Also clear history on load error
            }
        }

        // Load hand history
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            try {
                handHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Error loading hand history:', e);
                handHistory = [];
            }
        }
        
        updateDisplay();
    }

    // Save data to localStorage
    function saveData() {
        const data = {
            winCount,
            loseCount,
            foldCount,
            handCount,
            card1,
            card2, 
            suitModifier,
            outcome,
            isHidden
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Save hand history
        localStorage.setItem(HISTORY_KEY, JSON.stringify(handHistory));
    }

    // Reset all counters but keep current hand state
    function resetCounts() {
        winCount = 0;
        loseCount = 0; 
        foldCount = 0;
        handCount = 0;
        saveData();
        updateDisplay();
    }

    // Clear hand history
    function resetHistory() {
        handHistory = [];
        saveData();
        // Optionally give feedback or close the modal here if called from button
    }

    // Normalize hand (make sure higher card is first)
    function normalizeHand(firstCard, secondCard) {
        if (!firstCard || !secondCard) {
            return { first: firstCard, second: secondCard };
        }
        
        const firstIndex = RANK_ORDER.indexOf(firstCard);
        const secondIndex = RANK_ORDER.indexOf(secondCard);
        
        if (firstIndex <= secondIndex) {
            return { first: firstCard, second: secondCard };
        } else {
            return { first: secondCard, second: firstCard };
        }
    }

    // Format hand as readable string (e.g., "AKs", "JTo", "77o")
    function formatHandString(firstCard, secondCard, modifier) {
        if (!firstCard || !secondCard) return '';
        
        let suitChar = '';
        if (firstCard === secondCard) {
            // Default 'o' for pairs unless explicitly overridden by user (handled elsewhere)
            suitChar = modifier || 'o'; // Keep modifier if explicitly set, else 'o'
        } else if (modifier) {
            suitChar = modifier;
        }
        // If no modifier provided for non-pair, maybe default to 'o'? Or leave blank?
        // Current logic: requires modifier click for non-pairs. If that's okay, keep this.
        // If you want non-pairs to default to 'o', add: else { suitChar = 'o'; }

        return `${firstCard}${secondCard}${suitChar}`;
    }

    // Add hand to history
    function recordHand(handString, outcomeValue) {
        if (!handString || !outcomeValue) return;
        
        const cleanOutcome = outcomeValue.replace('~', '');
        
        const timestamp = new Date().toISOString();
        handHistory.push({
            hand: handString,
            outcome: cleanOutcome,
            timestamp: timestamp,
            date: new Date().toLocaleDateString(), // Consider locale options if needed
            time: new Date().toLocaleTimeString() // Consider locale options if needed
        });
        
        saveData();
    }

    // Export hand history as CSV
    function exportHandHistory() {
        if (handHistory.length === 0) {
            alert('No hand history to export.');
            return;
        }
        
        let csvContent = 'hand,outcome,timestamp,date,time\n';
        
        handHistory.forEach(entry => {
            // Handle potential commas in future data by quoting fields if needed
            const hand = entry.hand.includes(',') ? `"${entry.hand}"` : entry.hand;
            const outcome = entry.outcome.includes(',') ? `"${entry.outcome}"` : entry.outcome;
            csvContent += `${hand},${outcome},${entry.timestamp},${entry.date},${entry.time}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `poker_hands_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up blob URL
    }
    
    // Copy hand history to clipboard
    function copyHistoryToClipboard() {
        if (handHistory.length === 0) {
            alert('No hand history to copy.');
            return;
        }
        
        let csvContent = 'hand,outcome,timestamp,date,time\n';
        
        handHistory.forEach(entry => {
            const hand = entry.hand.includes(',') ? `"${entry.hand}"` : entry.hand;
            const outcome = entry.outcome.includes(',') ? `"${entry.outcome}"` : entry.outcome;
            csvContent += `${hand},${outcome},${entry.timestamp},${entry.date},${entry.time}\n`;
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(csvContent)
            .then(() => {
                // Show success feedback ON THE HISTORY VIEW BUTTON
                const originalText = copyHistoryBtn.textContent;
                
                copyHistoryBtn.textContent = 'Copied!';
                copyHistoryBtn.classList.add('copied-feedback'); // Use a class for styling
                
                // Vibrate if available
                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    copyHistoryBtn.textContent = originalText;
                    copyHistoryBtn.classList.remove('copied-feedback');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy data. Try the Export CSV option.');
            });
    }

    function maskHandDisplay(displayStr, shouldMask) {
        if (!shouldMask) return displayStr;
        let chars = displayStr.split('');
        // Mask logic remains the same
        if (card1) chars[0] = HIDE_CHAR;
        if (card2) chars[2] = HIDE_CHAR;
        if (suitModifier) chars[4] = HIDE_CHAR; // Only mask modifier if not a pair
        // Keep outcome visible even when hidden
        return chars.join('');
    }

    function calculateRawDisplayString() {
        let chars = PLACEHOLDER_STRING.split('');
        const normalized = normalizeHand(card1, card2); // Ensure consistency
        const displayCard1 = normalized.first;
        const displayCard2 = normalized.second;
        let displayModifier = suitModifier;

        if (displayCard1) chars[0] = displayCard1;
        if (displayCard2) chars[2] = displayCard2;

        // Automatically set modifier display for pairs, but respect explicit 's'/'o' if set
        if (displayCard1 && displayCard2) {
            if (displayCard1 === displayCard2) {
                 // For pairs, display 'o' unless user explicitly set 's' somehow (edge case)
                 chars[4] = (suitModifier === 's') ? 's' : 'o';
            } else if (displayModifier) {
                 chars[4] = displayModifier;
            }
         }


        let outcomeStr = outcome || '';
        // Ensure outcome display logic works if outcome changes format later
        if (outcomeStr.length >= 4) {
            chars[7] = outcomeStr[0];
            chars[9] = outcomeStr[1];
            chars[11] = outcomeStr[2];
            chars[13] = outcomeStr[3];
        } else if (outcomeStr) {
            // Basic fallback if outcome string is shorter (e.g., display first chars)
            for (let i = 0; i < outcomeStr.length && i < 4; i++) {
                chars[7 + i * 2] = outcomeStr[i];
            }
        }

        return chars.join('');
    }

    function stylizeDisplayString(str) {
        let htmlString = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            let className = 'active'; // Default to active
            if (char === '~') className = 'muted';
            else if (char === '.' || char === ':') className = 'separator';
            // Check for placeholder characters explicitly if needed, but '~' covers most
            // else if (char === ' ') className = 'muted'; // If spaces are used as placeholders

            // Ensure '*' from masking is styled like active characters
            if (char === HIDE_CHAR) className = 'active';

            htmlString += `<span class="display-char ${className}">${char}</span>`;
        }
        return htmlString;
    }


    function padNumber(num) {
        // Pad with leading zeros to ensure 3 digits
        return String(num).padStart(3, '0');
    }

    // --- Main Update Function ---
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
        counterElement.textContent = handCount; // Keep updating the number

        // Calculate and Update Stats
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

        // Save state after every update (consider debouncing if performance becomes an issue)
        saveData();
    }

    // --- Event Handler Functions ---

    function handleCardClick(rank) {
        let previousOutcome = outcome; // Store previous outcome before potential reset

        if (!card1) {
            card1 = rank;
            suitModifier = null; // Reset modifier when first card is selected
            outcome = null; // Reset outcome when starting a new hand selection
        } else if (!card2) {
            card2 = rank;
            // Normalize hand after second card is selected
            const normalizedHand = normalizeHand(card1, card2);
            card1 = normalizedHand.first;
            card2 = normalizedHand.second;
            // Default modifier: 'o' for pairs, null for non-pairs (requires modifier click)
            suitModifier = (card1 === card2) ? 'o' : null;
            outcome = null; // Reset outcome when second card is selected
        } else {
            // If hand is complete (card1, card2, maybe modifier, maybe outcome set)
            // Start a new hand
            card1 = rank;
            card2 = null;
            suitModifier = null;
            outcome = null; // Clear outcome when starting a new hand
        }

        // If an outcome *was* set before this click reset it, we might need to adjust counts
        // This scenario happens if user logged Win/Lose/Fold, then clicked a card rank again.
        // The current logic correctly resets `outcome` to null above. The counts were already
        // incremented when the outcome was first clicked. Starting a new hand doesn't require
        // decrementing counts here. The `handleOutcomeClick` logic handles adjustments if
        // the user *changes* an existing outcome *before* clicking a new card rank.

        updateDisplay();
    }

    function handleModifierClick(type) {
        // Allow setting modifier only if both cards are selected AND they are not a pair
        if (card1 && card2 && card1 !== card2) {
            suitModifier = type;
            // If an outcome was already selected, changing the modifier implies starting a new hand/entry logic
            // Decide if changing modifier should clear the outcome or not.
            // Current: Let's clear outcome if modifier is changed AFTER outcome was set.
             if (outcome) {
                 // This state is tricky. User logged "AKo Win", then clicks "Suited".
                 // Does it become "AKs Win" (adjusting history?) or "AKs" (clearing outcome)?
                 // Simpler: Treat modifier change after outcome as starting fresh conceptually for that hand detail.
                 // We won't adjust past counts, but clear the current outcome display.
                 // The *next* outcome click will log a new hand "AKs [outcome]".
                 // Let's just update the modifier and display for now. The user needs to click outcome again.
                 // outcome = null; // Optional: Uncomment to force re-selection of outcome
             }
            updateDisplay();
        } else if (card1 && card2 && card1 === card2) {
            // Optional: Vibrate or give feedback that modifiers don't apply to pairs?
             if ('vibrate' in navigator) { navigator.vibrate(50); }
        }
    }


    function handleOutcomeClick(selectedOutcomeText) {
        // Require a complete hand (both cards selected) to log an outcome
        // Also require a modifier ('s' or 'o') if the hand is not a pair
        const isPair = card1 === card2;
        const requiresModifier = !isPair;
        const modifierSet = suitModifier !== null;

        if (card1 && card2 && (isPair || (requiresModifier && modifierSet))) {
            let newOutcomeValue = null;
            let previousOutcomeValue = outcome; // Store the current outcome before changing
            let adjustment = { win: 0, lose: 0, fold: 0 }; // Track changes needed

            // Determine the new outcome based on button clicked
            if (selectedOutcomeText.startsWith('Win')) newOutcomeValue = 'Win~';
            else if (selectedOutcomeText.startsWith('Lose')) newOutcomeValue = 'Lose';
            else if (selectedOutcomeText.startsWith('Fold')) newOutcomeValue = 'Fold';
            else return; // Should not happen with current buttons

            // Check if this is a change from a previously logged outcome for *this specific hand*
            if (previousOutcomeValue && previousOutcomeValue !== newOutcomeValue) {
                // Decrement count for the old outcome
                if (previousOutcomeValue === 'Win~') adjustment.win--;
                else if (previousOutcomeValue === 'Lose') adjustment.lose--;
                else if (previousOutcomeValue === 'Fold') adjustment.fold--;
            }

            // Check if we are setting an outcome (either new or changing)
            if (newOutcomeValue && newOutcomeValue !== previousOutcomeValue) {
                 // Increment count for the new outcome
                 if (newOutcomeValue === 'Win~') adjustment.win++;
                 else if (newOutcomeValue === 'Lose') adjustment.lose++;
                 else if (newOutcomeValue === 'Fold') adjustment.fold++;
            }

             // Apply adjustments
             winCount += adjustment.win;
             loseCount += adjustment.lose;
             foldCount += adjustment.fold;


            // Increment total hand count ONLY if we are logging an outcome for the first time for this hand
            // Or if we are changing the outcome (which implies it was already counted) - handle this carefully.
            // Easiest: Only increment handCount if moving from no outcome (null) to an outcome.
            if (!previousOutcomeValue && newOutcomeValue) {
                handCount++;

                 // Record the hand in history *only* when first logging an outcome for it
                 const handString = formatHandString(card1, card2, suitModifier);
                 recordHand(handString, newOutcomeValue);
            } else if (previousOutcomeValue && newOutcomeValue !== previousOutcomeValue) {
                 // If changing outcome, update the *last* history entry? Or log a new one?
                 // Current recordHand adds a new entry. Let's stick with that for simplicity.
                 // If you want to *update* the last entry, more complex logic is needed here.
                 // For now, changing outcome logs a new entry and adjusts counts.
                  const handString = formatHandString(card1, card2, suitModifier);
                  recordHand(handString, newOutcomeValue); // Logs a duplicate hand with different outcome - decide if this is desired.
                  // Alternative: Find and update last entry if hand matches? (More complex)
            }


            // Ensure counts don't go negative (safety check)
            winCount = Math.max(0, winCount);
            loseCount = Math.max(0, loseCount);
            foldCount = Math.max(0, foldCount);
             // Ensure handCount reflects the sum if adjustments were made
             // This might be slightly off if changing outcome doesn't increment handCount but adjusts win/loss/fold.
             // Let's recalculate handCount based on win/loss/fold to be safe after adjustments.
             handCount = winCount + loseCount + foldCount; // Recalculate total based on counts


            outcome = newOutcomeValue; // Set the new outcome state
            updateDisplay();
        } else if (card1 && card2 && requiresModifier && !modifierSet) {
             // Hand needs modifier ('s' or 'o') before outcome can be logged
             // Optional: provide feedback (e.g., flash modifier buttons, vibrate)
             alert("Please select 'Suited' or 'Off' before logging the outcome.");
             if ('vibrate' in navigator) { navigator.vibrate([100, 50, 100]); }
        } else {
             // Cards not selected yet, do nothing or provide feedback
             if ('vibrate' in navigator) { navigator.vibrate(50); }
        }
    }


    // --- Simplified Event Handlers (No Long Press) ---

    function handleClearClick() {
        // Regular clear - just reset current hand input state
        card1 = null;
        card2 = null;
        suitModifier = null;
        outcome = null;
        updateDisplay();
    }

    function handleHideClick() {
        // Regular click - toggle hide/show
        isHidden = !isHidden;
        hideButton.textContent = isHidden ? 'Show' : 'Hide';
        updateDisplay(); // Update display to show/hide cards
    }

    // --- History/Stats View Functions ---

    function openHistoryView() {
        if (historyView) {
            historyView.classList.add('visible');
        }
    }

    function closeHistoryView() {
        if (historyView) {
            historyView.classList.remove('visible');
             // Reset copy button text if needed
             copyHistoryBtn.textContent = 'Copy History to Clipboard';
             copyHistoryBtn.classList.remove('copied-feedback');
        }
    }

    function handleResetStatsClick() {
        if (confirm('Reset ALL statistics (Win/Loss/Fold %)?\nThis only resets the counts, not the hand history.\nThis cannot be undone.')) {
            resetCounts(); // Resets win/loss/fold/hand counts
            closeHistoryView();
             alert('Statistics have been reset.');
        }
    }

    function handleResetHistoryClick() {
        if (confirm('Permanently delete ALL recorded hand history?\nThis cannot be undone.')) {
             resetHistory(); // Clears the handHistory array and saves
             // Also reset counts, as history is gone? Or keep counts separate?
             // Let's keep them separate for now. User might want to reset history but keep session stats.
             // If you want to reset counts too, call resetCounts() here.
             closeHistoryView();
             alert('Hand history has been deleted.');
             updateDisplay(); // Update stats in case counts were linked or changed
        }
    }

    // Create export function that can be triggered via keyboard or button
    function showExportPrompt() { // Renamed from original script
        if (handHistory.length === 0) {
            alert('No hand history to export.');
            return;
        }
        
        // Changed from confirm to direct export since it's behind a specific button now
        exportHandHistory();
        closeHistoryView(); // Optional: close view after export
    }


    // --- REMOVED Long Press Detection ---
    // let longPressTimer;
    // function startLongPress(e) { ... }
    // function endLongPress(e) { ... }

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Allow shortcuts even if history view is open? Or block them?
        // Let's allow them for now.

        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'BUTTON') { // Ignore if focus is on a button too
            // Exception: Allow Escape key to close history view
            if (e.key === 'Escape' && historyView && historyView.classList.contains('visible')) {
                 closeHistoryView();
            }
            return;
        }
        
        const key = e.key.toUpperCase();
        
        // Card ranks
        if ('AKQJT98765432'.includes(key)) {
            const buttonText = key === 'T' ? 'T' : key; // Handle 'T' for Ten
            handleCardClick(buttonText); // Directly call handler
        }
        
        // Outcome keys
        if (key === 'W') handleOutcomeClick('Win');
        if (key === 'L') handleOutcomeClick('Lose');
        if (key === 'F') handleOutcomeClick('Fold');
        
        // Other controls
        if (key === 'H') handleHideClick();
        if (key === 'C') handleClearClick();
        
        // Modifiers
        if (key === 'S') handleModifierClick('s');
        if (key === 'O') handleModifierClick('o'); // 'O' for Offsuit
        
        // Export data - Ctrl+E (Keep this as an alternative)
        if (key === 'E' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            showExportPrompt(); // Use the same function as the button
        }
        
        // Reset history - Ctrl+Shift+R (Keep this, but maybe remove if button is enough)
        if (key === 'R' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            // Directly call the confirmation and reset logic
            handleResetHistoryClick(); // Reuse the handler for the button click
        }

        // Close History View with Escape key
        if (e.key === 'Escape' && historyView && historyView.classList.contains('visible')) {
            closeHistoryView();
       }
    });

    // --- Attach Event Listeners ---
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
    
    // Simplified listeners for Clear and Hide (no long press)
    if (clearButton) {
        clearButton.addEventListener('click', handleClearClick);
    }
    if (hideButton) {
        hideButton.addEventListener('click', handleHideClick);
    }

    // --- NEW Event Listeners for History View ---
    if (counterElement) {
        counterElement.addEventListener('click', openHistoryView);
    }
    if (closeHistoryViewBtn) {
        closeHistoryViewBtn.addEventListener('click', closeHistoryView);
    }
    if (copyHistoryBtn) {
        copyHistoryBtn.addEventListener('click', copyHistoryToClipboard);
    }
     if (exportHistoryBtn) {
         exportHistoryBtn.addEventListener('click', showExportPrompt); // Use same function as shortcut
     }
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', handleResetStatsClick);
    }
    if (resetHistoryBtn) {
        resetHistoryBtn.addEventListener('click', handleResetHistoryClick);
    }
    // Close history view if clicking the background overlay
    if (historyView) {
        historyView.addEventListener('click', (e) => {
            if (e.target === historyView) { // Check if the click was directly on the overlay
                closeHistoryView();
            }
        });
    }


    // --- REMOVED Swipe Gestures (or keep if desired, but they don't conflict) ---
    // let xDown = null; ... etc.
    // Keep if you still want swipe right to clear and swipe down to export.
    // Modify swipe down to call showExportPrompt() if kept.

    // --- Keep Existing Prevent Zoom / Pull-to-Refresh ---
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        // Only prevent pull-to-refresh if the history view is NOT open
        if (!historyView || !historyView.classList.contains('visible')) {
            if (window.navigator.standalone) {
                 // More robust check: prevent if scrolling starts near the top
                 const touch = e.touches[0];
                 // Check if scrollable element is at the top
                 const isAtTop = document.documentElement.scrollTop === 0 && document.body.scrollTop === 0;
                 if (isAtTop && touch.clientY < 50) { // Adjust 50px threshold if needed
                     e.preventDefault();
                 }
            }
        }
    }, { passive: false });


    // --- Initialize App ---
    loadData(); // Load saved data on startup
    
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        document.body.classList.add('pwa-mode');
    }

}); // End DOMContentLoaded listener
