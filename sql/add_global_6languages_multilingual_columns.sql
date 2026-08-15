-- ==============================================================================
-- 🌐 Steve Voca 6대 글로벌 다국어 지원 DB 컬럼 일괄 추가 SQL
-- 언어: 한국어(ko), 중국어(zh), 프랑스어(fr), 일본어(ja), 베트남어(vi), 힌디어(hi)
-- ==============================================================================

-- 1. [words] 테이블: 학습 레벨(grade_level) 6개 국어 컬럼 추가
ALTER TABLE IF EXISTS public.words 
ADD COLUMN IF NOT EXISTS grade_level_ko TEXT,
ADD COLUMN IF NOT EXISTS grade_level_zh TEXT,
ADD COLUMN IF NOT EXISTS grade_level_fr TEXT,
ADD COLUMN IF NOT EXISTS grade_level_ja TEXT,
ADD COLUMN IF NOT EXISTS grade_level_vi TEXT,
ADD COLUMN IF NOT EXISTS grade_level_hi TEXT;

-- 2. [words] 테이블: 단어 뜻(meaning) & 예문 해석(example) 6개 국어 컬럼 추가
ALTER TABLE IF EXISTS public.words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS example_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS example_fr TEXT,
ADD COLUMN IF NOT EXISTS meaning_ja TEXT,
ADD COLUMN IF NOT EXISTS example_ja TEXT,
ADD COLUMN IF NOT EXISTS meaning_vi TEXT,
ADD COLUMN IF NOT EXISTS example_vi TEXT,
ADD COLUMN IF NOT EXISTS meaning_hi TEXT,
ADD COLUMN IF NOT EXISTS example_hi TEXT;

-- 3. [wrong_words] 오답노트 테이블 다국어 컬럼 추가
ALTER TABLE IF EXISTS public.wrong_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS meaning_ja TEXT,
ADD COLUMN IF NOT EXISTS meaning_vi TEXT,
ADD COLUMN IF NOT EXISTS meaning_hi TEXT;

-- 4. [student_wrong_answers] 신규 오답 테이블 다국어 컬럼 추가 (존재 시)
ALTER TABLE IF EXISTS public.student_wrong_answers 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS meaning_ja TEXT,
ADD COLUMN IF NOT EXISTS meaning_vi TEXT,
ADD COLUMN IF NOT EXISTS meaning_hi TEXT;

-- 5. [student_learned_words] 암기 완료 단어 테이블 다국어 컬럼 추가 (존재 시)
ALTER TABLE IF EXISTS public.student_learned_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS meaning_ja TEXT,
ADD COLUMN IF NOT EXISTS meaning_vi TEXT,
ADD COLUMN IF NOT EXISTS meaning_hi TEXT;

-- 6. ⚡ Supabase REST API 스키마 캐시 즉시 리로드
NOTIFY pgrst, 'reload schema';
