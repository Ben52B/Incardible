// Boots the API against an unreachable MongoDB and checks the HTTP surface:
// security headers, removed debug endpoints, auth enforcement, upload filter.
// Run: node scripts/smoke.js
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:1/smoke?serverSelectionTimeoutMS=20000';
process.env.TOKEN_KEY = process.env.TOKEN_KEY || 'smoke-test-key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_smoke';
process.env.CORS_OPTIONS = 'https://incardible.com.au';
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../app');

const server = http.createServer(app).listen(0);
const base = () => `http://127.0.0.1:${server.address().port}`;

const req = (method, path, {headers = {}, body} = {}) => new Promise((resolve, reject) => {
    const r = http.request(base() + path, {method, headers}, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: data}));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
});

const checks = [];
const expect = (name, cond, detail) => { checks.push({name, ok: !!cond, detail}); };

(async () => {
    try {
        let r = await req('GET', '/health');
        expect('health 200', r.status === 200, r.status);
        expect('helmet nosniff header', r.headers['x-content-type-options'] === 'nosniff');
        expect('no x-powered-by', !r.headers['x-powered-by']);

        for (const p of ['/api/verify-webhook-data', '/api/payment/test-env', '/api/payment/test-transactions', '/api/check/internet-connection', '/s/abc']) {
            r = await req('GET', p);
            expect(`removed ${p} -> 404`, r.status === 404, r.status);
        }
        r = await req('POST', '/shorten', {headers: {'content-type': 'application/json'}, body: '{"url":"https://evil"}'});
        expect('removed /shorten -> 404', r.status === 404, r.status);

        r = await req('GET', '/api/transactions/get-all');
        expect('admin route without token -> 401', r.status === 401, r.status);

        const userToken = jwt.sign({user_id: '64b000000000000000000000'}, process.env.TOKEN_KEY);
        r = await req('GET', '/api/transactions/get-all', {headers: {'x-access-token': userToken}});
        expect('admin route with CUSTOMER token -> 403', r.status === 403, r.status);
        r = await req('GET', '/api/admin/statistics/dashboard', {headers: {'x-access-token': userToken}});
        expect('statistics with CUSTOMER token -> 403', r.status === 403, r.status);
        r = await req('GET', '/api/user/ar-experience/get-all-express-shipping-users', {headers: {'x-access-token': userToken}});
        expect('express-shipping list with CUSTOMER token -> 403', r.status === 403, r.status);

        r = await req('POST', '/api/admin/register', {headers: {'content-type': 'application/json'}, body: '{"name":"x","email":"x@x.com","password":"aaaaaaaaaaaa"}'});
        expect('admin register closed -> 403', r.status === 403, r.status);

        r = await req('POST', '/api/payment/create-payment-intent', {headers: {'content-type': 'application/json'}, body: '{"amount":0.5}'});
        expect('payment intent without token -> 401', r.status === 401, r.status);
        r = await req('POST', '/api/payment/confirm-payment', {headers: {'content-type': 'application/json'}, body: '{}'});
        expect('confirm-payment without token -> 401', r.status === 401, r.status);
        r = await req('DELETE', '/api/user/ar-experience/remove-card/64b000000000000000000000');
        expect('remove-card without token -> 401', r.status === 401, r.status);

        // Upload filter: an .html "image" must be rejected before any DB work.
        const boundary = 'xxBOUNDARYxx';
        const mp = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="evil.html"\r\nContent-Type: text/html\r\n\r\n<script>1</script>\r\n--${boundary}--\r\n`;
        r = await req('POST', '/api/user/ar-experience/upload-image', {headers: {'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': Buffer.byteLength(mp)}, body: mp});
        expect('html upload rejected 415', r.status === 415, `${r.status} ${r.body.slice(0, 80)}`);

        r = await req('POST', '/api/user/login', {headers: {'content-type': 'application/json'}, body: '{bad json'});
        expect('malformed json -> 400', r.status === 400, r.status);

        r = await req('GET', '/uploads/does-not-exist.png');
        expect('static miss -> 404 json', r.status === 404, r.status);

        r = await req('GET', '/health', {headers: {origin: 'https://evil.example'}});
        expect('CORS not reflected for unknown origin', !r.headers['access-control-allow-origin']);
        r = await req('GET', '/health', {headers: {origin: 'https://incardible.com.au'}});
        expect('CORS allowed for configured origin', r.headers['access-control-allow-origin'] === 'https://incardible.com.au');
    } catch (e) {
        checks.push({name: 'smoke run', ok: false, detail: e.message});
    } finally {
        server.close();
        const failed = checks.filter(c => !c.ok);
        for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.ok ? '' : `  (${c.detail})`}`);
        console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
        process.exit(failed.length ? 1 : 0);
    }
})();
