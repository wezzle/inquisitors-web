// Merges research/{eisenhorn,ravenor,bequin}.json (+ research/curation.json overrides) into src/data/codex.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SERIES = ['eisenhorn', 'ravenor', 'bequin'];

/** Canonical reading order. Unknown book ids are appended in series order. */
const BOOK_ORDER = [
  'xenos',
  'malleus',
  'hereticus',
  'missing-in-action',
  'backcloth',
  'ravenor',
  'thorn-wishes-talon',
  'ravenor-returned',
  'ravenor-rogue',
  'pariah',
  'penitent',
];
const ABBR = {
  xenos: 'XEN', malleus: 'MAL', hereticus: 'HER', 'missing-in-action': 'MiA', backcloth: 'BfC',
  ravenor: 'RAV', 'thorn-wishes-talon': 'TWT', 'ravenor-returned': 'RET', 'ravenor-rogue': 'ROG', pariah: 'PAR', penitent: 'PEN',
};
const SHORTS = new Set(['missing-in-action', 'backcloth', 'thorn-wishes-talon', 'playing-patience', 'perihelion']);

const load = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);

const cur = load(join(root, 'research', 'curation.json'));
const ALIAS = cur?.merge ?? {};
const canon = (id) => ALIAS[id] ?? id;

const books = new Map();
const chars = new Map();
const locations = new Map();

for (const series of SERIES) {
  const d = load(join(root, 'research', `${series}.json`));
  if (!d) {
    console.warn(`(missing research/${series}.json)`);
    continue;
  }
  for (const b of d.books ?? []) {
    books.set(b.id, {
      id: b.id,
      title: b.title,
      series,
      year: Number(b.year) || 0,
      kind: SHORTS.has(b.id) ? 'short' : 'novel',
      abbr: ABBR[b.id] ?? b.title.slice(0, 3).toUpperCase(),
      summary: b.summary ?? '',
    });
  }
  for (const l of d.locations ?? []) {
    const prev = locations.get(l.id);
    if (prev) prev.books = [...new Set([...prev.books, ...(l.books ?? [])])];
    else locations.set(l.id, { ...l, books: l.books ?? [] });
  }
  for (const c of d.characters ?? []) {
    const entry = {
      ...c,
      id: canon(c.id),
      series,
      relationships: (c.relationships ?? []).map((r) => ({ ...r, target: canon(r.target) })),
    };
    if (!chars.has(entry.id)) chars.set(entry.id, []);
    chars.get(entry.id).push(entry);
  }
}

const imp = (x) => Number(x.importance) || 1;

const characters = [];
for (const [id, entries] of chars) {
  // primary = the series in which the character matters most (ties: earliest series)
  const primary = [...entries].sort((a, b) => imp(b) - imp(a) || SERIES.indexOf(a.series) - SERIES.indexOf(b.series))[0];
  const latest = [...entries].sort((a, b) => SERIES.indexOf(b.series) - SERIES.indexOf(a.series))[0];
  const arcs = {};
  for (const e of entries) if (e.summary) arcs[e.series] = e.summary;
  const rels = new Map();
  for (const e of entries) {
    for (const r of e.relationships ?? []) {
      const key = `${r.target}|${r.type}`;
      if (!rels.has(key)) rels.set(key, { target: r.target, type: r.type, note: r.note ?? '' });
    }
  }
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  characters.push({
    id,
    name: primary.name,
    title: primary.title,
    aliases: uniq(entries.flatMap((e) => e.aliases ?? [])).filter((a) => a !== primary.name),
    faction: primary.faction,
    books: uniq(entries.flatMap((e) => e.books ?? [])),
    importance: Math.max(...entries.map(imp)),
    psy: primary.psy,
    status: latest.status,
    fate: latest.fate || primary.fate || '',
    origin: primary.origin || entries.find((e) => e.origin)?.origin || '',
    summary: primary.summary,
    arcs,
    traits: uniq(entries.flatMap((e) => e.traits ?? [])).slice(0, 8),
    wargear: primary.wargear || entries.find((e) => e.wargear)?.wargear || '',
    epithet: primary.epithet || '',
    relationships: [...rels.values()],
    sources: uniq(entries.flatMap((e) => e.sources ?? [])),
  });
}

// hand-curated overrides: { merge: {dupId: id}, characters: { id: {field: value} }, drop: [ids], books: { id: {...} }, add: [characters] }
if (cur) {
  for (const id of cur.drop ?? []) {
    const i = characters.findIndex((c) => c.id === id);
    if (i >= 0) characters.splice(i, 1);
  }
  for (const c of cur.add ?? []) characters.push(c);
  for (const [id, patch] of Object.entries(cur.characters ?? {})) {
    const c = characters.find((x) => x.id === id);
    if (!c) {
      console.warn(`curation: unknown character ${id}`);
      continue;
    }
    const { addRelationships, removeRelationships, ...rest } = patch;
    Object.assign(c, rest);
    // entries are "target" (all bonds to target) or "target:type"
    if (removeRelationships)
      c.relationships = c.relationships.filter((r) => !removeRelationships.includes(r.target) && !removeRelationships.includes(`${r.target}:${r.type}`));
    if (addRelationships) c.relationships.push(...addRelationships);
  }
  for (const id of cur.dropLocations ?? []) locations.delete(id);
  for (const [id, patch] of Object.entries(cur.books ?? {})) {
    if (books.has(id)) Object.assign(books.get(id), patch);
    else books.set(id, { id, ...patch });
  }
}

// drop books nobody appears in, fix order
const used = new Set(characters.flatMap((c) => c.books));
const bookList = [...books.values()].filter((b) => used.has(b.id));
bookList.sort((a, b) => {
  const ia = BOOK_ORDER.indexOf(a.id);
  const ib = BOOK_ORDER.indexOf(b.id);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0 !== ib >= 0) {
    // unknown ids slot in after the last known book of their series
    return SERIES.indexOf(a.series) - SERIES.indexOf(b.series) || (ia >= 0 ? -1 : 1);
  }
  return a.year - b.year;
});
bookList.forEach((b, i) => (b.order = i));

// validation
const ids = new Set(characters.map((c) => c.id));
const bookIds = new Set(bookList.map((b) => b.id));
let dangling = 0;
for (const c of characters) {
  for (const r of c.relationships) {
    if (!ids.has(r.target)) {
      dangling++;
      console.warn(`dangling relation ${c.id} -> ${r.target}`);
    }
  }
  for (const b of c.books) if (!bookIds.has(b)) console.warn(`unknown book ${b} on ${c.id}`);
  if (!c.books.length) console.warn(`no books: ${c.id}`);
}
characters.sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));

writeFileSync(
  join(root, 'src/data/codex.json'),
  JSON.stringify({ books: bookList, characters, locations: [...locations.values()] }, null, 1),
);
console.log(`codex: ${characters.length} characters, ${bookList.length} books, ${locations.size} locations, ${dangling} dangling relations`);
