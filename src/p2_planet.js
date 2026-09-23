
// =====================================================================
//  PLANET LAYOUT (regions, flat zones, islands, volcano, craters)
// =====================================================================
const REG = {
  city: dirLL(12, 4), korin: dirLL(30, -34), paozu: dirLL(40, 46), buu: dirLL(52, -4),
  jungle: dirLL(-4, 110), volcano: dirLL(9, 128), snow: dirLL(58, 170),
  waste: dirLL(-24, -58), cell: dirLL(-14, -50), pods: dirLL(-33, -69), frieza: dirLL(-38, -44),
  kame: dirLL(-16, 36), tourn: dirLL(-44, 66),
};
const kRad = (deg) => 1 - Math.cos(deg * DEG);
const kSnow = kRad(22), kWaste = kRad(26), kJungle = kRad(24);
const RAISE = [
  [REG.city, 0.6, 24], [REG.korin, 0.42, 16], [REG.paozu, 0.52, 20], [REG.buu, 0.36, 14],
  [REG.jungle, 0.55, 26], [REG.volcano, 0.45, 14], [REG.snow, 0.55, 22], [REG.waste, 0.65, 28],
  [dirLL(88, 0), 0.42, 24], [dirLL(-88, 0), 0.5, 22],
  [REG.kame, -0.8, 15], [REG.tourn, -0.85, 14], [dirLL(-8, -142), -0.5, 30], [dirLL(22, -96), -0.38, 18],
  [dirLL(-30, 168), -0.35, 22], [dirLL(-18, 8), -0.3, 12],
].map(([c, a, deg]) => ({ c, a, k: kRad(deg) }));
const FLAT = [
  { c: REG.city, h: 0.9, r0: 12.6, r1: 17.5, city: true },
  { c: REG.korin, h: 1.0, r0: 3.2, r1: 7 },
  { c: REG.buu, h: 0.8, r0: 3.2, r1: 6.5 },
  { c: REG.paozu, h: 1.2, r0: 3.8, r1: 7.5 },
  { c: REG.cell, h: 1.1, r0: 5.2, r1: 8.8 },
  { c: REG.frieza, h: 1.0, r0: 4.6, r1: 7.6 },
  { c: REG.pods, h: 1.0, r0: 4.5, r1: 7.5 },
].map((f) => Object.assign(f, { cos1: Math.cos(f.r1 / R) }));
const ISL = [{ c: REG.kame, r: 2.8, top: 0.34 }, { c: REG.tourn, r: 6.2, top: 0.9 }];
const VOLC = { c: REG.volcano, r: 12, peak: 9.5, cr: 1.9, cd: 2.4, cos: Math.cos(13.5 / R) };
const CRATERS = [];
function addCraterData(c, r, depth, rim, burn) { const cr = { c: c.clone().normalize(), r, depth, rim, burn, cos: Math.cos(Math.min(Math.PI, (r * 2.2) / R)) }; CRATERS.push(cr); return cr; }
const BW = { city: 0, desert: 0, jungle: 0, volc: 0, lava: 0, scorch: 0, snowR: 0, mtn: 0 };
const dot3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

function heightAt(d, bw = BW, noIsl = false) {
  const x = d.x, y = d.y, z = d.z;
  let cont = fbm(x * 1.3 + 3.1, y * 1.3 - 1.7, z * 1.3 + 0.4, 5) * 1.4 - 0.08;
  for (let i = 0; i < RAISE.length; i++) { const r = RAISE[i]; cont += r.a * Math.exp(-(1 - dot3(d, r.c)) / r.k); }
  const hills = fbm(x * 7 + 9, y * 7, z * 7 - 4, 3);
  let h = (cont < 0 ? Math.max(cont * 24, -7) : cont * 4.4) + hills * 0.5;
  bw.city = bw.desert = bw.jungle = bw.volc = bw.lava = bw.scorch = bw.snowR = bw.mtn = 0;
  // volcano weight (computed first so mountains skip it)
  const dv = dot3(d, VOLC.c); let sv = 1e9;
  if (dv > VOLC.cos) { sv = Math.acos(Math.min(1, dv)) * R; bw.volc = 1 - smooth(VOLC.r * 0.5, VOLC.r * 1.1, sv); }
  if (cont > 0) {
    const snowR = Math.exp(-(1 - dot3(d, REG.snow)) / kSnow);
    const mm = clamp(smooth(0.05, 0.35, fbm(x * 2.4 - 5, y * 2.4 + 2, z * 2.4 + 7, 3)) + snowR * 1.25, 0, 1.4) * (1 - bw.volc);
    const m = smooth(0.06, 0.4, cont) * mm;
    if (m > 0.001) { const rid = ridged(x * 4.5, y * 4.5, z * 4.5, 4); h += m * Math.pow(rid, 2.3) * (7 + 4 * snowR); }
    bw.mtn = m; bw.snowR = snowR;
  }
  // wasteland terraces (mesas)
  const wd = Math.exp(-(1 - dot3(d, REG.waste)) / kWaste);
  bw.desert = smooth(0.3, 0.62, wd);
  if (bw.desert > 0 && h > 0.3) { const st = 1.15, q = h / st, fl = Math.floor(q), f = q - fl; const tq = (fl + smooth(0.72, 0.95, f)) * st; h = lerp(h, tq, bw.desert); }
  bw.jungle = smooth(0.3, 0.6, Math.exp(-(1 - dot3(d, REG.jungle)) / kJungle));
  // volcano cone
  if (sv < VOLC.r) {
    let ch = VOLC.peak * Math.pow(1 - sv / VOLC.r, 1.5) + 0.4;
    if (sv < VOLC.cr) { const rimH = VOLC.peak * Math.pow(1 - VOLC.cr / VOLC.r, 1.5) + 0.4; ch = rimH - VOLC.cd * (1 - (sv / VOLC.cr) ** 2); bw.lava = 1 - smooth(VOLC.cr * 0.6, VOLC.cr * 0.95, sv); }
    h = Math.max(h, ch);
  }
  // flat building zones
  for (let i = 0; i < FLAT.length; i++) {
    const f = FLAT[i]; const dt = dot3(d, f.c);
    if (dt > f.cos1) { const s = Math.acos(Math.min(1, dt)) * R; const w = 1 - smooth(f.r0, f.r1, s); h = lerp(h, f.h, w); if (f.city) bw.city = 1 - smooth(f.r0 - 0.4, f.r0 + 1.4, s); }
  }
  // islands
  if (!noIsl) for (let i = 0; i < ISL.length; i++) {
    const is = ISL[i]; const dt = dot3(d, is.c);
    if (dt > is.cos) { const s = Math.acos(Math.min(1, dt)) * R; const p = s < is.r ? lerp(is.top + hills * 0.08, -0.35, smooth(is.r * 0.5, is.r, s)) : -0.35 - (s - is.r) * 1.4; if (p > h) h = p; }
  }
  // craters (static + kamehameha)
  for (let i = 0; i < CRATERS.length; i++) {
    const c = CRATERS[i]; const dt = dot3(d, c.c);
    if (dt > c.cos) { const s = Math.acos(Math.min(1, dt)) * R; const u = s / c.r; if (u < 1) h -= c.depth * (1 - u * u); h += c.rim * Math.exp(-((u - 1) * (u - 1)) / 0.09); bw.scorch = Math.max(bw.scorch, c.burn * (1 - smooth(0.5, 1.35, u))); }
  }
  return h;
}
const groundH = (d) => Math.max(heightAt(d, BW), 0);

// =====================================================================
//  TERRAIN COLORS
// =====================================================================
const hexC = (h) => new THREE.Color(h);
const TC = {
  deep: hexC('#0a4a78'), shallow: hexC('#46d6d0'), foam: hexC('#ffffff'), sand: hexC('#f6dd97'),
  grass: hexC('#5fd14a'), grass2: hexC('#8ee052'), forest: hexC('#2e9c3d'), hill: hexC('#a9c957'),
  rock: hexC('#a8876a'), rock2: hexC('#806654'), snow: hexC('#f7fbff'),
  jungle: hexC('#27a13f'), jungle2: hexC('#127a36'),
  d: [hexC('#efb26b'), hexC('#dc8b4d'), hexC('#f6cf95'), hexC('#c96f3f')],
  city: hexC('#b3e68a'), basalt: hexC('#4b3b3d'), basalt2: hexC('#62463f'), lava: hexC('#ff5a14'),
  scorch: hexC('#3b2b24'), ice: hexC('#e9f7ff'),
};
const _tc = new THREE.Color();
function colorAt(d, h, bw, out) {
  const x = d.x, y = d.y, z = d.z;
  const n1 = noise3(x * 9, y * 9, z * 9), n2 = noise3(x * 23 + 5, y * 23, z * 23);
  if (h < -0.16) out.copy(TC.shallow).lerp(TC.deep, smooth(-0.3, -4.5, h));
  else if (h < 0.07) out.copy(TC.foam);
  else if (h < 0.42 && bw.volc < 0.5) out.copy(TC.sand);
  else {
    let sl = 3.3 + n1 * 0.6, sn = 6.2 + n1 * 0.8;
    sl -= bw.snowR * 1.3; sn -= bw.snowR * 2.6;
    if (h < sl) {
      const patch = fbm(x * 5 + 2, y * 5 - 3, z * 5 + 8, 3);
      out.copy(TC.grass).lerp(TC.grass2, clamp(n2 * 0.5 + 0.5, 0, 1) * 0.55);
      if (patch > 0.1) out.lerp(TC.forest, smooth(0.1, 0.18, patch) * (1 - bw.city));
      out.lerp(TC.hill, smooth(sl - 1.6, sl - 0.2, h));
      if (bw.jungle > 0) { _tc.copy(TC.jungle).lerp(TC.jungle2, smooth(-0.2, 0.3, n2)); out.lerp(_tc, bw.jungle); }
    } else if (h < sn) out.copy(TC.rock).lerp(TC.rock2, smooth(-0.3, 0.3, n2));
    else out.copy(TC.snow);
    if (bw.desert > 0) { const band = ((Math.floor(h * 1.7 + n1 * 0.35) % 4) + 4) % 4; out.lerp(TC.d[band], bw.desert * (h < sn ? 1 : 0.3)); }
    if (bw.city > 0) out.lerp(TC.city, bw.city);
  }
  if (bw.volc > 0 && h > 0.07) { _tc.copy(TC.basalt).lerp(TC.basalt2, smooth(-0.3, 0.3, n2)); out.lerp(_tc, bw.volc); }
  if (bw.lava > 0) out.lerp(TC.lava, bw.lava);
  if (bw.scorch > 0) out.lerp(TC.scorch, bw.scorch);
  const ice = smooth(0.855, 0.9, Math.abs(y) + n1 * 0.035);
  if (ice > 0 && h > -0.4) out.lerp(TC.ice, ice);
  return out;
}

// =====================================================================
//  TERRAIN MESH
// =====================================================================
const DETAIL = QUALITY === 'low' ? 60 : QUALITY === 'high' ? 128 : 92;
let terrain, terrainGeo, TDIR, THGT;
const terrainMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD_T });
function buildTerrain() {
  // extra little ocean islands (only where the sea is deep)
  const cand = [dirLL(-22, 18), dirLL(-30, 48), dirLL(-2, -150), dirLL(14, -118), dirLL(-36, 165), dirLL(-6, 58), dirLL(28, -82), dirLL(-52, 22), dirLL(-10, -20), dirLL(-26, 92), dirLL(-8, -128), dirLL(-40, -100), dirLL(-18, 150), dirLL(22, -140)];
  for (const c of cand) { if (heightAt(c, BW, true) < -2.5) ISL.push({ c, r: rr(1.8, 3.4), top: rr(0.3, 1.1), small: true }); }
  for (const is of ISL) is.cos = Math.cos((is.r + 5.5) / R);
  // static craters: saiyan pod landing site + old battle crater
  const fp = frameAt(REG.pods);
  addCraterData(offsetDir(fp, 2.4, 1.0), 1.25, 0.55, 0.28, 0.35);
  addCraterData(offsetDir(fp, -2.1, 1.9), 1.2, 0.55, 0.28, 0.35);
  addCraterData(offsetDir(fp, 0.4, -2.4), 1.3, 0.6, 0.3, 0.35);
  addCraterData(offsetDir(frameAt(REG.waste), 5, -4), 4.2, 1.5, 0.55, 0.12);

  let g = new THREE.IcosahedronGeometry(1, DETAIL);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-5);
  const pos = g.attributes.position, n = pos.count;
  TDIR = new Float32Array(n * 3); THGT = new Float32Array(n);
  const col = new Float32Array(n * 3), d = V(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const h = heightAt(d, BW); colorAt(d, h, BW, c);
    TDIR[i * 3] = d.x; TDIR[i * 3 + 1] = d.y; TDIR[i * 3 + 2] = d.z; THGT[i] = h;
    const r = R + h; pos.setXYZ(i, d.x * r, d.y * r, d.z * r);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere();
  terrainGeo = g;
  terrain = new THREE.Mesh(g, terrainMat);
  const ol = new THREE.Mesh(g, outlineMat(0.14)); terrain.add(ol);
  scene.add(terrain);
}
function updateTerrainRegion(c, radius) {
  const pos = terrainGeo.attributes.position, col = terrainGeo.attributes.color;
  const cth = Math.cos(radius / R), d = V(), cc = new THREE.Color();
  for (let i = 0, n = pos.count; i < n; i++) {
    const dx = TDIR[i * 3], dy = TDIR[i * 3 + 1], dz = TDIR[i * 3 + 2];
    if (dx * c.x + dy * c.y + dz * c.z < cth) continue;
    d.set(dx, dy, dz); const h = heightAt(d, BW); colorAt(d, h, BW, cc); THGT[i] = h;
    const r = R + h; pos.setXYZ(i, dx * r, dy * r, dz * r); col.setXYZ(i, cc.r, cc.g, cc.b);
  }
  pos.needsUpdate = true; col.needsUpdate = true; terrainGeo.computeVertexNormals();
}

// =====================================================================
//  WATER (+ comic wave highlights), LIMB INK
// =====================================================================
let water, limb;
function buildWater() {
  const g = new THREE.SphereGeometry(R, 176, 120);
  // per-vertex sea depth → turquoise see-through lagoons near coasts, opaque deep blue offshore (hides the seafloor)
  const wp = g.attributes.position, dep = new Float32Array(wp.count), wd = V();
  for (let i = 0; i < wp.count; i++) { wd.fromBufferAttribute(wp, i).normalize(); dep[i] = Math.max(0, -heightAt(wd)); }
  g.setAttribute('aDep', new THREE.BufferAttribute(dep, 1));
  const m = new THREE.MeshToonMaterial({ color: 0x1f8fe6, gradientMap: GRAD_T, transparent: true, opacity: 0.97 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.vertexShader = 'uniform float uTime;\nattribute float aDep;\nvarying float vDep;\nvarying vec3 vWPos;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDep = aDep; vec3 pn = normalize(position); transformed += pn * (sin(position.x*1.9 + uTime*1.3) + sin(position.z*1.7 - uTime*1.1) + sin(position.y*2.3 + uTime*0.9)) * 0.018;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime;\nvarying float vDep;\nvarying vec3 vWPos;\n' + sh.fragmentShader
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'float dk = smoothstep(0.0, 1.7, vDep); vec4 diffuseColor = vec4(mix(vec3(0.36, 0.88, 0.94), diffuse, dk), mix(0.5, opacity, smoothstep(0.0, 0.6, vDep)));')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        vec3 wp = vWPos * 1.35;
        float wv = sin(wp.x*2.1 + uTime*0.9 + sin(wp.y*1.3)) * sin(wp.z*2.3 - uTime*0.7 + sin(wp.x*1.1)) * sin(wp.y*2.2 + uTime*0.55);
        float cd = length(vWPos - cameraPosition);
        float fd = 1.0 - smoothstep(14.0, 48.0, cd);
        float mk = smoothstep(0.40, 0.46, wv) * fd;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.93, 0.99, 1.0), mk * 0.9);
        gl_FragColor.a = mix(gl_FragColor.a, 1.0, mk);`);
  };
  water = new THREE.Mesh(g, m); water.renderOrder = 1; scene.add(water);
  limb = new THREE.Mesh(new THREE.SphereGeometry(R + 0.001, 128, 72), outlineMat(0.22)); scene.add(limb);
}

// =====================================================================
//  SKY DOME, STARS, SUN, ATMOSPHERE
// =====================================================================
let sky, stars, sunSprite, atmo;
const skyU = { uUp: { value: V() }, uLow: { value: 0 }, uDark: { value: 0 }, uSun: { value: SUN_DIR.clone() } };
function buildSky() {
  sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uUp; uniform vec3 uSun; uniform float uLow; uniform float uDark; varying vec3 vDir;
      void main(){
        vec3 v = normalize(vDir); float e = dot(v, uUp);
        vec3 zen = vec3(0.13,0.50,1.0), hor = vec3(0.70,0.90,1.0), gnd = vec3(0.60,0.82,0.98);
        vec3 low = mix(hor, zen, smoothstep(0.0, 0.6, e)); low = mix(gnd, low, smoothstep(-0.15, 0.0, e));
        float band = step(0.5, fract(e*9.0 + 0.25)) * smoothstep(0.02, 0.18, e) * (1.0 - smoothstep(0.3, 0.8, e));
        low = mix(low, low*1.04 + 0.02, band*0.35);
        vec3 space = mix(vec3(0.025,0.035,0.15), vec3(0.11,0.05,0.25), 0.5 + 0.5*v.y);
        vec3 deep = mix(vec3(0.05,0.22,0.74), vec3(0.17,0.47,1.0), smoothstep(-0.25, 0.55, e));
        vec3 col = uLow > 0.5 ? mix(deep, low, uLow * 2.0 - 1.0) : mix(space, deep, uLow * 2.0);
        float s = max(dot(v, uSun), 0.0);
        col += vec3(1.0,0.9,0.6) * (pow(s, 12.0)*0.22*uLow);
        vec3 storm = mix(vec3(0.03,0.06,0.05), vec3(0.10,0.20,0.13), smoothstep(-0.1,0.7,e));
        col = mix(col, storm, uDark);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  sky.renderOrder = -100; sky.frustumCulled = false; scene.add(sky);
  // stars
  const N = 2600, p = new Float32Array(N * 3), cl = new Float32Array(N * 3), d = V();
  for (let i = 0; i < N; i++) { randDir(d).multiplyScalar(1500); p.set([d.x, d.y, d.z], i * 3); const w = rr(0.7, 1); const tint = rand(); cl.set(tint < 0.2 ? [1, 0.85 * w, 0.6 * w] : tint < 0.35 ? [0.7 * w, 0.85 * w, 1] : [w, w, w], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3)); sg.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
  stars.frustumCulled = false; stars.renderOrder = -50; scene.add(stars);
  sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,245,1)', 'rgba(255,236,150,0.75)', 'rgba(255,190,60,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  sunSprite.scale.setScalar(150); sunSprite.renderOrder = -40; scene.add(sunSprite);
  // atmosphere glow halo
  atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.14, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uA: { value: 1 } }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }',
    fragmentShader: `uniform float uA; varying vec3 vN; varying vec3 vP;
      void main(){ float nz = dot(normalize(vN), normalize(-vP)); float t = clamp(-nz / 0.5, 0.0, 1.0);
        float i = pow(t, 2.2) * uA; gl_FragColor = vec4(vec3(0.35,0.72,1.0) * i * 1.1, 1.0); }`,
  }));
  scene.add(atmo);
}

// =====================================================================
//  MOON
// =====================================================================
let moonPivot, moon;
function buildMoon() {
  const g = new THREE.IcosahedronGeometry(6, 6); g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const mg = mergeVertices(g); const pos = mg.attributes.position, d = V(); const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
  const cr = []; for (let i = 0; i < 16; i++) cr.push([randDir(V()), rr(0.12, 0.35)]);
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize(); let h = noise3(d.x * 3, d.y * 3, d.z * 3) * 0.15; let dark = 0;
    for (const [cd, r] of cr) { const a = Math.acos(clamp(d.dot(cd), -1, 1)); if (a < r * 1.4) { const u = a / r; h += u < 1 ? -0.35 * (1 - u * u) : 0.12 * Math.exp(-((u - 1) ** 2) / 0.04); dark = Math.max(dark, 1 - smooth(0.6, 1.1, u)); } }
    pos.setXYZ(i, d.x * (6 + h), d.y * (6 + h), d.z * (6 + h)); c.set('#f3efc9').lerp(_tc.set('#c9c3a0'), dark * 0.8); col.set([c.r, c.g, c.b], i * 3);
  }
  mg.setAttribute('color', new THREE.BufferAttribute(col, 3)); mg.computeVertexNormals();
  moon = new THREE.Mesh(mg, MAT.toon); moon.add(new THREE.Mesh(mg, outlineMat(0.18)));
  moonPivot = new THREE.Group(); moonPivot.rotation.z = 0.35; scene.add(moonPivot);
  moon.position.set(0, 20, 185); moonPivot.add(moon);
}

// =====================================================================
//  CLOUDS (instanced puffy clusters)
// =====================================================================
let cloudGroup;
const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD, emissive: 0x7d9cc4, emissiveIntensity: 0.32 });
function buildClouds() {
  cloudGroup = new THREE.Group(); scene.add(cloudGroup);
  const variants = [];
  for (let v = 0; v < 4; v++) {
    const P = new PB(); const k = 5 + v;
    P.add(G.sphLo, '#ffffff', [0, 0.05, 0], 0, [0.75, 0.55, 0.62]);
    for (let i = 0; i < k; i++) { const a = (i / k) * TAU + rr(-0.3, 0.3); const rad = rr(0.34, 0.58); const dd = rr(0.45, 0.95); P.add(G.sphLo, '#ffffff', [Math.cos(a) * dd, rr(-0.05, 0.22), Math.sin(a) * dd * 0.65], 0, [rad * 1.15, rad * 0.85, rad]); }
    variants.push(P.geometry());
  }
  const per = QUALITY === 'low' ? 26 : 38; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), d = V(), s = V(), p = V(), f = V();
  const place = (im, i, dir, alt, sc, world = false) => { randTangent(dir, f); basisQuat(dir, f, q); s.set(sc, sc * rr(0.55, 0.75), sc * rr(0.8, 1.1)); p.copy(dir).multiplyScalar(R + alt); m4.compose(p, q, s); im.setMatrixAt(i, m4);
    CLOUD_I.push({ im, i, p: p.clone(), q: q.clone(), s: s.clone(), ext: sc * 1.6, k: 1, world }); };
  const extra = []; // ring of clouds around Korin tower
  const fk = frameAt(REG.korin); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; extra.push([offsetDir(fk, Math.cos(a) * 3.2, Math.sin(a) * 3.2), 12 + rr(-0.5, 0.5), rr(1.3, 1.8)]); }
  variants.forEach((geo, vi) => {
    const im = instanced(geo, per, cloudMat, 0.06);
    for (let i = 0; i < per; i++) { randDir(d); if (Math.abs(d.y) > 0.93) d.y *= 0.8; d.normalize(); place(im, i, d, rr(7.5, 13), rr(1.3, 3.4)); }
    im.instanceMatrix.needsUpdate = true; cloudGroup.add(im);
  });
  const ring = instanced(variants[1], extra.length, cloudMat, 0.06);
  extra.forEach((e, j) => place(ring, j, e[0], e[1], e[2], true)); ring.instanceMatrix.needsUpdate = true; scene.add(ring);
}
// clouds politely shrink away when the camera gets close or when they block the view of the camera target
const CLOUD_I = [], _cfC = V(), _cfT = V(), _cfS = V(), _cfM = new THREE.Matrix4(), _cfV = V();
function updateCloudFade(cp, target) {
  cloudGroup.updateMatrixWorld(); _cfC.copy(cp); cloudGroup.worldToLocal(_cfC); _cfT.copy(target); cloudGroup.worldToLocal(_cfT);
  for (const c of CLOUD_I) {
    const C = c.world ? cp : _cfC, T = c.world ? target : _cfT;
    let k = smooth(c.ext * 0.7 + 0.5, c.ext * 1.5 + 2.5, C.distanceTo(c.p));
    _cfV.subVectors(T, C); const L2 = _cfV.lengthSq();
    if (L2 > 1e-6 && L2 < 1600 && k > 0) {
      const u = clamp(_cfS.subVectors(c.p, C).dot(_cfV) / L2, 0, 1);
      if (u > 0 && u < 1) { const dl = _cfS.copy(C).addScaledVector(_cfV, u).distanceTo(c.p); k = Math.min(k, smooth(c.ext * 0.75, c.ext * 1.5 + 0.8, dl)); }
    }
    if (Math.abs(k - c.k) < 0.015 && (k > 0 || c.k === 0) && (k < 1 || c.k === 1)) continue;
    c.k = k; _cfS.copy(c.s).multiplyScalar(Math.max(k, 1e-4)); _cfM.compose(c.p, c.q, _cfS); c.im.setMatrixAt(c.i, _cfM); c.im.instanceMatrix.needsUpdate = true;
  }
}
