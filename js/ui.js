'use strict';
// ============================================================
//  ui.js : diálogos, menús, HUD, minijuegos
// ============================================================
let ctx = null;

function txt(s, x, y, col, al, sh) {
  s = fixAcc(s);
  ctx.font = FONT; ctx.textAlign = al || 'left'; ctx.textBaseline = 'top';
  x = Math.round(x); y = Math.round(y);
  if (sh !== false) { ctx.fillStyle = sh || '#000'; ctx.fillText(s, x + 1, y + 1); }
  ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
function bigTxt(s, x, y, size, col, al, sh) {
  s = fixAcc(s);
  ctx.font = size + 'px "Press Start 2P", monospace'; ctx.textAlign = al || 'left'; ctx.textBaseline = 'top';
  if (sh) { ctx.fillStyle = sh; ctx.fillText(s, Math.round(x) + Math.max(1, size / 8), Math.round(y) + Math.max(1, size / 8)); }
  ctx.fillStyle = col; ctx.fillText(s, Math.round(x), Math.round(y));
  ctx.textAlign = 'left';
}
const _wrapCache = new Map();
function wrap(s, maxW) {
  const key = s + '|' + maxW;
  if (_wrapCache.has(key)) return _wrapCache.get(key);
  ctx.font = FONT;
  s = fixAcc(s);
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  if (_wrapCache.size > 500) _wrapCache.clear();
  _wrapCache.set(key, out);
  return out;
}
function box(x, y, w, h, fill, border) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = fill || 'rgba(20,14,40,0.94)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = border || '#f0d070';
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + 1, y + h, w, 2); ctx.fillRect(x + w, y + 1, 2, h);
}
function bar(x, y, w, h, v, col, back) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = back || '#302838'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(v, 0, 1)), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, Math.round(w * clamp(v, 0, 1)), 1);
}
function star(x, y, on) {
  ctx.fillStyle = on ? '#ffd040' : '#403848';
  ctx.fillRect(x + 3, y, 2, 2); ctx.fillRect(x, y + 2, 8, 2); ctx.fillRect(x + 1, y + 4, 6, 2); ctx.fillRect(x + 1, y + 6, 2, 2); ctx.fillRect(x + 5, y + 6, 2, 2);
}

const UI = {
  stack: [], toasts: [], banners: [], t: 0,
  push(m) { this.stack.push(m); },
  pop(m) { const i = this.stack.indexOf(m || this.top()); if (i >= 0) this.stack.splice(i, 1); },
  top() { return this.stack[this.stack.length - 1]; },
  busy() { return this.stack.length > 0; },
  update(dt) {
    this.t += dt;
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter(t => t.t > 0);
    if (this.banners.length) { this.banners[0].t -= dt; if (this.banners[0].t <= 0) this.banners.shift(); }
    const m = this.top();
    if (m && m.update) m.update(dt);
  },
  draw() {
    for (const m of this.stack) if (m.draw) m.draw();
  },
  toast(text, col) {
    if (this.toasts.some(t => t.text === text)) return;
    this.toasts.push({ text, col: col || '#fff', t: 4 });
    if (this.toasts.length > 4) this.toasts.shift();
  },
  banner(title, sub, col) { this.banners.push({ title, sub, col: col || '#ffd060', t: 3 }); if (this.banners.length > 3) this.banners.shift(); },

  // ---------------- DIÁLOGO ----------------
  dialog(lines, cb) {
    const d = {
      type: 'dialog', i: 0, shown: 0, sel: 0, cb, blipT: 0,
      lines: lines.map(l => Array.isArray(l) ? { who: l[0], text: l[1] } : l),
      update(dt) {
        const L = this.lines[this.i];
        if (!L) { UI.pop(this); if (this.cb) this.cb(); return; }
        if (this.shown < L.text.length) {
          this.shown += dt * 75;
          this.blipT -= dt; if (this.blipT <= 0) { Sound.sfx('blip'); this.blipT = 0.06; }
          if (Input.confirm()) this.shown = L.text.length;
          return;
        }
        if (L.choices) {
          if (Input.hit('up')) { this.sel = (this.sel + L.choices.length - 1) % L.choices.length; Sound.sfx('move'); }
          if (Input.hit('down')) { this.sel = (this.sel + 1) % L.choices.length; Sound.sfx('move'); }
          if (Input.confirm()) {
            const c = L.choices[this.sel]; Sound.sfx('select');
            const extra = c.fn ? c.fn() : null;
            this.sel = 0;
            if (extra && extra.length) this.lines.splice(this.i + 1, 0, ...extra.map(l => Array.isArray(l) ? { who: l[0], text: l[1] } : l));
            this.adv();
          }
          return;
        }
        if (Input.confirm()) { Sound.sfx('select'); this.adv(); }
        else if (Input.hit('back')) { while (this.i < this.lines.length && !this.lines[this.i].choices) this.i++; this.shown = 0; if (this.i >= this.lines.length) { UI.pop(this); if (this.cb) this.cb(); } }
      },
      adv() { this.i++; this.shown = 0; if (this.i >= this.lines.length) { UI.pop(this); if (this.cb) this.cb(); } },
      draw() {
        const L = this.lines[this.i]; if (!L) return;
        const bx = 10, bh = 74, by = H - bh - 8, bw = W - 20;
        const hasP = L.who && L.who !== 'narrador' && (SPEC[L.who] || L.who === 'jesus');
        box(bx, by, bw, bh, L.who === 'narrador' ? 'rgba(10,10,24,0.95)' : 'rgba(20,14,40,0.95)', L.who === 'dios' ? '#fff6a0' : L.who === 'narrador' ? '#8080a0' : '#f0d070');
        let tx = bx + 10;
        if (hasP) {
          ctx.fillStyle = '#2a2040'; ctx.fillRect(bx + 6, by + 8, 40, 40);
          drawPortrait(ctx, L.who, bx + 8, by + 10, 2);
          tx = bx + 54;
        }
        if (L.who) {
          const nm = NAMES[L.who] || L.who.toUpperCase();
          ctx.font = FONT;
          const nw = ctx.measureText(nm).width + 10;
          box(bx + 8, by - 9, nw, 14, '#1a1430', NAMECOL[L.who] || '#f0d070');
          txt(nm, bx + 13, by - 6, NAMECOL[L.who] || '#ffd060');
        }
        const lines = wrap(L.text, bx + bw - tx - 10);
        let n = Math.floor(this.shown);
        let y = by + 10;
        for (const ln of lines) {
          const part = ln.slice(0, Math.max(0, n));
          txt(part, tx, y, '#ffffff');
          n -= ln.length + 1; y += 11;
          if (n <= 0) break;
        }
        if (this.shown >= L.text.length) {
          if (L.choices) {
            const cw = 250, ch = L.choices.length * 14 + 10;
            box(W - cw - 16, by - ch - 12, cw, ch);
            L.choices.forEach((c, i) => txt((i === this.sel ? '> ' : '  ') + c.t, W - cw - 10, by - ch - 6 + i * 14, i === this.sel ? '#ffd060' : '#c0c0d0'));
          } else if (Math.floor(UI.t * 3) % 2) txt('▼', bx + bw - 16, by + bh - 14, '#ffd060');
        }
      }
    };
    this.push(d);
    return d;
  },

  // ---------------- MENÚ ----------------
  menu(def) {
    const m = {
      type: 'menu', sel: 0, scroll: 0, def,
      items() { return typeof def.items === 'function' ? def.items() : def.items; },
      update() {
        const it = this.items();
        if (!it.length) return;
        if (Input.hit('up')) { this.sel = (this.sel + it.length - 1) % it.length; Sound.sfx('move'); }
        if (Input.hit('down')) { this.sel = (this.sel + 1) % it.length; Sound.sfx('move'); }
        if (Input.hit('back') || (def.closeKey && Input.hit(def.closeKey))) { Sound.sfx('back'); UI.pop(this); if (def.onClose) def.onClose(); return; }
        if (Input.hit('ok') || Input.hit('act') || Input.hit('use')) {
          const c = it[this.sel];
          if (!c) return;
          if (c.disabled) { Sound.sfx('miss'); if (c.why) UI.toast(c.why, '#ff8080'); return; }
          Sound.sfx('select');
          const r = c.fn ? c.fn() : 'close';
          if (r === 'close') { UI.pop(this); if (def.onClose) def.onClose(); }
        }
        this.sel = Math.min(this.sel, it.length - 1);
      },
      draw() {
        const it = this.items();
        const w = def.w || 320, rows = Math.min(it.length, 10);
        const h = 34 + rows * 14 + 34;
        const x = (W - w) / 2, y = Math.max(8, (H - h) / 2 - 6);
        box(x, y, w, h, def.phone ? 'rgba(16,20,30,0.97)' : undefined, def.color);
        txt(def.title, x + w / 2, y + 7, def.color || '#ffd060', 'center');
        if (def.sub) txt(typeof def.sub === 'function' ? def.sub() : def.sub, x + w / 2, y + 19, '#a0a0c0', 'center');
        if (this.sel < this.scroll) this.scroll = this.sel;
        if (this.sel >= this.scroll + rows) this.scroll = this.sel - rows + 1;
        for (let i = 0; i < rows; i++) {
          const k = i + this.scroll, c = it[k]; if (!c) break;
          const yy = y + 34 + i * 14;
          if (k === this.sel) { ctx.fillStyle = 'rgba(255,208,96,0.15)'; ctx.fillRect(x + 4, yy - 3, w - 8, 13); }
          txt((k === this.sel ? '> ' : '  ') + c.label, x + 8, yy, c.disabled ? '#605870' : k === this.sel ? '#ffd060' : '#e0e0f0');
          if (c.right) txt(c.right, x + w - 8, yy, c.disabled ? '#605870' : (c.rcol || '#80ff80'), 'right');
        }
        if (it.length > rows) txt((this.scroll + rows < it.length ? '▼' : ' ') + ' ' + (this.sel + 1) + '/' + it.length, x + w - 10, y + h - 12, '#808090', 'right');
        const c = it[this.sel];
        if (c && c.desc) {
          const ls = wrap(c.desc, w - 16).slice(0, 2);
          ls.forEach((l, i) => txt(l, x + 8, y + h - 28 + i * 10, '#b0b0c8'));
        }
      }
    };
    this.push(m);
    return m;
  },

  // ---------------- MINIJUEGO GYM ----------------
  gymGame(kind, cb, hard) {
    const names = { banca: 'PRESS DE BANCA', curl: 'CURL (EN EL RACK, COMO ANIMAL)', dominadas: 'DOMINADAS', pierna: 'SENTADILLA (DÍA DE PIERNA)' };
    const g = {
      type: 'gym', kind, good: 0, tries: hard ? 10 : 10, pos: 0, dirn: 1, zc: .5, zw: hard ? .13 : .2, msg: '¡A darle, flaco!', msgCol: '#fff', anim: 0, done: false, cb,
      speed: hard ? 1.6 : 1.15,
      update(dt) {
        this.anim = Math.max(0, this.anim - dt);
        if (this.done) { if (Input.confirm()) { UI.pop(this); const gain = Game.applyGym(this.good, this.kind); if (this.cb) this.cb(this.good, gain); } return; }
        this.pos += this.dirn * this.speed * dt * (1 + (10 - this.tries) * 0.06);
        if (this.pos > 1) { this.pos = 1; this.dirn = -1; } if (this.pos < 0) { this.pos = 0; this.dirn = 1; }
        if (Input.hit('act') || Input.hit('ok') || Input.hit('use')) {
          this.tries--;
          if (Math.abs(this.pos - this.zc) < this.zw / 2) { this.good++; this.anim = .35; Sound.sfx('rep'); this.msg = pick(['¡REP!', '¡LIMPIA!', '¡ESO, FLACO!', '¡LIGHTWEIGHT BABY!', '¡SIGMA!']); this.msgCol = '#60ff80'; }
          else { Sound.sfx('miss'); this.msg = pick(['¡MAMÓ!', 'Ego lifting...', 'Se te cayó la barra', 'Don Chava se ríe de ti', '¡Eso no fue rep!']); this.msgCol = '#ff6060'; }
          this.zc = rnd(.18, .82);
          this.zw = Math.max(.08, this.zw - .005);
          if (this.tries <= 0) { this.done = true; Sound.sfx(this.good >= 6 ? 'level' : 'fail'); }
        }
      },
      draw() {
        ctx.fillStyle = '#16121e'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#24202e'; for (let i = 0; i < W; i += 32) ctx.fillRect(i, 0, 16, H);
        ctx.fillStyle = '#3a3040'; ctx.fillRect(0, 170, W, 100);
        txt('TITANES GYM', W / 2, 10, '#ffd060', 'center');
        txt(names[this.kind] || this.kind.toUpperCase(), W / 2, 24, '#ffffff', 'center');
        // jesús levantando
        const sp = jesusSpec();
        const lift = this.anim > 0 ? Math.sin((.35 - this.anim) / .35 * Math.PI) : 0;
        const img = charSprite(sp).down[0];
        ctx.save();
        ctx.translate(W / 2, 140);
        if (this.kind === 'banca') {
          ctx.fillStyle = '#505060'; ctx.fillRect(-50, -4, 100, 10); ctx.fillStyle = '#303040'; ctx.fillRect(-40, 6, 6, 20); ctx.fillRect(34, 6, 6, 20);
          ctx.rotate(-Math.PI / 2); ctx.drawImage(img, -40, -36, 72, 80); ctx.rotate(Math.PI / 2);
          const by = -30 - lift * 20;
          ctx.fillStyle = '#c0c0c8'; ctx.fillRect(-70, by, 140, 4);
          ctx.fillStyle = '#202028'; ctx.fillRect(-72, by - 14, 10, 32); ctx.fillRect(62, by - 14, 10, 32);
        } else {
          const sq = this.kind === 'pierna' ? lift * 16 : 0;
          ctx.drawImage(img, -36, -80 + sq, 72, 80 - sq);
          const by = this.kind === 'pierna' ? -66 + sq : this.kind === 'dominadas' ? -86 : -30 - lift * 22;
          ctx.fillStyle = '#c0c0c8'; ctx.fillRect(-60, by, 120, 4);
          ctx.fillStyle = '#202028'; ctx.fillRect(-62, by - 10, 8, 24); ctx.fillRect(54, by - 10, 8, 24);
        }
        ctx.restore();
        // barra de timing
        const bx = 90, by = 196, bw = 300;
        bar(bx, by, bw, 14, 0, '#000', '#302838');
        ctx.fillStyle = '#30c050'; ctx.fillRect(bx + Math.round((this.zc - this.zw / 2) * bw), by, Math.round(this.zw * bw), 14);
        ctx.fillStyle = '#80ff90'; ctx.fillRect(bx + Math.round((this.zc - this.zw / 2) * bw), by, Math.round(this.zw * bw), 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + Math.round(this.pos * bw) - 1, by - 4, 3, 22);
        txt(this.msg, W / 2, 175, this.msgCol, 'center');
        txt('REPS: ' + this.good + '   INTENTOS: ' + this.tries, W / 2, 218, '#c0c0d0', 'center');
        if (this.done) {
          box(110, 70, 260, 70);
          txt('SERIE TERMINADA', W / 2, 80, '#ffd060', 'center');
          txt(this.good + '/10 reps limpias', W / 2, 96, '#ffffff', 'center');
          txt(this.good >= 8 ? 'Don Chava: "Eso, mijo."' : this.good >= 5 ? 'Don Chava: "Ahí la llevas."' : 'Don Chava: "Das pena, flaco."', W / 2, 110, '#a0a0c0', 'center');
          txt('[ESPACIO] continuar', W / 2, 126, '#80ff80', 'center');
        } else txt('[ESPACIO] cuando la línea esté en lo VERDE', W / 2, 238, '#808090', 'center');
      }
    };
    this.push(g);
  },

  // ---------------- COLECCIÓN ----------------
  figures() {
    const f = {
      type: 'figs', sel: 0,
      update() {
        const n = FIGURES.length, cols = 8;
        if (Input.hit('left')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('move'); }
        if (Input.hit('right')) { this.sel = (this.sel + 1) % n; Sound.sfx('move'); }
        if (Input.hit('up')) { this.sel = (this.sel + n - cols) % n; Sound.sfx('move'); }
        if (Input.hit('down')) { this.sel = (this.sel + cols) % n; Sound.sfx('move'); }
        if (Input.hit('back') || Input.hit('inv')) { UI.pop(this); Sound.sfx('back'); return; }
        if (Input.hit('ok') || Input.hit('act') || Input.hit('use')) {
          const fg = FIGURES[this.sel];
          if (S.figs[fg.id]) {
            if (S.oficial === fg.id) UI.toast('Ya es tu WAIFU OFICIAL. Monogamia total.', '#ff80c0');
            else { S.oficial = fg.id; Sound.sfx('level'); UI.toast(fg.name + ' es tu nueva WAIFU OFICIAL. (Las demás no lo saben.)', '#ff80c0'); }
            Game.calcPerks();
          } else Sound.sfx('miss');
        }
      },
      draw() {
        ctx.fillStyle = 'rgba(8,6,16,0.96)'; ctx.fillRect(0, 0, W, H);
        const own = FIGURES.filter(x => S.figs[x.id]).length;
        txt('VITRINA DE FIGURAS', W / 2, 8, '#ff80c0', 'center');
        txt(own + '/' + FIGURES.length + ' coleccionadas   ' + money(Game.figValue()) + ' invertidos', W / 2, 20, '#a0a0c0', 'center');
        const cols = 8, cw = 52, ch = 40, ox = (W - cols * cw) / 2, oy = 34;
        FIGURES.forEach((fg, i) => {
          const x = ox + (i % cols) * cw, y = oy + Math.floor(i / cols) * ch;
          const has = !!S.figs[fg.id];
          ctx.fillStyle = i === this.sel ? '#3a2a50' : '#1c1828'; ctx.fillRect(x + 2, y, cw - 4, ch - 4);
          ctx.fillStyle = has ? RARCOL[fg.rar] : '#2a2638'; ctx.fillRect(x + 2, y + ch - 6, cw - 4, 2);
          if (i === this.sel) { ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 2, y, cw - 4, 1); ctx.fillRect(x + 2, y + ch - 5, cw - 4, 1); ctx.fillRect(x + 2, y, 1, ch - 4); ctx.fillRect(x + cw - 3, y, 1, ch - 4); }
          const bob = has && i === this.sel ? Math.round(Math.sin(UI.t * 5)) : 0;
          ctx.drawImage(figIcon(fg, !has), x + cw / 2 - 18, y + 1 + bob, 36, 36);
          if (S.oficial === fg.id) txt('♥', x + cw - 12, y + 2, '#ff60a0', 'left', false);
        });
        const fg = FIGURES[this.sel], has = !!S.figs[fg.id];
        box(16, 206, W - 32, 58);
        if (has) {
          txt(fg.name, 24, 212, RARCOL[fg.rar]);
          txt(RARITY[fg.rar] + ' · ' + fg.serie, 24, 224, '#a0a0c0');
          txt('BONUS: +' + fg.perk[1] + '% ' + PERKNAME[fg.perk[0]], 24, 236, '#80ff80');
          txt('"' + fg.desc + '"', 24, 248, '#d0c0e0');
        } else {
          txt('??? ' + (fg.src === 'hidden' ? '(ESCONDIDA EN GUAMÚCHIL)' : fg.src === 'gacha' ? '(SOLO EN GACHA)' : fg.src === 'mission' ? '(MISIÓN)' : '(TIENDA OTAKU ÉVORA)'), 24, 212, '#808090');
          txt('Rareza: ' + RARITY[fg.rar], 24, 226, RARCOL[fg.rar]);
        }
        txt('[E] Waifu oficial  [ESC] salir', W - 16, 196, '#706880', 'right');
      }
    };
    this.push(f);
  },

  // ---------------- MAPA ----------------
  map() {
    const mp = {
      type: 'map',
      update() { if (Input.hit('back') || Input.hit('map') || Input.confirm()) { UI.pop(this); Sound.sfx('back'); } },
      draw() {
        ctx.fillStyle = '#0a0812'; ctx.fillRect(0, 0, W, H);
        const sc = 1.85, ox = 8, oy = 22;
        ctx.drawImage(World.minimap, ox, oy, MW * sc, MH * sc);
        txt('MAPA DE GUAMÚCHIL, SINALOA', 8, 7, '#ffd060');
        const dot = (x, y, ch, col) => { const px = ox + x / TS * sc, py = oy + y / TS * sc; ctx.fillStyle = '#000'; ctx.fillRect(px - 5, py - 5, 11, 11); ctx.fillStyle = col; ctx.fillRect(px - 4, py - 4, 9, 9); txt(ch, px - 3, py - 3, '#000', 'left', false); };
        for (const k in MAP_ICONS) { const l = World.locs[k]; if (l) dot(l.x, l.y, MAP_ICONS[k][0], MAP_ICONS[k][1]); }
        const sd = Missions.storyDef();
        if (sd && !Missions.active) { const l = LOC(sd.start); if (Math.floor(UI.t * 3) % 2) dot(l.x, l.y, '!', '#ffff40'); }
        if (Missions.active && Missions.active.target) { const t = Missions.active.target; if (Math.floor(UI.t * 4) % 2) dot(t.x, t.y, '*', '#ffff40'); }
        const pp = playerPos();
        ctx.fillStyle = '#fff'; ctx.fillRect(ox + pp.x / TS * sc - 2, oy + pp.y / TS * sc - 2, 5, 5);
        ctx.fillStyle = '#ff2020'; ctx.fillRect(ox + pp.x / TS * sc - 1, oy + pp.y / TS * sc - 1, 3, 3);
        const lx = 312;
        box(lx - 6, 18, W - lx, 240);
        let y = 24;
        for (const k in MAP_ICONS) {
          ctx.fillStyle = MAP_ICONS[k][1]; ctx.fillRect(lx, y, 8, 8);
          txt(MAP_ICONS[k][0], lx + 1, y, '#000', 'left', false);
          txt((LOC_NAMES[k] || k).slice(0, 18), lx + 12, y, '#d0d0e0');
          y += 13;
        }
        txt('! Misión  * Objetivo', lx, y + 4, '#ffff40');
        txt('[M] cerrar', lx, 246, '#606070');
      }
    };
    this.push(mp);
  },

  // ---------------- CRÉDITOS ----------------
  credits(cb) {
    Sound.play('title');
    const lines = [
      ['JESUS SIMULATOR', '#ffd060'], ['El Héroe de Guamúchil', '#ff80c0'], ['', ''],
      ['Una producción de', '#a0a0c0'], ['KAZOO STUDIOS', '#ffffff'], ['', ''],
      ['Dirección, Guion y Pelo de Librito', '#a0a0c0'], ['Kazoo Studios', '#fff'], ['', ''],
      ['Protagonista', '#a0a0c0'], ['Jesús Alberto (58 kg de disciplina)', '#fff'], ['', ''],
      ['Agradecimientos especiales', '#a0a0c0'], ['El pueblo de Guamúchil, Sinaloa', '#fff'], ['El Valle del Évora', '#fff'], ['Los productores de garbanzo', '#fff'], ['El Ídolo de Guamúchil, con respeto', '#fff'], ['Doña Lupe y su chancla', '#fff'], ['', ''],
      ['Ningún chud fue lastimado', '#a0a0c0'], ['(emocionalmente sí, todos)', '#a0a0c0'], ['', ''],
      ['Moraleja:', '#ffd060'], ['Ve al gym. Hazle pierna.', '#fff'], ['Las mujeres no son el enemigo.', '#fff'], ['Las novias de IA sí.', '#fff'], ['', ''],
      ['ESTADÍSTICAS', '#ffd060'],
      [() => 'Días vividos: ' + S.day, '#fff'], [() => 'Figuras: ' + Object.keys(S.figs).length + '/' + FIGURES.length, '#fff'],
      [() => 'Dinero gastado en figuras: ' + money(Game.figValue()), '#fff'], [() => 'Racha de gym: ' + S.streak + ' días', '#fff'],
      [() => 'Cachetadas recibidas: ' + (S.stats.cachetadas || 0), '#fff'], ['', ''],
      ['GRACIAS POR JUGAR', '#60ff80'], ['', ''], ['El juego continúa en MODO LIBRE.', '#a0a0c0'], ['Colecciona TODAS las figuras.', '#a0a0c0']
    ];
    const c = {
      type: 'credits', y: H + 10,
      update(dt) {
        this.y -= dt * (Input.held('act') ? 90 : 22);
        if (this.y < -lines.length * 14 - 20 || Input.hit('back')) { UI.pop(this); Game.resumeMusic(); if (cb) cb(); }
      },
      draw() {
        ctx.fillStyle = '#08060e'; ctx.fillRect(0, 0, W, H);
        lines.forEach(([t, col], i) => { const s = typeof t === 'function' ? t() : t; const y = this.y + i * 14; if (y > -10 && y < H) txt(s, W / 2, y, col, 'center'); });
      }
    };
    this.push(c);
  },

  // ---------------- HUD ----------------
  drawHUD() {
    // panel superior izquierdo
    box(4, 4, 124, 36, 'rgba(10,8,20,0.75)', '#40385a');
    txt(money(S.money), 10, 9, '#60ff80');
    txt('DÍA ' + S.day + ' ' + fmtTime(S.time), 10, 21, Game.isNight() ? '#a0a0ff' : '#ffffff');
    txt(S.trained ? 'GYM OK' : 'GYM!', 10, 31, S.trained ? '#60ff80' : (Math.floor(UI.t * 2) % 2 ? '#ff6060' : '#ffd060'), 'left');
    txt('R' + S.streak, 70, 31, '#c0c0d0');
    // barras
    const bx = 8, by = H - 62;
    box(4, by - 4, 112, 60, 'rgba(10,8,20,0.75)', '#40385a');
    const row = (lab, v, col, i, num) => { txt(lab, bx, by + i * 11, col); bar(bx + 34, by + i * 11 + 1, 52, 6, v, col); if (num !== undefined) txt(String(num), bx + 90, by + i * 11, '#c0c0d0'); };
    row('VID', S.hp / maxHp(), '#ff4050', 0, Math.ceil(S.hp));
    row('HAM', S.hunger / 100, '#ff9030', 1, Math.ceil(S.hunger));
    row('MAM', S.mamadez / 100, '#40a0ff', 2, Math.floor(S.mamadez));
    row('COP', S.copium / 100, '#c060ff', 3, Math.floor(S.copium));
    row('FE', Math.min(1, S.fe / 100), '#ffd040', 4, Math.floor(S.fe));
    // carro
    if (PL.car) {
      box(120, H - 22, 120, 18, 'rgba(10,8,20,0.75)', '#40385a');
      txt(CARTYPES[PL.car.type].name.slice(0, 10), 124, H - 17, '#c0c0d0');
      bar(204, H - 16, 32, 6, PL.car.hp / 100, PL.car.hp < 30 ? '#ff4040' : '#80c0ff');
    }
    // arma y milagro
    const w = WEAPONS[S.wsel];
    box(W - 140, H - 34, 136, 30, 'rgba(10,8,20,0.75)', '#40385a');
    txt('[TAB] ' + w.name + (w.proj ? ' x' + S.weapons[S.wsel] : ''), W - 134, H - 29, '#ffd060');
    const mk = S.msel && S.miracles[S.msel] ? S.msel : null;
    if (mk) { const M = MIRACLES[mk]; txt('[Q] ' + M.name + (M.cost ? ' ' + M.cost + 'FE' : ''), W - 134, H - 17, S.fe >= M.cost ? '#fff6a0' : '#807050'); }
    else txt('[Q] Sin milagros aún', W - 134, H - 17, '#605870');
    // minimapa
    const mw = 92, mh = 70, mx = W - mw - 6, my = 6;
    ctx.fillStyle = '#000'; ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    const pp = playerPos();
    const sc = 1.5;
    const sx = pp.x / TS - mw / 2 / sc, sy = pp.y / TS - mh / 2 / sc;
    ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
    ctx.fillStyle = '#103020'; ctx.fillRect(mx, my, mw, mh);
    ctx.drawImage(World.minimap, sx, sy, mw / sc, mh / sc, mx, my, mw, mh);
    const md = (x, y, col, s) => { const px = mx + (x / TS - sx) * sc, py = my + (y / TS - sy) * sc; ctx.fillStyle = col; ctx.fillRect(Math.round(px - (s || 2)), Math.round(py - (s || 2)), (s || 2) * 2, (s || 2) * 2); };
    for (const k in MAP_ICONS) { const l = World.locs[k]; if (l) md(l.x, l.y, MAP_ICONS[k][1], 2); }
    for (const c of E.cars) if (c.ai === 'cop' && !c.dead) md(c.x, c.y, Math.floor(UI.t * 6) % 2 ? '#ff2020' : '#2040ff', 1.5);
    const sd = Missions.storyDef();
    if (sd && !Missions.active) { const l = LOC(sd.start); md(l.x, l.y, Math.floor(UI.t * 3) % 2 ? '#ffff40' : '#ff8000', 3); }
    const tg = Missions.active && Missions.active.target;
    if (tg) md(tg.x, tg.y, Math.floor(UI.t * 4) % 2 ? '#ffff40' : '#ffffff', 3);
    ctx.restore();
    // jugador en minimapa (flecha)
    ctx.fillStyle = '#fff'; ctx.fillRect(mx + mw / 2 - 2, my + mh / 2 - 2, 4, 4);
    ctx.fillStyle = '#ff3030'; ctx.fillRect(mx + mw / 2 - 1, my + mh / 2 - 1, 2, 2);
    ctx.fillStyle = '#f0d070'; ctx.fillRect(mx - 2, my - 2, mw + 4, 1); ctx.fillRect(mx - 2, my + mh + 1, mw + 4, 1);
    // funa
    if (S.wanted > 0) {
      const fx = W / 2 - 46;
      box(fx - 4, 4, 100, 14, 'rgba(10,8,20,0.8)', Math.floor(UI.t * 4) % 2 ? '#ff4040' : '#4060ff');
      txt('FUNA', fx, 7, '#ffffff');
      for (let i = 0; i < 5; i++) star(fx + 36 + i * 11, 7, i < S.wanted);
    }
    // objetivo
    const m = Missions.active;
    if (m && m.label) {
      let s = m.label + (m.count ? '  [' + m.count + ']' : '');
      const ls = wrap(s, 250);
      const oy = S.wanted > 0 ? 22 : 6;
      const h = ls.length * 10 + 6 + (m.sub ? 10 : 0) + (m.timer !== null && m.timer !== undefined ? 10 : 0);
      box(W / 2 - 130, oy, 260, h, 'rgba(10,8,20,0.78)', '#ffd060');
      ls.forEach((l, i) => txt(l, W / 2, oy + 4 + i * 10, '#ffffff', 'center'));
      let yy = oy + 4 + ls.length * 10;
      if (m.timer !== null && m.timer !== undefined) { txt('TIEMPO: ' + Math.ceil(m.timer) + 's', W / 2, yy, m.timer < 15 ? '#ff6060' : '#ffd060', 'center'); yy += 10; }
      if (m.sub) txt(m.sub, W / 2, yy, '#ffa040', 'center');
    }
    // flecha al objetivo
    const tgt = m ? m.target : (Missions.storyDef() ? LOC(Missions.storyDef().start) : null);
    if (tgt) this.drawArrow(tgt, !!m);
    // barra de jefe
    const bb = Game.boss || Game.bossBar;
    if (bb) {
      const name = Game.boss ? 'MECHA-YESENIA' : bb.def.boss;
      box(W / 2 - 110, H - 34, 220, 22, 'rgba(10,8,20,0.85)', '#ff4060');
      txt(name, W / 2, H - 31, '#ff80a0', 'center');
      bar(W / 2 - 100, H - 20, 200, 5, bb.hp / bb.maxhp, '#ff3050');
    }
    // copium mode
    if (PL.copeT > 0) { txt('MODO COPIUM ' + Math.ceil(PL.copeT), W / 2, H - 46, Math.floor(UI.t * 6) % 2 ? '#e080ff' : '#ffffff', 'center'); }
    // aviso de interacción
    if (Game.prompt) {
      ctx.font = FONT; const tw = ctx.measureText(Game.prompt).width + 12;
      box(W / 2 - tw / 2, H - 60, tw, 14, 'rgba(10,8,20,0.85)', '#80d0ff');
      txt(Game.prompt, W / 2, H - 57, '#ffffff', 'center');
    }
    // radio
    if (Game.radioT > 0) {
      const R = RADIOS[S.radio];
      const a = Math.min(1, Game.radioT);
      ctx.globalAlpha = a;
      txt('RADIO: ' + R.name, W / 2, 80, '#ffd060', 'center');
      txt(R.dj, W / 2, 92, '#c0c0d0', 'center');
      ctx.globalAlpha = 1;
    }
    // toasts
    this.toasts.forEach((t, i) => {
      ctx.globalAlpha = Math.min(1, t.t);
      const ls = wrap(t.text, 220);
      const y = 112 + i * 26;
      box(6, y, 228, ls.length * 10 + 6, 'rgba(10,8,20,0.8)', t.col);
      ls.forEach((l, k) => txt(l, 10, y + 4 + k * 10, t.col));
      ctx.globalAlpha = 1;
    });
    // banner
    const b = this.banners[0];
    if (b) {
      const a = Math.min(1, b.t * 2, (3 - b.t) * 4);
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 96, W, 46);
      bigTxt(b.title, W / 2, 102, 16, b.col, 'center', '#000');
      if (b.sub) txt(b.sub, W / 2, 124, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }
  },
  drawArrow(t, isMission) {
    const sx = t.x - Cam.x, sy = t.y - Cam.y;
    if (sx > 10 && sx < W - 10 && sy > 10 && sy < H - 10) {
      const bob = Math.sin(UI.t * 6) * 3;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(sx - 6, sy - 26 + bob); ctx.lineTo(sx + 6, sy - 26 + bob); ctx.lineTo(sx, sy - 16 + bob); ctx.fill();
      ctx.fillStyle = isMission ? '#ffff40' : '#ff9020'; ctx.beginPath(); ctx.moveTo(sx - 4, sy - 25 + bob); ctx.lineTo(sx + 4, sy - 25 + bob); ctx.lineTo(sx, sy - 18 + bob); ctx.fill();
      return;
    }
    const cx = W / 2, cy = H / 2;
    const a = Math.atan2(sy - cy, sx - cx);
    const r = 100;
    const ax = cx + Math.cos(a) * r * 1.8, ay = cy + Math.sin(a) * r;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.fill();
    ctx.fillStyle = isMission ? '#ffff40' : '#ff9020'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.fill();
    ctx.restore();
    const d = Math.round(dist(playerPos().x, playerPos().y, t.x, t.y) / TS);
    txt(d + 'm', ax, ay + 10, '#ffffff', 'center');
  }
};

const MIRACLES = {
  tacos: { name: 'TACOS', cost: 10 },
  cheve: { name: 'AGUA EN CHEVE', cost: 15 },
  expulsar: { name: 'EXPULSAR', cost: 25 },
  water: { name: 'CAMINAR AGUA', cost: 0, passive: 1 },
  resurrect: { name: 'RESURRECCIÓN', cost: 0, passive: 1 }
};
