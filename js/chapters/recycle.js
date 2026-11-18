// Chapter 6: eat it, rest, build it again; rain and dew. Many orb weavers take their web down and eat it, often
// each day, and use the protein to make new silk. Tracer studies (Peakall 1971; re-examined by Townley &
// Tillinghast 1988, J Arachnol 16:303) found that much of the eaten silk protein is re-used. Glue droplets
// are hygroscopic and their stickiness depends on humidity (Opell et al.; Sahni et al. 2012 Nature
// Communications). Dew and rain bead on the silk; Zheng et al. 2010 (Nature 463:640) showed that wet
// cribellate silk with spindle-knots collects water in a particular direction.
import { THREE, M } from '../kit.js';
import { makeSpider, SilkSet, orbWeb, droplets, V, COL, clamp, lerp, smooth } from '../spider.js';

const R = 3;

export default {
  id: 'recycle',
  short: 'Recycle, rain and dew',
  title: 'Eat the web, build it again',
  subtitle: 'Silk is expensive protein, so the spider eats her old web and makes new silk from it.',
  view: { pos: [0, 3.5, 12.5], target: [0, 3.1, 0] },
  learn: `<p>Silk is made of protein, and protein is costly to make. An orb web is also worn out within a day: dust and prey and weather make it less sticky and tear holes. So many orb weavers <b>eat the old web</b>, often in the evening or morning, and then build a new one. The old silk is <b>digested</b> and its amino acids go back to the silk glands. Tracer studies with labelled protein found that much of it is re-used.</p>
    <p>The sticky glue is also a salty, <b>water-attracting</b> mix. When the air is humid, the droplets take up water and swell. That keeps them runny enough to stick, but too wet and they lose grip. <b>Dew</b> beads on the whole web, and a light <b>rain</b> only makes it flex. A strong storm can still tear it, and the spider rebuilds.</p>
    <p class="tip"><b>Try it:</b> drag <b>Day cycle</b> to watch the web being eaten and rebuilt. Raise <b>Humidity</b> to swell the droplets, and turn on <b>Rain</b>.</p>`,
  terms: [
    { t: 'Recycling', d: 'Eating the old web and using its protein to make new silk.' },
    { t: 'Hygroscopic', d: 'Attracting water from the air. The glue on the sticky spiral is hygroscopic.' },
    { t: 'Dew', d: 'Water that condenses from humid air on cool surfaces, including the silk.' },
  ],
  defaults: { cycle: 0, humidity: 0.6, rain: false, playing: false },
  controls: [
    { key: 'cycle', type: 'range', label: 'Day cycle', min: 0, max: 1, step: 0.002, fmt: (v) => (v < 0.04 ? 'Fresh web' : v < 0.5 ? 'Eating it' : v < 0.52 ? 'Empty' : v < 0.99 ? 'Rebuilding' : 'Fresh web') },
    { key: 'playing', type: 'toggle', label: 'Play the cycle' },
    { key: 'humidity', type: 'range', label: 'Humidity', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.35 ? 'Dry' : v < 0.7 ? 'Normal' : 'Dewy') },
    { key: 'rain', type: 'toggle', label: 'Rain' },
  ],
  quiz: [
    { q: 'Why does an orb weaver often eat her old web?', options: ['It tastes good', 'To recover silk protein for new silk', 'To clear the way for birds', 'To hide from predators'], answer: 1, why: 'Silk is costly protein. Eating the web lets her digest it and make new silk.' },
    { q: 'What does the sticky glue do when the air is humid?', options: ['Dries up', 'Takes up water and swells', 'Turns to wax', 'Falls off'], answer: 1, why: 'The glue contains water-attracting salts, so the droplets absorb water from the air.' },
    { q: 'What does light rain do to a healthy orb web?', options: ['Always destroys it', 'Beads on the silk and the web flexes', 'Makes it sticky', 'Nothing at all'], answer: 1, why: 'The threads are stretchy. Droplets bead on them and the web sways, but only strong storms tear it.' },
  ],
  reel: [
    { ms: 5600, caption: 'Each evening she eats her web and turns it into new silk.', set: { cycle: 0, humidity: 0.6, rain: false, playing: false }, anim: { cycle: [0, 0.85] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); root.position.y = 3.2; stage.root.add(root);
    const W = orbWeb({ R, radii: 24, turns: 20, aux: 5, seed: 21 });
    const mk = (segs, o) => { const x = new SilkSet(stage, segs, o); root.add(x.obj); return x; };
    const frameSegs = W.frame.map(([a, b]) => [a.clone(), b.clone()]);
    const frame = mk(frameSegs, { width: 2.2 }), rad = mk(W.radiusSegs, { width: 1.7 }), cap = mk(W.capSegs, { width: 1.2, opacity: 0.95 });
    const drops = droplets(stage, W.capSegs, 3, 0.022); root.add(drops);
    const sp = new THREE.Group(), tilt = new THREE.Group(), spider = makeSpider(0.8, { color: 0x8a6a42 });
    tilt.rotation.x = Math.PI / 2; tilt.add(spider); sp.add(tilt); root.add(sp);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), M.matte(0xe9eef8, { roughness: 1 })); root.add(ball);
    W.anchors.forEach((a) => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M.matte(0x5b4531)); n.position.copy(a); root.add(n); });
    const NR = 110, rain = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), M.glow(0x8ef0ff, { transparent: true, opacity: 0.55 }), NR);
    root.add(rain);
    const RP = Array.from({ length: NR }, (_, i) => ({ x: ((i * 37) % 100) / 100 * 9 - 4.5, y: ((i * 53) % 100) / 100 * 9, z: ((i * 17) % 10) / 10 * 2 - 1, v: 8 + (i % 5) }));
    const o = new THREE.Object3D(); let clock = 0, heading = -Math.PI / 2;
    const hubZ = V(W.hub.x, W.hub.y, 0.1); const last = V(W.hub.x, W.hub.y, 0);
    const state = (c) => { // → { cap fraction 0..1 (outer→inner), rad fraction, eaten 0..1, mode }
      if (c < 0.5) { const e = c / 0.5, q = clamp(e / 0.8, 0, 1), r = clamp((e - 0.8) / 0.2, 0, 1); return { cp: 1 - q, rp: 1 - r, eaten: e, mode: 'eat', q, r }; }
      const b = (c - 0.5) / 0.5, rp = clamp(b / 0.2, 0, 1), cp = clamp((b - 0.2) / 0.8, 0, 1); return { cp, rp, eaten: 0, mode: 'build', rbuilt: b };
    };
    return {
      update(dt, st) {
        clock += dt;
        if (st.playing) { st.cycle += dt / 24; if (st.cycle >= 1) { st.cycle = 1; st.playing = false; } }
        const S = state(st.cycle), capN = W.capSegs.length;
        let disp = null;
        if (st.rain) { const sw = Math.sin(clock * 3.1) * 0.06 + Math.sin(clock * 5.3) * 0.03; disp = (x, y) => sw * (1 - Math.min(1, Math.hypot(x, y) / (R * 1.3)) * 0.6) + Math.sin(clock * 9 + x * 3) * 0.015; }
        frame.set(() => 1, disp);
        let head = W.hub.clone();
        if (S.mode === 'eat') {
          const q = S.q, cutoff = q * capN;
          cap.set((k) => (k < cutoff ? 0 : 1), disp);
          drops.update((k) => (k < cutoff ? 0 : 1), 0.4 + st.humidity * 1.9, disp);
          rad.set(() => (S.r > 0 ? 1 - S.r : 1), disp);
          if (S.q < 1) { const k = Math.min(capN - 1, Math.floor(cutoff)); head = W.capSegs[k][0].clone(); } else { const j = Math.floor(S.r * 23.9); head = W.hub.clone().lerp(W.ends[j], 1 - S.r); }
          ball.scale.setScalar(0.12 + S.eaten * 0.9); ball.position.copy(head).add(V(0.2, 0.25, 0.25));
        } else {
          rad.set(() => 1, disp);
          rad.set((k) => (k / W.radii) < S.rp ? 1 : 0, disp);
          cap.grow(S.cp, disp);
          drops.update((k) => S.cp * capN - k, 0.4 + st.humidity * 1.9, disp);
          const k = Math.min(capN - 1, Math.floor(S.cp * capN)); head = S.cp <= 0 ? W.hub.clone() : S.cp >= 1 ? W.hub.clone() : W.capSegs[k][1].clone();
          ball.scale.setScalar(Math.max(0.001, 0.4 * (1 - S.cp)) * (st.cycle < 0.52 ? 1 : 0.0 + 1)); ball.position.copy(head).add(V(0.2, 0.25, 0.25)); ball.visible = S.cp < 0.9;
        }
        if (S.mode === 'eat') ball.visible = true;
        const d = head.clone().sub(last); if (d.lengthSq() > 1e-6) heading = Math.atan2(d.y, d.x); last.copy(head);
        sp.position.set(head.x, head.y, 0.15); sp.rotation.z = heading;
        spider.pose(clock, (S.mode === 'eat' ? S.eaten > 0 && S.eaten < 1 : S.cp > 0 && S.cp < 1) ? 1 : 0, 0.5);
        // rain
        rain.visible = st.rain;
        if (st.rain) {
          RP.forEach((p, i) => { p.y -= dt * p.v; if (p.y < -4) p.y = 5.5; o.position.set(p.x, p.y, p.z); o.rotation.z = 0.12; o.updateMatrix(); rain.setMatrixAt(i, o.matrix); });
          rain.instanceMatrix.needsUpdate = true;
        }
      },
      readout(st) {
        const S = state(st.cycle);
        const phase = S.mode === 'eat' ? (S.eaten < 1 ? 'Eating the old web' : 'Nothing left but the frame') : (S.cp >= 1 ? 'A fresh web' : S.cp > 0 ? 'Building again' : 'New silk in the glands');
        const hum = st.humidity < 0.35 ? 'Dry air: small droplets, glue stiff and tacky.' : st.humidity < 0.7 ? 'Normal air: droplets at their working size.' : 'Humid air: droplets swell with water, and dew beads on the web.';
        return `<div class="big">${phase}</div><p class="r-say">${hum}${st.rain ? ' Rain beads on the silk and the web sways.' : ''}</p>
          <div class="row"><span>Old web eaten</span><b>${S.mode === 'eat' ? Math.round(S.eaten * 100) : 100}%</b></div>`;
      },
    };
  },
};
