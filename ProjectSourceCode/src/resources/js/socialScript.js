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
