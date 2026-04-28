const express = require('express');
const router = express.Router();

const {
    register,
    verify,
    login,
    auth,
    login_verification,
    forget,
    reset,editZeroIndexData,
    verification_email,signIn_with_google,signIUp_with_google, getAllLoginUserSaveCards
} = require('../../controllers/user/user');
const middleWare = require('../../middleware/auth');

router.post('/register', register);
router.post('/verify', verify);

router.post('/login', login);
// router.post('/login/verify', login_verification);
router.get('/auth', middleWare, auth);
router.post('/forget', forget);
router.post('/reset', reset);
router.post('/verification-email', middleWare, verification_email);
router.post('/google-signin', signIn_with_google);




// delete card or video by user customize card in edior
router.post('/edit-data', editZeroIndexData);




router.get('/get-all-cards/:email',middleWare,  getAllLoginUserSaveCards);

module.exports = router;