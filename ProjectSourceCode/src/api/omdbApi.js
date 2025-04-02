const axios = require('axios');
const config = require('../config/apiConfig');
const apiKey = process.env.OMDB_API_KEY;

// caching implementation
const movieCache = {};
const searchCache = {};
const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hour cache duration

class OmdbApiService {
  constructor() {
    this.apiKey = config.omdbApiKey;
    this.baseUrl = config.omdbBaseUrl;
    
    // configure axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        apikey: this.apiKey
      },
      timeout: config.requestTimeout || 5000
    });
  }
  
  async searchMovies(query, filters = {}, page = 1) {
    const cacheKey = `${query}-${JSON.stringify(filters)}-${page}`;
    
    // check cache first
    if (searchCache[cacheKey] && searchCache[cacheKey].timestamp > Date.now() - CACHE_DURATION) {
      console.log('Returning cached search results');
      return searchCache[cacheKey].data;
    }
    
    try {
      // build necessary parameters for the request
      const params = {
        s: query,
        page: page
      };
      
      // add any filters (year, type, etc.)
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      
      const response = await this.client.get('', { params });
      
      if (response.data.Response === 'False') {
        return { success: false, error: response.data.Error || 'No results found' };
      }
      
      // store in cache
      const result = {
        success: true,
        results: response.data.Search,
        totalResults: parseInt(response.data.totalResults, 10),
        page: page
      };
      
      searchCache[cacheKey] = {
        timestamp: Date.now(),
        data: result
      };
      
      return result;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      return { success: false, error: 'Failed to search movies' };
    }
  }
  
  async getMovieDetails(imdbId) {
    // check cache first
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
      
      // store in cache
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