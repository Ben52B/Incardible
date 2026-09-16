const express = require('express');
const router = express.Router();
const {getCardTargetStatus, compileCardTarget: compileCardTargetHandler, 
    createCard,
    getAllCards,
    uploadFrontDesign,
    uploadBackDesign,
    uploadInsideLeftDesign,
    updateARTemplate,
    uploadInsideRightDesign,
    getAuthCardData,
    updateTemplateImage,
    updateVideoForTemplate,
    updateArTemplateJson,
    updateTemplateData,
    uploadVideo,
    getAllFrontDesignCards,
    getCardForGame,
    uploadArTemplateJson,
    getCard,
    destroyCard,
    uploadARTemplateData,
    EditCard,
    uploadARTemplate,
    uploadTemplateImage,
    uploadVideoForTemplate,
    getTemplateData,addCardViews,
    updateDataWhenTemplateChange,uploadEnvelope,
    checkCardExpiration,
    uploadtextSS
} = require('../../controllers/admin/cardCustomization');
const {uploadMiddleware, uploadImageMiddleware, uploadMusicFile} = require('../../utils/multer');
const middleWare = require("../../middleware/admin");


router.post('/create', middleWare, createCard);
// router.get('/get/user/:userId', getTemplateData);
router.post('/get/auth', updateTemplateData);
router.get('/get/auth/:email', middleWare, getAuthCardData);
router.get('/check-expired/:id', checkCardExpiration);
router.post('/edit', middleWare, EditCard);
router.post('/upload-template-data', uploadARTemplateData);
router.post('/upload-ar-data', uploadArTemplateJson);
// router.post('/update-ar-data', updateArTemplateJson);
router.post('/upload-card-id', uploadARTemplate);
// router.post('/update-card-id', updateARTemplate);
router.post('/upload-image', uploadImageMiddleware('templateImages').single('image'), uploadTemplateImage);
// router.post('/update-image', uploadImageMiddleware('templateImages').single('image'), updateTemplateImage);
router.post('/upload-template-video', uploadMiddleware('templateVideo').single('video'), uploadVideoForTemplate);
// router.post('/update-template-video', uploadMiddleware('templateVideo').single('video'), updateVideoForTemplate);
router.get('/get-all', middleWare, getAllCards);
router.get('/get-all-front-design', getAllFrontDesignCards);
router.get('/get/:uuid', middleWare, getCard);
router.get('/get/data/game/:uuid', getCardForGame);
router.post('/:uuid/view', addCardViews);


router.delete('/destroy/:id', middleWare, destroyCard);
router.get('/target-status/:uuid', middleWare, getCardTargetStatus);
router.post('/compile-target/:uuid', middleWare, compileCardTargetHandler);
router.post('/upload-front-design', [middleWare, uploadImageMiddleware('Cards').single('frontDesign')], uploadFrontDesign);
router.post('/upload-envelope', [middleWare, uploadImageMiddleware('Cards').single('envelope')], uploadEnvelope);
router.post('/upload-back-design', [middleWare, uploadImageMiddleware('Cards').single('backDesign')], uploadBackDesign);
router.post('/upload-inside-left-design', [middleWare, uploadImageMiddleware('Cards').single('insideLeftDesign')], uploadInsideLeftDesign);
router.post('/upload-inside-right-design', [middleWare, uploadImageMiddleware('Cards').single('insideRightDesign')], uploadInsideRightDesign);
router.post('/upload-video-design', [middleWare, uploadMiddleware('Cards').single('video')], uploadVideo);
router.post('/update-data', updateDataWhenTemplateChange);


router.post('/upload-text-ss', uploadImageMiddleware('templateTextSS').single('image'), uploadtextSS);



module.exports = router;