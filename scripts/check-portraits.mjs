// Check exact cast coverage, valid assets and provenance without making API calls.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const characters = read('src/data/codex.json').characters;
const manifest = read('src/data/portraits.json');
const catalog = read('docs/portraits/catalog.json');
const ids = characters.map((c) => c.id).sort();
assert.deepEqual(Object.keys(manifest).sort(), ids, 'Runtime manifest must cover exactly the current cast');
assert.deepEqual(catalog.portraits.map((p) => p.id).sort(), ids, 'Catalog must contain each character exactly once');
for (const c of characters) {
  const entry = manifest[c.id];
  for (const url of [entry.image, entry.thumb]) {
    assert.match(url, /^portraits\/[a-z0-9-]+(?:\.thumb)?\.webp$/);
    const file = join(root, 'public', url);
    assert.ok(existsSync(file) && statSync(file).size > 0, 'Missing runtime asset: ' + url);
    const bytes = readFileSync(file);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  const original = catalog.portraits.find((p) => p.id === c.id);
  assert.equal(original.faction, c.faction, 'Allegiance mismatch for ' + c.id);
  for (const path of [original.source, original.prompt]) {
    assert.ok(existsSync(join(root, path)) && statSync(join(root, path)).size > 0, 'Missing provenance: ' + path);
  }
}
console.log('Verified', ids.length, 'characters:', ids.length * 2, 'runtime WebPs, source PNGs, prompts and allegiances.');
