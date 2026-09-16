// Minimal stand-in for the Incardible API + static host for the viewer dist.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mind': 'application/octet-stream', '.mp3': 'audio/mpeg' };

export function startMockServer({ distDir, tmpDir, port = 0, experience }) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (process.env.MOCK_LOG) console.log('[mock]', req.method, url.pathname, req.headers.range || '');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    if (url.pathname.startsWith('/api/user/ar-experience/get/')) {
      const id = url.pathname.split('/').pop();
      if (id !== experience.id) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ success: false, msg: 'not found' })); }
      const base = `http://127.0.0.1:${server.address().port}`;
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ success: true, data: experience.payload(base) }));
    }
    let file = null;
    if (url.pathname.startsWith('/uploads/')) file = path.join(tmpDir, path.basename(url.pathname));
    else file = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    const ext = path.extname(file);
    const stat = fs.statSync(file);
    // Range support for video
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = parseInt(s, 10), end = e ? parseInt(e, 10) : stat.size - 1;
      res.writeHead(206, { 'content-type': MIME[ext], 'content-range': `bytes ${start}-${end}/${stat.size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-length': stat.size, 'accept-ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
