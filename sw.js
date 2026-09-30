// ok's class - 오프라인(설치형) 사용을 위한 서비스 워커
// 내용을 바꿀 때마다 CACHE_NAME 뒤 숫자를 올려주세요 (그래야 브라우저가 업데이트를 감지합니다)
const CACHE_NAME = 'oks-class-v45';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './learn/',
  './learn/index.html',
  './learn/learn.css',
  './learn/learn.js',
  './play/',
  './play/index.html',
  './play/play.css',
  './play/play.js',
  './play/content.js',
  './play/content2.js',
  './play/describe.js',
  './curriculum/plan.html',
  './play/engines.js',
  './play/engines2.js',
  './play/farm.js',
  './core/oks-core.css',
  './core/oks-core.js',
  './core/oks-kit.js',
  './core/oks-eco.js',
  './curriculum/lessons.js',
  './shop/',
  './shop/index.html',
  './shop/shop.css',
  './shop/shop.js',
  './shop/shops.js',
  './shop/stations.js',
  './town/',
  './town/index.html',
  './town/town.css',
  './town/town.js',
  './town/cc.webp',
  './town/wj.webp',
  './games/farm/index.html',
  './minigames/farm-v8/index.html',
  './career/cafe.html',
  './career/barista.html',
  './korean/index.html',
  './korean/catch.html',
  './lobby/lobby-v2.css',
  './lobby/lobby-v3.css',
  './curriculum/catalog.json',
  './curriculum/game-blueprint.json',
  './minigames/index.html',
  './minigames/art-tycoon.html',
  './minigames/packs.js',
  './quests/index.html',
  './curriculum/teacher-guide.html',
  './curriculum/reports.html',
  './core/ui/arrow_down.webp',
  './core/ui/btn_blue.webp',
  './core/ui/btn_green.webp',
  './core/ui/btn_orange.webp',
  './core/ui/btn_pink.webp',
  './core/ui/btn_purple.webp',
  './core/ui/chalkboard.webp',
  './core/ui/coin.webp',
  './core/ui/greenhouse.webp',
  './core/ui/greenhouse_s.webp',
  './core/ui/lock.webp',
  './core/ui/order_bubble.webp',
  './core/ui/pointer.webp',
  './core/ui/rabbit_face.webp',
  './core/ui/reward_coins.webp',
  './core/ui/sparkles.webp',
  './core/ui/speaker.webp',
  './core/ui/star.webp',
  './core/ui/star_gold.webp',
  './core/ui/title_wood.webp',
  './games/farm/assets/arrow_down.webp',
  './games/farm/assets/basket.webp',
  './games/farm/assets/basket_front.webp',
  './games/farm/assets/btn_blue.webp',
  './games/farm/assets/btn_green.webp',
  './games/farm/assets/btn_green_alt.webp',
  './games/farm/assets/btn_orange.webp',
  './games/farm/assets/btn_pink.webp',
  './games/farm/assets/btn_purple.webp',
  './games/farm/assets/carrot_cluster.webp',
  './games/farm/assets/carrots.webp',
  './games/farm/assets/cat.webp',
  './games/farm/assets/chalkboard.webp',
  './games/farm/assets/coffee_bean.webp',
  './games/farm/assets/coffee_bean_alt.webp',
  './games/farm/assets/coin.webp',
  './games/farm/assets/empty_planter.webp',
  './games/farm/assets/greenhouse.webp',
  './games/farm/assets/growth_series.webp',
  './games/farm/assets/harvest_carrot.webp',
  './games/farm/assets/harvest_lettuce.webp',
  './games/farm/assets/harvest_strawberry.webp',
  './games/farm/assets/harvest_tomato.webp',
  './games/farm/assets/lettuce_icons.webp',
  './games/farm/assets/lettuce_plant.webp',
  './games/farm/assets/lock.webp',
  './games/farm/assets/monkey.webp',
  './games/farm/assets/order_bubble.webp',
  './games/farm/assets/panda.webp',
  './games/farm/assets/parcel.webp',
  './games/farm/assets/parcel_seed.webp',
  './games/farm/assets/pointer.webp',
  './games/farm/assets/progress_bar.webp',
  './games/farm/assets/rabbit_face.webp',
  './games/farm/assets/rabbit_farmer.webp',
  './games/farm/assets/reward_coins.webp',
  './games/farm/assets/shop_home.webp',
  './games/farm/assets/soil_pot.webp',
  './games/farm/assets/sparkles.webp',
  './games/farm/assets/speaker.webp',
  './games/farm/assets/sprout.webp',
  './games/farm/assets/sprout_pot.webp',
  './games/farm/assets/stand.webp',
  './games/farm/assets/star.webp',
  './games/farm/assets/star_gold.webp',
  './games/farm/assets/strawberry_plant.webp',
  './games/farm/assets/strawberry_single.webp',
  './games/farm/assets/title_wood.webp',
  './games/farm/assets/tomato_icons.webp',
  './games/farm/assets/tomato_plant.webp',
  './games/farm/assets/watering_can.webp',
  './games/farm/assets/young_plant.webp',
  './art/jj/animals/baby_monkey.webp',
  './art/jj/animals/bear.webp',
  './art/jj/animals/cat.webp',
  './art/jj/animals/chameleon.webp',
  './art/jj/animals/dog.webp',
  './art/jj/animals/elephant.webp',
  './art/jj/animals/fox.webp',
  './art/jj/animals/frog.webp',
  './art/jj/animals/gorilla_king.webp',
  './art/jj/animals/koala.webp',
  './art/jj/animals/monkey.webp',
  './art/jj/animals/owl.webp',
  './art/jj/animals/panda.webp',
  './art/jj/animals/parrot.webp',
  './art/jj/animals/penguin.webp',
  './art/jj/animals/rabbit.webp',
  './art/jj/animals/sloth.webp',
  './art/jj/animals/tiger.webp',
  './art/jj/coffee/bean_gold.webp',
  './art/jj/coffee/bean_green.webp',
  './art/jj/coffee/bean_roasted.webp',
  './art/jj/coffee/bean_sack.webp',
  './art/jj/coffee/bean_sack2.webp',
  './art/jj/coffee/cherry.webp',
  './art/jj/coffee/cup_espresso.webp',
  './art/jj/coffee/cup_hot.webp',
  './art/jj/coffee/cup_iced.webp',
  './art/jj/coffee/cup_latte.webp',
  './art/jj/coffee/cup_mug.webp',
  './art/jj/coffee/pitcher.webp',
  './art/jj/coffee/portafilter.webp',
  './art/jj/coffee/roaster.webp',
  './art/jj/coffee/tamper.webp',
  './art/jj/coffee/tree_1.webp',
  './art/jj/coffee/tree_2.webp',
  './art/jj/coffee/tree_3.webp',
  './art/jj/drone/drone.webp',
  './art/jj/drone/drone_box.webp',
  './art/jj/drone/house.webp',
  './art/jj/drone/pad.webp',
  './art/jj/drone/ring.webp',
  './art/jj/drone/ring_ok.webp',
  './art/jj/farm/basket.webp',
  './art/jj/farm/bug.webp',
  './art/jj/farm/can.webp',
  './art/jj/farm/crop_carrot.webp',
  './art/jj/farm/crop_lettuce.webp',
  './art/jj/farm/crop_strawberry.webp',
  './art/jj/farm/crop_tomato.webp',
  './art/jj/farm/panel.webp',
  './art/jj/farm/plot.webp',
  './art/jj/farm/ripe_carrot.webp',
  './art/jj/farm/ripe_lettuce.webp',
  './art/jj/farm/ripe_strawberry.webp',
  './art/jj/farm/ripe_tomato.webp',
  './art/jj/farm/seed_bag.webp',
  './art/jj/farm/sprout.webp',
  './art/jj/farm/tongs.webp',
  './art/jj/farm/young.webp',
  './art/jj/foes/bat.webp',
  './art/jj/foes/bee.webp',
  './art/jj/foes/snake.webp',
  './art/jj/foes/spider.webp',
  './art/jj/kitchen/dish_banana_grill.webp',
  './art/jj/kitchen/dish_egg.webp',
  './art/jj/kitchen/dish_omelette.webp',
  './art/jj/kitchen/dish_pancake.webp',
  './art/jj/kitchen/dish_pancake_honey.webp',
  './art/jj/kitchen/dish_pudding.webp',
  './art/jj/kitchen/dish_salad_mix.webp',
  './art/jj/kitchen/dish_soup_coconut.webp',
  './art/jj/kitchen/dish_soup_mango.webp',
  './art/jj/kitchen/dish_watermelon.webp',
  './art/jj/kitchen/ing_choco.webp',
  './art/jj/kitchen/ing_coconut.webp',
  './art/jj/kitchen/ing_egg.webp',
  './art/jj/kitchen/ing_flour.webp',
  './art/jj/kitchen/ing_honey.webp',
  './art/jj/kitchen/ing_ice.webp',
  './art/jj/kitchen/ing_milk.webp',
  './art/jj/kitchen/ing_vanilla.webp',
  './art/jj/kitchen/ing_yogurt.webp',
  './art/jj/kitchen/tool_board.webp',
  './art/jj/kitchen/tool_knife.webp',
  './art/jj/kitchen/tool_pan.webp',
  './art/jj/kitchen/tool_pot.webp',
  './art/jj/recycle/bin_can.webp',
  './art/jj/recycle/bin_glass.webp',
  './art/jj/recycle/bin_paper.webp',
  './art/jj/recycle/bin_plastic.webp',
  './art/jj/recycle/box.webp',
  './art/jj/recycle/can.webp',
  './art/jj/recycle/cup.webp',
  './art/jj/recycle/dirt.webp',
  './art/jj/recycle/honey_jar.webp',
  './art/jj/recycle/milk_bottle.webp',
  './art/jj/recycle/newspaper.webp',
  './art/jj/recycle/notebook.webp',
  './art/jj/recycle/shampoo.webp',
  './art/jj/scenes/cafe.webp',
  './art/jj/scenes/crystal.webp',
  './art/jj/scenes/drone.webp',
  './art/jj/scenes/farmhouse.webp',
  './art/jj/scenes/kitchen.webp',
  './art/jj/scenes/recycle.webp',
  './art/jj/scenes/ruins.webp',
  './art/jj/scenes/snack.webp',
  './art/jj/scenes/temple.webp',
  './art/jj/scenes/volcano.webp',
  './art/jj/snack/carrot.webp',
  './art/jj/snack/danmuji.webp',
  './art/jj/snack/egg_strip.webp',
  './art/jj/snack/gim.webp',
  './art/jj/snack/ham.webp',
  './art/jj/snack/kimbap_plate.webp',
  './art/jj/snack/kimbap_roll.webp',
  './art/jj/snack/money.webp',
  './art/jj/snack/noodle.webp',
  './art/jj/snack/pot.webp',
  './art/jj/snack/ramen_bowl.webp',
  './art/jj/snack/ricecake.webp',
  './art/jj/snack/soup.webp',
  './art/jj/snack/spinach.webp',
  './art/jj/snack/stove.webp',
  './icons/apple-touch-icon.png',
  './icons/avatar-walk-a.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/mascot-cheer.png',
  './icons/mascot-idle.png',
  './icons/mascot-soft.png',
  './icons/subj-colors.png',
  './icons/subj-draw.png',
  './icons/subj-explore.png',
  './icons/subj-gallery.png',
  './icons/subj-shapes.png',
  './icons/subj-sizes.png',
  './icons/bg-artroom.jpg',
  './icons/world-autumn.jpg',
  './icons/world-spring.jpg',
  './icons/world-summer.jpg',
  './icons/world-winter.jpg'
];

const OPTIONAL_ASSETS = ['./art/scenes/town_spring_hd.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).then(() => Promise.all(
        OPTIONAL_ASSETS.map((path) => cache.add(path).catch(() => null))
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// 화면(HTML)은 항상 최신을 먼저 받아오고, 오프라인일 때만 저장본을 씀(네트워크 우선).
// 아이콘 등 잘 안 바뀌는 파일은 저장본을 먼저 씀(캐시 우선) — 그래야 배포 직후에도 바로 새 화면이 보입니다.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isPage = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // A previously missing high-resolution image must not be stuck behind a cached 404.
  const newMap = event.request.url.includes('/art/scenes/town_spring_hd.webp');
  if(newMap){
    event.respondWith(fetch(event.request).then((response)=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached && cached.ok) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          if(response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
