const express = require('express');
const router = express.Router();
const { unsubscribeNewsAndOffers } = require('../../controllers/user/unsubscribe');

router.get('/news-offers', unsubscribeNewsAndOffers);
router.post('/news-offers', unsubscribeNewsAndOffers);

module.exports = router;

