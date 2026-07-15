// 한/일 언어 토글 — UI 사전 + 데이터 필드 오버레이(data/i18n/*.json)
import { SCOPES, BUDGET_LABELS, HOLIDAYS } from './config.js';

const LANG_KEY = 'tripbook.lang';
let lang = 'ko';
try { if (localStorage.getItem(LANG_KEY) === 'ja') lang = 'ja'; } catch { /* node 등 */ }

let jaData = {}; // 여행지 id → 일본어 오버레이

export function getLang() { return lang; }
export function setLang(next) {
  lang = next === 'ja' ? 'ja' : 'ko';
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* noop */ }
}
export function setJaData(map) { jaData = map || {}; }

// ── UI 문자열 사전 ──
const UI = {
  ko: {
    tabHome: '홈', tabMonth: '월별', tabDomestic: '국내', tabOverseas: '해외', tabFind: '찾기',
    homeTitle: m => `${m}월의 여행지`,
    homeSub: '지금 가기 좋은 곳 — 국내 3 · 해외 3, 이유와 함께.',
    preview: m => `${m}월 미리보기 ▸`,
    monthViewTitle: '월별 여행지',
    all: '전체',
    extras: m => `${m}월의 다른 후보`,
    browseDomestic: '🗾 국내 여행지', browseOverseas: '✈️ 해외 여행지',
    findTitle: '🔎 조건으로 찾기',
    searchPh: '이름·나라·테마 검색 (예: 온천, 스위스)',
    when: '언제', howLong: '며칠', scopeF: '구분', themeF: '테마',
    foundCount: n => `조건에 맞는 여행지 <strong>${n}곳</strong>`,
    findEmpty: "조건을 조금 풀어보세요 — 테마를 줄이거나 월을 '전체'로.",
    myList: '내 목록', wishSec: '♥ 위시리스트', visitedSec: '✓ 가봤음',
    wishEmpty: '아직 없어요 — 여행지 상세에서 ♡를 눌러 담아두세요.',
    visitedEmpty: '다녀온 곳을 상세 화면에서 체크하면 여기에 쌓입니다.',
    whyMonth: '⏰ 왜 이 달인가', highlightsT: '✨ 하이라이트', practicalT: '🚄 실용 정보',
    fromTokyo: '도쿄에서', recDays: '추천 일수', budgetT: '예산', themeT: '테마',
    tipsT: '💡 팁', cautionsT: '⚠️ 주의', eventsT: '📅 시즌 이벤트',
    othersT: m => `${m}월의 다른 추천`,
    best: '베스트', peakBadge: '절정', warnTitle: '주의사항 있음',
    wishOff: '♡ 위시리스트', wishOn: '♥ 위시리스트에 있음',
    visitedOff: '가봤음 체크', visitedOn: '✓ 가봤음',
    notFoundT: '여행지를 찾을 수 없습니다', goHome: '홈으로',
    loadErrT: '데이터를 불러오지 못했습니다', loadErrSub: '네트워크 상태를 확인해 주세요.', retry: '다시 시도',
    moveH: h => `이동 ~${h}h`,
    daysR: (a, b) => `${a}~${b}일`,
    monthsBadge: arr => `${arr.join('·')}월`,
    monthChip: m => `${m}월`,
    noHoliday: m => `🗓 ${m}월은 공휴일이 없는 달 — 어디를 가도 비교적 한산.`,
    bucket: { any: '전체', weekend: '1~2일', short: '3~4일', week: '5~7일', long: '8일~' },
  },
  ja: {
    tabHome: 'ホーム', tabMonth: '月別', tabDomestic: '国内', tabOverseas: '海外', tabFind: '探す',
    homeTitle: m => `${m}月の旅行先`,
    homeSub: 'いま行くのにいい場所 — 国内3・海外3、理由つきで。',
    preview: m => `${m}月の先取り ▸`,
    monthViewTitle: '月別の旅行先',
    all: 'すべて',
    extras: m => `${m}月のほかの候補`,
    browseDomestic: '🗾 国内の旅行先', browseOverseas: '✈️ 海外の旅行先',
    findTitle: '🔎 条件で探す',
    searchPh: '名前・国・テーマで検索(例:温泉、スイス)',
    when: 'いつ', howLong: '日数', scopeF: '区分', themeF: 'テーマ',
    foundCount: n => `条件に合う旅行先 <strong>${n}件</strong>`,
    findEmpty: '条件を少し緩めてみましょう — テーマを減らすか、月を「すべて」に。',
    myList: 'マイリスト', wishSec: '♥ ウィッシュリスト', visitedSec: '✓ 訪問済み',
    wishEmpty: 'まだありません — 詳細画面で♡を押して追加できます。',
    visitedEmpty: '行った場所を詳細画面でチェックすると、ここに貯まります。',
    whyMonth: '⏰ なぜこの月か', highlightsT: '✨ ハイライト', practicalT: '🚄 実用情報',
    fromTokyo: '東京から', recDays: 'おすすめ日数', budgetT: '予算', themeT: 'テーマ',
    tipsT: '💡 ヒント', cautionsT: '⚠️ 注意', eventsT: '📅 シーズンイベント',
    othersT: m => `${m}月のほかのおすすめ`,
    best: 'ベスト', peakBadge: '見頃', warnTitle: '注意事項あり',
    wishOff: '♡ ウィッシュリスト', wishOn: '♥ ウィッシュリスト済み',
    visitedOff: '訪問済みにする', visitedOn: '✓ 訪問済み',
    notFoundT: '旅行先が見つかりません', goHome: 'ホームへ',
    loadErrT: 'データを読み込めませんでした', loadErrSub: 'ネットワーク状態をご確認ください。', retry: '再試行',
    moveH: h => `移動 ~${h}h`,
    daysR: (a, b) => `${a}~${b}日`,
    monthsBadge: arr => `${arr.join('・')}月`,
    monthChip: m => `${m}月`,
    noHoliday: m => `🗓 ${m}月は祝日のない月 — どこへ行っても比較的空いている。`,
    bucket: { any: 'すべて', weekend: '1~2日', short: '3~4日', week: '5~7日', long: '8日~' },
  },
};

export function t(key, ...args) {
  const v = UI[lang][key] ?? UI.ko[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
export function bucketLabel(key) { return UI[lang].bucket[key] || UI.ko.bucket[key] || key; }

// ── 분류 라벨 사전 ──
const JA_REGIONS = {
  '홋카이도': '北海道', '도호쿠': '東北', '간토': '関東', '주부': '中部', '간사이': '関西',
  '주고쿠': '中国', '시코쿠': '四国', '규슈': '九州', '오키나와': '沖縄',
  '한국': '韓国', '동아시아': '東アジア', '동남아시아': '東南アジア', '남아시아·중앙아시아': '南・中央アジア',
  '중동·아프리카': '中東・アフリカ', '유럽': 'ヨーロッパ', '오세아니아·태평양': 'オセアニア・太平洋', '아메리카': 'アメリカ',
};
const JA_THEMES = {
  '벚꽃': '桜', '단풍': '紅葉', '꽃': '花', '설경': '雪景色', '스키': 'スキー', '온천': '温泉',
  '바다·리조트': '海・リゾート', '축제': '祭り', '트레킹': 'トレッキング', '자연': '自然', '미식': 'グルメ',
  '도시': '都市', '문화·유적': '文化・遺跡', '오로라': 'オーロラ', '사파리': 'サファリ', '피서': '避暑',
  '피한': '避寒', '일루미네이션': 'イルミネーション', '드라이브': 'ドライブ', '산악': '山岳',
};
const JA_TAGS = { '기후': '気候', '자연': '自然', '축제': '祭り', '비용·혼잡': '費用・混雑', '액티비티': 'アクティビティ' };
const JA_PREFS = {
  '홋카이도': '北海道', '아오모리현': '青森県', '이와테현': '岩手県', '미야기현': '宮城県', '아키타현': '秋田県',
  '야마가타현': '山形県', '후쿠시마현': '福島県', '이바라키현': '茨城県', '도치기현': '栃木県', '군마현': '群馬県',
  '사이타마현': '埼玉県', '치바현': '千葉県', '도쿄도': '東京都', '가나가와현': '神奈川県', '니가타현': '新潟県',
  '도야마현': '富山県', '이시카와현': '石川県', '후쿠이현': '福井県', '야마나시현': '山梨県', '나가노현': '長野県',
  '기후현': '岐阜県', '시즈오카현': '静岡県', '아이치현': '愛知県', '미에현': '三重県', '시가현': '滋賀県',
  '교토부': '京都府', '오사카부': '大阪府', '효고현': '兵庫県', '나라현': '奈良県', '와카야마현': '和歌山県',
  '돗토리현': '鳥取県', '시마네현': '島根県', '오카야마현': '岡山県', '히로시마현': '広島県', '야마구치현': '山口県',
  '도쿠시마현': '徳島県', '가가와현': '香川県', '에히메현': '愛媛県', '고치현': '高知県', '후쿠오카현': '福岡県',
  '사가현': '佐賀県', '나가사키현': '長崎県', '구마모토현': '熊本県', '오이타현': '大分県', '미야자키현': '宮崎県',
  '가고시마현': '鹿児島県', '오키나와현': '沖縄県',
};
const JA_COUNTRIES = {
  '일본': '日本', '태국': 'タイ', '필리핀': 'フィリピン', '호주': 'オーストラリア', '대만': '台湾',
  '뉴질랜드': 'ニュージーランド', '몰디브': 'モルディブ', '한국': '韓国', '미국(괌)': 'アメリカ(グアム)',
  '인도': 'インド', '네덜란드': 'オランダ', '이탈리아': 'イタリア', '그리스': 'ギリシャ', '인도네시아': 'インドネシア',
  '미국(하와이)': 'アメリカ(ハワイ)', '스웨덴·덴마크': 'スウェーデン・デンマーク', '스위스': 'スイス', '몽골': 'モンゴル',
  '케냐': 'ケニア', '영국': 'イギリス', '캐나다': 'カナダ', '스페인·포르투갈': 'スペイン・ポルトガル',
  '튀르키예': 'トルコ', '미국': 'アメリカ', '네팔': 'ネパール', '이집트': 'エジプト', '캄보디아': 'カンボジア',
  'UAE': 'UAE', '베트남': 'ベトナム', '핀란드': 'フィンランド', '독일·오스트리아': 'ドイツ・オーストリア',
  '중국': '中国', '라오스': 'ラオス', '말레이시아': 'マレーシア', '스리랑카': 'スリランカ',
  '우즈베키스탄': 'ウズベキスタン', '모로코': 'モロッコ', '요르단': 'ヨルダン', '프랑스': 'フランス',
  '체코·헝가리': 'チェコ・ハンガリー', '크로아티아': 'クロアチア', '아이슬란드': 'アイスランド', '페루': 'ペルー',
  '슬로베니아': 'スロベニア', '노르웨이': 'ノルウェー', '남아프리카공화국': '南アフリカ', '볼리비아': 'ボリビア',
  '조지아': 'ジョージア', '멕시코': 'メキシコ', '미국(북마리아나)': 'アメリカ(北マリアナ)', '탄자니아': 'タンザニア',
  '오스트리아': 'オーストリア', '아르헨티나·칠레': 'アルゼンチン・チリ', '홍콩·마카오': '香港・マカオ', '싱가포르': 'シンガポール',
  '스페인': 'スペイン', '포르투갈': 'ポルトガル', '독일': 'ドイツ', '아르헨티나': 'アルゼンチン', '칠레': 'チリ',
  '홍콩': '香港', '마카오': 'マカオ', '스웨덴': 'スウェーデン', '덴마크': 'デンマーク', '체코': 'チェコ', '헝가리': 'ハンガリー',
};
const JA_BUDGET = ['', '~3万円', '3~7万円', '7~15万円', '15~30万円', '30万円~'];
const JA_HOLIDAYS = {
  1: [{ name: '年末年始+成人の日', when: '~1/3・1月第2月曜の3連休', note: '年始の航空運賃は最高値 — 海外脱出のピーク' }],
  2: [{ name: '建国記念の日・天皇誕生日', when: '2/11・2/23', note: '並びにより3連休。中華圏の春節と重なるとアジア路線が混雑' }],
  3: [{ name: '春分の日', when: '3/20前後', note: '3連休になる年は早咲きの桜と重なり国内の宿が高騰' }],
  4: [{ name: 'ゴールデンウィーク開幕', when: '4/29(昭和の日)~', note: 'GW前半 — 国内全域が混雑、宿は1.5~3倍' }],
  5: [{ name: 'ゴールデンウィーク', when: '~5/5(こどもの日)前後', note: '並びにより最大10連休 — 長距離海外の最大のチャンス' }],
  6: [],
  7: [{ name: '海の日', when: '7月第3月曜の3連休', note: '夏のハイシーズン開幕 — 北海道・沖縄は早期満室' }],
  8: [{ name: '山の日+お盆', when: '8/11・8/13~16', note: '国内大移動の週 — 新幹線・宿は年間最高の混雑' }],
  9: [{ name: 'シルバーウィーク', when: '敬老の日(第3月曜)+秋分', note: '並びにより3~5連休 — 初秋の旅の適期、年初にカレンダー確認' }],
  10: [{ name: 'スポーツの日', when: '10月第2月曜の3連休', note: '紅葉シーズン最初の3連休 — 日光・アルプス方面は渋滞' }],
  11: [{ name: '文化の日・勤労感謝の日', when: '11/3・11/23', note: '紅葉ピークと重なる3連休 — 京都の宿は早期満室' }],
  12: [{ name: '年末年始', when: '12/29~', note: '出国ラッシュ — 海外航空券は9~10月までに予約' }],
};

export const scopeLabel = s => (lang === 'ja' ? (s === 'domestic' ? '国内' : '海外') : SCOPES[s].label);
export const regionLabel = r => (lang === 'ja' ? (JA_REGIONS[r] || r) : r);
export const themeLabel = th => (lang === 'ja' ? (JA_THEMES[th] || th) : th);
export const tagLabel = tg => (lang === 'ja' ? (JA_TAGS[tg] || tg) : tg);
export const prefLabel = p => (lang === 'ja' ? String(p).split('·').map(x => JA_PREFS[x] || x).join('・') : p);
export const countryLabel = c => (lang === 'ja' ? (JA_COUNTRIES[c] || c) : c);
export const budgetLabel = lv => (lang === 'ja' ? JA_BUDGET[lv] : BUDGET_LABELS[lv]);
export const holidayItems = m => (lang === 'ja' ? (JA_HOLIDAYS[m] || []) : (HOLIDAYS[m] || []));

// ── 여행지 콘텐츠 오버레이 ──
const ja = d => jaData[d.id] || {};

export const dName = d => {
  if (lang !== 'ja') return d.name.ko;
  return ja(d).name || d.name.local || d.name.ko;
};
export const dAltName = d => (lang === 'ja' ? d.name.ko : (d.name.local || ''));
export const dSummary = d => (lang === 'ja' && ja(d).summary) || d.summary;
export function dReason(d, m) {
  if (lang === 'ja') {
    const r = ja(d).reasons;
    if (r && r[String(m)]) return r[String(m)];
  }
  const rr = d.monthlyReasons && d.monthlyReasons[String(m)];
  return rr && rr.text ? rr.text : dSummary(d);
}
export function dList(d, field) {
  if (lang === 'ja') {
    const arr = ja(d)[field];
    if (Array.isArray(arr) && arr.length) return arr;
  }
  return d[field] || [];
}
export const dAccess = d => (lang === 'ja' && ja(d).access) || (d.access && d.access.how) || '';
export const dEvents = d => (lang === 'ja' && ja(d).events) || d.events || [];
