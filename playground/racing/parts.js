/* 내 차고 꾸미기 아이템 목록. 값(price)은 코인이에요. id '' 는 "기본(없음)". */
export const SLOTS = [
  { id: 'paint', icon: '🎨', name: '도색', toy: true },
  { id: 'decal', icon: '⭐', name: '스티커', toy: true },
  { id: 'wheel', icon: '🛞', name: '휠', toy: true },
  { id: 'wing', icon: '🪽', name: '날개', toy: true },
  { id: 'top', icon: '👑', name: '지붕', toy: true },
  { id: 'eyes', icon: '👀', name: '눈', toy: true },
  { id: 'neon', icon: '💡', name: '네온' },
  { id: 'flame', icon: '🔥', name: '불꽃' },
];
const I = (slot, id, icon, name, price, extra) => Object.assign({ slot, id, icon, name, price }, extra || {});
export const ITEMS = [
  I('paint', 'p_pearl', '✨', '반짝 펄', 60), I('paint', 'p_matte', '🧁', '보송 무광', 40), I('paint', 'p_chrome', '🪞', '거울 크롬', 120), I('paint', 'p_gold', '🥇', '황금 차', 200), I('paint', 'p_rainbow', '🌈', '무지개 변신', 250),
  I('decal', 'd_star', '⭐', '별 스티커', 30), I('decal', 'd_bolt', '⚡', '번개', 40), I('decal', 'd_heart', '💗', '하트', 40), I('decal', 'd_flame', '🔥', '불꽃 무늬', 60), I('decal', 'd_checker', '🏁', '체크 띠', 50), I('decal', 'd_seven', '7️⃣', '행운 7번', 30), I('decal', 'd_flower', '🌸', '꽃', 50), I('decal', 'd_crown', '👑', '왕관 마크', 80),
  I('wheel', 'w_gold', '🟡', '금빛 휠', 60), I('wheel', 'w_blue', '🔵', '파랑 반짝 휠', 70), I('wheel', 'w_flower', '🌼', '꽃 휠', 80), I('wheel', 'w_rainbow', '🌈', '무지개 휠', 90), I('wheel', 'w_star', '🌟', '별 휠', 100),
  I('wing', 'g_big', '🛩️', '큰 날개', 60), I('wing', 'g_double', '🪁', '쌍날개', 90), I('wing', 'g_heart', '💖', '하트 날개', 100), I('wing', 'g_rainbow', '🌈', '무지개 날개', 120), I('wing', 'g_angel', '😇', '천사 날개', 200),
  I('top', 't_antenna', '📡', '별 안테나', 20), I('top', 't_flag', '🚩', '체크 깃발', 30), I('top', 't_ears', '🐻', '곰 귀', 60), I('top', 't_siren', '🚨', '반짝 경광등', 70), I('top', 't_balloon', '🎈', '풍선 세 개', 80), I('top', 't_prop', '🚁', '빙글 프로펠러', 90), I('top', 't_unicorn', '🦄', '유니콘 뿔', 100), I('top', 't_crown', '👑', '황금 왕관', 120),
  I('eyes', 'e_sparkle', '✨', '반짝 눈', 30), I('eyes', 'e_big', '⚫', '동그란 큰 눈', 30), I('eyes', 'e_heart', '😍', '하트 눈', 40), I('eyes', 'e_star', '🤩', '별 눈', 40), I('eyes', 'e_sleepy', '😴', '졸린 눈', 30), I('eyes', 'e_shades', '😎', '멋쟁이 선글라스', 80),
  I('neon', 'n_blue', '🔵', '파랑 네온', 40, { color: 0x38a8ff }), I('neon', 'n_green', '🟢', '초록 네온', 40, { color: 0x3dff8a }), I('neon', 'n_pink', '🩷', '분홍 네온', 40, { color: 0xff5cc8 }), I('neon', 'n_purple', '🟣', '보라 네온', 60, { color: 0xa45cff }), I('neon', 'n_yellow', '🟡', '노랑 네온', 60, { color: 0xffe14a }), I('neon', 'n_rainbow', '🌈', '무지개 네온', 120, { color: -1 }),
  I('flame', 'f_blue', '🔵', '파랑 불꽃', 40, { color: 0x38a8ff }), I('flame', 'f_green', '🟢', '초록 불꽃', 40, { color: 0x3dff8a }), I('flame', 'f_pink', '🩷', '분홍 불꽃', 50, { color: 0xff5cc8 }), I('flame', 'f_purple', '🟣', '보라 불꽃', 50, { color: 0xa45cff }), I('flame', 'f_rainbow', '🌈', '무지개 불꽃', 100, { color: -1 }),
];
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
