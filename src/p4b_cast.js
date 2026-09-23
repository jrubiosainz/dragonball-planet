
// =====================================================================
//  ENTITIES + BEHAVIOURS
// =====================================================================
function addEnt(name, obj, o = {}) {
  const e = Object.assign({ name, obj, kind: 'char', labelY: 1.25, lodFar: 45, olFar: 15, update: null, rig: null, cls: '', parent: scene, keep: false, say: null, vis: true, olOn: true, lbl: null }, o);
  if (e.parent) e.parent.add(obj); e.ols = collectOls(obj); ENT.push(e); return e;
}
const _lm = new THREE.Matrix4(), _lm2 = new THREE.Matrix4(), _ls = V();
function setLocal(obj, base, x, y, z, yaw) { _lm2.makeRotationY(yaw); _lm2.setPosition(x, y, z); _lm.multiplyMatrices(base, _lm2); _lm.decompose(obj.position, obj.quaternion, _ls); }
function collectOls(obj) { const a = []; obj.traverse((m) => { if (m.material && m.material.userData && m.material.userData.isOutline) a.push(m); }); return a; }
function wH(rig) { return rig.D ? rig.h * rig.S : rig.h; }

// --- flame-shaped ki aura (additive fresnel shell)
let AURA_GEO = null;
function auraGeo() {
  if (AURA_GEO) return AURA_GEO; const g = new THREE.SphereGeometry(1, 24, 16); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0) { const s = 1 - 0.62 * y; x *= s; z *= s; y *= 2.1; } else y *= 0.8; p.setXYZ(i, x, y, z); }
  g.computeVertexNormals(); AURA_GEO = g; return g;
}
function mkAura(color, sx = 0.32, sy = 0.5) {
  const m = new THREE.Mesh(auraGeo(), new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uColor: { value: rawC(color) }, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec3 p = position; vY = p.y; float an = atan(p.x, p.z);
        float f = sin(p.y*7.0 - uTime*15.0 + an*3.0)*0.07 + sin(p.y*12.0 - uTime*23.0 - an*5.0)*0.05;
        p += normal * f * smoothstep(-0.6, 1.2, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uA; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float fr = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float st = step(0.5, fract(vY*3.0 - uTime*2.6));
        float a = (pow(fr, 1.6)*0.9 + 0.12 + st*0.08) * uA * (1.0 - smoothstep(0.9, 2.1, vY));
        vec3 c = mix(uColor, vec3(1.0), pow(fr, 5.0)*0.6); gl_FragColor = vec4(c * a, a); }`,
  }));
  m.scale.set(sx, sy, sx); m.position.y = 0.45; m.renderOrder = 5; m.frustumCulled = false; return m;
}

// --- ground wanderer on the big planet
function mkWander(e, center, radius, speed, o = {}) {
  const minH = o.minH ?? 0.15, maxH = o.maxH ?? 5;
  const st = { dir: o.start ? o.start.clone() : findLand(center, radius * 0.85, minH + 0.1, maxH - 0.2), fwd: V(), walk: true, timer: rr(1, 5), ph: rand() * TAU, turn: 0, blocked: 0, sgn: rand() < 0.5 ? 1 : -1, mode: 'walk' };
  randTangent(st.dir, st.fwd); e.st = st;
  const cosR = Math.cos(radius / R), tD = V(), tF = V(), toC = V();
  return (dt, t, vis) => {
    st.timer -= dt;
    if (st.timer < 0) {
      st.walk = o.alwaysWalk || rand() < (o.walkP ?? 0.7); st.timer = st.walk ? rr(3, 8) : rr(1.5, 4); st.turn = rr(-0.7, 0.7); st.sgn = rand() < 0.5 ? 1 : -1;
      st.mode = st.walk ? (o.walkPose || 'walk') : (o.idlePoses ? pick(o.idlePoses) : 'idle');
      if (!st.walk && o.onStop) o.onStop(e, st);
    }
    if (st.walk) {
      turnAround(st.dir, st.fwd, st.turn * dt);
      tD.copy(st.dir); tF.copy(st.fwd); moveAlong(tD, tF, o.look ?? 0.5);
      const hh = heightAt(tD); const out = dot3(tD, center) < cosR;
      if (hh < minH || hh > maxH || out || (o.avoidProt && isProtected(tD))) {
        if (out) { tangentToward(st.dir, center, toC); st.fwd.lerp(toC, damp(2.5, dt)).normalize(); }
        turnAround(st.dir, st.fwd, st.sgn * 2.2 * dt); st.blocked += dt;
      } else { moveAlong(st.dir, st.fwd, speed * dt); st.blocked = 0; }
      st.ph += dt * (o.stepRate ?? 9);
    }
    placeObj(e.obj, st.dir, st.fwd, o.lift ?? 0, groundH(st.dir));
    if (vis) { if (e.rig.kind) animDino(e.rig, st.walk, st.ph, t, dt); else applyPose(e.rig, pose(st.walk ? st.mode : st.mode, st.ph, t), damp(10, dt)); }
  };
}
// --- walker on a West City sidewalk ring
function mkRingWalk(e, r, speed) {
  const st = { a: rand() * TAU, sgn: rand() < 0.5 ? 1 : -1, ph: rand() * TAU, pause: 0, next: rr(4, 14) }; const d = V(), f = V();
  const rOff = r + (st.sgn > 0 ? 0.08 : -0.08);
  return (dt, t, vis) => {
    st.next -= dt; if (st.next < 0) { st.pause = rr(1, 3); st.next = rr(8, 20); }
    let walking = true; if (st.pause > 0) { st.pause -= dt; walking = false; }
    if (walking) { st.a += st.sgn * (speed * dt) / rOff; st.ph += dt * 9; }
    cityPolar(rOff, st.a, d); cityTan(rOff, st.a, f); if (st.sgn < 0) f.negate();
    placeObj(e.obj, d, f, 0, CITY.h + 0.02);
    if (vis) applyPose(e.rig, pose(walking ? 'walk' : 'wave', st.ph, t), damp(10, dt));
  };
}
// --- local ping-pong walk on an arc (e.g. Dende on the Lookout)
function mkArcWalk(e, base, r, y, a0, a1, speed, runPose = 'walk') {
  const st = { a: rr(a0, a1), sgn: 1, ph: 0, pause: 0 };
  return (dt, t, vis) => {
    if (st.pause > 0) st.pause -= dt; else { st.a += st.sgn * speed * dt / r; st.ph += dt * 9; if (st.a > a1 || st.a < a0) { st.a = clamp(st.a, a0, a1); st.sgn *= -1; st.pause = rr(1.2, 3); } }
    const x = Math.sin(st.a) * r, z = Math.cos(st.a) * r; const yaw = st.a + (st.sgn > 0 ? Math.PI / 2 : -Math.PI / 2);
    setLocal(e.obj, base, x, y, z, st.pause > 0 ? st.a : yaw);
    if (vis) applyPose(e.rig, pose(st.pause > 0 ? 'wave' : runPose, st.ph, t), damp(10, dt));
  };
}
// --- local circular run (e.g. Goten around the house)
function mkCircleRun(e, base, cx, cz, r, y, speed, p = 'run') {
  const st = { a: rand() * TAU, ph: 0 };
  return (dt, t, vis) => {
    st.a += speed * dt / r; st.ph += dt * 13;
    setLocal(e.obj, base, cx + Math.sin(st.a) * r, y + (p === 'run' ? Math.abs(Math.sin(st.ph)) * 0.02 : 0), cz + Math.cos(st.a) * r, st.a + Math.PI / 2);
    if (vis) applyPose(e.rig, pose(p, st.ph, t), damp(12, dt));
  };
}
// --- static poser that cycles through poses
function mkPoser(e, base, x, y, z, yaw, poses, period = 3, o = {}) {
  const st = { i: 0, t: rand() * period, ph: rand() * TAU };
  return (dt, t, vis) => {
    st.t += dt; if (st.t > period) { st.t = 0; st.i = (st.i + 1) % poses.length; if (o.onPose) o.onPose(e, poses[st.i]); }
    const bob = o.float ? Math.sin(t * 1.6 + st.ph) * 0.03 : 0;
    if (base) setLocal(e.obj, base, x, y + bob, z, yaw);
    if (vis) applyPose(e.rig, pose(poses[st.i], st.ph + t * 8, t), damp(o.snap ?? 8, dt));
  };
}
// --- flyer circling a region (big planet)
function mkFlyCircle(e, center, radius, alt, speed, o = {}) {
  const fr = frameAt(center); const st = { a: rand() * TAU, sgn: o.sgn ?? 1 }; const d = V(), d2 = V(), f = V();
  return (dt, t, vis) => {
    st.a += st.sgn * speed * dt / radius;
    const rr_ = radius * (1 + Math.sin(st.a * 2 + 1.3) * 0.12), al = alt + Math.sin(t * 0.7 + st.a) * (o.bob ?? 0.35);
    offsetDir(fr, Math.cos(st.a) * rr_, Math.sin(st.a) * rr_, d); offsetDir(fr, Math.cos(st.a + st.sgn * 0.01) * rr_, Math.sin(st.a + st.sgn * 0.01) * rr_, d2);
    f.subVectors(d2, d).normalize();
    e.obj.position.copy(d).multiplyScalar(R + al); basisQuat(d, f, e.obj.quaternion);
    e.obj.rotateZ(-st.sgn * 0.35);
    if (vis) applyPose(e.rig, pose(o.pose || 'fly', 0, t), damp(6, dt));
  };
}
// --- flyer travelling on great circles around the whole world (with trail)
function mkGlobeFlyer(e, alt, speed, o = {}) {
  const st = { dir: randDir(V()), fwd: V(), turn: 0, timer: 0, trail: 0 }; randTangent(st.dir, st.fwd); const p = V(), bk = V();
  return (dt, t, vis) => {
    st.timer -= dt; if (st.timer < 0) { st.timer = rr(4, 10); st.turn = rr(-0.25, 0.25); }
    turnAround(st.dir, st.fwd, st.turn * dt); moveAlong(st.dir, st.fwd, speed * dt);
    if (Math.abs(st.dir.y) > 0.8) turnAround(st.dir, st.fwd, 0.6 * dt);
    const gh = Math.max(0, heightAt(st.dir)); const a = Math.max(alt, gh + 2);
    e.alt = e.alt === undefined ? a : lerp(e.alt, a, damp(1.5, dt));
    e.obj.position.copy(st.dir).multiplyScalar(R + e.alt); basisQuat(st.dir, st.fwd, e.obj.quaternion); e.obj.rotateZ(-st.turn * 1.2);
    if (o.trail) { st.trail += dt; while (st.trail > 0.03) { st.trail -= 0.03; bk.copy(st.fwd).multiplyScalar(-0.1); p.copy(e.obj.position).addScaledVector(st.dir, 0.12); GLOW.emit(p, bk, 0.9, 0.16, o.trail, 0.5); } }
    if (vis) applyPose(e.rig, pose('fly', 0, t), damp(6, dt));
  };
}

// --- sparring pair on a local stage (with POW pops + impact puffs)
const HIT_WORDS = ['POW!', 'BAM!', 'WHAM!', 'KRAK!', 'THWACK!', 'BOOM!', 'SMASH!', 'DOOM!'];
function mkSpar(A, B, base, cx, cz, y0, o = {}) {
  const st = { phase: 'circle', t: 0, dur: rr(1, 2), ang: rand() * TAU, sep: 0.8, air: 0, airT: 0, att: 0, strike: 'punchL', hurtT: 0, blast: 0 };
  const radius = o.radius ?? 1.0, airH = o.airH ?? 1.1, sepFar = o.sepFar ?? 0.8, sepNear = o.sepNear ?? 0.2;
  const posA = V(), posB = V(), wp = V(), vel = V();
  const fighters = [A, B];
  return (dt, t, vis) => {
    st.t += dt; const P = st.phase;
    if (st.t > st.dur) {
      st.t = 0;
      if (P === 'circle') { if (o.airChance && rand() < o.airChance) st.air = 1; else if (rand() < 0.3) st.air = 0; if (o.blasts && rand() < 0.35) { st.phase = 'blast'; st.dur = 1.3; st.att = rand() < 0.5 ? 0 : 1; } else { st.phase = 'dash'; st.dur = 0.22; st.att = rand() < 0.5 ? 0 : 1; st.strike = pick(['punchL', 'punchR', 'kick', 'punchR']); } }
      else if (P === 'dash') { st.phase = 'strike'; st.dur = 0.3; }
      else if (P === 'strike') { st.phase = 'recoil'; st.dur = 0.45; // impact
        const def = fighters[1 - st.att]; def.obj.getWorldPosition(wp); wp.addScaledVector(V().copy(wp).normalize(), 0.18);
        if (vis) { for (let i = 0; i < 6; i++) PUFF.emit(wp, randDir(vel).multiplyScalar(0.8), 0.45, 0.03, 0.11, '#ffffff', 3); GLOW.emit(wp, V(), 0.25, 0.55, '#fff2a8', 0); popAt(wp, pick(HIT_WORDS), rand() < 0.3 ? 'red' : ''); }
        if (o.onHit) o.onHit(st);
      }
      else if (P === 'recoil') { st.phase = 'circle'; st.dur = rr(0.9, 2.2); }
      else if (P === 'blast') { st.phase = 'circle'; st.dur = rr(0.8, 1.6); }
    }
    // separation & angle
    let tgtSep = sepFar; if (st.phase === 'dash' || st.phase === 'strike') tgtSep = sepNear; if (st.phase === 'recoil') tgtSep = sepFar * 1.25;
    if (st.phase === 'blast') tgtSep = sepFar * 1.9;
    st.sep += (tgtSep - st.sep) * damp(st.phase === 'dash' ? 16 : 5, dt);
    st.ang += dt * (st.phase === 'circle' ? 0.6 : 0.1);
    st.airT += ((st.air ? 1 : 0) - st.airT) * damp(2.2, dt);
    const drift = Math.sin(t * 0.37) * radius * 0.3, driftZ = Math.cos(t * 0.29) * radius * 0.3;
    const ca = Math.cos(st.ang), sa = Math.sin(st.ang), h = y0 + st.airT * (airH + Math.sin(t * 1.7) * 0.15);
    posA.set(cx + drift + sa * st.sep / 2, h, cz + driftZ + ca * st.sep / 2); posB.set(cx + drift - sa * st.sep / 2, h + st.airT * Math.sin(t * 2.3) * 0.08, cz + driftZ - ca * st.sep / 2);
    setLocal(A.obj, base, posA.x, posA.y, posA.z, Math.atan2(posB.x - posA.x, posB.z - posA.z));
    setLocal(B.obj, base, posB.x, posB.y, posB.z, Math.atan2(posA.x - posB.x, posA.z - posB.z));
    if (st.phase === 'blast' && st.t > 0.35 && st.t < 1.0) { // ki blast volley
      st.blast += dt; const att = fighters[st.att], def = fighters[1 - st.att];
      while (st.blast > 0.07) { st.blast -= 0.07; att.obj.getWorldPosition(wp); const tp = def.obj.getWorldPosition(V()); const up = V().copy(wp).normalize(); wp.addScaledVector(up, 0.17); tp.addScaledVector(up, 0.17 + rr(-0.05, 0.1)); vel.subVectors(tp, wp).multiplyScalar(2.4); if (vis) GLOW.emit(wp, vel, 0.42, 0.16, o.blastC || '#9ff3ff', 0); }
    }
    if (!vis) return;
    const k = damp(14, dt);
    for (let i = 0; i < 2; i++) {
      const F = fighters[i]; let pz = 'stance';
      const air = st.airT > 0.5;
      if (st.phase === 'dash') pz = i === st.att ? (air ? 'flyFist' : 'stance') : 'block';
      else if (st.phase === 'strike') pz = i === st.att ? st.strike : (rand() < 0.02 ? 'block' : 'hurt');
      else if (st.phase === 'recoil') pz = i === st.att ? 'stance' : 'hurt';
      else if (st.phase === 'blast') pz = i === st.att ? (st.t > 0.3 ? 'point' : 'charge') : 'block';
      else if (air) pz = 'hover';
      applyPose(F.rig, pose(pz, 0, t), k);
    }
  };
}

// =====================================================================
//  THE CAST
// =====================================================================
function human(key, over = {}) { return mkHuman(Object.assign({}, CHAR[key], over)); }
function spawnHuman(name, key, over = {}, eo = {}) { const rig = human(key, over); return addEnt(name, rig.root, Object.assign({ rig, labelY: wH(rig) + 0.1 }, eo)); }
const CROWD = { mesh: null, list: [] };
function buildCast() {
  // ---------------- West City
  const ccb = SPOT.cc;
  { const e = spawnHuman('Bulma', 'bulma'); e.update = mkPoser(e, ccb, 0.55, 0, 1.75, 0.25, ['wave', 'idle', 'think', 'idle'], 2.6); e.say = ['Anyone seen my Dragon Radar?', 'Capsule Corp. rules!']; }
  { const e = spawnHuman('Vegeta', 'vegeta'); const gb = mat4At(SPOT.gravity.dir, tangentToward(SPOT.gravity.dir, REG.city), 0, CITY.h);
    const seq = ['punchL', 'punchR', 'kick', 'stance', 'crossed', 'crossed', 'powerup'];
    e.update = mkPoser(e, gb, 0, 0.02, 0.9, 0, seq, 0.55, { snap: 16, onPose: (e, p) => { if (p === 'kick' && rand() < 0.5) { const w = e.obj.getWorldPosition(V()); popAt(w.addScaledVector(V().copy(w).normalize(), 0.3), 'HMPH!', 'small'); } } });
    e.say = ['KAKAROT!', "It's over 9000!?", 'Prince of all Saiyans!']; }
  const skins = [SK, SK2, SK3, SK4, '#ffe3cc'];
  const citizens = QUALITY === 'low' ? 12 : 22;
  for (let i = 0; i < citizens; i++) {
    const kind = rand(); const top = pick(['#ff6b6b', '#4d96ff', '#ffd93d', '#6bcb77', '#c77dff', '#ff9f45', '#f7f7f7', '#2ec4b6', '#ef476f']);
    const o = { b: pick(['normal', 'slim', 'normal', 'short', 'tall']), skin: pick(skins), top, pants: pick(['#3d5a80', '#2b2d42', '#8d99ae', '#6b4f3a', '#e0c9a6']), boots: pick(['#2b2d42', '#6b4f3a', '#e9ecef']), shoe: 'shoe', hair: pick(['short', 'spiky', 'pony', 'afro', 'bob', 'cap']), hairC: pick([HC.black, HC.brown, HC.blonde, HC.orange, '#e05a8a', HC.red]), smile: rand() < 0.6 };
    if (o.hair === 'bob' || o.hair === 'pony') o.dress = rand() < 0.5 ? top : undefined;
    const rig = kind < 0.28 ? mkAnimalHuman(pick(['dog', 'cat', 'dog', 'pig']), o) : mkHuman(o);
    const e = addEnt(i % 4 === 0 ? pick(['Citizen', 'Tourist', 'Shopper', 'Dog Police']) : '', rig.root, { rig, labelY: wH(rig) + 0.1, lodFar: 32, olFar: 11 });
    e.update = mkRingWalk(e, pick(CITY.walks), rr(0.18, 0.32));
  }
  // ---------------- Kame House
  const kb = SPOT.kame.base;
  { const e = spawnHuman('Master Roshi', 'roshi'); e.update = mkPoser(e, kb, -0.6, 0.12, 0.6, 0.4 + Math.PI, ['sit', 'seat', 'sit', 'wave'], 3.4); e.say = ['Heh heh heh...', 'Kame... Hame...']; }
  { const rig = mkAnimalHuman('pig', { b: 'short', S: 0.24, top: '#3d6b35', pants: '#3d6b35', boots: '#2b2d42', shoe: 'shoe', smile: true }); const e = addEnt('Oolong', rig.root, { rig, labelY: wH(rig) + 0.1 });
    e.update = mkWander(e, SPOT.kame.dir, 1.9, 0.12, { minH: 0.08, maxH: 1.5, look: 0.25 }); e.say = ['I wish for... panties!']; }
  { const rig = mkTurtle(); const e = addEnt('Umigame', rig.root, { rig, labelY: 0.4 }); const b2 = kb; let a = 0;
    e.update = (dt, t, vis) => { a += dt * 0.1; setLocal(e.obj, b2, 0.6 + Math.sin(a) * 0.25, -0.02, -0.75, Math.PI + Math.sin(a) * 0.6); rig.head.position.z = 0.24 + Math.sin(t * 1.5) * 0.02; rig.head.rotation.y = Math.sin(t * 0.8) * 0.4; }; }
  { const e = spawnHuman('Krillin', 'krillin'); e.update = mkFlyCircle(e, SPOT.kame.dir, 2.6, 1.8, 1.4, { sgn: 1 }); e.say = ['Hey, Goku!', 'Destructo Disc!']; }
  { const e = spawnHuman('Android 18', 'a18'); e.update = mkFlyCircle(e, SPOT.kame.dir, 3.1, 2.3, 1.5, { sgn: 1 }); }
  // ---------------- Korin Tower + Kami's Lookout
  const kob = SPOT.korin.base, LY = SPOT.korin.LY, TH = SPOT.korin.TH;
  { const rig = mkKorin(); const e = addEnt('Korin', rig.root, { rig, labelY: wH(rig) + 0.12 }); e.update = mkArcWalk(e, kob, 0.77, TH + 0.04, -2.5, 2.5, 0.08); e.say = ['Senzu bean?', 'Meow.']; }
  { const e = spawnHuman('Dende', 'dende'); e.update = mkArcWalk(e, kob, 2.5, LY + 0.15, -2.2, 2.2, 0.22); e.say = ["Welcome to Kami's Lookout!"]; }
  { const e = spawnHuman('Piccolo', 'piccolo'); e.update = mkPoser(e, kob, 2.9, LY + 0.62, 1.9, 1.0, ['meditate'], 99, { float: true }); e.say = ['...', 'Hmph. Focus.']; }
  // ---------------- Mt. Paozu
  const pb = SPOT.paozu.base;
  { const e = spawnHuman('Chi-Chi', 'chichi'); e.update = mkPoser(e, pb, 0.35, 0, 0.95, 0.2, ['think', 'point', 'idle'], 2.5); e.say = ['GOKU! Dinner is ready!', 'Study, Gohan!']; }
  { const e = spawnHuman('Goten', 'goten'); e.update = mkCircleRun(e, pb, 0, 0, 1.55, 0, 0.9); e.say = ['Big brother!']; }
  // ---------------- Buu's house
  { const rig = human('buu'); const e = addEnt('Majin Buu', rig.root, { rig, labelY: wH(rig) + 0.12 });
    e.update = mkWander(e, SPOT.buu.d, 2.6, 0.18, { walkPose: 'waddle', idlePoses: ['dance', 'cheer', 'idle'], walkP: 0.5, look: 0.3 }); e.say = ['Buu want candy!', 'Buu happy!']; }
  // ---------------- World Tournament
  const tb = SPOT.tourn.base;
  { const a = spawnHuman('Tien', 'tien'), b = spawnHuman('Yamcha', 'yamcha'); const up = mkSpar(a, b, tb, 0, -0.25, 0.28, { radius: 1.0, airChance: 0.25, airH: 0.9 }); a.update = (dt, t, vis) => up(dt, t, vis); b.update = noop; a.say = ['Tri-Beam!']; b.say = ['Wolf Fang Fist!']; }
  { const e = spawnHuman('Mr. Satan', 'satan'); e.update = mkPoser(e, tb, 0.9, 0.28, 1.45, 0.2, ['victory', 'flex', 'point', 'cheer'], 2.2, { onPose: (e, p) => { if (p === 'victory' && rand() < 0.6) { const w = e.obj.getWorldPosition(V()); popAt(w.addScaledVector(V().copy(w).normalize(), 0.45), 'HA HA HA!', 'small'); } } }); e.say = ['I am the champ!', 'Hercule punch!']; }
  { const e = spawnHuman('Announcer', 'announcer'); e.update = mkPoser(e, tb, -1.1, 0.28, 1.5, -0.3, ['point', 'cheer', 'point', 'idle'], 1.8); }
  { const rig = mkPuar(); const e = addEnt('Puar', rig.root, { rig, labelY: wH(rig) + 0.14 }); e.update = mkPoser(e, tb, -1.8, 0.95, 0.6, 0.8, ['cheer', 'wave'], 2, { float: true }); }
  buildCrowd(tb);
  // ---------------- Cell Games
  const cb = SPOT.cell.base;
  { const a = spawnHuman('Gohan (SSJ2)', 'gohan'), b = spawnHuman('Perfect Cell', 'cell');
    const aura = mkAura('#ffd84a', 0.36, 0.48); a.obj.add(aura);
    const up = mkSpar(a, b, cb, 0, 0, 0.4, { radius: 1.6, airChance: 0.55, airH: 1.6, sepFar: 1.1, blasts: true, blastC: '#fff6a0' });
    let spark = 0; const w = V(), vv = V();
    a.update = (dt, t, vis) => { up(dt, t, vis); aura.material.uniforms.uA.value = 0.75 + Math.sin(t * 30) * 0.15; spark += dt; if (vis && spark > 0.18) { spark = 0; a.obj.getWorldPosition(w); w.addScaledVector(V().copy(w).normalize(), rr(0.05, 0.4)).add(randDir(vv).multiplyScalar(0.12)); GLOW.emit(w, randDir(vv).multiplyScalar(0.3), 0.15, 0.1, '#7ff0ff', 0); } };
    b.update = noop; a.say = ['This ends now!']; b.say = ['Perfection!', 'Hohoho...']; }
  // ---------------- Saiyan pods
  const pods = SPOT.pods;
  { const f = pods[0]; const d = offsetDir(frameAt(f.c), 1.4, 0.6); const e = spawnHuman('Nappa', 'nappa'); const b = mat4At(d, tangentToward(d, REG.pods), 0);
    e.update = mkPoser(e, b, 0, 0, 0, 0, ['crossed', 'crossed', 'flex', 'roar'], 2.8); e.say = ['Vegeta! What does the scouter say?']; }
  { const f = pods[1]; const d = offsetDir(frameAt(f.c), -1.3, -0.4); const e = spawnHuman('Raditz', 'raditz'); const b = mat4At(d, tangentToward(d, REG.pods), 0);
    e.update = mkPoser(e, b, 0, 0, 0, 0, ['crossed', 'point', 'crossed'], 3.2); e.say = ['Kakarot, my brother!']; }
  for (let i = 0; i < 3; i++) { const rig = human('saibaman'); const e = addEnt('Saibaman', rig.root, { rig, labelY: wH(rig) + 0.12, lodFar: 30 }); e.update = mkWander(e, REG.pods, 3.6, 0.35, { walkPose: 'run', stepRate: 14, idlePoses: ['cheer', 'stance'], walkP: 0.6 }); }
  // ---------------- Frieza's ship
  { const rig = human('frieza'); const pod = mkHoverPod(); pod.add(rig.root); rig.root.position.set(0, 0.06, -0.02); rig.root.scale.setScalar(0.3);
    const e = addEnt('Frieza', pod, { rig, labelY: 0.5 }); const fb = SPOT.frieza.base; let a = 0;
    e.update = (dt, t, vis) => { a += dt * 0.22; const r = 3.4; setLocal(pod, fb, Math.sin(a) * r, 1.3 + Math.sin(t * 1.1) * 0.15, Math.cos(a) * r, a + Math.PI / 2 + 0.25); if (vis) applyPose(rig, pose('seat', 0, t), damp(8, dt)); };
    e.say = ['Ohohoho!', 'Worthless monkeys...']; }
  // ---------------- Future Trunks world patrol + Yajirobe-free skies
  { const e = spawnHuman('Future Trunks', 'trunks', {}, { lodFar: 60 }); e.update = mkGlobeFlyer(e, 7.5, 3.2, { trail: '#8fd8ff' }); e.say = ["I came from the future!"]; }
  // ---------------- Great Ape
  { const rig = mkApe(); const center = dirLL(24, 82); const e = addEnt('Great Ape', rig.root, { rig, labelY: wH(rig) + 0.3, lodFar: 140, olFar: 45, cls: 'dino' });
    e.update = mkWander(e, center, 11, 0.45, { minH: 0.3, maxH: 3.5, look: 2.2, stepRate: 2.6, avoidProt: true, idlePoses: ['roar', 'roar', 'idle'], walkP: 0.6,
      onStop: (e, st) => { if (st.mode === 'roar') { const w = e.obj.getWorldPosition(V()); popAt(w.addScaledVector(V().copy(w).normalize(), 3.8), 'ROOOAAAR!!', 'red'); } } });
    e.say = ['GRAAAAH!']; }
  // ---------------- Dinosaurs
  buildDinos(1);
  // ---------------- King Kai's planet
  buildKingKai();
}
function mkHoverPod() {
  const P = new PB();
  P.add(G.hemi, '#f3f0f7', [0, 0.05, 0], [Math.PI, 0, 0], [0.22, 0.14, 0.22]); P.add(G.cyl, '#b089d8', [0, 0.05, 0], 0, [0.225, 0.035, 0.225]);
  P.add(G.cyl, '#dcd4ea', [0, -0.05, 0], 0, [0.16, 0.02, 0.16]); P.add(G.sphLo, '#6ad0ff', [0, -0.1, 0], 0, [0.05, 0.03, 0.05]);
  P.add(G.hemi, '#9b6bd6', [0, 0.05, 0.16], [0.5, 0, 0], [0.11, 0.05, 0.08]);
  const g = new THREE.Group(); g.add(P.mesh(0.012)); return g;
}
function buildCrowd(tb) {
  const P = new PB(); P.add(capG(0.045, 0.08), '#ffffff', [0, 0.1, 0]); P.add(G.sphLo, '#ffffff', [0, 0.215, 0], 0, 0.055); const g = P.geometry();
  const spots = []; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) for (let j = 0; j < 9; j++) { if (rand() < 0.12) continue; spots.push({ x: sx * (2.45 + k * 0.32), y: 0.2 + k * 0.28, z: -1.45 + j * 0.36 + rr(-0.05, 0.05), yaw: sx > 0 ? -Math.PI / 2 : Math.PI / 2, ph: rand() * TAU }); }
  const im = instanced(g, spots.length, MAT.toonI, 0.012); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spots.length * 3), 3);
  const cc = new THREE.Color(); spots.forEach((s, i) => im.setColorAt(i, cc.set(pick(['#ff6b6b', '#4d96ff', '#ffd93d', '#6bcb77', '#c77dff', '#ff9f45', '#f1f1f1', '#2ec4b6', '#ffb4a2'])))); im.instanceColor.needsUpdate = true;
  scene.add(im); CROWD.mesh = im; CROWD.list = spots; const m4 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), c0 = V();
  const center = localPt(tb, 0, 0, 0);
  UPD.push((dt, t) => {
    if (camera.position.distanceTo(center) > 30 && CROWD.done) return; CROWD.done = true;
    spots.forEach((s, i) => { const j = Math.max(0, Math.sin(t * 7 + s.ph)) * 0.05; m2.makeRotationY(s.yaw); m2.setPosition(s.x, s.y + j, s.z); m4.multiplyMatrices(tb, m2); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true;
  });
}
function buildDinos(mult = 1, center = REG.jungle, radius = 15) {
  const table = [['T-Rex', 'trex', 3, 1.25, 0.8], ['Brachiosaurus', 'brachio', 3, 1.2, 0.3], ['Triceratops', 'trike', 4, 1.0, 0.45]];
  for (const [name, kind, n, s, spd] of table) for (let i = 0; i < Math.round(n * mult); i++) {
    const rig = mkDinoRig(kind); const sm = s * rr(0.85, 1.15); rig.root.scale.multiplyScalar(sm);
    const e = addEnt(name, rig.root, { rig, kind: 'dino', cls: 'dino', labelY: rig.h * sm + 0.2, lodFar: 90, olFar: 30 });
    e.update = mkWander(e, center, radius, spd, { minH: 0.2, maxH: 4.5, look: 1.2, stepRate: kind === 'brachio' ? 2.6 : kind === 'trex' ? 5 : 6, walkP: 0.65, avoidProt: true,
      onStop: kind === 'trex' ? (e) => { if (rand() < 0.5) { const w = e.obj.getWorldPosition(V()); popAt(w.addScaledVector(V().copy(w).normalize(), 1.6), 'ROAR!', 'red'); } } : null });
  }
  for (let i = 0; i < Math.round(5 * mult); i++) {
    const rig = mkDinoRig('ptero'); const e = addEnt('Pterodactyl', rig.root, { rig, kind: 'dino', cls: 'dino', labelY: 0.4, lodFar: 90, olFar: 25 });
    const fly = mkFlyCircle(e, offsetDir(frameAt(center), rr(-6, 6), rr(-6, 6)), rr(3, 7), rr(4, 7.5), rr(2.2, 3.2), { sgn: rand() < 0.5 ? 1 : -1, bob: 0.8, pose: 'fly' });
    let ph = rand() * TAU; e.update = (dt, t, vis) => { fly(dt, t, false); ph += dt * 5; if (vis) animDino(rig, true, ph, t, dt); };
  }
}

// =====================================================================
//  KING KAI'S PLANET (tiny world in orbit)
// =====================================================================
let KK = null;
function buildKingKai() {
  const rs = 2.6; const grp = new THREE.Group(); scene.add(grp);
  let g = new THREE.IcosahedronGeometry(rs, 6); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), d = V(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { d.fromBufferAttribute(p, i).normalize(); const n = noise3(d.x * 3, d.y * 3, d.z * 3); const road = Math.abs(d.y) < 0.09 ? 1 : 0; c.set(road ? '#e8d6a0' : n > 0.25 ? '#4fc24a' : '#6ad65a'); if (d.y < -0.93) c.set('#8a6a4a'); col.set([c.r, c.g, c.b], i * 3); p.setXYZ(i, d.x * rs * (1 + n * 0.012), d.y * rs * (1 + n * 0.012), d.z * rs * (1 + n * 0.012)); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const ball = new THREE.Mesh(g, MAT.toon); ball.add(new THREE.Mesh(outlineGeo(g), outlineMat(0.05))); grp.add(ball);
  // house, tree, car, snake way stub
  const loc = (lat, lon, fwdLon = lon + 20) => { const u = dirLL(lat, lon); const f = tangentToward(u, dirLL(lat, fwdLon)); const q = basisQuat(u, f, new THREE.Quaternion()); return new THREE.Matrix4().compose(u.clone().multiplyScalar(rs - 0.02), q, V().setScalar(1)); };
  const P = new PB();
  P.base = loc(62, 0);
  P.add(G.cyl, '#fbfaf2', [0, 0.25, 0], 0, [0.55, 0.5, 0.55]); P.add(G.hemi, '#fbfaf2', [0, 0.5, 0], 0, [0.55, 0.5, 0.55]); P.add(G.cyl, '#e8453c', [0, 0.52, 0], 0, [0.56, 0.05, 0.56]);
  P.add(G.rbox, '#6b4428', [0, 0.18, 0.54], 0, [0.16, 0.3, 0.05]); P.add(G.sphLo, '#6cc0f2', [0.3, 0.32, 0.45], 0, [0.08, 0.08, 0.04]); P.add(G.cylLo, '#bbbbbb', [0.2, 1.05, 0], 0, [0.02, 0.18, 0.02]);
  P.base = loc(55, 70); P.addM(TREEGEO.round, null, new THREE.Matrix4().makeScale(1.6, 1.6, 1.6));
  P.base = loc(40, -60, -40); // King Kai's car
  P.add(G.rbox, '#e8453c', [0, 0.14, 0], 0, [0.32, 0.14, 0.55]); P.add(G.rbox, '#e8453c', [0, 0.26, -0.08], 0, [0.28, 0.14, 0.26]); P.add(G.box, '#bfe6ff', [0, 0.26, 0.06], [-0.4, 0, 0], [0.26, 0.1, 0.02]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.add(G.cyl, '#25212f', [sx * 0.17, 0.07, sz * 0.18], [0, 0, Math.PI / 2], [0.07, 0.05, 0.07]);
  P.add(G.cyl, '#ffd23a', [0, 0.14, 0.28], [Math.PI / 2, 0, 0], [0.04, 0.01, 0.04]);
  P.base = null; const props = P.mesh(0.02); grp.add(props);
  // residents walking on the tiny sphere
  const walkers = [];
  const mkTiny = (name, rig, spd, poseW) => { const e = addEnt(name, rig.root, { rig, parent: grp, labelY: wH(rig) + 0.12, lodFar: 60 }); const st = { dir: randDir(V()), fwd: V(), timer: 0, turn: 0, ph: 0, walk: true }; st.dir.y = 1.1 + Math.abs(st.dir.y) * 1.4; st.dir.normalize(); randTangent(st.dir, st.fwd);
    e.update = (dt, t, vis) => { st.timer -= dt; if (st.timer < 0) { st.timer = rr(2, 5); st.turn = rr(-0.6, 0.6); st.walk = rand() < 0.75; } if (st.walk) { if (st.dir.y < 0.62) tangentToward(st.dir, _Y, st.fwd); turnAround(st.dir, st.fwd, st.turn * dt); moveAlong(st.dir, st.fwd, spd * dt * R / rs); st.ph += dt * 10; }
      e.obj.position.copy(st.dir).multiplyScalar(rs); basisQuat(st.dir, st.fwd, e.obj.quaternion); if (vis) applyPose(rig, pose(st.walk ? poseW : 'cheer', st.ph, t), damp(10, dt)); };
    walkers.push(e); return e; };
  const kk = mkTiny('King Kai', human('kingkai'), 0.22, 'waddle'); kk.say = ['Knock knock!', 'Welcome to my planet!'];
  mkTiny('Bubbles', mkBubbles(), 0.3, 'run');
  mkTiny('Gregory', mkPuar(), 0.35, 'hover');
  KK = { grp, rs, a: 1.3, spin: 0 };
  // keep the little planet's "north pole" (house) facing away from the big planet, spinning slowly
  const kkQ = new THREE.Quaternion(), kkU = V();
  const kkPlace = (dt) => { KK.a += dt * 0.018; KK.spin += dt * 0.05; grp.position.set(Math.cos(KK.a) * 104, 26 + Math.sin(KK.a * 0.7) * 16, Math.sin(KK.a) * 104);
    kkU.copy(grp.position).normalize(); grp.quaternion.setFromUnitVectors(_Y, kkU).multiply(kkQ.setFromAxisAngle(_Y, KK.spin)); };
  kkPlace(0); UPD.push(kkPlace);
  PLACES.push({ name: "King Kai's Planet", obj: grp, view: 9, tilt: -0.72, icon: '' });
}
