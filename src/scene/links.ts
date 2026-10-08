import * as THREE from 'three';
import { BONDS } from '../data/theme';
import type { Bond } from '../data/types';
import type { SoulNode } from './nodes';

const SEG = 32;

/** Quadratic arc between two nodes, bowed outward from the centre of the web and slightly upward. */
function control(a: THREE.Vector3, b: THREE.Vector3, out: THREE.Vector3) {
  out.addVectors(a, b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const outward = tmpV.copy(out);
  outward.y = 0;
  if (outward.lengthSq() < 1) outward.set(1, 0, 0);
  outward.normalize().multiplyScalar(len * 0.16);
  out.add(outward);
  out.y += len * 0.1;
  return out;
}
const tmpV = new THREE.Vector3();

function bezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
  return out;
}

export class BondWeb {
  readonly group = new THREE.Group();
  private lines: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private pos: Float32Array;
  private state: Float32Array;
  private sparkGeo: THREE.BufferGeometry;
  private sparkPos: Float32Array;
  private sparkCol: Float32Array;
  private sparks: THREE.Points;
  /** Current & target intensity per bond. */
  readonly level: Float32Array;
  readonly target: Float32Array;
  highlighted = new Set<number>();
  /** Global multiplier, lowered in layouts where bonds are secondary. */
  base = 1;
  private baseTarget = 1;

  constructor(private bonds: Bond[], private nodes: Map<string, SoulNode>) {
    const nv = bonds.length * SEG * 2;
    this.pos = new Float32Array(nv * 3);
    this.state = new Float32Array(nv);
    const tAttr = new Float32Array(nv);
    const col = new Float32Array(nv * 3);
    const seed = new Float32Array(nv);
    const c = new THREE.Color();
    bonds.forEach((b, i) => {
      c.set(BONDS[b.kind].color);
      const s = Math.random();
      // flow runs from the superior / acting party toward the other
      const flip = b.from === b.b;
      for (let k = 0; k < SEG; k++) {
        for (let e = 0; e < 2; e++) {
          const v = (i * SEG + k) * 2 + e;
          const t = (k + e) / SEG;
          tAttr[v] = flip ? 1 - t : t;
          col.set([c.r, c.g, c.b], v * 3);
          seed[v] = s;
        }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aState', new THREE.BufferAttribute(this.state, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aT', new THREE.BufferAttribute(tAttr, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.lines = new THREE.LineSegments(
      geo,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aState; attribute float aT; attribute vec3 aColor; attribute float aSeed;
          varying float vS; varying float vT; varying vec3 vC; varying float vSeed;
          void main() {
            vS = aState; vT = aT; vC = aColor; vSeed = aSeed;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying float vS; varying float vT; varying vec3 vC; varying float vSeed;
          void main() {
            if (vS < 0.002) discard;
            float pulse = smoothstep(0.82, 1.0, fract(vT * 1.6 - uTime * (0.22 + vSeed * 0.1) + vSeed));
            float ends = smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.92, vT);
            float a = vS * (0.32 + pulse * (0.6 + vS * 1.6)) * mix(0.5, 1.0, ends);
            gl_FragColor = vec4(vC * (0.7 + pulse * vS * 1.2), a);
          }
        `,
      }),
    );
    this.lines.frustumCulled = false;
    this.group.add(this.lines);

    const MAXS = 600;
    this.sparkPos = new Float32Array(MAXS * 3);
    this.sparkCol = new Float32Array(MAXS * 3);
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.sparkGeo.setDrawRange(0, 0);
    this.sparks = new THREE.Points(
      this.sparkGeo,
      new THREE.PointsMaterial({
        size: 3.2,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: sparkTexture(),
      }),
    );
    this.sparks.frustumCulled = false;
    this.group.add(this.sparks);

    this.level = new Float32Array(bonds.length);
    this.target = new Float32Array(bonds.length);
  }

  setBase(v: number) {
    this.baseTarget = v;
  }

  /** Replace the highlighted bond set (these run at full strength and carry sparks). */
  highlight(ids: Set<number>) {
    this.highlighted = ids;
  }

  update(time: number, dt: number) {
    const fade = 1 - Math.exp(-dt * 5);
    this.base += (this.baseTarget - this.base) * fade;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const p = new THREE.Vector3();
    let si = 0;
    const col = new THREE.Color();
    for (let i = 0; i < this.bonds.length; i++) {
      const bond = this.bonds[i];
      const na = this.nodes.get(bond.a)!;
      const nb = this.nodes.get(bond.b)!;
      this.level[i] += (this.target[i] * Math.min(na.alpha, nb.alpha) - this.level[i]) * fade;
      const lv = this.level[i] * (this.highlighted.has(i) ? 1 : this.base);
      a.copy(na.position);
      b.copy(nb.position);
      control(a, b, c);
      const off = i * SEG * 2;
      if (lv < 0.002) {
        // collapsed: zero state so the fragment shader discards
        this.state.fill(0, off, off + SEG * 2);
        continue;
      }
      for (let k = 0; k <= SEG; k++) {
        bezier(a, c, b, k / SEG, p);
        if (k < SEG) this.pos.set([p.x, p.y, p.z], (off + k * 2) * 3);
        if (k > 0) this.pos.set([p.x, p.y, p.z], (off + k * 2 - 1) * 3);
      }
      this.state.fill(lv, off, off + SEG * 2);

      if (this.highlighted.has(i)) {
        col.set(BONDS[bond.kind].color);
        const flip = bond.from === bond.b;
        for (let s = 0; s < 5 && si < 600; s++, si++) {
          let t = (time * 0.18 + s / 5 + i * 0.13) % 1;
          if (flip) t = 1 - t;
          bezier(a, c, b, t, p);
          this.sparkPos.set([p.x, p.y, p.z], si * 3);
          const fadeEnds = Math.sin(Math.PI * t) * lv;
          this.sparkCol.set([col.r * fadeEnds, col.g * fadeEnds, col.b * fadeEnds], si * 3);
        }
      }
    }
    this.sparkGeo.setDrawRange(0, si);
    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;
    const g = this.lines.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aState.needsUpdate = true;
    this.lines.material.uniforms.uTime.value = time;
  }
}

function sparkTexture() {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(cv);
}
