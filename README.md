# tripbook ✈️

일본 국내·해외 여행지를 **1~12월 시즌 캘린더**로 정리한 웹앱.
월을 고르면 "지금 가기 좋은 곳"이 **국내/해외로 나뉘어** 나오고, 모든 추천에는 **왜 이 달인가**라는 근거가 붙는다.

- **월별 시즌 캘린더** — 매월 국내 3곳 + 해외 3곳 큐레이션 + "이 달의 다른 후보" 자동 도출 (여행지 160곳)
- **근거 중심 추천** — 기후 / 자연 / 축제 / 비용·혼잡 / 액티비티 5대 근거로 "왜 이 달인가"를 명시
- **조건으로 찾기** — 언제(월) × 며칠 × 국내/해외 × 테마 + 텍스트 검색 (`#/find`, URL 공유 가능)
- **위시리스트·가봤음** — 상세에서 ♡/✓ 체크, 상단 ♥에서 내 목록 (localStorage)
- **현·국가 필터** — 국내 브라우즈는 도도부현별, 해외는 국가별 칩 필터 (복수 지역 여행지는 양쪽에서 매칭)
- **한/일 언어 토글** — 상단 KO⇄JA 버튼. UI·지명·전 콘텐츠 일본어 지원(160곳 전체 번역, JA 선택 시에만 로드)
- **연휴 오버레이** — GW·오봉·실버위크 등 일본 연휴를 홈·월별 뷰에 표시(혼잡·요금 경고)
- **도쿄 출발 실용 정보** — 이동시간·예산 레벨(¥~¥¥¥¥¥)·추천 일수·주의사항(태풍철 등)
- 백엔드 없는 **정적 웹앱**(빌드 불필요) — 바닐라 ES 모듈 + JSON 데이터, [food-recipy](https://github.com/taetaeng7-rgb/food-recipy)의 검증된 구조 재사용

> 📄 상세 설계는 [개발기획서.md](개발기획서.md) 참고.

## 상태
**v0.3 — 한/일 토글 완료** — 찾기·검색 / 위시리스트·가봤음 / 연휴 오버레이 / 월별 "다른 후보" / 한국어·일본어 전환.
콘텐츠: 여행지 160곳(국내 87·해외 73, 전체 일본어 번역 포함), 12개월 × 국내 3+해외 3 큐레이션 + bestMonths 기반 후보 풀.

## 로컬 실행
빌드가 없어 정적 서버만 있으면 됩니다. (ES 모듈 + fetch 때문에 `file://` 직접 열기는 불가)

```bash
# 저장소 루트에서
python3 -m http.server 8765
# 브라우저에서 http://localhost:8765 접속
```

## 테스트 / 검증 (Node 18+)
```bash
npm test                 # 캘린더 로직 + 뷰 렌더링 스모크 (node --test)
npm run validate:data    # 데이터 검증 D01~D14 (id·월·참조 무결성·어휘·태풍철 경고)
npm run test:all         # 검증 + 테스트
```

## 폴더 구조
```
index.html               # 앱 셸 (해시 라우팅, 하단 탭)
css/style.css            # 모바일 우선, 라이트/다크 (국내=그린, 해외=블루)
js/
  config.js              # 분류·어휘 상수 (지방/권역·테마·근거·예산)
  router.js              # 해시 라우터
  calendar.js            # 월 로직 (현재 월·순환·추천 해석) — 순수 함수
  data.js                # JSON 병렬 로드 + 인덱스
  views.js               # 화면 렌더러 (DOM 비의존 — 테스트 가능)
  app.js                 # 엔트리 (라우팅·테마·탭)
data/
  calendar.json          # 월별 큐레이션 (12개월 × 국내3+해외3)
  destinations/국내.json  # 국내 여행지 28곳
  destinations/해외.json  # 해외 여행지 32곳
scripts/validate-data.mjs # 데이터 검증 (에러 시 exit 1)
test/                    # node --test
```

## 배포 (GitHub Pages)
Settings → Pages → Source: **Deploy from a branch** → `main` / `/(root)`.
배포 URL: `https://taetaeng7-rgb.github.io/tripbook/`
(상대경로 + 해시 라우팅 + `.nojekyll` — 하위 경로에서 그대로 동작)

## 여행지 추가 방법
1. `data/destinations/국내.json` 또는 `해외.json`에 객체 append (스키마는 기획서 §1.5)
2. 필요 시 `data/calendar.json`의 해당 월 큐레이션 교체
3. `npm run test:all` 통과 확인 후 push
