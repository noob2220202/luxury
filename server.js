/* =========================================================
   LUIOFFICE — 정적 파일 서버 (의존성 0, Node 내장 모듈만)
   pm2 로 실행합니다.  기본 포트 9002, 기본 바인드 127.0.0.1
   (Caddy 가 reverse_proxy 로 앞단에서 받는 구조)

   환경변수로 조정 가능:
     PORT=9002   HOST=127.0.0.1
   ========================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 9002;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;

const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.woff':'font/woff',
  '.txt':'text/plain; charset=utf-8'
};

function safeJoin(root, target){
  const p = path.normalize(path.join(root, target));
  return p.startsWith(root) ? p : null;   // 디렉터리 탈출 방지
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

    let file = safeJoin(ROOT, urlPath);
    if (!file) { res.writeHead(400); return res.end('Bad Request'); }

    // 확장자 없이 들어오면 .html 매핑 (예: /shop → /shop.html)
    if (!fs.existsSync(file) && !path.extname(file) && fs.existsSync(file + '.html')) {
      file = file + '.html';
    }
    // 디렉터리면 index.html
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }

    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1 style="font-family:sans-serif">404</h1><p>페이지를 찾을 수 없습니다. <a href="/">홈으로</a></p>');
    }

    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end('Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LUIOFFICE static server → http://${HOST}:${PORT}`);
});
