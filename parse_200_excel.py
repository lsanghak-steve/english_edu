import zipfile
import xml.etree.ElementTree as ET
import json
import os

def parse_xlsx(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        # sharedStrings.xml 파싱
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                shared_strings.append(elem.text or '')
        
        # sheet1.xml 파싱
        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = []
            for cell in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                val_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if val_elem is not None:
                    val = val_elem.text
                    cell_type = cell.get('t')
                    if cell_type == 's' and val is not None:
                        val = shared_strings[int(val)]
                    row_vals.append(val)
                else:
                    row_vals.append('')
            if any(row_vals):
                rows.append(row_vals)
        return rows

rows = parse_xlsx('elementary_words_200.xlsx')
print(f"총 로우 수: {len(rows)}")
if rows:
    headers = rows[0]
    print("헤더:", headers)
    data_rows = rows[1:]
    
    formatted_list = []
    for idx, r in enumerate(data_rows):
        # 기본 위치 기반 추정 및 안전 매핑 (순서: 번호, 단어, 발음, 뜻, 카테고리, 예문en, 예문ko)
        word = r[1] if len(r) > 1 else ''
        phonics = r[2] if len(r) > 2 else ''
        meaning = r[3] if len(r) > 3 else ''
        category = r[4] if len(r) > 4 else '기초 단어 📖'
        example_en = r[6] if len(r) > 6 else (r[5] if len(r) > 5 else f"{word} is good.")
        example_ko = r[7] if len(r) > 7 else (r[6] if len(r) > 6 else f"{meaning}이(가) 좋아요.")
        
        formatted_list.append({
            "id": idx + 1,
            "word": str(word).strip(),
            "phonics": str(phonics).strip(),
            "meaning": str(meaning).strip(),
            "category": str(category).strip() or "기초 단어 📖",
            "emoji": "📖",
            "exampleEn": str(example_en).strip(),
            "exampleKo": str(example_ko).strip()
        })

    js_content = f"""/* ===================================================
   초등 필수 영단어 200선 데이터베이스 (words_data.js)
   =================================================== */

const wordList500 = {json.dumps(formatted_list, ensure_ascii=False, indent=4)};

export default wordList500;
export {{ wordList500 }};
if (typeof window !== 'undefined') {{ window.wordList500 = wordList500; }}
"""

    with open('words_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

    os.makedirs('next_app/app', exist_ok=True)
    with open('next_app/app/words_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"🎉 200개 단어 데이터베이스(words_data.js) 작성이 완수되었습니다! 총 {len(formatted_list)}개 단어")
