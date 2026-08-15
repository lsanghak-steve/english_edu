-- ==============================================================================
-- 🌐 Steve Voca 다국어 (중국어 / 프랑스어) DB 컬럼 추가 및 스키마 캐시 갱신 SQL
-- ==============================================================================

-- 1. [words] 단어 메인 테이블에 중국어 및 프랑스어 컬럼 추가
ALTER TABLE public.words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS example_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS example_fr TEXT;

-- 2. [wrong_words] 학생 오답노트 테이블에 다국어 컬럼 추가
ALTER TABLE public.wrong_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS meaning_fr TEXT;

-- 3. [student_wrong_answers] 신규 오답노트 테이블이 있는 경우 다국어 컬럼 추가
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_wrong_answers') THEN
    ALTER TABLE public.student_wrong_answers 
    ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
    ADD COLUMN IF NOT EXISTS meaning_fr TEXT;
  END IF;
END $$;

-- 4. [student_learned_words] 암기 완료 단어 보관함 테이블 다국어 지원
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_learned_words') THEN
    ALTER TABLE public.student_learned_words 
    ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
    ADD COLUMN IF NOT EXISTS meaning_fr TEXT;
  END IF;
END $$;

-- 5. 컬럼 주석(Comment) 추가
COMMENT ON COLUMN public.words.meaning_zh IS '중국어 단어 뜻 (Meaning ZH-CN)';
COMMENT ON COLUMN public.words.example_zh IS '중국어 예문 해석 (Example ZH-CN)';
COMMENT ON COLUMN public.words.meaning_fr IS '프랑스어 단어 뜻 (Meaning FR)';
COMMENT ON COLUMN public.words.example_fr IS '프랑스어 예문 해석 (Example FR)';

-- 6. ⚡ Supabase REST API 스키마 캐시 즉시 리로드 (PGRST204 오류 방지)
NOTIFY pgrst, 'reload schema';
