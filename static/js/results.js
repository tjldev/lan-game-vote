// Function to create a user list element
function createUserList(users, title, container) {
    if (!users || users.length === 0) return;
    
    const userList = document.createElement('div');
    userList.className = 'mt-2';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'text-sm font-medium text-gray-700';
    titleEl.textContent = title;
    userList.appendChild(titleEl);
    
    const userListEl = document.createElement('div');
    userListEl.className = 'text-sm text-gray-600 flex flex-wrap gap-1 mt-1';
    userListEl.textContent = users.join(', ');
    
    userList.appendChild(userListEl);
    container.appendChild(userList);
}

// Function to create a game card
function createGameCard(game, rank, type) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden';
    
    // Card header with game info
    const header = document.createElement('div');
    header.className = 'p-4 border-b border-gray-100';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-800';
    title.textContent = `${rank}. ${game.title}`;
    
    const count = document.createElement('p');
    count.className = 'text-sm text-gray-500';
    count.textContent = `${game.count} ${type === 'interested' ? 'interested' : 'maybe interested'} ${game.count === 1 ? 'player' : 'players'}`;
    
    header.appendChild(title);
    header.appendChild(count);
    
    // Card body with user lists
    const body = document.createElement('div');
    body.className = 'p-4 space-y-3';
    
    // Add interested users if available
    if (game.interested && game.interested.length > 0) {
        createUserList(game.interested, 'Interested:', body);
    }
    
    // Add maybe interested users if available
    if (type === 'maybe' && game.maybe && game.maybe.length > 0) {
        createUserList(game.maybe, 'Maybe Interested:', body);
    }
    
    // Add not interested users if available
    if (game.not_interested && game.not_interested.length > 0) {
        createUserList(game.not_interested, 'Not Interested:', body);
    }
    
    card.appendChild(header);
    card.appendChild(body);
    
    return card;
}

// Function to display the results
function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    // Clear previous content
    resultsContainer.innerHTML = '';
    
    // Create a container for the results
    const container = document.createElement('div');
    container.className = 'space-y-8';
    
    // Add a title
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-center mb-2';
    title.textContent = 'Voting Results';
    container.appendChild(title);
    
    // Add a subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 text-center mb-8';
    const totalVoters = data.users ? data.users.length : 0;
    subtitle.textContent = `Total voters: ${totalVoters}`;
    container.appendChild(subtitle);
    
    // Create a grid for the results
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    
    // Add interested games
    const interestedCol = document.createElement('div');
    interestedCol.className = 'space-y-4';
    
    const interestedTitle = document.createElement('h2');
    interestedTitle.className = 'text-2xl font-semibold text-center pb-2 border-b border-gray-200';
    interestedTitle.textContent = 'Most Wanted Games';
    interestedCol.appendChild(interestedTitle);
    
    if (data.top_interested && data.top_interested.length > 0) {
        data.top_interested.forEach((game, index) => {
            const gameData = data.games.find(g => g.title === game.title) || {};
            const gameCard = createGameCard({
                ...gameData,
                title: game.title,
                count: game.count
            }, index + 1, 'interested');
            interestedCol.appendChild(gameCard);
        });
    } else {
        const noGames = document.createElement('p');
        noGames.className = 'text-gray-500 text-center py-4';
        noGames.textContent = 'No votes yet';
        interestedCol.appendChild(noGames);
    }
    
    // Add maybe interested games
    const maybeCol = document.createElement('div');
    maybeCol.className = 'space-y-4';
    
    const maybeTitle = document.createElement('h2');
    maybeTitle.className = 'text-2xl font-semibold text-center pb-2 border-b border-gray-200';
    maybeTitle.textContent = 'Maybe Interested';
    maybeCol.appendChild(maybeTitle);
    
    if (data.top_maybe && data.top_maybe.length > 0) {
        data.top_maybe.forEach((game, index) => {
            const gameData = data.games.find(g => g.title === game.title) || {};
            const gameCard = createGameCard({
                ...gameData,
                title: game.title,
                count: game.count
            }, index + 1, 'maybe');
            maybeCol.appendChild(gameCard);
        });
    } else {
        const noGames = document.createElement('p');
        noGames.className = 'text-gray-500 text-center py-4';
        noGames.textContent = 'No votes yet';
        maybeCol.appendChild(noGames);
    }
    
    // Add columns to grid
    grid.appendChild(interestedCol);
    grid.appendChild(maybeCol);
    container.appendChild(grid);
    
    // Add a link back to vote
    const backLink = document.createElement('div');
    backLink.className = 'text-center mt-8';
    backLink.innerHTML = `
        <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Voting
        </a>
    `;
    container.appendChild(backLink);
    
    // Add to the page
    resultsContainer.appendChild(container);
}

// Fetch and display results when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Fetch results
    fetch('/api/results')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Results data:', data);
            displayTopResults(data);
            displayFullResults(data);
        })
        .catch(error => {
            console.error('Error fetching results:', error);
            showError();
        });
});

// Function to display top results
function displayTopResults(data) {
    const topInterestedContainer = document.getElementById('topInterested');
    const topMaybeContainer = document.getElementById('topMaybe');
    const topEngagementContainer = document.getElementById('topEngagement');
    
    if (topInterestedContainer) {
        if (data.top_interested && data.top_interested.length > 0) {
            topInterestedContainer.innerHTML = data.top_interested.map((game, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <span class="text-lg font-bold text-indigo-600 mr-3">${index + 1}</span>
                        <span class="font-medium text-gray-800">${game.title}</span>
                    </div>
                    <span class="text-sm font-semibold text-green-600">${game.count} vote${game.count !== 1 ? 's' : ''}</span>
                </div>
            `).join('');
        } else {
            topInterestedContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No votes yet</p>';
        }
    }
    
    if (topMaybeContainer) {
        if (data.top_maybe && data.top_maybe.length > 0) {
            topMaybeContainer.innerHTML = data.top_maybe.map((game, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <span class="text-lg font-bold text-yellow-600 mr-3">${index + 1}</span>
                        <span class="font-medium text-gray-800">${game.title}</span>
                    </div>
                    <span class="text-sm font-semibold text-yellow-600">${game.count} vote${game.count !== 1 ? 's' : ''}</span>
                </div>
            `).join('');
        } else {
            topMaybeContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No votes yet</p>';
        }
    }

    if (topEngagementContainer) {
        if (data.top_engagement && data.top_engagement.length > 0) {
            topEngagementContainer.innerHTML = data.top_engagement.map((game, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <span class="text-lg font-bold text-purple-600 mr-3">${index + 1}</span>
                        <span class="font-medium text-gray-800">${game.title}</span>
                    </div>
                    <span class="text-sm font-semibold text-purple-600">${game.count} vote${game.count !== 1 ? 's' : ''}</span>
                </div>
            `).join('');
        } else {
            topEngagementContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No votes yet</p>';
        }
    }
}

// Function to display full results table
function displayFullResults(data) {
    const tableBody = document.getElementById('resultsTableBody');
    
    if (tableBody && data.games) {
        // Sort games by interested count (descending)
        const sortedGames = data.games.sort((a, b) => b.interested_count - a.interested_count);
        
        tableBody.innerHTML = sortedGames.map(game => `
            <tr class="border-t border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-900">${game.title}</td>
                <td class="py-3 px-4 text-center">
                    <span class="text-green-600 font-semibold">${game.interested_count}</span>
                    ${game.interested.length > 0 ? `<div class="text-xs text-gray-500 mt-1">${game.interested.join(', ')}</div>` : ''}
                </td>
                <td class="py-3 px-4 text-center">
                    <span class="text-yellow-600 font-semibold">${game.maybe_count}</span>
                    ${game.maybe.length > 0 ? `<div class="text-xs text-gray-500 mt-1">${game.maybe.join(', ')}</div>` : ''}
                </td>
                <td class="py-3 px-4 text-center">
                    <span class="text-red-600 font-semibold">${game.not_interested.length}</span>
                    ${game.not_interested.length > 0 ? `<div class="text-xs text-gray-500 mt-1">${game.not_interested.join(', ')}</div>` : ''}
                </td>
            </tr>
        `).join('');
    }
}

// Function to show error state
function showError() {
    const containers = ['topInterested', 'topMaybe', 'topEngagement', 'resultsTableBody'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <p>Error loading results. Please try again later.</p>
                    <a href="/" class="text-indigo-600 hover:text-indigo-800 underline mt-2 inline-block">Go back to voting</a>
                </div>
            `;
        }
    });
}
