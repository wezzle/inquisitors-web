import * as THREE from 'three';
import { bonds, bondsOf, bookById, books, characters, charById, other, roleOf } from '../data/codex';
import { spoilers } from '../ui/spoilers';
import type { BondKind, Faction } from '../data/types';
import { BONDS, BOND_ORDER, FACTION_ORDER } from '../data/theme';
import { drawSeal } from '../ui/sigils';
import { Backdrop } from './background';
import { Decor } from './decor';
import { layouts, type LayoutId } from './layouts';
import { BondWeb } from './links';
import { SoulNode } from './nodes';
import type { Stage } from './stage';

export interface Filters {
  books: Set<string>;
  factions: Set<Faction>;
  bonds: Set<BondKind>;
  minImportance: number;
}

const VIEWS: Record<LayoutId, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  web: { pos: new THREE.Vector3(40, 250, 600), target: new THREE.Vector3(0, -10, 0) },
  chronicle: { pos: new THREE.Vector3(560, 290, 540), target: new THREE.Vector3(0, -10, 0) },
  allegiance: { pos: new THREE.Vector3(0, 430, 520), target: new THREE.Vector3(0, -20, 0) },
};

export class World {
  readonly nodes = new Map<string, SoulNode>();
  readonly backdrop = new Backdrop();
  readonly web: BondWeb;
  readonly decor: Decor;
  layout: LayoutId = 'web';
  selected: string | null = null;
  hovered: string | null = null;
  query: Set<string> | null = null;
  filters: Filters = {
    books: new Set(books.map((b) => b.id)),
    factions: new Set(FACTION_ORDER),
    bonds: new Set(BOND_ORDER),
    minImportance: 1,
  };
  onSelect: (id: string | null) => void = () => {};
  onHover: (id: string | null, ev?: PointerEvent) => void = () => {};
  onBook: (id: string) => void = () => {};
  private seal: THREE.Sprite;
  private sealTex = new Map<string, THREE.Texture>();
  private sealAlpha = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hits: THREE.Object3D[] = [];
  private lastInteraction = performance.now();
  private downAt: { x: number; y: number } | null = null;
  autoRotate = true;

  constructor(private stage: Stage) {
    stage.scene.add(this.backdrop.group);
    for (const c of characters) {
      const n = new SoulNode(c);
      this.nodes.set(c.id, n);
      stage.scene.add(n.group);
      this.hits.push(n.hit);
    }
    this.web = new BondWeb(bonds, this.nodes);
    stage.scene.add(this.web.group);
    this.decor = new Decor(this.nodes);
    stage.scene.add(this.decor.group);

    this.seal = new THREE.Sprite(
      new THREE.SpriteMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
    );
    this.seal.renderOrder = -1;
    stage.scene.add(this.seal);

    const lay = layouts().web;
    for (const n of this.nodes.values()) n.place(lay.get(n.c.id)!.clone().multiplyScalar(0.02));
    this.applySpoilers();

    const dom = stage.labels.domElement;
    dom.addEventListener('pointermove', (e) => this.pointerMove(e));
    dom.addEventListener('pointerdown', (e) => {
      this.downAt = { x: e.clientX, y: e.clientY };
      this.touch();
    });
    dom.addEventListener('pointerup', (e) => this.pointerUp(e));
    dom.addEventListener('wheel', () => this.touch(), { passive: true });
    stage.controls.addEventListener('start', () => {
      this.touch();
      stage.cancelFlight();
    });

    stage.onTick((t, dt) => this.tick(t, dt));
  }

  /** Initial reveal: souls bloom outward from the centre into the web. */
  reveal() {
    const lay = layouts().web;
    for (const n of this.nodes.values()) {
      const p = lay.get(n.c.id)!;
      n.moveTo(p, 0.2 + (5 - n.c.importance) * 0.18 + Math.random() * 0.4, 2.6);
    }
    this.decor.setMode('web');
  }

  touch() {
    this.lastInteraction = performance.now();
    this.stage.controls.autoRotate = false;
  }

  setLayout(id: LayoutId, fly = true) {
    if (id === this.layout && fly) {
      this.overview();
      return;
    }
    this.layout = id;
    const lay = layouts()[id];
    const centre = new THREE.Vector3();
    for (const n of this.nodes.values()) {
      const p = lay.get(n.c.id)!;
      n.moveTo(p, Math.random() * 0.35 + n.position.distanceTo(centre) * 0.0008, 1.9);
    }
    this.decor.setMode(id);
    this.web.setBase(id === 'web' ? 1 : id === 'chronicle' ? 0.25 : 0.45);
    this.stage.warp = 1;
    if (fly) {
      if (this.selected) this.focus(this.selected, lay.get(this.selected)!, 2.2);
      else this.overview(2.2);
    }
  }

  overview(dur = 1.8) {
    const v = VIEWS[this.layout];
    this.stage.flyTo(v.pos, v.target, dur);
  }

  passes(id: string) {
    const c = charById.get(id)!;
    const f = this.filters;
    return (
      f.factions.has(c.faction) &&
      c.importance >= f.minImportance &&
      spoilers.isMet(c) &&
      c.books.some((b) => f.books.has(b) && bookById.get(b)!.order <= spoilers.progress)
    );
  }

  /** Re-evaluate who the reader has met and whose fates must stay veiled. */
  applySpoilers() {
    for (const n of this.nodes.values()) {
      const veil = spoilers.isSpoiled(n.c);
      n.core.material.uniforms.uDead.value = !veil && n.c.status === 'dead' ? 1 : 0;
      n.labelEl.classList.toggle('veil', veil);
    }
    this.applyFilters();
  }

  applyFilters() {
    for (const n of this.nodes.values()) n.vis = this.passes(n.c.id) ? 1 : 0;
    if (this.selected && !this.passes(this.selected)) this.select(null);
    const read = books.filter((b) => b.order <= spoilers.progress && this.filters.books.has(b.id));
    this.decor.activeBooks = read.length === books.length ? null : new Set(read.map((b) => b.id));
    this.decor.progress = spoilers.progress;
    this.refresh();
  }

  setQuery(ids: Set<string> | null) {
    this.query = ids;
    this.refresh();
  }

  async select(id: string | null, fly = true) {
    if (id === this.selected && id) {
      if (fly) this.focus(id);
      return;
    }
    this.selected = id;
    this.refresh();
    this.onSelect(id);
    this.backdrop.turmoil = id && charById.get(id)!.faction === 'daemon' ? 1 : 0;
    this.decor.dim = id ? 1 : 0;
    if (!id) return;
    if (fly) this.focus(id);
    if (!this.sealTex.has(id)) {
      const cv = await drawSeal(charById.get(id)!);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.sealTex.set(id, tex);
    }
    if (this.selected === id) {
      this.seal.material.map = this.sealTex.get(id)!;
      this.seal.material.needsUpdate = true;
    }
  }

  focus(id: string, at?: THREE.Vector3, dur = 1.6) {
    const n = this.nodes.get(id)!;
    const target = (at ?? n.position).clone();
    const cam = this.stage.camera.position;
    const dir = cam.clone().sub(this.stage.controls.target).normalize();
    if (dir.lengthSq() < 0.5) dir.set(0, 0.3, 1).normalize();
    dir.y = Math.max(dir.y, 0.18);
    dir.normalize();
    const dist = 150 + n.radius * 8 + Math.min(bondsOf.get(id)!.length, 14) * 7;
    this.stage.flyTo(target.clone().add(dir.multiplyScalar(dist)), target, dur);
  }

  /** Recompute emphasis for nodes and bonds from selection / hover / search. */
  refresh() {
    const sel = this.selected;
    const hov = this.hovered;
    const focusId = sel ?? hov;
    const near = new Set<string>();
    const hl = new Set<number>();
    if (focusId) {
      near.add(focusId);
      for (const b of bondsOf.get(focusId)!) {
        if (!this.filters.bonds.has(b.kind)) continue;
        const o = other(b, focusId);
        if (!this.passes(o)) continue;
        near.add(o);
        hl.add(b.index);
      }
    }
    for (const n of this.nodes.values()) {
      const id = n.c.id;
      let e = 1;
      if (sel) e = near.has(id) ? 1 : 0.1;
      else if (hov) e = near.has(id) ? 1 : 0.45;
      if (this.query && !this.query.has(id)) e = Math.min(e, 0.12);
      n.emphasisTarget = e;
      n.hoverTarget = id === hov ? 1 : id === sel ? 0.5 : 0;
    }
    for (const b of bonds) {
      const on = this.filters.bonds.has(b.kind) && this.passes(b.a) && this.passes(b.b);
      let t = on ? 0.5 : 0;
      if (on && focusId) t = hl.has(b.index) ? 1 : sel ? 0.03 : 0.2;
      if (on && this.query && !(this.query.has(b.a) && this.query.has(b.b))) t = Math.min(t, 0.04);
      this.web.target[b.index] = t;
    }
    this.web.highlight(sel ? hl : hov ? hl : new Set());
    for (const n of this.nodes.values()) n.setRole('');
    if (focusId) {
      for (const b of bondsOf.get(focusId)!) {
        if (!hl.has(b.index)) continue;
        this.nodes.get(other(b, focusId))!.setRole(roleOf(b, focusId), BONDS[b.kind].color);
      }
    }
  }

  private pick(e: PointerEvent): string | null {
    const el = (e.target as HTMLElement).closest?.('.soul-label') as HTMLElement | null;
    if (el?.dataset.id && this.nodes.get(el.dataset.id)!.alpha > 0.5) return el.dataset.id;
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.stage.camera);
    const hits = this.raycaster.intersectObjects(
      this.hits.filter((h) => this.nodes.get(h.userData.id)!.alpha > 0.5),
      false,
    );
    return hits.length ? hits[0].object.userData.id : null;
  }

  private pointerMove(e: PointerEvent) {
    if (e.buttons) return;
    const id = this.pick(e);
    if (id !== this.hovered) {
      this.hovered = id;
      this.stage.labels.domElement.style.cursor = id ? 'pointer' : '';
      this.refresh();
    }
    this.onHover(id, e);
  }

  private pointerUp(e: PointerEvent) {
    if (!this.downAt) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 5) return;
    const book = (e.target as HTMLElement).closest?.('.book-label') as HTMLElement | null;
    if (book?.dataset.book) {
      this.onBook(book.dataset.book);
      return;
    }
    const id = this.pick(e);
    if (id) this.select(id);
    else if (this.selected) this.select(null);
  }

  private tick(t: number, dt: number) {
    this.backdrop.update(t);
    const cam = this.stage.camera.position;
    for (const n of this.nodes.values()) {
      const d = cam.distanceTo(n.position);
      n.near = THREE.MathUtils.clamp((d - n.radius * 3) / 90, 0.04, 1);
      n.update(t, dt);
    }
    this.web.update(t, dt);
    this.decor.update(dt);
    this.stage.warp *= Math.exp(-dt * 2.2);

    // selection seal hovers behind the chosen soul
    const sel = this.selected ? this.nodes.get(this.selected)! : null;
    const want = sel && this.seal.material.map ? 1 : 0;
    this.sealAlpha += (want - this.sealAlpha) * (1 - Math.exp(-dt * 4));
    this.seal.visible = this.sealAlpha > 0.01;
    if (sel) {
      this.seal.position.copy(sel.position);
      this.seal.scale.setScalar(sel.radius * 7.5 * (0.9 + 0.1 * this.sealAlpha));
      if (sel.moving && !this.stage.flying) this.stage.controls.target.lerp(sel.position, 0.08);
    }
    this.seal.material.opacity = this.sealAlpha * 0.75;
    this.seal.material.rotation = -t * 0.08;

    // gentle idle drift
    if (this.autoRotate && !this.selected && performance.now() - this.lastInteraction > 25000) this.stage.controls.autoRotate = true;

    this.updateLabels();
  }

  private labelBoxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  private hudBoxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  private frame = 0;

  /** Screen areas covered by HUD panels; soul labels there would sit under glass. */
  private measureHud() {
    const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (const sel of ['.brand-title', '#layouts', '.tools', '#filters', '#dossier.open', '.hud-bottom', '#caption.show']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) out.push({ x0: r.left - 6, y0: r.top - 6, x1: r.right + 6, y1: r.bottom + 6 });
    }
    return out;
  }
  private measure = document.createElement('canvas').getContext('2d')!;
  private labelW = new Map<string, number>();

  private labelWidth(n: SoulNode) {
    let w = this.labelW.get(n.c.id);
    if (w === undefined) {
      const size = n.c.importance === 5 ? 17 : n.c.importance === 4 ? 13.5 : 11;
      this.measure.font = `600 ${size}px Cinzel, serif`;
      w = this.measure.measureText(n.c.name).width + n.c.name.length * size * 0.08 + 8;
      if (document.fonts.status === 'loaded') this.labelW.set(n.c.id, w);
    }
    return w;
  }

  private updateLabels() {
    const cam = this.stage.camera;
    const sel = this.selected;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const v = new THREE.Vector3();
    const cand: { n: SoulNode; o: number; pri: number; x: number; y: number }[] = [];
    for (const n of this.nodes.values()) {
      let o = 0;
      let pri: number = n.c.importance;
      if (n.alpha > 0.05) {
        const d = cam.position.distanceTo(n.position);
        const imp = n.c.importance;
        const reach = 150 + imp * imp * 46;
        o = THREE.MathUtils.clamp((reach - d) / 120, 0, 1);
        if (sel || this.hovered) o *= n.emphasis > 0.9 ? 1 : 0;
        if (this.query) o = this.query.has(n.c.id) ? Math.max(o, 0.9) : 0;
        if (sel && n.emphasis > 0.9 && n.emphasisTarget > 0.9) o = Math.max(o, 0.95);
        if (n.c.id === this.hovered || n.c.id === sel) {
          o = 1;
          pri = 100;
        }
        o *= n.alpha;
        pri -= d / 2000;
      }
      v.copy(n.position);
      v.y += n.radius + 4;
      v.project(cam);
      if (v.z > 1) o = 0;
      cand.push({ n, o, pri, x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H });
    }
    // greedy declutter: higher-priority labels claim their screen rectangle first
    cand.sort((a, b) => b.pri - a.pri);
    this.labelBoxes.length = 0;
    if (this.frame++ % 20 === 0) this.hudBoxes = this.measureHud();
    this.labelBoxes.push(...this.hudBoxes, ...this.decor.labelBoxes(cam, W, H));
    for (const c of cand) {
      if (c.o > 0.02) {
        const w = this.labelWidth(c.n);
        const h = (c.n.c.importance >= 4 || c.n.c.id === sel ? 30 : 16) + (c.n.labelEl.classList.contains('has-rel') ? 12 : 0);
        const box = { x0: c.x - w / 2, x1: c.x + w / 2, y0: c.y - h, y1: c.y };
        const clash = this.labelBoxes.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
        if (clash && c.pri < 100) c.o = 0;
        else this.labelBoxes.push(box);
      }
      const n = c.n;
      const q = Math.round(c.o * 20) / 20;
      const isSel = n.c.id === sel;
      const key = `${q}${isSel ? 's' : ''}`;
      if (key !== n.labelKey) {
        n.labelKey = key;
        n.labelEl.style.opacity = String(q);
        n.labelEl.style.visibility = q > 0 ? 'visible' : 'hidden';
        n.labelEl.classList.toggle('sel', isSel);
      }
    }
  }
}
