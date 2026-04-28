// app.js (top)
const dns = require('node:dns').promises;
const https = require('node:https');

// Change via env if Google is blocked:
const CONNECTIVITY_URL = 'https://www.google.com/generate_204';

// quick probe: DNS + fast HTTP request
async function internetOk(timeout = 2500) {
    try { await dns.resolve('google.com'); } catch { return false; }

    return await new Promise((resolve) => {
        const req = https.request(CONNECTIVITY_URL, { method: 'GET', timeout }, (res) => {
            res.resume();
            resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.on('error', () => resolve(false));
        req.end();
    });
}

module.exports = internetOk;
