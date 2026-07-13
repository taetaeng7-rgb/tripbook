import test from 'node:test';
import assert from 'node:assert/strict';
import { currentMonth, nextMonth, normalizeMonth, picksFor, isPeak, reasonFor, reasonMonths } from '../js/calendar.js';

test('currentMonth — 주입된 Date의 월(1~12)', () => {
  assert.equal(currentMonth(new Date('2026-07-14')), 7);
  assert.equal(currentMonth(new Date('2026-01-01')), 1);
  assert.equal(currentMonth(new Date('2026-12-31')), 12);
});

test('nextMonth — 12월 다음은 1월(순환)', () => {
  assert.equal(nextMonth(7), 8);
  assert.equal(nextMonth(12), 1);
});

test('normalizeMonth — 유효 범위 밖은 null', () => {
  assert.equal(normalizeMonth('9'), 9);
  assert.equal(normalizeMonth(12), 12);
  assert.equal(normalizeMonth('13'), null);
  assert.equal(normalizeMonth('0'), null);
  assert.equal(normalizeMonth('x'), null);
  assert.equal(normalizeMonth('1.5'), null);
});

const dest = (id, scope, months, peak) => ({
  id, scope, peakMonth: peak, bestMonths: months,
  name: { ko: id }, summary: `${id} 요약`,
  monthlyReasons: Object.fromEntries(months.map(m => [String(m), { text: `${id}의 ${m}월 이유`, tags: ['기후'] }])),
});

test('picksFor — calendar 순서대로 해석, 깨진 id는 제외', () => {
  const a = dest('a', 'domestic', [1], 1);
  const b = dest('b', 'domestic', [1], 1);
  const c = dest('c', 'overseas', [1], 1);
  const byId = new Map([['a', a], ['b', b], ['c', c]]);
  const calendar = { '1': { domestic: ['b', 'a', 'ghost'], overseas: ['c'] } };
  const picks = picksFor(1, calendar, byId);
  assert.deepEqual(picks.domestic.map(d => d.id), ['b', 'a']);
  assert.deepEqual(picks.overseas.map(d => d.id), ['c']);
  assert.deepEqual(picksFor(2, calendar, byId), { domestic: [], overseas: [] });
});

test('isPeak / reasonFor — 절정 판정과 이유 폴백', () => {
  const d = dest('x', 'domestic', [6, 7], 7);
  assert.equal(isPeak(d, 7), true);
  assert.equal(isPeak(d, 6), false);
  assert.equal(reasonFor(d, 7), 'x의 7월 이유');
  assert.equal(reasonFor(d, 3), 'x 요약'); // 이유 없는 달은 summary 폴백
});

test('reasonMonths — 컨텍스트 월 우선, 나머지 오름차순', () => {
  const d = dest('y', 'domestic', [4, 7, 11], 4);
  assert.deepEqual(reasonMonths(d, 7), [7, 4, 11]);
  assert.deepEqual(reasonMonths(d, 2), [4, 7, 11]); // 컨텍스트 월에 이유 없으면 전체 오름차순
});
