/* =========================================================
   LUIOFFICE — client app (dynamic / API)
   서버(Express + SQLite) API 와 통신. 결제 단계만 제외하고 동작.
   ========================================================= */
(function(){
'use strict';

/* ---------- API ---------- */
async function api(path, opts={}){
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body ? {'Content-Type':'application/json'} : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin'
  });
  let data = null; try{ data = await res.json(); }catch(e){}
  if(!res.ok) throw new Error((data && data.error) || '요청을 처리하지 못했습니다.');
  return data;
}

/* ---------- client state ---------- */
const state = { user:null, cartCount:0, wishIds:new Set() };

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

const q = (s,r=document)=>r.querySelector(s);
const qa = (s,r=document)=>[...r.querySelectorAll(s)];
function won(n){ return '₩' + Number(n).toLocaleString('ko-KR'); }

/* =========================================================
   Chrome
   ========================================================= */
const NAV = [
  {t:'신상품', h:'/shop?sort=new'},
  {t:'패션', h:'/shop?cat=fashion'},
  {t:'가구·리빙', h:'/shop?cat=home'},
  {t:'브랜드', h:'/shop'},
  {t:'컬렉션', h:'/#editorial'},
  {t:'스토어', h:'/#service'}
];

function buildHeader(){
  const nav = NAV.map(n=>`<a href="${n.h}">${n.t}</a>`).join('');
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="announce">전 상품 정품 보증 · 5백만원 이상 <b>무료 컨시어지 배송</b> · 신규 가입 시 <b>5% 웰컴 쿠폰</b></div>
  <header class="site-header">
    <div class="header-top">
      <div class="h-side left">
        <button class="icon-btn menu-toggle" data-menu aria-label="menu">${I.menu}</button>
        <button class="icon-btn" data-search aria-label="search">${I.search}<span class="lbl">Search</span></button>
      </div>
      <a class="brand" href="/">LUIOFFICE<small>MAISON DE LUXE</small></a>
      <div class="h-side right">
        <button class="icon-btn" data-account aria-label="account">${I.user}<span class="lbl" data-authlabel>로그인</span></button>
        <button class="icon-btn" data-cart aria-label="cart">${I.bag}<span class="lbl">쇼핑백</span><span class="cart-count" data-cartcount>0</span></button>
      </div>
    </div>
    <nav class="header-nav">${nav}</nav>
  </header>`;
  document.body.prepend(el);
}

function buildChrome(){
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="m-menu" data-mmenu>
    <button class="m-close" data-mclose>&times;</button>
    ${NAV.map(n=>`<a href="${n.h}">${n.t}</a>`).join('')}
    <a href="/account" data-account-link>마이 부티크</a>
  </div>

  <div class="drawer-overlay" data-drawerov></div>
  <aside class="drawer" data-drawer aria-label="cart">
    <div class="drawer-head"><h3>쇼핑백</h3><button data-drawerclose>&times;</button></div>
    <div class="drawer-items" data-draweritems></div>
    <div class="drawer-foot" data-drawerfoot></div>
  </aside>

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

  <div class="toast" data-toast></div>`;
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
      <div><h5>Shop</h5><ul>
        <li><a href="/shop?cat=fashion">명품 패션</a></li>
        <li><a href="/shop?cat=home">디자인 가구</a></li>
        <li><a href="/shop?sort=new">신상품</a></li>
        <li><a href="/shop">전체보기</a></li></ul></div>
      <div><h5>Service</h5><ul>
        <li><a href="/#service">컨시어지 배송</a></li>
        <li><a href="/#service">정품 감정</a></li>
        <li><a href="/#service">케어 서비스</a></li>
        <li><a href="/account">마이 부티크</a></li></ul></div>
      <div><h5>Contact</h5><ul>
        <li>평일 10:00 – 18:00</li>
        <li><a href="mailto:care@luioffice.co.kr">care@luioffice.co.kr</a></li>
        <li>02-000-0000</li></ul></div>
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
function toast(msg){
  const t = q('[data-toast]'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---- auth modal ---- */
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
      <p class="muted" style="font-size:.78rem;text-align:center;margin-top:12px">데모 계정 · demo@luioffice.co.kr / demo1234</p>
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
function markErr(input, on, msg){ const f=input.closest('.field'); f.classList.toggle('invalid', on); if(on&&msg) f.querySelector('.err').textContent=msg; }
async function onLogin(e){
  e.preventDefault(); const f=e.target, email=f.email.value, pw=f.pw.value;
  markErr(f.email, !/^\S+@\S+\.\S+$/.test(email)); markErr(f.pw, !pw);
  if(!/^\S+@\S+\.\S+$/.test(email) || !pw) return;
  try{ const {user}=await api('/auth/login',{method:'POST',body:{email,pw:undefined,password:pw}}); state.user=user; closeAuth(); await refreshAll(); toast(`${user.name}님, 다시 오신 것을 환영합니다.`); afterAuth(); }
  catch(err){ markErr(f.pw, true, err.message); }
}
async function onSignup(e){
  e.preventDefault(); const f=e.target, name=f.name.value.trim(), email=f.email.value, pw=f.pw.value;
  markErr(f.name, !name); markErr(f.email, !/^\S+@\S+\.\S+$/.test(email)); markErr(f.pw, pw.length<6);
  if(!name || !/^\S+@\S+\.\S+$/.test(email) || pw.length<6) return;
  try{ const {user}=await api('/auth/signup',{method:'POST',body:{name,email,password:pw}}); state.user=user; closeAuth(); await refreshAll(); toast(`${user.name}님, 루이오피스에 오신 것을 환영합니다.`); afterAuth(); }
  catch(err){ markErr(f.email, true, err.message); }
}
function afterAuth(){ document.dispatchEvent(new CustomEvent('luio:auth')); }

/* ---- cart drawer ---- */
async function openDrawer(){ q('[data-drawer]').classList.add('open'); q('[data-drawerov]').classList.add('open'); await renderDrawer(); }
function closeDrawer(){ q('[data-drawer]').classList.remove('open'); q('[data-drawerov]').classList.remove('open'); }
async function renderDrawer(){
  const box=q('[data-draweritems]'), foot=q('[data-drawerfoot]');
  box.innerHTML = '<p class="muted" style="padding:30px 0;text-align:center">불러오는 중…</p>';
  const d = await api('/cart');
  if(!d.items.length){
    box.innerHTML = `<div class="drawer-empty"><p>쇼핑백이 비어 있습니다.</p><a class="btn ghost sm" href="/shop" style="margin-top:16px">쇼핑 계속하기</a></div>`;
    foot.innerHTML=''; return;
  }
  box.innerHTML = d.items.map(p=>`<div class="d-item">
      <div class="d-thumb">${renderArt(p,64,80)}</div>
      <div>
        <div class="d-brand">${p.brand}</div>
        <div class="d-name">${p.name}</div>
        <div class="d-price">${won(p.price)} · 수량 ${p.qty}</div>
        <button class="d-remove" data-drem="${p.id}">삭제</button>
      </div>
      <div style="text-align:right;font-size:.9rem">${won(p.lineTotal)}</div>
    </div>`).join('');
  foot.innerHTML = `<div class="row"><span>합계</span><b>${won(d.total)}</b></div>
    <a class="btn green block" href="/cart">쇼핑백 보기 · 주문하기</a>`;
  qa('[data-drem]',box).forEach(b=>b.addEventListener('click', async ()=>{ await api('/cart/'+b.dataset.drem,{method:'DELETE'}); await refreshCart(); await renderDrawer(); toast('삭제되었습니다.'); }));
}

/* ---- search ---- */
function openSearch(){ q('[data-searchmodal]').classList.add('open'); setTimeout(()=>q('[data-searchform] input')?.focus(),120); }
function closeSearch(){ q('[data-searchmodal]').classList.remove('open'); }

/* ---- promo ---- */
function maybePromo(){
  const promo=q('[data-promo]'); if(!promo) return;
  const hideUntil = parseInt(localStorage.getItem('luio_promo_hide')||'0',10);
  if(Date.now() < hideUntil){ promo.remove(); return; }
  setTimeout(()=>promo.classList.add('open'), 700);
}

/* =========================================================
   state refresh
   ========================================================= */
async function refreshMe(){ try{ const {user}=await api('/auth/me'); state.user=user; }catch(e){ state.user=null; } }
async function refreshCart(){ try{ const d=await api('/cart'); state.cartCount=d.count; }catch(e){} syncHeader(); }
async function refreshWish(){ state.wishIds=new Set(); if(state.user){ try{ const {ids}=await api('/wishlist'); state.wishIds=new Set(ids); }catch(e){} } }
async function refreshAll(){ await refreshMe(); await Promise.all([refreshCart(), refreshWish()]); syncHeader(); }
function syncHeader(){
  qa('[data-cartcount]').forEach(e=>{ e.textContent=state.cartCount; e.style.visibility=state.cartCount?'visible':'hidden'; });
  qa('[data-authlabel]').forEach(e=> e.textContent = state.user ? state.user.name : '로그인');
  document.dispatchEvent(new CustomEvent('luio:sync'));
}

/* =========================================================
   wire
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
    else if(t.matches('[data-account],[data-account-link]')){ e.preventDefault(); if(state.user) location.href='/account'; else openAuth('login'); }
  });
  q('[data-searchform]')?.addEventListener('submit', e=>{ e.preventDefault(); location.href='/shop?q='+encodeURIComponent(e.target.q.value.trim()); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeDrawer(); closeAuth(); closeSearch(); q('[data-mmenu]')?.classList.remove('open'); } });
}

/* =========================================================
   public API
   ========================================================= */
window.LUIO = {
  api, state, I, won, toast, openAuth, openDrawer,
  isWished(id){ return state.wishIds.has(id); },
  currentUser(){ return state.user; },
  async logout(){ await api('/auth/logout',{method:'POST'}); state.user=null; await refreshAll(); toast('로그아웃되었습니다.'); },
  async addToCart(id, qty=1){ try{ const d=await api('/cart',{method:'POST',body:{productId:id,qty}}); state.cartCount=d.count; syncHeader(); openDrawer(); }catch(e){ toast(e.message); } },
  async toggleWish(id){
    if(!state.user){ openAuth('login'); toast('찜은 로그인 후 이용할 수 있습니다.'); return null; }
    try{ const {wished}=await api('/wishlist/'+id,{method:'POST'}); if(wished) state.wishIds.add(id); else state.wishIds.delete(id); toast(wished?'찜 목록에 담았습니다.':'찜을 해제했습니다.'); return wished; }
    catch(e){ toast(e.message); return null; }
  },
  requireAuth(){ if(state.user) return true; openAuth('login'); toast('로그인이 필요합니다.'); return false; },
  refreshAll, refreshCart, syncHeader
};

/* ---- reveal ---- */
function reveals(){
  const io=new IntersectionObserver(es=>es.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }),{threshold:.12});
  qa('.reveal').forEach(el=>io.observe(el));
}

/* ---- boot ---- */
document.addEventListener('DOMContentLoaded', async ()=>{
  const fav=document.createElement('link'); fav.rel='icon';
  fav.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23123c2b"/><text x="32" y="44" font-family="Georgia,serif" font-size="34" fill="%23e7d9b8" text-anchor="middle">L</text></svg>');
  document.head.appendChild(fav);

  buildHeader(); buildChrome(); buildFooter(); wire();
  await refreshAll();
  maybePromo(); reveals();

  const promo=q('[data-promo]');
  if(promo){
    promo.addEventListener('click', e=>{
      if(e.target.matches('[data-promoclose],[data-promoov]')) promo.classList.remove('open');
      if(e.target.matches('[data-promohide]')){ localStorage.setItem('luio_promo_hide', Date.now()+86400000); promo.classList.remove('open'); }
      if(e.target.closest('[data-promocta]')){ promo.classList.remove('open'); }
    });
  }
  document.dispatchEvent(new CustomEvent('luio:ready'));
});

})();
