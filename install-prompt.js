// PWA Installation Prompt
document.addEventListener('DOMContentLoaded', () => {
    // Variables to control installation prompt
    let deferredPrompt;
    let installPromptShown = false;
    
    // Check if already installed
    const isAppInstalled = () => {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    };
    
    // Check if prompt was previously dismissed
    const wasPromptDismissed = () => {
        const lastDismissed = localStorage.getItem('installPromptDismissed');
        if (!lastDismissed) return false;
        
        // Check if it's been at least 7 days since last dismissal
        const dismissedDate = new Date(parseInt(lastDismissed));
        const daysSinceDismissed = (new Date() - dismissedDate) / (1000 * 60 * 60 * 24);
        
        return daysSinceDismissed < 7; // Only show again after 7 days
    };
    
    // Don't show prompt if already installed or recently dismissed
    if (isAppInstalled() || wasPromptDismissed()) {
        return;
    }
    
    // Create installation prompt element
    const createPromptElement = () => {
        // Create elements
        const promptContainer = document.createElement('div');
        promptContainer.className = 'install-prompt';
        
        const message = document.createElement('span');
        message.textContent = 'Add this app to your home screen for a better experience';
        
        const installButton = document.createElement('button');
        installButton.textContent = 'Install';
        installButton.addEventListener('click', handleInstallClick);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', dismissPrompt);
        
        // Assemble prompt
        promptContainer.appendChild(message);
        promptContainer.appendChild(installButton);
        promptContainer.appendChild(closeButton);
        
        return promptContainer;
    };
    
    // Handle install button click
    const handleInstallClick = () => {
        const promptElement = document.querySelector('.install-prompt');
        
        // Hide the prompt
        if (promptElement) {
            promptElement.style.display = 'none';
        }
        
        // Show the native install prompt if available
        if (deferredPrompt) {
            deferredPrompt.prompt();
            
            deferredPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        } else {
            // For iOS, show instructions
            showIOSInstructions();
        }
    };
    
    // Show iOS-specific instructions
    const showIOSInstructions = () => {
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isiOS) {
            const promptElement = document.querySelector('.install-prompt');
            if (promptElement) {
                promptElement.innerHTML = `
                    <p>Tap <strong>Share</strong> <span style="font-size: 1.2em">↑</span> then 
                    <strong>Add to Home Screen</strong> to install</p>
                    <button class="close">×</button>
                `;
                
                // Re-add close button listener
                const closeButton = promptElement.querySelector('.close');
                if (closeButton) {
                    closeButton.addEventListener('click', dismissPrompt);
                }
            }
        }
    };
    
    // Dismiss the prompt
    const dismissPrompt = () => {
        const promptElement = document.querySelector('.install-prompt');
        if (promptElement) {
            promptElement.style.display = 'none';
            
            // Store dismissal timestamp
            localStorage.setItem('installPromptDismissed', Date.now().toString());
        }
    };
    
    // Handle the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Don't show the custom prompt immediately - wait for a good moment
        // such as when the user has interacted with the app
        
        // We'll show it after a short delay to let the user see the app first
        setTimeout(() => {
            if (!installPromptShown && !isAppInstalled()) {
                showCustomInstallPrompt();
            }
        }, 30000); // Show after 30 seconds
    });
    
    // Show our custom install prompt
    const showCustomInstallPrompt = () => {
        if (installPromptShown) return;
        
        const promptElement = createPromptElement();
        document.body.appendChild(promptElement);
        
        // Display with animation
        setTimeout(() => {
            promptElement.classList.add('visible');
        }, 100);
        
        installPromptShown = true;
        
        // For iOS, we need different instructions
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isiOS) {
            showIOSInstructions();
        }
    };
    
    // Also show prompt when user has used the app for a while (engage point)
    document.addEventListener('click', () => {
        // Count user interactions
        const interactionCount = parseInt(localStorage.getItem('userInteractionCount') || '0') + 1;
        localStorage.setItem('userInteractionCount', interactionCount.toString());
        
        // Show prompt after 10 interactions if not already shown
        if (interactionCount === 10 && !installPromptShown && !isAppInstalled() && !wasPromptDismissed()) {
            showCustomInstallPrompt();
        }
    });
});
