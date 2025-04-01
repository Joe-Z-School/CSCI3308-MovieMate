let page = 2; // Start from the next page after first load
let isLoading = false;
const loadMorePosts = () => {
if (isLoading) {        
    return; // Skip repeating calls
}
isLoading = true; // Block additional calls while loading
document.getElementById('loading').style.display = 'block';
fetch(`/load-more?page=${page}`)
    .then(response => response.json())
        .then(data => {
            const container = document.getElementById('movie-container');
            if (data.posts.length === 0) {
                document.getElementById('loading').innerText = 'No more posts to load.';
            }
            else {
                data.posts.forEach(post => {
                    const card = `
                    <div class="row row-cols-1 row-cols-md-1 g-4">
                        <div class="card h-100">
                            <img src="${post.cover}" class="card-img-top" alt="${post.title}">
                            <div class="card-body">
                                <h5 class="card-title text-center">${post.title}</h5>
                                <p class="card-text">${post.description}</p>
                                <button class="btn btn-primary text-center">Add to Watchlist</button>
                            </div>
                        </div>
                    </div>`;
                    container.innerHTML += card;
                });
                
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.forEach(tooltipTriggerEl => {
                    new bootstrap.Tooltip(tooltipTriggerEl);
                });
                
                page++; // Increase page number for next request
                document.getElementById('loading').style.display = 'none';
            }
            isLoading = false; // Unblock loading for next set of data
        })
        .catch(err => {
            console.error("Error fetching posts:", err);
            document.getElementById('loading').innerText = 'Failed to load posts.';
            isLoading = false; // Reset loading on error
        });
};

let debounceTimer;
window.onscroll = () => {
    clearTimeout(debounceTimer); // Reset debounce timer
    debounceTimer = setTimeout(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        // Get the height of the page
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
    const isAdded = addedIcon.classList.contains('bi-dash-circle');
    
    if (!isAdded) {
        // Change to minus sign
        addedIcon.classList.remove('bi-plus-circle');
        addedIcon.classList.add('bi-dash-circle');
        addedIcon.style.color = 'red';
        addButton.setAttribute('data-bs-title', 'Remove from WatchList');
        
        // Add to watchlist
        fetch('/add-to-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, picture, whereToWatch }),
        })
        .then(response => response.json())
            .then(data => {
                console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
    else {
        // Change back to plus sign
        addedIcon.classList.remove('bi-dash-circle');
        addedIcon.classList.add('bi-plus-circle');
        addedIcon.style.color = 'black';
        addButton.setAttribute('data-bs-title', 'Add to WatchList');
        
        // Remove from watchlist
        fetch('/remove-from-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        })
            .then(response => response.json())
            .then(data => {
            console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
    new bootstrap.Tooltip(addButton);
}

function toggleLikes(posts, index) {
    const heartIcon = document.getElementById(`heart-icon-${index}`);
    const heartButton = document.getElementById(`heart-button-${index}`);
    const isFilled = heartIcon.classList.contains('bi-heart-fill');
    
    if (!isFilled) {
        // Change to filled red heart
        heartIcon.classList.remove('bi-heart');
        heartIcon.classList.add('bi-heart-fill');
        heartIcon.style.color = 'red';
        heartButton.setAttribute('data-bs-title', 'Unlike Post');
        
        // Add post to Liked Posts
        fetch('/add-to-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, picture, whereToWatch }),
        })
        .then(response => response.json())
            .then(data => {
                console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
    else {
        // Change back to hollow blue heart
        heartIcon.classList.remove('bi-heart-fill');
        heartIcon.classList.add('bi-heart');
        heartIcon.style.color = 'black';
        heartButton.setAttribute('data-bs-title', 'Like Post');
        
        // Remove movie data from watchlist
        fetch('/remove-from-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        })
            .then(response => response.json())
            .then(data => {
            console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
    new bootstrap.Tooltip(heartButton);
}

document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
});