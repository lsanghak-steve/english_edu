# 🇨🇳 Steve Voca - 홍콩(HK) 클라우드 무비안 배포 가이드

> **대상**: 알리바바 클라우드(Alibaba Cloud), 텐센트 클라우드(Tencent Cloud), AWS **홍콩(Hong Kong) 리전**  
> **특징**: 중국 ICP 비안(허가증) 없이 **중국 본토 유저에게 초고속(30~70ms) 합법 서비스** 가능

---

## ⚡ 1. 3분 원클릭 배포 요약

### ① 서버에 도커(Docker) 설치 (최초 1회)
```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

### ② 소스코드 복사 또는 Git Clone
```bash
git clone https://github.com/lsanghak-steve/english_edu.git
cd english_edu/deploy_hk
```

### ③ 원클릭 배포 실행
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🌐 2. 포트 및 방화벽(Security Group) 설정
클라우드 관리자 콘솔(Security Group)에서 다음 포트를 오픈해주세요:
* **HTTP**: `80` (기본 웹 접속)
* **HTTPS**: `443` (SSL 보안 접속)

---

## 🛠️ 3. 운영 및 관리 명령어

* **실시간 로그 확인**:
  ```bash
  docker compose logs -f
  ```
* **서비스 재시작**:
  ```bash
  docker compose restart
  ```
* **서비스 중지**:
  ```bash
  docker compose down
  ```
* **최신 업데이트 반영 후 재배포**:
  ```bash
  ./deploy.sh
  ```

---

## 🔒 4. SSL (HTTPS) 적용 (선택 사항)
도메인을 연결한 후 `deploy_hk/ssl/` 폴더에 인증서 파일(`cert.pem`, `key.pem`)을 넣고 `nginx.conf`의 443 포트 주석을 해제하시면 즉시 HTTPS가 활성화됩니다.
