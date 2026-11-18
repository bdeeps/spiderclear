// Chapter 2: the orb web, built in the order the spider builds it. Sequence from the orb-weaver literature
// (e.g. Zschokke & Vollrath 1995; Eberhard 1990): exploration, bridge thread and "Y", frame and first radii,
// the remaining radii and the hub, the temporary (auxiliary) spiral laid from the inside out, and last
// the sticky capture spiral laid from the outside in, cutting down the temporary spiral as it goes.
import { THREE, M, beam, arrow } from '../kit.js';
import { makeSpider, SilkSet, orbWeb, droplets, V, COL, clamp, lerp, smooth } from '../spider.js';

const R = 3, SCALE_M = 0.05;   // 1 scene unit = 5 cm in this model (a web about 15 cm in radius)
const STAGES = [
  { id: 'bridge', name: '1 · Bridge thread', at: 0, to: 0.1, say: 'The spider lets out a line and the wind carries it across. When the free end sticks, she reels it tight and strengthens it. This bridge is the first anchor of everything.' },
  { id: 'y', name: '2 · The Y', at: 0.1, to: 0.2, say: 'She walks to the middle of the bridge and drops a new thread down. Pulling it tight makes a Y. Where the arms meet will be the hub.' },
  { id: 'frame', name: '3 · Frame', at: 0.2, to: 0.3, say: 'More threads join the bridge to nearby twigs and leaves and close the outline. It is the web’s frame, and it only has to be strong, not sticky.' },
  { id: 'radii', name: '4 · Radii', at: 0.3, to: 0.5, say: 'Radii run out from the hub like spokes. She builds a few first, then fills in the gaps, going back to the hub each time.' },
  { id: 'aux', name: '5 · Hub and scaffold', at: 0.5, to: 0.68, say: 'She winds a small hub, then spirals outward with dry, non-sticky silk. This temporary spiral holds the radii in place, like scaffolding.' },
  { id: 'capture', name: '6 · Sticky spiral', at: 0.68, to: 1, say: 'Now she works from the outside in, laying thread coated with glue droplets. Each time she crosses the scaffold she cuts it away. It has done its job.' },
];
const stageOf = (p) => STAGES.findLast((st) => p >= st.at) || STAGES[0];
const WIND_CATCH = 0.2;

export default {
  id: 'build',
  short: 'Building the web',
  title: 'The web, thread by thread',
  subtitle: 'Six steps, always in the same order, in about an hour.',
  view: { pos: [0, 3.6, 12.5], target: [0, 3.1, 0] },
  learn: `<p>An orb web looks like a puzzle, but the spider follows one recipe with no plan and no tools. She measures with her legs, remembers where her own earlier threads run, and works in <b>six steps</b>.</p>
    <p><b>1–2. Bridge and Y.</b> A spider that cannot jump or fly gets a thread across a gap by <b>letting the wind do it</b>. She releases silk from her spinnerets and a breeze carries the free end until it sticks to something. <b>3–4. Frame and radii.</b> The outline and the spokes are made of strong, dry dragline silk. <b>5. Scaffold.</b> A loose temporary spiral keeps the spokes where she wants them. <b>6. Capture spiral.</b> Only now does she lay the stretchy, glue-coated thread that catches prey, from the outside inward.</p>
    <p class="tip"><b>Try it:</b> press <b>Play</b>, or drag <b>Build</b> to scrub through the web. Set <b>Wind</b> to zero and watch step 1 fail. Then change the number of radii and spiral turns: real spiders adjust both to the site and to how much silk they have.</p>
    <p class="note">The model has the right order and shape. Real webs differ by species and by night: an orb web usually takes from about half an hour to an hour or so, and many orb weavers rebuild every day or so.</p>`,
  terms: [
    { t: 'Bridge thread', d: 'The first thread across a gap, carried by the wind. Every other thread depends on it.' },
    { t: 'Radii', d: 'The spokes of the wheel. They are stiff dragline silk and carry the spider and the vibrations.' },
    { t: 'Auxiliary spiral', d: 'A temporary, non-sticky spiral, laid from the hub outward, that holds the radii in place while the sticky spiral is built.' },
    { t: 'Capture spiral', d: 'The sticky thread that catches prey. It is laid from the outside in and is coated with glue droplets.' },
  ],
  defaults: { p: 0.4, playing: false, wind: 0.6, radii: 26, turns: 22 },
  controls: [
    { key: 'step', type: 'buttons', label: 'Jump to step', items: STAGES.map((st) => ({ label: st.name.replace(' · ', ' '), act: (s) => { s.p = st.at + 0.001; s.playing = false; } })) },
    { key: 'p', type: 'range', label: 'Build', min: 0, max: 1, step: 0.002, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'playing', type: 'toggle', label: 'Play' },
    { key: 'wind', type: 'range', label: 'Wind for the bridge', min: 0, max: 1, step: 0.01, fmt: (v) => (v < WIND_CATCH ? 'Calm' : v < 0.55 ? 'Light breeze' : 'Breeze'), hint: 'The bridge only works if there is air to carry the thread.' },
    { key: 'radii', type: 'range', label: 'Radii', min: 12, max: 36, step: 1, fmt: (v) => `${v}` },
    { key: 'turns', type: 'range', label: 'Sticky spiral turns', min: 10, max: 40, step: 1, fmt: (v) => `${v}` },
  ],
  quiz: [
    { q: 'How does the spider get the first thread across a gap she cannot jump?', options: ['She throws it', 'She lets the wind carry a line', 'She climbs round every time', 'She spins it in the air from both sides'], answer: 1, why: 'She releases silk and a breeze carries the free end to a new anchor. It is the bridge thread.' },
    { q: 'Which part of the web is laid last?', options: ['The frame', 'The radii', 'The sticky capture spiral', 'The hub'], answer: 2, why: 'The glue-coated spiral comes last, from the outside in. The frame, radii and scaffold are all dry silk.' },
    { q: 'What does the temporary spiral do?', options: ['Catches the first insects', 'Holds the radii in place while she builds', 'Stores food', 'Warns of birds'], answer: 1, why: 'It is scaffolding. She cuts it away as she lays the sticky spiral over it.' },
  ],
  reel: [
    { ms: 5200, caption: 'A spider builds an orb web in the same six steps every time.', set: { p: 0.0, playing: false, wind: 0.7 }, view: { pos: [0, 3.4, 10.5], target: [0, 3.1, 0] }, anim: { p: [0, 0.68] }, spin: 0 },
    { ms: 5600, caption: 'Last, sticky thread from the outside in, cutting the scaffold away.', set: { p: 0.68, playing: false }, view: { pos: [1.5, 3.2, 8], target: [0, 3.1, 0] }, anim: { p: [0.68, 1] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); root.position.y = 3.2; stage.root.add(root);
    let W, parts, drops, cacheKey = '', lastHead = V(0, 0, 0), heading = -Math.PI / 2;
    const spiderPivot = new THREE.Group(), spiderTilt = new THREE.Group(), spider = makeSpider(0.8, { color: 0x8a6a42 });
    spiderTilt.rotation.x = Math.PI / 2; spiderTilt.add(spider); spiderPivot.add(spiderTilt);
    root.add(spiderPivot);
    const windArrow = arrow(0x8ef0ff, 1, 0.3, 0.03); windArrow.position.set(-3.6, 5.2, 0); windArrow.rotation.z = -Math.PI / 2; root.add(windArrow);
    const windLbl = stage.label('Wind', [-3.1, 5.55, 0], root, '');
    const twigGroup = new THREE.Group(); root.add(twigGroup);

    const mk = (segs, o) => { const set = new SilkSet(stage, segs, o); root.add(set.obj); return set; };
    const bridgeSegs = Array.from({ length: 18 }, () => [V(0, 0, 0), V(0, 0, 0)]);
    const bridge = mk(bridgeSegs, { color: COL.cyan, width: 2.4 });
    const ySegs = [[V(0, 0, 0), V(0, 0, 0)], [V(0, 0, 0), V(0, 0, 0)], [V(0, 0, 0), V(0, 0, 0)]];
    const yset = mk(ySegs, { color: COL.silk, width: 2.4 });

    function rebuild() {
      [parts?.frame, parts?.radii, parts?.hub, parts?.aux, parts?.cap].forEach((x) => { if (x) { root.remove(x.obj); x.geo.dispose(); x.mat.dispose(); } });
      if (drops) { root.remove(drops); drops.geometry.dispose(); drops.material.dispose(); }
      twigGroup.clear();
      W = orbWeb({ R, radii: s.radii, turns: s.turns, aux: 5, seed: 11 });
      const frameSegs = W.frame.slice(1).map(([a, b]) => [a.clone(), b.clone()]);
      const rad = W.order.map((j) => W.radiusSegs[j]);
      parts = {
        frame: mk(frameSegs, { color: COL.silk, width: 2.2 }),
        radii: mk(rad, { color: COL.silk, width: 1.7 }),
        hub: mk(W.hubSegs, { color: COL.silk, width: 1.4 }),
        aux: mk(W.auxSegs, { color: COL.silkDim, width: 1.1, opacity: 0.85 }),
        cap: mk(W.capSegs, { color: COL.silk, width: 1.3, opacity: 0.95 }),
        frameSegs,
      };
      drops = droplets(stage, W.capSegs, 3, 0.026); root.add(drops);
      W.anchors.forEach((a) => {
        const out = a.clone().sub(W.hub).setZ(0).normalize().multiplyScalar(0.7);
        const br = beam([a.x, a.y, a.z], [a.x + out.x, a.y + out.y - 0.1, a.z], 0.07, M.matte(0x4a3726)); twigGroup.add(br);
        const nub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M.matte(0x5b4531)); nub.position.copy(a); twigGroup.add(nub);
      });
      let len = 0; W.capSegs.forEach(([a, b]) => { len += a.distanceTo(b); }); W.capLenM = len * SCALE_M;
    }

    function bridgeCurve(prog, wind) {
      const a = W.anchors[0], b = W.anchors[1];
      const caught = wind >= WIND_CATCH;
      const reach = caught ? prog : Math.min(prog, 0.5) * 0.9;
      const end = a.clone().lerp(b, reach);
      for (let i = 0; i < bridgeSegs.length; i++) {
        for (const [slot, u] of [[0, i / bridgeSegs.length], [1, (i + 1) / bridgeSegs.length]]) {
          const q = a.clone().lerp(end, u), arc = Math.sin(Math.PI * u);
          const slack = caught ? (1 - prog) : 1;
          q.y += -arc * (0.1 + (1 - wind) * 1.4) * (caught ? 0.35 + 0.65 * slack : 1) * (caught && prog >= 1 ? 0.12 : 1);
          q.z += arc * 0.8 * wind * (caught ? slack : 1) + (1 - u) * 0;
          bridgeSegs[i][slot].copy(q);
        }
      }
      bridge.set(() => 1);
      return end;
    }

    function place(head, moving, hang = 0.5) {
      const d = head.clone().sub(lastHead);
      if (d.lengthSq() > 1e-6) heading = Math.atan2(d.y, d.x);
      lastHead.copy(head);
      spiderPivot.position.copy(head); spiderPivot.rotation.z = heading;
      spider.pose(clock, moving, hang);
    }
    let clock = 0, lastP = -1, lastWind = -1, capP = -1, dropScale = 1;
    function draw() {
      const p = s.p, st = stageOf(p), local = clamp((p - st.at) / (st.to - st.at), 0, 1);
      const sd = p >= 0.68 ? 1 : 0;
      // stage 1 and 2 visuals
      const showBridge = p < 0.1 + 0.0001;
      bridge.visible = showBridge; yset.visible = p >= 0.1;
      let head = W.hub.clone();
      const a0 = W.anchors[0], a1 = W.anchors[1], a3 = W.anchors[3];
      const mid = a0.clone().lerp(a1, 0.5); mid.y -= 0.12;
      if (p < 0.1) { head = bridgeCurve(local, s.wind); }
      else {
        const kY = p < 0.2 ? smooth(local) : 1;
        const J = mid.clone().lerp(W.hub, kY);
        ySegs[0][0].copy(a0); ySegs[0][1].copy(J);
        ySegs[1][0].copy(a1); ySegs[1][1].copy(J);
        ySegs[2][0].copy(J); ySegs[2][1].copy(J).lerp(a3, p < 0.2 ? smooth(clamp(local * 1.6 - 0.2, 0, 1)) : 1);
        yset.set(() => 1);
        head = p < 0.2 ? (local < 0.5 ? mid.clone().add(V(0, -local * 1.2, 0)) : J.clone().lerp(a3, smooth((local - 0.5) * 2) * 0.9)) : W.hub.clone();
      }
      parts.frame.grow(p < 0.2 ? 0 : p >= 0.3 ? 1 : local);
      if (p >= 0.2 && p < 0.3) { const seg = Math.min(parts.frameSegs.length - 1, Math.floor(local * parts.frameSegs.length)); const [a, b] = parts.frameSegs[seg]; head = a.clone().lerp(b, local * parts.frameSegs.length - seg); }
      const nRad = W.order.length;
      parts.radii.grow(p < 0.3 ? 0 : p >= 0.5 ? 1 : local);
      if (p >= 0.3 && p < 0.5) { const k = Math.min(nRad - 1, Math.floor(local * nRad)), f = local * nRad - k, e = W.radiusSegs[W.order[k]][1]; head = W.hub.clone().lerp(e, f < 0.5 ? f * 2 : 2 - f * 2); }
      const hubN = W.hubSegs.length, auxN = W.auxSegs.length;
      const lh = p < 0.5 ? 0 : p >= 0.68 ? 1 : local;
      parts.hub.grow(clamp(lh * 1.0 * (1 + auxN / hubN * 0.0) * 6, 0, 1));
      if (p >= 0.5 && p < 0.68) { const q = clamp((local - 0.15) / 0.85, 0, 1), k = Math.min(auxN - 1, Math.floor(q * auxN)); const [a, b] = W.auxSegs[k]; head = local < 0.15 ? W.hub.clone() : a.clone().lerp(b, q * auxN - k); }
      const cp = p < 0.68 ? 0 : (p - 0.68) / 0.32, capN = W.capSegs.length;
      parts.cap.grow(cp);
      const keep = 1 - cp;
      if (p >= 0.68) parts.aux.set((k) => (k / auxN < keep ? 1 : 0)); else parts.aux.grow(p < 0.5 ? 0 : clamp((local - 0.15) / 0.85, 0, 1));
      drops.update((k) => cp * capN - k, dropScale);
      if (p >= 0.68 && p < 1) { const k = Math.min(capN - 1, Math.floor(cp * capN)); const [a, b] = W.capSegs[k]; head = a.clone().lerp(b, cp * capN - k); }
      if (p >= 1) head = W.hub.clone().add(V(0, 0.05, 0.1));
      if (p >= 1) heading = -Math.PI / 2;
      const moving = s.playing || Math.abs(p - lastP) > 1e-5 ? 1 : 0;
      place(head, p >= 1 ? 0 : moving, p >= 1 ? 0.2 : 0.5);
      if (p >= 1) { spiderPivot.rotation.z = -Math.PI / 2; }
      lastP = p;
    }

    rebuild();
    return {
      update(dt, st) {
        clock += dt;
        if (st.playing) { st.p = Math.min(1, st.p + dt / 26); if (st.p >= 1) st.playing = false; }
        const key = `${st.radii}|${st.turns}`;
        if (key !== cacheKey) { cacheKey = key; rebuild(); lastP = -1; }
        windArrow.set(0.3 + st.wind * 1.8); windArrow.visible = st.p < 0.1 && st.wind > 0.02; windLbl.visible = windArrow.visible;
        draw();
      },
      readout(st) {
        const stg = stageOf(st.p);
        const fail = stg.id === 'bridge' && st.wind < WIND_CATCH;
        return `<div class="big">${stg.name}</div><p class="r-say">${fail ? 'No wind, so the thread droops and never reaches. She will have to walk round or try again.' : stg.say}</p>
          <div class="row"><span>Radii</span><b>${st.radii}</b></div>
          <div class="row"><span>Sticky thread in this web</span><b>about ${(W.capLenM).toFixed(0)} m</b></div>`;
      },
      dispose() {},
    };
  },
};
