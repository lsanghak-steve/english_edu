-- 1. public.words 테이블에 프랑스어 뜻(meaning_fr) 및 프랑스어 예문(example_fr) 컬럼 추가
ALTER TABLE public.words 
ADD COLUMN IF NOT EXISTS meaning_fr TEXT,
ADD COLUMN IF NOT EXISTS example_fr TEXT;

-- 2. 학생 오답노트 테이블에도 프랑스어 지원 컬럼 추가
ALTER TABLE public.wrong_words 
ADD COLUMN IF NOT EXISTS meaning_fr TEXT;

-- 3. 주석 (Description)
COMMENT ON COLUMN public.words.meaning_fr IS '프랑스어 단어 뜻 (Meaning FR)';
COMMENT ON COLUMN public.words.example_fr IS '프랑스어 예문 해석 (Example FR)';
