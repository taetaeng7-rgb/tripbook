// 화면 렌더러 — DOM에 접근하지 않는 순수 문자열 빌더 (node 테스트 가능)
import { MONTH_LABELS, SCOPES, DOMESTIC_REGIONS, OVERSEAS_REGIONS, THEMES, BUDGET_LABELS } from './config.js';
import { isPeak, reasonFor, reasonMonths, nextMonth } from './calendar.js';

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

// 월 컨텍스트 카드 (홈·월별 뷰)
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
  ${scopeSection('domestic', picks.domestic, month)}
  ${scopeSection('overseas', picks.overseas, month)}
  <section class="section">
    <h2 class="section__title"><a class="plain" href="#/month/${nm}">${MONTH_LABELS[nm]} 미리보기 ▸</a></h2>
    <div class="minis">${minis}</div>
  </section>`;
}

// ── 월별 캘린더 ──
export function monthView(month, scope, picks, now) {
  const seg = s => `<a class="seg${scope === s ? ' seg--active' : ''}" href="#/month/${month}?scope=${s}">${s === 'all' ? '전체' : SCOPES[s].label}</a>`;
  let body = '';
  if (scope === 'all' || scope === 'domestic') body += scopeSection('domestic', picks.domestic, month);
  if (scope === 'all' || scope === 'overseas') body += scopeSection('overseas', picks.overseas, month);
  return `
  <h1 class="page-title">월별 여행지</h1>
  ${monthChips(month, now, scope)}
  <div class="segs">${seg('all')}${seg('domestic')}${seg('overseas')}</div>
  ${body}`;
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

// ── 여행지 상세 ──
export function place(d, ctxMonth, others) {
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
