# LUIOFFICE (루이오피스) — 명품 패션 & 디자인 가구 데모 스토어

주식회사 루이오피스의 럭셔리 커머스 **데모 사이트**입니다.
명품 패션과 디자인 가구를 함께 제안하는 부티크 컨셉으로, 정적 파일(HTML/CSS/JS)로만
동작하며 **백엔드·실제 결제 없이** 브라우저(localStorage)에서 모든 기능이 돌아갑니다.

> 참고 사이트의 전반적인 무드(딥 그린 + 아이보리, 세리프 로고, 카테고리 원형 아이콘)만
> 참고했으며, 코드·이미지·문구는 전부 새로 제작한 오리지널입니다.

---

## 동작하는 기능 (결제 제외 전부 동작)

- **회원가입 / 로그인 / 로그아웃** — localStorage 기반, 유효성 검사 포함 (모달 팝업)
- **장바구니** — 담기 / 수량 조절 / 삭제, 우측 슬라이드 드로어 + 장바구니 페이지
- **찜(위시리스트)** — 상품 카드/상세에서 하트 토글, 마이페이지에서 모아보기
- **검색 / 필터 / 정렬** — 카테고리·브랜드·키워드 검색, 가격/신상품 정렬
- **상품 상세** — 수량 선택, 바로 구매, 관련 상품 추천
- **주문서 → 주문 접수** — 배송지 입력까지 진행, **결제 단계만 비활성화** (데모)
- **마이 부티크** — 주문 내역 / 찜 / 회원 정보
- **팝업** — 첫 방문 웰컴 쿠폰 팝업("오늘 하루 보지 않기"), 검색/로그인 모달
- 반응형 + 모바일 하단 네비게이션

수록 상품은 **실제 존재하는 아이코닉 명품**입니다 (에르메스 버킨, 샤넬 클래식 플랩,
임스 라운지 체어, B&B 이탈리아 카마레온다, FLOS 아르코 등 패션 10 + 가구 10).
상품 이미지는 저작권 문제 없이 항상 렌더되도록 **인라인 SVG 아트**로 생성했습니다.
실제 사진으로 교체하려면 `assets/js/products.js` 의 `renderArt()` 안에서 `<svg>` 대신
`<img src="...">` 를 반환하도록 바꾸면 됩니다.

---

## 파일 구조

```
index.html          홈
shop.html           컬렉션 목록(필터/검색/정렬)
product.html        상품 상세 (?id=)
cart.html           장바구니
checkout.html       주문서 (결제 전까지)
complete.html       주문 접수 완료
account.html        마이 부티크
assets/css/style.css
assets/js/products.js   상품 데이터 + SVG 아트 + 카드 렌더
assets/js/app.js        인증/장바구니/찜/모달/헤더·푸터 등 공통 로직
server.js               pm2용 정적 서버 (의존성 0)
ecosystem.config.cjs    pm2 설정 (PORT 9002)
Caddyfile.snippet       /etc/caddy/Caddyfile 에 append 할 블록
```

---

## 배포 (Ubuntu VPS · pm2 + Caddy)

기존 사이트는 건드리지 않고 **새 블록만 추가**하는 방식입니다.

### 1) 앱 실행 (pm2, 포트 9002)

```bash
cd /home/user/luxury          # 실제 배포 경로로
pm2 start ecosystem.config.cjs
pm2 save
```

앱은 `127.0.0.1:9002` 에서 정적 파일을 서빙합니다. (외부에 직접 노출 X, Caddy가 앞단)

### 2) Caddy 등록

`/etc/caddy/Caddyfile` **맨 아래에** `Caddyfile.snippet` 내용을 붙여넣고 도메인만 수정:

```caddy
luioffice.co.kr {
	encode gzip
	reverse_proxy 127.0.0.1:9002
}
```

적용:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile   # 문법 확인(선택)
sudo systemctl reload caddy
```

> 기존 사이트들처럼 `도메인:포트` 형태로 붙이고 싶다면 `Caddyfile.snippet` 의 (B) 옵션 참고.
> 공개 포트와 pm2 내부 포트(9002)가 겹치면 `ecosystem.config.cjs` 의 `PORT` 를 9102 등으로
> 바꾸고 `reverse_proxy 127.0.0.1:9102` 로 맞추세요.

### 로컬 미리보기

```bash
node server.js        # http://127.0.0.1:9002
```

---

## 회사 정보

주식회사 루이오피스 (LUIOFFICE Inc.) · 대표 유성복
사업자등록번호 331-86-03448 · 서울특별시 강남구 삼성로85길 33, 비04-씨48호(대치동)
업태 도소매업 / 종목 전자상거래(생활용품 및 패션잡화)

> ⚠️ 본 사이트는 **데모**이며 실제 결제/청구가 발생하지 않습니다.
> 통신판매업신고번호 등은 실제 값으로 교체 후 운영하세요.
