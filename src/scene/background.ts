import * as THREE from 'three';
import { NOISE, NOISE_LITE } from './glsl';
import { PIXEL_RATIO } from './stage';

/** The Immaterium backdrop: nebula shell, star field, drifting motes and a slow astrolabe of gilded rings. */
export class Backdrop {
  readonly group = new THREE.Group();
  private nebula: THREE.ShaderMaterial;
  private stars: THREE.ShaderMaterial;
  private motes: THREE.ShaderMaterial;
  private rings: THREE.Group;
  /** 0..1 how agitated the warp is (rises during transitions / daemon selection). */
  turmoil = 0;
  tint = new THREE.Color('#000000');

  constructor() {
    this.nebula = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTime: { value: 0 }, uTurmoil: { value: 0 }, uTint: { value: this.tint } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uTurmoil;
        uniform vec3 uTint;
        varying vec3 vDir;
        ${NOISE}
        ${NOISE_LITE}
        void main() {
          vec3 d = normalize(vDir);
          float t = uTime * 0.012;
          vec3 q = d * 1.6 + vec3(t, -t * 0.6, t * 0.3);
          float warpN = fbm(q + fbm3(q * 1.7 + t) * (0.9 + uTurmoil * 0.8));
          float clouds = smoothstep(-0.15, 0.85, warpN);
          float veins = pow(1.0 - abs(snoise(d * 4.0 + warpN * 2.0 + t * 2.0)), 9.0);
          // palette: void black -> bruise violet -> blood -> tarnished gold veins
          vec3 col = vec3(0.006, 0.004, 0.012);
          col = mix(col, vec3(0.085, 0.022, 0.11), clouds);
          col = mix(col, vec3(0.16, 0.03, 0.04), smoothstep(0.45, 1.0, clouds) * 0.8);
          col += vec3(0.5, 0.33, 0.12) * veins * clouds * 0.22;
          col += uTint * clouds * 0.25;
          // a dim band of galactic light along the ecliptic
          float band = exp(-pow(d.y * 3.2 + warpN * 0.5, 2.0));
          col += vec3(0.07, 0.05, 0.06) * band;
          col *= (0.5 + uTurmoil * 0.5);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(3200, 64, 32), this.nebula);
    shell.renderOrder = -10;
    this.group.add(shell);

    // stars
    const N = 7000;
    const pos = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const v = randomDir().multiplyScalar(1400 + Math.random() * 1500);
      pos.set([v.x, v.y, v.z], i * 3);
      size[i] = Math.pow(Math.random(), 6) * 9 + 1.2;
      seed[i] = Math.random() * 100;
      const k = Math.random();
      c.set(k < 0.6 ? '#fff2d9' : k < 0.85 ? '#ffd29a' : k < 0.95 ? '#a9c6ff' : '#ff9c8a');
      col.set([c.r, c.g, c.b], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    sg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    sg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: { uTime: { value: 0 }, uPixel: PIXEL_RATIO },
      vertexShader: /* glsl */ `
        attribute float aSize; attribute float aSeed; attribute vec3 aColor;
        uniform float uTime; uniform float uPixel;
        varying vec3 vColor; varying float vTw;
        void main() {
          vColor = aColor;
          vTw = 0.55 + 0.45 * sin(uTime * (0.6 + fract(aSeed) * 2.4) + aSeed);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixel;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying float vTw;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float core = smoothstep(0.5, 0.0, d);
          float cross = max(smoothstep(0.06, 0.0, abs(p.x)), smoothstep(0.06, 0.0, abs(p.y))) * smoothstep(0.5, 0.1, d);
          float a = pow(core, 3.0) + cross * 0.35;
          gl_FragColor = vec4(vColor * vTw, a * vTw);
        }
      `,
    });
    this.group.add(new THREE.Points(sg, this.stars));

    // motes: drifting embers / incense dust around the web
    const M = 1600;
    const mp = new Float32Array(M * 3);
    const ms = new Float32Array(M);
    for (let i = 0; i < M; i++) {
      const v = randomDir().multiplyScalar(Math.cbrt(Math.random()) * 520);
      v.y *= 0.55;
      mp.set([v.x, v.y, v.z], i * 3);
      ms[i] = Math.random() * 100;
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    mg.setAttribute('aSeed', new THREE.BufferAttribute(ms, 1));
    this.motes = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixel: PIXEL_RATIO },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uPixel;
        varying float vA;
        void main() {
          vec3 p = position;
          float t = uTime * 0.05 + aSeed;
          p += vec3(sin(t * 1.3), sin(t * 0.7 + 2.0) * 0.6 + uTime * 0.0, cos(t * 1.1)) * 14.0;
          p.y += mod(uTime * (1.5 + fract(aSeed * 7.0) * 3.0) + aSeed * 40.0, 300.0) - 150.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;
          gl_PointSize = uPixel * (1.0 + fract(aSeed * 3.1) * 2.5) * (300.0 / max(dist, 1.0));
          vA = smoothstep(1400.0, 200.0, dist) * (0.25 + 0.5 * fract(aSeed * 13.7)) * smoothstep(150.0, 110.0, abs(mod(uTime * (1.5 + fract(aSeed * 7.0) * 3.0) + aSeed * 40.0, 300.0) - 150.0));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.38) * a, a * vA);
        }
      `,
    });
    this.group.add(new THREE.Points(mg, this.motes));

    this.rings = buildAstrolabe();
    this.group.add(this.rings);
  }

  update(t: number) {
    this.nebula.uniforms.uTime.value = t;
    this.nebula.uniforms.uTurmoil.value = this.turmoil;
    this.stars.uniforms.uTime.value = t;
    this.motes.uniforms.uTime.value = t;
    this.rings.children.forEach((holder, i) => {
      holder.children[0].rotation.z = t * 0.01 * (i % 2 ? -1 : 1) * (1 + i * 0.3);
    });
  }
}

function randomDir() {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
}

/** Concentric, tick-marked rings, like the brass dials of an orrery seen in the dark. */
function buildAstrolabe() {
  const g = new THREE.Group();
  const specs = [
    { r: 560, ticks: 360, major: 30, tilt: [Math.PI / 2, 0, 0], op: 0.16 },
    { r: 610, ticks: 120, major: 10, tilt: [Math.PI / 2 + 0.22, 0.1, 0], op: 0.1 },
    { r: 700, ticks: 72, major: 6, tilt: [Math.PI / 2 - 0.35, -0.2, 0], op: 0.07 },
  ];
  for (const s of specs) {
    const pts: number[] = [];
    const seg = 512;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      pts.push(Math.cos(a0) * s.r, Math.sin(a0) * s.r, 0, Math.cos(a1) * s.r, Math.sin(a1) * s.r, 0);
    }
    for (let i = 0; i < s.ticks; i++) {
      const a = (i / s.ticks) * Math.PI * 2;
      const len = i % s.major === 0 ? 22 : 7;
      pts.push(Math.cos(a) * s.r, Math.sin(a) * s.r, 0, Math.cos(a) * (s.r - len), Math.sin(a) * (s.r - len), 0);
    }
    // inner companion ring
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const r = s.r - 26;
      if (i % 4 < 2) pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: '#c99a4b',
      transparent: true,
      opacity: s.op,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const ring = new THREE.LineSegments(geo, mat);
    const holder = new THREE.Group();
    holder.rotation.set(s.tilt[0], s.tilt[1], s.tilt[2]);
    holder.add(ring);
    g.add(holder);
  }
  return g;
}
