const {scheduleCardTargetCompile, compileCardTarget} = require('../../utils/trackingTargets');
const Cards = require('../../models/card');
const Users = require('../../models/user');
const TemplateData = require('../../models/templateData');
const CardsCustomization = require('../../models/card_customization');
const {success_response, error_response} = require('../../utils/response');
const fs = require('fs');
const path = require('path');
const API_URL = process.env.API_URL;
const {v4: uuidv4} = require('uuid');
const TransactionData = require("../../models/transactionData");
const NewsOffers = require("../../models/news&offers");
const BACKEND_URL = process.env.API_URL;
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');


exports.createCard = async (req, res) => {
    try {
        let {title, cardType, price, promotionCode} = req.body;

        if (!(title && cardType && price)) {
            return error_response(res, 400, "All inputs are required!");
        }

        // cardType = cardType.toLowerCase();

        const createCard = await Cards.create({
            uuid: uuidv4(),
            title, cardType, price, promotionCode

        })
        return success_response(res, 200, "Card successfully created", createCard);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.EditCard = async (req, res) => {
    try {
        let {title, cardType, price, promotionCode, id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({_id: id});


        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (title) {
            card.title = title;
        }

        if (price) {
            card.price = price;
        }
        if (cardType) {
            card.cardType = cardType;
        }

        if (promotionCode !== undefined) {
            card.promotionCode = promotionCode;
        }

        await card.save();
        return success_response(res, 200, "Card successfully updated", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.getAllCards = async (req, res) => {
    try {
        const allCards = await Cards.find({deleteCard: false}).sort({createdAt: -1});
        return success_response(res, 200, "All cards fetch successfully", allCards);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.addCardViews = async (req, res) => {
    try {
        const doc = await Cards.findOneAndUpdate(
            {uuid: req.params.uuid},
            {$inc: {views: 1}},
            {new: true, projection: {views: 1, uuid: 1}}
        );
        if (!doc) return res.status(404).json({error: 'Card not found'});
        res.json({uuid: doc.uuid, views: doc.views});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Server error'});
    }
};

exports.uploadFrontDesign = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.frontDesign = req.file.path.substring(7);
        }

        await card.save();
        if (req.file) scheduleCardTargetCompile(card._id, {force: true});

        return success_response(res, 200, "Front card uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.uploadBackDesign = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.backDesign = req.file.path.substring(7);
        }

        await card.save();

        return success_response(res, 200, "Back card uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.uploadInsideLeftDesign = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.insideLeftDesign = req.file.path.substring(7);
        }

        await card.save();

        return success_response(res, 200, "Inside left card uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.uploadInsideRightDesign = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.insideRightDesign = req.file.path.substring(7);
        }

        await card.save();
        if (req.file) scheduleCardTargetCompile(card._id, {force: true});

        return success_response(res, 200, "Inside right card uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.uploadEnvelope = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.envelope = req.file.path.substring(7);
        }

        await card.save();

        return success_response(res, 200, "Envelope uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.uploadVideo = async (req, res) => {
    try {

        const {id} = req.body;

        if (!id) {
            return error_response(res, 400, "Id is  required!");
        }

        const card = await Cards.findOne({uuid: id});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        if (req.file) {
            card.video = req.file.path.substring(7);
        }

        await card.save();
        return success_response(res, 200, "Video uploaded successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.getCard = async (req, res) => {
    try {
        const uuid = req.params.uuid;

        if (!uuid) {
            return error_response(res, 400, "Id is required!");
        }

        const card = await Cards.findOne({uuid: uuid});


        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        return success_response(res, 200, "Card get successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.destroyCard = async (req, res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return error_response(res, 400, "Id is required!");
        }
        //
        // const card = await Cards.findByIdAndDelete(id);
        //
        // if (!card) {
        //     return error_response(res, 404, "Card not found!");
        // }

        const card = await Cards.findOne({
            _id: id
        });

        if (!card) {
            return error_response(res, 404, "Card not found!");
        }
        card.deleteCard = true;
        await card.save();

        return success_response(res, 200, "Card deleted successfully", card);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.getAllFrontDesignCards = async (req, res) => {
    try {
        // const {userId} = req.query;

        const allCards = await Cards.find({
            frontDesign: {$ne: null},
            // backDesign: {$ne: null},
            insideLeftDesign: {$ne: null},
            insideRightDesign: {$ne: null},
            deleteCard: false
        }).sort({createdAt: -1});
        // console.log("allCards", allCards)

        //
        // // FIXME: Needed to revamp
        // if (userId) {
        //     for (let index = 0; index < allCards.length; index++) {
        //         const currCard = allCards[index];
        //         console.log(currCard)
        //         console.log(currCard.id, currCard._id)
        //         let card = await CardsCustomization.findOne({userId, cardId: currCard._id});
        //         if (card) {
        //             allCards[index].uuid = card.uuid;
        //         }
        //     }
        // }


        return success_response(res, 200, "All front design card fetch successfully", allCards);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

exports.getCardForGame = async (req, res) => {
    try {

        const {uuid} = req.params;

        if (!uuid) {
            return error_response(res, 400, "Id is required!");
        }

        const card = await Cards.findOne({uuid});

        if (!card) {
            return error_response(res, 400, "Card not found!");
        }

        const data = {
            ...card._doc,
            frontDesign: card?.frontDesign ? `${API_URL}/${card?.frontDesign?.replace(/\\/g, "/")}` : null,
            backDesign: card?.backDesign ? `${API_URL}/${card?.backDesign?.replace(/\\/g, "/")}` : null,
            insideLeftDesign: card?.insideLeftDesign ? `${API_URL}/${card?.insideLeftDesign?.replace(/\\/g, "/")}` : null,
            insideRightDesign: card?.insideRightDesign ? `${API_URL}/${card?.insideRightDesign?.replace(/\\/g, "/")}` : null,
            video: card?.video ? `${API_URL}/${card?.video?.replace(/\\/g, "/")}` : null
        };
        return success_response(res, 200, "Card get successfully", data);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
exports.getAuthCardData = async (req, res) => {
    try {
        const {email} = req.params;

        if (!email) {
            return error_response(res, 400, "Email id is  required!");
        }

        const card = await CardsCustomization.findOne({email});

        if (!card) {
            return error_response(res, 404, "Template data  not found!");
        }

        return success_response(res, 200, "Template data fetch successfully", card);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

exports.checkCardExpiration = async (req, res) => {
    try {
        const {id} = req.params;

        console.log("----------------------------------------------------------------")
        console.log("card id from URL:", id)

        if (!id) {
            return error_response(res, 400, "Card ID is required!");
        }

        const card = await CardsCustomization.findOne({_id: id});

        if (!card) {
            return error_response(res, 404, "Card not found!");
        }

        // Calculate expiration for CardsCustomization (30 days)
        const createdDate = dayjs(card.createdAt);
        const now = dayjs();
        const diffInDays = now.diff(createdDate, 'day');

        const expired = diffInDays > 30;

        return success_response(res, 200, "Card expiration status fetched successfully", {
            expired,
            daysSinceCreation: diffInDays
        });
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};
exports.uploadARTemplateData = async (req, res) => {
    try {
        let {
            userId, email
        } = req.body;

        if (!userId) {
            return error_response(res, 400, "User id is required!");
        }

        const templateData = await TemplateData.findOne({userId});
        // const user = await Users.findOne({email});

        if (templateData) {
            const customize = await CardsCustomization.create({
                userId,
                email,
                cardId: templateData.cardId,
                arTemplateData: templateData.arTemplateData,
                templateImage0: templateData?.templateImage0 ?? null,
                templateImage1: templateData?.templateImage1 ?? null,
                templateImage2: templateData?.templateImage2 ?? null,
                templateImage3: templateData?.templateImage3 ?? null,
                templateImage4: templateData?.templateImage4 ?? null,
                templateImage5: templateData?.templateImage5 ?? null,
                templateImage6: templateData?.templateImage6 ?? null,
                templateImage7: templateData?.templateImage7 ?? null,
                templateImage8: templateData?.templateImage8 ?? null,
                templateImage9: templateData?.templateImage9 ?? null,
                templateVideo: templateData?.templateVideo ?? null
            });

            // Delete the templateData entry after successful customization creation
            await TemplateData.deleteOne({userId});

            return success_response(res, 200, "AR template data saved and template deleted successfully", customize);
        }
        return error_response(res, 404, "No template data found for the user");


    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};
// when click on card template create and than upload image one by one and video
exports.uploadARTemplate = async (req, res) => {
    try {
        const {uuid, email, isAuthenticated, userCardId, userId} = req.body;

        if (!uuid) {
            return error_response(res, 400, "Card UUID is required!");
        }

        const card = await Cards.findOne({uuid});
        if (!card) {
            return error_response(res, 404, "Card not found!");
        }

        let template = null;

        // If user is not authenticated
        if (!isAuthenticated) {
            // For unauthenticated user: check TemplateData
            const existingTemp = await TemplateData.findOne({uuid: userCardId, cardId: card._id});

            if (existingTemp) {
                return success_response(res, 200, "Template data fetched successfully", existingTemp);
            }

            // Create new TemplateData if not found
            template = await TemplateData.create({
                uuid: userCardId,
                cardId: card._id
            });

            return success_response(res, 200, "New template data created", template);
        }

        // If authenticated
        if (!email) {
            return error_response(res, 400, "Email is required for authenticated users!");
        }

        // Check for existing CardsCustomization
        let existingCustomization = await CardsCustomization.findOne({uuid: userCardId});

        if (existingCustomization) {
            return success_response(res, 200, "Customization fetched successfully", existingCustomization);
        }


        // Check if temp data exists (from unauthenticated session)
        const tempData = await TemplateData.findOne({uuid: userCardId, cardId: card._id});


        if (tempData) {
            // Migrate tempData → CardsCustomization
            const migrated = await CardsCustomization.create({
                userId,
                uuid: userCardId,
                email,
                cardId: card._id,
                arTemplateData: tempData.arTemplateData,
                templateImage0: tempData?.templateImage0 ?? null,
                templateImage1: tempData?.templateImage1 ?? null,
                templateImage2: tempData?.templateImage2 ?? null,
                templateImage3: tempData?.templateImage3 ?? null,
                templateImage4: tempData?.templateImage4 ?? null,
                templateImage5: tempData?.templateImage5 ?? null,
                templateImage6: tempData?.templateImage6 ?? null,
                templateImage7: tempData?.templateImage7 ?? null,
                templateImage8: tempData?.templateImage8 ?? null,
                templateImage9: tempData?.templateImage9 ?? null,
                templateImage10: tempData?.templateImage10 ?? null,
                templateVideo: tempData?.templateVideo ?? null
            });

            // Delete the temp data
            await TemplateData.deleteOne({uuid: userCardId, cardId: card._id});

            return success_response(res, 200, "Temp data migrated to customization", migrated);
        }

        template = await CardsCustomization.create({
            userId,
            email,
            uuid: userCardId,
            cardId: card._id
        })

        return success_response(res, 200, "Temp data migrated to customization", template);


        return success_response(res, 200, "New customization created", template);

    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

// exports.uploadARTemplate = async (req, res) => {
//     try {
//         let {uuid, email, isAuthenticated, userCardId} = req.body;
//
//         if (!uuid) {
//             return error_response(res, 400, "Card UUID is required!");
//         }
//
//         let template;
//
//         const card = await Cards.findOne({uuid});
//
//         if (!card) {
//             return error_response(res, 404, "Card not found!");
//         }
//         let oldUserTempData;
//
//         if (!isAuthenticated) {
//             oldUserTempData = await TemplateData.findOne({userId: userCardId, cardId: card._id});
//             if (!oldUserTempData) {
//                 // Create new template
//                 template = await TemplateData.create({
//                     userId: userCardId,
//                     cardId: card._id
//                 });
//             }
//             return success_response(res, 200, "Template data fetch successfully", oldUserTempData);
//
//         } else {
//             if (!email) {
//                 return error_response(res, 400, "Email is required for authenticated users!");
//             }
//
//             oldUserTempData = await CardsCustomization.findOne({userId: userCardId, cardId: card._id});
//
//             if (!oldUserTempData) {
//                 const checkNotAuthCustomization = await TemplateData.findOne({userId: userCardId, cardId: card._id});
//                 if (!checkNotAuthCustomization) {
//                     template = await CardsCustomization.create({
//                         email,
//                         userId: userCardId,
//                         cardId: card._id
//                     });
//                 }
//
//             }
//             return success_response(res, 200, "Template data fetch successfully", oldUserTempData);
//         }
//         return success_response(res, 200, "Template created successfully", template);
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// exports.updateARTemplate = async (req, res) => {
//     try {
//         let {uuid, email} = req.body;
//
//         if (!(uuid && email)) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//
//         const card = await Cards.findOne({uuid});
//
//         if (!card) {
//             return error_response(res, 404, "Card not found!");
//         }
//
//         // Create new template
//         const template = await CardsCustomization.create({
//             email,
//             userId: uuidv4(),
//             cardId: card._id
//         });
//
//         return success_response(res, 200, "Template created successfully", template);
//
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

exports.uploadTemplateImage = async (req, res) => {
    try {
        let {uuid, index, isAuthenticated} = req.body;
        isAuthenticated = isAuthenticated === true || isAuthenticated === "true";

        console.log("req.body", req.body)

        if (!uuid || index === undefined) {
            return error_response(res, 400, "Both user id  and index are required!");
        }

        let card;

        if (!isAuthenticated) {
            card = await TemplateData.findOne({uuid});


            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }

            if (req.file) {
                const imagePath = req.file.path.substring(7); // remove "public/" if that's the path prefix
                const fieldName = `templateImage${parseInt(index)}`; // e.g., index=0 → templateImage1

                card[fieldName] = imagePath; // 👈 dynamic field update
                await card.save();


                return success_response(res, 200, `Image uploaded successfully at ${fieldName}`, {
                    [fieldName]: imagePath,
                    index: parseInt(index),
                    url: `${BACKEND_URL}/${imagePath}?index=${index}`,
                    card
                });

            }
        } else {
            card = await CardsCustomization.findOne({uuid});

            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }

            if (req.file) {
                const imagePath = req.file.path.substring(7); // remove "public/" if that's the path prefix
                const fieldName = `templateImage${parseInt(index)}`; // e.g., index=0 → templateImage1

                card[fieldName] = imagePath; // 👈 dynamic field update
                await card.save();


                return success_response(res, 200, `Image uploaded successfully at ${fieldName}`, {
                    [fieldName]: imagePath,
                    index: parseInt(index),
                    url: `${BACKEND_URL}/${imagePath}?index=${index}`,
                    card
                });

            }

        }


        return error_response(res, 400, "No file uploaded.");
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

// exports.updateTemplateImage = async (req, res) => {
//     try {
//         const {userId, index} = req.body;
//
//         console.log("req.body", req.body)
//
//         if (!userId || index === undefined) {
//             return error_response(res, 400, "Both user id  and index are required!");
//         }
//         const card = await CardsCustomization.findOne({userId});
//
//         if (!card) {
//             return error_response(res, 404, "Template data  not found!");
//         }
//
//         if (req.file) {
//             const imagePath = req.file.path.substring(7); // remove "public/" if that's the path prefix
//             const fieldName = `templateImage${parseInt(index)}`; // e.g., index=0 → templateImage1
//
//             card[fieldName] = imagePath; // 👈 dynamic field update
//             await card.save();
//
//
//             return success_response(res, 200, `Image uploaded successfully at ${fieldName}`, {
//                 [fieldName]: imagePath,
//                 index: parseInt(index),
//                 url: `${BACKEND_URL}/${imagePath}?index=${index}`,
//                 card
//             });
//
//         }
//
//         return error_response(res, 400, "No file uploaded.");
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };

exports.uploadVideoForTemplate = async (req, res) => {
    try {
        let {uuid, isAuthenticated} = req.body;
        isAuthenticated = isAuthenticated === true || isAuthenticated === "true";
        if (!uuid) {
            return error_response(res, 400, "User id  is  required!");
        }

        if (!isAuthenticated) {
            const card = await TemplateData.findOne({uuid});

            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }

            if (req.file) {
                const videoPath = req.file.path.substring(7);

                card.templateVideo = BACKEND_URL + "/" + videoPath;
                await card.save();


                return success_response(res, 200, `Video uploaded successfully`, {
                    video: videoPath,
                    url: `${BACKEND_URL}/${videoPath}`,
                    card
                });
            }
        } else {

            const card = await CardsCustomization.findOne({uuid});

            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }

            if (req.file) {
                const videoPath = req.file.path.substring(7);

                card.templateVideo = BACKEND_URL + "/" + videoPath;
                await card.save();


                return success_response(res, 200, `Video uploaded successfully`, {
                    video: videoPath,
                    url: `${BACKEND_URL}/${videoPath}`,
                    card
                });
            }
        }


        return error_response(res, 400, "No file uploaded.");
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};
// exports.updateVideoForTemplate = async (req, res) => {
//     try {
//         const {userId} = req.body;
//
//         if (!userId) {
//             return error_response(res, 400, "User id  is  required!");
//         }
//
//         const card = await CardsCustomization.findOne({userId});
//
//         if (!card) {
//             return error_response(res, 404, "Template data  not found!");
//         }
//
//         if (req.file) {
//             const videoPath = req.file.path.substring(7);
//
//             card.templateVideo = videoPath;
//             await card.save();
//
//
//             return success_response(res, 200, `Video uploaded successfully`, {
//                 video: videoPath,
//                 url: `${BACKEND_URL}/${videoPath}`,
//                 card
//             });
//         }
//         return error_response(res, 400, "No file uploaded.");
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };
exports.uploadArTemplateJson = async (req, res) => {
    try {
        let {uuid, data, isAuthenticated} = req.body;
        isAuthenticated = isAuthenticated === true || isAuthenticated === "true";
        if (!(uuid && data)) {
            return error_response(res, 400, "All inputs are required!");
        }
        let card;

        if (!isAuthenticated) {
            card = await TemplateData.findOne({uuid});


            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }
            card.arTemplateData = data;
            await card.save();

        } else {
            const card = await CardsCustomization.findOne({uuid});
            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }
            card.arTemplateData = data;
            await card.save();
        }


        return success_response(res, 200, "Json save  successfully", card);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};
// exports.updateArTemplateJson = async (req, res) => {
//     try {
//         const {userId, data} = req.body;
//
//         if (!(userId && data)) {
//             return error_response(res, 400, "All inputs are required!");
//         }
//         const card = await CardsCustomization.findOne({userId});
//         if (!card) {
//             return error_response(res, 404, "Template data  not found!");
//         }
//         card.arTemplateData = data;
//         await card.save();
//
//         return success_response(res, 200, "Json save  successfully", card);
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };
// exports.getTemplateData = async (req, res) => {
//     try {
//         const {userId} = req.params;
//
//         if (!userId) {
//             return error_response(res, 400, "User id is  required!");
//         }
//
//         const card = await TemplateData.findOne({userId});
//
//         if (!card) {
//             return error_response(res, 404, "Template data  not found!");
//         }
//
//         return success_response(res, 200, "Template data fetch successfully", card);
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };

exports.updateTemplateData = async (req, res) => {
    try {
        let {email, userId, isAuthenticated} = req.body;
        isAuthenticated = isAuthenticated === true || isAuthenticated === "true";

        if (!userId) {
            return error_response(res, 400, "User id is required!");
        }

        let card;

        if (!isAuthenticated) {
            card = await TemplateData.findOne({uuid: userId});

            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }
        } else {
            if (!email) {
                return error_response(res, 400, "Email is required for authenticated users!");
            }

            card = await CardsCustomization.findOne({uuid: userId, email});

            if (!card) {
                return error_response(res, 404, "Template data  not found!");
            }
        }
        return success_response(res, 200, "Template data fetch successfully", card);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

exports.updateDataWhenTemplateChange = async (req, res) => {
    try {
        let {id, isAuthenticated} = req.body;

        console.log(":req.body", req.body)
        isAuthenticated = isAuthenticated === true || isAuthenticated === "true";


        if (!(id || isAuthenticated === undefined)) {
            return error_response(res, 400, "All inputs are  required!");
        }
        let userArTemplateData;

        if (!isAuthenticated) {
            console.log("!isAuthenticated", isAuthenticated)
            userArTemplateData = await TemplateData.findOne({_id: id});
            if (userArTemplateData) {
                userArTemplateData.templateImage0 = null;
                userArTemplateData.templateImage1 = null;
                userArTemplateData.templateImage2 = null;
                userArTemplateData.templateImage3 = null;
                userArTemplateData.templateImage4 = null;
                userArTemplateData.templateImage5 = null;
                userArTemplateData.templateImage6 = null;
                userArTemplateData.templateImage7 = null;
                userArTemplateData.templateImage8 = null;
                userArTemplateData.templateImage9 = null;
                userArTemplateData.templateImage10 = null;
                userArTemplateData.templateVideo = null;
            }
            await userArTemplateData.save();
            return success_response(res, 200, "Template data updated successfully", userArTemplateData);
        } else {
            console.log("isAuthenticated in else", isAuthenticated)
            userArTemplateData = await CardsCustomization.findOne({_id: id});
            if (userArTemplateData) {
                userArTemplateData.templateImage0 = null;
                userArTemplateData.templateImage1 = null;
                userArTemplateData.templateImage2 = null;
                userArTemplateData.templateImage3 = null;
                userArTemplateData.templateImage4 = null;
                userArTemplateData.templateImage5 = null;
                userArTemplateData.templateImage6 = null;
                userArTemplateData.templateImage7 = null;
                userArTemplateData.templateImage8 = null;
                userArTemplateData.templateImage9 = null;
                userArTemplateData.templateImage10 = null;
                userArTemplateData.templateVideo = null;
            }
            await userArTemplateData.save();
            return success_response(res, 200, "Template data updated successfully", userArTemplateData);
        }

    } catch (error) {
        console.log("Error", error)

    }
}

// exports.sendNewsAndOffersToSubscribeUsers = async (req, res) => {
//     try {
//         const {title, description, image} = req.body;
//         if (!(title && description)) {
//             return error_response(res, 400, "Title and description is   required!");
//         }
//
//         const newsAndOffers = await NewsOffers.create({
//             title, description
//         });
//
//         if (req.file) {
//             const imagePath = req.file.path.substring(7);
//             newsAndOffers.image = imagePath;
//             await newsAndOffers.save();
//
//         }
//
//         return success_response(res, 200, "News and offers send to subscribe user successfully ", newsAndOffers);
//     } catch (error) {
//         console.error(error);
//         return error_response(res, 500, error.message);
//     }
// };

const makeTransport = () =>
    nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: Number(process.env.MAIL_PORT) === 465,
        requireTLS: Number(process.env.MAIL_PORT) === 587,
        auth: {
            user: process.env.MAIL_USER,   // info@incardible.com.au
            pass: process.env.MAIL_PASS
        }
    });

// const buildEmailHTML = ({ title, description, imageUrl, appName }) => `
//   <div style="font-family:Arial,sans-serif;line-height:1.6">
//     <h2 style="margin:0 0 8px">${title}</h2>
//     ${imageUrl ? `<img src="${imageUrl}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0" />` : ''}
//     <p style="white-space:pre-wrap;margin:8px 0 16px">${description}</p>
//     <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
//     <p style="font-size:12px;color:#666;margin:0">${appName}</p>
//   </div>
// `;
const buildEmailHTML = ({appName, title, description, hasImage, userEmail, isSubscribed = true}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- NEWS & OFFERS HEADER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#1A1D25;color:#fff;border-radius:10px 10px 0 0;">
      <tr>
        <!-- Left: Logo -->
        <td width="100" valign="middle" style="padding:20px;">
          <img src="cid:company-logo" alt="Incardible Logo" width="80"
               style="display:block;height:auto;border:0;outline:0;text-decoration:none;">
        </td>

        <!-- Center: Content -->
        <td align="center" valign="middle" style="padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;line-height:1.2;">📢 News & Offers</h1>
          <p style="margin:5px 0 0;font-size:14px;line-height:1.4;opacity:.9;">
            Stay updated with our latest news
          </p>
        </td>

        <!-- Right: Spacer -->
        <td width="100" valign="middle" style="padding:20px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #667eea; margin-top: 0; font-size: 24px;">${title}</h2>
        <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 20px;">${description}</div>
        ${hasImage ? `
          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:offer-image" alt="${title}" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          </div>
        ` : ''}
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">🎉 Don't Miss Out!</h3>
        <p style="margin-bottom: 10px;">Stay connected with Incardible for the latest updates, exclusive offers, and new AR incardible card designs.</p>
        <p style="margin: 0;">Follow us for more exciting content and special promotions!</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="color: #6c757d; font-size: 14px; margin: 0;">
          Thank you for being part of the Incardible community!<br>
          We appreciate your continued support and look forward to creating amazing experiences for you.
        </p>
        <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
          Need help? Contact us at <a href="mailto:Info@incardible.com.au" style="color: #667eea; text-decoration: none;">Info@incardible.com.au</a>
        </p>
        ${isSubscribed ? `
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 10px;">
                <p style="color: #856404; font-size: 13px; margin: 0; font-weight: 500;">
                  Unsubscribe from News & Offers
                </p>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <a href="${process.env.API_URL}/api/unsubscribe/news-offers?email=${encodeURIComponent(userEmail)}" 
                   style="display: inline-block; text-decoration: none;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: #dc3545; border-radius: 15px; width: 50px; height: 26px;">
                    <tr>
                      <td style="padding: 2px; text-align: right;">
                        <div style="width: 22px; height: 22px; background: white; border-radius: 50%; display: inline-block;"></div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <p style="color: #856404; font-size: 11px; margin: 0; line-height: 1.4;">
                  Click the toggle above to stop receiving news and offers emails
                </p>
              </td>
            </tr>
          </table>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
`;

exports.sendNewsAndOffersToSubscribeUsers = async (req, res) => {
    try {
        const {title, description} = req.body;
        if (!title || !description) {
            return error_response(res, 400, 'Title and description is required!');
        }

        // 1) Create News/Offer record
        const newsAndOffers = await NewsOffers.create({title, description});
        if (req.file) {
            const imagePath = req.file.path.substring(7);
            newsAndOffers.image = imagePath;


        }
        await newsAndOffers.save();
        console.log("newsAndOffers", newsAndOffers)

        // Get all users who are subscribed to news and offers (newsAndOffers: true)
        const userIds = await TransactionData.distinct('user_id', { newsAndOffers: true });

        // if (!userIds?.length) {
        //     // Still return success with zero recipients
        //     newsAndOffers.sentStats = { requested: 0, sent: 0, failed: 0 };
        //     await newsAndOffers.save();
        //     return success_response(res, 200, 'No subscribed users found.', {
        //         newsAndOffers,
        //         recipients: 0,
        //     });
        // }

        // 3) Pull emails from Users
        const users = await Users.find({_id: {$in: userIds}}, {email: 1, firstName: 1}).lean();
        const rawEmails = (users || []).map(u => (u?.email || '').trim().toLowerCase());
        // de-dup + basic filter
        const emails = Array.from(new Set(rawEmails)).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        // if (!emails.length) {
        //     newsAndOffers.sentStats = { requested: 0, sent: 0, failed: 0 };
        //     await newsAndOffers.save();
        //     return success_response(res, 200, 'No valid recipient emails.', {
        //         newsAndOffers,
        //         recipients: 0,
        //     });
        // }

        // 4) Send emails
        const transport = makeTransport();
        await transport.verify();

        const appName = process.env.APP_NAME;
        const from = `"Incardible" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`;
        const hasImage = !!newsAndOffers.image;

        console.log("hasImage", hasImage);
        console.log("imagePath", newsAndOffers.image);

        const subject = `📢 ${title} | Incardible`;

        // Prepare attachments array
        const attachments = [];
        
        // Add company logo from backend public folder
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Construct full path to logo in backend public folder
            const logoPath = path.join(__dirname, '../../public/logo.png');
            console.log('🔍 News email - __dirname:', __dirname);
            console.log('🔍 News email - process.cwd():', process.cwd());
            console.log('🔍 News email - logoPath:', logoPath);
            console.log('🔍 News email - logo exists:', fs.existsSync(logoPath));
            
            // Try alternative path if the first one doesn't work
            const altLogoPath = path.join(process.cwd(), 'backend/public/logo.png');
            console.log('🔍 News email - altLogoPath:', altLogoPath);
            console.log('🔍 News email - alt logo exists:', fs.existsSync(altLogoPath));
            
            const finalLogoPath = fs.existsSync(logoPath) ? logoPath : (fs.existsSync(altLogoPath) ? altLogoPath : null);
            
            if (finalLogoPath) {
                attachments.push({
                    filename: 'logo.png',
                    path: finalLogoPath,
                    cid: 'company-logo'
                });
                console.log('✅ News email - Logo attachment added successfully from:', finalLogoPath);
            } else {
                console.log('❌ News email - Logo not found at any path');
            }
        } catch (logoError) {
            console.log('❌ News email - Could not attach logo:', logoError.message);
        }

        // Add offer image attachment if exists
        if (hasImage && newsAndOffers.image) {
            attachments.push({
                filename: 'offer-image.jpg',
                path: `./public/${newsAndOffers.image}`,
                cid: 'offer-image'
            });
        }

        console.log('📧 Sending news email with attachments:', attachments.length, 'files');
        console.log('📧 Attachment details:', attachments.map(att => ({ filename: att.filename, cid: att.cid, path: att.path })));
        console.log('📧 Full attachments array:', attachments);

        // Send in small concurrent batches to avoid throttling
        const BATCH_SIZE = 50;
        let sent = 0, failed = 0;
        const errors = [];

        console.log(`Starting to send emails to ${emails.length} recipients...`);

        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const slice = emails.slice(i, i + BATCH_SIZE);
            console.log(`Sending batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(emails.length/BATCH_SIZE)} (${slice.length} emails)`);
            
            const results = await Promise.allSettled(
                slice.map((to) => {
                    console.log(`Sending email to: ${to}`);
                    console.log(`📧 Email attachments for ${to}:`, attachments?.length || 0, 'files');
                    
                    // Generate HTML with user-specific unsubscribe link
                    // isSubscribed is true for all recipients since we filtered at query level
                    const html = buildEmailHTML({title, description, hasImage, appName, userEmail: to, isSubscribed: true});
                    return transport.sendMail({
                        from: from,
                        to: to,
                        subject: subject,
                        html: html,
                        attachments: attachments
                    });
                })
            );
            
            results.forEach((r, index) => {
                if (r.status === 'fulfilled') {
                    sent++;
                    console.log(`✅ Email sent successfully to: ${slice[index]}`);
                } else {
                    failed++;
                    console.error(`❌ Failed to send email to: ${slice[index]}`, r.reason);
                    errors.push({ email: slice[index], error: r.reason.message || r.reason });
                }
            });
        }

        console.log(`Email sending completed: ${sent} sent, ${failed} failed`);

        // Save stats on the News/Offer doc
        newsAndOffers.sentStats = {
            requested: emails.length,
            sent,
            failed,
            sentAt: new Date(),
            errors: errors.slice(0, 10) // Keep first 10 errors for debugging
        };
        newsAndOffers.recipientsCount = emails.length;
        await newsAndOffers.save();

        return success_response(
            res,
            200,
            `News and offers sent successfully. ${sent} sent, ${failed} failed.`,
            {
                newsAndOffers,
                stats: { sent, failed, total: emails.length },
                errors: errors.slice(0, 5) // Return first 5 errors for debugging
            }
        );
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

exports.uploadtextSS = async (req, res) => {
    try {
        let {uuid} = req.body;

        if (!uuid) {
            return error_response(res, 400, "UUID is required!");
        }

        let card = await CardsCustomization.findOne({uuid});

        if (!card) {
            return error_response(res, 404, "Template data  not found!");
        }

        if (req.file) {
            const previousRelativePath = card.templateTextSS ? card.templateTextSS.replace(/^[/\\]+/, '') : null;

            if (previousRelativePath) {
                const previousAbsolutePath = path.join(__dirname, '..', '..', 'public', previousRelativePath.replace(/\\/g, path.sep));
                try {
                    if (fs.existsSync(previousAbsolutePath)) {
                        await fs.promises.unlink(previousAbsolutePath);
                    }
                } catch (unlinkError) {
                    console.warn(`Failed to remove existing templateTextSS file: ${unlinkError.message}`);
                }
            }

            // remove "public/" if that's the path prefix.
            // final path: uploads\images\templateTextSS\1762777814664-image.png
            card.templateTextSS = req.file.path.substring(7);
            await card.save();

            return success_response(res, 200, `Text screenshot uploaded successfully`, {
                templateTextSS: card.templateTextSS
            });
        }

        return error_response(res, 400, "No file uploaded.");
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

// --- AR tracking target (admin) -------------------------------------------
exports.getCardTargetStatus = async (req, res) => {
    try {
        const card = await Cards.findOne({uuid: req.params.uuid}).select('uuid title trackingTarget frontDesign insideRightDesign').lean();
        if (!card) return error_response(res, 404, "Card not found!");
        return success_response(res, 200, "Tracking target status", card.trackingTarget || {status: 'none'});
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};

exports.compileCardTarget = async (req, res) => {
    try {
        const card = await Cards.findOne({uuid: req.params.uuid}).select('_id');
        if (!card) return error_response(res, 404, "Card not found!");
        if (String(req.query.wait) === '1') {
            const result = await compileCardTarget(card._id, {force: true});
            return success_response(res, 200, "Tracking target compiled", result);
        }
        scheduleCardTargetCompile(card._id, {force: true});
        return success_response(res, 202, "Tracking target compilation scheduled", {status: 'pending'});
    } catch (error) {
        console.error(error);
        return error_response(res, 500, error.message);
    }
};
