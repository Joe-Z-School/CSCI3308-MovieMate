require('dotenv').config();

module.exports = {
    omdbApiKey: process.env.OMDB_API_KEY,
    omdbBaseUrl: 'http://www.omdbapi.com/'
};