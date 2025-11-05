#!/bin/bash

# NADA FASHION 쇼핑몰 배포 스크립트
# www.na-da.co.kr

set -e  # 에러 발생 시 중단

echo "🚀 NADA FASHION 쇼핑몰 배포 시작..."
echo "📦 프로젝트: nada-shopping-mall"
echo "🌐 도메인: www.na-da.co.kr"
echo ""

# 1. 빌드
echo "📦 Step 1/6: 프로젝트 빌드 중..."
npm run build
echo "✅ 빌드 완료"
echo ""

# 2. D1 데이터베이스 생성
echo "💾 Step 2/6: D1 데이터베이스 생성 중..."
echo "명령어: npx wrangler d1 create nada-production"
echo "⚠️  주의: database_id를 복사하여 wrangler.jsonc에 수동으로 업데이트하세요"
echo ""

# 3. 마이그레이션 실행 (database_id 업데이트 후)
echo "🔄 Step 3/6: 프로덕션 마이그레이션 준비..."
echo "명령어: npm run db:migrate:prod"
echo ""

# 4. 테스트 데이터 추가
echo "📝 Step 4/6: 테스트 데이터 준비..."
echo "명령어: npx wrangler d1 execute nada-production --file=./seed.sql"
echo "명령어: npx wrangler d1 execute nada-production --file=./seed_options.sql"
echo ""

# 5. Pages 프로젝트 생성
echo "🏗️  Step 5/6: Pages 프로젝트 생성 준비..."
echo "명령어: npx wrangler pages project create nada-shopping-mall --production-branch main"
echo ""

# 6. 배포
echo "🚀 Step 6/6: Cloudflare Pages 배포 준비..."
echo "명령어: npx wrangler pages deploy dist --project-name nada-shopping-mall"
echo ""

# 7. 도메인 연결
echo "🌐 Step 7 (선택): 도메인 연결 준비..."
echo "명령어: npx wrangler pages domain add www.na-da.co.kr --project-name nada-shopping-mall"
echo ""

echo "✅ 배포 스크립트 준비 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Cloudflare API 키를 Deploy 탭에서 설정"
echo "2. 위의 명령어들을 순서대로 실행"
echo "3. database_id를 wrangler.jsonc에 업데이트"
echo "4. DNS 설정 (www.na-da.co.kr → nada-shopping-mall.pages.dev)"
echo ""
