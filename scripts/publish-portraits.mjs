// Publish approved imagegen sources as lightweight runtime images.
// Run: nix shell nixpkgs#nodejs_22 nixpkgs#imagemagick --command node scripts/publish-portraits.mjs [id ...]
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'docs/portraits/catalog.json'), 'utf8'));
const output = join(root, 'public/portraits');
const manifestPath = join(root, 'src/data/portraits.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const only = new Set(process.argv.slice(2));
const ids = new Set(catalog.portraits.map((p) => p.id));
for (const id of only) if (!ids.has(id)) throw new Error('Unknown portrait: ' + id);
mkdirSync(output, { recursive: true });
let published = 0;
for (const p of catalog.portraits) {
  if (only.size && !only.has(p.id)) continue;
  if (!/^[a-z0-9-]+$/.test(p.id)) throw new Error('Invalid character id: ' + p.id);
  const source = join(root, p.source);
  if (!existsSync(source)) throw new Error('Missing source: ' + p.source);
  for (const [suffix, geometry, quality] of [['', '800x1000', '86'], ['.thumb', '240x300', '82']]) {
    const destination = join(output, p.id + suffix + '.webp');
    if (!existsSync(destination) || statSync(source).mtimeMs > statSync(destination).mtimeMs) {
      const result = spawnSync('magick', [source, '-auto-orient', '-resize', geometry + '^',
        '-gravity', 'center', '-extent', geometry, '-strip', '-quality', quality, destination], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error('ImageMagick failed for ' + p.id);
    }
  }
  manifest[p.id] = {
    image: 'portraits/' + p.id + '.webp',
    thumb: 'portraits/' + p.id + '.thumb.webp',
    interpretive: true,
    whole: p.whole ?? false,
  };
  published++;
}
writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
console.log('Published', published, 'portraits;', Object.keys(manifest).length, 'available in the app.');
