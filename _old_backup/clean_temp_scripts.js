const fs = require('fs');
const path = require('path');

// 승인받은 임시 스크립트 파일 목록
const tempFiles = [
    'download_batch_10.js',
    'download_batch_20_real.js',
    'download_batch_25_more.js',
    'download_batch_30_words.js',
    'download_batch_school_real.js',
    'download_pinterest_500x500_batch10.js',
    'download_p_img_samples.js',
    'download_real_images.js',
    'fast_keyword_downloader.js',
    'fill_all_500_p_img.js',
    'fix_cow.js',
    'fix_lemon_only.js',
    'fix_lemon_peach.js',
    'fix_lemon_peach_whale.js',
    'fix_monkey_cow.js',
    'fix_wind.js',
    'generate_100_images.js',
    'generate_50_images.js',
    'generate_5_images.js',
    'generate_all_real_images_final.js',
    'generate_batch_10.js',
    'generate_batch_10_img.js',
    'generate_batch_2_img.js',
    'generate_batch_images.js',
    'generate_fix_all_images.js',
    'generate_real_500_distinct_words.js',
    'generate_real_art_images.js',
    'make_super_lemon.js',
    'refetch_lemon_peach_whale.js',
    'replace_all_500_specific_images.js',
    'replace_with_exact_keyword_images.js',
    'setup_next_flashcard.js'
];

let deletedCount = 0;

tempFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        deletedCount++;
    }
});

console.log(`🧹 총 ${deletedCount}개의 임시 테스트 스크립트 파일이 깔끔하게 정리되었습니다.`);
