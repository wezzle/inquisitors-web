import * as THREE from 'three';
import { bookById, books, locations } from '../data/codex';
import { SERIES } from '../data/theme';
import type { Location } from '../data/types';
import { NOISE } from './glsl';
import { CHRONICLE } from './layouts';

const planetVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vP; varying vec3 vV;
  void main() {
    vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const planetFragment = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB; uniform float uSeed; uniform float uTime; uniform float uAlpha; uniform float uHover;
  varying vec3 vN; varying vec3 vP; varying vec3 vV;
  ${NOISE}
  void main() {
    vec3 p = normalize(vP);
    // latitude bands warped by noise: gas giants, ice worlds, hive-crusted rock
    float bands = sin(p.y * (6.0 + fract(uSeed) * 10.0) + fbm(p * 2.5 + uSeed) * 2.5);
    float n = fbm(p * 3.0 + vec3(uSeed, uTime * 0.02, 0.0));
    vec3 col = mix(uA, uB, smoothstep(-0.6, 0.8, bands * 0.6 + n));
    // hive-city lights on the night side
    vec3 L = normalize(vec3(0.6, 0.5, 0.6));
    float lit = max(dot(normalize(vN), normalize((viewMatrix * vec4(L, 0.0)).xyz)), 0.0);
    float cities = step(0.72, fract(sin(dot(floor(p * 40.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453)) * (1.0 - lit);
    vec3 c = col * (0.18 + 0.95 * lit) + vec3(1.0, 0.7, 0.35) * cities * 0.6;
    float rim = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
    c += uB * rim * 0.8;
    c *= 1.0 + uHover * 0.8;
    gl_FragColor = vec4(c, uAlpha);
  }
`;

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

const PALETTES: [string, string][] = [
  ['#2a3d5c', '#9fc3e8'], // ice
  ['#5a3a1e', '#e0b16a'], // desert
  ['#3b2c4a', '#c79ad8'], // warp-touched
  ['#23402f', '#8cc79a'], // verdant
  ['#4a2020', '#e07a5a'], // rust
  ['#3a3a40', '#c8c8d2'], // ash / hive
];

interface WorldMark {
  loc: Location;
  mesh: THREE.Mesh;
  first: number;
  base: number;
  hover: number;
  hoverTarget: number;
  mat?: THREE.ShaderMaterial;
}

/** Worlds, ships and places orbiting the Chronicle spire at the ring of the volume where they first appear. */
export class Worlds {
  readonly group = new THREE.Group();
  readonly marks: WorldMark[] = [];
  private threads: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private threadTop: number[] = [];
  fade = 0;
  target = 0;
  progress = Infinity;
  private threadProgress = NaN;
  private threadOrig?: Float32Array;

  /** Threads only climb as far as the reader has read: collapse segments leading to unread volumes. */
  private clipThreads() {
    this.threadProgress = this.progress;
    const pos = this.threads.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    this.threadOrig ??= arr.slice();
    for (let i = 0; i < this.threadTop.length; i++) {
      const hide = this.threadTop[i] > this.progress;
      arr[i * 3 + 1] = this.threadOrig[(hide ? i - (i % 2) : i) * 3 + 1];
    }
    pos.needsUpdate = true;
  }

  constructor(ringR: number) {
    const order = new Map(books.map((b, i) => [b.id, i]));
    const byRing = new Map<number, Location[]>();
    for (const l of locations) {
      const idx = l.books.map((b) => order.get(b) ?? -1).filter((i) => i >= 0);
      if (!idx.length) continue;
      const first = Math.min(...idx);
      if (!byRing.has(first)) byRing.set(first, []);
      byRing.get(first)!.push(l);
    }
    const tp: number[] = [];
    const tc: number[] = [];
    for (const [ring, list] of byRing) {
      list.forEach((loc, i) => {
        const a = THREE.MathUtils.degToRad(35 + (290 * (i + 0.5)) / list.length + ring * 11);
        const r = ringR + 60 + (i % 2) * 26;
        const y = CHRONICLE.ringY(ring);
        const h = hash(loc.id);
        let mesh: THREE.Mesh;
        let mat: THREE.ShaderMaterial | undefined;
        if (loc.type === 'planet' || loc.type === 'city') {
          const [ca, cb] = PALETTES[Math.floor(h * PALETTES.length)];
          mat = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
              uA: { value: new THREE.Color(ca) },
              uB: { value: new THREE.Color(cb) },
              uSeed: { value: h * 100 },
              uTime: { value: 0 },
              uAlpha: { value: 0 },
              uHover: { value: 0 },
            },
            vertexShader: planetVertex,
            fragmentShader: planetFragment,
          });
          mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(loc.type === 'city' ? 4.5 : 6 + h * 4, 5), mat);
          mesh.rotation.z = (h - 0.5) * 0.8;
        } else {
          const geo = loc.type === 'ship' ? new THREE.OctahedronGeometry(3.4, 0) : new THREE.TetrahedronGeometry(2.8, 0);
          mesh = new THREE.Mesh(
            geo,
            new THREE.MeshBasicMaterial({
              color: loc.type === 'ship' ? '#d8c9a3' : '#a08f74',
              wireframe: true,
              transparent: true,
              opacity: 0,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          if (loc.type === 'ship') mesh.scale.set(0.7, 0.7, 1.8);
        }
        mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        mesh.userData.loc = loc.id;
        this.group.add(mesh);
        this.marks.push({ loc, mesh, first: ring, base: mesh.scale.x, hover: 0, hoverTarget: 0, mat });

        // a dotted thread rising to every later volume that returns to this place
        const later = loc.books.map((b) => order.get(b) ?? -1).filter((k) => k > ring);
        const col = new THREE.Color(SERIES[bookById.get(books[ring].id)!.series].color);
        for (const k of later) {
          const y1 = CHRONICLE.ringY(k);
          for (let yy = y; yy < y1; yy += 8) {
            tp.push(mesh.position.x, yy, mesh.position.z, mesh.position.x, Math.min(yy + 4, y1), mesh.position.z);
            tc.push(col.r, col.g, col.b, col.r, col.g, col.b);
            this.threadTop.push(k, k);
          }
        }
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
    this.threads = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.group.add(this.threads);
  }

  /** Meshes that can currently be hovered or clicked. */
  pickable() {
    if (this.fade < 0.5) return [];
    return this.marks.filter((m) => m.first <= this.progress).map((m) => m.mesh);
  }

  setHover(id: string | null) {
    for (const m of this.marks) m.hoverTarget = m.loc.id === id ? 1 : 0;
  }

  update(t: number, dt: number) {
    const k = 1 - Math.exp(-dt * 3);
    this.fade += (this.target - this.fade) * k;
    this.group.visible = this.fade > 0.005;
    if (!this.group.visible) return;
    for (const m of this.marks) {
      m.hover += (m.hoverTarget - m.hover) * (1 - Math.exp(-dt * 8));
      const a = (m.first <= this.progress ? 1 : 0) * this.fade;
      m.mesh.visible = a > 0.01;
      m.mesh.rotation.y += dt * (0.15 + m.hover * 0.6);
      m.mesh.scale.setScalar(m.base * (1 + m.hover * 0.5));
      if (m.loc.type === 'ship') m.mesh.scale.z = m.base * 1.8 * (1 + m.hover * 0.5);
      if (m.mat) {
        m.mat.uniforms.uAlpha.value = a;
        m.mat.uniforms.uTime.value = t;
        m.mat.uniforms.uHover.value = m.hover;
      } else (m.mesh.material as THREE.MeshBasicMaterial).opacity = a * (0.55 + m.hover * 0.45);
    }
    this.threads.material.opacity = 0.35 * this.fade;
    if (this.progress !== this.threadProgress) this.clipThreads();
  }
}
