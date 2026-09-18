const express = require('express');
const router = express.Router();
const {login, verify, forget, reset, register} = require('../../controllers/admin/admin');
const middleWare = require("../../middleware/admin");
const {sendNewsAndOffersToSubscribeUsers} = require("../../controllers/admin/cardCustomization");
const {uploadImageMiddleware} = require("../../utils/multer");

router.post('/login', login);
router.post('/register', register);
router.get('/auth', middleWare, verify);
router.post('/send/news-and-offers',[middleWare,  uploadImageMiddleware('newsAndOffers').single('image')], sendNewsAndOffersToSubscribeUsers);
// router.post('/forget', forget);
// router.post('/reset', reset);

module.exports = router;