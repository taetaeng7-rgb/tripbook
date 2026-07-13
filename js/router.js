// 해시 라우터 — `#/month/9?scope=overseas` → { segments: ['month','9'], query }
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(queryPart || '');
  return { segments, query };
}

export function startRouter(dispatch) {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
