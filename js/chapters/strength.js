// Chapter 3: strong AND tough. Strength is the stress a fibre carries before it breaks; toughness is the
// energy it absorbs, the area under the stress-strain curve. Dragline is about as strong as good steel
// wire, much weaker than Kevlar, but it stretches about 30 % so it soaks up far more energy.
// Typical values (they vary by species, by spider and by how the silk is drawn): dragline 1.0-1.8 GPa,
// extensibility about 30 %, toughness about 100-180 MJ/m3 (Gosline et al. 1999 J Exp Biol 202:3295;
// Vollrath & Porter 2006 Appl Phys A; Swanson et al. 2006), Kevlar 49 about 3.6 GPa, 3 %, 50 MJ/m3,
// high-tensile steel wire about 1.5 GPa, under 1 %, about 6 MJ/m3 (same sources); Darwin's bark spider
// dragline averaged 350 MJ/m3, up to 520 (Agnarsson et al. 2010, PLoS ONE 5:e11234). The curves below are
// simplified drawings through those figures, not measurements. Density: silk about 1.3, Kevlar 1.44,
// steel 7.8 g/cm3.
import { THREE, M, box, canvasTexture, clamp, lerp, smooth } from '../kit.js';

const MATS = {
  dragline: { n: 'Spider dragline', col: '#a3e635', hex: 0xa3e635, rho: 1.3, pts: [[0, 0], [0.02, 0.15], [0.06, 0.25], [0.15, 0.45], [0.27, 1.0], [0.3, 1.2]], str: '1.0 to 1.8 GPa', ext: 'about 30%', tough: '100 to 180 MJ/m³', note: 'Tough because it stretches, and the stretching soaks up energy.' },
  flag: { n: 'Capture core', col: '#ffb547', hex: 0xffb547, rho: 1.3, pts: [[0, 0], [0.5, 0.02], [1.5, 0.05], [2.2, 0.08], [2.7, 0.35]], str: 'about 0.5 GPa', ext: '200% or more', tough: 'about 150 MJ/m³', note: 'Soft and very stretchy: it has to cushion a fly without snapping.' },
  kevlar: { n: 'Kevlar 49', col: '#ff7a59', hex: 0xff7a59, rho: 1.44, pts: [[0, 0], [0.027, 3.6]], str: 'about 3.6 GPa', ext: 'about 3%', tough: 'about 50 MJ/m³', note: 'Very strong and stiff, but it hardly stretches, so it absorbs less energy.' },
  steel: { n: 'High-tensile steel', col: '#8ef0ff', hex: 0x8ef0ff, rho: 7.8, pts: [[0, 0], [0.007, 1.4], [0.008, 1.5]], str: 'about 1.5 GPa', ext: 'under 1%', tough: 'about 6 MJ/m³', note: 'As strong as dragline, but it snaps after almost no stretch.' },
};
const emax = (m) => m.pts[m.pts.length - 1][0];
const sigmaAt = (m, e) => { const P = m.pts; for (let i = 1; i < P.length; i++) if (e <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (e - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P[P.length - 1][1]; };
const BARS = [['Darwin’s bark spider', 350, '#c49bff'], ['Dragline (typical)', 140, '#a3e635'], ['Kevlar 49', 50, '#ff7a59'], ['Steel wire', 6, '#8ef0ff']];

export default {
  id: 'strength',
  short: 'Strong and tough',
  title: 'Strong, and very tough',
  subtitle: 'Hard crystals make it strong. Stretchy chains between them make it tough.',
  view: { pos: [0, 0.3, 12.5], target: [0, 0.4, 0] },
  learn: `<p>People say spider silk is “stronger than steel”. Half true. Dragline is about as <b>strong</b> as good steel wire and weaker than Kevlar. Weight for weight it is several times stronger than steel, because silk is only about a sixth as dense. What really sets it apart is <b>toughness</b>: the energy it takes to break it. It stretches about <b>30 percent</b> first, and that stretch soaks up a fly’s energy.</p>
    <p>The secret is two kinds of building block in the same protein. Short, stiff blocks stack into tiny <b>beta-sheet crystals</b>, a few nanometres across. They act as hard anchors. Between them, long floppy blocks form an <b>amorphous</b> tangle that uncoils like a spring as you pull. The crystals give strength, and the tangle gives stretch.</p>
    <p class="tip"><b>Try it:</b> drag <b>Pull</b> and watch the chains straighten between the crystals while the dot moves up the curve. Pick Kevlar or steel and compare how far each stretches before it stops.</p>
    <p class="note">The curves are simplified drawings through typical published numbers. Real silk varies with species, with the spider and with how fast it is drawn.</p>`,
  terms: [
    { t: 'Strength', d: 'The force per area a fibre holds before it breaks, measured in gigapascals (GPa).' },
    { t: 'Toughness', d: 'The energy a fibre absorbs before it breaks: the area under its stress-strain curve.' },
    { t: 'Beta-sheet crystal', d: 'A flat stack of protein chains held by hydrogen bonds. In dragline they are a few nanometres across.' },
    { t: 'Extensibility', d: 'How far a fibre stretches before it breaks, as a percentage of its starting length.' },
  ],
  defaults: { mat: 'dragline', pull: 0.45 },
  controls: [
    { key: 'mat', type: 'seg', label: 'Material', options: Object.entries(MATS).map(([v, m]) => ({ v, label: m.n })) },
    { key: 'pull', type: 'range', label: 'Pull', min: 0, max: 1, step: 0.005, fmt: (v, s) => `${(v * emax(MATS[s.mat]) * 100).toFixed(v * emax(MATS[s.mat]) < 0.1 ? 1 : 0)}% stretch` },
  ],
  quiz: [
    { q: 'What makes spider dragline tougher than Kevlar?', options: ['It is stiffer', 'It stretches about 30% before breaking', 'It is heavier', 'It is coated in glue'], answer: 1, why: 'Kevlar is stronger but stretches about 3%. Dragline stretches about ten times as far and so absorbs more energy.' },
    { q: 'What are beta-sheet crystals for?', options: ['They make the silk sticky', 'They give hard, strong anchors in the fibre', 'They make it stretch', 'They store water'], answer: 1, why: 'Crystals of stacked chains give strength. The tangled chains between them give the stretch.' },
    { q: 'Weight for weight, how does dragline compare with steel?', options: ['Much weaker', 'The same', 'Several times stronger', 'Not comparable'], answer: 2, why: 'Strength is similar, but silk is about a sixth as dense, so per kilogram it is several times stronger.' },
  ],
  reel: [
    { ms: 5600, caption: 'Silk is as strong as steel wire, but it stretches a third, so it is far tougher.', set: { mat: 'dragline', pull: 0 }, anim: { pull: [0, 1] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // ---- molecule model
    const mol = new THREE.Group(); mol.position.set(0, 3.0, 0); root.add(mol);
    const ROWS = [1.0, 0.33, -0.33, -1.0], COLS = 5, CW = 0.42, G0 = 0.85, LC = 1.3;
    const crystals = [], chains = [];
    const cm = M.plastic(0xa3e635, { roughness: 0.3, emissive: 0x4a6a10, emissiveIntensity: 0.4 });
    ROWS.forEach((y, r) => {
      for (let c = 0; c < COLS; c++) {
        const g = new THREE.Group();
        for (let k = 0; k < 4; k++) { const sh = box(CW, 0.07, 0.5, cm); sh.position.y = (k - 1.5) * 0.11; g.add(sh); }
        g.position.y = y * 0.5; g.userData = { r, c }; mol.add(g); crystals.push(g);
      }
      for (let c = 0; c < COLS - 1; c++) for (let k = 0; k < 3; k++) {
        const n = 40, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe9eef8, transparent: true, opacity: 0.85 }));
        line.frustumCulled = false; line.userData = { r, c, k, n }; mol.add(line); chains.push(line);
      }
    });
    stage.label('Crystals: hard, a few nanometres across', [-3.1, 4.55, 0], root);
    stage.label('Tangled chains: stretch like springs', [2.4, 1.5, 0], root);
    // ---- chart
    const m0 = () => MATS[s.mat];
    const W = 1400, H = 900;
    let chart;
    const X = (e) => 90 + (Math.sqrt(e) / Math.sqrt(3)) * 760, Y = (sg) => 780 - (sg / 4) * 680;
    chart = canvasTexture(W, H, (g) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(13,15,22,.9)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
      g.font = '500 24px Geist, system-ui, sans-serif'; g.fillStyle = '#a8aebf';
      g.fillText('Stress (GPa) against stretch (%, square-root scale)', 90, 54);
      g.font = '400 20px Geist, system-ui, sans-serif';
      for (const v of [0, 1, 2, 3, 4]) { g.fillStyle = '#737a8e'; g.fillText(String(v), 52, Y(v) + 7); g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(90, Y(v)); g.lineTo(870, Y(v)); g.stroke(); }
      for (const v of [0, 1, 3, 10, 30, 100, 270]) { const x = X(v / 100); g.fillStyle = '#737a8e'; g.fillText(`${v}`, x - 10, 812); g.beginPath(); g.moveTo(x, 780); g.lineTo(x, 100); g.strokeStyle = 'rgba(255,255,255,.07)'; g.stroke(); }
      for (const [id, m] of Object.entries(MATS)) {
        const on = id === s.mat;
        const lim = on ? s.pull * emax(m) : 0, N = 160;
        g.lineWidth = on ? 5 : 3; g.strokeStyle = m.col; g.globalAlpha = on ? 0.32 : 0.28;
        g.beginPath(); for (let i = 0; i <= N; i++) { const e = (i / N) * emax(m), x = X(e), y = Y(sigmaAt(m, e)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        if (on) {
          g.globalAlpha = 1; g.beginPath(); for (let i = 0; i <= N; i++) { const e = (i / N) * lim, x = X(e), y = Y(sigmaAt(m, e)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          const ex = X(lim), ey = Y(sigmaAt(m, lim)); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 11, 0, 7); g.fill(); g.fillStyle = m.col; g.beginPath(); g.arc(ex, ey, 7, 0, 7); g.fill();
        }
        g.globalAlpha = 1; g.fillStyle = m.col; g.font = '500 21px Geist, system-ui, sans-serif';
        const lx = X(emax(m)), ly = Y(sigmaAt(m, emax(m)));
        g.fillText(m.n, Math.min(lx + 10, 700), id === 'steel' ? ly - 14 : ly + (id === 'flag' ? -10 : 6));
      }
      // toughness bars
      g.fillStyle = '#a8aebf'; g.font = '500 24px Geist, system-ui, sans-serif'; g.fillText('Energy to break (MJ/m³)', 920, 54);
      BARS.forEach(([n, v, col], i) => {
        const y = 110 + i * 150, w = (v / 350) * 400;
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(920, y, 400, 46); g.fillStyle = col; g.fillRect(920, y, Math.max(6, w), 46);
        g.font = '400 21px Geist, system-ui, sans-serif'; g.fillStyle = '#eef0f6'; g.fillText(n, 920, y + 78); g.fillStyle = '#0b0c10'; g.font = '600 22px Geist, system-ui, sans-serif';
        g.fillText(v === 140 ? '100–180' : v === 350 ? '350 (up to 520)' : '~' + v, 932, y + 32);
      });
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    plane.position.set(0, -1.6, 0); root.add(plane);
    let key = '';

    return {
      update(dt, st) {
        const m = m0(), e = st.pull * emax(m);
        const k = `${st.mat}|${st.pull.toFixed(3)}`;
        if (k !== key) { key = k; chart.redraw(); }
        // molecule always shows dragline stretched by (pull x 30 %) when dragline, else scaled for the material
        const eMol = st.mat === 'dragline' ? st.pull * 0.3 : st.mat === 'flag' ? Math.min(0.3, e * 0.12) : e;
        const gap = G0 + eMol * 1.32, total = COLS * CW + (COLS - 1) * gap, x0 = -total / 2;
        const stress = clamp(sigmaAt(m, e) / 1.6, 0, 1);
        cm.emissiveIntensity = 0.25 + stress * 1.2;
        crystals.forEach((c) => { c.position.x = x0 + CW / 2 + c.userData.c * (CW + gap); });
        chains.forEach((l) => {
          const { c, k: kk, n } = l.userData, xa = x0 + CW + c * (CW + gap), xb = xa + gap, a = 0.45 * Math.sqrt(Math.max(0, 1 - (gap / LC) ** 2));
          const rowY = ROWS[l.userData.r] * 0.5, pos = l.geometry.attributes.position;
          for (let i = 0; i < n; i++) {
            const u = i / (n - 1), env = Math.sin(Math.PI * u);
            pos.setXYZ(i, lerp(xa, xb, u), rowY + (kk - 1) * 0.16 + Math.sin(u * 14 + kk * 2 + c) * a * env * 0.8, Math.cos(u * 11 + kk * 2.4 + c) * a * env * 0.8);
          }
          pos.needsUpdate = true;
        });
      },
      readout(st) {
        const m = m0(), e = st.pull * emax(m), sg = sigmaAt(m, e);
        return `<div class="big">${m.n}</div><p class="r-say">${m.note}</p>
          <div class="row"><span>Stress now</span><b>${sg.toFixed(sg < 0.1 ? 2 : 1)} GPa</b></div>
          <div class="row"><span>Strength</span><b>${m.str}</b></div>
          <div class="row"><span>Stretch at break</span><b>${m.ext}</b></div>
          <div class="row"><span>Energy to break</span><b>${m.tough}</b></div>
          <div class="row"><span>Strength per weight</span><b>${(emaxStr(m) / m.rho).toFixed(2)} GPa per g/cm³</b></div>`;
      },
    };
  },
};
function emaxStr(m) { return Math.max(...m.pts.map((p) => p[1])); }
