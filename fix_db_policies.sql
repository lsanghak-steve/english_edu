-- ===================================================
-- Supabase 데이터베이스 모든 보관함 보안 차단 해제 및 접근 권한 열기 (fix_db_policies.sql)
-- [한 줄 요약]: study_records(출석), wrong_words(오답노트), users(학생) 보관함에 앱이 데이터를 읽고 쓸 수 있도록 RLS 보안 정책을 모두 허용합니다.
-- ===================================================

-- 1. 출석 달력 보관함 (study_records) 테이블 생성 및 RLS 보안 해제
CREATE TABLE IF NOT EXISTS public.study_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    study_date DATE NOT NULL,
    is_stamped BOOLEAN DEFAULT TRUE,
    stamped_words JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to study_records" ON public.study_records;
CREATE POLICY "Allow all access to study_records" ON public.study_records FOR ALL USING (true) WITH CHECK (true);

-- 2. 학생 오답노트 보관함 (wrong_words) 테이블 생성 및 RLS 보안 해제
CREATE TABLE IF NOT EXISTS public.wrong_words (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    word TEXT NOT NULL,
    phonics TEXT,
    meaning TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.wrong_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to wrong_words" ON public.wrong_words;
CREATE POLICY "Allow all access to wrong_words" ON public.wrong_words FOR ALL USING (true) WITH CHECK (true);

-- 3. 학생 회원 프로필 보관함 (users) RLS 보안 해제
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. 전체 단어 보관함 (words) RLS 보안 해제 보장
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to words" ON public.words;
CREATE POLICY "Allow all access to words" ON public.words FOR ALL USING (true) WITH CHECK (true);
