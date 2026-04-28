const express = require('express');
const router = express.Router();

const {
    uploadGalleryImages,
    uploadGalleryVideos,
    uploadImageThroughQrScanningSpecificIndex,getUserArTemplateData,
    updateImageThroughQrScanningSpecificIndex,
    uploadVideoThroughQrScanningSpecificIndex,
    updateVideoThroughQrScanningSpecificIndex,
    delete0IndexContentFromMobile,updateDelete0IndexContentFromMobile,getUserArExperience,deleteUserCustomizeCard,getAllExpressShippingUsers
} = require('../../controllers/user/ar-experience.js');

const {uploadMiddleware} = require("../../utils/multer");


// router.post('/upload-gallery-images', uploadMiddleware('User-ar-experience').array('gallery-images') ,uploadGalleryImages);
// router.post('/upload-gallery-videos', uploadMiddleware('User-ar-experience').array('gallery-videos') ,uploadGalleryVideos);
router.post('/upload-image', uploadMiddleware('User-ar-experience').single('images'), uploadImageThroughQrScanningSpecificIndex);
router.post('/upload-video', uploadMiddleware('User-ar-experience').single('videos'), uploadVideoThroughQrScanningSpecificIndex);
router.post('/remove-0-index-content', delete0IndexContentFromMobile);

router.get('/get/:id',getUserArExperience );
router.get('/get/data/:uuid',getUserArTemplateData );
router.delete('/remove-card/:id',deleteUserCustomizeCard );
router.get('/get-all-express-shipping-users',getAllExpressShippingUsers );
// router.post('/update-image', uploadMiddleware('User-ar-experience').single('images'), updateImageThroughQrScanningSpecificIndex);
// router.post('/update-video', uploadMiddleware('User-ar-experience').single('videos'), updateVideoThroughQrScanningSpecificIndex);

// router.post('/update-remove-0-index-content', updateDelete0IndexContentFromMobile);

module.exports = router;