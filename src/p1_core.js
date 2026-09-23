import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// =====================================================================
//  UTILITIES
// =====================================================================
const $ = (id) => document.getElementById(id);
const QS = new URLSearchParams(location.search);
const QUALITY = QS.get('q') || 'med';
const R = 50;                                   // sea-level radius of the planet
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (k, dt) => 1 - Math.exp(-k * dt);
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(90210);
const rr = (a, b) => a + (b - a) * rand();
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const noop = () => {};
const V = () => new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0), _X = new THREE.Vector3(1, 0, 0), _Z = new THREE.Vector3(0, 0, 1);
function dirLL(lat, lon) { const la = lat * DEG, lo = lon * DEG; return new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)); }
function randDir(out = V()) { const u = rand() * 2 - 1, t = rand() * TAU, s = Math.sqrt(1 - u * u); return out.set(s * Math.cos(t), u, s * Math.sin(t)); }
function frameAt(up) {
  const u = up.clone().normalize(); const ref = Math.abs(u.y) > 0.98 ? _Z : _Y;
  const east = V().crossVectors(ref, u).normalize(); const north = V().crossVectors(u, east).normalize();
  return { up: u, east, north };
}
// exact arc offset (dx east, dy north, in world units measured at radius R)
function offsetDir(fr, dx, dy, out = V()) {
  const d = Math.hypot(dx, dy); if (d < 1e-9) return out.copy(fr.up);
  const a = d / R, s = Math.sin(a) / d;
  return out.copy(fr.up).multiplyScalar(Math.cos(a)).addScaledVector(fr.east, dx * s).addScaledVector(fr.north, dy * s).normalize();
}
function randTangent(up, out = V()) { randDir(out); out.addScaledVector(up, -out.dot(up)); if (out.lengthSq() < 1e-6) out.set(1, 0, 0).addScaledVector(up, -up.x); return out.normalize(); }
function tangentToward(from, to, out = V()) { out.copy(to).addScaledVector(from, -to.dot(from)); if (out.lengthSq() < 1e-10) return randTangent(from, out); return out.normalize(); }
const _bm = new THREE.Matrix4(), _b1 = V(), _b2 = V();
function basisQuat(up, fwd, out = new THREE.Quaternion()) {
  _b2.copy(fwd).addScaledVector(up, -fwd.dot(up));
  if (_b2.lengthSq() < 1e-10) { _b2.set(1, 0, 0); if (Math.abs(up.x) > 0.9) _b2.set(0, 0, 1); _b2.addScaledVector(up, -_b2.dot(up)); }
  _b2.normalize(); _b1.crossVectors(up, _b2);
  _bm.makeBasis(_b1, up, _b2); return out.setFromRotationMatrix(_bm);
}
const _rq = new THREE.Quaternion(), _ra = V();
// move a point (dir) along its forward tangent over the sphere
function moveAlong(dir, fwd, dist) {
  _ra.crossVectors(dir, fwd); if (_ra.lengthSq() < 1e-12) return;
  _ra.normalize(); _rq.setFromAxisAngle(_ra, dist / R);
  dir.applyQuaternion(_rq).normalize(); fwd.applyQuaternion(_rq); fwd.addScaledVector(dir, -fwd.dot(dir)).normalize();
}
function turnAround(dir, fwd, ang) { _rq.setFromAxisAngle(dir, ang); fwd.applyQuaternion(_rq).normalize(); }
function arcDist(d, c) { let t = d.x * c.x + d.y * c.y + d.z * c.z; t = t > 1 ? 1 : t < -1 ? -1 : t; return Math.acos(t) * R; }
function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// =====================================================================
//  SIMPLEX NOISE 3D (seeded)
// =====================================================================
const grad3 = new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);
const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
(function () { const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i; const r = mulberry32(1337);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; } })();
const F3 = 1 / 3, G3 = 1 / 6;
function noise3(xin, yin, zin) {
  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
  const s = (xin + yin + zin) * F3; const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
  const t = (i + j + k) * G3; const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
  else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
  const ii = i & 255, jj = j & 255, kk = k & 255;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 > 0) { const gi = pm12[ii + perm[jj + perm[kk]]] * 3; t0 *= t0; n0 = t0 * t0 * (grad3[gi] * x0 + grad3[gi + 1] * y0 + grad3[gi + 2] * z0); }
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 > 0) { const gi = pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; t1 *= t1; n1 = t1 * t1 * (grad3[gi] * x1 + grad3[gi + 1] * y1 + grad3[gi + 2] * z1); }
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 > 0) { const gi = pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; t2 *= t2; n2 = t2 * t2 * (grad3[gi] * x2 + grad3[gi + 1] * y2 + grad3[gi + 2] * z2); }
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 > 0) { const gi = pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; t3 *= t3; n3 = t3 * t3 * (grad3[gi] * x3 + grad3[gi + 1] * y3 + grad3[gi + 2] * z3); }
  return 32 * (n0 + n1 + n2 + n3);
}
function fbm(x, y, z, oct) { let a = 0.5, f = 1, s = 0, n = 0; for (let o = 0; o < oct; o++) { s += a * noise3(x * f, y * f, z * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }
function ridged(x, y, z, oct) { let a = 0.5, f = 1, s = 0, n = 0; for (let o = 0; o < oct; o++) { let v = 1 - Math.abs(noise3(x * f + 11.3, y * f - 7.1, z * f + 3.7)); v *= v; s += a * v; n += a; a *= 0.5; f *= 2.1; } return s / n; }

// =====================================================================
//  RENDERER / SCENE / LIGHTS
// =====================================================================
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa8dcff, 1e4, 2e4);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 6000);
const SUN_DIR = new THREE.Vector3(0.42, 0.5, 0.76).normalize();
const sunLight = new THREE.DirectionalLight(0xfff0d6, 2.3); sunLight.position.copy(SUN_DIR).multiplyScalar(300); scene.add(sunLight, sunLight.target);
const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.45); scene.add(fillLight, fillLight.target);
const ambLight = new THREE.AmbientLight(0xa9c2ff, 0.85); scene.add(ambLight);
const U = { time: { value: 0 } };

// =====================================================================
//  MATERIALS (toon + ink outline)
// =====================================================================
function makeGradient(levels) { const t = new THREE.DataTexture(new Uint8Array(levels), levels.length, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }
const GRAD = makeGradient([80, 170, 255]);
const GRAD_T = makeGradient([105, 185, 255]);
const MAT = {
  toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD }),
  toonDS: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD, side: THREE.DoubleSide }),
  glowBasic: new THREE.MeshBasicMaterial({ vertexColors: true }),
  toonI: new THREE.MeshToonMaterial({ gradientMap: GRAD }),
};
function rawC(c, out = new THREE.Color()) { return typeof c === 'number' ? out.setHex(c, THREE.LinearSRGBColorSpace) : out.setStyle(c, THREE.LinearSRGBColorSpace); }
const INK = 0x1a1226;
const _outlineCache = new Map();
function outlineMat(t) {
  const key = t.toFixed(4); let m = _outlineCache.get(key); if (m) return m;
  m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.uniforms.uOT = { value: t }; sh.vertexShader = 'uniform float uOT;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * uOT;'); };
  m.customProgramCacheKey = () => 'ink-outline'; m.userData.isOutline = true;
  _outlineCache.set(key, m); return m;
}
function toonColor(hex, opts = {}) { return new THREE.MeshToonMaterial(Object.assign({ color: hex, gradientMap: GRAD }, opts)); }

// =====================================================================
//  GEOMETRY LIBRARY + PART BUILDER (merges primitives w/ vertex colors)
// =====================================================================
const G = {
  sph: new THREE.SphereGeometry(1, 16, 12), sphLo: new THREE.SphereGeometry(1, 10, 8),
  hemi: new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16), cylLo: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 14), coneLo: new THREE.ConeGeometry(1, 1, 7), cone4: new THREE.ConeGeometry(1, 1, 4),
  box: new THREE.BoxGeometry(1, 1, 1), rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
  torus: new THREE.TorusGeometry(1, 0.22, 8, 24), ico: new THREE.IcosahedronGeometry(1, 1), dodec: new THREE.DodecahedronGeometry(1, 0),
  circle: new THREE.CircleGeometry(1, 24),
  pyr: new THREE.ConeGeometry(Math.SQRT2, 1, 4).rotateY(Math.PI / 4),
  sphT: new THREE.SphereGeometry(1, 9, 7),
  skirt: new THREE.CylinderGeometry(0.6, 1, 1, 14),
};
const _capCache = new Map();
function capG(r, L) { const k = r.toFixed(3) + '_' + L.toFixed(3); let g = _capCache.get(k); if (!g) { g = new THREE.CapsuleGeometry(r, L, 3, 10); _capCache.set(k, g); } return g; }
const _c = new THREE.Color(), _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pe = new THREE.Euler(), _ps = V(), _pp = V(), _pd = V();
class PB {
  constructor() { this.list = []; this.base = null; }
  _push(g, color) {
    for (const k of ['uv', 'uv1', 'uv2']) if (g.attributes[k]) g.deleteAttribute(k);
    const n = g.attributes.position.count;
    if (!g.index) { const idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new THREE.BufferAttribute(idx, 1)); }
    if (color === null && g.attributes.color) { this.list.push(g); return this; }
    _c.set(color === null ? '#ffffff' : color); const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); this.list.push(g); return this;
  }
  _fin(g, color) { if (this.base) _pm.premultiply(this.base); g.applyMatrix4(_pm); return this._push(g, color); }
  add(geo, color, p = [0, 0, 0], r = 0, s = 1) {
    _pe.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0);
    if (typeof s === 'number') _ps.set(s, s, s); else _ps.set(s[0], s[1], s[2]);
    _pm.compose(_pp.set(p[0], p[1], p[2]), _pq.setFromEuler(_pe), _ps); return this._fin(geo.clone(), color);
  }
  addDir(geo, color, p, d, s = 1) {
    _pd.set(d[0], d[1], d[2]).normalize(); _pq.setFromUnitVectors(_Y, _pd);
    if (typeof s === 'number') _ps.set(s, s, s); else _ps.set(s[0], s[1], s[2]);
    _pm.compose(_pp.set(p[0], p[1], p[2]), _pq, _ps); return this._fin(geo.clone(), color);
  }
  addM(geo, color, m, clone = true) { _pm.copy(m); return this._fin(clone ? geo.clone() : geo, color); }
  get empty() { return this.list.length === 0; }
  geometry() { const g = mergeGeometries(this.list, false); for (const x of this.list) x.dispose(); this.list = []; g.computeBoundingSphere(); return g; }
  mesh(outline = 0.012, mat = MAT.toon) { const g = this.geometry(); const m = new THREE.Mesh(g, mat); if (outline > 0) { const o = new THREE.Mesh(outlineGeo(g), outlineMat(outline)); m.add(o); m.userData.outline = o; } return m; }
}
// outline shell geometry with smoothed (position-welded) normals => crack-free ink lines
function outlineGeo(g) {
  const o = new THREE.BufferGeometry(); o.setAttribute('position', g.attributes.position); if (g.index) o.setIndex(g.index);
  const m = mergeVertices(o, 1e-4); m.computeVertexNormals(); m.computeBoundingSphere(); return m;
}
// spike helper: cone with its base at b pointing along d
function spk(P, col, b, d, len, rad) { const n = Math.hypot(d[0], d[1], d[2]); const x = d[0] / n, y = d[1] / n, z = d[2] / n; P.addDir(G.coneLo, col, [b[0] + x * len / 2, b[1] + y * len / 2, b[2] + z * len / 2], [x, y, z], [rad, len, rad]); }
function instanced(geo, count, mat = MAT.toon, outline = 0, ogeo = null) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count)); m.count = count; m.frustumCulled = false;
  if (outline > 0) { const o = new THREE.InstancedMesh(ogeo || geo, outlineMat(outline), Math.max(1, count)); o.count = count; o.instanceMatrix = m.instanceMatrix; o.frustumCulled = false; m.add(o); m.userData.outline = o; }
  return m;
}

// =====================================================================
//  CANVAS TEXTURES
// =====================================================================
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function textTex(text, { w = 1024, h = 256, bg = '#ffffff', fg = '#1d5fd1', size = 150, stroke = null, font = 'Bangers' } = {}) {
  return canvasTex(w, h, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h); x.font = `${size}px ${font}, Impact, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (stroke) { x.lineWidth = size * 0.12; x.strokeStyle = stroke; x.strokeText(text, w / 2, h / 2 + size * 0.04); }
    x.fillStyle = fg; x.fillText(text, w / 2, h / 2 + size * 0.04);
  });
}
function glowTex(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,220,120,0.6)', outer = 'rgba(255,160,40,0)') {
  return canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(0.35, mid); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
}
function drawStar(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr_ = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_); } x.closePath(); x.fill(); }
const STAR_LAYOUT = { 1: [[0, 0]], 2: [[-1, 0], [1, 0]], 3: [[0, -1], [-0.9, 0.6], [0.9, 0.6]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[0, -1.1], [-1.1, -0.3], [1.1, -0.3], [-0.7, 1], [0.7, 1]], 6: [[-1, -1], [1, -1], [-1.2, 0.2], [1.2, 0.2], [-0.5, 1.2], [0.5, 1.2]], 7: [[0, 0], [0, -1.3], [-1.15, -0.6], [1.15, -0.6], [-1.15, 0.7], [1.15, 0.7], [0, 1.35]] };
function dragonBallTex(n) {
  return canvasTex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffd45a'); g.addColorStop(0.5, '#ff9a0e'); g.addColorStop(1, '#e06a00'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e3140b'; const cx = 128, cy = 128, sp = n === 1 ? 0 : 17, r = n === 1 ? 22 : 13;
    for (const [a, b] of STAR_LAYOUT[n]) drawStar(x, cx + a * sp, cy + b * sp, r);
  });
}
