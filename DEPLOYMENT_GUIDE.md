# NADA FASHION 배포 가이드

## 🚀 빠른 배포 체크리스트

### 1️⃣ GitHub 백업 (5분)
- [ ] #github 탭에서 GitHub 권한 설정
- [ ] 저장소 선택 또는 생성
- [ ] 코드 푸시 실행

### 2️⃣ Cloudflare Pages 배포 (10분)
- [ ] Deploy 탭에서 Cloudflare API 키 입력
- [ ] D1 데이터베이스 생성
- [ ] 프로덕션 마이그레이션
- [ ] Pages 배포

### 3️⃣ 도메인 연결 (5분)
- [ ] Cloudflare에 도메인 추가
- [ ] DNS 설정
- [ ] Pages 프로젝트에 도메인 연결

---

## 📋 상세 배포 절차

### Step 1: GitHub 설정 및 백업

#### 1-1. GitHub 권한 설정
1. 좌측 사이드바에서 **#github 탭** 클릭
2. "GitHub 연동" 버튼 클릭
3. GitHub 계정으로 로그인
4. 권한 승인

#### 1-2. 저장소 설정
**옵션 A: 기존 저장소 사용 (권장)**
```bash
# 이미 선택된 저장소가 있다면 사용
```

**옵션 B: 새 저장소 생성**
```bash
# GitHub에서 "nada-shopping-mall" 저장소 생성
```

#### 1-3. 코드 푸시
설정 완료 후 AI에게 "GitHub 푸시 진행해주세요" 요청

---

### Step 2: Cloudflare API 키 설정

#### 2-1. Cloudflare API 토큰 생성

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com/profile/api-tokens

2. **"Create Token" 클릭**

3. **"Edit Cloudflare Workers" 템플릿 선택**

4. **권한 설정**
   - Account / Cloudflare Pages / Edit
   - Account / D1 / Edit
   - Zone / DNS / Edit (도메인용)

5. **토큰 생성 및 복사**

#### 2-2. API 키 저장

1. 좌측 사이드바에서 **Deploy 탭** 클릭
2. "Cloudflare API Token" 입력란에 토큰 붙여넣기
3. "Save" 클릭

설정 완료 후 AI에게 "Cloudflare 배포 진행해주세요" 요청

---

### Step 3: Cloudflare Pages 자동 배포

AI가 자동으로 수행하는 작업:

```bash
# 1. D1 데이터베이스 생성
npx wrangler d1 create nada-production

# 2. database_id를 wrangler.jsonc에 자동 업데이트

# 3. 프로덕션 마이그레이션
npx wrangler d1 migrations apply nada-production
npx wrangler d1 execute nada-production --file=./seed.sql
npx wrangler d1 execute nada-production --file=./seed_options.sql

# 4. Pages 프로젝트 생성
npx wrangler pages project create nada-shopping-mall --production-branch main

# 5. 빌드 및 배포
npm run build
npx wrangler pages deploy dist --project-name nada-shopping-mall
```

배포 완료 후 URL: `https://<random-id>.nada-shopping-mall.pages.dev`

---

### Step 4: 도메인 연결 (www.na-da.co.kr)

#### 4-1. Cloudflare에 도메인 추가

**옵션 A: 도메인이 이미 Cloudflare에 있는 경우**
- 다음 단계로 진행

**옵션 B: 도메인을 Cloudflare로 이전**
1. Cloudflare 대시보드에서 "Add a Site" 클릭
2. `na-da.co.kr` 입력
3. Free 플랜 선택
4. 네임서버 정보 확인
5. 도메인 등록업체(가비아, 호스팅케이알 등)에서 네임서버 변경
   ```
   네임서버 1: ns1.cloudflare.com
   네임서버 2: ns2.cloudflare.com
   ```
6. DNS 전파 대기 (최대 24시간, 보통 몇 분)

#### 4-2. DNS 레코드 설정

Cloudflare DNS 설정에서:

1. **CNAME 레코드 추가**
   ```
   Type: CNAME
   Name: www
   Target: nada-shopping-mall.pages.dev
   Proxy status: Proxied (오렌지 클라우드)
   ```

2. **루트 도메인 리다이렉트 (선택)**
   ```
   Type: CNAME
   Name: @
   Target: nada-shopping-mall.pages.dev
   Proxy status: Proxied
   ```

#### 4-3. Pages 프로젝트에 도메인 연결

**방법 1: Wrangler CLI (AI가 자동 실행)**
```bash
npx wrangler pages domain add www.na-da.co.kr --project-name nada-shopping-mall
```

**방법 2: Cloudflare 대시보드 (수동)**
1. Cloudflare 대시보드 → Workers & Pages
2. "nada-shopping-mall" 프로젝트 선택
3. "Custom domains" 탭
4. "Set up a custom domain" 클릭
5. `www.na-da.co.kr` 입력
6. "Activate domain" 클릭

#### 4-4. SSL/TLS 설정

1. Cloudflare 대시보드 → SSL/TLS
2. 암호화 모드: **Full** 또는 **Full (strict)** 선택
3. 자동 HTTPS 재작성 활성화
4. Always Use HTTPS 활성화

---

## ✅ 배포 완료 확인

### 체크리스트
- [ ] GitHub에 코드 푸시 완료
- [ ] Cloudflare Pages 배포 성공
- [ ] D1 데이터베이스 생성 및 마이그레이션 완료
- [ ] 배포 URL 접속 가능
- [ ] www.na-da.co.kr 접속 가능
- [ ] HTTPS 인증서 정상 작동
- [ ] 관리자 로그인 테스트 (admin@nadafashion.com / admin123)
- [ ] 상품 구매 플로우 테스트
- [ ] 모바일 반응형 확인

### 접속 URL
- **Cloudflare Pages**: https://<random-id>.nada-shopping-mall.pages.dev
- **커스텀 도메인**: https://www.na-da.co.kr
- **루트 도메인**: https://na-da.co.kr (선택)

---

## 🔧 환경 변수 설정 (선택사항)

### Toss Payments 실제 API 키 (프로덕션)

```bash
# Toss Payments Secret Key 설정
npx wrangler pages secret put TOSS_SECRET_KEY --project-name nada-shopping-mall

# JWT Secret Key 설정
npx wrangler pages secret put JWT_SECRET --project-name nada-shopping-mall
```

현재는 테스트 키를 사용 중이므로, 실제 서비스 시작 전에 반드시 실제 API 키로 변경하세요.

---

## 🎯 배포 후 작업

### 1. 모니터링 설정
- Cloudflare Analytics 활성화
- Google Analytics 설치 (선택)
- Sentry 에러 추적 설치 (선택)

### 2. SEO 설정
- Google Search Console 등록
- 사이트맵 제출
- robots.txt 확인

### 3. 보안 강화
- 비밀번호 정책 강화
- Rate Limiting 설정
- WAF 규칙 설정

### 4. 성능 최적화
- 캐싱 규칙 설정
- 이미지 최적화
- CDN 설정 확인

---

## 🚨 문제 해결

### 배포 실패 시

```bash
# 로그 확인
npx wrangler pages deployment list --project-name nada-shopping-mall

# 빌드 재시도
npm run build
npx wrangler pages deploy dist --project-name nada-shopping-mall
```

### 도메인 연결 안 될 때
1. DNS 전파 확인: https://dnschecker.org
2. Cloudflare DNS 설정 재확인
3. SSL/TLS 모드 확인
4. 캐시 삭제 후 재접속

### 데이터베이스 오류
```bash
# 로컬 데이터베이스 리셋
npm run db:reset

# 프로덕션 마이그레이션 재실행
npm run db:migrate:prod
```

---

## 📞 지원

배포 중 문제가 발생하면:
1. Cloudflare 대시보드 로그 확인
2. Wrangler 로그 확인
3. GitHub Actions 로그 확인 (CI/CD 설정 시)

---

**작성일**: 2025-11-05
**버전**: 1.0

이 가이드를 따라 배포를 진행해주세요!
