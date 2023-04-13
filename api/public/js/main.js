const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');

searchInput.addEventListener('input', async function () {
    const searchQuery = searchInput.value.toLowerCase();

    if (searchQuery.length < 3) {
    resultsDiv.innerHTML = '<p>Please type at least 3 characters.</p>';
    return;
    }

    const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    const searchResults = await response.json();

    if (searchResults.length <= 100) {
        displayResults(searchResults, resultsDiv);
    } else {
        resultsDiv.innerHTML = '<p>Please refine your search to display 100 or fewer results.</p>';
    }
});

function displayResults(results, resultsDiv) {
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
        return;
    }

    const list = document.createElement('ul');
    results.forEach((row) => {
    const listItem = document.createElement('li');
    const profileLink = document.createElement('a');
    profileLink.href = `https://twitter.com/${row.username}`;
    profileLink.target = '_blank';

    const img = document.createElement('img');
    img.src = `https://res.cloudinary.com/demo/image/twitter_name/w_100/${row.username}.jpg`;
    img.alt = `${row.name}'s profile picture`;
    img.style.width = '48px';
    img.style.height = '48px';
    img.style.borderRadius = '50%';
    img.style.float = 'left';

    // Add a placeholder image if the fetched image doesn't exist
    img.onerror = function() {
        // Replace the URL with the placeholder image URL
        img.src = './assets/images/placeholder.png';
    };

    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');

    const nameContainer = document.createElement('div');
    nameContainer.classList.add('name-container');

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('name');
    nameSpan.textContent = row.name;
    nameContainer.appendChild(nameSpan);

    const verifiedBadge = document.createElement('span');
    verifiedBadge.classList.add('verified-badge');
    verifiedBadge.innerHTML = `<img src="./assets/images/verified.svg" alt="Verified account" />`;
    nameContainer.appendChild(verifiedBadge);

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = ` @${row.username}`;

    textContainer.appendChild(nameContainer);
    textContainer.appendChild(usernameSpan);

    profileLink.appendChild(img);
    profileLink.appendChild(textContainer);
    listItem.appendChild(profileLink);
    list.appendChild(listItem);
});
resultsDiv.innerHTML = '';
    resultsDiv.appendChild(list);
}