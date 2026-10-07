/* 미술 놀이(그림 퍼즐 · 그림 짝 찾기 · 색 찾기)가 함께 쓰는 그림 목록
   SCENES: 우리 교실 그림 / MASTERS: art/masters/masters.js 에 넣은 명화 */
(function () {
  'use strict';
  var SCENES = [
    ['폭포 정글', 'art/scenes/jungle.jpg'], ['한옥 정자 공원', 'art/scenes/park.jpg'], ['연못', 'art/scenes/pond.jpg'], ['눈 나라', 'art/scenes/snow.jpg'],
    ['가을 마을', 'art/scenes/town_autumn.jpg'], ['봄 마을', 'art/scenes/town_spring.jpg'], ['여름 마을', 'art/scenes/town_summer.jpg'], ['겨울 마을', 'art/scenes/town_winter.jpg'],
    ['나무 위 집', 'art/scenes/treehouse.jpg'], ['꽃 섬 마을', 'art/scenes/town_spring_hd.webp'], ['반짝 사원', 'art/jj/scenes/temple.webp'], ['옛 숲 유적', 'art/jj/scenes/ruins.webp'],
    ['보석 동굴', 'art/jj/scenes/crystal.webp'], ['화산 섬', 'art/jj/scenes/volcano.webp'], ['초록별', 'art/space/land_center.webp'], ['보라별', 'art/space/land_dream.webp'],
    ['농장별', 'art/space/land_farm.webp'], ['분홍별', 'art/space/land_love.webp'], ['바다별 해변', 'art/space/land_sea.webp'], ['맑은 하늘', 'games/birds/img/sky.webp'],
    ['바닷속', 'games/fishing/img/sea.webp'], ['동물 마을 지도', 'games/tycoon/img/town.webp'], ['스포츠 센터', 'sports/assets/ballcenter/center_outside.webp'], ['은하수', 'space/img/galaxy.webp'],
    ['호수 섬 마을', 'town/wj.webp'], ['꽃 온실', 'core/ui/greenhouse.webp']
  ];
  var M = (window.OKS_MASTERS || []).map(function (m) { return [m[0], m[1], m[2] || '', true]; });
  window.OKS_ART = { SCENES: SCENES, MASTERS: M, all: function () { return M.concat(SCENES); }, masters: function () { return M; } };
})();
