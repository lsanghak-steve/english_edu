-- ===================================================
-- 학생 고유 코드 체계 정립 및 DB 일괄 정제 (setup_student_id_code_system.sql)
-- [한 줄 요약]: users 테이블에 UNIQUE 중복방지 제약이 있는 student_id 컬럼을 추가하고, 기존 한글/구형 ID 데이터를 새 고유 코드로 일괄 변환 정제합니다.
-- ===================================================

-- 1. users 테이블에 student_id 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_id TEXT;

-- 2. 기존 3명 학생에게 절대로 중복되지 않는 고유 학생 코드 부여
UPDATE public.users SET student_id = 'lsh_20260807_000001' WHERE name = '이상학';
UPDATE public.users SET student_id = 'lsh_20260807_000002' WHERE name = '이승현';
UPDATE public.users SET student_id = 'lsm_20260807_000003' WHERE name = '이수민';

-- 3. student_id 컬럼에 UNIQUE (중복 방지) 제약 조건 부여
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_student_id_key;
ALTER TABLE public.users ADD CONSTRAINT users_student_id_key UNIQUE (student_id);

-- 4. study_records 테이블 기존 ID (한글 및 구형 ID) ➔ 새 고유 코드로 일괄 변환
UPDATE public.study_records SET student_id = 'lsh_20260807_000001' WHERE student_id IN ('이상학', 'sh_100');
UPDATE public.study_records SET student_id = 'lsh_20260807_000002' WHERE student_id IN ('이승현', 'sh_101');
UPDATE public.study_records SET student_id = 'lsm_20260807_000003' WHERE student_id IN ('이수민', 'sm_102');

-- 5. student_learned_words 테이블 기존 ID ➔ 새 고유 코드로 일괄 변환
UPDATE public.student_learned_words SET student_id = 'lsh_20260807_000001' WHERE student_id IN ('이상학', 'sh_100');
UPDATE public.student_learned_words SET student_id = 'lsh_20260807_000002' WHERE student_id IN ('이승현', 'sh_101');
UPDATE public.student_learned_words SET student_id = 'lsm_20260807_000003' WHERE student_id IN ('이수민', 'sm_102');

-- 6. wrong_words 테이블 기존 ID ➔ 새 고유 코드로 일괄 변환
UPDATE public.wrong_words SET student_id = 'lsh_20260807_000001' WHERE student_id IN ('이상학', 'sh_100');
UPDATE public.wrong_words SET student_id = 'lsh_20260807_000002' WHERE student_id IN ('이승현', 'sh_101');
UPDATE public.wrong_words SET student_id = 'lsm_20260807_000003' WHERE student_id IN ('이수민', 'sm_102');
