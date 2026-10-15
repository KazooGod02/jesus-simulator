'use strict';
// ============================================================
//  world.js : mapa de Guamúchil
// ============================================================
const MW = 160, MH = 130;
const TT = { GRASS: 0, ROAD: 1, SIDE: 2, BLD: 3, WATER: 4, TREE: 5, DIRT: 6, PLAZA: 7, FIELD: 8, BRIDGE: 9, RAIL: 10, ROCK: 11, SAND: 12, FENCE: 13, LOT: 14 };
const SOLID = new Set([TT.BLD, TT.WATER, TT.TREE, TT.ROCK, TT.FENCE]);
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];

const World = {
  tiles: new Uint8Array(MW * MH),
  roadMask: new Uint8Array(MW * MH),
  interMap: new Uint16Array(MW * MH),
  inters: [],
  buildings: [], props: [], lights: [], locs: {}, hidden: [], stashes: [], parkSpots: [], doors: [],
  vroads: [
    { x: 8, y0: 0, y1: 129, name: 'Carretera México 15' },
    { x: 30, y0: 30, y1: 111 },
    { x: 52, y0: 0, y1: 111 },
    { x: 74, y0: 0, y1: 111, name: 'Av. Turística' },
    { x: 96, y0: 0, y1: 111 },
    { x: 118, y0: 30, y1: 111 },
    { x: 140, y0: 30, y1: 91 }
  ],
  hroads: [
    { y: 10, x0: 52, x1: 99 },
    { y: 30, x0: 8, x1: 159 },
    { y: 50, x0: 8, x1: 159, name: 'Calle Ferrocarril' },
    { y: 88, x0: 8, x1: 159 },
    { y: 108, x0: 8, x1: 159 }
  ],
  riverC: [],
  get(x, y) { if (x < 0 || y < 0 || x >= MW || y >= MH) return TT.ROCK; return this.tiles[y * MW + x]; },
  set(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) this.tiles[y * MW + x] = t; },
  fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); },
  isRoad(x, y) { if (x < 0 || y < 0 || x >= MW || y >= MH) return false; return this.roadMask[y * MW + x] === 1; },
  tileAt(px, py) { return this.get(Math.floor(px / TS), Math.floor(py / TS)); },
  solidPx(px, py, mode) {
    const t = this.tileAt(px, py);
    if (t === TT.WATER) return !(mode === 'pw');
    return SOLID.has(t);
  },

  build() {
    const R = mulberry32(19082);
    this.rand = R;
    const ri = (a, b) => Math.floor(a + R() * (b - a + 1));
    this.fill(0, 0, MW - 1, MH - 1, TT.GRASS);
    // franja rural oeste
    for (let y = 0; y < MH; y++) for (let x = 0; x < 8; x++) if (hsh(x, y, 1) < 0.16) this.set(x, y, TT.TREE); else if (hsh(x, y, 2) < 0.3) this.set(x, y, TT.DIRT);

    const block = (x0, y0, x1, y1) => {
      this.fill(x0, y0, x1, y1, TT.SIDE);
      this.fill(x0 + 1, y0 + 1, x1 - 1, y1 - 1, TT.GRASS);
    };
    const BX = [[12, 29], [34, 51], [56, 73], [78, 95], [100, 117], [122, 139], [144, 159]];
    this.blocks = [];
    const addBlock = (x0, y0, x1, y1, kind) => { block(x0, y0, x1, y1); this.blocks.push({ x0, y0, x1, y1, kind }); };
    addBlock(56, 0, 73, 9, 'gen'); addBlock(78, 0, 95, 9, 'gen');
    addBlock(56, 14, 73, 29, 'gym'); addBlock(78, 14, 95, 29, 'iglesia');
    BX.forEach((b, i) => addBlock(b[0], 34, b[1], 49, ['comisaria', 'barberia', 'museo', 'plaza', 'mercado', 'otaku', 'hospital'][i]));
    addBlock(12, 92, 29, 107, 'colonia'); addBlock(34, 92, 51, 107, 'home'); addBlock(56, 92, 73, 107, 'colonia');
    addBlock(78, 92, 95, 107, 'colonia'); addBlock(100, 92, 117, 107, 'deportiva'); addBlock(122, 92, 159, 107, 'corpo');

    // --- Cerro de la Cruz
    this.fill(12, 0, 51, 29, TT.DIRT);
    const pathX = y => 32 + Math.round(3 * Math.sin(y / 4));
    for (let y = 0; y <= 29; y++) for (let x = 12; x <= 51; x++) {
      const px = pathX(y);
      if (Math.abs(x - px) <= 1) continue;
      const dc = Math.hypot((x - 32) / 20, (y - 8) / 22);
      if (hsh(x, y, 3) < 0.09 + dc * 0.05) this.set(x, y, TT.ROCK);
      else if (hsh(x, y, 4) < 0.07) this.set(x, y, TT.TREE);
    }
    this.fill(27, 2, 37, 8, TT.PLAZA);
    this.set(32, 3, TT.BLD);
    this.props.push({ type: 'cross', x: 32, y: 3 });
    this.locs.cross = { x: 32 * TS + 8, y: 6 * TS + 8 };
    this.locs.cerro = { x: 32 * TS + 8, y: 28 * TS + 8 };

    // --- Presa Eustaquio Buelna
    this.fill(100, 0, 159, 29, TT.GRASS);
    for (let y = 0; y <= 29; y++) for (let x = 100; x <= 159; x++) {
      const d = Math.hypot((x - 130) / 27, (y - 10) / 9.5);
      if (d < 1) this.set(x, y, TT.WATER);
      else if (d < 1.12) this.set(x, y, TT.SAND);
      else if (y < 22 && hsh(x, y, 5) < 0.18) this.set(x, y, TT.TREE);
    }
    this.fill(106, 23, 154, 28, TT.PLAZA);
    this.fill(100, 29, 159, 29, TT.SIDE);
    this.fill(100, 0, 100, 29, TT.SIDE);
    this.locs.presa = { x: 130 * TS + 8, y: 25 * TS + 8 };
    this.props.push({ type: 'stall', x: 129, y: 23, col: '#e0a020', label: 'TATEMA' });
    this.props.push({ type: 'sign', x: 112, y: 23, label: 'PRESA E. BUELNA' });

    // --- banda del río
    for (let x = 0; x < MW; x++) {
      this.fill(x, 54, x, 54, TT.SIDE);
      this.set(x, 55, TT.RAIL); this.set(x, 56, TT.RAIL);
      this.set(x, 57, TT.GRASS); this.set(x, 58, TT.SIDE);
      for (let y = 59; y <= 85; y++) this.set(x, y, hsh(x, y, 6) < 0.07 ? TT.TREE : TT.GRASS);
      this.set(x, 86, TT.SIDE); this.set(x, 87, TT.SIDE);
      const cy = 72 + Math.round(3 * Math.sin(x / 13) + 1.5 * Math.sin(x / 5.3));
      this.riverC[x] = cy;
      for (let y = cy - 4; y <= cy + 3; y++) this.set(x, y, TT.WATER);
      this.set(x, cy - 5, TT.SAND); this.set(x, cy + 4, TT.SAND);
    }
    this.locs.malecon = { x: 64 * TS + 8, y: 58 * TS + 8 };

    // --- campos de garbanzo
    for (let y = 112; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (x >= 8 && x <= 11) continue;
      this.set(x, y, (x % 12 === 0 || y % 9 === 0) ? TT.DIRT : TT.FIELD);
    }
    this.fill(12, 112, 29, 129, TT.DIRT);
    for (let y = 112; y < MH; y++) for (let x = 0; x < MW; x++) if (this.get(x, y) === TT.DIRT && hsh(x, y, 7) < 0.04 && !(x >= 12 && x <= 29)) this.set(x, y, TT.TREE);
    this.locs.fields = { x: 70 * TS, y: 120 * TS };

    // --- calles
    const road = (x, y) => {
      const t = this.get(x, y);
      if (t === TT.RAIL) { /* cruce de tren */ }
      else if (t === TT.WATER || t === TT.SAND) this.set(x, y, TT.BRIDGE);
      else this.set(x, y, TT.ROAD);
      this.roadMask[y * MW + x] = 1;
    };
    for (const v of this.vroads) for (let y = v.y0; y <= v.y1; y++) for (let x = v.x; x < v.x + 4; x++) road(x, y);
    for (const h of this.hroads) for (let x = h.x0; x <= h.x1; x++) for (let y = h.y; y < h.y + 4; y++) road(x, y);
    // intersecciones
    for (const v of this.vroads) for (const h of this.hroads) {
      if (v.x + 3 < h.x0 || v.x > h.x1 || h.y < v.y0 || h.y + 3 > v.y1) continue;
      const id = this.inters.length + 1;
      this.inters.push({ vx: v.x, hy: h.y, id });
      for (let y = h.y; y < h.y + 4; y++) for (let x = v.x; x < v.x + 4; x++) this.interMap[y * MW + x] = id;
      [[v.x - 1, h.y - 1], [v.x + 4, h.y - 1], [v.x - 1, h.y + 4], [v.x + 4, h.y + 4]].forEach(([lx, ly]) => {
        const t = this.get(lx, ly);
        if (t === TT.SIDE || t === TT.GRASS || t === TT.PLAZA) this.lights.push({ x: lx * TS + 8, y: ly * TS + 8 });
      });
    }

    // --- edificios importantes
    const B = (x, y, w, h, o) => this.addBuilding(x, y, w, h, o);
    B(14, 38, 12, 11, { id: 'comisaria', label: 'POLICÍA', roof: '#3a4a7a', wall: '#c8c8d8', rt: 'flat', door: 20 });
    B(36, 42, 8, 7, { id: 'barberia', label: 'BARBERÍA\nEL LIBRITO', roof: '#c03050', wall: '#f0e0e0', rt: 'flat', door: 40 });
    B(57, 38, 10, 11, { id: 'museo', label: 'MUSEO DEL\nÉVORA', roof: '#a06040', wall: '#e8d8b0', rt: 'tile', door: 62 });
    B(68, 41, 5, 8, { id: 'estacion', label: 'TREN', roof: '#7a3a2a', wall: '#e0c090', rt: 'tile', door: 70 });
    B(101, 36, 9, 13, { id: 'mercado', label: 'MERCADO\nMUNICIPAL', roof: '#5a8a5a', wall: '#e8e0c8', rt: 'metal', door: 105 });
    B(111, 41, 6, 8, { id: 'taqueria', label: 'TACOS\nGÜERO', roof: '#d04020', wall: '#f0d080', rt: 'flat', door: 113 });
    B(123, 40, 8, 9, { id: 'otaku', label: 'OTAKU\nÉVORA', roof: '#e060b0', wall: '#ffe0f0', rt: 'flat', door: 126 });
    B(133, 42, 6, 7, { id: 'ciber', label: 'CIBER\nPIXEL', roof: '#3080c0', wall: '#d0e0f0', rt: 'flat', door: 135 });
    B(145, 37, 13, 12, { id: 'hospital', label: 'HOSPITAL', roof: '#e0e0e0', wall: '#f0f0f0', rt: 'flat', door: 151, cross: 1 });
    B(57, 18, 12, 11, { id: 'gym', label: 'TITANES\nGYM', roof: '#303038', wall: '#a0a0a8', rt: 'metal', door: 62 });
    this.fill(69, 18, 72, 28, TT.LOT);
    B(81, 16, 11, 13, { id: 'iglesia', label: 'PARROQUIA', roof: '#c8a070', wall: '#f0e8d0', rt: 'tile', door: 86, church: 1 });
    B(36, 99, 7, 8, { id: 'home', label: 'CASA', roof: '#c06040', wall: '#f0c0a0', rt: 'tile', door: 39 });
    this.fill(43, 101, 46, 106, TT.LOT);
    B(112, 101, 5, 6, { id: 'deportiva', label: 'PELEAS', roof: '#806040', wall: '#c0a080', rt: 'metal', door: 114 });
    B(127, 94, 20, 13, { id: 'corporativo', label: 'CORPORATIVO WAIFU\nS.A. DE C.V.', roof: '#ff70c0', wall: '#ffd0f0', rt: 'flat', door: 136 });
    B(16, 116, 8, 6, { id: 'rancho', label: 'RANCHO', roof: '#6a5a3a', wall: '#a08860', rt: 'metal', door: 20 });

    // plaza Pedro Infante
    this.fill(79, 35, 94, 48, TT.PLAZA);
    this.set(86, 41, TT.BLD); this.set(87, 41, TT.BLD); this.set(86, 42, TT.BLD); this.set(87, 42, TT.BLD);
    this.props.push({ type: 'statue', x: 86, y: 41 });
    [[80, 36], [93, 36], [80, 47], [93, 47], [83, 38], [90, 38]].forEach(([x, y]) => this.set(x, y, TT.TREE));
    this.props.push({ type: 'bench', x: 84, y: 44 }, { type: 'bench', x: 89, y: 44 }, { type: 'stall', x: 80, y: 44, col: '#40a040', label: 'GARBANZO' });
    this.locs.plaza = { x: 86 * TS + 16, y: 46 * TS + 8 };
    this.locs.statue = { x: 86 * TS + 16, y: 44 * TS };
    this.locs.bench = { x: 84 * TS + 8, y: 45 * TS + 8 };
    [[81, 40], [92, 40], [81, 45], [92, 45]].forEach(([x, y]) => this.lights.push({ x: x * TS + 8, y: y * TS + 8 }));

    // unidad deportiva (cancha)
    this.fill(101, 93, 110, 106, TT.GRASS);
    this.props.push({ type: 'field', x: 101, y: 93, w: 10, h: 14 });
    this.locs.arena = { x: 106 * TS, y: 100 * TS };

    // corporativo: cerca + estacionamiento
    for (let x = 123; x <= 158; x++) { if (x < 133 || x > 139) this.set(x, 93, TT.FENCE); }
    this.fill(148, 94, 158, 106, TT.LOT);
    this.fill(123, 94, 126, 106, TT.LOT);

    // feria del taco sobre la Av. Turística (puestos)
    for (let y = 60; y <= 84; y += 6) { this.props.push({ type: 'stall', x: 72, y: y, col: pick(['#d04020', '#e0a020', '#3080c0', '#c03080']), label: 'TACOS' }); }

    // letrero de bienvenida
    this.props.push({ type: 'billboard', x: 3, y: 60, label: 'GUAMÚCHIL' });
    this.locs.rancho = this.locs.rancho;

    // --- rellenar bloques genéricos y colonias
    for (const b of this.blocks) {
      if (b.kind === 'plaza' || b.kind === 'deportiva') continue;
      const small = b.kind === 'colonia' || b.kind === 'home';
      this.fillGeneric(b.x0 + 1, b.y0 + 1, b.x1 - 1, b.y1 - 1, small, R);
    }

    // escondites de figuras perdidas
    const hid = [
      [32, 2, 'dios_fig'], [150, 26, 'garbanzo_oro'], [20, 125, 'brayan_fig'], [85, 66, 'yesenia_fig'],
      [2, 100, 'kenji_fig'], [158, 120, 'karla_fig'], [87, 47, 'idolo_fig'], [44, 106, 'lupe_fig']
    ];
    hid.forEach(([x, y, id]) => {
      let tx = x, ty = y;
      if (SOLID.has(this.get(tx, ty))) { const f = this.findFree(tx, ty); tx = f[0]; ty = f[1]; }
      this.hidden.push({ x: tx * TS + 8, y: ty * TS + 8, id });
    });
    // fajos de lana escondidos
    [[14, 2], [50, 27], [157, 2], [6, 30], [120, 85], [70, 128], [100, 60], [3, 128], [140, 60], [26, 70]].forEach(([x, y], i) => {
      const f = this.findFree(x, y);
      this.stashes.push({ x: f[0] * TS + 8, y: f[1] * TS + 8, i, val: 150 + i * 30 });
    });

    // spots para carros estacionados (LOT)
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (this.get(x, y) === TT.LOT && x % 2 === 0 && y % 3 === 0 && hsh(x, y, 9) < 0.55) this.parkSpots.push({ x: x * TS + 8, y: y * TS + 8 });
    }
    this.locs.homeCar = { x: 44 * TS + 8, y: 104 * TS };
    // luces de edificios
    for (const b of this.buildings) if (b.id) this.lights.push({ x: b.spot.x, y: b.spot.y - 6 });
    this.locs.mocorito = { x: 158 * TS, y: 31 * TS + 8 };
  },

  findFree(x, y) {
    for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const t = this.get(x + dx, y + dy);
      if (!SOLID.has(t) && !this.isRoad(x + dx, y + dy) && x + dx >= 0 && y + dy >= 0 && x + dx < MW && y + dy < MH) return [x + dx, y + dy];
    }
    return [x, y];
  },

  addBuilding(x, y, w, h, o) {
    const b = Object.assign({ x, y, w, h }, o);
    this.fill(x, y, x + w - 1, y + h - 1, TT.BLD);
    if (o.door !== undefined) {
      b.spot = { x: o.door * TS + 8, y: (y + h) * TS + 8 };
      if (o.id) { this.locs[o.id] = b.spot; this.doors.push(b); }
    }
    this.buildings.push(b);
    return b;
  },

  fillGeneric(x0, y0, x1, y1, small, R) {
    const ri = (a, b) => Math.floor(a + R() * (b - a + 1));
    const free = (x, y, w, h) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (xx > x1 || yy > y1 || this.get(xx, yy) !== TT.GRASS) return false;
      return true;
    };
    const walls = small ? ['#f0c0a0', '#a0d0f0', '#f0e080', '#c0f0b0', '#f0a0c0', '#e0e0e0', '#ffd0a0'] : ['#e8d8c0', '#c8c8d0', '#f0e0a0', '#d0b0a0', '#b0c8d8'];
    const roofs = small ? ['#c06040', '#a04838', '#d0d0d0', '#8a7a6a'] : ['#8a8a92', '#a06040', '#6a7a8a', '#9a8a7a', '#c0b0a0'];
    const half = Math.floor((y1 - y0 + 1) / 2);
    for (const side of ['bottom', 'top']) {
      let x = x0;
      while (x <= x1 - 2) {
        const w = Math.min(small ? ri(4, 5) : ri(4, 7), x1 - x + 1);
        const h = Math.min(small ? ri(4, 5) : ri(4, 7), half);
        if (w < 3 || h < 3) break;
        const y = side === 'bottom' ? y1 - h + 1 : y0;
        if (free(x, y, w, h)) {
          this.addBuilding(x, y, w, h, { roof: roofs[ri(0, roofs.length - 1)], wall: walls[ri(0, walls.length - 1)], rt: R() < 0.55 ? 'flat' : 'tile', door: x + ri(1, w - 2), tinaco: R() < 0.6 });
          x += w + (R() < 0.4 ? 1 : 0);
        } else x++;
      }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.get(x, y) === TT.GRASS && hsh(x, y, 11) < (small ? 0.12 : 0.18)) this.set(x, y, TT.TREE);
  },

  // ------------------------------------------------------------
  //  PRE-RENDER
  // ------------------------------------------------------------
  render() {
    this.canvas = mkCanvas(MW * TS, MH * TS);
    const c = this.canvas.getContext('2d');
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) this.drawTile(c, x, y);
    // marcas de carril
    c.fillStyle = '#d8c040';
    for (const v of this.vroads) for (let y = v.y0; y <= v.y1; y++) {
      if (this.interMap[y * MW + v.x] || this.get(v.x + 1, y) === TT.RAIL) continue;
      if (y % 2 === 0) c.fillRect((v.x + 2) * TS - 1, y * TS + 2, 2, 10);
    }
    for (const h of this.hroads) for (let x = h.x0; x <= h.x1; x++) {
      if (this.interMap[h.y * MW + x]) continue;
      if (x % 2 === 0) c.fillRect(x * TS + 2, (h.y + 2) * TS - 1, 10, 2);
    }
    // pasos peatonales
    c.fillStyle = '#e8e8e8';
    for (const I of this.inters) {
      const sx = I.vx * TS, sy = I.hy * TS;
      for (let i = 0; i < 64; i += 6) {
        if (this.isRoad(I.vx, I.hy - 1)) c.fillRect(sx + i + 1, sy - 6, 3, 5);
        if (this.isRoad(I.vx, I.hy + 4)) c.fillRect(sx + i + 1, sy + 65, 3, 5);
        if (this.isRoad(I.vx - 1, I.hy)) c.fillRect(sx - 6, sy + i + 1, 5, 3);
        if (this.isRoad(I.vx + 4, I.hy)) c.fillRect(sx + 65, sy + i + 1, 5, 3);
      }
    }
    // árboles (segunda pasada para que sobresalgan)
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (this.get(x, y) === TT.TREE) this.drawTree(c, x, y);
    for (const b of this.buildings) this.drawBuilding(c, b);
    for (const p of this.props) this.drawProp(c, p);
    // nombres de calles
    c.font = FONT; c.textBaseline = 'top';
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.save(); c.translate(9 * TS + 10, 70 * TS); c.rotate(-Math.PI / 2); c.fillText('CARRETERA MEXICO 15', 0, 0); c.restore();
    c.save(); c.translate(75 * TS + 10, 106 * TS); c.rotate(-Math.PI / 2); c.fillText('AV. TURISTICA', 0, 0); c.restore();
    c.fillText('CALLE FERROCARRIL', 20 * TS, 51 * TS + 4);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillText('RIO EVORA', 40 * TS, (this.riverC[40]) * TS - 4);
    c.fillText('RIO EVORA', 120 * TS, (this.riverC[120]) * TS - 4);
    c.fillText('CERRO DE LA CRUZ', 24 * TS, 12 * TS);
    c.fillText('MALECON', 60 * TS, 58 * TS + 4);
    c.fillText('CAMPOS DE GARBANZO', 60 * TS, 115 * TS);
    this.buildMinimap();
  },

  drawTile(c, x, y) {
    const t = this.get(x, y), px = x * TS, py = y * TS;
    const dots = (col, n, k) => { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(px + Math.floor(hsh(x, y, k + i) * 16), py + Math.floor(hsh(y, x, k + i * 3) * 16), 1, 1); };
    const grass = () => {
      c.fillStyle = '#4a9a3a'; c.fillRect(px, py, 16, 16);
      dots('#3e8a30', 8, 1); dots('#5cb048', 6, 20);
      if (hsh(x, y, 99) < 0.06) dots(pick(['#f0e060', '#f080a0', '#ffffff']), 2, 40);
    };
    switch (t) {
      case TT.GRASS: case TT.TREE: grass(); break;
      case TT.ROAD:
        c.fillStyle = '#3d3d46'; c.fillRect(px, py, 16, 16); dots('#4a4a54', 5, 2); dots('#34343c', 5, 30);
        break;
      case TT.SIDE: {
        c.fillStyle = '#b5ab9c'; c.fillRect(px, py, 16, 16);
        c.fillStyle = '#9d9385'; c.fillRect(px, py, 16, 1); c.fillRect(px, py + 8, 16, 1); c.fillRect(px, py, 1, 16); c.fillRect(px + 8, py, 1, 16);
        c.fillStyle = '#7d766c';
        if (this.isRoad(x, y + 1)) c.fillRect(px, py + 14, 16, 2);
        if (this.isRoad(x, y - 1)) c.fillRect(px, py, 16, 2);
        if (this.isRoad(x + 1, y)) c.fillRect(px + 14, py, 2, 16);
        if (this.isRoad(x - 1, y)) c.fillRect(px, py, 2, 16);
        break;
      }
      case TT.WATER: {
        c.fillStyle = '#2a64b0'; c.fillRect(px, py, 16, 16);
        c.fillStyle = '#3a7ac8';
        for (let i = 0; i < 3; i++) { const wx = Math.floor(hsh(x, y, 50 + i) * 12), wy = Math.floor(hsh(x, y, 60 + i) * 14); c.fillRect(px + wx, py + wy, 4, 1); }
        c.fillStyle = '#8fc1ee';
        if (this.get(x, y - 1) !== TT.WATER) c.fillRect(px, py, 16, 2);
        if (this.get(x, y + 1) !== TT.WATER) c.fillRect(px, py + 14, 16, 2);
        if (this.get(x - 1, y) !== TT.WATER) c.fillRect(px, py, 2, 16);
        if (this.get(x + 1, y) !== TT.WATER) c.fillRect(px + 14, py, 2, 16);
        break;
      }
      case TT.DIRT: c.fillStyle = '#a07a4c'; c.fillRect(px, py, 16, 16); dots('#8c6a40', 7, 3); dots('#b48a5a', 6, 33); break;
      case TT.PLAZA:
        c.fillStyle = '#d2bc96'; c.fillRect(px, py, 16, 16);
        c.fillStyle = '#c0a880'; c.fillRect(px, py, 8, 8); c.fillRect(px + 8, py + 8, 8, 8);
        c.fillStyle = '#e0cca8'; c.fillRect(px + 1, py + 1, 2, 1); c.fillRect(px + 9, py + 9, 2, 1);
        break;
      case TT.FIELD:
        c.fillStyle = '#8a6438'; c.fillRect(px, py, 16, 16);
        for (let r = 1; r < 16; r += 4) { c.fillStyle = '#5aa040'; for (let i = 0; i < 16; i += 3) c.fillRect(px + i + (r % 8 === 1 ? 0 : 1), py + r, 2, 2); c.fillStyle = '#78c050'; c.fillRect(px + (r * 3) % 14, py + r, 1, 1); }
        break;
      case TT.BRIDGE: {
        c.fillStyle = '#5a5a62'; c.fillRect(px, py, 16, 16); dots('#66666e', 5, 4);
        c.fillStyle = '#d0d0d0';
        if (!this.isRoad(x - 1, y)) { c.fillRect(px, py, 3, 16); c.fillStyle = '#909090'; c.fillRect(px + 2, py, 1, 16); c.fillStyle = '#d0d0d0'; }
        if (!this.isRoad(x + 1, y)) { c.fillRect(px + 13, py, 3, 16); }
        if (!this.isRoad(x, y - 1)) c.fillRect(px, py, 16, 3);
        if (!this.isRoad(x, y + 1)) c.fillRect(px, py + 13, 16, 3);
        break;
      }
      case TT.RAIL: {
        if (this.isRoad(x, y)) { c.fillStyle = '#3d3d46'; c.fillRect(px, py, 16, 16); }
        else { c.fillStyle = '#7a6e62'; c.fillRect(px, py, 16, 16); dots('#6a5e52', 8, 5); dots('#8a7e72', 8, 15); }
        c.fillStyle = '#5a3a22';
        const top = y === 55;
        for (let i = 1; i < 16; i += 4) c.fillRect(px + i, top ? py + 6 : py, 2, top ? 10 : 10);
        c.fillStyle = '#c0c0c8';
        c.fillRect(px, top ? py + 9 : py + 6, 16, 2);
        c.fillStyle = '#808088'; c.fillRect(px, top ? py + 11 : py + 8, 16, 1);
        break;
      }
      case TT.ROCK:
        c.fillStyle = '#a07a4c'; c.fillRect(px, py, 16, 16); dots('#8c6a40', 5, 3);
        c.fillStyle = '#5a5a62'; c.fillRect(px + 2, py + 4, 12, 10);
        c.fillStyle = '#8a8a92'; c.fillRect(px + 3, py + 3, 10, 9);
        c.fillStyle = '#a8a8b0'; c.fillRect(px + 4, py + 4, 4, 2);
        break;
      case TT.SAND: c.fillStyle = '#dcc88c'; c.fillRect(px, py, 16, 16); dots('#c8b478', 7, 6); dots('#ecd8a0', 5, 26); break;
      case TT.FENCE:
        grass();
        c.fillStyle = '#9aa0a8'; c.fillRect(px, py + 6, 16, 2); c.fillRect(px, py + 12, 16, 1);
        for (let i = 0; i < 16; i += 4) c.fillRect(px + i, py + 3, 1, 11);
        break;
      case TT.LOT:
        c.fillStyle = '#55555e'; c.fillRect(px, py, 16, 16); dots('#606068', 4, 7);
        if (x % 2 === 0) { c.fillStyle = '#d8d8d8'; c.fillRect(px, py + 2, 1, 12); }
        break;
      case TT.BLD: c.fillStyle = '#555'; c.fillRect(px, py, 16, 16); break;
    }
  },

  drawTree(c, x, y) {
    const cx = x * TS + 8, cy = y * TS + 7;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(cx + 2, cy + 6, 9, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#5a3a20'; c.fillRect(cx - 1, cy + 3, 3, 6);
    const v = hsh(x, y, 77);
    const dark = v < 0.5 ? '#1e4a1c' : '#2a4a14';
    const mid = v < 0.5 ? '#2d6a2a' : '#4a7a20';
    const lite = v < 0.5 ? '#3f8a3a' : '#6a9a30';
    c.fillStyle = dark; c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill();
    c.fillStyle = mid; c.beginPath(); c.arc(cx - 1, cy - 1, 7.5, 0, 7); c.fill();
    c.fillStyle = lite; c.beginPath(); c.arc(cx - 3, cy - 3, 3.5, 0, 7); c.fill();
    if (v > 0.8) { c.fillStyle = '#f0a020'; c.fillRect(cx + 2, cy - 2, 2, 2); c.fillRect(cx - 4, cy + 2, 2, 2); }
  },

  drawBuilding(c, b) {
    const px = b.x * TS, py = b.y * TS, w = b.w * TS, h = b.h * TS;
    const roofH = h - 14;
    // sombra
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px + 4, py + 4, w, h);
    // techo
    c.fillStyle = b.roof; c.fillRect(px, py, w, roofH);
    if (b.rt === 'tile') {
      c.fillStyle = shade(b.roof, -25);
      for (let yy = 3; yy < roofH; yy += 4) c.fillRect(px, py + yy, w, 1);
      for (let yy = 0; yy < roofH; yy += 4) for (let xx = (yy / 4) % 2 ? 0 : 3; xx < w; xx += 6) c.fillRect(px + xx, py + yy, 1, 3);
    } else if (b.rt === 'metal') {
      c.fillStyle = shade(b.roof, 18);
      for (let xx = 2; xx < w; xx += 4) c.fillRect(px + xx, py, 1, roofH);
    } else {
      c.fillStyle = shade(b.roof, -12);
      for (let i = 0; i < 10; i++) c.fillRect(px + Math.floor(hsh(b.x, b.y, i) * (w - 2)), py + Math.floor(hsh(b.y, b.x, i) * (roofH - 2)), 2, 1);
    }
    c.fillStyle = shade(b.roof, 30); c.fillRect(px, py, w, 2);
    c.fillStyle = shade(b.roof, -40); c.fillRect(px, py, 2, roofH); c.fillRect(px + w - 2, py, 2, roofH); c.fillRect(px, py + roofH - 2, w, 2);
    if (b.tinaco) {
      const tx = px + 4 + Math.floor(hsh(b.x, b.y, 3) * (w - 14)), ty = py + 4;
      c.fillStyle = '#202024'; c.beginPath(); c.arc(tx + 4, ty + 4, 4, 0, 7); c.fill();
      c.fillStyle = '#3a3a40'; c.fillRect(tx + 2, ty + 2, 3, 2);
      if (w > 64) { c.fillStyle = '#b0b0b8'; c.fillRect(px + w - 14, py + roofH - 12, 8, 6); c.fillStyle = '#707078'; c.fillRect(px + w - 13, py + roofH - 11, 6, 1); }
    }
    if (b.cross) { c.fillStyle = '#e02020'; c.fillRect(px + w / 2 - 2, py + 8, 4, 14); c.fillRect(px + w / 2 - 7, py + 13, 14, 4); }
    if (b.church) {
      c.fillStyle = '#e0d0b0'; c.fillRect(px + w / 2 - 8, py - 6, 16, 22);
      c.fillStyle = '#806040'; c.fillRect(px + w / 2 - 6, py - 4, 12, 3);
      c.fillStyle = '#f0e0a0'; c.fillRect(px + w / 2 - 1, py - 14, 2, 10); c.fillRect(px + w / 2 - 4, py - 11, 8, 2);
    }
    // fachada
    const fy = py + roofH;
    c.fillStyle = b.wall; c.fillRect(px, fy, w, 14);
    c.fillStyle = shade(b.wall, -40); c.fillRect(px, fy, w, 1); c.fillRect(px, fy + 13, w, 1);
    const doorX = b.door !== undefined ? b.door * TS + 3 : -999;
    for (let xx = 4; xx < w - 8; xx += 14) {
      const wx = px + xx;
      if (Math.abs(wx + 4 - (doorX + 5)) < 12) continue;
      c.fillStyle = '#2a3a5a'; c.fillRect(wx, fy + 3, 8, 6);
      c.fillStyle = '#6a8ab8'; c.fillRect(wx + 1, fy + 4, 2, 2);
      c.fillStyle = shade(b.wall, -60); c.fillRect(wx, fy + 9, 8, 1);
    }
    if (b.door !== undefined) {
      c.fillStyle = b.id ? '#5a3418' : '#6a4a2a'; c.fillRect(doorX, fy + 2, 10, 12);
      c.fillStyle = '#f0c040'; c.fillRect(doorX + 7, fy + 8, 1, 1);
      if (b.id) { c.fillStyle = '#ffe080'; c.fillRect(doorX - 2, fy + 1, 14, 1); }
    }
    if (b.label) {
      c.font = FONT; c.textBaseline = 'top'; c.textAlign = 'center';
      const lines = fixAcc(b.label).split('\n');
      const lw = Math.max(...lines.map(l => c.measureText(l).width)) + 8;
      const lh = lines.length * 10 + 4;
      const cx = px + w / 2, cy = py + Math.max(4, roofH / 2 - lh / 2);
      c.fillStyle = '#1a1430'; c.fillRect(Math.round(cx - lw / 2), Math.round(cy), Math.round(lw), lh);
      c.fillStyle = '#f0d070'; c.fillRect(Math.round(cx - lw / 2), Math.round(cy), Math.round(lw), 1); c.fillRect(Math.round(cx - lw / 2), Math.round(cy + lh - 1), Math.round(lw), 1);
      lines.forEach((l, i) => { c.fillStyle = '#ffffff'; c.fillText(l, Math.round(cx), Math.round(cy + 3 + i * 10)); });
      c.textAlign = 'left';
    }
  },

  drawProp(c, p) {
    const px = p.x * TS, py = p.y * TS;
    switch (p.type) {
      case 'cross':
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(px + 6, py + 4, 8, 14);
        c.fillStyle = '#6a4a2a'; c.fillRect(px + 5, py - 22, 6, 36); c.fillRect(px - 6, py - 14, 28, 6);
        c.fillStyle = '#8a6a3a'; c.fillRect(px + 6, py - 22, 2, 36); c.fillRect(px - 6, py - 14, 28, 2);
        c.fillStyle = '#808088'; c.fillRect(px - 2, py + 10, 20, 6);
        break;
      case 'statue':
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(px + 2, py + 6, 32, 28);
        c.fillStyle = '#8a8a92'; c.fillRect(px, py + 4, 32, 28); c.fillStyle = '#a8a8b0'; c.fillRect(px + 2, py + 6, 28, 3);
        c.fillStyle = '#6a6a72'; c.fillRect(px + 2, py + 26, 28, 4);
        this.statueRect = { x: px, y: py };
        break;
      case 'bench':
        c.fillStyle = '#6a4a2a'; c.fillRect(px, py + 6, 22, 5); c.fillStyle = '#8a6a3a'; c.fillRect(px, py + 6, 22, 1);
        c.fillStyle = '#303030'; c.fillRect(px + 1, py + 11, 2, 3); c.fillRect(px + 19, py + 11, 2, 3);
        break;
      case 'stall':
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px + 2, py + 2, 28, 18);
        c.fillStyle = '#d8d8d8'; c.fillRect(px, py + 8, 28, 10);
        for (let i = 0; i < 28; i += 4) { c.fillStyle = i % 8 ? '#ffffff' : p.col; c.fillRect(px + i, py, 4, 9); }
        c.fillStyle = '#5a3a20'; c.fillRect(px, py + 17, 28, 2);
        c.font = FONT; c.fillStyle = '#000'; c.textBaseline = 'top';
        break;
      case 'sign':
        c.fillStyle = '#5a3a20'; c.fillRect(px + 2, py, 3, 14); c.fillRect(px + 90, py, 3, 14);
        c.fillStyle = '#2a5a3a'; c.fillRect(px - 4, py - 10, 104, 13);
        c.font = FONT; c.textBaseline = 'top'; c.fillStyle = '#fff'; c.fillText(fixAcc(p.label), px, py - 7);
        break;
      case 'billboard':
        c.fillStyle = '#404040'; c.fillRect(px + 10, py + 8, 3, 30); c.fillRect(px + 60, py + 8, 3, 30);
        c.fillStyle = '#f0f0f0'; c.fillRect(px - 4, py - 22, 84, 32);
        c.fillStyle = '#d02020'; c.fillRect(px - 4, py - 22, 84, 3);
        c.font = FONT; c.textBaseline = 'top'; c.fillStyle = '#202020'; c.fillText('BIENVENIDOS', px - 2, py - 16); c.fillStyle = '#2a8a3a'; c.fillText('GUAMUCHIL', px + 2, py - 4);
        break;
      case 'field': {
        const X = p.x * TS + 4, Y = p.y * TS + 4, Wd = p.w * TS - 8, Ht = p.h * TS - 8;
        c.fillStyle = '#58a848'; c.fillRect(X, Y, Wd, Ht);
        c.fillStyle = '#f0f0f0'; c.fillRect(X, Y, Wd, 1); c.fillRect(X, Y + Ht - 1, Wd, 1); c.fillRect(X, Y, 1, Ht); c.fillRect(X + Wd - 1, Y, 1, Ht);
        c.fillRect(X, Y + Ht / 2, Wd, 1);
        c.strokeStyle = '#f0f0f0'; c.beginPath(); c.arc(X + Wd / 2, Y + Ht / 2, 16, 0, 7); c.stroke();
        c.fillRect(X + Wd / 2 - 16, Y, 32, 3); c.fillRect(X + Wd / 2 - 16, Y + Ht - 3, 32, 3);
        break;
      }
    }
  },

  drawStatue(ctx, camx, camy, t) {
    if (!this.statueRect || (typeof S !== 'undefined' && S.flags && S.flags.statueGone)) return;
    const x = this.statueRect.x - camx + 16, y = this.statueRect.y - camy + 14;
    // figura de bronce (homenaje)
    ctx.fillStyle = '#6a4a20'; ctx.fillRect(x - 5, y - 18, 10, 18);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(x - 4, y - 18, 3, 16);
    ctx.fillStyle = '#7a5a28'; ctx.fillRect(x - 4, y - 26, 8, 8);
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(x - 11, y - 28, 22, 3); ctx.fillRect(x - 5, y - 32, 10, 5);
    ctx.fillStyle = '#9a7a40'; ctx.fillRect(x - 10, y - 28, 6, 1);
    ctx.fillStyle = '#6a4a20'; ctx.fillRect(x + 5, y - 16, 3, 9); ctx.fillRect(x - 8, y - 16, 3, 9);
  },

  buildMinimap() {
    const m = mkCanvas(MW, MH), c = m.getContext('2d');
    const col = { 0: '#3c8a30', 1: '#3a3a42', 2: '#a8a090', 3: '#806a5a', 4: '#2a64b0', 5: '#24601e', 6: '#9a744a', 7: '#d2bc96', 8: '#6a7a30', 9: '#5a5a62', 10: '#6a5a4a', 11: '#707078', 12: '#dcc88c', 13: '#909098', 14: '#50505a' };
    const img = c.createImageData(MW, MH);
    for (let i = 0; i < MW * MH; i++) {
      const [r, g, b] = hexToRgb(col[this.tiles[i]] || '#000');
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    for (const b of this.buildings) { c.fillStyle = b.id ? b.roof : shade(b.roof, -20); c.fillRect(b.x, b.y, b.w, b.h); }
    this.minimap = m;
  }
};

const LOC_NAMES = {
  home: 'CASA DE JESÚS', gym: 'TITANES GYM', iglesia: 'PARROQUIA', museo: 'MUSEO DEL ÉVORA', estacion: 'ESTACIÓN DEL TREN',
  barberia: 'BARBERÍA EL LIBRITO', comisaria: 'COMISARÍA', mercado: 'MERCADO MUNICIPAL', taqueria: 'TACOS EL GÜERO',
  otaku: 'OTAKU ÉVORA', ciber: 'CIBER EL PIXEL', hospital: 'HOSPITAL', deportiva: 'UNIDAD DEPORTIVA', corporativo: 'CORPORATIVO WAIFU', rancho: 'RANCHO LOS FLACOS'
};
const MAP_ICONS = { home: ['H', '#ffd060'], gym: ['G', '#60a0ff'], otaku: ['O', '#ff70c0'], taqueria: ['T', '#ff8040'], mercado: ['$', '#70d070'], iglesia: ['+', '#f0f0a0'], hospital: ['H', '#ff4040'], comisaria: ['P', '#4060ff'], ciber: ['C', '#40c0ff'], barberia: ['B', '#ff6080'], deportiva: ['F', '#c08040'], museo: ['M', '#d0b080'], corporativo: ['W', '#ff40a0'] };
