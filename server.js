/* =========================================================
   LUIOFFICE — dynamic server (Express + SQLite)
   PORT 9002 / HOST 127.0.0.1  (Caddy reverse_proxy 앞단)
   ========================================================= */
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 9002;
const HOST = process.env.HOST || '127.0.0.1';

app.set('trust proxy', 1); // Caddy 뒤
app.use(express.json());
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'data') }),
  secret: process.env.SESSION_SECRET || 'luioffice-demo-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 14 }
}));

/* ---------- helpers ---------- */
const q = {
  productById: db.prepare('SELECT * FROM products WHERE id=?'),
  allProducts: db.prepare('SELECT * FROM products ORDER BY sort'),
  userByEmail: db.prepare('SELECT * FROM users WHERE email=?'),
  userById: db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?'),
  insUser: db.prepare('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)')
};
const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, role: u.role });
const requireAuth = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: '로그인이 필요합니다.' });
const requireAdmin = (req, res, next) => {
  const u = req.session.userId && q.userById.get(req.session.userId);
  if (!u || u.role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  next();
};
function cart(req) { if (!req.session.cart) req.session.cart = []; return req.session.cart; }
function cartDetailed(req) {
  const items = cart(req).map(i => { const p = q.productById.get(i.productId); return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null; }).filter(Boolean);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = subtotal >= 5000000 || subtotal === 0 ? 0 : 50000;
  return { items, subtotal, shipping, total: subtotal + shipping, count: items.reduce((s, i) => s + i.qty, 0) };
}

/* =========================================================
   AUTH
   ========================================================= */
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !password || password.length < 6)
    return res.status(400).json({ error: '입력값을 확인해 주세요. (비밀번호 6자 이상)' });
  if (q.userByEmail.get(email.toLowerCase())) return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
  const info = q.insUser.run(name.trim(), email.toLowerCase(), bcrypt.hashSync(password, 10), 'customer', Date.now());
  req.session.userId = info.lastInsertRowid;
  res.json({ user: publicUser(q.userById.get(info.lastInsertRowid)) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = q.userByEmail.get((email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(password || '', u.password_hash))
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  req.session.userId = u.id;
  res.json({ user: publicUser(u) });
});

app.post('/api/auth/logout', (req, res) => { req.session.destroy(() => res.json({ ok: true })); });

app.get('/api/auth/me', (req, res) => {
  const u = req.session.userId && q.userById.get(req.session.userId);
  res.json({ user: u ? publicUser(u) : null });
});

/* =========================================================
   PRODUCTS
   ========================================================= */
app.get('/api/products', (req, res) => {
  let list = q.allProducts.all();
  const { cat, sub, brand, q: query, sort } = req.query;
  if (cat && cat !== 'all') list = list.filter(p => p.cat === cat);
  if (sub) list = list.filter(p => p.sub === sub);
  if (brand) list = list.filter(p => p.brand === brand);
  if (query) { const s = query.toLowerCase(); list = list.filter(p => (p.brand + ' ' + p.name + ' ' + p.sub).toLowerCase().includes(s)); }
  if (sort === 'low') list.sort((a, b) => a.price - b.price);
  else if (sort === 'high') list.sort((a, b) => b.price - a.price);
  else if (sort === 'new') list.sort((a, b) => (b.tag === 'NEW') - (a.tag === 'NEW'));
  res.json({ products: list });
});

app.get('/api/products/:id', (req, res) => {
  const p = q.productById.get(req.params.id);
  if (!p) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
  res.json({ product: p });
});

/* =========================================================
   CART  (session 기반, 게스트 가능)
   ========================================================= */
app.get('/api/cart', (req, res) => res.json(cartDetailed(req)));

app.post('/api/cart', (req, res) => {
  const { productId, qty } = req.body || {};
  if (!q.productById.get(productId)) return res.status(404).json({ error: '상품 없음' });
  const c = cart(req); const row = c.find(i => i.productId === productId);
  if (row) row.qty += (qty || 1); else c.push({ productId, qty: qty || 1 });
  req.session.cart = c; res.json(cartDetailed(req));
});

app.patch('/api/cart/:id', (req, res) => {
  const c = cart(req); const row = c.find(i => i.productId === req.params.id);
  if (row) row.qty = Math.max(1, parseInt(req.body.qty, 10) || 1);
  req.session.cart = c; res.json(cartDetailed(req));
});

app.delete('/api/cart/:id', (req, res) => {
  req.session.cart = cart(req).filter(i => i.productId !== req.params.id);
  res.json(cartDetailed(req));
});

app.delete('/api/cart', (req, res) => { req.session.cart = []; res.json(cartDetailed(req)); });

/* =========================================================
   WISHLIST  (로그인 필요)
   ========================================================= */
app.get('/api/wishlist', requireAuth, (req, res) => {
  const ids = db.prepare('SELECT product_id FROM wishlist WHERE user_id=? ORDER BY created_at DESC').all(req.session.userId).map(r => r.product_id);
  res.json({ ids, products: ids.map(id => q.productById.get(id)).filter(Boolean) });
});

app.post('/api/wishlist/:id', requireAuth, (req, res) => {
  if (!q.productById.get(req.params.id)) return res.status(404).json({ error: '상품 없음' });
  const exists = db.prepare('SELECT 1 FROM wishlist WHERE user_id=? AND product_id=?').get(req.session.userId, req.params.id);
  if (exists) { db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(req.session.userId, req.params.id); return res.json({ wished: false }); }
  db.prepare('INSERT INTO wishlist (user_id,product_id,created_at) VALUES (?,?,?)').run(req.session.userId, req.params.id, Date.now());
  res.json({ wished: true });
});

/* =========================================================
   ORDERS
   ========================================================= */
function makeOrderNo() {
  return 'LO' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(1000 + Math.random() * 9000);
}

app.post('/api/orders', (req, res) => {
  const { name, phone, email, address, memo } = req.body || {};
  if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email || '') || !address)
    return res.status(400).json({ error: '주문 정보를 확인해 주세요.' });
  const detail = cartDetailed(req);
  if (!detail.items.length) return res.status(400).json({ error: '장바구니가 비어 있습니다.' });

  const no = makeOrderNo();
  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO orders (order_no,user_id,buyer_name,buyer_phone,buyer_email,address,memo,subtotal,shipping,total,status,created_at)
                             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(no, req.session.userId || null, name, phone, email, address, memo || '', detail.subtotal, detail.shipping, detail.total, '결제대기', Date.now());
    const insI = db.prepare('INSERT INTO order_items (order_id,product_id,brand,name,price,qty) VALUES (?,?,?,?,?,?)');
    detail.items.forEach(i => insI.run(info.lastInsertRowid, i.id, i.brand, i.name, i.price, i.qty));
    return info.lastInsertRowid;
  });
  tx();
  req.session.cart = [];
  res.json({ orderNo: no });
});

function orderWithItems(row) {
  row.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(row.id);
  return row;
}

app.get('/api/orders', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.session.userId);
  res.json({ orders: rows.map(orderWithItems) });
});

app.get('/api/orders/:no', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE order_no=?').get(req.params.no);
  if (!row) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  // 본인 또는 관리자만 상세 열람 (게스트 주문은 주문번호로 열람 허용)
  const u = req.session.userId && q.userById.get(req.session.userId);
  if (row.user_id && row.user_id !== req.session.userId && !(u && u.role === 'admin'))
    return res.status(403).json({ error: '권한이 없습니다.' });
  res.json({ order: orderWithItems(row) });
});

/* =========================================================
   ADMIN
   ========================================================= */
const STATUSES = ['결제대기', '결제완료', '배송준비', '배송중', '배송완료', '취소'];

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status NOT IN ('취소','결제대기')").get().s;
  const pending = db.prepare("SELECT COUNT(*) c FROM orders WHERE status='결제대기'").get().c;
  const customers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='customer'").get().c;
  const byStatus = {};
  STATUSES.forEach(s => byStatus[s] = db.prepare('SELECT COUNT(*) c FROM orders WHERE status=?').get(s).c);
  res.json({ totalOrders, revenue, pending, customers, byStatus, statuses: STATUSES });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { status, q: query } = req.query;
  let rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  if (status && status !== 'all') rows = rows.filter(r => r.status === status);
  if (query) { const s = query.toLowerCase(); rows = rows.filter(r => (r.order_no + ' ' + r.buyer_name + ' ' + r.buyer_email + ' ' + r.buyer_phone).toLowerCase().includes(s)); }
  res.json({ orders: rows.map(orderWithItems), statuses: STATUSES });
});

app.patch('/api/admin/orders/:no', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: '유효하지 않은 상태값' });
  const info = db.prepare('UPDATE orders SET status=? WHERE order_no=?').run(status, req.params.no);
  if (!info.changes) return res.status(404).json({ error: '주문 없음' });
  res.json({ ok: true });
});

app.delete('/api/admin/orders/:no', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM orders WHERE order_no=?').run(req.params.no);
  res.json({ ok: true });
});

/* =========================================================
   PAGES (clean URLs, no .html) + STATIC ASSETS
   ========================================================= */
const PUB = path.join(__dirname, 'public');
app.use('/assets', express.static(path.join(PUB, 'assets'), { maxAge: '1h' }));

const PAGES = ['shop', 'product', 'cart', 'checkout', 'complete', 'account', 'admin'];
app.get('/', (req, res) => res.sendFile(path.join(PUB, 'index.html')));
PAGES.forEach(name => {
  app.get('/' + name, (req, res) => res.sendFile(path.join(PUB, name, 'index.html')));
});

// 기존 *.html 링크(북마크 등) → 깨끗한 경로로 301 리다이렉트, 쿼리스트링 보존
app.get(/^\/(index|shop|product|cart|checkout|complete|account|admin)\.html$/, (req, res) => {
  const page = req.params[0];
  const clean = page === 'index' ? '/' : '/' + page;
  const qs = req.url.split('?')[1];
  res.redirect(301, clean + (qs ? '?' + qs : ''));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
  res.status(404).sendFile(path.join(PUB, 'index.html'));
});

app.listen(PORT, HOST, () => console.log(`LUIOFFICE → http://${HOST}:${PORT}`));
