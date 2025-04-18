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

// API endpoint to get popular searches
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

// Update searchMovies to format data for the new frontend
exports.searchMovies = async (req, res) => {
  try {
    const { query, year, type, page = 1, director, actor, minRating, sort, newestFirst } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    // Build filters object with all possible parameters
    const filters = { 
      y: year, 
      type: type
    };
    
    // Add additional filters from the advanced search
    if (director) {
      // We'll search by director in OMDB API
      // But OMDB doesn't have a direct director filter, so we'll handle this in post-processing
    }
    
    if (actor) {
      // Same for actor - we'll handle in post-processing
    }
    
    const apiResults = await omdbApi.searchMovies(query, filters, page);
    
    console.log('OMDB API response:', apiResults); // Debug log
    
    if (!apiResults.success) {
      return res.status(404).json(apiResults);
    }
    
    let results = apiResults.results;
    
    // If we have director or actor filters, we need to get details for each movie and filter
    if ((director && director.trim() !== '') || (actor && actor.trim() !== '') || (minRating && minRating.trim() !== '')) {
      // Fetch details for each movie to check directors, actors, and ratings
      const detailPromises = results.map(movie => 
        omdbApi.getMovieDetails(movie.imdbID)
      );
      
      const detailResults = await Promise.all(detailPromises);
      
      // Filter movies based on director, actor, and/or rating
      results = detailResults
        .filter(result => {
          if (!result.success || !result.movie) return false;
          
          const movie = result.movie;
          
          // Check director if specified
          if (director && director.trim() !== '') {
            const movieDirectors = movie.Director.toLowerCase();
            if (!movieDirectors.includes(director.toLowerCase())) {
              return false;
            }
          }
          
          // Check actor if specified
          if (actor && actor.trim() !== '') {
            const movieActors = movie.Actors.toLowerCase();
            if (!movieActors.includes(actor.toLowerCase())) {
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
        .map(result => result.movie);
      
      // Sort results if needed
      if (sort === 'year') {
        results.sort((a, b) => {
          const yearA = parseInt(a.Year) || 0;
          const yearB = parseInt(b.Year) || 0;
          return newestFirst ? yearB - yearA : yearA - yearB;
        });
      } else if (sort === 'title') {
        results.sort((a, b) => a.Title.localeCompare(b.Title));
      } else if (sort === 'rating') {
        results.sort((a, b) => {
          const ratingA = parseFloat(a.imdbRating) || 0;
          const ratingB = parseFloat(b.imdbRating) || 0;
          return ratingB - ratingA; // Higher ratings first
        });
      }
    }
    
    // Format the results to match frontend expectations
    const formattedResults = {
      success: true,
      results: results.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : `/api/placeholder/300/450`,
        rating: movie.imdbRating || 'N/A'
      })),
      totalResults: results.length
    };
    
    console.log('Formatted results:', formattedResults); // Debug log
    
    return res.json(formattedResults);
  } catch (error) {
    console.error('Error in searchMovies controller:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Updated filter movies function with enhanced filtering capabilities
exports.filterMovies = async (req, res) => {
  try {
    const { genres, year, type, director, actor, minRating, sort, newestFirst, page = 1 } = req.query;
    
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
    
    if (!results.success) {
      return res.status(404).json(results);
    }
    
    // If we have director or actor filters, we need to get details for each movie and filter
    if ((director && director.trim() !== '') || (actor && actor.trim() !== '') || (minRating && minRating.trim() !== '')) {
      // Fetch details for each movie to check directors, actors, and ratings
      const detailPromises = results.results.map(movie => 
        omdbApi.getMovieDetails(movie.imdbID)
      );
      
      const detailResults = await Promise.all(detailPromises);
      
      // Filter movies based on director, actor, and/or rating
      const filteredMovies = detailResults
        .filter(result => {
          if (!result.success || !result.movie) return false;
          
          const movie = result.movie;
          
          // Check director if specified
          if (director && director.trim() !== '') {
            const movieDirectors = movie.Director.toLowerCase();
            if (!movieDirectors.includes(director.toLowerCase())) {
              return false;
            }
          }
          
          // Check actor if specified
          if (actor && actor.trim() !== '') {
            const movieActors = movie.Actors.toLowerCase();
            if (!movieActors.includes(actor.toLowerCase())) {
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
        .map(result => {
          const movie = result.movie;
          return {
            id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : `/api/placeholder/300/450`,
            rating: movie.imdbRating || 'N/A'
          };
        });
      
      // Sort results if needed
      if (sort === 'year') {
        filteredMovies.sort((a, b) => {
          const yearA = parseInt(a.year) || 0;
          const yearB = parseInt(b.year) || 0;
          return newestFirst ? yearB - yearA : yearA - yearB;
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
        totalResults: filteredMovies.length
      });
    }
    
    // Format results for the frontend
    const formattedResults = {
      success: true,
      results: results.results.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : `/api/placeholder/300/450`,
        rating: movie.imdbRating || 'N/A'
      })),
      totalResults: parseInt(results.totalResults) || results.results.length
    };
    
    return res.json(formattedResults);
  } catch (error) {
    console.error('Error filtering movies:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};