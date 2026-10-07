/* 영어 기초층 차시 내용표 (알파벳 6 · 낱말 6 · 문장 6) — 엔진: play/english.js (abc)
   그림은 앱에 이미 있는 것(사물 그림·정글 동물·농장 작물·풍선 과일)을 씁니다. */
(function () {
  'use strict';
  var C = window.OKS_CONTENT = window.OKS_CONTENT || {};
  var EN = 'art/en/', J = 'art/jj/', OB = 'art/obj/', BF = 'games/balloons/img/', CH = 'art/char/';
  function w(en, ko, img) { var o = { en: en, label: ko }; if (/^[^a-z]/i.test(img) && img.indexOf('/') < 0) o.emo = img; else o.img = img; return o; }
  function col(en, ko, hex) { return { en: en, label: ko, color: hex }; }

  /* 첫소리 낱말 (A–Z) */
  var ABC = [
    w('apple', '사과', BF + 'f_apple.webp'), w('bear', '곰', J + 'animals/bear.webp'), w('cat', '고양이', J + 'animals/cat.webp'), w('dog', '강아지', J + 'animals/dog.webp'),
    w('elephant', '코끼리', J + 'animals/elephant.webp'), w('fish', '물고기', OB + 'fish.webp'), w('guitar', '기타', OB + 'guitar.webp'), w('horse', '말', OB + 'horse.webp'),
    w('ice', '얼음', J + 'kitchen/ing_ice.webp'), w('juice', '주스', EN + 'juice.webp'), w('koala', '코알라', J + 'animals/koala.webp'), w('lemon', '레몬', BF + 'f_lemon.webp'),
    w('monkey', '원숭이', J + 'animals/monkey.webp'), w('notebook', '공책', J + 'recycle/notebook.webp'), w('owl', '부엉이', J + 'animals/owl.webp'), w('panda', '판다', J + 'animals/panda.webp'),
    w('queen', '여왕', EN + 'queen.webp'), w('rabbit', '토끼', J + 'animals/rabbit.webp'), w('sun', '해', OB + 'sun.webp'), w('tiger', '호랑이', J + 'animals/tiger.webp'),
    w('umbrella', '우산', OB + 'umbrella.webp'), w('violin', '바이올린', OB + 'violin.webp'), w('whale', '고래', OB + 'whale.webp'), w('xylophone', '실로폰', OB + 'xylophone.webp'),
    w('yogurt', '요구르트', J + 'kitchen/ing_yogurt.webp'), w('zebra', '얼룩말', EN + 'zebra.webp')
  ];

  var ANIMALS = [
    w('cat', '고양이', J + 'animals/cat.webp'), w('dog', '강아지', J + 'animals/dog.webp'), w('bear', '곰', J + 'animals/bear.webp'), w('rabbit', '토끼', J + 'animals/rabbit.webp'),
    w('monkey', '원숭이', J + 'animals/monkey.webp'), w('tiger', '호랑이', J + 'animals/tiger.webp'), w('panda', '판다', J + 'animals/panda.webp'), w('fox', '여우', J + 'animals/fox.webp'),
    w('frog', '개구리', J + 'animals/frog.webp'), w('owl', '부엉이', J + 'animals/owl.webp'), w('pig', '돼지', OB + 'pig.webp'), w('cow', '소', OB + 'cow.webp'),
    w('horse', '말', OB + 'horse.webp'), w('sheep', '양', OB + 'sheep.webp'), w('duck', '오리', OB + 'duck.webp'), w('fish', '물고기', OB + 'fish.webp'),
    w('bird', '새', OB + 'bird.webp'), w('ant', '개미', OB + 'ant.webp'), w('whale', '고래', OB + 'whale.webp'), w('crab', '게', OB + 'crab.webp')
  ];
  var FRUITS = [
    w('apple', '사과', BF + 'f_apple.webp'), w('banana', '바나나', BF + 'f_banana.webp'), w('grapes', '포도', BF + 'f_grapes.webp'), w('kiwi', '키위', BF + 'f_kiwi.webp'),
    w('lemon', '레몬', BF + 'f_lemon.webp'), w('peach', '복숭아', BF + 'f_peach.webp'), w('pear', '배', BF + 'f_pear.webp'), w('tomato', '토마토', J + 'farm/ripe_tomato.webp'),
    w('carrot', '당근', J + 'farm/ripe_carrot.webp'), w('corn', '옥수수', OB + 'corn.webp'), w('potato', '감자', OB + 'potato.webp'), w('onion', '양파', OB + 'onion.webp'),
    w('pumpkin', '호박', OB + 'pumpkin.webp'), w('melon', '멜론', EN + 'melon.webp'), w('lettuce', '상추', J + 'farm/ripe_lettuce.webp')
  ];
  var FOOD = [
    w('egg', '달걀', J + 'kitchen/ing_egg.webp'), w('milk', '우유', J + 'kitchen/ing_milk.webp'), w('honey', '꿀', J + 'kitchen/ing_honey.webp'), w('soup', '수프', J + 'kitchen/dish_soup_coconut.webp'),
    w('salad', '샐러드', J + 'kitchen/dish_salad_mix.webp'), w('pudding', '푸딩', J + 'kitchen/dish_pudding.webp'), w('noodles', '국수', J + 'snack/noodle.webp'), w('ham', '햄', J + 'snack/ham.webp'),
    w('yogurt', '요구르트', J + 'kitchen/ing_yogurt.webp'), w('pancake', '팬케이크', J + 'kitchen/dish_pancake.webp'), w('cookie', '쿠키', EN + 'cookie.webp'), w('pizza', '피자', EN + 'pizza.webp'),
    w('cake', '케이크', EN + 'cake.webp')
  ];
  var VEHICLES = [
    w('car', '자동차', OB + 'car.webp'), w('bus', '버스', OB + 'bus.webp'), w('taxi', '택시', OB + 'taxi.webp'), w('train', '기차', OB + 'train.webp'),
    w('airplane', '비행기', OB + 'airplane.webp'), w('boat', '배', OB + 'boat.webp'), w('bicycle', '자전거', OB + 'bicycle.webp'), w('truck', '트럭', OB + 'truck.webp'),
    w('helicopter', '헬리콥터', OB + 'helicopter.webp'), w('subway', '지하철', OB + 'subway.webp'), w('ambulance', '구급차', OB + 'ambulance.webp'), w('drone', '드론', J + 'drone/drone.webp')
  ];
  var THINGS = [
    w('cup', '컵', J + 'recycle/cup.webp'), w('key', '열쇠', OB + 'key.webp'), w('bed', '침대', OB + 'bed.webp'), w('chair', '의자', OB + 'chair.webp'),
    w('clock', '시계', OB + 'alarm.webp'), w('phone', '전화기', OB + 'smartphone.webp'), w('soap', '비누', OB + 'soap.webp'), w('spoon', '숟가락', OB + 'spoon.webp'),
    w('towel', '수건', OB + 'towel.webp'), w('book', '책', J + 'recycle/notebook.webp'), w('bell', '종', OB + 'bell.webp'), w('drum', '북', OB + 'drum.webp'),
    w('mirror', '거울', OB + 'mirror.webp'), w('star', '별', OB + 'star.webp'), w('box', '상자', J + 'recycle/box.webp')
  ];
  var COLORS = [
    col('red', '빨강', '#e53935'), col('blue', '파랑', '#1e88e5'), col('yellow', '노랑', '#fbc02d'), col('green', '초록', '#43a047'), col('orange', '주황', '#fb8c00'),
    col('purple', '보라', '#7e3fd0'), col('pink', '분홍', '#ec6fa0'), col('brown', '갈색', '#8d5a3b'), col('black', '검정', '#222222'), col('white', '하양', '#ffffff')
  ];

  /* 문장 세트: en(문장), blank(빈칸이 될 낱말 번호), 그림 */
  function s(en, blank, img) { var o = { en: en, blank: blank }; if (img && img[0] === '#') o.color = img; else if (img && img.indexOf('/') < 0) o.emo = img; else if (img) o.img = img; return o; }
  var GREET = [s('Good morning!', 1, OB + 'sun.webp'), s('Good night!', 1, OB + 'moon_night.webp'), s('Thank you!', 0, EN + 'thanks.webp'), s('Hello, friend!', 0, CH + 'ok_wave.webp'),
    s('I am sorry.', 2, EN + 'sorry.webp'), s('Nice to meet you!', 2, EN + 'meet.webp'), s('See you later!', 0, EN + 'bye.webp')];
  var THIS = [s('This is a cat.', 3, J + 'animals/cat.webp'), s('This is a dog.', 3, J + 'animals/dog.webp'), s('This is a bus.', 3, OB + 'bus.webp'), s('This is a key.', 3, OB + 'key.webp'),
    s('This is an apple.', 3, BF + 'f_apple.webp'), s('This is a cup.', 3, J + 'recycle/cup.webp'), s('This is a bed.', 3, OB + 'bed.webp'), s('This is an egg.', 3, J + 'kitchen/ing_egg.webp')];
  var COLOR = [s('It is red.', 2, BF + 'f_apple.webp'), s('It is yellow.', 2, BF + 'f_banana.webp'), s('It is green.', 2, J + 'animals/frog.webp'), s('It is orange.', 2, BF + 'f_tangerine.webp'),
    s('It is purple.', 2, BF + 'f_grapes.webp'), s('It is pink.', 2, OB + 'pig.webp'), s('It is brown.', 2, J + 'animals/bear.webp'), s('It is white.', 2, OB + 'snow.webp'), s('It is blue.', 2, OB + 'whale.webp')];
  var LIKE = [s('I like apples.', 2, BF + 'f_apple.webp'), s('I like bananas.', 2, BF + 'f_banana.webp'), s('I like grapes.', 2, BF + 'f_grapes.webp'), s('I like strawberries.', 2, J + 'farm/ripe_strawberry.webp'),
    s('I like milk.', 2, J + 'kitchen/ing_milk.webp'), s('I like cats.', 2, J + 'animals/cat.webp'), s('I like dogs.', 2, J + 'animals/dog.webp'), s('I like pancakes.', 2, J + 'kitchen/dish_pancake.webp')];
  var WANT = [s('I want milk.', 2, J + 'kitchen/ing_milk.webp'), s('I want water.', 2, OB + 'water_jar.webp'), s('I want an apple.', 3, BF + 'f_apple.webp'), s('I want a banana.', 3, BF + 'f_banana.webp'),
    s('I want soup.', 2, J + 'kitchen/dish_soup_coconut.webp'), s('I want an egg.', 3, J + 'kitchen/ing_egg.webp'), s('I want pudding.', 2, J + 'kitchen/dish_pudding.webp'), s('I want a pancake.', 3, J + 'kitchen/dish_pancake.webp')];
  var CAN = [s('A bird can fly.', 3, OB + 'bird.webp'), s('A fish can swim.', 3, OB + 'fish.webp'), s('A frog can jump.', 3, J + 'animals/frog.webp'), s('A horse can run.', 3, OB + 'horse.webp'),
    s('A monkey can climb.', 3, J + 'animals/monkey.webp'), s('A parrot can talk.', 3, J + 'animals/parrot.webp'), s('A duck can swim.', 3, OB + 'duck.webp'), s('An eagle can fly.', 3, OB + 'eagle.webp')];

  var R = { order: [4, 5, 5, 5, 5], find: [4, 5, 6, 6, 6], trace: [3, 4, 5, 6, 6], memory: [1, 2, 2, 2, 2], phonics: [4, 5, 5, 6, 6], write: [3, 4, 5, 5, 5], words: [4, 5, 5, 6, 5], sent: [4, 5, 5, 5, 5] };
  var WDESC = ['그림 카드를 눌러 영어 이름 듣기 + 낱말 크게 따라 쓰기', '듣고 그림 2개 중 고르기 · 낱말 따라 쓰기 · 흐린 글자 블록으로 낱말 만들기 · 짝 카드', '듣고 3개 중 고르기 · 글자 블록 낱말 만들기(흐린 힌트) · 따라 쓰기 · 짝 카드', '그림 보고 글자 블록 낱말 만들기(헷갈리는 글자 섞임) · 4개 중 고르기 · 흐린 안내 쓰기 · 짝 카드', '소리만 듣고 낱말 만들기 · 아주 흐린 안내로 쓰기 · 짝 카드 5쌍'];
  var SDESC = ['그림을 보고 문장을 듣고 따라 말하기', '빈칸 낱말 2개 중 고르기 → 문장 듣고 따라 말하기', '빈칸 낱말 3개 중 고르기', '낱말 블록을 순서대로 눌러 문장 만들기', '소리만 듣고 낱말 블록으로 문장 만들기'];
  var L = function (mode, extra, desc) { return Object.assign({ engine: 'abc', kind: 'letters', mode: mode, rounds: R[mode], desc: desc }, extra || {}); };

  C['05-00-01-01'] = L('find', null, ['큰 알파벳 카드를 눌러 이름 듣기', '알파벳 이름 듣고 2개 중 고르기', '알파벳 이름 듣고 3개 중 고르기', '대·소문자 섞인 4개 중 고르기', '소리만 듣고 소문자 4개 중 고르기']);
  C['05-00-01-02'] = L('trace', { caseMode: 'upper' }, ['진한 대문자 위를 따라 쓰기(4줄 칸, 넉넉한 판정) — A부터 차례로 이어서', '대문자 따라 쓰기', '대문자 따라 쓰기(조금 더 정확하게)', '흐린 안내 대문자 쓰기', '아주 흐린 안내만 보고 대문자 쓰기']);
  C['05-00-01-03'] = L('trace', { caseMode: 'lower' }, ['진한 소문자 위를 따라 쓰기(4줄 칸) — a부터 차례로', '4줄 칸 소문자 따라 쓰기', '높이를 맞춰 소문자 따라 쓰기', '흐린 안내 소문자 쓰기', '아주 흐린 안내만 보고 소문자 쓰기']);
  C['05-00-01-04'] = L('memory', null, ['대·소문자 카드 2쌍 뒤집기(처음에 3초 보여 줌)', '카드 3쌍 뒤집기', '카드 4쌍 뒤집기', '카드 5쌍, 잠깐 보고 기억하기', '소리 카드(🔊)와 대문자 카드 6쌍']);
  C['05-00-01-05'] = L('phonics', { words: ABC }, ['글자와 첫소리 그림을 눌러 듣기 (A, apple)', '같은 첫소리 그림 2개 중 고르기', '같은 첫소리 그림 3개 중 고르기', '같은 첫소리 그림 4개 중 고르기', '그림을 보고 첫 글자 4개 중 고르기']);
  C['05-00-01-06'] = L('write', null, ['소리 듣고 진한 안내 글자 따라 쓰기', '소리 듣고 흐린 안내 글자 따라 쓰기', '소리 듣고 글자 판(6개)에서 고른 뒤 따라 쓰기', '소리만 듣고 대문자 직접 쓰기(쓴 모양 알아보기)', '소리만 듣고 소문자 직접 쓰기']);

  var Wd = function (items) { return { engine: 'abc', kind: 'words', items: items, rounds: R.words, desc: WDESC }; };
  C['05-00-02-01'] = Wd(ANIMALS);
  C['05-00-02-02'] = Wd(FRUITS);
  C['05-00-02-03'] = Wd(FOOD);
  C['05-00-02-04'] = Wd(VEHICLES);
  C['05-00-02-05'] = Wd(THINGS);
  C['05-00-02-06'] = Wd(COLORS);

  var Sn = function (sets) { return { engine: 'abc', kind: 'sentences', sets: sets, rounds: R.sent, desc: SDESC }; };
  C['05-00-03-01'] = Sn(GREET);
  C['05-00-03-02'] = Sn(THIS);
  C['05-00-03-03'] = Sn(COLOR);
  C['05-00-03-04'] = Sn(LIKE);
  C['05-00-03-05'] = Sn(WANT);
  C['05-00-03-06'] = Sn(CAN);

  /* ===== 추가 차시 (알파벳 순서 · 날씨/악기/장소 낱말 · I see / I have / What is this / 종합) ===== */
  var NATURE = [
    w('sun', '해', OB + 'sun.webp'), w('moon', '달', OB + 'moon_night.webp'), w('star', '별', OB + 'star.webp'), w('cloud', '구름', OB + 'cloud.webp'),
    w('rain', '비', OB + 'rain.webp'), w('snow', '눈', OB + 'snow.webp'), w('wind', '바람', OB + 'wind.webp'), w('rainbow', '무지개', OB + 'rainbow.webp'),
    w('tree', '나무', OB + 'tree.webp'), w('flower', '꽃', OB + 'flower.webp'), w('leaf', '잎', OB + 'leaf.webp'), w('river', '강', OB + 'river.webp')
  ];
  var MUSIC = [
    w('drum', '북', OB + 'drum.webp'), w('piano', '피아노', OB + 'piano.webp'), w('guitar', '기타', OB + 'guitar.webp'), w('violin', '바이올린', OB + 'violin.webp'),
    w('trumpet', '트럼펫', OB + 'trumpet.webp'), w('bell', '종', OB + 'bell.webp'), w('recorder', '리코더', OB + 'recorder.webp'), w('maracas', '마라카스', OB + 'maracas.webp'),
    w('xylophone', '실로폰', OB + 'xylophone.webp')
  ];
  var PLACES = [
    w('school', '학교', OB + 'pl_school.webp'), w('park', '공원', OB + 'pl_park.webp'), w('bank', '은행', OB + 'pl_bank.webp'), w('home', '집', OB + 'pl_home.webp'),
    w('hospital', '병원', OB + 'pl_hospital.webp'), w('library', '도서관', OB + 'pl_library.webp'), w('mart', '마트', OB + 'pl_mart.webp'), w('police', '경찰서', OB + 'pl_police.webp')
  ];
  var SEE = [s('I see a bird.', 3, OB + 'bird.webp'), s('I see a cloud.', 3, OB + 'cloud.webp'), s('I see a tree.', 3, OB + 'tree.webp'), s('I see a rainbow.', 3, OB + 'rainbow.webp'),
    s('I see a boat.', 3, OB + 'boat.webp'), s('I see a train.', 3, OB + 'train.webp'), s('I see a star.', 3, OB + 'star.webp'), s('I see a flower.', 3, OB + 'flower.webp')];
  var HAVE = [s('I have a key.', 3, OB + 'key.webp'), s('I have a cup.', 3, J + 'recycle/cup.webp'), s('I have a bell.', 3, OB + 'bell.webp'), s('I have a drum.', 3, OB + 'drum.webp'),
    s('I have a phone.', 3, OB + 'smartphone.webp'), s('I have a guitar.', 3, OB + 'guitar.webp'), s('I have a towel.', 3, OB + 'towel.webp'), s('I have a spoon.', 3, OB + 'spoon.webp')];
  var BODY = [w('eye', '눈', EN + 'eye.webp'), w('nose', '코', EN + 'nose.webp'), w('mouth', '입', EN + 'mouth.webp'), w('ear', '귀', EN + 'ear.webp'),
    w('hand', '손', EN + 'hand.webp'), w('foot', '발', EN + 'foot.webp'), w('arm', '팔', EN + 'arm.webp'), w('leg', '다리', EN + 'leg.webp')];
  var SCHOOL = [w('pencil', '연필', EN + 'pencil.webp'), w('eraser', '지우개', EN + 'eraser.webp'), w('bag', '가방', EN + 'backpack.webp'), w('scissors', '가위', EN + 'scissors.webp'),
    w('ruler', '자', EN + 'ruler.webp'), w('glue', '풀', EN + 'glue.webp'), w('book', '책', J + 'recycle/notebook.webp')];
  var CLOTHES = [w('hat', '모자', EN + 'hat.webp'), w('shirt', '티셔츠', EN + 'tshirt.webp'), w('pants', '바지', EN + 'pants.webp'), w('shoes', '신발', EN + 'shoes.webp'),
    w('socks', '양말', EN + 'socks.webp'), w('jacket', '점퍼', EN + 'jacket.webp')];
  var TOYS = [w('ball', '공', EN + 'ball.webp'), w('doll', '인형', EN + 'doll.webp'), w('robot', '로봇', EN + 'robot.webp'), w('kite', '연', EN + 'kite.webp'),
    w('bear', '곰 인형', EN + 'teddy.webp'), w('car', '장난감 자동차', EN + 'toycar.webp')];
  var MYBODY = [s('This is my eye.', 3, EN + 'eye.webp'), s('This is my nose.', 3, EN + 'nose.webp'), s('This is my mouth.', 3, EN + 'mouth.webp'), s('This is my ear.', 3, EN + 'ear.webp'),
    s('This is my hand.', 3, EN + 'hand.webp'), s('This is my foot.', 3, EN + 'foot.webp'), s('This is my arm.', 3, EN + 'arm.webp'), s('This is my leg.', 3, EN + 'leg.webp')];
  var WEAR = [s('I wear a hat.', 3, EN + 'hat.webp'), s('I wear a shirt.', 3, EN + 'tshirt.webp'), s('I wear pants.', 2, EN + 'pants.webp'), s('I wear shoes.', 2, EN + 'shoes.webp'),
    s('I wear socks.', 2, EN + 'socks.webp'), s('I wear a jacket.', 3, EN + 'jacket.webp')];
  HAVE = HAVE.concat([s('I have a ball.', 3, EN + 'ball.webp'), s('I have a doll.', 3, EN + 'doll.webp'), s('I have a robot.', 3, EN + 'robot.webp'), s('I have a kite.', 3, EN + 'kite.webp'),
    s('I have a pencil.', 3, EN + 'pencil.webp'), s('I have a ruler.', 3, EN + 'ruler.webp'), s('I have a bag.', 3, EN + 'backpack.webp'), s('I have an eraser.', 3, EN + 'eraser.webp')]);
  function q(en, img, blank) { var o = s(en, blank == null ? 3 : blank, img); o.q = 'What is this?'; return o; }
  var WHAT = [q('It is a cat.', J + 'animals/cat.webp'), q('It is a dog.', J + 'animals/dog.webp'), q('It is a bus.', OB + 'bus.webp'), q('It is a car.', OB + 'car.webp'),
    q('It is a tree.', OB + 'tree.webp'), q('It is a bird.', OB + 'bird.webp'), q('It is a clock.', OB + 'alarm.webp'), q('It is a chair.', OB + 'chair.webp')];
  var MIX = [].concat(GREET.slice(0, 3), THIS.slice(0, 3), COLOR.slice(0, 3), LIKE.slice(0, 3), WANT.slice(0, 2), CAN.slice(0, 3), SEE.slice(0, 2), HAVE.slice(0, 2), WHAT.slice(0, 3), MYBODY.slice(0, 2), WEAR.slice(0, 2));
  C['05-00-01-07'] = L('order', null, ['첫 글자가 놓인 칸에 이어서 3글자를 순서대로 누르기', '4글자를 순서대로 누르기(첫 글자만 보여 줌)', '5글자 사이에서 빠진 글자를 3개 중에서 고르기', '5글자를 처음부터 순서대로 누르기', '소문자로 빠진 글자 찾기 · 6글자 순서 놓기']);
  C['05-00-02-07'] = Wd(NATURE);
  C['05-00-02-08'] = Wd(MUSIC);
  C['05-00-02-09'] = Wd(PLACES);
  C['05-00-03-07'] = Sn(SEE);
  C['05-00-03-08'] = Sn(HAVE);
  C['05-00-03-09'] = Sn(WHAT);
  C['05-00-02-10'] = Wd(BODY);
  C['05-00-02-11'] = Wd(SCHOOL);
  C['05-00-02-12'] = Wd(CLOTHES);
  C['05-00-02-13'] = Wd(TOYS);
  C['05-00-03-10'] = Sn(MYBODY);
  C['05-00-03-11'] = Sn(WEAR);
  C['05-00-03-12'] = Sn(MIX);

  window.OKS_EN_BASICS = { ABC: ABC, ANIMALS: ANIMALS, FRUITS: FRUITS, FOOD: FOOD, VEHICLES: VEHICLES, THINGS: THINGS, COLORS: COLORS, GREET: GREET, THIS: THIS, COLOR: COLOR, LIKE: LIKE, WANT: WANT, CAN: CAN, NATURE: NATURE, MUSIC: MUSIC, BODY: BODY, SCHOOL: SCHOOL, CLOTHES: CLOTHES, TOYS: TOYS, MYBODY: MYBODY, WEAR: WEAR, PLACES: PLACES, SEE: SEE, HAVE: HAVE, WHAT: WHAT };
})();
