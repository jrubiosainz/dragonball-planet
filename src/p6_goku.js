
// =====================================================================
//  GOKU: NPC on Nimbus in orbit mode, player-controlled in fly mode
// =====================================================================
const GOKU_UNLOCK = { ssj3: false };
const FORMS = [
  { name: 'BASE FORM', power: 9001, aura: '#cfefff', spd: 1 },
  { name: 'SUPER SAIYAN', power: 150000000, aura: '#ffd84a', spd: 1.35 },
  { name: 'SUPER SAIYAN 3', power: 3000000000, aura: '#ffc21a', spd: 1.7 },
];
const KEYS = {};
let GOKU = null;
function mkNimbus() {
  const P = new PB(), c = '#ffe34a';
  P.add(G.sph, c, [0, 0, 0], 0, [0.2, 0.08, 0.28]);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; P.add(G.sph, c, [Math.sin(a) * 0.17, rr(-0.015, 0.035), Math.cos(a) * 0.22], 0, rr(0.065, 0.095)); }
  for (let i = 0; i < 5; i++) P.add(G.sph, c, [Math.sin(i * 1.3) * 0.04, 0.0, -0.3 - i * 0.085], 0, 0.085 - i * 0.012);
  const g = new THREE.Group(); g.add(P.mesh(0.012)); return g;
}
function mkBeamMat(c, a, core) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uC: { value: rawC(c) }, uA: { value: a } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uTime; uniform vec3 uC; uniform float uA; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float s = 0.78 + 0.22 * sin(vUv.y * 90.0 - uTime * 45.0);
        float a = pow(f, ${core ? '0.6' : '1.5'}) * s * uA; gl_FragColor = vec4(mix(uC, vec3(1.0), f * f * ${core ? '1.0' : '0.5'}) * a, a); }`,
  });
}
function buildGoku() {
  const obj = new THREE.Group(); scene.add(obj);
  const rigs = [human('goku'), human('goku', { hair: 'ssj', hairC: HC.gold, pupil: '#1e8fa0' }), human('goku', { hair: 'ssj3', hairC: HC.gold, pupil: '#1e8fa0', brows: false })];
  rigs.forEach((r, i) => { obj.add(r.root); r.root.visible = i === 0; });
  const S = rigs[0].S, hipY = rigs[0].D.hip * S;
  const auraPivot = new THREE.Group(); auraPivot.position.y = hipY; obj.add(auraPivot);
  const aura = mkAura(FORMS[1].aura, 0.36 * S, 0.5 * S); aura.position.y = (0.45 - rigs[0].D.hip) * S; aura.visible = false; auraPivot.add(aura);
  const nimbus = mkNimbus(); nimbus.position.y = -0.03; obj.add(nimbus);
  const kiBall = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,255,1)', 'rgba(130,225,255,0.85)', 'rgba(40,140,255,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  kiBall.visible = false; kiBall.renderOrder = 7; scene.add(kiBall);
  const bg = new THREE.CylinderGeometry(1, 1, 1, 22, 1, true); bg.rotateX(Math.PI / 2); bg.translate(0, 0, 0.5);
  const beam = new THREE.Group(); const bOut = new THREE.Mesh(bg, mkBeamMat('#39b8ff', 1, false)), bIn = new THREE.Mesh(bg, mkBeamMat('#d8f6ff', 1, true));
  bOut.renderOrder = 7; bIn.renderOrder = 8; beam.add(bOut, bIn); beam.visible = false; scene.add(beam); bOut.frustumCulled = bIn.frustumCulled = false;
  const tip = new THREE.Sprite(kiBall.material); tip.visible = false; tip.renderOrder = 9; scene.add(tip);
  const sd = SPOT.paozu.d.clone(), sf = SPOT.paozu.fwd.clone();
  GOKU = {
    obj, rigs, rig: rigs[0], form: 0, aura, auraPivot, auraA: 0, nimbus, onNimbus: true, kiBall, beam, bOut, bIn, tip,
    dir: sd, fwd: sf, alt: groundH(sd) + 3, pos: V(), speed: 0, vs: 0, yawRate: 0, grounded: false, ph: 0, boost: false,
    npcT: 0, npcTurn: 0, transT: 0, shake: 0, shownP: 9001, over9000: false, speedK: 0,
    kame: { charging: false, t: 0, firing: 0, dur: 0, len: 0, hitD: 0, hit: null, dir: V(), from: V(), power: 0, boomed: false, said: 0, cool: 0 },
    trailAcc: 0,
  };
  GOKU.pos.copy(GOKU.dir).multiplyScalar(R + GOKU.alt);
  GOKU.ent = addEnt('Goku', obj, { parent: null, keep: true, labelY: 0.42, lodFar: 70, olFar: 16 });
  GOKU.ent.say = ["Hi, I'm Goku!", "I'm getting hungry...", "Let's train!"];
}
function setGokuForm(i, quiet = false) {
  const g = GOKU; if (!g || i === g.form) return;
  const prev = g.rig; g.form = i; g.rig = g.rigs[i]; g.rig.cur.set(prev.cur); g.rigs.forEach((r, k) => (r.root.visible = k === i));
  g.aura.material.uniforms.uColor.value.copy(rawC(i > 0 ? FORMS[i].aura : FORMS[0].aura));
  $('pForm').textContent = FORMS[i].name;
  if (quiet) return;
  g.transT = 1.1; g.shake = Math.max(g.shake, i > 0 ? 0.9 : 0.3);
  const p = g.obj.localToWorld(V().set(0, 0.16, 0));
  if (i > 0) {
    flashScreen(0.75, 650);
    for (let k = 0; k < 90; k++) GLOW.emit(p, randDir(V()).multiplyScalar(rr(1, 3)), rr(0.4, 0.9), rr(0.1, 0.22), k % 3 ? FORMS[i].aura : '#ffffff', 2.5);
    for (let k = 0; k < 14; k++) { const tv = randTangent(g.dir, V()).multiplyScalar(rr(1.5, 2.5)); PUFF.emit(p, tv, 0.8, 0.08, 0.3, '#fff6d0', 3); }
    popAt(p, i === 1 ? 'SUPER SAIYAN!!' : 'SUPER SAIYAN 3!!!', '');
    if (i === 1 && !g.over9000) { g.over9000 = true; setTimeout(() => popAt(g.obj.localToWorld(V().set(0, 0.5, 0)), "IT'S OVER 9000!!", 'red'), 900); }
  } else popAt(p, 'phew...', 'small');
}
function cycleForm() { if (!GOKU || SHEN.active) return; const n = GOKU.form === 0 ? 1 : GOKU.form === 1 ? (GOKU_UNLOCK.ssj3 ? 2 : 0) : 0; if (GOKU.form === 1 && !GOKU_UNLOCK.ssj3) banner('SSJ3 LOCKED — gather the 7 Dragon Balls and ask Shenron!', 3.2); setGokuForm(n); }
function toggleNimbus() {
  const g = GOKU; if (!g || SHEN.active) return; g.onNimbus = !g.onNimbus; g.nimbus.visible = g.onNimbus;
  const p = g.obj.localToWorld(V().set(0, 0, 0));
  for (let k = 0; k < 14; k++) PUFF.emit(p, randDir(V()).multiplyScalar(rr(0.6, 1.4)), 0.7, 0.06, 0.2, '#ffe34a', 3);
  popAt(g.obj.localToWorld(V().set(0, 0.45, 0)), g.onNimbus ? "KINTO'UN!" : 'JUMP!', 'small');
}
// ---------- terrain raycast (sphere-marching against the height field)
const _rd = V(), _rp = V();
function rayTerrain(o, d, maxD = 95) {
  let prev = 0;
  for (let s = 0.15; s <= maxD; s += 0.12 + s * 0.02) {
    _rp.copy(o).addScaledVector(d, s); const r = _rp.length(); if (r > R + 11) { prev = s; continue; }
    if (r < R + groundH(_rd.copy(_rp).divideScalar(r))) {
      let a = prev, b = s; for (let k = 0; k < 7; k++) { const m = (a + b) / 2; _rp.copy(o).addScaledVector(d, m); const rm = _rp.length(); if (rm < R + groundH(_rd.copy(_rp).divideScalar(rm))) b = m; else a = m; }
      const p = V().copy(o).addScaledVector(d, b); return { p, dist: b, dir: p.clone().normalize() };
    }
    prev = s;
  }
  return null;
}
function explodeAt(p, power) {
  const up = p.clone().normalize(), land = heightAt(up) > 0.02;
  const n = QUALITY === 'low' ? 18 : 30;
  for (let i = 0; i < n; i++) { const v = randDir(V()).multiplyScalar(rr(1, 3.5) * (0.6 + power)); v.addScaledVector(up, rr(1, 3)); PUFF.emit(p, v, rr(1.2, 2.2), rr(0.2, 0.4), rr(0.9, 1.7) * (0.6 + power), pick(land ? ['#ffffff', '#ffe08a', '#ffb347', '#fff3c4'] : ['#ffffff', '#c9f6ff', '#9fe8ff']), 2.2, 0.6); }
  for (let i = 0; i < 110; i++) GLOW.emit(p, randDir(V()).multiplyScalar(rr(2, 7)), rr(0.4, 1.1), rr(0.15, 0.4), i % 3 ? '#8fdcff' : '#ffffff', 2.4);
  GLOW.emit(p, V(), 0.5, 5 + power * 5, '#bfeaff', 0);
  flashScreen(0.55, 500); GOKU.shake = Math.max(GOKU.shake, 0.8 + power);
  popAt(p.clone().addScaledVector(up, 0.8), land ? pick(['KA-BOOOM!!', 'KRAKOOOM!!', 'BOOOOM!!']) : 'SPLAAASH!!', 'red');
  if (land && !isProtected(up)) {
    const r = 0.9 + power * 1.7; let depth = 0.35 + power * 0.6;
    for (const s of ROCKSPOTS) if (arcDist(up, s.d) < r + s.r + 0.3) { depth = 0.3; break; }
    addCraterData(up, r, depth, 0.16 + power * 0.18, 0.9);
    updateTerrainRegion(up, r * 2.4 + 0.5); removeTreesNear(up, r * 1.15); removeBouldersNear(up, r * 1.1);
  } else if (land) popAt(p.clone().addScaledVector(up, 1.6), 'NOT HERE, GOKU!', 'small');
  let said = 0; for (const e of ENT) { if (said > 2 || !e.name || e === GOKU.ent || e.kind === 'ball' || e.kind === 'veh') continue; const w = e.obj.getWorldPosition(_rp); if (w.distanceTo(p) < 4 + power * 3) { popAt(w.clone().addScaledVector(up, 0.5), e.kind === 'dino' ? 'ROAR?!' : pick(['HEY!!', 'YIKES!', 'WATCH IT!', 'GOKU!!']), 'small'); said++; } }
}
function removeBouldersNear(c, radius) {
  if (!BOULD.im) return; const cth = Math.cos(radius / R), z = new THREE.Matrix4().makeScale(0, 0, 0); let n = 0;
  BOULD.list.forEach((b, i) => { if (!b.gone && dot3(b.d, c) > cth) { b.gone = true; BOULD.im.setMatrixAt(i, z); n++; } });
  if (n) BOULD.im.instanceMatrix.needsUpdate = true;
}
// ---------- per-frame update
const _gq = V(), _gw = V(), _gv = V(), _aim = V();
function updateGoku(dt, t) {
  const g = GOKU; if (!g) return; const F = FORMS[g.form], K = g.kame;
  const player = MODE === 'fly' && !SHEN.active;
  let thr = 0, turn = 0, vert = 0, boost = false;
  if (player) {
    thr = (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0);
    turn = (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0) - (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0);
    vert = (KEYS.Space || KEYS.KeyE ? 1 : 0) - (KEYS.KeyQ || KEYS.KeyC ? 1 : 0);
    boost = !!(KEYS.ShiftLeft || KEYS.ShiftRight);
    if (K.charging || K.firing > 0) { thr = 0; boost = false; }
  } else if (SHEN.active) {
    // hover in front of the dragon
    const tgt = SHEN.gokuSpot; g.pos.lerp(tgt, damp(1.5, dt)); g.dir.copy(g.pos).normalize(); g.alt = g.pos.length() - R;
    tangentToward(g.dir, SHEN.B, g.fwd); g.speed = 0; g.vs = 0;
  } else {
    g.npcT -= dt; if (g.npcT < 0) { g.npcT = rr(3, 8); g.npcTurn = rand() < 0.3 ? 0 : rr(-0.45, 0.45); }
    thr = 0.75; turn = g.npcTurn; const ta = groundH(g.dir) + 3.2; vert = clamp((ta - g.alt) * 0.7, -1, 1);
    if (!g.onNimbus) { g.onNimbus = true; g.nimbus.visible = true; }
  }
  g.boost = boost && thr > 0;
  if (!SHEN.active) {
    const maxV = (g.onNimbus ? 5.2 : 3.4) * F.spd * (g.boost ? 2.8 : 1) * (g.grounded && !vert ? 0.55 : 1);
    const tgtV = thr > 0 ? maxV * thr : thr < 0 ? -1.3 : 0;
    g.speed += (tgtV - g.speed) * damp(thr ? 2.4 : 1.8, dt);
    g.yawRate += (turn * (g.onNimbus ? 1.5 : 1.9) - g.yawRate) * damp(6, dt);
    turnAround(g.dir, g.fwd, g.yawRate * dt);
    g.vs += (vert * 3.4 * (g.boost ? 1.8 : 1) * F.spd - g.vs) * damp(4, dt);
    if (K.firing > 0) g.speed += (-0.6 - g.speed) * damp(3, dt);
    moveAlong(g.dir, g.fwd, (g.speed * dt * R) / (R + Math.max(0, g.alt)));
    g.alt += g.vs * dt;
    const gh = groundH(g.dir), minA = gh + (g.onNimbus ? 0.1 : 0);
    if (g.alt <= minA) { g.alt = minA; if (g.vs < 0) g.vs = 0; }
    g.alt = Math.min(g.alt, 150);
    g.grounded = !g.onNimbus && g.alt <= gh + 0.005 && heightAt(g.dir) > -0.02;
    g.pos.copy(g.dir).multiplyScalar(R + g.alt);
  }
  // orientation + banking
  g.obj.position.copy(g.pos); basisQuat(g.dir, g.fwd, g.obj.quaternion);
  g.obj.rotateZ(-g.yawRate * 0.28 * Math.min(1, Math.abs(g.speed) / 3));
  // pose
  if (g.grounded && Math.abs(g.speed) > 0.3) g.ph += dt * 14;
  let pz;
  if (g.transT > 0) { g.transT -= dt; pz = 'powerup'; }
  else if (K.firing > 0) pz = 'kame';
  else if (K.charging) pz = 'charge';
  else if (SHEN.active) pz = SHEN.phase === 'wish' ? 'point' : 'hover';
  else if (g.onNimbus) pz = player ? (Math.abs(g.speed) > 0.6 ? 'stance' : 'idle') : 'crossed';
  else if (g.grounded) pz = Math.abs(g.speed) > 0.3 ? 'run' : 'idle';
  else if (g.boost && g.speed > 2.5) pz = 'flyFist';
  else if (g.speed > 1.3) pz = 'fly';
  else pz = 'hover';
  applyPose(g.rig, pose(pz, g.ph, t), damp(pz === 'kame' ? 16 : 8, dt));
  // aura
  const hot = g.boost || K.charging || K.firing > 0 || g.transT > 0;
  const auraT = g.form > 0 ? (hot ? 1 : 0.5) : hot ? 0.75 : 0;
  g.auraA += (auraT - g.auraA) * damp(5, dt); g.aura.visible = g.auraA > 0.02;
  g.aura.material.uniforms.uA.value = g.auraA * (0.85 + Math.sin(t * 31) * 0.15); g.auraPivot.rotation.x = g.rig.cur[0];
  const as = 1 + (K.charging ? 0.35 + K.t * 0.1 : 0) + (g.transT > 0 ? 0.5 : 0); g.auraPivot.scale.setScalar(as);
  if (g.aura.visible && g.form > 0 && rand() < dt * (g.form === 2 ? 14 : 5)) { g.obj.localToWorld(_gw.set(rr(-0.12, 0.12), rr(0.02, 0.4), rr(-0.12, 0.12))); GLOW.emit(_gw, randDir(_gv).multiplyScalar(0.4), 0.14, 0.08, g.form === 2 ? '#bff4ff' : '#fff3a0', 0); }
  // trails
  g.trailAcc += dt;
  if (g.trailAcc > 0.05) {
    g.trailAcc = 0;
    if (g.onNimbus && Math.abs(g.speed) > 1) { g.obj.localToWorld(_gw.set(0, -0.03, -0.45)); PUFF.emit(_gw, _gv.copy(g.dir).multiplyScalar(0.05), 0.8, 0.07, 0.02, '#ffe34a', 2); }
    if (!g.onNimbus && g.alt < 0.6 && heightAt(g.dir) < 0 && g.speed > 2) { g.obj.localToWorld(_gw.set(rr(-0.1, 0.1), -g.alt + 0.02, -0.2)); PUFF.emit(_gw, _gv.copy(g.dir).multiplyScalar(rr(0.8, 1.6)).addScaledVector(g.fwd, -0.6), 0.7, 0.05, 0.14, pick(['#ffffff', '#c9f6ff']), 2, -2); }
    if (g.boost && g.form > 0) { g.obj.localToWorld(_gw.set(0, 0.12, -0.3)); GLOW.emit(_gw, _gv.set(0, 0, 0), 0.35, 0.16, F.aura, 0); }
  }
  g.speedK += ((g.boost ? clamp((g.speed - 3) / 6, 0, 1) : 0) - g.speedK) * damp(4, dt);
  g.shake = Math.max(0, g.shake - dt * 1.6);
  updateKame(dt, t, player);
  // power HUD
  g.shownP += (F.power - g.shownP) * damp(3, dt);
  if (MODE === 'fly') $('pLevel').textContent = 'POWER ' + fmtInt(Math.round(g.shownP));
}
const KAME_WORDS = ['KA...', 'ME...', 'HA...', 'ME...'];
function updateKame(dt, t, player) {
  const g = GOKU, K = g.kame;
  K.cool -= dt;
  const want = player && (KEYS.KeyK || KEYS.KeyF);
  if (want && !K.charging && K.firing <= 0 && K.cool <= 0) { K.charging = true; K.t = 0; K.said = 0; }
  if (K.charging) {
    K.t = Math.min(2.6, K.t + dt);
    const hp = g.obj.localToWorld(_gw.set(-0.07, 0.12, -0.05));
    g.kiBall.visible = true; g.kiBall.position.copy(hp); g.kiBall.scale.setScalar(0.12 + K.t * 0.1 + Math.sin(t * 40) * 0.015);
    if (rand() < dt * 30) { const s = randDir(_gv).multiplyScalar(rr(0.4, 0.8)).add(hp); GLOW.emit(s, _gq.subVectors(hp, s).multiplyScalar(2.6), 0.38, 0.07, '#9fe6ff', 0); }
    const idx = Math.floor((K.t + 0.45) / 0.5) - 1; if (idx >= K.said && idx < 4) { K.said = idx + 1; popAt(g.obj.localToWorld(V().set(0, 0.5, 0)), KAME_WORDS[idx], 'blue small'); }
    g.shake = Math.max(g.shake, K.t * 0.12);
    if (!want) { K.charging = false; g.kiBall.visible = false; fireKame(); }
  }
  if (K.firing > 0) {
    K.firing -= dt; const age = K.dur - K.firing;
    K.from.copy(g.obj.localToWorld(_gw.set(0, 0.15, 0.16)));
    const maxL = K.hit ? K.hitD : 95; K.len = Math.min(maxL, K.len + dt * 85);
    const fade = K.firing < 0.3 ? K.firing / 0.3 : 1, rad = (0.07 + K.power * 0.12) * (1 + Math.sin(t * 50) * 0.06) * (0.3 + 0.7 * Math.min(1, age * 6));
    g.beam.visible = true; g.beam.position.copy(K.from); g.beam.quaternion.setFromUnitVectors(_Z, K.dir);
    g.bOut.scale.set(rad * 2, rad * 2, K.len); g.bIn.scale.set(rad * 0.9, rad * 0.9, K.len);
    g.bOut.material.uniforms.uA.value = g.bIn.material.uniforms.uA.value = fade;
    g.tip.visible = true; g.tip.position.copy(K.from).addScaledVector(K.dir, K.len); g.tip.scale.setScalar(rad * 9 * fade);
    g.kiBall.visible = true; g.kiBall.position.copy(K.from); g.kiBall.scale.setScalar(rad * 6 * fade);
    g.shake = Math.max(g.shake, 0.25 + K.power * 0.4);
    if (K.hit && K.len >= K.hitD - 0.01) {
      if (!K.boomed) { K.boomed = true; explodeAt(K.hit.p, K.power); }
      if (rand() < dt * 25) GLOW.emit(K.hit.p, randDir(_gv).multiplyScalar(rr(1, 3)), 0.5, 0.25, '#bfeaff', 2);
    }
    if (K.firing <= 0) { g.beam.visible = false; g.tip.visible = false; g.kiBall.visible = false; K.cool = 0.4; }
  }
}
function fireKame() {
  const g = GOKU, K = g.kame;
  K.power = clamp(K.t / 2.6, 0.12, 1); K.dur = 0.9 + K.power * 1.1; K.firing = K.dur; K.len = 0; K.boomed = false;
  // aim: where the screen centre points
  camera.getWorldDirection(_aim);
  const ch = rayTerrain(camera.position, _aim, 140);
  const aimP = ch ? ch.p : _gq.copy(camera.position).addScaledVector(_aim, 100);
  K.from.copy(g.obj.localToWorld(_gw.set(0, 0.15, 0.16)));
  K.dir.subVectors(aimP, K.from).normalize();
  const f2 = _gv.copy(K.dir).addScaledVector(g.dir, -K.dir.dot(g.dir)); if (f2.lengthSq() > 1e-4) g.fwd.copy(f2.normalize());
  K.hit = rayTerrain(K.from, K.dir, 95); K.hitD = K.hit ? K.hit.dist : 95;
  popAt(g.obj.localToWorld(V().set(0, 0.55, 0)), 'HAAAAAAA!!', 'blue');
}
