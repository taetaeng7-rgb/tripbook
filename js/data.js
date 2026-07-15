// 데이터 로드 — calendar.json + 국내/해외 destinations 병렬 fetch 후 인덱스 구성
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

let cache = null;
let jaCache = null;

export async function loadAll() {
  if (cache) return cache;
  const base = 'data/';
  const [calendar, domestic, overseas] = await Promise.all([
    fetchJson(`${base}calendar.json`),
    fetchJson(`${base}destinations/${encodeURIComponent('국내')}.json`),
    fetchJson(`${base}destinations/${encodeURIComponent('해외')}.json`),
  ]);
  const byId = new Map();
  for (const d of [...domestic, ...overseas]) byId.set(d.id, d);
  cache = { calendar, domestic, overseas, byId };
  return cache;
}

// 일본어 오버레이 — JA 모드에서만 지연 로드
export async function loadJa() {
  if (jaCache) return jaCache;
  const [a, b] = await Promise.all([
    fetchJson('data/i18n/ja-domestic.json'),
    fetchJson('data/i18n/ja-overseas.json'),
  ]);
  jaCache = { ...a, ...b };
  return jaCache;
}
