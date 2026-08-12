-- ===================================================
-- Supabase users 테이블에 학습할 단어 레벨(study_grade_level) 컬럼 추가 SQL
-- ===================================================

-- 1. public.users 테이블에 study_grade_level 컬럼 추가 (기본값: '초등단어')
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS study_grade_level TEXT DEFAULT '초등단어';

-- 2. 중학생 회원 ➔ '중등단어' 기본값 설정
UPDATE public.users SET study_grade_level = '중등단어' WHERE avatar LIKE '%중등%' OR avatar LIKE '%중학생%';
