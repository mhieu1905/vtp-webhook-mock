import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/send-webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

/**
 * Adapter hỗ trợ res.status(), res.json() cho native http response
 */
function enhanceResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  // Xử lý API route /api/send-webhook
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/send-webhook')) {
    let bodyText = '';
    req.on('data', chunk => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      if (bodyText) {
        try {
          req.body = JSON.parse(bodyText);
        } catch {
          req.body = bodyText;
        }
      } else {
        req.body = {};
      }

      await handler(req, res);
    });
    return;
  }

  // Phục vụ file tĩnh từ thư mục public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Ngăn chặn Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback về index.html nếu không tìm thấy file
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.status(500).end('Internal Server Error');
        return;
      }
      res.setHeader('Content-Type', contentType);
      res.status(200).end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` 🚀 ViettelPost Webhook Mock Simulator`);
  console.log(` 🌐 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(` ⚡ Vercel API Endpoint : http://localhost:${PORT}/api/send-webhook`);
  console.log(`==================================================\n`);
});
