// 엔트리 — 초기화·테마·언어·라우트 바인딩
import { parseHash, startRouter } from './router.js';
import { loadAll, loadJa } from './data.js';
import { currentMonth, nextMonth, normalizeMonth, picksFor, candidatesFor } from './calendar.js';
import { findDestinations, dayBucket, parseThemes, DAY_BUCKETS } from './find.js';
import { getSet, toggle } from './store.js';
import { getLang, setLang, setJaData, t, scopeLabel, dName } from './i18n.js';
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

// ── 언어 (한/일) ──
function applyStaticLabels() {
  document.documentElement.lang = getLang();
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = getLang() === 'ja' ? 'KO' : 'JA'; // 버튼엔 전환 대상 표시
  const labels = { home: t('tabHome'), month: t('tabMonth'), domestic: t('tabDomestic'), overseas: t('tabOverseas'), find: t('tabFind') };
  document.querySelectorAll('.tabbar a').forEach(a => {
    const txt = a.querySelector('.tab-txt');
    if (txt && labels[a.dataset.tab]) txt.textContent = labels[a.dataset.tab];
  });
}

async function ensureJa() {
  if (getLang() === 'ja') setJaData(await loadJa());
}

function initLang() {
  document.getElementById('lang-toggle').addEventListener('click', async () => {
    setLang(getLang() === 'ja' ? 'ko' : 'ja');
    try {
      await ensureJa();
    } catch (err) {
      console.error(err);
      setLang('ko'); // 로드 실패 시 한국어 유지
    }
    applyStaticLabels();
    render();
  });
}

// ── 하단 탭 활성화 ──
function updateTabs(active) {
  document.querySelectorAll('.tabbar a').forEach(a => {
    a.classList.toggle('tab--active', a.dataset.tab === active);
  });
}

// 재렌더 시 칩 스크롤이 초기화되므로, 선택된 칩이 항상 보이도록 가운데로 스크롤
function centerActiveChips() {
  document.querySelectorAll('.chips').forEach(c => {
    const active = c.querySelector('.chip--active');
    if (!active || c.scrollWidth <= c.clientWidth) return;
    const delta = active.getBoundingClientRect().left - c.getBoundingClientRect().left;
    c.scrollLeft += delta - (c.clientWidth - active.offsetWidth) / 2;
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
    title = `tripbook — ${t('homeTitle', now)}`;
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
    title = `tripbook — ${t('monthChip', m)}`;
  } else if (head === 'browse') {
    const scope = param === 'overseas' ? 'overseas' : 'domestic';
    const filter = (query.get('f') || '').trim() || null;
    html = views.browse(scope, scope === 'domestic' ? db.domestic : db.overseas, filter);
    tab = scope;
    title = `tripbook — ${scopeLabel(scope)}`;
  } else if (head === 'find') {
    const p = parseFindParams(query);
    html = views.findView(p, runFind(p));
    tab = 'find';
    title = `tripbook — ${t('findTitle').replace('🔎 ', '')}`;
    after = () => bindFindInput(p);
  } else if (head === 'list') {
    const wish = [...getSet('wish')].map(id => db.byId.get(id)).filter(Boolean);
    const visited = [...getSet('visited')].map(id => db.byId.get(id)).filter(Boolean);
    html = views.listView(wish, visited);
    tab = '';
    title = `tripbook — ${t('myList')}`;
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
      title = `tripbook — ${dName(d)}`;
    }
  } else {
    html = views.notFound();
    tab = '';
  }

  $app.innerHTML = html;
  document.title = title;
  updateTabs(tab);
  centerActiveChips();
  if (after) after();
  if (location.hash !== lastHash) { // 위시 토글·언어 전환 등 같은 화면 재렌더 시 스크롤 유지
    window.scrollTo(0, 0);
    lastHash = location.hash;
  }
}

async function main() {
  initTheme();
  initLang();
  try {
    db = await loadAll();
    await ensureJa(); // 저장된 언어가 JA면 첫 렌더 전에 로드
  } catch (err) {
    console.error(err);
    $app.innerHTML = views.loadError();
    document.getElementById('retry').addEventListener('click', () => location.reload());
    return;
  }
  applyStaticLabels();
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
