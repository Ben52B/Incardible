// Fulfilment-oriented order endpoints for the admin panel.
// Paginated, filterable server-side; never returns password hashes.
const mongoose = require('mongoose');
const Transaction = require('../../models/transactionData');
const User = require('../../models/user');
const {success_response, error_response} = require('../../utils/response');

const USER_FIELDS = 'firstName lastName email';
const CARD_FIELDS = 'title frontDesign price uuid trackingTarget.status';

const populateOrder = (q) => q
    .populate({path: 'user_id', select: USER_FIELDS})
    .populate({
        path: 'cardCustomizationId',
        select: 'uuid cardId arTemplateData templateTextSS templateVideo templateImage0 templateImage1 templateImage2 isPaid createdAt',
        populate: {path: 'cardId', select: CARD_FIELDS},
    });

/**
 * GET /api/transactions/orders
 *   status   = COMPLETED | PENDING | REFUNDED | all         (default COMPLETED)
 *   shipping = processing | in_shipping | shipped | all     (default all)
 *   printed  = yes | no | all                               (default all)
 *   q        = order number, customer name or email
 *   page, limit (default 1, 25; max 100), sort (default -paid_at)
 */
exports.listOrders = async (req, res) => {
    try {
        const status = String(req.query.status || 'COMPLETED').toUpperCase();
        const shipping = String(req.query.shipping || 'all');
        const printed = String(req.query.printed || 'all');
        const q = String(req.query.q || '').trim();
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
        const sortParam = String(req.query.sort || '-paid_at');
        const sort = {[sortParam.replace(/^-/, '')]: sortParam.startsWith('-') ? -1 : 1, _id: -1};

        const filter = {};
        if (status !== 'ALL') filter.status = status === 'COMPLETED' ? {$in: ['COMPLETED', 'PAID']} : status;
        if (shipping !== 'all') filter.shippingStatus = shipping === 'processing' ? {$in: ['processing', null]} : shipping;
        if (printed === 'yes') filter.printedAt = {$ne: null};
        if (printed === 'no') filter.printedAt = null;
        if (q) {
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const users = await User.find({$or: [{email: rx}, {firstName: rx}, {lastName: rx}]}).select('_id').lean();
            const or = [{orderId: rx}, {phone_number: rx}, {postal_code: rx}];
            if (users.length) or.push({user_id: {$in: users.map(u => u._id)}});
            if (mongoose.Types.ObjectId.isValid(q)) or.push({_id: q}, {cardCustomizationId: q});
            filter.$or = or;
        }

        const [items, total] = await Promise.all([
            populateOrder(Transaction.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)).lean(),
            Transaction.countDocuments(filter),
        ]);

        // Queue summary for the header badges (paid, not yet printed / not yet shipped).
        const [toPrint, toShip] = await Promise.all([
            Transaction.countDocuments({status: {$in: ['COMPLETED', 'PAID']}, printedAt: null}),
            Transaction.countDocuments({status: {$in: ['COMPLETED', 'PAID']}, shippingStatus: {$ne: 'shipped'}}),
        ]);

        return success_response(res, 200, "Orders", {items, total, page, limit, queue: {toPrint, toShip}});
    } catch (error) {
        console.error(error);
        return error_response(res, 500, "Could not load orders");
    }
};

/** GET /api/transactions/orders/:id — everything the order sheet needs. */
exports.getOrder = async (req, res) => {
    try {
        const order = await populateOrder(Transaction.findById(req.params.id)).lean();
        if (!order) return error_response(res, 404, "Order not found");
        return success_response(res, 200, "Order", order);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, "Could not load order");
    }
};

/** PUT /api/transactions/orders/:id/printed  {printed: true|false} */
exports.setPrinted = async (req, res) => {
    try {
        const printed = req.body && (req.body.printed === true || req.body.printed === 'true');
        const order = await Transaction.findByIdAndUpdate(
            req.params.id,
            {$set: {printedAt: printed ? new Date() : null}},
            {new: true}
        ).select('orderId printedAt');
        if (!order) return error_response(res, 404, "Order not found");
        return success_response(res, 200, printed ? "Marked as printed" : "Marked as not printed", order);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, "Could not update order");
    }
};

/** PUT /api/transactions/orders/:id/note  {note} */
exports.setNote = async (req, res) => {
    try {
        const note = req.body && typeof req.body.note === 'string' ? req.body.note.slice(0, 1000) : null;
        const order = await Transaction.findByIdAndUpdate(req.params.id, {$set: {fulfilmentNote: note}}, {new: true}).select('orderId fulfilmentNote');
        if (!order) return error_response(res, 404, "Order not found");
        return success_response(res, 200, "Note saved", order);
    } catch (error) {
        console.error(error);
        return error_response(res, 500, "Could not save note");
    }
};
