-- ==============================================================================
-- 🌐 6개 국어 학습 레벨(grade_level) 데이터 일괄 채워넣기 SQL
-- 언어: 한국어(ko), 중국어(zh), 프랑스어(fr), 일본어(ja), 베트남어(vi), 힌디어(hi)
-- ==============================================================================

-- 1. [초등단어] 6개 국어 학습레벨 일괄 업데이트
UPDATE public.words 
SET 
  grade_level_ko = '초등단어',
  grade_level_zh = '小学英语',
  grade_level_fr = 'Anglais Primaire',
  grade_level_ja = '小学生英語',
  grade_level_vi = 'Tiếng Anh Tiểu học',
  grade_level_hi = 'प्राथमिक अंग्रेजी'
WHERE grade_level = '초등단어' OR category LIKE '%초등%' OR id <= 800;

-- 2. [중등단어] 6개 국어 학습레벨 일괄 업데이트
UPDATE public.words 
SET 
  grade_level_ko = '중등단어',
  grade_level_zh = '初中英语',
  grade_level_fr = 'Anglais Collège',
  grade_level_ja = '中学生英語',
  grade_level_vi = 'Tiếng Anh Trung học cơ sở',
  grade_level_hi = 'माध्यमिक अंग्रेजी'
WHERE (grade_level = '중등단어' OR category LIKE '%중등%' OR (id > 800 AND id <= 2000))
  AND NOT (id <= 800 AND (grade_level = '초등단어' OR category LIKE '%초등%'));

-- 3. [고등단어] 6개 국어 학습레벨 일괄 업데이트
UPDATE public.words 
SET 
  grade_level_ko = '고등단어',
  grade_level_zh = '高中英语',
  grade_level_fr = 'Anglais Lycée',
  grade_level_ja = '高校生英語',
  grade_level_vi = 'Tiếng Anh Trung học phổ thông',
  grade_level_hi = 'उच्चतर माध्यमिक अंग्रेजी'
WHERE grade_level LIKE '%고등%' OR grade_level LIKE '%수능%' OR category LIKE '%고등%' OR id > 2000;
