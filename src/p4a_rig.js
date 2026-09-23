
// =====================================================================
//  CHARACTER RIGS — unit-height toon humanoids (+ creatures)
//  root(scale S) -> hip(y=hip) -> [body mesh, armL, armR, legL, legR]
//  model +Z = forward, +X = character's left
// =====================================================================
const OLW = 0.035;
const BUILD = {
  normal: { hip: 0.36, legR: 0.052, lx: 0.07, tw: 0.27, td: 0.17, th: 0.3, sh: 0.165, armR: 0.042, armL: 0.29, hr: 0.14 },
  tall:   { hip: 0.41, legR: 0.054, lx: 0.075, tw: 0.29, td: 0.17, th: 0.33, sh: 0.172, armR: 0.043, armL: 0.33, hr: 0.135 },
  muscle: { hip: 0.38, legR: 0.07, lx: 0.09, tw: 0.39, td: 0.23, th: 0.34, sh: 0.225, armR: 0.066, armL: 0.32, hr: 0.125 },
  slim:   { hip: 0.37, legR: 0.044, lx: 0.062, tw: 0.23, td: 0.15, th: 0.29, sh: 0.145, armR: 0.035, armL: 0.28, hr: 0.14 },
  kid:    { hip: 0.24, legR: 0.045, lx: 0.06, tw: 0.22, td: 0.15, th: 0.22, sh: 0.13, armR: 0.036, armL: 0.21, hr: 0.16 },
  short:  { hip: 0.26, legR: 0.05, lx: 0.066, tw: 0.25, td: 0.17, th: 0.24, sh: 0.145, armR: 0.04, armL: 0.23, hr: 0.145 },
  fat:    { hip: 0.3, legR: 0.075, lx: 0.11, tw: 0.52, td: 0.46, th: 0.38, sh: 0.26, armR: 0.062, armL: 0.27, hr: 0.13 },
  ape:    { hip: 0.3, legR: 0.09, lx: 0.12, tw: 0.56, td: 0.42, th: 0.44, sh: 0.3, armR: 0.085, armL: 0.46, hr: 0.17 },
};
const HC = { black: '#25212f', gold: '#ffe14a', lav: '#c9a6ec', teal: '#2fc3cc', blonde: '#ffe07a', brown: '#6b4428', white: '#f4f4f4', orange: '#e8742a', red: '#c8402a', grey: '#9a98a6' };

// hair helpers (coordinates in head-radius units, head centre at (0, hy, 0))
function hs(P, c, hy, hr, b, d, len, rad) { spk(P, c, [b[0] * hr, hy + b[1] * hr, b[2] * hr], d, len * hr, rad * hr); }
function hsm(P, c, hy, hr, b, d, len, rad) { hs(P, c, hy, hr, b, d, len, rad); hs(P, c, hy, hr, [-b[0], b[1], b[2]], [-d[0], d[1], d[2]], len, rad); }
function hb(P, c, hy, hr, x, y, z, sx, sy, sz, rot = 0) { P.add(G.sph, c, [x * hr, hy + y * hr, z * hr], rot, [sx * hr, sy * hr, sz * hr]); }
function hbm(P, c, hy, hr, x, y, z, sx, sy, sz, rot = 0) { hb(P, c, hy, hr, x, y, z, sx, sy, sz, rot); hb(P, c, hy, hr, -x, y, z, sx, sy, sz, rot ? [rot[0], -rot[1], -rot[2]] : 0); }
const CAP = (P, c, hy, hr) => hb(P, c, hy, hr, 0, 0.2, -0.16, 1.03, 1.0, 1.05);

const HAIR = {
  goku(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    hsm(P, c, hy, hr, [0.35, 0.7, -0.15], [0.55, 0.85, -0.3], 1.0, 0.36);
    hs(P, c, hy, hr, [0, 0.82, -0.3], [0, 0.85, -0.6], 1.05, 0.38);
    hsm(P, c, hy, hr, [0.6, 0.45, -0.4], [0.85, 0.3, -0.45], 0.9, 0.32);
    hs(P, c, hy, hr, [0, 0.4, -0.85], [0, 0.15, -1], 0.9, 0.34);
    hsm(P, c, hy, hr, [0.45, 0.05, -0.75], [0.55, -0.35, -0.8], 0.75, 0.3);
    hsm(P, c, hy, hr, [0.8, 0.25, -0.05], [1, 0.05, 0.1], 0.6, 0.26);
    hsm(P, c, hy, hr, [0.75, -0.05, -0.35], [0.85, -0.45, -0.35], 0.55, 0.24);
    hs(P, c, hy, hr, [0.25, 0.8, 0.45], [0.35, -0.5, 1], 0.62, 0.2);
    hs(P, c, hy, hr, [-0.25, 0.78, 0.5], [-0.3, -0.45, 1], 0.6, 0.2);
    hs(P, c, hy, hr, [0.02, 0.88, 0.42], [0.1, -0.12, 1], 0.55, 0.19);
    hs(P, c, hy, hr, [-0.55, 0.6, 0.45], [-0.7, -0.6, 0.6], 0.5, 0.18);
    hs(P, c, hy, hr, [0.58, 0.58, 0.42], [0.75, -0.65, 0.55], 0.5, 0.18);
  },
  ssj(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    hsm(P, c, hy, hr, [0.32, 0.78, -0.1], [0.35, 1, -0.2], 1.25, 0.36);
    hs(P, c, hy, hr, [0, 0.88, -0.2], [0, 1, -0.35], 1.4, 0.4);
    hsm(P, c, hy, hr, [0.62, 0.52, -0.3], [0.8, 0.85, -0.35], 1.05, 0.33);
    hs(P, c, hy, hr, [0, 0.52, -0.75], [0, 0.6, -0.9], 1.1, 0.36);
    hsm(P, c, hy, hr, [0.45, 0.22, -0.7], [0.55, 0.4, -0.9], 0.9, 0.3);
    hsm(P, c, hy, hr, [0.8, 0.25, 0], [1, 0.5, 0], 0.7, 0.26);
    hs(P, c, hy, hr, [0.2, 0.84, 0.45], [0.3, -0.55, 1], 0.62, 0.18);
    hs(P, c, hy, hr, [-0.28, 0.82, 0.45], [-0.45, 0.25, 1], 0.5, 0.18);
  },
  ssj3(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    for (let k = -3; k <= 3; k++) { const x = k * 0.2; hs(P, c, hy, hr, [x, 0.35, -0.72], [x * 0.35, -1, -0.3], 4.3 - Math.abs(k) * 0.4, 0.55); }
    hsm(P, c, hy, hr, [0.5, 0.2, -0.5], [0.4, -1, -0.2], 3.2, 0.42);
    hsm(P, c, hy, hr, [0.3, 0.78, -0.2], [0.3, 0.9, -0.55], 1.0, 0.36);
    hs(P, c, hy, hr, [0, 0.85, -0.3], [0, 0.8, -0.7], 1.1, 0.38);
    hs(P, c, hy, hr, [0.2, 0.84, 0.45], [0.25, -0.7, 1], 0.7, 0.2);
    hs(P, c, hy, hr, [-0.25, 0.82, 0.45], [-0.3, -0.6, 1], 0.62, 0.19);
  },
  vegeta(P, c, hy, hr) {
    hb(P, c, hy, hr, 0, 0.26, -0.12, 1.0, 0.95, 1.02);
    hs(P, c, hy, hr, [0, 0.86, 0], [0, 1, -0.12], 1.4, 0.42);
    hsm(P, c, hy, hr, [0.35, 0.8, 0], [0.25, 1, -0.12], 1.3, 0.37);
    hsm(P, c, hy, hr, [0.62, 0.6, -0.1], [0.45, 1, -0.2], 1.05, 0.32);
    hs(P, c, hy, hr, [0, 0.72, -0.5], [0, 1, -0.42], 1.2, 0.38);
    hsm(P, c, hy, hr, [0.4, 0.6, -0.55], [0.3, 1, -0.4], 1.05, 0.33);
    hsm(P, c, hy, hr, [0.75, 0.35, -0.35], [0.55, 1, -0.3], 0.8, 0.28);
    hs(P, c, hy, hr, [0, 0.82, 0.5], [0, -0.65, 0.8], 0.45, 0.3);
    hsm(P, c, hy, hr, [0.38, 0.75, 0.52], [0.35, -0.15, 0.9], 0.32, 0.2);
  },
  gohan2(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    hsm(P, c, hy, hr, [0.3, 0.8, -0.05], [0.3, 1, -0.25], 1.2, 0.34);
    hs(P, c, hy, hr, [0, 0.9, -0.15], [0, 1, -0.4], 1.35, 0.38);
    hsm(P, c, hy, hr, [0.6, 0.55, -0.3], [0.75, 0.9, -0.4], 1.0, 0.31);
    hs(P, c, hy, hr, [0, 0.5, -0.78], [0, 0.55, -0.9], 1.0, 0.34);
    hsm(P, c, hy, hr, [0.8, 0.25, -0.05], [1, 0.45, -0.1], 0.65, 0.25);
    hsm(P, c, hy, hr, [0.4, 0.15, -0.75], [0.45, 0.25, -0.9], 0.8, 0.28);
    hs(P, c, hy, hr, [-0.15, 0.82, 0.52], [-0.12, -1, 0.55], 0.8, 0.14);
  },
  trunks(P, c, hy, hr) {
    hb(P, c, hy, hr, 0, 0.14, -0.1, 1.09, 1.03, 1.1);
    hbm(P, c, hy, hr, 0.74, -0.22, 0.02, 0.36, 0.72, 0.62);
    hb(P, c, hy, hr, 0, -0.18, -0.55, 0.94, 0.86, 0.58);
    hbm(P, c, hy, hr, 0.36, 0.56, 0.7, 0.44, 0.3, 0.26, [0, 0, 0.45]);
  },
  bob(P, c, hy, hr) {
    hb(P, c, hy, hr, 0, 0.14, -0.1, 1.1, 1.04, 1.12);
    hbm(P, c, hy, hr, 0.74, -0.3, 0.05, 0.42, 0.72, 0.66);
    hb(P, c, hy, hr, 0, -0.25, -0.5, 0.98, 0.85, 0.64);
    hb(P, c, hy, hr, 0, 0.62, 0.62, 0.8, 0.32, 0.36);
  },
  bob18(P, c, hy, hr) {
    hb(P, c, hy, hr, 0, 0.14, -0.1, 1.1, 1.04, 1.12);
    hbm(P, c, hy, hr, 0.76, -0.32, 0.08, 0.38, 0.7, 0.62);
    hb(P, c, hy, hr, 0, -0.28, -0.5, 0.98, 0.82, 0.64);
    hb(P, c, hy, hr, -0.25, 0.6, 0.64, 0.62, 0.34, 0.34, [0, 0, -0.35]);
    hb(P, c, hy, hr, 0.45, 0.66, 0.55, 0.4, 0.26, 0.3, [0, 0, 0.5]);
  },
  bun(P, c, hy, hr) {
    CAP(P, c, hy, hr); hb(P, c, hy, hr, 0, 0.38, -1.05, 0.46, 0.46, 0.46);
    hb(P, c, hy, hr, 0, 0.62, 0.62, 0.8, 0.3, 0.3); hbm(P, c, hy, hr, 0.82, -0.25, 0.2, 0.2, 0.55, 0.25);
  },
  raditz(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    for (let k = -3; k <= 3; k++) { const x = k * 0.2; hs(P, c, hy, hr, [x, 0.35, -0.78], [x * 0.25, -1, -0.32], 4.5 - Math.abs(k) * 0.35, 0.52); }
    hsm(P, c, hy, hr, [0.55, 0.15, -0.5], [0.35, -1, -0.3], 3.4, 0.4);
    hsm(P, c, hy, hr, [0.3, 0.8, -0.1], [0.35, 0.9, -0.4], 0.9, 0.33); hs(P, c, hy, hr, [0, 0.9, -0.1], [0, 0.9, -0.5], 1.0, 0.35);
    hs(P, c, hy, hr, [0.25, 0.8, 0.5], [0.3, -0.5, 1], 0.5, 0.18); hs(P, c, hy, hr, [-0.25, 0.8, 0.5], [-0.3, -0.5, 1], 0.5, 0.18);
  },
  yamcha(P, c, hy, hr) {
    CAP(P, c, hy, hr);
    hsm(P, c, hy, hr, [0.5, 0.6, -0.4], [0.5, 0.2, -0.8], 0.9, 0.34); hs(P, c, hy, hr, [0, 0.7, -0.6], [0, 0.1, -1], 1.0, 0.36);
    hsm(P, c, hy, hr, [0.3, 0.2, -0.85], [0.3, -0.6, -0.7], 1.0, 0.3); hs(P, c, hy, hr, [0, 0.1, -0.9], [0, -0.7, -0.6], 1.05, 0.32);
    hsm(P, c, hy, hr, [0.8, 0.2, -0.2], [0.9, -0.4, -0.2], 0.7, 0.26);
    hs(P, c, hy, hr, [0.2, 0.85, 0.45], [0.2, -0.6, 1], 0.55, 0.18); hs(P, c, hy, hr, [-0.25, 0.85, 0.45], [-0.3, -0.5, 1], 0.55, 0.18);
    hsm(P, c, hy, hr, [0.55, 0.65, 0.45], [0.6, -0.8, 0.5], 0.5, 0.16);
  },
  afro(P, c, hy, hr) { hb(P, c, hy, hr, 0, 0.45, -0.35, 1.28, 1.08, 1.18); },
  short(P, c, hy, hr) { hb(P, c, hy, hr, 0, 0.18, -0.14, 1.05, 1.0, 1.06); hb(P, c, hy, hr, 0, 0.66, 0.5, 0.75, 0.3, 0.4); },
  spiky(P, c, hy, hr) {
    CAP(P, c, hy, hr); hs(P, c, hy, hr, [0, 0.85, 0], [0, 1, 0.1], 0.6, 0.3); hsm(P, c, hy, hr, [0.4, 0.75, 0], [0.5, 0.9, 0], 0.55, 0.28);
    hs(P, c, hy, hr, [0, 0.5, -0.7], [0, 0.4, -1], 0.55, 0.3); hs(P, c, hy, hr, [0.1, 0.82, 0.45], [0.2, -0.3, 1], 0.45, 0.2);
  },
  pony(P, c, hy, hr) { CAP(P, c, hy, hr); hb(P, c, hy, hr, 0, 0.62, 0.6, 0.8, 0.3, 0.35); hs(P, c, hy, hr, [0, 0.3, -0.95], [0, -0.8, -0.4], 1.5, 0.3); },
  cap(P, c, hy, hr) { hb(P, c, hy, hr, 0, 0.35, -0.05, 1.06, 0.72, 1.08); P.add(G.cyl, c, [0, hy + 0.5 * hr, 0.75 * hr], [0.25, 0, 0], [0.62 * hr, 0.06 * hr, 0.55 * hr]); },
  piccolo(P, c, hy, hr) { hb(P, '#f7f5ee', hy, hr, 0, 0.28, -0.05, 1.08, 0.84, 1.1); hb(P, '#7a3fa0', hy, hr, 0, 0.72, -0.05, 0.8, 0.44, 0.8); },
  frieza(P, c, hy, hr) { hb(P, c, hy, hr, 0, 0.35, -0.08, 1.03, 0.8, 1.06); },
};

function faceParts(P, hy, hr, o) {
  const eye = o.eyes || 'normal', ey = o.eyeY ?? 0.02, ex = 0.37, big = o.b === 'kid' ? 1.18 : 1;
  const ink = '#1a1226';
  if (eye === 'glasses') {
    for (const s of [-1, 1]) P.add(G.sph, '#141420', [s * ex * hr * 0.95, hy + ey * hr, hr * 0.93], [0, s * 0.35, 0], [0.3 * hr, 0.22 * hr, 0.1 * hr]);
    P.add(G.box, '#141420', [0, hy + (ey + 0.06) * hr, hr * 1.0], 0, [0.3 * hr, 0.05 * hr, 0.05 * hr]);
  } else if (eye !== 'none') {
    for (const s of [-1, 1]) {
      const ax = s * ex, nx = Math.sin(ax) * Math.cos(ey), ny = Math.sin(ey), nz = Math.cos(ax) * Math.cos(ey), rot = [-ey, ax, 0];
      if (eye === 'closed') { P.add(G.box, ink, [nx * hr * 1.0, hy + ny * hr, nz * hr * 1.0], [-ey, ax, s * 0.15], [0.26 * hr, 0.04 * hr, 0.06 * hr]); continue; }
      P.add(G.sph, o.eyeW || '#ffffff', [nx * hr, hy + ny * hr, nz * hr], rot, [0.22 * hr * big, 0.29 * hr * big, 0.12 * hr]);
      const pk = eye === 'look' ? 0.06 : 0;
      P.add(G.sph, o.pupil || ink, [(nx - s * pk) * hr * 1.07, hy + ny * hr * 1.07, nz * hr * 1.07], rot, [0.12 * hr * big, 0.19 * hr * big, 0.08 * hr]);
      if (o.shine !== false) P.add(G.sph, '#ffffff', [(nx + 0.05) * hr * 1.11, hy + (ny + 0.07) * hr * 1.11, nz * hr * 1.11], rot, [0.035 * hr, 0.045 * hr, 0.03 * hr]);
    }
  }
  if (o.brows !== false && eye !== 'glasses') for (const s of [-1, 1]) {
    const ax = s * 0.33, ay = 0.3; const ang = o.angry ? 0.38 : -0.08;
    P.add(G.box, o.browC || o.hairC || ink, [Math.sin(ax) * hr * 1.02, hy + Math.sin(ay) * hr * 1.02, Math.cos(ax) * Math.cos(ay) * hr * 1.02], [-ay, ax, s * ang], [0.3 * hr, (o.thickBrow ? 0.1 : 0.06) * hr, 0.07 * hr]);
  }
  if (o.nose !== false) P.add(G.sph, o.skin, [0, hy - 0.12 * hr, 0.99 * hr], 0, [0.07 * hr, 0.07 * hr, 0.07 * hr]);
  if (o.mouth !== false) P.add(G.box, o.mouthC || '#7a2a33', [0, hy - 0.5 * hr, 0.9 * hr], [-0.5, 0, 0], [(o.smile ? 0.34 : 0.22) * hr, 0.045 * hr, 0.05 * hr]);
  const ears = o.ears || 'normal';
  if (ears === 'normal') for (const s of [-1, 1]) P.add(G.sph, o.skin, [s * hr * 0.97, hy, -0.02 * hr], 0, [0.17 * hr, 0.27 * hr, 0.12 * hr]);
  else if (ears === 'pointy') for (const s of [-1, 1]) P.addDir(G.coneLo, o.skin, [s * hr * 1.1, hy + 0.05 * hr, -0.05 * hr], [s, 0.35, -0.2], [0.14 * hr, 0.55 * hr, 0.1 * hr]);
  else if (ears === 'cat') for (const s of [-1, 1]) P.addDir(G.cone4, o.earC || o.skin, [s * hr * 0.55, hy + 0.85 * hr, -0.05 * hr], [s * 0.45, 1, 0], [0.3 * hr, 0.55 * hr, 0.14 * hr]);
  else if (ears === 'round') for (const s of [-1, 1]) P.add(G.sph, o.earC || o.skin, [s * hr * 0.95, hy + 0.35 * hr, -0.05 * hr], 0, [0.3 * hr, 0.3 * hr, 0.1 * hr]);
  else if (ears === 'dog') for (const s of [-1, 1]) P.add(G.sph, o.earC || '#6b4428', [s * hr * 0.92, hy + 0.05 * hr, -0.05 * hr], [0, 0, s * 0.3], [0.2 * hr, 0.52 * hr, 0.12 * hr]);
}

function armMesh(D, o, side) {
  const P = new PB(); const r = D.armR * (o.armK || 1), L = D.armL;
  P.add(G.sph, o.shoulderC || o.sleeve || o.top, [0, -r * 0.2, 0], 0, r * 1.38);
  P.add(capG(r, Math.max(0.01, L - 2 * r)), o.armC || o.skin, [0, -L / 2, 0]);
  if (o.sleeve && o.sleeveLen) { const sl = L * o.sleeveLen, rs = r * 1.2; P.add(capG(rs, Math.max(0.01, sl - 2 * rs)), o.sleeve, [0, -sl / 2, 0]); }
  if (o.wrist) P.add(G.cyl, o.wrist, [0, -L * 0.8, 0], 0, [r * 1.3, L * 0.2, r * 1.3]);
  if (o.glove) P.add(G.cyl, o.glove, [0, -L * 0.87, 0], 0, [r * 1.32, L * 0.16, r * 1.32]);
  P.add(G.sph, o.glove || o.handC || o.skin, [0, -L - r * 0.2, r * 0.1], 0, [r * 1.3, r * 1.4, r * 1.35]);
  if (o.armExtra) o.armExtra(P, side, D, r, L);
  return P.mesh(OLW);
}
function legMesh(D, o, side) {
  const P = new PB(); const r = D.legR, H = D.hip, pl = o.pantsLen ?? 1, pr = r * (o.baggy ? 1.32 : 1.05), LL = H - 0.03;
  if (pl < 1) P.add(capG(r * 0.85, Math.max(0.01, LL - 2 * r * 0.85)), o.legC || o.skin, [0, -LL / 2, 0]);
  if (pl > 0) { const L = LL * pl; P.add(capG(pr, Math.max(0.01, L - 2 * pr)), o.pants, [0, -L / 2, 0]); }
  const bc = o.boots || '#3a3a48';
  if (o.shoe === 'shoe') P.add(G.rbox, bc, [0, -H + 0.026, r * 0.6], 0, [r * 2.1, 0.052, r * 3.3]);
  else if (o.shoe !== 'none') {
    P.add(capG(r * 1.12, 0.07), bc, [0, -H + 0.085, 0]); P.add(G.rbox, bc, [0, -H + 0.027, r * 0.6], 0, [r * 2.25, 0.055, r * 3.5]);
    if (o.bootTop) P.add(G.cyl, o.bootTop, [0, -H + 0.16, 0], 0, [r * 1.2, 0.03, r * 1.2]);
  }
  if (o.legExtra) o.legExtra(P, side, D);
  return P.mesh(OLW);
}

function mkHuman(o) {
  const D = BUILD[o.b || 'normal']; const S = o.S ?? 0.3;
  const { tw, td, th, hr: hr0 } = D; const hr = hr0 * (o.headK || 1);
  const root = new THREE.Group(), hip = new THREE.Group(); hip.position.y = D.hip; root.add(hip);
  const P = new PB(); const top = o.top, pants = o.pants || top;
  P.add(G.sph, pants, [0, 0.01, 0], 0, [tw * 0.43, 0.09, td * 0.47]);
  if (o.b === 'fat' || o.b === 'ape') {
    P.add(G.sph, top, [0, th * 0.42, 0.01], 0, [tw * 0.5, th * 0.56, td * 0.52]);
    if (o.belly) P.add(G.sph, o.belly, [0, th * 0.34, td * 0.18], 0, [tw * 0.36, th * 0.36, td * 0.36]);
  } else {
    P.add(G.sph, top, [0, th * 0.25, 0], 0, [tw * 0.42, th * 0.36, td * 0.46]);
    P.add(G.sph, top, [0, th * 0.66, 0], 0, [tw * 0.54, th * 0.4, td * 0.52]);
  }
  if (o.under) P.add(G.cone, o.under, [0, th * 0.8, td * 0.4], [Math.PI, 0, 0], [tw * 0.2, th * 0.36, td * 0.12]);
  if (o.belt) { P.add(G.cyl, o.belt, [0, 0.07, 0], 0, [tw * 0.45, 0.055, td * 0.49]); if (o.beltKnot !== false) { P.add(G.sph, o.belt, [0.035, 0.06, td * 0.48], 0, [0.03, 0.03, 0.02]); P.add(G.box, o.belt, [0.05, -0.015, td * 0.47], [0, 0, 0.2], [0.024, 0.08, 0.012]); } }
  if (o.armor) {
    P.add(G.sph, o.armor, [0, th * 0.68, 0], 0, [tw * 0.58, th * 0.43, td * 0.58]);
    P.add(G.cyl, o.armorB || o.armor, [0, th * 0.36, 0], 0, [tw * 0.47, th * 0.12, td * 0.5]);
    if (o.pad) for (const s of [-1, 1]) { P.add(G.sph, o.pad, [s * D.sh * 1.1, th * 0.97, 0], [0, 0, s * -0.35], [0.11, 0.05, 0.1]); P.add(G.box, o.pad, [s * tw * 0.18, th * 0.9, 0], 0, [0.04, 0.03, td * 1.1]); }
    for (const [x, z] of [[0.09, 1], [-0.09, 1], [0.13, -1], [-0.13, -1]]) P.add(G.rbox, o.armor, [x * tw / 0.27, -0.03, z * td * 0.42], [z * 0.15, 0, 0], [0.085, 0.1, 0.022]);
  }
  if (o.dress) { const hh = D.hip * 0.62 + 0.12; P.add(G.skirt, o.dress, [0, 0.12 - hh / 2, 0], 0, [tw * 0.58, hh, td * 0.66]); }
  if (o.cape) { const L = th + D.hip * 0.72; P.add(G.skirt, o.cape, [0, th * 0.96 - L / 2, -td * 0.62], [0.1, 0, 0], [tw * 0.66, L, 0.045]); if (o.capePad) for (const s of [-1, 1]) P.add(G.rbox, o.capePad, [s * D.sh * 0.95, th * 1.0, -0.005], [0, 0, s * -0.25], [0.13, 0.05, 0.16]); }
  // neck + head
  const hy = th + 0.015 + hr * 0.92 + (o.neckUp || 0);
  if (o.b !== 'fat' && o.b !== 'ape') P.add(G.cylLo, o.neckC || o.skin, [0, th + 0.02, 0], 0, [hr * 0.36, 0.08, hr * 0.36]);
  P.add(G.sph, o.headC || o.skin, [0, hy, 0], 0, [hr, hr * 1.02, hr * 0.98]);
  if (o.chin !== false) P.add(G.sph, o.headC || o.skin, [0, hy - 0.5 * hr, 0.3 * hr], 0, [0.58 * hr, 0.5 * hr, 0.6 * hr]);
  const fo = Object.assign({}, o, { skin: o.headC || o.skin });
  faceParts(P, hy, hr, fo);
  if (o.hair && HAIR[o.hair]) {
    const c = o.hairC || HC.black;
    HAIR[o.hair](P, c, hy, hr);
  }
  if (o.extra) o.extra(P, D, hy, hr);
  const body = P.mesh(OLW); hip.add(body);
  const armL = new THREE.Group(), armR = new THREE.Group(), legL = new THREE.Group(), legR = new THREE.Group();
  armL.position.set(D.sh, th * 0.86, 0); armR.position.set(-D.sh, th * 0.86, 0);
  legL.position.set(D.lx, 0, 0); legR.position.set(-D.lx, 0, 0);
  armL.add(armMesh(D, o, 1)); armR.add(armMesh(D, o, -1)); legL.add(legMesh(D, o, 1)); legR.add(legMesh(D, o, -1));
  hip.add(armL, armR, legL, legR);
  root.scale.setScalar(S);
  return finishRig({ root, hip, armL, armR, legL, legR, D, S, hy, hr, h: D.hip + hy + hr });
}
function finishRig(rig) {
  rig.cur = new Float32Array(10); rig.ph = rand() * TAU; rig.ols = [];
  rig.root.traverse((m) => { if (m.material && m.material.userData && m.material.userData.isOutline) rig.ols.push(m); });
  return rig;
}

// ---------------------------------------------------------------------
//  POSES (targets for 10 channels, damped)
//  [lean, bob, armL.x, armL.z, armR.x, armR.z, legL.x, legL.z, legR.x, legR.z]
// ---------------------------------------------------------------------
const POSE = new Float32Array(10);
function pose(mode, ph, t) {
  const T = POSE; T.fill(0); const s = Math.sin(ph), c = Math.cos(ph), br = Math.sin(t * 2.1);
  switch (mode) {
    case 'idle': T[1] = br * 0.006; T[2] = 0.04; T[3] = 0.12 + br * 0.02; T[4] = 0.04; T[5] = -0.12 - br * 0.02; break;
    case 'walk': T[0] = 0.05; T[1] = Math.abs(c) * 0.018; T[6] = s * 0.55; T[8] = -s * 0.55; T[2] = -s * 0.45; T[4] = s * 0.45; T[3] = 0.1; T[5] = -0.1; break;
    case 'waddle': T[0] = 0.02; T[1] = Math.abs(c) * 0.03; T[6] = s * 0.35; T[8] = -s * 0.35; T[2] = -s * 0.3; T[4] = s * 0.3; T[3] = 0.35; T[5] = -0.35; break;
    case 'run': T[0] = 0.3; T[1] = Math.abs(c) * 0.045; T[6] = s * 0.95; T[8] = -s * 0.95; T[2] = -s * 0.9 - 0.25; T[4] = s * 0.9 - 0.25; T[3] = 0.18; T[5] = -0.18; break;
    case 'fly': T[0] = 1.25; T[1] = Math.sin(t * 3) * 0.015; T[2] = 0.25; T[3] = 0.18; T[4] = 0.25; T[5] = -0.18; T[6] = 0.08; T[8] = 0.42; break;
    case 'flyFist': T[0] = 1.3; T[2] = -2.9; T[3] = 0.05; T[4] = 0.3; T[5] = -0.2; T[6] = 0.05; T[8] = 0.35; break;
    case 'hover': T[0] = 0.08; T[1] = Math.sin(t * 2.4) * 0.02; T[2] = 0.1; T[3] = 0.25; T[4] = 0.1; T[5] = -0.25; T[6] = -0.35; T[7] = 0.05; T[8] = 0.12; T[9] = -0.05; break;
    case 'stance': T[0] = 0.12; T[1] = -0.02 + Math.sin(t * 5) * 0.006; T[2] = -1.25; T[3] = 0.45; T[4] = -0.9; T[5] = -0.5; T[6] = -0.45; T[7] = 0.1; T[8] = 0.35; T[9] = -0.1; break;
    case 'punchL': T[0] = 0.24; T[1] = -0.02; T[2] = -1.62; T[3] = 0.05; T[4] = -0.7; T[5] = -0.55; T[6] = -0.5; T[7] = 0.1; T[8] = 0.45; T[9] = -0.1; break;
    case 'punchR': T[0] = 0.24; T[1] = -0.02; T[2] = -0.7; T[3] = 0.55; T[4] = -1.62; T[5] = -0.05; T[6] = -0.5; T[7] = 0.1; T[8] = 0.45; T[9] = -0.1; break;
    case 'kick': T[0] = -0.3; T[2] = -1.0; T[3] = 0.6; T[4] = -0.6; T[5] = -0.7; T[6] = 0.12; T[8] = -1.6; break;
    case 'hurt': T[0] = -0.5; T[2] = 0.3; T[3] = 1.1; T[4] = 0.3; T[5] = -1.1; T[6] = -0.45; T[8] = -0.2; break;
    case 'block': T[0] = 0.05; T[2] = -1.9; T[3] = -0.55; T[4] = -1.9; T[5] = 0.55; T[6] = -0.3; T[8] = 0.3; break;
    case 'crossed': T[1] = Math.sin(t * 1.8) * 0.004; T[2] = -1.35; T[3] = -0.95; T[4] = -1.22; T[5] = 0.95; T[7] = 0.08; T[9] = -0.08; break;
    case 'meditate': T[1] = Math.sin(t * 1.5) * 0.02; T[6] = -1.45; T[7] = 0.75; T[8] = -1.45; T[9] = -0.75; T[2] = -0.55; T[3] = 0.5; T[4] = -0.55; T[5] = -0.5; break;
    case 'sit': T[0] = -0.5; T[6] = -1.4; T[8] = -1.4; T[7] = 0.08; T[9] = -0.08; T[2] = 0.2; T[3] = 0.3; T[4] = -2.8; T[5] = 0.5; break;
    case 'seat': T[0] = -0.1; T[6] = -1.45; T[8] = -1.45; T[7] = 0.1; T[9] = -0.1; T[2] = -0.4; T[3] = 0.2; T[4] = -0.4; T[5] = -0.2; break;
    case 'cheer': { const j = Math.abs(Math.sin(t * 6 + ph)); T[1] = j * 0.06; T[3] = 2.5 + Math.sin(t * 12 + ph) * 0.3; T[5] = -2.5 - Math.sin(t * 12 + ph) * 0.3; T[2] = -0.2; T[4] = -0.2; T[6] = -j * 0.2; T[8] = -j * 0.2; break; }
    case 'wave': T[1] = br * 0.006; T[2] = 0.04; T[3] = 0.12; T[4] = -0.25; T[5] = -2.55 + Math.sin(t * 9) * 0.35; break;
    case 'flex': T[0] = -0.08; T[2] = -0.3; T[3] = 1.45; T[4] = -0.3; T[5] = -1.45; T[7] = 0.22; T[9] = -0.22; break;
    case 'victory': T[0] = -0.1; T[1] = Math.abs(Math.sin(t * 3)) * 0.02; T[2] = -1.2; T[3] = 0.5; T[4] = -0.3; T[5] = -2.9; T[7] = 0.15; T[9] = -0.15; break;
    case 'point': T[1] = br * 0.005; T[2] = 0.05; T[3] = 0.15; T[4] = -1.55; T[5] = -0.08; break;
    case 'roar': { const b = Math.sin(t * 14); T[0] = -0.3; T[2] = -1.6 + b * 0.25; T[3] = -0.45; T[4] = -1.6 - b * 0.25; T[5] = 0.45; T[7] = 0.2; T[9] = -0.2; break; }
    case 'kame': T[0] = 0.12; T[1] = -0.04; T[2] = -1.55; T[3] = -0.28; T[4] = -1.55; T[5] = 0.28; T[6] = -0.5; T[7] = 0.25; T[8] = 0.5; T[9] = -0.25; break;
    case 'charge': T[0] = 0.05; T[1] = -0.04; T[2] = 0.75; T[3] = -0.35; T[4] = 0.75; T[5] = 0.35; T[6] = -0.35; T[7] = 0.3; T[8] = 0.35; T[9] = -0.3; break;
    case 'powerup': { const q = Math.sin(t * 40) * 0.01; T[0] = -0.12; T[1] = -0.04 + q; T[2] = 0.2; T[3] = 0.55; T[4] = 0.2; T[5] = -0.55; T[7] = 0.3; T[9] = -0.3; break; }
    case 'think': T[1] = br * 0.005; T[2] = -1.1; T[3] = -0.6; T[4] = -2.3; T[5] = 0.25; break;
    case 'dance': { const d = Math.sin(t * 5); T[0] = d * 0.1; T[1] = Math.abs(Math.sin(t * 5)) * 0.03; T[2] = -0.5 + d * 0.6; T[3] = 1.0; T[4] = -0.5 - d * 0.6; T[5] = -1.0; T[6] = -Math.max(0, d) * 0.5; T[8] = -Math.max(0, -d) * 0.5; break; }
  }
  return T;
}
function applyPose(rig, T, k) {
  const c = rig.cur; for (let i = 0; i < 10; i++) c[i] += (T[i] - c[i]) * k;
  rig.hip.rotation.x = c[0]; rig.hip.position.y = rig.D.hip + c[1];
  rig.armL.rotation.set(c[2], 0, c[3]); rig.armR.rotation.set(c[4], 0, c[5]);
  rig.legL.rotation.set(c[6], 0, c[7]); rig.legR.rotation.set(c[8], 0, c[9]);
}

// ---------------------------------------------------------------------
//  CAST DEFINITIONS
// ---------------------------------------------------------------------
const SK = '#ffd8b5', SK2 = '#f2c095', SK3 = '#c98a5c', SK4 = '#8a5a3c';
const CHAR = {
  goku: { hair: 'goku', hairC: HC.black, skin: SK, top: '#ff7a1a', under: '#2455c8', pants: '#ff7a1a', baggy: true, belt: '#2455c8', boots: '#1f3f9a', bootTop: '#e0302a', sleeve: '#2455c8', sleeveLen: 0.18, wrist: '#2455c8', angry: true },
  vegeta: { b: 'normal', hair: 'vegeta', hairC: HC.black, skin: SK, top: '#2a4fb0', pants: '#2a4fb0', armor: '#f7f5ee', armorB: '#e8c34a', sleeve: '#2a4fb0', sleeveLen: 0.85, glove: '#f7f5ee', boots: '#f7f5ee', bootTop: '#e8c34a', angry: true },
  gohan: { hair: 'gohan2', hairC: HC.gold, skin: SK, top: '#7b3fb3', pants: '#7b3fb3', baggy: true, belt: '#d8322a', boots: '#6b4428', wrist: '#d8322a', angry: true, pupil: '#1e8fa0' },
  goten: { b: 'kid', S: 0.3, hair: 'goku', hairC: HC.black, skin: SK, top: '#ff7a1a', under: '#2455c8', pants: '#ff7a1a', baggy: true, belt: '#2455c8', boots: '#1f3f9a', sleeve: '#2455c8', sleeveLen: 0.2, wrist: '#2455c8', smile: true },
  trunks: { hair: 'trunks', hairC: HC.lav, skin: SK, top: '#2a2a33', pants: '#8a8f9e', sleeve: '#2d5db8', sleeveLen: 0.55, shoulderC: '#2d5db8', boots: '#e8b02a', shoe: 'boot', belt: '#6b4a2a', beltKnot: false,
    extra(P, D) { P.add(G.sph, '#2d5db8', [0, D.th * 0.62, -0.005], 0, [D.tw * 0.57, D.th * 0.44, D.td * 0.56]); P.add(G.box, '#2a2a33', [0, D.th * 0.62, D.td * 0.5], 0, [D.tw * 0.35, D.th * 0.8, 0.03]);
      P.add(G.box, '#6b4a2a', [0.03, D.th * 0.62, -D.td * 0.62], [0, 0, 0.55], [0.028, 0.5, 0.022]); P.add(G.cylLo, '#e8c050', [-0.12, D.th * 1.06, -D.td * 0.62], [0, 0, 0.55], [0.018, 0.1, 0.018]); P.add(G.box, '#e8c050', [-0.09, D.th * 1.0, -D.td * 0.62], [0, 0, 0.55], [0.08, 0.018, 0.03]); } },
  bulma: { b: 'slim', hair: 'bob', hairC: HC.teal, skin: SK, top: '#ff5f8f', dress: '#ff5f8f', pants: '#ff5f8f', pantsLen: 0.3, boots: '#f5f5f5', shoe: 'shoe', eyes: 'normal', pupil: '#2a7fd0', smile: true,
    extra(P, D) { P.add(G.box, '#ffffff', [0, D.th * 0.68, D.td * 0.5], 0, [0.09, 0.05, 0.01]); } },
  chichi: { b: 'slim', hair: 'bun', hairC: HC.black, skin: SK, top: '#9b4fc9', dress: '#9b4fc9', pants: '#f0d9c0', pantsLen: 0.9, boots: '#3a2a3a', shoe: 'shoe', belt: '#ffcf33', beltKnot: false, sleeve: '#9b4fc9', sleeveLen: 0.95, wrist: '#ffcf33' },
  krillin: { b: 'short', hair: null, skin: SK, top: '#ff7a1a', under: '#2455c8', pants: '#ff7a1a', baggy: true, belt: '#2455c8', boots: '#1f3f9a', sleeve: '#2455c8', sleeveLen: 0.2, wrist: '#2455c8', ears: 'normal', smile: true,
    extra(P, D, hy, hr) { for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * 0.22, y = i < 3 ? 0.62 : 0.46; P.add(G.sphLo, '#c96e4a', [x * hr, hy + y * hr, Math.sqrt(Math.max(0, 1 - x * x - y * y)) * hr * 0.99], 0, 0.045 * hr); } } },
  a18: { b: 'slim', hair: 'bob18', hairC: HC.blonde, skin: SK, top: '#3b6fc9', pants: '#1c1c28', dress: '#3b6fc9', sleeve: '#e8e8f0', sleeveLen: 0.9, boots: '#8a5a33', shoe: 'boot', pupil: '#3a8fd6',
    extra(P, D) { P.add(G.box, '#1c1c28', [0, D.th * 0.7, D.td * 0.5], 0, [D.tw * 0.28, D.th * 0.6, 0.02]); } },
  roshi: { b: 'short', hair: null, skin: SK2, top: '#ff8c2a', pants: '#e8d8b0', pantsLen: 0.55, boots: '#6b4428', shoe: 'shoe', eyes: 'glasses', brows: false,
    extra(P, D, hy, hr) {
      P.add(G.cone, '#fbfbf7', [0, hy - 1.2 * hr, 0.75 * hr], [Math.PI + 0.25, 0, 0], [0.5 * hr, 1.6 * hr, 0.35 * hr]);
      hbm(P, '#fbfbf7', hy, hr, 0.3, -0.3, 0.9, 0.34, 0.14, 0.14, [0, 0, 0.35]); hbm(P, '#fbfbf7', hy, hr, 0.62, 0.52, 0.62, 0.3, 0.12, 0.12, [0, 0.5, 0.4]);
      P.add(G.hemi, '#3f9a4a', [0, D.th * 0.5, -D.td * 0.45], [-Math.PI / 2, 0, 0], [D.tw * 0.62, D.td * 0.8, D.th * 0.6]);
      P.add(G.cyl, '#ffe8a0', [0, D.th * 0.5, -D.td * 0.45], [Math.PI / 2, 0, 0], [D.tw * 0.63, 0.02, D.th * 0.61]);
      for (let i = 0; i < 5; i++) P.add(G.sph, '#fff1a8', [(i % 3 - 1) * 0.06, D.th * (0.3 + 0.2 * Math.floor(i / 2)), -D.td * 0.45 - D.td * 0.6], 0, [0.03, 0.03, 0.01]);
    },
    armExtra(P, side, D, r, L) { if (side < 0) P.add(G.cylLo, '#9a6a3a', [0, -L + 0.02, r * 0.3], 0, [0.014, 0.5, 0.014]); } },
  piccolo: { b: 'tall', hair: 'piccolo', skin: '#6cc24a', top: '#7a3fa0', pants: '#7a3fa0', baggy: true, belt: '#3a8fd6', boots: '#7a4a2a', wrist: '#d8322a', ears: 'pointy', cape: '#f7f5ee', capePad: '#f7f5ee', angry: true,
    extra(P, D) { P.add(G.box, '#5aa23e', [0, D.th * 0.66, D.td * 0.5], 0, [D.tw * 0.18, D.th * 0.3, 0.01]); } },
  dende: { b: 'kid', S: 0.28, hair: null, skin: '#6cc24a', top: '#f2f2f7', dress: '#f2f2f7', pants: '#f2f2f7', belt: '#7a3fa0', beltKnot: false, boots: '#7a4a2a', shoe: 'shoe', ears: 'pointy', sleeve: '#f2f2f7', sleeveLen: 0.8, smile: true,
    extra(P, D, hy, hr) { for (const s of [-1, 1]) { hs(P, '#5aa23e', hy, hr, [s * 0.25, 0.88, 0.35], [s * 0.2, 1, 0.3], 0.8, 0.09); hb(P, '#5aa23e', hy, hr, s * 0.43, 1.65, 0.6, 0.1, 0.1, 0.1); } P.add(G.box, '#7a3fa0', [0, D.th * 0.66, D.td * 0.52], 0, [0.06, D.th * 0.5, 0.012]); } },
  tien: { b: 'tall', hair: null, skin: SK, top: '#2f7a4a', pants: '#f0e0c0', baggy: true, belt: '#d8322a', boots: '#2a2a33', angry: true,
    extra(P, D, hy, hr) { P.add(G.sph, '#ffffff', [0, hy + 0.42 * hr, 0.92 * hr], [-0.45, 0, 0], [0.13 * hr, 0.2 * hr, 0.08 * hr]); P.add(G.sph, '#1a1226', [0, hy + 0.43 * hr, 0.98 * hr], [-0.45, 0, 0], [0.07 * hr, 0.13 * hr, 0.06 * hr]); } },
  yamcha: { hair: 'yamcha', hairC: HC.black, skin: SK2, top: '#ff7a1a', under: '#2455c8', pants: '#ff7a1a', baggy: true, belt: '#2455c8', boots: '#1f3f9a', sleeve: '#2455c8', sleeveLen: 0.2, wrist: '#2455c8', angry: true,
    extra(P, D, hy, hr) { P.add(G.box, '#b8653a', [0.33 * hr, hy + 0.05 * hr, 0.93 * hr], [0, 0.35, 0.9], [0.03 * hr, 0.35 * hr, 0.03 * hr]); P.add(G.box, '#b8653a', [-0.2 * hr, hy - 0.3 * hr, 0.93 * hr], [0, -0.2, 0.5], [0.03 * hr, 0.25 * hr, 0.03 * hr]); } },
  satan: { b: 'muscle', S: 0.3, hair: 'afro', hairC: HC.black, skin: SK2, top: '#f7f5ee', under: '#f7f5ee', pants: '#f7f5ee', baggy: true, belt: '#ffcf33', boots: '#e8b02a', wrist: '#ffcf33', cape: '#d8322a', thickBrow: true, smile: true,
    extra(P, D, hy, hr) { for (const s of [-1, 1]) P.add(G.sph, '#25212f', [s * 0.18 * hr, hy - 0.3 * hr, 0.93 * hr], [0, 0, s * 0.4], [0.24 * hr, 0.07 * hr, 0.08 * hr]); P.add(G.cyl, '#ffcf33', [0, 0.08, D.td * 0.45], [Math.PI / 2, 0, 0], [0.05, 0.02, 0.05]); } },
  announcer: { hair: 'short', hairC: HC.blonde, skin: SK, top: '#2c2c3c', pants: '#2c2c3c', under: '#ffffff', eyes: 'glasses', boots: '#1a1a22', shoe: 'shoe', smile: true,
    extra(P, D) { P.add(G.sph, '#d8322a', [0, D.th * 0.95, D.td * 0.45], 0, [0.04, 0.02, 0.02]); },
    armExtra(P, side, D, r, L) { if (side < 0) { P.add(G.cylLo, '#2a2a2a', [0, -L - 0.01, r * 1.4], [Math.PI / 2, 0, 0], [0.012, 0.09, 0.012]); P.add(G.sphLo, '#6a6a6a', [0, -L - 0.01, r * 1.4 + 0.05], 0, 0.02); } } },
  nappa: { b: 'muscle', hair: null, skin: SK2, top: '#2a3f8f', pants: '#2a3f8f', armor: '#f7f5ee', armorB: '#caa25a', pad: '#caa25a', glove: '#f7f5ee', boots: '#f7f5ee', bootTop: '#caa25a', angry: true, thickBrow: true, browC: '#25212f',
    extra(P, D, hy, hr) { for (const s of [-1, 1]) hs(P, '#25212f', hy, hr, [s * 0.15, -0.22, 0.93], [s * 0.6, -0.8, 0.2], 0.45, 0.12); scouter(P, hy, hr); } },
  raditz: { hair: 'raditz', hairC: HC.black, skin: SK2, top: '#2a2a3a', pants: '#2a2a3a', armor: '#2e2e3a', armorB: '#6a4a8a', pad: '#6a4a8a', glove: '#f7f5ee', boots: '#f7f5ee', wrist: '#d8322a', angry: true,
    extra(P, D, hy, hr) { scouter(P, hy, hr); P.add(G.torus, '#6b4428', [0, 0.07, 0], [Math.PI / 2, 0, 0], [D.tw * 0.47, D.td * 0.52, 0.2]); } },
  saibaman: { b: 'kid', S: 0.24, hair: null, skin: '#4fae3f', top: '#4fae3f', pants: '#3f9a33', boots: '#3f9a33', shoe: 'shoe', eyes: 'normal', eyeW: '#e0402a', pupil: '#5a0a0a', brows: false, ears: 'none', nose: false, headK: 1.15, mouthC: '#1a1226',
    extra(P, D, hy, hr) { for (let i = 0; i < 7; i++) { const a = rr(0, TAU), b = rr(0.2, 1.2); P.add(G.sphLo, '#a6e05a', [Math.cos(a) * Math.sin(b) * hr * 1.02, hy + Math.cos(b) * hr * 1.02, Math.sin(a) * Math.sin(b) * hr * 1.02 - 0.2 * hr], 0, 0.12 * hr); } } },
  frieza: { b: 'slim', hair: 'frieza', hairC: '#9a4fc6', skin: '#f7f3f7', top: '#f7f3f7', pants: '#f7f3f7', boots: '#f7f3f7', shoe: 'none', ears: 'none', eyeW: '#ffffff', pupil: '#c8102e', angry: true, brows: false, nose: false, mouthC: '#6a2a5a',
    extra(P, D) { P.add(G.sph, '#9a4fc6', [0, D.th * 0.8, D.td * 0.12], 0, [D.tw * 0.4, D.th * 0.2, D.td * 0.44]); for (const s of [-1, 1]) P.add(G.sph, '#9a4fc6', [s * D.sh, D.th * 0.92, 0], 0, [0.05, 0.035, 0.05]);
      let p = [0, 0.02, -D.td * 0.45], d = [0, -0.6, -1], r = 0.04; for (let i = 0; i < 6; i++) { const L = 0.1; spk(P, '#f7f3f7', p, d, L * 1.3, r); p = [p[0] + d[0] * 0.09, p[1] + d[1] * 0.09, p[2] + d[2] * 0.09]; d = [Math.sin(i * 0.7) * 0.4, d[1] + 0.25, d[2]]; r *= 0.86; const n = Math.hypot(d[0], d[1], d[2]); d = [d[0] / n, d[1] / n, d[2] / n]; } },
    legExtra(P, side, D) { P.add(G.sph, '#9a4fc6', [0, -D.hip * 0.62, D.legR * 0.6], 0, [D.legR * 0.9, D.hip * 0.2, D.legR * 0.6]); } },
  cell: { b: 'tall', hair: null, skin: '#f2eadc', top: '#62b43e', pants: '#2a2a33', pantsLen: 0.4, legC: '#62b43e', armC: '#62b43e', boots: '#2a2a33', shoe: 'boot', headC: '#62b43e', eyes: 'normal', pupil: '#c21a5a', angry: true, ears: 'none', mouthC: '#6a2a5a',
    extra(P, D, hy, hr) {
      hb(P, '#f2eadc', hy, hr, 0, -0.18, 0.28, 0.72, 0.62, 0.74); hbm(P, '#9a4fc6', hy, hr, 0.42, -0.2, 0.72, 0.18, 0.18, 0.1);
      hsm(P, '#3d8a2a', hy, hr, [0.35, 0.72, -0.1], [0.45, 1, -0.55], 1.35, 0.33); hs(P, '#3d8a2a', hy, hr, [0, 0.55, -0.7], [0, 0.4, -1], 0.9, 0.3);
      for (let i = 0; i < 16; i++) { const a = rr(-1.2, 1.2), y = rr(0.1, 0.95) * D.th; P.add(G.sphLo, '#1f2a1a', [Math.sin(a) * D.tw * 0.52, y, Math.cos(a) * D.td * 0.5], 0, [0.018, 0.018, 0.012]); }
      for (const s of [-1, 1]) P.add(G.sph, '#1c1c24', [s * 0.13, D.th * 0.72, -D.td * 0.7], [0.3, 0, s * -0.6], [0.14, 0.28, 0.02]);
      spk(P, '#3d8a2a', [0, D.th * 0.3, -D.td * 0.5], [0, -0.7, -1], 0.35, 0.05);
    } },
  buu: { b: 'fat', S: 0.3, hair: null, skin: '#ffa6cf', top: '#1a1a26', belly: '#ffa6cf', pants: '#f7f5ee', baggy: true, belt: '#ffcf33', boots: '#ffcf33', bootTop: '#1a1a26', glove: '#ffcf33', cape: '#8a4fc6', ears: 'none', eyes: 'closed', smile: true,
    extra(P, D, hy, hr) { hs(P, '#ffa6cf', hy, hr, [0, 0.9, 0], [0, 1, -0.55], 1.2, 0.3); hs(P, '#ffa6cf', hy, hr, [0, 1.85, -0.5], [0, -0.3, -1], 0.8, 0.2);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; P.add(G.sphLo, '#ffa6cf', [Math.cos(a) * hr * 0.75, hy + 0.6 * hr, Math.sin(a) * hr * 0.75], 0, 0.12 * hr); }
      P.add(G.cyl, '#ffcf33', [0, 0.09, D.td * 0.47], [Math.PI / 2, 0, 0], [0.05, 0.02, 0.05]); P.add(G.box, '#d8322a', [0, 0.09, D.td * 0.49], 0, [0.05, 0.035, 0.01]); } },
  kingkai: { b: 'short', S: 0.3, hair: null, skin: '#4f8fe0', top: '#2a2a3a', dress: '#2a2a3a', pants: '#2a2a3a', belt: '#ffcf33', beltKnot: false, boots: '#6b4428', shoe: 'shoe', eyes: 'glasses', ears: 'none', smile: true, sleeve: '#2a2a3a', sleeveLen: 0.9,
    extra(P, D, hy, hr) { hb(P, '#20202c', hy, hr, 0, 0.5, -0.02, 0.96, 0.6, 0.98); P.add(G.cyl, '#f7f5ee', [0, hy + 0.62 * hr, 0.72 * hr], [Math.PI / 2 - 0.5, 0, 0], [0.2 * hr, 0.02 * hr, 0.2 * hr]);
      for (const s of [-1, 1]) { hs(P, '#20202c', hy, hr, [s * 0.35, 0.9, 0], [s * 0.3, 1, 0.1], 1.4, 0.07); hs(P, '#20202c', hy, hr, [s * 0.4, -0.35, 0.85], [s, 0.05, 0.1], 0.6, 0.035); } } },
};
function scouter(P, hy, hr) { P.add(G.sph, '#56f58a', [0.4 * hr, hy + 0.06 * hr, 1.05 * hr], [0, 0.35, 0], [0.34 * hr, 0.27 * hr, 0.05 * hr]); P.add(G.rbox, '#c8c8d0', [1.0 * hr, hy, 0.05 * hr], 0, [0.16 * hr, 0.34 * hr, 0.36 * hr]); }

// ---------------------------------------------------------------------
//  CREATURES
// ---------------------------------------------------------------------
function mkAnimalHuman(kind, o) {
  const fur = kind === 'dog' ? pick(['#c98a4a', '#a8743f', '#f0e0c8', '#7a5a3a']) : kind === 'cat' ? pick(['#f5c16c', '#9a9aa8', '#f7f3ea', '#e8894a']) : '#ffb3c6';
  return mkHuman(Object.assign({}, o, { skin: fur, hair: null, ears: kind === 'dog' ? 'dog' : kind === 'pig' ? 'round' : 'cat', nose: false, chin: false,
    extra(P, D, hy, hr) {
      if (kind === 'pig') { P.add(G.cyl, '#ff9ab5', [0, hy - 0.15 * hr, 0.95 * hr], [Math.PI / 2, 0, 0], [0.3 * hr, 0.25 * hr, 0.24 * hr]); for (const s of [-1, 1]) P.add(G.sphLo, '#b0506a', [s * 0.1 * hr, hy - 0.15 * hr, 1.08 * hr], 0, 0.05 * hr); }
      else { P.add(G.sph, kind === 'dog' ? '#f5e6d0' : '#fff6ea', [0, hy - 0.3 * hr, 0.72 * hr], 0, [0.45 * hr, 0.34 * hr, 0.42 * hr]); P.add(G.sph, '#25212f', [0, hy - 0.12 * hr, 1.1 * hr], 0, [0.13 * hr, 0.09 * hr, 0.08 * hr]); }
      if (kind === 'cat') for (const s of [-1, 1]) for (const k of [-1, 1]) P.addDir(G.cylLo, '#25212f', [s * 0.55 * hr, hy - 0.25 * hr + k * 0.06 * hr, 0.85 * hr], [s, k * 0.15, 0], [0.008, 0.5 * hr, 0.008]);
      if (o.extra) o.extra(P, D, hy, hr);
    } }));
}
function mkKorin() {
  const w = '#fbfbf5';
  return mkHuman({ b: 'kid', S: 0.24, skin: w, top: w, pants: w, boots: w, shoe: 'shoe', hair: null, ears: 'cat', earC: w, eyes: 'closed', nose: false, chin: false, browC: '#8a6a4a', thickBrow: true,
    extra(P, D, hy, hr) {
      P.add(G.sph, '#fff8ee', [0, hy - 0.3 * hr, 0.72 * hr], 0, [0.42 * hr, 0.3 * hr, 0.4 * hr]); P.add(G.sph, '#e07a8a', [0, hy - 0.14 * hr, 1.08 * hr], 0, [0.1 * hr, 0.07 * hr, 0.06 * hr]);
      for (const s of [-1, 1]) for (const k of [-1, 1]) P.addDir(G.cylLo, '#8a6a4a', [s * 0.55 * hr, hy - 0.28 * hr + k * 0.06 * hr, 0.8 * hr], [s, k * 0.15 - 0.1, 0], [0.008, 0.6 * hr, 0.008]);
      let p = [0, 0.02, -D.td * 0.45], d = [0, 0.2, -1]; for (let i = 0; i < 5; i++) { spk(P, w, p, d, 0.1, 0.028); p = [p[0], p[1] + d[1] * 0.08, p[2] + d[2] * 0.08]; const n = Math.hypot(0, d[1] + 0.35, d[2]); d = [0, (d[1] + 0.35) / n, d[2] / n]; }
    },
    armExtra(P, side, D, r, L) { if (side < 0) P.add(G.cylLo, '#7ab04a', [0, -L + 0.05, r * 0.3], 0, [0.015, 0.55, 0.015]); } });
}
function mkPuar() {
  return mkHuman({ b: 'kid', S: 0.15, skin: '#8ec3f2', top: '#8ec3f2', pants: '#8ec3f2', boots: '#8ec3f2', shoe: 'shoe', hair: null, ears: 'cat', nose: false, chin: false, smile: true, headK: 1.15,
    extra(P, D, hy, hr) { P.add(G.sph, '#25212f', [0, hy - 0.12 * hr, 1.0 * hr], 0, [0.09 * hr, 0.06 * hr, 0.06 * hr]); spk(P, '#8ec3f2', [0, 0.02, -D.td * 0.4], [0, -0.3, -1], 0.22, 0.03); } });
}
function mkBubbles() {
  return mkHuman({ b: 'kid', S: 0.22, skin: '#8a5a33', top: '#8a5a33', pants: '#8a5a33', boots: '#6a4a2a', shoe: 'shoe', hair: null, ears: 'round', earC: '#e8b08a', nose: false, chin: false, smile: true,
    extra(P, D, hy, hr) { P.add(G.sph, '#e8b08a', [0, hy - 0.25 * hr, 0.7 * hr], 0, [0.55 * hr, 0.45 * hr, 0.42 * hr]); P.add(G.sph, '#e8b08a', [0, hy + 0.1 * hr, 0.6 * hr], 0, [0.6 * hr, 0.35 * hr, 0.45 * hr]); P.add(G.sph, '#e8b08a', [0, D.th * 0.45, D.td * 0.35], 0, [D.tw * 0.3, D.th * 0.35, D.td * 0.25]); } });
}
function mkApe() {
  const fur = '#7b4a2a', face = '#e8b890';
  return mkHuman({ b: 'ape', S: 3.2, skin: fur, top: fur, pants: fur, boots: fur, shoe: 'shoe', hair: null, belly: '#94603a', ears: 'round', earC: face, eyeW: '#ff3b2a', pupil: '#ffe36a', angry: true, thickBrow: true, browC: '#4a2a18', nose: false, chin: false, mouth: false, armK: 1.0, wrist: '#2455c8',
    extra(P, D, hy, hr) {
      P.add(G.sph, face, [0, hy - 0.35 * hr, 0.62 * hr], 0, [0.62 * hr, 0.48 * hr, 0.55 * hr]); P.add(G.sph, face, [0, hy + 0.12 * hr, 0.55 * hr], 0, [0.75 * hr, 0.38 * hr, 0.45 * hr]);
      P.add(G.box, '#5a1a1a', [0, hy - 0.5 * hr, 1.12 * hr], [-0.3, 0, 0], [0.55 * hr, 0.12 * hr, 0.06 * hr]);
      for (const s of [-1, 1]) { P.addDir(G.coneLo, '#fbfbf5', [s * 0.25 * hr, hy - 0.42 * hr, 1.1 * hr], [0, 1, 0.2], [0.07 * hr, 0.22 * hr, 0.07 * hr]); P.addDir(G.coneLo, '#fbfbf5', [s * 0.25 * hr, hy - 0.58 * hr, 1.08 * hr], [0, -1, 0.2], [0.07 * hr, 0.22 * hr, 0.07 * hr]); P.add(G.sphLo, '#3a1a10', [s * 0.14 * hr, hy - 0.08 * hr, 1.1 * hr], 0, 0.06 * hr); }
      for (let i = 0; i < 12; i++) { const a = rr(-2.6, 2.6), b = rr(0.1, 0.9); hs(P, fur, hy, hr, [Math.sin(a) * Math.sin(b), Math.cos(b), Math.cos(a) * Math.sin(b) - 0.1], [Math.sin(a) * 0.6, 1, Math.cos(a) * 0.6 - 0.4], 0.45, 0.2); }
      for (let i = 0; i < 10; i++) { const a = rr(0, TAU); P.addDir(G.coneLo, fur, [Math.sin(a) * D.tw * 0.45, rr(0.2, 0.9) * D.th, Math.cos(a) * D.td * 0.45], [Math.sin(a), rr(-0.3, 0.3), Math.cos(a)], [0.05, 0.12, 0.05]); }
      let p = [0, 0.05, -D.td * 0.45], d = [0, -0.2, -1], r = 0.07; for (let i = 0; i < 8; i++) { spk(P, fur, p, d, 0.15, r); p = [p[0] + d[0] * 0.12, p[1] + d[1] * 0.12, p[2] + d[2] * 0.12]; const nd = [Math.sin(i * 0.8) * 0.3, d[1] + 0.3, d[2] + 0.05]; const n = Math.hypot(nd[0], nd[1], nd[2]); d = [nd[0] / n, nd[1] / n, nd[2] / n]; r *= 0.93; }
    } });
}
// Umigame (sea turtle) — static mesh with a head that bobs
function mkTurtle() {
  const root = new THREE.Group(); const P = new PB();
  P.add(G.hemi, '#3f7a3a', [0, 0.03, 0], 0, [0.26, 0.17, 0.3]); P.add(G.cyl, '#d8c07a', [0, 0.03, 0], 0, [0.265, 0.03, 0.305]);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; P.add(G.sphLo, '#5a9a4a', [Math.cos(a) * 0.14, 0.13, Math.sin(a) * 0.16], 0, [0.06, 0.03, 0.06]); }
  P.add(G.sphLo, '#5a9a4a', [0, 0.18, 0], 0, [0.07, 0.03, 0.07]);
  for (const s of [-1, 1]) { P.add(G.sph, '#b8d88a', [s * 0.26, 0.02, 0.14], [0, s * 0.5, 0], [0.12, 0.025, 0.06]); P.add(G.sph, '#b8d88a', [s * 0.2, 0.02, -0.2], [0, s * -0.4, 0], [0.08, 0.022, 0.05]); }
  const body = P.mesh(0.012); root.add(body);
  const H = new PB(); H.add(capG(0.05, 0.1), '#b8d88a', [0, 0, 0.06], [Math.PI / 2, 0, 0]); H.add(G.sph, '#b8d88a', [0, 0.03, 0.16], 0, [0.075, 0.07, 0.085]);
  for (const s of [-1, 1]) { H.add(G.sph, '#ffffff', [s * 0.045, 0.06, 0.21], 0, [0.022, 0.026, 0.015]); H.add(G.sph, '#1a1226', [s * 0.047, 0.06, 0.223], 0, [0.012, 0.016, 0.01]); }
  const head = H.mesh(0.012); head.position.set(0, 0.06, 0.24); root.add(head);
  return finishRig({ root, head, h: 0.35 });
}
// ---- dinosaurs: body mesh + animated leg groups
function dinoLeg(P, col, r, H, claw) { P.add(G.sph, col, [0, -r * 0.4, 0], 0, [r * 1.25, r * 1.8, r * 1.35]); P.add(capG(r * 0.7, Math.max(0.01, H - r * 2)), col, [0, -H * 0.55, -r * 0.2]); P.add(G.rbox, col, [0, -H + 0.03, r * 0.5], 0, [r * 1.8, 0.06, r * 2.6]); if (claw) for (const s of [-1, 0, 1]) P.addDir(G.coneLo, '#fbfbf0', [s * r * 0.6, -H + 0.03, r * 1.75], [0, 0, 1], [r * 0.22, r * 0.5, r * 0.22]); }
function mkDinoRig(kind) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const P = new PB(); const legs = [];
  let hipH = 0.55, S = 1, lh = 1.4;
  const eye = (x, y, z, r) => { for (const s of [-1, 1]) { P.add(G.sph, '#ffffff', [s * x, y, z], 0, [r * 0.6, r, r]); P.add(G.sph, '#1a1226', [s * (x + r * 0.35), y, z + r * 0.15], 0, [r * 0.35, r * 0.6, r * 0.6]); } };
  if (kind === 'trex') {
    const c = '#5cb84a', b = '#dfe89a', d = '#3a8a34'; hipH = 0.55; S = 1.0; lh = 1.35;
    P.add(G.sph, c, [0, 0.12, 0], [-0.25, 0, 0], [0.3, 0.3, 0.5]); P.add(G.sph, b, [0, 0.02, 0.1], [-0.25, 0, 0], [0.22, 0.22, 0.4]);
    P.addDir(G.cone, c, [0, 0.14, -0.8], [0, -0.15, -1], [0.22, 1.0, 0.22]);
    P.add(G.sph, c, [0, 0.36, 0.42], [-0.6, 0, 0], [0.17, 0.25, 0.18]);
    P.add(G.sph, c, [0, 0.55, 0.62], 0, [0.2, 0.17, 0.3]); P.add(G.sph, b, [0, 0.43, 0.64], 0, [0.16, 0.07, 0.25]);
    P.add(G.box, '#7a1a1a', [0, 0.48, 0.74], 0, [0.2, 0.03, 0.26]);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) P.addDir(G.coneLo, '#fbfbf0', [s * 0.1, 0.49, 0.6 + i * 0.06], [0, -1, 0], [0.018, 0.05, 0.018]);
    eye(0.13, 0.63, 0.72, 0.04); for (const s of [-1, 1]) P.add(G.box, d, [s * 0.12, 0.69, 0.72], [0, 0, s * 0.3], [0.08, 0.025, 0.05]);
    for (let i = 0; i < 6; i++) P.add(G.sph, d, [0, 0.4 - i * 0.05, 0.1 - i * 0.22], 0, [0.06, 0.05, 0.08]);
    for (const s of [-1, 1]) P.addDir(capG(0.03, 0.08), c, [s * 0.2, 0.08, 0.38], [0, -0.6, 0.8]);
    for (const s of [-1, 1]) { const L = new PB(); dinoLeg(L, c, 0.1, hipH, true); const g = new THREE.Group(); g.position.set(s * 0.18, 0, 0.02); g.add(L.mesh(0.03)); body.add(g); legs.push({ g, ph: s > 0 ? 0 : Math.PI }); }
  } else if (kind === 'brachio') {
    const c = '#6fb2d6', b = '#cfe8f2', d = '#4a8ab0'; hipH = 0.75; S = 1.1; lh = 2.9;
    P.add(G.sph, c, [0, 0.2, 0], 0, [0.42, 0.38, 0.7]); P.add(G.sph, b, [0, 0.05, 0.05], 0, [0.34, 0.25, 0.58]);
    P.addDir(new THREE.CylinderGeometry(0.55, 1, 1, 12), c, [0, 1.0, 0.95], [0, 1.4, 0.55], [0.17, 1.9, 0.17]);
    P.add(G.sph, c, [0, 1.9, 1.35], 0, [0.16, 0.13, 0.24]); eye(0.12, 1.95, 1.4, 0.035);
    P.addDir(G.cone, c, [0, 0.15, -1.15], [0, -0.2, -1], [0.26, 1.3, 0.26]);
    for (let i = 0; i < 8; i++) P.add(G.sph, d, [rr(-0.25, 0.25), rr(0.3, 0.5), rr(-0.5, 0.5)], 0, [0.07, 0.03, 0.07]);
    for (const [x, z, p] of [[0.26, 0.42, 0], [-0.26, 0.42, Math.PI], [0.26, -0.42, Math.PI], [-0.26, -0.42, 0]]) { const L = new PB(); dinoLeg(L, c, 0.12, hipH, false); const g = new THREE.Group(); g.position.set(x, 0, z); g.add(L.mesh(0.03)); body.add(g); legs.push({ g, ph: p }); }
  } else if (kind === 'trike') {
    const c = '#e8893a', b = '#f5d6a0', d = '#c86a2a'; hipH = 0.34; S = 1.0; lh = 1.05;
    P.add(G.sph, c, [0, 0.12, 0], 0, [0.3, 0.26, 0.45]); P.addDir(G.cone, c, [0, 0.1, -0.6], [0, -0.1, -1], [0.16, 0.5, 0.16]);
    P.add(G.sph, c, [0, 0.16, 0.5], 0, [0.17, 0.15, 0.22]); P.add(G.cyl, b, [0, 0.3, 0.42], [-0.7, 0, 0], [0.34, 0.04, 0.3]);
    for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3; P.add(G.sphLo, d, [Math.sin(a) * 0.33, 0.3 + Math.cos(a) * 0.22, 0.42 - Math.cos(a) * 0.17], 0, 0.04); }
    P.addDir(G.coneLo, '#fbfbf0', [0, 0.14, 0.72], [0, 0.3, 1], [0.035, 0.14, 0.035]);
    for (const s of [-1, 1]) P.addDir(G.coneLo, '#fbfbf0', [s * 0.09, 0.28, 0.6], [s * 0.15, 0.55, 1], [0.035, 0.3, 0.035]);
    P.add(G.sph, '#6a4a2a', [0, 0.1, 0.7], 0, [0.06, 0.05, 0.06]); eye(0.12, 0.22, 0.6, 0.03);
    for (const [x, z, p] of [[0.2, 0.28, 0], [-0.2, 0.28, Math.PI], [0.2, -0.28, Math.PI], [-0.2, -0.28, 0]]) { const L = new PB(); dinoLeg(L, c, 0.08, hipH, false); const g = new THREE.Group(); g.position.set(x, 0, z); g.add(L.mesh(0.025)); body.add(g); legs.push({ g, ph: p }); }
  } else if (kind === 'ptero') {
    const c = '#d06a44', b = '#f0c08a'; hipH = 0; S = 0.9; lh = 0.35;
    P.add(G.sph, c, [0, 0, 0], 0, [0.08, 0.07, 0.2]); P.add(G.sph, c, [0, 0.05, 0.24], 0, [0.07, 0.07, 0.09]);
    P.addDir(G.cone, b, [0, 0.03, 0.42], [0, -0.1, 1], [0.03, 0.26, 0.03]); P.addDir(G.cone, c, [0, 0.1, 0.1], [0, 0.35, -1], [0.03, 0.25, 0.03]);
    eye(0.05, 0.08, 0.28, 0.018); P.addDir(G.cone, c, [0, 0, -0.26], [0, 0, -1], [0.03, 0.2, 0.03]);
    for (const s of [-1, 1]) { const W = new PB(); W.add(G.sph, c, [s * 0.32, 0, 0], 0, [0.34, 0.012, 0.14]); W.add(G.sph, b, [s * 0.34, -0.005, -0.03], 0, [0.28, 0.01, 0.09]); W.add(capG(0.012, 0.6), c, [s * 0.33, 0.01, 0.1], [0, 0, Math.PI / 2]); const g = new THREE.Group(); g.position.set(s * 0.05, 0.02, 0.02); g.add(W.mesh(0.012)); body.add(g); legs.push({ g, s, wing: true }); }
  }
  const m = P.mesh(kind === 'ptero' ? 0.014 : 0.03); body.add(m); body.position.y = hipH;
  root.scale.setScalar(S);
  return finishRig({ root, body, legs, hipH, S, h: lh, kind });
}
function animDino(rig, walk, ph, t, dt) {
  const k = damp(8, dt);
  if (rig.kind === 'ptero') { for (const L of rig.legs) L.g.rotation.z = L.s * Math.sin(ph) * 0.7; rig.body.position.y = Math.sin(ph) * -0.03; return; }
  for (const L of rig.legs) { const tgt = walk ? Math.sin(ph + L.ph) * 0.5 : 0; L.g.rotation.x += (tgt - L.g.rotation.x) * k; }
  rig.body.position.y = rig.hipH + (walk ? Math.abs(Math.cos(ph)) * 0.025 : Math.sin(t * 1.5) * 0.005);
  rig.body.rotation.z = walk ? Math.sin(ph) * 0.03 : 0;
}
