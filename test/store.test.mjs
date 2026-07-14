import test from 'node:test';
import assert from 'node:assert/strict';
import { getSet, toggle } from '../js/store.js';

test('store — toggle로 추가·제거 (node에선 메모리 폴백)', () => {
  assert.equal(getSet('wish').size, 0);
  toggle('wish', 'jp-hokkaido-furano');
  assert.ok(getSet('wish').has('jp-hokkaido-furano'));
  toggle('wish', 'fi-rovaniemi-lapland');
  assert.equal(getSet('wish').size, 2);
  toggle('wish', 'jp-hokkaido-furano');
  assert.ok(!getSet('wish').has('jp-hokkaido-furano'));
  assert.equal(getSet('wish').size, 1);
});

test('store — wish와 visited는 독립', () => {
  toggle('visited', 'jp-kansai-kyoto');
  assert.ok(getSet('visited').has('jp-kansai-kyoto'));
  assert.ok(!getSet('wish').has('jp-kansai-kyoto'));
});
