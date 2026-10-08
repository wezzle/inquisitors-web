import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const HQ = new URLSearchParams(location.search).has('hq');
/** Shared by every point-sprite material so sizes follow adaptive resolution. */
export const PIXEL_RATIO = { value: Math.min(window.devicePixelRatio, 2) };
export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Final grade: vignette, film grain, faint chromatic fringe and a warm "pict-feed" tone. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 1.0 },
    uWarp: { value: 0 },
    uDesat: { value: 0 },
    uTaint: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uWarp;
    uniform float uDesat;
    uniform float uTaint;
    uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      // warp shudder used by transitions
      uv += c * uWarp * 0.06 * sin(r2 * 40.0 - uTime * 8.0);
      float ca = 0.0012 + r2 * 0.004 + uWarp * 0.01;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca).b;
      // warm the shadows, cool the highlights very slightly
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(1.06, 0.98, 0.9), smoothstep(0.0, 0.4, 0.4 - l) * 0.6);
      // the pariah's null: colour drains from the world around an untouchable
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(lum) * vec3(0.92, 0.96, 1.04), uDesat * smoothstep(0.02, 0.35, r2 + 0.05));
      // warp taint: violet bleeding in from the edges while a daemon is in focus
      float edge = smoothstep(0.08, 0.45, r2);
      float flick = 0.75 + 0.25 * sin(uTime * 3.1 + vUv.y * 9.0) * sin(uTime * 1.7 + vUv.x * 7.0);
      col += vec3(0.32, 0.05, 0.28) * uTaint * edge * flick;
      // vignette
      float v = smoothstep(0.85, 0.15, r2 * 1.9 * uVignette);
      col *= mix(0.32, 1.0, v);
      // grain + faint scanline
      float g = hash(vUv * uRes + fract(uTime * 13.7)) - 0.5;
      col += g * 0.022;
      col *= 0.985 + 0.015 * sin(vUv.y * uRes.y * 1.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly labels: CSS2DRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  readonly grade: ShaderPass;
  readonly timer = new THREE.Timer();
  private tickers: ((t: number, dt: number) => void)[] = [];
  private flight: null | {
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
    dur: number;
    done?: () => void;
  } = null;
  warp = 0;
  /** 0..1 targets for the selection moods (blank → desaturate, daemon → warp taint). */
  desat = 0;
  taint = 0;
  private desatNow = 0;
  private taintNow = 0;

  constructor(host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);

    this.labels = new CSS2DRenderer();
    this.labels.setSize(window.innerWidth, window.innerHeight);
    this.labels.domElement.className = 'label-layer';
    host.appendChild(this.labels.domElement);

    this.scene.background = new THREE.Color('#030205');
    this.scene.fog = new THREE.FogExp2(0x050307, 0.0008);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 6000);
    this.camera.position.set(0, 140, 520);

    this.controls = new OrbitControls(this.camera, this.labels.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 1400;
    this.controls.autoRotateSpeed = 0.25;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.9;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.95, 0.6, 0.16);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());

    this.timer.connect(document);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    (this.grade.uniforms.uRes.value as THREE.Vector2).set(w, h);
  }

  onTick(fn: (t: number, dt: number) => void) {
    this.tickers.push(fn);
  }

  /** Smoothly fly the camera so that it looks at `target` from `pos`. */
  flyTo(pos: THREE.Vector3, target: THREE.Vector3, dur = 1.6, done?: () => void) {
    this.flight = {
      fromPos: this.camera.position.clone(),
      toPos: pos.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      t: 0,
      dur,
      done,
    };
  }

  get flying() {
    return this.flight !== null;
  }

  cancelFlight() {
    this.flight = null;
  }

  private perf = { acc: 0, frames: 0, level: 0 };
  /** Returns the unobstructed screen rect; the projection centre glides toward its middle. */
  freeArea: () => { x0: number; y0: number; x1: number; y1: number } = () => ({ x0: 0, y0: 0, x1: window.innerWidth, y1: window.innerHeight });
  private shift = { x: 0, y: 0, tx: 0, ty: 0, n: 0 };

  private updateShift(dt: number) {
    const s = this.shift;
    if (s.n++ % 10 === 0) {
      const a = this.freeArea();
      s.tx = window.innerWidth / 2 - (a.x0 + a.x1) / 2;
      s.ty = window.innerHeight / 2 - (a.y0 + a.y1) / 2;
    }
    const k = 1 - Math.exp(-dt * 3);
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Math.abs(s.x) < 0.5 && Math.abs(s.y) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, s.x, s.y, w, h);
  }

  /** Step render resolution down if the device can't hold ~40 fps (checked every 2 s). */
  private adapt(dt: number) {
    const p = this.perf;
    if (document.hidden || dt > 0.5 || HQ) return;
    p.acc += dt;
    p.frames++;
    if (p.acc < 2) return;
    const fps = p.frames / p.acc;
    p.acc = 0;
    p.frames = 0;
    if (fps < 40 && p.level < 2) {
      p.level++;
      const ratio = p.level === 1 ? Math.min(window.devicePixelRatio, 1.25) : 0.85;
      this.renderer.setPixelRatio(ratio);
      this.composer.setPixelRatio(ratio);
      PIXEL_RATIO.value = ratio;
      this.resize();
    }
  }

  start() {
    const loop = () => {
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.1);
      const t = this.timer.getElapsed();
      if (this.flight) {
        const f = this.flight;
        f.t += Math.min(this.timer.getDelta(), 0.25) / f.dur;
        const k = f.t >= 1 ? 1 : easeInOutCubic(f.t);
        // arc the path a little so long flights feel like a swoop rather than a slide
        const lift = Math.sin(Math.PI * k) * f.fromPos.distanceTo(f.toPos) * 0.12;
        this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
        this.camera.position.y += lift;
        this.controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
        if (f.t >= 1) {
          this.flight = null;
          f.done?.();
        }
      }
      this.adapt(this.timer.getDelta());
      this.updateShift(dt);
      for (const fn of this.tickers) fn(t, dt);
      this.controls.update();
      this.grade.uniforms.uTime.value = t;
      this.grade.uniforms.uWarp.value = REDUCED_MOTION ? 0 : this.warp;
      const k = 1 - Math.exp(-dt * 2.5);
      this.desatNow += (this.desat - this.desatNow) * k;
      this.taintNow += (this.taint - this.taintNow) * k;
      this.grade.uniforms.uDesat.value = this.desatNow;
      this.grade.uniforms.uTaint.value = this.taintNow;
      this.composer.render();
      this.labels.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
