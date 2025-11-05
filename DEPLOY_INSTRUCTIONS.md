# 🚀 NADA FASHION 쇼핑몰 배포 안내

## ✅ 완료된 작업

1. **GitHub 백업 완료** ✅
   - Repository: https://github.com/thelab-bobkim/tvingM
   - Branch: main
   - 모든 코드 푸시 완료

2. **배포 준비 완료** ✅
   - 프로젝트 빌드 완료
   - 배포 스크립트 생성
   - 문서 작성 완료

---

## 🔧 Cloudflare 배포 (수동 진행 필요)

### 사전 준비
Cloudflare API 키가 필요합니다. 아래 단계를 따라주세요.

### Step 1: Cloudflare API 키 발급

1. **Cloudflare 로그인**
   - https://dash.cloudflare.com

2. **API 토큰 생성**
   - 프로필 → API Tokens: https://dash.cloudflare.com/profile/api-tokens
   - "Create Token" 클릭
   - "Edit Cloudflare Workers" 템플릿 선택

3. **권한 설정**
   ```
   ✅ Account / Cloudflare Pages / Edit
   ✅ Account / D1 / Edit
   ✅ Zone / DNS / Edit (도메인 연결용)
   ```

4. **토큰 복사**
   - "Create Token" 클릭
   - 토큰 복사 (⚠️ 한 번만 표시됨!)

5. **환경 변수 설정**
   ```bash
   export CLOUDFLARE_API_TOKEN="your-api-token-here"
   ```

---

### Step 2: D1 데이터베이스 생성

```bash
cd /home/user/webapp

# D1 데이터베이스 생성
npx wrangler d1 create nada-production
```

**출력 예시:**
```
✅ Successfully created DB 'nada-production'

[[d1_databases]]
binding = "DB"
database_name = "nada-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 이 ID를 복사!
```

**중요:** `database_id`를 복사하여 `wrangler.jsonc` 파일에 업데이트하세요.

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "nada-production",
      "database_id": "여기에-복사한-database_id-붙여넣기"
    }
  ]
}
```

---

### Step 3: 프로덕션 마이그레이션

```bash
# 마이그레이션 실행
npm run db:migrate:prod

# 기본 데이터 추가
npx wrangler d1 execute nada-production --file=./seed.sql

# 상품 옵션 데이터 추가
npx wrangler d1 execute nada-production --file=./seed_options.sql
```

---

### Step 4: Pages 프로젝트 생성

```bash
# Pages 프로젝트 생성
npx wrangler pages project create nada-shopping-mall --production-branch main
```

---

### Step 5: 배포

```bash
# 빌드 (이미 완료됨)
npm run build

# 배포
npx wrangler pages deploy dist --project-name nada-shopping-mall
```

**배포 완료 후 URL이 표시됩니다:**
```
✨ Deployment complete!
🌎 https://xxxxxxxx.nada-shopping-mall.pages.dev
```

---

### Step 6: 도메인 연결 (www.na-da.co.kr)

#### 6-1. Cloudflare에 도메인 추가 (이미 있다면 생략)

1. Cloudflare 대시보드에서 "Add a Site" 클릭
2. `na-da.co.kr` 입력
3. Free 플랜 선택
4. 네임서버 정보 확인 및 도메인 등록업체에서 변경

#### 6-2. DNS 레코드 추가

Cloudflare DNS 설정:

```
Type: CNAME
Name: www
Target: nada-shopping-mall.pages.dev
Proxy: Proxied (오렌지 클라우드)
```

#### 6-3. Pages에 도메인 연결

```bash
npx wrangler pages domain add www.na-da.co.kr --project-name nada-shopping-mall
```

또는 Cloudflare 대시보드에서:
1. Workers & Pages → nada-shopping-mall
2. Custom domains → Set up a custom domain
3. `www.na-da.co.kr` 입력
4. Activate domain

---

### Step 7: SSL/TLS 설정

Cloudflare 대시보드 → SSL/TLS:
- 암호화 모드: **Full** 선택
- Always Use HTTPS: **활성화**
- Automatic HTTPS Rewrites: **활성화**

---

## 🎯 최종 확인

배포 완료 후 다음을 확인하세요:

### 접속 테스트
- ✅ https://nada-shopping-mall.pages.dev (Cloudflare URL)
- ✅ https://www.na-da.co.kr (커스텀 도메인)
- ✅ HTTPS 인증서 정상
- ✅ 관리자 로그인 (admin@nadafashion.com / admin123)
- ✅ 상품 목록 로드
- ✅ 장바구니 추가
- ✅ 결제 테스트

### 기능 테스트
```bash
# API 테스트
curl https://www.na-da.co.kr/api/products
curl https://www.na-da.co.kr/api/categories

# 상태 확인
npx wrangler pages deployment list --project-name nada-shopping-mall
```

---

## 🔐 환경 변수 설정 (선택)

실제 결제를 위해 Toss Payments 실제 키 설정:

```bash
# Toss Payments Secret Key
npx wrangler pages secret put TOSS_SECRET_KEY --project-name nada-shopping-mall

# JWT Secret Key
npx wrangler pages secret put JWT_SECRET --project-name nada-shopping-mall
```

---

## 🚨 문제 해결

### 배포 실패 시
```bash
# 로그 확인
npx wrangler pages deployment list --project-name nada-shopping-mall

# 재배포
npm run build
npx wrangler pages deploy dist --project-name nada-shopping-mall
```

### 도메인 연결 안 될 때
1. DNS 전파 확인: https://dnschecker.org/?domain=www.na-da.co.kr
2. Cloudflare DNS 설정 재확인
3. 캐시 삭제 후 재접속 (Ctrl + Shift + R)

### 데이터베이스 오류
```bash
# 마이그레이션 재실행
npm run db:migrate:prod

# 데이터 재추가
npx wrangler d1 execute nada-production --file=./seed.sql
```

---

## 📞 지원

문제 발생 시:
1. Cloudflare 대시보드 로그 확인
2. `npx wrangler tail nada-shopping-mall` 실시간 로그 확인
3. GitHub Issues: https://github.com/thelab-bobkim/tvingM/issues

---

## 📋 요약

현재 상태:
- ✅ GitHub 백업 완료
- ✅ 프로젝트 빌드 완료
- ⏳ Cloudflare API 키 설정 필요
- ⏳ D1 데이터베이스 생성 필요
- ⏳ Pages 배포 필요
- ⏳ 도메인 연결 필요

**다음 단계:** 위의 Step 1부터 순서대로 진행하세요!

배포 완료까지 약 10-15분 소요됩니다.

---

**작성일**: 2025-11-05
**프로젝트**: NADA FASHION v2.0
**도메인**: www.na-da.co.kr
