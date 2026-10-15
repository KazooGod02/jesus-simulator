'use strict';
// ============================================================
//  game.js : estado, loop, tiendas, guardado, título
// ============================================================
const SAVE_KEY = 'jesus_simulator_save_v1';
let S = null;

function newState() {
  return {
    money: 200, hp: 100, hunger: 80, mamadez: 8, copium: 20, fe: 0, loyalty: 20,
    day: 1, time: 6 * 60, trained: false, streak: 0, figs: {}, oficial: null,
    weapons: { puno: 1, chancla: 8 }, wsel: 'puno', miracles: {}, msel: null, hair: 1, story: 0,
    flags: {}, wanted: 0, resUsed: false, anx: 0, radio: 0, hiddenFound: {}, stashFound: {}, stats: {},
    prayedDay: 0, momFoodDay: 0, streamDay: 0, lastBuyDay: 1, spent: 0, px: 0, py: 0, ate: 0
  };
}

const Game = {
  state: 'boot', t: 0, perks: {}, prompt: null, radioT: 0, boss: null, bossBar: null, eventT: 60, temptT: 90, titleSel: 0, splashT: 0,
  hasSave: false,

  init() {
    const cv = document.getElementById('game');
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.resize(); addEventListener('resize', () => this.resize());
    Input.init();
    World.build();
    World.render();
    try { this.hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) { this.hasSave = false; }
    S = newState();
    this.state = 'splash'; this.splashT = 0;
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      requestAnimationFrame(loop);
      try { this.frame(dt); } catch (e) { console.error(e); Input.endFrame(); }
    };
    requestAnimationFrame(loop);
  },
  resize() {
    const cv = document.getElementById('game');
    const s = Math.max(1, Math.min(innerWidth / W, innerHeight / H));
    const sc = s >= 2 ? Math.floor(s) : s;
    cv.style.width = Math.floor(W * sc) + 'px'; cv.style.height = Math.floor(H * sc) + 'px';
  },

  frame(dt) {
    this.t += dt;
    if (this.state === 'splash') this.updSplash(dt);
    else if (this.state === 'title') this.updTitle(dt);
    else if (this.state === 'play') this.update(dt);
    this.draw();
    Input.endFrame();
  },

  // ---------------- SPLASH / TÍTULO ----------------
  updSplash(dt) {
    this.splashT += dt;
    if (this.splashT > 0.4 && !this.kazoo) { this.kazoo = true; Sound.sfx('kazoo'); }
    if (this.splashT > 3.2 || (this.splashT > 0.5 && (Input.confirm() || Input.hit('back')))) { this.state = 'title'; Sound.play('title'); }
  },
  titleItems() {
    const it = [{ t: 'NUEVA PARTIDA', fn: () => this.newGame() }];
    if (this.hasSave) it.unshift({ t: 'CONTINUAR', fn: () => this.loadGame() });
    it.push({ t: 'CONTROLES', fn: () => this.showControls() }, { t: 'PANTALLA COMPLETA', fn: () => this.fullscreen() });
    return it;
  },
  updTitle(dt) {
    if (UI.busy()) { UI.update(dt); return; }
    const it = this.titleItems();
    if (Input.hit('up')) { this.titleSel = (this.titleSel + it.length - 1) % it.length; Sound.sfx('move'); }
    if (Input.hit('down')) { this.titleSel = (this.titleSel + 1) % it.length; Sound.sfx('move'); }
    if (Input.confirm()) { Sound.sfx('select'); it[Math.min(this.titleSel, it.length - 1)].fn(); }
  },
  showControls() {
    UI.dialog([
      ['narrador', 'MOVERSE: WASD / Flechas.  CORRER: Shift.  GOLPEAR / FRENO DE MANO: Espacio.'],
      ['narrador', 'SUBIR/BAJAR DEL CARRO, ENTRAR A LUGARES, HABLAR: E.   CLAXON: H.   RADIO: R.'],
      ['narrador', 'MILAGRO: Q.  CAMBIAR MILAGRO: Z.  CAMBIAR ARMA: Tab.'],
      ['narrador', 'CELULAR: P.  MAPA: M.  FIGURAS: I.  PAUSA: Esc.'],
      ['narrador', 'En celular/tablet aparecen botones táctiles.']]);
  },
  fullscreen() { const el = document.documentElement; if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen().catch(() => { }); } else if (document.exitFullscreen) document.exitFullscreen(); },

  newGame() {
    S = newState();
    this.resetWorld();
    const h = LOC('home');
    PL.x = h.x; PL.y = h.y + 4; PL.dir = 1;
    this.snapCam();
    this.state = 'play';
    this.calcPerks();
    Sound.play('home');
    UI.dialog([
      ['narrador', 'KAZOO STUDIOS PRESENTA... (advertencia: humor +18, groserías y un protagonista que necesita terapia. Esto es SÁTIRA: Jesús ES el chiste.)'],
      ['narrador', 'Guamúchil, Sinaloa. Corazón del Valle del Évora. Tierra del garbanzo, del Ídolo Pedro Infante y del tren que le dio vida al pueblo.'],
      ['narrador', 'Aquí vive Jesús Alberto, 23 años. Esbelto. Pelo de librito con un volumen que desafía a la física.'],
      ['narrador', 'Jesús tiene tres pasiones: el gym, sus figuras de anime... y odiar a las mujeres. Excepto a Yesenia, su novia de internet a la que nunca ha visto.'],
      ['narrador', 'Jesús es monogámico. MUY monogámico. Te lo va a decir aunque no le preguntes.'],
      ['narrador', 'Esta es su historia. Kazoo Studios no se hace responsable.']
    ], () => Missions.start(STORY[0]));
  },
  loadGame() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      S = Object.assign(newState(), d);
    } catch (e) { S = newState(); }
    this.resetWorld();
    const h = LOC('home');
    PL.x = h.x; PL.y = h.y + 4; PL.dir = 1;
    this.snapCam();
    S.wanted = 0;
    this.state = 'play';
    this.calcPerks();
    Sound.play(null);
    UI.banner('DÍA ' + S.day, 'Bienvenido de vuelta, pelo de libro.', '#ffd060');
  },
  save(silent) {
    if (!S) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({}, S, { wanted: 0 }))); this.hasSave = true; if (!silent) UI.toast('Partida guardada.', '#80ff80'); }
    catch (e) { if (!silent) UI.toast('No se pudo guardar (almacenamiento bloqueado).', '#ff8080'); }
  },
  snapCam() {
    Cam.x = clamp(PL.x - W / 2, 0, MW * TS - W); Cam.y = clamp(PL.y - H / 2, 0, MH * TS - H);
  },
  resetWorld() {
    E.peds = []; E.cars = []; E.projs = []; E.pickups = []; E.parts = []; E.floaters = []; E.marks = []; E.objs = [];
    PL.car = null; PL.copeT = 0; Missions.active = null; this.boss = null; this.bossBar = null;
    Pop.init();
    for (const h of World.hidden) if (!S.hiddenFound[h.id] && !S.figs[h.id]) E.pickups.push({ x: h.x, y: h.y, kind: 'fig', id: h.id, t: 0, keep: true });
    for (const s of World.stashes) if (!S.stashFound[s.i]) E.pickups.push({ x: s.x, y: s.y, kind: 'stash', i: s.i, val: s.val, t: 0, keep: true });
    UI.stack = [];
  },

  // ---------------- LOOP DE JUEGO ----------------
  update(dt) {
    if (UI.busy()) { UI.update(dt); Sound.setEngine(false, 0); Sound.setSiren(false); return; }
    UI.update(dt);
    // tiempo
    const prevH = Math.floor(S.time / 60);
    S.time += dt * 2;
    if (S.time >= 1440) { S.time -= 1440; this.newDay(false); }
    if (Math.floor(S.time / 60) !== prevH) this.hourTick();
    // stats
    S.hunger = Math.max(0, S.hunger - dt * 0.09 * (1 - perk('hunger') / 100));
    if (S.hunger <= 0) { S.hp -= dt * 0.8; if (S.hp <= 0) this.playerDown('ko'); }
    else if (S.hunger > 40 && S.hp < maxHp()) S.hp = Math.min(maxHp(), S.hp + dt * 0.35);
    if (S.copium > 0 && !S.flags.yeseniaBot) S.copium = Math.max(0, S.copium - dt * 0.05);
    this.radioT = Math.max(0, this.radioT - dt);
    if (PL.say) { PL.sayT -= dt; if (PL.sayT <= 0) PL.say = null; }

    updatePlayer(dt);
    Pop.update(dt);
    for (const c of E.cars) updateCar(c, dt);
    for (const p of E.peds) updatePed(p, dt);
    E.peds = E.peds.filter(p => !p.dead);
    collideCars();
    updateProjs(dt);
    updatePickups(dt);
    updateParts(dt);
    Police.update(dt);
    Train.update(dt);
    Missions.update(dt);
    if (this.boss) this.updateBoss(dt);
    this.events(dt);
    if (!PL.car) Sound.setEngine(false, 0);
    // cámara
    const pp = playerPos();
    let tx = pp.x - W / 2, ty = pp.y - H / 2;
    if (PL.car) { tx += Math.cos(PL.car.a) * PL.car.v * 0.45; ty += Math.sin(PL.car.a) * PL.car.v * 0.35; }
    Cam.x += (tx - Cam.x) * Math.min(1, dt * 6); Cam.y += (ty - Cam.y) * Math.min(1, dt * 6);
    Cam.x = clamp(Cam.x, 0, MW * TS - W); Cam.y = clamp(Cam.y, 0, MH * TS - H);
    Cam.shake = Math.max(0, Cam.shake - dt * 12);
    this.interactions();
    this.keys();
  },

  hourTick() {
    const h = Math.floor(S.time / 60);
    if (h === 22 && !S.trained) UI.toast('¡No has ido al GYM hoy! Cierra a medianoche... (bueno, nunca cierra, pero ya ve).', '#ff8060');
    if (h === 20 && Missions.storyDef() && Missions.storyDef().night && !Missions.active) UI.toast('Ya es de noche. La siguiente misión te espera.', '#a0a0ff');
  },
  newDay(slept) {
    S.day++;
    if (!S.trained) {
      S.mamadez = Math.max(0, S.mamadez - 5); S.streak = 0; addCope(15); S.flags.sinBombeo = true;
      UI.dialog([['chava', '(mensaje) ¿Dónde andabas ayer, flaco? Faltaste al gym. Los músculos ya se fueron a Culiacán.'], ['narrador', 'Perdiste 5 de MAMADEZ y tu racha. Estás "sin bombeo" (más lento) hasta que entrenes.']]);
    } else { S.streak++; S.flags.sinBombeo = false; if (S.streak % 7 === 0) { S.mamadez = Math.min(100, S.mamadez + 3); UI.toast('¡RACHA DE ' + S.streak + ' DÍAS! Bonus +3 MAMADEZ', '#60ff80'); } }
    S.trained = false; S.resUsed = false;
    if (S.day - S.lastBuyDay >= 1) S.anx = Math.min(100, S.anx + 14);
    if (S.anx >= 60) UI.toast('ANSIEDAD OTAKU: ' + S.anx + '%. Necesitas comprar una figura. Ya.', '#ff80c0');
    this.dayShop = null;
  },

  events(dt) {
    if (Missions.active || S.wanted > 0) return;
    if (S.flags.hero) {
      this.eventT -= dt;
      if (this.eventT <= 0) {
        this.eventT = rnd(80, 140);
        const def = chance(.55) ? Jobs.ladron() : Jobs.asalto();
        if (def) Missions.start(def);
      }
    }
    // tentaciones monogámicas
    this.temptT -= dt;
    if (this.temptT <= 0 && !PL.car) {
      const w = E.peds.find(p => p.type === 'morra' && !p.hostile && p.state !== 'down' && dist(p.x, p.y, PL.x, PL.y) < 60);
      if (w) { this.temptT = rnd(150, 240); this.temptation(w); }
      else this.temptT = 10;
    }
  },
  temptation(w) {
    const T = pick(TEMPTATIONS);
    w.state = 'static';
    const done = () => { w.state = 'flee'; w.t = 3; };
    const karla = S.flags.karla;
    UI.dialog([
      { who: 'narrador', text: 'Una muchacha se te acerca.' },
      { who: 'narrador', text: '"' + T.line + '"' },
      { who: 'jesus', text: '(ALERTA. MUJER DETECTADA. ¿QUÉ HAGO?)', choices: [
        { t: '¡SOY MONOGÁMICO! (gritar)', fn: () => { S.loyalty += 5; S.fe += 2; addCope(5); return [['narrador', 'Ella: "...nadie te preguntó. Solo quería la hora." Se va. Jesús se siente puro.'], ['narrador', '+FIDELIDAD +FE. -DIGNIDAD.']]; } },
        { t: 'Responder normal, como humano', fn: () => { S.loyalty -= 3; addCope(-12); S.fe += 1; return [['narrador', 'Le respondes amablemente. Ella sonríe, te da las gracias y se va. No pasó nada malo. Qué raro.'], ['jesus', karla ? '(Karla tenía razón. Las mujeres son... personas.)' : '(¿Eso fue... una interacción normal? ¿Le seré infiel a Yesenia?)']]; } },
        { t: '"Otra interesada" (murmurar)', fn: () => { addCope(15); Game.stat('cachetadas'); Sound.sfx('slap'); return [['narrador', 'Te escuchó. CACHETADA. Te la merecías, honestamente.'], ['narrador', '+COPIUM.']]; } }
      ] }
    ], done);
  },

  // ---------------- INTERACCIÓN ----------------
  interactions() {
    this.prompt = null;
    if (PL.car) {
      this.prompt = Math.abs(PL.car.v) < 35 ? null : null;
      if (Input.hit('use')) exitCar();
      return;
    }
    const sd = Missions.storyDef();
    let act = null;
    if (sd && !Missions.active) {
      const l = LOC(sd.start);
      if (dist(PL.x, PL.y, l.x, l.y) < 24) act = { p: '[E] MISIÓN: ' + sd.name, fn: () => this.tryStory(sd) };
    }
    if (!act) for (const b of World.doors) {
      if (dist(PL.x, PL.y, b.spot.x, b.spot.y) < 16) { act = { p: '[E] ' + (LOC_NAMES[b.id] || b.label), fn: () => Shops.open(b.id) }; break; }
    }
    if (!act) {
      let best = null, bd = 26;
      for (const c of E.cars) { if (c.dead) continue; const d = dist(PL.x, PL.y - 4, c.x, c.y); if (d < bd) { bd = d; best = c; } }
      if (best) act = { p: '[E] Subir al ' + CARTYPES[best.type].name + (best.ai && best.ai !== 'player' ? ' (robar)' : ''), fn: () => enterCar(best) };
    }
    if (!act) {
      const p = E.peds.find(p => !p.hostile && p.state !== 'down' && p.state !== 'rescue' && !p.mission && dist(p.x, p.y, PL.x, PL.y) < 18);
      if (p) act = { p: '[E] Hablar', fn: () => this.talkTo(p) };
    }
    if (act) { this.prompt = act.p; if (Input.hit('use')) act.fn(); }
  },
  tryStory(sd) {
    if (sd.req && !sd.req()) { UI.toast(sd.reqText, '#ff8080'); Sound.sfx('miss'); return; }
    if (sd.night && !this.isNight()) { UI.toast('Esta misión es de NOCHE (20:00 - 4:00). Duerme o haz otras cosas mientras.', '#a0a0ff'); return; }
    Missions.start(sd);
  },
  talkTo(p) {
    p.dir = dirFromVec(PL.x - p.x, PL.y - p.y);
    if (p.female) {
      const r = pick(ROASTS);
      addCope(6);
      UI.dialog([['narrador', 'Ella: "' + r[0] + '"'], ['jesus', r[1]], ['narrador', 'Ella: "' + r[2] + '"']]);
      return;
    }
    const pool = LINES[p.type] || LINES.vato;
    UI.dialog([['narrador', '"' + pick(pool) + '"']]);
  },
  keys() {
    if (Input.hit('back')) Shops.pause();
    else if (Input.hit('phone')) Shops.phone();
    else if (Input.hit('map')) UI.map();
    else if (Input.hit('inv')) UI.figures();
    else if (Input.hit('radio')) { S.radio = (S.radio + 1) % RADIOS.length; this.radioT = 3; if (PL.car) Sound.play(RADIOS[S.radio].id); Sound.sfx('select'); }
    else if (Input.hit('miracle')) this.useMiracle();
    else if (Input.hit('mnext')) {
      const ks = ['tacos', 'cheve', 'expulsar'].filter(k => S.miracles[k]);
      if (ks.length) { S.msel = ks[(ks.indexOf(S.msel) + 1) % ks.length]; UI.toast('Milagro: ' + MIRACLES[S.msel].name, '#fff6a0'); }
    }
  },
  onEnterCar(c) { const id = RADIOS[S.radio].id; Sound.play(id); this.radioT = 2.5; },
  onExitCar() { this.resumeMusic(); },
  resumeMusic() {
    if (this.boss) { Sound.play('boss'); return; }
    if (PL.car) Sound.play(RADIOS[S.radio].id);
    else Sound.play(null);
  },

  useMiracle() {
    const k = S.msel;
    if (!k || !S.miracles[k]) { UI.toast('Aún no tienes milagros. Sigue la historia.', '#a0a0c0'); return; }
    const M = MIRACLES[k];
    if (S.fe < M.cost) { UI.toast('No tienes suficiente FE (' + M.cost + '). Reza o ayuda a la gente.', '#ff8080'); Sound.sfx('miss'); return; }
    const pp = playerPos();
    if (k === 'tacos') {
      S.fe -= M.cost; S.hp = Math.min(maxHp(), S.hp + 50); S.hunger = Math.min(100, S.hunger + 50);
      for (let i = 0; i < 5; i++) E.pickups.push({ x: pp.x + rnd(-30, 30), y: pp.y + rnd(-20, 20), kind: 'heal', val: 10, t: 0 });
      floater(pp.x, pp.y - 30, '¡MULTIPLICAR TACOS!', '#ffa040');
    } else if (k === 'cheve') {
      let near = false;
      for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if (World.get(Math.floor(pp.x / TS) + dx, Math.floor(pp.y / TS) + dy) === TT.WATER) { near = true; break; }
      if (!near) { UI.toast('Necesitas estar cerca del agua (río o presa).', '#80c0ff'); return; }
      S.fe -= M.cost; const v = rndi(150, 300); this.addMoney(v); addCope(-15);
      floater(pp.x, pp.y - 30, '¡AGUA EN CHEVE!', '#ffd040');
      UI.toast('Vendiste cheves milagrosas a los del malecón. +' + money(v), '#ffd040');
    } else if (k === 'expulsar') {
      S.fe -= M.cost;
      Cam.shake = 8;
      for (const p of E.peds) {
        const d = dist(p.x, p.y, pp.x, pp.y);
        if (d < 100) {
          const a = Math.atan2(p.y - pp.y, p.x - pp.x);
          for (let i = 0; i < 6; i++) moveEnt(p, Math.cos(a) * 8, Math.sin(a) * 8);
          if (p.hostile && !(p.def && p.def.invul)) { p.hp -= 70; if (p.hp <= 0) koPed(p); }
          else if (!p.female) { p.state = 'down'; p.downT = 2; }
        }
      }
      for (const o of E.objs) if (!o.dead && dist(o.x, o.y, pp.x, pp.y) < 100) hitObj(o, 60);
      if (this.boss && dist(this.boss.x, this.boss.y, pp.x, pp.y) < 130) this.hitBoss(120);
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; E.parts.push({ x: pp.x, y: pp.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: .5, col: '#fff6a0', sz: 2, grav: 0 }); }
      floater(pp.x, pp.y - 30, '¡FUERA, MERCADERES!', '#fff6a0');
    }
    Sound.sfx('miracle');
  },

  // ---------------- JEFE FINAL ----------------
  startBoss(kind, at) {
    this.boss = { kind, x: at.x, y: at.y, hp: 1400, maxhp: 1400, t: 0, atkT: 2, mode: 'walk', modeT: 0, hurtT: 0, summoned: false, vx: 0, vy: 0 };
    UI.banner('JEFE FINAL', 'MECHA-YESENIA (piloteada por el Lic.)', '#ff4080');
  },
  hitBoss(d) {
    const b = this.boss; if (!b) return;
    b.hp -= d; b.hurtT = .1; Sound.sfx('punch');
    burst(b.x + rnd(-15, 15), b.y - rnd(20, 60), ['#ffffff', '#ff60c0', '#40ffa0'], 6, 80);
    floater(b.x, b.y - 90, Math.round(d) + '', '#ffe060');
    if (b.hp <= 0) {
      Sound.sfx('boom'); Cam.shake = 14;
      for (let i = 0; i < 6; i++) setTimeout(() => { Sound.sfx('boom'); burst(b.x + rnd(-30, 30), b.y - rnd(0, 80), ['#ff8020', '#ffe040', '#ff60c0', '#ffffff'], 30, 160, 40); }, i * 180);
      this.boss = null;
    }
  },
  updateBoss(dt) {
    const b = this.boss;
    b.t += dt; b.hurtT = Math.max(0, b.hurtT - dt); b.atkT -= dt; b.modeT -= dt;
    const pp = playerPos();
    const dx = pp.x - b.x, dy = pp.y - (b.y - 30), d = Math.hypot(dx, dy) || 1;
    if (b.mode === 'walk') {
      if (d > 60) { const s = 30 + (1 - b.hp / b.maxhp) * 30; const nx = b.x + dx / d * s * dt, ny = b.y + dy / d * s * dt; if (!World.solidPx(nx, ny, 'c')) { b.x = nx; b.y = ny; } }
      if (b.atkT <= 0) {
        b.atkT = b.hp < b.maxhp / 2 ? 1.6 : 2.3;
        const r = Math.random();
        if (r < 0.5) {
          const n = b.hp < b.maxhp / 2 ? 7 : 5;
          for (let i = 0; i < n; i++) { const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.22; E.projs.push({ x: b.x, y: b.y - 50, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 2, dmg: 9, owner: 'en', kind: 'figura', rot: 0 }); }
          Sound.sfx('throw');
        } else if (r < 0.8 && d < 260) { b.mode = 'charge'; b.modeT = .9; b.vx = dx / d; b.vy = dy / d; Sound.sfx('horn'); }
        else { for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + b.t; E.projs.push({ x: b.x, y: b.y - 40, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 2.4, dmg: 7, owner: 'en', kind: 'agua2', rot: 0 }); } }
      }
      if (!b.summoned && b.hp < b.maxhp / 2) {
        b.summoned = true;
        UI.toast('EL LIC: "¡GUARDIAS! ¡PROTEJAN LA INVERSIÓN!"', '#ff6060');
        spawnGroup(Missions.active, 'guardia', 4, b.x, b.y + 20, 60);
      }
    } else if (b.mode === 'charge') {
      const s = 250; const nx = b.x + b.vx * s * dt, ny = b.y + b.vy * s * dt;
      if (!World.solidPx(nx, ny, 'c')) { b.x = nx; b.y = ny; } else b.modeT = 0;
      if (d < 36) { hurtPlayer(16); knockPlayer(b.vx * 20, b.vy * 20); }
      if (b.modeT <= 0) b.mode = 'walk';
    }
    if (PL.car && inCar(PL.car, b.x, b.y - 20, 18) && Math.abs(PL.car.v) > 60) { this.hitBoss(Math.abs(PL.car.v) * 0.3); PL.car.v *= -0.5; PL.car.hp -= 15; }
  },

  // ---------------- UTILIDADES ----------------
  isNight() { return S.time >= 20 * 60 || S.time < 4 * 60; },
  darkness() {
    const h = S.time / 60;
    if (h >= 21 || h < 4.5) return 0.62;
    if (h >= 18.5) return (h - 18.5) / 2.5 * 0.62;
    if (h < 6.5) return (6.5 - h) / 2 * 0.62;
    return 0;
  },
  addMoney(v, fl) {
    S.money += v;
    if (fl) floater(playerPos().x, playerPos().y - 26, '+' + money(v), '#60ff80');
    Sound.sfx('coin');
  },
  stat(k) { S.stats[k] = (S.stats[k] || 0) + 1; },
  calcPerks() {
    const p = {};
    for (const id in S.figs) { const f = FIG[id]; if (f) p[f.perk[0]] = (p[f.perk[0]] || 0) + f.perk[1] * (S.oficial === id ? 2 : 1); }
    this.perks = p;
  },
  figValue() { return S.spent || 0; },
  giveFigure(id, src) {
    const f = FIG[id]; if (!f) return;
    if (S.figs[id]) { UI.toast('Ya tenías ' + f.name + '. Ahora tienes dos. Una para ver, otra para llorar.', '#ff80c0'); this.addMoney(100); return; }
    S.figs[id] = 1;
    if (!S.oficial) S.oficial = id;
    S.lastBuyDay = S.day; S.anx = 0;
    this.calcPerks();
    Sound.sfx('level');
    UI.banner('¡NUEVA FIGURA!', f.name, RARCOL[f.rar]);
    if (Object.keys(S.figs).length === FIGURES.length) setTimeout(() => UI.banner('¡COLECCIÓN COMPLETA!', 'Has alcanzado el nirvana otaku. Doña Lupe llora.', '#ffd060'), 3200);
  },
  applyGym(good, kind) {
    let gain = 0;
    if (!S.trained || kind === 'pierna') {
      gain = (good * 0.55 + 0.5) * (1 + perk('gym') / 100) * (S.flags.whey ? 1.5 : 1) * Math.max(0.35, 1 - S.mamadez / 140);
      if (S.flags.whey) { S.flags.whey--; UI.toast('La proteína whey hizo efecto (x1.5).', '#80c0ff'); }
      S.mamadez = Math.min(100, S.mamadez + gain);
      S.trained = true; S.flags.sinBombeo = false;
      addCope(-good * 1.5);
      S.hunger = Math.max(0, S.hunger - 15);
      UI.toast('+' + gain.toFixed(1) + ' MAMADEZ. Hoy sí cuenta.', '#60a0ff');
    } else UI.toast('Ya entrenaste hoy. Sobreentrenar no da gains, solo dolor.', '#a0a0c0');
    S.time += 60;
    return gain;
  },
  playerDown(kind) {
    if (this.state !== 'play' || this.downLock) return;
    if (kind === 'ko' && S.miracles.resurrect && !S.resUsed) {
      S.resUsed = true; S.hp = maxHp(); PL.inv = 2;
      Sound.sfx('miracle'); UI.banner('¡RESUCITASTE!', 'Al tercer segundo. Como debe ser.', '#fff6a0');
      return;
    }
    this.downLock = true;
    if (Missions.active) Missions.fail(kind === 'ko' ? 'Te noquearon.' : 'Te arrestaron.');
    if (PL.car) { PL.car.ai = null; PL.car = null; }
    const loc = kind === 'ko' ? LOC('hospital') : LOC('comisaria');
    const cost = Math.min(S.money, kind === 'ko' ? 200 : 300);
    S.money -= cost; S.wanted = 0;
    S.time += kind === 'ko' ? 180 : 240;
    if (S.time >= 1440) { S.time -= 1440; this.newDay(false); }
    S.hp = maxHp() * (kind === 'ko' ? 0.6 : 0.9);
    addCope(15);
    if (kind === 'busted') { S.weapons = { puno: 1 }; S.wsel = 'puno'; }
    for (const p of E.peds) if (p.type === 'cop') p.copAngry = false;
    E.cars = E.cars.filter(c => c.ai !== 'cop');
    Sound.sfx('fail');
    UI.dialog([
      kind === 'ko' ? ['narrador', 'TE NOQUEARON. Despiertas en el HOSPITAL. Te cobraron ' + money(cost) + '. La enfermera te dijo "bonito pelo" con sarcasmo.']
        : ['comandanta', '¿Otra vez tú, pelo de libro? Paga tu multa de ' + money(cost) + ' y lárgate. Y te quito tus juguetes.']
    ], () => { this.downLock = false; });
    PL.x = loc.x; PL.y = loc.y + 6;
    this.snapCam();
    this.resumeMusic();
  },
  sleep() {
    if (S.time < 6 * 60) S.time = 6 * 60;
    else { S.time = 6 * 60; this.newDay(true); }
    S.hp = maxHp(); addCope(-10);
    this.save(true);
    const lines = [['narrador', 'Jesús duerme abrazando su almohada de la Remu. Día ' + S.day + '. (Partida guardada.)']];
    const chat = S.flags.yeseniaBot ? (S.flags.karla ? pick(KARLA_CHATS) : null) : pick(YES_CHATS);
    if (chat) {
      const who = S.flags.yeseniaBot ? 'karla' : 'yesenia';
      lines.unshift({ who, text: chat.q, choices: chat.opts.map(o => ({ t: o.t, fn: () => {
        if (o.cost) { if (S.money < o.cost) return [['jesus', '(No me alcanza... ' + money(S.money) + '. Qué vergüenza.)'], [who, 'ok. bye.']]; S.money -= o.cost; }
        S.loyalty += o.loy || 0; addCope(o.cope || 0); if (o.fe) S.fe += o.fe;
        return [[who, o.r]];
      } })) });
      lines.unshift(['narrador', 'Antes de dormir, llega un mensaje...']);
    } else if (S.flags.yeseniaBot) lines.unshift(['jesus', '(Ya nadie me escribe en las noches. Bueno, el Brayan. Memes de gym a las 4am.)']);
    UI.dialog(lines, () => { this.save(true); Sound.play('home'); setTimeout(() => this.resumeMusic(), 4000); });
  },

  // ---------------- DIBUJO ----------------
  draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.state === 'splash') { this.drawSplash(); return; }
    if (this.state === 'title') { this.drawTitle(); UI.draw(); return; }
    const full = UI.top() && (UI.top().type === 'gym' || UI.top().type === 'figs' || UI.top().type === 'map' || UI.top().type === 'credits');
    if (!full) { this.drawWorld(); UI.drawHUD(); }
    UI.draw();
  },
  drawSplash() {
    const t = this.splashT;
    ctx.fillStyle = '#100c18'; ctx.fillRect(0, 0, W, H);
    const a = Math.min(1, t * 2, (3.2 - t) * 2);
    ctx.globalAlpha = clamp(a, 0, 1);
    // kazoo pixel art
    const kx = W / 2 - 40, ky = 90 + Math.sin(t * 8) * 2;
    ctx.fillStyle = '#f0c030'; ctx.fillRect(kx, ky + 8, 70, 14); ctx.fillRect(kx + 70, ky + 4, 12, 22);
    ctx.fillStyle = '#c09020'; ctx.fillRect(kx, ky + 18, 70, 4);
    ctx.fillStyle = '#e04040'; ctx.fillRect(kx + 30, ky, 12, 10);
    ctx.fillStyle = '#ffe080'; ctx.fillRect(kx + 4, ky + 10, 30, 2);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffffff'; const nx = kx + 92 + i * 14 + (t * 30 % 14), ny = ky + 4 - i * 8 - Math.sin(t * 6 + i) * 4; ctx.fillRect(nx, ny, 4, 4); ctx.fillRect(nx + 3, ny - 8, 1, 9); }
    bigTxt('KAZOO STUDIOS', W / 2, 140, 16, '#ffffff', 'center', '#e04040');
    txt('presenta', W / 2, 166, '#a0a0c0', 'center');
    ctx.globalAlpha = 1;
  },
  drawTitle() {
    const t = this.t;
    const cx = (Math.sin(t * 0.05) * 0.5 + 0.5) * (MW * TS - W), cy = 40 * TS + Math.sin(t * 0.08) * 300;
    ctx.drawImage(World.canvas, Math.round(cx), Math.round(cy), W, H, 0, 0, W, H);
    ctx.fillStyle = 'rgba(10,6,24,0.7)'; ctx.fillRect(0, 0, W, H);
    // Jesús gigante
    const img = charSprite(Object.assign({}, SPEC.jesus, { lvl: 2 })).down[Math.floor(t * 4) % 3];
    ctx.drawImage(img, 330, 70, 108, 120);
    txt('KAZOO STUDIOS presenta', 24, 20, '#a0a0c0');
    bigTxt('JESUS', 24, 38, 32, '#ffd060', 'left', '#a03010');
    bigTxt('SIMULATOR', 26, 76, 24, '#ff80c0', 'left', '#401040');
    txt('EL HÉROE DE GUAMÚCHIL', 28, 108, '#ffffff');
    txt('Un GTA 8-bit en el Valle del Évora', 28, 120, '#80c0ff');
    const it = this.titleItems();
    it.forEach((o, i) => {
      const sel = i === this.titleSel;
      txt((sel ? '> ' : '  ') + o.t, 34, 146 + i * 16, sel ? '#ffd060' : '#c0c0d0');
    });
    txt('+18 · Humor vulgar · Sátira: el chud ES el chiste', W / 2, 246, '#806878', 'center');
    txt('v1.0 · Kazoo Studios', W / 2, 258, '#504858', 'center');
  },
  drawWorld() {
    const sx = Math.round(Cam.x + (Cam.shake ? rnd(-Cam.shake, Cam.shake) : 0));
    const sy = Math.round(Cam.y + (Cam.shake ? rnd(-Cam.shake, Cam.shake) : 0));
    ctx.drawImage(World.canvas, sx, sy, W, H, 0, 0, W, H);
    ctx.save(); ctx.translate(-sx, -sy);
    // brillos del agua
    const t = this.t;
    ctx.fillStyle = 'rgba(200,230,255,0.5)';
    for (let ty = Math.floor(sy / TS); ty <= Math.floor((sy + H) / TS); ty++) for (let tx = Math.floor(sx / TS); tx <= Math.floor((sx + W) / TS); tx++) {
      if (World.get(tx, ty) !== TT.WATER) continue;
      const ph = (hsh(tx, ty, 8) * 6 + t * 1.5) % 6;
      if (ph < 1) ctx.fillRect(tx * TS + Math.floor(hsh(tx, ty, 9) * 12), ty * TS + Math.floor(hsh(ty, tx, 9) * 14), 3, 1);
    }
    // marcas de llanta
    ctx.fillStyle = 'rgba(20,20,20,0.5)';
    for (const m of E.marks) if (m.x > sx - 4 && m.x < sx + W + 4 && m.y > sy - 4 && m.y < sy + H + 4) ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2);
    // cruces del tren
    if (Train.active) {
      const on = Math.floor(t * 4) % 2;
      for (const v of World.vroads) {
        const x = v.x * TS, y = 54 * TS;
        if (x < sx - 80 || x > sx + W + 80) continue;
        ctx.fillStyle = on ? '#ff2020' : '#401010'; ctx.fillRect(x - 6, y + 2, 4, 4); ctx.fillRect(x + 66, y + 2, 4, 4);
        ctx.fillStyle = '#e0e0e0'; ctx.fillRect(x, y + 4, 64, 2); ctx.fillStyle = '#d02020'; for (let i = 0; i < 64; i += 8) ctx.fillRect(x + i, y + 4, 4, 2);
      }
    }
    World.drawStatue(ctx, 0, 0, t);
    // pickups
    for (const k of E.pickups) {
      if (!onScreen(k.x, k.y)) continue;
      const bob = Math.round(Math.sin(k.t * 5) * 2);
      if (k.kind === 'cash') { ctx.fillStyle = '#208030'; ctx.fillRect(k.x - 4, k.y - 3 + bob, 8, 5); ctx.fillStyle = '#60e070'; ctx.fillRect(k.x - 3, k.y - 2 + bob, 6, 3); ctx.fillStyle = '#208030'; ctx.fillRect(k.x - 1, k.y - 2 + bob, 2, 3); }
      else if (k.kind === 'heal') { ctx.fillStyle = '#e0c060'; ctx.fillRect(k.x - 5, k.y - 3 + bob, 10, 5); ctx.fillStyle = '#a04020'; ctx.fillRect(k.x - 3, k.y - 4 + bob, 6, 2); ctx.fillStyle = '#40a040'; ctx.fillRect(k.x - 2, k.y - 5 + bob, 2, 1); }
      else if (k.kind === 'mission') { ctx.fillStyle = '#ffff40'; ctx.fillRect(k.x - 1, k.y - 40, 2, 34); ctx.fillStyle = '#5aa040'; ctx.fillRect(k.x - 5, k.y - 8 + bob, 10, 8); ctx.fillStyle = '#90e060'; ctx.fillRect(k.x - 3, k.y - 7 + bob, 2, 2); ctx.fillRect(k.x + 1, k.y - 5 + bob, 2, 2); }
      else if (k.kind === 'fig') {
        if (Math.floor(t * 8 + k.x) % 4 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(k.x + rnd(-8, 8), k.y - 10 + rnd(-8, 8), 1, 1); }
        ctx.drawImage(figIcon(FIG[k.id], false), k.x - 9, k.y - 18 + bob);
      } else if (k.kind === 'stash') { ctx.fillStyle = '#806030'; ctx.fillRect(k.x - 5, k.y - 6 + bob, 10, 8); ctx.fillStyle = '#60e070'; ctx.fillRect(k.x - 3, k.y - 8 + bob, 6, 3); }
    }
    // objetos de misión (servidores)
    for (const o of E.objs) {
      if (o.dead) continue;
      o.hurtT = Math.max(0, (o.hurtT || 0) - 1 / 60);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(o.x - 10, o.y + 4, 22, 5);
      ctx.fillStyle = o.hurtT > 0 ? '#ffffff' : '#30303a'; ctx.fillRect(o.x - 10, o.y - 22, 20, 28);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = Math.floor(t * 6 + i) % 3 ? '#40ffa0' : '#ff60c0'; ctx.fillRect(o.x - 7, o.y - 19 + i * 5, 3, 2); ctx.fillStyle = '#505060'; ctx.fillRect(o.x - 2, o.y - 19 + i * 5, 10, 2); }
      bar(o.x - 10, o.y - 28, 20, 2, o.hp / o.maxhp, '#40ffa0');
    }
    // marcador de misión
    const sd = Missions.storyDef();
    if (sd && !Missions.active) {
      const l = LOC(sd.start);
      if (onScreen(l.x, l.y, 40)) {
        ctx.fillStyle = 'rgba(255,240,80,0.18)'; ctx.fillRect(l.x - 7, l.y - 60, 14, 62);
        ctx.fillStyle = 'rgba(255,240,80,0.35)'; ctx.beginPath(); ctx.ellipse(l.x, l.y, 12, 5, 0, 0, 7); ctx.fill();
        bigTxt('!', l.x, l.y - 46 + Math.sin(t * 5) * 3, 16, '#ffff40', 'center', '#000');
      }
    }
    // entidades ordenadas por Y
    const list = [];
    for (const c of E.cars) if (onScreen(c.x, c.y, 40)) list.push(c);
    for (const p of E.peds) if (onScreen(p.x, p.y, 30)) list.push(p);
    if (!PL.car) list.push(PL);
    if (this.boss) list.push(this.boss);
    list.sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e === PL) this.drawPlayer();
      else if (e === this.boss) drawMecha(ctx, e.x, e.y, e.t, e.hurtT > 0);
      else if (e.kind === 'car') this.drawCar(e);
      else this.drawPed(e);
    }
    ctx.restore();
    Train.draw(ctx);
    ctx.save(); ctx.translate(-sx, -sy);
    // proyectiles
    for (const b of E.projs) {
      if (b.kind === 'chancla') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = '#ff60a0'; ctx.fillRect(-4, -2, 8, 4); ctx.fillStyle = '#f0f0f0'; ctx.fillRect(-1, -2, 2, 4); ctx.restore(); }
      else if (b.kind === 'garbanzo') { ctx.fillStyle = '#e0d070'; ctx.fillRect(b.x - 1, b.y - 1, 3, 3); }
      else if (b.kind === 'agua' || b.kind === 'agua2') { ctx.fillStyle = b.kind === 'agua2' ? '#40ffa0' : '#80c0ff'; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 1, 1, 1); }
      else if (b.kind === 'figura') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot * 0.5); ctx.fillStyle = '#ff60c0'; ctx.fillRect(-3, -5, 6, 10); ctx.fillStyle = '#f4c8a0'; ctx.fillRect(-2, -5, 4, 3); ctx.restore(); }
    }
    for (const p of E.parts) { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz); }
    ctx.restore();
    // noche
    const dk = this.darkness();
    if (dk > 0) this.drawLights(dk, sx, sy);
    // lluvia
    if (S.flags.rain) {
      ctx.fillStyle = 'rgba(20,30,60,0.25)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(180,200,255,0.5)';
      for (let i = 0; i < 120; i++) { const x = (hsh(i, 1, 2) * W + t * 60) % W, y = (hsh(i, 2, 3) * H + t * 400) % H; ctx.fillRect(Math.round(x), Math.round(y), 1, 5); }
    }
    if (PL.copeT > 0) { ctx.fillStyle = 'rgba(160,60,255,' + (0.12 + Math.sin(t * 8) * 0.05) + ')'; ctx.fillRect(0, 0, W, H); }
    if (S.hp < maxHp() * 0.25) { ctx.fillStyle = 'rgba(255,0,0,' + (0.1 + Math.sin(t * 6) * 0.06) + ')'; ctx.fillRect(0, 0, W, H); }
    // textos flotantes y burbujas
    ctx.save(); ctx.translate(-sx, -sy);
    for (const f of E.floaters) { ctx.globalAlpha = Math.min(1, f.life * 2); txt(f.text, f.x, f.y, f.col, 'center'); }
    ctx.globalAlpha = 1;
    for (const p of E.peds) if (p.say && onScreen(p.x, p.y)) this.bubble(p.x, p.y - 22, p.say, p.hostile ? '#ffd0d0' : '#ffffff');
    if (PL.say && !PL.car) this.bubble(PL.x, PL.y - 26, PL.say, '#e0d0ff');
    ctx.restore();
  },
  bubble(x, y, s, col) {
    const ls = wrap(s, 150);
    ctx.font = FONT;
    const w = Math.max(...ls.map(l => ctx.measureText(l).width)) + 8, h = ls.length * 10 + 4;
    const bx = Math.round(clamp(x - w / 2, Cam.x + 2, Cam.x + W - w - 2)), by = Math.round(y - h);
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
    ctx.fillStyle = col; ctx.fillRect(bx, by, w, h);
    ctx.fillRect(Math.round(x) - 2, by + h, 4, 3);
    ls.forEach((l, i) => txt(l, bx + 4, by + 3 + i * 10, '#101010', 'left', false));
  },
  drawPlayer() {
    const sp = jesusSpec();
    if (PL.inv > 0 && Math.floor(this.t * 20) % 2) return;
    // aura del pelo divino
    if (S.hair >= 4 || PL.copeT > 0) { ctx.fillStyle = PL.copeT > 0 ? 'rgba(200,100,255,0.35)' : 'rgba(255,240,150,0.3)'; ctx.beginPath(); ctx.arc(PL.x, PL.y - 14, 12 + Math.sin(this.t * 6) * 2, 0, 7); ctx.fill(); }
    const onW = World.tileAt(PL.x, PL.y) === TT.WATER;
    drawChar(ctx, sp, PL.dir, PL.atkT > 0 ? 1 : PL.frame, PL.x, PL.y, { noShadow: onW });
    if (onW) { ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.fillRect(PL.x - 6, PL.y, 12, 1); }
    if (PL.atkT > 0) {
      const w = WEAPONS[S.wsel];
      const hx = PL.x + PL.fx * 11, hy = PL.y - 9 + PL.fy * 7;
      if (w.melee) {
        ctx.fillStyle = S.wsel === 'bate' ? '#a07040' : '#e8b080';
        if (S.wsel === 'bate') { ctx.save(); ctx.translate(PL.x, PL.y - 9); ctx.rotate(Math.atan2(PL.fy, PL.fx) - 0.8 + (0.22 - PL.atkT) * 7); ctx.fillRect(2, -1, 14, 3); ctx.restore(); }
        else ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(Math.round(hx) - 4, Math.round(hy) - 1, 2, 2); ctx.fillRect(Math.round(hx) + 3, Math.round(hy) - 3, 2, 2);
      }
    }
  },
  drawPed(p) {
    if (p.state === 'rescue') {
      ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.fillRect(p.x - 7, p.y - 4, 14, 2);
      ctx.save(); ctx.beginPath(); ctx.rect(p.x - 12, p.y - 30, 24, 26); ctx.clip();
      drawChar(ctx, p.spec, 1, p.frame, p.x, p.y + 4, { noShadow: true });
      ctx.restore();
      return;
    }
    const down = p.state === 'down';
    if (p.hurtT > 0 && Math.floor(this.t * 30) % 2) ctx.globalAlpha = 0.5;
    drawChar(ctx, p.spec, p.dir, down ? 0 : p.frame, p.x, p.y, { down });
    ctx.globalAlpha = 1;
    if (p.stunT > 0) { ctx.fillStyle = '#80c0ff'; ctx.fillRect(p.x - 6 + Math.sin(this.t * 10) * 4, p.y - 24, 2, 2); }
    if (down) { ctx.fillStyle = '#ffe060'; for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; ctx.fillRect(p.x + Math.cos(a) * 7, p.y - 12 + Math.sin(a) * 2, 2, 2); } }
    if (p.hostile && !p.def.invul && p.hp < p.maxhp && !p.def.boss) bar(p.x - 8, p.y - 24, 16, 2, p.hp / p.maxhp, '#ff4040');
    if (p.hostile && p.mission && !p.def.invul) { ctx.fillStyle = '#ff3030'; ctx.fillRect(p.x - 1, p.y - 30 + Math.sin(this.t * 6) * 1.5, 3, 3); }
  },
  drawCar(c) {
    const img = carSprite(c.type, c.dead ? '#2a2a2a' : c.color);
    ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y)); ctx.rotate(c.a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-c.L / 2 + 2, -c.Wd / 2 + 3, c.L, c.Wd);
    ctx.drawImage(img, -c.L / 2 - 1, -c.Wd / 2 - 2);
    if (c.dead) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-c.L / 2, -c.Wd / 2, c.L, c.Wd); }
    if (c.siren && c.type === 'police') {
      const on = Math.floor(this.t * 8) % 2;
      ctx.fillStyle = on ? '#ff2020' : '#2040ff'; ctx.fillRect(-2, -c.Wd / 2 + 2, 3, c.Wd - 4);
    }
    if (c.mission && c !== PL.car && (c.ai === 'flee' || c.ai === 'tail')) { ctx.fillStyle = '#ff3030'; ctx.fillRect(-2, -2, 4, 4); }
    ctx.restore();
  },
  drawLights(dk, sx, sy) {
    if (!this.lightC) { this.lightC = mkCanvas(W, H); this.lightSpr = mkCanvas(64, 64); const g = this.lightSpr.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const c = this.lightC.getContext('2d');
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(8,10,40,' + dk + ')'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out';
    const L = (x, y, r) => { if (x < sx - r || x > sx + W + r || y < sy - r || y > sy + H + r) return; c.drawImage(this.lightSpr, x - sx - r, y - sy - r, r * 2, r * 2); };
    for (const l of World.lights) L(l.x, l.y, 44);
    for (const car of E.cars) { if (car.dead || (!car.ai && car !== PL.car)) continue; const co = Math.cos(car.a), si = Math.sin(car.a); L(car.x + co * 34, car.y + si * 34, 30); L(car.x + co * 60, car.y + si * 60, 26); }
    const pp = playerPos(); L(pp.x, pp.y, 28);
    if (Train.active) L(Train.x, Train.y, 60);
    if (this.boss) L(this.boss.x, this.boss.y - 40, 70);
    c.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightC, 0, 0);
    // farolitos
    ctx.fillStyle = 'rgba(255,220,120,' + dk * 0.8 + ')';
    for (const l of World.lights) if (l.x > sx && l.x < sx + W && l.y > sy && l.y < sy + H) ctx.fillRect(l.x - sx - 1, l.y - sy - 1, 3, 3);
  }
};

// ============================================================
//  TIENDAS Y LUGARES
// ============================================================
const Shops = {
  open(id) {
    const fn = this[id];
    if (fn) fn.call(this); else UI.toast('Está cerrado. Como tu corazón.', '#a0a0c0');
  },
  item(label, price, desc, buy, extra) {
    return Object.assign({ label, right: price ? money(price) : '', rcol: S.money >= price ? '#80ff80' : '#ff6060', desc, disabled: price && S.money < price, why: 'No te alcanza. Gastaste todo en figuras, ¿verdad?', fn: () => { S.money -= price || 0; Sound.sfx('buy'); return buy(); } }, extra || {});
  },
  home() {
    UI.menu({ title: 'CASA DE JESÚS', sub: 'Huele a desodorante en aerosol y Cheetos', items: () => [
      { label: 'Dormir (guardar y pasar al día siguiente)', desc: S.trained ? 'Ya fuiste al gym hoy. Duerme tranquilo, campeón.' : '¡OJO! No has ido al gym. Si duermes, pierdes MAMADEZ y racha.', fn: () => { UI.pop(); Game.sleep(); return; } },
      { label: 'Comida de mamá (gratis, 1 vez al día)', disabled: S.momFoodDay === S.day, why: 'Ya comiste. Doña Lupe no es tu sirvienta.', desc: '"¿Otra vez vas a comer arroz con pollo? Sí, porque es lo que hay."', fn: () => { S.momFoodDay = S.day; S.hunger = 100; S.hp = maxHp(); Sound.sfx('coin'); UI.toast('Comiste como rey. Doña Lupe te dio también un sermón.', '#80ff80'); } },
      { label: 'Ver anime hasta la noche (20:00)', disabled: Game.isNight(), why: 'Ya es de noche.', desc: 'Maratón de 14 capítulos. -10 COPIUM, -20 HAMBRE.', fn: () => { S.time = 20 * 60; addCope(-10); S.hunger = Math.max(0, S.hunger - 20); UI.toast('Viste 14 capítulos. Lloraste en 3. Ya es de noche.', '#a0a0ff'); return 'close'; } },
      { label: 'Hacer stream en Twitch', disabled: S.streamDay === S.day, why: 'Ya hiciste stream hoy. Tus 3 viewers necesitan descansar.', desc: 'Gana lana con donaciones de tus 3 viewers fieles (uno es tu tía).', fn: () => { UI.pop(); Stream.start(); } },
      { label: 'Admirar la vitrina de figuras', desc: 'Contempla tu inversión. Tu retiro. Tu legado.', fn: () => { UI.pop(); UI.figures(); } },
      { label: 'Guardar partida', desc: 'Guarda en el navegador.', fn: () => { Game.save(); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  gym() {
    UI.menu({ title: 'TITANES GYM', sub: () => 'Racha: ' + S.streak + ' días · Mamadez: ' + Math.floor(S.mamadez), items: () => [
      { label: 'Entrenar: Press de banca', desc: S.trained ? 'Ya entrenaste hoy (no hay gains extra).' : 'Pecho de acero. O al menos de aluminio.', fn: () => { UI.pop(); UI.gymGame('banca'); } },
      { label: 'Entrenar: Curl en el rack', desc: 'El crimen favorito de los chuds. Don Chava te mira con odio.', fn: () => { UI.pop(); UI.gymGame('curl'); } },
      { label: 'Entrenar: Dominadas', desc: 'Espalda en V. Tu V es más bien una I.', fn: () => { UI.pop(); UI.gymGame('dominadas'); } },
      { label: 'Entrenar: PIERNA', disabled: !S.flags.karla, why: 'Jesús se niega rotundamente. (Se desbloquea en la historia.)', desc: 'Día de pierna. El enemigo final.', fn: () => { UI.pop(); UI.gymGame('pierna', null, true); } },
      this.item('Proteína Whey (x1.5 próxima sesión)', 350, 'Sabor "galleta". Sabe a tierra dulce.', () => { S.flags.whey = (S.flags.whey || 0) + 1; UI.toast('Compraste Whey. La próxima sesión rinde x1.5.', '#80c0ff'); }),
      { label: 'Platicar con Don Chava', desc: 'Sabiduría de un ex-luchador de 61 años.', fn: () => { UI.pop(); UI.dialog([['chava', pick(['Mijo, el gym es como el amor: si faltas, alguien más usa tu rack.', 'La creatina no es droga, es fe en polvo.', 'Yo fui luchador. Me decían "El Garbanzo Asesino". Era chaparro.', '¿Esas muñecas te dan fuerza? Entonces cómprate una de pierna.', 'El Brayan usa esteroides. Tú usas copium. Ninguno de los dos está bien.', 'Si sigues así, en 5 años vas a estar mamado. O muerto. Pero mamado.'])]]); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  otaku() {
    if (!Game.dayShop || Game.dayShop.day !== S.day) {
      const pool = FIGURES.filter(f => f.src === 'shop');
      const un = pool.filter(f => !S.figs[f.id]);
      const pickFrom = un.length >= 5 ? un : pool;
      const stock = [];
      while (stock.length < Math.min(5, pickFrom.length)) { const f = pick(pickFrom); if (!stock.includes(f)) stock.push(f); }
      Game.dayShop = { day: S.day, stock };
    }
    UI.menu({ title: 'OTAKU ÉVORA', sub: () => 'Kenji: "Irasshaimase, Jesús-kun." · ' + money(S.money), w: 380, color: '#ff80c0', items: () => [
      ...Game.dayShop.stock.map(f => this.item((S.figs[f.id] ? '(YA LA TIENES) ' : '') + f.name, f.price, RARITY[f.rar] + ' · +' + f.perk[1] + '% ' + PERKNAME[f.perk[0]] + ' · "' + f.desc + '"', () => { S.spent += f.price; Game.giveFigure(f.id, 'shop'); }, { rcol: S.money >= f.price ? RARCOL[f.rar] : '#ff6060' })),
      this.item('GACHA: Cápsula sorpresa', 150, 'Puede salir cualquier cosa. Bueno, casi siempre sale un llavero.', () => { S.spent += 150; Shops.gacha(); }),
      { label: 'Vender una figura', desc: 'Recupera algo de lana.', fn: () => { UI.toast('Lo intentas... pero tu corazón no te deja. Las figuras NO se venden.', '#ff80c0'); addCope(5); } },
      { label: 'Platicar con Kenji', desc: 'Otaku de 40 años. Tu futuro.', fn: () => { UI.pop(); UI.dialog([['kenji', pick(['Jesús-kun, el amor de una figura es eterno. El de una mujer... no sé, nunca he tenido.', 'Un licenciado vino y se llevó 30 figuras. Pagó con billetes que olían a Suburban.', 'Mi mamá dice que me case. Le dije que ya: con Rei. No le hizo gracia.', 'Si la caja está abierta, pierde el 40% de su valor. Como nosotros al salir de casa.', 'La Feria del Taco es en la Avenida Turística. Yo voy por los tacos, no por la gente.'])]]); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  gacha() {
    const r = Math.random() * 100 - perk('luck');
    const pool = FIGURES.filter(f => f.src === 'gacha' || f.src === 'shop');
    let rar = r < 3 ? 3 : r < 15 ? 2 : r < 45 ? 1 : 0;
    if (rar === 0) { UI.toast(pick(['Salió un llavero de Doraemon pirata. Llora.', 'Salió un sticker que dice "Kawaii". Ok.', 'Salió una goma de borrar con forma de onigiri.', 'Salió... nada. La cápsula estaba vacía. Como tú.']), '#a0a0c0'); addCope(5); return; }
    let cands = pool.filter(f => f.rar === rar);
    if (!cands.length) cands = pool;
    const f = pick(cands);
    Game.giveFigure(f.id, 'gacha');
  },
  taqueria() {
    UI.menu({ title: 'TACOS EL GÜERO', sub: '"Asada, tripa, cabeza. Aquí no hay keto, compa."', color: '#ff9040', items: () => [
      this.item('Taco de asada', 30, '+25 HAMBRE', () => { S.hunger = Math.min(100, S.hunger + 25); S.hp = Math.min(maxHp(), S.hp + 5); }),
      this.item('Orden de 5 tacos', 130, '+100 HAMBRE, +30 VIDA', () => { S.hunger = 100; S.hp = Math.min(maxHp(), S.hp + 30); }),
      this.item('Garbanzo tatemado', 25, '+15 HAMBRE. Orgullo de Salvador Alvarado.', () => { S.hunger = Math.min(100, S.hunger + 15); addCope(-3); }),
      { label: 'CHAMBA: Repartir tacos', desc: 'Entrega 3 órdenes a tiempo. Mientras más rápido, más pagan.', disabled: !!Missions.active, why: 'Termina lo que estás haciendo primero.', fn: () => { UI.pop(); Missions.start(Jobs.tacos()); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  mercado() {
    UI.menu({ title: 'MERCADO MUNICIPAL', sub: '"Pásele, güero, ¿qué va a llevar?"', color: '#70d070', items: () => [
      this.item('Bate de béisbol', S.weapons.bate ? 0 : 250, S.weapons.bate ? 'Ya lo tienes.' : 'Daño x1.8. Para batear malandros (y fallar en el béisbol).', () => { if (S.weapons.bate) { UI.toast('Ya tienes bate.', '#a0a0c0'); return; } S.weapons.bate = 1; S.wsel = 'bate'; }),
      this.item('Chanclas x10', 80, 'Arma arrojadiza. Herencia de Doña Lupe.', () => { S.weapons.chancla = (S.weapons.chancla || 0) + 10; }),
      this.item('Resortera + 30 garbanzos', 150, 'Garbanzo de la región a alta velocidad.', () => { S.weapons.resortera = (S.weapons.resortera || 0) + 30; }),
      this.item('Pistola de agua (20 tiros)', 200, 'Aturde a los enemigos. Moja a los civiles.', () => { S.weapons.agua = (S.weapons.agua || 0) + 20; }),
      this.item('Elote preparado', 35, '+30 HAMBRE. Con mayonesa, queso y chile.', () => { S.hunger = Math.min(100, S.hunger + 30); }),
      this.item('Playera de anime nueva', 280, '-20 COPIUM. Ahora con menos manchas.', () => { addCope(-20); UI.toast('Te sientes fresco. Dura 10 minutos.', '#c080ff'); }),
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  iglesia() {
    UI.menu({ title: 'PARROQUIA', sub: 'Padre Ramiro te mira con preocupación', color: '#f0f0a0', items: () => [
      { label: 'Rezar (+8 FE, 1 vez al día)', disabled: S.prayedDay === S.day, why: 'Ya rezaste hoy. Dios tiene más clientes.', desc: '"Señor, dame fuerzas para el press de banca."', fn: () => { S.prayedDay = S.day; S.fe += 8 * (1 + perk('fe') / 100); Sound.sfx('miracle'); UI.toast('+FE. Sientes paz. Y hambre.', '#fff6a0'); } },
      this.item('Diezmo (+12 FE)', 100, 'La fe no se compra... pero ayuda.', () => { S.fe += 12 * (1 + perk('fe') / 100); }),
      { label: 'Confesarse (-25 COPIUM)', desc: 'Cuéntale tus pecados al Padre.', fn: () => { UI.pop(); addCope(-25); UI.dialog([['jesus', pick(['Padre, he pecado. Me gasté 3 mil pesos en una figura y le dije a mi mamá que era para la escuela.', 'Padre, le hice curl en el rack de sentadillas. Dos veces.', 'Padre, publiqué cosas en Guamúchil Chismes. Otra vez.', 'Padre, le dije "interesada" a una muchacha que solo me preguntó la hora.'])], ['padre', pick(['Reza 10 Padrenuestros y hazle pierna, hijo.', 'Hijo... no. Simplemente no.', 'Dios te perdona. Yo todavía lo estoy pensando.', 'Las mujeres no son el problema, hijo. Eres tú. Con cariño.'])]]); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  barberia() {
    const lv = [null, null, ['Librito VOLUMEN EXTRA', 300], ['Librito EDICIÓN COLECCIONISTA', 900], ['Librito DIVINO (brilla)', 2000]];
    UI.menu({ title: 'BARBERÍA EL LIBRITO', sub: '"El pelo es la corona del chud." · Nivel ' + S.hair, color: '#ff6080', items: () => [
      ...[2, 3, 4].map(n => this.item(lv[n][0], S.hair >= n ? 0 : lv[n][1], S.hair >= n ? 'Ya tienes este nivel.' : 'Más volumen = más carisma (mejores propinas y donaciones).' + (n === 4 ? ' Además brilla con luz divina.' : ''), () => { if (S.hair >= n) return; if (S.hair < n - 1) { S.money += lv[n][1]; UI.toast('Primero el nivel anterior, mijo. Esto es un arte.', '#ff8080'); return; } S.hair = n; UI.toast('¡Nuevo look! Tu pelo tiene ahora más volumen que tu cuenta de banco.', '#ff80c0'); }, { disabled: S.hair >= n || S.money < lv[n][1] })),
      { label: 'Cortarse el pelo normal', desc: 'Un corte de vato normal.', fn: () => { UI.toast('NO. Jamás. El librito es identidad.', '#ff6080'); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  ciber() {
    UI.menu({ title: 'CIBER EL PIXEL', sub: '10 pesos la hora', color: '#40c0ff', items: () => [
      { label: 'Postear en "Guamúchil Chismes"', desc: 'Comparte tu sabiduría con el pueblo. ¿Qué podría salir mal?', fn: () => { UI.pop(); Shops.post(); } },
      this.item('Jugar Free Fire 1 hora', 10, '-15 COPIUM. Pasa 1 hora.', () => { addCope(-15); S.time += 60; UI.toast('Te mató un niño de 11 años 14 veces. Igual te relajaste.', '#80c0ff'); }),
      this.item('Ver figuras en internet 1 hora', 10, '+ANSIEDAD OTAKU. ¿Por qué te haces esto?', () => { S.anx = Math.min(100, S.anx + 20); S.time += 60; UI.toast('Viste una figura de 8 mil pesos. Ahora la necesitas.', '#ff80c0'); }),
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  post() {
    UI.menu({ title: 'GUAMÚCHIL CHISMES Y VENTAS', sub: '47,302 miembros · 46,000 señoras', color: '#4080ff', w: 440, items: () => POSTS.map(p => ({ label: p.t.length > 50 ? p.t.slice(0, 48) + '…' : p.t, desc: p.t, fn: () => {
      UI.pop();
      addCope(p.cope);
      const lines = [['jesus', '"' + p.t + '"'], ['narrador', p.likes + ' likes · ' + rndi(20, 400) + ' comentarios']];
      p.com.forEach(c => lines.push(['narrador', c]));
      if (p.funa) { lines.push(['narrador', 'Las señoras del grupo te reconocieron en la calle. NIVEL DE FUNA +' + p.funa + '.']); }
      UI.dialog(lines, () => { if (p.funa) Police.raise(p.funa); Game.stat('posts'); });
      S.time += 30;
    } })) });
  },
  hospital() {
    UI.menu({ title: 'HOSPITAL', sub: 'La enfermera ya te conoce', color: '#ff6060', items: () => [
      this.item('Curarte completo', 120, 'Vida al máximo.', () => { S.hp = maxHp(); }),
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  comisaria() {
    UI.menu({ title: 'COMISARÍA', sub: 'Comandanta Martínez está comiendo tacos', color: '#4060ff', items: () => [
      this.item('Pagar "mordida" (quitar FUNA)', S.wanted * 250, S.wanted ? 'Se te olvida todo. A nosotros también.' : 'No te buscan. ¿Quieres pagar por gusto?', () => { S.wanted = 0; UI.toast('"Circule, joven. Aquí no pasó nada."', '#80c0ff'); }, { disabled: !S.wanted || S.money < S.wanted * 250 }),
      { label: 'Platicar con la Comandanta', fn: () => { UI.pop(); UI.dialog([['comandanta', pick(['Si te vuelvo a ver robando un Tsuru, te encierro con el Brayan.', 'Dicen que andas haciendo milagros. Aquí el único milagro es que no te he arrestado.', '¿Corporativo Waifu? Mmm. Ese Lic tiene 40 multas sin pagar. Pero tiene buenos abogados.'])]]); } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  museo() {
    UI.menu({ title: 'MUSEO DEL ÉVORA', sub: 'Historia real de Guamúchil', color: '#d0b080', items: () => MUSEO_LORE.map((l, i) => ({ label: 'Placa #' + (i + 1), desc: l, fn: () => { UI.pop(); UI.dialog([['narrador', l]], () => { if (!S.flags['museo' + i]) { S.flags['museo' + i] = 1; S.fe += 3; UI.toast('+3 FE por cultura general', '#fff6a0'); } }); } })).concat([{ label: 'Salir', fn: () => 'close' }]) });
  },
  estacion() {
    UI.menu({ title: 'ESTACIÓN DEL FERROCARRIL', sub: 'El tren le dio vida a Guamúchil', color: '#d08060', items: () => [
      { label: 'Leer la placa', fn: () => { UI.pop(); UI.dialog([['narrador', 'La llegada del ferrocarril, hace más de un siglo, dio origen a la ciudad moderna de Guamúchil. Por eso la Calle Ferrocarril es el corazón del pueblo.'], ['narrador', 'CUIDADO: el tren sigue pasando. No te pares en las vías. En serio.']]); } },
      { label: 'Esperar el tren (pasa 1 hora)', fn: () => { S.time += 60; Train.t = 2; UI.toast('Ahí viene el tren. ¡Quítate de las vías!', '#ffd060'); return 'close'; } },
      { label: 'Salir', fn: () => 'close' }
    ] });
  },
  deportiva() {
    UI.menu({ title: 'PELEAS CLANDESTINAS', sub: 'Unidad Deportiva, de noche nadie ve nada', color: '#c08040', items: () => [0, 1, 2].map(l => this.item('Ronda ' + (l + 1) + ' (premio ' + money([300, 700, 1500][l]) + ')', 100, ['3 vatos.', '5 vatos mamados.', '8 vatos. Dios te ampare.'][l] + ' Entrada: $100.', () => { UI.pop(); Missions.start(Jobs.peleas(l)); }, { disabled: S.money < 100 || !!Missions.active })).concat([{ label: 'Salir', fn: () => 'close' }]) });
  },
  corporativo() {
    UI.toast(S.flags.ending ? 'Clausurado. "Corporativo Waifu S.A. de C.V." ya no existe.' : 'Hay guardias kawaii en la puerta. Mejor no.', '#ff80c0');
  },
  rancho() { UI.toast('Rancho Los Flacos. Huele a cardio y resentimiento.', '#80c080'); },

  // ---------------- CELULAR ----------------
  phone() {
    Sound.sfx('phone');
    UI.menu({ title: 'CELULAR (pantalla estrellada)', phone: true, color: '#80d0ff', closeKey: 'phone', sub: () => fmtTime(S.time) + ' · ' + (S.flags.yeseniaBot ? 'Sin mensajes nuevos' : '1 mensaje de Yesenia <3'), items: () => [
      { label: 'Objetivo actual', desc: Missions.active ? Missions.active.label : Missions.storyDef() ? 'Siguiente misión: ' + Missions.storyDef().name + ' (busca el ! en el mapa)' : 'Historia terminada. ¡Colecciona todas las figuras!', fn: () => { UI.pop(); UI.map(); } },
      { label: 'Postear en Guamúchil Chismes', desc: 'Desde el celular. Con faltas de ortografía.', fn: () => { UI.pop(); Shops.post(); } },
      { label: 'CHAMBA: Raitero (necesitas carro)', disabled: !PL.car || !!Missions.active, why: PL.car ? 'Termina lo que estás haciendo primero.' : 'Necesitas estar en un carro.', desc: 'Lleva pasajeros por Guamúchil.', fn: () => { UI.pop(); Missions.start(Jobs.raite()); } },
      { label: 'Abandonar misión/chamba', disabled: !Missions.active, why: 'No estás en ninguna misión.', desc: 'Rendirse también es una opción. Mala, pero opción.', fn: () => { if (Missions.active) Missions.fail('Te rendiste.'); return 'close'; } },
      { label: 'Estadísticas', desc: 'Tu vida en números.', fn: () => { UI.pop(); UI.dialog([['narrador', 'Día ' + S.day + ' · Racha gym ' + S.streak + ' · Mamadez ' + Math.floor(S.mamadez) + ' · Fidelidad ' + S.loyalty], ['narrador', 'Figuras ' + Object.keys(S.figs).length + '/' + FIGURES.length + ' · Gastado en figuras ' + money(S.spent) + ' · Ansiedad otaku ' + S.anx + '%'], ['narrador', 'KOs ' + (S.stats.kos || 0) + ' · Carros robados ' + (S.stats.carros || 0) + ' · Cachetadas recibidas ' + (S.stats.cachetadas || 0) + ' · Posts ' + (S.stats.posts || 0)]]); } },
      { label: 'Controles', fn: () => { UI.pop(); Game.showControls(); } },
      { label: 'Cerrar', fn: () => 'close' }
    ] });
  },
  pause() {
    UI.menu({ title: 'PAUSA', sub: 'Jesús se queda congelado. Como en las citas.', items: () => [
      { label: 'Continuar', fn: () => 'close' },
      { label: 'Controles', fn: () => { UI.pop(); Game.showControls(); } },
      { label: 'Volumen: ' + Math.round(Sound.vol * 10), desc: 'Izquierda/derecha no, aquí es con ENTER (cicla).', fn: () => { Sound.vol = Sound.vol >= 1 ? 0 : Math.round((Sound.vol + 0.2) * 10) / 10; if (Sound.master) Sound.master.gain.value = Sound.vol; } },
      { label: 'Pantalla completa', fn: () => { Game.fullscreen(); } },
      { label: 'Guardar y salir al título', desc: 'Se guarda tu progreso (en la puerta de tu casa).', fn: () => { Game.save(true); UI.stack = []; Game.state = 'title'; Sound.setEngine(false, 0); Sound.setSiren(false); Sound.play('title'); } }
    ] });
  }
};

// ============================================================
//  STREAM
// ============================================================
const Stream = {
  start() {
    S.streamDay = S.day;
    this.round = 0; this.viewers = rndi(2, 6) + S.hair * 2 + (S.flags.hero ? 10 : 0); this.cash = 0; this.banned = false;
    Sound.play('lofi');
    this.next();
  },
  next() {
    if (this.round >= 5 || this.banned) return this.end();
    this.round++;
    const opts = [];
    const pool = STREAM_OPTS.filter(o => o.need !== 'figs' || Object.keys(S.figs).length);
    while (opts.length < 3) { const o = pick(pool); if (!opts.includes(o)) opts.push(o); }
    UI.dialog([{ who: 'jesus', text: 'STREAM - Ronda ' + this.round + '/5 · ' + this.viewers + ' viewers · ' + money(this.cash) + ' en donaciones. ¿Qué hago?', choices: opts.map(o => ({ t: o.t, fn: () => {
      const dv = rndi(o.v[0], o.v[1]) + (o.flex ? Math.floor(S.mamadez / 10) : 0);
      const cash = Math.round(rndi(o.cash[0], o.cash[1]) * (1 + (S.hair - 1) * 0.15) * (1 + perk('money') / 100));
      this.viewers = Math.max(0, this.viewers + dv); this.cash += cash; addCope(o.cope);
      if (o.rant) this.banned = true;
      return [['narrador', o.txt + (cash ? ' (+' + money(cash) + ')' : '')]];
    } })) }], () => this.next());
  },
  end() {
    const t = this.banned ? 'Stream terminado por BANEO. Ganaste ' + money(this.cash) + '. Twitch: "Lee las normas, chud."' : 'Stream terminado. Pico de ' + this.viewers + ' viewers. Ganaste ' + money(this.cash) + '.';
    S.time += 120;
    UI.dialog([['narrador', t]], () => { if (this.cash) Game.addMoney(this.cash); Game.resumeMusic(); });
  }
};

window.addEventListener('load', () => {
  const go = () => Game.init();
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]).then(go, go);
  } else go();
});
