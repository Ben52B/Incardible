const express = require('express');
const router = express.Router();
const { getMostPopularCards } = require('../../controllers/admin/statistics');

// Public statistics routes (no authentication required)
router.get('/popular-cards', getMostPopularCards);

module.exports = router;
