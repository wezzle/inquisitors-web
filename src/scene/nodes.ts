import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { FACTIONS, STATUS } from '../data/theme';
import type { Character } from '../data/types';
import { NOISE } from './glsl';
import { easeInOutCubic, PIXEL_RATIO } from './stage';

function radialTexture(stops: [number, string][], size = 256) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, c] of stops) grd.addColorStop(o, c);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const GLOW = radialTexture([
  [0, 'rgba(255,255,255,1)'],
  [0.12, 'rgba(255,255,255,0.55)'],
  [0.35, 'rgba(255,255,255,0.12)'],
  [1, 'rgba(255,255,255,0)'],
]);
const VOID = radialTexture([
  [0, 'rgba(0,0,0,1)'],
  [0.4, 'rgba(0,0,0,0.85)'],
  [0.7, 'rgba(0,0,0,0.35)'],
  [1, 'rgba(0,0,0,0)'],
]);
const RIM = (() => {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size * 0.3);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.5, 'rgba(230,240,255,0.9)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
})();

const SPHERE = new THREE.IcosahedronGeometry(1, 5);
const HIT = new THREE.SphereGeometry(1, 10, 8);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

const coreVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main() {
    vP = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const coreFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uTime; uniform float uSeed; uniform float uAlpha;
  uniform float uGlow; uniform float uPsy; uniform float uDead; uniform float uHover;
  varying vec3 vN; varying vec3 vV; varying vec3 vP;
  ${NOISE}
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.2);
    float speed = uPsy > 0.5 ? 0.6 : 0.18;
    float n = fbm(vP * 1.8 + vec3(uSeed, uTime * speed, -uTime * speed * 0.7));
    vec3 base = uColor;
    vec3 col;
    if (uPsy > 2.5) {
      // blank: a hole in the world, rimmed in cold light
      col = vec3(0.0) + vec3(0.75, 0.85, 1.0) * pow(fres, 1.6) * 1.6;
      col += vec3(0.05) * n;
    } else {
      float lum = 0.35 + 0.65 * smoothstep(-0.4, 0.7, n);
      col = base * lum * 0.85 + base * fres * 1.9 + vec3(1.0, 0.95, 0.85) * pow(max(n, 0.0), 3.0) * 0.6;
      if (uPsy > 1.5) {
        // daemon: boiling surface with a violet-red heart
        float b = smoothstep(0.1, 0.6, snoise(vP * 3.0 + vec3(0.0, -uTime * 1.6, uSeed)));
        col = mix(col, vec3(1.0, 0.25, 0.35) * 1.6, b * 0.6);
      }
    }
    if (uDead > 0.5) {
      float l = dot(col, vec3(0.3, 0.59, 0.11));
      col = mix(col, vec3(l) * vec3(0.9, 0.82, 0.75), 0.55) * 0.6;
      // embers in the cracks
      float crack = 1.0 - smoothstep(0.0, 0.05, abs(snoise(vP * 2.4 + uSeed)));
      col += vec3(1.0, 0.45, 0.15) * crack * 0.9;
    }
    col *= mix(0.25, 1.0, uGlow) * (1.0 + uHover * 0.6);
    gl_FragColor = vec4(col, uAlpha);
  }
`;

const sparkVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime; uniform float uR; uniform float uMode; uniform float uPixel;
  varying float vA;
  void main() {
    float s = aSeed;
    vec3 p;
    if (uMode < 1.5) {
      // psyker: motes swirling on inclined orbits
      float sp = 0.6 + fract(s * 7.31) * 1.4;
      float a = uTime * sp + s * 6.2831;
      float inc = fract(s * 3.17) * 3.1415;
      float r = uR * (1.5 + fract(s * 5.1) * 1.2);
      p = vec3(cos(a) * r, sin(a) * r * cos(inc), sin(a) * r * sin(inc));
      vA = 0.5 + 0.5 * sin(uTime * 3.0 + s * 40.0);
    } else {
      // daemon: embers boiling upward
      float life = fract(uTime * (0.25 + fract(s * 9.1) * 0.35) + s);
      float a = s * 6.2831 * 3.0;
      float r = uR * (0.7 + fract(s * 4.7) * 0.9) * (1.0 + life * 0.6);
      p = vec3(cos(a + life * 2.0) * r, -uR * 0.5 + life * uR * 4.5, sin(a + life * 2.0) * r);
      vA = sin(life * 3.1415);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPixel * (uMode < 1.5 ? 2.6 : 3.4) * (260.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * a * 1.5, a * vA * uAlpha);
  }
`;

export class SoulNode {
  readonly group = new THREE.Group();
  readonly core: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>;
  readonly hit: THREE.Mesh;
  readonly halo: THREE.Sprite;
  readonly label: CSS2DObject;
  readonly labelEl: HTMLDivElement;
  readonly radius: number;
  private relEl: HTMLElement;
  /** 0..1 fade applied when the camera gets too close, so foreground souls don't smother the view. */
  near = 1;
  private rim?: THREE.Sprite;
  private rings: THREE.Mesh[] = [];
  private sparks?: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private haloBase: number;

  // animation state
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private t = 1;
  private delay = 0;
  private dur = 1.6;
  vis = 1;
  alpha = 0;
  emphasis = 1;
  emphasisTarget = 1;
  hover = 0;
  hoverTarget = 0;
  labelKey = '';

  constructor(readonly c: Character) {
    const color = new THREE.Color(FACTIONS[c.faction].color);
    this.radius = 2 + c.importance * 1.35;
    const psy = c.psy === 'psyker' ? 1 : c.psy === 'daemon' ? 2 : c.psy === 'blank' ? 3 : 0;

    this.core = new THREE.Mesh(
      SPHERE,
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uSeed: { value: Math.random() * 50 },
          uAlpha: { value: 1 },
          uGlow: { value: 1 },
          uPsy: { value: psy },
          uDead: { value: c.status === 'dead' ? 1 : 0 },
          uHover: { value: 0 },
        },
        vertexShader: coreVertex,
        fragmentShader: coreFragment,
      }),
    );
    this.core.scale.setScalar(this.radius);
    this.group.add(this.core);

    const blank = c.psy === 'blank';
    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: blank ? VOID : GLOW,
        color: blank ? 0x000000 : color,
        transparent: true,
        depthWrite: false,
        blending: blank ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    );
    this.haloBase = this.radius * (blank ? 9 : 6.5);
    this.halo.scale.setScalar(this.haloBase);
    this.halo.renderOrder = blank ? 2 : 1;
    this.group.add(this.halo);
    if (blank) {
      this.rim = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: RIM, color: 0xdfe9ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      this.rim.scale.setScalar(this.radius * 7);
      this.group.add(this.rim);
    }

    if (c.importance >= 4) {
      const n = c.importance === 5 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(this.radius * (1.9 + i * 0.45), 0.09 + (c.importance - 4) * 0.05, 6, 128),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        this.rings.push(ring);
        this.group.add(ring);
      }
    }

    if (psy === 1 || psy === 2) {
      const N = psy === 1 ? 28 + c.importance * 8 : 70;
      const geo = new THREE.BufferGeometry();
      const seeds = new Float32Array(N);
      for (let i = 0; i < N; i++) seeds[i] = Math.random();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      this.sparks = new THREE.Points(
        geo,
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uR: { value: this.radius },
            uMode: { value: psy },
            uColor: { value: new THREE.Color(psy === 1 ? '#9fc4ff' : '#ff5a8a') },
            uAlpha: { value: 1 },
            uPixel: PIXEL_RATIO,
          },
          vertexShader: sparkVertex,
          fragmentShader: sparkFragment,
        }),
      );
      this.sparks.frustumCulled = false;
      this.group.add(this.sparks);
    }

    this.hit = new THREE.Mesh(HIT, HIT_MAT);
    this.hit.scale.setScalar(Math.max(this.radius * 1.7, 7));
    this.hit.userData.id = c.id;
    this.group.add(this.hit);

    this.labelEl = document.createElement('div');
    this.labelEl.className = `soul-label imp-${c.importance} fac-${c.faction}`;
    this.labelEl.dataset.id = c.id;
    const mark = STATUS[c.status].mark;
    this.labelEl.innerHTML = `<span class="rel"></span><span class="nm">${c.name}</span>${mark ? `<span class="mk" data-spoiler>${mark}</span>` : ''}<span class="tt">${c.title}</span>`;
    this.relEl = this.labelEl.querySelector('.rel')!;
    this.labelEl.style.setProperty('--fc', FACTIONS[c.faction].color);
    this.label = new CSS2DObject(this.labelEl);
    this.label.position.set(0, this.radius + 4, 0);
    this.label.center.set(0.5, 1);
    this.group.add(this.label);
  }

  labelBelow = false;
  private labelDx = 0;

  /** Horizontal nudge in px (CSS translate composes with CSS2DRenderer's own transform). */
  setLabelShift(dx: number) {
    const r = Math.round(dx);
    if (r === this.labelDx) return;
    this.labelDx = r;
    this.labelEl.style.translate = r ? `${r}px 0` : '';
  }

  /** Hang the label beneath the soul instead of above it (used to dodge collisions). */
  setLabelBelow(below: boolean) {
    if (below === this.labelBelow) return;
    this.labelBelow = below;
    this.label.position.y = below ? -(this.radius + 4) : this.radius + 4;
    this.label.center.set(0.5, below ? 0 : 1);
  }

  /** Small role tag above the name, e.g. "Master" while a neighbour is selected. */
  setRole(text: string, color = '') {
    if (this.relEl.textContent === text) return;
    this.relEl.textContent = text;
    this.relEl.style.color = color;
    this.labelEl.classList.toggle('has-rel', !!text);
  }

  get position() {
    return this.group.position;
  }

  moveTo(p: THREE.Vector3, delay = 0, dur = 1.8) {
    this.from.copy(this.group.position);
    this.to.copy(p);
    this.t = 0;
    this.delay = delay;
    this.dur = dur;
  }

  place(p: THREE.Vector3) {
    this.group.position.copy(p);
    this.to.copy(p);
    this.t = 1;
  }

  get moving() {
    return this.t < 1;
  }

  update(time: number, dt: number) {
    if (this.t < 1) {
      if (this.delay > 0) this.delay -= dt;
      else {
        this.t = Math.min(1, this.t + dt / this.dur);
        const k = easeInOutCubic(this.t);
        this.group.position.lerpVectors(this.from, this.to, k);
        // a gentle outward bulge so paths sweep rather than collide through the centre
        const bulge = Math.sin(Math.PI * k) * 0.18;
        this.group.position.x += this.group.position.x * bulge;
        this.group.position.z += this.group.position.z * bulge;
      }
    }
    const fade = 1 - Math.exp(-dt * 6);
    this.alpha += (this.vis - this.alpha) * fade;
    this.emphasis += (this.emphasisTarget - this.emphasis) * fade;
    this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-dt * 10));

    const visible = this.alpha > 0.01;
    this.group.visible = visible;
    if (!visible) return;
    const a = this.alpha * this.near;
    const e = this.emphasis;
    const u = this.core.material.uniforms;
    u.uTime.value = time;
    u.uAlpha.value = a * (0.3 + 0.7 * Math.min(e, 1));
    u.uGlow.value = e;
    u.uHover.value = this.hover;
    const pulse = 1 + Math.sin(time * 1.3 + this.radius) * 0.04;
    this.core.scale.setScalar(this.radius * (1 + this.hover * 0.18) * pulse);
    const hm = this.halo.material;
    hm.opacity = a * (this.c.psy === 'blank' ? 0.85 : 0.22 + this.c.importance * 0.07) * (0.2 + 0.8 * e) * (1 + this.hover * 0.6);
    this.halo.scale.setScalar(this.haloBase * (0.85 + 0.15 * e) * (1 + this.hover * 0.25) * pulse);
    if (this.rim) {
      this.rim.material.opacity = a * (0.3 + 0.7 * e) * (0.75 + 0.25 * Math.sin(time * 2.0));
      this.rim.material.rotation = time * 0.2;
    }
    this.rings.forEach((r, i) => {
      r.rotation.x += dt * (0.12 + i * 0.07);
      r.rotation.y += dt * (0.09 - i * 0.05);
      (r.material as THREE.MeshBasicMaterial).opacity = a * 0.55 * (0.15 + 0.85 * e);
    });
    if (this.sparks) {
      this.sparks.material.uniforms.uTime.value = time;
      this.sparks.material.uniforms.uAlpha.value = a * (0.15 + 0.85 * e);
    }
  }
}
