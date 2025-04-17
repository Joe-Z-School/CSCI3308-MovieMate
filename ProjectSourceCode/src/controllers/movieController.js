const omdbApi = require('../api/omdbApi');
const youtubeApi = require('../api/youtubeApi');
const db = require('../index').db;

// Get new/trending movies
exports.getNewMovies = async (req, res) => {
  try {
    // These could be updated periodically or stored in the database
    const popularMovies = [
      'tt15398776', // Oppenheimer
      'tt9362722',  // Spider-Man: Across the Spider-Verse
      'tt1517268',  // Barbie
      'tt1630029',  // Avatar: The Way of Water
      'tt10151854', // The Fabelmans
      'tt8760708',  // TOP GUN: Maverick
      'tt6710474',  // Everything Everywhere All at Once
      'tt11813216', // The Banshees of Inisherin
      'tt10640346', // Babylon
      'tt14444726'  // The menu
    ];

    // Get details for each movie
    const moviePromises = popularMovies.map(imdbId => omdbApi.getMovieDetails(imdbId));
    const results = await Promise.all(moviePromises);

    // Filter out any failures and extract the movie data
    const movies = results
      .filter(result => result.success)
      .map(result => result.movie);

    return res.json({ success: true, results: movies });
  } catch (error) {
    console.error('Error fetching new movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update searchMovies to format data for the new frontend
exports.searchMovies = async (req, res) => {
  try {
    const { query, year, type, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const filters = { y: year, type: type };
    const apiResults = await omdbApi.searchMovies(query, filters, page);
    
    console.log('OMDB API response:', apiResults); // Debug log
    
    if (!apiResults.success) {
      return res.status(404).json(apiResults);
    }
    
    // Format the results to match frontend expectations
    const formattedResults = {
      success: true,
      results: apiResults.results.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : `/api/placeholder/300/450`,
        rating: movie.imdbRating || 'N/A'
      })),
      totalResults: parseInt(apiResults.totalResults) || apiResults.results.length
    };
    
    console.log('Formatted results:', formattedResults); // Debug log
    
    return res.json(formattedResults);
  } catch (error) {
    console.error('Error in searchMovies controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// get movie details from OMDB API
exports.getMovieDetails = async (req, res) => {
  try {
    const { imdbId } = req.params;
    
    if (!imdbId) {
      return res.status(400).json({ success: false, error: 'IMDB ID is required' });
    }
    
    const result = await omdbApi.getMovieDetails(imdbId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error in getMovieDetails controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// add a movie to the user's watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId } = req.body;
    const userId = req.session.user.id;
    
    // first, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // movie doesn't exist in our database, so we need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        return res.status(404).json({ success: false, error: 'Movie not found' });
      }
      
      const movie = movieData.movie;
      
      // insert movie into database
      const insertResult = await db.query(
        'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
      );
      
      movieId = insertResult[0].id;
    } else {
      movieId = movieCheck[0].id;
    }
    
    // check if movie is already in user's watchlist
    const watchlistCheck = await db.query(
      'SELECT * FROM movies_to_users WHERE user_id = $1 AND movie_id = $2 AND status = $3',
      [userId, movieId, 'watchlist']
    );
    
    if (watchlistCheck.length > 0) {
      return res.json({ success: true, message: 'Movie already in watchlist' });
    }
    
    // add to watchlist
    await db.query(
      'INSERT INTO movies_to_users (user_id, movie_id, status) VALUES ($1, $2, $3)',
      [userId, movieId, 'watchlist']
    );
    
    return res.json({ success: true, message: 'Movie added to watchlist' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// mark a movie as watched
exports.markAsWatched = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId } = req.body;
    const userId = req.session.user.id;
    
    // similar logic to addToWatchlist
    // first, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // movie doesn't exist in our database, need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        return res.status(404).json({ success: false, error: 'Movie not found' });
      }
      
      const movie = movieData.movie;
      
      // inesert movie into database
      const insertResult = await db.query(
        'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
      );
      
      movieId = insertResult[0].id;
    } else {
      movieId = movieCheck[0].id;
    }
    
    // check if movie is already marked as watched
    const watchedCheck = await db.query(
      'SELECT * FROM movies_to_users WHERE user_id = $1 AND movie_id = $2 AND status = $3',
      [userId, movieId, 'watched']
    );
    
    if (watchedCheck.length > 0) {
      return res.json({ success: true, message: 'Movie already marked as watched' });
    }
    
    // mark as watched (this will update from watchlist if it exists)
    await db.query(
      'INSERT INTO movies_to_users (user_id, movie_id, status) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (user_id, movie_id) DO UPDATE SET status = $3',
      [userId, movieId, 'watched']
    );
    
    return res.json({ success: true, message: 'Movie marked as watched' });
  } catch (error) {
    console.error('Error marking as watched:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// add a review for a movie
exports.addReview = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId, rating, comment } = req.body;
    const username = req.session.user.username;
    
    // first, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // movie doesn't exist in our database, need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        return res.status(404).json({ success: false, error: 'Movie not found' });
      }
      
      const movie = movieData.movie;
      
      // insert movie into database
      const insertResult = await db.query(
        'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
      );
      
      movieId = insertResult[0].id;
    } else {
      movieId = movieCheck[0].id;
    }
    
    // add the comment
    const commentResult = await db.query(
      'INSERT INTO comments (username, comment, rating) VALUES ($1, $2, $3) RETURNING id',
      [username, comment, rating]
    );
    
    const commentId = commentResult[0].id;
    
    // link comment to movie
    await db.query(
      'INSERT INTO movies_to_comments (movie_id, comment_id) VALUES ($1, $2)',
      [movieId, commentId]
    );
    
    // also mark the movie as watched if it's not already
    await db.query(
      'INSERT INTO movies_to_users (user_id, movie_id, status) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (user_id, movie_id) DO UPDATE SET status = $3',
      [req.session.user.id, movieId, 'watched']
    );
    
    return res.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// get reviews for a movie
exports.getMovieReviews = async (req, res) => {
  try {
    const { imdbId } = req.params; 
    
    if (!imdbId) {
      return res.status(400).json({ 
        success: false, 
        error: 'IMDB ID is required to fetch reviews' 
      });
    }
    
    // get the movie ID from our database
    const movieResult = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieResult.length === 0) {
      return res.json({ success: true, reviews: [] });
    }
    
    const movieId = movieResult[0].id;
    
    // get all comments for this movie
    const reviews = await db.query(
      'SELECT c.username, c.comment, c.rating, c.created_at ' +
      'FROM comments c ' +
      'JOIN movies_to_comments mtc ON c.id = mtc.comment_id ' +
      'WHERE mtc.movie_id = $1 ' +
      'ORDER BY c.created_at DESC',
      [movieId]
    );
    
    return res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error getting movie reviews:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// filter movies (when no specific search query is provided)
exports.filterMovies = async (req, res) => {
  try {
    const { genres, year, type, director, actor, minRating, page = 1 } = req.query;
    
    // If no filters are provided, return trending movies
    if (!genres && !year && !type && !director && !actor && !minRating) {
      return exports.getTrendingMovies(req, res);
    }
    
    // Build a search query based on available filters
    let searchQuery = '';
    let filters = {};
    
    // For genre filtering, we'll use the first genre as search term
    if (genres) {
      const genreArray = genres.split(',');
      searchQuery = genreArray[0]; // Use first genre as search term
    } else if (director) {
      searchQuery = director;
    } else if (actor) {
      searchQuery = actor;
    } else {
      // Default search term if none provided
      searchQuery = 'movie';
    }
    
    // Add other filters
    if (year) {
      filters.y = year;
    }
    
    if (type) {
      filters.type = type;
    }
    
    // Use the existing search function
    const results = await omdbApi.searchMovies(searchQuery, filters, page);
    
    // If a minimum rating filter is applied, we need to fetch details for each movie
    if (minRating && results.success) {
      const minRatingValue = parseFloat(minRating);
      
      // Fetch details for each movie to get ratings
      const detailPromises = results.results.map(movie => 
        omdbApi.getMovieDetails(movie.imdbID)
      );
      
      const detailResults = await Promise.all(detailPromises);
      
      // Filter movies by rating
      const filteredMovies = detailResults
        .filter(result => result.success && result.movie.imdbRating && 
                parseFloat(result.movie.imdbRating) >= minRatingValue)
        .map(result => result.movie);
      
      return res.json({
        success: true,
        results: filteredMovies,
        totalResults: filteredMovies.length,
        page: parseInt(page)
      });
    }
    
    return res.json(results);
  } catch (error) {
    console.error('Error filtering movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get movie trailer
exports.getMovieTrailer = async (req, res) => {
  try {
    const { query } = req.params;
    const imdbId = req.query.imdbId;
    
    const result = await youtubeApi.getMovieTrailer(query, imdbId);
    return res.json(result);
  } catch (error) {
    console.error('Error in getMovieTrailer controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// get trending movies based on type (popular, latest, recommended)
exports.getTrendingMovies = async (req, res) => {
  try {
    const { type = 'popular' } = req.query;
    
    let movieIds = [];
    
    // different lists based on trending type
    if (type === 'popular') {
      movieIds = [
        'tt1745960', // Top Gun: Maverick
        'tt12593682', // Bullet Train
        'tt6443346', // Black Adam
        'tt9114286', // Black Panther: Wakanda Forever
        'tt1630029'  // Avatar: The Way of Water
      ];
    } else if (type === 'latest') {
      movieIds = [
        'tt15239678', // Dune: Part Two
        'tt11304740', // Deadpool & Wolverine
        'tt17024450', // A Quiet Place: Day One
        'tt1517268', // Twisters
        'tt22687790'  // Inside Out 2
      ];
    } else if (type === 'recommended') {
      movieIds = [
        'tt1375666', // Inception
        'tt0816692', // Interstellar
        'tt0468569', // The Dark Knight
        'tt0109830', // Forrest Gump
        'tt0111161'  // The Shawshank Redemption
      ];
    }
    
    // Get details for each movie
    const moviePromises = movieIds.map(imdbId => omdbApi.getMovieDetails(imdbId));
    const results = await Promise.all(moviePromises);
    
    // Filter out any failures and extract the movie data
    const movies = results
      .filter(result => result.success)
      .map(result => {
        const movie = result.movie;
        // Format the data to match the frontend expectations
        return {
          id: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          rating: movie.imdbRating || '7.5', // Default if no rating
          poster: movie.Poster
        };
      });
    
    return res.json({ 
      success: true, 
      results: movies,
      totalResults: movies.length
    });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Simple placeholder image generator
exports.getPlaceholderImage = (req, res) => {
  const width = req.params.width || 300;
  const height = req.params.height || 450;
  
  // Redirect to a placeholder image service
  res.redirect(`https://via.placeholder.com/${width}x${height}/808080/ffffff?text=Movie+Poster`);
};

module.exports = exports;