// Chapter 1: from liquid to thread. Silk starts as a protein solution in a gland (about 30-50 % protein, a liquid
// crystal) and is turned into a solid fibre as it passes down a narrowing duct: the pH falls, ions are exchanged,
// water is drawn out, and shear and stretching line the proteins up so beta-sheet crystals can form. The
// duct profile and the particle motion are a cartoon of that, not a simulation. Sources: Vollrath & Knight 2001
// (Nature 410:541), Andersson et al. 2014 (PLoS Biol 12:e1001921), Heidebrecht & Scheibel 2013.
import { THREE, M, latheX, rod, torus, clamp, lerp, smooth } from '../kit.js';
import { rng } from '../spider.js';

const GLANDS = {
  major: { n: 'Dragline', gl: 'Major ampullate gland', col: 0xa3e635, says: 'Makes dragline silk: the safety line, the frame and the radii. Strong and tough, and the best studied silk of all.', size: 0.05 },
  minor: { n: 'Scaffold', gl: 'Minor ampullate gland', col: 0x8ef0ff, says: 'Makes thinner, stiffer silk for the temporary spiral and for reinforcing.', size: 0.035 },
  flag: { n: 'Capture core', gl: 'Flagelliform gland', col: 0xffb547, says: 'Makes the stretchy core of the sticky spiral. It can stretch to several times its length before it breaks.', size: 0.035 },
  aggr: { n: 'Glue', gl: 'Aggregate gland', col: 0xc49bff, says: 'Makes the watery glue. It is not a fibre: it coats the capture thread and breaks up into droplets.', size: 0.07 },
  pyri: { n: 'Anchor cement', gl: 'Piriform gland', col: 0xff7a59, says: 'Makes silk with a cement that fixes lines to twigs, leaves and to each other as small attachment discs.', size: 0.04 },
  acin: { n: 'Wrapping', gl: 'Aciniform gland', col: 0xf0e6d2, says: 'Makes soft, tough silk for wrapping prey and for the outer layers of egg sacs.', size: 0.04 },
  tubu: { n: 'Egg case', gl: 'Tubuliform gland', col: 0xff9ec7, says: 'Makes stiff silk for egg cases. Only adult females have working tubuliform glands.', size: 0.045 },
};
const PROFILE = [[-4.3, 0], [-4.1, 0.7], [-3.5, 1.1], [-2.9, 0.95], [-2.3, 0.62], [-0.8, 0.5], [1.0, 0.4], [2.1, 0.26], [2.9, 0.1], [3.05, 0.06]];
const radiusAt = (x) => {
  for (let i = 1; i < PROFILE.length; i++) if (x <= PROFILE[i][0]) { const [x0, r0] = PROFILE[i - 1], [x1, r1] = PROFILE[i]; return lerp(r0, r1, (x - x0) / (x1 - x0)); }
  return 0.06;
};
const X0 = -3.6, X1 = 3.0;

export default {
  id: 'silk',
  short: 'From liquid to thread',
  title: 'From liquid to thread',
  subtitle: 'A spider turns a runny protein liquid into a solid fibre as it flows down a tiny pipe.',
  view: { pos: [0, 1.4, 11], target: [0, 0, 0] },
  learn: `<p>Silk is made in glands in the spider’s abdomen. Inside, it is not a thread at all. It is a thick, honey-like <b>protein solution</b>, called the <b>dope</b>, which is about <b>30 to 50 percent protein</b>. The proteins are long chains that are loosely curled up and floating, and that is why the liquid can flow.</p>
    <p>The dope then passes down a narrowing <b>duct</b> that is about a centimetre or two long in the lab studies. On the way, four things happen: the liquid becomes more <b>acidic</b>, salts are swapped, <b>water is drawn out</b>, and the squeeze and stretch <b>line the chains up</b>. Short stiff sections of the chains snap together into flat <b>beta-sheet crystals</b>. At the end, the spider pulls a solid fibre out of the tip of a <b>spinneret</b>.</p>
    <p class="tip"><b>Try it:</b> slide <b>Look at</b> along the duct and read what is happening there. Then pick a different <b>gland</b>. One spider can make up to seven kinds of silk, each from its own gland, and each with a different job.</p>`,
  terms: [
    { t: 'Spinning dope', d: 'The thick protein solution in the silk gland, before it becomes a fibre.' },
    { t: 'Spidroin', d: 'The family of large proteins that silk is made of. The name joins "spider" and "fibroin".' },
    { t: 'Spinneret', d: 'A finger-like organ at the back of the abdomen. Most spiders have six, in three pairs, each with many tiny spigots.' },
    { t: 'Liquid crystal', d: 'A liquid whose long molecules are partly lined up. It flows, yet it is easy to draw into a fibre.' },
  ],
  defaults: { at: 0.15, draw: 1, gland: 'major' },
  controls: [
    { key: 'at', type: 'range', label: 'Look at', min: 0, max: 1, step: 0.005, fmt: (v) => (v < 0.28 ? 'Gland' : v < 0.62 ? 'Duct' : 'Spigot') },
    { key: 'draw', type: 'range', label: 'Pull speed', min: 0.2, max: 2, step: 0.01, fmt: (v) => `${v.toFixed(1)}×`, hint: 'Faster pulling lines the chains up more.' },
    { key: 'gland', type: 'seg', label: 'Gland', options: Object.entries(GLANDS).map(([v, g]) => ({ v, label: g.n })) },
  ],
  quiz: [
    { q: 'What is spider silk before it leaves the spider?', options: ['A solid thread coiled in the abdomen', 'A thick protein solution', 'A foam of air bubbles', 'A wax'], answer: 1, why: 'It is a concentrated protein solution, the dope, which becomes solid as it flows down the duct.' },
    { q: 'Which of these happens in the duct?', options: ['The dope is heated', 'Water is drawn out and the proteins line up', 'The dope is mixed with the glue', 'It is dyed'], answer: 1, why: 'Acidification, ion exchange, water removal and stretching together turn the liquid into a fibre.' },
    { q: 'Which gland makes the glue on the sticky spiral?', options: ['Major ampullate', 'Aggregate', 'Piriform', 'Tubuliform'], answer: 1, why: 'The aggregate gland makes the watery glue. The flagelliform gland makes the stretchy thread underneath.' },
  ],
  reel: [
    { ms: 5000, caption: 'Silk starts as a runny liquid: protein, about a third to a half of it.', set: { at: 0.1, draw: 0.6, gland: 'major' }, view: { pos: [-1, 1.2, 9], target: [-1, 0, 0] }, anim: { at: [0.1, 0.3] }, spin: 0 },
    { ms: 5400, caption: 'In a narrow duct the proteins line up and the liquid becomes a solid thread.', set: { at: 0.3, draw: 1.2, gland: 'major' }, view: { pos: [1.5, 1, 8], target: [1.2, 0, 0] }, anim: { at: [0.3, 0.9], draw: [1.0, 1.8] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const tubeMat = M.clear(0xcfe8ff, 0.14, { roughness: 0.1 });
    const tube = latheX(PROFILE, tubeMat, { seg: 48 }); root.add(tube);
    const wall = latheX(PROFILE, new THREE.MeshBasicMaterial({ color: 0x8fb0ff, wireframe: true, transparent: true, opacity: 0.1 }), { seg: 20 }); root.add(wall);
    const fibreMat = M.glow(GLANDS.major.col);
    const fibre = rod(3.0, 7.2, 0.03, 0.03, fibreMat, 10); root.add(fibre);
    // six spinnerets around the exit
    const spin = new THREE.Group(); spin.position.x = 3.05; root.add(spin);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 14), M.matte(0x6b5440));
      c.rotation.z = -Math.PI / 2; c.position.set(0.1, Math.cos(a) * 0.5, Math.sin(a) * 0.5);
      spin.add(c);
    }
    stage.label('Spinnerets: most spiders have six', [3.2, 1.1, 0], root);
    stage.label('Gland: liquid dope', [-3.3, 1.5, 0], root);
    const fl = stage.label('Fibre', [6.2, 0.35, 0], root);
    const marker = torus(1, 0.035, M.glow(0xffffff), 48); marker.rotation.y = Math.PI / 2; root.add(marker);

    const N = 360, R = rng(5);
    const geo = new THREE.SphereGeometry(1, 10, 8);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), N);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(mesh);
    const P = Array.from({ length: N }, () => ({ x: lerp(X0, X1, R()), a: R() * Math.PI * 2, rr: Math.sqrt(R()) * 0.8, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6.3, R() * 6.3, R() * 6.3)), sp: 0.6 + R() * 0.8 }));
    const idq = new THREE.Quaternion(), o = new THREE.Object3D(), c1 = new THREE.Color(0x6aa0ff), c2 = new THREE.Color(0xa3e635), cc = new THREE.Color();
    const W = 70, water = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), M.glow(0x8ef0ff), W);
    root.add(water);
    const WP = Array.from({ length: W }, () => ({ x: lerp(-0.6, 2.5, R()), a: R() * Math.PI * 2, ph: R() }));
    const align = (x, st) => smooth((x + 0.6) / 3.2) * (0.35 + 0.65 * clamp(st.draw / 1.6, 0, 1));
    const cryst = (x) => smooth((x - 1.5) / 1.1);
    let tt = 0, lastG = '';

    return {
      update(dt, st) {
        tt += dt;
        const g = GLANDS[st.gland];
        if (lastG !== st.gland) { lastG = st.gland; fibreMat.color.setHex(g.col); fibre.scale.set(1, g.size / 0.03 / 1.6, g.size / 0.03 / 1.6); tubeMat.color.setHex(0xcfe8ff).lerp(new THREE.Color(g.col), 0.18); c2.setHex(g.col); }
        for (let i = 0; i < N; i++) {
          const p = P[i], r = radiusAt(p.x);
          p.x += dt * 0.7 * st.draw * p.sp * Math.min(12, Math.pow(0.5 / Math.max(0.06, r), 2));
          if (p.x > X1) { p.x = X0 - R() * 0.4; p.a = R() * 6.3; p.rr = Math.sqrt(R()) * 0.8; }
          const r2 = radiusAt(p.x) * p.rr, a = align(p.x, st), c = cryst(p.x);
          o.position.set(p.x, Math.cos(p.a) * r2, Math.sin(p.a) * r2);
          o.quaternion.copy(p.q).slerp(idq, a);
          const sc = lerp(0.06, 0.05, a);
          o.scale.set(sc * lerp(1, 3.6, a), sc * lerp(1, 0.5, a) * (1 - 0.2 * c), sc * lerp(1, 0.5, a));
          o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
          cc.copy(c1).lerp(c2, c); mesh.setColorAt(i, cc);
        }
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
        for (let i = 0; i < W; i++) {
          const w = WP[i]; w.ph = (w.ph + dt * 0.35 * st.draw) % 1;
          const r = radiusAt(w.x) * (1 + w.ph * 1.2);
          o.position.set(w.x + w.ph * 0.3, Math.cos(w.a) * r, Math.sin(w.a) * r); o.quaternion.identity();
          o.scale.setScalar((1 - w.ph) * 1.2 + 0.01); o.updateMatrix(); water.setMatrixAt(i, o.matrix);
        }
        water.instanceMatrix.needsUpdate = true;
        const mx = lerp(X0, X1, st.at), mr = radiusAt(mx) + 0.1;
        marker.position.x = mx; marker.scale.setScalar(Math.max(0.12, mr));
        fl.element.textContent = `${g.n} thread`;
      },
      readout(st) {
        const g = GLANDS[st.gland], x = lerp(X0, X1, st.at), c = cryst(x), a = align(x, st);
        const where = st.at < 0.28 ? ['Storage sac', 'Runny liquid. The chains are curled up and can slide past each other.', 'about 7'] : st.at < 0.62 ? ['Narrowing duct', 'Acid rises, water leaves, the chains are squeezed into line.', 'falling toward 6'] : ['Near the spigot', 'Crystals lock the chains into a solid, and the fibre is pulled out.', 'about 6 or lower'];
        return `<div class="big">${where[0]}</div><p class="r-say">${where[1]}</p>
          <div class="row"><span>pH</span><b>${where[2]}</b></div>
          <div class="row"><span>Chains lined up</span><b>${Math.round(a * 100)}%</b></div>
          <div class="row"><span>Crystals formed</span><b>${Math.round(c * 100)}%</b></div>
          <p class="r-say"><b>${g.gl}.</b> ${g.says}</p>`;
      },
    };
  },
};
