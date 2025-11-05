# NADA FASHION 쇼핑몰

## 프로젝트 개요
- **이름**: NADA FASHION
- **목표**: 트렌디한 여성 의류와 슈즈를 판매하는 온라인 쇼핑몰
- **버전**: 2.0.0
- **최종 업데이트**: 2025-11-05

## 주요 기능

### 고객 기능 ✅
- ✅ 상품 카테고리별 필터링 (의류, 슈즈, 액세서리)
- ✅ 상품 상세 페이지 (이미지, 설명, 가격, 재고)
- ✅ **사이즈 옵션 선택** (의류: S/M/L, 신발: 230/235/240)
- ✅ 수량 조절 및 "바로 구매"
- ✅ 장바구니 관리 (추가, 수정, 삭제)
- ✅ **선택적 구매** (체크박스로 일부 상품만 주문)
- ✅ **Toss Payments 결제 연동** (카드, 계좌이체, 가상계좌)
- ✅ 주문 완료 및 결제 성공/실패 처리
- ✅ **회원가입 / 로그인** (이메일 + 비밀번호)
- ✅ 로그인 상태 표시

### 관리자 기능 ✅
- ✅ 관리자 대시보드 (매출, 주문, 상품, 회원 통계)
- ✅ 상품 관리 (목록 조회, 재고 확인)
- ✅ 주문 관리 (준비 중)
- ✅ 회원 관리 (준비 중)
- ✅ 관리자 전용 접근 권한

### 추가 예정 기능 🚧
- 🚧 소셜 로그인 (카카오, 네이버, Google)
- 🚧 마이페이지 (주문 내역, 배송지 관리, 찜 목록)
- 🚧 상품 검색 및 고급 필터
- 🚧 상품 리뷰 시스템
- 🚧 쿠폰 및 적립금
- 🚧 재고 알림
- 🚧 이메일/SMS 주문 알림

---

## 현재 기능 URI 요약

### 🔐 인증 API

#### 회원가입
- `POST /api/auth/signup`
  - Body: `{ email, password, name, phone?, marketingAgreed }`
  - Response: `{ success, user, token }`

#### 로그인
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ success, user: { id, email, name, isAdmin }, token }`

#### 로그아웃
- `POST /api/auth/logout`
  - Headers: `Authorization: Bearer {token}`

#### 현재 사용자 정보
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ id, email, name, isAdmin }`

### 📦 상품 API

#### 카테고리
- `GET /api/categories` - 전체 카테고리 목록

#### 상품
- `GET /api/products` - 전체 상품 목록
- `GET /api/products?category=clothing` - 카테고리별 상품
- `GET /api/products/:id` - 상품 상세 (옵션 포함)
  - Response에 `options` 배열 포함 (사이즈, 재고)

### 🛒 장바구니 API

- `GET /api/cart/:sessionId` - 장바구니 조회
- `POST /api/cart` - 상품 추가
  - Body: `{ sessionId, productId, quantity, size?, color? }`
- `PUT /api/cart/:id` - 수량 업데이트
  - Body: `{ quantity }`
- `PUT /api/cart/:id/select` - 선택 상태 변경
  - Body: `{ selected: true|false }`
- `DELETE /api/cart/:id` - 항목 삭제

### 💳 결제 API

- `POST /api/payments/prepare` - 결제 준비
  - Body: `{ sessionId, customerName, customerEmail, customerPhone, shippingAddress }`
  - Response: `{ success, orderId, orderNumber, amount, customerName, customerEmail }`

- `POST /api/payments/confirm` - 결제 승인 (Toss Payments 연동)
  - Body: `{ orderId, paymentKey, amount }`
  - Response: `{ success, payment }`

### 📦 주문 API

- `GET /api/orders/:orderNumber` - 주문 상세 조회
  - Response: `{ ...order, items, payment }`

---

## 프론트엔드 페이지

### 고객 페이지
- `/static/index.html` - 메인 페이지
  - 히어로 섹션
  - 카테고리 필터
  - 상품 목록 (그리드)
  - 상품 상세 (모달)
  - 장바구니
  - 주문/결제
  - 주문 완료

- `/static/auth.html` - 로그인/회원가입
  - 로그인 폼
  - 회원가입 폼
  - 소셜 로그인 버튼 (준비 중)

- `/static/payment-success.html` - 결제 성공
- `/static/payment-fail.html` - 결제 실패

### 관리자 페이지
- `/static/admin.html` - 관리자 대시보드
  - 매출/주문/상품/회원 통계
  - 최근 주문 목록
  - 상품 관리
  - 주문 관리
  - 회원 관리

---

## 데이터 아키텍처

### 데이터 모델

#### 1. Categories (카테고리)
```sql
id, name, slug, description, created_at
```

#### 2. Products (상품)
```sql
id, name, description, price, category_id, image_url, stock, created_at, updated_at
```

#### 3. Product Options (상품 옵션) 🆕
```sql
id, product_id, option_type, option_value, stock, price_adjustment, created_at
```
- 예: `{ product_id: 1, option_type: 'size', option_value: 'M', stock: 10 }`

#### 4. Cart Items (장바구니)
```sql
id, session_id, product_id, quantity, size, color, selected, created_at
```
- `selected`: 선택적 구매를 위한 체크 상태 (1: 선택, 0: 미선택)

#### 5. Orders (주문)
```sql
id, user_id, order_number, customer_name, customer_email, customer_phone, 
shipping_address, total_amount, status, created_at, updated_at
```

#### 6. Order Items (주문 상품)
```sql
id, order_id, product_id, product_name, product_price, quantity, size, color
```

#### 7. Payments (결제) 🆕
```sql
id, order_id, payment_key, amount, method, status, approved_at, created_at
```

#### 8. Users (사용자) 🆕
```sql
id, email, password_hash, name, phone, birth_date, gender, 
marketing_agreed, is_admin, created_at, last_login_at, updated_at
```

#### 9. User Sessions (세션) 🆕
```sql
id, user_id, session_token, expires_at, created_at
```

#### 10. Addresses (배송지) 🆕
```sql
id, user_id, name, recipient_name, recipient_phone, postal_code, 
address1, address2, is_default, created_at
```

#### 11. Social Logins (소셜 로그인) 🆕
```sql
id, user_id, provider, provider_id, created_at
```

#### 12. Wishlists (찜하기) 🆕
```sql
id, user_id, product_id, created_at
```

#### 13. Reviews (리뷰) 🆕
```sql
id, user_id, product_id, order_id, rating, content, 
is_photo_review, likes_count, created_at
```

### 스토리지 서비스
- **Cloudflare D1** - SQLite 기반 관계형 데이터베이스
  - 로컬 개발: `.wrangler/state/v3/d1` (자동 생성)
  - 프로덕션: Cloudflare D1

---

## 기술 스택

### Backend
- **Framework**: Hono (TypeScript)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: 세션 기반 (SHA-256 해싱)
- **Payment**: Toss Payments API

### Frontend
- **HTML5, CSS3** (Tailwind CSS via CDN)
- **JavaScript** (Vanilla JS, Axios)
- **Icons**: Font Awesome
- **Charts**: Chart.js (관리자 페이지)

### DevOps
- **Build**: Vite
- **Process Manager**: PM2
- **Deployment**: Cloudflare Pages
- **Version Control**: Git

---

## 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- npm

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd webapp

# 2. 의존성 설치
npm install

# 3. 데이터베이스 마이그레이션
npm run db:migrate:local

# 4. 테스트 데이터 추가
npm run db:seed
npx wrangler d1 execute nada-production --local --file=./seed_options.sql

# 5. 프로젝트 빌드
npm run build

# 6. 개발 서버 시작 (PM2)
npm run clean-port
pm2 start ecosystem.config.cjs

# 7. 서버 확인
pm2 list
pm2 logs nada-shopping-mall --nostream

# 8. 테스트
curl http://localhost:3000
```

### 개발 서버 URL
- **Local**: http://localhost:3000
- **Sandbox**: https://3000-ixwj00mlfnrm1vc3ab6ez-de59bda9.sandbox.novita.ai

### 테스트 계정
- **관리자**
  - 이메일: `admin@nadafashion.com`
  - 비밀번호: `admin123`

---

## 프로덕션 배포 (Cloudflare Pages)

### 사전 준비
1. Cloudflare API 키 발급
2. D1 데이터베이스 생성
3. Toss Payments API 키 발급 (실제 배포 시)

### 배포 절차

```bash
# 1. Cloudflare D1 데이터베이스 생성
npx wrangler d1 create nada-production

# 2. wrangler.jsonc에 database_id 업데이트

# 3. 프로덕션 마이그레이션
npm run db:migrate:prod

# 4. 프로덕션 데이터 추가 (선택)
npx wrangler d1 execute nada-production --file=./seed.sql
npx wrangler d1 execute nada-production --file=./seed_options.sql

# 5. Pages 프로젝트 생성
npx wrangler pages project create nada-shopping-mall --production-branch main

# 6. 배포
npm run deploy:prod

# 7. 환경 변수 설정 (선택)
npx wrangler pages secret put TOSS_SECRET_KEY --project-name nada-shopping-mall
npx wrangler pages secret put JWT_SECRET --project-name nada-shopping-mall
```

### 배포 후 확인
```bash
# 배포 URL 확인
# https://<random-id>.nada-shopping-mall.pages.dev

# 도메인 연결 (선택)
npx wrangler pages domain add example.com --project-name nada-shopping-mall
```

---

## 주요 스크립트

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "dev:d1": "wrangler pages dev dist --d1=nada-production --local --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "deploy": "npm run build && wrangler pages deploy dist",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name nada-shopping-mall",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
  "db:migrate:local": "wrangler d1 migrations apply nada-production --local",
  "db:migrate:prod": "wrangler d1 migrations apply nada-production",
  "db:seed": "wrangler d1 execute nada-production --local --file=./seed.sql",
  "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed"
}
```

---

## 프로젝트 구조

```
webapp/
├── src/
│   ├── index.tsx           # Hono 백엔드 메인
│   ├── auth.ts             # 인증 유틸리티
│   └── renderer.tsx        # JSX 렌더러
├── public/
│   └── static/
│       ├── index.html      # 메인 페이지
│       ├── app.js          # 메인 JavaScript
│       ├── auth.html       # 로그인/회원가입
│       ├── auth.js         # 인증 JavaScript
│       ├── admin.html      # 관리자 페이지
│       ├── admin.js        # 관리자 JavaScript
│       ├── payment-success.html
│       └── payment-fail.html
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_product_options.sql
│   └── 0003_add_users_and_auth.sql
├── seed.sql                # 기본 데이터
├── seed_options.sql        # 상품 옵션 데이터
├── ecosystem.config.cjs    # PM2 설정
├── wrangler.jsonc          # Cloudflare 설정
├── vite.config.ts          # Vite 빌드 설정
├── package.json
├── README.md
└── DEVELOPMENT_PLAN.md     # 개발 계획서
```

---

## 보안

### 구현된 보안 기능
- ✅ 비밀번호 SHA-256 해싱
- ✅ 세션 토큰 기반 인증
- ✅ 세션 만료 (7일)
- ✅ CORS 설정
- ✅ 입력 유효성 검사 (이메일, 비밀번호)
- ✅ SQL Injection 방지 (Prepared Statements)

### 추가 보안 강화 권장사항
- 🔒 bcrypt로 비밀번호 해싱 전환
- 🔒 HTTPS 강제
- 🔒 Rate Limiting
- 🔒 CSRF 토큰
- 🔒 XSS 방어
- 🔒 2FA (이중 인증)

---

## 성능 최적화

### 구현됨
- ✅ Cloudflare CDN
- ✅ 이미지 최적화 (Unsplash CDN)
- ✅ 정적 파일 서빙

### 추가 권장사항
- 🚀 코드 스플리팅
- 🚀 Lazy Loading
- 🚀 Service Worker (PWA)
- 🚀 이미지 WebP 변환
- 🚀 데이터베이스 인덱스 최적화

---

## 테스트

### 수동 테스트 시나리오

#### 1. 회원가입 & 로그인
```
1. /static/auth.html 접속
2. "회원가입" 탭 클릭
3. 이메일, 비밀번호, 이름 입력
4. "회원가입" 버튼 클릭
5. 메인 페이지로 자동 리다이렉트
6. 헤더에서 사용자 이름 확인
```

#### 2. 상품 구매 (일반 사용자)
```
1. "쇼핑 시작하기" 클릭
2. 카테고리 필터 선택 (예: 의류)
3. 상품 카드 클릭 → 상세 페이지
4. 사이즈 선택 (필수)
5. 수량 조절
6. "장바구니 담기" 클릭
7. 헤더 "장바구니" 클릭
8. 원하는 상품만 체크
9. "선택 상품 주문하기" 클릭
10. 배송 정보 입력
11. "결제하기" 클릭
12. Toss Payments 테스트 결제 진행
```

#### 3. 관리자 기능
```
1. admin@nadafashion.com / admin123 로그인
2. /static/admin.html 자동 리다이렉트
3. 대시보드에서 통계 확인
4. "상품 관리" 클릭하여 상품 목록 확인
```

---

## 문의 및 지원

- **개발자**: AI Development Assistant
- **버전**: 2.0.0
- **최종 업데이트**: 2025-11-05

---

## 라이선스

MIT License

---

## 변경 이력

### v2.0.0 (2025-11-05)
- ✅ 사용자 인증 시스템 (회원가입/로그인)
- ✅ 관리자 페이지 (대시보드, 상품/주문/회원 관리)
- ✅ 상품 옵션 (사이즈) 시스템
- ✅ 장바구니 선택적 구매
- ✅ Toss Payments PG 연동
- ✅ 데이터베이스 확장 (8개 테이블 추가)

### v1.0.0 (2025-11-04)
- ✅ 기본 쇼핑몰 기능 (상품, 장바구니, 주문)
- ✅ Cloudflare Pages + Hono 기반 구조
- ✅ D1 데이터베이스 연동
