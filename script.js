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

    // --- Constants ---
    const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const PLACEHOLDER_STRING = '~.~.~.:~.~.~.~.';
    const HIDE_CHAR = '*';
    const STORAGE_KEY = 'pokerLoggerData';

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
                resetCounts();
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
        counterElement.textContent = handCount;

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

        // Save state after every update
        saveData();
    }

    // --- Event Handler Functions ---

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

    function handleClearClick() {
        // Check if it's a long press (reset stats)
        if (clearButton.dataset.longPress === 'true') {
            // Reset counts only, not current hand
            resetCounts();
            // Reset long press flag
            clearButton.dataset.longPress = 'false';
            return;
        }
        
        // Regular clear - just reset current hand
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

    // --- Long Press Detection ---
    let longPressTimer;
    
    function startLongPress(e) {
        // Only proceed for clear button
        if (!e.target.classList.contains('clear')) return;
        
        longPressTimer = setTimeout(() => {
            e.target.dataset.longPress = 'true';
            e.target.classList.add('long-press');
            
            // Provide visual/haptic feedback that long press was detected
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }, 1000); // 1 second for long press
    }
    
    function endLongPress(e) {
        clearTimeout(longPressTimer);
        e.target.classList.remove('long-press');
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
        button.addEventListener('click', () => handleOutcomeClick(button.textContent));
    });
    
    if (clearButton) {
        clearButton.addEventListener('click', handleClearClick);
        clearButton.addEventListener('touchstart', startLongPress);
        clearButton.addEventListener('mousedown', startLongPress);
        clearButton.addEventListener('touchend', endLongPress);
        clearButton.addEventListener('mouseup', endLongPress);
        clearButton.addEventListener('mouseleave', endLongPress);
    }
    
    if (hideButton) {
        hideButton.addEventListener('click', handleHideClick);
    }

    // --- Add Swipe to Clear Gesture ---
    let xDown = null;
    let yDown = null;
    
    document.addEventListener('touchstart', (e) => {
        xDown = e.touches[0].clientX;
        yDown = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!xDown || !yDown) return;
        
        const xUp = e.changedTouches[0].clientX;
        const yUp = e.changedTouches[0].clientY;
        
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        
        // Horizontal swipe detection (left to right)
        if (Math.abs(xDiff) > Math.abs(yDiff) && xDiff < -50) {
            // Swipe right detected - clear current hand
            handleClearClick();
        }
        
        xDown = null;
        yDown = null;
    });
    
    // --- Prevent Zooming on Double-Tap for iOS ---
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // --- Prevent Pull-to-Refresh in PWA Mode ---
    document.addEventListener('touchmove', (e) => {
        if (window.navigator.standalone) {
            if (e.touches.length === 1 && e.targetTouches[0].pageY < 10) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // --- Initialize App ---
    loadData(); // Load saved data on startup
    
    // Check if app is in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        document.body.classList.add('pwa-mode');
    }

}); // End DOMContentLoaded listener
