
// =====================================================================
//  ENTITY LOD, ENVIRONMENT, INPUT, MAIN LOOP, BOOT
// =====================================================================
const PTR = { drag: false, btn: 0, x: 0, y: 0, moved: 0, t0: 0, pts: new Map(), pd: 0, pa: 0, py: 0 };
const PERF = { warm: 4, acc: 0, n: 0 };
const _k7col = new THREE.Color(), _k7fog = new THREE.Color(0xa8dcff), _k7amb = new THREE.Color(0xa9c2ff);
let _k7last = 0, _k7T = 0, _k7err = 0, _k7frame = 0;
function updateEntities(dt, t) {
  const cp = camera.position, cx = cp.x, cy = cp.y, cz = cp.z;
  for (const e of ENT) {
    const m = e.obj.matrixWorld.elements, dx = m[12] - cx, dy = m[13] - cy, dz = m[14] - cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let vis = d < e.lodFar;
    if (vis && d > 12) { _k7o2.set(m[12], m[13], m[14]); vis = !occluded(_k7o2); }
    e.vis = vis;
    if (!e.keep && e.obj.visible !== vis) e.obj.visible = vis;
    const ol = d < e.olFar; if (ol !== e.olOn) { e.olOn = ol; for (const o of e.ols) o.visible = ol; }
    if (e.update) e.update(dt, t, vis);
  }
}
function updateEnv(dt, t) {
  const cp = camera.position, D = cp.length(), alt = D - R, far = camera.far, dk = SHEN.dark;
  sky.position.copy(cp); sky.scale.setScalar((far * 0.9) / 1000);
  stars.position.copy(cp); stars.scale.setScalar((far * 0.93) / 1500);
  sunSprite.position.copy(cp).addScaledVector(SUN_DIR, far * 0.8); sunSprite.scale.setScalar(far * 0.8 * 0.17); sunSprite.material.opacity = 1 - dk * 0.8;
  skyU.uUp.value.copy(cp).divideScalar(D);
  const low = 1 - smooth(10, 70, alt); skyU.uLow.value = low; skyU.uDark.value = dk;
  stars.material.opacity = clamp((0.62 - low) * 2.2, 0, 1); stars.visible = stars.material.opacity > 0.01;
  atmo.material.uniforms.uA.value = smooth(3, 24, alt) * (1 - dk * 0.6);
  limb.visible = alt > 4;
  const fk = 1 - smooth(5, 28, alt);
  if (fk > 0.001) { scene.fog.near = lerp(400, 24, fk); scene.fog.far = lerp(1000, 120, fk); } else { scene.fog.near = 1e4; scene.fog.far = 2e4; }
  scene.fog.color.copy(_k7fog).lerp(_k7col.setHex(0x0c1f16), dk);
  sunLight.intensity = 2.3 * (1 - 0.72 * dk); fillLight.intensity = 0.45 * (1 - 0.4 * dk);
  ambLight.intensity = 0.85 * (1 - 0.25 * dk); ambLight.color.copy(_k7amb).lerp(_k7col.setHex(0x3f8a5a), dk);
  cloudGroup.rotation.y += dt * 0.006; moonPivot.rotation.y += dt * 0.012; updateCloudFade(cp, CAM.look);
  for (const L of LODG) L.obj.visible = cp.distanceTo(L.c) < L.far;
}
function frame(now) {
  requestAnimationFrame(frame);
  const raw = Math.max(0, (now - _k7last) / 1000); _k7last = now; tick(Math.min(0.05, raw), raw);
}
function tick(dt, raw) {
  _k7T += dt; const t = _k7T;
  try {
    U.time.value = t;
    updateGoku(dt, t);
    for (const f of UPD) f(dt, t);
    updateEntities(dt, t);
    talkCheck(dt);
    updateCamera(dt, t);
    updateEnv(dt, t);
    PUFF.update(dt); GLOW.update(dt);
    GLOW.mat.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan((camera.fov * DEG) / 2));
    renderer.render(scene, camera);
    updateLabels(dt, t);
    drawSpeed(dt, t);
    if (MODE === 'fly' && GOKU && (_k7frame++ & 1) === 0) drawRadar(GOKU.dir, GOKU.fwd, t);
    perfCheck(raw);
  } catch (err) { if (_k7err++ < 3) { console.error(err); showErr(err); } }
}
function perfCheck(raw) {
  if (raw > 0.25) { PERF.acc = 0; PERF.n = 0; return; }
  if (PERF.warm > 0) { PERF.warm -= raw; return; }
  PERF.acc += raw; PERF.n++; if (PERF.acc < 2.5) return;
  const fps = PERF.n / PERF.acc, pr = renderer.getPixelRatio(); PERF.acc = 0; PERF.n = 0;
  if (fps < 40 && pr > 1.01) { renderer.setPixelRatio(Math.max(1, pr - 0.5)); onResize(); }
  else if (fps < 24 && pr > 0.76) { renderer.setPixelRatio(Math.max(0.75, pr - 0.25)); onResize(); }
}
function onResize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  const s = $('speed'); s.width = innerWidth; s.height = innerHeight; layoutPanels();
}
function showErr(err) {
  const msg = err && err.message ? String(err.message) : String(err), st = err && err.stack ? String(err.stack) : '';
  const m = st.includes(msg) ? st : msg + (st ? '\n' + st : '');
  if (window.__dbErr) window.__dbErr(m); else { const e = $('err'); e.style.display = 'block'; e.textContent = m; }
}
function clickAt(x, y) {
  const h = pickAt(x, y); if (!h) return;
  if (h.place) { gotoPlace(h.place); return; }
  if (MODE === 'orbit') followEnt(h.e);
  sayLine(h.e);
}
function setupInput() {
  const cv = renderer.domElement;
  addEventListener('keydown', (e) => {
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    KEYS[e.code] = true;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    const c = e.code;
    if (c === 'KeyG') setMode(MODE === 'fly' ? 'orbit' : 'fly');
    else if (c === 'KeyH') toggleHelp();
    else if (c === 'KeyT' && MODE === 'fly') cycleForm();
    else if (c === 'KeyN' && MODE === 'fly') toggleNimbus();
    else if (c === 'Escape') { if (CAM.follow || CAM.anim) { CAM.follow = null; CAM.anim = null; banner('FREE CAMERA', 1.2); } }
    else if (/^Digit[1-4]$/.test(c) && SHEN.phase === 'wish') chooseWish(+c.slice(5) - 1);
  });
  addEventListener('keyup', (e) => { KEYS[e.code] = false; });
  addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId); cv.focus(); PTR.pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); CAM.idle = 0;
    if (PTR.pts.size === 1) {
      PTR.drag = true; PTR.btn = e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey ? 1 : 0;
      PTR.x = e.clientX; PTR.y = e.clientY; PTR.moved = 0; PTR.t0 = performance.now(); cv.classList.add('dragging');
    } else if (PTR.pts.size === 2) {
      PTR.drag = false; const [a, b] = [...PTR.pts.values()];
      PTR.pd = Math.hypot(b.x - a.x, b.y - a.y); PTR.pa = Math.atan2(b.y - a.y, b.x - a.x); PTR.py = (a.y + b.y) / 2; PTR.moved = 99;
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const P = PTR.pts.get(e.pointerId); if (!P) return; P.x = e.clientX; P.y = e.clientY;
    if (PTR.pts.size === 2) {
      const [a, b] = [...PTR.pts.values()], d = Math.hypot(b.x - a.x, b.y - a.y), an = Math.atan2(b.y - a.y, b.x - a.x), my = (a.y + b.y) / 2;
      if (PTR.pd > 0) { const f = PTR.pd / Math.max(1, d); if (MODE === 'fly') CAM.fdist = clamp(CAM.fdist * f, 0.9, 14); else zoomOrbit(f); }
      if (MODE !== 'fly') { turnAround(CAM.d, CAM.fw, angDiff(an, PTR.pa)); rotOrbit(0, my - PTR.py); }
      PTR.pd = d; PTR.pa = an; PTR.py = my; return;
    }
    if (!PTR.drag) return;
    const dx = e.clientX - PTR.x, dy = e.clientY - PTR.y; PTR.x = e.clientX; PTR.y = e.clientY; PTR.moved += Math.abs(dx) + Math.abs(dy);
    if (PTR.moved < 4) return;
    if (MODE === 'fly' || SHEN.cam) { CAM.fyaw -= dx * 0.006; CAM.fpitch = clamp(CAM.fpitch + dy * 0.005, -0.45, 1.25); }
    else if (PTR.btn === 1 || CAM.follow) rotOrbit(dx, dy); else panOrbit(dx, dy);
  });
  const up = (e) => {
    if (!PTR.pts.has(e.pointerId)) return; PTR.pts.delete(e.pointerId);
    if (PTR.pts.size === 0) { if (PTR.drag && PTR.moved < 6 && performance.now() - PTR.t0 < 450) clickAt(e.clientX, e.clientY); PTR.drag = false; cv.classList.remove('dragging'); }
    else if (PTR.pts.size === 1) { const [a] = [...PTR.pts.values()]; PTR.drag = true; PTR.btn = 0; PTR.x = a.x; PTR.y = a.y; }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault(); const f = Math.exp(clamp(e.deltaY * (e.deltaMode === 1 ? 33 : 1), -300, 300) * 0.0012);
    if (MODE === 'fly' || SHEN.cam) CAM.fdist = clamp(CAM.fdist * f, 0.9, 14); else zoomOrbit(f, e.clientX, e.clientY);
  }, { passive: false });
  cv.addEventListener('dblclick', (e) => { if (MODE !== 'orbit') return; const h = pickGround(e.clientX, e.clientY); if (h) flyTo(h.dir, clamp(CAM.range * 0.35, 3, 14)); });
  $('bOrbit').onclick = (ev) => { ev.currentTarget.blur(); setMode('orbit'); };
  $('bFly').onclick = (ev) => { ev.currentTarget.blur(); setMode('fly'); };
  $('helpToggle').onclick = toggleHelp;
  addEventListener('resize', onResize);
}
async function init() {
  window.__dbAlive = true;
  { const er = $('err'); if (er && er.dataset.late) { er.style.display = 'none'; delete er.dataset.shown; delete er.dataset.late; $('loading').style.display = 'flex'; } }
  // rAF lets the loading text paint between steps; hidden tabs yield via MessageChannel (not timer-throttled)
  const mcYield = (fn) => { const mc = new MessageChannel(); mc.port1.onmessage = () => { mc.port1.close(); fn(); }; mc.port2.postMessage(0); };
  const nextFrame = () => new Promise((r) => { let done = false; const go = () => { if (!done) { done = true; mcYield(r); } }; requestAnimationFrame(go); if (document.hidden) mcYield(go); else setTimeout(go, 120); });
  const steps = [
    ['sculpting the planet', () => { buildTerrain(); buildWater(); }],
    ['painting the sky', () => { buildSky(); buildMoon(); buildClouds(); buildParticles(); }],
    ['building West City', () => { buildTreeGeos(); buildCity(); }],
    ['raising landmarks', () => { buildKameHouse(); buildKorin(); buildGokuHouse(); buildBuuHouse(); buildTournament(); buildCellArena(); buildPods(); buildFriezaShip(); }],
    ['growing forests & rocks', () => { buildRocks(); buildScatter(); }],
    ['waking up the Z-fighters', () => { buildCast(); }],
    ['fueling the air cars', () => { buildVehicles(); }],
    ['hiding the Dragon Balls', () => { buildBalls(); buildShenron(); buildGoku(); }],
    ['final touches', () => { buildLabels(); buildTour(); renderHelp(); setupInput(); radarCtx();
      if (innerWidth < 760 || innerHeight < 560) { $('help').classList.add('min'); $('tour').classList.add('min'); $('tour').firstChild.textContent = '★ WORLD TOUR ▸'; }
      onResize(); }],
  ];
  for (const [msg, fn] of steps) { $('loadSub').textContent = msg + '…'; await nextFrame(); fn(); }
  fillLight.position.copy(SUN_DIR).multiplyScalar(-300).add(V().set(0, 120, 0));
  const portrait = innerWidth < innerHeight;
  CAM.range = portrait ? 260 : 240; flyTo(dirLL(20, 14), portrait ? 200 : 112, 0, null, 3.6);
  updateCamera(0.016, 0); updateEnv(0, 0);
  $('loadSub').textContent = 'compiling shaders…'; await nextFrame();
  try { renderer.compile(scene, camera); } catch (e) { console.warn(e); }
  const L = $('loading'); L.style.transition = 'opacity .7s'; L.style.opacity = '0'; setTimeout(() => (L.style.display = 'none'), 750);
  banner('WELCOME TO THE DRAGON WORLD! ★ Press G (or ☁️) to fly with Goku', 5);
  _k7last = performance.now(); requestAnimationFrame(frame);
}
init().catch(showErr);
