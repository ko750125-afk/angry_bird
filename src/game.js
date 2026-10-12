/**
 * src/game.js
 * 앵그리버드 PWA 메인 물리 엔진(Matter.js) 및 Canvas 2D 렌더러
 */

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
  }
};

const PIG_PROPS = {
  normal: { hp: 22, score: 5000, density: 0.002 },
  helmet: { hp: 48, score: 7500, density: 0.0028 },
  king: { hp: 85, score: 15000, density: 0.0035 }
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
    this.birdQueue = [];
    this.currentBird = null; // 슬링샷에 장전된 버드 데이터 { type, x, y }

    // 슬링샷 드래그 상태
    this.state = 'AIMING'; // 'AIMING' | 'DRAGGING' | 'FLYING' | 'RESULT'
    this.dragPos = { x: SLING_X, y: SLING_Y };
    this.isDragging = false;

    // 시각 효과 (궤적 점, 파편 파티클, 충격파, 플로팅 텍스트, 화면 흔들림)
    this.flightTrail = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.clouds = this._createClouds();
    this.screenShake = 0;
    this.cameraOffsetX = 0;
    this.targetCameraX = 0;
    this.isOverviewMode = false;

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
    this.canvas.width = WORLD_W;
    this.canvas.height = WORLD_H;
  }

  /**
   * 화면 클릭/터치 좌표를 1280x720 캔버스 내부 월드 좌표로 변환
   */
  _getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
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
        if (dist <= 75) {
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
    this.flightTrail = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.score = 0;
    this.cameraOffsetX = 0;
    this.targetCameraX = 0;
    this.isOverviewMode = false;
    this.screenShake = 0;

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

    // 구조물 블록 생성
    level.blocks.forEach((b) => {
      const mat = MATERIAL_PROPS[b.material] || MATERIAL_PROPS.wood;
      const body = Bodies.rectangle(b.x, b.y, b.w, b.h, {
        density: mat.density,
        friction: mat.friction,
        frictionStatic: 1.0,
        restitution: mat.restitution,
        label: 'block'
      });
      body.gameData = {
        kind: 'block',
        material: b.material,
        w: b.w,
        h: b.h,
        hp: mat.hp,
        maxHp: mat.hp,
        score: mat.score
      };
      this.blocks.push(body);
      World.add(this.world, body);
    });

    // 돼지 생성
    level.pigs.forEach((p) => {
      const prop = PIG_PROPS[p.role] || PIG_PROPS.normal;
      const body = Bodies.circle(p.x, p.y, p.radius, {
        density: prop.density,
        friction: 0.75,
        frictionStatic: 0.9,
        restitution: 0.25,
        label: 'pig'
      });
      body.gameData = {
        kind: 'pig',
        role: p.role,
        radius: p.radius,
        hp: prop.hp,
        maxHp: prop.hp,
        score: prop.score,
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
      density: 0.0038,
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

    if (target.gameData.kind === 'bird') {
      target.gameData.hasCollided = true;
      return;
    }

    let multiplier = 3.2;
    if (other.gameData && other.gameData.kind === 'bird') {
      const bType = other.gameData.birdType;
      multiplier = 4.5;
      if (target.gameData.kind === 'block') {
        const mat = target.gameData.material;
        if (bType === 'yellow' && mat === 'wood') {
          multiplier = other.gameData.boosted ? 12.0 : 8.0;
        } else if (bType === 'blue' && mat === 'ice') {
          multiplier = 9.5;
        } else if (bType === 'black' && mat === 'stone') {
          multiplier = 8.5;
        }
      } else if (target.gameData.kind === 'pig') {
        multiplier = 6.5;
      }
    } else if (other.gameData && other.gameData.kind === 'block') {
      // 무거운 구조물 낙하 데미지
      multiplier = other.gameData.material === 'stone' ? 4.2 : 2.8;
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
        window.soundEngine.playImpact(data.material, 1.0, true);
        this._spawnParticles(pos.x, pos.y, matProp.fill, 14, 6);
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
        this._spawnParticles(pos.x, pos.y, '#4ade80', 22, 7);
        this._spawnParticles(pos.x, pos.y, '#ffffff', 12, 5);
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
        <div class="stage-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="stage-high">최고: ${high.toLocaleString()}점</div>
        <div class="stage-badge">${unlocked ? '플레이 가능' : '보너스 오픈'}</div>
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

    // 1. 하늘 및 패럴랙스 배경 그리기
    this._drawBackground(ctx, level.skyTheme);

    ctx.translate(this.cameraOffsetX + shakeX, shakeY);

    // 2. 지면(잔디밭 & 흙) 그리기
    this._drawGround(ctx);

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

  _drawBackground(ctx, theme = 'day') {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (theme === 'sunset') {
      grad.addColorStop(0, '#7c2d12');
      grad.addColorStop(0.55, '#ea580c');
      grad.addColorStop(1, '#fde047');
    } else if (theme === 'dusk') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#4338ca');
      grad.addColorStop(1, '#f472b6');
    } else if (theme === 'night') {
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.6, '#1e293b');
      grad.addColorStop(1, '#334155');
    } else {
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.65, '#38bdf8');
      grad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // 구름 그리기
    ctx.fillStyle = theme === 'night' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)';
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

    // 원경 언덕 실루엣
    ctx.fillStyle = theme === 'night' ? '#1e293b' : '#86efac';
    ctx.beginPath();
    ctx.arc(280, GROUND_Y + 40, 220, Math.PI, 0);
    ctx.arc(720, GROUND_Y + 60, 290, Math.PI, 0);
    ctx.arc(1120, GROUND_Y + 30, 240, Math.PI, 0);
    ctx.fill();
  }

  _drawGround(ctx) {
    // 흙 지면
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-300, GROUND_Y, WORLD_W + 800, WORLD_H - GROUND_Y);

    // 상단 푸른 잔디 층
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-300, GROUND_Y, WORLD_W + 800, 18);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-300, GROUND_Y + 18, WORLD_W + 800, 6);
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
        const gravityPerStep = 0.28; // Matter.js 프레임당 등가 중력 가속도 근사치

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

    // 화난 눈썹
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.42);
    ctx.lineTo(r * 0.42, -r * 0.25);
    ctx.lineTo(r * 0.78, -r * 0.42);
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

    const hw = data.w / 2;
    const hh = data.h / 2;

    ctx.fillStyle = mat.fill;
    ctx.strokeStyle = mat.stroke;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-hw, -hh, data.w, data.h);
    ctx.strokeRect(-hw, -hh, data.w, data.h);

    if (data.material === 'tnt') {
      // TNT 표기
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-hw + 4, -9, data.w - 8, 18);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 1);
    } else if (data.material === 'wood') {
      // 나뭇결 장식선
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-hw + 4, 0);
      ctx.lineTo(hw - 4, 0);
      ctx.stroke();
    }

    // 체력 감소 시 균열(Crack) 표시
    const hpRatio = data.hp / data.maxHp;
    if (hpRatio < 0.72) {
      ctx.strokeStyle = mat.crackColor;
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

    // 귀
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-r * 0.65, -r * 0.65, r * 0.25, 0, Math.PI * 2);
    ctx.arc(r * 0.65, -r * 0.65, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 초록 돼지 몸통
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 멍든 자국 (체력이 깎였을 때)
    if (hpRatio < 0.65) {
      ctx.fillStyle = 'rgba(109, 40, 217, 0.42)';
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.12, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 헬멧 피그 철모 또는 킹피그 왕관
    if (data.role === 'helmet') {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 1.04, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (data.role === 'king') {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.78);
      ctx.lineTo(-r * 0.45, -r * 1.35);
      ctx.lineTo(0, -r * 0.98);
      ctx.lineTo(r * 0.45, -r * 1.35);
      ctx.lineTo(r * 0.65, -r * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 눈
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
