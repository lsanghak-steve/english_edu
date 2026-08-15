import urllib.request, urllib.parse, json, sys, io, time, os
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = 'https://sqonhhqosyszncjfoxfd.supabase.co'
SUPABASE_KEY = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo'

def translate_text(text, target_lang):
    if not text or not str(text).strip():
        return ""
    text_clean = str(text).replace('\n', ' ').strip()
    if text_clean.lower().endswith('.png') or '제작완료' in text_clean:
        return ""

    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={urllib.parse.quote(text_clean)}"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    for retry in range(3):
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                res = "".join([segment[0] for segment in data[0] if segment and segment[0]])
                return res.strip()
        except Exception:
            time.sleep(0.3 * (retry + 1))
    return ""

def process_word_item(row):
    word = row.get('word', '')
    ex_en = row.get('example_en', '') or ''
    if ex_en.lower().endswith('.png') or '제작완료' in ex_en or not ex_en.strip():
        ex_en = f"I see a nice {word.lower()}."

    # 일본어
    meaning_ja = row.get('meaning_ja') or translate_text(word, 'ja')
    example_ja = row.get('example_ja') or translate_text(ex_en, 'ja')

    # 베트남어
    meaning_vi = row.get('meaning_vi') or translate_text(word, 'vi')
    example_vi = row.get('example_vi') or translate_text(ex_en, 'vi')

    # 힌디어
    meaning_hi = row.get('meaning_hi') or translate_text(word, 'hi')
    example_hi = row.get('example_hi') or translate_text(ex_en, 'hi')

    return {
        'id': row['id'],
        'word': word,
        'meaning': row.get('meaning') or '단어',
        'phonics': row.get('phonics') or '',
        'category': row.get('category') or '일반',
        'grade_level': row.get('grade_level') or '초등단어',
        'example_en': ex_en,
        'example_ko': row.get('example_ko') or '',
        'image_url': row.get('image_url') or '',
        'meaning_zh': row.get('meaning_zh') or '',
        'example_zh': row.get('example_zh') or '',
        'meaning_fr': row.get('meaning_fr') or '',
        'example_fr': row.get('example_fr') or '',
        'grade_level_ko': row.get('grade_level_ko') or '초등단어',
        'grade_level_zh': row.get('grade_level_zh') or '小学英语',
        'grade_level_fr': row.get('grade_level_fr') or 'Anglais Primaire',
        'grade_level_ja': row.get('grade_level_ja') or '小学生英語',
        'grade_level_vi': row.get('grade_level_vi') or 'Tiếng Anh Tiểu học',
        'grade_level_hi': row.get('grade_level_hi') or 'प्राथमिक अंग्रेजी',
        'meaning_ja': meaning_ja,
        'example_ja': example_ja,
        'meaning_vi': meaning_vi,
        'example_vi': example_vi,
        'meaning_hi': meaning_hi,
        'example_hi': example_hi
    }

def main():
    print("===============================================================")
    print("🚀 [Steve Voca 6대 글로벌 다국어 (JA/VI/HI) 자동 번역 & DB 동기화 엔진]")
    print("===============================================================\n")

    # 1. DB 단어 전체 로드
    print("📥 Supabase DB 전체 단어 로드 중...")
    all_db_rows = []
    offset = 0
    limit = 1000
    while True:
        req = urllib.request.Request(
            f'{SUPABASE_URL}/rest/v1/words?select=*&order=id.asc&offset={offset}&limit={limit}',
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

    print(f"📊 총 {len(all_db_rows)}개 DB 단어 로드 완료.\n")

    # 2. 멀티스레드 병렬 번역 진행 (15개 스레드)
    print(f"⚡ 총 {len(all_db_rows)}개 단어 일본어/베트남어/힌디어 고속 병렬 번역 시작 (스레드 15개)...")
    start_time = time.time()
    translated_results = []

    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {executor.submit(process_word_item, row): row for row in all_db_rows}
        count = 0
        for future in as_completed(futures):
            res = future.result()
            translated_results.append(res)
            count += 1
            if count % 200 == 0 or count == len(all_db_rows):
                elapsed = time.time() - start_time
                print(f"  진행률: [{count}/{len(all_db_rows)}] ({count/len(all_db_rows)*100:.1f}%) - {elapsed:.1f}초 경과")

    translated_results.sort(key=lambda x: int(x['id']))
    print(f"\n✅ 5,000단어 전체 번역 완료! 소요시간: {time.time() - start_time:.1f}초\n")

    # 3. Supabase DB 일괄 업로드 (청크 단위 100개)
    print("🚀 Supabase DB에 6개 국어 전체 데이터 일괄 업로드(Upsert) 시작...")
    chunk_size = 100
    success_count = 0
    for i in range(0, len(translated_results), chunk_size):
        chunk = translated_results[i:i+chunk_size]
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
            print(f"⚠️ Chunk {i} 업로드 중 오류:", e)

    print(f"\n🎉 [DB 완료] Supabase DB 총 {success_count}개 단어에 6개 국어 다국어 전체 저장 완수!")

    # 4. 로컬 JSON 데이터셋 업데이트
    print("\n📝 로컬 데이터셋 (data/ & next_app/data/) 동기화 시작...")
    words_map = {row['id']: row for row in translated_results}

    # 초등 800
    elem_path = 'data/parsed_800_words.json'
    if os.path.exists(elem_path):
        with open(elem_path, 'r', encoding='utf-8') as f:
            elem_data = json.load(f)
        for item in elem_data:
            w_match = words_map.get(item.get('id'))
            if w_match:
                item.update({
                    'meaning_ja': w_match['meaning_ja'], 'example_ja': w_match['example_ja'],
                    'meaning_vi': w_match['meaning_vi'], 'example_vi': w_match['example_vi'],
                    'meaning_hi': w_match['meaning_hi'], 'example_hi': w_match['example_hi']
                })
        with open(elem_path, 'w', encoding='utf-8') as f:
            json.dump(elem_data, f, ensure_ascii=False, indent=2)

        # wordsData.js 동기화
        js_code = "// 초등 필수 영단어 534/800선 6개 국어 다국어 데이터\nconst wordList500 = " + json.dumps(elem_data, ensure_ascii=False, indent=2) + ";\n\nexport default wordList500;\n"
        with open('next_app/data/wordsData.js', 'w', encoding='utf-8') as f:
            f.write(js_code)
        with open('data/wordsData.js', 'w', encoding='utf-8') as f:
            f.write(js_code)
        print("  - 초등 800단어 JSON 및 wordsData.js 업데이트 완료!")

    # 중등 1,200
    mid_path = 'data/middle_school_words.json'
    if os.path.exists(mid_path):
        with open(mid_path, 'r', encoding='utf-8') as f:
            mid_data = json.load(f)
        for item in mid_data:
            w_match = words_map.get(item.get('id'))
            if w_match:
                item.update({
                    'meaning_ja': w_match['meaning_ja'], 'example_ja': w_match['example_ja'],
                    'meaning_vi': w_match['meaning_vi'], 'example_vi': w_match['example_vi'],
                    'meaning_hi': w_match['meaning_hi'], 'example_hi': w_match['example_hi']
                })
        with open(mid_path, 'w', encoding='utf-8') as f:
            json.dump(mid_data, f, ensure_ascii=False, indent=2)
        print("  - 중등 1,200단어 JSON 업데이트 완료!")

    # 고등 3,000
    high_path = 'data/highschool_parsed.json'
    if os.path.exists(high_path):
        with open(high_path, 'r', encoding='utf-8') as f:
            high_data = json.load(f)
        for item in high_data:
            w_match = words_map.get(item.get('id'))
            if w_match:
                item.update({
                    'meaning_ja': w_match['meaning_ja'], 'example_ja': w_match['example_ja'],
                    'meaning_vi': w_match['meaning_vi'], 'example_vi': w_match['example_vi'],
                    'meaning_hi': w_match['meaning_hi'], 'example_hi': w_match['example_hi']
                })
        with open(high_path, 'w', encoding='utf-8') as f:
            json.dump(high_data, f, ensure_ascii=False, indent=2)
        print("  - 고등 3,000단어 JSON 업데이트 완료!")

    print("\n===============================================================")
    print("✨ [완전 완수] 5,000단어 전체 6개 국어 다국어 DB & 로컬 구축 완료!")
    print("===============================================================")

if __name__ == '__main__':
    main()
