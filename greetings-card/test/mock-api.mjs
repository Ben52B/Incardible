// In-memory stand-in for greetings-card-apis, covering what the studio, nav,
// auth context and checkout page call. No external deps (tiny multipart parser).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const templates = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'packages', 'incardible-ar', 'templates.json'), 'utf8'));
const sampleCard = path.join(here, '..', '..', 'ar-viewer', 'test', 'fixtures', 'sample-card.png');
const sampleMusic = fs.existsSync(path.join(here, '..', '..', 'greetings-card-apis', 'public', 'music', '1.mp3')) ? path.join(here, '..', '..', 'greetings-card-apis', 'public', 'music', '1.mp3') : null;

const CARD = { _id: '64c000000000000000000001', uuid: 'card-uuid-1', title: 'Birthday Bubbles', price: 24.95, frontDesign: 'uploads/images/Cards/sample.png', cardType: ['Birthday'] };
const USER = { _id: '64u000000000000000000001', email: 'ben@example.com', firstName: 'Ben', lastName: 'B', isVerified: true };
const state = { temp: new Map(), cust: new Map(), uploads: new Map(), log: [] };

function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType || '');
  const boundary = m && (m[1] || m[2]);
  const out = { fields: {}, files: {} };
  if (!boundary) return out;
  const delim = Buffer.from(`--${boundary}`);
  let start = buf.indexOf(delim) + delim.length + 2;
  while (start < buf.length) {
    const end = buf.indexOf(delim, start);
    if (end < 0) break;
    const part = buf.subarray(start, end - 2);
    const hEnd = part.indexOf('\r\n\r\n');
    const headers = part.subarray(0, hEnd).toString();
    const body = part.subarray(hEnd + 4);
    const name = /name="([^"]+)"/.exec(headers)?.[1];
    const filename = /filename="([^"]*)"/.exec(headers)?.[1];
    const type = /Content-Type:\s*([^\r\n]+)/i.exec(headers)?.[1];
    if (filename !== undefined) out.files[name] = { filename, type, data: body };
    else out.fields[name] = body.toString();
    start = end + delim.length + 2;
  }
  return out;
}

const readBody = (req) => new Promise((res) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => res(Buffer.concat(c))); });
const json = (res, status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
const ok = (res, data, msg = 'ok') => json(res, 200, { success: true, msg, data });

function findByUuid(uuid) { return state.cust.get(uuid) || state.temp.get(uuid) || null; }

export function startMockApi(port = 5055) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const token = req.headers['x-access-token'];
    const authed = token === 'test-user-token';
    state.log.push({ method: req.method, path: p, authed });
    const raw = await readBody(req);
    let body = {};
    if (/application\/json/.test(req.headers['content-type'] || '')) { try { body = JSON.parse(raw.toString() || '{}'); } catch (_) {} }
    const mp = /multipart\/form-data/.test(req.headers['content-type'] || '') ? parseMultipart(raw, req.headers['content-type']) : null;

    // --- static
    if (p.startsWith('/uploads/') || p.startsWith('/music/')) {
      if (p === '/uploads/images/Cards/sample.png') { res.writeHead(200, { 'content-type': 'image/png' }); return fs.createReadStream(sampleCard).pipe(res); }
      if (p.startsWith('/music/') && sampleMusic) { res.writeHead(200, { 'content-type': 'audio/mpeg' }); return fs.createReadStream(sampleMusic).pipe(res); }
      const up = state.uploads.get(p.replace(/^\//, ''));
      if (up) { res.writeHead(200, { 'content-type': up.type || 'application/octet-stream' }); return res.end(up.data); }
      res.writeHead(404); return res.end('nf');
    }
    // --- auth
    if (p === '/api/user/auth') return authed ? ok(res, USER) : json(res, 401, { success: false, msg: 'Authentication required' });
    if (p === '/api/admin/category/get/all') return ok(res, []);
    if (p === '/api/admin/statistics/increment-visitor-count') return ok(res, {});
    if (p === '/api/statistics/popular-cards') return ok(res, []);
    if (p === '/api/templates') return ok(res, templates);
    if (p === '/api/music') return json(res, 200, sampleMusic ? [{ index: 0, name: 'Gentle piano.mp3', url: '/music/Gentle%20piano.mp3' }] : []);
    if (p === `/api/cards/get/data/game/${CARD.uuid}`) return ok(res, { ...CARD, frontDesign: `http://127.0.0.1:${port}/${CARD.frontDesign}` });
    if (p.startsWith('/api/cards/get/data/game/')) return json(res, 400, { success: false, msg: 'Card not found!' });

    if (p === '/api/cards/upload-card-id') {
      const { userCardId, isAuthenticated } = body;
      if (isAuthenticated && authed) {
        let c = state.cust.get(userCardId);
        if (!c) {
          const t = state.temp.get(userCardId) || {};
          c = { ...t, _id: '64d' + String(state.cust.size + 1).padStart(21, '0'), uuid: userCardId, cardId: CARD._id, userId: USER._id, email: USER.email, isPaid: false, arTemplateData: t.arTemplateData || null };
          state.cust.set(userCardId, c); state.temp.delete(userCardId);
        }
        return ok(res, c);
      }
      let t = state.temp.get(userCardId);
      if (!t) { t = { _id: '64t' + String(state.temp.size + 1).padStart(21, '0'), uuid: userCardId, cardId: CARD._id, arTemplateData: null }; state.temp.set(userCardId, t); }
      return ok(res, t);
    }
    if (p === '/api/cards/upload-ar-data') {
      const d = findByUuid(body.uuid); if (!d) return json(res, 404, { success: false, msg: 'Template data not found!' });
      d.arTemplateData = body.data; return ok(res, d);
    }
    if (p === '/api/cards/upload-image' && mp) {
      const d = findByUuid(mp.fields.uuid); if (!d) return json(res, 404, { success: false, msg: 'Template data not found!' });
      const idx = parseInt(mp.fields.index, 10); const f = mp.files.image;
      const rel = `uploads/images/templateImages/${Date.now()}-${idx}.jpg`;
      state.uploads.set(rel, f); d[`templateImage${idx}`] = rel;
      return ok(res, { [`templateImage${idx}`]: rel, index: idx, url: `http://127.0.0.1:${port}/${rel}`, card: d });
    }
    if (p === '/api/cards/upload-template-video' && mp) {
      const d = findByUuid(mp.fields.uuid); if (!d) return json(res, 404, { success: false, msg: 'Template data not found!' });
      const rel = `uploads/images/templateVideo/${Date.now()}.webm`; state.uploads.set(rel, mp.files.video); d.templateVideo = `http://127.0.0.1:${port}/${rel}`;
      return ok(res, { video: d.templateVideo });
    }
    if (p === '/api/user/edit-data') {
      const d = findByUuid(body.uuid); if (!d) return json(res, 400, { success: false, msg: 'not found' });
      if (String(body.isImage) === '1' || body.isImage === true) d[`templateImage${body.index}`] = null; else d.templateVideo = null;
      return ok(res, d);
    }
    if (p === '/api/cards/upload-text-ss' && mp) {
      const d = state.cust.get(mp.fields.uuid); if (!d) return json(res, 404, { success: false, msg: 'Template data not found!' });
      const rel = `uploads/images/templateTextSS/${Date.now()}-image.png`; state.uploads.set(rel, mp.files.image); d.templateTextSS = rel;
      return ok(res, { templateTextSS: rel });
    }
    if (p.startsWith('/api/transactions/get-single-transaction-detail/')) {
      const id = p.split('/').pop(); const d = [...state.cust.values()].find((c) => c._id === id);
      if (!d) return json(res, 404, { success: false, msg: 'not found' });
      return ok(res, { ...d, cardId: CARD });
    }
    if (p.startsWith('/api/user/ar-experience/get/data/')) { const d = findByUuid(p.split('/').pop()); return d ? ok(res, d) : json(res, 404, { success: false }); }
    json(res, 404, { success: false, msg: `mock: no route for ${req.method} ${p}` });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port, state, CARD, USER })));
}

if (process.argv[1] && process.argv[1].endsWith('mock-api.mjs')) {
  startMockApi(+(process.argv[2] || 5055)).then(({ port }) => console.log(`mock api on http://127.0.0.1:${port}`));
}
