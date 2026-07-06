/* =========================================================
   상품 이미지 다운로더 (VPS에서 1회 실행)
   서버가 인터넷이 되는 환경(예: VPS)에서:
     node scripts/fetch-images.js
   product 테이블의 img(원격 URL)를 public/assets/img/products/<id>.jpg
   로 내려받아 자기 호스팅합니다. 이후엔 원격 없이도 사진이 뜹니다.

   ※ 다른 사진으로 바꾸려면 같은 경로에 <id>.jpg 를 덮어쓰면 됩니다.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const https = require('https');
const db = require('../db');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'img', 'products');
fs.mkdirSync(OUT, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 LUIOFFICE' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); return reject(new Error('HTTP ' + res.statusCode)); }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { file.close(); fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  const rows = db.prepare('SELECT id, brand, name, img FROM products WHERE img IS NOT NULL').all();
  let ok = 0, fail = 0;
  for (const p of rows) {
    const dest = path.join(OUT, p.id + '.jpg');
    process.stdout.write(`· ${p.id.padEnd(4)} ${p.brand} ${p.name} … `);
    try { await download(p.img, dest); console.log('OK'); ok++; }
    catch (e) { console.log('실패:', e.message, '(SVG 폴백 사용됨)'); fail++; }
  }
  console.log(`\n완료: ${ok} 성공 / ${fail} 실패 → ${OUT}`);
  console.log('실패한 항목은 사이트에서 SVG 아트로 자동 대체됩니다.');
  process.exit(0);
})();
