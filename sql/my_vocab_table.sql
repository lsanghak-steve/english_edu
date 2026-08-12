-- 나만의 개인 단어장 보관함 (my_vocab)
CREATE TABLE IF NOT EXISTS public.my_vocab (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    word TEXT NOT NULL,
    phonics TEXT,
    meaning TEXT NOT NULL,
    folder TEXT DEFAULT '중요 단어',
    memo TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 보안 접근 권한 설정
ALTER TABLE public.my_vocab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access to my_vocab" ON public.my_vocab FOR ALL USING (true);
