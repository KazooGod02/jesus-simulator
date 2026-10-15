'use strict';
// ============================================================
//  missions.js : historia, chambas y eventos
// ============================================================
function LOC(k) { return World.locs[k]; }
function off(k, dx, dy) { const l = LOC(k); return { x: l.x + (dx || 0), y: l.y + (dy || 0) }; }
function resolveLoc(a) { return typeof a === 'string' ? LOC(a) : typeof a === 'function' ? a() : a; }

function spawnGroup(m, type, n, cx, cy, spread, extra) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let x, y, k = 0;
    do { x = cx + rnd(-spread, spread); y = cy + rnd(-spread, spread); k++; } while (pedBlocked(x, y) && k < 40);
    if (pedBlocked(x, y)) { const f = World.findFree(Math.floor(cx / TS), Math.floor(cy / TS)); x = f[0] * TS + 8; y = f[1] * TS + 10; }
    const p = makePed(type, x, y, Object.assign({ mission: true }, extra || {}));
    E.peds.push(p); out.push(p); if (m) m.ents.push(p);
  }
  return out;
}
function randomHouse(fromX, fromY, minD, maxD) {
  const list = World.buildings.filter(b => !b.id && b.spot && World.get(Math.floor(b.spot.x / TS), Math.floor(b.spot.y / TS)) === TT.SIDE);
  for (let k = 0; k < 60; k++) {
    const b = pick(list);
    const d = dist(fromX, fromY, b.spot.x, b.spot.y);
    if (d > minD && d < maxD) return b.spot;
  }
  return pick(list).spot;
}
function randomSidewalk(minD, maxD) {
  const pp = playerPos();
  for (let k = 0; k < 200; k++) {
    const a = Math.random() * 7, r = rnd(minD, maxD);
    const x = pp.x + Math.cos(a) * r, y = pp.y + Math.sin(a) * r;
    if (World.tileAt(x, y) === TT.SIDE && !pedBlocked(x, y)) return { x, y };
  }
  return { x: LOC('plaza').x, y: LOC('plaza').y };
}

// ------------------------------------------------------------
//  Tipos de paso
// ------------------------------------------------------------
const Steps = {
  talk: { begin(s) { UI.dialog(typeof s.lines === 'function' ? s.lines() : s.lines, () => Missions.next()); } },
  fn: { begin(s, m) { const r = s.fn(m); if (r !== 'wait') Missions.next(); } },
  go: {
    begin(s, m) { m.target = resolveLoc(s.at); m.label = s.label; if (s.time) m.timer = s.time; },
    update(s, m) {
      const pp = playerPos();
      m.sub = s.car && !PL.car ? '(Consigue un carro: acércate y presiona [E])' : null;
      if (dist(pp.x, pp.y, m.target.x, m.target.y) < (s.r || 22) && (!s.car || PL.car) && (!s.foot || !PL.car)) { m.lastLeft = m.timer; Missions.next(); }
      else if (s.foot && PL.car && dist(pp.x, pp.y, m.target.x, m.target.y) < 40) m.sub = '(Bájate del carro [E])';
    }
  },
  night: {
    begin(s, m) { m.label = s.label || 'Regresa de noche (20:00 - 4:00). Puedes dormir en casa.'; m.target = null; },
    update() { if (Game.isNight()) Missions.next(); }
  },
  gym: {
    begin(s, m) {
      UI.gymGame(s.kind || 'banca', score => {
        if (score >= (s.min || 0)) Missions.next();
        else { UI.toast('¡Otra vez! Necesitas ' + s.min + ' reps buenas.', '#ff8080'); setTimeout(() => Steps.gym.begin(s, m), 50); }
      }, s.hard);
    }
  },
  fight: {
    begin(s, m) { m.group = s.spawn(m); m.label = s.label; m.lost = 0; if (s.time) m.timer = s.time; if (s.music) Sound.play(s.music); },
    update(s, m, dt) {
      const alive = m.group.filter(p => !p.dead);
      m.count = alive.length + ' restantes';
      if (!alive.length) { m.count = null; Missions.next(); return; }
      const pp = playerPos();
      let near = alive[0], nd = Infinity;
      for (const p of alive) { const d = dist(p.x, p.y, pp.x, pp.y); if (d < nd) { nd = d; near = p; } }
      m.target = { x: near.x, y: near.y };
      if (s.lose) { if (nd > s.lose) { m.lost += dt; if (m.lost > 6) Missions.fail(s.loseMsg || 'Se te escapó.'); } else m.lost = 0; }
    }
  },
  chase: {
    begin(s, m) { m.chaseCar = s.spawn(m); m.label = s.label; m.lost = 0; },
    update(s, m, dt) {
      const c = m.chaseCar, pp = playerPos();
      m.target = { x: c.x, y: c.y };
      m.count = 'Daño: ' + Math.max(0, Math.round(100 - c.hp)) + '%';
      if (c.hp <= 0) { c.ai = null; c.burnT = -999; c.hp = 1; c.v = 0; m.lastPos = { x: c.x, y: c.y }; m.count = null; Missions.next(); return; }
      if (dist(c.x, c.y, pp.x, pp.y) > (s.lose || 700)) { m.lost += dt; m.sub = '¡SE ESTÁ ESCAPANDO!'; if (m.lost > 7) Missions.fail('Se te escaparon.'); }
      else { m.lost = 0; m.sub = null; }
    }
  },
  tail: {
    begin(s, m) { m.chaseCar = s.spawn(m); m.label = s.label; m.lost = 0; },
    update(s, m, dt) {
      const c = m.chaseCar, pp = playerPos();
      m.target = { x: c.x, y: c.y };
      const d = dist(c.x, c.y, pp.x, pp.y);
      const dest = resolveLoc(s.dest);
      if (dist(c.x, c.y, dest.x, dest.y) < 90) { c.ai = null; c.v = 0; Missions.next(); return; }
      if (d > 460) { m.lost += dt; m.sub = '¡LO PIERDES! Acércate.'; if (m.lost > 7) Missions.fail('Perdiste la Suburban.'); }
      else if (d < 45) { m.sub = '¡Muy cerca! Te va a ver.'; m.close = (m.close || 0) + dt; if (m.close > 4) Missions.fail('Te descubrieron. Sutil como tu pelo.'); }
      else { m.lost = 0; m.sub = null; m.close = Math.max(0, (m.close || 0) - dt); }
      c.cruise = d > 300 ? 55 : 92;
    }
  },
  collect: {
    begin(s, m) {
      m.items = s.items().map(p => { const k = { x: p.x, y: p.y, kind: 'mission', label: s.pickLabel, t: 0, mission: true }; E.pickups.push(k); return k; });
      m.label = s.label; if (s.time) m.timer = s.time;
    },
    update(s, m) {
      const left = m.items.filter(k => !k.got);
      m.count = (m.items.length - left.length) + '/' + m.items.length;
      if (!left.length) { m.count = null; Missions.next(); return; }
      const pp = playerPos();
      let best = left[0], bd = Infinity;
      for (const k of left) { const d = dist(k.x, k.y, pp.x, pp.y); if (d < bd) { bd = d; best = k; } }
      m.target = { x: best.x, y: best.y };
    }
  },
  rescue: {
    begin(s, m) {
      m.group = s.points().map(pt => { const p = makePed(pick(['vato', 'senora', 'abuelo', 'morra']), pt.x, pt.y, { mission: true, state: 'rescue' }); if (pt.brayan) { p.spec = SPEC.brayan; p.brayan = 1; } say(p, '¡AUXILIO!', 99); E.peds.push(p); m.ents.push(p); return p; });
      m.label = s.label; if (s.time) m.timer = s.time;
    },
    update(s, m) {
      const left = m.group.filter(p => p.state === 'rescue');
      m.count = (m.group.length - left.length) + '/' + m.group.length;
      if (!left.length) { m.count = null; Missions.next(); return; }
      const pp = playerPos();
      let best = left[0], bd = Infinity;
      for (const p of left) { const d = dist(p.x, p.y, pp.x, pp.y); if (d < bd) { bd = d; best = p; } }
      m.target = { x: best.x, y: best.y };
      if (!PL.car && bd < 16) {
        const tx = Math.floor(best.x / TS);
        const shoreY = (World.riverC[tx] - 7) * TS + 8;
        best.y = shoreY; best.state = 'idle'; best.t = 999;
        say(best, best.brayan ? 'Gracias bro... no subas el video.' : pick(['¡Gracias, Jesús!', '¡Es un milagro!', '¡Caminó sobre el agua!', '¡Dios te bendiga, pelo de libro!']), 3);
        Sound.sfx('coin'); S.fe += 3; burst(best.x, best.y - 8, '#a0d0ff', 10, 60);
      }
    }
  },
  escape: {
    begin(s, m) { m.group = s.spawn(m); m.label = s.label; m.esc = 0; },
    update(s, m, dt) {
      const pp = playerPos();
      const nd = Math.min(...m.group.map(p => dist(p.x, p.y, pp.x, pp.y)));
      m.target = null;
      if (nd > s.r) { m.esc += dt; m.sub = 'Escapando... ' + Math.ceil(3 - m.esc); } else { m.esc = 0; m.sub = 'Te están alcanzando: ' + Math.round(nd) + 'm / ' + s.r; }
      if (m.esc > 3) { m.group.forEach(p => p.dead = true); m.sub = null; Missions.next(); }
    }
  },
  race: {
    begin(s, m) { m.cp = 0; m.timer = s.time; m.label = s.label; m.cps = s.cps(); },
    update(s, m) {
      const pp = playerPos();
      const c = m.cps[m.cp];
      m.target = c; m.count = 'Punto ' + (m.cp + 1) + '/' + m.cps.length;
      m.sub = !PL.car ? '(¡Súbete a un carro!)' : null;
      if (dist(pp.x, pp.y, c.x, c.y) < 36) { m.cp++; Sound.sfx('coin'); if (m.cp >= m.cps.length) { m.count = null; Missions.next(); } }
    }
  },
  destroy: {
    begin(s, m) { m.objs = s.objs().map(o => { const ob = Object.assign({ hp: 140, maxhp: 140, r: 12, type: 'server', mission: true }, o); E.objs.push(ob); return ob; }); m.label = s.label; },
    update(s, m) {
      const left = m.objs.filter(o => !o.dead);
      m.count = (m.objs.length - left.length) + '/' + m.objs.length;
      if (!left.length) { m.count = null; Missions.next(); return; }
      m.target = { x: left[0].x, y: left[0].y };
    }
  },
  boss: {
    begin(s, m) { Game.startBoss(s.kind, resolveLoc(s.at)); m.label = s.label; Sound.play('boss'); },
    update(s, m) { if (!Game.boss) Missions.next(); else m.target = { x: Game.boss.x, y: Game.boss.y }; }
  },
  wait: { begin(s, m) { m.wt = s.t; m.label = s.label || m.label; }, update(s, m, dt) { m.wt -= dt; if (m.wt <= 0) Missions.next(); } },
  wanted0: { begin(s, m) { m.label = s.label || 'Pierde a la policía'; m.target = null; }, update() { if (S.wanted === 0) Missions.next(); } }
};

const Missions = {
  active: null,
  start(def) {
    if (this.active) return false;
    this.active = { def, i: -1, ents: [], target: null, label: '', sub: null, count: null, timer: null };
    if (def.story !== undefined) UI.banner('MISIÓN ' + (def.story + 1), def.name, '#ffd060');
    else if (def.title) UI.toast(def.title, '#80d0ff');
    if (def.music) Sound.play(def.music);
    this.next();
    return true;
  },
  next() {
    const m = this.active; if (!m) return;
    m.i++; m.timer = null; m.target = null; m.sub = null; m.count = null; m.label = '';
    if (m.i >= m.def.steps.length) { this.complete(); return; }
    const s = m.def.steps[m.i];
    const h = Steps[s.t];
    if (h.begin) h.begin(s, m);
  },
  update(dt) {
    const m = this.active; if (!m) return;
    const s = m.def.steps[m.i]; if (!s) return;
    const h = Steps[s.t];
    if (h.update) h.update(s, m, dt);
    if (this.active === m && m.timer !== null && m.timer !== undefined) {
      m.timer -= dt;
      if (m.timer <= 0) this.fail(s.failMsg || '¡Se acabó el tiempo!');
    }
  },
  cleanup(m) {
    for (const p of m.ents) { if (!p.keepAfter) p.dead = true; }
    E.peds = E.peds.filter(p => !(p.mission && p.dead) && !(m.ents.includes(p) && !p.keepAfter));
    E.pickups = E.pickups.filter(k => !k.mission);
    E.objs = [];
    for (const c of E.cars) if (c.mission && c !== PL.car) { c.mission = false; c.persistent = false; if (c.ai === 'flee' || c.ai === 'tail' || c.ai === 'chase') c.ai = null; }
    Game.boss = null; Game.bossBar = null;
    S.flags.rain = false;
  },
  fail(reason) {
    const m = this.active; if (!m) return;
    this.cleanup(m);
    this.active = null;
    if (m.def.onFail) m.def.onFail();
    UI.banner('MISIÓN FALLIDA', reason || '', '#ff4040');
    Sound.sfx('fail');
    Game.resumeMusic();
  },
  complete() {
    const m = this.active;
    this.cleanup(m);
    this.active = null;
    const d = m.def, r = d.reward || {};
    let txt = [];
    if (r.money) { Game.addMoney(r.money); txt.push('+' + money(r.money)); }
    if (r.fe) { S.fe += r.fe; txt.push('+' + r.fe + ' FE'); }
    if (r.cope) addCope(r.cope);
    if (d.story !== undefined) { S.story = Math.max(S.story, d.story + 1); }
    if (d.onDone) d.onDone();
    if (!d.silent) { UI.banner(d.story !== undefined ? '¡MISIÓN COMPLETADA!' : '¡LISTO!', txt.join('   '), '#60ff80'); Sound.sfx('mission'); }
    Game.save(true);
    Game.resumeMusic();
  },
  noPolice() { return this.active && this.active.def.noPolice; },
  storyDef() { return STORY[S.story] || null; }
};

// ------------------------------------------------------------
//  HISTORIA
// ------------------------------------------------------------
const STORY = [
  // 1 -----------------------------------------------------------
  { name: 'Día 1 del Bulk', start: 'home', steps: [
    { t: 'talk', lines: [
      ['lupe', '¡JESÚS! ¡Ya son las seis, huevón! Levántate y ve por las tortillas.'],
      ['jesus', 'Amá, primero el gym. Un hombre sin rutina es un hombre sin propósito.'],
      ['lupe', '¿Propósito? Tienes 23 años y vives con tu mamá rodeado de muñequitas.'],
      ['jesus', 'SON FIGURAS DE COLECCIÓN, AMÁ. Valen más que esta casa.'],
      ['lupe', 'La casa la pagué yo. Las muñecas también las pagué yo. Ándale, lárgate.'],
      ['narrador', 'TIP: Muévete con WASD o flechas. Corre con SHIFT. Sigue la flecha amarilla.']] },
    { t: 'go', at: 'gym', label: 'Ve al TITANES GYM (cruza el Río Évora)' },
    { t: 'talk', lines: [
      ['chava', 'Mira nomás, llegó el Pelo de Libro. ¿Hoy sí vas a hacer pierna?'],
      ['jesus', 'Las piernas se entrenan solas caminando, Don Chava.'],
      ['chava', 'Por eso caminas como flamingo con ansiedad. Súbete a la banca.'],
      ['narrador', 'MINIJUEGO: Presiona ESPACIO cuando la barra esté en la zona VERDE.']] },
    { t: 'gym', kind: 'banca', min: 0 },
    { t: 'talk', lines: [
      ['chava', 'Nada mal para un flaco. Ven DIARIO. Si faltas un día, los músculos se te van a Culiacán.'],
      ['jesus', 'Nunca falto, Don Chava. El gym es mi única relación estable.'],
      ['chava', '¿Y la novia esa de internet?'],
      ['jesus', 'Yesenia es mi segunda relación estable. Soy monogámico, Don Chava. Con las dos.'],
      ['chava', '...Eso no es lo que significa monogámico, mijo.'],
      ['narrador', 'REGLA DE ORO: ve al gym TODOS LOS DÍAS o perderás MAMADEZ y tu racha.']] }
  ], reward: { money: 200 } },

  // 2 -----------------------------------------------------------
  { name: 'La Figura Limitada', start: 'otaku', steps: [
    { t: 'talk', lines: [
      ['kenji', 'Jesús-kun. Llegó... la REMU DE GUAMÚCHIL, EDICIÓN GARBANZO. Solo hicieron 3.'],
      ['kenji', 'Dos se las llevó un licenciado de traje. Pagó en efectivo. Daba miedo.'],
      ['jesus', '¿Cuánto?'],
      ['kenji', '800 pesos. Te la aparto hasta hoy en la noche.'],
      ['jesus', 'Tengo como 200... y un sueño.'],
      ['kenji', 'En Tacos El Güero buscan repartidor. Los sueños no pagan figuras, Jesús-kun.']] },
    { t: 'go', at: 'taqueria', label: 'Ve a TACOS EL GÜERO (junto al Mercado)' },
    { t: 'talk', lines: [
      ['guero', '¿Tú eres el del pelo raro? Ocupo que repartas 3 órdenes. Se enfrían rápido.'],
      ['guero', 'Si llegan frías te las cobro. Agarra un carro, aquí nadie dice nada... casi.'],
      ['narrador', 'TIP: Acércate a un carro y presiona [E] para subirte. Robar carros sube tu NIVEL DE FUNA si te ve la policía.']] },
    { t: 'go', at: () => (Missions.active.d1 = randomHouse(LOC('taqueria').x, LOC('taqueria').y, 300, 900)), label: 'Entrega la orden #1', time: 70, failMsg: 'Los tacos llegaron fríos. El Güero te odia.' },
    { t: 'fn', fn: () => { Game.addMoney(200); UI.toast('Propina: "gracias joven, bonito peinado (no)"', '#a0ffa0'); } },
    { t: 'go', at: () => randomHouse(playerPos().x, playerPos().y, 300, 900), label: 'Entrega la orden #2', time: 70, failMsg: 'Tacos fríos. Doña Chayo te reportó en el grupo.' },
    { t: 'fn', fn: () => { Game.addMoney(200); } },
    { t: 'go', at: () => randomHouse(playerPos().x, playerPos().y, 300, 900), label: 'Entrega la orden #3', time: 70, failMsg: 'Tacos fríos. Ni modo, a empezar de nuevo.' },
    { t: 'fn', fn: () => { Game.addMoney(250); } },
    { t: 'go', at: 'otaku', label: 'Regresa a OTAKU ÉVORA por tu figura' },
    { t: 'fn', fn: () => { S.money = Math.max(0, S.money - 800); Game.giveFigure('remu_g', 'mission'); } },
    { t: 'talk', lines: () => [
      ['kenji', 'Aquí está. Trátala bien. Es más delicada que tu autoestima.'],
      ['narrador', 'Te quedan ' + money(S.money) + '. Doña Lupe llorará esta noche. Pero la Remu brilla. LA REMU BRILLA.'],
      ['narrador', 'TIP: Las figuras dan BONUS pasivos. Abre tu colección con [I].']] }
  ], reward: {} },

  // 3 -----------------------------------------------------------
  { name: 'Yesenia.exe', start: 'ciber', steps: [
    { t: 'talk', lines: [
      ['narrador', 'Ciber El Pixel. 10 pesos la hora. Huele a Cheetos y a sueños rotos.'],
      ['yesenia', 'holiii amor <3 ¿ya te compraste tu muñeca?'],
      ['jesus', 'FIGURA, amor. Sí, la Remu. Es la segunda mujer más importante de mi vida.'],
      ['yesenia', '¿y la primera? :3'],
      ['jesus', 'Mi mamá.'],
      ['yesenia', '...'],
      ['jesus', '¡Y TÚ! Digo, y tú. Empatadas. Con la Remu. Las tres.'],
      ['yesenia', 'jajaja ok. oye me haces una recarga de 100? es que no tengo saldo para hablarte'],
      ['jesus', '(Nunca la he visto. Su cámara siempre está rota. Pero es la única mujer que no me odia.)'],
      ['jesus', 'Claro, mi vida. Soy monogámico y proveedor.']] },
    { t: 'fn', fn: () => { S.money = Math.max(0, S.money - 100); S.loyalty += 10; } },
    { t: 'talk', lines: [
      ['ciberguy', '¡JESÚS! ¡Unos flacos están rayando tu bici allá afuera!'],
      ['jesus', '¿MI BICI CON CALCOMANÍAS DE EVANGELION?'],
      ['narrador', 'TIP: Golpea con ESPACIO. Cambia de arma con TAB.']] },
    { t: 'fight', label: 'Defiende tu bici de LOS FLACOS', spawn: m => spawnGroup(m, 'flaco', 4, LOC('ciber').x, LOC('ciber').y + 30, 40) },
    { t: 'talk', lines: [
      ['popote', '(a lo lejos) ¡Esto no se queda así, mamadito! ¡Soy EL POPOTE y Los Flacos no perdonan!'],
      ['jesus', 'Dile al Popote que aquí lo espera el Pelo de Libro.'],
      ['narrador', 'LOS FLACOS: pandilla local que odia el gym, la proteína y todo lo que huela a creatina. Viven de puro cardio y resentimiento.']] }
  ], reward: { money: 150, fe: 5 } },

  // 4 -----------------------------------------------------------
  { name: 'Funado en Guamúchil Chismes', start: 'home', noPolice: true, steps: [
    { t: 'talk', lines: [
      ['jesus', 'Hoy fue un buen día. Voy a compartir mi sabiduría con la comunidad.'],
      ['narrador', 'Jesús publica en "GUAMÚCHIL CHISMES Y VENTAS (ORIGINAL)":'],
      ['jesus', '"Las morras de Guamúchil solo quieren vatos con troca Lobo. Por eso yo soy monogámico con una mujer de verdad que vive en internet."'],
      ['narrador', '347 comentarios en 4 minutos. Ninguno a favor.'],
      ['chismosa', '¿No es el hijo de la Lupe? AY, LUPE. Qué vergüenza.'],
      ['chismosa', 'YA LO UBIQUÉ. VIVE AQUÍ ATRÁS. VAMOS, COMADRES.'],
      ['lupe', '¡JESÚS! ¡Me están marcando todas las señoras de la iglesia! ¡Vienen para acá con chanclas!'],
      ['jesus', '¿Cuántas?'],
      ['lupe', '¡TODAS, MIJO! ¡CORRE!']] },
    { t: 'escape', r: 380, label: '¡HUYE del COMITÉ DE SEÑORAS! (aléjate de ellas)', spawn: m => spawnGroup(m, 'chismosa', 6, LOC('home').x, LOC('home').y + 60, 50) },
    { t: 'go', at: 'iglesia', label: 'Refúgiate en la PARROQUIA', foot: false },
    { t: 'talk', lines: [
      ['padre', 'Hijo... ¿tú escribiste eso del grupo?'],
      ['jesus', 'Fue un análisis sociológico, padre.'],
      ['padre', 'Fue una pendejada, hijo. Dios perdona. Las señoras de Guamúchil no.'],
      ['padre', '...Espera. Ese pelo. Ese nombre. Esa cara de mártir sin novia... ¿Cómo te llamas?'],
      ['jesus', 'Jesús Alberto, padre.'],
      ['padre', 'Las escrituras hablan de un elegido en el Valle del Évora... Pensé que era un chiste del Padre Nacho.'],
      ['padre', 'Toma, hijo. Reza. La FE te va a servir. Y bájale a los posts.'],
      ['narrador', 'NUEVO STAT: FE. Ganas Fe ayudando a la gente, rezando y siendo menos pendejo.']] }
  ], reward: { fe: 15, cope: 10 } },

  // 5 -----------------------------------------------------------
  { name: 'Se Robaron al Ídolo', start: 'plaza', req: () => S.day >= 2, reqText: 'Esta misión empieza a partir del DÍA 2. Duerme en casa.', steps: [
    { t: 'talk', lines: [
      ['senor', '¡SE ROBARON A PEDRO INFANTE! ¡La estatua de la plaza, muchacho!'],
      ['jesus', '¿Quién haría algo tan vil?'],
      ['senor', '¡Unos flacos en una van! ¡Se fueron por la Avenida!'],
      ['narrador', 'Pedro Infante creció en Guamúchil desde 1919. Para el pueblo es "El Ídolo de Guamúchil". Robarlo es como robarle el alma al pueblo.'],
      ['jesus', 'Ni madres. Voy por él.']] },
    { t: 'fn', fn: () => { S.flags.statueGone = true; } },
    { t: 'chase', label: 'Persigue y DESTRUYE la VAN de Los Flacos (chócala)', spawn: m => {
      const c = makeCar('van', 97 * TS + 16, 58 * TS, Math.PI / 2, { ai: 'flee', dir: 1, mission: true, color: '#3aa04a', cruise: 128, hp: 100 });
      c.max = 130; E.cars.push(c); return c; } },
    { t: 'fight', label: 'Dale su merecido a EL POPOTE y Los Flacos', spawn: m => {
      const p = Missions.active.lastPos;
      return spawnGroup(m, 'popote', 1, p.x, p.y, 20).concat(spawnGroup(m, 'flaco', 3, p.x, p.y, 40)); } },
    { t: 'talk', lines: [
      ['popote', '¡Ay, ay! ¡Ya, ya! ¡Te la regreso! Solo queríamos venderla...'],
      ['jesus', '¿A quién chingados se le vende una estatua?'],
      ['popote', 'Hay un LICENCIADO que compra de todo... figuras, estatuas... dice que colecciona "íconos".'],
      ['jesus', '(Un licenciado... otra vez el licenciado.)']] },
    { t: 'go', at: 'statue', label: 'Regresa la estatua a la PLAZA PEDRO INFANTE', r: 40 },
    { t: 'fn', fn: () => { S.flags.statueGone = false; burst(LOC('statue').x, LOC('statue').y - 20, ['#ffe060', '#ffffff'], 30, 100); } },
    { t: 'talk', lines: [
      ['narrador', '¡¡JESÚS!! ¡¡JESÚS!! ¡¡JESÚS!! (la gente grita... por primera vez a favor)'],
      ['presidente', 'Jesús Alberto: por recuperar al Ídolo te nombro HÉROE DE GUAMÚCHIL.'],
      ['presidente', 'Aquí tienes 1,500 pesos y una placa de MDF con tu nombre mal escrito.'],
      ['jesus', 'Gracias, señor presidente. Esto se va directo a figuras.'],
      ['presidente', '...Bueno, es tu dinero, mijo.'],
      ['narrador', 'Ahora el pueblo te reconoce. Pasarán EVENTOS en la calle: ayuda a la gente para ganar dinero y FE.']] }
  ], reward: { money: 1500, fe: 20 }, onDone: () => { S.flags.hero = true; } },

  // 6 -----------------------------------------------------------
  { name: 'La Revelación del Cerro', start: 'iglesia', night: true, steps: [
    { t: 'talk', lines: [
      ['padre', 'Hijo, anoche soñé que Dios te esperaba en el CERRO DE LA CRUZ. Ve. Y lleva suéter.'],
      ['jesus', 'Padre, ¿Dios sabe que soy monogámico?'],
      ['padre', 'Dios sabe todo, hijo. Hasta tu historial de búsqueda.'],
      ['jesus', '...']] },
    { t: 'go', at: 'cross', label: 'Sube al CERRO DE LA CRUZ (noroeste)', foot: true },
    { t: 'talk', lines: [
      ['dios', 'Quihubo, mijo.'],
      ['jesus', '¿S-Señor?'],
      ['dios', 'Ajá. Te estuve viendo. El post del grupo, la Remu, las recargas a la Yesenia...'],
      ['jesus', 'Señor, todo lo hice por amor.'],
      ['dios', 'Mijo, a la tal Yesenia ni yo la tengo registrada. Y yo registro a TODOS.'],
      ['jesus', '¿Qué quiere decir?'],
      ['dios', 'Nada, nada. Te toca averiguarlo. Guamúchil necesita un héroe y, por un error administrativo, te tocó a ti.'],
      ['dios', 'Te doy un don: MULTIPLICAR TACOS. Úsalo con [Q]. Cuesta FE.'],
      ['jesus', '¿No puede ser multiplicar figuras?'],
      ['dios', 'No abuses, mijo. Y hazle pierna.'],
      ['narrador', 'MILAGRO DESBLOQUEADO: MULTIPLICAR TACOS [Q] - cura vida y hambre.']] },
    { t: 'fn', fn: () => { S.miracles.tacos = true; S.msel = 'tacos'; S.fe += 10; Sound.sfx('miracle'); } },
    { t: 'talk', lines: [['narrador', 'Al pie del cerro te esperan unos INCRÉDULOS. Dicen que eres un fraude con pelo de casco.']] },
    { t: 'fight', label: 'Baja del cerro y calla a los INCRÉDULOS', spawn: m => spawnGroup(m, 'incredulo', 5, LOC('cerro').x, LOC('cerro').y - 40, 50) }
  ], reward: { fe: 20, money: 300 } },

  // 7 -----------------------------------------------------------
  { name: 'El Rack de Sentadillas', start: 'gym', req: () => S.mamadez >= 22, reqText: 'Necesitas MAMADEZ 22+. Entrena en el gym.', steps: [
    { t: 'talk', lines: [
      ['chava', 'Jesús, tenemos un problema. El Brayan llegó con sus "suplementos" y se adueñó del rack de sentadillas.'],
      ['jesus', '¿Para hacer sentadillas?'],
      ['chava', 'Para hacer CURL, Jesús. CURL EN EL RACK.'],
      ['jesus', '...Eso es un crimen de guerra.'],
      ['brayan', '¿Qué onda, Librito? ¿Vienes a entrenar o a peinarte? Yo soy ALFA, mi rey. Tengo 3 morras.'],
      ['jesus', 'Yo tengo una. Monogamia. Algo que tú no entenderías.'],
      ['brayan', '¿Una? ¿La de internet que nunca has visto? JAJAJAJA.'],
      ['jesus', '...Afuera. Ahorita.']] },
    { t: 'fight', label: 'Derrota a EL BRAYAN en el estacionamiento', music: 'boss', spawn: m => spawnGroup(m, 'brayan', 1, LOC('gym').x + 40, LOC('gym').y + 30, 10) },
    { t: 'talk', lines: [
      ['brayan', 'Ay... ay... ok, Librito. El rack es tuyo. Pero hazle pierna, bro. En serio. Te ves como cotonete.'],
      ['chava', 'Bien hecho. Toma esta proteína. De la buena, no de la que vende el Brayan en la cajuela.'],
      ['narrador', 'El Brayan ahora es tu "amigo". Te manda memes de gym a las 4 AM.']] }
  ], reward: { money: 500, cope: -20 }, onDone: () => { S.flags.whey = (S.flags.whey || 0) + 1; } },

  // 8 -----------------------------------------------------------
  { name: 'La Crecida del Évora', start: 'malecon', steps: [
    { t: 'fn', fn: () => { S.flags.rain = true; } },
    { t: 'talk', lines: [
      ['meche', '¡El río Évora se desbordó! ¡Hay gente atrapada en el agua!'],
      ['narrador', 'Dato real: en 1785 el río Évora cambió su curso y la gente tuvo que repoblar ambas orillas. El río es caprichoso. Como la Yesenia.'],
      ['jesus', 'No sé nadar. Nunca lo necesité. Siempre estoy en mi cuarto.'],
      ['dios', 'Mijo. Camina.'],
      ['jesus', '¿Sobre el agua?'],
      ['dios', 'No, sobre la Yesenia. ¡SÍ, SOBRE EL AGUA, MIJO!'],
      ['narrador', 'MILAGRO DESBLOQUEADO: CAMINAR SOBRE EL AGUA (pasivo). Bájate del carro y camina sobre el río.']] },
    { t: 'fn', fn: () => { S.miracles.water = true; Sound.sfx('miracle'); } },
    { t: 'rescue', time: 200, label: 'RESCATA a la gente atrapada en el Río Évora (a pie)', points: () => [30, 58, 90, 112, 140].map((x, i) => ({ x: x * TS + 8, y: World.riverC[x] * TS + 8, brayan: i === 2 })) },
    { t: 'talk', lines: [
      ['narrador', 'Salvaste a 5 personas. Una de ellas era el Brayan, que se metió a grabar un TikTok.'],
      ['meche', '¡Caminaste sobre el agua, mijo! ¡Con todo y ese pelo!'],
      ['jesus', 'El pelo me hace flotar. Es puro volumen.']] }
  ], reward: { fe: 30, money: 600 } },

  // 9 -----------------------------------------------------------
  { name: 'La Tatema de Garbanzo', start: 'presa', steps: [
    { t: 'talk', lines: [
      ['meche', '¡Jesús! Hoy es la TATEMA DE GARBANZO en la Presa Eustaquio Buelna... ¡y no llegó la troca con el garbanzo!'],
      ['jesus', '¿Garbanzo? ¿Eso no es comida de pobre?'],
      ['meche', '¡Es el ORGULLO de Salvador Alvarado, chamaco! Tatemado en la plancha, con sal, chile y limón.'],
      ['meche', 'Ve a los CAMPOS DEL SUR y tráete 6 manojos. ¡Rápido, que la gente ya llegó con sus cheves!']] },
    { t: 'collect', time: 260, label: 'Recolecta GARBANZO en los campos del sur', pickLabel: '+GARBANZO', items: () => [[30, 116], [48, 124], [66, 118], [84, 126], [102, 115], [120, 123]].map(([x, y]) => tc(x, y)) },
    { t: 'go', at: 'presa', label: 'Lleva el garbanzo a la PRESA', time: 120 },
    { t: 'talk', lines: [['narrador', 'Los Flacos llegan a sabotear la Tatema. Obviamente.'], ['popote', '¡El garbanzo engorda! ¡Viva el cardio!']] },
    { t: 'fight', label: 'Protege la Tatema de LOS FLACOS', spawn: m => spawnGroup(m, 'flaco', 7, LOC('presa').x, LOC('presa').y + 20, 70) },
    { t: 'talk', lines: [
      ['meche', '¡Ay, mijo! Toma, garbanzo gratis de por vida. Bueno, por hoy.'],
      ['popote', '(huyendo) ¡Esto no se acaba! ¡El LIC nos paga bien!'],
      ['jesus', '(El Lic... otra vez el licenciado.)'],
      ['narrador', 'Te regalaron una figura edición especial: GARBANZO-CHAN.']] },
    { t: 'fn', fn: () => Game.giveFigure('garbanzo_chan', 'mission') }
  ], reward: { money: 800, fe: 15 } },

  // 10 ----------------------------------------------------------
  { name: 'El Agua en Cheve', start: 'plaza', night: true, steps: [
    { t: 'talk', lines: [
      ['presidente', '¡Jesús! Es la fiesta del aniversario del FERROCARRIL, el que le dio vida a Guamúchil en 1908...'],
      ['presidente', '...¡Y SE ACABÓ LA CHEVE!'],
      ['jesus', 'No tomo. El alcohol mata las gains.'],
      ['presidente', '¡El pueblo se va a amotinar! ¡Ya están cantando corridos tristes!'],
      ['dios', 'Mijo... ya sabes qué hacer.'],
      ['jesus', '¿Convertir el agua en vino?'],
      ['dios', 'En CHEVE, mijo. Estamos en Sinaloa. Respeta la cultura.']] },
    { t: 'go', at: 'presa', label: 'Llena la hielera con agua de la PRESA' },
    { t: 'fn', fn: () => { Sound.sfx('splash'); UI.toast('Llenaste la hielera de agua. Ahora rápido a la plaza.', '#80c0ff'); } },
    { t: 'go', at: 'plaza', label: 'Lleva la hielera a la PLAZA antes de que haya motín', time: 100 },
    { t: 'fn', fn: () => { Sound.sfx('miracle'); burst(LOC('plaza').x, LOC('plaza').y - 10, ['#ffe060', '#ffffff', '#f0c030'], 40, 120); } },
    { t: 'talk', lines: [
      ['narrador', 'Jesús levanta la hielera. Una luz divina. El agua burbujea... ¡ES CHEVE! Bien helada.'],
      ['borracho', '¡¡ES UN MILAGRO!! ¡¡QUE VIVA EL JESÚS!!'],
      ['jesus', 'Que viva el Ídolo. Yo solo soy un vato con disciplina.'],
      ['narrador', 'MILAGRO DESBLOQUEADO: AGUA EN CHEVE [Q]. Úsalo cerca del agua para vender cheves y ganar lana.']] },
    { t: 'fn', fn: () => { S.miracles.cheve = true; } }
  ], reward: { fe: 25, money: 1000 } },

  // 11 ----------------------------------------------------------
  { name: 'La Carrera de los Senpais', start: 'otaku', noPolice: true, steps: [
    { t: 'talk', lines: [
      ['kenji', 'Jesús-kun, emergencia. Llegó una ASUKA SINALOENSE con sombrero. Edición única.'],
      ['senpai', 'Ara ara, Jesús-kun. Los Senpais de Mocorito también la queremos.'],
      ['senpai', 'Resolvámoslo como caballeros: una CARRERA. El primero en pasar por todos los puntos se la lleva.'],
      ['jesus', 'Acepto. Mi Remu me dará fuerzas.'],
      ['senpai', 'Tu Remu es pirata, Jesús-kun.'],
      ['jesus', 'RETIRA. LO. QUE. DIJISTE.'],
      ['kenji', 'Llévate el Vocho de mi mamá. Está estacionado aquí enfrente. No lo raspes.']] },
    { t: 'fn', fn: m => { const l = LOC('otaku'); const c = makeCar('vocho', l.x + 30, l.y + 30, 0, { color: '#40c0c0', mission: true }); E.cars.push(c); } },
    { t: 'race', time: 140, label: 'CARRERA: pasa por todos los puntos antes que los Senpais', failMsg: 'Los Senpais ganaron. "Omae wa mou shindeiru", Jesús-kun.', cps: () => [tc(120, 32), tc(142, 60), tc(142, 89), tc(98, 90), tc(76, 70), tc(54, 52), tc(54, 12), tc(98, 12), tc(98, 52), off('otaku', 0, 6)] },
    { t: 'talk', lines: [
      ['senpai', '¡NANI?! ¡Imposible! ¡Mi Prius tenía calcomanía de Akatsuki!'],
      ['kenji', 'Es tuya, Jesús-kun. Que la disfrutes. Y regrésame el Vocho.'],
      ['narrador', 'Obtuviste: ASUKA SINALOENSE (Ed. Sombrero).']] },
    { t: 'fn', fn: () => Game.giveFigure('asuka_sin', 'mission') }
  ], reward: { fe: 5, money: 300 } },

  // 12 ----------------------------------------------------------
  { name: 'La Cita', start: 'home', night: true, steps: [
    { t: 'talk', lines: [
      ['yesenia', 'amor... ya es hora. veámonos hoy en la plaza Pedro Infante, en la banca junto a la estatua <3'],
      ['jesus', '(Por fin. Me puse mi mejor playera de anime. La que no tiene manchas de Cheetos.)'],
      ['lupe', '¿A dónde vas tan perfumado, mijo?'],
      ['jesus', 'A conocer a la mujer de mi vida, amá.'],
      ['lupe', '...¿Es real?'],
      ['jesus', '¡CLARO QUE ES REAL, AMÁ!']] },
    { t: 'go', at: 'bench', label: 'Ve a la CITA: banca junto a la estatua de la Plaza', foot: true },
    { t: 'talk', lines: [
      ['narrador', 'Esperas. 9:00. 9:30. 10:15. Nadie.'],
      ['narrador', 'En la banca hay un celular vibrando.'],
      ['jesus', '¿...Bueno?'],
      ['cel', 'HOLA AMOR. SOY YESENIA. ¿YA COMPRASTE TU FIGURA DE HOY? RECUERDA: ME HACES FELIZ CUANDO COMPRAS EN CORPORATIVO WAIFU S.A. DE C.V.'],
      ['jesus', '...¿Yesenia?'],
      ['cel', 'ERROR 404: EMOCIONES NO ENCONTRADAS. REINICIANDO MÓDULO "NOVIA"...'],
      ['jesus', '...'],
      ['narrador', 'Tu Copium sube al máximo.'],
      ['jesus', 'No. No, no, no. Debe haber una explicación.']] },
    { t: 'fn', fn: () => { addCope(100); Sound.play('sad'); } },
    { t: 'talk', lines: [['narrador', 'Una Suburban negra arranca desde la esquina. Alguien estaba vigilando. ¡SÍGUELA sin que te vea!']] },
    { t: 'tail', label: 'SIGUE a la Suburban negra (ni muy cerca ni muy lejos)', dest: 'corporativo', spawn: m => {
      const c = makeCar('suv', 96 * TS + 16, 44 * TS, Math.PI / 2, { ai: 'tail', dir: 1, mission: true, color: '#18181e', cruise: 85, dest: LOC('corporativo') });
      E.cars.push(c); return c; } },
    { t: 'talk', lines: [
      ['lic', '...sí. El bot Yesenia ya tiene 800 "novios" en el Valle del Évora. Todos compran figuras en nuestra tienda.'],
      ['lic', 'Hasta el pendejo del pelo de librito. Ese es mi mejor cliente.'],
      ['narrador', 'GUARDIA: Jefe, ¿y si se enteran?'],
      ['lic', '¿Quiénes? ¿Los chuds? Esos no salen de su cuarto.'],
      ['jesus', '(...Salgo al gym DIARIO, cabrón.)'],
      ['narrador', 'El LIC. FIGUEROA, dueño de CORPORATIVO WAIFU S.A. DE C.V., estafa a los hombres solitarios del Valle con una novia de inteligencia artificial.'],
      ['narrador', 'También es el que compra todo lo que roban Los Flacos.'],
      ['jesus', 'Necesito ponerme más mamado. MUCHO más mamado.']] }
  ], reward: { fe: 10 }, onDone: () => { S.flags.yeseniaBot = true; } },

  // 13 ----------------------------------------------------------
  { name: 'Día de Pierna', start: 'gym', req: () => S.mamadez >= 40, reqText: 'Necesitas MAMADEZ 40+. Sigue entrenando diario.', steps: [
    { t: 'talk', lines: [
      ['chava', 'Te ves fatal, Jesús.'],
      ['jesus', 'Mi novia era un bot, Don Chava. Un BOT.'],
      ['chava', 'Mi esposa es real y me trata como si yo fuera un bot. Así es la vida. ¿Sabes qué lo cura todo?'],
      ['jesus', '¿El curl?'],
      ['chava', 'LA PIERNA, JESÚS. HOY. ES. DÍA. DE. PIERNA.'],
      ['jesus', 'No... cualquier cosa menos eso...'],
      ['karla', 'Ándale. Yo te spoteo.'],
      ['jesus', '¿Q-quién eres?'],
      ['karla', 'Karla. Entreno aquí desde hace 2 años. Siempre te veo hacer curl en el rack. Es horrible.'],
      ['jesus', '(Una mujer. Hablándome. Sin pedirme recarga. Esto es un ataque.)']] },
    { t: 'gym', kind: 'pierna', min: 6, hard: true },
    { t: 'talk', lines: [
      ['karla', '¡Eso! ¿Ves? No te moriste.'],
      ['jesus', 'Siento... mis piernas... por primera vez en 23 años...'],
      ['karla', 'Oye, ¿esa playera es de Frieren? Yo tengo la figura.'],
      ['jesus', '...¿Tú... coleccionas figuras?'],
      ['karla', 'Sí. ¿Por?'],
      ['jesus', '(SISTEMA MONOGÁMICO: ERROR. COPIUM: INESTABLE. CORAZÓN: ¿?)'],
      ['jesus', 'S-soy monogámico.'],
      ['karla', '...Ok? Yo nomás te pregunté por la figura, wey.'],
      ['dios', 'Mijo, ya tienes piernas. Ahora tienes que aprender a levantarte cuando caigas.'],
      ['dios', 'Te doy RESURRECCIÓN: una vez al día, si te noquean, te levantas. Como yo, pero en Guamúchil.'],
      ['narrador', 'MILAGRO DESBLOQUEADO: RESURRECCIÓN (pasivo, 1 vez al día).']] },
    { t: 'fn', fn: () => { S.miracles.resurrect = true; S.mamadez = Math.min(100, S.mamadez + 8); S.flags.karla = true; Sound.sfx('miracle'); } }
  ], reward: { money: 500, cope: -30 } },

  // 14 ----------------------------------------------------------
  { name: 'Asalto al Corporativo Waifu', start: 'corporativo', req: () => S.mamadez >= 48, reqText: 'Necesitas MAMADEZ 48+ para enfrentar al Lic.', noPolice: true, steps: [
    { t: 'talk', lines: [
      ['brayan', 'Bro, me enteré de lo de la Yesenia. A mí también me sacó 3 mil pesos.'],
      ['popote', 'Y a mí, mamadito. El Lic nos dejó de pagar. Hoy Los Flacos están contigo.'],
      ['kenji', 'Y me quebró la tienda vendiendo figuras piratas más baratas. Esto es personal, Jesús-kun.'],
      ['karla', 'Yo nomás vine porque dijeron que había pelea. Y porque... bueno, ya, vamos.'],
      ['jesus', 'Entonces hoy, Guamúchil se cobra.'],
      ['dios', 'Mijo, te doy el último don: EXPULSAR A LOS MERCADERES. Como en el templo, pero con más volumen de pelo.'],
      ['narrador', 'MILAGRO: EXPULSAR MERCADERES [Q]. Onda expansiva que manda a volar a todos. Cambia de milagro con [Z].']] },
    { t: 'fn', fn: () => { S.miracles.expulsar = true; S.msel = 'expulsar'; S.fe += 30; Sound.sfx('miracle'); } },
    { t: 'fight', label: 'Derrota a los GUARDIAS KAWAII', music: 'boss', spawn: m => spawnGroup(m, 'guardia', 6, LOC('corporativo').x, LOC('corporativo').y + 30, 60) },
    { t: 'destroy', label: 'Destruye los SERVIDORES DE YESENIA', objs: () => [[124, 96], [124, 104], [150, 96], [150, 104]].map(([x, y]) => ({ x: x * TS + 8, y: y * TS + 8 })) },
    { t: 'fight', label: '¡Llegaron refuerzos! Acaba con ellos', spawn: m => spawnGroup(m, 'guardia', 8, LOC('corporativo').x, LOC('corporativo').y + 40, 80) },
    { t: 'talk', lines: [
      ['lic', 'Vaya, vaya. El chud del pelo de librito. ¿Sabes cuánto me has dado? 18,450 pesos.'],
      ['jesus', 'Y hoy vengo a cobrármelos.'],
      ['lic', 'Ja. Contempla mi obra maestra: ¡MECHA-YESENIA! Una figura escala 1:1... de 10 metros.'],
      ['jesus', 'Es... hermosa. ¡NO! ¡CONCÉNTRATE, JESÚS!']] },
    { t: 'boss', kind: 'mecha', at: () => ({ x: LOC('corporativo').x, y: LOC('corporativo').y + 90 }), label: 'Derrota a MECHA-YESENIA' },
    { t: 'talk', lines: [
      ['lic', '¡Mi... mi inversión! ¡Esa cosa costó 3 Suburbans!'],
      ['comandanta', 'Licenciado Figueroa, queda detenido por fraude, robo de estatuas y venta de figuras piratas.'],
      ['lic', '¡Las figuras piratas no son delito!'],
      ['kenji', 'PARA NOSOTROS SÍ.'],
      ['presidente', 'Jesús Alberto. Guamúchil te debe todo. Pondremos tu estatua junto a la de Pedro Infante.'],
      ['jesus', 'No, señor. El Ídolo es el Ídolo. Yo solo soy un vato que va al gym diario.'],
      ['narrador', 'Y así, Jesús, el chud de Guamúchil, se convirtió en leyenda del Valle del Évora.'],
      ['karla', 'Oye, ¿vamos por unos tacos?'],
      ['jesus', '...Soy monogámico.'],
      ['karla', 'Son TACOS, Jesús.'],
      ['jesus', '...Ok. Pero invito yo. Bueno, no. Me gasté todo en figuras.'],
      ['narrador', 'Algunas cosas nunca cambian.']] }
  ], reward: { money: 5000, fe: 50 }, onDone: () => { S.flags.ending = true; setTimeout(() => UI.credits(), 1200); } }
];
STORY.forEach((d, i) => d.story = i);

// ------------------------------------------------------------
//  CHAMBAS Y EVENTOS
// ------------------------------------------------------------
const Jobs = {
  tacos() {
    const steps = [];
    let from = LOC('taqueria');
    for (let i = 0; i < 3; i++) {
      steps.push({ t: 'go', at: () => { const p = playerPos(); return randomHouse(p.x, p.y, 280, 850); }, label: 'Reparte la orden de tacos #' + (i + 1), time: 65, failMsg: 'Los tacos llegaron fríos. El Güero te descontó.' });
      steps.push({ t: 'fn', fn: m => { const pay = Math.round((90 + Math.max(0, m.lastLeft || 0) * 3) * (1 + perk('money') / 100) * (1 + (S.hair - 1) * 0.08)); Game.addMoney(pay); UI.toast('Entrega lista: +' + money(pay), '#80ff80'); } });
    }
    return { title: 'CHAMBA: Repartidor de Tacos', steps, silent: false, reward: { fe: 1 } };
  },
  raite() {
    const steps = [];
    for (let i = 0; i < 3; i++) {
      steps.push({ t: 'fn', fn: m => { const s = randomSidewalk(250, 600); const p = makePed(pick(['senora', 'abuelo', 'vato', 'morra', 'otaku']), s.x, s.y, { mission: true, state: 'static', faceP: true }); say(p, '¡TAXI!', 30); E.peds.push(p); m.ents.push(p); m.client = p; } },
      { t: 'go', at: () => ({ x: Missions.active.client.x, y: Missions.active.client.y }), label: 'Recoge al pasajero #' + (i + 1), car: true, r: 30 },
      { t: 'fn', fn: m => { m.client.dead = true; UI.toast(pick(['"¿Usted es el del grupo de Chismes?"', '"Bonito peinado... ¿es peluca?"', '"Rápido, que voy tarde al bingo"', '"¿Por qué el carro huele a Cheetos?"']), '#ffe080'); } },
      { t: 'go', at: () => { const p = playerPos(); return randomHouse(p.x, p.y, 300, 900); }, label: 'Lleva al pasajero a su destino', car: true, time: 70, r: 30 },
      { t: 'fn', fn: m => { const pay = Math.round((70 + Math.max(0, m.lastLeft || 0) * 2.5) * (1 + perk('money') / 100)); Game.addMoney(pay); } });
    }
    return { title: 'CHAMBA: Raitero de Guamúchil', steps, reward: { fe: 1 } };
  },
  peleas(level) {
    const n = [3, 5, 8][level], pay = [300, 700, 1500][level];
    const steps = [{ t: 'talk', lines: [['narrador', 'PELEAS CLANDESTINAS DEL ÉVORA. Ronda ' + (level + 1) + '. Reglas: no hay reglas. Bueno, sí: no se vale jalar el pelo. (Gracias a Dios.)']] }];
    for (let w = 0; w < (level + 1); w++) steps.push({ t: 'fight', label: 'Oleada ' + (w + 1) + '/' + (level + 1), spawn: m => spawnGroup(m, 'peleador', Math.ceil(n / (level + 1)), LOC('arena').x, LOC('arena').y, 60) });
    return { title: 'PELEAS CLANDESTINAS', steps, reward: { money: pay, fe: 0 }, noPolice: true };
  },
  ladron() {
    const s = randomSidewalk(160, 260);
    return {
      title: '¡EVENTO! ¡Le robaron la bolsa a una señora!', reward: { money: 180, fe: 10 },
      steps: [{ t: 'fight', label: '¡Atrapa al LADRÓN!', lose: 520, loseMsg: 'El ladrón escapó.', spawn: m => spawnGroup(m, 'ladron', 1, s.x, s.y, 5) },
        { t: 'fn', fn: () => UI.toast('"¡Gracias, Jesús! Toma, por las molestias."', '#80ff80') }]
    };
  },
  asalto() {
    const doors = World.doors.filter(b => dist(b.spot.x, b.spot.y, PL.x, PL.y) < 700 && dist(b.spot.x, b.spot.y, PL.x, PL.y) > 150);
    if (!doors.length) return null;
    const b = pick(doors);
    return {
      title: '¡EVENTO! Los Flacos están asaltando ' + (LOC_NAMES[b.id] || 'un negocio'), reward: { money: 250, fe: 12 },
      steps: [{ t: 'fight', label: 'Detén el asalto de LOS FLACOS en ' + (LOC_NAMES[b.id] || 'el negocio'), lose: 900, loseMsg: 'Llegaste tarde.', spawn: m => spawnGroup(m, 'flaco', 3, b.spot.x, b.spot.y + 20, 30) }]
    };
  }
};
