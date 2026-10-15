'use strict';
// ============================================================
//  JESUS SIMULATOR - Kazoo Studios
//  engine.js : utilidades, input, audio chiptune
// ============================================================
const W = 480, H = 270, TS = 16;
const FONT = '8px "Press Start 2P", monospace';

function rnd(a, b) { return a + Math.random() * (b - a); }
function rndi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function chance(p) { return Math.random() < p; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function tc(tx, ty) { return { x: tx * TS + 8, y: ty * TS + 8 }; }
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}
function hsh(x, y, k) {
  let n = (x * 374761393 + y * 668265263 + (k || 0) * 982451653) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = n ^ (n >>> 16);
  return (n >>> 0) / 4294967296;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(h, amt) {
  const [r, g, b] = hexToRgb(h);
  const f = v => clamp(Math.round(v + amt), 0, 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
const ACC_MAP = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'ñ', 'Ü': 'U' };
function fixAcc(s) { return String(s).replace(/[ÁÉÍÓÚÑÜ]/g, c => ACC_MAP[c]); }
function money(n) { return '$' + Math.floor(n).toLocaleString('en-US'); }
function fmtTime(m) {
  m = Math.floor(m) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// ------------------------------------------------------------
//  INPUT
// ------------------------------------------------------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'act', KeyJ: 'act', KeyE: 'use', KeyF: 'use', Enter: 'ok', NumpadEnter: 'ok',
  Escape: 'back', Backspace: 'back', KeyP: 'phone', KeyM: 'map', KeyI: 'inv',
  KeyR: 'radio', KeyQ: 'miracle', KeyZ: 'mnext', Tab: 'weapon', KeyH: 'horn',
  ShiftLeft: 'run', ShiftRight: 'run', KeyC: 'cam'
};
const Input = {
  down: {}, pressed: {},
  init() {
    addEventListener('keydown', e => {
      Sound.unlock();
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      if (!this.down[a]) this.pressed[a] = true;
      this.down[a] = true;
    });
    addEventListener('keyup', e => {
      const a = KEYMAP[e.code];
      if (a) this.down[a] = false;
    });
    addEventListener('blur', () => { this.down = {}; });
    addEventListener('pointerdown', () => Sound.unlock());
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) this.initTouch();
  },
  held(a) { return !!this.down[a]; },
  hit(a) { return !!this.pressed[a]; },
  confirm() { return this.hit('ok') || this.hit('act') || this.hit('use'); },
  press(a) { if (!this.down[a]) this.pressed[a] = true; this.down[a] = true; },
  release(a) { this.down[a] = false; },
  endFrame() { this.pressed = {}; },
  initTouch() {
    const wrap = document.getElementById('touch');
    if (!wrap) return;
    wrap.style.display = 'block';
    wrap.querySelectorAll('[data-a]').forEach(b => {
      const a = b.dataset.a;
      const on = e => { e.preventDefault(); Sound.unlock(); this.press(a); b.classList.add('on'); };
      const off = e => { e.preventDefault(); this.release(a); b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
    });
  }
};

// ------------------------------------------------------------
//  AUDIO (WebAudio chiptune)
// ------------------------------------------------------------
const NOTE_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteF(n) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  let s = NOTE_SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (parseInt(m[3]) + 1) + s;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function trk(str) { return str.replace(/\|/g, ' ').trim().split(/\s+/); }

const SONGS = {
  title: { bpm: 140, tracks: [
    { w: 'square', v: .09, len: .8, n: trk('C5 - E5 G5 C6 - G5 E5 | F5 - A5 C6 F6 - C6 A5 | G5 - B5 D6 G6 - F6 D6 | E6 D6 C6 B5 C6 - - - | A5 - C6 E6 A6 - E6 C6 | F5 - A5 C6 F6 - D6 B5 | G5 A5 B5 C6 D6 E6 F6 D6 | C6 - G5 - C6 - - -') },
    { w: 'triangle', v: .25, len: .9, n: trk('C3 - G3 - C3 - G3 - | F2 - C3 - F2 - C3 - | G2 - D3 - G2 - D3 - | C3 - G2 - C3 - E3 - | A2 - E3 - A2 - E3 - | F2 - C3 - F2 - C3 - | G2 - G2 - G2 - B2 - | C3 - G2 - C3 - - -') },
    { drum: 1, v: .3, n: trk('k h s h k k s h | k h s h k k s h | k h s h k k s h | k h s h k s s s | k h s h k k s h | k h s h k k s h | k h s h k k s h | k s k s k k s s') }
  ]},
  banda: { bpm: 152, tracks: [
    { w: 'square', v: .08, len: .7, n: trk('G4 E4 G4 C5 B4 A4 G4 - | F4 D4 F4 B4 A4 G4 F4 - | E4 G4 C5 E5 D5 C5 G4 E4 | F4 A4 D5 C5 B4 - C5 - | C5 C5 D5 E5 F5 E5 D5 C5 | B4 B4 C5 D5 G4 - - - | A4 A4 B4 C5 D5 C5 B4 A4 | G4 B4 D5 F5 E5 - C5 -') },
    { w: 'square', v: .04, len: .35, n: trk('- E4 - E4 - E4 - E4 | - D4 - D4 - D4 - D4 | - E4 - E4 - E4 - E4 | - F4 - F4 - D4 - E4 | - E4 - E4 - F4 - F4 | - D4 - D4 - D4 - D4 | - F4 - F4 - F4 - F4 | - D4 - D4 - E4 - E4') },
    { w: 'triangle', v: .3, len: .6, n: trk('C2 - G2 - C2 - G2 - | G1 - D2 - G1 - D2 - | C2 - G2 - C2 - G2 - | F2 - C2 - G1 - C2 - | C2 - G2 - F2 - C2 - | G1 - D2 - G1 - B1 - | F2 - C2 - F2 - A1 - | G1 - D2 - C2 - G1 -') },
    { drum: 1, v: .25, n: trk('k s k s k s k s | k s k s k s k s | k s k s k s k s | k s k s k s s s') }
  ]},
  corridos: { bpm: 118, tracks: [
    { w: 'square', v: .06, len: .5, n: trk('A4 C5 E5 C5 A4 C5 E5 A5 | G4 B4 D5 B4 G4 B4 D5 G5 | F4 A4 C5 A4 F4 A4 C5 F5 | E4 G#4 B4 G#4 E4 G#4 B4 E5 | A4 C5 E5 C5 A4 C5 E5 A5 | D5 F5 A5 F5 D5 F5 A5 D6 | E5 D5 C5 B4 A4 G#4 A4 B4 | A4 E4 A4 - A4 - - -') },
    { w: 'triangle', v: .32, len: .8, n: trk('A1 - E2 - A1 - E2 - | G1 - D2 - G1 - D2 - | F1 - C2 - F1 - C2 - | E1 - B1 - E1 - G#1 - | A1 - E2 - A1 - E2 - | D2 - A2 - D2 - A1 - | E2 - B1 - E2 - E1 - | A1 - E2 - A1 - - -') },
    { drum: 1, v: .18, n: trk('k - h - s - h h | k - h - s - h - | k - h - s - h h | k - h s s - h -') }
  ]},
  lofi: { bpm: 78, tracks: [
    { w: 'triangle', v: .12, len: 7.5, n: trk('F3 - - - - - - - | E3 - - - - - - - | D3 - - - - - - - | C3 - - - - - - -') },
    { w: 'triangle', v: .1, len: 7.5, n: trk('A3 - - - - - - - | G3 - - - - - - - | F3 - - - - - - - | E3 - - - - - - -') },
    { w: 'sine', v: .09, len: 7.5, n: trk('E4 - - - - - - - | D4 - - - - - - - | C4 - - - - - - - | B3 - - - - - - -') },
    { w: 'sine', v: .12, len: 1.6, n: trk('- - C5 - A4 - - G4 | - - B4 - G4 - E4 - | - A4 - F4 - - D5 C5 | - - G4 - E4 - - - | - - C5 - D5 - E5 - | - - D5 - B4 - G4 - | - A4 - C5 - - A4 G4 | E4 - - - - - - -') },
    { drum: 1, v: .14, n: trk('k - h - s - h - | k - h k s - h - ') }
  ]},
  phonk: { bpm: 132, tracks: [
    { w: 'square', v: .05, len: .3, n: trk('C6 - C6 D#6 - C6 - G5 | C6 - C6 D#6 - F6 - D#6 | C6 - C6 D#6 - C6 - G5 | A#5 - G5 - F5 - G5 -') },
    { w: 'sawtooth', v: .1, len: .9, n: trk('C2 - - C2 - - C2 - | C2 - - C2 - D#2 - - | G#1 - - G#1 - - G#1 - | A#1 - - A#1 - G1 - -') },
    { drum: 1, v: .3, n: trk('k - c k s - c - | k k c - s - c c | k - c k s - c - | k k c - s s c c') }
  ]},
  boss: { bpm: 168, tracks: [
    { w: 'square', v: .07, len: .6, n: trk('E5 E5 G5 E5 A5 E5 B5 A5 | E5 E5 G5 E5 D5 C5 B4 D5 | C5 C5 E5 C5 F5 C5 G5 F5 | B4 B4 D#5 F#5 B5 - B4 -') },
    { w: 'sawtooth', v: .07, len: .5, n: trk('E2 E2 E3 E2 E2 E3 E2 E3 | E2 E2 E3 E2 D2 D3 D2 D3 | C2 C2 C3 C2 C2 C3 C2 C3 | B1 B1 B2 B1 B1 B2 B1 B2') },
    { drum: 1, v: .3, n: trk('k h s h k k s h | k h s h k k s s') }
  ]},
  home: { bpm: 96, tracks: [
    { w: 'triangle', v: .14, len: .9, n: trk('E5 - G5 - C6 - B5 A5 | G5 - - - E5 - - - | F5 - A5 - D6 - C6 B5 | C6 - - - - - - - | E5 - G5 - C6 - B5 A5 | G5 - - - E5 - D5 - | C5 - D5 - E5 - G5 - | C5 - - - - - - -') },
    { w: 'triangle', v: .18, len: 1.8, n: trk('C3 - - - E3 - - - | A2 - - - C3 - - - | F2 - - - A2 - - - | G2 - - - B2 - - -') }
  ]},
  sad: { bpm: 70, tracks: [
    { w: 'triangle', v: .14, len: 1.8, n: trk('A4 - C5 - B4 - A4 - | G#4 - - - E4 - - - | F4 - A4 - G4 - F4 - | E4 - - - - - - -') },
    { w: 'triangle', v: .14, len: 3.8, n: trk('A2 - - - E2 - - - | E2 - - - G#2 - - - | D2 - - - F2 - - - | E2 - - - - - - -') }
  ]}
};

const RADIOS = [
  { id: 'banda', name: 'LA TREMENDA DEL ÉVORA 98.1', dj: '¡Puro pa\' arriba, Guamúchil! ¡Suena la tuba, compa!' },
  { id: 'corridos', name: 'CORRIDOS DEL VALLE FM', dj: 'Pa\' los que andan tristes en la troca a las 3am.' },
  { id: 'lofi', name: 'LO-FI WEEB RADIO (chill)', dj: 'Beats para estudiar... o para llorar por tu waifu.' },
  { id: 'phonk', name: 'GYM PHONK 24/7', dj: 'SIGMA GRINDSET. NO HAY DÍAS LIBRES. (Excepto de pierna.)' },
  { id: null, name: 'RADIO APAGADO', dj: 'Silencio. Como tu WhatsApp.' }
];

const Sound = {
  ctx: null, master: null, mus: null, sfxG: null, pending: null, cur: null, timer: null,
  engineOsc: null, engineGain: null, sirenOsc: null, sirenGain: null,
  vol: 0.6,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.vol; this.master.connect(c.destination);
    this.mus = c.createGain(); this.mus.gain.value = 0.55; this.mus.connect(this.master);
    this.sfxG = c.createGain(); this.sfxG.gain.value = 0.7; this.sfxG.connect(this.master);
    const len = c.sampleRate * 1;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pending !== null) { const p = this.pending; this.pending = null; this.play(p); }
  },
  osc(f, dur, type, vol, when, slide, dest) {
    if (!this.ctx || !f) return;
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(when); o.stop(when + dur + 0.03);
  },
  tone(f, dur, type, vol, t, slide) {
    if (!this.ctx) return;
    this.osc(f, dur, type, vol, this.ctx.currentTime + (t || 0), slide);
  },
  noise(dur, vol, t, freq, dest, ftype) {
    if (!this.ctx) return;
    this.noiseAt(this.ctx.currentTime + (t || 0), dur, vol, freq, dest, ftype);
  },
  noiseAt(when, dur, vol, freq, dest, ftype) {
    if (!this.ctx) return;
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = freq || 3000;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    s.start(when, Math.random() * 0.5); s.stop(when + dur + 0.02);
  },
  drum(tok, when, v) {
    const c = this.ctx;
    if (tok === 'k') { this.osc(150, .16, 'sine', v * 1.6, when, 40, this.mus); }
    else if (tok === 's') { this.noiseAt(when, .11, v * .8, 4000, this.mus); this.osc(220, .06, 'triangle', v * .5, when, 120, this.mus); }
    else if (tok === 'h') { this.noiseAt(when, .035, v * .35, 7000, this.mus, 'highpass'); }
    else if (tok === 'c') { this.osc(810, .09, 'square', v * .35, when, 0, this.mus); this.osc(540, .09, 'square', v * .3, when, 0, this.mus); }
  },
  play(id) {
    if (!this.ctx) { this.pending = id; return; }
    if (this.cur === id) return;
    this.stop();
    if (!id || !SONGS[id]) return;
    this.cur = id; this.song = SONGS[id]; this.step = 0;
    this.nt = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.sched(), 25);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; },
  sched() {
    if (!this.song || !this.ctx) return;
    const s = this.song, sp = 60 / s.bpm / 2;
    if (this.nt < this.ctx.currentTime - 0.3) this.nt = this.ctx.currentTime + 0.05;
    while (this.nt < this.ctx.currentTime + 0.15) {
      for (const tr of s.tracks) {
        const tok = tr.n[this.step % tr.n.length];
        if (!tok || tok === '-') continue;
        if (tr.drum) this.drum(tok, this.nt, tr.v);
        else this.osc(noteF(tok), sp * (tr.len || .9), tr.w, tr.v, this.nt, 0, this.mus);
      }
      this.step++; this.nt += sp;
    }
  },
  setEngine(on, speed) {
    if (!this.ctx) return;
    if (!this.engineOsc) {
      const c = this.ctx;
      this.engineOsc = c.createOscillator(); this.engineOsc.type = 'sawtooth';
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      this.engineGain = c.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(f); f.connect(this.engineGain); this.engineGain.connect(this.sfxG);
      this.engineOsc.start();
    }
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(on ? 0.05 : 0, t, 0.08);
    this.engineOsc.frequency.setTargetAtTime(38 + Math.abs(speed) * 0.55, t, 0.05);
  },
  setSiren(on) {
    if (!this.ctx) return;
    if (!this.sirenOsc) {
      const c = this.ctx;
      this.sirenOsc = c.createOscillator(); this.sirenOsc.type = 'square';
      this.sirenGain = c.createGain(); this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.sfxG);
      this.sirenOsc.start();
    }
    const t = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(on ? 0.025 : 0, t, 0.1);
    if (on) this.sirenOsc.frequency.setTargetAtTime((Math.floor(t * 2.5) % 2) ? 960 : 720, t, 0.02);
  },
  sfx(n) {
    if (!this.ctx) return;
    switch (n) {
      case 'punch': this.noise(.09, .5, 0, 1200); this.tone(140, .08, 'square', .15, 0, 50); break;
      case 'whiff': this.noise(.07, .15, 0, 2500, null, 'highpass'); break;
      case 'hurt': this.tone(300, .15, 'square', .15, 0, 90); break;
      case 'coin': this.tone(988, .07, 'square', .12); this.tone(1319, .18, 'square', .12, .07); break;
      case 'buy': this.tone(523, .08, 'square', .1); this.tone(659, .08, 'square', .1, .08); this.tone(784, .08, 'square', .1, .16); this.tone(1047, .2, 'square', .1, .24); break;
      case 'select': this.tone(660, .05, 'square', .08); break;
      case 'move': this.tone(440, .03, 'square', .05); break;
      case 'back': this.tone(330, .07, 'square', .07, 0, 220); break;
      case 'blip': this.tone(500 + Math.random() * 120, .025, 'square', .03); break;
      case 'crash': this.noise(.3, .5, 0, 900); this.tone(90, .25, 'sawtooth', .2, 0, 40); break;
      case 'bump': this.noise(.12, .3, 0, 600); break;
      case 'horn': this.tone(392, .3, 'square', .1); this.tone(494, .3, 'square', .08); break;
      case 'boom': this.noise(.9, .7, 0, 500); this.tone(70, .8, 'sawtooth', .3, 0, 25); break;
      case 'throw': this.noise(.1, .2, 0, 3000, null, 'highpass'); this.tone(600, .1, 'triangle', .08, 0, 300); break;
      case 'splash': this.noise(.35, .3, 0, 1500); break;
      case 'miracle': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, .3, 'triangle', .12, i * .06)); break;
      case 'level': [392, 523, 659, 784].forEach((f, i) => this.tone(f, .14, 'square', .1, i * .09)); this.tone(1047, .4, 'square', .1, .36); break;
      case 'fail': [392, 330, 262, 196].forEach((f, i) => this.tone(f, .2, 'square', .1, i * .15)); break;
      case 'mission': [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, .12, 'square', .1, i * .08)); break;
      case 'slap': this.noise(.06, .7, 0, 5000, null, 'highpass'); this.tone(900, .05, 'square', .1, 0, 300); break;
      case 'rep': this.tone(784, .06, 'square', .1); this.tone(1175, .1, 'square', .1, .06); break;
      case 'miss': this.tone(200, .25, 'sawtooth', .12, 0, 80); break;
      case 'phone': this.tone(1200, .05, 'square', .07); this.tone(1500, .05, 'square', .07, .08); break;
      case 'train': this.tone(330, .7, 'sawtooth', .12); this.tone(415, .7, 'sawtooth', .1); this.tone(330, .5, 'sawtooth', .12, .8); this.tone(415, .5, 'sawtooth', .1, .8); break;
      case 'kazoo': {
        const t = this.ctx.currentTime;
        [[392, .18], [440, .18], [494, .18], [523, .5], [494, .14], [523, .6]].reduce((acc, [f, d]) => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain(), l = this.ctx.createOscillator(), lg = this.ctx.createGain();
          o.type = 'sawtooth'; o.frequency.value = f; l.frequency.value = 7; lg.gain.value = f * 0.03;
          l.connect(lg); lg.connect(o.frequency);
          const fl = this.ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 1200; fl.Q.value = 2;
          g.gain.setValueAtTime(0.0001, t + acc); g.gain.linearRampToValueAtTime(.35, t + acc + .03);
          g.gain.setValueAtTime(.35, t + acc + d - .03); g.gain.linearRampToValueAtTime(0.0001, t + acc + d);
          o.connect(fl); fl.connect(g); g.connect(this.sfxG);
          o.start(t + acc); l.start(t + acc); o.stop(t + acc + d + .05); l.stop(t + acc + d + .05);
          return acc + d;
        }, 0);
        break;
      }
    }
  }
};
