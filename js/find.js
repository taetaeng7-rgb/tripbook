// 조건으로 찾기 — 월 × 기간 × 구분 × 테마 × 텍스트 매칭 (순수 함수)

export const DAY_BUCKETS = [
  { key: 'any', label: '전체' },
  { key: 'weekend', label: '1~2일', lo: 1, hi: 2 },
  { key: 'short', label: '3~4일', lo: 3, hi: 4 },
  { key: 'week', label: '5~7일', lo: 5, hi: 7 },
  { key: 'long', label: '8일~', lo: 8, hi: 99 },
];

export function dayBucket(key) {
  return DAY_BUCKETS.find(b => b.key === key) || DAY_BUCKETS[0];
}

export function parseThemes(raw) {
  return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
}

export function matchDest(d, { month, days, themes = [], scope = 'all', q = '' }) {
  if (scope !== 'all' && d.scope !== scope) return false;
  if (month && !(d.bestMonths || []).includes(month)) return false;
  if (days && days.lo && !(d.recommendedDays.min <= days.hi && d.recommendedDays.max >= days.lo)) return false;
  if (themes.length && !themes.some(t => (d.themes || []).includes(t))) return false;
  if (q) {
    const hay = [d.name.ko, d.name.local, d.country, d.region, d.prefecture, d.summary, ...(d.themes || [])]
      .filter(Boolean).join(' ').toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  return true;
}

// 매칭 후 정렬: 선택 월의 절정(peak) 우선 → 도쿄에서 가까운 순
export function findDestinations(all, opts) {
  return all
    .filter(d => matchDest(d, opts))
    .sort((a, b) =>
      (opts.month ? ((b.peakMonth === opts.month) - (a.peakMonth === opts.month)) : 0)
      || a.access.hours - b.access.hours
    );
}
