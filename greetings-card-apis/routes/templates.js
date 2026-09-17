// Public catalogue of AR templates (themes) shared by the studio and the viewer.
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const CATALOGUE = process.env.TEMPLATES_PATH
    || path.join(__dirname, '..', '..', 'packages', 'incardible-ar', 'templates.json');

let cache = null;
function load() {
    if (cache) return cache;
    cache = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
    return cache;
}

router.get('/', (req, res) => {
    try {
        const data = load();
        res.set('Cache-Control', 'public, max-age=300');
        return res.json({success: true, data});
    } catch (err) {
        console.error('[templates] cannot read catalogue:', err.message);
        return res.status(500).json({success: false, msg: 'Template catalogue unavailable'});
    }
});

module.exports = router;
