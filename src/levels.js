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

      ]
    },

    // =========================================================================
    // STAGE 11 : ⚖️ 흔들리는 공중 시소 & 지렛대 (The Sky Seesaw)
    // 기믹: [신규 패턴] 지렛대 원리 시소 빔 & 한쪽 타격 시 반대편 연쇄 붕괴
    // =========================================================================
    {
      id: 11,
      theme: 'steampunk',
      skyTheme: 'steampunk',
      title: 'STAGE 11 : ⚖️ 흔들리는 공중 시소 & 지렛대',
      subtitle: '지렛대의 원리! 시소 왼쪽의 바위/TNT를 쳐서 반대편 요새를 공중으로 솟구치게 만드세요!',
      badge: '시소 기믹 / 지렛대 물리 퍼즐',
      gravityY: 1.0,
      birds: ['red', 'yellow', 'white'],
      threeStarScore: 42000,
      twoStarScore: 28000,
      blocks: [
        // 중앙 받침점 피벗 (Fulcrum)
        box(880, GROUND_Y, 44, 150, 'stone', true),

        // 🌟 시작 시 자멸 방지: 좌우 끝단 안전 버팀목 (타격 시에만 부서지며 시소 작동!)
        box(740, GROUND_Y, 32, 150, 'wood'),
        box(1020, GROUND_Y, 32, 150, 'wood'),

        // 시소 메인 가로 빔 (길이 340)
        box(880, 430, 340, 22, 'wood'),

        // 왼쪽 날개 (X: 740): 대형 롤링 바위 & TNT
        boulder(740, 408, 28),
        box(740, 408 - 56, 44, 44, 'tnt'),

        // 오른쪽 날개 (X: 980 ~ 1040): 취약한 얼음 & 크리스탈 탑
        box(960, 408, 22, 90, 'ice'),
        crystal(1040, 408, 22, 90),
        box(1000, 318, 110, 20, 'ice'),

        // 시소 꼭대기 전설의 황금알
        goldenEgg(880, 290)
      ],
      pigs: [
        pig(960, 408, 22, 'normal'),
        pig(1040, 408, 23, 'helmet'),
        pig(1000, 318, 22, 'normal'),
        pig(880, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 12 : 🎳 볼링 스트라이크 롱 슬로프 (Bowling Alley Slope)
    // 기믹: [신규 패턴] 초고공 경사로 & 롤링 바위 가속 슬라이드로 볼링 핀 대폭격!
    // =========================================================================
    {
      id: 12,
      theme: 'retro',
      skyTheme: 'retro',
      title: 'STAGE 12 : 🎳 볼링 스트라이크 롱 슬로프',
      subtitle: '경사로 꼭대기의 지지대를 건드려 굴러떨어지는 볼링 바위로 볼링 핀 돼지들을 올 스트라이크!',
      badge: '슬로프 기믹 / 롤링 볼링 스트라이크',
      gravityY: 1.0,
      birds: ['yellow', 'blue', 'black'],
      threeStarScore: 50000,
      twoStarScore: 34000,
      blocks: [
        // 비스듬히 연결된 3단 내리막 경사로 (Static 램프)
        box(520, 290, 110, 20, 'stone', true),
        box(630, 370, 120, 20, 'stone', true),
        box(750, 450, 130, 20, 'stone', true),
        box(870, 530, 130, 20, 'stone', true),

        // 🌟 시작 시 자연 굴러떨어짐 방지: 튼튼한 목조 정지목 (Stopper)
        box(560, 270, 28, 55, 'wood'),
        boulder(490, 270, 28),
        boulder(430, 270, 26),

        // 지상 볼링 핀 대열 (X: 960, 1040, 1120)
        box(960, GROUND_Y, 20, 90, 'ice'),
        box(1040, GROUND_Y, 20, 90, 'ice'),
        box(1120, GROUND_Y, 20, 90, 'ice'),
        box(1040, 490, 100, 20, 'wood'),
        box(1040, GROUND_Y, 44, 44, 'tnt')
      ],
      pigs: [
        pig(960, GROUND_Y, 22, 'normal'),
        pig(1040, 470, 22, 'normal'),
        pig(1120, GROUND_Y, 24, 'helmet'),
        pig(1000, 490, 21, 'normal'),
        pig(1080, 490, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 13 : 🛸 반중력 인버전 업워드 (Gravity Inversion Loop)
    // 기믹: [신규 패턴] 초저중력 & 바닥 스프링으로 상공 부유 우주선을 아래에서 위로 타격!
    // =========================================================================
    {
      id: 13,
      theme: 'space',
      skyTheme: 'space',
      title: 'STAGE 13 : 🛸 반중력 인버전 업워드',
      subtitle: '초저중력 공간! 바닥의 스프링 점프대로 새를 쏘아올려 상공에 떠 있는 우주 캡슐들을 관통하세요!',
      badge: '저중력 기믹 / 상향 인버전 궤적',
      gravityY: 0.28,
      birds: ['blue', 'yellow', 'white', 'big'],
      threeStarScore: 54000,
      twoStarScore: 36000,
      blocks: [
        // 바닥 듀얼 점프대 스프링
        spring(520, GROUND_Y, 86, 24),
        spring(720, GROUND_Y, 86, 24),

        // 상공 부유 캡슐 1 (X: 740, Y: 260)
        crystal(700, 260, 22, 80),
        crystal(780, 260, 22, 80),
        box(740, 180, 100, 18, 'ice'),
        box(740, 162, 40, 40, 'tnt'),

        // 상공 부유 캡슐 2 (X: 980, Y: 220)
        steel(930, 220, 24, 90),
        steel(1030, 220, 24, 90),
        box(980, 130, 120, 20, 'steel'),

        // 상공 꼭대기 황금알
        goldenEgg(980, 80),

        // 지상 레이더 기지 (X: 860)
        box(860, GROUND_Y, 24, 100, 'wood'),
        box(860, GROUND_Y - 100, 44, 44, 'tnt')
      ],
      pigs: [
        pig(740, 260, 23, 'astronaut'),
        pig(980, 220, 24, 'astronaut'),
        pig(980, 130, 23, 'astronaut'),
        pig(860, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 14 : 🪓 아슬아슬 젠가 스파이어 (The Jenga Spire)
    // 기믹: [신규 패턴] 400px 초고층 젠가 탑 & 중심부 핵심 취약 블록 스나이핑
    // =========================================================================
    {
      id: 14,
      theme: 'ruins',
      skyTheme: 'ruins',
      title: 'STAGE 14 : 🪓 아슬아슬 젠가 스파이어',
      subtitle: '아슬아슬하게 균형을 잡고 있는 젠가 탑! 중심부의 취약 블록을 척의 돌진으로 쏙 빼내 전복시키세요!',
      badge: '젠가 타워 / 정밀 스나이핑',
      gravityY: 1.0,
      birds: ['yellow', 'red', 'black'],
      threeStarScore: 48000,
      twoStarScore: 33000,
      blocks: [
        // 🌟 젠가 하부 기초 슬래브 (Static 고정으로 스폰 직후 흔들림 원천 차단)
        box(860, GROUND_Y, 150, 24, 'stone', true),

        // 1단 기단 (X: 860)
        box(820, 556, 26, 80, 'stone'),
        box(900, 556, 26, 80, 'stone'),
        box(860, 476, 120, 20, 'stone'),

        // 2단 젠가 (취약한 유리/얼음)
        box(860, 470, 24, 80, 'ice'),
        box(860, 390, 120, 20, 'wood'),

        // 3단 젠가 (핵심 타깃 TNT & 목조)
        box(830, 370, 20, 70, 'wood'),
        box(860, 370, 36, 36, 'tnt'),
        box(890, 370, 20, 70, 'wood'),
        box(860, 300, 110, 20, 'wood'),

        // 4단 젠가 탑 꼭대기
        box(860, 280, 22, 70, 'ice'),
        box(860, 210, 80, 18, 'ice'),

        // 최상단 황금알
        goldenEgg(860, 170)
      ],
      pigs: [
        pig(860, GROUND_Y, 23, 'helmet'),
        pig(860, 470, 22, 'normal'),
        pig(860, 370, 22, 'normal'),
        pig(860, 210, 23, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 15 : 🏝️ 군도 징검다리 3연속 붕괴 (Stepping Stones Moat)
    // 기믹: [신규 패턴] 3연속 계단식 공중 섬 & 파편 낙하에 의한 도미노 격파
    // =========================================================================
    {
      id: 15,
      theme: 'islands',
      skyTheme: 'islands',
      title: 'STAGE 15 : 🏝️ 군도 징검다리 3연속 붕괴',
      subtitle: '공중에 떠 있는 3개의 징검다리 섬! 첫 번째 섬을 무너뜨려 다음 섬으로 연쇄 폭발을 일으키세요!',
      badge: '군도 기믹 / 3단 연쇄 도미노',
      gravityY: 1.0,
      birds: ['black', 'white', 'big', 'yellow'],
      threeStarScore: 56000,
      twoStarScore: 38000,
      blocks: [
        // 섬 1 (X: 680, Y: 460)
        box(680, 460, 130, 24, 'stone', true),
        box(680, 436, 44, 44, 'tnt'),
        boulder(650, 436, 26),

        // 섬 2 (X: 900, Y: 360)
        box(900, 360, 140, 24, 'stone', true),
        crystal(870, 336, 22, 80),
        crystal(930, 336, 22, 80),
        box(900, 256, 100, 18, 'wood'),
        box(900, 336, 42, 42, 'tnt'),

        // 섬 3 (X: 1120, Y: 260)
        box(1120, 260, 140, 24, 'stone', true),
        steel(1090, 236, 24, 90),
        steel(1150, 236, 24, 90),
        box(1120, 146, 110, 20, 'steel'),
        goldenEgg(1120, 105),

        // 지상 잔해 구역 (X: 900)
        box(900, GROUND_Y, 24, 110, 'wood')
      ],
      pigs: [
        pig(680, 436, 22, 'normal'),
        pig(900, 336, 23, 'helmet'),
        pig(1120, 236, 32, 'golem'), // 3번 섬의 섬주 골렘
        pig(900, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 16 : 💥 언더그라운드 딥 벙커 (Deep Underground Bunker)
    // 기믹: [신규 패턴] 지상 철통 지붕 & 좁은 얼음 천창 관통 벙커 버스터
    // =========================================================================
    {
      id: 16,
      theme: 'mine',
      skyTheme: 'mine',
      title: 'STAGE 16 : 💥 언더그라운드 딥 벙커',
      subtitle: '지상은 두꺼운 철판으로 밀폐된 벙커! 좁은 천창 구멍을 마틸다의 알 폭탄으로 저격 폭파하세요!',
      badge: '지하 벙커 / 벙커 버스터 관통',
      gravityY: 1.0,
      birds: ['white', 'black', 'white', 'red'],
      threeStarScore: 52000,
      twoStarScore: 35000,
      blocks: [
        // 벙커 좌우 두꺼운 철골 벽 (높이 160)
        steel(740, GROUND_Y, 30, 160),
        steel(1140, GROUND_Y, 30, 160),

        // 벙커 지상 강철 방패 지붕 (X: 740 ~ 1140, 중앙에 얼음 환기창)
        steel(830, 420, 150, 24),
        box(940, 420, 70, 22, 'ice'), // 🌟 관통해야 할 좁은 얼음 천창!
        steel(1050, 420, 150, 24),

        // 지하 벙커 내부 무기고 TNT 4개
        box(820, GROUND_Y, 44, 44, 'tnt'),
        box(900, GROUND_Y, 44, 44, 'tnt'),
        box(980, GROUND_Y, 44, 44, 'tnt'),
        box(1060, GROUND_Y, 44, 44, 'tnt'),

        // 지하 지지 기둥
        box(880, GROUND_Y, 22, 110, 'wood'),
        box(1000, GROUND_Y, 22, 110, 'wood'),

        // 지붕 위 위장 감시초소
        box(940, 398, 20, 60, 'wood'),
        goldenEgg(940, 310)
      ],
      pigs: [
        pig(820, GROUND_Y, 23, 'helmet'),
        pig(940, GROUND_Y, 24, 'wizard'), // 지하 벙커 마법사
        pig(1060, GROUND_Y, 23, 'helmet'),
        pig(940, 398, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 17 : 🎪 서커스 3단 트램펄린 핑퐁 (Circus Pinball Bounce)
    // 기믹: [신규 패턴] 지면 3단 연속 스프링 점프대 & 핑퐁 궤적으로 전면 방벽 후방 강타
    // =========================================================================
    {
      id: 17,
      theme: 'carnival',
      skyTheme: 'carnival',
      title: 'STAGE 17 : 🎪 서커스 3단 트램펄린 핑퐁',
      subtitle: '연속으로 깔린 3개의 서커스 스프링을 퐁당퐁당 타고 날아가 전면 방패벽 너머의 적을 타격하세요!',
      badge: '트램펄린 / 3단 핑퐁 바운스',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'blue', 'white'],
      threeStarScore: 49000,
      twoStarScore: 33000,
      blocks: [
        // 서커스 3단 트램펄린 스프링
        spring(480, GROUND_Y, 76, 24),
        spring(640, GROUND_Y, 76, 24),
        spring(800, GROUND_Y, 76, 24),

        // 요새 전면 거대 철벽 방패 (정면 차단)
        box(920, GROUND_Y, 28, 170, 'stone', true),
        steel(920, 410, 28, 90),

        // 후방 서커스 텐트 구조물 (X: 1020 ~ 1160)
        box(1020, GROUND_Y, 24, 120, 'wood'),
        crystal(1120, GROUND_Y, 24, 120),
        box(1070, 460, 130, 20, 'wood'),

        // 2층 텐트 지붕 & TNT
        box(1070, 440, 44, 44, 'tnt'),
        crystal(1070, 396, 90, 22),
        boulder(1070, 374, 26),

        // 황금알
        goldenEgg(1070, 300)
      ],
      pigs: [
        pig(640, 260, 22, 'balloon_pig'), // 서커스 공중 풍선 돼지
        pig(980, GROUND_Y, 22, 'normal'),
        pig(1070, GROUND_Y, 23, 'helmet'),
        pig(1070, 440, 22, 'normal'),
        pig(1140, 440, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 18 : 🧬 트윈 트위스트 나선 탑 (Twin Twist Helix)
    // 기믹: [신규 패턴] X자 교차 연결 빔 & 한쪽 파괴 시 비틀림 응력 양방향 동시 붕괴
    // =========================================================================
    {
      id: 18,
      theme: 'cyber',
      skyTheme: 'cyber',
      title: 'STAGE 18 : 🧬 트윈 트위스트 나선 탑',
      subtitle: 'X자형 가로 빔으로 얽혀있는 트윈 타워! 연결 고리를 끊어 비틀림 응력으로 두 탑을 동시에 붕괴시키세요!',
      badge: '나선 타워 / 비틀림 응력 붕괴',
      gravityY: 1.0,
      birds: ['blue', 'big', 'yellow', 'black'],
      threeStarScore: 58000,
      twoStarScore: 39000,
      blocks: [
        // 탑 A (좌측, X: 760): 1층 기둥 & 슬래브
        crystal(740, GROUND_Y, 24, 130),
        box(780, GROUND_Y, 24, 130, 'ice'),
        box(760, 450, 90, 20, 'crystal'),

        // 탑 B (우측, X: 1040): 1층 기둥 & 슬래브
        box(1020, GROUND_Y, 24, 130, 'wood'),
        steel(1060, GROUND_Y, 24, 130),
        box(1040, 450, 90, 20, 'steel'),

        // 두 탑을 잇는 거대 X자 교차 연결 빔 (길이 310)
        box(900, 420, 310, 18, 'wood'),
        box(900, 320, 310, 18, 'wood'),

        // 중앙 연결부 공중 TNT & 황금알
        box(900, 400, 42, 42, 'tnt'),
        goldenEgg(900, 260),

        // 탑 A 2층
        crystal(760, 430, 22, 100),
        box(760, 330, 80, 18, 'ice'),

        // 탑 B 2층
        steel(1040, 430, 22, 100),
        box(1040, 330, 80, 18, 'steel')
      ],
      pigs: [
        pig(760, GROUND_Y, 23, 'helmet'),
        pig(760, 430, 22, 'normal'),
        pig(1040, GROUND_Y, 23, 'helmet'),
        pig(1040, 430, 22, 'normal'),
        pig(900, 290, 24, 'wizard') // 나선 탑 중앙 사이버 마법사
      ]
    },

    // =========================================================================
    // STAGE 19 : 🛡️ 철갑 거북선 돔 & 백어택 (Armored Turtle Dome)
    // 기믹: [신규 패턴] 전면 3중 철벽 방패 & 후방 워프 포털을 통한 역방향 백어택
    // =========================================================================
    {
      id: 19,
      theme: 'fortress',
      skyTheme: 'fortress',
      title: 'STAGE 19 : 🛡️ 철갑 거북선 돔 & 백어택',
      subtitle: '정면은 3중 강철 돔으로 무적! 전방의 워프 포털을 타고 돔 뒤편으로 돌아 들어가 배후를 찌르세요!',
      badge: '철갑 돔 / 포털 백어택 기습',
      gravityY: 1.0,
      birds: ['yellow', 'black', 'white', 'big'],
      threeStarScore: 64000,
      twoStarScore: 43000,
      blocks: [
        // 워프 포털 쌍 (앞쪽 입구 -> 돔 뒤쪽 상공 출구)
        portal(520, 320, 28, 95, 'portal_in', 'p_out'),
        portal(1120, 220, 28, 95, 'portal_out', 'p_in'),

        // 전면 무적 3중 강철 아치 (X: 720 ~ 840)
        steel(740, GROUND_Y, 32, 160),
        box(780, GROUND_Y, 30, 160, 'stone', true),
        steel(820, GROUND_Y, 32, 160),
        steel(780, 420, 130, 26),

        // 내부 돔 본진 (X: 880 ~ 1060)
        box(890, GROUND_Y, 24, 120, 'wood'),
        box(970, GROUND_Y, 24, 120, 'wood'),
        box(1050, GROUND_Y, 24, 120, 'wood'),

        // 내부 화약고 TNT 3연속
        box(930, GROUND_Y, 44, 44, 'tnt'),
        box(1010, GROUND_Y, 44, 44, 'tnt'),

        // 돔 상판 및 후방 롤링 바위
        box(970, 460, 190, 22, 'stone'),
        boulder(970, 438, 28),

        // 돔 내부 비밀 황금알
        goldenEgg(890, 320)
      ],
      pigs: [
        pig(890, GROUND_Y, 23, 'helmet'),
        pig(970, GROUND_Y, 34, 'golem'), // 거북 돔 철갑 골렘
        pig(1050, GROUND_Y, 23, 'helmet'),
        pig(970, 438, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 20 : 🌌 시공간 싱귤래리티 최종 대결전 (The Multiverse Singularity)
    // 기믹: [궁극의 피날레] 20스테이지 완결! 웜홀 메트릭스 + 보스 총집결 + 6종 버드 총력전
    // =========================================================================
    {
      id: 20,
      theme: 'singularity',
      skyTheme: 'singularity',
      title: 'STAGE 20 : 🌌 시공간 싱귤래리티 최종 대결전',
      subtitle: '대망의 20스테이지 완결! 웜홀과 스프링, 6종 정예 버드 총력전으로 싱귤래리티 킹피그 요새를 영원히 격파하세요!',
      badge: '최종 완결 / 웜홀 & 올스타 보스 군단',
      gravityY: 0.65, // 초월적 코스믹 저중력!
      birds: ['red', 'yellow', 'blue', 'black', 'white', 'big'],
      threeStarScore: 88000,
      twoStarScore: 60000,
      blocks: [
        // 공성 스프링 & 시공간 웜홀 포털
        spring(580, GROUND_Y, 90, 24),
        portal(680, 360, 28, 95, 'portal_in', 'p_out'),
        portal(980, 130, 28, 95, 'portal_out', 'p_in'),

        // 1층 피라미드 외벽 기둥 (X: 760 ~ 1180)
        steel(760, GROUND_Y, 28, 140),
        box(870, GROUND_Y, 28, 140, 'stone'),
        steel(980, GROUND_Y, 28, 140),
        box(1090, GROUND_Y, 28, 140, 'stone'),
        steel(1180, GROUND_Y, 28, 140),

        // 1층 메인 화약고 TNT 4연발
        box(815, GROUND_Y, 46, 46, 'tnt'),
        box(925, GROUND_Y, 46, 46, 'tnt'),
        box(1035, GROUND_Y, 46, 46, 'tnt'),
        box(1135, GROUND_Y, 46, 46, 'tnt'),

        // 1층 슬래브
        box(815, 440, 135, 22, 'steel'),
        box(925, 440, 135, 22, 'stone'),
        box(1035, 440, 135, 22, 'stone'),
        box(1135, 440, 135, 22, 'steel'),

        // 2층 성채 (높이 120)
        crystal(820, 418, 26, 120),
        steel(925, 418, 26, 120),
        box(980, 418, 50, 50, 'tnt'),
        steel(1035, 418, 26, 120),
        crystal(1140, 418, 26, 120),

        // 2층 천장
        box(870, 298, 130, 22, 'stone'),
        box(980, 298, 150, 24, 'stone'),
        box(1090, 298, 130, 22, 'stone'),

        // 3층 싱귤래리티 왕좌 신전
        crystal(930, 274, 24, 95),
        crystal(1030, 274, 24, 95),
        box(980, 179, 145, 22, 'stone'),

        // 왕좌 지붕 위 우주 운석 롤링 바위 & 전설의 찬란한 황금알
        boulder(980, 157, 30),
        goldenEgg(980, 75)
      ],
      pigs: [
        pig(640, 220, 22, 'balloon_pig'), // 공중 정찰대 1
        pig(800, 160, 22, 'balloon_pig'), // 공중 정찰대 2
        pig(880, GROUND_Y, 34, 'golem'), // 1층 수문장 골렘
        pig(960, 418, 25, 'wizard'), // 2층 대마법사
        pig(1040, GROUND_Y, 24, 'astronaut'), // 우주비행사
        pig(980, 274, 38, 'king'), // 👑 3층 최후의 슈퍼 킹피그!
        pig(820, GROUND_Y, 22, 'helmet'),
        pig(1100, GROUND_Y, 22, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 21 : 🏗️ 크레인 크레들 & 철골 행거 (Ironworks Crane Hangar)
    // 기믹: [신규 패턴] 완전 대칭 자립형 산업용 트러스 크레인 암 붕괴
    // =========================================================================
    {
      id: 21,
      theme: 'industrial',
      skyTheme: 'industrial',
      title: 'STAGE 21 : 🏗️ 크레인 크레들 & 철골 행거',
      subtitle: '대칭 하중으로 완벽히 안정된 산업용 크레인! 중심 케이블 래치를 부숴 하부 벙커를 덮치세요!',
      badge: '크레인 암 / 트러스 역학 붕괴',
      gravityY: 1.0,
      birds: ['black', 'yellow', 'big', 'white'],
      threeStarScore: 54000,
      twoStarScore: 36000,
      blocks: [
        // 광폭 안정 기초 바닥 슬래브 (Static)
        box(840, GROUND_Y, 260, 22, 'steel', true),

        // 1층 대칭 강철 기둥 & 중앙 슬래브
        steel(740, 558, 28, 120),
        steel(940, 558, 28, 120),
        box(840, 438, 240, 22, 'steel'),

        // 2층 크레인 트러스 & 상부 암
        steel(780, 416, 26, 100),
        steel(900, 416, 26, 100),
        box(840, 316, 200, 22, 'steel'),

        // 상판 크레들 위 바위 2개 (홈 안착)
        boulder(800, 294, 24),
        boulder(880, 294, 24),

        // 1층 중앙 화학 TNT
        box(840, 558, 44, 44, 'tnt'),

        // 황금알
        goldenEgg(840, 230)
      ],
      pigs: [
        pig(840, 416, 24, 'helmet'),
        pig(780, 558, 22, 'normal'),
        pig(900, 558, 22, 'normal'),
        pig(840, 294, 23, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 22 : 🏺 피라미드 스핑크스 성전 (Pharaoh Sphinx Temple)
    // 기믹: [신규 패턴] 바닥이 넓은 3단 대칭 계단 피라미드 (자립 안정성 100%)
    // =========================================================================
    {
      id: 22,
      theme: 'egypt',
      skyTheme: 'egypt',
      title: 'STAGE 22 : 🏺 피라미드 스핑크스 성전',
      subtitle: '광폭 계단 피라미드 구조! 내부 지지 기둥을 분쇄하여 상단 피라미드가 파라오를 매몰시키게 하세요!',
      badge: '피라미드 / 광폭 계단 성전',
      gravityY: 1.0,
      birds: ['yellow', 'black', 'big', 'red'],
      threeStarScore: 62000,
      twoStarScore: 42000,
      blocks: [
        // 1단 광폭 기둥 (폭 340)
        box(760, GROUND_Y, 32, 110, 'stone'),
        box(860, GROUND_Y, 28, 110, 'stone'),
        box(940, GROUND_Y, 28, 110, 'stone'),
        box(1040, GROUND_Y, 32, 110, 'stone'),
        box(900, 470, 340, 22, 'stone'),

        // 2단 (폭 200)
        box(820, 448, 26, 95, 'stone'),
        box(980, 448, 26, 95, 'stone'),
        box(900, 353, 200, 22, 'stone'),

        // 3단 파라오 왕실
        crystal(860, 331, 24, 85),
        crystal(940, 331, 24, 85),
        box(900, 246, 120, 20, 'stone'),

        // 내부 TNT 2개
        box(860, GROUND_Y, 44, 44, 'tnt'),
        box(940, GROUND_Y, 44, 44, 'tnt'),

        // 전설의 호루스 황금알
        goldenEgg(900, 190)
      ],
      pigs: [
        pig(900, 448, 34, 'king'), // 👑 파라오 킹피그
        pig(810, GROUND_Y, 23, 'helmet'),
        pig(990, GROUND_Y, 23, 'helmet'),
        pig(900, 331, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 23 : 💎 크리스탈 동굴 종유석 (Crystal Stalactite Cavern)
    // 기믹: [신규 패턴] 상공 고정 암반에 매달린 종유석 쐐기 낙하
    // =========================================================================
    {
      id: 23,
      theme: 'cavern',
      skyTheme: 'cavern',
      title: 'STAGE 23 : 💎 크리스탈 동굴 종유석',
      subtitle: '천장에 매달린 크리스탈 종유석 지지목을 끊어, 거대 바위 쐐기를 지상 기지로 벼락같이 낙하시키세요!',
      badge: '종유석 기믹 / 천장 쐐기 낙하',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'white', 'black'],
      threeStarScore: 56000,
      twoStarScore: 38000,
      blocks: [
        // 상공 고정 암반 (Static 천장)
        box(860, 180, 280, 24, 'stone', true),

        // 매달린 종유석 쐐기 장치 (지지목만 부수면 낙하!)
        box(860, 204, 24, 40, 'wood'),
        crystal(860, 260, 80, 30),
        boulder(860, 290, 28),

        // 지상 크리스탈 요새 (X: 740 ~ 980)
        crystal(760, GROUND_Y, 26, 120),
        box(860, GROUND_Y, 24, 120, 'ice'),
        crystal(960, GROUND_Y, 26, 120),
        box(860, 460, 240, 20, 'crystal'),

        // 1층 내부 TNT
        box(860, GROUND_Y, 44, 44, 'tnt'),

        // 황금알
        goldenEgg(860, 430)
      ],
      pigs: [
        pig(760, 440, 22, 'normal'),
        pig(860, GROUND_Y, 24, 'wizard'),
        pig(960, 440, 22, 'normal'),
        pig(860, 330, 23, 'helmet')
      ]
    },

    // =========================================================================
    // STAGE 24 : 🏯 천수각 삼중 누각 성벽 (Three-Tier Samurai Fortress)
    // 기믹: [신규 패턴] 광폭 기와 지붕 4기둥 지지의 안정적인 천수각
    // =========================================================================
    {
      id: 24,
      theme: 'oriental',
      skyTheme: 'oriental',
      title: 'STAGE 24 : 🏯 천수각 삼중 누각 성벽',
      subtitle: '대칭 4기둥으로 견고하게 선 삼중 누각! 척의 돌진으로 각 층의 특정 기둥만 꺾어 차례대로 무너뜨리세요!',
      badge: '천수각 / 3중 누각 층별 공략',
      gravityY: 1.0,
      birds: ['yellow', 'yellow', 'white', 'big'],
      threeStarScore: 60000,
      twoStarScore: 40000,
      blocks: [
        // 1층 (폭 310)
        box(780, GROUND_Y, 26, 110, 'stone'),
        box(860, GROUND_Y, 24, 110, 'wood'),
        box(940, GROUND_Y, 24, 110, 'wood'),
        box(1020, GROUND_Y, 26, 110, 'stone'),
        box(900, 470, 310, 22, 'wood'),

        // 2층 (폭 210)
        box(820, 448, 22, 95, 'wood'),
        box(980, 448, 22, 95, 'wood'),
        box(900, 353, 210, 20, 'wood'),

        // 3층 망루
        crystal(860, 333, 20, 80),
        crystal(940, 333, 20, 80),
        box(900, 253, 130, 18, 'ice'),

        // 1층 TNT & 지붕 바위
        box(900, GROUND_Y, 44, 44, 'tnt'),
        boulder(900, 233, 24),
        goldenEgg(900, 180)
      ],
      pigs: [
        pig(820, GROUND_Y, 23, 'helmet'),
        pig(980, GROUND_Y, 23, 'helmet'),
        pig(900, 448, 30, 'golem'), // 🪨 사무라이 골렘
        pig(900, 333, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 25 : 🏭 파이프라인 정유 공장 (Chemical Refinery)
    // 기믹: [신규 패턴] 수평 3단 릴레이 폭발 파이프라인 랙 (가로 격자 지지)
    // =========================================================================
    {
      id: 25,
      theme: 'chemical',
      skyTheme: 'chemical',
      title: 'STAGE 25 : 🏭 파이프라인 정유 공장',
      subtitle: '수평 3단 화학 파이프라인! 좌측 탱크를 기폭시켜 도미노처럼 우측 정유탑까지 릴레이 폭발시키세요!',
      badge: '정유 공장 / 릴레이 화학 폭발',
      gravityY: 1.0,
      birds: ['black', 'black', 'yellow', 'blue'],
      threeStarScore: 68000,
      twoStarScore: 46000,
      blocks: [
        // 1단 지상 랙 기둥 4개 (폭 460)
        steel(720, GROUND_Y, 28, 120),
        steel(860, GROUND_Y, 28, 120),
        steel(1000, GROUND_Y, 28, 120),
        steel(1140, GROUND_Y, 28, 120),
        box(930, 460, 460, 22, 'steel'),

        // 1단 사이사이 화학 TNT 3개
        box(790, GROUND_Y, 46, 46, 'tnt'),
        box(930, GROUND_Y, 46, 46, 'tnt'),
        box(1070, GROUND_Y, 46, 46, 'tnt'),

        // 2단 파이프 랙
        box(790, 438, 22, 90, 'wood'),
        box(930, 438, 22, 90, 'wood'),
        box(1070, 438, 22, 90, 'wood'),
        box(930, 348, 320, 20, 'steel'),

        // 2단 TNT
        box(930, 438, 44, 44, 'tnt'),

        // 3단 굴뚝
        box(930, 328, 26, 80, 'stone'),
        goldenEgg(930, 220)
      ],
      pigs: [
        pig(790, 438, 23, 'helmet'),
        pig(1070, 438, 23, 'helmet'),
        pig(930, 328, 24, 'wizard'),
        pig(720, GROUND_Y, 21, 'normal'),
        pig(1140, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 26 : 🚀 발사대 로켓 갠트리 타워 (Rocket Launch Gantry)
    // 기믹: [신규 패턴] 직립 로켓과 점검 타워 (초안정 직립 거치)
    // =========================================================================
    {
      id: 26,
      theme: 'spaceport',
      skyTheme: 'spaceport',
      title: 'STAGE 26 : 🚀 발사대 로켓 갠트리 타워',
      subtitle: '발사 대기 중인 로켓! 부스터 연결 핀을 파괴하여 로켓 본체가 관제탑으로 덮치게 만드세요!',
      badge: '로켓 갠트리 / 부스터 폭격',
      gravityY: 1.0,
      birds: ['yellow', 'black', 'white', 'big'],
      threeStarScore: 58000,
      twoStarScore: 39000,
      blocks: [
        // 좌측 갠트리 타워 (X: 740)
        steel(710, GROUND_Y, 24, 150),
        steel(770, GROUND_Y, 24, 150),
        box(740, 430, 90, 22, 'steel'),
        steel(740, 408, 22, 110),
        box(740, 298, 80, 20, 'steel'),

        // 중앙 로켓 본체 (X: 880)
        box(855, GROUND_Y, 44, 44, 'tnt'),
        box(905, GROUND_Y, 44, 44, 'tnt'),
        steel(880, 492, 60, 110),
        crystal(880, 382, 48, 100),
        boulder(880, 282, 26),

        // 우측 관제 벙커 (X: 1040)
        box(1000, GROUND_Y, 26, 120, 'stone'),
        box(1080, GROUND_Y, 26, 120, 'stone'),
        box(1040, 460, 120, 22, 'stone'),

        // 황금알
        goldenEgg(880, 220)
      ],
      pigs: [
        pig(740, 278, 23, 'astronaut'),
        pig(880, 382, 24, 'astronaut'),
        pig(1040, GROUND_Y, 23, 'helmet'),
        pig(1040, 438, 22, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 27 : 🏰 듀얼 캐슬 성문 도하 (Twin Bastion Drawbridge)
    // 기믹: [신규 패턴] 좌우 쌍둥이 성채 사이에 걸쳐진 중앙 도개교 절단
    // =========================================================================
    {
      id: 27,
      theme: 'medieval',
      skyTheme: 'medieval',
      title: 'STAGE 27 : 🏰 듀얼 캐슬 성문 도하',
      subtitle: '두 성채 사이에 얹혀진 거대 도개교! 중앙 연결부를 폭탄새로 절단하여 양쪽 성채를 안쪽으로 붕괴시키세요!',
      badge: '듀얼 캐슬 / 도개교 중앙 절단',
      gravityY: 1.0,
      birds: ['blue', 'black', 'yellow', 'white'],
      threeStarScore: 64000,
      twoStarScore: 43000,
      blocks: [
        // 좌측 성채 (X: 720)
        box(680, GROUND_Y, 28, 140, 'stone'),
        box(760, GROUND_Y, 28, 140, 'stone'),
        box(720, 440, 110, 22, 'stone'),
        boulder(720, 418, 26),

        // 우측 성채 (X: 1060)
        box(1020, GROUND_Y, 28, 140, 'stone'),
        box(1100, GROUND_Y, 28, 140, 'stone'),
        box(1060, 440, 110, 22, 'stone'),
        boulder(1060, 418, 26),

        // 중앙 연결 도개교 (폭 220)
        box(890, 440, 220, 20, 'wood'),
        box(890, 420, 44, 44, 'tnt'),

        // 지상 해자 TNT
        box(890, GROUND_Y, 44, 44, 'tnt'),
        goldenEgg(890, 340)
      ],
      pigs: [
        pig(720, 418, 23, 'helmet'),
        pig(1060, 418, 23, 'helmet'),
        pig(890, 420, 32, 'golem'), // 🪨 도개교 수문장 골렘
        pig(890, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 28 : 🕸️ 거미줄 육각 하이브 (Hexagonal Cyber Hive)
    // 기믹: [신규 패턴] 완벽한 구조역학 안정 트러스 육각 격자 하이브
    // =========================================================================
    {
      id: 28,
      theme: 'cyberhive',
      skyTheme: 'cyberhive',
      title: 'STAGE 28 : 🕸️ 거미줄 육각 하이브',
      subtitle: '구조역학상 흔들림이 전혀 없는 육각 트러스 하이브! 셀 내부의 핵심 급소들을 차례대로 관통하세요!',
      badge: '육각 하이브 / 트러스 안정 구조',
      gravityY: 1.0,
      birds: ['blue', 'yellow', 'white', 'black', 'big'],
      threeStarScore: 66000,
      twoStarScore: 45000,
      blocks: [
        // 1층 기둥 3개 (폭 280)
        steel(780, GROUND_Y, 26, 120),
        crystal(900, GROUND_Y, 26, 120),
        steel(1020, GROUND_Y, 26, 120),
        box(840, 460, 130, 20, 'crystal'),
        box(960, 460, 130, 20, 'crystal'),

        // 2층 하이브
        crystal(840, 440, 24, 100),
        steel(960, 440, 24, 100),
        box(900, 340, 150, 20, 'steel'),

        // 1층 내부 TNT
        box(840, GROUND_Y, 42, 42, 'tnt'),
        box(960, GROUND_Y, 42, 42, 'tnt'),

        // 3층 코어
        crystal(900, 320, 22, 80),
        goldenEgg(900, 220)
      ],
      pigs: [
        pig(840, 440, 24, 'wizard'),
        pig(960, 440, 23, 'helmet'),
        pig(900, GROUND_Y, 24, 'astronaut'),
        pig(900, 320, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 29 : 🌋 용암 협곡 철교 (Lava Gorge Railroad Bridge)
    // 기믹: [신규 패턴] 절벽 사이 걸쳐진 트러스 철교 & 교각 파괴 시 V자 추락
    // =========================================================================
    {
      id: 29,
      theme: 'volcano',
      skyTheme: 'volcano',
      title: 'STAGE 29 : 🌋 용암 협곡 철교',
      subtitle: '용암 협곡 절벽에 걸쳐진 트러스 철교! 중앙 교각을 폭파하여 열차와 적들을 협곡 용암으로 수장시키세요!',
      badge: '협곡 철교 / 트러스 V자 붕괴',
      gravityY: 1.0,
      birds: ['yellow', 'black', 'big', 'white'],
      threeStarScore: 74000,
      twoStarScore: 50000,
      blocks: [
        // 좌우 고정 절벽 암벽 (Static)
        box(680, GROUND_Y, 90, 180, 'stone', true),
        box(1120, GROUND_Y, 90, 180, 'stone', true),

        // 중앙 지지 교각 2개
        steel(830, GROUND_Y, 26, 180),
        steel(970, GROUND_Y, 26, 180),

        // 철교 메인 상판 (길이 460)
        box(900, 400, 460, 24, 'steel'),

        // 철교 위 화물칸 TNT & 바위
        box(780, 376, 44, 44, 'tnt'),
        boulder(900, 376, 26),
        box(1020, 376, 44, 44, 'tnt'),

        // 용암 바닥 TNT
        box(900, GROUND_Y, 46, 46, 'tnt'),
        goldenEgg(900, 290)
      ],
      pigs: [
        pig(780, 376, 23, 'helmet'),
        pig(900, 376, 32, 'golem'), // 🪨 열차 수송 골렘
        pig(1020, 376, 23, 'helmet'),
        pig(900, GROUND_Y, 21, 'normal')
      ]
    },

    // =========================================================================
    // STAGE 30 : 👑 불멸의 펜타곤 콜로세움 (The Immortal Colosseum)
    // 기믹: [30스테이지 초대형 완결판] 5각 대칭 콜로세움 + 보스 올스타 + 6종 버드 총력전
    // =========================================================================
    {
      id: 30,
      theme: 'colosseum',
      skyTheme: 'colosseum',
      title: 'STAGE 30 : 👑 불멸의 펜타곤 콜로세움',
      subtitle: '대망의 30스테이지 완결! 5각 대칭 불멸의 콜로세움 요새에서 황제 킹피그와 최후의 결전을 벌이세요!',
      badge: '궁극의 완결판 / 불멸의 콜로세움 대단원',
      gravityY: 1.0,
      birds: ['red', 'yellow', 'blue', 'black', 'white', 'big'],
      threeStarScore: 99000,
      twoStarScore: 70000,
      blocks: [
        // 워프 포털 1쌍 & 전방 공성 점프대
        portal(520, 360, 28, 95, 'portal_in', 'p_out'),
        portal(1000, 130, 28, 95, 'portal_out', 'p_in'),
        spring(620, GROUND_Y, 86, 24),

        // 1층 콜로세움 외벽 기둥 5개 (폭 440)
        steel(760, GROUND_Y, 28, 140),
        box(860, GROUND_Y, 28, 140, 'stone'),
        steel(960, GROUND_Y, 28, 140),
        box(1060, GROUND_Y, 28, 140, 'stone'),
        steel(1160, GROUND_Y, 28, 140),

        // 1층 슬래브
        box(810, 440, 120, 22, 'stone'),
        box(910, 440, 120, 22, 'steel'),
        box(1010, 440, 120, 22, 'steel'),
        box(1110, 440, 120, 22, 'stone'),

        // 1층 무기고 TNT 4연발
        box(810, GROUND_Y, 44, 44, 'tnt'),
        box(910, GROUND_Y, 44, 44, 'tnt'),
        box(1010, GROUND_Y, 44, 44, 'tnt'),
        box(1110, GROUND_Y, 44, 44, 'tnt'),

        // 2층 콜로세움 회랑
        crystal(830, 418, 26, 120),
        steel(910, 418, 26, 120),
        box(960, 418, 50, 50, 'tnt'),
        steel(1010, 418, 26, 120),
        crystal(1090, 418, 26, 120),

        // 2층 천장
        box(870, 298, 130, 22, 'stone'),
        box(960, 298, 150, 24, 'stone'),
        box(1050, 298, 130, 22, 'stone'),

        // 3층 황제 킹피그 왕좌 신전
        crystal(910, 274, 24, 95),
        crystal(1010, 274, 24, 95),
        box(960, 179, 140, 22, 'stone'),

        // 신전 꼭대기 황금 바위 & 찬란한 황금알
        boulder(960, 157, 28),
        goldenEgg(960, 80)
      ],
      pigs: [
        pig(660, 210, 22, 'balloon_pig'), // 공중 호위대 1
        pig(800, 150, 22, 'balloon_pig'), // 공중 호위대 2
        pig(860, GROUND_Y, 34, 'golem'), // 1층 수문장 골렘
        pig(910, 418, 25, 'wizard'), // 2층 대마법사
        pig(1010, 418, 24, 'astronaut'), // 우주비행사
        pig(960, 274, 38, 'king'), // 👑 3층 불멸의 황제 킹피그!
        pig(760, GROUND_Y, 22, 'helmet'),
        pig(1160, GROUND_Y, 22, 'helmet')
      ]
    }
  ];
})();
