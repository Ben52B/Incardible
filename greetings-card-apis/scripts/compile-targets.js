// Backfill / refresh MindAR tracking targets for cards.
//   node scripts/compile-targets.js            # all cards with artwork, skip up-to-date
//   node scripts/compile-targets.js --paid     # only cards used by paid customisations
//   node scripts/compile-targets.js --force    # recompile even if up to date
//   node scripts/compile-targets.js --uuid <cardUuid>
require('dotenv').config();
const mongoose = require('mongoose');
const Card = require('../models/card');
const CardCustomization = require('../models/card_customization');
const {compileCardTarget} = require('../utils/trackingTargets');

(async () => {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const paidOnly = args.includes('--paid');
    const uuidIdx = args.indexOf('--uuid');
    await mongoose.connect(process.env.MONGO_URL);

    let query = {deleteCard: {$ne: true}, $or: [{frontDesign: {$ne: null}}, {insideRightDesign: {$ne: null}}]};
    if (uuidIdx >= 0) query = {uuid: args[uuidIdx + 1]};
    if (paidOnly) {
        const ids = await CardCustomization.distinct('cardId', {isPaid: true});
        query._id = {$in: ids};
    }
    const cards = await Card.find(query).select('_id uuid title').lean();
    console.log(`${cards.length} card(s) to process`);
    let ok = 0, failed = 0, skipped = 0;
    for (const c of cards) {
        const t0 = Date.now();
        try {
            const r = await compileCardTarget(c._id, {force});
            if (r.unchanged) { skipped++; continue; }
            ok++;
            const summary = (r.targets || []).map(t => `${t.face}:${t.points}pts/${t.quality}`).join(' ');
            console.log(`ok   ${c.uuid} "${c.title || ''}" ${summary} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        } catch (e) {
            failed++;
            console.log(`FAIL ${c.uuid} "${c.title || ''}": ${e.message}`);
        }
    }
    console.log(`done: ${ok} compiled, ${skipped} up to date, ${failed} failed`);
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
