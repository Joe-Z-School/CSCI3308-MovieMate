const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// API Routes for OMDB integration
router.get('/search', movieController.searchMovies);
router.get('/details/:imdbId', movieController.getMovieDetails);
router.post('/watchlist', movieController.addToWatchlist);
router.post('/watched', movieController.markAsWatched);
router.post('/review', movieController.addReview);
router.get('/reviews/:imdbId', movieController.getMovieReviews);

// Page Routes
router.get('/discover', (req, res) => {
  res.render('pages/discover');
});

router.get('/details/:imdbId', (req, res) => {
  res.render('pages/movie-details', { imdbId: req.params.imdbId });
});

module.exports = router;