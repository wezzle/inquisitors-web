import * as THREE from 'three';
import { bonds, books, characters, seriesOf, spanOf } from '../data/codex';
import { FACTION_ORDER } from '../data/theme';
import type { Character, SeriesId } from '../data/types';

export type LayoutId = 'web' | 'chronicle' | 'allegiance';
export type Layout = Map<string, THREE.Vector3>;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export const SERIES_ANCHOR: Record<SeriesId, THREE.Vector3> = {
  eisenhorn: new THREE.Vector3(Math.cos(Math.PI * 0.5) * 230, 10, Math.sin(Math.PI * 0.5) * 230),
  ravenor: new THREE.Vector3(Math.cos(Math.PI * 0.5 + (2 * Math.PI) / 3) * 230, -10, Math.sin(Math.PI * 0.5 + (2 * Math.PI) / 3) * 230),
  bequin: new THREE.Vector3(Math.cos(Math.PI * 0.5 + (4 * Math.PI) / 3) * 230, 0, Math.sin(Math.PI * 0.5 + (4 * Math.PI) / 3) * 230),
};

function anchorOf(c: Character): THREE.Vector3 {
  const s = seriesOf(c);
  const v = new THREE.Vector3();
  if (!s.length) return v;
  for (const id of s) v.add(SERIES_ANCHOR[id]);
  v.divideScalar(s.length);
  // characters spanning every series gravitate to the heart of the web
  if (s.length === 3) v.multiplyScalar(0);
  else if (s.length === 2) v.multiplyScalar(0.9);
  return v;
}

/** 3D force-directed web. Deterministic: seeded RNG, fixed iteration count. */
function web(): Layout {
  const rnd = mulberry32(40000);
  const n = characters.length;
  const idx = new Map(characters.map((c, i) => [c.id, i]));
  const P = characters.map((c) => anchorOf(c).add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(90)));
  const A = characters.map(anchorOf);
  const mass = characters.map((c) => 1 + (c.importance - 1) * 0.8);
  const F = P.map(() => new THREE.Vector3());
  const tmp = new THREE.Vector3();
  const springs = bonds.map((b) => [idx.get(b.a)!, idx.get(b.b)!] as const);

  for (let it = 0; it < 700; it++) {
    const cool = 1 - it / 700;
    for (const f of F) f.set(0, 0, 0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        tmp.subVectors(P[i], P[j]);
        const d2 = Math.max(tmp.lengthSq(), 25);
        const rep = (2600 * (characters[i].importance + characters[j].importance)) / d2;
        tmp.normalize().multiplyScalar(rep);
        F[i].add(tmp);
        F[j].sub(tmp);
      }
    }
    for (const [i, j] of springs) {
      tmp.subVectors(P[j], P[i]);
      const d = tmp.length() || 1;
      const rest = 46 + (10 - characters[i].importance - characters[j].importance) * 7;
      tmp.multiplyScalar(((d - rest) / d) * 0.045);
      F[i].add(tmp);
      F[j].sub(tmp);
    }
    for (let i = 0; i < n; i++) {
      tmp.subVectors(A[i], P[i]).multiplyScalar(0.018);
      F[i].add(tmp);
      F[i].y -= P[i].y * 0.02; // keep the web lens-shaped
      const step = F[i].divideScalar(mass[i]).clampLength(0, 14 * cool + 0.5);
      P[i].add(step);
    }
  }
  return new Map(characters.map((c, i) => [c.id, P[i]]));
}

export const CHRONICLE = {
  bottom: -230,
  height: 470,
  ringY(i: number) {
    return this.bottom + (i / Math.max(books.length - 1, 1)) * this.height;
  },
};

/** Stacked rings, one per book; each soul sits on the ring of their first appearance. */
function chronicle(): Layout {
  const out: Layout = new Map();
  const byRing = new Map<number, Character[]>();
  for (const c of characters) {
    const [first] = spanOf(c);
    if (!byRing.has(first)) byRing.set(first, []);
    byRing.get(first)!.push(c);
  }
  for (const [ring, list] of byRing) {
    list.sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));
    const y = CHRONICLE.ringY(ring);
    list.forEach((c, k) => {
      const r = c.importance === 5 && k === 0 ? 0 : 34 + 23 * Math.sqrt(k + 0.5);
      const a = k * GOLDEN + ring * 0.9;
      out.set(c.id, new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    });
  }
  return out;
}

export const ALLEGIANCE_R = 250;

export function factionCentre(i: number) {
  const a = (i / FACTION_ORDER.length) * Math.PI * 2 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(a) * ALLEGIANCE_R, Math.sin(i * 1.7) * 30, Math.sin(a) * ALLEGIANCE_R);
}

/** Factions as orbiting clusters; the most important characters sit at each cluster's core. */
function allegiance(): Layout {
  const out: Layout = new Map();
  FACTION_ORDER.forEach((f, i) => {
    const centre = factionCentre(i);
    const list = characters.filter((c) => c.faction === f).sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));
    const n = list.length;
    list.forEach((c, k) => {
      if (k === 0) return out.set(c.id, centre.clone());
      const y = 1 - (2 * (k + 0.5)) / n;
      const rr = Math.sqrt(1 - y * y);
      const th = k * GOLDEN;
      const radius = 16 + 13 * Math.cbrt(k) * Math.sqrt(n / 6);
      out.set(c.id, new THREE.Vector3(Math.cos(th) * rr, y * 0.8, Math.sin(th) * rr).multiplyScalar(radius).add(centre));
    });
  });
  return out;
}

let cache: Record<LayoutId, Layout> | null = null;

export function layouts(): Record<LayoutId, Layout> {
  if (!cache) cache = { web: web(), chronicle: chronicle(), allegiance: allegiance() };
  return cache;
}
