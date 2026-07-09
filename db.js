/* =========================================================
   LUIOFFICE — SQLite (better-sqlite3)
   스키마 생성 + 최초 시드(상품 / 관리자 / 테스트 주문)
   ========================================================= */
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'luxury.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ---------- schema ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  cat TEXT NOT NULL,
  sub TEXT NOT NULL,
  glyph TEXT NOT NULL,
  pal TEXT NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  tag TEXT,
  img TEXT,
  stock INTEGER NOT NULL DEFAULT 5,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT '결제대기',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
`);

/* ---------- migrations (기존 DB 보존하며 컬럼 추가) ---------- */
function ensureColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
ensureColumn('orders', 'payment_method', 'TEXT');   // 결제방법
ensureColumn('order_items', 'img', 'TEXT');         // 상품이미지(스냅샷)
ensureColumn('order_items', 'glyph', 'TEXT');
ensureColumn('order_items', 'pal', 'TEXT');

/* ---------- seed data ---------- */
// img: 로열티 프리(Unsplash 라이선스) 실사진 URL — 브랜드 소유 이미지가 아닌
// 동일 카테고리의 자유 이용 사진. 로드 실패 시 자동으로 SVG 아트로 폴백.
const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const PRODUCTS = [
  ['f1','fashion','핸드백','bag','camel','Hermès','Birkin 30 Togo',24500000,'ICONIC', U('1584917865442-de89df76afd3')],
  ['f2','fashion','핸드백','bag','ink','Chanel','Classic Flap Medium',13800000,'BEST', U('1591561954557-26941169b49e')],
  ['f3','fashion','핸드백','bag','sand','Louis Vuitton','Neverfull MM',2900000,null, U('1548036328-c9fa89d128fa')],
  ['f4','fashion','핸드백','bag','wine','Gucci','GG Marmont Small',3250000,null, U('1594223274512-ad4803739b7c')],
  ['f5','fashion','핸드백','bag','forest','Bottega Veneta','Cassette Intrecciato',5600000,'NEW', U('1566150905458-1bf1fc113f0d')],
  ['f6','fashion','핸드백','bag','rose','Saint Laurent','Loulou Medium',3980000,null, U('1590874103328-eac38a683ce7')],
  ['f7','fashion','아우터','coat','camel','Burberry','Kensington Trench Coat',3190000,'ICONIC', U('1591047139829-d91aecb6caea')],
  ['f8','fashion','니트','knit','sand','Brunello Cucinelli','Cashmere Ribbed Sweater',2450000,null, U('1576871337622-98d48d1cf531')],
  ['f9','fashion','슈즈','shoe','olive','Loro Piana','Summer Walk Loafers',1850000,'NEW', U('1533867617858-e7b97e060509')],
  ['f10','fashion','아이웨어','sunglass','slate','Cartier','Panthère Sunglasses',1290000,null, U('1572635196237-14b3f281503f')],
  ['h1','home','라운지체어','lounge','wine','Herman Miller','Eames Lounge Chair & Ottoman',11900000,'ICONIC', U('1567538096630-e0c55bd6374c')],
  ['h2','home','소파','sofa','sand','B&B Italia','Camaleonda Modular Sofa',18500000,'BEST', U('1555041469-a586c61ea9bc')],
  ['h3','home','라운지체어','lounge','olive','Fritz Hansen','Egg Chair by A. Jacobsen',16200000,null, U('1567016432779-094069958ea5')],
  ['h4','home','라운지체어','lounge','ink','Knoll','Barcelona Chair',9400000,'ICONIC', U('1506439773649-6e0eb8cfb237')],
  ['h5','home','체어','lounge','sky','Vitra','Panton Chair',490000,null, U('1503602642458-232111445657')],
  ['h6','home','다이닝체어','lounge','camel','Carl Hansen & Søn','CH24 Wishbone Chair',890000,'NEW', U('1580480055273-228ff5388ef8')],
  ['h7','home','라운지','lounge','slate','Cassina','LC4 Chaise Longue',7800000,null, U('1519947486511-46149fa0a254')],
  ['h8','home','조명','lamp','gold','FLOS','Arco Floor Lamp',4300000,'ICONIC', U('1507473885765-e6ed057f782c')],
  ['h9','home','수납','cabinet','forest','USM','Haller Sideboard',5700000,null, U('1595428774223-ef52624120d2')],
  ['h10','home','소파','sofa','wine','Poltrona Frau','Chester One Sofa',21000000,'BEST', U('1550226891-ef816aed4a98')]
];

function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  if (count > 0) return;
  const ins = db.prepare(`INSERT INTO products (id,cat,sub,glyph,pal,brand,name,price,tag,img,stock,sort)
                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  PRODUCTS.forEach((p, i) => ins.run(...p, 3 + (i % 5), i));
  console.log(`[seed] products: ${PRODUCTS.length}`);
}

function seedAdmin() {
  const admin = db.prepare('SELECT id FROM users WHERE email=?').get('admin@luioffice.co.kr');
  if (!admin) {
    db.prepare('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)')
      .run('루이오피스 관리자', 'admin@luioffice.co.kr', bcrypt.hashSync('admin1234', 10), 'admin', Date.now());
    console.log('[seed] admin: admin@luioffice.co.kr / admin1234');
  }
  // 데모 고객 계정
  const demo = db.prepare('SELECT id FROM users WHERE email=?').get('demo@luioffice.co.kr');
  if (!demo) {
    db.prepare('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)')
      .run('김루이', 'demo@luioffice.co.kr', bcrypt.hashSync('demo1234', 10), 'customer', Date.now());
    console.log('[seed] demo customer: demo@luioffice.co.kr / demo1234');
  }
}

const FAKE = [
  { name:'박서연', phone:'010-2841-5573', email:'seoyeon.p@gmail.com',  addr:'서울 강남구 도산대로 45길 12, 302호', items:[['f2',1],['f9',1]], status:'배송완료', pay:'신용카드',       daysAgo:14 },
  { name:'정민준', phone:'010-9932-1180', email:'minjun.j@naver.com',   addr:'서울 용산구 이태원로 210, 1704호',   items:[['h1',1]],           status:'배송중',   pay:'무통장입금',     daysAgo:9 },
  { name:'이하은', phone:'010-4471-6624', email:'haeun.lee@daum.net',   addr:'경기 성남시 분당구 판교역로 235',     items:[['h8',1],['h5',2]],   status:'배송준비', pay:'실시간 계좌이체', daysAgo:6 },
  { name:'최도윤', phone:'010-7756-9901', email:'doyoon.c@gmail.com',   addr:'서울 서초구 반포대로 275, 2201호',    items:[['f1',1]],           status:'결제완료', pay:'신용카드',       daysAgo:4 },
  { name:'윤지우', phone:'010-3390-4412', email:'jiwoo.y@kakao.com',    addr:'부산 해운대구 마린시티2로 33',         items:[['h2',1]],           status:'결제완료', pay:'카카오페이',     daysAgo:3 },
  { name:'강서준', phone:'010-6612-7708', email:'seojun.k@gmail.com',   addr:'서울 마포구 월드컵북로 400, 805호',   items:[['f5',1],['f10',1]],  status:'결제대기', pay:'무통장입금',     daysAgo:1 },
  { name:'임채원', phone:'010-2205-8834', email:'chaewon.im@naver.com', addr:'인천 연수구 송도과학로 32',            items:[['h4',1],['h6',2]],   status:'결제대기', pay:'가상계좌',       daysAgo:0 },
  { name:'한소율', phone:'010-8817-3345', email:'soyul.han@gmail.com',  addr:'서울 송파구 올림픽로 300, 3410호',    items:[['f7',1]],           status:'취소',     pay:'신용카드',       daysAgo:11 }
];

function seedOrders() {
  const count = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  if (count > 0) return;
  const getP = db.prepare('SELECT * FROM products WHERE id=?');
  const insO = db.prepare(`INSERT INTO orders (order_no,user_id,buyer_name,buyer_phone,buyer_email,address,memo,subtotal,shipping,total,status,payment_method,created_at)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insI = db.prepare(`INSERT INTO order_items (order_id,product_id,brand,name,price,qty,img,glyph,pal) VALUES (?,?,?,?,?,?,?,?,?)`);
  let seq = 1000;
  FAKE.forEach(o => {
    const ts = Date.now() - o.daysAgo * 86400000 - Math.floor(Math.random() * 36000000);
    const no = 'LO' + new Date(ts).toISOString().slice(0,10).replace(/-/g,'') + String(seq++);
    let subtotal = 0;
    const lines = o.items.map(([pid, qty]) => { const p = getP.get(pid); subtotal += p.price * qty; return [p, qty]; });
    const shipping = subtotal >= 5000000 ? 0 : 50000;
    const info = insO.run(no, null, o.name, o.phone, o.email, o.addr, '', subtotal, shipping, subtotal + shipping, o.status, o.pay, ts);
    lines.forEach(([p, qty]) => insI.run(info.lastInsertRowid, p.id, p.brand, p.name, p.price, qty, p.img, p.glyph, p.pal));
  });
  console.log(`[seed] test orders: ${FAKE.length}`);
}

function seed() { seedProducts(); seedAdmin(); seedOrders(); }
seed();

module.exports = db;

if (require.main === module && process.argv.includes('--seed')) {
  console.log('[db] seed complete.');
}
