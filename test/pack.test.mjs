import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACK_MODULES, PACK_SECTIONS, packItemVisible } from '../js/packing.js';
import { toggle, clear, getSet } from '../js/store.js';
import * as views from '../js/views.js';

test('준비물 데이터 — id 유일·한/일 라벨 완비', () => {
  const ids = new Set();
  for (const sec of PACK_SECTIONS) {
    assert.ok(sec.label.ko && sec.label.ja, `${sec.key} 섹션 라벨`);
    for (const it of sec.items) {
      assert.ok(!ids.has(it.id), `중복 id: ${it.id}`);
      ids.add(it.id);
      assert.ok(it.label.ko && it.label.ja, `${it.id} 라벨 한/일`);
      assert.ok(['base', 'overseas', ...PACK_MODULES.map(m => m.key)].includes(it.when), `${it.id} when 어휘`);
    }
  }
});

test('packItemVisible — 국내/해외·모듈 필터', () => {
  const base = { when: 'base' };
  const ovs = { when: 'overseas' };
  const ski = { when: 'ski' };
  assert.equal(packItemVisible(base, false, []), true);
  assert.equal(packItemVisible(ovs, false, []), false);
  assert.equal(packItemVisible(ovs, true, []), true);
  assert.equal(packItemVisible(ski, false, []), false);
  assert.equal(packItemVisible(ski, false, ['ski']), true);
});

test('packView — 국내 기본엔 여권 없음, 해외엔 있음, 모듈 토글 URL', () => {
  const dom = views.packView({ overseas: false, mods: [] }, new Set());
  assert.match(dom, /지갑·현금·카드/);
  assert.ok(!dom.includes('여권'), '국내엔 여권 항목 없음');
  const ovs = views.packView({ overseas: true, mods: ['winter'] }, new Set());
  assert.match(ovs, /여권/);
  assert.match(ovs, /핫팩/);
  assert.ok(ovs.includes('#/pack?m=' + encodeURIComponent('overseas,winter,rain')) || ovs.includes('#/pack?m=overseas%2Cwinter%2Crain'), '모듈 추가 URL');
});

test('packView — 체크 상태·진행률·초기화 버튼', () => {
  const html = views.packView({ overseas: false, mods: [] }, new Set(['wallet', 'phone']));
  assert.match(html, /챙긴 것 <strong>2<\/strong>/);
  assert.match(html, /data-action="pack-reset"/);
  assert.ok(html.includes('data-pack="wallet" checked'));
});

test('store — pack 토글·clear', () => {
  clear('pack');
  toggle('pack', 'wallet');
  assert.ok(getSet('pack').has('wallet'));
  clear('pack');
  assert.equal(getSet('pack').size, 0);
});

test('상세 — 구글맵 버튼 (복수 지명은 첫 지명으로)', () => {
  const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
  const domestic = read('../data/destinations/국내.json');
  const byId = new Map(domestic.map(d => [d.id, d]));
  const html = views.place(byId.get('jp-hokkaido-furano'), 7, []);
  assert.ok(html.includes('google.com/maps/search/?api=1&query=' + encodeURIComponent('富良野')), '富良野・美瑛 → 富良野로 검색');
  assert.match(html, /🗺 지도/);
});
