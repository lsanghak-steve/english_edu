-- ===================================================
-- 기존 학생 정보 및 이전 학습 출석 도장 데이터 일괄 등록 (seed_initial_data.sql)
-- [한 줄 요약]: 이상학, 이승현, 이수민 학생의 회원 정보와 이전 학습 출석 도장 기록(8/3~8/5)을 Supabase 데이터베이스에 등록합니다.
-- ===================================================

-- 1. 학생 회원 프로필 데이터 등록 (users)
INSERT INTO public.users (id, name, pin, daily_word_count)
VALUES 
    ('sh_100', '이상학', '1111', 10),
    ('sh_101', '이승현', '1111', 10),
    ('sm_102', '이수민', '1111', 10)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, pin = EXCLUDED.pin, daily_word_count = EXCLUDED.daily_word_count;

-- 2. 기존 출석 도장 학습 기록 등록 (study_records)
-- (1) 이상학 (2026-08-03, 2026-08-05)
INSERT INTO public.study_records (student_id, study_date, is_stamped)
VALUES 
    ('sh_100', '2026-08-03', true),
    ('이상학', '2026-08-03', true),
    ('sh_100', '2026-08-05', true),
    ('이상학', '2026-08-05', true)
ON CONFLICT DO NOTHING;

-- (2) 이승현 (2026-08-03, 2026-08-04, 2026-08-05)
INSERT INTO public.study_records (student_id, study_date, is_stamped)
VALUES 
    ('sh_101', '2026-08-03', true),
    ('이승현', '2026-08-03', true),
    ('sh_101', '2026-08-04', true),
    ('이승현', '2026-08-04', true),
    ('sh_101', '2026-08-05', true),
    ('이승현', '2026-08-05', true)
ON CONFLICT DO NOTHING;

-- (3) 이수민 (2026-08-04, 2026-08-05)
INSERT INTO public.study_records (student_id, study_date, is_stamped)
VALUES 
    ('sm_102', '2026-08-04', true),
    ('이수민', '2026-08-04', true),
    ('sm_102', '2026-08-05', true),
    ('이수민', '2026-08-05', true)
ON CONFLICT DO NOTHING;
