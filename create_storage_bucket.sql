-- ===================================================
-- Supabase Storage 오디오 파일 창고(audio-recordings) 생성 및 공개 권한 부여 (create_storage_bucket.sql)
-- [한 줄 요약]: 학생들의 목소리 오디오 파일(.webm)을 클라우드에 영구 보관할 수 있도록 storage 버킷을 생성하고 접근 허용 정책을 설정합니다.
-- ===================================================

-- 1. storage.buckets 버킷 생성 (공개 읽기/쓰기 허용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. storage.objects 업로드 및 읽기 권한 정책 해제
DROP POLICY IF EXISTS "Allow public upload to audio-recordings" ON storage.objects;
CREATE POLICY "Allow public upload to audio-recordings" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-recordings');

DROP POLICY IF EXISTS "Allow public select to audio-recordings" ON storage.objects;
CREATE POLICY "Allow public select to audio-recordings" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-recordings');
