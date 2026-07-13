# tripbook ✈️

일본 국내·해외 여행지를 **1~12월 시즌 캘린더**로 정리한 웹앱.
월을 고르면 "지금 가기 좋은 곳"이 **국내/해외로 나뉘어** 나오고, 모든 추천에는 **왜 이 달인가**라는 근거가 붙는다.

- **월별 시즌 캘린더** — 매월 국내 3곳 + 해외 3곳 큐레이션 (시드 72곳)
- **근거 중심 추천** — 기후 / 자연 / 축제 / 비용·혼잡 / 액티비티 5대 근거로 "왜 이 달인가"를 명시
- **도쿄 출발 실용 정보** — 이동시간·예산 레벨(¥~¥¥¥¥¥)·추천 일수·주의사항(태풍철 등)
- 백엔드 없는 **정적 웹앱**(빌드 불필요) — 여행지는 JSON, 같은 계열 앱 [food-recipy](https://github.com/taetaeng7-rgb/food-recipy)의 검증된 구조 재사용

> 📄 상세 설계는 [개발기획서.md](개발기획서.md) 참고.

## 상태
**기획 확정 (M0 완료, 2026-07-14)** — 다음 단계: M1 스켈레톤 → M2 시드 데이터 72곳 → M3 MVP 출시.

## 예정 구조
```
index.html            # 앱 셸 (해시 라우팅)
css/style.css         # 모바일 우선, 라이트/다크
js/                   # 바닐라 ES 모듈 (router/data/calendar/views)
data/calendar.json    # 월별 큐레이션 (12개월 × 국내3+해외3)
data/destinations/    # 국내.json · 해외.json
scripts/              # 데이터 검증 (validate-data)
```

## 배포 (GitHub Pages)
Settings → Pages → Source: **Deploy from a branch** → `main` / `/(root)`.
배포 URL(예정): `https://taetaeng7-rgb.github.io/tripbook/`
(상대경로 + 해시 라우팅 + `.nojekyll` — 하위 경로에서 그대로 동작)
