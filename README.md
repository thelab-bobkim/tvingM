# NADA FASHION 쇼핑몰

## 프로젝트 개요
- **이름**: NADA FASHION
- **목표**: 트렌디한 여성 의류와 슈즈를 판매하는 온라인 쇼핑몰
- **주요 기능**:
  - 상품 목록 및 카테고리별 필터링
  - 장바구니 관리
  - 주문 및 결제 시스템
  - 반응형 웹 디자인

## 완료된 기능
- ✅ 상품 카테고리 관리 (의류, 슈즈, 액세서리)
- ✅ 상품 목록 조회 및 카테고리별 필터링
- ✅ 장바구니 추가/수정/삭제
- ✅ 주문 및 결제 처리
- ✅ 주문 완료 확인
- ✅ 세션 기반 장바구니 관리

## 현재 기능 URI 요약

### API 엔드포인트

#### 카테고리
- `GET /api/categories` - 전체 카테고리 목록 조회

#### 상품
- `GET /api/products` - 전체 상품 목록 조회
- `GET /api/products?category=clothing` - 카테고리별 상품 조회
- `GET /api/products/:id` - 특정 상품 상세 정보 조회

#### 장바구니
- `GET /api/cart/:sessionId` - 세션별 장바구니 조회
- `POST /api/cart` - 장바구니에 상품 추가
  - Body: `{ sessionId, productId, quantity }`
- `PUT /api/cart/:id` - 장바구니 항목 수량 업데이트
  - Body: `{ quantity }`
- `DELETE /api/cart/:id` - 장바구니 항목 삭제

#### 주문
- `POST /api/orders` - 새 주문 생성
  - Body: `{ sessionId, customerName, customerEmail, customerPhone, shippingAddress, items }`
- `GET /api/orders/:orderNumber` - 주문 상세 조회

### 프론트엔드 페이지
- `/` - 메인 페이지 (히어로 섹션)
- 상품 목록 페이지 (동적 렌더링)
- 장바구니 페이지 (동적 렌더링)
- 주문/결제 페이지 (동적 렌더링)
- 주문 완료 페이지 (동적 렌더링)

## 아직 구현되지 않은 기능
- ❌ 사용자 인증 (로그인/회원가입)
- ❌ 상품 검색 기능
- ❌ 상품 리뷰 시스템
- ❌ 찜하기/위시리스트
- ❌ 실제 결제 게이트웨이 연동 (Stripe, Toss 등)
- ❌ 주문 상태 추적
- ❌ 관리자 페이지 (상품 관리, 주문 관리)
- ❌ 이메일 알림 시스템

## 추천 개발 다음 단계
1. **사용자 인증 시스템 구현** - 회원가입/로그인 기능 추가
2. **상품 검색 기능** - 키워드 기반 상품 검색
3. **실제 결제 연동** - Stripe 또는 Toss Payments 연동
4. **관리자 대시보드** - 상품 및 주문 관리 인터페이스
5. **주문 상태 추적** - 배송 상태 업데이트 및 확인
6. **이메일 알림** - 주문 확인 및 배송 알림 이메일

## URLs
- **Development**: https://3000-ixwj00mlfnrm1vc3ab6ez-de59bda9.sandbox.novita.ai
- **GitHub**: (추후 추가 예정)
- **Production**: (Cloudflare Pages 배포 후 추가 예정)

## 데이터 아키텍처

### 데이터 모델
1. **Categories (카테고리)**
   - id, name, slug, description, created_at

2. **Products (상품)**
   - id, name, description, price, category_id, image_url, stock, created_at, updated_at

3. **Cart Items (장바구니 항목)**
   - id, session_id, product_id, quantity, created_at

4. **Orders (주문)**
   - id, order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, created_at, updated_at

5. **Order Items (주문 상품)**
   - id, order_id, product_id, product_name, product_price, quantity

### 스토리지 서비스
- **Cloudflare D1** - SQLite 기반 관계형 데이터베이스
  - 로컬 개발: `.wrangler/state/v3/d1` (자동 생성)
  - 프로덕션: Cloudflare D1 (배포 시 생성)

### 데이터 흐름
1. 사용자가 상품 페이지 방문 → API에서 상품 데이터 조회
2. 장바구니에 상품 추가 → 세션 ID로 장바구니 항목 저장
3. 주문 생성 → 주문 및 주문 항목 테이블에 데이터 저장
4. 장바구니 비우기 → 해당 세션의 장바구니 항목 삭제

## 사용자 가이드

### 쇼핑 방법
1. **상품 둘러보기**
   - 메인 페이지에서 "쇼핑 시작하기" 버튼 클릭
   - 카테고리 버튼으로 원하는 카테고리 필터링 (전체/의류/슈즈/액세서리)

2. **장바구니에 담기**
   - 원하는 상품의 "담기" 버튼 클릭
   - 헤더의 장바구니 아이콘에서 개수 확인

3. **장바구니 관리**
   - 헤더의 "장바구니" 클릭하여 장바구니 페이지 이동
   - +/- 버튼으로 수량 조절
   - 휴지통 아이콘으로 항목 삭제

4. **주문하기**
   - 장바구니 페이지에서 "주문하기" 버튼 클릭
   - 배송 정보 입력 (이름, 이메일, 전화번호, 주소)
   - "결제하기" 버튼으로 주문 완료

5. **주문 완료**
   - 주문 번호 확인
   - 이메일로 주문 확인서 발송 (구현 예정)

## 배포 상태
- **플랫폼**: Cloudflare Pages (예정)
- **상태**: 🔄 로컬 개발 중
- **기술 스택**: Hono + TypeScript + Tailwind CSS + Cloudflare D1
- **마지막 업데이트**: 2025-11-04

## 로컬 개발 실행 방법

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 테스트 데이터 추가
npm run db:seed

# 프로젝트 빌드
npm run build

# 개발 서버 시작
pm2 start ecosystem.config.cjs

# 서버 상태 확인
pm2 list

# 로그 확인
pm2 logs nada-shopping-mall --nostream
```

## 프로덕션 배포 (예정)

```bash
# Cloudflare 인증 설정
# setup_cloudflare_api_key 도구 사용

# D1 데이터베이스 생성
npx wrangler d1 create nada-production

# wrangler.jsonc에 database_id 업데이트

# 프로덕션 마이그레이션
npm run db:migrate:prod

# 배포
npm run deploy:prod
```

## 기술 스택
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Backend**: Hono (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages/Workers
- **Icons**: Font Awesome
- **HTTP Client**: Axios

## 라이선스
MIT License

## 문의
프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
