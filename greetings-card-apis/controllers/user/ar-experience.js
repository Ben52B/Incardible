const {success_response, error_response} = require('../../utils/response');
const TempTemplate = require('../../models/templateData');
const CardCustomization = require('../../models/card_customization');
const TransactionData = require('../../models/transactionData');
const BACKEND_URL = process.env.API_URL;
const WEB_URL = process.env.APP_URL;

// exports.uploadGalleryImages = async (req, res) => {
//     try {
//         const {userId} = req.body;
//
//         if (!userId) {
//             return error_response(res, 400, "User id is required!");
//         }
//         const userTemplateData = await TempTemplate.findOne({userId});
//
//
//         if (!userTemplateData) {
//             return error_response(res, 404, "User ar template data not found!");
//         }
//
//         if (!req.files || req.files === 0) {
//             return error_response(res, 404, "No files uploaded!");
//         }
//
//         const filePaths = req.files.map(file => file.path.substring(7));
//
//         const galleryImageUrls = filePaths.map(path => `${BACKEND_URL}/${path}`);
//
//         if (filePaths) {
//             userTemplateData.uploadGalleryImages.push(...galleryImageUrls);
//         }
//
//         await userTemplateData.save();
//
//         return success_response(res, 200, "Gallery images uploaded successfully",
//             userTemplateData
//         );
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// exports.uploadGalleryVideos = async (req, res) => {
//     try {
//         const {userId} = req.body;
//
//         if (!userId) {
//             return error_response(res, 400, "User id is required!");
//         }
//         const userTemplateData = await TempTemplate.findOne({userId});
//
//
//         if (!userTemplateData) {
//             return error_response(res, 404, "User ar template data not found!");
//         }
//
//         if (!req.files || req.files === 0) {
//             return error_response(res, 404, "No files uploaded!");
//         }
//
//         const filePaths = req.files.map(file => file.path.substring(7));
//
//         const videoUrls = filePaths.map(video => `${BACKEND_URL}/${video}`)
//
//         if (filePaths) {
//             userTemplateData.uploadGalleryVideos.push(...videoUrls);
//         }
//         await userTemplateData.save();
//         return success_response(res, 200, "Gallery videos uploaded successfully", userTemplateData);
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// }

// exports.uploadImageThroughQrScanningSpecificIndex = async (req, res) => {
//     try {
//         let {uuid, index, isAuthenticated} = req.body;
//         // isAuthenticated = String(isAuthenticated).toLowerCase() === "true";
//
//         console.log("req.body in image", req.body)
//
//         if (!(uuid && index)) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//
//         index = parseInt(index);
//         let userTemplateData;
//
//         if (isAuthenticated === 'true') {
//
//             userTemplateData = await CardCustomization.findOne({uuid});
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             let imagePath;
//             if (req.file) {
//                 imagePath = req.file.path.substring(7);
//                 userTemplateData[`templateImage${index}`] = BACKEND_URL + "/" + imagePath;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Image uploaded successfully",
//                 {
//                     image: BACKEND_URL + "/" + imagePath
//                 }
//             );
//         } else {
//
//             userTemplateData = await TempTemplate.findOne({uuid});
//
//             console.log("userTemplateData in image",userTemplateData)
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             let imagePath;
//             if (req.file) {
//                 imagePath = req.file.path.substring(7);
//                 userTemplateData[`templateImage${index}`] = BACKEND_URL + "/" + imagePath;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Image uploaded successfully",
//                 {
//                     image: BACKEND_URL + "/" + imagePath
//                 }
//             );
//
//         }
//
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

exports.uploadImageThroughQrScanningSpecificIndex = async (req, res) => {
    try {
        let {uuid, index, isAuthenticated} = req.body;
        // console.log("req.body in image", req.body);
        // Normalize isAuthenticated to a boolean
        isAuthenticated = String(isAuthenticated).trim().toLowerCase() === "true";

        console.log("isAuthenticated in image", isAuthenticated)

        if (!(uuid && index)) {
            return error_response(res, 400, "All inputs are required!");
        }

        index = parseInt(index);
        let userTemplateData;

        if (isAuthenticated) {
            // Authenticated users → CardCustomization table
            userTemplateData = await CardCustomization.findOne({uuid});

        } else {
            // Guest users → TempTemplate table
            userTemplateData = await TempTemplate.findOne({uuid});
        }

        if (!userTemplateData) {
            return error_response(res, 404, "User AR template data not found!");
        }

        let imagePath;
        if (req.file) {
            imagePath = req.file.path.substring(7);
            userTemplateData[`templateImage${index}`] = BACKEND_URL + "/" + imagePath;
        }

        await userTemplateData.save();

        return success_response(res, 200, "Image uploaded successfully", {
            image: BACKEND_URL + "/" + imagePath
        });

    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// exports.uploadVideoThroughQrScanningSpecificIndex = async (req, res) => {
//     try {
//         let {uuid, isAuthenticated} = req.body;
//         console.log("req.body in video", req.body)
//         // isAuthenticated = String(isAuthenticated).toLowerCase() === "true";
//
//         if (!uuid) {
//             return error_response(res, 400, "User id is required!");
//         }
//
//
//         if (isAuthenticated === 'true') {
//             const userTemplateData = await CardCustomization.findOne({uuid});
//
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//             let videoPath;
//             if (req.file) {
//                 videoPath = req.file.path.substring(7);
//                 userTemplateData.templateVideo = BACKEND_URL + "/" + videoPath;
//                 userTemplateData.arTemplateData.videoUrl = BACKEND_URL + "/" + videoPath;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Video uploaded successfully", {video: BACKEND_URL + "/" + videoPath});
//         } else {
//             const userTemplateData = await TempTemplate.findOne({uuid});
//             console.log("userTemplateData in video",userTemplateData)
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//             let videoPath;
//             if (req.file) {
//                 videoPath = req.file.path.substring(7);
//                 userTemplateData.templateVideo = BACKEND_URL + "/" + videoPath;
//                 userTemplateData.arTemplateData.videoUrl = BACKEND_URL + "/" + videoPath;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Video uploaded successfully", {video: BACKEND_URL + "/" + videoPath});
//         }
//
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };
exports.uploadVideoThroughQrScanningSpecificIndex = async (req, res) => {
    try {
        let {uuid, isAuthenticated} = req.body;
        // console.log("req.body in video", req.body);

        isAuthenticated = String(isAuthenticated).trim().toLowerCase() === "true";

        if (!uuid) {
            return error_response(res, 400, "User id is required!");
        }

        let userTemplateData;
        if (isAuthenticated) {
            // Authenticated users → CardCustomization table
            userTemplateData = await CardCustomization.findOne({uuid});

        } else {
            // Guest users → TempTemplate table

            userTemplateData = await TempTemplate.findOne({uuid});
        }

        if (!userTemplateData) {
            return error_response(res, 404, "User AR template data not found!");
        }

        let videoPath;
        if (req.file) {
            videoPath = req.file.path.substring(7);
            userTemplateData.templateVideo = BACKEND_URL + "/" + videoPath;

            // Ensure arTemplateData exists before setting videoUrl
            if (!userTemplateData.arTemplateData) {
                userTemplateData.arTemplateData = {};
            }
            userTemplateData.arTemplateData.videoUrl = BACKEND_URL + "/" + videoPath;
        }

        await userTemplateData.save();

        return success_response(res, 200, "Video uploaded successfully", {
            video: BACKEND_URL + "/" + videoPath
        });

    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// exports.delete0IndexContentFromMobile = async (req, res) => {
//     try {
//         let {uuid, isImage, isAuthenticated} = req.body;
//
//         // isAuthenticated = String(isAuthenticated).toLowerCase() === "true";
//
//         if (!uuid || typeof isImage == undefined) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//
//         if (isAuthenticated === 'true') {
//             const userTemplateData = await CardCustomization.findOne({uuid});
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             if (isImage) {
//                 userTemplateData.templateImage0 = null;
//             } else {
//                 userTemplateData.templateVideo = null;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Content deleted successfully successfully", userTemplateData);
//         } else {
//
//             const userTemplateData = await TempTemplate.findOne({uuid});
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             if (isImage) {
//                 userTemplateData.templateImage0 = null;
//             } else {
//                 userTemplateData.templateVideo = null;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Content deleted successfully successfully", userTemplateData);
//         }
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// }

exports.delete0IndexContentFromMobile = async (req, res) => {
    try {
        let {uuid, isImage, isAuthenticated} = req.body;

        isAuthenticated = String(isAuthenticated).trim().toLowerCase() === "true";


        if (!uuid || typeof isImage === "undefined") {
            return error_response(res, 400, "All inputs are required!");
        }

        let userTemplateData;
        if (isAuthenticated) {
            // Authenticated users → CardCustomization table
            userTemplateData = await CardCustomization.findOne({uuid});

        } else {
            // Guest users → TempTemplate table
            userTemplateData = await TempTemplate.findOne({uuid});
        }

        if (!userTemplateData) {
            return error_response(res, 404, "User AR template data not found!");
        }

        if (isImage) {
            userTemplateData.templateImage0 = null;
        } else {
            userTemplateData.templateVideo = null;
        }

        await userTemplateData.save();

        return success_response(res, 200, "Content deleted successfully", userTemplateData);

    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// exports.delete0IndexContentFromMobile = async (req, res) => {
//     try {
//         let {uuid, isImage, isAuthenticated} = req.body;
//
//         console.log("req.body", typeof req.body, req.body)
//
//         isAuthenticated = isAuthenticated === true || isAuthenticated === "true";
//
//         if (!uuid) {
//             return error_response(res, 400, "User id is  required!");
//         }
//
//         if (isAuthenticated) {
//             const userTemplateData = await CardCustomization.findOne({uuid});
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             if (isImage == 0) {
//                 userTemplateData.templateImage0 = null;
//             } else {
//                 userTemplateData.templateVideo = null;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Content deleted successfully successfully", userTemplateData);
//         } else {
//             const userTemplateData = await TempTemplate.findOne({uuid});
//
//             if (!userTemplateData) {
//                 return error_response(res, 404, "User ar template data not found!");
//             }
//
//             if (isImage == 0) {
//                 userTemplateData.templateImage0 = null;
//             } else {
//                 userTemplateData.templateVideo = null;
//             }
//
//             await userTemplateData.save();
//             return success_response(res, 200, "Content deleted successfully successfully", userTemplateData);
//         }
//
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// }

// exports.updateImageThroughQrScanningSpecificIndex = async (req, res) => {
//     try {
//         let {userId, index} = req.body;
//
//         if (!(userId && index)) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//
//         index = parseInt(index);
//
//         const userTemplateData = await CardCustomization.findOne({uuid: userId});
//
//         if (!userTemplateData) {
//             return error_response(res, 404, "User ar template data not found!");
//         }
//
//         let imagePath;
//         if (req.file) {
//             imagePath = req.file.path.substring(7);
//             userTemplateData[`templateImage${index}`] = BACKEND_URL + "/" + imagePath;
//         }
//
//         await userTemplateData.save();
//
//         return success_response(res, 200, "Image uploaded successfully",
//             {
//                 image: BACKEND_URL + "/" + imagePath
//             }
//         );
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// exports.updateVideoThroughQrScanningSpecificIndex = async (req, res) => {
//     try {
//         const {userId} = req.body;
//
//         if (!userId) {
//             return error_response(res, 400, "User id is required!");
//         }
//
//         const userTemplateData = await CardCustomization.findOne({uuid: userId});
//
//
//         if (!userTemplateData) {
//             return error_response(res, 404, "User ar template data not found!");
//         }
//         let videoPath;
//         if (req.file) {
//             videoPath = req.file.path.substring(7);
//             userTemplateData.templateVideo = BACKEND_URL + "/" + videoPath;
//         }
//
//         await userTemplateData.save();
//         return success_response(res, 200, "Video uploaded successfully", {video: BACKEND_URL + "/" + videoPath});
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// exports.updateDelete0IndexContentFromMobile = async (req, res) => {
//     try {
//         const {userId, isImage} = req.body;
//
//         if (!userId || typeof isImage == undefined) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//
//         const userTemplateData = await CardCustomization.findOne({userId});
//
//         if (!userTemplateData) {
//             return error_response(res, 404, "User ar template data not found!");
//         }
//
//         if (isImage) {
//             userTemplateData.templateImage0 = null;
//         } else {
//             userTemplateData.templateVideo = null;
//         }
//
//         await userTemplateData.save();
//         return success_response(res, 200, "Content deleted successfully successfully", userTemplateData);
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// }

exports.getUserArExperience = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return error_response(res, 400, "Id is required!");
        }

        const userArExperience = await CardCustomization.findOne({_id: id}).populate('cardId');
        // console.log("userArExperience", userArExperience)
        if (!userArExperience) {
            return error_response(res, 404, "User ar experience not found!");
        }


        let resposne = {
            cardId: {
                frontDesign: BACKEND_URL + "/" + userArExperience?.cardId?.frontDesign,
                backDesign: BACKEND_URL + "/" + userArExperience?.cardId?.backDesign,
                insideLeftDesign: BACKEND_URL + "/" + userArExperience?.cardId?.insideLeftDesign,
                insideRightDesign: BACKEND_URL + "/" + userArExperience?.cardId?.insideRightDesign,
                video: BACKEND_URL + "/" + userArExperience?.cardId?.video,
            },
            arTemplateData: userArExperience?.arTemplateData,
            templateImage0: userArExperience?.templateImage0,
            templateImage1: userArExperience?.templateImage1,
            templateImage2: userArExperience?.templateImage2,
            templateImage3: userArExperience?.templateImage3,
            templateImage4: userArExperience?.templateImage4,
            templateImage5: userArExperience?.templateImage5,
            templateImage6: userArExperience?.templateImage6,
            templateImage7: userArExperience?.templateImage7,
            templateImage8: userArExperience?.templateImage8,
            templateImage9: userArExperience?.templateImage9,
            templateImage10: userArExperience?.templateImage10,
            templateVideo: userArExperience?.templateVideo,
        }


        return success_response(res, 200, "User ar experience get successfully", resposne);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
}
exports.getUserArTemplateData = async (req, res) => {
    try {
        const {uuid} = req.params;

        if (!uuid) {
            return error_response(res, 400, "uuid is required!");
        }
        let userTempArData;
        userTempArData = await CardCustomization.findOne({uuid});

        if (!userTempArData) {
            userTempArData = await TempTemplate.findOne({uuid});
        }

        return success_response(res, 200, "User ar template data fetch successfully", userTempArData);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
}
exports.deleteUserCustomizeCard = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return error_response(res, 400, "Id is required!");
        }

        // Update instead of deleting
        const updatedCard = await CardCustomization.findByIdAndUpdate(
            id,
            { $set: { deleteMyCard: true } },
            { new: true } // return updated doc
        );

        if (!updatedCard) {
            return error_response(res, 404, "Card not found!");
        }

        return success_response(res, 200, "Card marked as deleted successfully", updatedCard);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

exports.getAllExpressShippingUsers = async (req, res) => {
    try {
        const users = await TransactionData.find({ expressShipping: true }).populate('cardCustomizationId');

        return success_response(res, 200, "Express shipping users fetched successfully", users);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};








// exports.getUserArTemplateData = async (req, res) => {
//     try {
//         const { uuid } = req.params;
//
//         if (!uuid) {
//             return error_response(res, 400, "uuid is required!");
//         }
//
//         // Keys that should be checked
//         const requiredKeys = [
//             "arTemplateData",
//             "templateImage0", "templateImage1", "templateImage2", "templateImage3", "templateImage4",
//             "templateImage5", "templateImage6", "templateImage7", "templateImage8", "templateImage9",
//             "templateImage10", "templateVideo"
//         ];
//
//         // Returns true if at least one of the keys is non-null
//         const hasAnyValidKey = (doc) => {
//             if (!doc) return false;
//             return requiredKeys.some(key => doc[key] !== null);
//         };
//
//         let data = await TempTemplate.findOne({ uuid });
//
//         console.log("data", data)
//
//         if (!hasAnyValidKey(data)) {
//             const cardCustomizationData = await CardCustomization.findOne({ uuid });
//
//             console.log("cardCustomizationData",cardCustomizationData)
//
//             if (hasAnyValidKey(cardCustomizationData)) {
//                 data = cardCustomizationData;
//             } else {
//                 data = null;
//             }
//         }
//
//         if (!data) {
//             return error_response(res, 404, "No user template data found");
//         }
//
//         return success_response(res, 200, "User AR template data fetched successfully", data);
//
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };




