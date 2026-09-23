
// =====================================================================
//  PARTICLES: outlined comic puffs (instanced) + additive glow points
// =====================================================================
const puffMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD, emissive: 0x222222 });
class PuffPool {
  constructor(n) {
    this.n = n; this.next = 0;
    this.mesh = new THREE.InstancedMesh(G.sphLo, puffMat, n); this.mesh.frustumCulled = false;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
    const o = new THREE.InstancedMesh(outlineGeo(G.sphLo), outlineMat(0.1), n); o.instanceMatrix = this.mesh.instanceMatrix; o.frustumCulled = false; this.mesh.add(o);
    this.p = []; for (let i = 0; i < n; i++) this.p.push({ alive: false, pos: V(), vel: V(), life: 0, max: 1, s0: 0.1, s1: 0.5, drag: 1, rise: 0 });
    this.m4 = new THREE.Matrix4(); this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < n; i++) this.mesh.setMatrixAt(i, this.zero);
    this.mesh.renderOrder = 2; scene.add(this.mesh);
  }
  emit(pos, vel, life, s0, s1, color, drag = 1.5, rise = 0) {
    const i = this.next; this.next = (i + 1) % this.n; const p = this.p[i];
    p.alive = true; p.pos.copy(pos); p.vel.copy(vel); p.life = 0; p.max = life; p.s0 = s0; p.s1 = s1; p.drag = drag; p.rise = rise;
    _c.set(color); this.mesh.setColorAt(i, _c); this.mesh.instanceColor.needsUpdate = true; return p;
  }
  update(dt) {
    const m = this.m4, up = _pd;
    for (let i = 0; i < this.n; i++) {
      const p = this.p[i]; if (!p.alive) continue;
      p.life += dt; if (p.life >= p.max) { p.alive = false; this.mesh.setMatrixAt(i, this.zero); continue; }
      const t = p.life / p.max; p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      if (p.rise) { up.copy(p.pos).normalize(); p.vel.addScaledVector(up, p.rise * dt); }
      p.pos.addScaledVector(p.vel, dt);
      const s = lerp(p.s0, p.s1, 1 - (1 - t) * (1 - t)) * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      m.makeScale(s, s, s); m.setPosition(p.pos); this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
class GlowPool {
  constructor(n) {
    this.n = n; this.next = 0;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.size = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n).fill(1); this.max = new Float32Array(n).fill(1); this.s0 = new Float32Array(n); this.drag = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    this.aP = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage); this.aC = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage); this.aS = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aP); g.setAttribute('color', this.aC); g.setAttribute('size', this.aS);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 600 }, uMap: { value: glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)') } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; uniform float uScale; void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size * uScale / max(0.05, -mv.z); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D uMap; varying vec3 vC; void main(){ float a = texture2D(uMap, gl_PointCoord).a; vec3 c = mix(vC, vec3(1.0), smoothstep(0.55, 1.0, a)); gl_FragColor = vec4(c, a); }',
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 6; scene.add(this.points);
  }
  emit(p, v, life, size, color, drag = 1) {
    const i = this.next; this.next = (i + 1) % this.n;
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = v.x; this.vel[i * 3 + 1] = v.y; this.vel[i * 3 + 2] = v.z;
    this.life[i] = 0; this.max[i] = life; this.s0[i] = size; this.drag[i] = drag;
    rawC(color, _c); this.col[i * 3] = _c.r; this.col[i * 3 + 1] = _c.g; this.col[i * 3 + 2] = _c.b;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] >= this.max[i]) { this.size[i] = 0; continue; }
      this.life[i] += dt; const t = Math.min(1, this.life[i] / this.max[i]); const k = Math.exp(-this.drag[i] * dt);
      const j = i * 3; this.vel[j] *= k; this.vel[j + 1] *= k; this.vel[j + 2] *= k;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      this.size[i] = this.s0[i] * (1 - t * t);
    }
    this.aP.needsUpdate = this.aC.needsUpdate = this.aS.needsUpdate = true;
  }
}
let PUFF, GLOW;
function buildParticles() { PUFF = new PuffPool(QUALITY === 'low' ? 500 : 900); GLOW = new GlowPool(1400); }

// =====================================================================
//  REGISTRIES + PLACEMENT HELPERS
// =====================================================================
const PLACES = [], PROTECT = [], EXPLICIT_TREES = [], ENT = [], UPD = [], SPOT = {};
function protect(c, r) { PROTECT.push({ c: c.clone().normalize(), cos: Math.cos(r / R) }); }
function isProtected(d) { for (const p of PROTECT) if (dot3(d, p.c) > p.cos) return true; return false; }
function addPlace(name, dir, alt, view = 16, icon = '') { const p = { name, dir: dir.clone().normalize(), alt, view, icon }; PLACES.push(p); return p; }
function mat4At(dir, fwd, lift = 0, h = null, s = 1) {
  const hh = h === null ? groundH(dir) : h; const q = basisQuat(dir, fwd, new THREE.Quaternion());
  return new THREE.Matrix4().compose(dir.clone().multiplyScalar(R + hh + lift), q, new THREE.Vector3(s, s, s));
}
function placeObj(obj, dir, fwd, lift = 0, h = null) { const hh = h === null ? groundH(dir) : h; obj.position.copy(dir).multiplyScalar(R + hh + lift); basisQuat(dir, fwd, obj.quaternion); return obj; }
function localPt(base, x, y, z) { return V().set(x, y, z).applyMatrix4(base); }
function findLand(center, radius, minH = 0.5, maxH = 3, tries = 300) {
  const fr = frameAt(center);
  for (let i = 0; i < tries; i++) { const a = rand() * TAU, r = Math.sqrt(rand()) * radius; const d = offsetDir(fr, Math.cos(a) * r, Math.sin(a) * r); const h = heightAt(d); if (h > minH && h < maxH && !isProtected(d)) return d; }
  return center.clone();
}
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function tileTex(c1, c2, n = 8, lw = 3) {
  return canvasTex(256, 256, (x, w, h) => { x.fillStyle = c1; x.fillRect(0, 0, w, h); x.strokeStyle = c2; x.lineWidth = lw; for (let i = 0; i <= n; i++) { const p = (i / n) * w; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, h); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); } });
}
function flatPanel(base, geo, tex, x, y, z) {
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: tex, gradientMap: GRAD, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  m.applyMatrix4(new THREE.Matrix4().copy(base).multiply(new THREE.Matrix4().makeTranslation(x, y, z)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
  scene.add(m); return m;
}
function signPanel(base, text, w, h, x, y, z, ry, opts) {
  const tex = textTex(text, Object.assign({ w: 1024, h: Math.round(1024 * h / w) }, opts));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  m.applyMatrix4(new THREE.Matrix4().copy(base).multiply(new THREE.Matrix4().makeTranslation(x, y, z)).multiply(new THREE.Matrix4().makeRotationY(ry)));
  scene.add(m); return m;
}

// =====================================================================
//  VEGETATION
// =====================================================================
let TREEGEO = null;
function frond(P, col, top, a, droop, len, wid) {
  const ca = Math.cos(a), sa = Math.sin(a), cd = Math.cos(droop), sd = Math.sin(droop);
  const L = len * 0.55;
  P.add(G.sphT, col, [top[0] + L * cd * ca, top[1] - L * sd, top[2] - L * cd * sa], [0, a, -droop], [len * 0.55, 0.018, wid]);
}
function buildTreeGeos() {
  const T = {}; let P;
  P = new PB();
  P.add(G.cylLo, '#8b5a33', [0, 0.25, 0], 0, [0.07, 0.5, 0.07]);
  P.add(G.sphT, '#3dbb46', [0, 0.66, 0], 0, [0.36, 0.3, 0.36]);
  P.add(G.sphT, '#52cf4f', [0.17, 0.55, 0.07], 0, [0.23, 0.2, 0.23]);
  P.add(G.sphT, '#35a940', [-0.15, 0.56, -0.08], 0, [0.24, 0.21, 0.24]);
  P.add(G.sphT, '#5ad457', [0.02, 0.86, 0.02], 0, [0.2, 0.17, 0.2]);
  T.round = P.geometry();
  P = new PB();
  P.add(G.cylLo, '#7a4e2e', [0, 0.15, 0], 0, [0.06, 0.3, 0.06]);
  P.add(G.coneLo, '#2f8f4a', [0, 0.45, 0], 0, [0.36, 0.45, 0.36]);
  P.add(G.coneLo, '#34a052', [0, 0.72, 0], 0, [0.28, 0.4, 0.28]);
  P.add(G.coneLo, '#3bb05b', [0, 0.97, 0], 0, [0.19, 0.34, 0.19]);
  T.pine = P.geometry();
  P = new PB();
  P.add(G.cylLo, '#7a4e2e', [0, 0.15, 0], 0, [0.06, 0.3, 0.06]);
  P.add(G.coneLo, '#2c7f48', [0, 0.45, 0], 0, [0.36, 0.45, 0.36]);
  P.add(G.coneLo, '#f2f8ff', [0, 0.56, 0], 0, [0.25, 0.2, 0.25]);
  P.add(G.coneLo, '#2f8a4c', [0, 0.72, 0], 0, [0.28, 0.4, 0.28]);
  P.add(G.coneLo, '#f2f8ff', [0, 0.84, 0], 0, [0.18, 0.18, 0.18]);
  P.add(G.coneLo, '#f7fbff', [0, 1.02, 0], 0, [0.16, 0.26, 0.16]);
  T.pineS = P.geometry();
  P = new PB(); let x = 0, y = 0;
  for (let i = 0; i < 5; i++) { const a = 0.08 + i * 0.075; const L = 0.21; P.addDir(G.cylLo, i % 2 ? '#a3733f' : '#8a5d33', [x + Math.sin(a) * L / 2, y + Math.cos(a) * L / 2, 0], [Math.sin(a), Math.cos(a), 0], [0.05 - i * 0.004, L * 1.08, 0.05 - i * 0.004]); x += Math.sin(a) * L; y += Math.cos(a) * L; }
  for (let k = 0; k < 7; k++) frond(P, k % 2 ? '#38b54e' : '#2c9d45', [x, y, 0], (k / 7) * TAU + 0.3, 0.35 + (k % 3) * 0.12, 0.5, 0.075);
  for (let k = 0; k < 3; k++) P.add(G.sphLo, '#7a4a22', [x + Math.cos(k * 2.1) * 0.05, y - 0.05, Math.sin(k * 2.1) * 0.05], 0, 0.035);
  T.palm = P.geometry();
  P = new PB();
  P.add(G.cylLo, '#6e4a2c', [0, 0.6, 0], 0, [0.09, 1.2, 0.09]);
  P.addDir(G.cylLo, '#6e4a2c', [0.16, 0.85, 0], [1, 1.2, 0], [0.04, 0.42, 0.04]);
  P.add(G.sphT, '#1f8a3a', [0, 1.28, 0], 0, [0.62, 0.3, 0.62]);
  P.add(G.sphT, '#2a9e42', [0.3, 1.2, 0.18], 0, [0.36, 0.22, 0.36]);
  P.add(G.sphT, '#178032', [-0.28, 1.22, -0.14], 0, [0.36, 0.22, 0.36]);
  P.add(G.sphT, '#2aa545', [0.05, 1.46, 0], 0, [0.34, 0.2, 0.34]);
  P.add(G.sphT, '#23913c', [0.36, 1.0, 0], 0, [0.22, 0.14, 0.22]);
  T.jungle = P.geometry();
  P = new PB(); const cg = '#4aa84f';
  P.add(G.cylLo, cg, [0, 0.3, 0], 0, [0.09, 0.6, 0.09]); P.add(G.sphLo, cg, [0, 0.6, 0], 0, [0.09, 0.07, 0.09]);
  P.add(G.cylLo, cg, [0.13, 0.3, 0], [0, 0, Math.PI / 2], [0.05, 0.12, 0.05]); P.add(G.cylLo, cg, [0.19, 0.42, 0], 0, [0.05, 0.24, 0.05]); P.add(G.sphLo, cg, [0.19, 0.54, 0], 0, [0.05, 0.04, 0.05]);
  P.add(G.cylLo, cg, [-0.12, 0.22, 0], [0, 0, Math.PI / 2], [0.045, 0.1, 0.045]); P.add(G.cylLo, cg, [-0.17, 0.31, 0], 0, [0.045, 0.18, 0.045]); P.add(G.sphLo, cg, [-0.17, 0.4, 0], 0, [0.045, 0.035, 0.045]);
  T.cactus = P.geometry();
  for (const k in T) T[k + '_o'] = outlineGeo(T[k]);
  TREEGEO = T;
}
function treeTypeAt(d, h, bw) {
  if (bw.city > 0.01 || bw.volc > 0.3 || bw.lava > 0 || bw.scorch > 0.15) return null;
  const ay = Math.abs(d.y); if (ay > 0.855) return null;
  const sn = 6.2 - bw.snowR * 2.6; if (h > sn - 0.3) return null;
  for (const f of FLAT) if (dot3(d, f.c) > Math.cos((f.r0 + 0.7) / R)) return null;
  if (dot3(d, REG.kame) > Math.cos(4 / R) || dot3(d, REG.tourn) > Math.cos(7.5 / R)) return null;
  const r = rand();
  if (h < 0.5) return (ay < 0.62 && r < 0.3) ? 'palm' : null;
  if (bw.desert > 0.45) return r < 0.07 ? 'cactus' : null;
  if (bw.jungle > 0.4) return r < 0.85 ? (rand() < 0.18 ? 'palm' : 'jungle') : null;
  if (bw.snowR > 0.35 || ay > 0.72) return r < 0.5 ? (h > sn - 2.2 || ay > 0.78 ? 'pineS' : 'pine') : null;
  if (bw.mtn > 0.3 && h > 2.4) return r < 0.35 ? 'pine' : null;
  const patch = fbm(d.x * 5 + 2, d.y * 5 - 3, d.z * 5 + 8, 3);
  if (patch > 0.1) return r < 0.75 ? (rand() < 0.72 ? 'round' : 'pine') : null;
  return r < 0.06 ? 'round' : null;
}
const TREES = [];
function buildScatter() {
  const lists = { round: [], pine: [], pineS: [], palm: [], jungle: [], cactus: [] };
  const N = QUALITY === 'low' ? 9000 : QUALITY === 'high' ? 24000 : 16000; const d = V(), bw = Object.assign({}, BW);
  for (let i = 0; i < N; i++) { randDir(d); const h = heightAt(d, bw); if (h < 0.1) continue; const t = treeTypeAt(d, h, bw); if (t) lists[t].push({ d: d.clone(), h, s: rr(0.8, 1.35) }); }
  for (const is of ISL) if (is.small) { const fr = frameAt(is.c); for (let k = 0; k < ri(1, 3); k++) { const a = rand() * TAU, r = rand() * is.r * 0.45; const dd = offsetDir(fr, Math.cos(a) * r, Math.sin(a) * r); lists.palm.push({ d: dd, h: heightAt(dd), s: rr(0.9, 1.2) }); } }
  for (const e of EXPLICIT_TREES) lists[e.type].push({ d: e.d.clone(), h: e.h ?? groundH(e.d), s: e.s || 1 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), f = V(), p = V(), s = V(), col = new THREE.Color();
  for (const k in lists) {
    const L = lists[k]; if (!L.length) continue;
    const im = instanced(TREEGEO[k], L.length, MAT.toon, 0.035, TREEGEO[k + '_o']);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(L.length * 3), 3);
    L.forEach((t, i) => { randTangent(t.d, f); basisQuat(t.d, f, q); p.copy(t.d).multiplyScalar(R + t.h - 0.04); s.setScalar(t.s); m4.compose(p, q, s); im.setMatrixAt(i, m4); col.setRGB(rr(0.85, 1.1), rr(0.9, 1.08), rr(0.8, 1.0)); im.setColorAt(i, col); TREES.push({ d: t.d, im, i, gone: false }); });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; scene.add(im);
  }
}
function removeTreesNear(c, radius) {
  const cth = Math.cos(radius / R), zero = new THREE.Matrix4().makeScale(0, 0, 0), touched = new Set();
  for (const t of TREES) if (!t.gone && dot3(t.d, c) > cth) { t.gone = true; t.im.setMatrixAt(t.i, zero); touched.add(t.im); }
  touched.forEach((im) => (im.instanceMatrix.needsUpdate = true));
}

// =====================================================================
//  ROCKS: wasteland spires, Mt. Paozu karst peaks, boulders, volcano
// =====================================================================
let lavaMat;
const ROCKSPOTS = [], BOULD = { im: null, list: [] };
function buildRocks() {
  const P = new PB(); const cyl10 = new THREE.CylinderGeometry(1, 1.1, 1, 10, 1);
  const fw = frameAt(REG.waste); const avoid = [REG.cell, REG.pods, REG.frieza]; let placed = 0;
  const cols = ['#e8a45e', '#d4824a', '#f2c68c', '#c46b3c', '#e0935a'];
  for (let tries = 0; tries < 500 && placed < 50; tries++) {
    const a = rand() * TAU, r = 3 + Math.sqrt(rand()) * 25; const d = offsetDir(fw, Math.cos(a) * r, Math.sin(a) * r);
    if (avoid.some((c) => arcDist(d, c) < 8.8)) continue; const h = heightAt(d); if (h < 0.4) continue;
    const H = rr(1.8, 6.2), rb = rr(0.45, 1.3);
    P.base = mat4At(d, randTangent(d, V()), -0.35, h);
    let y = 0, rad = rb; const k = ri(3, 5);
    for (let j = 0; j < k; j++) { const sh = H / k; const r2 = rad * rr(0.84, 0.97); P.add(cyl10, cols[(j + placed) % cols.length], [rr(-0.04, 0.04), y + sh / 2, rr(-0.04, 0.04)], [0, rr(0, 1), 0], [r2, sh, r2]); y += sh; rad = r2; }
    P.add(cyl10, '#f7dcaa', [0, y + 0.05, 0], 0, [rad * 1.06, 0.1, rad * 1.06]);
    ROCKSPOTS.push({ d: d.clone(), r: rb }); placed++;
  }
  const fp = frameAt(REG.paozu); let kp = 0;
  for (let tries = 0; tries < 400 && kp < 26; tries++) {
    const a = rand() * TAU, r = 6 + rand() * 11; const d = offsetDir(fp, Math.cos(a) * r, Math.sin(a) * r); const h = heightAt(d); if (h < 0.5 || h > 4) continue;
    const H = rr(3, 8.5), rb = rr(0.6, 1.35); P.base = mat4At(d, randTangent(d, V()), -0.35, h);
    P.add(cyl10, kp % 2 ? '#9aa88f' : '#a6b39b', [0, H / 2, 0], [0, rand() * 3, 0], [rb * 0.9, H, rb * 0.9]);
    P.add(cyl10, '#8c9a82', [0, H * 0.35, 0], [0, 1, 0], [rb * 0.93, 0.18, rb * 0.93]);
    P.add(G.sph, '#46b24f', [0, H + rb * 0.12, 0], 0, [rb * 0.92, rb * 0.45, rb * 0.92]);
    P.add(G.sph, '#3aa047', [rb * 0.45, H + rb * 0.05, 0.2], 0, [rb * 0.45, rb * 0.3, rb * 0.45]);
    P.add(G.sph, '#52c25a', [-rb * 0.3, H + rb * 0.35, -0.1], 0, [rb * 0.4, rb * 0.3, rb * 0.4]);
    ROCKSPOTS.push({ d: d.clone(), r: rb }); kp++;
  }
  P.base = null; const rocks = P.mesh(0.05); scene.add(rocks);
  // boulders (faceted)
  const bl = [], d = V(), bw = Object.assign({}, BW);
  for (let i = 0; i < 7000 && bl.length < 340; i++) {
    randDir(d); const h = heightAt(d, bw); if (h < 0.5 || bw.city > 0 || isProtected(d) || Math.abs(d.y) > 0.86) continue;
    const rocky = bw.mtn > 0.25 || bw.desert > 0.4 || bw.volc > 0.4 || bw.snowR > 0.4; if (!rocky && rand() > 0.07) continue;
    bl.push({ d: d.clone(), h, s: rr(0.12, 0.45), c: bw.volc > 0.4 ? '#4b3b3a' : bw.desert > 0.4 ? pick(['#d08a55', '#c47a48', '#e0a068']) : pick(['#9c8a78', '#b39b80', '#8a7a6c', '#a7998b']) });
  }
  const dg = G.dodec; const dgo = outlineGeo(dg);
  const bim = instanced(dg, bl.length, MAT.toonI, 0.08, dgo); bim.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bl.length * 3), 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), f = V(), s = V(), p = V(), cc = new THREE.Color();
  bl.forEach((b, i) => { randTangent(b.d, f); basisQuat(b.d, f, q); q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3))); p.copy(b.d).multiplyScalar(R + b.h - b.s * 0.25); s.set(b.s * rr(0.8, 1.3), b.s * rr(0.6, 1), b.s * rr(0.8, 1.2)); m4.compose(p, q, s); bim.setMatrixAt(i, m4); bim.setColorAt(i, cc.set(b.c)); });
  bim.instanceMatrix.needsUpdate = true; scene.add(bim); BOULD.im = bim; BOULD.list = bl;
  // volcano lava pool + glow + smoke emitter
  const vh = VOLC.peak * Math.pow(1 - VOLC.cr / VOLC.r, 1.5) + 0.4 - VOLC.cd * 0.78;
  lavaMat = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
  const lava = new THREE.Mesh(new THREE.CircleGeometry(VOLC.cr * 0.95, 32), lavaMat);
  lava.applyMatrix4(mat4At(VOLC.c, frameAt(VOLC.c).north, 0, vh).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2))); scene.add(lava);
  const vg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,200,90,1)', 'rgba(255,110,30,0.5)', 'rgba(255,60,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  vg.position.copy(VOLC.c).multiplyScalar(R + vh + 0.8); vg.scale.setScalar(6); scene.add(vg);
  const top = VOLC.c.clone().multiplyScalar(R + vh + 0.3); let acc = 0; const vel = V();
  UPD.push((dt, t) => {
    lavaMat.color.setHSL(0.05 + Math.sin(t * 2) * 0.012, 1, 0.52 + Math.sin(t * 3.3) * 0.05);
    acc += dt; while (acc > 0.42) { acc -= 0.42; randTangent(VOLC.c, vel).multiplyScalar(rr(0.25, 0.7)).addScaledVector(VOLC.c, rr(2.3, 3.2)); PUFF.emit(top, vel, rr(5, 6.5), rr(0.3, 0.42), rr(0.85, 1.35), pick(['#8a8290', '#9b93a1', '#7c7482', '#aaa2b0']), 0.34, 0.12); if (rand() < 0.5) { randTangent(VOLC.c, vel).multiplyScalar(rr(0.5, 1.5)).addScaledVector(VOLC.c, rr(2, 4)); GLOW.emit(top, vel, rr(0.8, 1.4), rr(0.25, 0.45), '#ff8a2a', 0.4); } }
  });
  addPlace('Volcano', VOLC.c, VOLC.peak + 1.5, 22);
  addPlace('Dinosaur Jungle', REG.jungle, 2.5, 18);
  addPlace('Wasteland', REG.waste, 5, 24);
  addPlace('Snow Peaks', REG.snow, 9, 34).tilt = -0.45;
}

// =====================================================================
//  WEST CITY
// =====================================================================
const CITY = { h: 0.9, rings: [3.2, 6.6, 10.0], roadW: 0.7, radials: [0, 1, 2, 3, 4, 5].map((k) => (30 + 60 * k) * DEG), walks: [3.72, 7.2, 10.55], fr: null };
const _ct0 = V(), _ct1 = V();
function cityPolar(r, a, out = V()) { return offsetDir(CITY.fr, Math.cos(a) * r, Math.sin(a) * r, out); }
function cityTan(r, a, out = V()) { cityPolar(r, a, _ct0); cityPolar(r, a + 0.003, _ct1); out.subVectors(_ct1, _ct0); out.addScaledVector(_ct0, -out.dot(_ct0)); return out.normalize(); }
const PASTEL = ['#ffd9e6', '#fff0b8', '#cfe8ff', '#d8ffd0', '#ffe0c2', '#e9d8ff', '#ffffff', '#f4efe2', '#d6f5f2', '#ffe8f0'];
const ACCENT = ['#ff7a59', '#3d7eff', '#ffcc29', '#ff5c8a', '#45c8a0', '#9b6bff', '#ff9f1c', '#35b5ff'];
function bTower(P, fp, H, c1, c2, gl) {
  const w = fp * rr(0.7, 0.95), dd = fp * rr(0.7, 0.95), m = Math.min(w, dd);
  P.add(G.rbox, c1, [0, H / 2, 0], 0, [w, H, dd]);
  for (let y = 0.3; y < H - 0.15; y += 0.26) P.add(G.box, gl, [0, y, 0], 0, [w * 1.02, 0.085, dd * 1.02]);
  const top = rand();
  if (top < 0.4) P.add(G.hemi, c2, [0, H, 0], 0, [m * 0.42, m * 0.35, m * 0.42]);
  else if (top < 0.7) P.add(G.rbox, c2, [0, H + 0.05, 0], 0, [w * 1.08, 0.1, dd * 1.08]);
  else { P.add(G.cyl, c2, [0, H + 0.12, 0], 0, [m * 0.3, 0.24, m * 0.3]); P.add(G.sph, c1, [0, H + 0.3, 0], 0, m * 0.28); }
  if (rand() < 0.35) P.add(G.cylLo, '#e0e0e0', [w * 0.2, H + 0.35, 0], 0, [0.015, 0.7, 0.015]);
}
function bStack(P, fp, H, c1, c2, gl) {
  const n = ri(2, 3); let y = 0, r = fp * 0.47;
  for (let i = 0; i < n; i++) { const h = (H / n) * (i === 0 ? 1.2 : 0.9); P.add(G.cyl, i % 2 ? c2 : c1, [0, y + h / 2, 0], 0, [r, h, r]); P.add(G.cyl, gl, [0, y + h * 0.6, 0], 0, [r * 1.012, h * 0.2, r * 1.012]); y += h; r *= 0.72; }
  P.add(G.hemi, c2, [0, y, 0], 0, [r * 1.25, r, r * 1.25]);
}
function bMush(P, fp, H, c1, c2, gl) {
  const r = fp * 0.5; P.add(G.cyl, c1, [0, H * 0.4, 0], 0, [r * 0.3, H * 0.8, r * 0.3]);
  P.add(G.sph, c2, [0, H * 0.82, 0], 0, [r, H * 0.2, r]); P.add(G.cyl, gl, [0, H * 0.82, 0], 0, [r * 1.01, 0.06, r * 1.01]);
  P.add(G.hemi, c1, [0, H * 0.92, 0], 0, [r * 0.45, r * 0.35, r * 0.45]);
}
function bDome(P, fp, H, c1, c2, gl) {
  const r = fp * 0.48, hh = Math.max(r, H - 0.24);
  P.add(G.cyl, c1, [0, 0.12, 0], 0, [r, 0.24, r]); P.add(G.hemi, c1, [0, 0.24, 0], 0, [r, hh, r]);
  P.add(G.cyl, c2, [0, 0.26, 0], 0, [r * 1.02, 0.05, r * 1.02]);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; P.add(G.sphLo, gl, [Math.cos(a) * r * 0.92, 0.24 + hh * 0.35, Math.sin(a) * r * 0.92], 0, 0.07); }
  P.add(G.rbox, c2, [0, 0.12, r * 0.98], 0, [0.16, 0.24, 0.06]);
}
function bHouse(P, fp, H, c1, c2, gl) {
  if (rand() < 0.5) {
    const r = fp * 0.42; P.add(G.cyl, c1, [0, H * 0.25, 0], 0, [r, H * 0.5, r]); P.add(G.hemi, c1, [0, H * 0.5, 0], 0, [r, r * 0.9, r]);
    P.add(G.cyl, gl, [0, H * 0.32, 0], 0, [r * 1.02, 0.07, r * 1.02]); P.add(G.rbox, c2, [0, H * 0.14, r * 0.95], 0, [0.14, 0.26, 0.08]);
    if (rand() < 0.5) P.add(G.cylLo, '#dcdcdc', [r * 0.5, H * 0.5 + r * 0.6, 0], 0, [0.03, 0.2, 0.03]);
  } else {
    const w = fp * rr(0.75, 0.95), dd = fp * rr(0.65, 0.85); P.add(G.rbox, c1, [0, H * 0.4, 0], 0, [w, H * 0.8, dd]);
    P.add(G.pyr, c2, [0, H * 0.8 + 0.12, 0], 0, [w * 0.58, 0.26, dd * 0.58]);
    P.add(G.box, gl, [0, H * 0.45, 0], 0, [w * 1.02, 0.08, dd * 1.02]);
    P.add(G.rbox, '#8a5a3a', [0, 0.12, dd * 0.5], 0, [0.13, 0.24, 0.04]);
  }
}
function buildCity() {
  CITY.fr = frameAt(REG.city);
  // ---- roads
  const tex = canvasTex(64, 256, (x, w, h) => { x.fillStyle = '#4a4e5b'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f2f2'; x.fillRect(3, 0, 4, h); x.fillRect(w - 7, 0, 4, h); x.fillStyle = '#ffd23a'; x.fillRect(w / 2 - 2, 20, 4, h * 0.5); });
  tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8;
  const pos = [], nor = [], uv = [], idx = [];
  const strip = (n, at, w, lift) => {
    const c = V(), fw = V(), sd = V(), p = V(), prev = V(); let acc = 0; const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      at(i / n, c, fw); sd.crossVectors(fw, c).normalize();
      if (i > 0) acc += prev.distanceTo(c) * R; prev.copy(c);
      const rad = R + CITY.h + lift;
      for (const s of [-1, 1]) { p.copy(c).multiplyScalar(rad).addScaledVector(sd, (s * w) / 2); pos.push(p.x, p.y, p.z); nor.push(c.x, c.y, c.z); uv.push(s < 0 ? 0 : 1, acc / 1.4); }
      if (i < n) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  for (const r of CITY.rings) strip(Math.ceil(r * 12), (t, c, fw) => { const a = t * TAU; cityPolar(r, a, c); cityTan(r, a, fw); }, CITY.roadW, 0.03);
  for (const a of CITY.radials) strip(30, (t, c, fw) => { const r = lerp(1.75, 12.9, t); cityPolar(r, a, c); const c2 = cityPolar(r + 0.02, a, V()); fw.subVectors(c2, c).normalize(); }, CITY.roadW, 0.037);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx);
  const roads = new THREE.Mesh(rg, new THREE.MeshToonMaterial({ map: tex, gradientMap: GRAD_T, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  scene.add(roads);
  // ---- central plaza disc (tiles)
  {
    const pp = [], pu = [], pn = [], pi = []; const NR = 6, NA = 48, pr = 1.78;
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) { const r = (i / NR) * pr, a = (j / NA) * TAU; const d = cityPolar(r, a); const p = d.clone().multiplyScalar(R + CITY.h + 0.025); pp.push(p.x, p.y, p.z); pn.push(d.x, d.y, d.z); pu.push(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; pi.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pn, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(pu, 2)); g.setIndex(pi);
    const t = tileTex('#f1e7d2', '#d6c7a8', 6, 4); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    scene.add(new THREE.Mesh(g, new THREE.MeshToonMaterial({ map: t, gradientMap: GRAD_T, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })));
  }
  // ---- buildings
  const P = new PB();
  const rows = [[4.35, 0.85, 1.5, 3.8, 'A'], [5.5, 0.85, 1.3, 3.2, 'A'], [7.8, 0.85, 0.8, 2.2, 'B'], [8.95, 0.85, 0.7, 1.9, 'B'], [11.35, 0.7, 0.4, 1.0, 'C']];
  const gcA = 200 * DEG; SPOT.gravity = { a: gcA, r: 4.9 };
  for (const [r, fpMax, hMin, hMax, band] of rows) {
    const n = Math.floor((TAU * r) / 1.05);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (band === 'B' ? (0.5 / n) * TAU : 0);
      let skip = false; for (const ra of CITY.radials) if (Math.abs(angDiff(a, ra)) * r < 0.35 + fpMax / 2 + 0.08) skip = true;
      if (band === 'A' && Math.abs(angDiff(a, gcA)) * r < 1.2) skip = true;
      if (skip) continue;
      const dir = cityPolar(r, a), fwd = tangentToward(dir, REG.city);
      if (band === 'C' && i % 2 === 1) { EXPLICIT_TREES.push({ type: 'round', d: dir, h: CITY.h, s: rr(0.75, 1.0) }); continue; }
      const fp = fpMax * rr(0.78, 1), H = rr(hMin, hMax) * (band === 'A' && rand() < 0.2 ? 1.3 : 1);
      const c1 = pick(PASTEL), c2 = pick(ACCENT), gl = rand() < 0.7 ? '#6cc0f2' : '#3b5b8c';
      P.base = mat4At(dir, fwd, -0.02, CITY.h);
      const t = rand();
      if (band === 'A') { if (t < 0.55) bTower(P, fp, H, c1, c2, gl); else if (t < 0.8) bStack(P, fp, H, c1, c2, gl); else bMush(P, fp, H, c1, c2, gl); }
      else if (band === 'B') { if (t < 0.35) bTower(P, fp, H, c1, c2, gl); else if (t < 0.6) bDome(P, fp, H, c1, c2, gl); else if (t < 0.8) bStack(P, fp, H, c1, c2, gl); else bMush(P, fp, H, c1, c2, gl); }
      else bHouse(P, fp, H, c1, c2, gl);
    }
  }
  // ---- Capsule Corporation HQ at the plaza
  const ccBase = mat4At(REG.city, CITY.fr.north, 0, CITY.h); P.base = ccBase;
  P.add(G.cyl, '#f4f1ea', [0, 0.22, 0], 0, [1.32, 0.44, 1.32]);
  P.add(G.hemi, '#fbfaf5', [0, 0.44, 0], 0, [1.3, 1.05, 1.3]);
  P.add(G.cyl, '#ffd23a', [0, 0.46, 0], 0, [1.33, 0.05, 1.33]);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; P.add(G.sphLo, '#3f6fb8', [Math.cos(a) * 1.13, 0.9, Math.sin(a) * 1.13], 0, [0.12, 0.1, 0.12]); }
  P.add(G.rbox, '#3d7eff', [0, 0.18, 1.3], 0, [0.36, 0.36, 0.1]);
  P.add(G.cyl, '#f4f1ea', [1.35, 0.2, -0.75], 0, [0.5, 0.4, 0.5]); P.add(G.hemi, '#fbfaf5', [1.35, 0.4, -0.75], 0, [0.5, 0.42, 0.5]);
  P.add(G.cyl, '#f4f1ea', [-1.25, 0.15, -0.9], 0, [0.36, 0.3, 0.36]); P.add(G.hemi, '#fbfaf5', [-1.25, 0.3, -0.9], 0, [0.36, 0.3, 0.36]);
  P.add(G.cylLo, '#cfcfcf', [0, 1.75, 0], 0, [0.025, 0.6, 0.025]); P.add(G.sphLo, '#ff4d4d', [0, 2.07, 0], 0, 0.06);
  // gravity chamber (band A)
  const gDir = cityPolar(4.9, gcA); SPOT.gravity.dir = gDir; P.base = mat4At(gDir, tangentToward(gDir, REG.city), 0, CITY.h);
  P.add(G.sph, '#f5f5f7', [0, 0.5, 0], 0, [0.5, 0.42, 0.5]); P.add(G.cyl, '#e8453c', [0, 0.52, 0], 0, [0.51, 0.08, 0.51]);
  P.add(G.cyl, '#303848', [0, 0.52, 0.42], [Math.PI / 2, 0, 0], [0.16, 0.06, 0.16]);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.78; P.addDir(G.cylLo, '#9aa0ab', [Math.cos(a) * 0.36, 0.12, Math.sin(a) * 0.36], [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3], [0.03, 0.3, 0.03]); }
  P.base = null; const city = P.mesh(0.035); scene.add(city);
  // CAPSULE CORP band text
  const ct = textTex('CAPSULE CORP', { w: 1024, h: 128, bg: '#ffffff', fg: '#2456c8', size: 104 }); ct.wrapS = THREE.RepeatWrapping; ct.repeat.set(2, 1);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.345, 1.345, 0.24, 64, 1, true), new THREE.MeshToonMaterial({ map: ct, gradientMap: GRAD }));
  band.applyMatrix4(new THREE.Matrix4().copy(ccBase).multiply(new THREE.Matrix4().makeTranslation(0, 0.23, 0))); scene.add(band);
  SPOT.cc = ccBase;
  addPlace('West City', REG.city, 4.5, 26); addPlace('Capsule Corp.', REG.city, 2.4, 7);
  protect(REG.city, 15);
}

// =====================================================================
//  LANDMARKS
// =====================================================================
function buildKameHouse() {
  const fr = frameAt(REG.kame); const dir = offsetDir(fr, 0.2, 0.25), fwd = tangentToward(dir, offsetDir(fr, 0.2, -5)); const h = heightAt(dir);
  const base = mat4At(dir, fwd, -0.03, h); const P = new PB(); P.base = base;
  P.add(G.rbox, '#ff9ec8', [0, 0.3, 0], 0, [0.95, 0.6, 0.72]);
  P.add(G.pyr, '#e5413b', [0, 0.72, 0], 0, [0.62, 0.3, 0.48]);
  P.add(G.rbox, '#ffffff', [-0.25, 0.28, 0.36], 0, [0.22, 0.18, 0.03]); P.add(G.box, '#7ec8f5', [-0.25, 0.28, 0.372], 0, [0.17, 0.13, 0.02]);
  P.add(G.rbox, '#ffffff', [0.47, 0.3, 0.05], 0, [0.03, 0.18, 0.22]); P.add(G.box, '#7ec8f5', [0.482, 0.3, 0.05], 0, [0.02, 0.13, 0.17]);
  P.add(G.rbox, '#8a4b2a', [0.22, 0.18, 0.365], 0, [0.18, 0.34, 0.03]);
  P.add(G.box, '#d8c9a8', [0.22, 0.02, 0.45], 0, [0.28, 0.06, 0.14]);
  // parasol + lounge chair
  P.add(G.cylLo, '#ffffff', [-0.75, 0.25, 0.7], 0, [0.012, 0.5, 0.012]); P.add(G.cone, '#ff5252', [-0.75, 0.52, 0.7], 0, [0.32, 0.12, 0.32]);
  P.add(G.rbox, '#4fa3ff', [-0.62, 0.06, 0.62], [0, 0.4, 0], [0.18, 0.05, 0.42]); P.add(G.rbox, '#4fa3ff', [-0.56, 0.12, 0.47], [0.6, 0.4, 0], [0.18, 0.04, 0.16]);
  const m = P.mesh(0.02); scene.add(m);
  signPanel(base, 'KAME HOUSE', 0.62, 0.12, -0.05, 0.5, 0.372, 0, { bg: '#ff9ec8', fg: '#c8102e', size: 150 });
  EXPLICIT_TREES.push({ type: 'palm', d: offsetDir(fr, -1.0, 0.7), s: 1.15 }, { type: 'palm', d: offsetDir(fr, 1.25, -0.2), s: 0.95 }, { type: 'palm', d: offsetDir(fr, 0.9, 1.1), s: 1.05 });
  SPOT.kame = { base, dir, fwd, fr };
  addPlace('Kame House', dir, 1.5, 8); protect(REG.kame, 4.5);
}
function buildKorin() {
  const d0 = REG.korin, fr = frameAt(d0), h0 = 1.0, TH = 20, LY = 25.4, LR = 4.3;
  const base = mat4At(d0, fr.north, 0, h0); const P = new PB(); P.base = base;
  P.add(G.cyl, '#efe4cc', [0, 0.35, 0], 0, [0.62, 0.7, 0.62]); P.add(G.cyl, '#b3643a', [0, 0.72, 0], 0, [0.66, 0.08, 0.66]);
  P.add(new THREE.CylinderGeometry(0.2, 0.3, 1, 14), '#f3ead6', [0, TH / 2, 0], 0, [1, TH, 1]);
  for (let y = 1.6; y < TH - 0.6; y += 1.35) { const rr_ = 0.3 - 0.1 * (y / TH) + 0.04; P.add(G.cyl, '#c0703f', [0, y, 0], 0, [rr_, 0.09, rr_]); }
  P.add(G.cyl, '#b3643a', [0, TH, 0], 0, [0.95, 0.08, 0.95]);
  P.add(G.torus, '#b3643a', [0, TH + 0.14, 0], [Math.PI / 2, 0, 0], [0.9, 0.9, 0.45]);
  P.add(G.sph, '#f5ecd8', [0, TH + 0.62, 0], 0, [0.62, 0.62, 0.62]); P.add(G.cyl, '#b3643a', [0, TH + 0.55, 0], 0, [0.635, 0.1, 0.635]);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; P.add(G.sphLo, '#3a2a28', [Math.cos(a) * 0.56, TH + 0.78, Math.sin(a) * 0.56], 0, [0.09, 0.14, 0.09]); }
  P.add(G.cone, '#f5ecd8', [0, TH + 1.4, 0], 0, [0.2, 0.62, 0.2]); P.add(G.sphLo, '#e8c550', [0, TH + 1.75, 0], 0, 0.07);
  P.add(G.cyl, '#d8261e', [0, (TH + 1.7 + LY - 2.9) / 2, 0], 0, [0.035, LY - 2.9 - TH - 1.7, 0.035]);
  // Kami's Lookout
  P.add(G.cyl, '#f7f2e6', [0, LY, 0], 0, [LR, 0.3, LR]); P.add(G.cyl, '#e8c550', [0, LY - 0.17, 0], 0, [LR * 1.01, 0.08, LR * 1.01]);
  P.add(G.hemi, '#f0d9a0', [0, LY - 0.15, 0], [Math.PI, 0, 0], [LR * 0.98, 2.3, LR * 0.98]);
  P.add(G.cyl, '#e2c070', [0, LY - 0.9, 0], 0, [LR * 0.86, 0.12, LR * 0.86]);
  P.add(G.cone, '#e9c77e', [0, LY - 2.6, 0], [Math.PI, 0, 0], [0.5, 0.9, 0.5]);
  P.add(G.cyl, '#fbfaf4', [0, LY + 0.6, 0], 0, [1.1, 0.9, 1.1]); P.add(G.hemi, '#fbfaf4', [0, LY + 1.05, 0], 0, [1.1, 0.95, 1.1]);
  P.add(G.cyl, '#e8c550', [0, LY + 1.07, 0], 0, [1.12, 0.06, 1.12]); P.add(G.cone, '#e8c550', [0, LY + 2.25, 0], 0, [0.12, 0.5, 0.12]);
  P.add(G.rbox, '#4a3a6a', [0, LY + 0.45, 1.08], 0, [0.4, 0.6, 0.06]);
  for (const x of [-1.75, 1.75]) { P.add(G.cyl, '#fbfaf4', [x, LY + 0.8, 0.4], 0, [0.3, 1.3, 0.3]); P.add(G.hemi, '#fbfaf4', [x, LY + 1.45, 0.4], 0, [0.3, 0.32, 0.3]); P.add(G.cone, '#e8c550', [x, LY + 1.9, 0.4], 0, [0.06, 0.3, 0.06]); }
  P.add(G.rbox, '#fbfaf4', [0, LY + 0.45, -2.6], 0, [1.0, 0.6, 0.7]); P.add(G.hemi, '#fbfaf4', [0, LY + 0.75, -2.6], 0, [0.4, 0.35, 0.4]); P.add(G.rbox, '#3b2f55', [0, LY + 0.35, -2.24], 0, [0.2, 0.36, 0.04]);
  for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + 0.2; const x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5; if (Math.abs(z + 2.6) < 1.1 && Math.abs(x) < 1.3) continue; if (z > 2.6 && Math.abs(x) < 1) continue; P.add(G.cyl, '#d9cdb5', [x, LY + 0.25, z], 0, [0.22, 0.2, 0.22]); P.addM(TREEGEO.palm, null, new THREE.Matrix4().compose(V().set(x, LY + 0.32, z), new THREE.Quaternion().setFromAxisAngle(_Y, rand() * TAU), V().setScalar(1.15))); }
  const m = P.mesh(0.04); scene.add(m);
  const tt = tileTex('#f2ece0', '#d3c9b4', 8, 3); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(3, 3);
  flatPanel(base, new THREE.CircleGeometry(LR * 0.99, 64), tt, 0, LY + 0.152, 0);
  SPOT.korin = { base, fr, LY, TH, h0 };
  addPlace('Korin Tower', d0, TH + 2.2, 12); addPlace("Kami's Lookout", d0, LY + 2.8, 12);
  protect(d0, 6);
}
function buildGokuHouse() {
  const fr = frameAt(REG.paozu); const d = offsetDir(fr, 0, 0.6), fwd = tangentToward(d, offsetDir(fr, 0, -4)); const h = FLAT[3].h;
  const base = mat4At(d, fwd, -0.02, h); const P = new PB(); P.base = base;
  P.add(G.cyl, '#f6f2e8', [0, 0.18, 0], 0, [0.62, 0.36, 0.62]); P.add(G.hemi, '#fbf8f0', [0, 0.36, 0], 0, [0.62, 0.55, 0.62]);
  P.add(G.cyl, '#d94f3d', [0, 0.37, 0], 0, [0.635, 0.05, 0.635]);
  for (const a of [-0.6, 0.6]) P.add(G.sphLo, '#3b6fb0', [Math.sin(a) * 0.6, 0.24, Math.cos(a) * 0.6], 0, [0.09, 0.08, 0.09]);
  P.add(G.sphLo, '#3b6fb0', [0, 0.62, 0.48], 0, [0.1, 0.09, 0.1]);
  P.add(G.rbox, '#7a4a2a', [0, 0.16, 0.6], 0, [0.2, 0.3, 0.06]);
  P.add(G.rbox, '#f6f2e8', [0.85, 0.18, -0.1], 0, [0.5, 0.36, 0.45]); P.add(G.pyr, '#d94f3d', [0.85, 0.45, -0.1], 0, [0.32, 0.18, 0.29]);
  P.add(G.cylLo, '#8c8c8c', [0.95, 0.55, -0.2], 0, [0.04, 0.3, 0.04]);
  for (let k = 0; k < 4; k++) P.add(G.cylLo, '#9c6a3c', [-0.85, 0.05 + (k > 2 ? 0.09 : 0), 0.1 + (k % 3) * 0.09 - 0.09], [Math.PI / 2, 0, 0], [0.045, 0.4, 0.045]);
  // grandpa's shrine with the 4-star ball on a cushion
  P.add(G.rbox, '#c0392b', [0.5, 0.06, 0.8], 0, [0.2, 0.08, 0.2]);
  scene.add(P.mesh(0.022));
  const b4 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshToonMaterial({ map: dragonBallTex(4), gradientMap: GRAD, emissive: 0x442200 }));
  b4.applyMatrix4(new THREE.Matrix4().copy(base).multiply(new THREE.Matrix4().makeTranslation(0.5, 0.16, 0.8))); scene.add(b4);
  SPOT.paozu = { base, d, fwd, fr };
  addPlace("Goku's House", d, 1.7, 9); addPlace('Mt. Paozu', REG.paozu, 9, 24); protect(REG.paozu, 4.5);
}
function buildBuuHouse() {
  const fr = frameAt(REG.buu); const d = offsetDir(fr, 0.3, 0.3), fwd = tangentToward(d, offsetDir(fr, 0.3, -4)); const h = FLAT[2].h;
  const base = mat4At(d, fwd, -0.02, h); const P = new PB(); P.base = base; const pk = '#ff9fc9';
  P.add(G.sph, pk, [0, 0.52, 0], 0, [0.95, 0.72, 0.95]); P.add(G.cone, pk, [0, 1.3, 0], 0, [0.3, 0.55, 0.3]); P.add(G.sph, pk, [0, 1.6, 0], 0, 0.11);
  for (const [x, y] of [[-0.42, 0.62], [0.42, 0.62], [0, 0.9]]) { P.add(G.torus, '#ffffff', [x, y, Math.sqrt(Math.max(0, 1 - (x / 0.95) ** 2 - ((y - 0.52) / 0.72) ** 2)) * 0.95 - 0.02], 0, [0.1, 0.1, 0.1]); P.add(G.sphLo, '#303048', [x, y, Math.sqrt(Math.max(0, 1 - (x / 0.95) ** 2 - ((y - 0.52) / 0.72) ** 2)) * 0.95 - 0.05], 0, [0.08, 0.08, 0.05]); }
  P.add(G.rbox, '#c24d86', [0, 0.2, 0.9], 0, [0.26, 0.4, 0.1]);
  for (const x of [-0.7, 0.7]) P.add(G.cylLo, pk, [x, 0.98, 0], [0, 0, x > 0 ? -0.7 : 0.7], [0.07, 0.3, 0.07]);
  scene.add(P.mesh(0.025));
  SPOT.buu = { base, d, fwd, fr };
  addPlace("Buu's House", d, 2.2, 10); protect(REG.buu, 4);
}
function buildTournament() {
  const d0 = REG.tourn, fr = frameAt(d0), h0 = heightAt(d0); const base = mat4At(d0, fr.north, 0, h0); const P = new PB(); P.base = base;
  P.add(G.box, '#dcd6c6', [0, 0.02, 0], 0, [3.6, 0.52, 3.6]); P.add(G.box, '#bdb5a2', [0, -0.12, 0], 0, [3.85, 0.3, 3.85]);
  P.add(G.box, '#cfc8b6', [0, 0.06, 2.0], 0, [0.9, 0.2, 0.34]);
  const pz = -3.25;
  P.add(G.box, '#f1e6cc', [0, 0.5, pz], 0, [2.2, 1.0, 1.2]);
  for (const x of [-0.9, -0.3, 0.3, 0.9]) P.add(G.cylLo, '#c9352a', [x, 0.5, pz + 0.66], 0, [0.06, 1.0, 0.06]);
  P.add(G.pyr, '#d6452f', [0, 1.15, pz], 0, [1.45, 0.35, 0.92]); P.add(G.box, '#f1e6cc', [0, 1.5, pz], 0, [1.2, 0.46, 0.75]);
  P.add(G.pyr, '#d6452f', [0, 1.88, pz], 0, [0.95, 0.32, 0.62]); P.add(G.cone, '#f5c542', [0, 2.2, pz], 0, [0.07, 0.34, 0.07]);
  P.add(G.rbox, '#6b2d1e', [0, 0.35, pz + 0.61], 0, [0.4, 0.7, 0.04]);
  for (const x of [-1.2, 1.2]) P.add(G.cylLo, '#d63a2c', [x, 0.6, 3.1], 0, [0.08, 1.2, 0.08]);
  P.add(G.box, '#d63a2c', [0, 1.22, 3.1], 0, [3.0, 0.1, 0.14]); P.add(G.box, '#2b2b2b', [0, 1.3, 3.1], 0, [3.2, 0.06, 0.18]); P.add(G.box, '#d63a2c', [0, 1.0, 3.1], 0, [2.5, 0.07, 0.1]);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) P.add(G.box, k % 2 ? '#bda27c' : '#caa987', [sx * (2.45 + k * 0.32), 0.1 + k * 0.14, 0], 0, [0.3, 0.2 + k * 0.28, 3.2]);
  scene.add(P.mesh(0.03));
  const tt = tileTex('#e6e0d0', '#b8b09c', 10, 3); flatPanel(base, new THREE.PlaneGeometry(3.58, 3.58), tt, 0, 0.282, 0);
  signPanel(base, 'TENKAICHI BUDOKAI', 2.4, 0.26, 0, 1.1, 3.19, 0, { bg: '#fff3d6', fg: '#c8102e', size: 96 });
  SPOT.tourn = { base, fr, h0 };
  addPlace('World Tournament', d0, 3, 13); protect(d0, 7.5);
}
function buildCellArena() {
  const d0 = REG.cell, fr = frameAt(d0), h0 = FLAT[4].h; const base = mat4At(d0, fr.north, 0, h0); const P = new PB(); P.base = base;
  P.add(G.box, '#e7e3d9', [0, 0.05, 0], 0, [5.2, 0.7, 5.2]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { P.add(G.cyl, '#f2efe8', [sx * 2.35, 1.1, sz * 2.35], 0, [0.16, 1.4, 0.16]); P.add(G.cyl, '#d7d2c4', [sx * 2.35, 1.84, sz * 2.35], 0, [0.22, 0.12, 0.22]); P.add(G.sph, '#f2efe8', [sx * 2.35, 1.97, sz * 2.35], 0, 0.14); }
  scene.add(P.mesh(0.035));
  const tt = tileTex('#efebe2', '#c9c2b2', 12, 3); flatPanel(base, new THREE.PlaneGeometry(5.18, 5.18), tt, 0, 0.402, 0);
  SPOT.cell = { base, fr, h0 };
  addPlace('Cell Games Arena', d0, 2.4, 13); protect(d0, 7.5);
}
function buildPods() {
  const P = new PB(); SPOT.pods = [];
  for (let i = 0; i < 3; i++) {
    const c = CRATERS[i].c; const h = heightAt(c); const f = randTangent(c, V()); P.base = mat4At(c, f, -0.12, h);
    P.add(G.sph, '#f3f3f6', [0, 0.36, 0], 0, 0.42); P.add(G.sph, '#9e1b48', [0, 0.46, 0.28], 0, [0.22, 0.2, 0.17]);
    P.add(G.cyl, '#bfc3cc', [0, 0.34, 0], 0, [0.43, 0.06, 0.43]); P.add(G.cylLo, '#c9ccd4', [0, 0.1, 0], 0, [0.3, 0.2, 0.3]);
    SPOT.pods.push({ c, f });
  }
  scene.add(P.mesh(0.03));
  addPlace('Saiyan Pods', REG.pods, 1.8, 11);
}
function buildFriezaShip() {
  const d0 = REG.frieza, fr = frameAt(d0), h0 = FLAT[5].h; const base = mat4At(d0, fr.north, 0, h0); const P = new PB(); P.base = base;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; const x0 = Math.cos(a) * 1.95, z0 = Math.sin(a) * 1.95, x1 = Math.cos(a) * 1.35, z1 = Math.sin(a) * 1.35; P.addDir(G.cylLo, '#b9b3a2', [(x0 + x1) / 2, 0.5, (z0 + z1) / 2], [x1 - x0, 1.0, z1 - z0], [0.07, 1.17, 0.07]); P.add(G.cylLo, '#a8a290', [x0, 0.03, z0], 0, [0.16, 0.06, 0.16]); }
  P.add(G.sph, '#efe8d6', [0, 1.35, 0], 0, [2.5, 0.7, 2.5]);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; P.add(G.sphLo, '#ffb347', [Math.cos(a) * 2.44, 1.38, Math.sin(a) * 2.44], 0, 0.14); }
  P.add(G.cyl, '#d7ceb8', [0, 1.02, 0], 0, [1.9, 0.12, 1.9]);
  P.add(G.hemi, '#f5f0e2', [0, 1.85, 0], 0, [0.9, 0.45, 0.9]); P.add(G.sphLo, '#7ad3ff', [0, 2.32, 0], 0, 0.12);
  P.add(G.box, '#d9d2bf', [0, 0.5, 2.25], [0.5, 0, 0], [0.7, 0.05, 1.3]);
  scene.add(P.mesh(0.04));
  SPOT.frieza = { base, fr, h0 };
  addPlace("Frieza's Ship", d0, 3.4, 14); protect(d0, 6.5);
}
