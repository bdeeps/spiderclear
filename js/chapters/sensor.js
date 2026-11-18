// Chapter 4: the web as an ear. A spider on an orb web feels the world through vibrations carried along the
// threads and sensed by slit-shaped strain detectors (lyriform organs) near the joints of her legs
// (Barth 2002; Mortimer et al. 2016, J R Soc Interface; Landolfa & Barth 1996 on vibrations in orb webs).
// She can also tune the web: tighter threads carry vibrations faster and at higher pitch.
// The waves below are a cartoon: a travelling pulse of out-of-plane movement along the web, whose speed rises
// with the square root of tension (like any stretched string), and which fades with distance. It does not
// model the real sound speeds of silk, which differ for waves along and across a thread.
import { THREE, M } from '../kit.js';
import { makeSpider, SilkSet, orbWeb, V, COL, clamp, lerp, smooth } from '../spider.js';

const R = 3;
const WHERE = { a: { n: 'Top left', p: [-1.6, 1.5] }, b: { n: 'Right', p: [2.0, 0.2] }, c: { n: 'Bottom', p: [0.3, -2.1] } };
const EVENTS = {
  fly: { n: 'A fly lands', k: 5, w: 0.7, dur: 1.2, run: true, say: 'A short, sharp knock, then buzzing. She runs straight to it.', pulses: [0] },
  struggle: { n: 'It struggles', k: 9, w: 0.5, dur: 3, run: true, say: 'Fast, repeating vibration: the prey is alive and caught. This is the signal to bite and wrap.', pulses: [0, 0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45] },
  leaf: { n: 'A leaf falls', k: 3, w: 1.2, dur: 1.2, run: false, say: 'A single low bump, and nothing struggles. Not food, so she stays put.', pulses: [0] },
  pluck: { n: 'A mate plucks', k: 6, w: 0.6, dur: 3.5, run: false, say: 'In many species a male plucks the female’s web in a slow pattern that prey never makes.', pulses: [0, 0.8, 1.6, 2.4] },
  wind: { n: 'A gust', k: 1.6, w: 2.5, dur: 2.5, run: false, say: 'A broad, slow sway over the whole web. She learns to ignore it.', pulses: [0] },
};

export default {
  id: 'sensor',
  short: 'A web you can feel',
  title: 'The web is an ear',
  subtitle: 'A spider listens to her web with her legs, and tunes it like a string.',
  view: { pos: [0, 3.3, 12.5], target: [0, 3.1, 0] },
  learn: `<p>Most orb weavers have poor eyesight. Many hunt at dusk or at night, or wait at the hub with their legs on the threads. The web is her <b>ear</b> as well as her trap. A knock on any thread sends a <b>vibration</b> along the radii to the hub, and she feels it with <b>slit sensors</b> next to the joints of her legs.</p>
    <p>Each kind of event has its own signature. A landing fly is a short knock. A struggling fly is a fast, repeating buzz. A leaf is a single low bump. Some males pluck a courtship pattern on the female’s web, and a gust sways everything slowly. By comparing which legs feel it first she can tell <b>where</b>, and by its pattern she can tell <b>what</b>.</p>
    <p>She also <b>tunes</b> the web. A tighter web carries vibrations faster and at a higher pitch, and she can adjust the tension by pulling threads with her legs. Radii are stiff and carry signals well. The sticky spiral is stretchy and damps them, which also helps it soak up the energy of the prey.</p>
    <p class="tip"><b>Try it:</b> press an event, pick where it happens, and change the <b>tension</b>. Watch the ripple, the spider turning, and the time the signal takes to reach the hub.</p>
    <p class="note">This is a simplified wave picture. Real silk carries several kinds of wave at very different speeds.</p>`,
  terms: [
    { t: 'Lyriform organ', d: 'A cluster of tiny slits in a spider’s leg exoskeleton that sense strain, and so detect vibration.' },
    { t: 'Vibration signature', d: 'The pattern in time of a vibration. It tells prey, a mate and wind apart.' },
    { t: 'Tension', d: 'How tight the threads are pulled. More tension carries a vibration faster and at a higher pitch.' },
  ],
  defaults: { tension: 1, where: 'a' },
  controls: [
    { key: 'ev', type: 'buttons', label: 'Make something happen', items: Object.entries(EVENTS).map(([id, e]) => ({ label: e.n, act: (s, inst) => inst.fire(id) })) },
    { key: 'where', type: 'seg', label: 'Where', options: Object.entries(WHERE).map(([v, w]) => ({ v, label: w.n })) },
    { key: 'tension', type: 'range', label: 'Web tension', min: 0.3, max: 2, step: 0.01, fmt: (v) => (v < 0.7 ? 'Slack' : v < 1.4 ? 'Normal' : 'Tight') },
  ],
  quiz: [
    { q: 'How does an orb weaver feel what is happening in the web?', options: ['With her eyes alone', 'With slit sensors in her legs that sense vibration', 'With her antennae', 'She cannot'], answer: 1, why: 'Slit-shaped strain sensors near the leg joints pick up the vibrations carried along the threads.' },
    { q: 'What does a tighter web do to vibrations?', options: ['Slows them down', 'Carries them faster', 'Stops them', 'Nothing'], answer: 1, why: 'As on a guitar string, more tension means faster waves and a higher pitch.' },
    { q: 'How can she tell a struggling fly from a falling leaf?', options: ['By smell', 'By the pattern of the vibration', 'By its colour', 'She cannot'], answer: 1, why: 'A struggling fly makes a fast repeating buzz; a leaf gives one low bump.' },
  ],
  reel: [
    { ms: 5400, caption: 'The web is an ear. A fly lands and the whole web carries the news.', set: { tension: 1, where: 'b' }, act: (s, inst) => inst.fire('fly'), view: { pos: [0.5, 3.3, 11], target: [0, 3.1, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); root.position.y = 3.2; stage.root.add(root);
    const W = orbWeb({ R, radii: 24, turns: 14, aux: 5, seed: 3 });
    const frameSegs = W.frame.map(([a, b]) => [a.clone(), b.clone()]);
    const mk = (segs, o) => { const set = new SilkSet(stage, segs, o); root.add(set.obj); return set; };
    const sets = [mk(frameSegs, { width: 2.2 }), mk(W.radiusSegs, { width: 1.8 }), mk(W.capSegs, { width: 1.1, opacity: 0.8 })];
    const spiderPivot = new THREE.Group(), tilt = new THREE.Group(), spider = makeSpider(0.8, { color: 0x8a6a42 });
    tilt.rotation.x = Math.PI / 2; tilt.add(spider); spiderPivot.add(tilt); root.add(spiderPivot);
    spiderPivot.position.copy(W.hub).z += 0.1;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 40), M.glow(0xffb547, { side: THREE.DoubleSide })); ring.visible = false; root.add(ring);
    const lbl = stage.label('', [0, 0, 0], root, 'hot'); lbl.visible = false;
    const sp = V(W.hub.x, W.hub.y, 0);
    let tt = 0, ev = null, clock = 0, runK = 0, heading = -Math.PI / 2, arrival = 0, loud = 0;
    const hub = W.hub;
    const loudest = (ix, iy) => { const a = Math.atan2(iy - hub.y, ix - hub.x); let best = 0, bd = 9; W.ends.forEach((e, j) => { const d = Math.abs(Math.atan2(Math.sin(Math.atan2(e.y - hub.y, e.x - hub.x) - a), Math.cos(Math.atan2(e.y - hub.y, e.x - hub.x) - a))); if (d < bd) { bd = d; best = j; } }); return best; };
    const speed = (st) => 3.2 * Math.sqrt(st.tension);

    return {
      fire(type) {
        const [ix, iy] = WHERE[s.where].p; const E = EVENTS[type];
        const src = type === 'wind' ? [0, 0] : [ix, iy];
        ev = { type, E, ix: src[0], iy: src[1] + hub.y * 0, t0: tt };
        arrival = Math.hypot(src[0] - hub.x, src[1] - hub.y) / speed(s); loud = loudest(src[0], src[1]); runK = 0;
        lbl.element.textContent = E.n; lbl.position.set(src[0], src[1] + 0.35, 0.2); lbl.visible = true;
      },
      update(dt, st) {
        tt += dt; clock += dt;
        const c = speed(st);
        let disp = null;
        if (ev) {
          const age = tt - ev.t0, E = ev.E, kk = E.k * Math.sqrt(st.tension), amp = 0.5;
          if (age > E.dur + 2.2) { ev = null; ring.visible = false; lbl.visible = false; }
          else {
            ring.visible = true; ring.position.set(ev.ix, ev.iy, 0.15); ring.scale.setScalar(1 + Math.sin(age * 12) * 0.2);
            disp = (x, y) => {
              const d = Math.hypot(x - ev.ix, y - ev.iy); let z = 0;
              for (const tp of E.pulses) {
                const a = age - tp; if (a < 0) continue;
                const u = d - c * a, env = Math.exp(-((u / E.w) ** 2)), fade = Math.exp(-d * 0.22) * (ev.type === 'wind' ? 1 : 1);
                z += amp * fade * env * Math.cos(kk * u) * (ev.type === 'wind' ? 0.8 : 1);
              }
              return z;
            };
          }
        }
        sets.forEach((set) => set.set(() => 1, disp));
        // spider: turn toward the source once the signal arrives, then run to it if it is prey
        let target = hub, face = null;
        if (ev && tt - ev.t0 > arrival) {
          face = Math.atan2(ev.iy - hub.y, ev.ix - hub.x);
          if (ev.E.run && tt - ev.t0 > arrival + 0.25) target = V(ev.ix - Math.cos(face) * 0.4, ev.iy - Math.sin(face) * 0.4, 0);
        }
        const dx = target.x - sp.x, dy = target.y - sp.y, dist = Math.hypot(dx, dy);
        const moving = dist > 0.05 ? 1 : 0;
        if (moving) { const stp = Math.min(dist, dt * 2.6); sp.x += (dx / dist) * stp; sp.y += (dy / dist) * stp; heading = Math.atan2(dy, dx); }
        else if (face !== null) heading = face;
        spiderPivot.position.set(sp.x, sp.y, 0.1 + (disp ? disp(sp.x, sp.y) : 0)); spiderPivot.rotation.z = heading;
        spider.pose(clock, moving, 0.4);
      },
      readout(st) {
        if (!ev) return `<div class="big">Waiting at the hub</div><p class="r-say">Press an event to send a vibration through the web.</p><div class="row"><span>Signal speed</span><b>${(speed(st) / 3.2).toFixed(2)}× normal</b></div>`;
        return `<div class="big">${ev.E.n}</div><p class="r-say">${ev.E.say}</p>
          <div class="row"><span>Reaches the hub after</span><b>${(arrival * 1000).toFixed(0)} ms (model)</b></div>
          <div class="row"><span>Loudest on radius</span><b>#${loud + 1} of ${W.radii}</b></div>`;
      },
    };
  },
};
