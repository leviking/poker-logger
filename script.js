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
                resetCounts();
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
    }

    // Normalize hand (make sure higher card is first)
    function normalizeHand(firstCard, secondCard) {
        // If no cards, return null values
        if (!firstCard || !secondCard) {
            return { first: firstCard, second: secondCard };
        }
        
        // Get indices to determine rank
        const firstIndex = RANK_ORDER.indexOf(firstCard);
        const secondIndex = RANK_ORDER.indexOf(secondCard);
        
        // Lower index means higher card (A is index 0)
        if (firstIndex <= secondIndex) {
            // Cards are already in correct order
            return { first: firstCard, second: secondCard };
        } else {
            // Swap cards
            return { first: secondCard, second: firstCard };
        }
    }

    // Format hand as readable string (e.g., "AKs", "JTo", "77o")
    function formatHandString(firstCard, secondCard, modifier) {
        if (!firstCard || !secondCard) return '';
        
        let suitChar = '';
        if (firstCard === secondCard) {
            // Pairs always have 'o' modifier
            suitChar = 'o';
        } else if (modifier) {
            suitChar = modifier;
        }
        
        return `${firstCard}${secondCard}${suitChar}`;
    }

    // Add hand to history
    function recordHand(handString, outcomeValue) {
        if (!handString || !outcomeValue) return;
        
        // Format outcome (remove tilde from Win~)
        const cleanOutcome = outcomeValue.replace('~', '');
        
        // Add to history array with timestamp
        const timestamp = new Date().toISOString();
        handHistory.push({
            hand: handString,
            outcome: cleanOutcome,
            timestamp: timestamp,
            // Add formatted date for readability in exports
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });
        
        // Save to localStorage
        saveData();
    }

    // Export hand history as CSV
    function exportHandHistory() {
        if (handHistory.length === 0) {
            alert('No hand history to export.');
            return;
        }
        
        // Create CSV content
        let csvContent = 'hand,outcome,timestamp,date,time\n';
        
        handHistory.forEach(entry => {
            csvContent += `${entry.hand},${entry.outcome},${entry.timestamp},${entry.date},${entry.time}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `poker_hands_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Copy hand history to clipboard
    function copyHistoryToClipboard() {
        if (handHistory.length === 0) {
            alert('No hand history to copy.');
            return;
        }
        
        // Create CSV content
        let csvContent = 'hand,outcome,timestamp,date,time\n';
        
        handHistory.forEach(entry => {
            csvContent += `${entry.hand},${entry.outcome},${entry.timestamp},${entry.date},${entry.time}\n`;
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(csvContent)
            .then(() => {
                // Show success feedback
                const originalText = hideButton.textContent;
                
                hideButton.textContent = 'Copied!';
                hideButton.classList.add('copied');
                
                // Vibrate if available
                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    hideButton.textContent = originalText;
                    hideButton.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy data. Export option not available.');
            });
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
            
            // Apply hand normalization - always put higher card first
            const normalizedHand = normalizeHand(card1, card2);
            card1 = normalizedHand.first;
            card2 = normalizedHand.second;
            
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
                
                // Record the hand in history
                const handString = formatHandString(card1, card2, suitModifier);
                recordHand(handString, currentOutcomeValue);
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
	console.log('clicked hide')
        // Check if it's a long press (export to clipboard)
        if (hideButton.dataset.longPress === 'true') {
	    console.log('long pressed hide')
            // Copy history to clipboard
            copyHistoryToClipboard();
            // Reset long press flag
            hideButton.dataset.longPress = 'false';
            return;
        }
            copyHistoryToClipboard();
        
        // Regular click - toggle hide/show
        isHidden = !isHidden;
        hideButton.textContent = isHidden ? 'Show' : 'Hide';
        updateDisplay();
    }

    // Create export function that can be triggered via keyboard
    function showExportPrompt() {
        if (handHistory.length === 0) {
            alert('No hand history to export.');
            return;
        }
        
        if (confirm('Export hand history as CSV?')) {
            exportHandHistory();
        }
    }

    // --- Long Press Detection ---
    let longPressTimer;
    
    function startLongPress(e) {
        // Check if it's the clear button or hide button
        if (e.target.classList.contains('clear')) {
            longPressTimer = setTimeout(() => {
                e.target.dataset.longPress = 'true';
                e.target.classList.add('long-press');
                
                // Provide visual/haptic feedback that long press was detected
                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }
            }, 1000); // 1 second for long press
        } else if (!e.target.classList.contains('clear') && e.target.classList.contains('btn-action')) {
            // This is the hide/show button
            longPressTimer = setTimeout(() => {
                e.target.dataset.longPress = 'true';
                e.target.classList.add('long-press');
                
                // Provide visual/haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }
            }, 1000); // 1 second for long press
        }
    }
    
    function endLongPress(e) {
        clearTimeout(longPressTimer);
        e.target.classList.remove('long-press');
        e.target.dataset.longPress = 'false';
    }

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Only process if no input elements are focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = e.key.toUpperCase();
        
        // Card ranks
        if ('AKQJT98765432'.includes(key)) {
            // Find the corresponding button and simulate a click
            const buttonText = key === 'T' ? 'T' : key; // Handle 10 as T
            const matchingButton = Array.from(cardButtons).find(btn => 
                btn.textContent.trim().toUpperCase() === buttonText);
            
            if (matchingButton) {
                handleCardClick(buttonText);
            }
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
        if (key === 'O') handleModifierClick('o');
        
        // Export data - Ctrl+E
        if (key === 'E' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            showExportPrompt();
        }
        
        // Reset history - Ctrl+Shift+R
        if (key === 'R' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            if (confirm('Reset ALL hand history? This cannot be undone.')) {
                resetHistory();
            }
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
        hideButton.addEventListener('touchstart', startLongPress);
        hideButton.addEventListener('mousedown', startLongPress);
        hideButton.addEventListener('touchend', endLongPress);
        hideButton.addEventListener('mouseup', endLongPress);
        hideButton.addEventListener('mouseleave', endLongPress);
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
        
        // Vertical swipe down - export data
        if (Math.abs(yDiff) > Math.abs(xDiff) && yDiff < -100) {
            exportHandHistory();
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
