
// =====================================================================
//  VEHICLES: bubble cars (instanced), air cars, prop planes, jets, blimp
// =====================================================================
const LODG = [];                      // generic distance-culled groups {obj, c, far}
const VEH = { cars: [] };
const ONE = new THREE.Vector3(1, 1, 1);
function buildRoadCars() {
  const A = new PB();
  A.add(G.rbox, '#ffffff', [0, 0.07, 0], 0, [0.15, 0.07, 0.3]);
  A.add(G.sph, '#ffffff', [0, 0.1, -0.05], 0, [0.076, 0.055, 0.1]);
  A.add(G.sph, '#ffffff', [0, 0.085, 0.09], 0, [0.07, 0.04, 0.07]);
  const B = new PB();
  B.add(G.hemi, '#c9f1ff', [0, 0.1, 0.0], 0, [0.062, 0.075, 0.08]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(G.cyl, '#25212f', [sx * 0.074, 0.037, sz * 0.095], [0, 0, Math.PI / 2], [0.037, 0.028, 0.037]);
  for (const sx of [-1, 1]) { B.add(G.sphLo, '#fff7c2', [sx * 0.045, 0.075, 0.148], 0, 0.016); B.add(G.sphLo, '#ff4040', [sx * 0.05, 0.08, -0.148], 0, 0.013); }
  B.add(G.box, '#3a3f4f', [0, 0.045, 0], 0, [0.152, 0.02, 0.302]);
  const ga = A.geometry(), gb = B.geometry();
  const lanes = [];
  for (const r of CITY.rings) for (const s of [1, -1]) lanes.push({ r: r + s * 0.17, dir: s, n: Math.max(3, Math.round((TAU * r) / (QUALITY === 'low' ? 6 : 4.2))), v: rr(0.7, 1.0) });
  const total = lanes.reduce((a, l) => a + l.n, 0);
  const IA = instanced(ga, total, MAT.toon, 0.008, outlineGeo(ga)), IB = instanced(gb, total, MAT.toon, 0.008, outlineGeo(gb));
  IB.instanceMatrix = IA.instanceMatrix; IB.userData.outline.instanceMatrix = IA.instanceMatrix;
  const col = new THREE.Color(), PAL = ['#ff4d4d', '#ffd23a', '#3d8bff', '#44d17a', '#ff8ad1', '#ff9f1c', '#9b6bff', '#ffffff', '#35d0c9'];
  let i = 0; for (const L of lanes) for (let k = 0; k < L.n; k++) { VEH.cars.push({ L, a: (k / L.n) * TAU + rr(-0.08, 0.08), i }); IA.setColorAt(i, col.set(pick(PAL))); i++; }
  IA.instanceColor.needsUpdate = true; scene.add(IA, IB);
  const c = REG.city.clone().multiplyScalar(R + 1); LODG.push({ obj: IA, c, far: 60 }, { obj: IB, c, far: 60 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), d = V(), f = V(), p = V();
  UPD.push((dt, t) => {
    if (!IA.visible) return;
    for (const car of VEH.cars) {
      car.a += (car.L.dir * car.L.v * dt) / car.L.r;
      cityPolar(car.L.r, car.a, d); cityTan(car.L.r, car.a, f); if (car.L.dir < 0) f.negate();
      p.copy(d).multiplyScalar(R + CITY.h + 0.03 + Math.abs(Math.sin(t * 14 + car.i)) * 0.004);
      basisQuat(d, f, q); m4.compose(p, q, ONE); IA.setMatrixAt(car.i, m4);
    }
    IA.instanceMatrix.needsUpdate = true;
  });
}
function mkAirCar(c) {
  const P = new PB();
  P.add(G.sph, c, [0, 0.08, 0], 0, [0.13, 0.075, 0.26]); P.add(G.hemi, '#c9f1ff', [0, 0.11, -0.01], 0, [0.085, 0.085, 0.12]);
  for (const s of [-1, 1]) { P.add(G.cyl, '#e9edf5', [s * 0.145, 0.05, 0], [Math.PI / 2, 0, 0], [0.042, 0.26, 0.042]); P.add(G.sphLo, '#7fe8ff', [s * 0.145, 0.05, -0.13], 0, [0.036, 0.036, 0.02]); }
  P.add(G.box, c, [0, 0.15, -0.2], [0.4, 0, 0], [0.02, 0.09, 0.09]); P.add(G.sphLo, '#fff7c2', [0, 0.07, 0.255], 0, [0.05, 0.02, 0.02]);
  const g = new THREE.Group(); g.add(P.mesh(0.01)); return g;
}
function mkPropPlane(c1, c2) {
  const P = new PB();
  P.add(capG(0.1, 0.55), c1, [0, 0, 0], [Math.PI / 2, 0, 0]); P.add(G.sph, c1, [0, 0, 0.36], 0, 0.1);
  P.add(G.cyl, c2, [0, 0, 0.41], [Math.PI / 2, 0, 0], [0.105, 0.05, 0.105]); P.addDir(G.cone, c1, [0, 0.02, -0.5], [0, 0, -1], [0.09, 0.32, 0.09]);
  P.add(G.hemi, '#c9f1ff', [0, 0.07, 0.08], 0, [0.07, 0.08, 0.13]);
  P.add(G.rbox, c2, [0, -0.03, 0.06], 0, [1.15, 0.03, 0.2]); P.add(G.rbox, c2, [0, 0.02, -0.58], 0, [0.42, 0.02, 0.1]); P.add(G.rbox, c1, [0, 0.13, -0.58], [0.3, 0, 0], [0.02, 0.2, 0.13]);
  for (const s of [-1, 1]) P.add(G.sphLo, s > 0 ? '#44d17a' : '#ff4040', [s * 0.58, -0.03, 0.06], 0, 0.03);
  const body = P.mesh(0.012); const Q = new PB(); Q.add(G.rbox, '#3a3f4f', [0, 0, 0], 0, [0.38, 0.04, 0.014]); Q.add(G.sphLo, c2, [0, 0, 0.02], 0, 0.03);
  const prop = Q.mesh(0.008); prop.position.set(0, 0, 0.47); const g = new THREE.Group(); g.add(body, prop); g.userData.prop = prop; return g;
}
function mkJet(c1, c2) {
  const P = new PB();
  P.add(capG(0.09, 0.9), c1, [0, 0, 0], [Math.PI / 2, 0, 0]); P.addDir(G.cone, c1, [0, 0, 0.73], [0, 0, 1], [0.09, 0.4, 0.09]);
  P.add(G.hemi, '#9fdcff', [0, 0.06, 0.3], 0, [0.06, 0.07, 0.17]);
  for (const s of [-1, 1]) { P.add(G.rbox, c2, [s * 0.28, -0.01, -0.1], [0, s * 0.5, 0], [0.5, 0.025, 0.25]); P.add(G.rbox, c2, [s * 0.14, 0.03, -0.55], [0, s * 0.4, 0], [0.24, 0.02, 0.1]); P.add(G.cyl, '#5a5f6e', [s * 0.07, -0.02, -0.58], [Math.PI / 2, 0, 0], [0.045, 0.14, 0.045]); }
  P.add(G.rbox, c1, [0, 0.15, -0.5], [0.45, 0, 0], [0.02, 0.24, 0.16]);
  for (const s of [-1, 1]) P.add(G.sphLo, '#ffb03a', [s * 0.07, -0.02, -0.66], 0, [0.04, 0.04, 0.02]);
  const g = new THREE.Group(); g.add(P.mesh(0.012)); return g;
}
function mkBlimp() {
  const P = new PB(), W = '#f7f7fb', Bl = '#2456c8';
  P.add(G.cyl, W, [0, 0, 0], [Math.PI / 2, 0, 0], [0.75, 2.2, 0.75]); P.add(G.sph, W, [0, 0, 1.1], 0, [0.75, 0.75, 0.95]); P.add(G.sph, W, [0, 0, -1.1], 0, [0.75, 0.75, 1.3]);
  for (const z of [1.05, -1.05]) P.add(G.cyl, Bl, [0, 0, z], [Math.PI / 2, 0, 0], [0.765, 0.1, 0.765]);
  P.add(G.rbox, '#dfe3ea', [0, -0.82, 0.2], 0, [0.36, 0.22, 0.8]); P.add(G.box, '#9fdcff', [0, -0.8, 0.2], 0, [0.37, 0.08, 0.6]);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; P.add(G.rbox, Bl, [Math.sin(a) * 0.62, Math.cos(a) * 0.62, -1.95], [0, 0, -a], [0.05, 0.6, 0.5]); }
  for (const s of [-1, 1]) P.add(G.cyl, '#b8bcc8', [s * 0.3, -0.78, -0.3], [Math.PI / 2, 0, 0], [0.06, 0.2, 0.06]);
  const m = P.mesh(0.02);
  for (const s of [1, -1]) {
    const tex = canvasTex(512, 1024, (x, w, h) => { x.fillStyle = W; x.fillRect(0, 0, w, h); x.save(); x.translate(w / 2, h / 2); x.rotate(s > 0 ? Math.PI / 2 : -Math.PI / 2); x.font = '170px Bangers'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = '#1a1226'; x.strokeText('CAPSULE CORP.', 0, 6); x.fillStyle = Bl; x.fillText('CAPSULE CORP.', 0, 6); x.restore(); });
    const g = new THREE.CylinderGeometry(0.758, 0.758, 1.9, 24, 1, true, (s > 0 ? Math.PI / 2 : (3 * Math.PI) / 2) - 0.55, 1.1); g.rotateX(Math.PI / 2);
    m.add(new THREE.Mesh(g, new THREE.MeshToonMaterial({ map: tex, gradientMap: GRAD })));
  }
  const g = new THREE.Group(); m.scale.setScalar(0.7); g.add(m); return g;
}
// circle/ellipse path around a region (vehicles)
function mkLoopPath(e, center, radius, alt, speed, o = {}) {
  const fr = frameAt(center); const st = { a: rand() * TAU, sgn: o.sgn ?? (rand() < 0.5 ? 1 : -1), bank: 0 }; const d = V(), d2 = V(), f = V();
  const wob = o.wob ?? 0.15, ph = rand() * TAU;
  return (dt, t) => {
    st.a += (st.sgn * speed * dt) / radius;
    const rOf = (a) => radius * (1 + Math.sin(a * 2 + ph) * wob);
    offsetDir(fr, Math.cos(st.a) * rOf(st.a), Math.sin(st.a) * rOf(st.a), d); const a2 = st.a + st.sgn * 0.01; offsetDir(fr, Math.cos(a2) * rOf(a2), Math.sin(a2) * rOf(a2), d2);
    f.subVectors(d2, d).normalize();
    const al = alt + Math.sin(t * 0.8 + ph) * (o.bob ?? 0.25);
    e.obj.position.copy(d).multiplyScalar(R + al); basisQuat(d, f, e.obj.quaternion); e.obj.rotateZ(-st.sgn * (o.bank ?? 0.3));
  };
}
// free flight over the whole globe (planes / jets), climbs over Korin's tower
const _korD = V();
function mkSkyPath(e, alt, speed, o = {}) {
  const st = { dir: randDir(V()), fwd: V(), turn: 0, timer: 0, bank: 0, trail: 0, alt }; randTangent(st.dir, st.fwd);
  const p = V(), vel = V(); _korD.copy(REG.korin);
  return (dt, t, vis) => {
    st.timer -= dt; if (st.timer < 0) { st.timer = rr(5, 12); st.turn = rand() < 0.35 ? 0 : rr(-(o.turn ?? 0.18), o.turn ?? 0.18); }
    turnAround(st.dir, st.fwd, st.turn * dt); moveAlong(st.dir, st.fwd, speed * dt);
    let ta = alt; if (dot3(st.dir, _korD) > Math.cos(7 / R)) ta = Math.max(ta, 30); ta = Math.max(ta, groundH(st.dir) + 4);
    st.alt += (ta - st.alt) * damp(0.8, dt);
    st.bank += (-st.turn * 2.6 - st.bank) * damp(1.5, dt);
    e.obj.position.copy(st.dir).multiplyScalar(R + st.alt); basisQuat(st.dir, st.fwd, e.obj.quaternion); e.obj.rotateZ(st.bank);
    if (e.obj.userData.prop) e.obj.userData.prop.rotation.z += dt * 40;
    if (o.contrail) {
      st.trail += dt;
      if (st.trail > 0.06) { st.trail = 0; e.obj.updateMatrixWorld(); vel.copy(st.dir).multiplyScalar(0.03);
        for (const s of [-1, 1]) { p.set(s * 0.07, -0.02, -0.75).applyMatrix4(e.obj.matrixWorld); PUFF.emit(p, vel, 2.4, 0.05, 0.26, '#ffffff', 0.4, 0); } }
    }
  };
}
function buildVehicles() {
  buildRoadCars();
  const cityC = REG.city;
  const airC = ['#ff5f8f', '#ffd23a', '#3d8bff', '#44d17a', '#ff9f1c', '#9b6bff', '#35d0c9', '#ff4d4d'];
  const nAir = QUALITY === 'low' ? 5 : 8;
  for (let i = 0; i < nAir; i++) {
    const obj = mkAirCar(i === 0 ? '#ff5f8f' : airC[i % airC.length]);
    const e = addEnt(i === 0 ? "Bulma's Air Car" : i % 3 === 1 ? 'Air Taxi' : '', obj, { kind: 'veh', cls: 'veh', labelY: 0.35, lodFar: 70, olFar: 16 });
    e.update = mkLoopPath(e, cityC, rr(2.6, 11.5), rr(1.6, 3.4), rr(1.1, 1.8), { wob: rr(0.05, 0.22) });
  }
  { const obj = mkBlimp(); const e = addEnt('Capsule Corp. Blimp', obj, { kind: 'veh', cls: 'veh', labelY: 1.2, lodFar: 400, olFar: 40 }); e.update = mkLoopPath(e, cityC, 8.5, 7.2, 0.7, { sgn: 1, bank: 0.06, wob: 0.08, bob: 0.3 }); }
  const planes = [['Sky Taxi', '#ffd23a', '#ff4d4d'], ['Mail Plane', '#ffffff', '#3d8bff'], ['Stunt Plane', '#ff4d4d', '#ffffff'], ['Crop Duster', '#44d17a', '#ffd23a'], ['Prop Plane', '#ff9f1c', '#2456c8']];
  for (let i = 0; i < (QUALITY === 'low' ? 3 : planes.length); i++) { const [n, a, b] = planes[i]; const obj = mkPropPlane(a, b); const e = addEnt(n, obj, { kind: 'veh', cls: 'veh', labelY: 0.4, lodFar: 400, olFar: 30 }); e.update = mkSkyPath(e, rr(13, 17), rr(3.2, 4.2)); }
  const jets = [['Capsule Jet', '#f7f7fb', '#2456c8'], ['Jet Fighter', '#9aa3b5', '#5a6275'], ['Red Jet', '#ff4d4d', '#ffffff']];
  for (let i = 0; i < (QUALITY === 'low' ? 2 : jets.length); i++) { const [n, a, b] = jets[i]; const obj = mkJet(a, b); const e = addEnt(n, obj, { kind: 'veh', cls: 'veh', labelY: 0.4, lodFar: 400, olFar: 30 }); e.update = mkSkyPath(e, rr(19, 23), rr(7, 9), { contrail: true, turn: 0.12 }); }
}

// =====================================================================
//  HUD helpers (banner / flash)
// =====================================================================
let _bannerT = 0;
function banner(text, secs = 2.6) { const b = $('banner'); b.innerHTML = text; b.style.display = 'block'; _bannerT = secs; }
function flashScreen(a = 0.8, ms = 380) { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = a; void f.offsetWidth; f.style.transition = `opacity ${ms}ms ease-out`; f.style.opacity = 0; }

// =====================================================================
//  DRAGON BALLS + DRAGON RADAR
// =====================================================================
const BALLS = { list: [], got: 0, beamMat: null };
const STAR_HTML = { 1: '★', 2: '★★', 3: '★<br>★★', 4: '★★<br>★★', 5: '★★<br>★<br>★★', 6: '★★<br>★★<br>★★', 7: '★★<br>★★★<br>★★' };
function ballSpot(taken, avoid = null) {
  for (let k = 0; k < 800; k++) {
    const d = randDir(V()); const h = heightAt(d);
    if (h < 0.12 || h > 7 || isProtected(d)) continue;
    if (avoid && arcDist(d, avoid) < 30) continue;
    let ok = true; for (const o of taken) if (arcDist(d, o) < 24) { ok = false; break; }
    if (ok) return d;
  }
  return findLand(randDir(V()), 40, 0.15, 6);
}
function buildBalls() {
  const hud = $('balls');
  BALLS.beamMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float uTime; uniform float uA; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.5) * (0.6 + 0.4 * sin(uTime * 5.0 - vUv.y * 14.0)); a *= uA * smoothstep(0.0, 0.04, vUv.y); gl_FragColor = vec4(vec3(1.0, 0.6, 0.1) * a, a); }',
  });
  const beamGeo = new THREE.CylinderGeometry(0.04, 0.1, 14, 8, 1, true); beamGeo.translate(0, 7, 0);
  const glowM = new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,220,1)', 'rgba(255,170,40,0.5)', 'rgba(255,120,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const ballGeo = new THREE.SphereGeometry(0.13, 24, 16), ballOl = outlineGeo(ballGeo);
  const taken = [];
  for (let n = 1; n <= 7; n++) {
    const el = document.createElement('div'); el.className = 'db'; el.innerHTML = STAR_HTML[n]; hud.appendChild(el);
    const grp = new THREE.Group(), float = new THREE.Group(); grp.add(float);
    const mesh = new THREE.Mesh(ballGeo, new THREE.MeshToonMaterial({ map: dragonBallTex(n), gradientMap: GRAD, emissive: 0x663300 })); mesh.add(new THREE.Mesh(ballOl, outlineMat(0.012)));
    const spr = new THREE.Sprite(glowM); spr.scale.setScalar(0.85); spr.renderOrder = 4; float.add(mesh, spr);
    const beam = new THREE.Mesh(beamGeo, BALLS.beamMat); beam.renderOrder = 4; beam.frustumCulled = false; grp.add(beam);
    const d = ballSpot(taken); taken.push(d);
    const b = { n, grp, float, mesh, spr, beam, el, dir: d.clone(), state: 'idle', t: 0, wp: V(), p0: V(), p1: V(), d0: V(), d1: V() };
    placeBall(b, d);
    b.ent = addEnt(`${n}-Star Ball`, grp, { kind: 'ball', cls: 'ball', labelY: 0.55, lodFar: 55, olFar: 25, keep: true });
    BALLS.list.push(b);
  }
  UPD.push(updateBalls);
}
function placeBall(b, d) { b.dir.copy(d); placeObj(b.grp, d, randTangent(d, V()), 0, groundH(d)); b.grp.scale.setScalar(1); b.grp.visible = true; b.beam.visible = true; b.state = 'idle'; }
function ballWorld(b, out) { return b.float.getWorldPosition(out); }
function collectBall(b) {
  b.state = 'fly'; b.t = 0; ballWorld(b, b.p0); b.beam.visible = false;
  BALLS.got++; b.el.classList.add('got');
  for (let i = 0; i < 40; i++) GLOW.emit(b.p0, randDir(V()).multiplyScalar(rr(0.6, 1.6)), rr(0.4, 0.8), 0.14, i % 2 ? '#ffd24a' : '#ff8a00', 2);
  popAt(b.p0, `${b.n}-STAR BALL!`, 'small');
  if (BALLS.got < 7) banner(`★ DRAGON BALLS ${BALLS.got} / 7 ★`); else { banner('ALL 7 DRAGON BALLS! ARISE, SHENRON!', 4); SHEN.pending = 1.4; }
}
function updateBalls(dt, t) {
  BALLS.beamMat.uniforms.uA.value = MODE === 'fly' ? 1 : 0.55 * (1 - smooth(22, 55, camera.position.length() - R));
  for (const b of BALLS.list) {
    if (b.state === 'idle') {
      b.float.position.y = 0.24 + Math.sin(t * 2 + b.n) * 0.05; b.mesh.rotation.y += dt * 0.8; b.spr.material.rotation = t;
      if (GOKU && MODE === 'fly' && !SHEN.active) { ballWorld(b, b.wp); if (b.wp.distanceTo(GOKU.pos) < 0.8) collectBall(b); }
    } else if (b.state === 'fly') {
      b.t += dt * 2.6; const k = Math.min(1, b.t);
      if (GOKU) b.grp.position.lerpVectors(b.p0, GOKU.pos, easeInOut(k)).addScaledVector(b.dir, -0.24 * (1 - k)); b.grp.scale.setScalar(1 - k * 0.8);
      if (k >= 1) { b.state = 'got'; b.grp.visible = false; }
    } else if (b.state === 'summon') {
      b.float.position.y = 0.2 + Math.sin(t * 6 + b.n) * 0.03; b.mesh.rotation.y += dt * 3; b.spr.scale.setScalar(0.85 + Math.sin(t * 9) * 0.25);
    } else if (b.state === 'rise') {
      b.t += dt; b.grp.position.addScaledVector(b.dir, dt * (2 + b.t * 6));
      if (b.t > 1.1) { b.state = 'scatter'; b.t = 0; b.p0.copy(b.grp.position); b.d0.copy(b.p0).normalize(); b.a0 = b.p0.length() - R; }
    } else if (b.state === 'scatter') {
      b.t += dt / 3.2; const k = Math.min(1, b.t), e = easeInOut(k);
      const w = b.d0.angleTo(b.d1); const s = Math.sin(w) || 1;
      b.wp.copy(b.d0).multiplyScalar(Math.sin((1 - e) * w) / s).addScaledVector(b.d1, Math.sin(e * w) / s).normalize();
      const alt = lerp(b.a0, groundH(b.d1), e) + Math.sin(Math.PI * k) * 14;
      b.grp.position.copy(b.wp).multiplyScalar(R + alt);
      GLOW.emit(b.grp.position, V(), 0.7, 0.35, '#ffb020', 0); GLOW.emit(b.grp.position, V(), 0.35, 0.8, '#fff0a0', 0);
      if (k >= 1) { placeBall(b, b.d1); b.el.classList.remove('got'); for (let i = 0; i < 20; i++) GLOW.emit(b.grp.position, randDir(V()).multiplyScalar(1.2), 0.5, 0.12, '#ffd24a', 2); }
    }
  }
  if (_bannerT > 0) { _bannerT -= dt; if (_bannerT <= 0) $('banner').style.display = 'none'; }
}
let _radarCtx = null; const _rv = V(), _rr = V();
function radarCtx() {
  if (_radarCtx) return _radarCtx;
  const c = $('radar'); if (!c) return null; _radarCtx = c.getContext('2d');
  if (!_radarCtx) { const n = c.cloneNode(false); c.replaceWith(n); _radarCtx = n.getContext('2d'); } // canvas already claimed by another context type
  return _radarCtx;
}
function drawRadar(up, fwd, t) {
  const x = radarCtx(); if (!x) return; const W = 360, C = 180, RS = 146;
  x.clearRect(0, 0, W, W);
  x.beginPath(); x.arc(C, C, 170, 0, TAU); x.fillStyle = '#f2f2ec'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#1a1226'; x.stroke();
  x.beginPath(); x.arc(C, C, 160, 0, TAU); x.lineWidth = 3; x.strokeStyle = '#b9b9b0'; x.stroke();
  const g = x.createRadialGradient(C - 30, C - 30, 10, C, C, RS); g.addColorStop(0, '#7dffae'); g.addColorStop(1, '#159447');
  x.save(); x.beginPath(); x.arc(C, C, RS, 0, TAU); x.fillStyle = g; x.fill(); x.clip();
  x.strokeStyle = 'rgba(225,255,232,0.5)'; x.lineWidth = 2;
  for (let k = -5; k <= 5; k++) { x.beginPath(); x.moveTo(C + k * 29, 0); x.lineTo(C + k * 29, W); x.stroke(); x.beginPath(); x.moveTo(0, C + k * 29); x.lineTo(W, C + k * 29); x.stroke(); }
  const sw = (t * 1.8) % TAU; x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.moveTo(C, C); x.arc(C, C, RS, sw - 0.5, sw); x.closePath(); x.fill();
  _rr.crossVectors(fwd, up).normalize();
  let best = 1e9;
  for (const b of BALLS.list) {
    if (b.state !== 'idle') continue;
    const cd = clamp(dot3(b.dir, up), -1, 1), ang = Math.acos(cd); best = Math.min(best, ang * R);
    _rv.copy(b.dir).addScaledVector(up, -cd); if (_rv.lengthSq() < 1e-9) _rv.copy(fwd); _rv.normalize();
    const rad = Math.sqrt(ang / Math.PI) * (RS - 12), px = C + _rv.dot(_rr) * rad, py = C - _rv.dot(fwd) * rad;
    const pul = 0.5 + 0.5 * Math.sin(t * 7 + b.n);
    x.beginPath(); x.arc(px, py, 10 + pul * 4, 0, TAU); x.fillStyle = 'rgba(255,240,80,0.35)'; x.fill();
    x.beginPath(); x.arc(px, py, 8, 0, TAU); x.fillStyle = '#ffe23a'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#ff6a00'; x.stroke();
  }
  x.beginPath(); x.moveTo(C, C - 13); x.lineTo(C - 10, C + 10); x.lineTo(C, C + 5); x.lineTo(C + 10, C + 10); x.closePath(); x.fillStyle = '#ff3b2a'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#1a1226'; x.stroke();
  x.restore();
  x.font = '26px Bangers'; x.textAlign = 'center'; x.lineWidth = 5; x.strokeStyle = '#1a1226'; x.fillStyle = '#ffe23a';
  const txt = best < 1e8 ? `★ ${Math.round(best * 6)} m` : '★ ALL FOUND!'; x.strokeText(txt, C, 322); x.fillText(txt, C, 322);
  x.font = '20px Bangers'; x.fillStyle = '#ffffff'; x.strokeText('DRAGON RADAR', C, 52); x.fillText('DRAGON RADAR', C, 52);
}

// =====================================================================
//  SHENRON — the Eternal Dragon
// =====================================================================
const SHEN = { active: false, phase: 'off', t: 0, grow: 0, dark: 0, pending: 0, B: V(), U: V(), E: V(), Nn: V(), face: V(), body: null, spikes: null, head: null, N: 110, camPos: V(), camLook: V(), cam: false, opts: null, gokuSpot: V() };
const FW = { t: 0, acc: 0, rockets: [] };
function buildShenron() {
  const N = SHEN.N, c = new THREE.Color();
  const seg = new THREE.SphereGeometry(1, 16, 12);
  const body = instanced(seg, N, MAT.toonI, 0.07, outlineGeo(seg));
  for (let i = 0; i < N; i++) body.setColorAt(i, c.set(i % 4 === 0 ? '#2c9442' : '#3fb552')); body.instanceColor.needsUpdate = true;
  const sg = new THREE.ConeGeometry(1, 1, 6); sg.translate(0, 0.5, 0);
  const NS = Math.floor(N / 3); const spikes = instanced(sg, NS, MAT.toonI, 0.09, outlineGeo(sg));
  for (let i = 0; i < NS; i++) spikes.setColorAt(i, c.set('#f0b43a')); spikes.instanceColor.needsUpdate = true;
  const H = new PB(), gC = '#3fb552', dC = '#2a7f3a', yC = '#f2e3a0';
  H.add(G.sph, gC, [0, 0, 0], 0, [0.62, 0.52, 0.72]); H.add(G.sph, gC, [0, -0.1, 0.72], 0, [0.42, 0.3, 0.62]); H.add(G.sph, gC, [0, -0.02, 1.22], 0, [0.34, 0.24, 0.26]);
  for (const s of [-1, 1]) H.add(G.sph, '#1a1226', [s * 0.14, 0.07, 1.42], 0, [0.06, 0.04, 0.04]);
  H.add(G.sph, yC, [0, -0.34, 0.66], [0.12, 0, 0], [0.34, 0.12, 0.6]); H.add(G.box, '#8a1a1a', [0, -0.25, 0.82], [0.1, 0, 0], [0.42, 0.05, 0.62]);
  for (const s of [-1, 1]) {
    H.addDir(G.coneLo, '#fbfbf0', [s * 0.3, -0.27, 1.02], [0, -1, 0.1], [0.05, 0.17, 0.05]);
    H.add(G.sph, dC, [s * 0.3, 0.3, 0.4], [0, 0, s * -0.4], [0.22, 0.07, 0.17]);
    H.addDir(G.cone, yC, [s * 0.3, 0.62, -0.38], [s * 0.35, 0.75, -1], [0.1, 1.25, 0.1]);
    H.addDir(G.coneLo, yC, [s * 0.5, 0.8, -0.62], [s * 0.6, 1, 0.1], [0.05, 0.45, 0.05]);
    for (let k = 0; k < 3; k++) H.addDir(G.coneLo, dC, [s * 0.52, -0.12 + k * 0.12, -0.05 - k * 0.14], [s, -0.2 + k * 0.1, -0.6], [0.07, 0.38, 0.07]);
    let p = [s * 0.3, -0.05, 1.25], d = [s * 0.7, 0.1, 0.2];
    for (let k = 0; k < 6; k++) { const n = Math.hypot(d[0], d[1], d[2]); const u = [d[0] / n, d[1] / n, d[2] / n]; const L = 0.42; H.addDir(capG(0.022, L), dC, [p[0] + (u[0] * L) / 2, p[1] + (u[1] * L) / 2, p[2] + (u[2] * L) / 2], u); p = [p[0] + u[0] * L, p[1] + u[1] * L, p[2] + u[2] * L]; d = [u[0], u[1] - 0.22, u[2] - 0.32]; }
  }
  for (let k = 0; k < 6; k++) H.addDir(G.coneLo, dC, [0, 0.45 - k * 0.03, -0.1 - k * 0.2], [0, 0.8, -1], [0.1, 0.45, 0.1]);
  const head = H.mesh(0.03);
  const Eg = new PB(); for (const s of [-1, 1]) Eg.add(G.sph, '#ff2a1a', [s * 0.33, 0.15, 0.5], 0, [0.12, 0.1, 0.11]);
  head.add(new THREE.Mesh(Eg.geometry(), MAT.glowBasic));
  // two clawed arms
  const arms = [];
  for (const s of [-1, 1]) { const A = new PB(); A.add(capG(0.16, 0.9), gC, [0, -0.55, 0]); A.add(G.sph, gC, [0, -1.2, 0.05], 0, [0.22, 0.2, 0.24]); for (let k = -1; k <= 1; k++) A.addDir(G.coneLo, yC, [k * 0.1, -1.36, 0.14], [k * 0.3, -0.6, 1], [0.05, 0.28, 0.05]); const m = A.mesh(0.03); m.visible = false; scene.add(m); arms.push(m); }
  body.visible = spikes.visible = head.visible = false; scene.add(body, spikes, head);
  Object.assign(SHEN, { body, spikes, head, arms, NS });
  UPD.push(updateShenron); UPD.push(updateFireworks);
}
const _sp = V(), _sp2 = V(), _sq = new THREE.Quaternion(), _sm = new THREE.Matrix4(), _ss = V(), _sn = V();
function shenPoint(u, t, out) {
  const g = SHEN.grow, Hh = 15 * g;
  const rho = lerp(3.0, 1.1, u) * smooth(0, 0.1, u) * (0.3 + 0.7 * g);
  const phi = u * 2.7 * Math.PI + t * 0.35;
  out.copy(SHEN.B).addScaledVector(SHEN.U, Hh * u).addScaledVector(SHEN.E, Math.cos(phi) * rho).addScaledVector(SHEN.Nn, Math.sin(phi) * rho);
  const k = smooth(0.78, 1.0, u); if (k > 0) { _sp2.copy(SHEN.B).addScaledVector(SHEN.U, Hh * 0.97 + 1.2 * g).addScaledVector(SHEN.face, 1.8 * g); out.lerp(_sp2, k); }
  return out;
}
function startShenron() {
  if (!GOKU) return;
  const gd = GOKU.pos.clone().normalize(), f = GOKU.fwd.clone();
  const bd = gd.clone(); moveAlong(bd, f, 5.5);
  SHEN.B.copy(bd).multiplyScalar(R + groundH(bd)); SHEN.U.copy(bd);
  tangentToward(bd, gd, SHEN.face); SHEN.E.crossVectors(SHEN.U, SHEN.face).normalize(); SHEN.Nn.copy(SHEN.face);
  const gs = bd.clone(); moveAlong(gs, SHEN.face.clone(), 5); SHEN.gokuSpot.copy(gs).multiplyScalar(R + Math.max(groundH(gs), 0) + 1.3);
  SHEN.active = true; SHEN.phase = 'summon'; SHEN.t = 0; SHEN.grow = 0; SHEN.cam = true;
  const fr = frameAt(bd);
  BALLS.list.forEach((b, i) => { const a = (i / 7) * TAU; const d = offsetDir(fr, Math.cos(a) * 0.5, Math.sin(a) * 0.5); placeObj(b.grp, d, SHEN.face, 0, groundH(d)); b.dir.copy(d); b.grp.visible = true; b.grp.scale.setScalar(1); b.beam.visible = false; b.state = 'summon'; });
  $('power').style.display = 'none';
}
function shenSay(html, wishes) {
  const b = $('bubble'); b.innerHTML = `<div class="who">SHENRON</div>${html}`; b.style.display = 'block';
  if (wishes) { const w = document.createElement('div'); w.className = 'wishes'; SHEN.opts = [];
    const opts = [['⚡ Unlock Super Saiyan 3', wishSSJ3], ['🎆 Fireworks over West City', wishFireworks], ['🦖 More dinosaurs!', wishDinos], ['♾️ Eternal life', wishImmortal]];
    opts.forEach(([label, fn], i) => { const bt = document.createElement('button'); bt.className = 'cb'; bt.textContent = `${i + 1}. ${label}`; bt.onclick = (ev) => { ev.stopPropagation(); chooseWish(i); }; w.appendChild(bt); SHEN.opts.push(fn); });
    b.appendChild(w); }
}
function chooseWish(i) { if (SHEN.phase !== 'wish' || !SHEN.opts || !SHEN.opts[i]) return; SHEN.opts[i](); }
function granted(txt) { shenSay(`${txt}<br>YOUR WISH HAS BEEN GRANTED. FAREWELL!`); SHEN.phase = 'granted'; SHEN.t = 0; flashScreen(0.7, 600); }
function wishSSJ3() { GOKU_UNLOCK.ssj3 = true; if (GOKU) setGokuForm(2); granted('SUPER SAIYAN 3 IS YOURS! (PRESS T TO CHANGE FORM)'); }
function wishFireworks() { FW.t = 32; granted('LOOK TO THE SKIES ABOVE WEST CITY!'); }
function wishDinos() { buildDinos(0.7, REG.jungle, 17); buildDinos(0.5, REG.paozu, 9); granted('THE DINOSAURS MULTIPLY... MT. PAOZU WILL BE LIVELY!'); }
function wishImmortal() { SHEN.phase = 'refuse'; SHEN.t = 0; shenSay('THAT WISH IS BEYOND MY POWER!<br>...CHOOSE ANOTHER.'); }
function endShenron() {
  SHEN.active = false; SHEN.phase = 'off'; SHEN.cam = false; $('bubble').style.display = 'none';
  SHEN.body.visible = SHEN.spikes.visible = SHEN.head.visible = false; for (const a of SHEN.arms) a.visible = false;
  BALLS.got = 0; if (MODE === 'fly') $('power').style.display = 'block';
}
function updateShenron(dt, t) {
  if (SHEN.pending > 0) { SHEN.pending -= dt; if (SHEN.pending <= 0) startShenron(); }
  if (!SHEN.active) { SHEN.dark += (0 - SHEN.dark) * damp(1.5, dt); return; }
  SHEN.t += dt; const T = SHEN.t, P = SHEN.phase;
  let darkT = 1;
  if (P === 'summon') { if (T > 2.4) { SHEN.phase = 'rise'; SHEN.t = 0; flashScreen(0.9, 700); } if (rand() < dt * 1.6) flashScreen(0.45, 250);
    if (T > 1.2) for (let i = 0; i < 3; i++) GLOW.emit(_sp.copy(SHEN.B).addScaledVector(SHEN.U, 0.3).add(randDir(_sn).multiplyScalar(0.3)), _ss.copy(SHEN.U).multiplyScalar(rr(6, 12)), 1.2, 0.5, '#ffe89a', 0); }
  else if (P === 'rise') { SHEN.grow = easeInOut(Math.min(1, T / 3.2)); if (rand() < dt * 1.2) flashScreen(0.35, 250); for (let i = 0; i < 2; i++) GLOW.emit(_sp.copy(SHEN.B).add(randDir(_sn).multiplyScalar(0.4)), _ss.copy(SHEN.U).multiplyScalar(rr(8, 14)), 1.0, 0.45, '#fff2b0', 0);
    if (T > 3.3) { SHEN.phase = 'wish'; SHEN.t = 0; shenSay('YOU WHO HAVE GATHERED THE DRAGON BALLS...<br>I SHALL GRANT YOU ONE WISH. SPEAK!', true); const hp = SHEN.head.position.clone(); popAt(hp, 'ROOOAAARRR!!', 'red'); } }
  else if (P === 'refuse') { if (T > 2.4) { SHEN.phase = 'wish'; shenSay('NOW... SPEAK YOUR WISH!', true); } }
  else if (P === 'granted') { if (T > 3.4) { SHEN.phase = 'leave'; SHEN.t = 0; $('bubble').style.display = 'none'; flashScreen(1, 900);
      const taken = []; BALLS.list.forEach((b) => { b.state = 'rise'; b.t = rr(0, 0.3) * -1; const d = ballSpot(taken, SHEN.U); taken.push(d); b.d1.copy(d); }); } }
  else if (P === 'leave') { SHEN.grow = 1 - easeInOut(Math.min(1, T / 1.6)); darkT = 1 - smooth(0.8, 3.0, T); if (T > 1.6) { SHEN.body.visible = SHEN.spikes.visible = SHEN.head.visible = false; for (const a of SHEN.arms) a.visible = false; } if (T > 4.4) endShenron(); }
  SHEN.dark += (darkT - SHEN.dark) * damp(1.6, dt);
  // camera framing
  SHEN.camPos.copy(SHEN.B).addScaledVector(SHEN.face, 22).addScaledVector(SHEN.U, 7.5).addScaledVector(SHEN.E, 4);
  SHEN.camLook.copy(SHEN.B).addScaledVector(SHEN.U, 7.6 * Math.max(0.35, SHEN.grow) + 0.8);
  // body
  const vis = SHEN.grow > 0.01 && P !== 'summon'; SHEN.body.visible = SHEN.spikes.visible = SHEN.head.visible = vis; for (const a of SHEN.arms) a.visible = vis;
  if (!vis) return;
  const N = SHEN.N, g = SHEN.grow; let si = 0;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1); shenPoint(u, t, _sp);
    const r = lerp(0.16, 0.72, smooth(0, 0.35, u)) * (1 - 0.3 * smooth(0.75, 1, u)) * (0.4 + 0.6 * g);
    _ss.setScalar(r); _sm.compose(_sp, _sq.identity(), _ss); SHEN.body.setMatrixAt(i, _sm);
    if (i % 3 === 1 && si < SHEN.NS) {
      _sp2.copy(SHEN.B).addScaledVector(SHEN.U, SHEN.U.dot(_sn.subVectors(_sp, SHEN.B))); _sn.subVectors(_sp, _sp2); if (_sn.lengthSq() < 1e-6) _sn.copy(SHEN.U); _sn.normalize();
      _sn.lerp(SHEN.U, 0.35).normalize(); _sq.setFromUnitVectors(_Y, _sn); _sp.addScaledVector(_sn, r * 0.75); _ss.set(r * 0.28, r * 0.9 * (u > 0.85 ? 0.3 : 1), r * 0.28); _sm.compose(_sp, _sq, _ss); SHEN.spikes.setMatrixAt(si++, _sm);
    }
  }
  SHEN.spikes.count = si; SHEN.body.instanceMatrix.needsUpdate = SHEN.spikes.instanceMatrix.needsUpdate = true;
  // head
  shenPoint(1, t, _sp); SHEN.head.position.copy(_sp).addScaledVector(SHEN.face, 0.45 * g).addScaledVector(SHEN.U, 0.25 * g);
  basisQuat(SHEN.U, SHEN.face, SHEN.head.quaternion); SHEN.head.rotateX(0.32 + Math.sin(t * 1.3) * 0.05); SHEN.head.rotateZ(Math.sin(t * 0.9) * 0.06); SHEN.head.scale.setScalar(1.35 * g);
  // arms near the upper body
  SHEN.arms.forEach((a, k) => { const s = k ? 1 : -1; shenPoint(0.7, t, _sp); a.position.copy(_sp).addScaledVector(SHEN.E, s * 0.55 * g).addScaledVector(SHEN.face, 0.3 * g); basisQuat(SHEN.U, SHEN.face, a.quaternion); a.rotateZ(s * (0.7 + Math.sin(t * 2 + k) * 0.1)); a.rotateX(-0.6); a.scale.setScalar(g); });
}
// ---------- fireworks (wish)
function updateFireworks(dt, t) {
  if (FW.t > 0) { FW.t -= dt; FW.acc += dt; while (FW.acc > 0.3) { FW.acc -= 0.3; const d = offsetDir(CITY.fr, rr(-8, 8), rr(-8, 8)); FW.rockets.push({ p: d.clone().multiplyScalar(R + CITY.h), v: d.clone().multiplyScalar(rr(7, 10)).add(randTangent(d, V()).multiplyScalar(rr(0, 1))), fuse: rr(0.8, 1.3), col: pick(['#ff4d4d', '#ffd23a', '#3dd8ff', '#9dff5a', '#ff7af0', '#ffffff', '#ff9f1c']) }); } }
  for (let i = FW.rockets.length - 1; i >= 0; i--) {
    const r = FW.rockets[i]; r.fuse -= dt; r.p.addScaledVector(r.v, dt); GLOW.emit(r.p, V(), 0.4, 0.14, '#fff2c0', 0);
    if (r.fuse <= 0) { const n = QUALITY === 'low' ? 40 : 70; for (let k = 0; k < n; k++) GLOW.emit(r.p, randDir(_sn).multiplyScalar(rr(2.2, 3)), rr(1.1, 1.7), 0.3, k % 5 === 0 ? '#ffffff' : r.col, 1.3);
      if (rand() < 0.3) popAt(r.p, pick(['BOOM!', 'KA-BOOM!', 'POP!', 'FWOOSH!']), 'small'); FW.rockets.splice(i, 1); }
  }
}
