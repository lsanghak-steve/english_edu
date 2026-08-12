const openpyxl = require('child_process');
const path = require('path');
const fs = require('fs');

const { createClient } = require('D:/Yc_Back_Live/영창정밀_노트북/english_edu/next_app/node_modules/@supabase/supabase-js');
const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('📖 Parsing highschool_word.xlsx Excel file...');
  const jsonPath = path.join(__dirname, '../highschool_parsed.json');
  
  // Python script to dump Excel to json
  const pyCode = `
import openpyxl, json, sys, os

sys.stdout.reconfigure(encoding='utf-8')
wb = openpyxl.load_workbook(r"D:\\Yc_Back_Live\\영창정밀_노트북\\english_edu\\word\\highschool_word.xlsx")
sheet = wb['vocabulary']

words = []
for r in range(2, sheet.max_row + 1):
    num = sheet.cell(row=r, column=1).value
    word = sheet.cell(row=r, column=2).value
    ipa = sheet.cell(row=r, column=3).value
    meaning = sheet.cell(row=r, column=4).value
    category = sheet.cell(row=r, column=5).value
    level = sheet.cell(row=r, column=6).value
    status = sheet.cell(row=r, column=7).value
    file_name = sheet.cell(row=r, column=8).value
    example_en = sheet.cell(row=r, column=9).value
    example_ko = sheet.cell(row=r, column=10).value

    if word:
        word_str = str(word).strip()
        words.append({
            'excel_no': num,
            'word': word_str,
            'phonics': str(ipa or '').strip(),
            'meaning': str(meaning or '').strip(),
            'category': f"고등 - {str(category or '일반').strip()}",
            'grade_level': '고등단어',
            'example_en': str(example_en or '').strip(),
            'example_ko': str(example_ko or '').strip(),
            'image_url': f"/word_img/{word_str.lower()}.png"
        })

out_path = r"${jsonPath.replace(/\\/g, '\\\\')}"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f'Successfully exported {len(words)} high school words to JSON.')
`;

  fs.writeFileSync(path.join(__dirname, 'dump_highschool.py'), pyCode, 'utf-8');

  console.log('Running python Excel extractor...');
  openpyxl.execSync('python scripts/dump_highschool.py', { cwd: path.join(__dirname, '..'), encoding: 'utf-8' });

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const highSchoolWords = JSON.parse(rawData);
  console.log(`🚀 Loaded ${highSchoolWords.length} words from JSON. Starting Supabase DB batch upload...`);

  // Prepare batch payloads with unique IDs starting at 3001
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < highSchoolWords.length; i += batchSize) {
    const chunk = highSchoolWords.slice(i, i + batchSize);
    const dbPayload = chunk.map((item, index) => {
      const targetId = 3000 + i + index + 1;
      return {
        id: targetId,
        word: item.word,
        phonics: item.phonics,
        meaning: item.meaning,
        category: item.category,
        grade_level: '고등단어',
        example_en: item.example_en,
        example_ko: item.example_ko,
        image_url: item.image_url
      };
    });

    const { data, error } = await supabase.from('words').upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Chunk ${i / batchSize + 1} upload failed:`, error.message);
      errorCount += chunk.length;
    } else {
      successCount += chunk.length;
      console.log(`✅ Uploaded ${i + chunk.length} / ${highSchoolWords.length} high school words...`);
    }
  }

  console.log(`\n🎉 High school words upload completed! Success: ${successCount}, Failures: ${errorCount}`);

  // Final count check
  const { count } = await supabase.from('words').select('*', { count: 'exact', head: true });
  console.log(`📊 Final total count in Supabase words table: ${count}개 영단어!`);
}

main().catch(err => console.error('Upload process error:', err));
