document.addEventListener('DOMContentLoaded', function() {
    // Inline error helpers for inputs
    function setInlineError(inputEl, message) {
        if (!inputEl) return;
        const container = inputEl.closest('.form-group') || inputEl.parentElement;
        if (!container) return;
        // Remove existing error first
        const existing = container.querySelector('.inline-error');
        if (existing) existing.remove();
        // Create error element
        const p = document.createElement('p');
        p.className = 'inline-error text-sm text-red-600 mt-2';
        p.textContent = message;
        container.appendChild(p);
        // Highlight input
        inputEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    }

    function clearInlineError(inputEl) {
        if (!inputEl) return;
        const container = inputEl.closest('.form-group') || inputEl.parentElement;
        if (container) {
            const existing = container.querySelector('.inline-error');
            if (existing) existing.remove();
        }
        inputEl.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    }
    // Robust image fallback for thumbnails
    function applyThumbnailFallback(img) {
        const fallbackYoutube = img.dataset.fallbackYoutube;
        const gameTitle = img.dataset.gameTitle;
        // If this is a Steam header image and we have a YouTube fallback, try that next
        if (fallbackYoutube && img.src.includes('steamcdn-a.akamaihd.net')) {
            img.src = `https://img.youtube.com/vi/${fallbackYoutube}/hqdefault.jpg`;
            img.onerror = function() {
                // Final fallback to placeholder
                img.src = `https://via.placeholder.com/600x300/1a202c/ffffff?text=${encodeURIComponent(gameTitle || 'No Thumbnail')}`;
                img.className = 'video-thumbnail w-full h-full object-contain p-4 bg-gray-800';
                img.onerror = null;
            };
        } else {
            // Final fallback to placeholder
            img.src = `https://via.placeholder.com/600x300/1a202c/ffffff?text=${encodeURIComponent(gameTitle || 'No Thumbnail')}`;
            img.className = 'video-thumbnail w-full h-full object-contain p-4 bg-gray-800';
            img.onerror = null;
        }
    }

    const thumbnailImages = document.querySelectorAll('.video-thumbnail');
    thumbnailImages.forEach(img => {
        // Attach error handler for future failures
        img.addEventListener('error', function() {
            applyThumbnailFallback(this);
        });
        // If image already finished loading but failed, apply fallback immediately
        if (img.complete && img.naturalWidth === 0) {
            applyThumbnailFallback(img);
        }
    });

    // Handle vote form submission
    const voteForm = document.getElementById('voteForm');
    const notification = document.getElementById('notification');
    const userNameInput = document.getElementById('userName');

    if (voteForm) {
        voteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userName = userNameInput ? userNameInput.value.trim() : '';
            if (!userName) {
                showNotification('Please enter your name', 'error');
                if (userNameInput) {
                    setInlineError(userNameInput, 'Please enter your name');
                    userNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    userNameInput.focus();
                }
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
                    if (userNameInput) clearInlineError(userNameInput);
                    
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
                    const msg = data.message || 'Error submitting vote';
                    showNotification(msg, 'error');
                    if (userNameInput && (msg.toLowerCase().includes('already voted') || msg.toLowerCase().includes('already submitted'))) {
                        setInlineError(userNameInput, 'This name has already voted. Please use a different name.');
                        userNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        userNameInput.focus();
                    }
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

    // Clear inline error when user starts typing a new name
    if (userNameInput) {
        userNameInput.addEventListener('input', () => clearInlineError(userNameInput));
    }

    // Function to check if an image exists
    function imageExists(url, callback) {
        const img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }

    // Function to create YouTube iframe
    async function createYouTubeIframe(videoId, container) {
        // Show loading state
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading video...</p>
            </div>
        `;
        
        try {
            // First check if the video is embeddable
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) {
                throw new Error('Video not embeddable');
            }
            
            // Create the iframe
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.className = 'w-full h-full absolute top-0 left-0';
            
            // Handle iframe load errors
            iframe.onerror = () => {
                showError(container, 'Failed to load video. Click to watch on YouTube.', () => {
                    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                });
            };
            
            // Handle successful load
            iframe.onload = () => {
                container.classList.add('video-playing');
            };
            
            // Clear the container and add the iframe
            container.innerHTML = '';
            container.appendChild(iframe);
            
        } catch (error) {
            console.error('Error creating YouTube iframe:', error);
            showError(container, 'Video not available. Click to watch on YouTube.', () => {
                window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            });
        }
    }

    // Function to handle video playback
    async function handleVideoPlayback(e) {
        console.log('Click event detected', e.target);
        
        // Handle clicks on the play button or its children
        let playButton = e.target.closest('.play-thumbnail');
        if (!playButton) {
            const playIcon = e.target.closest('.play-icon');
            if (playIcon) {
                playButton = playIcon.closest('.play-thumbnail');
            }
        }
        
        if (!playButton) {
            console.log('No play button found');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const videoId = playButton.dataset.videoId;
        const steamAppId = playButton.dataset.steamAppId;
        const container = playButton.closest('.video-container');
        
        if (!container) {
            console.error('Could not find video container');
            return;
        }
        
        const gameCard = container.closest('.game-card');
        if (!gameCard) {
            console.error('Could not find game card');
            return;
        }
        
        const gameLink = gameCard.querySelector('.game-title a');
        if (!gameLink) {
            console.error('Could not find game link');
            return;
        }
        
        const gameTitle = gameLink.textContent.trim();
        const gameUrl = gameLink.href;
        const specialGames = new Set([
            'GoldenEye: Source',
            'Renegade X',
            'StarCraft',
            'StarCraft 2',
            'Warcraft III: Reforged'
        ]);
        
        console.log('Playing video:', { videoId, steamAppId, gameTitle });
        
        // Show loading state
        container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                <p>Loading video...</p>
            </div>
        `;
        
        // Try Steam first if available (via backend proxy), then fall back to YouTube
        if (steamAppId) {
            try {
                const resp = await fetch(`/api/steam_media/${steamAppId}`);
                const media = await resp.json();
                if (resp.ok && media.success) {
                    // Prefer a movie if available
                    if (Array.isArray(media.movies) && media.movies.length > 0) {
                        const movie = media.movies[0];
                        const videoUrl = (movie.webm && (movie.webm.max || movie.webm[Object.keys(movie.webm)[0]]))
                            || (movie.mp4 && (movie.mp4.max || movie.mp4[Object.keys(movie.mp4)[0]]));
                        if (videoUrl) {
                            const videoElement = document.createElement('video');
                            videoElement.src = videoUrl;
                            videoElement.controls = true;
                            videoElement.autoplay = true;
                            videoElement.muted = true;
                            videoElement.playsInline = true;
                            videoElement.className = 'w-full h-full object-contain bg-black';
                            container.innerHTML = '';
                            container.appendChild(videoElement);
                            container.classList.add('video-playing');
                            return;
                        }
                    }
                    // Else try screenshots
                    if (Array.isArray(media.screenshots) && media.screenshots.length > 0) {
                        const screenshot = media.screenshots[0];
                        const img = document.createElement('img');
                        img.src = screenshot.path_full || screenshot.path_thumbnail;
                        img.alt = `Screenshot for ${gameTitle}`;
                        img.className = 'w-full h-full object-contain bg-black';
                        container.innerHTML = '';
                        container.appendChild(img);
                        container.onclick = () => window.open(`https://store.steampowered.com/app/${steamAppId}`, '_blank');
                        return;
                    }
                }
            } catch (err) {
                console.warn('Steam proxy failed, falling back to YouTube if available', err);
            }
            // If Steam path failed, we continue to YouTube fallback below
        }
        
        // If we have a YouTube video ID, try to play it
        if (videoId) {
            createYouTubeIframe(videoId, container).catch(error => {
                console.error('Error playing YouTube video:', error);
                if (specialGames.has(gameTitle)) {
                    // For these titles, guide users to their official page
                    showError(container, 'Learn more about the game', null, gameUrl, 'Learn More');
                    // Also make overlay click go to site
                    container.onclick = () => window.open(gameUrl, '_blank');
                } else {
                    showError(container, 'Error loading video. Click to watch on YouTube.', () => {
                        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                    });
                }
            });
            return;
        }
        
        // If we get here, we couldn't play anything
        if (specialGames.has(gameTitle)) {
            showError(container, 'Learn more about the game', null, gameUrl, 'Learn More');
            container.onclick = () => window.open(gameUrl, '_blank');
        } else {
            showError(container, 'No video available. Click to view game details.', () => window.open(gameUrl, '_blank'));
        }
    }
    
    // Add click event listener to document
    document.addEventListener('click', handleVideoPlayback);

    // Show error message in video container
    function showError(container, message, onClick = null, linkHref = null, linkLabel = 'Open Link') {
        const hasLink = !!linkHref;
        container.innerHTML = `
            <div class="video-error">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3>Video Unavailable</h3>
                <p>${message}</p>
                ${hasLink
                    ? `<a class="watch-button" href="${linkHref}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`
                    : `<button class="watch-button">Watch on YouTube</button>`
                }
            </div>
        `;
        
        if (!hasLink) {
            // Add click handler to the button
            const button = container.querySelector('.watch-button');
            if (button && onClick) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onClick();
                });
            }
            
            // Also make the whole container clickable
            if (onClick) {
                container.onclick = (e) => {
                    if (e.target !== button) {
                        onClick();
                    }
                };
            }
        }
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
