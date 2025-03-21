const axios = require('axios');
const config = require('../config/apiConfig');
const apiKey = process.env.OMDB_API_KEY;

// caching implementation
const movieCache = {};
const searchCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hour cache duration

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
  
  // API methods will go here
  async searchMovies(query, filters = {}, page = 1) {
    // search implementation
  }
  
  async getMovieDetails(imdbId) {
    // movie metadata fetching
  }
}

module.exports = new OmdbApiService();