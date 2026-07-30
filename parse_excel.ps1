$scriptPath = $PSScriptRoot
$excelPath = Join-Path $scriptPath "elementary_words_200.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open($excelPath)
$sheet = $workbook.Sheets.Item(1)

$rows = $sheet.UsedRange.Rows.Count
$cols = $sheet.UsedRange.Columns.Count

$wordList = @()

for ($r = 2; $r -le $rows; $r++) {
    $num = $sheet.Cells.Item($r, 1).Text
    $word = $sheet.Cells.Item($r, 2).Text
    $phonics = $sheet.Cells.Item($r, 3).Text
    $meaning = $sheet.Cells.Item($r, 4).Text
    $category = $sheet.Cells.Item($r, 5).Text
    $exEn = $sheet.Cells.Item($r, 7).Text
    if ([string]::IsNullOrWhiteSpace($exEn)) { $exEn = $sheet.Cells.Item($r, 6).Text }
    $exKo = $sheet.Cells.Item($r, 8).Text
    if ([string]::IsNullOrWhiteSpace($exKo)) { $exKo = $sheet.Cells.Item($r, 7).Text }

    if ([string]::IsNullOrWhiteSpace($word)) { continue }

    $obj = [PSCustomObject]@{
        id = $wordList.Count + 1
        word = $word.Trim()
        phonics = $phonics.Trim()
        meaning = $meaning.Trim()
        category = if ([string]::IsNullOrWhiteSpace($category)) { "기초 단어 📖" } else { $category.Trim() }
        emoji = "📖"
        exampleEn = if ([string]::IsNullOrWhiteSpace($exEn)) { "$word is good." } else { $exEn.Trim() }
        exampleKo = if ([string]::IsNullOrWhiteSpace($exKo)) { "$meaning이(가) 좋아요." } else { $exKo.Trim() }
    }
    $wordList += $obj
}

$workbook.Close($false)
$excel.Quit()

$json = $wordList | ConvertTo-Json -Depth 5 -Compress
$jsContent = "/* ===================================================`n   초등 필수 영단어 200선 데이터베이스 (words_data.js)`n   =================================================== */`n`nconst wordList500 = $json;`n`nexport default wordList500;`nexport { wordList500 };`nif (typeof window !== 'undefined') { window.wordList500 = wordList500; }"

$targetPath1 = Join-Path $scriptPath "words_data.js"
$targetPath2 = Join-Path $scriptPath "next_app\app\words_data.js"

[System.IO.File]::WriteAllText($targetPath1, $jsContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($targetPath2, $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "SUCCESS: Extracted" $wordList.Count "words from elementary_words_200.xlsx"
