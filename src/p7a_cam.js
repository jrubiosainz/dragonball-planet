
// =====================================================================
//  CAMERA RIG — globe orbit (Google-Earth style), Goku chase-cam, cinematics
// =====================================================================
let MODE = 'orbit';
const CAM = {
  d: dirLL(18, 16), fw: V(), h: 0, lift: 0, range: 240, tiltU: 0, follow: null, anim: null, idle: 0,
  fyaw: 0, fpitch: 0.3, fdist: 2.6, fp: V(), fpInit: false,
  pos: V(), look: V(), up: V(), q: new THREE.Quaternion(), cpos: V(), clook: V(), cInit: false,
  ctl: '', tr: null, fov: 50, pickT: 0, pickX: -1, pickY: -1, pickHit: null,
};
CAM.fw.copy(frameAt(CAM.d).north);
const _k7a = V(), _k7b = V(), _k7c = V(), _k7d = V(), _k7e = V(), _k7f = V();
const _k7q = new THREE.Quaternion(), _k7q2 = new THREE.Quaternion(), _k7m = new THREE.Matrix4();
const autoTilt = (r) => 1.18 * (1 - smooth(4, 85, r));
const orbitTilt = () => clamp(autoTilt(CAM.range) + CAM.tiltU, 0, 1.45);
// rotate focus dir d (and its heading fw) along tangent t by dist world units
function _k7Move(d, fw, t, dist) {
  _k7e.crossVectors(d, t); if (_k7e.lengthSq() < 1e-12) return;
  _k7q2.setFromAxisAngle(_k7e.normalize(), dist / R);
  d.applyQuaternion(_k7q2).normalize(); fw.applyQuaternion(_k7q2); fw.addScaledVector(d, -fw.dot(d)).normalize();
}
// world anchor of a follow target {obj, y}: origin + local up * y
function followPos(tg, out) {
  const o = tg.obj; o.updateWorldMatrix(true, false); const m = o.matrixWorld.elements;
  out.set(m[12], m[13], m[14]);
  if (tg.y) { _k7f.set(m[4], m[5], m[6]).normalize(); out.addScaledVector(_k7f, tg.y); }
  return out;
}
function orbitPose(dt) {
  const C = CAM;
  if (C.anim) {
    const A = C.anim; A.t += dt; const k = Math.min(1, A.t / A.dur), e = easeInOut(k);
    if (A.follow) { followPos(A.follow, _k7a); A.d1.copy(_k7a).normalize(); A.h1 = _k7a.length() - R; }
    _k7q.setFromUnitVectors(A.d0, A.d1); _k7q2.identity().slerp(_k7q, e);
    C.d.copy(A.d0).applyQuaternion(_k7q2).normalize(); C.fw.copy(A.fw0).applyQuaternion(_k7q2);
    const hop = 1 + Math.sin(Math.PI * k) * A.ang * 0.8;
    C.range = Math.min(300, Math.exp(lerp(Math.log(A.r0), Math.log(A.r1), e)) * hop);
    C.h = lerp(A.h0, A.h1, e); C.tiltU = lerp(A.tu0, A.tu1, e);
    if (k >= 1) { C.anim = null; C.follow = A.follow; C.lift = A.lift; }
  } else if (C.follow) {
    followPos(C.follow, _k7a); C.d.copy(_k7a).normalize(); C.h = _k7a.length() - R;
  } else {
    const kx = (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0);
    const ky = (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0);
    if (kx || ky) {
      const sp = C.range * 0.9 * dt; C.idle = 0; C.lift *= 0.9;
      if (ky) moveAlong(C.d, C.fw, ky * sp);
      if (kx) { _k7c.crossVectors(C.fw, C.d); _k7Move(C.d, C.fw, _k7c, kx * sp); }
    }
    C.idle += dt;
    if (C.idle > 9 && C.range > 30) { _k7q.setFromAxisAngle(_Y, 0.04 * dt * smooth(9, 13, C.idle)); C.d.applyQuaternion(_k7q); C.fw.applyQuaternion(_k7q); }
    C.h += (groundH(C.d) + C.lift - C.h) * damp(4, dt);
  }
  const kr = (KEYS.KeyQ ? 1 : 0) - (KEYS.KeyE ? 1 : 0), kz = (KEYS.KeyX || KEYS.Minus ? 1 : 0) - (KEYS.KeyZ || KEYS.Equal ? 1 : 0);
  if (kr) { turnAround(C.d, C.fw, kr * 1.2 * dt); C.idle = 0; }
  if (kz) { C.range = clamp(C.range * Math.exp(kz * 1.4 * dt), 0.9, 260); C.idle = 0; }
  C.fw.addScaledVector(C.d, -C.fw.dot(C.d)); if (C.fw.lengthSq() < 1e-6) tangentToward(C.d, _Y, C.fw); C.fw.normalize();
  const tl = orbitTilt(), ct = Math.cos(tl), st = Math.sin(tl);
  _k7a.copy(C.d).multiplyScalar(R + C.h);
  C.pos.copy(C.d).multiplyScalar(ct).addScaledVector(C.fw, -st).multiplyScalar(C.range).add(_k7a);
  const r = C.pos.length(); _k7b.copy(C.pos).divideScalar(r); const minR = R + groundH(_k7b) + 0.12 + cityClear(_k7b);
  if (r < minR) C.pos.copy(_k7b).multiplyScalar(minR);
  C.look.copy(_k7a); C.up.copy(C.d).multiplyScalar(st).addScaledVector(C.fw, ct);
}
// extra camera clearance over West City's building rings (keeps the orbit camera out of skyscrapers)
function cityClear(d) {
  const r = arcDist(d, REG.city); if (r > 12.6) return 0;
  const bump = (a, b, h) => h * smooth(a - 0.8, a, r) * (1 - smooth(b, b + 0.8, r));
  return Math.max(bump(3.9, 5.95, 5.3), bump(7.35, 9.4, 3.1), bump(10.95, 11.75, 1.4), 2.3 * (1 - smooth(1.4, 2.2, r)));
}
function flyPose(dt) {
  const g = GOKU, C = CAM, up = g.dir;
  if (!PTR.drag && Math.abs(g.speed) > 1.2 && !g.kame.charging && g.kame.firing <= 0) C.fyaw *= 1 - damp(1.1, dt);
  _k7a.copy(g.fwd); turnAround(up, _k7a, C.fyaw);
  const D = C.fdist * (1 + g.speedK * 0.3), cp = Math.cos(C.fpitch), sp = Math.sin(C.fpitch);
  _k7b.copy(g.pos).addScaledVector(up, 0.22);
  _k7c.copy(_k7b).addScaledVector(_k7a, -cp * D).addScaledVector(up, sp * D);
  const r = _k7c.length(); _k7d.copy(_k7c).divideScalar(r); const minR = R + groundH(_k7d) + 0.14;
  if (r < minR) _k7c.copy(_k7d).multiplyScalar(minR);
  if (!C.fpInit) { C.fp.copy(_k7c); C.fpInit = true; } else C.fp.lerp(_k7c, damp(9, dt));
  C.pos.copy(C.fp); C.look.copy(_k7b).addScaledVector(up, 0.16 * D); C.up.copy(C.fp).normalize();
}
function cinePose(dt) {
  const C = CAM;
  if (!C.cInit) { C.cpos.copy(camera.position); camera.getWorldDirection(_k7a); C.clook.copy(camera.position).addScaledVector(_k7a, 12); C.cInit = true; }
  C.cpos.lerp(SHEN.camPos, damp(1.8, dt)); C.clook.lerp(SHEN.camLook, damp(2.4, dt));
  const r = C.cpos.length(); _k7d.copy(C.cpos).divideScalar(r); const minR = R + groundH(_k7d) + 0.3; if (r < minR) C.cpos.copy(_k7d).multiplyScalar(minR);
  C.pos.copy(C.cpos); C.look.copy(C.clook); C.up.copy(C.cpos).normalize();
}
// spherical position blend with a little "hop" so transitions arc over the planet instead of through it
function _k7Slerp(a, b, k, out) {
  const ra = a.length(), rb = b.length(); _k7d.copy(a).divideScalar(ra); _k7e.copy(b).divideScalar(rb);
  const ang = Math.acos(clamp(_k7d.dot(_k7e), -1, 1));
  if (ang < 1e-4) return out.lerpVectors(a, b, k);
  _k7q.setFromUnitVectors(_k7d, _k7e); _k7q2.identity().slerp(_k7q, k);
  return out.copy(_k7d).applyQuaternion(_k7q2).multiplyScalar(lerp(ra, rb, k) + Math.sin(Math.PI * k) * ang * R * 0.45);
}
function updateCamera(dt, t) {
  const C = CAM, ctl = SHEN.cam ? 'cine' : MODE === 'fly' && GOKU ? 'fly' : 'orbit';
  if (ctl !== C.ctl) {
    if (C.ctl && ctl !== 'cine') {
      const ang = camera.position.angleTo(ctl === 'fly' ? GOKU.pos : C.d);
      C.tr = { t: 0, dur: clamp(0.9 + ang * 0.9, 0.9, 2.6), p0: camera.position.clone(), q0: camera.quaternion.clone() };
    } else C.tr = null;
    if (ctl === 'cine') C.cInit = false; if (ctl === 'fly') C.fpInit = false;
    C.ctl = ctl;
  }
  if (ctl === 'cine') cinePose(dt); else if (ctl === 'fly') flyPose(dt); else orbitPose(dt);
  _k7m.lookAt(C.pos, C.look, C.up); C.q.setFromRotationMatrix(_k7m);
  if (C.tr) {
    const T = C.tr; T.t += dt; const k = easeInOut(Math.min(1, T.t / T.dur));
    _k7Slerp(T.p0, C.pos, k, camera.position); camera.quaternion.slerpQuaternions(T.q0, C.q, k);
    if (T.t >= T.dur) C.tr = null;
  } else { camera.position.copy(C.pos); camera.quaternion.copy(C.q); }
  if (GOKU && GOKU.shake > 0.01) {
    const s = GOKU.shake * 0.035 * clamp(8 / (camera.position.distanceTo(GOKU.pos) + 1), 0.1, 1);
    camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; camera.position.z += (Math.random() - 0.5) * s;
  }
  const fovT = ctl === 'fly' ? 56 + GOKU.speedK * 16 : 50; C.fov += (fovT - C.fov) * damp(4, dt);
  const D = camera.position.length(), alt = D - R;
  const ref = Math.max(0.05, Math.min(alt, ctl === 'fly' ? C.fdist : ctl === 'orbit' ? C.range : alt));
  camera.fov = C.fov; camera.near = clamp(ref * 0.03, 0.012, 8); camera.far = Math.max(300, D + 230);
  camera.updateProjectionMatrix();
}
function panOrbit(dx, dy) {
  const C = CAM; C.anim = null; C.follow = null; C.lift = 0; C.idle = 0;
  const wpp = (2 * C.range * Math.tan((camera.fov * DEG) / 2)) / innerHeight;
  _k7c.crossVectors(C.fw, C.d); _k7Move(C.d, C.fw, _k7c, -dx * wpp);
  moveAlong(C.d, C.fw, (dy * wpp) / Math.max(0.3, Math.cos(orbitTilt())));
}
function rotOrbit(dx, dy) {
  const C = CAM; C.idle = 0; turnAround(C.d, C.fw, -dx * 0.0055);
  const a = autoTilt(C.range); C.tiltU = clamp(C.tiltU - dy * 0.0045, -a, 1.45 - a);
}
function zoomOrbit(f, x, y) {
  const C = CAM; C.idle = 0;
  if (C.anim) { C.anim.r1 = clamp(C.anim.r1 * f, 0.9, 260); return; }
  const r0 = C.range; C.range = clamp(C.range * f, 0.9, 260);
  if (f < 1 && !C.follow && x !== undefined) {
    const hit = pickGround(x, y);
    if (hit) {
      const ang = Math.acos(clamp(C.d.dot(hit.dir), -1, 1));
      if (ang > 1e-5) { tangentToward(C.d, hit.dir, _k7c); _k7Move(C.d, C.fw, _k7c, ang * R * (1 - C.range / r0)); }
      C.lift *= 0.8;
    }
  }
}
// terrain point under a screen pixel (null = sky)
function pickGround(x, y) {
  const now = performance.now();
  if (now - CAM.pickT < 70 && Math.abs(x - CAM.pickX) + Math.abs(y - CAM.pickY) < 12) return CAM.pickHit;
  _k7a.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
  const o = camera.position, b = o.dot(_k7a), c = o.lengthSq() - (R + 11) * (R + 11), disc = b * b - c;
  let hit = null;
  if (disc > 0) { const t0 = Math.max(0, -b - Math.sqrt(disc)); _k7b.copy(o).addScaledVector(_k7a, t0); hit = rayTerrain(_k7b, _k7a, 80); }
  CAM.pickT = now; CAM.pickX = x; CAM.pickY = y; CAM.pickHit = hit; return hit;
}
function flyTo(d, range, lift = 0, follow = null, dur = 0, tilt = 0) {
  const C = CAM; C.follow = null; C.idle = 0;
  const d1 = d.clone().normalize(), ang = Math.acos(clamp(C.d.dot(d1), -1, 1));
  C.anim = { t: 0, d0: C.d.clone(), fw0: C.fw.clone(), d1, r0: C.range, r1: range, h0: C.h, h1: groundH(d1) + lift, tu0: C.tiltU, tu1: tilt, lift, follow, ang,
    dur: dur || clamp(1.1 + ang * 0.75 + Math.abs(Math.log(range / C.range)) * 0.18, 1.1, 3.6) };
}
function gotoPlace(p) {
  if (MODE === 'fly') { instantTransmission(p); return; }
  if (p.obj) { const tg = { obj: p.obj, y: 0 }; flyTo(followPos(tg, _k7a).clone(), p.view, 0, tg, 0, p.tilt || 0); }
  else flyTo(p.dir, p.view * 0.9, Math.max(0, p.alt - 2.6 - groundH(p.dir)), null, 0, p.tilt || 0);
  banner(`${p.icon || PLACE_ICON[p.name] || '📍'} ${p.name.toUpperCase()}`, 2.2);
}
function followEnt(e) {
  if (!e) return; if (MODE === 'fly') setMode('orbit');
  const tg = { obj: e.obj, y: e.labelY * 0.55, e };
  flyTo(followPos(tg, _k7a).clone(), clamp(e.labelY * 5.5, 2, 16), 0, tg);
  banner(`🎥 FOLLOWING ${e.name.toUpperCase()} — drag to orbit · Esc to stop`, 2.8);
}
function instantTransmission(p) {
  const g = GOKU; if (!g || SHEN.active) return;
  const from = g.pos.clone(); let d, alt;
  if (p.obj) { followPos({ obj: p.obj, y: 0 }, _k7a); d = _k7a.clone().normalize(); alt = _k7a.length() - R + 3.4; }
  else { d = p.dir.clone(); alt = Math.max(groundH(d) + 1.4, p.alt - 1); }
  const nd = d.clone(), bk = tangentToward(d, g.dir, V()); moveAlong(nd, bk, Math.min(7, p.view * 0.5));
  g.dir.copy(nd); tangentToward(nd, d, g.fwd); g.alt = Math.max(alt, groundH(nd) + 0.8); g.speed = 0; g.vs = 0; g.yawRate = 0;
  g.pos.copy(nd).multiplyScalar(R + g.alt); g.obj.position.copy(g.pos);
  CAM.fpInit = false; CAM.fyaw = 0; flashScreen(0.5, 350);
  for (let i = 0; i < 40; i++) { GLOW.emit(from, randDir(V()).multiplyScalar(rr(1, 3)), 0.5, 0.15, '#bff4ff', 2); GLOW.emit(g.pos, randDir(V()).multiplyScalar(rr(1, 3)), 0.6, 0.15, '#bff4ff', 2); }
  setTimeout(() => popAt(g.pos.clone().addScaledVector(g.dir, 0.6), 'INSTANT TRANSMISSION!', 'blue small'), 90);
  banner(`⚡ INSTANT TRANSMISSION → ${p.name.toUpperCase()}`, 2.4);
}
function setMode(m) {
  if (m === MODE || !GOKU || SHEN.active) return;
  MODE = m;
  $('bOrbit').classList.toggle('on', m === 'orbit'); $('bFly').classList.toggle('on', m === 'fly');
  $('radar').style.display = m === 'fly' ? 'block' : 'none'; $('power').style.display = m === 'fly' ? 'block' : 'none';
  for (const k in KEYS) KEYS[k] = false;
  if (m === 'fly') {
    CAM.follow = null; CAM.anim = null; CAM.fyaw = 0; CAM.fpitch = 0.3; CAM.fdist = 2.6;
    $('pForm').textContent = FORMS[GOKU.form].name;
    banner('YOU ARE GOKU! ★ Collect the 7 Dragon Balls — follow the radar!', 4);
  } else {
    CAM.d.copy(GOKU.dir); CAM.fw.copy(GOKU.fwd); CAM.range = 6; CAM.tiltU = 0; CAM.idle = 0;
    CAM.lift = Math.max(0, GOKU.alt - groundH(GOKU.dir)); CAM.h = groundH(CAM.d) + CAM.lift;
  }
  renderHelp();
}
