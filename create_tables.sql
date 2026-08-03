-- 1. 전체 단어 데이터 보관함 (words)
CREATE TABLE IF NOT EXISTS public.words (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    phonics TEXT,
    meaning TEXT NOT NULL,
    category TEXT,
    example_en TEXT,
    example_ko TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 학생 회원 프로필 보관함 (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1111',
    daily_word_count INT DEFAULT 10,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 출석 달력 & 참잘했어요 도장 보관함 (study_records)
CREATE TABLE IF NOT EXISTS public.study_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    study_date DATE NOT NULL,
    is_stamped BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 학생 오답노트 보관함 (wrong_words)
CREATE TABLE IF NOT EXISTS public.wrong_words (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    word TEXT NOT NULL,
    phonics TEXT,
    meaning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 학생 발음 녹음 보관함 (audio_records)
CREATE TABLE IF NOT EXISTS public.audio_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    word TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 보안 접근 권한 설정
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to words" ON public.words FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to words" ON public.words FOR INSERT WITH CHECK (true);
