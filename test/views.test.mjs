// 실제 시드 데이터로 뷰 렌더링 스모크 테스트 (DOM 없이 문자열 검증)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as views from '../js/views.js';
import { picksFor, nextMonth } from '../js/calendar.js';

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
