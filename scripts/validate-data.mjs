// 데이터 검증 D01~D14 (기획서 §6.2) — error 발견 시 exit 1로 배포 차단
import { readFileSync } from 'node:fs';
import { DOMESTIC_REGIONS, OVERSEAS_REGIONS, THEMES, REASON_TAGS } from '../js/config.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const domestic = read('../data/destinations/국내.json');
const overseas = read('../data/destinations/해외.json');
const calendar = read('../data/calendar.json');

const errors = [];
const warns = [];
const err = (rule, msg) => errors.push(`[${rule}] ${msg}`);
const warn = (rule, msg) => warns.push(`[${rule}] ${msg}`);

const all = [...domestic, ...overseas];
const byId = new Map();
const THEME_VOCAB = Object.keys(THEMES);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEAR_RE = /20\d{2}년/;

// ── D01: id 고유·kebab-case·국가 접두사(2자) ──
for (const d of all) {
  if (!d.id || !/^[a-z]{2}(-[a-z0-9]+)+$/.test(d.id)) err('D01', `잘못된 id 형식: ${d.id}`);
  if (byId.has(d.id)) err('D01', `중복 id: ${d.id}`);
  byId.set(d.id, d);
}

for (const d of all) {
  const id = d.id || '(id 없음)';

  // ── D02: 필수 필드 ──
  const required = ['name', 'scope', 'country', 'region', 'bestMonths', 'monthlyReasons', 'summary', 'highlights', 'themes', 'access', 'recommendedDays', 'budgetLevel'];
  for (const f of required) {
    if (d[f] === undefined || d[f] === null) err('D02', `${id}: 필수 필드 누락 — ${f}`);
  }
  if (!d.name || !d.name.ko) err('D02', `${id}: name.ko 누락`);

  // ── D03: scope 값·파일 일치 ──
  if (!['domestic', 'overseas'].includes(d.scope)) err('D03', `${id}: scope 값 이상 — ${d.scope}`);
  if (domestic.includes(d) && d.scope !== 'domestic') err('D03', `${id}: 국내.json에 domestic 아님`);
  if (overseas.includes(d) && d.scope !== 'overseas') err('D03', `${id}: 해외.json에 overseas 아님`);

  // ── D04: region 어휘 ──
  const regions = d.scope === 'domestic' ? DOMESTIC_REGIONS : OVERSEAS_REGIONS;
  if (!regions.includes(d.region)) err('D04', `${id}: region 어휘 밖 — ${d.region}`);

  // ── D05: bestMonths·peakMonth ──
  const bm = d.bestMonths || [];
  if (!Array.isArray(bm) || bm.length === 0) err('D05', `${id}: bestMonths 비어 있음`);
  if (bm.some(m => !MONTHS.includes(m))) err('D05', `${id}: bestMonths 범위 밖 — ${bm}`);
  if (new Set(bm).size !== bm.length) err('D05', `${id}: bestMonths 중복`);
  if (d.peakMonth !== undefined && !bm.includes(d.peakMonth)) err('D05', `${id}: peakMonth(${d.peakMonth})가 bestMonths에 없음`);

  // ── D06: monthlyReasons 키·text·tags ──
  for (const [k, r] of Object.entries(d.monthlyReasons || {})) {
    const m = Number(k);
    if (!bm.includes(m)) err('D06', `${id}: monthlyReasons["${k}"]가 bestMonths 밖`);
    if (!r || !r.text || !String(r.text).trim()) err('D06', `${id}: ${k}월 이유 text 비어 있음`);
    if (!Array.isArray(r.tags) || r.tags.length === 0) err('D06', `${id}: ${k}월 이유 tags 없음`);
    else for (const t of r.tags) if (!REASON_TAGS.includes(t)) err('D06', `${id}: ${k}월 근거 태그 어휘 밖 — ${t}`);
    if (r && r.text && r.text.length > 120) warn('D09', `${id}: ${k}월 이유 120자 초과(${r.text.length})`);
    if (r && r.text && YEAR_RE.test(r.text)) warn('D14', `${id}: ${k}월 이유에 연도 하드코딩`);
  }

  // ── D07: themes 어휘·개수 ──
  const th = d.themes || [];
  if (th.length < 1 || th.length > 4) err('D07', `${id}: themes는 1~4개 — ${th.length}개`);
  for (const t of th) if (!THEME_VOCAB.includes(t)) err('D07', `${id}: 테마 어휘 밖 — ${t}`);

  // ── D08: budgetLevel·recommendedDays·access.hours ──
  if (!(d.budgetLevel >= 1 && d.budgetLevel <= 5)) err('D08', `${id}: budgetLevel 1~5 밖 — ${d.budgetLevel}`);
  if (d.recommendedDays && !(d.recommendedDays.min <= d.recommendedDays.max)) err('D08', `${id}: recommendedDays min > max`);
  if (!d.access || !(d.access.hours > 0)) err('D08', `${id}: access.hours > 0 필요`);

  // ── D09: 길이 ──
  if (d.summary && d.summary.length > 90) warn('D09', `${id}: summary 90자 초과(${d.summary.length})`);

  // ── D14: events 연도 하드코딩 ──
  for (const e of d.events || []) {
    if (e.when && YEAR_RE.test(e.when)) warn('D14', `${id}: events.when에 연도 하드코딩 — ${e.when}`);
  }
}

// ── D10~D12: calendar.json ──
for (const m of MONTHS) {
  const entry = calendar[String(m)];
  if (!entry) { err('D10', `calendar에 ${m}월 없음`); continue; }
  for (const scope of ['domestic', 'overseas']) {
    const ids = entry[scope] || [];
    if (ids.length !== 3) err('D10', `${m}월 ${scope} ${ids.length}개 (정확히 3개 필요)`);
    for (const id of ids) {
      const d = byId.get(id);
      if (!d) { err('D11', `${m}월 참조 id 실재하지 않음 — ${id}`); continue; }
      if (d.scope !== scope) err('D11', `${m}월 ${scope}에 ${d.scope} 여행지 — ${id}`);
      if (!(d.bestMonths || []).includes(m)) err('D12', `${id}: calendar ${m}월 배정이나 bestMonths에 없음`);
      if (!d.monthlyReasons || !d.monthlyReasons[String(m)]) err('D12', `${id}: calendar ${m}월 배정이나 해당 월 이유 없음`);
      // ── D13: 태풍철(8~9월) 오키나와·규슈 배정 시 cautions 필수 ──
      if ([8, 9].includes(m) && ['오키나와', '규슈'].includes(d.region) && !(d.cautions || []).length) {
        warn('D13', `${id}: ${m}월(태풍철) 배정인데 cautions 없음`);
      }
    }
  }
}

// ── 결과 출력 ──
const slotCount = MONTHS.reduce((n, m) => n + ((calendar[String(m)]?.domestic?.length || 0) + (calendar[String(m)]?.overseas?.length || 0)), 0);
console.log(`여행지 ${all.length}건(국내 ${domestic.length}·해외 ${overseas.length}), 캘린더 슬롯 ${slotCount}개 검사`);
for (const w of warns) console.log(`⚠ warn ${w}`);
for (const e of errors) console.error(`✖ error ${e}`);
console.log(errors.length ? `\n검증 실패: error ${errors.length}건, warn ${warns.length}건` : `\n검증 통과 (warn ${warns.length}건)`);
process.exit(errors.length ? 1 : 0);
