document.addEventListener('DOMContentLoaded', () => {

    // --- Constants (from main script, needed here too) ---
    const STORAGE_KEY = 'pokerLoggerData';
    const HISTORY_KEY = 'pokerHandHistory';

    // --- DOM References (for history.html) ---
    const tableBody = document.getElementById('history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    const copyHistoryBtn = document.getElementById('copy-history-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const resetHistoryBtn = document.getElementById('reset-history-btn');
    // Back button is an <a> tag, no listener needed unless it was a <button>

    // --- State ---
    let handHistory = [];

    // --- Load and Display History ---
    function loadAndDisplayHistory() {
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            try {
                handHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Error loading hand history:', e);
                handHistory = [];
                alert('Error loading history data.'); // Inform user
            }
        } else {
            handHistory = [];
        }

        populateTable();
    }

    function populateTable() {
        if (!tableBody || !noHistoryMessage) return; // Ensure elements exist

        // Clear current table content
        tableBody.innerHTML = '';

        if (handHistory.length === 0) {
            noHistoryMessage.style.display = 'block'; // Show message
             tableBody.style.display = 'none'; // Hide table body
        } else {
            noHistoryMessage.style.display = 'none'; // Hide message
            tableBody.style.display = ''; // Show table body

            // Populate table rows (newest first)
            handHistory.slice().reverse().forEach(entry => { // Use slice().reverse() for non-destructive reverse
                const row = tableBody.insertRow();

                const cellHand = row.insertCell();
                const cellOutcome = row.insertCell();
                const cellDate = row.insertCell();
                const cellTime = row.insertCell();

                cellHand.textContent = entry.hand || 'N/A';
                cellOutcome.textContent = entry.outcome || 'N/A';

                // Basic date/time formatting (adjust as needed)
                try {
                     const date = new Date(entry.timestamp);
                     cellDate.textContent = !isNaN(date) ? date.toLocaleDateString() : (entry.date || 'N/A');
                     cellTime.textContent = !isNaN(date) ? date.toLocaleTimeString() : (entry.time || 'N/A');
                } catch(e) {
                     cellDate.textContent = entry.date || 'N/A';
                     cellTime.textContent = entry.time || 'N/A';
                }
            });
        }
    }

    // --- Action Functions (Copied/Adapted from script.js) ---

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

        navigator.clipboard.writeText(csvContent)
            .then(() => {
                const originalText = copyHistoryBtn.textContent;
                copyHistoryBtn.textContent = 'Copied!';
                copyHistoryBtn.classList.add('copied-feedback');
                if ('vibrate' in navigator) navigator.vibrate(100);
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

    function exportHandHistory() {
        if (handHistory.length === 0) {
            alert('No hand history to export.');
            return;
        }
        let csvContent = 'hand,outcome,timestamp,date,time\n';
        handHistory.forEach(entry => {
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
        URL.revokeObjectURL(url);
    }

    function resetStatistics() {
        if (confirm('Reset ALL statistics (Win/Loss/Fold %)?\nThis only resets the counts stored, not the hand history itself.\nThis cannot be undone.')) {
            // Load current main data
            let currentData = {};
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                try {
                    currentData = JSON.parse(savedData);
                } catch (e) {
                    console.error("Error reading data before resetting stats:", e);
                    // Proceed with empty data if load fails
                }
            }

            // Reset counts
            currentData.winCount = 0;
            currentData.loseCount = 0;
            currentData.foldCount = 0;
            currentData.handCount = 0; // Reset total count too

            // Save updated data back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
            alert('Statistics have been reset.');
            // No visual update needed on this page for stats, index.html will pick it up.
        }
    }

    function resetHistory() {
        if (confirm('Permanently delete ALL recorded hand history?\nThis also resets Win/Loss/Fold statistics.\nThis cannot be undone.')) {
             // Clear history array
             handHistory = [];
             // Save empty history to localStorage
             localStorage.setItem(HISTORY_KEY, JSON.stringify(handHistory));

            // Also reset counts in the main storage key
             let currentData = {};
             const savedData = localStorage.getItem(STORAGE_KEY);
              if (savedData) {
                 try { currentData = JSON.parse(savedData); } catch (e) { /* ignore error, start fresh */ }
              }
             currentData.winCount = 0;
             currentData.loseCount = 0;
             currentData.foldCount = 0;
             currentData.handCount = 0; // Reset total count too
             localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));


             // Update the table display immediately
             populateTable();
             alert('Hand history and statistics have been deleted.');
        }
    }

    // --- Attach Event Listeners (for history.html buttons) ---
    if (copyHistoryBtn) {
        copyHistoryBtn.addEventListener('click', copyHistoryToClipboard);
    }
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHandHistory);
    }
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', resetStatistics);
    }
    if (resetHistoryBtn) {
        resetHistoryBtn.addEventListener('click', resetHistory);
    }

    // --- Initial Load ---
    loadAndDisplayHistory();

}); // End DOMContentLoaded listener
