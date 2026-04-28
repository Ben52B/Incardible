const express = require('express');
const router = express.Router();
const {profile_update_password, profile_update_email} = require('../../controllers/admin/profile');
const middleWare = require('../../middleware/admin');

router.post('/update-password', middleWare, profile_update_password);
router.post('/update-email', middleWare, profile_update_email);

module.exports = router;