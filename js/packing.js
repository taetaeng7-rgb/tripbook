// 여행 준비물 체크리스트 — 템플릿 데이터 (국내 기본 + 해외/계절·활동 모듈)
// when: 'base'(항상) | 'overseas'(해외) | 모듈 키(winter/rain/beach/trek/ski)

export const PACK_MODULES = [
  { key: 'winter', label: { ko: '❄️ 방한', ja: '❄️ 防寒' } },
  { key: 'rain', label: { ko: '🌧 우기·장마', ja: '🌧 雨・梅雨' } },
  { key: 'beach', label: { ko: '🏖 바다·리조트', ja: '🏖 海・リゾート' } },
  { key: 'trek', label: { ko: '🥾 트레킹', ja: '🥾 トレッキング' } },
  { key: 'ski', label: { ko: '🎿 스키', ja: '🎿 スキー' } },
];

export const PACK_SECTIONS = [
  {
    key: 'essential',
    label: { ko: '필수', ja: '必須' },
    items: [
      { id: 'wallet', when: 'base', label: { ko: '지갑·현금·카드', ja: '財布・現金・カード' } },
      { id: 'id-card', when: 'base', label: { ko: '신분증(운전면허 등)', ja: '身分証(運転免許など)' } },
      { id: 'phone', when: 'base', label: { ko: '스마트폰·충전기', ja: 'スマホ・充電器' } },
      { id: 'battery', when: 'base', label: { ko: '보조배터리', ja: 'モバイルバッテリー' } },
      { id: 'tickets', when: 'base', label: { ko: '교통·숙소 예약 확인(QR)', ja: '交通・宿の予約確認(QR)' } },
      { id: 'meds', when: 'base', label: { ko: '상비약(두통·소화·멀미)', ja: '常備薬(頭痛・胃腸・酔い止め)' } },
      { id: 'passport', when: 'overseas', label: { ko: '여권(유효기간 6개월+ 확인)', ja: 'パスポート(残存6か月+確認)' } },
      { id: 'visa', when: 'overseas', label: { ko: '비자·입국 서류 확인', ja: 'ビザ・入国書類の確認' } },
      { id: 'esim', when: 'overseas', label: { ko: 'eSIM·로밍·포켓와이파이', ja: 'eSIM・ローミング・Wi-Fiルーター' } },
      { id: 'insurance', when: 'overseas', label: { ko: '여행자 보험', ja: '海外旅行保険' } },
      { id: 'fx', when: 'overseas', label: { ko: '환전·해외결제 카드', ja: '両替・海外決済カード' } },
      { id: 'adapter', when: 'overseas', label: { ko: '멀티 어댑터(콘센트 규격 확인)', ja: '変換プラグ(コンセント規格確認)' } },
    ],
  },
  {
    key: 'clothes',
    label: { ko: '의류', ja: '衣類' },
    items: [
      { id: 'clothes-change', when: 'base', label: { ko: '갈아입을 옷', ja: '着替え' } },
      { id: 'underwear', when: 'base', label: { ko: '속옷·양말', ja: '下着・靴下' } },
      { id: 'sleepwear', when: 'base', label: { ko: '잠옷·실내복', ja: 'パジャマ・部屋着' } },
      { id: 'down', when: 'winter', label: { ko: '패딩·경량다운', ja: 'ダウン・軽量ダウン' } },
      { id: 'winter-acc', when: 'winter', label: { ko: '니트모자·장갑·목도리', ja: 'ニット帽・手袋・マフラー' } },
      { id: 'hotpack', when: 'winter', label: { ko: '핫팩', ja: 'カイロ' } },
      { id: 'swimwear', when: 'beach', label: { ko: '수영복·래시가드', ja: '水着・ラッシュガード' } },
      { id: 'sandals', when: 'beach', label: { ko: '샌들·아쿠아슈즈', ja: 'サンダル・マリンシューズ' } },
      { id: 'sun-acc', when: 'beach', label: { ko: '모자·선글라스', ja: '帽子・サングラス' } },
      { id: 'boots', when: 'trek', label: { ko: '등산화(길들인 것)', ja: '登山靴(履き慣らし済み)' } },
      { id: 'layers', when: 'trek', label: { ko: '기능성 레이어·바람막이', ja: '機能性レイヤー・ウインドブレーカー' } },
      { id: 'ski-wear', when: 'ski', label: { ko: '스키웨어(대여 여부 확인)', ja: 'スキーウェア(レンタル確認)' } },
      { id: 'goggles', when: 'ski', label: { ko: '고글·스키장갑', ja: 'ゴーグル・スキーグローブ' } },
      { id: 'base-layer', when: 'ski', label: { ko: '이너·발열 레이어', ja: 'インナー・発熱レイヤー' } },
    ],
  },
  {
    key: 'toiletry',
    label: { ko: '세면·위생', ja: '洗面・衛生' },
    items: [
      { id: 'toothbrush', when: 'base', label: { ko: '칫솔 세트', ja: '歯ブラシセット' } },
      { id: 'skincare', when: 'base', label: { ko: '스킨케어·면도', ja: 'スキンケア・シェーバー' } },
      { id: 'sunscreen', when: 'base', label: { ko: '자외선차단제', ja: '日焼け止め' } },
      { id: 'sanitizer', when: 'base', label: { ko: '손소독·마스크', ja: '手指消毒・マスク' } },
      { id: 'insect', when: 'beach', label: { ko: '벌레 기피제', ja: '虫よけ' } },
    ],
  },
  {
    key: 'gear',
    label: { ko: '소품·기타', ja: '小物・その他' },
    items: [
      { id: 'earphones', when: 'base', label: { ko: '이어폰', ja: 'イヤホン' } },
      { id: 'ecobag', when: 'base', label: { ko: '에코백·지퍼백', ja: 'エコバッグ・ジップ袋' } },
      { id: 'camera', when: 'base', label: { ko: '카메라(선택)', ja: 'カメラ(任意)' } },
      { id: 'umbrella', when: 'rain', label: { ko: '접이식 우산·우비', ja: '折りたたみ傘・レインウェア' } },
      { id: 'waterproof', when: 'rain', label: { ko: '방수 커버·속건 타월', ja: '防水カバー・速乾タオル' } },
      { id: 'drypack', when: 'beach', label: { ko: '방수팩·비치타월', ja: '防水ポーチ・ビーチタオル' } },
      { id: 'snorkel', when: 'beach', label: { ko: '스노클 마스크(대여 가능 확인)', ja: 'シュノーケルマスク(レンタル確認)' } },
      { id: 'headlamp', when: 'trek', label: { ko: '헤드램프', ja: 'ヘッドランプ' } },
      { id: 'bottle', when: 'trek', label: { ko: '물병·행동식', ja: 'ボトル・行動食' } },
      { id: 'firstaid', when: 'trek', label: { ko: '구급 테이프·밴드', ja: 'テーピング・絆創膏' } },
    ],
  },
];

// 현재 선택(해외 여부 + 모듈)에 해당하는 아이템인지
export function packItemVisible(item, overseas, mods) {
  if (item.when === 'base') return true;
  if (item.when === 'overseas') return overseas;
  return mods.includes(item.when);
}
