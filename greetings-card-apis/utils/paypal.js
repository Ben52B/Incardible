// PAYPAL INTEGRATION COMMENTED OUT - SWITCHING TO STRIPE
// utils/paypal.js
// const paypal = require('@paypal/checkout-server-sdk');

// function getPaypalClient() {
//     const Environment = process.env.PAYPAL_MODE === 'live'
//         ? paypal.core.LiveEnvironment
//         : paypal.core.SandboxEnvironment;

//     const cid = process.env.PAYPAL_CLIENT_ID;
//     const secret = process.env.PAYPAL_CLIENT_SECRET;
//     if (!cid || !secret) throw new Error('Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET');

//     const env = new Environment(cid, secret);
//     return new paypal.core.PayPalHttpClient(env);
// }

// // NEW: simple OAuth token helper used by the webhook verifier
// async function getAccessToken() {
//     const base = process.env.PAYPAL_MODE === 'live'
//         ? 'https://api-m.paypal.com'
//         : 'https://api-m.sandbox.paypal.com';
//     const cid = process.env.PAYPAL_CLIENT_ID;
//     const secret = process.env.PAYPAL_CLIENT_SECRET;
//     const auth = Buffer.from(`${cid}:${secret}`).toString('base64');
//     const res = await fetch(`${base}/v1/oauth2/token`, {
//         method: 'POST',
//         headers: { Authorization: `Basic ${auth}` },
//         body: 'grant_type=client_credentials'
//     });
//     const json = await res.json();
//     return json.access_token;
// }

// module.exports = { getPaypalClient, paypal, getAccessToken };