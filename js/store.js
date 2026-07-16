// 위시리스트·가봤음 — localStorage (없는 환경에선 메모리 폴백: node 테스트용)
const KEYS = { wish: 'tripbook.wish', visited: 'tripbook.visited', pack: 'tripbook.pack' };
const memory = {};

function readList(kind) {
  try {
    return JSON.parse(localStorage.getItem(KEYS[kind])) || [];
  } catch {
    return memory[kind] || [];
  }
}

function writeList(kind, list) {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify(list));
  } catch {
    memory[kind] = list;
  }
}

export function getSet(kind) {
  return new Set(readList(kind));
}

export function toggle(kind, id) {
  const s = getSet(kind);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  writeList(kind, [...s]);
  return s;
}

export function clear(kind) {
  writeList(kind, []);
}
