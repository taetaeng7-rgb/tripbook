// 월별 추천 로직 — 순수 함수 (Date는 인자로 주입해 테스트 가능하게)

export function currentMonth(now = new Date()) {
  return now.getMonth() + 1;
}

export function nextMonth(m) {
  return m === 12 ? 1 : m + 1;
}

// '9' → 9, '13'/'x'/0 → null
export function normalizeMonth(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

// calendar.json의 월 항목을 여행지 객체로 해석 (깨진 id는 조용히 제외 — 검증 스크립트가 별도 방어)
export function picksFor(month, calendar, byId) {
  const entry = (calendar && calendar[String(month)]) || {};
  const resolve = ids => (ids || []).map(id => byId.get(id)).filter(Boolean);
  return { domestic: resolve(entry.domestic), overseas: resolve(entry.overseas) };
}

export function isPeak(dest, month) {
  return dest.peakMonth === month;
}

// 해당 월의 추천 이유 텍스트 (없으면 summary 폴백)
export function reasonFor(dest, month) {
  const r = dest.monthlyReasons && dest.monthlyReasons[String(month)];
  return r && r.text ? r.text : dest.summary;
}

// "왜 이 달인가" 섹션용: 이유가 있는 월 목록 (컨텍스트 월 우선, 나머지 오름차순)
export function reasonMonths(dest, ctxMonth) {
  const months = Object.keys(dest.monthlyReasons || {}).map(Number).sort((a, b) => a - b);
  if (months.includes(ctxMonth)) {
    return [ctxMonth, ...months.filter(m => m !== ctxMonth)];
  }
  return months;
}
