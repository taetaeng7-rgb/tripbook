// 화면 렌더러 — DOM에 접근하지 않는 순수 문자열 빌더 (node 테스트 가능)
import { MONTH_LABELS, SCOPES, DOMESTIC_REGIONS, OVERSEAS_REGIONS, THEMES, BUDGET_LABELS, HOLIDAYS } from './config.js';
import { isPeak, reasonFor, reasonMonths, nextMonth } from './calendar.js';
import { DAY_BUCKETS } from './find.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const emojiFor = d => THEMES[(d.themes || [])[0]] || '📍';
const budgetMark = d => '¥'.repeat(d.budgetLevel || 0);
const daysText = d => (d.recommendedDays ? `${d.recommendedDays.min}~${d.recommendedDays.max}일` : '');
const hoursText = d => (d.access && d.access.hours ? `이동 ~${d.access.hours}h` : '');
const monthsBadge = d => `${(d.bestMonths || []).join('·')}월`;
const placeHref = (d, m) => `#/place/${encodeURIComponent(d.id)}?m=${m}`;

function tagChips(tags) {
  return (tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
}

function badges(d, month) {
  let html = '';
  if (isPeak(d, month)) html += '<span class="badge badge--peak">PEAK</span>';
  if (d.cautions && d.cautions.length) html += '<span class="badge badge--warn" title="주의사항 있음">⚠</span>';
  return html;
}

// 연휴 스트립 (홈·월별)
function holidayStrip(month) {
  const hs = HOLIDAYS[month] || [];
  if (!hs.length) return `<div class="notice notice--calm">🗓 ${month}월은 공휴일이 없는 달 — 어디를 가도 비교적 한산.</div>`;
  return hs.map(h => `<div class="notice">🗓 <strong>${esc(h.name)}</strong> (${esc(h.when)}) — ${esc(h.note)}</div>`).join('');
}

// 월 컨텍스트 카드 (홈·월별·찾기)
function card(d, month) {
  return `
  <a class="card card--${d.scope}" href="${placeHref(d, month)}">
    <span class="card__emoji" aria-hidden="true">${emojiFor(d)}</span>
    <span class="card__body">
      <span class="card__title">${esc(d.name.ko)} ${badges(d, month)}</span>
      <span class="card__reason">${esc(reasonFor(d, month))}</span>
      <span class="card__meta">${budgetMark(d)} · ${daysText(d)} · ${hoursText(d)} · ${esc(d.region)}</span>
    </span>
  </a>`;
}

// 브라우즈 카드 (월 컨텍스트 없음 — 베스트 월 배지 표시)
function browseCard(d) {
  const m = d.peakMonth || (d.bestMonths || [])[0] || 1;
  return `
  <a class="card card--${d.scope}" href="${placeHref(d, m)}">
    <span class="card__emoji" aria-hidden="true">${emojiFor(d)}</span>
    <span class="card__body">
      <span class="card__title">${esc(d.name.ko)}</span>
      <span class="card__reason">${esc(d.summary)}</span>
      <span class="card__meta"><span class="months">베스트 ${monthsBadge(d)}</span> · ${budgetMark(d)} · ${hoursText(d)}</span>
    </span>
  </a>`;
}

function miniCard(d, month) {
  return `
  <a class="mini mini--${d.scope}" href="${placeHref(d, month)}">
    <span aria-hidden="true">${emojiFor(d)}</span>
    <span class="mini__name">${esc(d.name.ko)}</span>
    <span class="mini__scope">${SCOPES[d.scope].label}</span>
  </a>`;
}

function scopeSection(scope, dests, month) {
  return `
  <section class="section">
    <h2 class="section__title section__title--${scope}">${SCOPES[scope].emoji} ${SCOPES[scope].label}</h2>
    <div class="cards">${dests.map(d => card(d, month)).join('')}</div>
  </section>`;
}

export function monthChips(active, now, scope) {
  const q = scope === 'domestic' || scope === 'overseas' ? `?scope=${scope}` : '';
  const chips = [];
  for (let m = 1; m <= 12; m++) {
    const cls = ['chip', m === active ? 'chip--active' : '', m === now ? 'chip--now' : ''].filter(Boolean).join(' ');
    chips.push(`<a class="${cls}" href="#/month/${m}${q}">${m}월</a>`);
  }
  return `<div class="chips" role="tablist">${chips.join('')}</div>`;
}

// ── 홈: 이번 달 + 다음 달 미리보기 ──
export function home(month, picks, nextPicks) {
  const nm = nextMonth(month);
  const minis = [...nextPicks.domestic, ...nextPicks.overseas].map(d => miniCard(d, nm)).join('');
  return `
  <h1 class="page-title">${MONTH_LABELS[month]}의 여행지</h1>
  <p class="page-sub">지금 가기 좋은 곳 — 국내 3 · 해외 3, 이유와 함께.</p>
  ${holidayStrip(month)}
  ${scopeSection('domestic', picks.domestic, month)}
  ${scopeSection('overseas', picks.overseas, month)}
  <section class="section">
    <h2 class="section__title"><a class="plain" href="#/month/${nm}">${MONTH_LABELS[nm]} 미리보기 ▸</a></h2>
    <div class="minis">${minis}</div>
  </section>`;
}

// ── 월별 캘린더 (큐레이션 3+3 + 그 밖의 후보) ──
export function monthView(month, scope, picks, now, extras = { domestic: [], overseas: [] }) {
  const seg = s => `<a class="seg${scope === s ? ' seg--active' : ''}" href="#/month/${month}?scope=${s}">${s === 'all' ? '전체' : SCOPES[s].label}</a>`;
  let body = '';
  if (scope === 'all' || scope === 'domestic') body += scopeSection('domestic', picks.domestic, month);
  if (scope === 'all' || scope === 'overseas') body += scopeSection('overseas', picks.overseas, month);

  const extraList = [
    ...(scope === 'all' || scope === 'domestic' ? extras.domestic : []),
    ...(scope === 'all' || scope === 'overseas' ? extras.overseas : []),
  ];
  const extraHtml = extraList.length
    ? `<section class="section">
        <h2 class="section__title">${MONTH_LABELS[month]}의 다른 후보</h2>
        <div class="minis minis--wrap">${extraList.map(d => miniCard(d, month)).join('')}</div>
      </section>`
    : '';

  return `
  <h1 class="page-title">월별 여행지</h1>
  ${monthChips(month, now, scope)}
  <div class="segs">${seg('all')}${seg('domestic')}${seg('overseas')}</div>
  ${holidayStrip(month)}
  ${body}
  ${extraHtml}`;
}

// ── 국내/해외 브라우즈 (지방·권역 그룹) ──
export function browse(scope, dests) {
  const regions = scope === 'domestic' ? DOMESTIC_REGIONS : OVERSEAS_REGIONS;
  const groups = regions
    .map(r => ({ region: r, items: dests.filter(d => d.region === r) }))
    .filter(g => g.items.length > 0)
    .map(g => `
      <section class="section">
        <h2 class="section__title section__title--${scope}">${esc(g.region)}</h2>
        <div class="cards">${g.items.map(browseCard).join('')}</div>
      </section>`)
    .join('');
  return `
  <h1 class="page-title">${SCOPES[scope].emoji} ${SCOPES[scope].label} 여행지</h1>
  <div class="segs">
    <a class="seg${scope === 'domestic' ? ' seg--active' : ''}" href="#/browse/domestic">국내</a>
    <a class="seg${scope === 'overseas' ? ' seg--active' : ''}" href="#/browse/overseas">해외</a>
  </div>
  ${groups}`;
}

// ── 조건으로 찾기 ──
function findUrl(p, patch = {}) {
  const v = { ...p, ...patch };
  const parts = [];
  parts.push(`m=${v.month === null ? 'any' : v.month}`);
  if (v.days && v.days !== 'any') parts.push(`d=${v.days}`);
  if (v.scope && v.scope !== 'all') parts.push(`s=${v.scope}`);
  if (v.themes && v.themes.length) parts.push(`t=${encodeURIComponent(v.themes.join(','))}`);
  if (v.q) parts.push(`q=${encodeURIComponent(v.q)}`);
  return `#/find?${parts.join('&')}`;
}

export function findResults(p, results) {
  const cards = results.map(d => (p.month ? card(d, p.month) : browseCard(d))).join('');
  return `
  <p class="count">조건에 맞는 여행지 <strong>${results.length}곳</strong></p>
  ${results.length ? `<div class="cards">${cards}</div>` : '<div class="empty"><p class="empty__emoji" aria-hidden="true">🔎</p><p class="page-sub">조건을 조금 풀어보세요 — 테마를 줄이거나 월을 \'전체\'로.</p></div>'}`;
}

export function findView(p, results) {
  const monthChipsHtml = ['<a class="chip' + (p.month === null ? ' chip--active' : '') + `" href="${findUrl(p, { month: null })}">전체</a>`]
    .concat(Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return `<a class="chip${p.month === m ? ' chip--active' : ''}" href="${findUrl(p, { month: m })}">${m}월</a>`;
    })).join('');

  const dayChips = DAY_BUCKETS.map(b =>
    `<a class="chip${p.days === b.key ? ' chip--active' : ''}" href="${findUrl(p, { days: b.key })}">${b.label}</a>`
  ).join('');

  const scopeSegs = ['all', 'domestic', 'overseas'].map(s =>
    `<a class="seg${p.scope === s ? ' seg--active' : ''}" href="${findUrl(p, { scope: s })}">${s === 'all' ? '전체' : SCOPES[s].label}</a>`
  ).join('');

  const themeChips = Object.keys(THEMES).map(t => {
    const on = p.themes.includes(t);
    const next = on ? p.themes.filter(x => x !== t) : [...p.themes, t];
    return `<a class="chip${on ? ' chip--on' : ''}" href="${findUrl(p, { themes: next })}">${THEMES[t]} ${esc(t)}</a>`;
  }).join('');

  return `
  <h1 class="page-title">🔎 조건으로 찾기</h1>
  <input id="find-q" class="search-input" type="search" placeholder="이름·나라·테마 검색 (예: 온천, 스위스)" value="${esc(p.q)}" autocomplete="off">
  <div class="filter-row"><span class="filter-row__label">언제</span><div class="chips">${monthChipsHtml}</div></div>
  <div class="filter-row"><span class="filter-row__label">며칠</span><div class="chips chips--wrap">${dayChips}</div></div>
  <div class="filter-row"><span class="filter-row__label">구분</span><div class="segs">${scopeSegs}</div></div>
  <div class="filter-row"><span class="filter-row__label">테마</span><div class="chips chips--wrap">${themeChips}</div></div>
  <div id="find-results">${findResults(p, results)}</div>`;
}

// ── 내 목록 (위시리스트·가봤음) ──
export function listView(wishDests, visitedDests) {
  const section = (title, dests, emptyMsg) => `
  <section class="section">
    <h2 class="section__title">${title} <span class="count-inline">${dests.length}</span></h2>
    ${dests.length ? `<div class="cards">${dests.map(browseCard).join('')}</div>` : `<p class="page-sub">${emptyMsg}</p>`}
  </section>`;
  return `
  <h1 class="page-title">내 목록</h1>
  ${section('♥ 위시리스트', wishDests, '아직 없어요 — 여행지 상세에서 ♡를 눌러 담아두세요.')}
  ${section('✓ 가봤음', visitedDests, '다녀온 곳을 상세 화면에서 체크하면 여기에 쌓입니다.')}`;
}

// ── 여행지 상세 ──
export function place(d, ctxMonth, others, state = { wish: false, visited: false }) {
  const whyItems = reasonMonths(d, ctxMonth).map(m => {
    const r = d.monthlyReasons[String(m)];
    const open = m === ctxMonth ? ' open' : '';
    const peak = isPeak(d, m) ? ' <span class="badge badge--peak">절정</span>' : '';
    return `
    <details class="why"${open}>
      <summary><strong>${MONTH_LABELS[m]}</strong>${peak}</summary>
      <p>${esc(r.text)}</p>
      <div class="why__tags">${tagChips(r.tags)}</div>
    </details>`;
  }).join('');

  const list = (title, items, cls) => (items && items.length
    ? `<section class="section"><h2 class="section__title">${title}</h2><ul class="${cls}">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`
    : '');

  const events = (d.events && d.events.length)
    ? `<section class="section"><h2 class="section__title">📅 시즌 이벤트</h2><ul class="plainlist">${d.events.map(e => `<li><strong>${esc(e.name)}</strong> — ${esc(e.when)}</li>`).join('')}</ul></section>`
    : '';

  const othersHtml = (others && others.length)
    ? `<section class="section"><h2 class="section__title">${MONTH_LABELS[ctxMonth]}의 다른 추천</h2><div class="minis">${others.map(o => miniCard(o, ctxMonth)).join('')}</div></section>`
    : '';

  return `
  <article>
    <div class="hero hero--${d.scope}">
      <div class="hero__emoji" aria-hidden="true">${emojiFor(d)}</div>
      <h1 class="hero__title">${esc(d.name.ko)}</h1>
      ${d.name.local ? `<p class="hero__local">${esc(d.name.local)}</p>` : ''}
      <div class="hero__badges">
        <span class="badge badge--scope">${SCOPES[d.scope].label}</span>
        <span class="badge">${esc(d.country)} · ${esc(d.region)}</span>
        <span class="badge">베스트 ${monthsBadge(d)}</span>
      </div>
    </div>

    <div class="acts">
      <button type="button" class="act${state.wish ? ' act--on' : ''}" data-action="wish" data-id="${esc(d.id)}">${state.wish ? '♥ 위시리스트에 있음' : '♡ 위시리스트'}</button>
      <button type="button" class="act act--visited${state.visited ? ' act--on' : ''}" data-action="visited" data-id="${esc(d.id)}">${state.visited ? '✓ 가봤음' : '가봤음 체크'}</button>
    </div>

    <section class="section">
      <h2 class="section__title">⏰ 왜 이 달인가</h2>
      ${whyItems}
    </section>

    <section class="section">
      <h2 class="section__title">✨ 하이라이트</h2>
      <p class="summary">${esc(d.summary)}</p>
      <ul class="plainlist">${(d.highlights || []).map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    </section>

    <section class="section">
      <h2 class="section__title">🚄 실용 정보</h2>
      <div class="info-grid">
        <div class="info"><span class="info__k">도쿄에서</span><span class="info__v">${esc(d.access.how)}</span></div>
        <div class="info"><span class="info__k">추천 일수</span><span class="info__v">${daysText(d)}</span></div>
        <div class="info"><span class="info__k">예산</span><span class="info__v">${budgetMark(d)} <small>(${BUDGET_LABELS[d.budgetLevel]})</small></span></div>
        <div class="info"><span class="info__k">테마</span><span class="info__v">${tagChips(d.themes)}</span></div>
      </div>
    </section>

    ${list('💡 팁', d.tips, 'plainlist')}
    ${list('⚠️ 주의', d.cautions, 'plainlist warnlist')}
    ${events}
    ${othersHtml}
  </article>`;
}

export function notFound() {
  return `
  <div class="empty">
    <p class="empty__emoji" aria-hidden="true">🧭</p>
    <h1 class="page-title">여행지를 찾을 수 없습니다</h1>
    <p><a class="btn" href="#/">홈으로</a></p>
  </div>`;
}

export function loadError() {
  return `
  <div class="empty">
    <p class="empty__emoji" aria-hidden="true">✈️</p>
    <h1 class="page-title">데이터를 불러오지 못했습니다</h1>
    <p class="page-sub">네트워크 상태를 확인해 주세요.</p>
    <p><button class="btn" id="retry">다시 시도</button></p>
  </div>`;
}
