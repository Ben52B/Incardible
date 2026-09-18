const cron = require('node-cron');
const mongoose = require('mongoose');
const Transaction = require('../models/transactionData');
const CardCustomization = require('../models/card_customization');

const THREE_MONTHS_IN_MS = 90 * 24 * 60 * 60 * 1000;
const COMPLETED_STATUSES = ['COMPLETED', 'PAID'];

const getObjectIdList = (items, key) => {
    const ids = [];
    const seen = new Set();

    for (const item of items) {
        const rawValue = item[key];
        if (!rawValue) continue;

        const stringValue = rawValue.toString();
        if (seen.has(stringValue)) continue;

        if (mongoose.Types.ObjectId.isValid(rawValue)) {
            ids.push(new mongoose.Types.ObjectId(stringValue));
            seen.add(stringValue);
        } else {
            console.warn(`[Cleanup] Skipping invalid ObjectId value for ${key}:`, rawValue);
        }
    }

    return ids;
};

const deleteStaleCustomizationData = async () => {
    const cutoffDate = new Date(Date.now() - THREE_MONTHS_IN_MS);

    try {
        const oldTransactions = await Transaction.find(
            {
                status: { $in: COMPLETED_STATUSES },
                paid_at: { $lte: cutoffDate },
            },
            { _id: 1, cardCustomizationId: 1 } // projection for efficiency
        ).lean();

        if (!oldTransactions.length) {
            console.log('[Cleanup] No paid transactions eligible for deletion.');
            return;
        }

        const transactionIds = getObjectIdList(oldTransactions, '_id');
        const customizationIds = getObjectIdList(oldTransactions, 'cardCustomizationId');

        const [transactionResult, customizationResult] = await Promise.all([
            transactionIds.length
                ? Transaction.deleteMany({ _id: { $in: transactionIds } })
                : { acknowledged: true, deletedCount: 0 },
            customizationIds.length
                ? CardCustomization.deleteMany({ _id: { $in: customizationIds } })
                : { acknowledged: true, deletedCount: 0 },
        ]);

        console.log(
            `[Cleanup] Removed ${transactionResult.deletedCount} transactions (ack: ${transactionResult.acknowledged}) and ${customizationResult.deletedCount} card customizations (ack: ${customizationResult.acknowledged}) older than 3 months.`
        );
    } catch (error) {
        console.error('[Cleanup] Error while deleting stale customization data:', error);
    }
};

// SAFETY: this job deletes the AR experience behind PAID, PRINTED cards (the QR
// code on the physical card points at CardCustomization._id). It must never run
// automatically. It is kept only for a deliberate, opt-in retention policy and
// is disabled unless ENABLE_PAID_DATA_CLEANUP=true is set explicitly.
if (process.env.ENABLE_PAID_DATA_CLEANUP === 'true') {
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cleanup] Running daily stale customization cleanup task...');
        await deleteStaleCustomizationData();
    });
} else {
    console.log('[Cleanup] Paid customization cleanup job is disabled (ENABLE_PAID_DATA_CLEANUP not set).');
}

module.exports = {
    deleteStaleCustomizationData,
};



