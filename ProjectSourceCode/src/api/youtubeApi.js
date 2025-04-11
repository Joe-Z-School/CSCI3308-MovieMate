const axios = require('axios');
const OMDB_API_KEY = process.env.OMDB_API_KEY;

const trailerCache = {};

class YouTubeApiService {
    constructor() {
      this.apiKey = process.env.YOUTUBE_API_KEY;
      
      // Log if API key is missing
      if (!this.apiKey) {
        console.warn('YouTube API key is not defined in environment variables');
      }
    }
  
    // Get movie trailer from YouTube
    async getMovieTrailer(query) {
        // Create a cache key
        const cacheKey = `trailer-${query}`;
        
        // Check cache first
        if (trailerCache[cacheKey] && trailerCache[cacheKey].timestamp > Date.now() - CACHE_DURATION) {
        console.log('Returning cached trailer results');
        return trailerCache[cacheKey].data;
        }
        
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                part: 'snippet',
                maxResults: 1,
                q: `${query} official trailer`,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY
                }
            });
            
            let result;
            if (response.data.items && response.data.items.length > 0) {
                const videoId = response.data.items[0].id.videoId;
                result = { 
                success: true, 
                videoId: videoId,
                embedUrl: `https://www.youtube.com/embed/${videoId}`
                };
            } else {
                result = { success: false, message: 'No trailer found' };
            }
            
            // Store in cache
            trailerCache[cacheKey] = {
                timestamp: Date.now(),
                data: result
            };
            
            return result;
        } catch (error) {
            console.error('Error fetching trailer:', error);
            return { 
                success: false, 
                error: 'Failed to fetch trailer' 
            };
        }
    }
}
  
module.exports = new YouTubeApiService();
