'use strict';
// ============================================================
//  gfx.js : sprites 8-bit generados por código
// ============================================================
const OUTLINE = '#140c1c';

function outlineCanvas(c, col) {
  const x = c.getContext('2d');
  const w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h), a = d.data;
  const o = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) o[i] = a[i * 4 + 3] > 0 ? 1 : 0;
  const [r, g, b] = hexToRgb(col || OUTLINE);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = y * w + xx;
    if (o[i]) continue;
    if ((xx > 0 && o[i - 1]) || (xx < w - 1 && o[i + 1]) || (y > 0 && o[i - w]) || (y < h - 1 && o[i + w])) {
      a[i * 4] = r; a[i * 4 + 1] = g; a[i * 4 + 2] = b; a[i * 4 + 3] = 255;
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

// ---------------- personajes ----------------
const HEAD = {
  down: ['.....ssssss.....', '.....ssssss.....', '.....sesses.....', '.....ssssss.....', '......ssss......'],
  up: ['.....ssssss.....', '.....ssssss.....', '.....ssssss.....', '.....ssssss.....', '......ssss......'],
  left: ['.....ssssss.....', '.....ssssss.....', '.....esssss.....', '....sssssss.....', '......ssss......']
};
const TORSO = {
  n: { down: ['....tttttttt....', '...stttttttts...', '...stttttttts...', '...stttttttts...'], left: ['.....tttttt.....', '.....ttsttt.....', '.....ttsttt.....', '.....ttsttt.....'] },
  b: { down: ['...tttttttttt...', '..ssttttttttss..', '..ssttttttttss..', '..ssttttttttss..'], left: ['....tttttttt....', '....ttsstttt....', '....ttsstttt....', '....ttsstttt....'] }
};
const LEGS = {
  down: [['.....pp..pp.....', '.....pp..pp.....', '.....bb..bb.....'], ['.....pp..pp.....', '.....bb..pp.....', '.........bb.....'], ['.....pp..pp.....', '.....pp..bb.....', '.....bb.........']],
  left: [['......pppp......', '......pppp......', '.....bbbb.......'], ['.....pp.pp......', '....pp...pp.....', '....bb...bb.....'], ['......pppp......', '.....pp.pp......', '.....bb.bb......']]
};

function bodyRows(face, buff, skirt, f) {
  const fk = face === 'left' ? 'left' : 'down';
  const rows = ['', '', '', ''].map(() => '................');
  rows.push(...HEAD[face]);
  rows.push(...TORSO[buff ? 'b' : 'n'][fk]);
  if (skirt) {
    rows.push(fk === 'left' ? '.....dddddd.....' : '....dddddddd....');
    rows.push(fk === 'left' ? '....dddddddd....' : '...dddddddddd...');
    const lg = LEGS[fk][f];
    rows.push(lg[1].replace(/p/g, 's'), lg[2]);
  } else {
    rows.push(fk === 'left' ? '.....pppppp.....' : '....pppppppp....');
    rows.push(...LEGS[fk][f]);
  }
  rows.push('................');
  return rows;
}

function hairPixels(style, lvl, face) {
  const px = [];
  const add = (c, r, h) => px.push([c, r, h || 0]);
  const rect = (c0, r0, c1, r1, h) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) add(c, r, h); };
  if (style === 'librito') {
    const rx = Math.min(8, 5.2 + lvl * 0.8), ry = 3.6 + lvl * 0.45, cy = 4.6;
    const inside = (c, r) => { const dx = (c + 0.5 - 8) / rx, dy = (r + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
    for (let r = 0; r <= 8; r++) for (let c = 0; c < 16; c++) {
      if (!inside(c, r)) continue;
      if (face === 'down' && r >= 3) { const open = Math.min(2.5, 0.5 + (r - 3)); if (Math.abs(c + 0.5 - 8) <= open) continue; }
      if (face === 'left' && r >= 4 && c < (r === 4 ? 7 : 9)) continue;
      add(c, r, !inside(c, r - 1) ? 1 : 0);
    }
    // raya central (el "lomo" del libro)
    if (face !== 'left') { add(7, 1 + Math.max(0, 3 - lvl), 3); add(8, 1 + Math.max(0, 3 - lvl), 3); }
    return px;
  }
  const short = () => {
    if (face === 'down') { rect(5, 3, 10, 4); add(5, 5); add(10, 5); }
    else if (face === 'up') rect(5, 3, 10, 7);
    else { rect(5, 3, 10, 3); rect(6, 4, 10, 4); rect(9, 5, 10, 7); }
  };
  switch (style) {
    case 'short': short(); break;
    case 'spiky': short(); add(5, 2, 1); add(7, 1, 1); add(7, 2); add(9, 2, 1); add(10, 2); if (face !== 'left') add(4, 3); break;
    case 'slick': short(); add(6, 3, 1); add(7, 3, 1); break;
    case 'long':
      if (face === 'down') { rect(5, 3, 10, 4); rect(4, 4, 4, 12); rect(11, 4, 11, 12); add(5, 5); add(10, 5); }
      else if (face === 'up') rect(4, 3, 11, 12);
      else { rect(5, 3, 10, 3); rect(6, 4, 10, 4); rect(8, 5, 11, 12); }
      break;
    case 'pony':
      short();
      if (face === 'up') rect(7, 8, 8, 12); else if (face === 'left') { rect(11, 4, 12, 9); } else { add(11, 3); add(12, 4); }
      break;
    case 'bun': short(); rect(6, 1, 9, 2, 1); break;
    case 'cap':
      if (face === 'down') { rect(5, 2, 10, 3, 2); rect(4, 4, 11, 4, 2); }
      else if (face === 'up') { rect(5, 2, 10, 4, 2); rect(5, 5, 10, 6); }
      else { rect(5, 2, 10, 3, 2); rect(2, 4, 10, 4, 2); rect(9, 5, 10, 6); }
      break;
    case 'cowboy':
      short();
      rect(6, 1, 9, 2, 2); rect(2, 3, 13, 3, 2);
      break;
    case 'charro':
      short();
      rect(6, 0, 9, 2, 2); rect(1, 3, 14, 3, 2); add(1, 2, 2); add(14, 2, 2);
      break;
    case 'bald': break;
  }
  return px;
}

const _charCache = {};
function charSprite(spec) {
  const key = JSON.stringify(spec);
  if (_charCache[key]) return _charCache[key];
  const out = {};
  for (const face of ['down', 'up', 'left']) out[face] = [0, 1, 2].map(f => buildChar(spec, face, f));
  _charCache[key] = out;
  return out;
}
function buildChar(sp, face, f) {
  const c = mkCanvas(18, 20), x = c.getContext('2d');
  const rows = bodyRows(face, sp.buff, sp.skirt, f);
  const map = { s: sp.skin, e: '#1a1020', t: sp.shirt, p: sp.pants || '#334', b: sp.shoes || '#222', d: sp.dress || sp.shirt };
  rows.forEach((row, r) => {
    for (let i = 0; i < 16; i++) {
      const ch = row[i];
      if (ch !== '.' && map[ch]) { x.fillStyle = map[ch]; x.fillRect(i + 1, r + 1, 1, 1); }
    }
  });
  // sombreado de la playera
  x.fillStyle = 'rgba(0,0,0,0.18)';
  if (face === 'left') x.fillRect(1 + 9, 1 + 9, 2, 4); else x.fillRect(1 + (sp.buff ? 11 : 10), 1 + 9, 1, 4);
  if (sp.print && face === 'down') { x.fillStyle = sp.print; x.fillRect(1 + 7, 1 + 10, 2, 2); }
  if (sp.glasses) {
    x.fillStyle = sp.glasses;
    if (face === 'down') x.fillRect(1 + 5, 1 + 6, 6, 1);
    else if (face === 'left') x.fillRect(1 + 4, 1 + 6, 3, 1);
  }
  const hc = sp.hair || '#222', hl = shade(hc, 45), hd = shade(hc, -30);
  for (const [cc, rr, h] of hairPixels(sp.style, sp.lvl || 1, face)) {
    x.fillStyle = h === 2 ? (sp.hat || '#333') : h === 1 ? hl : h === 3 ? hd : hc;
    x.fillRect(cc + 1, rr + 1, 1, 1);
  }
  return outlineCanvas(c);
}
// dir: 0=E 1=S 2=W 3=N
function drawChar(ctx, spec, dir, frame, x, y, opts) {
  const s = charSprite(spec);
  const face = dir === 1 ? 'down' : dir === 3 ? 'up' : 'left';
  const img = s[face][frame || 0];
  const px = Math.round(x), py = Math.round(y);
  if (!opts || !opts.noShadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px - 5, py - 1, 10, 3);
    ctx.fillRect(px - 4, py - 2, 8, 5);
  }
  if (opts && opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  if (opts && opts.down) {
    ctx.save(); ctx.translate(px, py - 4); ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -9, -10); ctx.restore();
  } else if (dir === 0) {
    ctx.save(); ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(img, -9, py - 19); ctx.restore();
  } else ctx.drawImage(img, px - 9, py - 19);
  if (opts && opts.flash) {
    ctx.globalCompositeOperation = 'source-atop';
  }
  ctx.globalAlpha = 1;
}

// ---------------- carros ----------------
const CARTYPES = {
  sedan: { L: 22, Wd: 12, max: 150, acc: 115, name: 'Tsuru' },
  vocho: { L: 18, Wd: 11, max: 118, acc: 90, name: 'Vocho' },
  troca: { L: 26, Wd: 13, max: 160, acc: 120, name: 'Troca Lobo' },
  taxi: { L: 22, Wd: 12, max: 150, acc: 115, name: 'Taxi' },
  police: { L: 24, Wd: 12, max: 178, acc: 145, name: 'Patrulla' },
  suv: { L: 26, Wd: 14, max: 165, acc: 130, name: 'Suburban' },
  van: { L: 28, Wd: 14, max: 128, acc: 90, name: 'Van de Los Flacos' },
  sport: { L: 22, Wd: 11, max: 210, acc: 175, name: 'Camaro del Lic' }
};
const CAR_COLORS = ['#c03030', '#3060c0', '#e0e0e0', '#303038', '#e0b030', '#40a060', '#a05030', '#8040a0', '#d07030', '#70a0c0', '#c0c0c8'];
const _carCache = {};
function carSprite(type, color) {
  const key = type + color;
  if (_carCache[key]) return _carCache[key];
  const T = CARTYPES[type];
  const L = T.L, Wd = T.Wd;
  const c = mkCanvas(L + 2, Wd + 4), x = c.getContext('2d');
  const ox = 1, oy = 2;
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(ox + a, oy + b, w, h); };
  // ruedas
  R(3, -1, 5, Wd + 2, '#111'); R(L - 8, -1, 5, Wd + 2, '#111');
  let body = color;
  if (type === 'police') body = '#f0f0f0';
  if (type === 'taxi') body = '#2c8a4a';
  R(0, 0, L, Wd, body);
  x.clearRect(ox, oy, 1, 1); x.clearRect(ox + L - 1, oy, 1, 1); x.clearRect(ox, oy + Wd - 1, 1, 1); x.clearRect(ox + L - 1, oy + Wd - 1, 1, 1);
  R(1, 0, L - 2, 1, shade(body, 40));
  R(1, Wd - 1, L - 2, 1, shade(body, -50));
  const glass = '#26324e', gl = '#7fa8d8';
  if (type === 'troca') {
    R(1, 1, Math.floor(L * 0.42), Wd - 2, shade(body, -35));
    R(2, 2, Math.floor(L * 0.42) - 2, Wd - 4, shade(body, -60));
    const ws = Math.floor(L * 0.62);
    R(ws, 1, 3, Wd - 2, glass); R(ws + 2, 2, 1, 2, gl);
    R(Math.floor(L * 0.45), 1, ws - Math.floor(L * 0.45), Wd - 2, shade(body, 20));
    R(Math.floor(L * 0.45) - 1, 1, 1, Wd - 2, glass);
  } else if (type === 'van') {
    R(2, 1, L - 7, Wd - 2, shade(body, 15));
    R(L - 5, 1, 2, Wd - 2, glass); R(L - 4, 2, 1, 2, gl);
    R(5, Math.floor(Wd / 2) - 1, L - 12, 2, '#202020');
    x.fillStyle = '#f0f0f0'; x.fillRect(ox + 8, oy + 2, 2, 2); x.fillRect(ox + 14, oy + Wd - 4, 2, 2);
  } else if (type === 'vocho') {
    R(Math.floor(L * 0.22), 1, Math.floor(L * 0.5), Wd - 2, shade(body, 25));
    R(Math.floor(L * 0.68), 1, 2, Wd - 2, glass); R(Math.floor(L * 0.68), 2, 1, 2, gl);
    R(Math.floor(L * 0.2), 2, 1, Wd - 4, glass);
  } else {
    const ws = Math.floor(L * 0.58);
    R(Math.floor(L * 0.28), 1, ws - Math.floor(L * 0.28), Wd - 2, shade(body, type === 'police' ? -10 : 20));
    R(ws, 1, 3, Wd - 2, glass); R(ws + 2, 2, 1, 2, gl);
    R(Math.floor(L * 0.24), 1, 2, Wd - 2, glass);
    if (type === 'police') {
      R(Math.floor(L * 0.3), 0, Math.floor(L * 0.25), 1, '#202020');
      R(Math.floor(L * 0.3), Wd - 1, Math.floor(L * 0.25), 1, '#202020');
      R(Math.floor(L * 0.4), 2, 2, Math.floor(Wd / 2) - 2, '#d02020');
      R(Math.floor(L * 0.4), Math.floor(Wd / 2), 2, Math.floor(Wd / 2) - 2, '#2040e0');
    }
    if (type === 'taxi') { R(1, 0, L - 2, 1, '#f0f0f0'); R(Math.floor(L * 0.38), Math.floor(Wd / 2) - 1, 3, 2, '#f0e040'); }
    if (type === 'sport') { R(0, Math.floor(Wd / 2) - 1, L, 2, '#f0f0f0'); }
    if (type === 'suv') { R(Math.floor(L * 0.28), 1, ws - Math.floor(L * 0.28), Wd - 2, '#1a1a22'); }
  }
  // luces
  R(L - 1, 1, 1, 2, '#fff2a0'); R(L - 1, Wd - 3, 1, 2, '#fff2a0');
  R(0, 1, 1, 2, '#e02020'); R(0, Wd - 3, 1, 2, '#e02020');
  outlineCanvas(c);
  _carCache[key] = c;
  return c;
}

// ---------------- figuras (iconos 16x16) ----------------
const _figCache = {};
function figIcon(f, silhouette) {
  const key = f.id + (silhouette ? 's' : '');
  if (_figCache[key]) return _figCache[key];
  const c = mkCanvas(18, 18), x = c.getContext('2d');
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a + 1, b + 1, w, h); };
  const sil = silhouette ? '#3a3448' : null;
  const col = k => sil || k;
  // base
  P(3, 14, 10, 2, col('#505060')); P(4, 13, 8, 1, col('#707080'));
  // cuerpo / vestido
  P(6, 8, 4, 2, col(f.out)); P(5, 10, 6, 2, col(f.out)); P(4, 12, 8, 1, col(shade(f.out, -30)));
  P(7, 8, 2, 1, col(f.acc));
  // cara
  P(5, 3, 6, 5, col('#f4c8a0'));
  if (!sil) { P(6, 5, 1, 1, '#202040'); P(9, 5, 1, 1, '#202040'); P(7, 7, 2, 1, '#e08080'); }
  const hc = col(f.hair);
  switch (f.hs) {
    case 'twin': P(5, 2, 6, 2, hc); P(4, 3, 1, 3, hc); P(11, 3, 1, 3, hc); P(2, 4, 2, 6, hc); P(12, 4, 2, 6, hc); break;
    case 'long': P(5, 2, 6, 2, hc); P(4, 3, 1, 8, hc); P(11, 3, 1, 8, hc); break;
    case 'bob': P(4, 2, 8, 2, hc); P(4, 4, 1, 4, hc); P(11, 4, 1, 4, hc); break;
    case 'short': P(5, 2, 6, 2, hc); P(5, 4, 1, 1, hc); break;
    case 'spiky': P(5, 2, 6, 2, hc); P(4, 1, 1, 2, hc); P(6, 0, 1, 2, hc); P(9, 0, 1, 2, hc); P(11, 1, 1, 2, hc); break;
    case 'pony': P(5, 2, 6, 2, hc); P(11, 3, 2, 5, hc); break;
    case 'bun': P(5, 2, 6, 2, hc); P(6, 0, 4, 2, hc); break;
    case 'charro': P(1, 2, 14, 1, hc); P(5, 0, 6, 2, hc); P(4, 1, 1, 1, col(f.acc)); P(11, 1, 1, 1, col(f.acc)); break;
    case 'bald': P(5, 2, 6, 1, col('#f4c8a0')); break;
  }
  outlineCanvas(c);
  _figCache[key] = c;
  return c;
}

// ---------------- retratos especiales ----------------
function drawPortrait(ctx, who, x, y, scale) {
  scale = scale || 2;
  const sp = who === 'jesus' ? jesusSpec() : SPEC[who];
  if (!sp) return;
  if (sp.god) {
    // nube divina con lentes oscuros
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(x + 18, y + 20, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff';
    [[8, 24, 9], [28, 24, 9], [18, 14, 10]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(x + a, y + b, r, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#101010'; ctx.fillRect(x + 9, y + 18, 8, 4); ctx.fillRect(x + 20, y + 18, 8, 4); ctx.fillRect(x + 17, y + 19, 3, 1);
    ctx.fillStyle = '#c08060'; ctx.fillRect(x + 13, y + 27, 10, 2);
    ctx.strokeStyle = '#ffe060'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 18, y + 3, 10, 3, 0, 0, 7); ctx.stroke();
    return;
  }
  if (sp.phone) {
    ctx.fillStyle = '#202028'; ctx.fillRect(x + 8, y + 2, 20, 34);
    ctx.fillStyle = '#40ffa0'; ctx.fillRect(x + 10, y + 5, 16, 26);
    ctx.fillStyle = '#103020'; ctx.fillText('<3', x + 11, y + 14);
    return;
  }
  const s = charSprite(sp).down[0];
  ctx.drawImage(s, 0, 0, 18, 12, x, y, 18 * scale, 12 * scale);
}

// Spec actual de Jesús (cambia con pelo y mamadez)
function jesusSpec() {
  const sp = Object.assign({}, SPEC.jesus);
  if (typeof S !== 'undefined' && S) {
    sp.lvl = S.hair || 1;
    if (S.mamadez >= 60) sp.buff = 1;
    if (S.hair >= 4) sp.hair = '#6a4a20';
  }
  return sp;
}

// ---------------- jefe: MECHA-YESENIA ----------------
function drawMecha(ctx, x, y, t, hurt) {
  const X = Math.round(x), Y = Math.round(y);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X - 26, Y - 4, 52, 10);
  const bob = Math.round(Math.sin(t * 4) * 2);
  const R = (a, b, w, h, c) => { ctx.fillStyle = hurt ? '#ffffff' : c; ctx.fillRect(X + a, Y + b + bob, w, h); };
  // piernas
  R(-14, -18, 8, 18, '#7a7a8a'); R(6, -18, 8, 18, '#7a7a8a'); R(-16, -4, 12, 4, '#3a3a4a'); R(4, -4, 12, 4, '#3a3a4a');
  // falda
  R(-20, -30, 40, 12, '#ff70c0'); R(-20, -20, 40, 2, '#ffffff');
  // torso
  R(-14, -52, 28, 22, '#e0e0f0'); R(-6, -46, 12, 8, '#40ffa0');
  // brazos cañón
  R(-26, -50, 10, 22, '#9a9aaa'); R(16, -50, 10, 22, '#9a9aaa'); R(-25, -30, 8, 6, '#202028'); R(17, -30, 8, 6, '#202028');
  // cabeza
  R(-12, -72, 24, 20, '#f4c8a0');
  R(-16, -78, 32, 10, '#ff60c0'); R(-18, -70, 6, 26, '#ff60c0'); R(12, -70, 6, 26, '#ff60c0');
  R(-26, -76, 8, 22, '#ff60c0'); R(18, -76, 8, 22, '#ff60c0');
  // ojos
  const blink = (t % 3) < 0.15;
  R(-8, -64, 6, blink ? 1 : 5, '#40ffa0'); R(2, -64, 6, blink ? 1 : 5, '#40ffa0');
  R(-3, -56, 6, 2, '#d04060');
  // cabina del Lic
  R(-5, -86, 10, 8, '#26324e'); R(-3, -84, 6, 4, '#e0b090'); R(-3, -85, 6, 1, '#101010');
}
