-- ===================================================
-- Supabase words 테이블에 학교 등급(초등/중등/고등) 구분 컬럼 추가 (add_grade_level_column_to_words.sql)
-- ===================================================

-- 1. public.words 테이블에 grade_level 컬럼 추가 (기본값: '초등단어')
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS grade_level TEXT DEFAULT '초등단어';

-- 2. 기존 중학교 단어 (ID 1000 이상 또는 category에 '중등' 포함) ➔ '중등단어'로 일괄 설정
UPDATE public.words SET grade_level = '중등단어' WHERE category LIKE '%중등%' OR id >= 1000;

-- 3. 초등학교 단어 (ID 1000 미만) ➔ '초등단어'로 일괄 설정
UPDATE public.words SET grade_level = '초등단어' WHERE grade_level IS NULL OR grade_level = '' OR (id < 1000 AND category NOT LIKE '%중등%');
