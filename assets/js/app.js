/* =========================================================
   LUIOFFICE — client-side app (demo)
   Everything runs in the browser on localStorage.
   No backend, no payment — checkout stops before payment.
   ========================================================= */
(function(){
'use strict';

/* ---------- storage ---------- */
const KEY = {users:'luio_users', session:'luio_session', cart:'luio_cart', wish:'luio_wish', orders:'luio_orders', promo:'luio_promo_hide'};
const load = (k, def) => { try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch(e){ return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- icons ---------- */
const I = {
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-6 7-6s7 2 7 6"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.5-9.2-9C1 7.5 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.2C10.6 5.7 11.8 4.5 13.8 4.5 17 4.5 19 7.5 21.2 11 19 15.5 12 20 12 20z"/></svg>',
  heartF:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.2-9C1 7.5 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.2C10.6 5.7 11.8 4.5 13.8 4.5 17 4.5 19 7.5 21.2 11 19 15.5 12 20 12 20z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

/* ---------- auth ---------- */
const Auth = {
  current(){ return load(KEY.session, null); },
  signup(name, email, pw){
    const users = load(KEY.users, {});
    email = email.trim().toLowerCase();
    if(users[email]) throw new Error('이미 가입된 이메일입니다.');
    users[email] = { name:name.trim(), email, pw, joined:Date.now() };
    save(KEY.users, users);
    save(KEY.session, { name:users[email].name, email });
    return users[email];
  },
  login(email, pw){
    const users = load(KEY.users, {});
    email = email.trim().toLowerCase();
    const u = users[email];
    if(!u || u.pw !== pw) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    save(KEY.session, { name:u.name, email });
    return u;
  },
  logout(){ localStorage.removeItem(KEY.session); }
};

/* ---------- cart ---------- */
const Cart = {
  all(){ return load(KEY.cart, []); },
  count(){ return Cart.all().reduce((s,i)=>s+i.qty,0); },
  total(){ return Cart.all().reduce((s,i)=>{ const p=byId(i.id); return s + (p?p.price:0)*i.qty; },0); },
  add(id, qty=1){
    const c = Cart.all(); const row = c.find(i=>i.id===id);
    if(row) row.qty += qty; else c.push({id, qty});
    save(KEY.cart, c); sync();
  },
  setQty(id, qty){
    let c = Cart.all(); const row = c.find(i=>i.id===id);
    if(row){ row.qty = Math.max(1, qty); } save(KEY.cart, c); sync();
  },
  remove(id){ save(KEY.cart, Cart.all().filter(i=>i.id!==id)); sync(); },
  clear(){ save(KEY.cart, []); sync(); }
};

/* ---------- wishlist ---------- */
const Wish = {
  all(){ return load(KEY.wish, []); },
  has(id){ return Wish.all().includes(id); },
  toggle(id){
    let w = Wish.all();
    if(w.includes(id)){ w = w.filter(x=>x!==id); } else { w.push(id); }
    save(KEY.wish, w); sync(); return w.includes(id);
  }
};

/* ---------- orders ---------- */
const Orders = {
  all(){ return load(KEY.orders, []); },
  place(info){
    const items = Cart.all().map(i=>({id:i.id, qty:i.qty}));
    const order = {
      no:'LO' + Date.now().toString().slice(-9),
      date:Date.now(), items, total:Cart.total(), buyer:info, status:'결제 대기'
    };
    const list = Orders.all(); list.unshift(order); save(KEY.orders, list);
    Cart.clear(); return order;
  }
};

/* byId() and makeDesc() are defined globally in products.js */

/* =========================================================
   Chrome injection
   ========================================================= */
const NAV = [
  {t:'신상품', h:'shop.html?sort=new'},
  {t:'패션', h:'shop.html?cat=fashion'},
  {t:'가구·리빙', h:'shop.html?cat=home'},
  {t:'브랜드', h:'shop.html'},
  {t:'컬렉션', h:'index.html#editorial'},
  {t:'스토어', h:'index.html#service'}
];

function buildHeader(){
  const nav = NAV.map(n=>`<a href="${n.h}">${n.t}</a>`).join('');
  const half = Math.ceil(NAV.length/2);
  const left = NAV.slice(0,half).map(n=>`<a href="${n.h}">${n.t}</a>`).join('');
  const right = NAV.slice(half).map(n=>`<a href="${n.h}">${n.t}</a>`).join('');
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="announce">전 상품 정품 보증 · 5백만원 이상 <b>무료 컨시어지 배송</b> · 신규 가입 시 <b>5% 웰컴 쿠폰</b></div>
  <header class="site-header">
    <div class="header-inner">
      <nav class="nav left">${left}
        <button class="icon-btn menu-toggle" data-menu aria-label="menu">${I.menu}</button>
      </nav>
      <a class="brand" href="index.html">LUIOFFICE<small>MAISON DE LUXE</small></a>
      <nav class="nav right">
        <span class="desk">${right}</span>
        <button class="icon-btn" data-search aria-label="search">${I.search}</button>
        <button class="icon-btn" data-account aria-label="account"><span data-authlabel>로그인</span></button>
        <button class="icon-btn" data-cart aria-label="cart">${I.bag}<span class="cart-count" data-cartcount>0</span></button>
      </nav>
    </div>
  </header>`;
  document.body.prepend(el);
}

function buildChrome(){
  const el = document.createElement('div');
  el.innerHTML = `
  <!-- mobile menu -->
  <div class="m-menu" data-mmenu>
    <button class="m-close" data-mclose>&times;</button>
    ${NAV.map(n=>`<a href="${n.h}">${n.t}</a>`).join('')}
    <a href="account.html" data-account-link>마이 부티크</a>
  </div>

  <!-- cart drawer -->
  <div class="drawer-overlay" data-drawerov></div>
  <aside class="drawer" data-drawer aria-label="cart">
    <div class="drawer-head"><h3>쇼핑백</h3><button data-drawerclose>&times;</button></div>
    <div class="drawer-items" data-draweritems></div>
    <div class="drawer-foot" data-drawerfoot></div>
  </aside>

  <!-- auth modal -->
  <div class="modal-overlay" data-authmodal>
    <div class="modal">
      <div class="modal-head">
        <button class="m-x" data-authclose>&times;</button>
        <h3 data-auth-title>로그인</h3>
        <p data-auth-sub>루이오피스 회원 전용 컨시어지</p>
      </div>
      <div class="modal-body" data-authbody></div>
    </div>
  </div>

  <!-- search modal -->
  <div class="modal-overlay" data-searchmodal>
    <div class="modal">
      <div class="modal-head"><button class="m-x" data-searchclose>&times;</button><h3>검색</h3></div>
      <div class="modal-body">
        <form class="searchbar" data-searchform>
          <input type="text" name="q" placeholder="브랜드, 상품명 검색 (예: Hermès, 소파)" autocomplete="off">
          <button class="btn green sm" type="submit">검색</button>
        </form>
        <p class="muted" style="font-size:.8rem">추천: Hermès · Chanel · Eames · B&B Italia · FLOS</p>
      </div>
    </div>
  </div>

  <!-- toast -->
  <div class="toast" data-toast></div>

  <!-- bottom nav -->
  <nav class="bottom-nav">
    <a href="index.html" data-bn="home">${I.home}<span>홈</span></a>
    <a href="#" data-search>${I.search}<span>검색</span></a>
    <a href="account.html?tab=wish" data-bn="wish">${I.heart}<span>찜</span></a>
    <a href="#" data-cart class="bn-badge">${I.bag}<b data-cartcount>0</b><span>쇼핑백</span></a>
    <a href="account.html" data-bn="my">${I.user}<span>마이</span></a>
  </nav>`;
  document.body.append(el);
}

function buildFooter(){
  const el = document.createElement('footer');
  el.className = 'site-footer';
  el.innerHTML = `
  <div class="wrap">
    <div class="footer-top">
      <div>
        <div class="fbrand">LUIOFFICE</div>
        <p style="margin-top:14px;max-width:34ch;color:#a99e86">명품 패션과 디자인 가구를 한 곳에서. 루이오피스는 정품 검수를 마친 큐레이션만을 제안합니다.</p>
      </div>
      <div>
        <h5>Shop</h5>
        <ul>
          <li><a href="shop.html?cat=fashion">명품 패션</a></li>
          <li><a href="shop.html?cat=home">디자인 가구</a></li>
          <li><a href="shop.html?sort=new">신상품</a></li>
          <li><a href="shop.html">전체보기</a></li>
        </ul>
      </div>
      <div>
        <h5>Service</h5>
        <ul>
          <li><a href="index.html#service">컨시어지 배송</a></li>
          <li><a href="index.html#service">정품 감정</a></li>
          <li><a href="index.html#service">케어 서비스</a></li>
          <li><a href="account.html">마이 부티크</a></li>
        </ul>
      </div>
      <div>
        <h5>Contact</h5>
        <ul>
          <li>평일 10:00 – 18:00</li>
          <li><a href="mailto:care@luioffice.co.kr">care@luioffice.co.kr</a></li>
          <li>02-000-0000</li>
        </ul>
      </div>
    </div>
    <div class="biz">
      <b>주식회사 루이오피스</b> (LUIOFFICE Inc.) &nbsp;|&nbsp; 대표 유성복<br>
      사업자등록번호 331-86-03448 &nbsp;|&nbsp; 법인등록번호 110111-0918004 &nbsp;|&nbsp; 통신판매업신고 제2025-서울강남-0000호<br>
      주소 서울특별시 강남구 삼성로85길 33, 비04-씨48호(대치동) &nbsp;|&nbsp; 업태 도소매업 / 종목 전자상거래(생활용품 및 패션잡화)
    </div>
    <div class="footer-bottom">
      <span>© 2026 LUIOFFICE Inc. All rights reserved.</span>
      <span>이용약관 · 개인정보처리방침 · 이 사이트는 데모용으로 실제 결제가 이루어지지 않습니다.</span>
    </div>
  </div>`;
  document.body.append(el);
}

/* =========================================================
   Interactions
   ========================================================= */
let authMode = 'login';

function q(sel, root=document){ return root.querySelector(sel); }
function qa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function toast(msg){
  const t = q('[data-toast]'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), 2200);
}

function openAuth(mode){ authMode = mode||'login'; renderAuth(); q('[data-authmodal]').classList.add('open'); }
function closeAuth(){ q('[data-authmodal]').classList.remove('open'); }

function renderAuth(){
  const body = q('[data-authbody]');
  q('[data-auth-title]').textContent = authMode==='login' ? '로그인' : '회원가입';
  q('[data-auth-sub]').textContent = authMode==='login' ? '루이오피스 회원 전용 컨시어지' : '가입 즉시 5% 웰컴 쿠폰 증정';
  if(authMode==='login'){
    body.innerHTML = `
      <form data-loginform novalidate>
        <div class="field"><label>이메일</label><input type="email" name="email" placeholder="you@example.com" required><div class="err">이메일을 확인해 주세요.</div></div>
        <div class="field"><label>비밀번호</label><input type="password" name="pw" placeholder="••••••••" required><div class="err">비밀번호를 입력해 주세요.</div></div>
        <button class="btn green block" type="submit">로그인</button>
      </form>
      <div class="switch">아직 회원이 아니신가요? <a data-goto="signup">회원가입</a></div>`;
    q('[data-loginform]').addEventListener('submit', onLogin);
  } else {
    body.innerHTML = `
      <form data-signupform novalidate>
        <div class="field"><label>이름</label><input name="name" placeholder="홍길동" required><div class="err">이름을 입력해 주세요.</div></div>
        <div class="field"><label>이메일</label><input type="email" name="email" placeholder="you@example.com" required><div class="err">올바른 이메일을 입력해 주세요.</div></div>
        <div class="field"><label>비밀번호</label><input type="password" name="pw" placeholder="6자 이상" required><div class="err">비밀번호는 6자 이상이어야 합니다.</div></div>
        <label class="check-row"><input type="checkbox" required> <span>이용약관 및 개인정보 처리방침에 동의합니다. (필수)</span></label>
        <button class="btn green block" type="submit">회원가입</button>
      </form>
      <div class="switch">이미 계정이 있으신가요? <a data-goto="login">로그인</a></div>`;
    q('[data-signupform]').addEventListener('submit', onSignup);
  }
  qa('[data-goto]', body.parentElement).forEach(a=>a.addEventListener('click', ()=>openAuth(a.dataset.goto)));
}

function markErr(input, on){ input.closest('.field').classList.toggle('invalid', on); }

function onLogin(e){
  e.preventDefault();
  const f = e.target, email=f.email.value, pw=f.pw.value;
  markErr(f.email, !/^\S+@\S+\.\S+$/.test(email));
  markErr(f.pw, !pw);
  if(!/^\S+@\S+\.\S+$/.test(email) || !pw) return;
  try{ const u = Auth.login(email, pw); closeAuth(); sync(); toast(`${u.name}님, 다시 오신 것을 환영합니다.`); }
  catch(err){ f.pw.closest('.field').classList.add('invalid'); f.pw.closest('.field').querySelector('.err').textContent = err.message; }
}

function onSignup(e){
  e.preventDefault();
  const f = e.target, name=f.name.value.trim(), email=f.email.value, pw=f.pw.value;
  markErr(f.name, !name); markErr(f.email, !/^\S+@\S+\.\S+$/.test(email)); markErr(f.pw, pw.length<6);
  if(!name || !/^\S+@\S+\.\S+$/.test(email) || pw.length<6) return;
  try{ const u = Auth.signup(name, email, pw); closeAuth(); sync(); toast(`${u.name}님, 루이오피스에 오신 것을 환영합니다.`); }
  catch(err){ f.email.closest('.field').classList.add('invalid'); f.email.closest('.field').querySelector('.err').textContent = err.message; }
}

/* cart drawer */
function openDrawer(){ renderDrawer(); q('[data-drawer]').classList.add('open'); q('[data-drawerov]').classList.add('open'); }
function closeDrawer(){ q('[data-drawer]').classList.remove('open'); q('[data-drawerov]').classList.remove('open'); }

function renderDrawer(){
  const items = Cart.all();
  const box = q('[data-draweritems]'), foot = q('[data-drawerfoot]');
  if(!items.length){
    box.innerHTML = `<div class="drawer-empty"><p>쇼핑백이 비어 있습니다.</p><a class="btn ghost sm" href="shop.html" style="margin-top:16px">쇼핑 계속하기</a></div>`;
    foot.innerHTML = ''; return;
  }
  box.innerHTML = items.map(i=>{ const p=byId(i.id); if(!p) return '';
    return `<div class="d-item">
      <div class="d-thumb">${window.renderArt(p,64,80)}</div>
      <div>
        <div class="d-brand">${p.brand}</div>
        <div class="d-name">${p.name}</div>
        <div class="d-price">${window.won(p.price)} · 수량 ${i.qty}</div>
        <button class="d-remove" data-drem="${p.id}">삭제</button>
      </div>
      <div style="text-align:right;font-size:.9rem">${window.won(p.price*i.qty)}</div>
    </div>`; }).join('');
  foot.innerHTML = `
    <div class="row"><span>합계</span><b>${window.won(Cart.total())}</b></div>
    <a class="btn green block" href="cart.html">쇼핑백 보기 · 주문하기</a>`;
  qa('[data-drem]', box).forEach(b=>b.addEventListener('click', ()=>{ Cart.remove(b.dataset.drem); renderDrawer(); toast('삭제되었습니다.'); }));
}

/* search */
function openSearch(){ q('[data-searchmodal]').classList.add('open'); setTimeout(()=>q('[data-searchform] input')?.focus(),120); }
function closeSearch(){ q('[data-searchmodal]').classList.remove('open'); }

/* promo popup */
function maybePromo(){
  if(!q('[data-promo]')) return;
  const hideUntil = load(KEY.promo, 0);
  if(Date.now() < hideUntil){ q('[data-promo]').remove(); return; }
  setTimeout(()=>q('[data-promo]')?.classList.add('open'), 700);
}

/* =========================================================
   sync UI to state
   ========================================================= */
function sync(){
  const n = Cart.count();
  qa('[data-cartcount]').forEach(e=>{ e.textContent = n; e.style.visibility = n? 'visible':'hidden'; });
  const u = Auth.current();
  qa('[data-authlabel]').forEach(e=> e.textContent = u ? u.name : '로그인');
  document.dispatchEvent(new CustomEvent('luio:sync'));
}

/* =========================================================
   wire global events (delegation)
   ========================================================= */
function wire(){
  document.body.addEventListener('click', e=>{
    const t = e.target.closest('[data-cart],[data-account],[data-search],[data-menu],[data-mclose],[data-drawerclose],[data-drawerov],[data-authclose],[data-searchclose],[data-account-link]');
    if(!t) return;
    if(t.matches('[data-cart]')){ e.preventDefault(); openDrawer(); }
    else if(t.matches('[data-search]')){ e.preventDefault(); openSearch(); }
    else if(t.matches('[data-menu]')){ q('[data-mmenu]').classList.add('open'); }
    else if(t.matches('[data-mclose]')){ q('[data-mmenu]').classList.remove('open'); }
    else if(t.matches('[data-drawerclose],[data-drawerov]')){ closeDrawer(); }
    else if(t.matches('[data-authclose]')){ closeAuth(); }
    else if(t.matches('[data-searchclose]')){ closeSearch(); }
    else if(t.matches('[data-account]') || t.matches('[data-account-link]')){
      e.preventDefault();
      if(Auth.current()) location.href='account.html'; else openAuth('login');
    }
  });
  q('[data-searchform]')?.addEventListener('submit', e=>{
    e.preventDefault();
    const v = e.target.q.value.trim();
    location.href = 'shop.html?q=' + encodeURIComponent(v);
  });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeDrawer(); closeAuth(); closeSearch(); q('[data-mmenu]')?.classList.remove('open'); } });
}

/* =========================================================
   public API
   ========================================================= */
window.LUIO = { Auth, Cart, Wish, Orders, byId, makeDesc, toast, openAuth, openDrawer, sync,
  addToCart(id, qty){ Cart.add(id, qty); openDrawer(); },
  toggleWish(id){ const on = Wish.toggle(id); toast(on?'찜 목록에 담았습니다.':'찜을 해제했습니다.'); return on; },
  requireAuth(){ if(Auth.current()) return true; openAuth('login'); toast('로그인이 필요합니다.'); return false; },
  I
};

/* ---------- reveal on scroll ---------- */
function reveals(){
  const io = new IntersectionObserver((es)=>es.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold:.12});
  qa('.reveal').forEach(el=>io.observe(el));
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // favicon (inline, no external request)
  const fav = document.createElement('link');
  fav.rel = 'icon';
  fav.href = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23123c2b"/><text x="32" y="44" font-family="Georgia,serif" font-size="34" fill="%23e7d9b8" text-anchor="middle">L</text></svg>');
  document.head.appendChild(fav);
  buildHeader();
  buildChrome();
  buildFooter();
  wire();
  sync();
  maybePromo();
  reveals();
  // promo hide handlers (promo markup lives in the page)
  const promo = q('[data-promo]');
  if(promo){
    promo.addEventListener('click', e=>{
      if(e.target.matches('[data-promoclose],[data-promoov]')) promo.classList.remove('open');
      if(e.target.matches('[data-promohide]')){ save(KEY.promo, Date.now()+86400000); promo.classList.remove('open'); }
      if(e.target.closest('[data-promocta]')){ promo.classList.remove('open'); }
    });
  }
});

})();
