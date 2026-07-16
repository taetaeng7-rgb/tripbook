// 화면 렌더러 — DOM에 접근하지 않는 순수 문자열 빌더 (node 테스트 가능, 한/일 i18n 지원)
import { THEMES, DOMESTIC_REGIONS, OVERSEAS_REGIONS, SCOPES } from './config.js';
import { isPeak, reasonMonths, nextMonth } from './calendar.js';
import { DAY_BUCKETS } from './find.js';
import {
  t, pick, bucketLabel, scopeLabel, regionLabel, themeLabel, tagLabel, prefLabel, countryLabel,
  budgetLabel, holidayItems, dName, dAltName, dSummary, dReason, dList, dAccess, dEvents,
} from './i18n.js';
import { PACK_MODULES, PACK_SECTIONS, packItemVisible } from './packing.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const emojiFor = d => THEMES[(d.themes || [])[0]] || '📍';
const budgetMark = d => '¥'.repeat(d.budgetLevel || 0);
const daysText = d => (d.recommendedDays ? t('daysR', d.recommendedDays.min, d.recommendedDays.max) : '');
const hoursText = d => (d.access && d.access.hours ? t('moveH', d.access.hours) : '');
const monthsBadge = d => t('monthsBadge', d.bestMonths || []);
// 위치 표기: 국내 = 도도부현, 해외 = 국가 (도시는 이름에 포함)
const locationText = d => (d.scope === 'domestic' ? prefLabel(d.prefecture || d.region) : countryLabel(d.country));
const placeHref = (d, m) => `#/place/${encodeURIComponent(d.id)}?m=${m}`;

function tagChips(tags, mapFn) {
  return (tags || []).map(x => `<span class="tag">${esc(mapFn(x))}</span>`).join('');
}

function badges(d, month) {
  let html = '';
  if (isPeak(d, month)) html += '<span class="badge badge--peak">PEAK</span>';
  if (d.cautions && d.cautions.length) html += `<span class="badge badge--warn" title="${esc(t('warnTitle'))}">⚠</span>`;
  return html;
}

// 연휴 스트립 (홈·월별)
function holidayStrip(month) {
  const hs = holidayItems(month);
  if (!hs.length) return `<div class="notice notice--calm">${esc(t('noHoliday', month))}</div>`;
  return hs.map(h => `<div class="notice">🗓 <strong>${esc(h.name)}</strong> (${esc(h.when)}) — ${esc(h.note)}</div>`).join('');
}

// 월 컨텍스트 카드 (홈·월별·찾기)
function card(d, month) {
  return `
  <a class="card card--${d.scope}" href="${placeHref(d, month)}">
    <span class="card__emoji" aria-hidden="true">${emojiFor(d)}</span>
    <span class="card__body">
      <span class="card__title">${esc(dName(d))} ${badges(d, month)}</span>
      <span class="card__reason">${esc(dReason(d, month))}</span>
      <span class="card__meta">${budgetMark(d)} · ${daysText(d)} · ${hoursText(d)} · ${esc(locationText(d))}</span>
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
      <span class="card__title">${esc(dName(d))}</span>
      <span class="card__reason">${esc(dSummary(d))}</span>
      <span class="card__meta"><span class="months">${esc(t('best'))} ${esc(monthsBadge(d))}</span> · ${budgetMark(d)} · ${hoursText(d)} · ${esc(locationText(d))}</span>
    </span>
  </a>`;
}

function miniCard(d, month) {
  return `
  <a class="mini mini--${d.scope}" href="${placeHref(d, month)}">
    <span aria-hidden="true">${emojiFor(d)}</span>
    <span class="mini__name">${esc(dName(d))}</span>
    <span class="mini__scope">${esc(scopeLabel(d.scope))}</span>
  </a>`;
}

function scopeSection(scope, dests, month) {
  return `
  <section class="section">
    <h2 class="section__title section__title--${scope}">${SCOPES[scope].emoji} ${esc(scopeLabel(scope))}</h2>
    <div class="cards">${dests.map(d => card(d, month)).join('')}</div>
  </section>`;
}

export function monthChips(active, now, scope) {
  const q = scope === 'domestic' || scope === 'overseas' ? `?scope=${scope}` : '';
  const chips = [];
  for (let m = 1; m <= 12; m++) {
    const cls = ['chip', m === active ? 'chip--active' : '', m === now ? 'chip--now' : ''].filter(Boolean).join(' ');
    chips.push(`<a class="${cls}" href="#/month/${m}${q}">${esc(t('monthChip', m))}</a>`);
  }
  return `<div class="chips" role="tablist">${chips.join('')}</div>`;
}

// ── 홈: 이번 달 + 다음 달 미리보기 ──
export function home(month, picks, nextPicks) {
  const nm = nextMonth(month);
  const minis = [...nextPicks.domestic, ...nextPicks.overseas].map(d => miniCard(d, nm)).join('');
  return `
  <h1 class="page-title">${esc(t('homeTitle', month))}</h1>
  <p class="page-sub">${esc(t('homeSub'))}</p>
  ${holidayStrip(month)}
  ${scopeSection('domestic', picks.domestic, month)}
  ${scopeSection('overseas', picks.overseas, month)}
  <section class="section">
    <h2 class="section__title"><a class="plain" href="#/month/${nm}">${esc(t('preview', nm))}</a></h2>
    <div class="minis">${minis}</div>
  </section>`;
}

// ── 월별 캘린더 (큐레이션 3+3 + 그 밖의 후보) ──
export function monthView(month, scope, picks, now, extras = { domestic: [], overseas: [] }) {
  const seg = s => `<a class="seg${scope === s ? ' seg--active' : ''}" href="#/month/${month}?scope=${s}">${s === 'all' ? esc(t('all')) : esc(scopeLabel(s))}</a>`;
  let body = '';
  if (scope === 'all' || scope === 'domestic') body += scopeSection('domestic', picks.domestic, month);
  if (scope === 'all' || scope === 'overseas') body += scopeSection('overseas', picks.overseas, month);

  const extraList = [
    ...(scope === 'all' || scope === 'domestic' ? extras.domestic : []),
    ...(scope === 'all' || scope === 'overseas' ? extras.overseas : []),
  ];
  const extraHtml = extraList.length
    ? `<section class="section">
        <h2 class="section__title">${esc(t('extras', month))}</h2>
        <div class="minis minis--wrap">${extraList.map(d => miniCard(d, month)).join('')}</div>
      </section>`
    : '';

  return `
  <h1 class="page-title">${esc(t('monthViewTitle'))}</h1>
  ${monthChips(month, now, scope)}
  <div class="segs">${seg('all')}${seg('domestic')}${seg('overseas')}</div>
  ${holidayStrip(month)}
  ${body}
  ${extraHtml}`;
}

// ── 국내/해외 브라우즈 (지방·권역 그룹 + 도도부현/국가 필터) ──
export function browse(scope, dests, filter = null) {
  const regions = scope === 'domestic' ? DOMESTIC_REGIONS : OVERSEAS_REGIONS;
  // 국내 = 도도부현, 해외 = 국가. '·'로 묶인 복수 지역은 분해해 양쪽 필터에서 매칭
  const fieldParts = d => String(scope === 'domestic' ? (d.prefecture || d.region) : d.country).split('·');
  const labelFn = scope === 'domestic' ? prefLabel : countryLabel;

  // 카테고리 칩 — 지방/권역 순서대로 등장 순 정렬
  const parts = [];
  for (const r of regions) {
    for (const d of dests.filter(x => x.region === r)) {
      for (const p of fieldParts(d)) if (!parts.includes(p)) parts.push(p);
    }
  }
  const base = `#/browse/${scope}`;
  const filterChips = [`<a class="chip${!filter ? ' chip--active' : ''}" href="${base}">${esc(t('all'))}</a>`]
    .concat(parts.map(p => `<a class="chip${filter === p ? ' chip--active' : ''}" href="${base}?f=${encodeURIComponent(p)}">${esc(labelFn(p))}</a>`))
    .join('');

  let body;
  if (filter) {
    const items = dests.filter(d => fieldParts(d).includes(filter));
    body = `
    <p class="count">${t('foundCount', items.length)}</p>
    <div class="cards">${items.map(browseCard).join('')}</div>`;
  } else {
    body = regions
      .map(r => ({ region: r, items: dests.filter(d => d.region === r) }))
      .filter(g => g.items.length > 0)
      .map(g => `
        <section class="section">
          <h2 class="section__title section__title--${scope}">${esc(regionLabel(g.region))}</h2>
          <div class="cards">${g.items.map(browseCard).join('')}</div>
        </section>`)
      .join('');
  }

  return `
  <h1 class="page-title">${esc(t(scope === 'domestic' ? 'browseDomestic' : 'browseOverseas'))}</h1>
  <div class="segs">
    <a class="seg${scope === 'domestic' ? ' seg--active' : ''}" href="#/browse/domestic">${esc(scopeLabel('domestic'))}</a>
    <a class="seg${scope === 'overseas' ? ' seg--active' : ''}" href="#/browse/overseas">${esc(scopeLabel('overseas'))}</a>
  </div>
  <div class="chips">${filterChips}</div>
  ${body}`;
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
  <p class="count">${t('foundCount', results.length)}</p>
  ${results.length ? `<div class="cards">${cards}</div>` : `<div class="empty"><p class="empty__emoji" aria-hidden="true">🔎</p><p class="page-sub">${esc(t('findEmpty'))}</p></div>`}`;
}

export function findView(p, results) {
  const monthChipsHtml = ['<a class="chip' + (p.month === null ? ' chip--active' : '') + `" href="${findUrl(p, { month: null })}">${esc(t('all'))}</a>`]
    .concat(Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return `<a class="chip${p.month === m ? ' chip--active' : ''}" href="${findUrl(p, { month: m })}">${esc(t('monthChip', m))}</a>`;
    })).join('');

  const dayChips = DAY_BUCKETS.map(b =>
    `<a class="chip${p.days === b.key ? ' chip--active' : ''}" href="${findUrl(p, { days: b.key })}">${esc(bucketLabel(b.key))}</a>`
  ).join('');

  const scopeSegs = ['all', 'domestic', 'overseas'].map(s =>
    `<a class="seg${p.scope === s ? ' seg--active' : ''}" href="${findUrl(p, { scope: s })}">${s === 'all' ? esc(t('all')) : esc(scopeLabel(s))}</a>`
  ).join('');

  const themeChips = Object.keys(THEMES).map(th => {
    const on = p.themes.includes(th);
    const next = on ? p.themes.filter(x => x !== th) : [...p.themes, th];
    return `<a class="chip${on ? ' chip--on' : ''}" href="${findUrl(p, { themes: next })}">${THEMES[th]} ${esc(themeLabel(th))}</a>`;
  }).join('');

  return `
  <h1 class="page-title">${esc(t('findTitle'))}</h1>
  <input id="find-q" class="search-input" type="search" placeholder="${esc(t('searchPh'))}" value="${esc(p.q)}" autocomplete="off">
  <div class="filter-row"><span class="filter-row__label">${esc(t('when'))}</span><div class="chips">${monthChipsHtml}</div></div>
  <div class="filter-row"><span class="filter-row__label">${esc(t('howLong'))}</span><div class="chips chips--wrap">${dayChips}</div></div>
  <div class="filter-row"><span class="filter-row__label">${esc(t('scopeF'))}</span><div class="segs">${scopeSegs}</div></div>
  <div class="filter-row"><span class="filter-row__label">${esc(t('themeF'))}</span><div class="chips chips--wrap">${themeChips}</div></div>
  <div id="find-results">${findResults(p, results)}</div>`;
}

// ── 내 목록 (위시리스트·가봤음) ──
export function listView(wishDests, visitedDests) {
  const section = (title, dests, emptyMsg) => `
  <section class="section">
    <h2 class="section__title">${esc(title)} <span class="count-inline">${dests.length}</span></h2>
    ${dests.length ? `<div class="cards">${dests.map(browseCard).join('')}</div>` : `<p class="page-sub">${esc(emptyMsg)}</p>`}
  </section>`;
  return `
  <h1 class="page-title">${esc(t('myList'))}</h1>
  ${section(t('wishSec'), wishDests, t('wishEmpty'))}
  ${section(t('visitedSec'), visitedDests, t('visitedEmpty'))}`;
}

// ── 여행지 상세 ──
export function place(d, ctxMonth, others, state = { wish: false, visited: false }) {
  const whyItems = reasonMonths(d, ctxMonth).map(m => {
    const r = d.monthlyReasons[String(m)];
    const open = m === ctxMonth ? ' open' : '';
    const peak = isPeak(d, m) ? ` <span class="badge badge--peak">${esc(t('peakBadge'))}</span>` : '';
    return `
    <details class="why"${open}>
      <summary><strong>${esc(t('monthChip', m))}</strong>${peak}</summary>
      <p>${esc(dReason(d, m))}</p>
      <div class="why__tags">${tagChips(r.tags, tagLabel)}</div>
    </details>`;
  }).join('');

  const list = (title, items, cls) => (items && items.length
    ? `<section class="section"><h2 class="section__title">${esc(title)}</h2><ul class="${cls}">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`
    : '');

  const events = dEvents(d);
  const eventsHtml = events.length
    ? `<section class="section"><h2 class="section__title">${esc(t('eventsT'))}</h2><ul class="plainlist">${events.map(e => `<li><strong>${esc(e.name)}</strong> — ${esc(e.when)}</li>`).join('')}</ul></section>`
    : '';

  const othersHtml = (others && others.length)
    ? `<section class="section"><h2 class="section__title">${esc(t('othersT', ctxMonth))}</h2><div class="minis">${others.map(o => miniCard(o, ctxMonth)).join('')}</div></section>`
    : '';

  const areaBadge = d.scope === 'domestic' && d.prefecture
    ? `${prefLabel(d.prefecture)} · ${regionLabel(d.region)}`
    : `${countryLabel(d.country)} · ${regionLabel(d.region)}`;

  return `
  <article>
    <div class="hero hero--${d.scope}">
      <div class="hero__emoji" aria-hidden="true">${emojiFor(d)}</div>
      <h1 class="hero__title">${esc(dName(d))}</h1>
      ${dAltName(d) ? `<p class="hero__local">${esc(dAltName(d))}</p>` : ''}
      <div class="hero__badges">
        <span class="badge badge--scope">${esc(scopeLabel(d.scope))}</span>
        <span class="badge">${esc(areaBadge)}</span>
        <span class="badge">${esc(t('best'))} ${esc(monthsBadge(d))}</span>
      </div>
    </div>

    <div class="acts">
      <button type="button" class="act${state.wish ? ' act--on' : ''}" data-action="wish" data-id="${esc(d.id)}">${esc(state.wish ? t('wishOn') : t('wishOff'))}</button>
      <button type="button" class="act act--visited${state.visited ? ' act--on' : ''}" data-action="visited" data-id="${esc(d.id)}">${esc(state.visited ? t('visitedOn') : t('visitedOff'))}</button>
      <a class="act act--map" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((d.name.local || d.name.ko).split(/[·・]/)[0].trim())}">${esc(t('mapBtn'))}</a>
    </div>

    <section class="section">
      <h2 class="section__title">${esc(t('whyMonth'))}</h2>
      ${whyItems}
    </section>

    <section class="section">
      <h2 class="section__title">${esc(t('highlightsT'))}</h2>
      <p class="summary">${esc(dSummary(d))}</p>
      <ul class="plainlist">${dList(d, 'highlights').map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    </section>

    <section class="section">
      <h2 class="section__title">${esc(t('practicalT'))}</h2>
      <div class="info-grid">
        <div class="info"><span class="info__k">${esc(t('fromTokyo'))}</span><span class="info__v">${esc(dAccess(d))}</span></div>
        <div class="info"><span class="info__k">${esc(t('recDays'))}</span><span class="info__v">${daysText(d)}</span></div>
        <div class="info"><span class="info__k">${esc(t('budgetT'))}</span><span class="info__v">${budgetMark(d)} <small>(${esc(budgetLabel(d.budgetLevel))})</small></span></div>
        <div class="info"><span class="info__k">${esc(t('themeT'))}</span><span class="info__v">${tagChips(d.themes, themeLabel)}</span></div>
      </div>
    </section>

    ${list(t('tipsT'), dList(d, 'tips'), 'plainlist')}
    ${list(t('cautionsT'), dList(d, 'cautions'), 'plainlist warnlist')}
    ${eventsHtml}
    ${othersHtml}
  </article>`;
}

// ── 여행 준비물 체크리스트 ──
function packUrl(overseas, mods) {
  const m = [...(overseas ? ['overseas'] : []), ...mods];
  return m.length ? `#/pack?m=${encodeURIComponent(m.join(','))}` : '#/pack';
}

export function packView(p, checked) {
  const scopeSegs = `
    <a class="seg${!p.overseas ? ' seg--active' : ''}" href="${packUrl(false, p.mods)}">${esc(scopeLabel('domestic'))}</a>
    <a class="seg${p.overseas ? ' seg--active' : ''}" href="${packUrl(true, p.mods)}">${esc(scopeLabel('overseas'))}</a>`;

  const modChips = PACK_MODULES.map(mod => {
    const on = p.mods.includes(mod.key);
    const next = on ? p.mods.filter(x => x !== mod.key) : [...p.mods, mod.key];
    return `<a class="chip${on ? ' chip--on' : ''}" href="${packUrl(p.overseas, next)}">${esc(pick(mod.label))}</a>`;
  }).join('');

  let total = 0;
  let done = 0;
  const sections = PACK_SECTIONS.map(sec => {
    const items = sec.items.filter(it => packItemVisible(it, p.overseas, p.mods));
    if (!items.length) return '';
    const rows = items.map(it => {
      const on = checked.has(it.id);
      total += 1;
      if (on) done += 1;
      return `
      <label class="pack-item${on ? ' pack-item--on' : ''}">
        <input type="checkbox" data-pack="${esc(it.id)}"${on ? ' checked' : ''}>
        <span>${esc(pick(it.label))}</span>
      </label>`;
    }).join('');
    return `
    <section class="section">
      <h2 class="section__title">${esc(pick(sec.label))}</h2>
      <div class="pack-list">${rows}</div>
    </section>`;
  }).join('');

  return `
  <h1 class="page-title">${esc(t('packTitle'))}</h1>
  <p class="page-sub">${esc(t('packSub'))}</p>
  <div class="segs">${scopeSegs}</div>
  <div class="filter-row"><div class="chips chips--wrap">${modChips}</div></div>
  <div class="pack-bar">
    <p class="count">${t('packProgress', done, total)}</p>
    <button type="button" class="chip" data-action="pack-reset">${esc(t('packReset'))}</button>
  </div>
  ${sections}`;
}

export function notFound() {
  return `
  <div class="empty">
    <p class="empty__emoji" aria-hidden="true">🧭</p>
    <h1 class="page-title">${esc(t('notFoundT'))}</h1>
    <p><a class="btn" href="#/">${esc(t('goHome'))}</a></p>
  </div>`;
}

export function loadError() {
  return `
  <div class="empty">
    <p class="empty__emoji" aria-hidden="true">✈️</p>
    <h1 class="page-title">${esc(t('loadErrT'))}</h1>
    <p class="page-sub">${esc(t('loadErrSub'))}</p>
    <p><button class="btn" id="retry">${esc(t('retry'))}</button></p>
  </div>`;
}
