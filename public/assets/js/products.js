/* =========================================================
   LUIOFFICE — client render helpers
   상품 데이터는 서버(SQLite) API 에서 받아오고,
   이미지는 저작권 안전한 인라인 SVG 아트로 렌더합니다.
   실제 사진 사용 시 renderArt() 를 <img src> 반환으로 교체.
   ========================================================= */

const GLYPH = {
  bag:'<path d="M30 42h40l-4 34H34z"/><path d="M40 42v-6a10 10 0 0 1 20 0v6"/><circle cx="42" cy="54" r="1.6"/><circle cx="58" cy="54" r="1.6"/>',
  coat:'<path d="M38 26l-10 8 4 12 4-2v30h28V44l4 2 4-12-10-8"/><path d="M50 26v42"/><path d="M42 26l8 8 8-8"/>',
  shoe:'<path d="M26 58c8 2 14 2 22-2 6-3 12-4 20-2 6 1.6 6 8 0 8H30c-3 0-4-2-4-4z"/><path d="M30 54l4-14h8l4 10"/>',
  knit:'<path d="M34 34l-8 8 5 6 3-2v22h32V46l3 2 5-6-8-8-8 5-10 0z"/><path d="M42 34c0 5 16 5 16 0"/>',
  sunglass:'<path d="M26 44h48"/><path d="M30 44a9 9 0 0 0 18 0"/><path d="M52 44a9 9 0 0 0 18 0"/><path d="M48 46c1-3 3-3 4 0"/>',
  lounge:'<path d="M32 40c-4 2-6 8-4 14l4 12h24l6-30c1-6-4-10-10-8z"/><path d="M28 66l-2 8m28-8l2 8"/>',
  sofa:'<path d="M24 50a6 6 0 0 1 12 0v6h28v-6a6 6 0 0 1 12 0v14H24z"/><path d="M36 56h28"/><path d="M28 70v6m44-6v6"/>',
  lamp:'<path d="M30 74c0-26 12-40 34-40"/><path d="M60 30l10 4-6 10-8-3z"/><path d="M26 74h12"/><path d="M32 62v12"/>',
  table:'<path d="M24 46h52"/><path d="M28 46v26m44-26v26"/><path d="M30 58h40"/>',
  cabinet:'<rect x="26" y="38" width="48" height="26" rx="1"/><path d="M50 38v26"/><circle cx="45" cy="51" r="1.4"/><circle cx="55" cy="51" r="1.4"/><path d="M32 64v6m36-6v6"/>'
};

const PAL = {
  camel:['#e9dcc2','#cdb489'], olive:['#dfe0cd','#b0b493'], ink:['#d9d6cf','#a7a49b'],
  rose:['#f0dcd7','#d5aca4'], sky:['#d9e4e6','#a9c0c4'], sand:['#efe6d3','#cdbb95'],
  wine:['#e6d3d3','#bf9a9a'], forest:['#d5e0d4','#9fb59d'], slate:['#dadde2','#a6adb6'],
  gold:['#f0e6cf','#cbae74']
};

/* 순수 SVG 아트 (사진 로드 실패 시 폴백) */
function svgArt(p, w, h){
  const [c1,c2] = PAL[p.pal] || PAL.sand;
  const gid = 'g_' + (p.id || Math.random().toString(36).slice(2)) + '_' + w;
  const initial = (p.brand && p.brand[0] || 'L').toUpperCase();
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.brand} ${p.name}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${gid})"/>
    <text x="${w/2}" y="${h*0.30}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="${w*0.5}" fill="#ffffff" opacity="0.16" font-weight="600">${initial}</text>
    <g transform="translate(${w/2-w*0.22},${h*0.34}) scale(${w*0.0044})" fill="none" stroke="#2a2118" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.72">${GLYPH[p.glyph]||''}</g>
    <text x="${w/2}" y="${h*0.90}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="${w*0.05}" letter-spacing="${w*0.006}" fill="#3a2f22" opacity="0.72">${(p.brand||'').toUpperCase()}</text>
  </svg>`;
}

/* 이미지 우선(로컬 → 원격 → SVG 폴백). 절대 깨진 이미지 안 보이게 처리 */
function renderArt(p, w, h){
  const svg = svgArt(p, w, h);
  if(!p.img && !p.id) return svg;
  const local = `assets/img/products/${p.id}.jpg`;
  const remote = (p.img || '').replace(/"/g,'&quot;');
  // onerror 1차: 원격으로 교체, 2차: 숨김(→ 아래 SVG 노출)
  const onerr = `if(!this.dataset.s){this.dataset.s=1;this.src='${remote}';}else{this.style.display='none';}`;
  return `<div class="art-wrap">${svg}<img class="art-photo" src="${local}" alt="${p.brand} ${p.name}" loading="lazy" onerror="${remote?onerr:"this.style.display='none'"}"></div>`;
}

function won(n){ return '₩' + Number(n).toLocaleString('ko-KR'); }

function makeDesc(p){
  return `${p.brand}의 시그니처 아이템 <b>${p.name}</b>. 장인의 손끝에서 완성된 소재와 균형 잡힌 비율로, 시간이 지날수록 가치가 깊어지는 ${p.sub} 컬렉션입니다. 루이오피스가 정품 검수를 마친 큐레이션 상품입니다.`;
}

/* Product card (wished 상태는 LUIO.isWished 로 판단) */
function renderCard(p){
  const wished = window.LUIO && window.LUIO.isWished(p.id);
  const tag = p.tag ? `<span class="tag ${p.tag==='ICONIC'||p.tag==='BEST'?'gold':''}">${p.tag}</span>` : '';
  return `<article class="card" data-card="${p.id}">
    <div class="thumb">
      <a href="product.html?id=${p.id}" aria-label="${p.brand} ${p.name}">${renderArt(p,360,480)}</a>
      ${tag}
      <button class="wish ${wished?'active':''}" data-wish="${p.id}" aria-label="찜">${wished?window.LUIO.I.heartF:window.LUIO.I.heart}</button>
      <button class="add" data-add="${p.id}">쇼핑백 담기</button>
    </div>
    <a href="product.html?id=${p.id}" class="meta">
      <div class="brand-name">${p.brand}</div>
      <div class="prod-name">${p.name}</div>
      <div class="price">${won(p.price)}</div>
    </a>
  </article>`;
}

function wireCards(root){
  root.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click', async e=>{
    e.preventDefault(); await window.LUIO.addToCart(b.dataset.add, 1);
  }));
  root.querySelectorAll('[data-wish]').forEach(b=>b.addEventListener('click', async e=>{
    e.preventDefault();
    const on = await window.LUIO.toggleWish(b.dataset.wish);
    if(on===null) return; // 로그인 필요
    b.classList.toggle('active', on);
    b.innerHTML = on ? window.LUIO.I.heartF : window.LUIO.I.heart;
  }));
}
