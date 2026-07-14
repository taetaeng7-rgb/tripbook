import test from 'node:test';
import assert from 'node:assert/strict';
import { matchDest, findDestinations, dayBucket, parseThemes, DAY_BUCKETS } from '../js/find.js';

const dest = (id, over = {}) => ({
  id,
  scope: 'domestic',
  name: { ko: id, local: id },
  country: '일본',
  region: '간토',
  summary: `${id} 요약`,
  bestMonths: [7],
  peakMonth: 7,
  themes: ['온천'],
  recommendedDays: { min: 2, max: 3 },
  access: { how: '-', hours: 2 },
  monthlyReasons: { '7': { text: 'x', tags: ['기후'] } },
  ...over,
});

test('matchDest — scope·월·테마 필터', () => {
  const d = dest('a');
  assert.equal(matchDest(d, { scope: 'domestic', themes: [] }), true);
  assert.equal(matchDest(d, { scope: 'overseas', themes: [] }), false);
  assert.equal(matchDest(d, { month: 7, themes: [] }), true);
  assert.equal(matchDest(d, { month: 8, themes: [] }), false);
  assert.equal(matchDest(d, { themes: ['온천'] }), true);
  assert.equal(matchDest(d, { themes: ['사파리'] }), false);
});

test('matchDest — 기간 버킷은 구간 겹침으로 판정', () => {
  const d = dest('a', { recommendedDays: { min: 2, max: 4 } });
  assert.equal(matchDest(d, { days: dayBucket('weekend'), themes: [] }), true);  // 1~2일 ∩ 2~4일
  assert.equal(matchDest(d, { days: dayBucket('short'), themes: [] }), true);    // 3~4일
  assert.equal(matchDest(d, { days: dayBucket('week'), themes: [] }), false);    // 5~7일
  assert.equal(matchDest(d, { days: dayBucket('any'), themes: [] }), true);      // 전체
});

test('matchDest — 텍스트 검색(이름·나라·테마·요약, 대소문자 무시)', () => {
  const d = dest('스위스 알프스', { country: '스위스', themes: ['산악'], name: { ko: '스위스 알프스', local: 'Grindelwald' } });
  assert.equal(matchDest(d, { themes: [], q: '스위스' }), true);
  assert.equal(matchDest(d, { themes: [], q: 'grindelwald' }), true);
  assert.equal(matchDest(d, { themes: [], q: '산악' }), true);
  assert.equal(matchDest(d, { themes: [], q: '사파리' }), false);
});

test('findDestinations — 선택 월 절정 우선, 이후 가까운 순', () => {
  const a = dest('far-peak', { peakMonth: 7, access: { how: '-', hours: 10 } });
  const b = dest('near-nopeak', { peakMonth: 8, bestMonths: [7, 8], access: { how: '-', hours: 1 } });
  const c = dest('near-peak', { peakMonth: 7, access: { how: '-', hours: 2 } });
  const r = findDestinations([a, b, c], { month: 7, themes: [] });
  assert.deepEqual(r.map(d => d.id), ['near-peak', 'far-peak', 'near-nopeak']);
});

test('parseThemes / DAY_BUCKETS', () => {
  assert.deepEqual(parseThemes('온천,단풍'), ['온천', '단풍']);
  assert.deepEqual(parseThemes(''), []);
  assert.deepEqual(parseThemes(null), []);
  assert.equal(dayBucket('없는키').key, 'any');
  assert.equal(DAY_BUCKETS.length, 5);
});
