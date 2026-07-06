# LUIOFFICE (루이오피스) — 명품 패션 & 디자인 가구 스토어 (동적/데모)

주식회사 루이오피스의 럭셔리 커머스 **데모 사이트**입니다.
명품 패션과 디자인 가구를 함께 제안하는 부티크 컨셉으로,
**Node(Express) + SQLite** 백엔드에서 회원/장바구니/찜/주문/어드민이 실제로 동작합니다.
**결제 단계만 비활성화**되어 있습니다 (데모).

> 참고 사이트의 무드(딥 그린 + 아이보리, 세리프 로고, 카테고리 원형 아이콘, 위시 하트,
> 하단 모바일 네비)만 참고했으며, 코드·이미지·문구는 전부 새로 제작한 오리지널입니다.

---

## 동작 기능 (결제 제외 전부 동작)

**고객**
- 회원가입 / 로그인 / 로그아웃 (bcrypt 해시, 세션 쿠키) — 모달 팝업
- 장바구니 (담기/수량/삭제) — 세션 기반, 비회원도 가능
- 찜(위시리스트) — 로그인 사용자, 서버 저장
- 검색 / 카테고리·브랜드 필터 / 정렬
- 상품 상세, 주문서 → **주문 접수**(결제 직전까지)
- 마이 부티크 (주문 내역 / 찜 / 회원 정보)
- 첫 방문 웰컴 쿠폰 팝업

**관리자(어드민)** — `/admin.html`
- 관리자 로그인 게이트 (권한 체크)
- 대시보드: 총 주문 / 매출 / 결제 대기 / 회원 수 / 상태별 건수
- 주문 목록: 상태 필터 칩 · 검색(주문번호·이름·이메일·연락처)
- 주문별 **상태 변경**(결제대기→…→배송완료/취소) · **주문 삭제**

### 시드 계정 (최초 실행 시 자동 생성)
| 구분 | 이메일 | 비밀번호 |
|---|---|---|
| 관리자 | `admin@luioffice.co.kr` | `admin1234` |
| 데모 고객 | `demo@luioffice.co.kr` | `demo1234` |

테스트용 **가짜 주문 8건**도 자동 시드됩니다 (다양한 상태/날짜).
상품은 실제 아이코닉 명품 20종(패션 10 + 가구 10).

### 상품 이미지 (실사진 + 폴백)
각 상품은 **실사진 → SVG 아트**의 3단 폴백으로 렌더돼 **절대 깨진 이미지가 안 보입니다.**
1. 로컬 파일 `public/assets/img/products/<id>.jpg` (있으면 최우선)
2. 원격 URL (`products.img`, 로열티 프리 Unsplash 라이선스 사진)
3. 위 둘 다 실패 시 자동으로 SVG 아트

> 브랜드 소유 이미지를 임베드하지 않고, 동일 카테고리의 **자유 이용 실사진**을 사용합니다.
> VPS 등 인터넷 되는 환경에선 원격 사진이 바로 뜹니다.

**사진을 서버에 자기 호스팅**(권장, 로딩 빠르고 안정적):
```bash
node scripts/fetch-images.js   # 원격 사진을 public/assets/img/products/ 로 저장
```
원하는 사진으로 바꾸려면 같은 경로에 `<상품id>.jpg` 를 덮어쓰면 됩니다.
URL 을 바꾸려면 `db.js` 의 `PRODUCTS` 배열 `img` 값을 수정 후 `data/` 삭제하고 재실행(재시드).

---

## 파일 구조

```
server.js               Express 앱 + REST API + 어드민 API
db.js                   SQLite 스키마 + 시드(상품/관리자/테스트 주문)
ecosystem.config.cjs    pm2 설정 (PORT 9002, HOST 127.0.0.1)
Caddyfile.snippet       /etc/caddy/Caddyfile 에 append 할 블록
package.json
data/                   (자동 생성, git 제외) luxury.db, sessions.db
public/                 정적 프론트엔드
  index / shop / product / cart / checkout / complete / account / admin .html
  assets/css/style.css
  assets/js/products.js  SVG 아트 + 카드 렌더
  assets/js/app.js       API 통신 · 인증 · 장바구니 · 찜 · 모달 · 헤더/푸터
```

### 주요 API
```
POST /api/auth/signup | login | logout        GET /api/auth/me
GET  /api/products     GET /api/products/:id
GET/POST/PATCH/DELETE  /api/cart[/:id]
GET  /api/wishlist     POST /api/wishlist/:id (toggle)
POST /api/orders       GET /api/orders   GET /api/orders/:no
GET  /api/admin/stats  GET /api/admin/orders
PATCH/DELETE /api/admin/orders/:no            (관리자 전용)
```

---

## 배포 (Ubuntu VPS · pm2 + Caddy)

기존 사이트(3000/3002/9000/9001)는 건드리지 않고 **새 블록만 추가**합니다.
앱은 `127.0.0.1:9002` 에서 뜨고 Caddy 가 앞단에서 reverse_proxy 합니다.

### 1) 앱 실행
```bash
cd /배포경로/luxury
npm install --omit=dev        # better-sqlite3 prebuilt 바이너리 자동 설치
pm2 start ecosystem.config.cjs
pm2 save
```
> better-sqlite3 빌드 도구가 필요할 수 있습니다: `sudo apt-get install -y build-essential python3`
> (대부분 prebuilt 바이너리가 받아져 컴파일 없이 설치됩니다.)

### 2) Caddy 등록
`/etc/caddy/Caddyfile` 맨 아래에 `Caddyfile.snippet` 블록을 붙여넣고 도메인만 수정:
```caddy
luioffice.co.kr {
	encode gzip
	reverse_proxy 127.0.0.1:9002
}
```
```bash
sudo systemctl reload caddy
```

### 로컬 미리보기
```bash
npm install && npm start      # http://127.0.0.1:9002  (어드민: /admin.html)
```

### 운영 팁
- 세션 비밀키는 환경변수로: `SESSION_SECRET=... pm2 start ...`
- DB 초기화: `data/` 폴더 삭제 후 재실행하면 시드부터 다시 생성됩니다.

---

## 회사 정보
주식회사 루이오피스 (LUIOFFICE Inc.) · 대표 유성복
사업자등록번호 331-86-03448 · 서울특별시 강남구 삼성로85길 33, 비04-씨48호(대치동)
업태 도소매업 / 종목 전자상거래(생활용품 및 패션잡화)

> ⚠️ 본 사이트는 **데모**이며 실제 결제/청구가 발생하지 않습니다.
> 통신판매업신고번호 등은 실제 값으로 교체 후 운영하세요.
