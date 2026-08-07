# 🐬 Orca 전용 프로젝트 완벽 인수인계 가이드 (ORCA_HANDOVER.md) 📖

> **한 줄 요약**: Orca 및 다른 AI 에이전트가 본 프로젝트를 곧바로 이어서 개발할 수 있도록 소스코드 이중 디렉토리 구조, 클라우드 DB 테이블 정보, 주요 계정, 배포 설정 및 다음 작업 지침을 정리한 인수인계서입니다.

---

## 📌 1. 프로젝트 개요 & 기술 스택

- **프로젝트명**: 초등/중학/고등/수능 필수 영단어 500 학습 교육 웹 플랫폼
- **주요 스택**: Next.js 14 (App Router), Vanilla CSS, Supabase Cloud DB, GitHub
- **GitHub 저장소**: `https://github.com/lsanghak-steve/english_edu.git` (`main` 브랜치)
- **배포 주소**: Vercel 프로덕션 배포

---

## ⚠️ 2. 개발 시 반드시 지켜야 할 이중 소스 트리 규칙 (CRITICAL)

본 프로젝트는 아래 2개 디렉토리가 함께 공존합니다. **파일을 수정하거나 생성할 때 2개 경로에 동일하게 코드를 써주어야 컴파일 및 배포가 오류 없이 동작합니다.**

1. **루트 디렉토리**: `app/` (예: `app/page.js`, `app/components/...`)
2. **Next.js 구동 디렉토리**: `next_app/app/` (예: `next_app/app/page.js`, `next_app/app/components/...`)

> 💡 **Orca 개발 팁**: `app/components/StudentLoginPage.js`를 수정했다면 `next_app/app/components/StudentLoginPage.js`도 반드시 똑같이 업데이트해 주세요.

---

## 🗄️ 3. Supabase 클라우드 데이터베이스 연동 정보

- **Supabase URL**: `https://sqonhhqosyszncjfoxfd.supabase.co`
- **Supabase Anon Key**: `sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo` (`lib/supabaseClient.js`에 폴백 내장)

### 📊 데이터베이스 주요 테이블 구조

1. **`student_profiles` (학생/학부모 회원 정보)**
   - `id` (PK, string), `name` (string), `grade` (string), `daily_word_count` (string), `student_pin` (string), `parent_name` (string), `parent_phone` (string), `parent_pin` (string), `reward_points` (number)
2. **`student_attendance` (출석 도장 및 학습 단어)**
   - `id` (PK), `user_id` (string), `stamped_date` (YYYY-MM-DD), `stamped_words` (json/array)
3. **`student_wrong_answers` (퀴즈 오답노트 단어장)**
   - `id` (PK), `user_id` (string), `word` (string), `meaning` (string), `phonics` (string)
4. **`student_feedback` (학부모 칭찬 알림장)**
   - `id` (PK), `user_id` (string), `student_name` (string), `message` (string), `created_at` (timestamp)
5. **`center_notices` (센터 공지사항)**
   - `id` (PK), `title` (string), `content` (string), `is_active` (boolean)
6. **`words` (534개 영단어 DB)**
   - `id` (PK), `word` (string), `phonics` (string), `meaning` (string), `category` (string), `grade_level` (초등 필수 / 중학 필수 / 고등 필수 / 수능 핵심), `example_en` (string), `example_ko` (string)

---

## 🔑 4. 주요 기본 테스트 계정 정보

- **학생/학부모 1 (이상학)**: 학생 PIN `0815` | 학부모 PIN `0815` | 연락처 `010-4006-9050`
- **학생/학부모 2 (이승현 - 초등 5학년)**: 학생 PIN `0418` | 학부모 PIN `0815` | 연락처 `010-4006-9050` | 8/3, 8/4, 8/5 3회 완수
- **학생/학부모 3 (이수민 - 초등 3학년)**: 학생 PIN `0809` | 학부모 PIN `0815` | 연락처 `010-4006-9050` | 8/4, 8/5 2회 완수

> 💡 **이모지 규칙**: 모든 학생/학부모 이름 처리 시 `removeEmoji()` 헬퍼 함수를 통과시켜 이름에서 이모지가 기호화되거나 깨지지 않도록 하세요.

---

## 🚀 5. 로컬 실행 및 Git 커밋 방법

### 1) 개발 서버 구동
```bash
cd next_app
npm run dev
```
- 접속 주소: `http://localhost:3000` (메인 화면) 및 `http://localhost:3000/admin` (관리자 센터)

### 2) Git 커밋 & 푸시
```bash
git add app next_app DOCS_FEATURES.md ORCA_HANDOVER.md
git commit -m "Feat: Update features and sync handover docs"
git push origin main
```

---

## 📑 6. Orca가 이어서 진행 가능한 추천 후속 작업 (Next Tasks)

1. **중학/고등/수능 단어 엑셀 엑스포트 및 대량 등록 보강**
2. **학생 퀴즈 결과 분석 리포트 그래프 UI 개선**
3. **학부모 화면 알림장 실시간 수신 팝업 추가**

---
*작성일자: 2026년 8월 7일 | 버전: v2.5 Orca Handover Spec*
