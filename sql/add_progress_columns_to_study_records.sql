-- ===================================================
-- study_records 테이블에 진도 저장 및 이어서 학습용 컬럼 추가 SQL
-- ===================================================

-- 1. study_records 테이블에 last_index, last_tab, quiz_levels 컬럼 추가
ALTER TABLE public.study_records ADD COLUMN IF NOT EXISTS last_index INT DEFAULT 0;
ALTER TABLE public.study_records ADD COLUMN IF NOT EXISTS last_tab TEXT DEFAULT 'flashcard';
ALTER TABLE public.study_records ADD COLUMN IF NOT EXISTS quiz_levels INT[] DEFAULT '{}';
ALTER TABLE public.study_records ADD COLUMN IF NOT EXISTS detail_stage TEXT DEFAULT '1단계 플래시카드 학습 중';
