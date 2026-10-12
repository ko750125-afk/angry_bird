/**
 * src/levels.js
 * 앵그리버드 PWA - 5단계 스테이지 레벨 디자인 데이터
 * 월드 기준 해상도: 1280 x 720 (지면 Y좌표: 580)
 */

const GROUND_Y = 580;

/**
 * 바닥 기준 좌표(bottomY)로 블록 중심(x, y)을 정확히 계산하는 헬퍼
 */
function box(x, bottomY, w, h, material = 'wood') {
  return {
    x,
    y: bottomY - h / 2,
    w,
    h,
    material // 'wood' | 'ice' | 'stone' | 'tnt'
  };
}

/**
 * 바닥 기준 좌표(bottomY)로 돼지 중심(x, y)을 정확히 계산하는 헬퍼
 */
function pig(x, bottomY, radius = 22, role = 'normal') {
  return {
    x,
    y: bottomY - radius,
    radius,
    role // 'normal' | 'helmet' | 'king'
  };
}

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
  }
};

window.LEVELS = [
  // =========================================================================
  // STAGE 1: 초원 훈련장 (Wood & Ice Cabin)
  // =========================================================================
  {
    id: 1,
    title: 'STAGE 1 : 초원 훈련장',
    subtitle: '새총을 당겨 나무 오두막 안의 초록 돼지들을 물리치세요!',
    skyTheme: 'day',
    birds: ['red', 'red', 'yellow'],
    threeStarScore: 22000,
    twoStarScore: 15000,
    blocks: [
      // 1층 기둥 (높이 110 -> 상단 Y: 470)
      box(780, GROUND_Y, 22, 110, 'wood'),
      box(900, GROUND_Y, 22, 110, 'wood'),
      box(1020, GROUND_Y, 22, 110, 'wood'),

      // 1층 천장 판자 (두께 20 -> 상단 Y: 450)
      box(840, 470, 145, 20, 'wood'),
      box(960, 470, 145, 20, 'wood'),

      // 2층 얼음 기둥 (높이 90 -> 상단 Y: 360)
      box(845, 450, 20, 90, 'ice'),
      box(955, 450, 20, 90, 'ice'),

      // 2층 천장 판자 (두께 20 -> 상단 Y: 340)
      box(900, 360, 140, 20, 'wood'),

      // 지붕 장식 블록
      box(900, 340, 50, 32, 'ice')
    ],
    pigs: [
      pig(840, GROUND_Y, 22, 'normal'),
      pig(960, GROUND_Y, 22, 'normal'),
      pig(900, 450, 24, 'normal')
    ]
  },

  // =========================================================================
  // STAGE 2: 트윈 타워 요새 (Twin Towers)
  // =========================================================================
  {
    id: 2,
    title: 'STAGE 2 : 트윈 타워 요새',
    subtitle: '노랑새 척(Chuck)이 날아갈 때 화면을 터치해 초고속 터보를 발동하세요!',
    skyTheme: 'sunset',
    birds: ['yellow', 'blue', 'red', 'yellow'],
    threeStarScore: 28000,
    twoStarScore: 19000,
    blocks: [
      // 왼쪽 타워 - 1층 (높이 120 -> 상단 460)
      box(730, GROUND_Y, 22, 120, 'wood'),
      box(830, GROUND_Y, 22, 120, 'wood'),
      box(780, 460, 130, 20, 'wood'),
      // 왼쪽 타워 - 2층 (높이 90 -> 상단 350)
      box(740, 440, 20, 90, 'ice'),
      box(820, 440, 20, 90, 'ice'),
      box(780, 350, 110, 18, 'ice'),

      // 오른쪽 타워 - 1층 (높이 120 -> 상단 460)
      box(960, GROUND_Y, 24, 120, 'stone'),
      box(1070, GROUND_Y, 24, 120, 'wood'),
      box(1015, 460, 140, 20, 'wood'),
      // 오른쪽 타워 - 2층 (높이 100 -> 상단 340)
      box(970, 440, 22, 100, 'wood'),
      box(1060, 440, 22, 100, 'wood'),
      box(1015, 340, 120, 20, 'wood')
    ],
    pigs: [
      pig(780, GROUND_Y, 21, 'normal'),
      pig(780, 440, 20, 'normal'),
      pig(1015, GROUND_Y, 24, 'helmet'),
      pig(1015, 440, 21, 'normal')
    ]
  },

  // =========================================================================
  // STAGE 3: 폭발물 화약고 (TNT Bunker)
  // =========================================================================
  {
    id: 3,
    title: 'STAGE 3 : TNT 화약고',
    subtitle: '파랑새 블루(Blues)의 3단 분신으로 얼음 지붕을 깨고 TNT를 유폭시키세요!',
    skyTheme: 'day',
    birds: ['blue', 'yellow', 'red', 'black'],
    threeStarScore: 34000,
    twoStarScore: 24000,
    blocks: [
      // 전면 방어벽
      box(710, GROUND_Y, 24, 90, 'ice'),
      box(710, 490, 24, 70, 'ice'),

      // 중앙 TNT 창고 (높이 110 -> 상단 470)
      box(780, GROUND_Y, 24, 110, 'wood'),
      box(920, GROUND_Y, 24, 110, 'wood'),
      box(1060, GROUND_Y, 24, 110, 'stone'),

      // 내부 TNT 상자들
      box(850, GROUND_Y, 46, 46, 'tnt'),
      box(990, GROUND_Y, 46, 46, 'tnt'),

      // 1층 천장 (두께 20 -> 상단 450)
      box(850, 470, 160, 20, 'ice'),
      box(990, 470, 160, 20, 'wood'),

      // 2층 구조물 (높이 90 -> 상단 360)
      box(800, 450, 20, 90, 'ice'),
      box(920, 450, 20, 90, 'ice'),
      box(1040, 450, 20, 90, 'wood'),

      // 2층 천장 (두께 20 -> 상단 340)
      box(860, 360, 145, 20, 'ice'),
      box(980, 360, 145, 20, 'wood'),

      // 상단 TNT
      box(920, 340, 44, 44, 'tnt')
    ],
    pigs: [
      pig(850, 450, 22, 'normal'),
      pig(990, 450, 24, 'helmet'),
      pig(850, 340, 20, 'normal'),
      pig(990, 340, 20, 'normal')
    ]
  },

  // =========================================================================
  // STAGE 4: 철벽의 성채 (Stone Fortress)
  // =========================================================================
  {
    id: 4,
    title: 'STAGE 4 : 철벽의 성채',
    subtitle: '단단한 석재 요새입니다! 폭탄새 밤(Bomb)을 침투시켜 폭파하세요!',
    skyTheme: 'dusk',
    birds: ['black', 'yellow', 'black', 'red'],
    threeStarScore: 38000,
    twoStarScore: 26000,
    blocks: [
      // 외벽 석재 기둥 (높이 130 -> 상단 450)
      box(740, GROUND_Y, 28, 130, 'stone'),
      box(860, GROUND_Y, 26, 130, 'stone'),
      box(980, GROUND_Y, 26, 130, 'stone'),
      box(1100, GROUND_Y, 28, 130, 'stone'),

      // 1층 석재 슬래브 (두께 22 -> 상단 428)
      box(800, 450, 145, 22, 'stone'),
      box(920, 450, 140, 22, 'wood'),
      box(1040, 450, 145, 22, 'stone'),

      // 2층 중앙 요새 (높이 100 -> 상단 328)
      box(810, 428, 24, 100, 'stone'),
      box(920, 428, 46, 46, 'tnt'),
      box(1030, 428, 24, 100, 'stone'),

      // 2층 지붕 (두께 22 -> 상단 306)
      box(920, 328, 245, 22, 'stone'),

      // 3층 감시탑 (높이 80 -> 상단 226)
      box(880, 306, 20, 80, 'wood'),
      box(960, 306, 20, 80, 'wood'),
      box(920, 226, 110, 18, 'wood')
    ],
    pigs: [
      pig(800, GROUND_Y, 23, 'helmet'),
      pig(920, GROUND_Y, 24, 'helmet'),
      pig(1040, GROUND_Y, 23, 'helmet'),
      pig(920, 306, 22, 'normal')
    ]
  },

  // =========================================================================
  // STAGE 5: 킹피그의 왕궁 (King Pig's Royal Palace)
  // =========================================================================
  {
    id: 5,
    title: 'STAGE 5 : 킹피그의 왕궁 (FINAL BOSS)',
    subtitle: '모든 버드의 능력을 총동원하여 왕관을 쓴 보스 킹피그를 무찌르세요!',
    skyTheme: 'night',
    birds: ['blue', 'yellow', 'black', 'red', 'black'],
    threeStarScore: 48000,
    twoStarScore: 34000,
    blocks: [
      // 전방 얼음 방어벽 + TNT
      box(690, GROUND_Y, 22, 100, 'ice'),
      box(735, GROUND_Y, 44, 44, 'tnt'),

      // 왕궁 1층 기둥 4개 (높이 130 -> 상단 450)
      box(790, GROUND_Y, 26, 130, 'stone'),
      box(900, GROUND_Y, 24, 130, 'wood'),
      box(1010, GROUND_Y, 24, 130, 'wood'),
      box(1120, GROUND_Y, 26, 130, 'stone'),

      // 왕궁 1층 천장 (두께 22 -> 상단 428)
      box(845, 450, 135, 22, 'stone'),
      box(955, 450, 135, 22, 'wood'),
      box(1065, 450, 135, 22, 'stone'),

      // 왕궁 2층 기둥 (높이 110 -> 상단 318)
      box(820, 428, 22, 110, 'ice'),
      box(900, 428, 24, 110, 'stone'),
      box(1010, 428, 24, 110, 'stone'),
      box(1090, 428, 22, 110, 'ice'),

      // 2층 양옆 TNT
      box(860, 428, 42, 42, 'tnt'),
      box(1050, 428, 42, 42, 'tnt'),

      // 왕궁 2층 천장 (두께 22 -> 상단 296)
      box(860, 318, 105, 22, 'ice'),
      box(955, 318, 135, 22, 'stone'),
      box(1050, 318, 105, 22, 'ice'),

      // 왕궁 3층 왕좌 기둥 (높이 90 -> 상단 206)
      box(910, 296, 20, 90, 'wood'),
      box(1000, 296, 20, 90, 'wood'),
      box(955, 206, 120, 20, 'stone')
    ],
    pigs: [
      pig(845, GROUND_Y, 22, 'helmet'),
      pig(955, GROUND_Y, 22, 'normal'),
      pig(1065, GROUND_Y, 22, 'helmet'),
      pig(955, 428, 32, 'king'), // 보스 킹피그!
      pig(955, 296, 20, 'normal')
    ]
  }
];
