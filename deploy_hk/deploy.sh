#!/bin/bash
# ===================================================
# 🇨🇳 Steve Voca - Hong Kong Server One-Click Deploy
# ===================================================

set -e

echo "=================================================="
echo "🚀 [Steve Voca] 홍콩 서버 원클릭 배포를 시작합니다..."
echo "=================================================="

# 1. Check .env file
if [ ! -f ".env.production.hk" ]; then
    echo "⚠️ .env.production.hk 파일이 없습니다. 템플릿에서 복사합니다."
    cp .env.production.hk.example .env.production.hk
fi

# 2. Pull latest git changes (if git repo)
if [ -d "../.git" ]; then
    echo "📥 최신 소스코드 동기화 중..."
    git pull origin main
fi

# 3. Docker build & up
echo "🔨 도커 컨테이너 빌드 및 백그라운드 구동 중..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "=================================================="
echo "🎉 [배포 완료] Steve Voca가 정상 가동 중입니다!"
echo "🌐 접속 확인: http://localhost (또는 서버 공인 IP)"
echo "📋 로그 확인: docker compose logs -f"
echo "=================================================="
