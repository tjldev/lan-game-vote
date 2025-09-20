document.addEventListener('DOMContentLoaded', function() {
    // Fetch results from the API
    fetch('/api/results')
        .then(response => response.json())
        .then(data => {
            updateTopLists(data);
            updateResultsTable(data);
        })
        .catch(error => {
            console.error('Error fetching results:', error);
            document.getElementById('topInterested').innerHTML = '<p class="text-red-500">Error loading results. Please try again later.</p>';
            document.getElementById('topMaybe').innerHTML = '';
            document.getElementById('resultsTableBody').innerHTML = '';
        });

    // Update the top 10 interested and maybe lists
    function updateTopLists(data) {
        const topInterested = document.getElementById('topInterested');
        const topMaybe = document.getElementById('topMaybe');

        // Update Top 10 Interested
        if (data.top_10_interested && data.top_10_interested.length > 0) {
            topInterested.innerHTML = data.top_10_interested.map((game, index) => `
                <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span class="font-medium">${index + 1}. ${game.title}</span>
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${game.votes} ${game.votes === 1 ? 'vote' : 'votes'}
                    </span>
                </div>
            `).join('');
        } else {
            topInterested.innerHTML = '<p class="text-gray-500">No votes yet.</p>';
        }

        // Update Top 10 Maybes
        if (data.top_10_maybe && data.top_10_maybe.length > 0) {
            topMaybe.innerHTML = data.top_10_maybe.map((game, index) => `
                <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span class="font-medium">${index + 1}. ${game.title}</span>
                    <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${game.votes} ${game.votes === 1 ? 'vote' : 'votes'}
                    </span>
                </div>
            `).join('');
        } else {
            topMaybe.innerHTML = '<p class="text-gray-500">No maybes yet.</p>';
        }
    }

    // Update the full results table
    function updateResultsTable(data) {
        const tbody = document.getElementById('resultsTableBody');
        
        if (!data.results || Object.keys(data.results).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-gray-600">
                        No votes have been cast yet.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort games alphabetically
        const sortedGames = Object.entries(data.results).sort((a, b) => a[0].localeCompare(b[0]));
        
        tbody.innerHTML = sortedGames.map(([game, votes]) => {
            const totalVotes = votes.interested + votes.maybe + votes.not_interested;
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
