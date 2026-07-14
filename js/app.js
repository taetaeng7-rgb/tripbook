// 엔트리 — 초기화·테마·라우트 바인딩
import { parseHash, startRouter } from './router.js';
import { loadAll } from './data.js';
import { currentMonth, nextMonth, normalizeMonth, picksFor, candidatesFor } from './calendar.js';
import { findDestinations, dayBucket, parseThemes, DAY_BUCKETS } from './find.js';
import { getSet, toggle } from './store.js';
import * as views from './views.js';

const $app = document.getElementById('app');
const THEME_KEY = 'tripbook.theme';
let db = null;
let lastHash = null;

// ── 테마 (라이트/다크) ──
function applyTheme(theme) {
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
  const dark = theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
  document.getElementById('theme-toggle').textContent = dark ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#111418' : '#FAFAF8');
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || null);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
      || (!document.documentElement.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// ── 하단 탭 활성화 ──
function updateTabs(active) {
  document.querySelectorAll('.tabbar a').forEach(a => {
    a.classList.toggle('tab--active', a.dataset.tab === active);
  });
}

// ── 찾기 파라미터 해석 ──
function parseFindParams(query) {
  const rawM = query.get('m');
  const month = rawM === 'any' ? null : (normalizeMonth(rawM) ?? currentMonth());
  const days = DAY_BUCKETS.some(b => b.key === query.get('d')) ? query.get('d') : 'any';
  const scope = ['domestic', 'overseas'].includes(query.get('s')) ? query.get('s') : 'all';
  const themes = parseThemes(query.get('t'));
  const q = (query.get('q') || '').trim();
  return { month, days, scope, themes, q };
}

function runFind(p) {
  return findDestinations([...db.domestic, ...db.overseas], {
    month: p.month, days: dayBucket(p.days), themes: p.themes, scope: p.scope, q: p.q,
  });
}

// 검색 입력: 타이핑 중엔 결과 영역만 갱신 + URL은 replaceState(히스토리 오염·포커스 손실 방지)
function bindFindInput(p) {
  const input = document.getElementById('find-q');
  if (!input) return;
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const next = { ...p, q: input.value.trim() };
      const results = runFind(next);
      const box = document.getElementById('find-results');
      if (box) box.innerHTML = views.findResults(next, results);
      const url = `#/find?m=${next.month === null ? 'any' : next.month}`
        + (next.days !== 'any' ? `&d=${next.days}` : '')
        + (next.scope !== 'all' ? `&s=${next.scope}` : '')
        + (next.themes.length ? `&t=${encodeURIComponent(next.themes.join(','))}` : '')
        + (next.q ? `&q=${encodeURIComponent(next.q)}` : '');
      history.replaceState(null, '', url);
    }, 250);
  });
}

// ── 라우팅 ──
function render() {
  const { segments, query } = parseHash();
  const now = currentMonth();
  const [head, param] = segments;
  let html;
  let tab = 'home';
  let title = 'tripbook';
  let after = null;

  if (!head) {
    const picks = picksFor(now, db.calendar, db.byId);
    const preview = picksFor(nextMonth(now), db.calendar, db.byId);
    html = views.home(now, picks, preview);
    title = `tripbook — ${now}월의 여행지`;
  } else if (head === 'month') {
    if (param !== undefined && normalizeMonth(param) === null) {
      location.hash = `#/month/${now}`; // 잘못된 월 → 현재 월로 폴백 + URL 정정
      return;
    }
    const m = normalizeMonth(param) ?? now;
    const rawScope = query.get('scope');
    const scope = ['domestic', 'overseas'].includes(rawScope) ? rawScope : 'all';
    const picks = picksFor(m, db.calendar, db.byId);
    const curated = new Set([...picks.domestic, ...picks.overseas].map(d => d.id));
    const extras = {
      domestic: candidatesFor(m, db.domestic, curated),
      overseas: candidatesFor(m, db.overseas, curated),
    };
    html = views.monthView(m, scope, picks, now, extras);
    tab = 'month';
    title = `tripbook — ${m}월`;
  } else if (head === 'browse') {
    const scope = param === 'overseas' ? 'overseas' : 'domestic';
    html = views.browse(scope, scope === 'domestic' ? db.domestic : db.overseas);
    tab = scope;
    title = `tripbook — ${scope === 'domestic' ? '국내' : '해외'}`;
  } else if (head === 'find') {
    const p = parseFindParams(query);
    html = views.findView(p, runFind(p));
    tab = 'find';
    title = 'tripbook — 조건으로 찾기';
    after = () => bindFindInput(p);
  } else if (head === 'list') {
    const wish = [...getSet('wish')].map(id => db.byId.get(id)).filter(Boolean);
    const visited = [...getSet('visited')].map(id => db.byId.get(id)).filter(Boolean);
    html = views.listView(wish, visited);
    tab = '';
    title = 'tripbook — 내 목록';
  } else if (head === 'place') {
    const d = db.byId.get(param);
    if (!d) {
      html = views.notFound();
      tab = '';
    } else {
      const m = normalizeMonth(query.get('m')) ?? now;
      const picks = picksFor(m, db.calendar, db.byId);
      const others = [...picks.domestic, ...picks.overseas].filter(o => o.id !== d.id);
      const state = { wish: getSet('wish').has(d.id), visited: getSet('visited').has(d.id) };
      html = views.place(d, m, others, state);
      tab = d.scope === 'domestic' ? 'domestic' : 'overseas';
      title = `tripbook — ${d.name.ko}`;
    }
  } else {
    html = views.notFound();
    tab = '';
  }

  $app.innerHTML = html;
  document.title = title;
  updateTabs(tab);
  if (after) after();
  if (location.hash !== lastHash) { // 위시 토글 등 같은 화면 재렌더 시 스크롤 유지
    window.scrollTo(0, 0);
    lastHash = location.hash;
  }
}

async function main() {
  initTheme();
  try {
    db = await loadAll();
  } catch (err) {
    console.error(err);
    $app.innerHTML = views.loadError();
    document.getElementById('retry').addEventListener('click', () => location.reload());
    return;
  }
  // 위시리스트·가봤음 토글 (위임 핸들러)
  $app.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    toggle(btn.dataset.action, btn.dataset.id);
    render();
  });
  startRouter(render);
}

main();
