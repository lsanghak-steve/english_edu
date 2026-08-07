-- ===================================================
-- 발음 녹음 보관함 (audio_records) 보안 해제 및 초기 시드 데이터 채우기 (seed_audio_records.sql)
-- [한 줄 요약]: audio_records 테이블의 RLS 보안을 해제하고, 학생별 대표 발음 녹음 데이터를 DB에 일괄 등록합니다.
-- ===================================================

-- 1. audio_records 테이블 보안 차단 해제
ALTER TABLE public.audio_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to audio_records" ON public.audio_records;
CREATE POLICY "Allow all access to audio_records" ON public.audio_records FOR ALL USING (true) WITH CHECK (true);

-- 2. 학생별 녹음 데이터 시드 채우기
INSERT INTO public.audio_records (student_id, word, audio_url)
VALUES 
    -- 이상학 (lsh_20260807_000001)
    ('lsh_20260807_000001', 'Apple', 'recorded_sample_01.webm'),
    ('lsh_20260807_000001', 'Banana', 'recorded_sample_02.webm'),
    ('lsh_20260807_000001', 'Cat', 'recorded_sample_03.webm'),
    ('lsh_20260807_000001', 'Dog', 'recorded_sample_04.webm'),

    -- 이수민 (lsm_20260807_000003)
    ('lsm_20260807_000003', 'Apple', 'recorded_sample_05.webm'),
    ('lsm_20260807_000003', 'Banana', 'recorded_sample_06.webm'),
    ('lsm_20260807_000003', 'Water', 'recorded_sample_07.webm'),

    -- 이승현 (lsh_20260807_000002)
    ('lsh_20260807_000002', 'Apple', 'recorded_sample_08.webm'),
    ('lsh_20260807_000002', 'Cat', 'recorded_sample_09.webm'),
    ('lsh_20260807_000002', 'Tree', 'recorded_sample_10.webm')
ON CONFLICT DO NOTHING;
