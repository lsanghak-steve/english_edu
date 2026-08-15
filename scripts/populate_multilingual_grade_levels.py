import urllib.request, json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = 'https://sqonhhqosyszncjfoxfd.supabase.co'
SUPABASE_KEY = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo'

GRADE_LEVEL_MAP = {
    '초등': {
        'grade_level_ko': '초등단어',
        'grade_level_zh': '小学英语',
        'grade_level_fr': 'Anglais Primaire',
        'grade_level_ja': '小学生英語',
        'grade_level_vi': 'Tiếng Anh Tiểu học',
        'grade_level_hi': 'प्राथमिक अंग्रेजी'
    },
    '중등': {
        'grade_level_ko': '중등단어',
        'grade_level_zh': '初中英语',
        'grade_level_fr': 'Anglais Collège',
        'grade_level_ja': '中学生英語',
        'grade_level_vi': 'Tiếng Anh Trung học cơ sở',
        'grade_level_hi': 'माध्यमिक अंग्रेजी'
    },
    '고등': {
        'grade_level_ko': '고등단어',
        'grade_level_zh': '高中英语',
        'grade_level_fr': 'Anglais Lycée',
        'grade_level_ja': '高校生英語',
        'grade_level_vi': 'Tiếng Anh Trung học phổ thông',
        'grade_level_hi': 'उच्चतर माध्यमिक अंग्रेजी'
    }
}

# 1. DB 단어 전체 가져오기
print("📥 Supabase DB 단어 전체 로드 중...")
all_db_rows = []
offset = 0
limit = 1000
while True:
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/words?select=id,word,phonics,meaning,meaning_zh,example_zh,meaning_fr,example_fr,category,grade_level,example_en,example_ko,image_url&offset={offset}&limit={limit}',
        headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        if not data:
            break
        all_db_rows.extend(data)
        if len(data) < limit:
            break
        offset += limit

print(f"📊 총 {len(all_db_rows)}개 DB 단어 로드 완료.")

# 2. 각 단어별 6개 국어 학습레벨 매핑 생성
payloads = []
for row in all_db_rows:
    w_id = int(row['id'])
    grd = str(row.get('grade_level') or '')
    cat = str(row.get('category') or '')

    # 레벨 분류
    if '고등' in grd or '수능' in grd or w_id > 2000:
        level_key = '고등'
    elif '중등' in grd or '중학' in cat or (w_id > 800 and w_id <= 2000):
        level_key = '중등'
    else:
        level_key = '초등'

    multilingual_grades = GRADE_LEVEL_MAP[level_key]

    upd_row = {
        'id': row['id'],
        'word': row['word'],
        'meaning': row['meaning'] or '단어',
        'phonics': row.get('phonics') or '',
        'category': row.get('category') or '일반',
        'grade_level': row.get('grade_level') or multilingual_grades['grade_level_ko'],
        'example_en': row.get('example_en') or '',
        'example_ko': row.get('example_ko') or '',
        'image_url': row.get('image_url') or '',
        'meaning_zh': row.get('meaning_zh') or '',
        'example_zh': row.get('example_zh') or '',
        'meaning_fr': row.get('meaning_fr') or '',
        'example_fr': row.get('example_fr') or '',
        'grade_level_ko': multilingual_grades['grade_level_ko'],
        'grade_level_zh': multilingual_grades['grade_level_zh'],
        'grade_level_fr': multilingual_grades['grade_level_fr'],
        'grade_level_ja': multilingual_grades['grade_level_ja'],
        'grade_level_vi': multilingual_grades['grade_level_vi'],
        'grade_level_hi': multilingual_grades['grade_level_hi']
    }
    payloads.append(upd_row)

# 3. Supabase DB Upsert
chunk_size = 100
success_count = 0
print(f"🚀 총 {len(payloads)}개 단어에 6개 국어 학습레벨 DB 일괄 저장 시작...")

for i in range(0, len(payloads), chunk_size):
    chunk = payloads[i:i+chunk_size]
    payload_bytes = json.dumps(chunk, ensure_ascii=False).encode('utf-8')

    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/words',
        data=payload_bytes,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201, 204):
                success_count += len(chunk)
    except Exception as e:
        print(f"⚠️ Chunk {i} 저장 중 오류:", e)

print(f"\n🎉 [완료] Supabase DB 총 {success_count}개 단어에 6개 국어 grade_level 저장 완료!")
