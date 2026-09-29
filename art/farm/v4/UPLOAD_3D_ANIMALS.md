# 농장 타이쿤 - 승인된 3D 캐릭터 파일

**2026-09-29 업로드 원본 반영용 파일 목록**

사용자가 이번에 올린 배경 투명 WebP 세 장을 그대로 사용합니다. 4번째 판다는 이전에 만들어 둔 캐릭터 팩의 파일을 재사용합니다.

| GitHub 등록 경로 | 실제 소스 | 역할 |
|---|---|---|
| `art/farm/v4/rabbit.webp` | `IMG_2384.webp` | 밀짚모자·멜빵 토끼 농부 |
| `art/farm/v4/monkey.webp` | `IMG_2385.webp` | 사파리 모자 원숭이 손님 |
| `art/farm/v4/cat.webp` | `IMG_2383.webp` | 체크 앞치마 고양이 손님 |
| `art/farm/v4/panda.webp` | 앞서 제작한 팬더 캐릭터 팩 | 판다 손님 |

복잡한 작업 없이 네 파일을 정확히 위 경로로 배치하면, `minigames/math-tycoon-v3.html`은 별도의 코드 변경 없이 즉시 이를 불러옵니다. 파일 읽기가 실패한 경우에만 기존 `art/stickers/`의 3D 동물 이미지를 안전하게 표시합니다.

원본은 배경 투명도 유지, 이미지 재저장으로 인한 추가 손실 없이 보관합니다. 고객 안내와 화분/바구니 개선은 이미 운영 앱 코드에 적용돼 있으며 이 등록 작업은 **새로 받은 동물 원본을 실제 바이너리 경로에 추가하는 마지막 과정**입니다.

ZIP을 GitHub 폴더에 그대로 넣어서는 동물이 교체되지 않습니다. 압축을 풀고 4개 WebP 파일만 `art/farm/v4/` 경로로 업로드해야 합니다.

## ZIP 한 파일로 간편 등록

GitHub 화면에서 일일이 네 파일을 선택하지 않으려면, 준비한 **`farm_v4_latest_upload.zip` 한 개만** [이 경로](https://github.com/fumon1218/oks-class/upload/main/art/farm/v4)에 추가하고 커밋하세요. `.github/workflows/import-farm-characters.yml` 워크플로가 ZIP에 들어 있는 정확한 `rabbit.webp`, `monkey.webp`, `cat.webp`, `panda.webp` 네 파일을 추출해 설치하고 서비스 워커 캐시를 갱신합니다. 정상적으로 등록되면 ZIP 자체는 자동으로 제거됩니다. ZIP 안에는 최상위 경로에 네 WebP 파일이 있어야 합니다.

작업 전후 이미지가 보이지 않는 경우 [GitHub Actions](https://github.com/fumon1218/oks-class/actions)에서 `Import farm character ZIP` 실행 결과를 확인하세요. 운영 저장소의 브랜치 보호 또는 워크플로의 쓰기 권한이 차단되면 자동 커밋이 실패할 수 있습니다.


## 양팔이 보이는 토끼 농부만 교체 (최신)

새로 받은 완전한 토끼 이미지는 이미 투명 WebP로 만들었습니다. `farm_rabbit_replacement.zip`에는 **`rabbit.webp` 하나만** 들어 있습니다. ZIP을 압축 해제하지 않고 기존 GitHub [art/farm/v4 업로드 페이지](https://github.com/fumon1218/oks-class/upload/main/art/farm/v4)에 업로드/커밋하면 자동 워크플로가 다음 작업을 합니다.

- 토끼 이미지를 `art/farm/v4/rabbit_full.webp`로 설치하고 기존 `rabbit.webp`도 갱신합니다.
- 고양이·판다·원숭이는 기존 업로드 이미지 그대로 유지합니다.
- PWA 버전을 자동 증가하고 새로운 토끼 이미지를 오프라인 캐시에 추가합니다.
- 게임은 `rabbit_full.webp`가 있을 때만 새 토끼로 바꾸고, 설치 전에는 양팔이 보이는 기존 토끼 스티커를 사용합니다.

제공 ZIP의 이름은 자동 설치 경로와 동일한 **`farm_v4_latest_upload.zip`**입니다. 이름 변경이나 압축 해제 없이 파일을 그대로 업로드하면 됩니다.
