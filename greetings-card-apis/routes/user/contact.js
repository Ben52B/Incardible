const express = require('express');
const router = express.Router();

const {
  contactUs
} = require('../../controllers/user/contact');




router.post('/message',  contactUs);

module.exports = router;