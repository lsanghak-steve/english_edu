-- users 테이블에 grade 컬럼이 없는 경우 1초 만에 자동 추가하는 SQL
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '🎒 초등 3학년';
