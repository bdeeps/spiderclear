// Chapter 5: not every web is a wheel, and not every spider spins a trap. Shapes after the standard families:
// orb weavers (Araneidae), sheet-web spiders (Linyphiidae), funnel-web weavers (Agelenidae), cobweb spiders
// (Theridiidae: gumfoot lines), bolas spiders (Mastophora, which swing a sticky ball and give off a scent that
// mimics a moth's; Eberhard 1977, Yeargan 1988) and ballooning spiderlings (Bell et al. 2005; Morley & Robert
// 2018, Current Biology, on electric fields). Species are examples; each family has many different webs.
import { THREE, M, beam } from '../kit.js';
import { makeSpider, SilkSet, orbWeb, droplets, V, rng, COL, clamp, lerp, smooth } from '../spider.js';

const KINDS = {
  orb: { n: 'Orb web', who: 'Orb weavers', say: 'The classic wheel, upright. A flat net that catches flying insects. Silk glue on a stretchy spiral.', where: 'Open air between plants', catches: 'Flying insects' },
  sheet: { n: 'Sheet web', who: 'Sheet-web spiders, such as money spiders', say: 'A fine hammock of silk with a maze of threads above. Insects bump into the maze and fall on to the sheet. The spider hangs upside down beneath and bites through it.', where: 'Grass and low plants', catches: 'Small flying and jumping insects' },
  funnel: { n: 'Funnel web', who: 'Funnel-web weavers (grass spiders)', say: 'A flat sheet of dry silk with a tube to hide in. The silk is not sticky. She feels prey run across it, dashes out and pulls it back inside.', where: 'Grass, hedges, crevices', catches: 'Walking and fallen insects' },
  cobweb: { n: 'Cobweb', who: 'Cobweb spiders, such as house spiders and widows', say: 'A tangle in three dimensions with sticky “gumfoot” lines running to the ground. When a beetle walking by touches one, it comes unstuck from the floor and the beetle is lifted into the air.', where: 'Corners, under ledges', catches: 'Walking insects' },
  bolas: { n: 'No web: bolas', who: 'Bolas spiders', say: 'No web at all. She hangs a single thread with a ball of glue on the end, and swings it at moths. A scent like a female moth’s attracts the males.', where: 'Branches at night', catches: 'Male moths' },
  balloon: { n: 'Ballooning', who: 'Spiderlings of many species', say: 'Young spiders climb up a stem, let out silk and are lifted into the air by wind or by the electric field of the atmosphere. Some travel for many kilometres.', where: 'Anywhere with a tall stem', catches: 'Not a trap: a way to travel' },
};

export default {
  id: 'kinds',
  short: 'Other webs',
  title: 'Not every web is a wheel',
  subtitle: 'The same silk, built into sheets, funnels, tangles, a swinging ball, and even a kite.',
  view: { pos: [0, 3.2, 9.5], target: [0, 1.8, 0] },
  learn: `<p>There are over fifty thousand known species of spider. Only some of them build <b>orb webs</b>. Others took the same silk and made quite different traps. <b>Sheet webs</b> are hammocks under a maze. <b>Funnel webs</b> are sheets of dry silk leading to a tube. <b>Cobwebs</b> are tangles with sticky lines to the floor.</p>
    <p>Many spiders spin no trap at all. <b>Jumping spiders</b> and <b>wolf spiders</b> hunt by sight and speed, and use silk only for a safety line and for egg sacs. A <b>bolas spider</b> swings a ball of glue on a thread. And young spiders of many species use silk as a <b>sail</b>, in a trip called <b>ballooning</b>.</p>
    <p class="tip"><b>Try it:</b> pick a kind of web, orbit around it, and compare where the spider waits, what the silk is for, and what it catches. For ballooning, raise the lift.</p>`,
  terms: [
    { t: 'Gumfoot line', d: 'A vertical thread in a cobweb, sticky at the bottom, that releases when touched and lifts the prey.' },
    { t: 'Cribellate silk', d: 'Dry, woolly silk made of thousands of very fine fibres. It catches insects without glue.' },
    { t: 'Ballooning', d: 'Travel by silk: a spiderling lets out threads that lift it into the air.' },
  ],
  defaults: { kind: 'orb', lift: 0.7 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Kind', options: Object.entries(KINDS).map(([v, k]) => ({ v, label: k.n })) },
    { key: 'lift', type: 'range', label: 'Lift (ballooning)', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.5 ? 'Stays' : 'Takes off'), hint: 'Only matters for the ballooning spiderling.' },
  ],
  quiz: [
    { q: 'What do funnel-web weavers’ sheets rely on?', options: ['Glue droplets', 'Feeling prey run across, then a fast dash', 'Electric fields', 'Poison'], answer: 1, why: 'The sheet is dry. The spider feels the vibration from her tube and dashes out.' },
    { q: 'What does a bolas spider swing?', options: ['A net', 'A ball of glue on a thread', 'A leaf', 'A second spider'], answer: 1, why: 'It swings a sticky ball at moths, helped by a scent that mimics a female moth.' },
    { q: 'What is ballooning?', options: ['Inflating the abdomen', 'Travelling on silk lifted by air', 'A courtship dance', 'A type of web'], answer: 1, why: 'A young spider lets out silk that lifts it into the air, so it can disperse.' },
  ],
  reel: [
    { ms: 4800, caption: 'Not every spider spins a wheel. Sheets, funnels and tangles catch different prey.', set: { kind: 'sheet' }, view: { pos: [3, 3.4, 7.5], target: [0, 1.4, 0] }, spin: 0.7 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const R = rng(9);
    const spiderG = new THREE.Group(), spider = makeSpider(0.5, { color: 0x8a6a42 }); spiderG.add(spider);
    let cur = '', set = null, extra = {}, clock = 0;
    const dispose = () => { while (root.children.length) { const o = root.children[0]; root.remove(o); o.traverse((q) => { if (q.isCSS2DObject) q.element.remove(); q.geometry?.dispose?.(); }); } set = null; extra = {}; };
    const floorMat = M.matte(0x1c1810);
    const ground = () => { const g = new THREE.Mesh(new THREE.CircleGeometry(6, 48), floorMat); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; root.add(g); };
    const silk = (segs, o) => { const x = new SilkSet(stage, segs, o); root.add(x.obj); return x; };
    const line = (a, b) => [V(...a), V(...b)];
    const place = (p, rotZ = 0, flip = false, hang = 0.5) => { spiderG.position.set(...p); spiderG.rotation.set(flip ? Math.PI : 0, 0, rotZ); spider.pose(0, 0, hang); root.add(spiderG); };

    function make(k) {
      dispose(); spiderG.scale.setScalar(1);
      if (k === 'orb') {
        const W = orbWeb({ R: 2.4, radii: 22, turns: 16, seed: 4 });
        const g = new THREE.Group(); g.position.y = 3; g.rotation.y = 0.5; root.add(g);
        const segs = [...W.frame.map(([a, b]) => [a.clone(), b.clone()]), ...W.radiusSegs, ...W.auxSegs.slice(0, 0), ...W.capSegs];
        const st = new SilkSet(stage, segs, { width: 1.3 }); g.add(st.obj);
        const d = droplets(stage, W.capSegs, 2, 0.022); g.add(d); d.update(() => 1, 1);
        const sp = new THREE.Group(), tilt = new THREE.Group(); tilt.rotation.x = Math.PI / 2; tilt.add(spiderG); sp.add(tilt); spiderG.position.set(0, 0, 0); spiderG.rotation.set(0, 0, 0); sp.position.set(W.hub.x, W.hub.y, 0.12); sp.rotation.z = -Math.PI / 2; g.add(sp); spider.pose(0, 0, 0.3);
        extra.tilt = g; stage.label('Waits at the hub, head down', [0, 5.6, 0], root);
      } else if (k === 'sheet') {
        ground();
        const segs = []; const NU = 16, NV = 7, Hh = 0.9, Rr = 2.2, P = [];
        for (let j = 0; j <= NV; j++) { P[j] = []; for (let i = 0; i < NU; i++) { const u = (i / NU) * Math.PI * 2, v = (j / NV) * (Math.PI / 2); const jit = 1 + (R() - 0.5) * 0.06; P[j][i] = V(Math.sin(v) * Math.cos(u) * Rr * jit, 0.5 + Math.cos(v) * Hh, Math.sin(v) * Math.sin(u) * Rr * jit); } }
        for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) { if (j < NV) segs.push([P[j][i], P[j + 1][i]]); segs.push([P[j][i], P[j][(i + 1) % NU]]); }
        for (let k2 = 0; k2 < 70; k2++) { const a = V((R() - 0.5) * 4.6, 1.8 + R() * 2.2, (R() - 0.5) * 4.6), b = R() < 0.4 ? V((R() - 0.5) * 4.6, 0.5 + Hh * R(), (R() - 0.5) * 4.6) : V((R() - 0.5) * 5, 1.4 + R() * 3, (R() - 0.5) * 5); segs.push([a, b]); }
        silk(segs, { width: 1.1, opacity: 0.8 });
        place([0, 0.75, 0], 0, true, 0.4); stage.label('Hangs upside down under the sheet', [0, 0.1, 0], root);
        stage.label('Maze of knockdown threads', [0, 4.4, 0], root);
      } else if (k === 'funnel') {
        ground();
        const segs = []; const NX = 18, NZ = 12;
        const pt = (i, j) => V(-3 + (i / NX) * 6 + (R() - 0.5) * 0.03, 0.8 - Math.sin((i / NX) * Math.PI) * 0.15 - (1 - j / NZ) * 0.4 + (j / NZ) * 0.0, -2.4 + (j / NZ) * 4.8);
        const G = []; for (let i = 0; i <= NX; i++) { G[i] = []; for (let j = 0; j <= NZ; j++) G[i][j] = pt(i, j); }
        for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { if (i < NX) segs.push([G[i][j], G[i + 1][j]]); if (j < NZ) segs.push([G[i][j], G[i][j + 1]]); if ((i + j) % 3 === 0 && i < NX && j < NZ) segs.push([G[i][j], G[i + 1][j + 1]]); }
        for (let k2 = 0; k2 < 22; k2++) segs.push([V((R() - 0.5) * 6, 0.8 + R() * 1.6, (R() - 0.5) * 5), V((R() - 0.5) * 6, 0.5 + R() * 0.6, (R() - 0.5) * 4.6)]);
        silk(segs, { width: 1.1, opacity: 0.8 });
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x100c08, side: THREE.DoubleSide, roughness: 1 }));
        tube.rotation.x = Math.PI / 2 + 0.25; tube.position.set(0, 0.35, -2.9); root.add(tube);
        place([0, 0.58, -2.3], Math.PI / 2, false, 0.4); spiderG.rotation.y = 0; spiderG.rotation.z = -0; spiderG.rotation.set(0, -Math.PI / 2, 0);
        stage.label('Tube refuge', [0, 1.5, -3], root); stage.label('Dry, non-sticky sheet', [2.4, 1.15, 1.6], root);
      } else if (k === 'cobweb') {
        ground();
        const segs = [];
        for (let k2 = 0; k2 < 110; k2++) segs.push([V((R() - 0.5) * 4.2, 1.8 + R() * 1.8, (R() - 0.5) * 3.2), V((R() - 0.5) * 4.6, 1.2 + R() * 2.6, (R() - 0.5) * 3.6)]);
        const gum = [];
        for (let k2 = 0; k2 < 9; k2++) { const x = (R() - 0.5) * 4, z = (R() - 0.5) * 3, top = V(x, 1.9 + R() * 0.8, z), bot = V(x + (R() - 0.5) * 0.15, 0.03, z); segs.push([top, bot]); gum.push(bot); }
        silk(segs, { width: 1.2, opacity: 0.85 });
        gum.forEach((b) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.glass({ color: 0xcfe8ff })); d.position.copy(b).setY(0.09); root.add(d); });
        place([0, 2.6, 0], 0.3, true, 0.3); stage.label('Sticky gumfoot lines', [2.1, 0.55, 1], root); stage.label('Waits in the tangle', [0, 3.5, 0], root);
      } else if (k === 'bolas') {
        const br = beam([-3, 5, 0], [3, 5.3, 0], 0.09, M.matte(0x4a3726)); root.add(br);
        place([0, 5.05, 0], 0, true, 0.3);
        const thr = [V(0, 5, 0), V(0, 3, 0)]; extra.thread = silk([thr], { width: 1.8 });
        extra.ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), M.glass({ color: 0xcfe8ff })); root.add(extra.ball); extra.thr = thr;
        extra.moth = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), M.plastic(0xe8d9b0)); root.add(extra.moth);
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.2), M.plastic(0xe8d9b0)); w1.position.set(0, 0.05, 0.14); extra.moth.add(w1);
        const w2 = w1.clone(); w2.position.z = -0.14; extra.moth.add(w2); extra.wings = [w1, w2];
        stage.label('Ball of glue on a thread', [1.2, 2.9, 0], root); stage.label('Moth drawn by the scent', [-2.2, 2.5, 0], root);
      } else if (k === 'balloon') {
        ground();
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 3.2, 8), M.matte(0x4b8a3a)); blade.position.set(0, 1.6, 0); root.add(blade);
        place([0, 3.25, 0], 0, false, 0.6); spiderG.scale.setScalar(0.9);
        const S = Array.from({ length: 4 }, () => [V(0, 0, 0), V(0, 0, 0)]);
        extra.str = silk(S, { width: 1.4, color: COL.silk }); extra.S = S;
        stage.label('Spiderling on a grass tip', [1.2, 3.3, 0], root);
        extra.y = 3.25; extra.x = 0;
      }
      cur = k;
    }

    return {
      update(dt, st) {
        clock += dt;
        if (st.kind !== cur) make(st.kind);
        if (cur === 'bolas') {
          const a = 0.95 * Math.sin(clock * 1.7 + 0.5), L = 2.1, bx = Math.sin(a) * L, by = 5 - Math.cos(a) * L;
          extra.ball.position.set(bx, by, 0); extra.thr[1].set(bx, by, 0); extra.thread.set(() => 1);
          const m = clock * 0.9; extra.moth.position.set(-1.6 + Math.sin(m) * 1.4 + Math.sin(m * 3) * 0.2, 2.6 + Math.cos(m * 1.7) * 0.35, 0.4 * Math.sin(m * 2));
          extra.wings.forEach((w, i) => { w.rotation.x = Math.sin(clock * 30) * 0.7 * (i ? -1 : 1); });
          spider.pose(clock, 0.3, 0.3);
        } else if (cur === 'balloon') {
          if (st.lift > 0.55) { extra.y += dt * (0.3 + (st.lift - 0.55) * 2.5); extra.x += dt * (0.2 + (st.lift - 0.55) * 3); if (extra.y > 7.5) { extra.y = 3.25; extra.x = 0; } } else { extra.y = Math.max(3.25, extra.y - dt * 2); extra.x = Math.max(0, extra.x - dt * 2); }
          const lift = extra.y > 3.3;
          spiderG.position.set(extra.x, extra.y, 0);
          const len = 0.6 + st.lift * 2.6;
          extra.S.forEach(([a, b], i) => { a.set(extra.x, extra.y + 0.12, 0); const sw = Math.sin(clock * 2 + i * 1.7) * 0.15; b.set(extra.x + len * 0.35 + sw + i * 0.07, extra.y + len * (0.8 + i * 0.05), (i - 1.5) * 0.15); });
          extra.str.set(() => (st.lift > 0.3 ? 1 : 0));
          spider.pose(clock, lift ? 0.2 : 0, 0.8);
        } else if (cur === 'sheet' || cur === 'cobweb') spider.pose(clock, 0, 0.4);
      },
      readout(st) {
        const k = KINDS[st.kind];
        return `<div class="big">${k.n}</div><p class="r-say">${k.say}</p>
          <div class="row"><span>Made by</span><b>${k.who}</b></div>
          <div class="row"><span>Found</span><b>${k.where}</b></div>
          <div class="row"><span>Catches</span><b>${k.catches}</b></div>`;
      },
    };
  },
};
