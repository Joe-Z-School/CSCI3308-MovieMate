const omdbApi = require('../api/omdbApi');
const youtubeApi = require('../api/youtubeApi');
const db = require('../index').db;
const axios = require('axios');

/**
 * Consistent movie data formatter
 * @param {Object} movie - The movie object to format
 * @returns {Object} - Formatted movie object
 */
function formatMovieData(movie) {
  return {
    id: movie.imdbID || movie.id,
    title: movie.Title || movie.title,
    year: movie.Year || movie.year,
    poster: (movie.Poster || movie.poster) && (movie.Poster || movie.poster) !== 'N/A' 
      ? (movie.Poster || movie.poster) 
      : `/api/placeholder/300/450`,
    rating: movie.imdbRating || movie.rating || 'N/A', // Default rating if none available
    genre: movie.Genre || movie.genre || ''
  };
}

/**
 * Get new/trending movies
 * GET /api/movies/new
 */
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
      .map(result => formatMovieData(result.movie));

    return res.json({ success: true, results: movies });
  } catch (error) {
    console.error('Error fetching new movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Get popular searches for the explore page
 * GET /api/movies/popular-searches
 */
exports.getPopularSearches = async (req, res) => {
  try {
    // We'll generate this dynamically from trending movies
    // Fetch latest movies and extract titles
    const latestMoviesResponse = await fetch('http://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&s=2024&type=movie&y=2024');
    const latestMoviesData = await latestMoviesResponse.json();
    
    let popularSearches = [];
    
    if (latestMoviesData.Response === 'True' && latestMoviesData.Search && latestMoviesData.Search.length > 0) {
      // Get 6 movie titles from the latest movies
      popularSearches = latestMoviesData.Search.slice(0, 6).map(movie => movie.Title);
    } else {
      // Fallback to predefined list if API fails
      popularSearches = [
        'Dune: Part Two',
        'Deadpool & Wolverine',
        'Twisters',
        'Inside Out 2',
        'Kingdom of the Planet of the Apes',
        'A Quiet Place: Day One'
      ];
    }
    
    return res.json({ 
      success: true, 
      searches: popularSearches
    });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    
    // Fallback to default list on error
    return res.json({ 
      success: true, 
      searches: [
        'Dune: Part Two',
        'Deadpool & Wolverine',
        'Twisters',
        'Inside Out 2',
        'Kingdom of the Planet of the Apes',
        'A Quiet Place: Day One'
      ]
    });
  }
};

/**
 * Search movies with flexible filtering and sorting
 * GET /api/movies/search
 */
exports.searchMovies = async (req, res) => {
  try {
    const { 
      query, 
      year, 
      type, 
      page = 1, 
      director, 
      actor, 
      minRating, 
      sort, 
      newestFirst, 
      genres,
      pageSize = 10
    } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    // Process query to handle director/actor prefixes
    let searchQuery = query;
    let directorFilter = director;
    let actorFilter = actor;
    
    // Check if query contains director: or actor: prefixes
    if (query.includes('director:')) {
      const match = query.match(/director:([^director:actor:]+)/i);
      if (match && match[1]) {
        directorFilter = match[1].trim();
        // Remove director: prefix from search query
        searchQuery = query.replace(/director:[^director:actor:]+/i, '').trim();
      }
    }
    
    if (query.includes('actor:')) {
      const match = query.match(/actor:([^director:actor:]+)/i);
      if (match && match[1]) {
        actorFilter = match[1].trim();
        // Remove actor: prefix from search query
        searchQuery = searchQuery.replace(/actor:[^director:actor:]+/i, '').trim();
      }
    }
    
    // If search query is empty after removing prefixes, use a generic term
    if (!searchQuery) {
      searchQuery = directorFilter || actorFilter || 'movie';
    }
    
    // Build filters object with all possible parameters
    const filters = { 
      y: year, 
      type: type,
      page: page // Pass page parameter to API
    };
    
    const apiResults = await omdbApi.searchMovies(searchQuery, filters, page);
    
    if (!apiResults.success) {
      return res.status(404).json(apiResults);
    }
    
    let results = apiResults.results;
    const totalResultsCount = parseInt(apiResults.totalResults) || results.length;
    
    // Always fetch details for movies to get accurate ratings and additional info
    const detailPromises = results.map(movie => 
      omdbApi.getMovieDetails(movie.imdbID)
    );
    
    const detailResults = await Promise.all(detailPromises);
    
    // Filter and process detailed movie results
    let filteredMovies = detailResults
      .filter(result => {
        if (!result.success || !result.movie) return false;
        
        const movie = result.movie;
        
        // Only apply these filters if specified
        if (directorFilter && directorFilter.trim() !== '') {
          const movieDirectors = (movie.Director || '').toLowerCase();
          if (!movieDirectors.includes(directorFilter.toLowerCase())) {
            return false;
          }
        }
        
        if (actorFilter && actorFilter.trim() !== '') {
          const movieActors = (movie.Actors || '').toLowerCase();
          if (!movieActors.includes(actorFilter.toLowerCase())) {
            return false;
          }
        }
        
        if (genres && genres.trim() !== '') {
          const genreArray = genres.split(',').map(g => g.trim().toLowerCase());
          const movieGenres = (movie.Genre || '').toLowerCase().split(',').map(g => g.trim());
          
          const hasMatchingGenre = genreArray.some(requestedGenre => 
            movieGenres.some(movieGenre => movieGenre.includes(requestedGenre))
          );
          
          if (!hasMatchingGenre) {
            return false;
          }
        }
        
        if (minRating && minRating.trim() !== '') {
          const minRatingValue = parseFloat(minRating);
          if (!movie.imdbRating || movie.imdbRating === 'N/A' || parseFloat(movie.imdbRating) < minRatingValue) {
            return false;
          }
        }
        
        return true;
      })
      .map(result => result.movie);
    
    // Sort results if needed
    if (sort === 'year') {
      filteredMovies.sort((a, b) => {
        const yearA = parseInt(a.Year) || 0;
        const yearB = parseInt(b.Year) || 0;
        return newestFirst === 'true' || newestFirst === true ? yearB - yearA : yearA - yearB;
      });
    } else if (sort === 'title') {
      filteredMovies.sort((a, b) => a.Title.localeCompare(b.Title));
    } else if (sort === 'rating') {
      filteredMovies.sort((a, b) => {
        const ratingA = parseFloat(a.imdbRating) || 0;
        const ratingB = parseFloat(b.imdbRating) || 0;
        return ratingB - ratingA; // Higher ratings first
      });
    }
    
    // Format the results
    const formattedResults = {
      success: true,
      results: filteredMovies.map(movie => formatMovieData(movie)),
      totalResults: filteredMovies.length > 0 ? totalResultsCount : filteredMovies.length,
      page: parseInt(page),
      hasMorePages: parseInt(page) * parseInt(pageSize) < totalResultsCount
    };
    
    return res.json(formattedResults);
  } catch (error) {
    console.error('Error in searchMovies controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Get movie details by IMDB ID
 * GET /api/movies/details/:imdbId
 */
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

/**
 * Add a movie to the user's watchlist
 * POST /api/movies/watchlist
 */
exports.addToWatchlist = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId, title, poster } = req.body;
    const userId = req.session.user.id;
    
    if (!imdbId) {
      return res.status(400).json({ success: false, error: 'IMDB ID is required' });
    }
    
    // First, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // Movie doesn't exist in our database, so we need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        // If we can't fetch from OMDB but have title/poster from frontend, use those
        if (title && poster) {
          const insertResult = await db.query(
            'INSERT INTO movies (name, imdb_id, poster) VALUES ($1, $2, $3) RETURNING id',
            [title, imdbId, poster]
          );
          movieId = insertResult[0].id;
        } else {
          return res.status(404).json({ success: false, error: 'Movie not found' });
        }
      } else {
        const movie = movieData.movie;
        
        // Insert movie into database
        const insertResult = await db.query(
          'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
        );
        
        movieId = insertResult[0].id;
      }
    } else {
      movieId = movieCheck[0].id;
    }
    
    // Check if movie is already in user's watchlist
    const watchlistCheck = await db.query(
      'SELECT * FROM movies_to_users WHERE user_id = $1 AND movie_id = $2 AND status = $3',
      [userId, movieId, 'watchlist']
    );
    
    if (watchlistCheck.length > 0) {
      return res.json({ success: true, message: 'Movie already in watchlist' });
    }
    
    // Add to watchlist
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

/**
 * Mark a movie as watched
 * POST /api/movies/watched
 */
exports.markAsWatched = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId } = req.body;
    const userId = req.session.user.id;
    
    // Similar logic to addToWatchlist
    // First, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // Movie doesn't exist in our database, need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        return res.status(404).json({ success: false, error: 'Movie not found' });
      }
      
      const movie = movieData.movie;
      
      // Insert movie into database
      const insertResult = await db.query(
        'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
      );
      
      movieId = insertResult[0].id;
    } else {
      movieId = movieCheck[0].id;
    }
    
    // Check if movie is already marked as watched
    const watchedCheck = await db.query(
      'SELECT * FROM movies_to_users WHERE user_id = $1 AND movie_id = $2 AND status = $3',
      [userId, movieId, 'watched']
    );
    
    if (watchedCheck.length > 0) {
      return res.json({ success: true, message: 'Movie already marked as watched' });
    }
    
    // Mark as watched (this will update from watchlist if it exists)
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

/**
 * Add a review for a movie
 * POST /api/movies/review
 */
exports.addReview = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const { imdbId, rating, comment } = req.body;
    const username = req.session.user.username;
    
    if (!imdbId || rating === undefined || !comment) {
      return res.status(400).json({ success: false, error: 'IMDB ID, rating, and comment are required' });
    }
    
    // First, check if the movie exists in our database
    let movieId;
    const movieCheck = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieCheck.length === 0) {
      // Movie doesn't exist in our database, need to fetch and save it
      const movieData = await omdbApi.getMovieDetails(imdbId);
      
      if (!movieData.success) {
        return res.status(404).json({ success: false, error: 'Movie not found' });
      }
      
      const movie = movieData.movie;
      
      // Insert movie into database
      const insertResult = await db.query(
        'INSERT INTO movies (name, imdb_id, genre, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [movie.Title, movie.imdbID, movie.Genre, movie.Year, movie.Poster]
      );
      
      movieId = insertResult[0].id;
    } else {
      movieId = movieCheck[0].id;
    }
    
    // Add the comment
    const commentResult = await db.query(
      'INSERT INTO comments (username, comment, rating) VALUES ($1, $2, $3) RETURNING id',
      [username, comment, rating]
    );
    
    const commentId = commentResult[0].id;
    
    // Link comment to movie
    await db.query(
      'INSERT INTO movies_to_comments (movie_id, comment_id) VALUES ($1, $2)',
      [movieId, commentId]
    );
    
    // Also mark the movie as watched if it's not already
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

/**
 * Get reviews for a movie
 * GET /api/movies/reviews/:imdbId
 */
exports.getMovieReviews = async (req, res) => {
  try {
    const { imdbId } = req.params; 
    
    if (!imdbId) {
      return res.status(400).json({ 
        success: false, 
        error: 'IMDB ID is required to fetch reviews' 
      });
    }
    
    // Get the movie ID from our database
    const movieResult = await db.query('SELECT id FROM movies WHERE imdb_id = $1', [imdbId]);
    
    if (movieResult.length === 0) {
      return res.json({ success: true, reviews: [] });
    }
    
    const movieId = movieResult[0].id;
    
    // Get all comments for this movie
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

/**
 * Filter movies with flexible criteria
 * GET /api/movies/filter
 */
exports.filterMovies = async (req, res) => {
  try {
    const { 
      genres, 
      year, 
      type, 
      director, 
      actor, 
      minRating, 
      sort, 
      newestFirst, 
      page = 1,
      pageSize = 10
    } = req.query;
    
    // If no filters are provided, return trending movies
    if (!genres && !year && !type && !director && !actor && !minRating) {
      return exports.getTrendingMovies(req, res);
    }
    
    // Build a search query based on available filters
    let searchQuery = '';
    let filters = {};
    
    // Determine primary search term based on filters
    if (director) {
      searchQuery = director;
    } else if (actor) {
      searchQuery = actor;
    } else if (genres) {
      const genreArray = genres.split(',');
      searchQuery = genreArray[0]; // Use first genre as search term
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
    
    // Include pagination in search
    filters.page = page;
    
    // Use the search function to get initial results
    const results = await omdbApi.searchMovies(searchQuery, filters, page);
    
    if (!results.success) {
      return res.status(404).json(results);
    }
    
    const totalResultsCount = parseInt(results.totalResults) || results.results.length;
    
    // Always fetch details for movies to get accurate ratings and additional info
    const detailPromises = results.results.map(movie => 
      omdbApi.getMovieDetails(movie.imdbID)
    );
    
    const detailResults = await Promise.all(detailPromises);
    
    // Filter and process detailed movie results
    const filteredMovies = detailResults
      .filter(result => {
        if (!result.success || !result.movie) return false;
        
        const movie = result.movie;
        
        // Only apply these filters if specified
        if (director && director.trim() !== '') {
          const movieDirectors = (movie.Director || '').toLowerCase();
          if (!movieDirectors.includes(director.toLowerCase())) {
            return false;
          }
        }
        
        if (actor && actor.trim() !== '') {
          const movieActors = (movie.Actors || '').toLowerCase();
          if (!movieActors.includes(actor.toLowerCase())) {
            return false;
          }
        }
        
        // Check genre if specified
        if (genres && genres.trim() !== '') {
          const genreArray = genres.split(',').map(g => g.trim().toLowerCase());
          const movieGenres = (movie.Genre || '').toLowerCase().split(',').map(g => g.trim());
          
          const hasMatchingGenre = genreArray.some(requestedGenre => 
            movieGenres.some(movieGenre => movieGenre.includes(requestedGenre))
          );
          
          if (!hasMatchingGenre) {
            return false;
          }
        }
        
        // Check minimum rating if specified
        if (minRating && minRating.trim() !== '') {
          const minRatingValue = parseFloat(minRating);
          if (!movie.imdbRating || movie.imdbRating === 'N/A' || parseFloat(movie.imdbRating) < minRatingValue) {
            return false;
          }
        }
        
        return true;
      })
      .map(result => formatMovieData(result.movie));
    
    // Sort results if needed
    if (sort === 'year') {
      filteredMovies.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return newestFirst === 'true' || newestFirst === true ? yearB - yearA : yearA - yearB;
      });
    } else if (sort === 'title') {
      filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'rating') {
      filteredMovies.sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA; // Higher ratings first
      });
    }
    
    return res.json({
      success: true,
      results: filteredMovies,
      totalResults: filteredMovies.length > 0 ? totalResultsCount : filteredMovies.length,
      page: parseInt(page),
      hasMorePages: parseInt(page) * parseInt(pageSize) < totalResultsCount
    });
  } catch (error) {
    console.error('Error filtering movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Get trending movies based on type (popular, latest, recommended)
 * GET /api/movies/trending
 */
exports.getTrendingMovies = async (req, res) => {
  try {
    const { type = 'popular', page = 1 } = req.query;
    const pageSize = 10; // Number of movies per page
    
    let allMovieIds = [];
    
    // Different lists based on trending type with expanded selections for pagination
    if (type === 'popular') {
      allMovieIds = [
        'tt1745960', // Top Gun: Maverick
        'tt12593682', // Bullet Train
        'tt6443346', // Black Adam
        'tt9114286', // Black Panther: Wakanda Forever
        'tt1630029', // Avatar: The Way of Water
        'tt15398776', // Oppenheimer
        'tt9362722', // Spider-Man: Across the Spider-Verse
        'tt1517268', // Barbie
        'tt10151854', // The Fabelmans
        'tt8760708', // TOP GUN: Maverick
        'tt6710474', // Everything Everywhere All at Once
        'tt11813216', // The Banshees of Inisherin
        'tt10640346', // Babylon
        'tt14444726', // The Menu
        'tt10366206', // John Wick: Chapter 4
        'tt2906216', // Ant-Man and the Wasp: Quantumania
        'tt9764362', // The Menu
        'tt9114286', // Black Panther: Wakanda Forever
        'tt11564570', // Glass Onion: A Knives Out Mystery
        'tt10954600', // Ant-Man and the Wasp: Quantumania
      ];
    } else if (type === 'latest') {
      allMovieIds = [
        'tt15239678', // Dune: Part Two
        'tt11304740', // Deadpool & Wolverine
        'tt17024450', // A Quiet Place: Day One
        'tt1517268', // Twisters
        'tt22687790', // Inside Out 2
        'tt2283336', // Gladiator 2
        'tt0499097', // Joker: Folie à Deux
        'tt4873118', // The Lord of the Rings: The War of the Rohirrim
        'tt3758542', // Kraven the Hunter
        'tt8593824', // Alien: Romulus
        'tt0439572', // The Batman: Part II
        'tt5537002', // Killers of the Flower Moon
        'tt6166392', // Fantastic Four
        'tt1630029', // Avatar 3
        'tt9362722', // Spider-Man: Beyond the Spider-Verse
        'tt9362930', // Spider-Man 4
        'tt27146282', // Minecraft
        'tt14998742', // Trap
        'tt24548838', // Beetlejuice Beetlejuice
        'tt27548871', // IF
      ];
    } else if (type === 'recommended') {
      // If user is logged in, we could personalize this based on their watch history
      // For now, we'll return classic favorites
      allMovieIds = [
        'tt1375666', // Inception
        'tt0816692', // Interstellar
        'tt0468569', // The Dark Knight
        'tt0109830', // Forrest Gump
        'tt0111161', // The Shawshank Redemption
        'tt0068646', // The Godfather
        'tt0071562', // The Godfather: Part II
        'tt0110912', // Pulp Fiction
        'tt0167260', // The Lord of the Rings: The Return of the King
        'tt0137523', // Fight Club
        'tt0133093', // The Matrix
        'tt0114369', // Se7en
        'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
        'tt0102926', // The Silence of the Lambs
        'tt0076759', // Star Wars
        'tt0120815', // Saving Private Ryan
        'tt0167261', // The Lord of the Rings: The Two Towers
        'tt0080684', // Star Wars: Episode V - The Empire Strikes Back
        'tt0073486', // One Flew Over the Cuckoo's Nest
        'tt0099685', // Goodfellas
      ];
    }
    
    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, allMovieIds.length);
    
    // Get the movie IDs for the current page
    const pageMovieIds = allMovieIds.slice(startIndex, endIndex);
    
    // Get details for each movie in the current page
    const moviePromises = pageMovieIds.map(imdbId => omdbApi.getMovieDetails(imdbId));
    const results = await Promise.all(moviePromises);
    
    // Filter out any failures and extract the movie data
    const movies = results
      .filter(result => result.success)
      .map(result => formatMovieData(result.movie));
    
    return res.json({ 
      success: true, 
      results: movies,
      totalResults: allMovieIds.length,
      page: parseInt(page),
      hasMorePages: endIndex < allMovieIds.length
    });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Get movie trailer from YouTube
 * GET /api/movies/trailer/:query
 */
exports.getMovieTrailer = async (req, res) => {
  try {
    const { query } = req.params;
    const imdbId = req.query.imdbId;
    
    // If imdbId is provided, first get movie details to form a better query
    let searchQuery = query;
    
    if (imdbId) {
      const movieDetails = await omdbApi.getMovieDetails(imdbId);
      if (movieDetails.success) {
        const movie = movieDetails.movie;
        searchQuery = `${movie.Title} ${movie.Year} official trailer`;
      }
    } else {
      searchQuery = `${query} official trailer`;
    }
    
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 1,
        q: searchQuery,
        type: 'video',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      res.json({
        success: true,
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      });
    } else {
      res.json({ success: false, message: 'No trailer found' });
    }
  } catch (error) {
    console.error('Error in getMovieTrailer controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Simple placeholder image generator
 * GET /api/placeholder/:width/:height
 */
exports.getPlaceholderImage = (req, res) => {
  const width = req.params.width || 300;
  const height = req.params.height || 450;
  
  // Redirect to a placeholder image service
  res.redirect(`https://via.placeholder.com/${width}x${height}/808080/ffffff?text=Movie+Poster`);
};

module.exports = exports;