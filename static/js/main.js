document.addEventListener('DOMContentLoaded', function() {
    // Handle vote form submission
    const voteForm = document.getElementById('voteForm');
    const notification = document.getElementById('notification');

    if (voteForm) {
        voteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(voteForm);
            
            fetch('/vote', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success notification
                    showNotification('Vote submitted successfully!', 'success');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error submitting vote. Please try again.', 'error');
            });
        });
    }

    // Handle YouTube video thumbnails and playback
    document.addEventListener('click', async function(e) {
        const playButton = e.target.closest('.play-thumbnail');
        if (!playButton) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const videoId = playButton.dataset.videoId;
        const container = playButton.closest('.video-container');
        const thumbnail = container.querySelector('.video-thumbnail-container');
        const gameTitle = container.closest('.game-card').querySelector('.game-title a').textContent;
        
        if (!videoId) {
            showError(container, 'No video available for this game');
            return;
        }
        
        // Show loading state
        container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        `;
        
        try {
            // Check if video is embeddable
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('Video not embeddable');
            
            // Create the iframe
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.className = 'w-full h-full absolute top-0 left-0';
            
            // Handle iframe errors
            iframe.onerror = () => showError(container, 'Error loading video');
            
            // Clear the container and add the iframe
            container.innerHTML = '';
            container.appendChild(iframe);
            container.classList.add('video-playing');
            
        } catch (error) {
            console.error(`Error loading video for ${gameTitle}:`, error);
            showError(container, 'Video unavailable. Click to try Steam store page instead.');
            container.onclick = () => {
                const gameLink = container.closest('.game-card').querySelector('.game-title a');
                if (gameLink) window.open(gameLink.href, '_blank');
            };
        }
    });

    // Show error message in video container
    function showError(container, message) {
        container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center cursor-pointer">
                <svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-lg font-medium">${message}</p>
                <p class="text-sm opacity-80 mt-1">Click to try Steam store page</p>
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
