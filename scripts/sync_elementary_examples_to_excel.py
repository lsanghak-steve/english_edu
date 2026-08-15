import urllib.request, urllib.parse, json, openpyxl, os, sys, io, time
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = 'https://sqonhhqosyszncjfoxfd.supabase.co'
SUPABASE_KEY = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo'

def fetch_db_elementary_words():
    print("Fetching 800 Elementary words from Supabase DB...")
    url = f"{SUPABASE_URL}/rest/v1/words?select=*&id=gte.1&id=lte.800&order=id.asc"
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    })
    with urllib.request.urlopen(req) as resp:
        db_words = json.loads(resp.read().decode('utf-8'))
    print(f"Loaded {len(db_words)} elementary words from DB.")
    return db_words

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
            time.sleep(0.2 * (retry + 1))
    return ""

def update_multilingual_excel(db_words):
    excel_path = r'D:\Yc_Back_Live\영창정밀_노트북\english_edu\word\multilingual\elementary_words_multilingual.xlsx'
    print(f"\nUpdating {excel_path}...")
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active

    headers = [cell.value for cell in ws[1]]
    header_map = {h: idx for idx, h in enumerate(headers, start=1)}
    print("Headers:", headers)

    db_by_id = {w['id']: w for w in db_words}
    db_by_word = {w['word'].lower().strip(): w for w in db_words}

    updated_count = 0
    for row_idx in range(2, ws.max_row + 1):
        num_val = ws.cell(row=row_idx, column=1).value
        word_val = ws.cell(row=row_idx, column=header_map.get('영어 단어 (Word)', 2)).value

        db_item = None
        if num_val and isinstance(num_val, int) and num_val in db_by_id:
            db_item = db_by_id[num_val]
        elif word_val and str(word_val).lower().strip() in db_by_word:
            db_item = db_by_word[str(word_val).lower().strip()]

        if db_item:
            # Update example_en & example_ko
            ex_en = db_item.get('example_en', '')
            ex_ko = db_item.get('example_ko', '')
            ex_zh = db_item.get('example_zh', '')
            ex_fr = db_item.get('example_fr', '')
            ex_ja = db_item.get('example_ja', '')
            ex_hi = db_item.get('example_hi', '')
            ex_vi = db_item.get('example_vi', '')

            if '영어 예문 (Example EN)' in header_map:
                ws.cell(row=row_idx, column=header_map['영어 예문 (Example EN)'], value=ex_en)
            if '한국어 해석 (Example KO)' in header_map:
                ws.cell(row=row_idx, column=header_map['한국어 해석 (Example KO)'], value=ex_ko)
            if '中文例句 (Example ZH-CN)' in header_map and ex_zh:
                ws.cell(row=row_idx, column=header_map['中文例句 (Example ZH-CN)'], value=ex_zh)
            if 'Phrase française (Example FR)' in header_map and ex_fr:
                ws.cell(row=row_idx, column=header_map['Phrase française (Example FR)'], value=ex_fr)
            if '日本語の例文 (Example JA)' in header_map and ex_ja:
                ws.cell(row=row_idx, column=header_map['日本語の例文 (Example JA)'], value=ex_ja)
            if 'हिन्दी उदाहरण (Example HI)' in header_map and ex_hi:
                ws.cell(row=row_idx, column=header_map['हिन्दी उदाहरण (Example HI)'], value=ex_hi)
            if 'Câu ví dụ tiếng Việt (Example VI)' in header_map and ex_vi:
                ws.cell(row=row_idx, column=header_map['Câu ví dụ tiếng Việt (Example VI)'], value=ex_vi)

            updated_count += 1

    wb.save(excel_path)
    wb.close()
    print(f"Successfully updated {updated_count} rows in {excel_path}!")

def update_ko_zh_excel(db_words):
    excel_path = r'D:\Yc_Back_Live\영창정밀_노트북\english_edu\word\elementary_words_ko_zh.xlsx'
    if not os.path.exists(excel_path):
        return
    print(f"\nUpdating {excel_path}...")
    wb = openpyxl.load_workbook(excel_path)
    ws = wb.active

    headers = [cell.value for cell in ws[1]]
    header_map = {h: idx for idx, h in enumerate(headers, start=1)}
    print("Headers:", headers)

    db_by_id = {w['id']: w for w in db_words}
    db_by_word = {w['word'].lower().strip(): w for w in db_words}

    updated_count = 0
    for row_idx in range(2, ws.max_row + 1):
        num_val = ws.cell(row=row_idx, column=1).value
        word_val = ws.cell(row=row_idx, column=header_map.get('영어 단어 (Word)', 2)).value

        db_item = None
        if num_val and isinstance(num_val, int) and num_val in db_by_id:
            db_item = db_by_id[num_val]
        elif word_val and str(word_val).lower().strip() in db_by_word:
            db_item = db_by_word[str(word_val).lower().strip()]

        if db_item:
            ex_en = db_item.get('example_en', '')
            ex_ko = db_item.get('example_ko', '')
            ex_zh = db_item.get('example_zh', '')

            if '영어 예문 (Example EN)' in header_map:
                ws.cell(row=row_idx, column=header_map['영어 예문 (Example EN)'], value=ex_en)
            if '한국어 해석 (Example KO)' in header_map:
                ws.cell(row=row_idx, column=header_map['한국어 해석 (Example KO)'], value=ex_ko)
            if '中文例句 (Example ZH-CN)' in header_map and ex_zh:
                ws.cell(row=row_idx, column=header_map['中文例句 (Example ZH-CN)'], value=ex_zh)

            updated_count += 1

    wb.save(excel_path)
    wb.close()
    print(f"Successfully updated {updated_count} rows in {excel_path}!")

def update_local_json_files(db_words):
    json_path = r'D:\Yc_Back_Live\영창정밀_노트북\english_edu\data\parsed_800_words.json'
    print(f"\nUpdating {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        local_words = json.load(f)

    db_by_id = {w['id']: w for w in db_words}
    db_by_word = {w['word'].lower().strip(): w for w in db_words}

    for item in local_words:
        item_id = item.get('id') or item.get('No') or item.get('번호')
        item_word = (item.get('word') or item.get('영어 단어 (Word)') or '').lower().strip()

        db_item = None
        if item_id and int(item_id) in db_by_id:
            db_item = db_by_id[int(item_id)]
        elif item_word in db_by_word:
            db_item = db_by_word[item_word]

        if db_item:
            item['example_en'] = db_item.get('example_en', '')
            item['example_ko'] = db_item.get('example_ko', '')
            item['exampleEn'] = db_item.get('example_en', '')
            item['exampleKo'] = db_item.get('example_ko', '')
            item['example_zh'] = db_item.get('example_zh', '')
            item['example_fr'] = db_item.get('example_fr', '')
            item['example_ja'] = db_item.get('example_ja', '')
            item['example_vi'] = db_item.get('example_vi', '')
            item['example_hi'] = db_item.get('example_hi', '')
            item['exampleZh'] = db_item.get('example_zh', '')
            item['exampleFr'] = db_item.get('example_fr', '')
            item['exampleJa'] = db_item.get('example_ja', '')
            item['exampleVi'] = db_item.get('example_vi', '')
            item['exampleHi'] = db_item.get('example_hi', '')

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(local_words, f, ensure_ascii=False, indent=2)
    print(f"Successfully updated {len(local_words)} rows in {json_path}!")

def main():
    db_words = fetch_db_elementary_words()
    update_multilingual_excel(db_words)
    update_ko_zh_excel(db_words)
    update_local_json_files(db_words)
    print("\n🎉 모든 초등 예문 (example_en, example_ko 및 6개 국어 예문 해석) 엑셀 동기화 완료!")

if __name__ == '__main__':
    main()
