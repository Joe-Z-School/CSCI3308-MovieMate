let page = 2; // Start from the next page after first load
let isLoading = false;
const loadMorePosts = () => {
    
    if (isLoading) {
        return; // Skip repeating calls
    }

    isLoading = true;
    document.getElementById('loading').style.display = 'block';

    fetch(`/load-more?page=${page}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('movie-container');
            if (data.posts.length === 0) {
                document.getElementById('loading').innerText = 'No more posts to load.';
            } else {
                data.posts.forEach((post, localIndex) => {
                    const globalIndex = (page - 1) * 5 + localIndex; // Unique index for each post page 1 = 0,1,2,3,4 
                    const card = `
                    <div class="row row-cols-1 row-cols-md-1 g-4">
                        <div class="card h-100">
                            <p class="card-text">~USER~ ${post.user}</p>
                            <img src="${post.cover}" class="card-img-top" alt="${post.title}">
                            <div class="card-body">
                                <h5 class="card-title text-center">Movie Title: ${post.title}</h5>
                                <p class="card-text">Review: ${post.review}</p>
                                <p class="card-text">Description: ${post.description}</p>
                                <p class="card-text">Where To Watch: ${post.whereToWatch}</p>
                                <button class="btn heart-button" id="heart-button-${globalIndex}" data-post='${JSON.stringify(post)}' data-bs-toggle="tooltip" data-bs-title="Like Post">
                                    <i class="bi bi-heart" id="heart-icon-${globalIndex}"></i>
                                </button>
                                <button class="btn add-button" id="add-button-${globalIndex}" data-title="${post.title}" data-cover="${post.cover}" data-where="${post.whereToWatch}" data-bs-toggle="tooltip" data-bs-title="Add to WatchList">
                                    <i class="bi bi-plus-circle" id="add-icon-${globalIndex}"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                    container.innerHTML += card;
                });

                // Initialize tooltips for new buttons
                const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.forEach(tooltipTriggerEl => {
                    new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover' });
                });

                page++; // Increase page number for next request
                document.getElementById('loading').style.display = 'none';
            }
            isLoading = false;
        })
        .catch(err => {
            console.error("Error fetching posts:", err);
            document.getElementById('loading').innerText = 'Failed to load posts.';
            isLoading = false;
        });
};

// Delay the scroll event to prevent multiple calls
let debounceTimer;
window.onscroll = () => {
    clearTimeout(debounceTimer); // Reset debounce timer
    debounceTimer = setTimeout(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        // Get the height of the page using highest scrollable element
        const pageHeight = Math.max(
            document.body.scrollHeight, 
            document.documentElement.scrollHeight,
            document.body.offsetHeight, 
            document.documentElement.offsetHeight
        );
        if (!isLoading && scrollPosition >= pageHeight - 1) {
            console.log("At page bottom");
            loadMorePosts();
        } else {
            console.log("Scrolling or Loading");
        }
    }, 150);
};

function toggleWatchlist(title, picture, whereToWatch, index) {
    const addedIcon = document.getElementById(`add-icon-${index}`);
    const addButton = document.getElementById(`add-button-${index}`);
    
    if (!addedIcon || !addButton) {
        console.error('Elements for toggleWatchlist not found:', { addedIcon, addButton });
        return;
    }

    const isAdded = addedIcon.classList.contains('bi-dash-circle');
    
    // Remove existing tooltip instance
    const existingTooltip = bootstrap.Tooltip.getInstance(addButton);
    if (existingTooltip) {
        existingTooltip.dispose();
    }

    if (!isAdded) {
        // Change icon to 'Remove'
        addedIcon.classList.remove('bi-plus-circle');
        addedIcon.classList.add('bi-dash-circle');
        addedIcon.style.color = 'red';
        addButton.setAttribute('data-bs-title', 'Remove from WatchList');
        
        // Fetch to add to watchlist
        fetch('/add-to-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, picture, whereToWatch }),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    } else {
        // Change icon back to 'Add'
        addedIcon.classList.remove('bi-dash-circle');
        addedIcon.classList.add('bi-plus-circle');
        addedIcon.style.color = 'black';
        addButton.setAttribute('data-bs-title', 'Add to WatchList');
        
        // Fetch to remove from watchlist
        fetch('/remove-from-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    }

    // Recreate tooltip with updated title
    new bootstrap.Tooltip(addButton, { trigger: 'hover' });
}


function toggleLikes(event) {
    const heartButton = event.target.closest('.heart-button');
    if (!heartButton) {
        console.error('Heart button element not found');
        return;
    }
    const postData = JSON.parse(heartButton.getAttribute('data-post'));
    
    console.log(`Post Data:`, postData); // Debugging line
    
    const heartIcon = heartButton.querySelector('i');
    const isFilled = heartIcon.classList.contains('bi-heart-fill');

    // Remove existing tooltip instance
    const existingTooltip = bootstrap.Tooltip.getInstance(heartButton);
    if (existingTooltip) {
        existingTooltip.dispose();
    }

    if (!isFilled) {
        // Change icon to filled heart
        heartIcon.classList.remove('bi-heart');
        heartIcon.classList.add('bi-heart-fill');
        heartIcon.style.color = 'red';
        heartButton.setAttribute('data-bs-title', 'Unlike Post');
        
        fetch('/add-to-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    } else {
        // Change icon to default heart
        heartIcon.classList.remove('bi-heart-fill');
        heartIcon.classList.add('bi-heart');
        heartIcon.style.color = 'black';
        heartButton.setAttribute('data-bs-title', 'Like Post');
        
        fetch('/remove-from-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
    }

    // Recreate tooltip with updated title
    new bootstrap.Tooltip(heartButton, { trigger: 'hover' });
}

document.addEventListener('click', (event) => {
    const target = event.target;

    // Handle likes button
    const heartButton = target.closest('.heart-button');
    if (heartButton) {
        toggleLikes(event); // Pass the event for likes functionality
        return;
    }

    // Handle add to watchlist button
    const addButton = target.closest('.add-button');
    if (addButton) {
        const title = addButton.getAttribute('data-title');
        const cover = addButton.getAttribute('data-cover');
        const whereToWatch = addButton.getAttribute('data-where');
        const index = [...document.querySelectorAll('.add-button')].indexOf(addButton);
        toggleWatchlist(title, cover, whereToWatch, index);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl, { trigger: 'hover' });
    });
});
