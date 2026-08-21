import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def rename_images_to_lowercase():
    img_dir = os.path.join(os.path.dirname(__file__), 'next_app', 'public', 'word_img')
    if not os.path.exists(img_dir):
        print(f"❌ 폴더가 존재하지 않습니다: {img_dir}")
        return

    print("====================================================")
    print("🔄 [1단계: word_img 내 모든 이미지 파일명 소문자 변환 시작]")
    print("====================================================\n")

    files = os.listdir(img_dir)
    print(f"📁 총 파일 수: {len(files)}개")

    rename_count = 0
    # 1. 대소문자가 다른 파일들을 임시 파일명으로 1차 변경 (윈도우 대소문자 충돌 방지)
    temp_renames = []
    for f in files:
        if f.startswith('_') or not f.endswith('.png'):
            continue
        lower_name = f.lower()
        if f != lower_name:
            src = os.path.join(img_dir, f)
            tmp = os.path.join(img_dir, f + ".__tmp__")
            dst = os.path.join(img_dir, lower_name)
            temp_renames.append((src, tmp, dst, f, lower_name))

    print(f"🔍 소문자로 변경 대상 파일 수: {len(temp_renames)}개\n")

    # Step 1: src -> tmp
    for src, tmp, dst, old_f, new_f in temp_renames:
        if os.path.exists(src):
            os.rename(src, tmp)

    # Step 2: tmp -> dst
    for src, tmp, dst, old_f, new_f in temp_renames:
        if os.path.exists(tmp):
            if os.path.exists(dst):
                # 이미 동일한 소문자 파일이 존재하면 tmp 삭제
                os.remove(tmp)
            else:
                os.rename(tmp, dst)
            rename_count += 1
            if rename_count <= 10 or rename_count % 500 == 0:
                print(f"  ✅ [{rename_count}] {old_f} ➔ {new_f}")

    print(f"\n🎉 총 {rename_count}개 이미지 파일명을 소문자로 완벽하게 변환 완료하였습니다!\n")

if __name__ == '__main__':
    rename_images_to_lowercase()
