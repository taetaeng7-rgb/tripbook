// 실제 시드 데이터로 뷰 렌더링 스모크 테스트 (DOM 없이 문자열 검증)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as views from '../js/views.js';
import { picksFor, nextMonth, candidatesFor } from '../js/calendar.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const domestic = read('../data/destinations/국내.json');
const overseas = read('../data/destinations/해외.json');
const calendar = read('../data/calendar.json');
const byId = new Map([...domestic, ...overseas].map(d => [d.id, d]));

const noUndefined = html => assert.ok(!html.includes('undefined'), 'HTML에 undefined 노출');

test('홈 — 7월: 국내/해외 3+3과 8월 미리보기 (A1)', () => {
  const html = views.home(7, picksFor(7, calendar, byId), picksFor(8, calendar, byId));
  assert.match(html, /7월의 여행지/);
  assert.match(html, /후라노·비에이/);
  assert.match(html, /몽골/);
  assert.match(html, /8월 미리보기/);
  assert.match(html, /도호쿠 3대 마츠리/); // 미리보기에 8월 항목
  noUndefined(html);
});

test('홈 — 12월의 미리보기는 1월(순환, A2)', () => {
  const nm = nextMonth(12);
  assert.equal(nm, 1);
  const html = views.home(12, picksFor(12, calendar, byId), picksFor(nm, calendar, byId));
  assert.match(html, /1월 미리보기/);
  assert.match(html, /니세코/); // 1월 국내 대표
  noUndefined(html);
});

test('월별 — 9월 해외 세그먼트만 (A3)', () => {
  const html = views.monthView(9, 'overseas', picksFor(9, calendar, byId), 7);
  assert.match(html, /카파도키아/);
  assert.match(html, /스페인·포르투갈/);
  assert.ok(!html.includes('다이세츠산'), 'overseas 세그먼트에 국내 항목 노출');
  assert.match(html, /scope=overseas/);
  noUndefined(html);
});

test('월별 — 월 칩 이동 시 세그먼트(scope) 유지', () => {
  const html = views.monthView(4, 'overseas', picksFor(4, calendar, byId), 7);
  assert.ok(html.includes('href="#/month/5?scope=overseas"'), '월 칩이 scope 쿼리를 유지해야 함');
  const domHtml = views.monthView(4, 'domestic', picksFor(4, calendar, byId), 7);
  assert.ok(domHtml.includes('href="#/month/5?scope=domestic"'));
  const allHtml = views.monthView(4, 'all', picksFor(4, calendar, byId), 7);
  assert.ok(!allHtml.includes('#/month/5?scope='), '전체 세그먼트는 쿼리 없음');
});

test('월별 — 12개월 전부 국내/해외 각 3건 렌더', () => {
  for (let m = 1; m <= 12; m++) {
    const picks = picksFor(m, calendar, byId);
    assert.equal(picks.domestic.length, 3, `${m}월 국내 3건`);
    assert.equal(picks.overseas.length, 3, `${m}월 해외 3건`);
    noUndefined(views.monthView(m, 'all', picks, 7));
  }
});

test('상세 — 후라노를 7월 컨텍스트로: 7월 이유 우선·PEAK (A4)', () => {
  const d = byId.get('jp-hokkaido-furano');
  const others = [...picksFor(7, calendar, byId).domestic, ...picksFor(7, calendar, byId).overseas].filter(o => o.id !== d.id);
  const html = views.place(d, 7, others);
  assert.match(html, /왜 이 달인가/);
  assert.match(html, /라벤더/);
  assert.match(html, /절정/); // peakMonth=7 배지
  const first = html.indexOf('<strong>7월</strong>');
  const second = html.indexOf('<strong>6월</strong>');
  assert.ok(first !== -1 && second !== -1 && first < second, '컨텍스트 월(7월)이 최상단');
  assert.match(html, /7월의 다른 추천/);
  noUndefined(html);
});

test('브라우즈 — 국내는 지방 그룹, 해외는 권역 그룹 (A5)', () => {
  const dHtml = views.browse('domestic', domestic);
  assert.match(dHtml, /홋카이도/);
  assert.match(dHtml, /오키나와/);
  assert.match(dHtml, /베스트 6·7·8월/); // 후라노 베스트 월 배지
  const oHtml = views.browse('overseas', overseas);
  assert.match(oHtml, /한국/);
  assert.match(oHtml, /유럽/);
  noUndefined(dHtml);
  noUndefined(oHtml);
});

test('상세 — 모든 여행지 × 모든 베스트 월 렌더에 undefined 없음', () => {
  for (const d of [...domestic, ...overseas]) {
    for (const m of d.bestMonths) {
      noUndefined(views.place(d, m, []));
    }
  }
});

test('notFound / loadError (A6)', () => {
  assert.match(views.notFound(), /여행지를 찾을 수 없습니다/);
  assert.match(views.loadError(), /다시 시도/);
});

test('연휴 스트립 — 홈·월별에 표시, 6월은 공휴일 없음 문구', () => {
  const aug = views.monthView(8, 'all', picksFor(8, calendar, byId), 7);
  assert.match(aug, /오봉/);
  const jun = views.monthView(6, 'all', picksFor(6, calendar, byId), 7);
  assert.match(jun, /공휴일이 없는 달/);
  const home7 = views.home(7, picksFor(7, calendar, byId), picksFor(8, calendar, byId));
  assert.match(home7, /바다의 날/);
});

test('월별 — 큐레이션 밖 "다른 후보" 섹션 + 세그먼트 반영', () => {
  const m = 8;
  const picks = picksFor(m, calendar, byId);
  const curated = new Set([...picks.domestic, ...picks.overseas].map(d => d.id));
  const extras = {
    domestic: candidatesFor(m, domestic, curated),
    overseas: candidatesFor(m, overseas, curated),
  };
  assert.ok(extras.domestic.some(d => d.id === 'jp-shikoku-awaodori'), '신규 여행지가 8월 후보로 도출');
  const all = views.monthView(m, 'all', picks, 7, extras);
  assert.match(all, /8월의 다른 후보/);
  assert.match(all, /아와오도리/);
  const ovs = views.monthView(m, 'overseas', picks, 7, extras);
  assert.ok(!ovs.includes('아와오도리'), '해외 세그먼트에선 국내 후보 숨김');
  assert.ok(ovs.includes('발리'), '해외 후보는 표시'); // id-bali bestMonths에 8 포함
});

test('찾기 — 필터 칩 URL·결과 카운트·검색 입력값', () => {
  const all = [...domestic, ...overseas];
  const p = { month: 10, days: 'short', scope: 'domestic', themes: ['단풍'], q: '' };
  const results = all.filter(d => d.scope === 'domestic' && d.bestMonths.includes(10) && d.themes.includes('단풍'));
  const html = views.findView(p, results);
  assert.match(html, /조건으로 찾기/);
  assert.match(html, new RegExp(`조건에 맞는 여행지 <strong>${results.length}곳`));
  assert.ok(html.includes('href="#/find?m=any'), '월 전체 칩 URL');
  assert.ok(html.includes('m=10&d=short&s=domestic'), '현재 조건이 URL에 유지');
  assert.match(html, /id="find-q"/);
  assert.ok(!html.includes('undefined'));
});

test('찾기 — 결과 0건 빈 상태', () => {
  const html = views.findResults({ month: 6, days: 'any', scope: 'all', themes: [], q: '' }, []);
  assert.match(html, /0곳/);
  assert.match(html, /조건을 조금 풀어보세요/);
});

test('내 목록 — 위시·가봤음 섹션과 빈 상태', () => {
  const furano = byId.get('jp-hokkaido-furano');
  const html = views.listView([furano], []);
  assert.match(html, /위시리스트/);
  assert.match(html, /후라노/);
  assert.match(html, /다녀온 곳을 상세 화면에서 체크/);
  assert.ok(!html.includes('undefined'));
});

test('상세 — 위시/가봤음 버튼 상태', () => {
  const d = byId.get('jp-hokkaido-furano');
  const off = views.place(d, 7, [], { wish: false, visited: false });
  assert.match(off, /♡ 위시리스트/);
  assert.match(off, /data-action="wish"/);
  const on = views.place(d, 7, [], { wish: true, visited: true });
  assert.match(on, /♥ 위시리스트에 있음/);
  assert.match(on, /✓ 가봤음/);
});
