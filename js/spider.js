// Shared parts for SpiderClear: a small articulated spider, silk line sets that grow, and an orb-web generator.
import { THREE, M, sphere, clamp, lerp, smooth } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export { clamp, lerp, smooth };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const COL = { silk: 0xe9eef8, silkDim: 0x8f9bb5, lime: 0xa3e635, amber: 0xffb547, coral: 0xff7a59, cyan: 0x8ef0ff, violet: 0xc49bff, dew: 0xcfe8ff, spider: 0x2a2018 };

// ---------------------------------------------------------------- the spider
// Faces +x. Body scale s. pose(t, moving) wiggles the legs.
export function makeSpider(s = 1, { color = 0x3a2a1e, mark = 0xe8c27a } = {}) {
  const g = new THREE.Group(), body = new THREE.Group();
  const mat = M.matte(color, { roughness: 0.6 }), markMat = M.matte(mark);
  const ceph = sphere(0.2 * s, mat, 20); ceph.scale.set(1.15, 0.8, 0.95); ceph.position.set(0.22 * s, 0, 0);
  const abd = sphere(0.34 * s, mat, 24); abd.scale.set(1.25, 0.95, 1); abd.position.set(-0.3 * s, 0.02 * s, 0);
  const cross = sphere(0.1 * s, markMat, 12); cross.scale.set(1.6, 0.4, 0.8); cross.position.set(-0.28 * s, 0.3 * s, 0);
  body.add(ceph, abd, cross);
  for (const z of [-0.07, 0.07]) { const e = sphere(0.035 * s, M.glow(0xffffff), 8); e.position.set(0.38 * s, 0.08 * s, z * s); const e2 = sphere(0.022 * s, M.glow(0xff7a59), 8); e2.position.set(0.41 * s, 0.1 * s, z * 1.6 * s); body.add(e, e2); }
  g.add(body);
  const legs = [];
  const L1 = 0.62 * s, L2 = 0.78 * s, r = 0.026 * s;
  const seg = (L) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.7, L, 6), mat); m.rotation.z = -Math.PI / 2; m.position.x = L / 2; m.castShadow = true; return m; };
  const yaws = [0.62, 0.22, -0.22, -0.62];
  for (const side of [-1, 1]) {
    yaws.forEach((yw, i) => {
      const root = new THREE.Group();
      root.position.set(0.2 * s + (1.5 - i) * 0.06 * s, 0, side * 0.08 * s);
      const yaw = side > 0 ? Math.PI / 2 - yw * 1.4 : -Math.PI / 2 + yw * 1.4;
      root.rotation.y = yaw + (side < 0 ? 0 : 0);
      const up = new THREE.Group(); up.add(seg(L1));
      const knee = new THREE.Group(); knee.position.x = L1; knee.add(seg(L2)); up.add(knee);
      root.add(up); g.add(root);
      legs.push({ root, up, knee, i, side, yaw });
    });
  }
  g.pose = (t = 0, moving = 0, hang = 0) => {
    legs.forEach((l) => {
      const ph = t * 9 + l.i * 1.6 + (l.side > 0 ? 0 : Math.PI);
      const w = Math.sin(ph) * 0.35 * moving;
      l.up.rotation.z = lerp(0.55, 0.15, hang) + w * 0.6;
      l.knee.rotation.z = lerp(-1.2, -0.45, hang) - Math.max(0, Math.cos(ph)) * 0.4 * moving;
      l.root.rotation.y = l.yaw * 0 + (l.side > 0 ? Math.PI / 2 - l.yaw * 1.4 : -Math.PI / 2 + l.yaw * 1.4) + Math.cos(ph) * 0.18 * moving * l.side;
    });
  };
  g.pose(0, 0, 0);
  return g;
}

// ---------------------------------------------------------------- growing silk
// A set of straight segments drawn as fat lines. Each segment has a fraction 0..1 drawn.
export class SilkSet {
  constructor(stage, segs, { color = COL.silk, width = 1.6, opacity = 0.95 } = {}) {
    this.segs = segs; this.n = segs.length;
    this.arr = new Float32Array(Math.max(1, this.n) * 6);
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(new Float32Array(Math.max(1, this.n) * 6).fill(0.0001));
    this.mat = stage.lineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false });
    this.obj = new LineSegments2(this.geo, this.mat);
    this.obj.frustumCulled = false;
    this.fr = new Float32Array(this.n);
    this.set(() => 1);
  }
  // fn(k) → fraction of segment k
  set(fn, disp = null) {
    const a = this.arr, S = this.segs; let count = 0;
    for (let k = 0; k < this.n; k++) {
      const f = clamp(fn(k), 0, 1); this.fr[k] = f;
      if (f <= 0) continue;
      const [p, q] = S[k], o = count * 6;
      let ax = p.x, ay = p.y, az = p.z, bx = lerp(p.x, q.x, f), by = lerp(p.y, q.y, f), bz = lerp(p.z, q.z, f);
      if (disp) { az += disp(ax, ay, az); bz += disp(bx, by, bz); }
      a[o] = ax; a[o + 1] = ay; a[o + 2] = az; a[o + 3] = bx; a[o + 4] = by; a[o + 5] = bz;
      count++;
    }
    const buf = this.geo.attributes.instanceStart.data;
    buf.array.set(a); buf.needsUpdate = true;
    this.geo.instanceCount = count;
  }
  // sequential growth: p 0→1 across all segments
  grow(p, disp) { const n = this.n; this.set((k) => p * n - k, disp); }
  get visible() { return this.obj.visible; }
  set visible(v) { this.obj.visible = v; }
}

// ---------------------------------------------------------------- orb web
// The web lies in the XY plane (z = tiny depth). Hub near the middle, six anchors around it.
export function orbWeb({ R = 3, radii = 26, turns = 22, aux = 5, seed = 7, sag = 0.04 } = {}) {
  const r = rng(seed);
  const hub = V(0, R * 0.06, 0);
  const aAng = [150, 30, -20, -70, -130, 200].map((d) => (d * Math.PI) / 180);
  const anchors = aAng.map((a, i) => { const rr = R * (1.02 + r() * 0.16); return V(Math.cos(a) * rr * 1.05, Math.sin(a) * rr * 0.95 + R * 0.04, (r() - 0.5) * R * 0.25); });
  const frame = anchors.map((p, i) => [p, anchors[(i + 1) % anchors.length]]);
  const hit = (ang) => {
    const dx = Math.cos(ang), dy = Math.sin(ang); let best = null, bt = 1e9;
    for (const [p, q] of frame) {
      const ex = q.x - p.x, ey = q.y - p.y, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((p.x - hub.x) * ey - (p.y - hub.y) * ex) / den, u = ((p.x - hub.x) * dy - (p.y - hub.y) * dx) / den;
      if (t > 0 && u >= 0 && u <= 1 && t < bt) { bt = t; best = V(hub.x + dx * t, hub.y + dy * t, p.z + (q.z - p.z) * u); }
    }
    return best || V(hub.x + dx * R, hub.y + dy * R, 0);
  };
  const angs = Array.from({ length: radii }, (_, j) => (j / radii) * Math.PI * 2 + (r() - 0.5) * 0.18 + 0.1).sort((a, b) => a - b);
  const ends = angs.map(hit);
  const ptAt = (j, f) => V(lerp(hub.x, ends[j].x, f), lerp(hub.y, ends[j].y, f), lerp(hub.z, ends[j].z, f));
  const radiusSegs = ends.map((e) => [hub.clone(), e]);
  // build order of the radii: first few big ones, then alternate sides
  const order = []; const used = new Set();
  [0, Math.floor(radii / 3), Math.floor((2 * radii) / 3)].forEach((j) => { order.push(j); used.add(j); });
  for (let k = 0; k < radii; k++) { const j = (k * 7 + 3) % radii; if (!used.has(j)) { used.add(j); order.push(j); } }
  for (let j = 0; j < radii; j++) if (!used.has(j)) order.push(j);
  const spiral = (f0, f1, nTurns, subs = 2, droop = sag) => {
    const out = [], steps = Math.round(nTurns * radii);
    let prev = ptAt(0, f0);
    for (let k = 1; k <= steps; k++) {
      const j = k % radii, f = f0 + (f1 - f0) * (k / steps), cur = ptAt(j, f);
      const mid = prev.clone().lerp(cur, 0.5); mid.y -= droop * prev.distanceTo(cur);
      if (subs === 2) { out.push([prev, mid], [mid, cur]); } else out.push([prev, cur]);
      prev = cur;
    }
    return out;
  };
  const hubSegs = spiral(0.012, 0.06, 3, 1, 0);
  const auxSegs = spiral(0.07, 0.94, aux, 1, sag * 0.6);
  const capSegs = spiral(0.93, 0.13, turns, 2, sag);
  return { R, hub, anchors, frame, ends, radii, order, radiusSegs, hubSegs, auxSegs, capSegs, ptAt };
}

// Droplets on capture-thread segments: n per sub-segment.
export function droplets(stage, capSegs, per = 3, radius = 0.014) {
  const geo = new THREE.SphereGeometry(radius, 8, 6);
  const mat = new THREE.MeshPhysicalMaterial({ color: COL.dew, roughness: 0.05, metalness: 0, transmission: 0.55, thickness: 0.2, ior: 1.33, transparent: true, opacity: 0.9, clearcoat: 1, envMapIntensity: 1.4 });
  const mesh = new THREE.InstancedMesh(geo, mat, capSegs.length * per);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D();
  mesh.update = (fn, scale = 1, disp = null) => {
    let c = 0;
    for (let k = 0; k < capSegs.length; k++) {
      const f = clamp(fn(k), 0, 1); if (f <= 0) continue;
      const [p, q] = capSegs[k];
      for (let d = 0; d < per; d++) {
        const u = ((d + 0.5) / per) * f;
        o.position.set(lerp(p.x, q.x, u), lerp(p.y, q.y, u), lerp(p.z, q.z, u));
        if (disp) o.position.z += disp(o.position.x, o.position.y, o.position.z);
        o.scale.setScalar(scale * (0.8 + 0.4 * ((k * 7 + d * 3) % 5) / 4)); o.updateMatrix(); mesh.setMatrixAt(c++, o.matrix);
      }
    }
    mesh.count = c; mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

// twigs and a leafy backdrop for anchors
export function twigs(parent, anchors) {
  const mat = M.matte(0x3b2c1f);
  anchors.forEach((a) => {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat); t.position.copy(a); parent.add(t);
  });
}
