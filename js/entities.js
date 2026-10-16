'use strict';
// ============================================================
//  entities.js : jugador, peatones, carros, policía, tren
// ============================================================
const E = { peds: [], cars: [], projs: [], pickups: [], parts: [], floaters: [], marks: [], objs: [] };
const PL = { x: 0, y: 0, dir: 1, frame: 0, animT: 0, atkT: 0, hurtT: 0, inv: 0, fx: 0, fy: 1, car: null, copeT: 0, stamina: 1, flashT: 0 };
const Cam = { x: 0, y: 0, shake: 0 };

const SKINS = ['#f0c8a0', '#e0b088', '#c89060', '#b07850', '#8a5a3a', '#d8a070'];
const HAIRS = ['#202020', '#3a2418', '#6a3a20', '#a07040', '#e0c060', '#8a1a1a', '#303030'];
const SHIRTS = ['#d03030', '#3060c0', '#f0f0f0', '#40a060', '#e0a020', '#8040a0', '#20a0a0', '#f080a0', '#606060', '#c06030', '#f0e060'];
const PANTS = ['#34508a', '#303038', '#5a4a3a', '#6a6a72', '#2a3a5a', '#8a7a5a'];

const WEAPONS = {
  puno: { name: 'PUÑOS', melee: 1, mult: 1 },
  bate: { name: 'BATE', melee: 1, mult: 1.8 },
  chancla: { name: 'CHANCLA', proj: 'chancla', dmg: 24, speed: 230 },
  resortera: { name: 'RESORTERA', proj: 'garbanzo', dmg: 15, speed: 320 },
  agua: { name: 'PISTOLA AGUA', proj: 'agua', dmg: 5, stun: 2.2, speed: 270 }
};
const WEAPON_ORDER = ['puno', 'bate', 'chancla', 'resortera', 'agua'];

const ENEMY = {
  flaco: { hp: 40, spd: 54, dmg: 6, range: 15, cd: .8, cash: [10, 45], spec: () => ({ skin: pick(SKINS), hair: '#202020', style: 'cap', hat: '#2a8a3a', shirt: '#3aa04a', pants: '#3aa04a', shoes: '#f0f0f0' }) },
  incredulo: { hp: 55, spd: 48, dmg: 7, range: 15, cd: .9, cash: [20, 60], spec: () => ({ skin: pick(SKINS), hair: '#202020', style: 'bald', shirt: '#f0f0f0', pants: '#8a7a5a', shoes: '#202020' }) },
  guardia: { hp: 75, spd: 46, dmg: 9, range: 15, cd: 1, ranged: 1, cash: [30, 80], spec: () => ({ skin: pick(SKINS), hair: '#202020', style: 'cap', hat: '#ff70c0', shirt: '#ff90d0', pants: '#202028', shoes: '#202020', glasses: '#101010' }) },
  peleador: { hp: 65, spd: 50, dmg: 8, range: 15, cd: .8, cash: [10, 30], spec: () => ({ skin: pick(SKINS), hair: pick(HAIRS), style: pick(['short', 'bald', 'spiky']), shirt: pick(SHIRTS), pants: pick(PANTS), shoes: '#202020', buff: 1 }) },
  popote: { hp: 170, spd: 62, dmg: 9, range: 15, cd: .6, boss: 'EL POPOTE', cash: [100, 100], spec: () => SPEC.popote },
  brayan: { hp: 340, spd: 50, dmg: 13, range: 17, cd: 1, boss: 'EL BRAYAN', charge: 1, cash: [0, 0], spec: () => SPEC.brayan },
  ladron: { hp: 35, spd: 64, dmg: 4, range: 14, cd: 1, flee: 1, cash: [0, 0], spec: () => ({ skin: pick(SKINS), hair: '#202020', style: 'cap', hat: '#202020', shirt: '#202020', pants: '#303038', shoes: '#f0f0f0' }) },
  chismosa: { hp: 999, spd: 46, dmg: 0, range: 0, cd: 1.4, thrower: 1, invul: 1, female: 1, cash: [0, 0], spec: () => ({ skin: pick(SKINS), hair: pick(['#6a6a6a', '#8a3a2a', '#202020']), style: 'bun', shirt: pick(SHIRTS), skirt: 1, dress: pick(['#5a3a6a', '#3a5a8a', '#8a3a3a']), shoes: '#3a2a1a' }) },
  cop: { hp: 60, spd: 56, dmg: 6, range: 15, cd: .9, cash: [0, 20], spec: () => ({ skin: pick(SKINS), hair: '#202020', style: 'cap', hat: '#1a2a5a', shirt: '#1a2a5a', pants: '#1a2a5a', shoes: '#101010', print: '#f0c030' }) }
};

let _pid = 0;
function civSpec(type) {
  const skin = pick(SKINS);
  switch (type) {
    case 'morra': return { skin, hair: pick(HAIRS), style: pick(['long', 'pony', 'long']), shirt: pick(SHIRTS), pants: pick(PANTS), shoes: pick(['#f0f0f0', '#202020', '#f080a0']), skirt: chance(.4) ? 1 : 0, dress: pick(SHIRTS) };
    case 'senora': return { skin, hair: pick(['#6a6a6a', '#202020', '#5a3020']), style: 'bun', shirt: pick(SHIRTS), skirt: 1, dress: pick(['#5a3a6a', '#3a5a8a', '#8a3a3a', '#2a6a4a']), shoes: '#3a2a1a' };
    case 'vato': return { skin, hair: pick(HAIRS), style: pick(['short', 'cap', 'cowboy', 'short', 'spiky']), hat: pick(['#e8d8b0', '#202020', '#d02020', '#3060c0']), shirt: pick(SHIRTS), pants: pick(PANTS), shoes: pick(['#5a3a1a', '#f0f0f0', '#202020']) };
    case 'otaku': return { skin, hair: '#202020', style: pick(['long', 'spiky', 'short']), shirt: pick(['#202020', '#f08020', '#3060c0']), pants: '#4a4a5a', shoes: '#303030', glasses: '#a0e0ff', print: pick(['#ff70b0', '#ffffff', '#40d0c0']) };
    case 'gymbro': return { skin, hair: pick(HAIRS), style: pick(['short', 'spiky', 'bald']), shirt: pick(['#d02020', '#202020', '#f0f0f0']), pants: '#303038', shoes: '#f0f0f0', buff: 1 };
    case 'abuelo': return { skin, hair: '#c0c0c0', style: 'cowboy', hat: '#e8d8b0', shirt: '#f0f0e8', pants: '#5a5a62', shoes: '#5a3a1a' };
    case 'cop': return ENEMY.cop.spec();
  }
  return { skin, hair: pick(HAIRS), style: 'short', shirt: pick(SHIRTS), pants: pick(PANTS), shoes: '#202020' };
}
function makePed(type, x, y, o) {
  const p = {
    kind: 'ped', id: ++_pid, type, x, y, dir: rndi(0, 3), frame: 0, animT: 0, state: 'walk', t: rnd(.5, 2.5),
    hp: 30, maxhp: 30, speed: rnd(20, 30), spec: null, female: false, hostile: false, say: null, sayT: 0,
    atkCd: rnd(.5, 1.2), mission: false, vx: 0, vy: 0, downT: 0, stunT: 0, hurtT: 0, cross: 0, chargeT: 0, chargeCd: 3
  };
  if (ENEMY[type] && type !== 'cop') {
    const d = ENEMY[type];
    p.hostile = true; p.hp = p.maxhp = d.hp; p.speed = d.spd; p.spec = d.spec(); p.def = d; p.female = !!d.female;
  } else {
    p.spec = civSpec(type);
    p.female = type === 'morra' || type === 'senora';
    if (type === 'cop') { p.def = ENEMY.cop; p.hp = p.maxhp = 60; p.speed = 30; }
  }
  return Object.assign(p, o || {});
}
function makeCar(type, x, y, a, o) {
  const T = CARTYPES[type];
  return Object.assign({
    kind: 'car', type, color: pick(CAR_COLORS), x, y, a, v: 0, hp: 100, ai: null, dir: 0, turnTo: -1, lastInter: 0,
    max: T.max, acc: T.acc, L: T.L, Wd: T.Wd, stuck: 0, rev: 0, revSteer: 1, siren: false, burnT: 0, dead: false,
    honkT: 0, cruise: rnd(65, 95), persistent: false, mission: false, navT: 0, wp: null, deadT: 0
  }, o || {});
}

// ------------------------------------------------------------
//  helpers
// ------------------------------------------------------------
function say(p, txt, t) { p.say = txt; p.sayT = t || 2.8; }
function floater(x, y, text, col) { E.floaters.push({ x, y, text, col: col || '#fff', life: 1.3 }); }
function burst(x, y, col, n, spd, grav) {
  for (let i = 0; i < (n || 8); i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(20, spd || 80);
    E.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rnd(.3, .7), col: Array.isArray(col) ? pick(col) : col, sz: rndi(1, 2), grav: grav === undefined ? 120 : grav });
  }
}
function pedBlocked(x, y, water) {
  const r = 3.5, m = water ? 'pw' : 'p';
  return World.solidPx(x - r, y - 3, m) || World.solidPx(x + r, y - 3, m) || World.solidPx(x - r, y + 1, m) || World.solidPx(x + r, y + 1, m);
}
function moveEnt(p, dx, dy, water) {
  let hit = false;
  if (dx) { if (!pedBlocked(p.x + dx, p.y, water)) p.x += dx; else hit = true; }
  if (dy) { if (!pedBlocked(p.x, p.y + dy, water)) p.y += dy; else hit = true; }
  p.x = clamp(p.x, 4, MW * TS - 4); p.y = clamp(p.y, 6, MH * TS - 2);
  return hit;
}
function dirFromVec(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); }
function carHits(car, x, y, a) {
  const hl = car.L / 2 - 1, hw = car.Wd / 2 - 1, c = Math.cos(a), s = Math.sin(a);
  const pts = [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw]];
  for (const [lx, ly] of pts) if (World.solidPx(x + c * lx - s * ly, y + s * lx + c * ly, 'c')) return true;
  return false;
}
function inCar(car, px, py, pad) {
  const dx = px - car.x, dy = py - car.y, c = Math.cos(-car.a), s = Math.sin(-car.a);
  const lx = dx * c - dy * s, ly = dx * s + dy * c;
  return Math.abs(lx) < car.L / 2 + (pad || 0) && Math.abs(ly) < car.Wd / 2 + (pad || 0);
}
function playerPos() { return PL.car ? { x: PL.car.x, y: PL.car.y } : { x: PL.x, y: PL.y - 6 }; }
function onScreen(x, y, m) { m = m || 20; return x > Cam.x - m && x < Cam.x + W + m && y > Cam.y - m && y < Cam.y + H + m; }

// ------------------------------------------------------------
//  JUGADOR
// ------------------------------------------------------------
function perk(k) { return Game.perks[k] || 0; }
function punchDmg() {
  const w = WEAPONS[S.wsel];
  return (9 + S.mamadez * 0.38) * (1 + perk('dmg') / 100) * (PL.copeT > 0 ? 2 : 1) * (w.mult || 1);
}
function maxHp() { return 100 + Math.floor(S.mamadez * 0.5) + perk('hp'); }

function updatePlayer(dt) {
  PL.inv = Math.max(0, PL.inv - dt); PL.hurtT = Math.max(0, PL.hurtT - dt); PL.atkT = Math.max(0, PL.atkT - dt);
  if (PL.copeT > 0) { PL.copeT -= dt; if (PL.copeT <= 0) UI.toast('Se acabó el MODO COPIUM. La realidad regresa.', '#c080ff'); }
  if (PL.car) { updatePlayerCar(dt); return; }
  let mx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
  let my = (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0);
  const running = Input.held('run') && PL.stamina > 0.05;
  let spd = 62 * (1 + perk('spd') / 100) * (PL.copeT > 0 ? 1.3 : 1) * (S.flags.sinBombeo ? 0.9 : 1);
  if (running) spd *= 1.6 + S.mamadez / 400;
  if (S.hunger <= 0) spd *= 0.75;
  if (mx || my) {
    const l = Math.hypot(mx, my); mx /= l; my /= l;
    PL.fx = mx; PL.fy = my;
    PL.dir = dirFromVec(mx, my);
    PL.animT += dt * (running ? 12 : 8);
    PL.frame = 1 + (Math.floor(PL.animT) % 2);
    const water = !!S.miracles.water;
    moveEnt(PL, mx * spd * dt, my * spd * dt, water);
    if (running) PL.stamina = Math.max(0, PL.stamina - dt * 0.25); else PL.stamina = Math.min(1, PL.stamina + dt * 0.2);
    if (water && World.tileAt(PL.x, PL.y) === TT.WATER && chance(dt * 6)) E.parts.push({ x: PL.x + rnd(-4, 4), y: PL.y, vx: 0, vy: -10, life: .4, col: '#cfe8ff', sz: 1, grav: 0 });
  } else { PL.frame = 0; PL.stamina = Math.min(1, PL.stamina + dt * 0.3); }
  // empujar fuera de carros
  for (const c of E.cars) {
    if (Math.abs(c.x - PL.x) > 30 || Math.abs(c.y - PL.y) > 30) continue;
    if (inCar(c, PL.x, PL.y - 2, 2)) {
      const a = Math.atan2(PL.y - c.y, PL.x - c.x);
      moveEnt(PL, Math.cos(a) * 2, Math.sin(a) * 2);
      if (Math.abs(c.v) > 45 && PL.inv <= 0 && c.ai !== null) { hurtPlayer(Math.abs(c.v) * 0.12, 'car'); knockPlayer(Math.cos(c.a) * 6, Math.sin(c.a) * 6); }
    }
  }
  if (Input.hit('act')) playerAttack();
  if (Input.hit('weapon')) cycleWeapon();
}
function knockPlayer(kx, ky) { moveEnt(PL, kx, 0); moveEnt(PL, 0, ky); }
function cycleWeapon() {
  let i = WEAPON_ORDER.indexOf(S.wsel);
  for (let k = 0; k < WEAPON_ORDER.length; k++) {
    i = (i + 1) % WEAPON_ORDER.length;
    const w = WEAPON_ORDER[i];
    if (S.weapons[w] > 0) { S.wsel = w; UI.toast('Arma: ' + WEAPONS[w].name, '#ffd060'); Sound.sfx('select'); return; }
  }
}
function playerAttack() {
  const w = WEAPONS[S.wsel];
  if (w.melee) {
    PL.atkT = 0.22;
    Sound.sfx('whiff');
    const hx = PL.x + PL.fx * 11, hy = PL.y - 6 + PL.fy * 9;
    let hitAny = false;
    for (const p of E.peds) {
      if (p.dead || p.state === 'down' && !p.hostile) continue;
      if (dist(hx, hy, p.x, p.y - 6) < 15) { applyHit(p, punchDmg(), PL.fx, PL.fy); hitAny = true; }
    }
    for (const o of E.objs) {
      if (o.dead) continue;
      if (dist(hx, hy, o.x, o.y) < (o.r || 14) + 6) { hitObj(o, punchDmg()); hitAny = true; }
    }
    if (Game.boss && dist(hx, hy, Game.boss.x, Game.boss.y - 30) < 34) { Game.hitBoss(punchDmg()); hitAny = true; }
    if (!hitAny) for (const c of E.cars) if (inCar(c, hx, hy, 3)) { c.hp -= punchDmg() * 0.15; Sound.sfx('bump'); burst(hx, hy, '#c0c0c0', 3); break; }
  } else {
    if (!S.weapons[S.wsel]) { S.wsel = 'puno'; return; }
    S.weapons[S.wsel]--;
    PL.atkT = 0.15;
    let ax = PL.fx, ay = PL.fy;
    // auto-apuntar
    let best = null, bd = 160;
    const targets = E.peds.filter(p => !p.dead && p.hostile).map(p => ({ x: p.x, y: p.y - 6 }));
    if (Game.boss) targets.push({ x: Game.boss.x, y: Game.boss.y - 30 });
    E.objs.forEach(o => { if (!o.dead) targets.push({ x: o.x, y: o.y }); });
    for (const t of targets) {
      const d = dist(PL.x, PL.y - 6, t.x, t.y);
      if (d < bd) { const dx = (t.x - PL.x) / d, dy = (t.y - PL.y + 6) / d; if (dx * ax + dy * ay > 0.6) { bd = d; best = { dx, dy }; } }
    }
    if (best) { ax = best.dx; ay = best.dy; }
    E.projs.push({ x: PL.x + ax * 6, y: PL.y - 7 + ay * 6, vx: ax * w.speed, vy: ay * w.speed, life: 0.9, dmg: w.dmg * (1 + perk('dmg') / 100) * (PL.copeT > 0 ? 2 : 1), owner: 'pl', kind: w.proj, stun: w.stun || 0, rot: 0 });
    Sound.sfx('throw');
    if (!S.weapons[S.wsel]) { UI.toast('Sin munición', '#ff8080'); S.wsel = 'puno'; }
  }
}
function applyHit(p, dmg, kx, ky) {
  if (p.female && (!p.hostile || p.def && p.def.invul)) {
    // te cachetean. te lo mereces.
    say(p, pick(LINES.slap)); Sound.sfx('slap'); floater(PL.x, PL.y - 24, '¡CACHETADA!', '#ff80a0');
    hurtPlayer(4, 'slap', true); addCope(8); p.dodgeT = .3;
    if (p.state !== 'flee' && !p.hostile) { p.state = 'flee'; p.t = 2; }
    Game.stat('cachetadas');
    return;
  }
  p.hp -= dmg; p.hurtT = 0.2;
  moveEnt(p, kx * 6, ky * 6);
  Sound.sfx('punch'); Cam.shake = Math.max(Cam.shake, 2);
  burst(p.x, p.y - 8, ['#ffffff', '#ffe060'], 5, 60);
  floater(p.x, p.y - 22, Math.round(dmg) + '', '#ffe060');
  if (p.hostile && p.def && p.def.boss) Game.bossBar = p;
  if (p.hp <= 0) koPed(p);
  else if (!p.hostile) {
    if (p.type === 'cop') { Police.raise(2); p.copAngry = true; }
    else { say(p, pick(LINES.hit)); p.state = 'flee'; p.t = 4; if (S.wanted === 0 && Police.copNear(220)) Police.raise(1); }
  }
}
function koPed(p) {
  if (p.hostile) {
    p.dead = true;
    burst(p.x, p.y - 8, ['#ffffff', '#ffe060', '#a0a0ff'], 14, 90);
    const c = p.def.cash;
    if (c && c[1] > 0) dropCash(p.x, p.y, rndi(c[0], c[1]));
    if (p.def.boss) Game.bossBar = null;
    Game.stat('kos');
    if (chance(0.12)) E.pickups.push({ x: p.x + 6, y: p.y, kind: 'heal', val: 25, t: 0 });
  } else {
    p.state = 'down'; p.downT = 4; p.hp = 0;
    if (p.type === 'cop') Police.raise(1, 5);
    else Police.raise(S.wanted < 1 && (Police.copNear(260) || chance(.3)) ? 1 : 0, 2);
    if (chance(.5)) dropCash(p.x, p.y, rndi(5, 30));
  }
}
function dropCash(x, y, v) { E.pickups.push({ x: x + rnd(-4, 4), y: y + rnd(-2, 2), kind: 'cash', val: v, t: 0 }); }
function hitObj(o, dmg) {
  o.hp -= dmg; o.hurtT = .15; Sound.sfx('punch'); burst(o.x, o.y, ['#40ffa0', '#ffffff'], 6, 70);
  if (o.hp <= 0) { o.dead = true; Sound.sfx('boom'); burst(o.x, o.y, ['#40ffa0', '#ff60c0', '#ffffff', '#ffe060'], 30, 140); Cam.shake = 6; floater(o.x, o.y - 20, 'SERVIDOR DESTRUIDO', '#40ffa0'); }
}
function hurtPlayer(d, src, ignoreInv) {
  if (Game.state !== 'play') return;
  if (PL.inv > 0 && !ignoreInv) return;
  if (PL.car) { PL.car.hp -= d * 0.6; return; }
  S.hp -= d; PL.hurtT = .25; PL.inv = .35;
  Cam.shake = Math.max(Cam.shake, 3);
  Sound.sfx('hurt');
  if (src !== 'slap') addCope(d * 0.12);
  if (S.hp <= 0) Game.playerDown('ko');
}
function addCope(v) {
  if (v > 0) v *= (1 - perk('cope') / 100) * (S.anx >= 80 ? 1.5 : 1);
  S.copium = clamp(S.copium + v, 0, 100);
  if (S.copium >= 100 && PL.copeT <= 0) {
    PL.copeT = 15; S.copium = 40;
    UI.banner('MODO COPIUM', 'Daño x2. Velocidad +30%. Dignidad: 0.', '#c060ff');
    Sound.sfx('level');
  }
}

// ---------------- carro del jugador ----------------
function enterCar(c) {
  if (c.ai && c.ai !== 'player') {
    const drv = makePed(c.ai === 'cop' ? 'cop' : pick(['vato', 'senora', 'morra', 'abuelo']), c.x + 10, c.y + 10);
    drv.state = 'flee'; drv.t = 5; say(drv, pick(LINES.carStolen));
    if (!pedBlocked(drv.x, drv.y)) E.peds.push(drv);
    if (c.type === 'police') Police.raise(2);
    else if (Police.copNear(200) || chance(.08)) Police.raise(1, 2);
    Game.stat('carros');
  }
  c.ai = 'player'; c.persistent = true; c.siren = false;
  PL.car = c;
  Sound.sfx('select');
  Game.onEnterCar(c);
}
function exitCar() {
  const c = PL.car;
  if (Math.abs(c.v) > 35) return;
  const side = [[0, c.Wd / 2 + 8], [0, -c.Wd / 2 - 8], [-c.L / 2 - 8, 0], [c.L / 2 + 8, 0]];
  const co = Math.cos(c.a), si = Math.sin(c.a);
  for (const [lx, ly] of side) {
    const x = c.x + co * lx - si * ly, y = c.y + si * lx + co * ly + 6;
    if (!pedBlocked(x, y, !!S.miracles.water)) {
      PL.x = x; PL.y = y; PL.car = null; c.ai = null; c.v = 0;
      Game.onExitCar();
      return;
    }
  }
}
function updatePlayerCar(dt) {
  const c = PL.car;
  if (c.dead) { exitCarForce(); return; }
  const gas = Input.held('up') ? 1 : 0, brake = Input.held('down') ? 1 : 0;
  const steer = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
  const hb = Input.held('act');
  const tile = World.tileAt(c.x, c.y);
  let maxV = c.max * (1 + perk('car') / 100);
  if (tile === TT.GRASS || tile === TT.DIRT || tile === TT.FIELD || tile === TT.SAND) maxV *= 0.55;
  else if (tile === TT.PLAZA || tile === TT.SIDE) maxV *= 0.85;
  if (c.hp < 30) maxV *= 0.7;
  if (gas) c.v += (c.v < 0 ? c.acc * 2.2 : c.acc) * dt;
  if (brake) c.v -= (c.v > 0 ? c.acc * 2 : c.acc * 0.7) * dt;
  if (!gas && !brake) c.v *= Math.pow(0.35, dt);
  if (hb) c.v *= Math.pow(0.25, dt);
  c.v = clamp(c.v, -maxV * 0.45, maxV);
  if (c.v > maxV) c.v -= c.acc * 2 * dt;
  const turn = steer * (hb ? 3.6 : 2.6) * dt * clamp(c.v / 70, -1, 1);
  if (turn && !carHits(c, c.x, c.y, c.a + turn)) c.a += turn;
  const r = carMove(c, dt);
  if (r === 'hit' && Math.abs(c.v) > 15) Cam.shake = Math.max(Cam.shake, 3);
  if ((hb && Math.abs(c.v) > 70) || (Math.abs(turn) > 0.03 && Math.abs(c.v) > 120)) {
    const co = Math.cos(c.a), si = Math.sin(c.a);
    [[-c.L / 2 + 3, c.Wd / 2 - 2], [-c.L / 2 + 3, -c.Wd / 2 + 2]].forEach(([lx, ly]) => E.marks.push({ x: c.x + co * lx - si * ly, y: c.y + si * lx + co * ly, life: 6 }));
    if (E.marks.length > 400) E.marks.splice(0, E.marks.length - 400);
  }
  if (Input.hit('horn')) { Sound.sfx('horn'); E.peds.forEach(p => { if (!p.hostile && dist(p.x, p.y, c.x, c.y) < 80) { p.state = 'flee'; p.t = 2; } }); }
  Sound.setEngine(true, c.v);
}
function exitCarForce() {
  const c = PL.car;
  PL.car = null; c.ai = null;
  PL.x = c.x + 18; PL.y = c.y + 10;
  if (pedBlocked(PL.x, PL.y)) { const f = World.findFree(Math.floor(c.x / TS), Math.floor(c.y / TS)); PL.x = f[0] * TS + 8; PL.y = f[1] * TS + 10; }
  Game.onExitCar();
}
function carMove(car, dt) {
  const nx = car.x + Math.cos(car.a) * car.v * dt, ny = car.y + Math.sin(car.a) * car.v * dt;
  if (!carHits(car, nx, ny, car.a)) { car.x = nx; car.y = ny; return false; }
  if (!carHits(car, nx, car.y, car.a)) { car.x = nx; car.v *= 0.9; return 'slide'; }
  if (!carHits(car, car.x, ny, car.a)) { car.y = ny; car.v *= 0.9; return 'slide'; }
  const imp = Math.abs(car.v);
  car.v = -car.v * 0.3;
  if (imp > 60) { car.hp -= imp * 0.05; if (onScreen(car.x, car.y)) Sound.sfx(imp > 110 ? 'crash' : 'bump'); burst(car.x + Math.cos(car.a) * car.L / 2, car.y + Math.sin(car.a) * car.L / 2, ['#c0c0c0', '#ffe060'], 4, 50); }
  return 'hit';
}

// ------------------------------------------------------------
//  IA de tráfico por carriles
// ------------------------------------------------------------
function laneTarget(I, d) { return d === 1 ? I.vx * TS + 16 : d === 3 ? I.vx * TS + 48 : d === 0 ? I.hy * TS + 48 : I.hy * TS + 16; }
function exitExists(I, d) {
  if (d === 0) return World.isRoad(I.vx + 4, I.hy + 1);
  if (d === 2) return World.isRoad(I.vx - 1, I.hy + 1);
  if (d === 1) return World.isRoad(I.vx + 1, I.hy + 4);
  return World.isRoad(I.vx + 1, I.hy - 1);
}
function chooseExit(car, I) {
  const opts = [0, 1, 2, 3].filter(d => d !== (car.dir + 2) % 4 && exitExists(I, d));
  if (!opts.length) return -1;
  if (car.dest || car.ai === 'flee') {
    const cx = I.vx * TS + 32, cy = I.hy * TS + 32;
    const pp = playerPos();
    let best = opts[0], bs = Infinity;
    for (const d of opts) {
      const ex = cx + DX[d] * 160, ey = cy + DY[d] * 160;
      let s = car.dest ? dist(ex, ey, car.dest.x, car.dest.y) : -dist(ex, ey, pp.x, pp.y);
      s += rnd(0, car.dest ? 30 : 120);
      if (s < bs) { bs = s; best = d; }
    }
    return best;
  }
  if (opts.includes(car.dir) && chance(.5)) return car.dir;
  return pick(opts);
}
function updateLaneCar(car, dt) {
  const tx = Math.floor(car.x / TS), ty = Math.floor(car.y / TS);
  const iid = World.interMap[ty * MW + tx] || 0;
  if (iid && car.lastInter !== iid) {
    car.lastInter = iid;
    const I = World.inters[iid - 1];
    car.turnI = I; car.turnTo = chooseExit(car, I);
  }
  if (car.turnTo >= 0 && car.turnTo !== car.dir && car.turnI) {
    const tg = laneTarget(car.turnI, car.turnTo);
    const d = car.dir;
    const reached = d === 0 ? car.x >= tg : d === 2 ? car.x <= tg : d === 1 ? car.y >= tg : car.y <= tg;
    if (reached) {
      if (d === 0 || d === 2) car.x = tg; else car.y = tg;
      car.dir = car.turnTo; car.turnTo = -1;
    }
  } else if (car.turnTo === car.dir) car.turnTo = -1;
  // callejón sin salida / borde
  const ax = car.x + DX[car.dir] * 26, ay = car.y + DY[car.dir] * 26;
  if (car.turnTo < 0 && !World.isRoad(Math.floor(ax / TS), Math.floor(ay / TS))) {
    const nd = (car.dir + 2) % 4;
    if (car.dir === 0) car.y -= 32; else if (car.dir === 2) car.y += 32; else if (car.dir === 1) car.x += 32; else car.x -= 32;
    car.dir = nd; car.a = nd * Math.PI / 2; car.lastInter = 0;
  }
  // obstáculos
  let tv = car.cruise;
  const fx = DX[car.dir], fy = DY[car.dir];
  const look = (ox, oy, rad) => {
    const dx = ox - car.x, dy = oy - car.y;
    const fwd = dx * fx + dy * fy, lat = Math.abs(dx * fy - dy * fx);
    return fwd > 4 && fwd < 30 + Math.abs(car.v) * 0.25 && lat < (rad || 9);
  };
  if (car.ai !== 'flee') {
    for (const o of E.cars) { if (o === car || Math.abs(o.x - car.x) > 60 || Math.abs(o.y - car.y) > 60) continue; if (look(o.x, o.y, 10)) { tv = 0; break; } }
    if (!PL.car && look(PL.x, PL.y - 4, 10)) { tv = 0; if (car.honkT <= 0) { car.honkT = 3; if (onScreen(car.x, car.y)) Sound.sfx('horn'); } }
    for (const p of E.peds) { if (Math.abs(p.x - car.x) > 40 || Math.abs(p.y - car.y) > 40) continue; if (look(p.x, p.y - 4, 8)) { tv = Math.min(tv, 5); break; } }
    if (Train.active && (car.dir === 1 || car.dir === 3)) {
      const dy = Train.y - car.y;
      if (dy * fy > 0 && Math.abs(dy) < 70 && Math.abs(car.x - Train.x) < 600) tv = 0;
    }
  }
  if (tv < 6 && car.ai !== 'flee') car.blockT = (car.blockT || 0) + dt; else car.blockT = 0;
  if (car.ghostT > 0) tv = car.cruise;
  else if (car.blockT > (car.ai === 'tail' ? 1 : 4)) { car.ghostT = 1.5; car.blockT = 0; tv = car.cruise; }
  car.honkT -= dt;
  const acc = tv > car.v ? car.acc * 0.7 : car.acc * 2.5;
  car.v += clamp(tv - car.v, -acc * dt, acc * dt);
  car.x += fx * car.v * dt; car.y += fy * car.v * dt;
  car.a += angDiff(car.a, car.dir * Math.PI / 2) * Math.min(1, dt * 10);
}

// cops / perseguidores con física
function los(x0, y0, x1, y1) {
  const d = dist(x0, y0, x1, y1), n = Math.ceil(d / 14);
  for (let i = 1; i < n; i++) { const t = i / n; if (World.solidPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 'c')) return false; }
  return true;
}
function updateSeekCar(car, dt, tx, ty) {
  car.navT -= dt;
  if (car.navT <= 0) {
    car.navT = 0.6;
    if (los(car.x, car.y, tx, ty)) car.wp = null;
    else {
      let best = null, bs = Infinity;
      for (const I of World.inters) {
        const ix = I.vx * TS + 32, iy = I.hy * TS + 32;
        const d1 = dist(car.x, car.y, ix, iy);
        if (d1 < 30 || d1 > 700) continue;
        if (!los(car.x, car.y, ix, iy)) continue;
        const s = d1 + dist(ix, iy, tx, ty) * 1.3;
        if (s < bs) { bs = s; best = { x: ix, y: iy }; }
      }
      car.wp = best;
    }
  }
  const gx = car.wp ? car.wp.x : tx, gy = car.wp ? car.wp.y : ty;
  if (car.rev > 0) {
    car.rev -= dt;
    car.v = Math.max(car.v - 260 * dt, -70);
    car.a += car.revSteer * dt * 2.2;
  } else {
    const want = Math.atan2(gy - car.y, gx - car.x);
    const d = angDiff(car.a, want);
    const turn = clamp(d, -1, 1) * 3 * dt * clamp(Math.abs(car.v) / 50, 0.35, 1);
    if (!carHits(car, car.x, car.y, car.a + turn)) car.a += turn;
    const close = dist(car.x, car.y, tx, ty);
    let tgt = car.max * (Math.abs(d) > 1.1 ? 0.45 : 1);
    if (car.ai === 'cop' && !PL.car && close < 60) tgt = 0;
    if (car.ai === 'cop' && PL.car && close < 50) tgt = Math.min(tgt, Math.abs(PL.car.v) + 20);
    car.v += clamp(tgt - car.v, -car.acc * 2 * dt, car.acc * dt);
  }
  const r = carMove(car, dt);
  if ((r === 'hit' || Math.abs(car.v) < 12) && car.rev <= 0) { car.stuck += dt; if (car.stuck > 0.6) { car.rev = 0.9; car.revSteer = chance(.5) ? 1 : -1; car.stuck = 0; } }
  else car.stuck = 0;
}

function updateCar(car, dt) {
  if (car.hitCd > 0) car.hitCd -= dt;
  if (car.ghostT > 0) car.ghostT -= dt;
  if (car.dead) { car.deadT += dt; return; }
  if (car.hp <= 0) {
    car.burnT += dt;
    if (chance(dt * 20)) E.parts.push({ x: car.x + rnd(-6, 6), y: car.y + rnd(-4, 4), vx: rnd(-8, 8), vy: -30, life: .6, col: pick(['#ff8020', '#ffe040', '#d02020']), sz: 2, grav: -20 });
    car.v *= Math.pow(0.3, dt);
    if (car !== PL.car) carMove(car, dt);
    if (car === PL.car && car.burnT < 0.1) UI.toast('¡EL CARRO SE ESTÁ QUEMANDO! ¡BÁJATE! [E]', '#ff6040');
    if (car.burnT > 2.6) explodeCar(car);
    return;
  }
  if (car.hp < 40 && chance(dt * 6)) E.parts.push({ x: car.x, y: car.y, vx: rnd(-5, 5), vy: -18, life: 1, col: car.hp < 20 ? '#303030' : '#909090', sz: 2, grav: -10 });
  if (car.ai === 'traffic' || car.ai === 'flee' || car.ai === 'tail') updateLaneCar(car, dt);
  else if (car.ai === 'cop') {
    const pp = playerPos();
    updateSeekCar(car, dt, pp.x, pp.y);
    car.siren = true;
    if (!PL.car && dist(car.x, car.y, PL.x, PL.y) < 70 && Math.abs(car.v) < 30 && !car.dropped && Police.copPeds() < 4) {
      car.dropped = true;
      const cp = makePed('cop', car.x + 14, car.y + 12); cp.copAngry = true; cp.fromCar = true;
      if (!pedBlocked(cp.x, cp.y)) E.peds.push(cp);
    }
    if (car.dropped && (PL.car || dist(car.x, car.y, PL.x, PL.y) > 160)) car.dropped = false;
  } else if (car.ai === 'chase') {
    const pp = playerPos(); updateSeekCar(car, dt, pp.x, pp.y);
  } else if (car !== PL.car) {
    car.v *= Math.pow(0.2, dt);
    if (Math.abs(car.v) > 2) carMove(car, dt);
  }
}
function explodeCar(car) {
  car.dead = true; car.hp = 0; car.v = 0; car.ai = null;
  Sound.sfx('boom'); Cam.shake = 8;
  burst(car.x, car.y, ['#ff8020', '#ffe040', '#d02020', '#303030', '#ffffff'], 40, 160, 40);
  if (PL.car === car) { exitCarForce(); hurtPlayer(35, 'boom', true); }
  else if (!PL.car && dist(PL.x, PL.y, car.x, car.y) < 50) hurtPlayer(30, 'boom', true);
  for (const p of E.peds) if (dist(p.x, p.y, car.x, car.y) < 50) { if (p.hostile) { p.hp -= 60; if (p.hp <= 0 && !p.dead) koPed(p); } else if (!p.female) { p.state = 'down'; p.downT = 4; } }
  for (const o of E.cars) if (o !== car && !o.dead && dist(o.x, o.y, car.x, car.y) < 50) o.hp -= 35;
}

// colisiones carro-carro y carro-peatón
function collideCars() {
  const cs = E.cars;
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    for (let j = i + 1; j < cs.length; j++) {
      const b = cs[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) continue;
      if ((a.ghostT > 0 || a.ai === 'flee' || a.ai === 'tail') && b !== PL.car && b.ai !== 'cop' || (b.ghostT > 0 || b.ai === 'flee' || b.ai === 'tail') && a !== PL.car && a.ai !== 'cop') continue;
      const ra = (a.L + a.Wd) / 4.2, rb = (b.L + b.Wd) / 4.2;
      const d = Math.hypot(dx, dy);
      if (d >= ra + rb || d === 0) continue;
      if (!(inCar(a, b.x + Math.cos(b.a) * b.L / 2.5, b.y + Math.sin(b.a) * b.L / 2.5, 1) || inCar(b, a.x + Math.cos(a.a) * a.L / 2.5, a.y + Math.sin(a.a) * a.L / 2.5, 1) || d < Math.min(ra, rb) * 1.2)) continue;
      const nx = dx / d, ny = dy / d, ov = ra + rb - d;
      const va = [Math.cos(a.a) * a.v, Math.sin(a.a) * a.v], vb = [Math.cos(b.a) * b.v, Math.sin(b.a) * b.v];
      const rel = Math.hypot(va[0] - vb[0], va[1] - vb[1]);
      const aLane = a.ai === 'traffic' || a.ai === 'flee' || a.ai === 'tail' || a.dead;
      const bLane = b.ai === 'traffic' || b.ai === 'flee' || b.ai === 'tail' || b.dead;
      const pushA = aLane && !bLane ? 0 : !aLane && bLane ? 1 : 0.5;
      const tryPush = (c, px, py) => { if (!carHits(c, c.x + px, c.y + py, c.a)) { c.x += px; c.y += py; } };
      tryPush(a, -nx * ov * pushA, -ny * ov * pushA);
      tryPush(b, nx * ov * (1 - pushA), ny * ov * (1 - pushA));
      if (rel > 25 && !(a.hitCd > 0) && !(b.hitCd > 0)) {
        a.hitCd = b.hitCd = 0.6;
        const cop = a.ai === 'cop' || b.ai === 'cop';
        const dmg = rel * (cop ? 0.04 : 0.07);
        a.hp -= dmg; b.hp -= dmg;
        a.v *= 0.45; b.v *= 0.45;
        if (onScreen(a.x, a.y)) { Sound.sfx(rel > 100 ? 'crash' : 'bump'); burst((a.x + b.x) / 2, (a.y + b.y) / 2, ['#c0c0c0', '#ffe060'], 5, 60); }
        if (a === PL.car || b === PL.car) { Cam.shake = Math.max(Cam.shake, rel / 25); const o = a === PL.car ? b : a; if (o.ai === 'traffic' && rel > 90 && S.wanted === 0 && Police.copNear(180)) Police.raise(1, 1); }
      }
    }
  }
  // atropellos
  for (const c of cs) {
    const sp = Math.abs(c.v);
    if (sp < 30 || c.dead) continue;
    for (const p of E.peds) {
      if (p.dead || p.state === 'down') continue;
      if (Math.abs(p.x - c.x) > 22 || Math.abs(p.y - c.y) > 22) continue;
      if (!inCar(c, p.x, p.y - 3, 3)) continue;
      if (p.female || (p.def && p.def.invul)) {
        const a = c.a + (chance(.5) ? Math.PI / 2 : -Math.PI / 2);
        moveEnt(p, Math.cos(a) * 20, Math.sin(a) * 20);
        say(p, pick(LINES.dodge)); p.state = p.hostile ? p.state : 'flee'; p.t = 2;
        continue;
      }
      const kx = Math.cos(c.a) * 14, ky = Math.sin(c.a) * 14;
      if (p.hostile) { p.hp -= sp * 0.55; moveEnt(p, kx, ky); Sound.sfx('punch'); burst(p.x, p.y - 6, '#ffffff', 6); if (p.hp <= 0) koPed(p); }
      else {
        moveEnt(p, kx, ky); p.state = 'down'; p.downT = 4; Sound.sfx('punch');
        if (c === PL.car) { Police.raise(p.type === 'cop' ? 2 : (S.wanted === 0 && (Police.copNear(250) || chance(.35)) ? 1 : 0), p.type === 'cop' ? 5 : 2); Game.stat('atropellos'); addCope(-2); }
      }
      c.v *= 0.85;
    }
  }
}

// ------------------------------------------------------------
//  PEATONES
// ------------------------------------------------------------
function updatePed(p, dt) {
  p.animT += dt * 8; p.hurtT = Math.max(0, p.hurtT - dt);
  if (p.sayT > 0) { p.sayT -= dt; if (p.sayT <= 0) p.say = null; }
  if (p.stunT > 0) { p.stunT -= dt; p.frame = 0; return; }
  if (p.state === 'down') {
    p.downT -= dt;
    if (p.downT <= 0) { p.state = 'flee'; p.t = 4; p.hp = p.maxhp; if (chance(.6)) say(p, pick(LINES.hit)); }
    return;
  }
  if (p.state === 'rescue') { p.frame = Math.floor(p.animT) % 2 + 1; return; }
  if (p.state === 'static') { p.frame = 0; if (p.faceP) p.dir = dirFromVec(PL.x - p.x, PL.y - p.y); return; }
  if (p.hostile || (p.type === 'cop' && (S.wanted > 0 || p.copAngry))) { updateHostile(p, dt); return; }
  let spd = p.speed;
  if (p.state === 'flee') {
    p.t -= dt; spd *= 2.3;
    const pp = playerPos();
    const a = Math.atan2(p.y - pp.y, p.x - pp.x) + Math.sin(p.id + p.t) * 0.5;
    const vx = Math.cos(a), vy = Math.sin(a);
    p.dir = dirFromVec(vx, vy);
    if (moveEnt(p, vx * spd * dt, vy * spd * dt)) p.t -= dt * 2;
    if (p.t <= 0) p.state = 'walk';
  } else if (p.state === 'idle') {
    p.t -= dt; p.frame = 0;
    if (p.t <= 0) { p.state = 'walk'; p.t = rnd(1, 3); }
    return;
  } else {
    p.t -= dt;
    if (p.t <= 0) { p.dir = rndi(0, 3); p.t = rnd(1, 3.5); if (chance(.2)) { p.state = 'idle'; p.t = rnd(1, 3); } if (chance(.06)) p.cross = 3; }
    if (p.cross > 0) p.cross -= dt;
    const nx = p.x + DX[p.dir] * 10, ny = p.y + DY[p.dir] * 10;
    const tt = World.tileAt(nx, ny);
    const onRoad = World.isRoad(Math.floor(p.x / TS), Math.floor(p.y / TS));
    if ((World.isRoad(Math.floor(nx / TS), Math.floor(ny / TS)) && p.cross <= 0 && !onRoad) || SOLID.has(tt)) { p.dir = (p.dir + rndi(1, 3)) % 4; p.t = rnd(.5, 2); }
    else if (moveEnt(p, DX[p.dir] * spd * dt, DY[p.dir] * spd * dt)) p.dir = (p.dir + rndi(1, 3)) % 4;
  }
  p.frame = Math.floor(p.animT) % 2 + 1;
  // comentarios ambientales
  if (!p.say && !p.hostile && chance(dt * 0.12)) {
    const d = dist(p.x, p.y, PL.x, PL.y);
    if (d < 70 && !PL.car) {
      const hero = S.flags.hero;
      const pool = p.type === 'morra' ? (hero && chance(.5) ? LINES.morraHero : LINES.morra) : p.type === 'senora' ? (hero && chance(.5) ? LINES.senoraHero : LINES.senora)
        : p.type === 'vato' ? (hero && chance(.5) ? LINES.vatoHero : LINES.vato) : LINES[p.type];
      if (pool) say(p, pick(pool));
      if (p.female && chance(.5) && !PL.say) { PL.say = pick(LINES.women_thoughts); PL.sayT = 3; }
    }
  }
}
function updateHostile(p, dt) {
  const d = p.def || ENEMY.flaco;
  p.atkCd -= dt;
  const pp = playerPos();
  const dx = pp.x - p.x, dy = pp.y - (p.y - 6);
  const dd = Math.hypot(dx, dy) || 1;
  let spd = p.speed, vx = 0, vy = 0;
  if (d.flee) {
    vx = -dx / dd; vy = -dy / dd;
    if (moveEnt(p, vx * spd * dt, vy * spd * dt)) { const a = Math.atan2(vy, vx) + (p.id % 2 ? 1.4 : -1.4); vx = Math.cos(a); vy = Math.sin(a); moveEnt(p, vx * spd * dt, vy * spd * dt); }
    p.dir = dirFromVec(vx, vy); p.frame = Math.floor(p.animT) % 2 + 1;
    return;
  }
  if (d.thrower) {
    const want = dd > 110 ? 1 : dd < 60 ? -1 : 0;
    vx = dx / dd * want; vy = dy / dd * want;
    if (dd > 220) { vx = dx / dd * 1.3; vy = dy / dd * 1.3; }
    if (p.atkCd <= 0 && dd < 170) {
      p.atkCd = d.cd + rnd(0, .8);
      E.projs.push({ x: p.x, y: p.y - 8, vx: dx / dd * 170, vy: dy / dd * 170, life: 1.2, dmg: 6, owner: 'en', kind: 'chancla', rot: 0 });
      if (chance(.3)) say(p, pick(['¡VEN PA\'CÁ, CHAMACO!', '¡RESPETA A LAS MUJERES!', '¡TE VAMOS A FUNAR!', '¡LUPE, CONTROLA A TU HIJO!', '¡CHANCLAZO!']));
    }
  } else if (d.ranged && dd < 150 && dd > 50) {
    vx = -dy / dd * 0.4; vy = dx / dd * 0.4;
    if (p.atkCd <= 0) {
      p.atkCd = 1.5 + rnd(0, .8);
      E.projs.push({ x: p.x, y: p.y - 8, vx: dx / dd * 200, vy: dy / dd * 200, life: 1, dmg: 7, owner: 'en', kind: 'figura', rot: 0 });
    }
  } else if (dd > (d.range || 14) - 2) { vx = dx / dd; vy = dy / dd; }
  // carga del Brayan
  if (d.charge) {
    p.chargeCd -= dt;
    if (p.chargeT > 0) { p.chargeT -= dt; vx = p.cvx; vy = p.cvy; spd = p.speed * 3.4; if (dd < 18 && p.atkCd <= 0) { hurtPlayer(d.dmg * 1.5); knockPlayer(p.cvx * 14, p.cvy * 14); p.atkCd = 1; } }
    else if (p.chargeCd <= 0 && dd < 170 && dd > 40) { p.chargeT = .55; p.chargeCd = rnd(3, 5); p.cvx = dx / dd; p.cvy = dy / dd; say(p, pick(['¡SOY ALFA!', '¡MÍRAME LOS BRAZOS!', '¡CREATINAAAA!']), 1.2); }
  }
  if (vx || vy) {
    if (moveEnt(p, vx * spd * dt, vy * spd * dt)) {
      const a = Math.atan2(vy, vx) + (p.id % 2 ? 1.2 : -1.2);
      moveEnt(p, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt);
    }
    p.dir = dirFromVec(vx, vy); p.frame = Math.floor(p.animT) % 2 + 1;
  } else { p.frame = 0; p.dir = dirFromVec(dx, dy); }
  if (!d.thrower && dd < (d.range || 14) && p.atkCd <= 0) {
    p.atkCd = d.cd + rnd(0, .4); p.atkAnim = .2;
    if (PL.car) PL.car.hp -= d.dmg * 0.3; else { hurtPlayer(d.dmg); knockPlayer(dx / dd * 4, dy / dd * 4); }
    if (p.type === 'cop' && !PL.car) Police.arrestTick(p);
  }
  if (p.atkAnim > 0) p.atkAnim -= dt;
}

// ------------------------------------------------------------
//  PROYECTILES / PICKUPS / PARTICULAS
// ------------------------------------------------------------
function updateProjs(dt) {
  for (const b of E.projs) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.rot += dt * 15;
    if (World.solidPx(b.x, b.y, 'pw') && World.tileAt(b.x, b.y) !== TT.WATER) { b.life = 0; burst(b.x, b.y, '#c0c0c0', 3, 40); continue; }
    if (b.owner === 'pl') {
      for (const p of E.peds) {
        if (p.dead || p.state === 'down') continue;
        if (dist(b.x, b.y, p.x, p.y - 7) < 9) {
          if (p.female && (!p.hostile || p.def.invul)) { moveEnt(p, rnd(-10, 10), rnd(-10, 10)); say(p, '¡Fallaste, chud!'); b.life = 0; break; }
          b.life = 0;
          if (b.stun) { p.stunT = b.stun; burst(p.x, p.y - 8, '#80c0ff', 6, 50); if (!p.hostile) { say(p, '¡ME MOJASTE, IDIOTA!'); } }
          applyHit(p, b.dmg, b.vx / 300, b.vy / 300);
          break;
        }
      }
      if (b.life > 0) for (const o of E.objs) if (!o.dead && dist(b.x, b.y, o.x, o.y) < (o.r || 14)) { hitObj(o, b.dmg); b.life = 0; break; }
      if (b.life > 0 && Game.boss && dist(b.x, b.y, Game.boss.x, Game.boss.y - 35) < 30) { Game.hitBoss(b.dmg); b.life = 0; }
      if (b.life > 0) for (const c of E.cars) if (c !== PL.car && inCar(c, b.x, b.y, 1)) { c.hp -= b.dmg * 0.3; b.life = 0; Sound.sfx('bump'); break; }
    } else {
      const pp = playerPos();
      if (PL.car ? inCar(PL.car, b.x, b.y, 2) : dist(b.x, b.y, pp.x, pp.y) < 8) {
        b.life = 0; hurtPlayer(b.dmg);
        if (b.kind === 'chancla') { floater(PL.x, PL.y - 24, '¡CHANCLAZO!', '#ff8040'); Sound.sfx('slap'); addCope(3); }
      }
    }
  }
  E.projs = E.projs.filter(b => b.life > 0);
}
function updatePickups(dt) {
  const pp = playerPos();
  for (const k of E.pickups) {
    k.t += dt;
    const d = dist(k.x, k.y, pp.x, pp.y + (PL.car ? 0 : 6));
    if (k.kind === 'cash' && d < 50) { k.x += (pp.x - k.x) * dt * 4; k.y += (pp.y - k.y) * dt * 4; }
    if (d < (PL.car ? 18 : 12)) {
      k.got = true;
      if (k.kind === 'cash') { Game.addMoney(k.val, true); }
      else if (k.kind === 'heal') { S.hp = Math.min(maxHp(), S.hp + k.val); S.hunger = Math.min(100, S.hunger + 20); floater(k.x, k.y - 10, '+TACO', '#ff9040'); Sound.sfx('coin'); }
      else if (k.kind === 'mission') { Sound.sfx('coin'); floater(k.x, k.y - 10, k.label || '¡OK!', '#80ff80'); }
      else if (k.kind === 'fig') { Game.giveFigure(k.id, 'hidden'); S.hiddenFound[k.id] = 1; }
      else if (k.kind === 'stash') { S.stashFound[k.i] = 1; Game.addMoney(k.val, true); UI.toast('¡Encontraste un fajo de lana escondido! +' + money(k.val), '#80ff80'); }
    }
  }
  E.pickups = E.pickups.filter(k => !k.got);
}
function updateParts(dt) {
  for (const p of E.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.life -= dt; }
  E.parts = E.parts.filter(p => p.life > 0);
  if (E.parts.length > 600) E.parts.splice(0, E.parts.length - 600);
  for (const f of E.floaters) { f.y -= 18 * dt; f.life -= dt; }
  E.floaters = E.floaters.filter(f => f.life > 0);
  for (const m of E.marks) m.life -= dt;
  E.marks = E.marks.filter(m => m.life > 0);
}

// ------------------------------------------------------------
//  POBLACIÓN (spawn / despawn)
// ------------------------------------------------------------
function randomLanePos(minD, maxD) {
  const cx = Cam.x + W / 2, cy = Cam.y + H / 2;
  for (let k = 0; k < 40; k++) {
    if (chance(.5)) {
      const v = pick(World.vroads);
      const y = rndi(v.y0, v.y1) * TS + 8;
      const dir = chance(.5) ? 1 : 3;
      const x = v.x * TS + (dir === 1 ? 16 : 48);
      const d = dist(x, y, cx, cy);
      if (d > minD && d < maxD && !onScreen(x, y, 30)) return { x, y, dir };
    } else {
      const h = pick(World.hroads);
      const x = rndi(h.x0, h.x1) * TS + 8;
      const dir = chance(.5) ? 0 : 2;
      const y = h.y * TS + (dir === 0 ? 48 : 16);
      const d = dist(x, y, cx, cy);
      if (d > minD && d < maxD && !onScreen(x, y, 30)) return { x, y, dir };
    }
  }
  return null;
}
const Pop = {
  t: 0,
  init() {
    E.cars = [];
    for (const s of World.parkSpots) {
      if (chance(.6)) E.cars.push(makeCar(pick(['sedan', 'vocho', 'troca', 'sedan', 'suv']), s.x, s.y, chance(.5) ? Math.PI / 2 : -Math.PI / 2, { persistent: true }));
    }
    const hc = World.locs.homeCar;
    E.cars.push(makeCar('sedan', hc.x, hc.y, -Math.PI / 2, { color: '#e0e0d0', persistent: true, mom: true }));
    // carros parados en las orillas de colonias
  },
  update(dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.4;
    const cx = Cam.x + W / 2, cy = Cam.y + H / 2;
    // despawn
    E.peds = E.peds.filter(p => p.mission || p.keep || (dist(p.x, p.y, cx, cy) < 560 && !p.dead) || (p.dead && false));
    E.cars = E.cars.filter(c => c === PL.car || c.mission || (c.persistent && !c.dead) || (dist(c.x, c.y, cx, cy) < 650 && !(c.dead && c.deadT > 25)));
    // peatones
    const civ = E.peds.filter(p => !p.hostile && !p.mission).length;
    const want = Game.isNight() ? 14 : 26;
    for (let i = 0; i < 3 && civ + i < want; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(300, 420);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const t = World.tileAt(x, y);
      if (!(t === TT.SIDE || t === TT.PLAZA || (t === TT.GRASS && chance(.3)) || (t === TT.DIRT && chance(.2)))) continue;
      if (pedBlocked(x, y) || x < 0 || y < 0 || x > MW * TS || y > MH * TS) continue;
      const type = pick(['morra', 'morra', 'senora', 'vato', 'vato', 'vato', 'otaku', 'gymbro', 'abuelo', 'senora', 'cop']);
      E.peds.push(makePed(type, x, y));
    }
    // tráfico
    const traffic = E.cars.filter(c => c.ai === 'traffic').length;
    if (traffic < (Game.isNight() ? 9 : 15)) {
      const p = randomLanePos(280, 520);
      if (p && !E.cars.some(c => dist(c.x, c.y, p.x, p.y) < 40)) {
        const type = pick(['sedan', 'sedan', 'vocho', 'troca', 'troca', 'taxi', 'suv', 'van']);
        const c = makeCar(type, p.x, p.y, p.dir * Math.PI / 2, { ai: 'traffic', dir: p.dir });
        if (type === 'van') c.color = pick(['#e0e0e0', '#8a8a92']);
        c.lastInter = World.interMap[Math.floor(p.y / TS) * MW + Math.floor(p.x / TS)] || 0;
        c.v = c.cruise;
        E.cars.push(c);
      }
    }
  }
};

// ------------------------------------------------------------
//  POLICÍA (Nivel de Funa)
// ------------------------------------------------------------
const Police = {
  spawnT: 0, unseen: 0, arrest: 0,
  raise(n, cap) {
    if (!n) return;
    if (Missions.noPolice()) return;
    const before = S.wanted;
    S.wanted = Math.min(cap || 5, Math.max(S.wanted, S.wanted + n));
    if (S.wanted > before) { UI.toast('NIVEL DE FUNA: ' + '*'.repeat(S.wanted), '#ffd040'); this.unseen = 0; }
  },
  copNear(r) {
    const pp = playerPos();
    return E.peds.some(p => p.type === 'cop' && p.state !== 'down' && dist(p.x, p.y, pp.x, pp.y) < r) || E.cars.some(c => c.type === 'police' && !c.dead && c !== PL.car && dist(c.x, c.y, pp.x, pp.y) < r);
  },
  copPeds() { return E.peds.filter(p => p.type === 'cop' && p.fromCar).length; },
  arrestTick(p) {
    if (S.wanted <= 0) return;
    this.arrest += 1;
    if (this.arrest >= 4 || S.hp < maxHp() * 0.25) { this.arrest = 0; Game.playerDown('busted'); }
  },
  update(dt) {
    if (S.wanted <= 0) {
      Sound.setSiren(false);
      for (const c of E.cars) if (c.ai === 'cop') { c.ai = null; c.siren = false; }
      for (const p of E.peds) if (p.type === 'cop') p.copAngry = false;
      this.arrest = 0;
      return;
    }
    const cops = E.cars.filter(c => c.ai === 'cop' && !c.dead);
    const want = Math.min(4, Math.ceil(S.wanted * 0.8));
    this.spawnT -= dt;
    if (cops.length < want && this.spawnT <= 0) {
      const p = randomLanePos(300, 520);
      if (p) {
        const pp = playerPos();
        const c = makeCar('police', p.x, p.y, Math.atan2(pp.y - p.y, pp.x - p.x), { ai: 'cop', siren: true, mission: false, color: '#f0f0f0' });
        c.max *= 0.85 + S.wanted * 0.05;
        E.cars.push(c);
      }
      this.spawnT = 12 / S.wanted;
    }
    const seen = this.copNear(230);
    if (seen) this.unseen = 0; else this.unseen += dt;
    const need = 6 + S.wanted * 2.5;
    if (this.unseen > need) {
      S.wanted--; this.unseen = 0;
      UI.toast(S.wanted ? 'Funa bajó: ' + '*'.repeat(S.wanted) : 'Ya nadie te busca. Por ahora.', '#a0ffa0');
    }
    this.arrest = Math.max(0, this.arrest - dt * 0.5);
    const pp = playerPos();
    Sound.setSiren(E.cars.some(c => c.ai === 'cop' && !c.dead && dist(c.x, c.y, pp.x, pp.y) < 380));
  }
};

// ------------------------------------------------------------
//  TREN (Calle Ferrocarril)
// ------------------------------------------------------------
const Train = {
  active: false, x: 0, y: 56 * TS, dirx: 1, t: 50, len: 6 * 46, speed: 230,
  update(dt) {
    if (!this.active) {
      this.t -= dt;
      if (this.t <= 0) {
        this.active = true; this.dirx = chance(.5) ? 1 : -1;
        this.x = this.dirx > 0 ? -this.len - 50 : MW * TS + 50;
        this.hornT = 0;
      }
      return;
    }
    this.x += this.dirx * this.speed * dt;
    const pp = playerPos();
    this.hornT -= dt;
    if (this.hornT <= 0 && Math.abs(this.x - pp.x) < 500 && Math.abs(this.y - pp.y) < 300) { Sound.sfx('train'); this.hornT = 4; }
    // colisión
    const x0 = this.dirx > 0 ? this.x - this.len : this.x, x1 = this.dirx > 0 ? this.x : this.x + this.len;
    const inT = (x, y) => x > x0 && x < x1 && Math.abs(y - this.y) < 15;
    if (PL.car ? inT(PL.car.x, PL.car.y) : inT(PL.x, PL.y - 4)) {
      if (PL.car) { PL.car.hp -= 200; PL.car.x -= 0; Sound.sfx('crash'); }
      else { hurtPlayer(45, 'train', true); knockPlayer(0, PL.y - 4 < this.y ? -30 : 30); floater(PL.x, PL.y - 30, '¡EL TREN, PENDEJO!', '#ff4040'); }
    }
    for (const c of E.cars) if (c !== PL.car && !c.dead && inT(c.x, c.y)) { c.hp = 0; c.burnT = 2.5; }
    for (const p of E.peds) if (inT(p.x, p.y - 4)) { moveEnt(p, 0, p.y < this.y + 4 ? -26 : 26); if (!p.female) { p.state = 'down'; p.downT = 3; } }
    if ((this.dirx > 0 && this.x - this.len > MW * TS + 60) || (this.dirx < 0 && this.x > MW * TS + 60 + 9999) || (this.dirx < 0 && this.x + this.len < -60)) {
      this.active = false; this.t = rnd(70, 140);
    }
  },
  draw(ctx) {
    if (!this.active) return;
    const cars = 6;
    for (let i = 0; i < cars; i++) {
      const cx = this.dirx > 0 ? this.x - i * 46 - 44 : this.x + i * 46;
      const sx = Math.round(cx - Cam.x), sy = Math.round(this.y - Cam.y);
      if (sx < -60 || sx > W + 60) continue;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(sx + 3, sy - 8, 44, 20);
      if (i === 0) {
        ctx.fillStyle = '#d0a020'; ctx.fillRect(sx, sy - 11, 44, 20);
        ctx.fillStyle = '#202020'; ctx.fillRect(sx + (this.dirx > 0 ? 30 : 4), sy - 9, 10, 16);
        ctx.fillStyle = '#c02020'; ctx.fillRect(sx, sy - 2, 44, 3);
        ctx.fillStyle = '#fff2a0'; ctx.fillRect(this.dirx > 0 ? sx + 43 : sx, sy - 8, 1, 3); ctx.fillRect(this.dirx > 0 ? sx + 43 : sx, sy + 3, 1, 3);
      } else {
        ctx.fillStyle = ['#6a3a2a', '#3a5a7a', '#7a7a7a'][i % 3]; ctx.fillRect(sx, sy - 11, 42, 20);
        ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(sx, sy - 11, 42, 2);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 4; k < 42; k += 6) ctx.fillRect(sx + k, sy - 9, 1, 16);
      }
      ctx.fillStyle = '#101010'; ctx.fillRect(sx, sy - 12, i === 0 ? 44 : 42, 1); ctx.fillRect(sx, sy + 9, i === 0 ? 44 : 42, 1);
    }
  }
};
