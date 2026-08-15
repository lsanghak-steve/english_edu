-- ==============================================================================
-- 🌐 Steve Voca 다국어 (중국어 / 프랑스어) DB 컬럼 추가 (표준 SQL 단일 구문)
-- ==============================================================================

-- 1. [words] 단어 메인 테이블에 중국어/프랑스어 컬럼 추가
ALTER TABLE IF EXISTS public.words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS example_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS example_fr TEXT;

-- 2. [wrong_words] 학생 오답노트 테이블 다국어 컬럼 추가
ALTER TABLE IF EXISTS public.wrong_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT;

-- 3. [student_wrong_answers] 신규 오답노트 테이블 다국어 컬럼 추가
ALTER TABLE IF EXISTS public.student_wrong_answers 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT;

-- 4. [student_learned_words] 암기 완료 단어 보관함 테이블 다국어 컬럼 추가
ALTER TABLE IF EXISTS public.student_learned_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT;

-- 5. ⚡ Supabase REST API 스키마 캐시 즉시 갱신
NOTIFY pgrst, 'reload schema';
