import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { books, characters } from '../data/codex';
import { FACTIONS, FACTION_ORDER, SERIES, SERIES_ORDER } from '../data/theme';
import { CHRONICLE, factionCentre, layouts, SERIES_ANCHOR, type LayoutId } from './layouts';
import type { SoulNode } from './nodes';

function label(html: string, cls: string) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  return o;
}

function circle(r: number, seg = 256, dashed = false) {
  const pts: number[] = [];
  for (let i = 0; i < seg; i++) {
    if (dashed && i % 3 === 2) continue;
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** Mode-specific scaffolding: book rings & lifelines (chronicle), faction halos (allegiance), series sigils (web). */
export class Decor {
  readonly group = new THREE.Group();
  private fades: Record<LayoutId, number> = { web: 0, chronicle: 0, allegiance: 0 };
  private targets: Record<LayoutId, number> = { web: 1, chronicle: 0, allegiance: 0 };
  private parts: Record<LayoutId, { objs: THREE.Object3D[]; mats: { m: THREE.Material & { opacity: number }; o: number }[]; labels: CSS2DObject[] }> = {
    web: { objs: [], mats: [], labels: [] },
    chronicle: { objs: [], mats: [], labels: [] },
    allegiance: { objs: [], mats: [], labels: [] },
  };
  private life: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private lifeOwner: number[] = [];
  private lifeAlpha: Float32Array;
  private lifeBase: number[] = [];
  private lifeTop: number[] = [];
  private beadRing: number[] = [];
  private bookMats: { idx: number; mats: (THREE.Material & { opacity: number })[] }[] = [];
  /** Index of the last book the reader has finished; later rings and lifelines stay dark. */
  progress = Infinity;
  private beads: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private beadOwner: number[] = [];
  private beadCol: Float32Array;
  private beadBase: THREE.Color[] = [];
  private bookLabels: CSS2DObject[] = [];
  readonly spine: THREE.Mesh;

  constructor(private nodes: Map<string, SoulNode>) {
    // ---------- WEB: series sigils
    for (const s of SERIES_ORDER) {
      const meta = SERIES[s];
      const a = SERIES_ANCHOR[s];
      const ring = new THREE.LineSegments(
        circle(120, 192, true),
        new THREE.LineBasicMaterial({ color: meta.color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      ring.position.set(a.x * 1.05, -70, a.z * 1.05);
      this.add('web', ring, 0.22);
      const l = label(`<span class="num">${meta.numeral}</span><span class="nm">${meta.label}</span><span class="sub">${meta.sub}</span>`, 'region-label');
      l.element.style.setProperty('--sc', meta.color);
      l.position.set(a.x * 1.6, -40, a.z * 1.6);
      this.addLabel('web', l);
    }

    // ---------- CHRONICLE: a ring per book, a central spine, lifelines and beads
    const lay = layouts().chronicle;
    let maxR = 0;
    for (const v of lay.values()) maxR = Math.max(maxR, Math.hypot(v.x, v.z));
    const ringR = maxR + 26;
    books.forEach((bk, i) => {
      const y = CHRONICLE.ringY(i);
      const col = SERIES[bk.series].color;
      const short = bk.kind === 'short';
      const ring = new THREE.LineSegments(
        circle(short ? ringR * 0.86 : ringR, 256, short),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      ring.position.y = y;
      this.add('chronicle', ring, short ? 0.35 : 0.6);
      const disc = new THREE.Mesh(
        new THREE.RingGeometry(10, short ? ringR * 0.86 : ringR, 96, 1),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = y;
      this.add('chronicle', disc, short ? 0.015 : 0.035);
      this.bookMats.push({ idx: i, mats: [ring.material, disc.material] });
      const l = label(
        `<span class="yr">${bk.year}</span><span class="nm">${bk.title}</span>${short ? '<span class="sub">short story</span>' : ''}`,
        `book-label ${short ? 'short' : ''}`,
      );
      l.element.style.setProperty('--sc', col);
      l.element.dataset.book = bk.id;
      l.position.set(ringR + 8, y, 0);
      this.addLabel('chronicle', l);
      l.center.set(0, 0.5);
      this.bookLabels.push(l);
    });
    this.spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, CHRONICLE.height + 80, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: '#f5d48a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.spine.position.y = CHRONICLE.bottom + CHRONICLE.height / 2;
    this.add('chronicle', this.spine, 0.35);

    const lp: number[] = [];
    const bp: number[] = [];
    const lc: number[] = [];
    characters.forEach((c, ci) => {
      const p = lay.get(c.id)!;
      const idx = c.books.map((b) => books.findIndex((x) => x.id === b)).filter((x) => x >= 0).sort((a, b) => a - b);
      if (!idx.length) return;
      const col = new THREE.Color(FACTIONS[c.faction].color);
      for (let k = idx[0]; k < idx[idx.length - 1]; k++) {
        const present = idx.includes(k) && idx.includes(k + 1);
        lp.push(p.x, CHRONICLE.ringY(k), p.z, p.x, CHRONICLE.ringY(k + 1), p.z);
        for (let e = 0; e < 2; e++) {
          this.lifeOwner.push(ci);
          this.lifeBase.push(present ? 0.55 : 0.12);
          this.lifeTop.push(k + 1);
          lc.push(col.r, col.g, col.b);
        }
      }
      for (const k of idx) {
        bp.push(p.x, CHRONICLE.ringY(k), p.z);
        this.beadOwner.push(ci);
        this.beadRing.push(k);
        this.beadBase.push(col);
      }
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lg.setAttribute('aColor', new THREE.Float32BufferAttribute(lc, 3));
    this.lifeAlpha = new Float32Array(this.lifeOwner.length);
    lg.setAttribute('aAlpha', new THREE.BufferAttribute(this.lifeAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.life = new THREE.LineSegments(
      lg,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute vec3 aColor; attribute float aAlpha; varying vec3 vC; varying float vA;
          void main() { vC = aColor; vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vC; varying float vA;
          void main() { if (vA < 0.003) discard; gl_FragColor = vec4(vC, vA); }
        `,
      }),
    );
    this.life.frustumCulled = false;
    this.group.add(this.life);
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    this.beadCol = new Float32Array(this.beadOwner.length * 3);
    bg.setAttribute('color', new THREE.BufferAttribute(this.beadCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.beads = new THREE.Points(
      bg,
      new THREE.PointsMaterial({ size: 4, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTexture() }),
    );
    this.beads.frustumCulled = false;
    this.group.add(this.beads);

    // ---------- ALLEGIANCE: halo discs + labels per faction
    FACTION_ORDER.forEach((f, i) => {
      const centre = factionCentre(i);
      const n = characters.filter((c) => c.faction === f).length;
      if (!n) return;
      const r = 26 + 13 * Math.sqrt(n) * 1.2;
      const ring = new THREE.LineSegments(
        circle(r, 160, true),
        new THREE.LineBasicMaterial({ color: FACTIONS[f].color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      ring.position.set(centre.x, centre.y - r * 0.85, centre.z);
      this.add('allegiance', ring, 0.35);
      const l = label(`<span class="nm">${FACTIONS[f].label}</span><span class="sub">${FACTIONS[f].blurb} · ${n}</span>`, 'region-label faction');
      l.element.style.setProperty('--sc', FACTIONS[f].color);
      l.position.set(centre.x * 1.08, centre.y + r + 12, centre.z * 1.08);
      this.addLabel('allegiance', l);
    });
  }

  private add(mode: LayoutId, obj: THREE.Object3D, opacity: number) {
    const m = (obj as THREE.Mesh).material as THREE.Material & { opacity: number };
    this.parts[mode].objs.push(obj);
    this.parts[mode].mats.push({ m, o: opacity });
    obj.visible = false;
    this.group.add(obj);
  }

  private addLabel(mode: LayoutId, l: CSS2DObject) {
    this.parts[mode].labels.push(l);
    l.element.style.opacity = '0';
    l.visible = false;
    this.group.add(l);
  }

  setMode(mode: LayoutId) {
    for (const k of Object.keys(this.targets) as LayoutId[]) this.targets[k] = k === mode ? 1 : 0;
  }

  private sizes = new Map<CSS2DObject, [number, number]>();

  /** Screen rectangles of the mode titles currently on show, so soul labels can steer clear of them. */
  labelBoxes(cam: THREE.Camera, W: number, H: number) {
    const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const v = new THREE.Vector3();
    for (const mode of Object.keys(this.parts) as LayoutId[]) {
      if (this.fades[mode] < 0.3) continue;
      for (const l of this.parts[mode].labels) {
        let s = this.sizes.get(l);
        if (!s || !s[0]) {
          s = [l.element.offsetWidth, l.element.offsetHeight];
          this.sizes.set(l, s);
        }
        l.getWorldPosition(v).project(cam);
        if (v.z > 1) continue;
        const x = ((v.x + 1) / 2) * W - l.center.x * s[0];
        const y = ((1 - v.y) / 2) * H - l.center.y * s[1];
        out.push({ x0: x, y0: y, x1: x + s[0], y1: y + s[1] });
      }
    }
    return out;
  }

  /** Book ids to emphasise on the chronicle (null = all). */
  activeBooks: Set<string> | null = null;

  /** 0..1: how far the scaffolding recedes while a soul is selected. */
  dim = 0;
  private dimNow = 0;

  update(dt: number) {
    const k = 1 - Math.exp(-dt * 3);
    this.dimNow += (this.dim - this.dimNow) * k;
    const keep = 1 - 0.7 * this.dimNow;
    for (const mode of Object.keys(this.fades) as LayoutId[]) {
      const f = (this.fades[mode] += (this.targets[mode] - this.fades[mode]) * k);
      const part = this.parts[mode];
      const vis = f > 0.005;
      part.objs.forEach((o, i) => {
        o.visible = vis;
        part.mats[i].m.opacity = part.mats[i].o * f * keep;
      });
      part.labels.forEach((l) => {
        l.visible = vis;
        l.element.style.opacity = (f * keep).toFixed(3);
      });
    }
    for (const b of this.bookMats) if (b.idx > this.progress) b.mats.forEach((m) => (m.opacity *= 0.25));
    for (const l of this.bookLabels) {
      const on = !this.activeBooks || this.activeBooks.has(l.element.dataset.book!);
      l.element.classList.toggle('dim', !on);
    }
    const cf = this.fades.chronicle;
    this.life.visible = this.beads.visible = cf > 0.005;
    if (!this.life.visible) return;
    const nodeArr = characters.map((c) => this.nodes.get(c.id)!);
    for (let i = 0; i < this.lifeOwner.length; i++) {
      const n = nodeArr[this.lifeOwner[i]];
      this.lifeAlpha[i] = (this.lifeTop[i] > this.progress ? 0 : this.lifeBase[i]) * cf * n.alpha * (0.1 + 0.9 * n.emphasis) * (1 + n.hover);
    }
    this.life.geometry.attributes.aAlpha.needsUpdate = true;
    for (let i = 0; i < this.beadOwner.length; i++) {
      const n = nodeArr[this.beadOwner[i]];
      const a = this.beadRing[i] > this.progress ? 0 : cf * n.alpha * (0.1 + 0.9 * n.emphasis);
      const c = this.beadBase[i];
      this.beadCol.set([c.r * a, c.g * a, c.b * a], i * 3);
    }
    this.beads.geometry.attributes.color.needsUpdate = true;
  }
}

function dotTexture() {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d')!;
  g.strokeStyle = 'white';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'white';
  g.beginPath();
  g.arc(s / 2, s / 2, 7, 0, Math.PI * 2);
  g.fill();
  return new THREE.CanvasTexture(cv);
}
