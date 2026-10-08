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
    this.cacheA = bonds.map(() => new THREE.Vector3(Infinity, 0, 0));
    this.cacheB = bonds.map(() => new THREE.Vector3(Infinity, 0, 0));
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
    for (const [i, t] of this.tubes) {
      if (!ids.has(i)) {
        t.mesh.removeFromParent();
        t.mesh.geometry.dispose();
        t.mesh.material.dispose();
        this.tubes.delete(i);
      }
    }
  }

  /** Glowing tubes for highlighted bonds; rebuilt only when an endpoint has moved. */
  private tubes = new Map<number, { mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>; a: THREE.Vector3; b: THREE.Vector3 }>();

  private updateTube(i: number, a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, lv: number, time: number) {
    let t = this.tubes.get(i);
    const bond = this.bonds[i];
    if (!t) {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(BONDS[bond.kind].color) },
          uTime: { value: 0 },
          uLevel: { value: 0 },
          uFlip: { value: bond.from === bond.b ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uTime; uniform float uLevel; uniform float uFlip;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main() {
            float u = mix(vUv.x, 1.0 - vUv.x, uFlip);
            float core = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
            float pulse = pow(0.5 + 0.5 * sin((u * 9.0 - uTime * 2.2) * 3.14159), 6.0);
            float ends = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
            float a = (0.35 + 0.65 * pulse) * (0.35 + 0.65 * core) * ends * uLevel;
            gl_FragColor = vec4(uColor * (0.8 + pulse * 1.2), a);
          }
        `,
      });
      t = { mesh: new THREE.Mesh(new THREE.TubeGeometry(), mat), a: new THREE.Vector3(Infinity, 0, 0), b: new THREE.Vector3() };
      this.tubes.set(i, t);
      this.group.add(t.mesh);
    }
    if (t.a.distanceToSquared(a) > 0.01 || t.b.distanceToSquared(b) > 0.01) {
      t.a.copy(a);
      t.b.copy(b);
      t.mesh.geometry.dispose();
      t.mesh.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a.clone(), c.clone(), b.clone()), 40, 0.45, 6, false);
    }
    t.mesh.material.uniforms.uTime.value = time;
    // many simultaneous tubes converge on one soul: share the light between them
    const crowd = Math.min(1, Math.sqrt(6 / Math.max(this.highlighted.size, 1)));
    t.mesh.material.uniforms.uLevel.value = lv * 0.7 * crowd;
  }

  private tmpCol = new THREE.Color();
  private va = new THREE.Vector3();
  private vb = new THREE.Vector3();
  private vc = new THREE.Vector3();
  private vp = new THREE.Vector3();
  private cacheA: THREE.Vector3[];
  private cacheB: THREE.Vector3[];

  update(time: number, dt: number) {
    const fade = 1 - Math.exp(-dt * 5);
    this.base += (this.baseTarget - this.base) * fade;
    const a = this.va;
    const b = this.vb;
    const c = this.vc;
    const p = this.vp;
    let si = 0;
    let geoDirty = false;
    const hiLevel = 0.55 + 0.45 * Math.min(1, Math.sqrt(6 / Math.max(this.highlighted.size, 1)));
    const col = this.tmpCol;
    for (let i = 0; i < this.bonds.length; i++) {
      const bond = this.bonds[i];
      const na = this.nodes.get(bond.a)!;
      const nb = this.nodes.get(bond.b)!;
      this.level[i] += (this.target[i] * Math.min(na.alpha, nb.alpha) - this.level[i]) * fade;
      const lv = this.level[i] * (this.highlighted.has(i) ? hiLevel : this.base);
      a.copy(na.position);
      b.copy(nb.position);
      control(a, b, c);
      const off = i * SEG * 2;
      if (lv < 0.002) {
        // collapsed: zero state so the fragment shader discards
        if (this.state[off] !== 0) this.state.fill(0, off, off + SEG * 2);
        continue;
      }
      // only re-tessellate arcs whose endpoints moved since we last drew them
      const ca = this.cacheA[i];
      const cb = this.cacheB[i];
      if (ca.distanceToSquared(a) > 1e-4 || cb.distanceToSquared(b) > 1e-4) {
        ca.copy(a);
        cb.copy(b);
        geoDirty = true;
        const P = this.pos;
        for (let k = 0; k <= SEG; k++) {
          bezier(a, c, b, k / SEG, p);
          if (k < SEG) {
            const o = (off + k * 2) * 3;
            P[o] = p.x;
            P[o + 1] = p.y;
            P[o + 2] = p.z;
          }
          if (k > 0) {
            const o = (off + k * 2 - 1) * 3;
            P[o] = p.x;
            P[o + 1] = p.y;
            P[o + 2] = p.z;
          }
        }
      }
      this.state.fill(lv, off, off + SEG * 2);

      if (this.highlighted.has(i)) {
        this.updateTube(i, a, c, b, lv, time);
        col.set(BONDS[bond.kind].color);
        const flip = bond.from === bond.b;
        for (let s = 0; s < 5 && si < 600; s++, si++) {
          let t = (time * 0.18 + s / 5 + i * 0.13) % 1;
          if (flip) t = 1 - t;
          bezier(a, c, b, t, p);
          const o = si * 3;
          this.sparkPos[o] = p.x;
          this.sparkPos[o + 1] = p.y;
          this.sparkPos[o + 2] = p.z;
          const fadeEnds = Math.sin(Math.PI * t) * lv;
          this.sparkCol[o] = col.r * fadeEnds;
          this.sparkCol[o + 1] = col.g * fadeEnds;
          this.sparkCol[o + 2] = col.b * fadeEnds;
        }
      }
    }
    this.sparkGeo.setDrawRange(0, si);
    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;
    const g = this.lines.geometry;
    if (geoDirty) g.attributes.position.needsUpdate = true;
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
