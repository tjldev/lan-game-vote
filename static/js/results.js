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
    // Show loading state
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        `;
    }
    
    // Fetch results
    fetch('/api/results')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => displayResults(data))
        .catch(error => {
            console.error('Error fetching results:', error);
            const resultsContainer = document.getElementById('results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="max-w-md mx-auto bg-red-50 border-l-4 border-red-400 p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-red-700">
                                    Error loading results. Please try again later.
                                </p>
                            </div>
                        </div>
                        <div class="mt-4 text-center">
                            <a href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                Go back to voting <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div>
                `;
            }
        });
});
            if (totalVotes === 0) return '';
            
            return `
                <tr class="border-t border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-4">${game}</td>
                    <td class="py-3 px-4 text-center text-green-600 font-medium">${votes.interested}</td>
                    <td class="py-3 px-4 text-center text-yellow-600 font-medium">${votes.maybe}</td>
                    <td class="py-3 px-4 text-center text-red-600 font-medium">${votes.not_interested}</td>
                </tr>
            `;
        }).join('');
    }
});
