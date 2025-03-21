const express = require('express');
const router = express.Router();
const movieQueries = require('../queries/movieQueries');

/**
 * search for movies by title, keyword or genre
 * GET /api/movies/search?query=star&year=2020&type=movie&page=1
 */
router.get('/search', async (req, res) => {
  try {
    const { query, year, type, page } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const results = await movieQueries.searchMovies(query, { year, type }, page);
    res.json(results);
  } catch (error) {
    console.error('Search route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search movies'
    });
  }
});

/**
 * get details for a specific movie by IMDB ID
 * GET /api/movies/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Movie ID is required'
      });
    }
    
    const movie = await movieQueries.getMovieDetails(id);
    res.json(movie);
  } catch (error) {
    console.error('Movie details route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie details'
    });
  }
});

// other routes go here 