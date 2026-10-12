/**
 * src/levels.js
 * 앵그리버드 PWA - 6대 테마별 버라이어티 스테이지 & 다양한 신규 기믹/적 데이터
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
      material, // 'wood' | 'ice' | 'stone' | 'tnt' | 'crystal' | 'steel' | 'spring'
      isStatic
    };
  }

  /**
   * 둥근 돌 바위(boulder) 헬퍼
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
   * 스프링 점프대 기믹 헬퍼
   */
  function spring(x, bottomY, w = 76, h = 24) {
    return {
      shape: 'rectangle',
      x,
      y: bottomY - h / 2,
      w,
      h,
      material: 'spring',
      isStatic: true
    };
  }

  /**
   * 크리스탈/보석 블록 헬퍼
   */
  function crystal(x, bottomY, w, h) {
    return {
      shape: 'rectangle',
      x,
      y: bottomY - h / 2,
      w,
      h,
      material: 'crystal',
      isStatic: false
    };
  }

  /**
   * 단단한 중장비 강철 빔 헬퍼
   */
  function steel(x, bottomY, w, h) {
    return {
      shape: 'rectangle',
      x,
      y: bottomY - h / 2,
      w,
      h,
      material: 'steel',
      isStatic: false
    };
  }

  /**
   * 공중 부유 풍선 헬퍼
   */
  function balloon(x, y, radius = 24) {
    return {
      shape: 'circle',
      x,
      y,
      radius,
      material: 'balloon',
      isStatic: true
    };
  }

  /**
   * 전설의 황금알(Golden Egg) 보너스 타깃 헬퍼
   */
  function goldenEgg(x, y) {
    return {
      shape: 'circle',
      x,
      y,
      radius: 18,
      material: 'golden_egg',
      isStatic: false
    };
  }

  /**
   * 시공간 워프 포털(Portal) 게이트 헬퍼
   */
  function portal(x, y, w = 28, h = 95, portalType = 'portal_in', targetPortalId = 'p_out') {
    return {
      shape: 'rectangle',
      x,
      y,
      w,
      h,
      material: portalType, // 'portal_in' | 'portal_out'
      targetPortalId,
      isStatic: true
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
      role // 'normal' | 'helmet' | 'king' | 'balloon_pig' | 'golem' | 'wizard' | 'astronaut'
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
      skillDesc: '공중 클릭/터치: 3마리로 분신! (얼음 및 크리스탈 보석 파괴 특화)'
    },
    black: {
      name: '밤 (Bomb)',
      color: '#1e293b',
      radius: 24,
      mass: 6.5,
      skillDesc: '공중 클릭/터치: 강력한 대폭발! (돌벽 및 강철 요새 초토화)'
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
   * 6개 차별화 테마 스테이지 목록 (다양한 인터랙티브 기믹 & 신규 적 대거 투입)
   */
  window.LEVELS = [
    // =========================================================================
    // STAGE 1: 🌿 에메랄드 초원 (Green Plains)
    // 기믹: [신규] 탄성 스프링 점프대(Spring) & 상공의 황금알(Golden Egg) 보너스!
    // =========================================================================
    {
      id: 1,
      theme: 'plains',
      skyTheme: 'day',
      title: 'STAGE 1 : 🌿 에메랄드 초원',
      subtitle: '새총 앞 스프링 점프대를 타고 높이 뛰어올라 오두막 꼭대기의 황금알을 노려보세요!',
      badge: '초원 / 스프링 점프대 기믹',
      gravityY: 1.0,
      birds: ['red', 'red', 'yellow'],
      threeStarScore: 26000,
      twoStarScore: 16000,
      blocks: [
        // 🌟 신규 기믹: 전방 스프링 점프대 (낮게 쏘아 밟으면 상공으로 대각선 로켓 점프!)
        spring(540, GROUND_Y, 78, 24),

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
        box(900, 340, 50, 32, 'ice'),

        // 🌟 신규 기믹: 오두막 꼭대기 상공의 전설의 황금알 (+10,000점 대량 득점!)
        goldenEgg(900, 280)
      ],
      pigs: [
        pig(840, GROUND_Y, 22, 'normal'),
        pig(960, GROUND_Y, 22, 'normal'),
        pig(900, 450, 24, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 2: 🏜️ 황혼의 사막 협곡 (Desert Canyon)
    // 기믹: [신규] 상공 부유 풍선 돼지(Balloon Pig) & 롤링 바위 & 단단한 강철 빔!
    // =========================================================================
    {
      id: 2,
      theme: 'desert',
      skyTheme: 'sunset',
      title: 'STAGE 2 : 🏜️ 황혼의 사막 협곡',
      subtitle: '하늘에 떠있는 풍선 돼지를 맞춰 추락시키고, 굴러가는 바위로 요새를 박살내세요!',
      badge: '사막 / 풍선 비행 돼지 & 롤링 바위',
      gravityY: 1.0,
      birds: ['yellow', 'white', 'yellow', 'red'],
      threeStarScore: 34000,
      twoStarScore: 22000,
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
        // 🌟 신규 블록: 단단한 강철 철골 빔
        steel(1070, GROUND_Y, 26, 120),

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
        // 🌟 신규 적: 협곡 상공에 둥둥 떠있는 풍선 비행 돼지! (맞추면 추락!)
        pig(630, 250, 22, 'balloon_pig'),
        pig(870, 440, 20, 'normal'),
        pig(1020, GROUND_Y, 22, 'helmet'),
        pig(970, 350, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 3: ❄️ 극지방 빙하 설원 (Frozen Tundra)
    // 기믹: [신규] 영롱한 크리스탈 보석(Crystal) 블록 & 빙판 점프대!
    // =========================================================================
    {
      id: 3,
      theme: 'glacier',
      skyTheme: 'glacier',
      title: 'STAGE 3 : ❄️ 극지방 빙하 설원',
      subtitle: '파랑새 블루(Blues)의 분신으로 찬란하게 빛나는 크리스탈 보석들을 산산조각 내세요!',
      badge: '설원 / 크리스탈 보석 성채',
      gravityY: 1.0,
      birds: ['blue', 'white', 'blue', 'yellow'],
      threeStarScore: 38000,
      twoStarScore: 25000,
      blocks: [
        // 🌟 신규 기믹: 빙판 스프링 점프대
        spring(630, GROUND_Y, 74, 22),

        // 빙하 1층 전면 얼음 방벽
        box(710, GROUND_Y, 22, 100, 'ice'),
        box(710, 480, 22, 80, 'ice'),

        // 중앙 빙하 성채 기둥 (얼음 & 크리스탈 믹스)
        box(790, GROUND_Y, 24, 120, 'ice'),
        // 🌟 신규 블록: 빛나는 마젠타 크리스탈 기둥 2개! (깨질 때 쨍그랑 폭발)
        crystal(890, GROUND_Y, 24, 120),
        box(990, GROUND_Y, 24, 120, 'ice'),
        crystal(1090, GROUND_Y, 24, 120),

        // 빙하 1층 바닥 내부 얼음 TNT 2개
        box(840, GROUND_Y, 44, 44, 'tnt'),
        box(1040, GROUND_Y, 44, 44, 'tnt'),

        // 1층 얼음 슬래브 천장
        box(840, 460, 125, 20, 'ice'),
        box(940, 460, 125, 20, 'ice'),
        box(1040, 460, 125, 20, 'ice'),

        // 2층 크리스탈 장식 기둥
        crystal(840, 440, 22, 100),
        box(940, 440, 22, 100, 'ice'),
        crystal(1040, 440, 22, 100),

        // 2층 천장
        box(890, 340, 125, 20, 'ice'),
        box(990, 340, 125, 20, 'ice'),

        // 3층 꼭대기 거대 크리스탈 보석 샹들리에
        crystal(940, 320, 80, 22),
        box(940, 298, 42, 42, 'tnt')
      ],
      pigs: [
        pig(790, 440, 21, 'normal'),
        pig(940, GROUND_Y, 23, 'helmet'),
        pig(940, 440, 22, 'normal'),
        pig(1040, 440, 21, 'normal'),
        pig(940, 276, 22, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 4: 🌋 마그마 화산 요새 (Molten Volcano)
    // 기믹: [신규] 돌갑옷 골렘 보스 돼지(Golem Pig) & 강철 철골 & 초대형 TNT 연쇄!
    // =========================================================================
    {
      id: 4,
      theme: 'volcano',
      skyTheme: 'volcano',
      title: 'STAGE 4 : 🌋 마그마 화산 요새',
      subtitle: '테렌스의 괴력과 폭탄새로 암석 갑옷을 입은 거대 골렘 돼지를 격파하세요!',
      badge: '화산 / 보스 골렘 돼지',
      gravityY: 1.0,
      birds: ['black', 'big', 'black', 'white'],
      threeStarScore: 46000,
      twoStarScore: 30000,
      blocks: [
        // 화산 전면 흑요석 및 강철 복합 방호벽
        steel(720, GROUND_Y, 28, 140),
        box(830, GROUND_Y, 28, 140, 'stone'),
        steel(940, GROUND_Y, 28, 140),
        box(1050, GROUND_Y, 28, 140, 'stone'),
        steel(1150, GROUND_Y, 28, 140),

        // 1층 사이사이 화약고 TNT 4개!
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

        // 3층 전망탑
        box(890, 296, 22, 70, 'wood'),
        box(990, 296, 22, 70, 'wood'),
        box(940, 226, 120, 18, 'stone')
      ],
      pigs: [
        pig(775, 418, 23, 'helmet'),
        // 🌟 신규 보스 적: 육중한 암석 투구와 높은 체력을 지닌 거대 골렘 돼지!
        pig(940, 418, 32, 'golem'),
        pig(1100, 418, 23, 'helmet'),
        pig(940, 296, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 5: 👑 달빛의 킹피그 왕궁 (Royal Castle)
    // 기믹: [신규] 마법사 돼지(Wizard) & 공성전 스프링 & 보스 킹피그 & 숨겨진 황금알!
    // =========================================================================
    {
      id: 5,
      theme: 'royal',
      skyTheme: 'royal',
      title: 'STAGE 5 : 👑 달빛의 킹피그 왕궁',
      subtitle: '공성 스프링을 타고 성벽을 뛰어넘어 마법사 돼지와 최상층 킹피그를 소탕하세요!',
      badge: '왕궁 / 마법사 돼지 & 킹피그',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'white', 'black', 'big'],
      threeStarScore: 56000,
      twoStarScore: 38000,
      blocks: [
        // 🌟 신규 기믹: 성문 앞 거대 공성 스프링 점프대! (성벽을 한 번에 뛰어넘는 궤적)
        spring(580, GROUND_Y, 84, 24),

        // 왕궁 전방 해자 방어벽
        box(680, GROUND_Y, 24, 110, 'stone'),
        box(720, GROUND_Y, 44, 44, 'tnt'),

        // 1층 대리석 기둥 4개 (높이 135)
        box(780, GROUND_Y, 28, 135, 'stone'),
        box(890, GROUND_Y, 26, 135, 'wood'),
        box(1000, GROUND_Y, 26, 135, 'wood'),
        steel(1110, GROUND_Y, 28, 135),

        // 1층 천장
        box(835, 445, 135, 22, 'stone'),
        box(945, 445, 135, 22, 'wood'),
        box(1055, 445, 135, 22, 'stone'),

        // 2층 기둥 (높이 110)
        box(810, 423, 24, 110, 'stone'),
        crystal(890, 423, 24, 110),
        crystal(1000, 423, 24, 110),
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

        // 🌟 신규 기믹: 왕좌 뒤편 비밀 황금알 보물!
        goldenEgg(945, 140),

        // 성채 꼭대기 롤링 바위 장식
        boulder(945, 176, 26)
      ],
      pigs: [
        pig(835, GROUND_Y, 23, 'helmet'),
        // 🌟 신규 적: 보라색 마법 모자를 쓰고 신비한 오라를 뿜는 마법사 돼지!
        pig(890, 423, 23, 'wizard'),
        pig(1055, GROUND_Y, 23, 'helmet'),
        pig(945, 423, 34, 'king'), // 👑 보스 킹피그!
        pig(945, 291, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 6 : 🚀 코스믹 우주 기지 (Zero-G Orbital Base)
    // 기믹: [신규] 시공간 워프 포털(Portal In/Out) & 우주비행사 돼지 & 저중력 물리!
    // =========================================================================
    {
      id: 6,
      theme: 'space',
      skyTheme: 'space',
      title: 'STAGE 6 : 🚀 코스믹 우주 기지',
      subtitle: '파란 포털로 새를 쏘아 주황 포털로 순간이동! 무중력 우주비행사 돼지들을 격파하세요!',
      badge: '우주 / 워프 포털 & 우주비행사',
      gravityY: 0.38, // 신비로운 저중력 물리!
      birds: ['yellow', 'big', 'white', 'black'],
      threeStarScore: 50000,
      twoStarScore: 34000,
      blocks: [
        // 🌟 신규 기믹: 워프 포털 게이트 쌍!
        // 1. 입구 포털 (공중 앞쪽, Y: 360) - 파란색 네온 에너지 소용돌이
        portal(470, 360, 28, 95, 'portal_in', 'p_out'),
        // 2. 출구 포털 (우측 고지대 위쪽, Y: 180) - 주황색 네온 에너지 소용돌이
        portal(940, 180, 28, 95, 'portal_out', 'p_in'),

        // 공중 부유 소행성 플랫폼 1 (좌측 테라스, Y: 430)
        box(760, 430, 160, 26, 'stone', true),
        // 부유 플랫폼 1 위의 기지 (우주 크리스탈)
        crystal(710, 404, 22, 85),
        crystal(810, 404, 22, 85),
        box(760, 319, 120, 20, 'ice'),
        box(760, 299, 42, 42, 'tnt'),

        // 공중 부유 소행성 플랫폼 2 (우측 고지대, Y: 360)
        box(1030, 360, 180, 26, 'stone', true),
        // 부유 플랫폼 2 위의 사령탑
        steel(970, 334, 24, 95),
        steel(1090, 334, 24, 95),
        box(1030, 239, 145, 22, 'wood'),
        boulder(1030, 217, 26), // 우주 운석 바위

        // 지상 우주 관측소 (X: 890, GROUND_Y)
        box(850, GROUND_Y, 24, 110, 'wood'),
        box(930, GROUND_Y, 24, 110, 'wood'),
        box(890, 470, 110, 20, 'ice'),
        box(890, GROUND_Y, 44, 44, 'tnt')
      ],
      pigs: [
        // 🌟 신규 적: 우주복 헬멧과 산소통을 착용한 우주비행사 돼지들!
        pig(760, 404, 22, 'astronaut'),
        pig(1030, 334, 25, 'astronaut'),
        pig(890, 470, 20, 'normal'),
        pig(890, GROUND_Y, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 7 : 🌲 신비의 고대 버섯 숲 (Mystic Mushroom Forest)
    // 기믹: [신규] 2단 가속 스프링 점프대 & 상공 부유 풍선 돼지 & 버섯 거목 요새
    // =========================================================================
    {
      id: 7,
      theme: 'forest',
      skyTheme: 'forest',
      title: 'STAGE 7 : 🌲 신비의 고대 버섯 숲',
      subtitle: '새총 앞 2단 스프링으로 높이 솟구쳐, 공중 부유 풍선 돼지와 거목 위의 황금알을 공략하세요!',
      badge: '고대 숲 / 2단 스프링 & 비행 돼지',
      gravityY: 1.0,
      birds: ['red', 'yellow', 'blue', 'white'],
      threeStarScore: 48000,
      twoStarScore: 32000,
      blocks: [
        // 🌟 신규 기믹: 2단 연속 스프링 점프대!
        spring(520, GROUND_Y, 78, 24),
        spring(710, GROUND_Y, 78, 24),

        // 거목 1층 밑동 (높이 120)
        box(840, GROUND_Y, 24, 120, 'wood'),
        crystal(940, GROUND_Y, 24, 120),
        box(1040, GROUND_Y, 24, 120, 'wood'),

        // 1층 중앙 화약고 TNT
        box(940, GROUND_Y, 44, 44, 'tnt'),

        // 1층 천장 판자
        box(890, 460, 130, 20, 'wood'),
        box(990, 460, 130, 20, 'wood'),

        // 2층 버섯 기둥 (높이 95)
        box(880, 440, 20, 95, 'wood'),
        box(1000, 440, 20, 95, 'wood'),

        // 2층 지붕 얼음 슬래브
        box(940, 365, 160, 22, 'ice'),

        // 3층 크리스탈 버섯 갓 & 롤링 바위
        crystal(940, 343, 90, 24),
        boulder(940, 319, 26),

        // 🌟 상공의 전설의 황금알
        goldenEgg(940, 240)
      ],
      pigs: [
        // 상공 비행 풍선 돼지 2마리
        pig(620, 240, 22, 'balloon_pig'),
        pig(800, 180, 22, 'balloon_pig'),
        pig(890, GROUND_Y, 23, 'helmet'),
        pig(990, GROUND_Y, 21, 'normal'),
        pig(940, 440, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 8 : 🏴‍☠️ 카리브 해적 요새 (Pirate Cove)
    // 기믹: [신규] 롤링 대포알 바위 2연발 & 화약고 연쇄 폭발 & 해적 골렘 보스
    // =========================================================================
    {
      id: 8,
      theme: 'pirate',
      skyTheme: 'pirate',
      title: 'STAGE 8 : 🏴‍☠️ 카리브 해적 요새',
      subtitle: '해적선 망루 지지대를 무너뜨려 굴러떨어지는 거대 대포알로 요새를 수장시키세요!',
      badge: '해적 요새 / 롤링 대포알 & 해적 골렘',
      gravityY: 1.0,
      birds: ['yellow', 'black', 'black', 'big'],
      threeStarScore: 52000,
      twoStarScore: 35000,
      blocks: [
        // 전방 망루 (Static)
        box(690, GROUND_Y, 80, 170, 'stone', true),
        box(690, 410, 110, 22, 'stone', true),

        // 망루 위 대포알 바위 굴리기 장치
        box(730, 388, 16, 50, 'wood'),
        boulder(690, 388, 30),

        // 해적 요새 본관 1층 (높이 130)
        steel(830, GROUND_Y, 26, 130),
        box(930, GROUND_Y, 24, 130, 'wood'),
        box(1030, GROUND_Y, 24, 130, 'wood'),
        steel(1130, GROUND_Y, 26, 130),

        // 해적 화약고 TNT 3연속
        box(880, GROUND_Y, 44, 44, 'tnt'),
        box(980, GROUND_Y, 44, 44, 'tnt'),
        box(1080, GROUND_Y, 44, 44, 'tnt'),

        // 1층 상판
        box(880, 450, 130, 22, 'wood'),
        box(980, 450, 130, 22, 'wood'),
        box(1080, 450, 130, 22, 'wood'),

        // 2층 해적 선장실
        steel(910, 428, 24, 100),
        steel(1050, 428, 24, 100),
        box(980, 328, 170, 22, 'stone'),

        // 2층 지붕 위 2번째 롤링 바위
        boulder(980, 306, 26),

        // 황금알 보물
        goldenEgg(980, 250)
      ],
      pigs: [
        pig(690, 410, 20, 'normal'),
        pig(980, 428, 32, 'golem'), // 해적 선장 골렘
        pig(880, 428, 23, 'helmet'),
        pig(1080, 428, 23, 'helmet'),
        pig(980, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 9 : ⚡ 사이버 네온 메트로폴리스 (Cyberpunk Neon City)
    // 기믹: [신규] 네온 워프 포털 게이트 & 사이버 마법사 돼지 & 초고층 마천루
    // =========================================================================
    {
      id: 9,
      theme: 'neon',
      skyTheme: 'neon',
      title: 'STAGE 9 : ⚡ 사이버 네온 메트로폴리스',
      subtitle: '네온 포털 게이트로 요새 내부를 기습하여 사이버 마법사 돼지와 방탄 요새를 분쇄하세요!',
      badge: '네온 시티 / 워프 포털 저격 & 마법사',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'white', 'big', 'black'],
      threeStarScore: 58000,
      twoStarScore: 40000,
      blocks: [
        // 🌟 네온 워프 포털 쌍
        portal(500, 380, 28, 95, 'portal_in', 'p_out'),
        portal(1060, 220, 28, 95, 'portal_out', 'p_in'),

        // 가속 스프링
        spring(600, GROUND_Y, 78, 24),

        // 타워 1 (X: 740 ~ 880)
        steel(760, GROUND_Y, 26, 140),
        crystal(860, GROUND_Y, 26, 140),
        box(810, GROUND_Y, 44, 44, 'tnt'),
        box(810, 440, 130, 22, 'steel'),
        crystal(810, 418, 24, 110),
        box(810, 308, 110, 20, 'crystal'),

        // 타워 2 (X: 920 ~ 1160)
        steel(950, GROUND_Y, 28, 140),
        steel(1070, GROUND_Y, 28, 140),
        box(1150, GROUND_Y, 26, 140, 'stone'),
        box(1010, 440, 140, 22, 'steel'),
        box(1110, 440, 140, 22, 'stone'),

        // 2층 서버룸
        crystal(970, 418, 24, 110),
        steel(1090, 418, 24, 110),
        box(1030, 308, 150, 22, 'steel'),

        // 3층 사령탑
        crystal(1030, 286, 22, 90),
        box(1030, 196, 110, 20, 'ice'),

        // 옥상 황금알
        goldenEgg(1030, 150)
      ],
      pigs: [
        pig(810, 308, 23, 'astronaut'),
        pig(1030, 418, 24, 'wizard'), // 사이버 마법사
        pig(1010, GROUND_Y, 23, 'helmet'),
        pig(1110, GROUND_Y, 23, 'helmet'),
        pig(1030, 196, 21, 'normal'),
        pig(810, 440, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 10 : 🏰 최후의 결전: 천공의 킹피그 공중 요새 (Final Sky Citadel)
    // 기믹: [대단원] 6종 정예 버드 총출동 & 킹피그+골렘+마법사+비행돼지 보스 총집결!
    // =========================================================================
    {
      id: 10,
      theme: 'citadel',
      skyTheme: 'citadel',
      title: 'STAGE 10 : 🏰 최후의 결전: 킹피그 공중 요새',
      subtitle: '대망의 최종 스테이지! 6종 정예 버드 총출동! 킹피그, 골렘, 마법사가 이끄는 최후의 공중 요새를 함락시키세요!',
      badge: '최종 결전 / 전설의 버드 총출동 & 보스 연합',
      gravityY: 0.9,
      birds: ['red', 'yellow', 'blue', 'black', 'white', 'big'],
      threeStarScore: 72000,
      twoStarScore: 50000,
      blocks: [
        // 공성 스프링 & 워프 포털
        spring(550, GROUND_Y, 86, 24),
        portal(650, 340, 28, 95, 'portal_in', 'p_out'),
        portal(980, 150, 28, 95, 'portal_out', 'p_in'),

        // 1층 방호벽 (X: 760 ~ 1180)
        steel(760, GROUND_Y, 28, 140),
        box(870, GROUND_Y, 28, 140, 'stone'),
        steel(980, GROUND_Y, 28, 140),
        box(1090, GROUND_Y, 28, 140, 'stone'),
        steel(1180, GROUND_Y, 28, 140),

        // 1층 무기고 TNT 4연발
        box(815, GROUND_Y, 44, 44, 'tnt'),
        box(925, GROUND_Y, 44, 44, 'tnt'),
        box(1035, GROUND_Y, 44, 44, 'tnt'),
        box(1135, GROUND_Y, 44, 44, 'tnt'),

        // 1층 천장 슬래브
        box(815, 440, 135, 22, 'stone'),
        box(925, 440, 135, 22, 'steel'),
        box(1035, 440, 135, 22, 'stone'),
        box(1135, 440, 135, 22, 'steel'),

        // 2층 요새 기둥 & 대형 TNT
        steel(820, 418, 26, 120),
        crystal(925, 418, 26, 120),
        box(980, 418, 48, 48, 'tnt'),
        crystal(1035, 418, 26, 120),
        steel(1140, 418, 26, 120),

        // 2층 천장
        box(870, 298, 130, 22, 'stone'),
        box(980, 298, 150, 24, 'stone'),
        box(1090, 298, 130, 22, 'stone'),

        // 3층 킹피그 왕좌 & 신전
        crystal(930, 274, 22, 95),
        crystal(1030, 274, 22, 95),
        box(980, 179, 140, 22, 'stone'),

        // 왕좌 위 롤링 바위 & 황금알
        boulder(980, 157, 28),
        goldenEgg(980, 95)
      ],
      pigs: [
        pig(680, 190, 22, 'balloon_pig'), // 공중 정찰대
        pig(925, GROUND_Y, 32, 'golem'), // 1층 요새 수문장 골렘
        pig(870, 418, 23, 'wizard'), // 2층 마법사
        pig(1090, 418, 24, 'helmet'), // 2층 헬멧
        pig(980, 274, 36, 'king'), // 👑 3층 최종 보스 킹피그!
        pig(815, GROUND_Y, 22, 'helmet'),
        pig(1135, GROUND_Y, 22, 'helmet')
      ]
    }
  ];
})();
