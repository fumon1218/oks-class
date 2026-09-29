// ok's class - 오프라인(설치형) 사용을 위한 서비스 워커
// 내용을 바꿀 때마다 CACHE_NAME 뒤 숫자를 올려주세요 (그래야 브라우저가 업데이트를 감지합니다)
const CACHE_NAME = 'oks-class-v41';
const ASSETS = [
  './',
  './index.html',
  './career/cafe.html',
  './career/barista.html',
  './korean/index.html',
  './korean/catch.html',
  './lobby/lobby-v2.css',
  './lobby/lobby-v3.css',
  './curriculum/catalog.json',
  './curriculum/game-blueprint.json',
  './minigames/index.html',
  './minigames/math-fruit.html',
  './minigames/math-tycoon.html',
  './minigames/math-tycoon-v2.html',
  './minigames/math-tycoon-v3.html',
  './minigames/farm-v8/index.html',
  './minigames/farm-v8/game.css',
  './minigames/farm-v8/game.js',
  './minigames/farm-v8/assets/arrow_down.webp',
  './minigames/farm-v8/assets/basket.webp',
  './minigames/farm-v8/assets/basket_front.webp',
  './minigames/farm-v8/assets/btn_blue.webp',
  './minigames/farm-v8/assets/btn_green.webp',
  './minigames/farm-v8/assets/btn_green_alt.webp',
  './minigames/farm-v8/assets/btn_orange.webp',
  './minigames/farm-v8/assets/btn_pink.webp',
  './minigames/farm-v8/assets/btn_purple.webp',
  './minigames/farm-v8/assets/carrot_cluster.webp',
  './minigames/farm-v8/assets/carrots.webp',
  './minigames/farm-v8/assets/cat.webp',
  './minigames/farm-v8/assets/chalkboard.webp',
  './minigames/farm-v8/assets/coffee_bean.webp',
  './minigames/farm-v8/assets/coffee_bean_alt.webp',
  './minigames/farm-v8/assets/coin.webp',
  './minigames/farm-v8/assets/empty_planter.webp',
  './minigames/farm-v8/assets/greenhouse.webp',
  './minigames/farm-v8/assets/growth_series.webp',
  './minigames/farm-v8/assets/harvest_carrot.webp',
  './minigames/farm-v8/assets/harvest_lettuce.webp',
  './minigames/farm-v8/assets/harvest_strawberry.webp',
  './minigames/farm-v8/assets/harvest_tomato.webp',
  './minigames/farm-v8/assets/lettuce_icons.webp',
  './minigames/farm-v8/assets/lettuce_plant.webp',
  './minigames/farm-v8/assets/lock.webp',
  './minigames/farm-v8/assets/monkey.webp',
  './minigames/farm-v8/assets/order_bubble.webp',
  './minigames/farm-v8/assets/panda.webp',
  './minigames/farm-v8/assets/parcel.webp',
  './minigames/farm-v8/assets/parcel_seed.webp',
  './minigames/farm-v8/assets/pointer.webp',
  './minigames/farm-v8/assets/progress_bar.webp',
  './minigames/farm-v8/assets/rabbit_face.webp',
  './minigames/farm-v8/assets/rabbit_farmer.webp',
  './minigames/farm-v8/assets/reward_coins.webp',
  './minigames/farm-v8/assets/shop_home.webp',
  './minigames/farm-v8/assets/soil_pot.webp',
  './minigames/farm-v8/assets/sparkles.webp',
  './minigames/farm-v8/assets/speaker.webp',
  './minigames/farm-v8/assets/sprout.webp',
  './minigames/farm-v8/assets/sprout_pot.webp',
  './minigames/farm-v8/assets/stand.webp',
  './minigames/farm-v8/assets/star.webp',
  './minigames/farm-v8/assets/star_gold.webp',
  './minigames/farm-v8/assets/strawberry_plant.webp',
  './minigames/farm-v8/assets/strawberry_single.webp',
  './minigames/farm-v8/assets/title_wood.webp',
  './minigames/farm-v8/assets/tomato_icons.webp',
  './minigames/farm-v8/assets/tomato_plant.webp',
  './minigames/farm-v8/assets/watering_can.webp',
  './minigames/farm-v8/assets/young_plant.webp',
  './minigames/farm-mockup-v3.css',
  './minigames/farm-props-v4.css',
  './art/farm/v4/rabbit_full.webp',
  './minigames/farm-responsive-v5.css',
  './minigames/farm-clean-v6.css',
  './minigames/farm-prices-v7.css',
  './art/farm/v4/panda.webp',
  './art/farm/v4/cat.webp',
  './art/farm/v4/monkey.webp',
  './art/farm/v4/rabbit.webp',
  './minigames/farm-floral-v3.svg',
  './minigames/art-tycoon.html',
  './minigames/packs.js',
  './quests/index.html',
  './curriculum/teacher-guide.html',
  './curriculum/reports.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
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
