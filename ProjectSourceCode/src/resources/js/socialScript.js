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


function addWatchlist(moviedata, index) {

    const watchlist = document.querySelectorAll('.watchlist');
    
    if (!watchlist) {        
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
        // Remove from watchlist
        fetch('/remove-from-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { title } ),
        })
            .then(response => response.json())
            .then(data => {
            console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
}

function addLike(postdata, index) {
    const post = posts[index];
    
    if (!post) {        
        // Add post to Liked Posts
        fetch('/add-to-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { user, title, description } ),
        })
        .then(response => response.json())
            .then(data => {
                console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
    else {        
        // Remove post from Liked Posts
        fetch('/remove-from-likedposts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { title } ),
        })
            .then(response => response.json())
            .then(data => {
            console.log(data.message);
            })
            .catch(error => console.error('Error:', error));
    }
}
