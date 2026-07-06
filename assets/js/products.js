/* =========================================================
   LUIOFFICE — Product catalogue + generative art
   Product imagery is drawn as elegant inline SVG so the site
   is fully self-contained. To use real photography, replace
   ART[...] with an <img src="..."> inside renderThumb().
   ========================================================= */

/* Minimalist line glyphs (100x100 viewBox, stroke = currentColor) */
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

/* Palettes per product for the SVG "photo" backdrop */
const PAL = {
  camel:['#e9dcc2','#cdb489'], olive:['#dfe0cd','#b0b493'], ink:['#d9d6cf','#a7a49b'],
  rose:['#f0dcd7','#d5aca4'], sky:['#d9e4e6','#a9c0c4'], sand:['#efe6d3','#cdbb95'],
  wine:['#e6d3d3','#bf9a9a'], forest:['#d5e0d4','#9fb59d'], slate:['#dadde2','#a6adb6'],
  gold:['#f0e6cf','#cbae74']
};

const PRODUCTS = [
  /* ---------- 명품 의류 · 패션 (LUXURY FASHION) ---------- */
  {id:'f1', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'camel', brand:'Hermès', name:'Birkin 30 Togo', price:24500000, tag:'ICONIC'},
  {id:'f2', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'ink', brand:'Chanel', name:'Classic Flap Medium', price:13800000, tag:'BEST'},
  {id:'f3', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'sand', brand:'Louis Vuitton', name:'Neverfull MM', price:2900000},
  {id:'f4', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'wine', brand:'Gucci', name:'GG Marmont Small', price:3250000},
  {id:'f5', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'forest', brand:'Bottega Veneta', name:'Cassette Intrecciato', price:5600000, tag:'NEW'},
  {id:'f6', cat:'fashion', sub:'핸드백', glyph:'bag', pal:'rose', brand:'Saint Laurent', name:'Loulou Medium', price:3980000},
  {id:'f7', cat:'fashion', sub:'아우터', glyph:'coat', pal:'camel', brand:'Burberry', name:'Kensington Trench Coat', price:3190000, tag:'ICONIC'},
  {id:'f8', cat:'fashion', sub:'니트', glyph:'knit', pal:'sand', brand:'Brunello Cucinelli', name:'Cashmere Ribbed Sweater', price:2450000},
  {id:'f9', cat:'fashion', sub:'슈즈', glyph:'shoe', pal:'olive', brand:'Loro Piana', name:'Summer Walk Loafers', price:1850000, tag:'NEW'},
  {id:'f10',cat:'fashion', sub:'아이웨어', glyph:'sunglass', pal:'slate', brand:'Cartier', name:'Panthère Sunglasses', price:1290000},

  /* ---------- 명품 가구 · 디자인 (DESIGN FURNITURE) ---------- */
  {id:'h1', cat:'home', sub:'라운지체어', glyph:'lounge', pal:'wine', brand:'Herman Miller', name:'Eames Lounge Chair & Ottoman', price:11900000, tag:'ICONIC'},
  {id:'h2', cat:'home', sub:'소파', glyph:'sofa', pal:'sand', brand:'B&B Italia', name:'Camaleonda Modular Sofa', price:18500000, tag:'BEST'},
  {id:'h3', cat:'home', sub:'라운지체어', glyph:'lounge', pal:'olive', brand:'Fritz Hansen', name:'Egg Chair by A. Jacobsen', price:16200000},
  {id:'h4', cat:'home', sub:'라운지체어', glyph:'lounge', pal:'ink', brand:'Knoll', name:'Barcelona Chair', price:9400000, tag:'ICONIC'},
  {id:'h5', cat:'home', sub:'체어', glyph:'lounge', pal:'sky', brand:'Vitra', name:'Panton Chair', price:490000},
  {id:'h6', cat:'home', sub:'다이닝체어', glyph:'lounge', pal:'camel', brand:'Carl Hansen & Søn', name:'CH24 Wishbone Chair', price:890000, tag:'NEW'},
  {id:'h7', cat:'home', sub:'라운지', glyph:'lounge', pal:'slate', brand:'Cassina', name:'LC4 Chaise Longue', price:7800000},
  {id:'h8', cat:'home', sub:'조명', glyph:'lamp', pal:'gold', brand:'FLOS', name:'Arco Floor Lamp', price:4300000, tag:'ICONIC'},
  {id:'h9', cat:'home', sub:'수납', glyph:'cabinet', pal:'forest', brand:'USM', name:'Haller Sideboard', price:5700000},
  {id:'h10',cat:'home', sub:'소파', glyph:'sofa', pal:'wine', brand:'Poltrona Frau', name:'Chester One Sofa', price:21000000, tag:'BEST'}
];

/* Build an elegant SVG "photo" for a product */
function renderArt(p, w, h){
  const [c1,c2] = PAL[p.pal] || PAL.sand;
  const gid = 'g_'+p.id;
  const initial = (p.brand[0]||'L').toUpperCase();
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.brand} ${p.name}">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${gid})"/>
    <text x="${w/2}" y="${h*0.30}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="${w*0.5}" fill="#ffffff" opacity="0.16" font-weight="600">${initial}</text>
    <g transform="translate(${w/2-w*0.22},${h*0.34}) scale(${w*0.0044})" fill="none" stroke="#2a2118" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.72">
      ${GLYPH[p.glyph]||''}
    </g>
    <text x="${w/2}" y="${h*0.90}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="${w*0.05}" letter-spacing="${w*0.006}" fill="#3a2f22" opacity="0.72">${p.brand.toUpperCase()}</text>
  </svg>`;
}

function won(n){ return '₩' + n.toLocaleString('ko-KR'); }

/* Lookup + description helpers (global, used by page scripts) */
function byId(id){ return PRODUCTS.find(p=>p.id===id); }
function makeDesc(p){
  return `${p.brand}의 시그니처 아이템 <b>${p.name}</b>. 장인의 손끝에서 완성된 소재와 균형 잡힌 비율로, 시간이 지날수록 가치가 깊어지는 ${p.sub} 컬렉션입니다. 루이오피스가 정품 검수를 마친 큐레이션 상품입니다.`;
}

/* Product card markup (used on home / shop) */
function renderCard(p){
  const wished = window.LUIO && window.LUIO.Wish.has(p.id);
  const tag = p.tag ? `<span class="tag ${p.tag==='ICONIC'||p.tag==='BEST'?'gold':''}">${p.tag}</span>` : '';
  return `<article class="card" data-card="${p.id}">
    <div class="thumb">
      <a href="product.html?id=${p.id}" aria-label="${p.brand} ${p.name}">${renderArt(p,360,480)}</a>
      ${tag}
      <button class="wish ${wished?'active':''}" data-wish="${p.id}" aria-label="찜">
        ${wished?window.LUIO.I.heartF:window.LUIO.I.heart}
      </button>
      <button class="add" data-add="${p.id}">쇼핑백 담기</button>
    </div>
    <a href="product.html?id=${p.id}" class="meta">
      <div class="brand-name">${p.brand}</div>
      <div class="prod-name">${p.name}</div>
      <div class="price">${won(p.price)}</div>
    </a>
  </article>`;
}

/* Wire card buttons within a container */
function wireCards(root){
  root.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click', e=>{
    e.preventDefault(); window.LUIO.addToCart(b.dataset.add, 1);
  }));
  root.querySelectorAll('[data-wish]').forEach(b=>b.addEventListener('click', e=>{
    e.preventDefault();
    const on = window.LUIO.toggleWish(b.dataset.wish);
    b.classList.toggle('active', on);
    b.innerHTML = on ? window.LUIO.I.heartF : window.LUIO.I.heart;
  }));
}
