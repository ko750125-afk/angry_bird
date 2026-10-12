/**
 * src/sound.js
 * Web Audio API 기반 절차적 사운드 효과(SFX) 및 배경음악(BGM) 신디사이저
 * 외부 오디오 파일 없이 100% 오프라인으로 즉각 작동합니다.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.lastStretchTime = 0;
    this.lastImpactTime = 0;
    this.noiseBuffer = null;
  }

  /**
   * 사용자 최초 인터랙션 시 AudioContext 활성화
   */
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this._createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxEnabled) {
      this.unlock();
      this.playUiClick();
    }
    return this.sfxEnabled;
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.unlock();
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  /**
   * UI 버튼 클릭음
   */
  playUiClick() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * 슬링샷 고무줄 당기는 소리 (ratio: 0 ~ 1)
   */
  playStretch(ratio = 0.5) {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const nowMs = performance.now();
    if (nowMs - this.lastStretchTime < 95) return;
    this.lastStretchTime = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 110 + ratio * 160;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 28, now + 0.06);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320 + ratio * 300, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 슬링샷 발사 탄성음 + 버드 고유 기합 소리
   */
  playLaunch(birdType = 'red') {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 고무줄 튕기는 소리 (Twang)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(95, now);
    snapOsc.frequency.exponentialRampToValueAtTime(310, now + 0.12);
    snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

    snapGain.gain.setValueAtTime(0.32, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.26);

    // 2. 버드 종류별 기합 소리 (Warcry)
    const cryOsc = this.ctx.createOscillator();
    const cryGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, now);

    if (birdType === 'yellow') {
      // 척(노랑새): 빠르고 날카로운 "히야아~!"
      cryOsc.type = 'sawtooth';
      cryOsc.frequency.setValueAtTime(420, now + 0.05);
      cryOsc.frequency.exponentialRampToValueAtTime(980, now + 0.22);
      cryOsc.frequency.exponentialRampToValueAtTime(640, now + 0.38);
      filter.frequency.setValueAtTime(1200, now + 0.05);
    } else if (birdType === 'blue') {
      // 블루(파랑새): 귀엽고 높은 "위히~!"
      cryOsc.type = 'square';
      cryOsc.frequency.setValueAtTime(580, now + 0.05);
      cryOsc.frequency.exponentialRampToValueAtTime(1120, now + 0.2);
      cryOsc.frequency.exponentialRampToValueAtTime(860, now + 0.34);
      filter.frequency.setValueAtTime(1450, now + 0.05);
    } else if (birdType === 'black') {
      // 밤(폭탄새): 묵직하고 낮은 "부우움~!"
      cryOsc.type = 'sawtooth';
      cryOsc.frequency.setValueAtTime(190, now + 0.05);
      cryOsc.frequency.exponentialRampToValueAtTime(340, now + 0.2);
      cryOsc.frequency.exponentialRampToValueAtTime(160, now + 0.42);
      filter.frequency.setValueAtTime(520, now + 0.05);
    } else {
      // 레드(기본새): 용맹한 "야~하!"
      cryOsc.type = 'sawtooth';
      cryOsc.frequency.setValueAtTime(340, now + 0.05);
      cryOsc.frequency.exponentialRampToValueAtTime(720, now + 0.2);
      cryOsc.frequency.exponentialRampToValueAtTime(480, now + 0.38);
      filter.frequency.setValueAtTime(950, now + 0.05);
    }

    cryGain.gain.setValueAtTime(0.001, now);
    cryGain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    cryGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    cryOsc.connect(filter);
    filter.connect(cryGain);
    cryGain.connect(this.ctx.destination);
    cryOsc.start(now + 0.05);
    cryOsc.stop(now + 0.43);
  }

  /**
   * 공중 특수 스킬 발동 사운드
   */
  playSkill(birdType = 'red') {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (birdType === 'yellow') {
      // 초고속 제트 가속음
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (birdType === 'blue') {
      // 3단 분신 크리스탈 차임
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.22, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.2);
      });
    } else if (birdType === 'black') {
      this.playExplosion();
    } else {
      // 레드 쇼크웨이브 파동음
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.32);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.34);
    }
  }

  /**
   * 폭발 사운드 (밤 버드 스킬 & TNT 상자 폭발)
   */
  playExplosion() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 서브 베이스 붐
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.65);

    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.68);

    // 2. 화이트 노이즈 폭발 파열음
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.7);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.72);
    }
  }

  /**
   * 재질별 충돌 및 파괴 사운드 (material: 'wood' | 'ice' | 'stone' | 'tnt')
   */
  playImpact(material = 'wood', intensity = 0.5, destroyed = false) {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const nowMs = performance.now();
    if (!destroyed && nowMs - this.lastImpactTime < 55) return;
    this.lastImpactTime = nowMs;

    const now = this.ctx.currentTime;
    const vol = Math.min(0.42, Math.max(0.06, intensity * 0.35));

    if (material === 'ice') {
      // 유리/얼음 쨍그랑 소리
      const freqs = destroyed ? [1350, 1780, 2240] : [1480, 1920];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + Math.random() * 200, now + i * 0.02);
        osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 0.14 + i * 0.03);

        gain.gain.setValueAtTime(vol * 0.7, now + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + i * 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.02);
        osc.stop(now + 0.17 + i * 0.03);
      });
    } else if (material === 'stone') {
      // 돌 묵직한 타격음
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);

      gain.gain.setValueAtTime(vol * 1.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } else {
      // 나무(Wood) 타격 및 쪼개지는 소리
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(destroyed ? 240 : 185, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.13);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, now);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  /**
   * 돼지 피격 시 꿀꿀(Oink) 소리
   */
  playPigOink() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(240, now + 0.07);
    osc.frequency.linearRampToValueAtTime(145, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * 돼지 처치 시 코믹한 팝(Pop) + 득점 효과음
   */
  playPigDestroy() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 뽕! 팝 사운드
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(260, now);
    popOsc.frequency.exponentialRampToValueAtTime(880, now + 0.14);

    popGain.gain.setValueAtTime(0.32, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.15);

    // 2. 코인/보너스 딩동
    const dingOsc = this.ctx.createOscillator();
    const dingGain = this.ctx.createGain();
    dingOsc.type = 'triangle';
    dingOsc.frequency.setValueAtTime(987.77, now + 0.09);
    dingOsc.frequency.setValueAtTime(1318.51, now + 0.16);

    dingGain.gain.setValueAtTime(0.2, now + 0.09);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    dingOsc.connect(dingGain);
    dingGain.connect(this.ctx.destination);
    dingOsc.start(now + 0.09);
    dingOsc.stop(now + 0.35);
  }

  /**
   * 스테이지 클리어 팡파르
   */
  playVictory() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.14 },
      { f: 659.25, t: 0.13, d: 0.14 },
      { f: 783.99, t: 0.26, d: 0.14 },
      { f: 1046.5, t: 0.40, d: 0.42 }
    ];

    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.28, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  /**
   * 스테이지 실패 사운드 (코믹 트롬본)
   */
  playFail() {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 392.0, t: 0.0, d: 0.24 },
      { f: 369.99, t: 0.26, d: 0.24 },
      { f: 349.23, t: 0.52, d: 0.24 },
      { f: 329.63, t: 0.78, d: 0.55 }
    ];

    notes.forEach((n, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      if (idx === 3) {
        osc.frequency.linearRampToValueAtTime(290, now + n.t + n.d);
      }

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now + n.t);

      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  /**
   * 경쾌한 앵그리버드 스타일 아케이드 배경음악(BGM) 루프 시작
   */
  startBgm() {
    if (!this.bgmEnabled || this.bgmPlaying) return;
    this.unlock();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    // 익살스럽고 경쾌한 단조/장조 아케이드 행진곡 멜로디 (Hz)
    const melody = [
      329.63, 349.23, 392.00, 523.25, 0, 392.00, 523.25, 0,
      440.00, 392.00, 349.23, 329.63, 293.66, 329.63, 261.63, 0,
      329.63, 349.23, 392.00, 523.25, 587.33, 523.25, 493.88, 392.00,
      440.00, 392.00, 349.23, 293.66, 261.63, 0, 261.63, 0
    ];
    const bass = [
      130.81, 0, 196.00, 0, 130.81, 0, 196.00, 0,
      146.83, 0, 196.00, 0, 130.81, 0, 130.81, 0,
      130.81, 0, 196.00, 0, 174.61, 0, 196.00, 0,
      146.83, 0, 196.00, 0, 130.81, 196.00, 130.81, 0
    ];

    const stepDurationMs = 210;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;

      const idx = this.bgmStep % melody.length;
      const now = this.ctx.currentTime;

      const mFreq = melody[idx];
      if (mFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(mFreq, now);

        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      }

      const bFreq = bass[idx];
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bFreq, now);

        bGain.gain.setValueAtTime(0.065, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.2);
      }

      this.bgmStep++;
    }, stepDurationMs);
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
