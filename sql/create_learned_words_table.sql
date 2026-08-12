-- ===================================================
-- 학생별 외운 단어 보관함 생성 및 보안 해제 (create_learned_words_table.sql)
-- [한 줄 요약]: 외운 단어를 학생별로 누적 보관하여 다음 학습 시 자동으로 제외할 수 있도록 Supabase DB 테이블을 생성하고 보안 차단을 해제합니다.
-- ===================================================

CREATE TABLE IF NOT EXISTS public.student_learned_words (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    word TEXT NOT NULL,
    meaning TEXT,
    learned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.student_learned_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to student_learned_words" ON public.student_learned_words;
CREATE POLICY "Allow all access to student_learned_words" ON public.student_learned_words FOR ALL USING (true) WITH CHECK (true);
