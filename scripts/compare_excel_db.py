import os, sys, io, json, urllib.request, urllib.parse
import openpyxl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = 'https://sqonhhqosyszncjfoxfd.supabase.co'
SUPABASE_KEY = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo'

def fetch_all_supabase_words():
    print("Supabase DB에서 5,000개 전체 단어 데이터 로딩 중...")
    all_words = []
    page_size = 1000
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/words?select=*&order=id.asc&offset={offset}&limit={page_size}"
        req = urllib.request.Request(url, headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}'
        })
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data:
                break
            all_words.extend(data)
            if len(data) < page_size:
                break
            offset += page_size
    print(f"Supabase DB 로드 완료: 총 {len(all_words)}개")
    return all_words

def inspect_and_compare():
    db_words = fetch_all_supabase_words()
    
    # DB 인덱싱 (id 기준 및 (grade_level, word) 기준)
    db_by_id = {w['id']: w for w in db_words}
    
    # 레벨별 분리
    elem_db = [w for w in db_words if w.get('grade_level') == '초등단어' or (w.get('id', 0) <= 800 and not '중등' in str(w.get('category')))]
    mid_db = [w for w in db_words if w.get('grade_level') == '중등단어' or (800 < w.get('id', 0) <= 2000)]
    high_db = [w for w in db_words if w.get('grade_level') == '고등단어' or w.get('id', 0) > 2000]
    
    print(f"\nDB 레벨별 분포:")
    print(f"  - 초등단어 (Elementary): {len(elem_db)}개 (ID min={min(w['id'] for w in elem_db)}, max={max(w['id'] for w in elem_db)})")
    print(f"  - 중등단어 (Middle): {len(mid_db)}개 (ID min={min(w['id'] for w in mid_db)}, max={max(w['id'] for w in mid_db)})")
    print(f"  - 고등단어 (High/Suneung): {len(high_db)}개 (ID min={min(w['id'] for w in high_db)}, max={max(w['id'] for w in high_db)})")

    folder = r'D:\Yc_Back_Live\영창정밀_노트북\english_edu\word\multilingual'
    files_meta = [
        {
            'file': 'elementary_words_multilingual.xlsx',
            'grade': '초등단어',
            'db_subset': elem_db,
            'id_offset': 0 # 1~800 ➔ DB ID 1~800
        },
        {
            'file': 'middle_school_words_multilingual.xlsx',
            'grade': '중등단어',
            'db_subset': mid_db,
            'id_offset': 1000 # 1~1200 ➔ DB ID 1001~2200
        },
        {
            'file': 'highschool_suneung_vocab_3000_multilingual.xlsx',
            'grade': '고등단어',
            'db_subset': high_db,
            'id_offset': 3000 # 1~3000 ➔ DB ID 3001~6000
        }
    ]

    field_mapping = {
        '영어 단어 (Word)': 'word',
        '영어 (Word)': 'word',
        '발음기호 (IPA)': 'phonics',
        '한국어 뜻 (Meaning)': 'meaning',
        '中文释义 (Meaning ZH-CN)': 'meaning_zh',
        'Français (Meaning FR)': 'meaning_fr',
        '日本語の意味 (Meaning JA)': 'meaning_ja',
        'हिन्दी अर्थ (Meaning HI)': 'meaning_hi',
        'Nghĩa tiếng Việt (Meaning VI)': 'meaning_vi',
        '주제 (Category)': 'category',
        '영어 예문 (Example EN)': 'example_en',
        '한국어 해석 (Example KO)': 'example_ko',
        '中文例句 (Example ZH-CN)': 'example_zh',
        'Phrase française (Example FR)': 'example_fr',
        '日本語の例文 (Example JA)': 'example_ja',
        'हिन्दी उदाहरण (Example HI)': 'example_hi',
        'Câu ví dụ tiếng Việt (Example VI)': 'example_vi',
    }

    print("\n" + "="*80)
    print("📊 엑셀 vs DB 1:1 완벽 일치 정밀 대조 결과")
    print("="*80)

    for meta in files_meta:
        fn = meta['file']
        fp = os.path.join(folder, fn)
        wb = openpyxl.load_workbook(fp, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        wb.close()

        headers = [str(h).strip() if h is not None else '' for h in rows[0]]
        excel_items = []
        for r in rows[1:]:
            if not any(r):
                continue
            item = {}
            for col_idx, h in enumerate(headers):
                if col_idx < len(r):
                    val = r[col_idx]
                    item[h] = str(val).strip() if val is not None else ''
            excel_items.append(item)

        print(f"\n📂 [{fn}] (총 {len(excel_items)}행 vs DB {len(meta['db_subset'])}개)")

        # 1:1 매칭 검증
        total_matched = 0
        total_perfect_match = 0
        diff_by_field = {db_f: 0 for db_f in field_mapping.values()}
        sample_diffs = []

        for idx, x_row in enumerate(excel_items):
            # 예상 DB ID
            expected_db_id = idx + 1 + meta['id_offset']
            db_row = db_by_id.get(expected_db_id)

            if not db_row:
                # word 로 fallback
                w_str = x_row.get('영어 단어 (Word)') or x_row.get('영어 (Word)')
                if w_str:
                    matching = [w for w in meta['db_subset'] if w['word'].lower() == w_str.lower()]
                    if matching:
                        db_row = matching[0]

            if db_row:
                total_matched += 1
                row_diff = {}
                for x_col, db_col in field_mapping.items():
                    if x_col in x_row:
                        x_val = x_row[x_col].strip()
                        db_val = str(db_row.get(db_col) or '').strip()
                        if x_val != db_val:
                            row_diff[db_col] = {
                                'excel': x_val,
                                'db': db_val
                            }
                            diff_by_field[db_col] += 1
                
                if not row_diff:
                    total_perfect_match += 1
                else:
                    if len(sample_diffs) < 3:
                        sample_diffs.append({
                            'id': db_row['id'],
                            'word': db_row['word'],
                            'diffs': row_diff
                        })
            else:
                print(f"  ❌ 매칭 실패 행: 인덱스={idx+1}, 데이터={x_row.get('영어 단어 (Word)') or x_row.get('영어 (Word)')}")

        print(f"  ✅ DB 매칭 성공: {total_matched} / {len(excel_items)} ({total_matched/len(excel_items)*100:.1f}%)")
        print(f"  🎯 100% 완전 일치: {total_perfect_match} / {len(excel_items)} ({total_perfect_match/len(excel_items)*100:.1f}%)")
        
        # 필드별 차이 통계
        active_diff_fields = {k: v for k, v in diff_by_field.items() if v > 0}
        if active_diff_fields:
            print(f"  ⚠️ 필드별 차이 건수:")
            for df_k, df_v in active_diff_fields.items():
                print(f"     - {df_k}: {df_v}건 차이")
            if sample_diffs:
                print(f"  🔍 샘플 차이 세부 내용:")
                for sd in sample_diffs:
                    print(f"     * ID {sd['id']} [{sd['word']}]:")
                    for k, v in sd['diffs'].items():
                        print(f"         [{k}] 엑셀='{v['excel'][:40]}' | DB='{v['db'][:40]}'")
        else:
            print(f"  🎉 모든 필드가 엑셀과 DB 간에 100% 동일합니다!")

if __name__ == '__main__':
    inspect_and_compare()
