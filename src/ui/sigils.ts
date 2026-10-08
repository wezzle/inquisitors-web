import type { Character, Faction } from '../data/types';
import { FACTIONS } from '../data/theme';

/* Heraldic emblems, one per faction, authored on a 100×100 grid. */

function chaosStar(): string {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    const px = -cy;
    const py = cx;
    const r0 = 12;
    const r1 = 34;
    const tip = 46;
    const w = 2.4;
    const hw = 8;
    const p = (r: number, o: number) => `${(50 + cx * r + px * o).toFixed(2)} ${(50 + cy * r + py * o).toFixed(2)}`;
    d += `M${p(r0, -w)} L${p(r1, -w)} L${p(r1, -hw)} L${p(tip, 0)} L${p(r1, hw)} L${p(r1, w)} L${p(r0, w)} Z `;
  }
  return `<path d="${d}"/><circle cx="50" cy="50" r="13" fill="none" stroke="currentColor" stroke-width="4"/>`;
}

function aquila(): string {
  // two-headed eagle: stacked feather blades either side of a central body
  let d = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const y0 = 40 + i * 5.5;
      const x1 = 50 + s * (44 - i * 6);
      const y1 = 26 + i * 9;
      const x2 = 50 + s * (40 - i * 6);
      const y2 = 33 + i * 9;
      d += `M${50 + s * 6} ${y0} L${x1} ${y1} L${x2} ${y2} L${50 + s * 6} ${y0 + 5} Z `;
    }
    // heads, looking outward
    const hx = 50 + s * 9;
    d += `M${hx} 30 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z `;
    d += `M${hx + s * 4} 28 L${hx + s * 11} 31 L${hx + s * 4} 33 Z `;
  }
  d += 'M44 36 L56 36 L58 62 L50 76 L42 62 Z ';
  d += 'M40 78 L60 78 L56 84 L44 84 Z';
  return `<path d="${d}"/>`;
}

function inquisition(): string {
  return `
    <rect x="45" y="6" width="10" height="88"/>
    <rect x="27" y="12" width="46" height="7"/>
    <rect x="22" y="81" width="56" height="7"/>
    <rect x="31" y="70" width="38" height="5"/>
    <rect x="34" y="23" width="32" height="4"/>
    <circle cx="50" cy="46" r="16"/>
    <rect x="42" y="56" width="16" height="8" rx="2"/>
    <g fill="#0b0708">
      <circle cx="44" cy="44" r="4.6"/><circle cx="56" cy="44" r="4.6"/>
      <path d="M50 49 l-2.6 5 h5.2z"/>
      <rect x="45" y="58" width="1.6" height="5"/><rect x="49.2" y="58" width="1.6" height="5"/><rect x="53.4" y="58" width="1.6" height="5"/>
    </g>`;
}

function retinue(): string {
  // a downward sword within a laurel
  let leaves = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.62 + i * 0.1);
      const x = 50 + s * Math.cos(a) * -36;
      const y = 50 + Math.sin(a) * 36 * -1 + 4;
      const rot = s * (i * 14 - 50);
      leaves += `<ellipse cx="${x.toFixed(1)}" cy="${(100 - y).toFixed(1)}" rx="3.2" ry="7" transform="rotate(${rot} ${x.toFixed(1)} ${(100 - y).toFixed(1)})"/>`;
    }
  }
  return `${leaves}
    <path d="M47 24 L53 24 L53 74 L50 84 L47 74 Z"/>
    <rect x="35" y="20" width="30" height="5" rx="1.5"/>
    <rect x="47.5" y="10" width="5" height="11"/>
    <circle cx="50" cy="9" r="4"/>`;
}

function daemon(): string {
  let flames = '';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const x = 50 + Math.cos(a) * 30;
    const y = 50 + Math.sin(a) * 22 - 8;
    flames += `<path d="M${(x - 3).toFixed(1)} ${y.toFixed(1)} Q${x.toFixed(1)} ${(y - 14).toFixed(1)} ${(x + 3).toFixed(1)} ${y.toFixed(1)} Z"/>`;
  }
  return `${flames}
    <path d="M8 54 Q50 14 92 54 Q50 94 8 54 Z" />
    <ellipse cx="50" cy="54" rx="15" ry="15" fill="#0b0708"/>
    <ellipse cx="50" cy="54" rx="3.5" ry="13"/>`;
}

function xenos(): string {
  return `
    <path d="M50 8 A42 42 0 1 0 50 92 A30 42 0 1 1 50 8 Z"/>
    <circle cx="62" cy="34" r="6"/><circle cx="72" cy="52" r="5"/><circle cx="62" cy="70" r="4"/>
    <path d="M30 50 L44 36 L44 64 Z" fill="#0b0708"/>`;
}

function rogue(): string {
  const dagger = (rot: number) => `
    <g transform="rotate(${rot} 50 50)">
      <path d="M48 10 L52 10 L54 62 L50 70 L46 62 Z"/>
      <rect x="40" y="62" width="20" height="4" rx="1"/>
      <rect x="47.5" y="66" width="5" height="16"/>
      <circle cx="50" cy="85" r="4"/>
    </g>`;
  return dagger(35) + dagger(-35);
}

function civilian(): string {
  return `
    <path d="M50 8 C58 20 60 28 50 38 C40 28 42 20 50 8 Z"/>
    <path d="M50 18 C54 25 54 30 50 34 C46 30 46 25 50 18 Z" fill="#0b0708"/>
    <rect x="49" y="36" width="2" height="6"/>
    <path d="M38 42 L62 42 L62 84 L38 84 Z"/>
    <path d="M42 42 L42 54 Q44 58 46 54 L46 42 Z" fill="#0b0708" opacity=".5"/>
    <rect x="28" y="84" width="44" height="6" rx="2"/>`;
}

const EMBLEM: Record<Faction, () => string> = {
  inquisition,
  retinue,
  imperial: aquila,
  heretic: chaosStar,
  daemon,
  xenos,
  rogue,
  civilian,
};

const cache = new Map<Faction, string>();

export function emblemSVG(f: Faction, color = 'currentColor'): string {
  if (!cache.has(f)) cache.set(f, EMBLEM[f]());
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="${color}" color="${color}">${cache.get(f)}</svg>`;
}

function loadSVG(svg: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/** The bare emblem rasterised onto a transparent canvas, ringed by a thin circle. */
export async function emblemCanvas(f: Faction, color: string, size = 512): Promise<HTMLCanvasElement> {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  g.strokeStyle = color;
  g.lineWidth = size * 0.008;
  for (const r of [0.48, 0.44]) {
    g.beginPath();
    g.arc(size / 2, size / 2, size * r, 0, Math.PI * 2);
    g.stroke();
  }
  const img = await loadSVG(emblemSVG(f, color));
  const e = size * 0.62;
  g.drawImage(img, (size - e) / 2, (size - e) / 2, e, e);
  return cv;
}

/** Renders a wax-seal style roundel for a character: emblem centre, name inscribed around the rim. */
export async function drawSeal(c: Character, size = 512): Promise<HTMLCanvasElement> {
  const col = FACTIONS[c.faction].color;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const R = size / 2;
  g.translate(R, R);

  // rim rings
  g.strokeStyle = col;
  g.lineWidth = size * 0.012;
  g.globalAlpha = 0.95;
  for (const r of [0.97, 0.78]) {
    g.beginPath();
    g.arc(0, 0, R * r, 0, Math.PI * 2);
    g.stroke();
  }
  g.lineWidth = size * 0.004;
  for (const r of [0.93, 0.74]) {
    g.beginPath();
    g.arc(0, 0, R * r, 0, Math.PI * 2);
    g.stroke();
  }
  // tick marks between rims
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74);
    g.lineTo(Math.cos(a) * R * (i % 6 === 0 ? 0.7 : 0.72), Math.sin(a) * R * (i % 6 === 0 ? 0.7 : 0.72));
    g.stroke();
  }

  // inscription
  await document.fonts.ready;
  const text = `✠ ${c.name.toUpperCase()} ✠ ${FACTIONS[c.faction].label.toUpperCase()} `;
  g.fillStyle = col;
  g.font = `600 ${Math.round(size * 0.062)}px Cinzel, serif`;
  g.textBaseline = 'middle';
  const rText = R * 0.855;
  const total = text.split('').reduce((s, ch) => s + g.measureText(ch).width, 0);
  const spacing = Math.max(0, (Math.PI * 2 * rText - total) / text.length);
  let ang = -Math.PI / 2 - (total + spacing * text.length) / rText / 2 + Math.PI;
  for (const ch of text) {
    const w = g.measureText(ch).width;
    ang += (w / 2) / rText;
    g.save();
    g.rotate(ang);
    g.translate(0, -rText);
    g.fillText(ch, -w / 2, 0);
    g.restore();
    ang += (w / 2 + spacing) / rText;
  }

  // emblem
  const img = await loadSVG(emblemSVG(c.faction, col));
  const e = size * 0.46;
  g.globalAlpha = 1;
  g.drawImage(img, -e / 2, -e / 2, e, e);
  return cv;
}
