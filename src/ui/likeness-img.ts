import manifest from '../data/portraits.json';
import { FACTIONS } from '../data/theme';
import type { Appearance, Character } from '../data/types';
import { portraitCanvas as svgCanvas, portraitSVG } from './portrait';

interface Entry {
  image: string;
  thumb: string;
  interpretive: boolean;
  whole: boolean;
}
const portraits: Record<string, Entry> = manifest;
const base = import.meta.env.BASE_URL;
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const hasPortrait = (id: string) => Object.hasOwn(portraits, id);
export function portraitUrl(id: string, size: 'full' | 'thumb' = 'full') {
  const entry = portraits[id];
  return entry ? base + (size === 'thumb' ? entry.thumb : entry.image) : null;
}

/** Generated art replaces procedural portraits as each approved asset is published. */
export function portraitImg(c: Character, a?: Appearance, size: 'full' | 'thumb' = 'full') {
  const url = portraitUrl(c.id, size);
  if (!url) return portraitSVG(c, a);
  return `<img class="portrait pict" src="${escape(url)}" alt="Painted portrait of ${escape(c.name)}" width="${size === 'thumb' ? 240 : 800}" height="${size === 'thumb' ? 300 : 1000}" loading="lazy" decoding="async" draggable="false" />`;
}

const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(url: string) {
  let pending = images.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => { images.delete(url); reject(new Error('Portrait failed to load: ' + url)); };
      img.src = url;
    });
    images.set(url, pending);
  }
  return pending;
}

/** Cached thumbnail -> the existing faction-ringed three.js medallion. */
export async function portraitCanvas(c: Character, a?: Appearance, size = 256): Promise<HTMLCanvasElement> {
  const url = portraitUrl(c.id, 'thumb');
  if (!url) return svgCanvas(c, a, size);
  let img: HTMLImageElement;
  try { img = await loadImage(url); } catch { return svgCanvas(c, a, size); }
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const r = size / 2;
  g.save();
  g.beginPath();
  g.arc(r, r, r - size * 0.04, 0, Math.PI * 2);
  g.clip();
  if (portraits[c.id].whole || a?.form === 'chair' || a?.form === 'daemon' || a?.form === 'xenos') {
    const scale = size / img.height;
    g.fillStyle = '#090608';
    g.fillRect(0, 0, size, size);
    g.drawImage(img, (size - img.width * scale) / 2, 0, img.width * scale, size);
  } else {
    const crop = img.width * 0.82;
    g.drawImage(img, (img.width - crop) / 2, img.height * 0.08, crop, crop, 0, 0, size, size);
  }
  g.restore();
  g.strokeStyle = FACTIONS[c.faction].color;
  g.lineWidth = size * 0.035;
  g.beginPath();
  g.arc(r, r, r - size * 0.04, 0, Math.PI * 2);
  g.stroke();
  return cv;
}
