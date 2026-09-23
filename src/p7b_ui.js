
// =====================================================================
//  HUD — floating labels, comic pops, speech bubbles, tour/help, speed lines
// =====================================================================
const LBL = [], POPS = [], SAYS = [], _k7cand = [];
let _k7ln = 0, _k7talk = 0;
const _k7o = V(), _k7p = V(), _k7o2 = V();
const PLACE_ICON = { 'West City': '🏙️', 'Capsule Corp.': '🧪', 'Kame House': '🐢', 'Korin Tower': '🗼', "Kami's Lookout": '☁️', "Goku's House": '🏠', 'Mt. Paozu': '⛰️', "Buu's House": '🍬',
  'World Tournament': '🥋', 'Cell Games Arena': '💥', 'Saiyan Pods': '🚀', "Frieza's Ship": '🛸', Volcano: '🌋', 'Dinosaur Jungle': '🦖', Wasteland: '🏜️', 'Snow Peaks': '🏔️', "King Kai's Planet": '🪐' };
// does the segment camera→p pass through the planet (or King Kai's little planet)?

function _k7hit(o, dir, L, cx, cy, cz, rad) {
  const ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * dir.x + oy * dir.y + oz * dir.z, c = ox * ox + oy * oy + oz * oz - rad * rad, disc = b * b - c;
  if (disc <= 0) return false; const t = -b - Math.sqrt(disc); return t > 0 && t < L;
}
function occluded(p) {
  const o = camera.position; _k7o.subVectors(p, o); const L = _k7o.length(); if (L < 1e-6) return false; _k7o.divideScalar(L);
  if (_k7hit(o, _k7o, L, 0, 0, 0, R - 0.35)) return true;
  if (KK) { const g = KK.grp.position; return _k7hit(o, _k7o, L, g.x, g.y, g.z, KK.rs - 0.18); }
  return false;
}
function entAnchor(e, out, frac = 1) {
  const m = e.obj.matrixWorld.elements; out.set(m[12], m[13], m[14]); _k7f.set(m[4], m[5], m[6]).normalize(); return out.addScaledVector(_k7f, e.labelY * frac);
}
function mkLabel(text, cls) {
  const el = document.createElement('div'); el.className = cls ? 'lbl ' + cls : 'lbl'; el.textContent = text; $('labels').appendChild(el);
  return { el, on: false, x: 1e9, y: 1e9, o: -1, place: null, ent: null, sx: 0, sy: 0 };
}
function syncEntLabels() { for (; _k7ln < ENT.length; _k7ln++) { const e = ENT[_k7ln]; if (!e.name) continue; const L = mkLabel(e.name, e.cls); L.ent = e; e.lbl = L; LBL.push(L); } }
function buildLabels() {
  const st = document.createElement('style');
  st.textContent = `.speech{position:absolute;left:0;top:0;max-width:230px;padding:5px 12px;background:#fff;border:3px solid var(--ink);border-radius:16px;box-shadow:3px 3px 0 var(--ink);
    font:700 14px 'Comic Neue','Comic Sans MS',sans-serif;color:var(--ink);text-align:center;will-change:transform;display:none;white-space:normal;line-height:1.2}
    .speech b{display:block;font-family:Bangers,Impact,sans-serif;font-weight:400;font-size:13px;letter-spacing:1px;color:#d35400}
    .speech::after{content:'';position:absolute;left:50%;bottom:-13px;margin-left:-9px;border:9px solid transparent;border-top-color:var(--ink);border-bottom:0}`;
  document.head.appendChild(st);
  for (const p of PLACES) { const L = mkLabel(`${p.icon || PLACE_ICON[p.name] || '📍'} ${p.name}`, 'place'); L.place = p; LBL.push(L); }
  syncEntLabels();
}
function labelAnchor(L, out) {
  const p = L.place;
  if (!p) return entAnchor(L.ent, out);
  if (p.obj) { p.obj.getWorldPosition(out); return out.addScaledVector(_k7f.copy(out).normalize(), 3.6); }
  return out.copy(p.dir).multiplyScalar(R + p.alt);
}
function showLabel(L, x, y, o) {
  if (!L.on) { L.el.style.display = 'block'; L.on = true; }
  const xi = Math.round(x), yi = Math.round(y);
  if (xi !== L.x || yi !== L.y) { L.el.style.transform = `translate(${xi}px,${yi}px) translate(-50%,-100%)`; L.x = xi; L.y = yi; }
  const oo = Math.round(clamp(o, 0, 1) * 20) / 20; if (oo !== L.o) { L.el.style.opacity = oo; L.o = oo; }
}
function hideLabel(L) { if (L.on) { L.el.style.display = 'none'; L.on = false; } }
function updateLabels(dt, t) {
  syncEntLabels();
  const cp = camera.position, W = innerWidth, H = innerHeight, fly = MODE === 'fly';
  _k7cand.length = 0;
  for (const L of LBL) {
    const e = L.ent;
    const ok = !SHEN.active && (!e || (e.obj.visible && e.vis !== false && !(fly && GOKU && e === GOKU.ent)));
    if (ok) {
      labelAnchor(L, _k7a); const d = cp.distanceTo(_k7a);
      let maxD, minD = 0.4;
      if (L.place) { maxD = Math.max(45, L.place.view * 8.5); minD = L.place.view * 0.3; }
      else if (e.kind === 'ball') maxD = fly ? 32 : 24;
      else maxD = Math.min(e.lodFar, 6 + e.labelY * 10);
      if (d < maxD && d > minD && !occluded(_k7a)) {
        _k7p.copy(_k7a).project(camera);
        if (_k7p.z < 1 && Math.abs(_k7p.x) < 1.05 && Math.abs(_k7p.y) < 1.05) {
          const o = Math.min(1, (maxD - d) / (maxD * 0.25), (d - minD) / (minD * 0.6 + 0.05));
          _k7cand.push({ L, d, x: (_k7p.x * 0.5 + 0.5) * W, y: (-_k7p.y * 0.5 + 0.5) * H, o });
          continue;
        }
      }
    }
    hideLabel(L);
  }
  _k7cand.sort((a, b) => a.d - b.d);
  let n = 0;
  for (const c of _k7cand) { if (!c.L.place && ++n > 22) { hideLabel(c.L); continue; } showLabel(c.L, c.x, c.y, c.o); c.L.sx = c.x; c.L.sy = c.y; }
  updatePops(dt); updateSays(dt);
}
// ---------- comic onomatopoeia pops (called from all over the world code)
function popAt(p, text, cls = '') {
  if (!p) return;
  const d = camera.position.distanceTo(p); if (d > 75 || POPS.length > 12 || occluded(p)) return;
  _k7p.copy(p).project(camera); if (_k7p.z > 1 || Math.abs(_k7p.x) > 1.1 || Math.abs(_k7p.y) > 1.1) return;
  const el = document.createElement('div'); el.className = cls ? 'pop ' + cls : 'pop'; el.textContent = text;
  const base = cls.indexOf('small') >= 0 ? 34 : 54; el.style.fontSize = Math.round(base * clamp(16 / (d + 4), 0.42, 1.1)) + 'px';
  $('pops').appendChild(el); const P = { el, p: p.clone(), t: 0 }; POPS.push(P); placePop(P);
}
function placePop(P) {
  _k7p.copy(P.p).project(camera);
  if (_k7p.z > 1) { P.el.style.display = 'none'; return; }
  P.el.style.display = ''; P.el.style.left = ((_k7p.x * 0.5 + 0.5) * innerWidth).toFixed(1) + 'px'; P.el.style.top = ((-_k7p.y * 0.5 + 0.5) * innerHeight).toFixed(1) + 'px';
}
function updatePops(dt) { for (let i = POPS.length - 1; i >= 0; i--) { const P = POPS[i]; P.t += dt; if (P.t > 1.25) { P.el.remove(); POPS.splice(i, 1); } else placePop(P); } }
// ---------- speech bubbles
function sayLine(e, text) {
  if (!e || !e.name) return;
  const lines = e.say && e.say.length ? e.say : e.kind === 'dino' ? ['ROOOAR!', 'Grrr...', '*sniff sniff*'] : e.kind === 'veh' ? ['Beep beep!', 'Honk honk!', 'Next stop: West City!'] : e.kind === 'ball' ? ['*shimmers mysteriously*'] : ['Hello there!', 'Nice day in the Dragon World!', 'Is that Goku?!', 'Did you see that explosion?'];
  let S = SAYS.find((x) => x.e === e);
  if (!S) { const el = document.createElement('div'); el.className = 'speech'; $('labels').appendChild(el); S = { el, e, t: 0, on: false }; SAYS.push(S); }
  S.el.innerHTML = ''; const b = document.createElement('b'); b.textContent = e.name; S.el.append(b, text || pick(lines));
  S.t = 3.6; e._said = performance.now();
}
function updateSays(dt) {
  for (let i = SAYS.length - 1; i >= 0; i--) {
    const S = SAYS[i]; S.t -= dt;
    if (S.t <= 0) { S.el.remove(); SAYS.splice(i, 1); continue; }
    const e = S.e; entAnchor(e, _k7a); _k7p.copy(_k7a).project(camera);
    if (!e.obj.visible || _k7p.z > 1 || occluded(_k7a) || camera.position.distanceTo(_k7a) > 40) { if (S.on) { S.el.style.display = 'none'; S.on = false; } continue; }
    if (!S.on) { S.el.style.display = 'block'; S.on = true; }
    const x = (_k7p.x * 0.5 + 0.5) * innerWidth, y = (-_k7p.y * 0.5 + 0.5) * innerHeight - (e.lbl && e.lbl.on ? 34 : 8);
    S.el.style.transform = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px) translate(-50%,-100%)`; S.el.style.opacity = Math.min(1, S.t * 2).toFixed(2);
  }
}
// Goku chats with whoever he flies past
function talkCheck(dt) {
  if (MODE !== 'fly' || !GOKU || SHEN.active) return; _k7talk -= dt; if (_k7talk > 0) return; _k7talk = 0.4;
  const now = performance.now(), gp = GOKU.pos; let best = null, bd = 1.8;
  for (const e of ENT) {
    if (!e.name || e === GOKU.ent || e.kind === 'veh' || e.kind === 'ball' || !e.obj.visible) continue; if (e._said && now - e._said < 12000) continue;
    const m = e.obj.matrixWorld.elements, d = Math.hypot(m[12] - gp.x, m[13] - gp.y, m[14] - gp.z); if (d < bd) { bd = d; best = e; }
  }
  if (best) sayLine(best);
}
// ---------- click picking: visible labels first, then characters near the cursor (screen space)
function pickAt(x, y) {
  let best = null, bd = 1e9;
  for (const L of LBL) {
    if (!L.on) continue; const dx = x - L.sx, dy = y - (L.sy - (L.place ? 15 : 12));
    if (Math.abs(dx) < 62 && Math.abs(dy) < 16) { const r = dx * dx * 0.25 + dy * dy; if (r < bd) { bd = r; best = L.place ? { place: L.place } : { e: L.ent }; } }
  }
  if (best) return best;
  const H = innerHeight, k = H / (2 * Math.tan((camera.fov * DEG) / 2));
  for (const e of ENT) {
    if (!e.name || !e.obj.visible || e.vis === false || (MODE === 'fly' && GOKU && e === GOKU.ent)) continue;
    entAnchor(e, _k7a, 0.5); const d = camera.position.distanceTo(_k7a); if (d > 80 || occluded(_k7a)) continue;
    _k7p.copy(_k7a).project(camera); if (_k7p.z > 1) continue;
    const sx = (_k7p.x * 0.5 + 0.5) * innerWidth, sy = (-_k7p.y * 0.5 + 0.5) * H, rad = Math.max(22, ((e.labelY * k) / d) * 0.6);
    const r = Math.hypot(sx - x, sy - y); if (r < rad && r / rad < bd) { bd = r / rad; best = { e }; }
  }
  return best;
}
// ---------- tour panel
const TOUR_FOLLOW = ['Goku', 'Vegeta', 'Piccolo', 'Future Trunks', 'Krillin', 'Majin Buu', 'Great Ape', 'Frieza', 'King Kai', 'T-Rex', 'Capsule Corp. Blimp', 'Capsule Jet'];
function buildTour() {
  const el = $('tour'); el.innerHTML = '';
  const hdr = (t) => { const h = document.createElement('div'); h.className = 'hdr'; h.textContent = t; el.appendChild(h); };
  const btn = (label, fn, title) => { const b = document.createElement('button'); b.className = 'cb'; b.textContent = label; if (title) b.title = title; b.onclick = (ev) => { ev.currentTarget.blur(); fn(); }; el.appendChild(b); };
  hdr('★ WORLD TOUR ▾'); const th = el.lastChild; th.classList.add('tg'); th.title = 'show / hide the tour';
  th.onclick = () => { el.classList.toggle('min'); th.textContent = el.classList.contains('min') ? '★ WORLD TOUR ▸' : '★ WORLD TOUR ▾'; layoutPanels(); };
  btn('🌍 Whole planet', () => { if (MODE === 'fly') setMode('orbit'); flyTo(CAM.d.clone(), innerWidth < innerHeight ? 190 : 112); });
  for (const p of PLACES) btn(`${p.icon || PLACE_ICON[p.name] || '📍'} ${p.name}`, () => gotoPlace(p), 'Fly the camera there (in Goku mode: Instant Transmission!)');
  hdr('★ FOLLOW');
  for (const n of TOUR_FOLLOW) { const e = ENT.find((x) => x.name === n); if (e) btn('🎥 ' + n, () => { followEnt(e); sayLine(e); }); }
}
// ---------- help panel
const HELP_ROWS = {
  orbit: [[['Drag'], 'spin the planet · pan'], [['Right-drag'], 'or Shift+drag: rotate & tilt'], [['Wheel'], 'zoom in to see the details'], [['Dbl-click'], 'swoop down to that spot'],
    [['Click'], 'a character: follow & chat'], [['W', 'A', 'S', 'D'], 'pan · Q/E turn · Z/X zoom'], [['G'], '☁️ FLY WITH GOKU!'], [['Esc'], 'stop following · H: hide help']],
  fly: [[['W', 'S'], 'fly forward · back'], [['A', 'D'], 'turn left · right'], [['Space', 'Q'], 'up · down (E / C too)'], [['Shift'], 'boost (ki aura!)'],
    [['K'], 'hold: charge Kamehameha (or F)'], [['K'], 'release: fire at the crosshair'], [['T'], 'transform (Super Saiyan)'], [['N'], 'jump off / on the Nimbus'],
    [['Drag'], 'look around · Wheel: distance'], [['G'], 'back to orbit · H: hide help']],
};
function renderHelp() {
  const rows = HELP_ROWS[MODE] || HELP_ROWS.orbit;
  $('helpBody').innerHTML = (MODE === 'fly' ? '<div class="row" style="color:#d35400"><b>★ Find the 7 Dragon Balls — use the radar!</b></div>' : '') +
    rows.map(([ks, txt]) => `<div class="row">${ks.map((k) => `<span class="k">${k}</span>`).join('')} ${txt}</div>`).join('');
  layoutPanels();
}
function toggleHelp() { $('help').classList.toggle('min'); layoutPanels(); }
// keep the tour list from running under the help card on short screens (it scrolls instead)
function layoutPanels() {
  const t = $('tour'), h = $('help'); if (!t || !h) return;
  const top = t.getBoundingClientRect().top, hr = h.getBoundingClientRect();
  const bottom = getComputedStyle(h).display === 'none' || hr.height === 0 ? innerHeight - 12 : hr.top - 10;
  t.style.maxHeight = Math.max(84, bottom - top) + 'px';
}
// ---------- anime speed lines, ki-charge streaks and crosshair (2D overlay)
let _k7sx = null, _k7sOn = false;
function drawSpeed(dt, t) {
  const c = $('speed'); if (!_k7sx) _k7sx = c.getContext('2d'); const x = _k7sx, W = c.width, H = c.height; if (!x) return;
  if (_k7sOn) { x.clearRect(0, 0, W, H); _k7sOn = false; }
  const g = GOKU; if (MODE !== 'fly' || !g || SHEN.active) return;
  const cx = W / 2, cy = H / 2, K = g.kame, ch = K.charging ? K.t / 2.6 : 0, M = Math.max(W, H);
  if (g.speedK > 0.03) {
    x.fillStyle = `rgba(26,18,38,${(0.5 * g.speedK).toFixed(3)})`; const n = Math.round(50 * g.speedK);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, w = 0.003 + Math.random() * 0.009, r0 = M * (0.3 + Math.random() * 0.25);
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a - w) * M, cy + Math.sin(a - w) * M); x.lineTo(cx + Math.cos(a + w) * M, cy + Math.sin(a + w) * M); x.closePath(); x.fill();
    }
  }
  if (ch > 0) {
    x.strokeStyle = `rgba(143,227,255,${(0.25 + ch * 0.5).toFixed(3)})`; x.lineWidth = 2;
    for (let i = 0; i < 10 + ch * 30; i++) { const a = Math.random() * TAU, r1 = M * (0.2 + Math.random() * 0.4), r0 = r1 * (0.55 + Math.random() * 0.25); x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.stroke(); }
  }
  const r = 9 + ch * 16;
  for (const [lw, col] of [[5, 'rgba(26,18,38,0.85)'], [2, ch > 0 ? '#8fe3ff' : '#ffffff']]) {
    x.lineWidth = lw; x.strokeStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, TAU);
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { x.moveTo(cx + ux * (r + 3), cy + uy * (r + 3)); x.lineTo(cx + ux * (r + 10), cy + uy * (r + 10)); }
    x.stroke();
  }
  _k7sOn = true;
}
