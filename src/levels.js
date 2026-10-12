/**
 * src/levels.js
 * 앵그리버드 PWA - 6대 테마별 버라이어티 스테이지 & 버드/블록 확장 데이터
 * 월드 기준 해상도: 1280 x 720 (지면 Y좌표: 580)
 */

(function () {
  'use strict';

  const GROUND_Y = 580;

  /**
   * 바닥 기준 좌표(bottomY)로 사각 블록 중심(x, y)을 계산하는 헬퍼
   */
  function box(x, bottomY, w, h, material = 'wood', isStatic = false) {
    return {
      shape: 'rectangle',
      x,
      y: bottomY - h / 2,
      w,
      h,
      material, // 'wood' | 'ice' | 'stone' | 'tnt'
      isStatic
    };
  }

  /**
   * 바닥 기준 좌표(bottomY)로 둥근 돌 바위(boulder) 중심(x, y)을 계산하는 헬퍼
   */
  function boulder(x, bottomY, radius = 28, isStatic = false) {
    return {
      shape: 'circle',
      x,
      y: bottomY - radius,
      radius,
      material: 'boulder',
      isStatic
    };
  }

  /**
   * 바닥 기준 좌표(bottomY)로 돼지 중심(x, y)을 계산하는 헬퍼
   */
  function pig(x, bottomY, radius = 22, role = 'normal') {
    return {
      x,
      y: bottomY - radius,
      radius,
      role // 'normal' | 'helmet' | 'king'
    };
  }

  /**
   * 버드 6종 데이터
   */
  window.BIRD_INFO = {
    red: {
      name: '레드 (Red)',
      color: '#ef4444',
      radius: 20,
      mass: 4.5,
      skillDesc: '공중 클릭/터치: 주변을 밀어내는 충격파(Shockwave) 발산!'
    },
    yellow: {
      name: '척 (Chuck)',
      color: '#facc15',
      radius: 19,
      mass: 4.0,
      skillDesc: '공중 클릭/터치: 초고속 터보 돌진! (나무 구조물 관통 특화)'
    },
    blue: {
      name: '블루 (Blues)',
      color: '#38bdf8',
      radius: 15,
      mass: 2.8,
      skillDesc: '공중 클릭/터치: 3마리로 분신! (얼음/유리 구조물 파괴 특화)'
    },
    black: {
      name: '밤 (Bomb)',
      color: '#1e293b',
      radius: 24,
      mass: 6.5,
      skillDesc: '공중 클릭/터치: 강력한 대폭발! (돌/석재 요새 초토화)'
    },
    white: {
      name: '마틸다 (Matilda)',
      color: '#f8fafc',
      radius: 22,
      mass: 4.8,
      skillDesc: '공중 클릭/터치: 아래로 알 폭탄(Egg Bomb) 투하 & 대각선 반동 도약!'
    },
    big: {
      name: '테렌스 (Terence)',
      color: '#991b1b',
      radius: 30,
      mass: 14.0,
      skillDesc: '패시브: 압도적인 거대 질량과 괴력으로 어떤 요새든 그대로 분쇄!'
    }
  };

  /**
   * 6개 차별화 테마 스테이지 목록
   */
  window.LEVELS = [
    // =========================================================================
    // STAGE 1: 🌿 에메랄드 초원 (Green Plains)
    // 콘셉트: 목조 풍차 오두막과 도미노 붕괴 (기본기 마스터)
    // =========================================================================
    {
      id: 1,
      theme: 'plains',
      skyTheme: 'day',
      title: 'STAGE 1 : 🌿 에메랄드 초원',
      subtitle: '새총을 당겨 나무 오두막 안의 초록 돼지들을 물리치세요!',
      badge: '초원 / 기본 훈련',
      gravityY: 1.0,
      birds: ['red', 'red', 'yellow'],
      threeStarScore: 23000,
      twoStarScore: 15000,
      blocks: [
        // 1층 목조 기둥 3개 (높이 110)
        box(780, GROUND_Y, 22, 110, 'wood'),
        box(900, GROUND_Y, 22, 110, 'wood'),
        box(1020, GROUND_Y, 22, 110, 'wood'),

        // 1층 천장 판자 (상단 Y: 450)
        box(840, 470, 145, 20, 'wood'),
        box(960, 470, 145, 20, 'wood'),

        // 2층 얼음 기둥 (높이 90)
        box(845, 450, 20, 90, 'ice'),
        box(955, 450, 20, 90, 'ice'),

        // 2층 지붕 판자
        box(900, 360, 150, 20, 'wood'),

        // 지붕 장식
        box(900, 340, 50, 32, 'ice')
      ],
      pigs: [
        pig(840, GROUND_Y, 22, 'normal'),
        pig(960, GROUND_Y, 22, 'normal'),
        pig(900, 450, 24, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 2: 🏜️ 황혼의 사막 협곡 (Desert Canyon & Wild West)
    // 기믹: 고지대 암반 절벽 위 거대한 둥근 돌 바위(Rolling Boulder)를 굴려 요새 궤멸!
    // =========================================================================
    {
      id: 2,
      theme: 'desert',
      skyTheme: 'sunset',
      title: 'STAGE 2 : 🏜️ 황혼의 사막 협곡',
      subtitle: '언덕 위 굴러가는 바위(Boulder)의 지지대를 부숴 사막 요새를 덮치세요!',
      badge: '사막 / 롤링 바위 기믹',
      gravityY: 1.0,
      birds: ['yellow', 'white', 'yellow', 'red'],
      threeStarScore: 30000,
      twoStarScore: 20000,
      blocks: [
        // 사막 고지대 암반 절벽 (Static 고정 테라스 발판)
        box(730, GROUND_Y, 90, 160, 'stone', true),
        box(730, 420, 120, 22, 'stone', true),

        // 바위를 받치고 있는 얇은 나무 지지대 (이걸 부수면 바위가 굴러감!)
        box(775, 398, 16, 50, 'wood'),

        // 언덕 위 거대한 둥근 돌 바위 (지름 56)
        boulder(730, 398, 28),

        // 아래쪽 사막 요새 - 1층 (X: 860 ~ 1080)
        box(870, GROUND_Y, 24, 120, 'wood'),
        box(970, GROUND_Y, 24, 120, 'wood'),
        box(1070, GROUND_Y, 24, 120, 'stone'),

        // 1층 천장
        box(920, 460, 125, 20, 'wood'),
        box(1020, 460, 125, 20, 'wood'),

        // 2층 목조 감시탑
        box(930, 440, 20, 90, 'wood'),
        box(1010, 440, 20, 90, 'wood'),
        box(970, 350, 110, 18, 'wood'),

        // 사막 오아시스 TNT
        box(970, GROUND_Y, 44, 44, 'tnt')
      ],
      pigs: [
        pig(870, 440, 20, 'normal'),
        pig(1020, GROUND_Y, 22, 'helmet'),
        pig(970, 350, 22, 'normal'),
        pig(1070, 440, 20, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 3: ❄️ 극지방 빙하 설원 (Frozen Tundra & Aurora)
    // 기믹: 눈보라 속 미끄럽고 산산조각 나는 3층 빙하 요새 & 고드름 TNT!
    // =========================================================================
    {
      id: 3,
      theme: 'glacier',
      skyTheme: 'glacier',
      title: 'STAGE 3 : ❄️ 극지방 빙하 설원',
      subtitle: '파랑새 블루(Blues)의 3단 분신과 마틸다의 알 폭탄으로 얼음 왕국을 산산조각 내세요!',
      badge: '설원 / 빙하 유리 성채',
      gravityY: 1.0,
      birds: ['blue', 'white', 'blue', 'yellow'],
      threeStarScore: 35000,
      twoStarScore: 23000,
      blocks: [
        // 빙하 1층 전면 얼음 방벽 (높이 100)
        box(710, GROUND_Y, 22, 100, 'ice'),
        box(710, 480, 22, 80, 'ice'),

        // 중앙 빙하 성채 기둥 4개 (얼음 특화)
        box(790, GROUND_Y, 24, 120, 'ice'),
        box(890, GROUND_Y, 24, 120, 'ice'),
        box(990, GROUND_Y, 24, 120, 'ice'),
        box(1090, GROUND_Y, 24, 120, 'ice'),

        // 빙하 1층 바닥 내부 얼음 TNT 2개
        box(840, GROUND_Y, 44, 44, 'tnt'),
        box(1040, GROUND_Y, 44, 44, 'tnt'),

        // 1층 얼음 슬래브 천장
        box(840, 460, 125, 20, 'ice'),
        box(940, 460, 125, 20, 'ice'),
        box(1040, 460, 125, 20, 'ice'),

        // 2층 기둥
        box(840, 440, 22, 100, 'ice'),
        box(940, 440, 22, 100, 'ice'),
        box(1040, 440, 22, 100, 'ice'),

        // 2층 천장
        box(890, 340, 125, 20, 'ice'),
        box(990, 340, 125, 20, 'ice'),

        // 3층 꼭대기 얼음 샹들리에 탑
        box(940, 320, 20, 80, 'ice'),
        box(940, 240, 80, 18, 'ice'),
        box(940, 222, 42, 42, 'tnt')
      ],
      pigs: [
        pig(790, 440, 21, 'normal'),
        pig(940, GROUND_Y, 23, 'helmet'),
        pig(940, 440, 22, 'normal'),
        pig(1040, 440, 21, 'normal'),
        pig(940, 320, 22, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 4: 🌋 마그마 화산 요새 (Molten Volcano & Magma)
    // 기믹: 타오르는 화산재와 흑요석 돌벽, 5개의 TNT가 일으키는 초대형 연쇄 폭발 체인!
    // =========================================================================
    {
      id: 4,
      theme: 'volcano',
      skyTheme: 'volcano',
      title: 'STAGE 4 : 🌋 마그마 화산 요새',
      subtitle: '폭탄새 밤(Bomb)과 괴력의 테렌스(Terence)로 화산 요새의 TNT 체인을 폭발시키세요!',
      badge: '화산 / 대연쇄 폭발',
      gravityY: 1.0,
      birds: ['black', 'big', 'black', 'white'],
      threeStarScore: 42000,
      twoStarScore: 28000,
      blocks: [
        // 화산 전면 흑요석 방호벽 (높이 140)
        box(720, GROUND_Y, 30, 140, 'stone'),
        box(830, GROUND_Y, 28, 140, 'stone'),
        box(940, GROUND_Y, 28, 140, 'stone'),
        box(1050, GROUND_Y, 28, 140, 'stone'),
        box(1150, GROUND_Y, 30, 140, 'stone'),

        // 1층 사이사이 화약고 TNT 3개!
        box(775, GROUND_Y, 46, 46, 'tnt'),
        box(885, GROUND_Y, 46, 46, 'tnt'),
        box(995, GROUND_Y, 46, 46, 'tnt'),
        box(1100, GROUND_Y, 46, 46, 'tnt'),

        // 1층 무거운 석재 천장
        box(780, 440, 135, 22, 'stone'),
        box(890, 440, 135, 22, 'stone'),
        box(1000, 440, 135, 22, 'stone'),
        box(1100, 440, 135, 22, 'stone'),

        // 2층 벙커 (높이 100)
        box(830, 418, 26, 100, 'stone'),
        box(940, 418, 46, 46, 'tnt'),
        box(1050, 418, 26, 100, 'stone'),

        // 2층 천장
        box(940, 318, 250, 22, 'stone'),

        // 3층 전망대
        box(890, 296, 22, 70, 'wood'),
        box(990, 296, 22, 70, 'wood'),
        box(940, 226, 120, 18, 'stone')
      ],
      pigs: [
        pig(775, 418, 23, 'helmet'),
        pig(885, 418, 24, 'helmet'),
        pig(1000, 418, 24, 'helmet'),
        pig(1100, 418, 23, 'helmet'),
        pig(940, 296, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 5: 👑 달빛의 킹피그 왕궁 (Royal Castle & Full Moon)
    // 기믹: 보름달 아래 웅장한 3층 석조 성채와 최상층 왕좌의 보스 킹피그!
    // =========================================================================
    {
      id: 5,
      theme: 'royal',
      skyTheme: 'royal',
      title: 'STAGE 5 : 👑 달빛의 킹피그 왕궁',
      subtitle: '모든 버드의 스킬을 총동원하여 왕좌에 앉은 거대 보스 킹피그를 함락시키세요!',
      badge: '왕궁 / 보스 킹피그',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'white', 'black', 'big'],
      threeStarScore: 52000,
      twoStarScore: 36000,
      blocks: [
        // 왕궁 전방 해자 방어벽
        box(680, GROUND_Y, 24, 110, 'stone'),
        box(720, GROUND_Y, 44, 44, 'tnt'),

        // 1층 대리석 기둥 4개 (높이 135)
        box(780, GROUND_Y, 28, 135, 'stone'),
        box(890, GROUND_Y, 26, 135, 'wood'),
        box(1000, GROUND_Y, 26, 135, 'wood'),
        box(1110, GROUND_Y, 28, 135, 'stone'),

        // 1층 천장
        box(835, 445, 135, 22, 'stone'),
        box(945, 445, 135, 22, 'wood'),
        box(1055, 445, 135, 22, 'stone'),

        // 2층 기둥 (높이 110)
        box(810, 423, 24, 110, 'stone'),
        box(890, 423, 24, 110, 'ice'),
        box(1000, 423, 24, 110, 'ice'),
        box(1080, 423, 24, 110, 'stone'),

        // 2층 좌우 TNT 상자
        box(850, 423, 42, 42, 'tnt'),
        box(1040, 423, 42, 42, 'tnt'),

        // 2층 천장
        box(850, 313, 110, 22, 'stone'),
        box(945, 313, 140, 22, 'stone'),
        box(1040, 313, 110, 22, 'stone'),

        // 3층 킹피그 왕좌
        box(900, 291, 22, 95, 'wood'),
        box(990, 291, 22, 95, 'wood'),
        box(945, 196, 130, 20, 'stone'),

        // 성채 꼭대기 황금 보물 상자 / 롤링 바위 장식
        boulder(945, 176, 26)
      ],
      pigs: [
        pig(835, GROUND_Y, 23, 'helmet'),
        pig(945, GROUND_Y, 22, 'normal'),
        pig(1055, GROUND_Y, 23, 'helmet'),
        pig(945, 423, 34, 'king'), // 👑 보스 킹피그!
        pig(945, 291, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 6 [신규!]: 🚀 코스믹 우주 기지 (Zero-G Orbital Base)
    // 기믹: 저중력(gravityY: 0.38) 물리! 공중에 떠있는 부유 플랫폼과 우주 요새!
    // =========================================================================
    {
      id: 6,
      theme: 'space',
      skyTheme: 'space',
      title: 'STAGE 6 : 🚀 코스믹 우주 기지',
      subtitle: '무중력 우주 공간! 슬로우모션으로 유영하는 부유 플랫폼 기지를 초토화하세요!',
      badge: '우주 / 저중력(Low-G) 기믹',
      gravityY: 0.38, // 신비로운 저중력 물리!
      birds: ['yellow', 'big', 'white', 'black'],
      threeStarScore: 46000,
      twoStarScore: 32000,
      blocks: [
        // 공중 부유 소행성 플랫폼 1 (좌측 테라스, Y: 430)
        box(760, 430, 160, 26, 'stone', true),
        // 부유 플랫폼 1 위의 기지
        box(710, 404, 20, 85, 'ice'),
        box(810, 404, 20, 85, 'ice'),
        box(760, 319, 120, 20, 'ice'),
        box(760, 299, 42, 42, 'tnt'),

        // 공중 부유 소행성 플랫폼 2 (우측 고지대, Y: 360)
        box(1020, 360, 180, 26, 'stone', true),
        // 부유 플랫폼 2 위의 사령탑
        box(960, 334, 24, 95, 'wood'),
        box(1080, 334, 24, 95, 'wood'),
        box(1020, 239, 145, 22, 'wood'),
        boulder(1020, 217, 26), // 우주 운석 바위

        // 지상 우주 관측소 (X: 890, GROUND_Y)
        box(850, GROUND_Y, 24, 110, 'wood'),
        box(930, GROUND_Y, 24, 110, 'wood'),
        box(890, 470, 110, 20, 'ice'),
        box(890, GROUND_Y, 44, 44, 'tnt')
      ],
      pigs: [
        pig(760, 404, 22, 'normal'), // 부유 기지 1 돼지
        pig(1020, 334, 24, 'helmet'), // 부유 사령탑 헬멧 돼지
        pig(890, 470, 20, 'normal'), // 관측소 옥상 돼지
        pig(890, GROUND_Y, 22, 'normal') // 지상 돼지
      ]
    }
  ];
})();
