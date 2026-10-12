/**
 * src/game.js
 * 앵그리버드 PWA 메인 물리 엔진(Matter.js) 및 Canvas 2D 렌더러
 */

(function () {
  'use strict';

  const { Engine, World, Bodies, Body, Events, Vector, Composite } = window.Matter;

const WORLD_W = 1280;
const WORLD_H = 720;
const GROUND_Y = 580;
const SLING_X = 230;
const SLING_Y = 465;
const MAX_PULL = 115;
const LAUNCH_POWER = 0.255;

const MATERIAL_PROPS = {
  wood: {
    hp: 42,
    density: 0.0022,
    friction: 0.85,
    restitution: 0.15,
    score: 500,
    fill: '#d97706',
    stroke: '#78350f',
    crackColor: '#451a03'
  },
  ice: {
    hp: 24,
    density: 0.0016,
    friction: 0.4,
    restitution: 0.2,
    score: 600,
    fill: 'rgba(125, 211, 252, 0.78)',
    stroke: '#0284c7',
    crackColor: '#e0f2fe'
  },
  stone: {
    hp: 95,
    density: 0.0045,
    friction: 0.9,
    restitution: 0.08,
    score: 800,
    fill: '#64748b',
    stroke: '#334155',
    crackColor: '#1e293b'
  },
  tnt: {
    hp: 18,
    density: 0.0025,
    friction: 0.8,
    restitution: 0.15,
    score: 1200,
    fill: '#dc2626',
    stroke: '#7f1d1d',
    crackColor: '#fef08a'
  },
  boulder: {
    hp: 350,
    density: 0.0078,
    friction: 0.08,
    restitution: 0.18,
    score: 1500,
    fill: '#475569',
    stroke: '#1e293b',
    crackColor: '#0f172a'
  },
  spring: {
    hp: 99999,
    density: 0.015,
    friction: 0.05,
    restitution: 1.95,
    score: 0,
    fill: '#ef4444',
    stroke: '#991b1b',
    crackColor: '#fca5a5'
  },
  crystal: {
    hp: 32,
    density: 0.0018,
    friction: 0.18,
    restitution: 0.25,
    score: 1500,
    fill: 'rgba(217, 70, 239, 0.88)',
    stroke: '#a21caf',
    crackColor: '#fdf4ff'
  },
  steel: {
    hp: 190,
    density: 0.0072,
    friction: 0.75,
    restitution: 0.04,
    score: 1200,
    fill: '#334155',
    stroke: '#0f172a',
    crackColor: '#94a3b8'
  },
  balloon: {
    hp: 8,
    density: 0.0001,
    friction: 0.1,
    restitution: 0.45,
    score: 800,
    fill: '#f43f5e',
    stroke: '#be123c',
    crackColor: '#fecdd3'
  },
  golden_egg: {
    hp: 14,
    density: 0.0022,
    friction: 0.35,
    restitution: 0.4,
    score: 10000,
    fill: '#fbbf24',
    stroke: '#d97706',
    crackColor: '#fef08a'
  },
  portal_in: {
    hp: 99999,
    density: 0.01,
    friction: 0.0,
    restitution: 0.0,
    score: 0,
    fill: '#38bdf8',
    stroke: '#0284c7',
    crackColor: '#bae6fd'
  },
  portal_out: {
    hp: 99999,
    density: 0.01,
    friction: 0.0,
    restitution: 0.0,
    score: 0,
    fill: '#f97316',
    stroke: '#c2410c',
    crackColor: '#ffedd5'
  }
};

const PIG_PROPS = {
  normal: { hp: 22, score: 5000, density: 0.002 },
  helmet: { hp: 48, score: 7500, density: 0.0028 },
  king: { hp: 85, score: 15000, density: 0.0035 },
  balloon_pig: { hp: 22, score: 6500, density: 0.0004 },
  golem: { hp: 150, score: 25000, density: 0.006 },
  wizard: { hp: 65, score: 14000, density: 0.0026 },
  astronaut: { hp: 45, score: 9000, density: 0.0018 }
};

class AngryBirdsGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 }
    });
    this.world = this.engine.world;

    // 진행 상태 및 로컬 스토리지 데이터
    this.currentLevelIdx = 0;
    this.score = 0;
    this.progress = this._loadProgress();

    // 게임 오브젝트 컨테이너
    this.blocks = [];
    this.pigs = [];
    this.activeBirds = [];
    this.activeEggs = [];
    this.birdQueue = [];
    this.currentBird = null; // 슬링샷에 장전된 버드 데이터 { type, x, y }

    // 슬링샷 드래그 상태
    this.state = 'AIMING'; // 'AIMING' | 'DRAGGING' | 'FLYING' | 'RESULT'
    this.dragPos = { x: SLING_X, y: SLING_Y };
    this.isDragging = false;

    // 시각 효과 (궤적 점, 파편 파티클, 충격파, 플로팅 텍스트, 화면 흔들림, 환경 파티클)
    this.flightTrail = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.weatherParticles = [];
    this.clouds = this._createClouds();
    this.screenShake = 0;
    this.cameraOffsetX = 0;
    this.targetCameraX = 0;
    this.isOverviewMode = false;

    // 모바일 무조건 세로 모드 및 정비율 가상 해상도 관리
    this.isPortrait = false;
    this.virtualW = WORLD_W;
    this.virtualH = WORLD_H;
    this.portraitOffsetY = 0;

    // 타이밍 관리
    this.levelStartTime = 0;
    this.launchTime = 0;
    this.lastHitTime = 0;
    this.settleTimer = 0;

    this._initCanvasSize();
    this._bindEvents();
    this._setupCollisionHandler();
    this._renderStageSelectModal();
    this.loadLevel(0);

    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loadProgress() {
    try {
      const saved = localStorage.getItem('angry_birds_pwa_progress_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore storage errors
    }
    return {
      unlockedStage: 1,
      stars: {},
      highScores: {}
    };
  }

  _saveProgress() {
    try {
      localStorage.setItem('angry_birds_pwa_progress_v1', JSON.stringify(this.progress));
    } catch (e) {
      // ignore storage errors
    }
  }

  _createClouds() {
    const list = [];
    for (let i = 0; i < 7; i++) {
      list.push({
        x: Math.random() * WORLD_W,
        y: 60 + Math.random() * 190,
        scale: 0.65 + Math.random() * 0.75,
        speed: 0.15 + Math.random() * 0.25
      });
    }
    return list;
  }

  _initCanvasSize() {
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this._handleResize(), 150);
    });
  }

  /**
   * 가로 모드(Landscape) 표준 16:9 와이드 해상도(1280x720) 정비율 유지
   */
  _handleResize() {
    this.isPortrait = false;
    this.virtualW = WORLD_W;
    this.virtualH = WORLD_H;
    this.portraitOffsetY = 0;

    if (this.canvas.width !== WORLD_W || this.canvas.height !== WORLD_H) {
      this.canvas.width = WORLD_W;
      this.canvas.height = WORLD_H;
    }
  }

  /**
   * 화면 클릭/터치 좌표를 캔버스 내부 월드 좌표(1280x720)로 정밀 변환
   */
  _getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = WORLD_W / (rect.width || 1);
    const scaleY = WORLD_H / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX - this.cameraOffsetX,
      y: (clientY - rect.top) * scaleY
    };
  }

  _bindEvents() {
    const onPointerDown = (e) => {
      if (e.target !== this.canvas) return;
      window.soundEngine.unlock();
      if (window.soundEngine.bgmEnabled && !window.soundEngine.bgmPlaying) {
        window.soundEngine.startBgm();
      }

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const pt = this._getCanvasCoords(clientX, clientY);

      if (this.state === 'AIMING' && this.currentBird) {
        const dist = Math.hypot(pt.x - SLING_X, pt.y - SLING_Y);
        // 모바일 가로 모드에서도 엄지손가락 터치가 쾌적하도록 반경 85px 제공
        if (dist <= 85) {
          this.isOverviewMode = false;
          this.targetCameraX = 0;
          this.state = 'DRAGGING';
          this.isDragging = true;
          this._updateDragPosition(pt.x, pt.y);
        }
      } else if (this.state === 'FLYING') {
        this.activateSkill();
      }
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.state !== 'DRAGGING') return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const pt = this._getCanvasCoords(clientX, clientY);
      this._updateDragPosition(pt.x, pt.y);
    };

    const onPointerUp = () => {
      if (!this.isDragging || this.state !== 'DRAGGING') return;
      this.isDragging = false;

      const dx = SLING_X - this.dragPos.x;
      const dy = SLING_Y - this.dragPos.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 18) {
        this._launchCurrentBird(dx, dy);
      } else {
        // 당긴 거리가 너무 짧으면 원위치
        this.dragPos = { x: SLING_X, y: SLING_Y };
        this.state = 'AIMING';
      }
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onPointerDown(e);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) e.preventDefault();
      onPointerMove(e);
    }, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // 키보드 스페이스바로도 공중 스킬 발동 가능
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.state === 'FLYING') {
        e.preventDefault();
        this.activateSkill();
      } else if (e.code === 'KeyR') {
        this.loadLevel(this.currentLevelIdx);
      }
    });

    // 상단 UI 버튼 바인딩
    document.getElementById('btnRestart').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      this.loadLevel(this.currentLevelIdx);
    });

    document.getElementById('btnStages').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      this._renderStageSelectModal();
      document.getElementById('stageModal').classList.remove('hidden');
    });

    document.getElementById('btnCloseStageModal').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      document.getElementById('stageModal').classList.add('hidden');
    });

    document.getElementById('btnOverview').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      this.isOverviewMode = !this.isOverviewMode;
      this.targetCameraX = this.isOverviewMode ? -140 : 0;
    });

    document.getElementById('btnSfx').addEventListener('click', (e) => {
      const enabled = window.soundEngine.toggleSfx();
      e.currentTarget.textContent = enabled ? '🔊 효과음 ON' : '🔇 효과음 OFF';
      e.currentTarget.classList.toggle('muted', !enabled);
    });

    document.getElementById('btnBgm').addEventListener('click', (e) => {
      const enabled = window.soundEngine.toggleBgm();
      e.currentTarget.textContent = enabled ? '🎵 BGM ON' : '🔇 BGM OFF';
      e.currentTarget.classList.toggle('muted', !enabled);
    });

    document.getElementById('btnModalRetry').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      document.getElementById('resultModal').classList.add('hidden');
      this.loadLevel(this.currentLevelIdx);
    });

    document.getElementById('btnModalNext').addEventListener('click', () => {
      window.soundEngine.playUiClick();
      document.getElementById('resultModal').classList.add('hidden');
      const nextIdx = (this.currentLevelIdx + 1) % window.LEVELS.length;
      this.loadLevel(nextIdx);
    });
  }

  _updateDragPosition(x, y) {
    let dx = x - SLING_X;
    let dy = y - SLING_Y;
    const dist = Math.hypot(dx, dy);

    if (dist > MAX_PULL) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * MAX_PULL;
      dy = Math.sin(angle) * MAX_PULL;
    }

    // 지면 아래로 너무 내려가지 않도록 제한
    const clampedY = Math.min(GROUND_Y - 22, SLING_Y + dy);
    this.dragPos = {
      x: SLING_X + dx,
      y: clampedY
    };

    const ratio = Math.min(1, dist / MAX_PULL);
    if (ratio > 0.15) {
      window.soundEngine.playStretch(ratio);
    }
  }

  /**
   * 스테이지 로드 및 월드 초기화
   */
  loadLevel(levelIdx) {
    this.currentLevelIdx = levelIdx;
    const level = window.LEVELS[levelIdx];

    Composite.clear(this.world, false);
    this.blocks = [];
    this.pigs = [];
    this.activeBirds = [];
    this.activeEggs = [];
    this.flightTrail = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.score = 0;
    this.cameraOffsetX = 0;
    this.targetCameraX = 0;
    this.isOverviewMode = false;
    this.screenShake = 0;

    // 스테이지별 중력 설정 (예: 우주 무중력 스테이지)
    const gravScale = level.gravityY !== undefined ? level.gravityY : 1.0;
    this.engine.gravity.y = gravScale;

    // 스테이지별 BGM 테마 전환
    window.soundEngine.setTheme(level.theme || 'plains');

    // 테마별 날씨/환경 파티클 생성
    this._initWeatherParticles(level.theme || 'plains');

    document.getElementById('resultModal').classList.add('hidden');
    document.getElementById('stageModal').classList.add('hidden');

    // 지면 및 좌우 보이지 않는 벽 생성
    const ground = Bodies.rectangle(WORLD_W / 2, GROUND_Y + 60, WORLD_W * 2, 120, {
      isStatic: true,
      friction: 0.95,
      label: 'ground'
    });
    const rightWall = Bodies.rectangle(WORLD_W + 180, WORLD_H / 2, 80, WORLD_H * 2, {
      isStatic: true,
      label: 'wall'
    });
    World.add(this.world, [ground, rightWall]);

    // 구조물 및 롤링 바위 블록 생성
    level.blocks.forEach((b) => {
      const mat = MATERIAL_PROPS[b.material] || MATERIAL_PROPS.wood;
      let body;
      const isPortal = b.material === 'portal_in' || b.material === 'portal_out';

      if (b.shape === 'circle' || b.material === 'boulder' || b.material === 'golden_egg' || b.material === 'balloon') {
        body = Bodies.circle(b.x, b.y, b.radius || 24, {
          density: mat.density,
          friction: mat.friction,
          restitution: mat.restitution,
          isStatic: b.isStatic || false,
          label: 'block'
        });
        body.gameData = {
          kind: 'block',
          shape: 'circle',
          material: b.material,
          radius: b.radius || 24,
          hp: mat.hp,
          maxHp: mat.hp,
          score: mat.score
        };
      } else {
        body = Bodies.rectangle(b.x, b.y, b.w, b.h, {
          density: mat.density,
          friction: mat.friction,
          frictionStatic: 1.0,
          restitution: mat.restitution,
          isStatic: isPortal ? true : (b.isStatic || false),
          isSensor: isPortal, // 포털은 통과 가능한 센서 바디로 설정
          label: 'block'
        });
        body.gameData = {
          kind: 'block',
          shape: 'rectangle',
          material: b.material,
          w: b.w,
          h: b.h,
          hp: mat.hp,
          maxHp: mat.hp,
          score: mat.score,
          targetPortalId: b.targetPortalId || null,
          spin: 0,
          compressTimer: 0
        };
      }
      this.blocks.push(body);
      World.add(this.world, body);
    });

    // 돼지 생성
    level.pigs.forEach((p) => {
      const prop = PIG_PROPS[p.role] || PIG_PROPS.normal;
      const isBalloonPig = p.role === 'balloon_pig';
      const body = Bodies.circle(p.x, p.y, p.radius, {
        density: prop.density,
        friction: 0.75,
        frictionStatic: 0.9,
        restitution: 0.25,
        isStatic: isBalloonPig, // 풍선 돼지는 격추되기 전까지 공중 부유 고정
        label: 'pig'
      });
      body.gameData = {
        kind: 'pig',
        role: p.role,
        radius: p.radius,
        hp: prop.hp,
        maxHp: prop.hp,
        score: prop.score,
        isFloating: isBalloonPig,
        originY: p.y,
        blinkTimer: Math.random() * 200
      };
      this.pigs.push(body);
      World.add(this.world, body);
    });

    // 버드 대기열 설정
    this.birdQueue = [...level.birds];
    this._prepareNextBird();

    this.levelStartTime = performance.now();
    this._updateHud();
  }

  _prepareNextBird() {
    if (this.birdQueue.length === 0) {
      this.currentBird = null;
      return;
    }
    const nextType = this.birdQueue.shift();
    this.currentBird = {
      type: nextType
    };
    this.dragPos = { x: SLING_X, y: SLING_Y };
    this.state = 'AIMING';
    this._updateHud();
  }

  _launchCurrentBird(dx, dy) {
    if (!this.currentBird) return;

    const birdType = this.currentBird.type;
    const info = window.BIRD_INFO[birdType];

    const birdBody = Bodies.circle(this.dragPos.x, this.dragPos.y, info.radius, {
      density: info.mass ? info.mass * 0.0009 : 0.0038,
      friction: 0.5,
      frictionAir: 0.004,
      restitution: 0.42,
      label: 'bird'
    });

    birdBody.gameData = {
      kind: 'bird',
      birdType,
      radius: info.radius,
      skillUsed: false,
      hasCollided: false
    };

    World.add(this.world, birdBody);
    Body.setVelocity(birdBody, {
      x: dx * LAUNCH_POWER,
      y: dy * LAUNCH_POWER
    });

    this.activeBirds = [birdBody];
    this.currentBird = null;
    this.flightTrail = [];
    this.state = 'FLYING';
    this.launchTime = performance.now();
    this.lastHitTime = performance.now();

    window.soundEngine.playLaunch(birdType);
    this._updateHud();
  }

  /**
   * 비행 중 특수 스킬 발동!
   */
  activateSkill() {
    if (this.state !== 'FLYING' || this.activeBirds.length === 0) return;
    const mainBird = this.activeBirds[0];
    if (!mainBird || !mainBird.gameData || mainBird.gameData.skillUsed) return;

    mainBird.gameData.skillUsed = true;
    const type = mainBird.gameData.birdType;
    const pos = mainBird.position;
    const vel = mainBird.velocity;

    window.soundEngine.playSkill(type);

    if (type === 'yellow') {
      // 척(노랑새): 바라보는 방향으로 초고속 터보 돌진!
      const speed = Math.hypot(vel.x, vel.y);
      const angle = speed > 0.5 ? Math.atan2(vel.y, vel.x) : 0.1;
      const boostSpeed = Math.max(speed * 2.25, 24);
      Body.setVelocity(mainBird, {
        x: Math.cos(angle) * boostSpeed,
        y: Math.sin(angle) * boostSpeed
      });
      mainBird.gameData.boosted = true;
      this._spawnParticles(pos.x, pos.y, '#facc15', 22, 8);
      this._addFloatingText(pos.x, pos.y - 30, '⚡ 터보 가속!', '#fde047');
    } else if (type === 'blue') {
      // 블루(파랑새): 3마리로 분신!
      const baseAngle = Math.atan2(vel.y, vel.x);
      const speed = Math.max(Math.hypot(vel.x, vel.y), 13);
      const offsets = [-0.24, 0.24];

      offsets.forEach((angleOffset, idx) => {
        const clone = Bodies.circle(
          pos.x,
          pos.y + (idx === 0 ? -18 : 18),
          mainBird.gameData.radius * 0.9,
          {
            density: 0.0032,
            friction: 0.5,
            frictionAir: 0.004,
            restitution: 0.42,
            label: 'bird'
          }
        );
        clone.gameData = {
          kind: 'bird',
          birdType: 'blue',
          radius: mainBird.gameData.radius * 0.9,
          skillUsed: true,
          hasCollided: false
        };
        World.add(this.world, clone);
        Body.setVelocity(clone, {
          x: Math.cos(baseAngle + angleOffset) * speed,
          y: Math.sin(baseAngle + angleOffset) * speed
        });
        this.activeBirds.push(clone);
      });

      this._spawnParticles(pos.x, pos.y, '#38bdf8', 20, 6);
      this._addFloatingText(pos.x, pos.y - 30, '✨ 3단 분신!', '#7dd3fc');
    } else if (type === 'black') {
      // 밤(폭탄새): 강력한 대폭발!
      this._triggerExplosion(pos.x, pos.y, 195, 135);
      this._addFloatingText(pos.x, pos.y - 35, '💥 대폭발!', '#f97316');
    } else if (type === 'white') {
      // 마틸다(화이트): 아래로 알 폭탄(Egg Bomb) 투하 & 본체는 대각선 위로 반동 도약!
      const egg = Bodies.circle(pos.x, pos.y + 18, 14, {
        density: 0.0055,
        friction: 0.4,
        restitution: 0.2,
        label: 'egg'
      });
      egg.gameData = {
        kind: 'egg',
        radius: 14,
        hp: 1,
        maxHp: 1,
        hasExploded: false
      };
      World.add(this.world, egg);
      Body.setVelocity(egg, { x: vel.x * 0.25, y: Math.max(vel.y + 7, 11) });
      this.activeEggs.push(egg);

      Body.setVelocity(mainBird, { x: Math.max(vel.x * 0.65, 7), y: -13 });
      this._spawnParticles(pos.x, pos.y + 12, '#fef08a', 18, 7);
      this._addFloatingText(pos.x, pos.y - 30, '🥚 알 폭탄 투하!', '#ffffff');
    } else if (type === 'big') {
      // 테렌스(거대 버드): 급강하 지진 파운드 & 거대 충격파!
      Body.setVelocity(mainBird, { x: vel.x * 1.5 + 4, y: Math.max(vel.y * 1.5, 16) });
      this.shockwaves.push({
        x: pos.x,
        y: pos.y,
        radius: 20,
        maxRadius: 195,
        alpha: 1.0,
        color: '#881337'
      });
      this._applyRadialForce(pos.x, pos.y, 190, 60, 0.15);
      this._addFloatingText(pos.x, pos.y - 35, '💥 대지 분쇄!', '#fca5a5');
    } else {
      // 레드(기본새): 충격파 발산!
      this.shockwaves.push({
        x: pos.x,
        y: pos.y,
        radius: 15,
        maxRadius: 155,
        alpha: 1.0,
        color: '#ef4444'
      });
      this._applyRadialForce(pos.x, pos.y, 155, 42, 0.09);
      this._addFloatingText(pos.x, pos.y - 30, '💢 쇼크웨이브!', '#fca5a5');
    }
  }

  _applyRadialForce(cx, cy, radius, maxDamage, forceScale) {
    const targets = [...this.blocks, ...this.pigs];
    targets.forEach((body) => {
      if (!body.gameData) return;
      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius && dist > 1) {
        const factor = 1 - dist / radius;
        const angle = Math.atan2(dy, dx);
        Body.setVelocity(body, {
          x: body.velocity.x + Math.cos(angle) * factor * 18 * (forceScale / 0.09),
          y: body.velocity.y + Math.sin(angle) * factor * 18 * (forceScale / 0.09) - 3
        });
        this._damageBody(body, maxDamage * factor);
      }
    });
  }

  _triggerExplosion(cx, cy, radius = 185, maxDamage = 130) {
    window.soundEngine.playExplosion();
    this.screenShake = 16;

    this.shockwaves.push({
      x: cx,
      y: cy,
      radius: 18,
      maxRadius: radius,
      alpha: 1.0,
      color: '#f97316'
    });

    this._spawnParticles(cx, cy, '#f97316', 32, 11);
    this._spawnParticles(cx, cy, '#fde047', 20, 8);
    this._spawnParticles(cx, cy, '#334155', 16, 6);

    this._applyRadialForce(cx, cy, radius, maxDamage, 0.14);
  }

  _setupCollisionHandler() {
    Events.on(this.engine, 'collisionStart', (event) => {
      // 스테이지 스폰 직후 600ms 동안은 물리 안정화를 위해 데미지 무시
      if (performance.now() - this.levelStartTime < 600) return;

      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const speedA = Vector.magnitude(bodyA.velocity || { x: 0, y: 0 });
        const speedB = Vector.magnitude(bodyB.velocity || { x: 0, y: 0 });
        const relVel = Vector.sub(
          bodyA.velocity || { x: 0, y: 0 },
          bodyB.velocity || { x: 0, y: 0 }
        );
        const impactSpeed = Math.max(Vector.magnitude(relVel), speedA, speedB);

        if (impactSpeed < 1.55) return;

        this.lastHitTime = performance.now();

        this._handleCollisionPair(bodyA, bodyB, impactSpeed);
        this._handleCollisionPair(bodyB, bodyA, impactSpeed);
      });
    });
  }

  _handleCollisionPair(target, other, impactSpeed) {
    if (!target.gameData) return;

    // 계란 폭탄 충돌 폭발
    if (target.gameData.kind === 'egg' || (other.gameData && other.gameData.kind === 'egg')) {
      const egg = target.gameData.kind === 'egg' ? target : other;
      if (egg.gameData && !egg.gameData.hasExploded) {
        egg.gameData.hasExploded = true;
        const ep = egg.position;
        window.soundEngine.playExplosion();
        this._triggerExplosion(ep.x, ep.y, 175, 125);
        this._addFloatingText(ep.x, ep.y - 30, '🍳 에그 쾅!', '#fef08a');
        World.remove(this.world, egg);
        this.activeEggs = this.activeEggs.filter((e) => e !== egg);
      }
      return;
    }

    if (target.gameData.kind === 'bird') {
      target.gameData.hasCollided = true;
      return;
    }

    // 🌟 스프링 점프대 기믹: 접촉한 오브젝트를 상공으로 강력하게 튕겨냄!
    if (target.gameData.material === 'spring') {
      target.gameData.compressTimer = 1.0;
      const currentVx = other.velocity.x;
      const bounceVx = Math.abs(currentVx) > 2 ? currentVx * 1.35 : (other.position.x < target.position.x ? 7 : -7);
      const bounceVy = -Math.max(18.5, Math.abs(other.velocity.y) * 1.6);
      Body.setVelocity(other, { x: bounceVx, y: bounceVy });
      window.soundEngine.playSpringBounce();
      this.shockwaves.push({
        x: target.position.x,
        y: target.position.y - 10,
        radius: 12,
        maxRadius: 75,
        alpha: 1.0,
        color: '#ef4444'
      });
      this._spawnParticles(target.position.x, target.position.y - 10, '#ef4444', 12, 6);
      this._addFloatingText(target.position.x, target.position.y - 30, 'BOING! 🚀', '#f87171');
      return;
    }

    // 🌟 시공간 워프 포털(Portal): 입구 통과 시 출구 포털로 순간이동!
    if (target.gameData.material === 'portal_in') {
      const now = performance.now();
      if (!other.lastWarpTime || now - other.lastWarpTime > 800) {
        other.lastWarpTime = now;
        const outPortal = this.blocks.find((b) => b.gameData && b.gameData.material === 'portal_out');
        if (outPortal) {
          Body.setPosition(other, {
            x: outPortal.position.x + 36,
            y: outPortal.position.y
          });
          const curSpeed = Vector.magnitude(other.velocity);
          const launchSpd = Math.max(14, curSpeed * 1.15);
          Body.setVelocity(other, {
            x: launchSpd,
            y: other.velocity.y * 0.7
          });
          window.soundEngine.playPortalWarp();
          this.shockwaves.push({
            x: target.position.x,
            y: target.position.y,
            radius: 14,
            maxRadius: 85,
            alpha: 1.0,
            color: '#38bdf8'
          });
          this.shockwaves.push({
            x: outPortal.position.x,
            y: outPortal.position.y,
            radius: 14,
            maxRadius: 85,
            alpha: 1.0,
            color: '#f97316'
          });
          this._spawnParticles(target.position.x, target.position.y, '#38bdf8', 16, 6);
          this._spawnParticles(outPortal.position.x, outPortal.position.y, '#f97316', 16, 6);
          this._addFloatingText(outPortal.position.x, outPortal.position.y - 35, 'WARP! 🌀', '#38bdf8');
        }
      }
      return;
    }
    if (target.gameData.material === 'portal_out') return;

    // 🌟 풍선 비행 돼지: 충격을 받으면 풍선이 펑 터지며 아래로 추락!
    if (target.gameData.kind === 'pig' && target.gameData.role === 'balloon_pig') {
      if (target.gameData.isFloating) {
        target.gameData.isFloating = false;
        Body.setStatic(target, false);
        window.soundEngine.playBalloonPop();
        this._spawnParticles(target.position.x, target.position.y - 35, '#f43f5e', 18, 6);
        this._addFloatingText(target.position.x, target.position.y - 45, '🎈 풍선 펑!', '#f43f5e');
      }
    }

    let multiplier = 3.2;
    if (other.gameData && other.gameData.kind === 'bird') {
      const bType = other.gameData.birdType;
      multiplier = 4.5;
      if (bType === 'big') {
        multiplier = 18.0; // 테렌스의 압도적인 파쇄력
      } else if (target.gameData.kind === 'block') {
        const mat = target.gameData.material;
        if (bType === 'yellow' && mat === 'wood') {
          multiplier = other.gameData.boosted ? 13.0 : 8.5;
        } else if (bType === 'blue' && (mat === 'ice' || mat === 'crystal')) {
          multiplier = 12.0; // 블루는 얼음과 크리스탈에 초특화!
        } else if (bType === 'black' && (mat === 'stone' || mat === 'steel')) {
          multiplier = 10.5; // 폭탄새는 돌과 강철에 초특화!
        }
      } else if (target.gameData.kind === 'pig') {
        multiplier = 7.5;
      }
    } else if (other.gameData && other.gameData.kind === 'block') {
      if (other.gameData.material === 'boulder') {
        multiplier = 14.0; // 굴러가는 바위 궤멸 충돌
      } else {
        multiplier = other.gameData.material === 'stone' || other.gameData.material === 'steel' ? 4.5 : 2.8;
      }
    }

    const damage = impactSpeed * multiplier;
    if (damage >= 4.5) {
      this._damageBody(target, damage);
    }
  }

  _damageBody(body, damage) {
    const data = body.gameData;
    if (!data || data.destroyed) return;

    data.hp -= damage;
    const pos = body.position;

    if (data.kind === 'block') {
      const matProp = MATERIAL_PROPS[data.material] || MATERIAL_PROPS.wood;
      if (data.hp <= 0) {
        data.destroyed = true;
        
        // 머티리얼별 특수 사운드 및 효과
        if (data.material === 'crystal') {
          window.soundEngine.playGlassShatter();
          this._spawnParticles(pos.x, pos.y, '#f0abfc', 18, 7);
          this._spawnParticles(pos.x, pos.y, '#c084fc', 14, 5);
          this._addFloatingText(pos.x, pos.y - 25, '💎 크리스탈 산산조각!', '#f0abfc');
        } else if (data.material === 'golden_egg') {
          window.soundEngine.playGoldenEgg();
          this._spawnParticles(pos.x, pos.y, '#fde047', 30, 9);
          this._spawnParticles(pos.x, pos.y, '#f59e0b', 20, 6);
          this._addFloatingText(pos.x, pos.y - 30, '🌟 황금알 보너스 +10,000!', '#fde047');
        } else if (data.material === 'balloon') {
          window.soundEngine.playBalloonPop();
          this._spawnParticles(pos.x, pos.y, '#f43f5e', 14, 6);
        } else {
          window.soundEngine.playImpact(data.material, 1.0, true);
          this._spawnParticles(pos.x, pos.y, matProp.fill, 14, 6);
        }

        this._addScore(data.score, pos.x, pos.y, '#fef08a');
        World.remove(this.world, body);
        this.blocks = this.blocks.filter((b) => b !== body);

        if (data.material === 'tnt') {
          this._addFloatingText(pos.x, pos.y - 25, '🧨 TNT 폭발!', '#ef4444');
          this._triggerExplosion(pos.x, pos.y, 185, 125);
        }
      } else if (damage > 7) {
        window.soundEngine.playImpact(data.material, Math.min(1, damage / 30), false);
        this._spawnParticles(pos.x, pos.y, matProp.fill, 4, 3);
      }
    } else if (data.kind === 'pig') {
      if (data.hp <= 0) {
        data.destroyed = true;
        window.soundEngine.playPigDestroy();

        if (data.role === 'golem') {
          this._spawnParticles(pos.x, pos.y, '#64748b', 25, 8);
          this._spawnParticles(pos.x, pos.y, '#4ade80', 20, 7);
          this._addFloatingText(pos.x, pos.y - 30, '🗿 골렘 돼지 격파! +25,000', '#94a3b8');
        } else if (data.role === 'wizard') {
          this._spawnParticles(pos.x, pos.y, '#c084fc', 25, 8);
          this._spawnParticles(pos.x, pos.y, '#4ade80', 20, 7);
          this._addFloatingText(pos.x, pos.y - 30, '🔮 마법사 돼지 소탕! +14,000', '#c084fc');
        } else if (data.role === 'astronaut') {
          this._spawnParticles(pos.x, pos.y, '#38bdf8', 25, 7);
          this._spawnParticles(pos.x, pos.y, '#4ade80', 20, 7);
          this._addFloatingText(pos.x, pos.y - 30, '👨‍🚀 우주비행사 돼지 격퇴!', '#38bdf8');
        } else if (data.role === 'balloon_pig') {
          this._spawnParticles(pos.x, pos.y, '#f43f5e', 18, 6);
          this._spawnParticles(pos.x, pos.y, '#4ade80', 20, 7);
          this._addFloatingText(pos.x, pos.y - 30, '🎈 풍선 돼지 격추!', '#4ade80');
        } else {
          this._spawnParticles(pos.x, pos.y, '#4ade80', 22, 7);
          this._spawnParticles(pos.x, pos.y, '#ffffff', 12, 5);
        }

        this._addScore(data.score, pos.x, pos.y - 10, '#4ade80');
        World.remove(this.world, body);
        this.pigs = this.pigs.filter((p) => p !== body);
        this._updateHud();
      } else if (damage > 6) {
        window.soundEngine.playPigOink();
      }
    }
  }

  _addScore(points, x, y, color = '#fde047') {
    this.score += points;
    this._addFloatingText(x, y, `+${points.toLocaleString()}`, color);
    this._updateHud();
  }

  _addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.4
    });
  }

  _spawnParticles(x, y, color, count = 12, maxSpeed = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * maxSpeed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1.0
      });
    }
  }

  _updateHud() {
    const level = window.LEVELS[this.currentLevelIdx];
    document.getElementById('hudStageTitle').textContent = level.title;
    document.getElementById('hudSubtitle').textContent = level.subtitle;
    document.getElementById('hudScore').textContent = this.score.toLocaleString();
    document.getElementById('hudPigsLeft').textContent = `${this.pigs.length}마리`;

    // 현재 버드 스킬 힌트 표시
    const skillBanner = document.getElementById('hudSkillHint');
    const activeType =
      this.currentBird?.type ||
      (this.activeBirds[0] && this.activeBirds[0].gameData?.birdType);
    if (activeType && window.BIRD_INFO[activeType]) {
      const info = window.BIRD_INFO[activeType];
      skillBanner.textContent = `🐦 ${info.name} — ${info.skillDesc}`;
    } else {
      skillBanner.textContent = '🎯 새총을 뒤로 당겨 조준하고 발사하세요!';
    }
  }

  /**
   * 매 프레임 물리 업데이트 및 턴 종료 판정
   */
  _update(dt) {
    Engine.update(this.engine, Math.min(dt, 16.667));

    // 구름 이동
    this.clouds.forEach((c) => {
      c.x += c.speed;
      if (c.x > WORLD_W + 120) c.x = -120;
    });

    // 화면 흔들림 감쇠
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.4) this.screenShake = 0;
    }

    // 카메라 부드러운 보간
    this.cameraOffsetX += (this.targetCameraX - this.cameraOffsetX) * 0.08;

    // 풍선 돼지 공중 부유 흔들림 (격추 전까지)
    const animNow = performance.now();
    this.pigs.forEach((pigBody) => {
      const pData = pigBody.gameData;
      if (pData && pData.isFloating && pData.originY !== undefined) {
        const floatY = pData.originY + Math.sin(animNow * 0.003 + pigBody.id) * 7.5;
        Body.setPosition(pigBody, { x: pigBody.position.x, y: floatY });
      }
    });

    // 스프링 압축 복원 및 포털 에너지 소용돌이 회전
    this.blocks.forEach((b) => {
      const bData = b.gameData;
      if (!bData) return;
      if (bData.material === 'spring' && bData.compressTimer > 0) {
        bData.compressTimer = Math.max(0, bData.compressTimer - dt * 0.006);
      } else if (bData.material === 'portal_in' || bData.material === 'portal_out') {
        bData.spin = (bData.spin || 0) + 0.045;
      }
    });

    // 화면 밖으로 떨어진 돼지/블록 처리
    [...this.pigs].forEach((pigBody) => {
      if (pigBody.position.x > WORLD_W + 90 || pigBody.position.y > GROUND_Y + 50) {
        this._damageBody(pigBody, 999);
      }
    });

    // 비행 중인 버드 궤적 기록
    if (this.state === 'FLYING' && this.activeBirds.length > 0) {
      const leadBird = this.activeBirds[0];
      if (!leadBird.gameData.hasCollided && this.flightTrail.length < 75) {
        const lastPt = this.flightTrail[this.flightTrail.length - 1];
        if (!lastPt || Math.hypot(leadBird.position.x - lastPt.x, leadBird.position.y - lastPt.y) > 18) {
          this.flightTrail.push({
            x: leadBird.position.x,
            y: leadBird.position.y
          });
        }
      }
    }

    // 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.alpha -= 0.024;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // 충격파 업데이트
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.22;
      s.alpha -= 0.045;
      if (s.alpha <= 0) this.shockwaves.splice(i, 1);
    }

    // 플로팅 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // 날씨/환경 파티클 업데이트 (세로 모드 확장 하늘 고려)
    const skyTopLimit = -(this.portraitOffsetY || 0) - 50;
    const worldWidth = this.virtualW || WORLD_W;
    this.weatherParticles.forEach((wp) => {
      wp.x += wp.vx;
      wp.y += wp.vy;
      if (wp.vy < 0 && wp.y < skyTopLimit) wp.y = GROUND_Y + 10;
      if (wp.vy > 0 && wp.y > GROUND_Y + 20) wp.y = skyTopLimit;
      if (wp.vx > 0 && wp.x > worldWidth + 50) wp.x = -40;
      if (wp.vx < 0 && wp.x < -50) wp.x = worldWidth + 40;
      wp.phase = (wp.phase || 0) + 0.04;
    });

    // 활성 계란(Egg) 업데이트 및 지면 충돌 검사
    for (let i = this.activeEggs.length - 1; i >= 0; i--) {
      const egg = this.activeEggs[i];
      if (egg.position.y > GROUND_Y - 5 || egg.position.x > WORLD_W + 100 || egg.position.x < -50) {
        if (!egg.gameData.hasExploded) {
          egg.gameData.hasExploded = true;
          window.soundEngine.playExplosion();
          this._triggerExplosion(egg.position.x, Math.min(GROUND_Y - 10, egg.position.y), 175, 125);
          this._addFloatingText(egg.position.x, egg.position.y - 25, '🍳 에그 쾅!', '#fef08a');
        }
        World.remove(this.world, egg);
        this.activeEggs.splice(i, 1);
      }
    }

    // 비행 후 턴 종료 및 승패 체크
    if (this.state === 'FLYING') {
      const now = performance.now();
      const flightElapsed = now - this.launchTime;

      // 모든 활성 버드와 구조물이 거의 정지했는지 확인
      const allBodies = [...this.activeBirds, ...this.blocks, ...this.pigs];
      const isSettled = allBodies.every((b) => {
        if (b.position.x > WORLD_W + 40 || b.position.x < -60) return true;
        return Vector.magnitude(b.velocity) < 0.35 && Math.abs(b.angularVelocity) < 0.03;
      });

      const birdsOutOfBounds = this.activeBirds.every(
        (b) => b.position.x > WORLD_W + 40 || b.position.x < -60 || b.position.y > GROUND_Y + 20
      );

      if (
        (flightElapsed > 900 && isSettled) ||
        birdsOutOfBounds ||
        flightElapsed > 6200 ||
        (this.pigs.length === 0 && flightElapsed > 1200 && now - this.lastHitTime > 700)
      ) {
        this._finishTurn();
      }
    }
  }

  _finishTurn() {
    // 날아갔던 버드 제거
    this.activeBirds.forEach((b) => World.remove(this.world, b));
    this.activeBirds = [];

    if (this.pigs.length === 0) {
      // 승리! 남은 버드 수만큼 보너스 점수 부여
      const unusedCount = this.birdQueue.length + (this.currentBird ? 1 : 0);
      if (unusedCount > 0) {
        const bonus = unusedCount * 10000;
        this.score += bonus;
        this._addFloatingText(SLING_X + 60, SLING_Y - 60, `🎉 남은 새 보너스 +${bonus.toLocaleString()}!`, '#fde047');
        this._updateHud();
      }
      this.state = 'RESULT';
      this._showResultModal(true);
      return;
    }

    if (this.birdQueue.length > 0) {
      this._prepareNextBird();
    } else {
      // 남은 새가 없는데 돼지가 살아있다면 실패
      this.state = 'RESULT';
      this._showResultModal(false);
    }
  }

  _showResultModal(isClear) {
    const level = window.LEVELS[this.currentLevelIdx];
    const modal = document.getElementById('resultModal');
    const titleEl = document.getElementById('resultTitle');
    const subEl = document.getElementById('resultSubtitle');
    const starsEl = document.getElementById('resultStars');
    const scoreEl = document.getElementById('resultScore');
    const nextBtn = document.getElementById('btnModalNext');

    if (isClear) {
      window.soundEngine.playVictory();
      let stars = 1;
      if (this.score >= level.threeStarScore) stars = 3;
      else if (this.score >= level.twoStarScore) stars = 2;

      // 진행도 저장
      const stageId = level.id;
      this.progress.stars[stageId] = Math.max(this.progress.stars[stageId] || 0, stars);
      this.progress.highScores[stageId] = Math.max(this.progress.highScores[stageId] || 0, this.score);
      if (stageId >= this.progress.unlockedStage && stageId < window.LEVELS.length) {
        this.progress.unlockedStage = stageId + 1;
      }
      this._saveProgress();

      titleEl.textContent = '🎉 STAGE CLEAR!';
      titleEl.className = 'modal-title win';
      subEl.textContent = `${level.title}의 모든 돼지를 소탕했습니다!`;
      starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      scoreEl.textContent = `최종 점수: ${this.score.toLocaleString()}점`;
      nextBtn.style.display = 'inline-flex';
    } else {
      window.soundEngine.playFail();
      titleEl.textContent = '🐷 STAGE FAILED...';
      titleEl.className = 'modal-title lose';
      subEl.textContent = '초록 돼지들이 비웃고 있습니다! 다시 도전해 보세요!';
      starsEl.textContent = '☆☆☆';
      scoreEl.textContent = `획득 점수: ${this.score.toLocaleString()}점`;
      nextBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
  }

  _renderStageSelectModal() {
    const grid = document.getElementById('stageGrid');
    grid.innerHTML = '';

    window.LEVELS.forEach((lv, idx) => {
      const unlocked = lv.id <= (this.progress.unlockedStage || 1);
      const stars = this.progress.stars[lv.id] || 0;
      const high = this.progress.highScores[lv.id] || 0;

      const card = document.createElement('button');
      card.className = `stage-card ${idx === this.currentLevelIdx ? 'active' : ''}`;
      card.innerHTML = `
        <div class="stage-num">STAGE ${lv.id}</div>
        <div class="stage-name">${lv.title.split(':')[1] || lv.title}</div>
        <div class="stage-badge-tag">${lv.badge || '스페셜'}</div>
        <div class="stage-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="stage-high">최고: ${high.toLocaleString()}점</div>
      `;
      card.addEventListener('click', () => {
        window.soundEngine.playUiClick();
        this.loadLevel(idx);
      });
      grid.appendChild(card);
    });
  }

  /**
   * 캔버스 렌더링 루프
   */
  _draw() {
    const ctx = this.ctx;
    const level = window.LEVELS[this.currentLevelIdx];

    ctx.save();

    // 화면 흔들림 및 카메라 이동 적용
    const shakeX = this.screenShake ? (Math.random() - 0.5) * this.screenShake : 0;
    const shakeY = this.screenShake ? (Math.random() - 0.5) * this.screenShake : 0;

    // 1. 하늘 및 패럴랙스 배경 그리기 (6대 테마별 고유 환경)
    this._drawBackground(ctx, level);

    ctx.translate(this.cameraOffsetX + shakeX, (this.portraitOffsetY || 0) + shakeY);

    // 2. 지면 그리기 (6대 테마별 고유 바이옴)
    this._drawGround(ctx, level);

    // 3. 슬링샷 뒷 기둥 그리기
    this._drawSlingshotBack(ctx);

    // 4. 대기 중인 버드 줄 서기 렌더링
    this._drawBirdQueue(ctx);

    // 5. 조준 궤적 미리보기 & 비행 궤적 점 그리기
    this._drawTrajectories(ctx);

    // 6. 슬링샷에 장전된 버드 및 고무줄 그리기
    if (this.currentBird && (this.state === 'AIMING' || this.state === 'DRAGGING')) {
      this._drawRubberBand(ctx, SLING_X + 12, SLING_Y - 4, this.dragPos.x, this.dragPos.y);
      this._drawBirdSprite(
        ctx,
        this.dragPos.x,
        this.dragPos.y,
        window.BIRD_INFO[this.currentBird.type].radius,
        0,
        this.currentBird.type,
        false
      );
      this._drawRubberBand(ctx, SLING_X - 14, SLING_Y - 8, this.dragPos.x, this.dragPos.y);
    }

    // 7. 슬링샷 앞 기둥 그리기
    this._drawSlingshotFront(ctx);

    // 8. 구조물 블록 그리기
    this.blocks.forEach((b) => this._drawBlock(ctx, b));

    // 9. 악당 돼지 그리기
    this.pigs.forEach((p) => this._drawPig(ctx, p));

    // 10. 비행 중인 버드 그리기
    this.activeBirds.forEach((b) => {
      this._drawBirdSprite(
        ctx,
        b.position.x,
        b.position.y,
        b.gameData.radius,
        b.angle,
        b.gameData.birdType,
        true
      );
    });

    // 11. 충격파, 파티클, 플로팅 스코어 그리기
    this._drawEffects(ctx);

    ctx.restore();
  }

  _drawBackground(ctx, level) {
    const theme = (level && level.theme) || 'plains';
    const bgW = this.virtualW || WORLD_W;
    const bgH = this.virtualH || WORLD_H;
    const offsetY = this.portraitOffsetY || 0;

    // 하늘 베이스 그라디언트 (0부터 지면 위치 GROUND_Y + offsetY까지)
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + offsetY);

    if (theme === 'desert') {
      // 1. 사막 협곡: 석양 레드오렌지 -> 황금 노랑
      grad.addColorStop(0, '#7c2d12');
      grad.addColorStop(0.4, '#c2410c');
      grad.addColorStop(0.75, '#ea580c');
      grad.addColorStop(1, '#fde047');
    } else if (theme === 'glacier') {
      // 2. 극지방 빙하: 청록/보라 오로라 밤하늘
      grad.addColorStop(0, '#042f2e');
      grad.addColorStop(0.45, '#0f766e');
      grad.addColorStop(0.8, '#0284c7');
      grad.addColorStop(1, '#38bdf8');
    } else if (theme === 'volcano') {
      // 3. 마그마 화산: 핏빛 붉은 하늘과 화산재
      grad.addColorStop(0, '#450a0a');
      grad.addColorStop(0.4, '#7f1d1d');
      grad.addColorStop(0.75, '#b91c1c');
      grad.addColorStop(1, '#ea580c');
    } else if (theme === 'royal') {
      // 4. 달빛 왕궁: 딥 바이올렛 & 네이비 밤하늘
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.45, '#1e1b4b');
      grad.addColorStop(0.85, '#312e81');
      grad.addColorStop(1, '#4338ca');
    } else if (theme === 'space') {
      // 5. 코스믹 우주: 딥 스페이스 & 성운 (Nebula)
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.45, '#111827');
      grad.addColorStop(0.8, '#1e1b4b');
      grad.addColorStop(1, '#3b0764');
    } else {
      // 6. 에메랄드 초원: 화창한 주간 푸른 하늘
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.65, '#38bdf8');
      grad.addColorStop(1, '#bae6fd');
    }

    // 1. 전체 화면 하늘 채우기 (세로 확장 영역 전체 커버)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, bgW, bgH);

    // 2. 테마별 원경 실루엣 렌더링 (지면 오프셋에 맞춰 정렬)
    ctx.save();
    ctx.translate(0, offsetY);

    if (theme === 'desert') {
      // 거대 석양 태양
      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.beginPath();
      ctx.arc(380, 260, 120, 0, Math.PI * 2);
      ctx.fill();

      // 협곡 원경 절벽 (붉은 메사/뷰트)
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.moveTo(-100, GROUND_Y);
      ctx.lineTo(120, 310);
      ctx.lineTo(260, 310);
      ctx.lineTo(340, 380);
      ctx.lineTo(540, 380);
      ctx.lineTo(620, 270);
      ctx.lineTo(820, 270);
      ctx.lineTo(900, 360);
      ctx.lineTo(1120, 360);
      ctx.lineTo(1220, 300);
      ctx.lineTo(1380, 300);
      ctx.lineTo(1380, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // 선인장 실루엣
      ctx.fillStyle = '#431407';
      [220, 520, 920, 1160].forEach((cx) => {
        ctx.fillRect(cx, GROUND_Y - 48, 8, 48);
        ctx.fillRect(cx - 10, GROUND_Y - 36, 10, 6);
        ctx.fillRect(cx - 10, GROUND_Y - 48, 6, 18);
        ctx.fillRect(cx + 8, GROUND_Y - 30, 10, 6);
        ctx.fillRect(cx + 12, GROUND_Y - 42, 6, 18);
      });

    } else if (theme === 'glacier') {
      // 반짝이는 오로라 커튼 리본
      ctx.save();
      const auroraGrad = ctx.createLinearGradient(0, 40, WORLD_W, 280);
      auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
      auroraGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
      auroraGrad.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.bezierCurveTo(300, 80, 700, 240, WORLD_W, 110);
      ctx.lineTo(WORLD_W, 260);
      ctx.bezierCurveTo(700, 340, 300, 190, 0, 290);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 뾰족한 빙산(Iceberg)과 설산 실루엣
      ctx.fillStyle = '#0e7490';
      ctx.beginPath();
      ctx.moveTo(-50, GROUND_Y);
      ctx.lineTo(160, 280);
      ctx.lineTo(320, GROUND_Y);
      ctx.lineTo(540, 230);
      ctx.lineTo(760, GROUND_Y);
      ctx.lineTo(980, 260);
      ctx.lineTo(1180, GROUND_Y);
      ctx.lineTo(1350, 290);
      ctx.lineTo(1380, GROUND_Y);
      ctx.closePath();
      ctx.fill();

    } else if (theme === 'volcano') {
      // 화산 연기 구름 & 분화구
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-100, GROUND_Y);
      ctx.lineTo(240, 240);
      ctx.lineTo(320, 240);
      ctx.lineTo(600, GROUND_Y);
      ctx.lineTo(820, 280);
      ctx.lineTo(900, 280);
      ctx.lineTo(1300, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // 분화구에서 솟는 용암 빛
      ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
      ctx.beginPath();
      ctx.arc(280, 240, 50, Math.PI, 0);
      ctx.fill();

    } else if (theme === 'royal') {
      // 거대한 보름달 (Full Moon)
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(920, 150, 68, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 성채 실루엣 & 첨탑
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-50, GROUND_Y);
      ctx.lineTo(120, 360);
      ctx.lineTo(160, 320);
      ctx.lineTo(200, 360);
      ctx.lineTo(440, 360);
      ctx.lineTo(480, 280);
      ctx.lineTo(520, 360);
      ctx.lineTo(760, 360);
      ctx.lineTo(800, 310);
      ctx.lineTo(840, 360);
      ctx.lineTo(1350, 360);
      ctx.lineTo(1350, GROUND_Y);
      ctx.closePath();
      ctx.fill();

    } else if (theme === 'space') {
      // 성운 빛무리 (Cosmic Nebula)
      ctx.save();
      const nebGrad = ctx.createRadialGradient(420, 200, 30, 420, 200, 280);
      nebGrad.addColorStop(0, 'rgba(217, 70, 239, 0.35)');
      nebGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebGrad;
      ctx.beginPath();
      ctx.arc(420, 200, 280, 0, Math.PI * 2);
      ctx.fill();

      // 거대 고리 행성
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(200, 160, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(200, 160, 95, 20, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 우주 배경의 부유 소행성 지형
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(260, GROUND_Y + 50, 240, Math.PI, 0);
      ctx.arc(740, GROUND_Y + 70, 310, Math.PI, 0);
      ctx.arc(1140, GROUND_Y + 40, 260, Math.PI, 0);
      ctx.fill();

    } else {
      // 둥실둥실 구름
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.clouds.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.arc(25, -8, 34, 0, Math.PI * 2);
        ctx.arc(55, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 싱그러운 푸른 언덕 실루엣
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(280, GROUND_Y + 40, 220, Math.PI, 0);
      ctx.arc(720, GROUND_Y + 60, 290, Math.PI, 0);
      ctx.arc(1120, GROUND_Y + 30, 240, Math.PI, 0);
      ctx.fill();

      // 미니 풍차 실루엣
      ctx.fillStyle = '#15803d';
      ctx.fillRect(720, GROUND_Y - 40, 16, 40);
      ctx.beginPath();
      ctx.arc(728, GROUND_Y - 40, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawGround(ctx, level) {
    const theme = (level && level.theme) || 'plains';
    const groundDepth = Math.max(WORLD_H - GROUND_Y + 120, (this.virtualH || WORLD_H) - GROUND_Y + 1400);
    const groundW = (this.virtualW || WORLD_W) + 1200;

    if (theme === 'desert') {
      // 사막: 붉은 황토 모래와 적갈색 암반
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-400, GROUND_Y, groundW, 18);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-400, GROUND_Y + 18, groundW, 6);
    } else if (theme === 'glacier') {
      // 빙하: 투명한 청록색 빙판 지층 + 하얀 눈 층
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#f0fdfa';
      ctx.fillRect(-400, GROUND_Y, groundW, 20);
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(-400, GROUND_Y + 20, groundW, 6);
    } else if (theme === 'volcano') {
      // 화산: 검은 현무암 + 붉게 빛나는 용암 균열선
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-400, GROUND_Y, groundW, 18);
      // 용암 균열선 발광
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-100, GROUND_Y + 8);
      for (let x = -100; x < WORLD_W + 400; x += 110) {
        ctx.lineTo(x + 50, GROUND_Y + (Math.sin(x) > 0 ? 12 : 4));
        ctx.lineTo(x + 110, GROUND_Y + 8);
      }
      ctx.stroke();
    } else if (theme === 'royal') {
      // 왕궁: 보랏빛 왕실 잔디 + 대리석 석조 타일
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-400, GROUND_Y, groundW, 18);
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(-400, GROUND_Y + 18, groundW, 6);
    } else if (theme === 'space') {
      // 우주: 달 표면 암석 + 크레이터
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-400, GROUND_Y, groundW, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-400, GROUND_Y + 18, groundW, 6);
    } else {
      // 초원: 싱그러운 녹색 잔디 + 흙 지면 + 야생화 꽃밭
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-400, GROUND_Y, groundW, groundDepth);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-400, GROUND_Y, groundW, 18);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-400, GROUND_Y + 18, groundW, 6);

      // 잔디 위 점점이 핀 들꽃
      ctx.fillStyle = '#fef08a';
      for (let fx = -200; fx < WORLD_W + 400; fx += 140) {
        ctx.beginPath();
        ctx.arc(fx, GROUND_Y + 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawSlingshotBack(ctx) {
    ctx.save();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    // 기둥 몸통
    ctx.beginPath();
    ctx.moveTo(SLING_X, GROUND_Y);
    ctx.lineTo(SLING_X, SLING_Y + 32);
    ctx.stroke();

    // 우측 뒤 갈래
    ctx.beginPath();
    ctx.moveTo(SLING_X, SLING_Y + 32);
    ctx.lineTo(SLING_X + 14, SLING_Y - 6);
    ctx.stroke();
    ctx.restore();
  }

  _drawSlingshotFront(ctx) {
    ctx.save();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';

    // 좌측 앞 갈래
    ctx.beginPath();
    ctx.moveTo(SLING_X, SLING_Y + 32);
    ctx.lineTo(SLING_X - 15, SLING_Y - 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawRubberBand(ctx, fromX, fromY, toX, toY) {
    ctx.save();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();
  }

  _drawBirdQueue(ctx) {
    this.birdQueue.forEach((type, idx) => {
      const r = window.BIRD_INFO[type].radius;
      const qx = SLING_X - 70 - idx * 48;
      const bounce = Math.abs(Math.sin(performance.now() * 0.004 + idx)) * 6;
      const qy = GROUND_Y - r - bounce;
      this._drawBirdSprite(ctx, qx, qy, r, 0, type, false);
    });
  }

  _drawTrajectories(ctx) {
    // 1. 당기는 중일 때 예상 포물선 궤적 가이드라인 표시
    if (this.state === 'DRAGGING') {
      const dx = SLING_X - this.dragPos.x;
      const dy = SLING_Y - this.dragPos.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 18) {
        const vx = dx * LAUNCH_POWER;
        const vy = dy * LAUNCH_POWER;
        const level = window.LEVELS[this.currentLevelIdx];
        const gravityPerStep = (level && level.gravityY !== undefined ? level.gravityY : 1.0) * 0.28;

        ctx.save();
        for (let step = 2; step <= 32; step += 2) {
          const px = this.dragPos.x + vx * step * 0.96;
          const py = this.dragPos.y + vy * step + 0.5 * gravityPerStep * step * step;
          if (py > GROUND_Y) break;

          const alpha = Math.max(0.12, 0.85 - step / 38);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 2. 실제 날아간 버드의 흰색 구름 궤적 점
    ctx.save();
    this.flightTrail.forEach((pt, idx) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx % 2 === 0 ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  _drawBirdSprite(ctx, x, y, r, angle, type, isFlying) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (type === 'yellow') {
      // 척(노랑새) - 삼각형에 가까운 날렵한 형태
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.15);
      ctx.quadraticCurveTo(r * 1.15, r * 0.85, 0, r);
      ctx.quadraticCurveTo(-r * 1.15, r * 0.85, 0, -r * 1.15);
      ctx.fill();
      ctx.stroke();

      // 머리 깃털
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.15);
      ctx.lineTo(-6, -r * 1.55);
      ctx.stroke();
    } else if (type === 'black') {
      // 밤(폭탄새) - 도화선이 달린 검은 폭탄 형태
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(4, -r - 12);
      ctx.stroke();
      // 도화선 불꽃
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(4, -r - 13, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 이마의 노란 점
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -r * 0.45, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'white') {
      // 마틸다(화이트) - 우아한 흰색 달걀형 타원 바디
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 머리 위 볏 깃털
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -r * 1.25, 4, 0, Math.PI * 2);
      ctx.fill();

      // 분홍 볼터치
      ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
      ctx.beginPath();
      ctx.arc(-r * 0.38, r * 0.22, 5, 0, Math.PI * 2);
      ctx.arc(r * 0.38, r * 0.22, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'big') {
      // 테렌스(거대 버드) - 묵직한 딥 버건디 레드 바디 & 흉터
      ctx.fillStyle = '#881337';
      ctx.strokeStyle = '#4c0519';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 어두운 뺨 반점 흉터
      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.arc(-r * 0.45, r * 0.2, 5.5, 0, Math.PI * 2);
      ctx.arc(-r * 0.35, r * 0.42, 4, 0, Math.PI * 2);
      ctx.fill();

      // 밝은 배 부분
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.6, 0, Math.PI);
      ctx.fill();
    } else {
      // 레드 & 블루 원형 바디
      ctx.fillStyle = type === 'blue' ? '#38bdf8' : '#ef4444';
      ctx.strokeStyle = type === 'blue' ? '#0369a1' : '#991b1b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 밝은 배 부분
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.62, 0, Math.PI);
      ctx.fill();
    }

    // 눈
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.22, -r * 0.12, r * 0.24, 0, Math.PI * 2);
    ctx.arc(r * 0.56, -r * 0.12, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.28, -r * 0.12, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.60, -r * 0.12, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 화난 눈썹 (테렌스는 초대형 일자 흑단 눈썹)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = type === 'big' ? 6 : 3.2;
    ctx.beginPath();
    if (type === 'big') {
      ctx.moveTo(-r * 0.12, -r * 0.35);
      ctx.lineTo(r * 0.82, -r * 0.35);
    } else {
      ctx.moveTo(0, -r * 0.42);
      ctx.lineTo(r * 0.42, -r * 0.25);
      ctx.lineTo(r * 0.78, -r * 0.42);
    }
    ctx.stroke();

    // 노란 부리
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(r * 0.38, 0);
    ctx.lineTo(r * 0.95, r * 0.12);
    ctx.lineTo(r * 0.38, r * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawBlock(ctx, body) {
    const data = body.gameData;
    const mat = MATERIAL_PROPS[data.material] || MATERIAL_PROPS.wood;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // 1. 원형 오브젝트 (롤링 바위, 황금알, 풍선)
    if (data.shape === 'circle' || data.material === 'boulder' || data.material === 'golden_egg' || data.material === 'balloon') {
      const r = data.radius || 24;

      if (data.material === 'golden_egg') {
        // 🌟 전설의 황금알 (Golden Egg)
        const eggGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        eggGrad.addColorStop(0, '#fef08a');
        eggGrad.addColorStop(0.5, '#fbbf24');
        eggGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = eggGrad;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.9, r * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 황금 반짝이 십자 별빛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.3 - 7, -r * 0.4);
        ctx.lineTo(-r * 0.3 + 7, -r * 0.4);
        ctx.moveTo(-r * 0.3, -r * 0.4 - 7);
        ctx.lineTo(-r * 0.3, -r * 0.4 + 7);
        ctx.stroke();

      } else if (data.material === 'balloon') {
        // 🌟 공중 부유 풍선 (Balloon)
        const balloonGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        balloonGrad.addColorStop(0, '#fda4af');
        balloonGrad.addColorStop(0.65, '#f43f5e');
        balloonGrad.addColorStop(1, '#9f1239');
        ctx.fillStyle = balloonGrad;
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 풍선 주둥이 매듭
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.moveTo(-4, r - 2);
        ctx.lineTo(4, r - 2);
        ctx.lineTo(0, r + 5);
        ctx.closePath();
        ctx.fill();

        // 광택 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(-r * 0.32, -r * 0.35, r * 0.28, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // 롤링 바위 (Boulder)
        const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#64748b');
        grad.addColorStop(0.65, '#334155');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.arc(-r * 0.3, r * 0.22, r * 0.24, 0, Math.PI * 2);
        ctx.arc(r * 0.28, -r * 0.25, r * 0.2, 0, Math.PI * 2);
        ctx.arc(r * 0.12, r * 0.36, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return;
    }

    const hw = data.w / 2;
    const hh = data.h / 2;

    // 2. 포털 워프 게이트 (Portal In / Portal Out)
    if (data.material === 'portal_in' || data.material === 'portal_out') {
      const isEntrance = data.material === 'portal_in';
      const mainCol = isEntrance ? '#38bdf8' : '#f97316';
      const coreCol = isEntrance ? '#0284c7' : '#ea580c';
      const spin = data.spin || 0;

      // 외곽 네온 광선 링
      ctx.shadowColor = mainCol;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw + 4, hh + 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 중심부 암흑 타원
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();

      // 내부 회전하는 에너지 소용돌이
      ctx.save();
      ctx.rotate(spin);
      ctx.strokeStyle = coreCol;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 0.75, hh * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-spin * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 0.45, hh * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      return;
    }

    // 3. 스프링 점프대 기믹 (Spring)
    if (data.material === 'spring') {
      const comp = (data.compressTimer || 0) * 0.55;
      const springH = data.h * (1 - comp);

      // 하단 강철 받침대
      ctx.fillStyle = '#334155';
      ctx.fillRect(-hw, hh - 6, data.w, 6);

      // 가운데 지그재그 용수철 코일
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw * 0.6, hh - 6);
      ctx.lineTo(hw * 0.5, hh - 6 - springH * 0.3);
      ctx.lineTo(-hw * 0.5, hh - 6 - springH * 0.65);
      ctx.lineTo(hw * 0.4, -hh * (1 - comp) + 6);
      ctx.stroke();

      // 상단 레드 탄성 바운스 플레이트
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-hw, -hh * (1 - comp), data.w, 8);
      ctx.strokeRect(-hw, -hh * (1 - comp), data.w, 8);

      ctx.restore();
      return;
    }

    // 4. 크리스탈 / 강철 / 기본 사각 블록 렌더링
    if (data.material === 'crystal') {
      // 🌟 영롱한 보석 크리스탈 (Crystal)
      const cGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
      cGrad.addColorStop(0, '#f0abfc');
      cGrad.addColorStop(0.5, '#c084fc');
      cGrad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = cGrad;
      ctx.strokeStyle = '#fae8ff';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-hw, -hh, data.w, data.h);
      ctx.strokeRect(-hw, -hh, data.w, data.h);

      // 크리스탈 다이아몬드 각면 반사선
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(0, -hh);
      ctx.lineTo(hw, 0);
      ctx.lineTo(0, hh);
      ctx.closePath();
      ctx.stroke();

    } else if (data.material === 'steel') {
      // 🌟 중장비 강철 철골 빔 (Steel Beam)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.fillRect(-hw, -hh, data.w, data.h);
      ctx.strokeRect(-hw, -hh, data.w, data.h);

      // 강철 모서리 4점 볼트/리벳
      ctx.fillStyle = '#94a3b8';
      [-hw + 6, hw - 6].forEach((rx) => {
        [-hh + 6, hh - 6].forEach((ry) => {
          ctx.beginPath();
          ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // 중앙 H-빔 홈선
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-hw + 8, -hh + 8, data.w - 16, data.h - 16);

    } else {
      // 기본 나무, 얼음, 돌, TNT
      ctx.fillStyle = mat.fill;
      ctx.strokeStyle = mat.stroke;
      ctx.lineWidth = 2.5;
      ctx.fillRect(-hw, -hh, data.w, data.h);
      ctx.strokeRect(-hw, -hh, data.w, data.h);

      if (data.material === 'tnt') {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-hw + 4, -9, data.w - 8, 18);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, 1);
      } else if (data.material === 'wood') {
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-hw + 4, 0);
        ctx.lineTo(hw - 4, 0);
        ctx.stroke();
      }
    }

    // 체력 감소 시 균열(Crack) 표시
    const hpRatio = data.hp / data.maxHp;
    if (hpRatio < 0.72) {
      ctx.strokeStyle = mat.crackColor || '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.4, -hh * 0.5);
      ctx.lineTo(0, 0);
      ctx.lineTo(hw * 0.35, hh * 0.45);
      if (hpRatio < 0.4) {
        ctx.moveTo(hw * 0.3, -hh * 0.4);
        ctx.lineTo(-hw * 0.3, hh * 0.4);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawPig(ctx, body) {
    const data = body.gameData;
    const r = data.radius;
    const hpRatio = data.hp / data.maxHp;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // 🌟 풍선 비행 돼지: 정수리에 달린 실과 헬륨 풍선
    if (data.role === 'balloon_pig') {
      ctx.save();
      // 풍선 실 끈
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(6, -r - 22, 0, -r - 46);
      ctx.stroke();

      // 상공 헬륨 풍선 (격추되지 않았을 때)
      if (data.isFloating) {
        const bgGrad = ctx.createRadialGradient(-5, -r - 54, 3, 0, -r - 46, 18);
        bgGrad.addColorStop(0, '#fda4af');
        bgGrad.addColorStop(0.65, '#f43f5e');
        bgGrad.addColorStop(1, '#9f1239');
        ctx.fillStyle = bgGrad;
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -r - 46, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 풍선 매듭
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.moveTo(-3, -r - 29);
        ctx.lineTo(3, -r - 29);
        ctx.lineTo(0, -r - 24);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 🌟 우주비행사 돼지: 배낭 산소통
    if (data.role === 'astronaut') {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(-r * 1.25, -r * 0.55, r * 0.35, r * 1.1);
      ctx.strokeRect(-r * 1.25, -r * 0.55, r * 0.35, r * 1.1);
    }

    // 귀
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-r * 0.65, -r * 0.65, r * 0.25, 0, Math.PI * 2);
    ctx.arc(r * 0.65, -r * 0.65, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 초록 돼지 몸통 (골렘은 암석 판금 느낌)
    ctx.fillStyle = data.role === 'golem' ? '#22c55e' : '#4ade80';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 멍든 자국
    if (hpRatio < 0.65) {
      ctx.fillStyle = 'rgba(109, 40, 217, 0.42)';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.12, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 🌟 역할별 고유 장비 및 투구
    if (data.role === 'helmet') {
      // 일반 철모
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 1.04, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (data.role === 'king') {
      // 👑 보스 킹피그 황금 왕관
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.78);
      ctx.lineTo(-r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.lineTo(r * 0.45, -r * 1.35);
      ctx.lineTo(r * 0.65, -r * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (data.role === 'golem') {
      // 🗿 거대 골렘 돼지: 암석 투구 + 뾰족한 돌 뿔 2개
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 1.1, Math.PI * 0.95, Math.PI * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 암석 뿔 좌우 2개
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.75);
      ctx.lineTo(-r * 1.05, -r * 1.4);
      ctx.lineTo(-r * 0.35, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.75);
      ctx.lineTo(r * 1.05, -r * 1.4);
      ctx.lineTo(r * 0.35, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (data.role === 'wizard') {
      // 🔮 마법사 돼지: 보라색 고깔모자 + 황금 별
      ctx.fillStyle = '#7c3aed';
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.65);
      ctx.lineTo(0, -r * 1.7);
      ctx.lineTo(r * 0.8, -r * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 모자 챙
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.65, r * 0.95, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 황금 별 장식
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -r * 1.05, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (data.role === 'astronaut') {
      // 👨‍🚀 우주비행사 돼지: 투명 유리 돔 헬멧
      ctx.fillStyle = 'rgba(186, 230, 253, 0.32)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 유리 반사광 초승달
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, -Math.PI * 0.7, -Math.PI * 0.25);
      ctx.stroke();
    }

    // 눈 (골렘은 붉은 눈, 일반은 흰자+검은자)
    if (data.role === 'golem') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.1, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.42, -r * 0.1, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.42, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.1, r * 0.23, 0, Math.PI * 2);
      ctx.arc(r * 0.42, -r * 0.1, r * 0.23, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.42, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 돼지 코 (Snout)
    ctx.fillStyle = '#86efac';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.12, r * 0.36, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 콧구멍
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(-r * 0.13, r * 0.12, r * 0.08, 0, Math.PI * 2);
    ctx.arc(r * 0.13, r * 0.12, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawEffects(ctx) {
    // 충격파 원형 링
    this.shockwaves.forEach((s) => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 파편 파티클
    this.particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // 계란 폭탄 렌더링
    this.activeEggs.forEach((egg) => this._drawEgg(ctx, egg));

    // 날씨/환경 파티클 렌더링
    this._drawWeatherParticles(ctx);

    // 플로팅 점수/스킬 텍스트
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  _drawEgg(ctx, egg) {
    ctx.save();
    ctx.translate(egg.position.x, egg.position.y);
    ctx.rotate(egg.angle);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 황금빛 중심광
    ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _initWeatherParticles(theme) {
    this.weatherParticles = [];
    const count = theme === 'space' ? 45 : 30;
    for (let i = 0; i < count; i++) {
      this.weatherParticles.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * GROUND_Y,
        vx: theme === 'desert' ? (2.2 + Math.random() * 2.5) : (Math.random() - 0.5) * 1.5,
        vy: theme === 'glacier' ? (0.8 + Math.random() * 1.4) : (theme === 'volcano' ? (-0.9 - Math.random() * 1.6) : (Math.random() - 0.5) * 0.8),
        size: Math.random() * 3.5 + 1.5,
        color:
          theme === 'glacier' ? '#ffffff' :
          theme === 'volcano' ? (Math.random() > 0.5 ? '#f97316' : '#ef4444') :
          theme === 'desert' ? '#fed7aa' :
          theme === 'royal' ? '#fde047' :
          theme === 'space' ? (Math.random() > 0.5 ? '#a5f3fc' : '#e879f9') :
          '#bbf7d0',
        alpha: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  _drawWeatherParticles(ctx) {
    ctx.save();
    this.weatherParticles.forEach((wp) => {
      ctx.fillStyle = wp.color;
      ctx.globalAlpha = wp.alpha * (0.6 + 0.4 * Math.sin(wp.phase || 0));
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  _loop(now) {
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this._update(dt);
    this._draw();

    requestAnimationFrame((t) => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new AngryBirdsGame();
});
})();
