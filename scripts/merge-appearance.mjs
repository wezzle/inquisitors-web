// Validates research/appearance/{eisenhorn,ravenor,bequin}.json (+ curation.json) into src/data/appearance.json.
// Anything outside the schema vocabulary is coerced to "unknown" (or dropped from lists) and reported.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'research', 'appearance');
const codex = JSON.parse(readFileSync(join(root, 'src/data/codex.json'), 'utf8'));
const ids = new Set(codex.characters.map((c) => c.id));

const ENUM = {
  form: ['human', 'astartes', 'daemonhost', 'daemon', 'xenos', 'construct', 'chair'],
  sex: ['male', 'female', 'unknown'],
  age: ['child', 'young', 'adult', 'older', 'old', 'ancient', 'unknown'],
  build: ['slight', 'average', 'athletic', 'heavy', 'massive', 'unknown'],
  skin: ['pale', 'fair', 'olive', 'tan', 'brown', 'dark', 'grey', 'unknown'],
  hairColor: ['black', 'dark-brown', 'brown', 'auburn', 'red', 'blonde', 'grey', 'white', 'silver', 'none', 'unknown'],
  hairStyle: ['bald', 'shaven', 'cropped', 'short', 'medium', 'long', 'braided', 'topknot', 'tied', 'unknown'],
  facialHair: ['none', 'stubble', 'moustache', 'beard', 'long-beard', 'unknown'],
  described: ['well', 'partial', 'none'],
};
const LIST = {
  marks: [
    'scar-face', 'burn-scars', 'augmetic-eye', 'augmetic-eyes', 'augmetic-jaw', 'augmetic-arm', 'augmetic-cranial',
    'data-cables', 'tattoos-face', 'tattoos-body', 'freckles', 'wrinkles', 'paralysed-face', 'pale-sickly',
    'blindfold', 'mask', 'veil', 'beauty-mark', 'wards', 'chains',
  ],
  attire: [
    'long-coat', 'high-collar', 'robes', 'hood', 'cloak', 'armour-light', 'armour-heavy', 'power-armour', 'uniform',
    'finery', 'rags', 'bodyglove', 'priest-vestments', 'fur', 'rosette', 'tricorn', 'cap', 'circlet', 'helmet',
  ],
  carries: ['sword', 'pistol', 'staff', 'book', 'lho-stick', 'rifle', 'daggers', 'blades-floating', 'hammer'],
};

const warnings = [];
const pick = (id, field, v, allowed) => {
  if (allowed.includes(v)) return v;
  if (v !== undefined && v !== 'unknown') warnings.push(`${id}.${field}: "${v}" → unknown`);
  return allowed.includes('unknown') ? 'unknown' : allowed[0];
};
const list = (id, field, xs) =>
  (Array.isArray(xs) ? xs : []).filter((x) => {
    const ok = LIST[field].includes(x);
    if (!ok) warnings.push(`${id}.${field}: dropped "${x}"`);
    return ok;
  });

const out = new Map();
for (const f of ['eisenhorn', 'ravenor', 'bequin']) {
  const p = join(dir, `${f}.json`);
  if (!existsSync(p)) {
    console.warn(`(missing ${f}.json)`);
    continue;
  }
  for (const a of JSON.parse(readFileSync(p, 'utf8')).appearance ?? []) {
    if (!ids.has(a.id)) {
      warnings.push(`unknown id ${a.id}`);
      continue;
    }
    out.set(a.id, a);
  }
}

const cur = existsSync(join(dir, 'curation.json')) ? JSON.parse(readFileSync(join(dir, 'curation.json'), 'utf8')) : {};
for (const [id, patch] of Object.entries(cur.characters ?? {})) {
  const base = out.get(id) ?? { id };
  out.set(id, { ...base, ...patch, hair: { ...(base.hair ?? {}), ...(patch.hair ?? {}) }, eyes: { ...(base.eyes ?? {}), ...(patch.eyes ?? {}) } });
}

const result = [];
for (const c of codex.characters) {
  const a = out.get(c.id);
  if (!a) {
    warnings.push(`no appearance record for ${c.id}`);
    continue;
  }
  const eyes = a.eyes ?? {};
  result.push({
    id: c.id,
    form: pick(c.id, 'form', a.form, ENUM.form),
    sex: pick(c.id, 'sex', a.sex, ENUM.sex),
    age: pick(c.id, 'age', a.age, ENUM.age),
    build: pick(c.id, 'build', a.build, ENUM.build),
    skin: pick(c.id, 'skin', a.skin, ENUM.skin),
    hair: {
      color: pick(c.id, 'hair.color', a.hair?.color, ENUM.hairColor),
      style: pick(c.id, 'hair.style', a.hair?.style, ENUM.hairStyle),
    },
    facialHair: pick(c.id, 'facialHair', a.facialHair, ENUM.facialHair),
    eyes: { color: typeof eyes.color === 'string' ? eyes.color.toLowerCase() : 'unknown', glow: !!eyes.glow },
    marks: list(c.id, 'marks', a.marks),
    attire: list(c.id, 'attire', a.attire),
    carries: list(c.id, 'carries', a.carries),
    palette: (a.palette ?? []).filter((x) => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 3),
    described: pick(c.id, 'described', a.described, ENUM.described),
    // drop research meta-notes ("The palette is…", "The books do not describe…") from the reader-facing summary
    summary: (a.summary ?? '')
      .split(/(?<=\.)\s+/)
      .filter((s) => !/\b(palette|schema)\b/i.test(s))
      .join(' '),
    evidence: (a.evidence ?? []).filter((e) => e && e.claim),
    extras: a.extras ?? [],
  });
}

writeFileSync(join(root, 'src/data/appearance.json'), JSON.stringify(result, null, 1));
const count = (k) => result.filter((r) => r.described === k).length;
console.log(`appearance: ${result.length}/${ids.size} records · well ${count('well')} · partial ${count('partial')} · none ${count('none')}`);
if (warnings.length) console.log(`${warnings.length} warnings:\n  ` + warnings.join('\n  '));
