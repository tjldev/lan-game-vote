document.addEventListener('DOMContentLoaded', function() {
    // Handle vote form submission
    const voteForm = document.getElementById('voteForm');
    const notification = document.getElementById('notification');

    if (voteForm) {
        voteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userName = document.getElementById('userName').value.trim();
            if (!userName) {
                showNotification('Please enter your name', 'error');
                return;
            }
            
            // Disable form to prevent multiple submissions
            const formElements = voteForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
            
            // Show loading state
            const submitButton = voteForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...</span>';
            
            try {
                // Collect all the votes
                const votes = {};
                const voteInputs = document.querySelectorAll('input[type="radio"]:checked');
                
                voteInputs.forEach(input => {
                    const gameId = input.name.replace('game_', '');
                    votes[gameId] = input.value;
                });
                
                const response = await fetch('/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_name: userName,
                        votes: votes
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    showNotification('Vote submitted successfully!', 'success');
                    
                    // Reset form
                    voteForm.reset();
                    
                    // Redirect to results after a short delay
                    setTimeout(() => {
                        window.location.href = '/results';
                    }, 1500);
                } else {
                    // Re-enable form on error
                    for (let i = 0; i < formElements.length; i++) {
                        formElements[i].disabled = false;
                    }
                    submitButton.innerHTML = originalButtonText;
                    
                    // Show error message
                    showNotification(data.message || 'Error submitting vote', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                
                // Re-enable form on error
                for (let i = 0; i < formElements.length; i++) {
                    formElements[i].disabled = false;
                }
                submitButton.innerHTML = originalButtonText;
                
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    // Handle video thumbnails and playback with fallback to Steam
    document.addEventListener('click', async function(e) {
        const playButton = e.target.closest('.play-thumbnail');
        if (!playButton) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const videoId = playButton.dataset.videoId;
        const steamAppId = playButton.dataset.steamAppId;
        const container = playButton.closest('.video-container');
        const gameCard = container.closest('.game-card');
        const gameLink = gameCard.querySelector('.game-title a');
        const gameTitle = gameLink.textContent;
        const gameUrl = gameLink.href;
        
        // Show loading state
        container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                <p>Loading video...</p>
            </div>
        `;
        
        // Try YouTube first if available
        if (videoId) {
            try {
                // Check if video is embeddable
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
                if (response.ok) {
                    // Create the iframe
                    const iframe = document.createElement('iframe');
                    iframe.width = '100%';
                    iframe.height = '100%';
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`;
                    iframe.setAttribute('frameborder', '0');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.className = 'w-full h-full absolute top-0 left-0';
                    
                    // Clear the container and add the iframe
                    container.innerHTML = '';
                    container.appendChild(iframe);
                    container.classList.add('video-playing');
                    return;
                }
            } catch (error) {
                console.warn('YouTube video not available, trying Steam fallback...');
            }
        }
        
        // If YouTube failed or not available, try Steam
        if (steamAppId) {
            try {
                // First try to get video from Steam API
                const steamResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}&filters=movies`);
                const steamData = await steamResponse.json();
                
                if (steamData && steamData[steamAppId]?.success && steamData[steamAppId].data?.movies?.length > 0) {
                    // Get the first available movie
                    const movie = steamData[steamAppId].data.movies[0];
                    // Prefer webm format, fallback to mp4
                    const videoUrl = movie.webm?.max || movie.mp4?.max;
                    
                    if (videoUrl) {
                        const videoElement = document.createElement('video');
                        videoElement.src = videoUrl;
                        videoElement.controls = true;
                        videoElement.autoplay = true;
                        videoElement.muted = true;
                        videoElement.className = 'w-full h-full object-contain bg-black';
                        
                        container.innerHTML = '';
                        container.appendChild(videoElement);
                        container.classList.add('video-playing');
                        return;
                    }
                }
                
                // If no video, show high-res screenshot
                const screenshotResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}&filters=screenshots`);
                const screenshotData = await screenshotResponse.json();
                
                if (screenshotData && screenshotData[steamAppId]?.success && 
                    screenshotData[steamAppId].data?.screenshots?.length > 0) {
                    // Show first screenshot in full resolution
                    const screenshot = screenshotData[steamAppId].data.screenshots[0];
                    const img = document.createElement('img');
                    img.src = screenshot.path_full || screenshot.path_thumbnail;
                    img.alt = `Screenshot for ${gameTitle}`;
                    img.className = 'w-full h-full object-contain';
                    
                    container.innerHTML = '';
                    container.appendChild(img);
                    container.onclick = () => window.open(gameUrl, '_blank');
                    return;
                }
                
            } catch (error) {
                console.error('Error loading Steam media:', error);
            }
        }
        
        // If all else fails, show error with store link
        showError(container, 'No video available. Click to view on store page.');
        container.onclick = () => window.open(gameUrl, '_blank');
    });

    // Show error message in video container
    function showError(container, message, showSteamNote = true) {
        container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center cursor-pointer">
                <svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-lg font-medium">${message}</p>
                ${showSteamNote ? '<p class="text-sm opacity-80 mt-1">Click to view on store page</p>' : ''}
            </div>
        `;
    }

    // Show notification helper function
    function showNotification(message, type = 'success') {
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg';
        
        // Set background color based on type
        if (type === 'success') {
            notification.classList.add('bg-green-500', 'text-white');
        } else {
            notification.classList.add('bg-red-500', 'text-white');
        }
        
        // Add transition classes
        notification.classList.add('transition-all', 'duration-300', 'ease-in-out', 'transform', 'translate-x-0', 'opacity-100');
        
        // Show notification
        notification.classList.remove('hidden');
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            
            // Remove from DOM after transition
            setTimeout(() => {
                notification.classList.add('hidden');
                notification.classList.remove('opacity-0', 'translate-x-full');
            }, 300);
        }, 3000);
    }
});
