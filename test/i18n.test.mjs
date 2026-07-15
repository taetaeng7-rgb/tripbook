// 한/일 토글 — JA 모드 렌더링 스모크 (파일 단위 프로세스 격리라 다른 테스트에 영향 없음)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLang, getLang, setJaData, t, prefLabel, countryLabel, themeLabel } from '../js/i18n.js';
import * as views from '../js/views.js';
import { picksFor } from '../js/calendar.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const domestic = read('../data/destinations/국내.json');
const overseas = read('../data/destinations/해외.json');
const calendar = read('../data/calendar.json');
const jaMap = { ...read('../data/i18n/ja-domestic.json'), ...read('../data/i18n/ja-overseas.json') };
const byId = new Map([...domestic, ...overseas].map(d => [d.id, d]));

test('기본은 한국어 — ko 렌더', () => {
  assert.equal(getLang(), 'ko');
  const html = views.home(7, picksFor(7, calendar, byId), picksFor(8, calendar, byId));
  assert.match(html, /7월의 여행지/);
});

test('JA 모드 — UI·지명·콘텐츠가 일본어로', () => {
  setLang('ja');
  setJaData(jaMap);
  assert.equal(getLang(), 'ja');
  assert.equal(t('tabHome'), 'ホーム');
  assert.equal(prefLabel('야마가타현'), '山形県');
  assert.equal(prefLabel('도야마현·나가노현'), '富山県・長野県');
  assert.equal(countryLabel('튀르키예'), 'トルコ');
  assert.equal(themeLabel('온천'), '温泉');

  const home = views.home(7, picksFor(7, calendar, byId), picksFor(8, calendar, byId));
  assert.match(home, /7月の旅行先/);
  assert.match(home, /ファーム富田のラベンダー/); // 후라노 7월 이유(일본어)
  assert.match(home, /海の日/); // 연휴 스트립 일본어

  const place = views.place(byId.get('jp-hokkaido-furano'), 7, []);
  assert.match(place, /なぜこの月か/);
  assert.match(place, /富良野・美瑛/); // 국내는 name.local이 제목
  assert.match(place, /見頃/); // PEAK 배지 라벨

  const ovs = views.place(byId.get('tr-cappadocia'), 9, []);
  assert.match(ovs, /カッパドキア/); // 해외는 ja name
  assert.ok(!ovs.includes('undefined'));
});

test('JA 데이터 누락 시 한국어 폴백', () => {
  setLang('ja');
  setJaData({}); // 오버레이 비움
  const html = views.place(byId.get('jp-hokkaido-furano'), 7, []);
  assert.match(html, /라벤더/); // 이유가 한국어로 폴백
  setLang('ko'); // 원복
});

test('전 여행지 JA 렌더에 undefined 없음', () => {
  setLang('ja');
  setJaData(jaMap);
  for (const d of [...domestic, ...overseas]) {
    for (const m of d.bestMonths) {
      const html = views.place(d, m, []);
      assert.ok(!html.includes('undefined'), `${d.id} ${m}월 JA 렌더`);
    }
  }
  setLang('ko');
});
