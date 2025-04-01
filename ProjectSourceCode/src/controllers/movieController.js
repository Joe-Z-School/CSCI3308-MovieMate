const omdbApi = require('../api/omdbApi');
const db = require('../index').db;

// search movies from OMDB API
exports.searchMovies = async (req, res) => {
  try {
    const { query, year, type, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const filters = { y: year, type: type };
    const results = await omdbApi.searchMovies(query, filters, page);
    
    if (!results.success) {
      return res.status(404).json(results);
    }
    
    return res.json(results);
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

module.exports = exports;