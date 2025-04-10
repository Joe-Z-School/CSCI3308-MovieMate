const axios = require('axios');
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// Caching implementation
const movieCache = {};
const searchCache = {};
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class OmdbApiService {
  constructor() {
    this.apiKey = OMDB_API_KEY;
    this.baseUrl = 'http://www.omdbapi.com/';
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        apikey: this.apiKey
      },
      timeout: 5000
    });
  }

  // Search for movies
  async searchMovies(query, filters = {}, page = 1) {
    // Create a cache key based on the query and filters
    const cacheKey = `${query}-${JSON.stringify(filters)}-${page}`;
    
    // Check cache first
    if (searchCache[cacheKey] && searchCache[cacheKey].timestamp > Date.now() - CACHE_DURATION) {
      console.log('Returning cached search results');
      return searchCache[cacheKey].data;
    }
    
    try {
      // Build the query parameters
      const params = {
        s: query,
        page: page
      };
      
      // Add any additional filters
      for (const key in filters) {
        if (filters[key]) {
          params[key] = filters[key];
        }
      }
      
      // Make the API request
      const response = await this.client.get('', { params });
      const data = response.data;
      
      // Handle error responses from OMDB
      if (data.Response === 'False') {
        return { 
          success: false, 
          error: data.Error || 'No results found' 
        };
      }
      
      // Format the results
      const result = {
        success: true,
        results: data.Search || [],
        totalResults: data.totalResults
      };
      
      // Store in cache
      searchCache[cacheKey] = {
        timestamp: Date.now(),
        data: result
      };
      
      return result;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      return { 
        success: false, 
        error: 'Error searching for movies' 
      };
    }
  }

  // Get movie details by IMDb ID
  async getMovieDetails(imdbId) {
    // Check cache first
    if (movieCache[imdbId] && movieCache[imdbId].timestamp > Date.now() - CACHE_DURATION) {
      console.log('Returning cached movie details');
      return movieCache[imdbId].data;
    }
    
    try {
      const response = await this.client.get('', {
        params: {
          i: imdbId,
          plot: 'full'
        }
      });
      
      if (response.data.Response === 'False') {
        return { success: false, error: response.data.Error || 'Movie not found' };
      }
      
      // Store in cache
      const result = { success: true, movie: response.data };
      
      movieCache[imdbId] = {
        timestamp: Date.now(),
        data: result
      };
      
      return result;
    } catch (error) {
      console.error('Error fetching movie details:', error.message);
      return { success: false, error: 'Failed to fetch movie details' };
    }
  }
}

module.exports = new OmdbApiService();