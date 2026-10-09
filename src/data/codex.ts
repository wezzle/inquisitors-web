import raw from './codex.json';
import looks from './appearance.json';
import type { Appearance, Bond, BondKind, Book, Character, Codex, RelType, SeriesId } from './types';

export const codex = raw as unknown as Codex;

export const books: Book[] = [...codex.books].sort((a, b) => a.order - b.order);
export const bookById = new Map(books.map((b) => [b.id, b]));
export const characters: Character[] = codex.characters;
export const locations = codex.locations;
export const charById = new Map(characters.map((c) => [c.id, c]));

const seriesCache = new Map<string, SeriesId[]>();
export function seriesOf(c: Character): SeriesId[] {
  let hit = seriesCache.get(c.id);
  if (!hit) seriesCache.set(c.id, (hit = computeSeries(c)));
  return hit;
}

function computeSeries(c: Character): SeriesId[] {
  const s = new Set<SeriesId>();
  for (const b of c.books) {
    const book = bookById.get(b);
    if (book) s.add(book.series);
  }
  return (['eisenhorn', 'ravenor', 'bequin'] as SeriesId[]).filter((x) => s.has(x));
}

/** Index (in chronological book order) of a character's first and last appearance. */
export function spanOf(c: Character): [number, number] {
  const idx = c.books.map((b) => books.findIndex((x) => x.id === b)).filter((i) => i >= 0);
  if (!idx.length) return [0, 0];
  return [Math.min(...idx), Math.max(...idx)];
}

const KIND: Record<RelType, BondKind> = {
  master: 'service',
  servant: 'service',
  mentor: 'mentor',
  student: 'mentor',
  ally: 'ally',
  enemy: 'enemy',
  rival: 'rival',
  love: 'love',
  kin: 'kin',
  bound: 'bound',
  betrayer: 'betrayal',
};

/** Precedence when two characters describe the same pair differently. */
const RANK: BondKind[] = ['bound', 'love', 'kin', 'betrayal', 'mentor', 'service', 'enemy', 'rival', 'ally'];

function superior(c: Character, r: Relation2): string {
  // master/mentor relations point from the superior to the subordinate
  if (r.type === 'master' || r.type === 'mentor') return c.id;
  if (r.type === 'servant' || r.type === 'student') return r.target;
  if (r.type === 'betrayer') return c.id;
  return c.id;
}
type Relation2 = Character['relationships'][number];

function buildBonds(): Bond[] {
  const map = new Map<string, Bond>();
  for (const c of characters) {
    for (const r of c.relationships) {
      if (!charById.has(r.target) || r.target === c.id) continue;
      const kind = KIND[r.type] ?? 'ally';
      const key = [c.id, r.target].sort().join('|');
      const prev = map.get(key);
      const note = r.note ? `${c.name.split(' ')[0]}: ${r.note}` : '';
      if (!prev) {
        map.set(key, { index: 0, a: c.id, b: r.target, kind, notes: note ? [note] : [], from: superior(c, r) });
      } else {
        if (note && !prev.notes.includes(note)) prev.notes.push(note);
        if (RANK.indexOf(kind) < RANK.indexOf(prev.kind)) {
          prev.kind = kind;
          prev.from = superior(c, r);
        }
      }
    }
  }
  const list = [...map.values()];
  list.forEach((b, i) => (b.index = i));
  return list;
}

export const bonds: Bond[] = buildBonds();

export const bondsOf = new Map<string, Bond[]>();
for (const c of characters) bondsOf.set(c.id, []);
for (const b of bonds) {
  bondsOf.get(b.a)!.push(b);
  bondsOf.get(b.b)!.push(b);
}

export function other(b: Bond, id: string): string {
  return b.a === id ? b.b : b.a;
}

/** What `otherId` is to `selfId`, phrased from self's perspective (e.g. "Master", "Ally"). */
export function roleOf(b: Bond, selfId: string): string {
  const otherIsFrom = b.from !== selfId;
  switch (b.kind) {
    case 'service':
      return otherIsFrom ? 'Master' : 'Servant';
    case 'mentor':
      return otherIsFrom ? 'Mentor' : 'Pupil';
    case 'betrayal':
      return otherIsFrom ? 'Betrayer' : 'Betrayed';
    case 'ally':
      return 'Ally';
    case 'enemy':
      return 'Enemy';
    case 'rival':
      return 'Rival';
    case 'love':
      return 'Beloved';
    case 'kin':
      return 'Kin';
    case 'bound':
      return 'Warp-bound';
  }
}

/** Sourced physical descriptions, one per character (may be missing for some). */
export const appearanceById = new Map((looks as unknown as Appearance[]).map((a) => [a.id, a]));
