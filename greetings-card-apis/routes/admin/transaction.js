const express = require('express');
const router = express.Router();
const middleWare = require('../../middleware/admin');
const authMiddleWare = require('../../middleware/auth');
const userOrAdmin = require('../../middleware/userOrAdmin');

const {create_transaction, get_all_transaction, approved_status, get_Single_CardCustomization, update_shipping_status, update_shipping_status_new, get_user_news_and_offers_preference, add_tracking_id, delete_transaction} = require('../../controllers/admin/transaction');
const orders = require('../../controllers/admin/orders');

// Fulfilment (admin only)
router.get('/orders', middleWare, orders.listOrders);
router.get('/orders/:id', middleWare, orders.getOrder);
router.put('/orders/:id/printed', middleWare, orders.setPrinted);
router.put('/orders/:id/note', middleWare, orders.setNote);

//transaction for user
router.post('/create', authMiddleWare, create_transaction);
//transaction for admin
router.get('/get-all', middleWare, get_all_transaction);
router.get('/create', middleWare, create_transaction);
router.get('/get-single-transaction-detail/:id', userOrAdmin, get_Single_CardCustomization);
router.put('/update-shipping-status/:id', middleWare, update_shipping_status);
router.put('/update-shipping-status-new/:id', middleWare, update_shipping_status_new);
router.put('/add-tracking-id/:id', middleWare, add_tracking_id);
router.get('/get-user-news-offers-preference', authMiddleWare, get_user_news_and_offers_preference);
router.delete('/delete-transaction/:id', middleWare, delete_transaction);
// router.get('/approved-status/:id', middleWare, approved_status);


module.exports = router;