// 엔트리 — 초기화·테마·라우트 바인딩
import { parseHash, startRouter } from './router.js';
import { loadAll } from './data.js';
import { currentMonth, nextMonth, normalizeMonth, picksFor } from './calendar.js';
import * as views from './views.js';

const $app = document.getElementById('app');
const THEME_KEY = 'tripbook.theme';
let db = null;

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

// ── 라우팅 ──
function render() {
  const { segments, query } = parseHash();
  const now = currentMonth();
  const [head, param] = segments;
  let html;
  let tab = 'home';
  let title = 'tripbook';

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
    html = views.monthView(m, scope, picksFor(m, db.calendar, db.byId), now);
    tab = 'month';
    title = `tripbook — ${m}월`;
  } else if (head === 'browse') {
    const scope = param === 'overseas' ? 'overseas' : 'domestic';
    html = views.browse(scope, scope === 'domestic' ? db.domestic : db.overseas);
    tab = scope;
    title = `tripbook — ${scope === 'domestic' ? '국내' : '해외'}`;
  } else if (head === 'place') {
    const d = db.byId.get(param);
    if (!d) {
      html = views.notFound();
      tab = '';
    } else {
      const m = normalizeMonth(query.get('m')) ?? now;
      const picks = picksFor(m, db.calendar, db.byId);
      const others = [...picks.domestic, ...picks.overseas].filter(o => o.id !== d.id);
      html = views.place(d, m, others);
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
  window.scrollTo(0, 0);
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
  startRouter(render);
}

main();
