-- 1. public.words 테이블에 중국어 뜻(meaning_zh) 및 중국어 예문(example_zh) 컬럼 추가
ALTER TABLE public.words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT,
ADD COLUMN IF NOT EXISTS example_zh TEXT;

-- 2. 학생 오답노트 테이블에도 중국어 지원 컬럼 추가
ALTER TABLE public.wrong_words 
ADD COLUMN IF NOT EXISTS meaning_zh TEXT;

-- 3. 주석 (Description)
COMMENT ON COLUMN public.words.meaning_zh IS '중국어 단어 뜻 (Meaning ZH-CN)';
COMMENT ON COLUMN public.words.example_zh IS '중국어 예문 해석 (Example ZH-CN)';
