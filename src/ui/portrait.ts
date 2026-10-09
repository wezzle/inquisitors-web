import { FACTIONS } from '../data/theme';
import type { Appearance, Character } from '../data/types';

/*
 * Procedural "pict-capture" portraits. Every visible trait comes from the character's sourced
 * appearance record; anything the books don't describe is drawn as shadow rather than invented.
 * Output is a self-contained SVG string (ids are namespaced so many can share a document).
 */

const W = 200;
const H = 250;
const CX = 100;

let uid = 0;

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const SKIN: Record<string, string> = {
  pale: '#ecdccb',
  fair: '#e4c4a4',
  olive: '#c69c70',
  tan: '#b98a5c',
  brown: '#8f5c3c',
  dark: '#5c3b29',
  grey: '#a7a6a1',
  unknown: '#a99a8c',
};

const HAIR: Record<string, string> = {
  black: '#16110f',
  'dark-brown': '#3a2618',
  brown: '#6a4529',
  auburn: '#8a3b1e',
  red: '#b0401c',
  blonde: '#d6b46a',
  grey: '#8f8c88',
  white: '#e6e2da',
  silver: '#c4c8cc',
};

const EYE: Record<string, string> = {
  grey: '#8b949c',
  gray: '#8b949c',
  blue: '#4f7fb8',
  green: '#4f8a5a',
  brown: '#5d3a22',
  hazel: '#8a6a3a',
  black: '#1b1514',
  red: '#c42a22',
  gold: '#d8a83a',
  amber: '#d08a2a',
  violet: '#7a4ab0',
  purple: '#7a4ab0',
  white: '#e8eef4',
  silver: '#c4cbd2',
  dark: '#2a1a14',
};

const ATTIRE_COLOR: Record<string, string> = {
  'long-coat': '#2c2422',
  robes: '#3a2e3e',
  uniform: '#2b3343',
  finery: '#4b2331',
  rags: '#4a4036',
  bodyglove: '#1c1e23',
  'armour-light': '#4a4e56',
  'armour-heavy': '#3b3f47',
  'priest-vestments': '#ddd0b2',
  fur: '#6b5a45',
  cloak: '#2a2430',
};

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function has(list: string[] | undefined, ...xs: string[]) {
  return !!list && xs.some((x) => list.includes(x));
}

interface Geo {
  cy: number;
  rx: number;
  ry: number;
  top: number;
  chin: number;
  eyeY: number;
  eyeDx: number;
  eyeW: number;
  mouthY: number;
  mouthW: number;
  noseY: number;
  neckW: number;
  shoulderY: number;
  bodyW: number;
  jaw: number;
  brow: number;
  nose: number;
  female: boolean;
  child: boolean;
  jitter: () => number;
}

function geometry(a: Appearance, seed: string): Geo {
  const r = rng(seed);
  const j = () => r() - 0.5;
  const female = a.sex === 'female';
  const child = a.age === 'child';
  const big = a.build === 'heavy' || a.build === 'massive';
  const s = child ? 0.84 : 1;
  const rx = (female ? 26 : 28.5) * s + (big ? 3 : 0) + (a.build === 'slight' ? -1.5 : 0) + j() * 4;
  const ry = (female ? 35 : 37.5) * s + (a.age === 'old' || a.age === 'ancient' ? 1.5 : 0) + j() * 4;
  const cy = child ? 112 : 98;
  const bodyBase = { slight: 118, average: 136, athletic: 150, heavy: 166, massive: 186, unknown: 138 }[a.build] ?? 138;
  return {
    cy,
    rx,
    ry,
    top: cy - ry,
    chin: cy + ry,
    eyeY: cy + 1 + j() * 2,
    eyeDx: rx * (0.41 + j() * 0.08),
    eyeW: (female ? 10.6 : 10) * s + j() * 2,
    mouthY: cy + ry * (0.6 + j() * 0.08),
    mouthW: (female ? 13.5 : 16) * s + j() * 6,
    noseY: cy + ry * (0.38 + j() * 0.08),
    jaw: 0.72 + j() * 0.22,
    brow: j() * 4,
    nose: 4 + (j() + 0.5) * 3,
    neckW: (female ? 19 : 23) * s + (a.build === 'massive' ? 12 : big ? 6 : 0),
    shoulderY: (child ? 176 : 160) + j() * 3,
    bodyW: bodyBase * (female ? 0.9 : 1) * (child ? 0.74 : 1),
    female,
    child,
    jitter: j,
  };
}

function facePath(g: Geo) {
  const { cy, rx, ry, top } = g;
  const jaw = rx * (g.female ? g.jaw - 0.08 : g.jaw + 0.06);
  const chinW = rx * (g.female ? 0.22 : 0.34);
  return `M${CX},${top} C${CX + rx * 1.02},${top} ${CX + rx * 1.06},${cy - ry * 0.35} ${CX + rx},${cy}
    C${CX + rx * 0.98},${cy + ry * 0.45} ${CX + jaw},${cy + ry * 0.78} ${CX + chinW},${cy + ry * 0.96}
    Q${CX},${cy + ry * 1.05} ${CX - chinW},${cy + ry * 0.96}
    C${CX - jaw},${cy + ry * 0.78} ${CX - rx * 0.98},${cy + ry * 0.45} ${CX - rx},${cy}
    C${CX - rx * 1.06},${cy - ry * 0.35} ${CX - rx * 1.02},${top} ${CX},${top} Z`;
}

function torsoPath(g: Geo, wMul = 1) {
  const w = (g.bodyW * wMul) / 2;
  const n = g.neckW / 2 + 8;
  const y = g.shoulderY;
  return `M${CX - w},${H + 2} L${CX - w},${y + 36} C${CX - w},${y + 12} ${CX - w + 16},${y + 2} ${CX - n},${y - 4}
    L${CX + n},${y - 4} C${CX + w - 16},${y + 2} ${CX + w},${y + 12} ${CX + w},${y + 36} L${CX + w},${H + 2} Z`;
}

/* ------------------------------------------------------------------ parts */

function hairBack(a: Appearance, g: Geo, col: string) {
  const st = a.hair.style;
  const { cy, rx, top } = g;
  if (st === 'long') {
    return `<path d="M${CX - rx - 6},${cy - 10} C${CX - rx - 14},${cy + 50} ${CX - rx - 12},${g.shoulderY + 20} ${CX - rx + 4},${g.shoulderY + 30}
      L${CX + rx - 4},${g.shoulderY + 30} C${CX + rx + 12},${g.shoulderY + 20} ${CX + rx + 14},${cy + 50} ${CX + rx + 6},${cy - 10}
      C${CX + rx + 4},${top - 8} ${CX - rx - 4},${top - 8} ${CX - rx - 6},${cy - 10} Z" fill="${col}"/>`;
  }
  if (st === 'medium') {
    return `<path d="M${CX - rx - 5},${cy - 8} C${CX - rx - 9},${cy + 28} ${CX - rx - 4},${cy + 40} ${CX - rx + 6},${cy + 44}
      L${CX + rx - 6},${cy + 44} C${CX + rx + 4},${cy + 40} ${CX + rx + 9},${cy + 28} ${CX + rx + 5},${cy - 8}
      C${CX + rx + 4},${top - 6} ${CX - rx - 4},${top - 6} ${CX - rx - 5},${cy - 8} Z" fill="${col}"/>`;
  }
  if (st === 'braided') {
    let d = '';
    for (let i = 0; i < 7; i++) {
      const y = cy + 18 + i * 11;
      d += `<ellipse cx="${CX + rx + 2 - i * 1.5}" cy="${y}" rx="6" ry="7" fill="${col}" stroke="${shade(col, -0.35)}" stroke-width="1"/>`;
    }
    return d;
  }
  if (st === 'tied') {
    return `<path d="M${CX + rx * 0.6},${top + 8} C${CX + rx + 16},${top + 4} ${CX + rx + 14},${cy + 30} ${CX + rx + 6},${cy + 52}
      C${CX + rx + 2},${cy + 34} ${CX + rx},${cy} ${CX + rx * 0.6},${top + 8} Z" fill="${col}"/>`;
  }
  return '';
}

function hairFront(a: Appearance, g: Geo, col: string, unknown: boolean) {
  const { cy, rx, top } = g;
  if (unknown) {
    return `<path d="M${CX - rx - 3},${cy - 4} C${CX - rx - 6},${top - 14} ${CX + rx + 6},${top - 14} ${CX + rx + 3},${cy - 4}
      C${CX + rx * 0.5},${top + 16} ${CX - rx * 0.5},${top + 16} ${CX - rx - 3},${cy - 4} Z" fill="url(#SHADOWCAP)"/>`;
  }
  const st = a.hair.style;
  const hl = shade(col, 0.25);
  const cap = (depth: number, side: number) =>
    `<path d="M${CX - rx - 2},${cy - depth + side} C${CX - rx - 4},${top - 10} ${CX + rx + 4},${top - 10} ${CX + rx + 2},${cy - depth + side}
      C${CX + rx * 0.6},${cy - depth - 6} ${CX + rx * 0.1},${top + 14} ${CX - rx * 0.35},${top + 12}
      C${CX - rx * 0.7},${top + 16} ${CX - rx * 0.9},${cy - depth} ${CX - rx - 2},${cy - depth + side} Z" fill="${col}" ${unknown ? 'opacity=".88"' : ''}/>
     ${unknown ? '' : `<path d="M${CX - rx * 0.5},${top + 3} Q${CX},${top - 2} ${CX + rx * 0.4},${top + 4}" stroke="${hl}" stroke-width="2" fill="none" opacity=".45"/>`}`;
  switch (st) {
    case 'bald':
      return `<ellipse cx="${CX - rx * 0.3}" cy="${top + 10}" rx="${rx * 0.45}" ry="6" fill="#fff" opacity=".12"/>`;
    case 'shaven':
      return `<path d="M${CX - rx},${cy - 12} C${CX - rx - 2},${top - 4} ${CX + rx + 2},${top - 4} ${CX + rx},${cy - 12}
        C${CX + rx * 0.5},${top + 12} ${CX - rx * 0.5},${top + 12} ${CX - rx},${cy - 12} Z" fill="${col}" opacity=".35"/>`;
    case 'cropped':
      return cap(16, 0);
    case 'topknot':
      return `${cap(18, 0)}<ellipse cx="${CX}" cy="${top - 8}" rx="9" ry="8" fill="${col}"/><rect x="${CX - 6}" y="${top - 2}" width="12" height="3" fill="${shade(col, -0.4)}"/>`;
    case 'medium':
    case 'long':
    case 'braided':
    case 'tied':
      return `${cap(10, 6)}<path d="M${CX - rx - 3},${cy - 6} C${CX - rx - 5},${cy + 14} ${CX - rx - 1},${cy + 26} ${CX - rx + 3},${cy + 30}
        C${CX - rx + 1},${cy + 12} ${CX - rx + 2},${cy} ${CX - rx + 5},${cy - 14} Z" fill="${col}"/>
        <path d="M${CX + rx + 3},${cy - 6} C${CX + rx + 5},${cy + 14} ${CX + rx + 1},${cy + 26} ${CX + rx - 3},${cy + 30}
        C${CX + rx - 1},${cy + 12} ${CX + rx - 2},${cy} ${CX + rx - 5},${cy - 14} Z" fill="${col}"/>`;
    default:
      return cap(12, 2);
  }
}

function facialHair(a: Appearance, g: Geo, col: string) {
  const { cy, rx, ry, mouthY } = g;
  switch (a.facialHair) {
    case 'stubble':
      return `<path d="${facePath(g)}" fill="url(#STUB)" opacity=".55" clip-path="url(#LOWER)"/>`;
    case 'moustache':
      return `<path d="M${CX - 10},${mouthY - 2} Q${CX},${mouthY - 8} ${CX + 10},${mouthY - 2} Q${CX + 4},${mouthY - 4} ${CX},${mouthY - 3} Q${CX - 4},${mouthY - 4} ${CX - 10},${mouthY - 2} Z" fill="${col}"/>`;
    case 'beard':
    case 'long-beard': {
      const long = a.facialHair === 'long-beard' ? 30 : 6;
      return `<path d="M${CX - rx * 0.92},${cy + 6} C${CX - rx * 0.9},${cy + ry * 0.7} ${CX - 14},${cy + ry + long} ${CX},${cy + ry + 4 + long}
        C${CX + 14},${cy + ry + long} ${CX + rx * 0.9},${cy + ry * 0.7} ${CX + rx * 0.92},${cy + 6}
        C${CX + rx * 0.7},${cy + 20} ${CX + 8},${mouthY - 7} ${CX},${mouthY - 6} C${CX - 8},${mouthY - 7} ${CX - rx * 0.7},${cy + 20} ${CX - rx * 0.92},${cy + 6} Z" fill="${col}"/>
        <path d="M${CX - 8},${mouthY} Q${CX},${mouthY + 2} ${CX + 8},${mouthY}" stroke="#2a1a14" stroke-width="1.6" fill="none"/>`;
    }
    default:
      return '';
  }
}

function eye(x: number, g: Geo, a: Appearance, col: string, glow: boolean, flip: number) {
  const w = g.eyeW;
  const h = 4.6;
  const y = g.eyeY;
  const shape = `M${x - w / 2},${y} Q${x},${y - h * 1.3} ${x + w / 2},${y} Q${x},${y + h * 1.05} ${x - w / 2},${y} Z`;
  const brow = `M${x - 7 * flip},${y - 7.5 + g.brow * 0.4} Q${x},${y - 10.5 - g.brow * 0.3} ${x + 7.5 * flip},${y - 8.5 - g.brow * 0.5}`;
  if (glow) {
    return `<path d="${shape}" fill="${col}" filter="url(#GLOW)"/><path d="${shape}" fill="#fff" opacity=".7" transform="translate(${x} ${y}) scale(.5) translate(${-x} ${-y})"/>`;
  }
  const old = a.age === 'old' || a.age === 'ancient' || has(a.marks, 'wrinkles');
  return `<path d="${shape}" fill="#efe6d8"/>
    <clipPath id="E${x | 0}"><path d="${shape}"/></clipPath>
    <g clip-path="url(#E${x | 0})"><circle cx="${x}" cy="${y}" r="3" fill="${col}"/><circle cx="${x}" cy="${y}" r="1.3" fill="#0a0707"/><circle cx="${x + 1}" cy="${y - 1}" r=".7" fill="#fff"/></g>
    <path d="M${x - w / 2},${y} Q${x},${y - h * 1.3} ${x + w / 2},${y}" stroke="#2a1d18" stroke-width="1.3" fill="none"/>
    ${old ? `<path d="M${x - w / 2 + 1},${y + 3.5} Q${x},${y + 6} ${x + w / 2 - 1},${y + 3.5}" stroke="#5a3e32" stroke-width=".7" fill="none" opacity=".6"/>` : ''}
    <path d="${brow}" stroke="BROW" stroke-width="${g.female ? 1.6 : 2.4}" stroke-linecap="round" fill="none"/>`;
}

function augmeticEye(x: number, g: Geo) {
  const y = g.eyeY;
  return `<circle cx="${x}" cy="${y}" r="7.5" fill="#3a3530" stroke="#b08d57" stroke-width="2"/>
    <circle cx="${x}" cy="${y}" r="4" fill="#ff3b2a" filter="url(#GLOW)"/><circle cx="${x}" cy="${y}" r="1.6" fill="#ffd2b0"/>
    <path d="M${x + 7},${y - 3} L${x + 12},${y - 10}" stroke="#b08d57" stroke-width="1.5"/>
    <circle cx="${x - 5.5}" cy="${y + 5}" r=".9" fill="#d8c08a"/><circle cx="${x + 5.5}" cy="${y + 5}" r=".9" fill="#d8c08a"/>`;
}

function mouth(a: Appearance, g: Geo, skin: string) {
  const { mouthY: y, mouthW: w } = g;
  if (has(a.extras, 'grin')) {
    return `<path d="M${CX - w * 0.75},${y - 3} Q${CX},${y + 10} ${CX + w * 0.75},${y - 3} Q${CX},${y + 4} ${CX - w * 0.75},${y - 3} Z" fill="#f3ecdf" stroke="#3a1a18" stroke-width="1.2"/>
      <path d="M${CX - w * 0.5},${y - 0.5} L${CX + w * 0.5},${y - 0.5}" stroke="#a89a88" stroke-width=".5"/>`;
  }
  const lip = shade(skin, -0.28);
  const flat = has(a.marks, 'paralysed-face');
  const curve = flat ? 0 : 1.6;
  const lower = g.female
    ? `<path d="M${CX - w / 2 + 1},${y} Q${CX},${y + 5} ${CX + w / 2 - 1},${y} Q${CX},${y + 1.5} ${CX - w / 2 + 1},${y} Z" fill="${shade(lip, 0.05)}" opacity=".9"/>`
    : `<path d="M${CX - w * 0.3},${y + 4.2} Q${CX},${y + 5.5} ${CX + w * 0.3},${y + 4.2}" stroke="${lip}" stroke-width="1" fill="none" opacity=".6"/>`;
  return `${lower}<path d="M${CX - w / 2},${y} Q${CX},${y + curve} ${CX + w / 2},${y}" stroke="#3a211c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
}

function marks(a: Appearance, g: Geo, uidp: string) {
  const { cy, rx, ry, eyeY, eyeDx } = g;
  let out = '';
  const m = a.marks ?? [];
  if (m.includes('wrinkles') || a.age === 'old' || a.age === 'ancient') {
    out += `<g stroke="#4a3027" stroke-width=".7" fill="none" opacity=".5">
      <path d="M${CX - 12},${g.top + 16} Q${CX},${g.top + 13} ${CX + 12},${g.top + 16}"/><path d="M${CX - 10},${g.top + 21} Q${CX},${g.top + 18} ${CX + 10},${g.top + 21}"/>
      <path d="M${CX - 9},${g.noseY + 2} Q${CX - 13},${g.mouthY - 2} ${CX - 12},${g.mouthY + 4}"/><path d="M${CX + 9},${g.noseY + 2} Q${CX + 13},${g.mouthY - 2} ${CX + 12},${g.mouthY + 4}"/></g>`;
  }
  if (m.includes('freckles')) {
    const r = rng(uidp);
    for (let i = 0; i < 14; i++)
      out += `<circle cx="${CX + (r() - 0.5) * rx * 1.15}" cy="${eyeY + 7 + r() * 8}" r="${0.4 + r() * 0.4}" fill="#9a5a3a" opacity=".4"/>`;
  }
  if (m.includes('burn-scars')) {
    out += `<path d="${facePath(g)}" fill="#8a2a1a" opacity=".45" filter="url(#MOTTLE)" clip-path="url(#HALF)"/>`;
  }
  if (m.includes('scar-face')) {
    out += `<path d="M${CX + eyeDx - 6},${eyeY - 16} L${CX + eyeDx + 9},${eyeY + 22}" stroke="#f1d3c2" stroke-width="2.2" opacity=".8"/>
      <path d="M${CX + eyeDx - 6},${eyeY - 16} L${CX + eyeDx + 9},${eyeY + 22}" stroke="#8a4a3a" stroke-width=".8" opacity=".7"/>`;
  }
  if (m.includes('tattoos-face')) {
    out += `<g stroke="#2a3a5a" stroke-width="1.1" fill="none" opacity=".75">
      <path d="M${CX - eyeDx - 4},${eyeY + 8} l3,6 l-3,5 l4,5"/><path d="M${CX + eyeDx + 4},${eyeY + 8} l-3,6 l3,5 l-4,5"/>
      <path d="M${CX - 4},${g.top + 12} l4,-5 l4,5"/></g>`;
  }
  if (m.includes('augmetic-cranial')) {
    out += `<path d="M${CX + rx * 0.35},${g.top + 4} Q${CX + rx + 2},${g.top + 10} ${CX + rx + 1},${cy - 8} L${CX + rx * 0.55},${cy - 12} Z" fill="#6d6458" stroke="#b08d57" stroke-width="1.2"/>
      <circle cx="${CX + rx * 0.7}" cy="${g.top + 12}" r="1.2" fill="#d8c08a"/><circle cx="${CX + rx * 0.85}" cy="${cy - 14}" r="1.2" fill="#d8c08a"/>`;
  }
  if (m.includes('augmetic-jaw')) {
    out += `<path d="M${CX - rx * 0.78},${g.mouthY - 4} L${CX + rx * 0.78},${g.mouthY - 4} L${CX + rx * 0.3},${cy + ry * 0.98} L${CX - rx * 0.3},${cy + ry * 0.98} Z"
      fill="#7a7468" stroke="#b08d57" stroke-width="1.2"/><path d="M${CX - 10},${g.mouthY + 2} h20 M${CX - 8},${g.mouthY + 6} h16" stroke="#3a3530" stroke-width="1.4"/>`;
  }
  if (m.includes('pale-sickly')) {
    out += `<ellipse cx="${CX - eyeDx}" cy="${eyeY + 4}" rx="6" ry="3" fill="#5a4a6a" opacity=".35"/><ellipse cx="${CX + eyeDx}" cy="${eyeY + 4}" rx="6" ry="3" fill="#5a4a6a" opacity=".35"/>`;
  }
  if (m.includes('beauty-mark')) out += `<circle cx="${CX + 9}" cy="${g.mouthY - 5}" r="1.1" fill="#3a1a14"/>`;
  if (m.includes('wards')) {
    out += `<g stroke="#c9a0ff" stroke-width="1" fill="none" opacity=".8" filter="url(#GLOW)">
      <path d="M${CX - 4},${g.top + 10} h8 M${CX},${g.top + 6} v8"/><circle cx="${CX - rx * 0.6}" cy="${cy + 12}" r="3.5"/><path d="M${CX + rx * 0.5},${cy + 8} l4,6 l-8,0 z"/></g>`;
  }
  return out;
}

/* ------------------------------------------------------------------ clothing */

/** When the books describe no clothing, a role-typical costume is drawn (ghosted) so the cast isn't a wall of clones. */
export function inferredAttire(a: Appearance, c: Character): string[] {
  if ((a.attire ?? []).length || a.form !== 'human') return [];
  const t = c.title.toLowerCase();
  if (c.faction === 'inquisition') return ['long-coat', 'high-collar', 'rosette'];
  if (/arbite|marshal|magistratum|officer|captain|navy|guard|minister|governor/.test(t)) return ['uniform'];
  if (/priest|pontifex|ministorum|ecclesi|confessor/.test(t)) return ['priest-vestments'];
  if (/magos|tech|adept|savant|astropath/.test(t)) return ['robes'];
  if (c.faction === 'heretic' && /cult|sorcer|seer|psyker/.test(t)) return ['robes', 'hood'];
  if (c.faction === 'heretic' || /noble|lord|lady|patriarch|house|scion/.test(t)) return ['finery'];
  if (c.faction === 'rogue' || c.faction === 'retinue') return ['long-coat'];
  return [];
}

function clothing(a: Appearance, g: Geo, c: Character) {
  const at = a.attire ?? [];
  const main =
    a.palette?.[0] ?? ATTIRE_COLOR[at.find((x) => ATTIRE_COLOR[x]) ?? ''] ?? (a.described === 'none' ? '#0d0a0c' : '#2a2626');
  const trim = a.palette?.[1] ?? (at.includes('finery') ? '#c9a24b' : shade(main, 0.25));
  const y = g.shoulderY;
  const w = g.bodyW / 2;
  let out = `<path d="${torsoPath(g)}" fill="${main}"/>`;
  // light from the upper left
  out += `<path d="${torsoPath(g)}" fill="url(#BODYSHADE)"/>`;
  const n = g.neckW / 2;

  if (has(at, 'armour-light', 'armour-heavy')) {
    const heavy = at.includes('armour-heavy');
    const pw = heavy ? 34 : 24;
    out += `<path d="M${CX - w - 4},${y + 30} C${CX - w - 6},${y} ${CX - w + pw},${y - 6} ${CX - w + pw + 14},${y + 4} L${CX - w + pw + 6},${y + 34} Z" fill="${shade(main, 0.18)}" stroke="${trim}" stroke-width="1.5"/>
      <path d="M${CX + w + 4},${y + 30} C${CX + w + 6},${y} ${CX + w - pw},${y - 6} ${CX + w - pw - 14},${y + 4} L${CX + w - pw - 6},${y + 34} Z" fill="${shade(main, 0.18)}" stroke="${trim}" stroke-width="1.5"/>
      <path d="M${CX - 30},${y + 16} Q${CX},${y + 6} ${CX + 30},${y + 16} L${CX + 26},${H} L${CX - 26},${H} Z" fill="${shade(main, 0.1)}" stroke="${trim}" stroke-width="1"/>`;
  }
  if (at.includes('uniform')) {
    out += `<rect x="${CX - w + 4}" y="${y + 2}" width="26" height="7" rx="2" fill="${trim}"/><rect x="${CX + w - 30}" y="${y + 2}" width="26" height="7" rx="2" fill="${trim}"/>
      ${[0, 1, 2, 3].map((i) => `<circle cx="${CX}" cy="${y + 22 + i * 12}" r="2" fill="#c9a24b"/>`).join('')}`;
  }
  if (has(at, 'long-coat', 'cloak')) {
    out += `<path d="M${CX - n - 6},${y - 4} L${CX - 6},${y + 40} L${CX - 14},${H}" stroke="${shade(main, -0.45)}" stroke-width="2" fill="none"/>
      <path d="M${CX + n + 6},${y - 4} L${CX + 6},${y + 40} L${CX + 14},${H}" stroke="${shade(main, -0.45)}" stroke-width="2" fill="none"/>
      <path d="M${CX - n - 6},${y - 4} L${CX - 6},${y + 40} L${CX + 6},${y + 40} L${CX + n + 6},${y - 4} Z" fill="${shade(main, -0.35)}"/>`;
  }
  if (at.includes('cloak')) {
    out += `<path d="M${CX - w - 6},${H} L${CX - w - 6},${y + 30} C${CX - w - 4},${y + 4} ${CX - n - 10},${y - 6} ${CX - n},${y - 6} L${CX - n + 4},${y + 4} C${CX - w + 14},${y + 16} ${CX - w + 8},${y + 50} ${CX - w + 12},${H} Z" fill="${shade(main, -0.2)}"/>
      <path d="M${CX + w + 6},${H} L${CX + w + 6},${y + 30} C${CX + w + 4},${y + 4} ${CX + n + 10},${y - 6} ${CX + n},${y - 6} L${CX + n - 4},${y + 4} C${CX + w - 14},${y + 16} ${CX + w - 8},${y + 50} ${CX + w - 12},${H} Z" fill="${shade(main, -0.2)}"/>
      <circle cx="${CX}" cy="${y + 2}" r="4" fill="${trim}"/>`;
  }
  if (at.includes('robes')) {
    out += `<path d="M${CX - n - 4},${y - 4} Q${CX},${y + 30} ${CX + n + 4},${y - 4}" stroke="${shade(main, -0.4)}" stroke-width="3" fill="none"/>
      <path d="M${CX - 30},${y + 30} Q${CX - 26},${y + 60} ${CX - 32},${H} M${CX + 30},${y + 30} Q${CX + 26},${y + 60} ${CX + 32},${H}" stroke="${shade(main, -0.3)}" stroke-width="1.5" fill="none"/>`;
  }
  if (at.includes('priest-vestments')) {
    out += `<path d="M${CX - 16},${y - 2} L${CX - 12},${H} L${CX - 2},${H} L${CX - 6},${y + 4} Z M${CX + 16},${y - 2} L${CX + 12},${H} L${CX + 2},${H} L${CX + 6},${y + 4} Z" fill="#8a1e1e"/>
      <path d="M${CX - 9},${y + 40} h4 M${CX - 7},${y + 38} v6 M${CX + 5},${y + 40} h4 M${CX + 7},${y + 38} v6" stroke="#e0c070" stroke-width="1.2"/>`;
  }
  if (at.includes('fur')) {
    let d = '';
    for (let i = -6; i <= 6; i++) d += `<circle cx="${CX + i * (w / 7)}" cy="${y + 4 + Math.abs(i) * 1.6}" r="${7 - Math.abs(i) * 0.3}" fill="${shade(ATTIRE_COLOR.fur, (i % 2) * 0.08)}"/>`;
    out += d;
  }
  if (at.includes('rags')) {
    out += `<path d="M${CX - w},${H - 6} l8,-8 l6,8 l7,-10 l5,9 M${CX + w},${H - 8} l-6,-9 l-7,8 l-5,-7" stroke="${shade(main, -0.4)}" stroke-width="1.4" fill="none"/>
      <rect x="${CX + 18}" y="${y + 30}" width="14" height="12" fill="${shade(main, 0.12)}" stroke="${shade(main, -0.4)}" stroke-dasharray="2 2"/>`;
  }
  if (at.includes('bodyglove')) {
    out += `<path d="M${CX - w + 10},${y + 10} Q${CX - 10},${y + 30} ${CX - w + 16},${H}" stroke="#ffffff" stroke-width="1.5" opacity=".12" fill="none"/>`;
  }
  if (at.includes('finery')) {
    // a lace ruff / jabot and gilt trim
    let ruff = '';
    for (let i = -4; i <= 4; i++) ruff += `<ellipse cx="${CX + i * 5.5}" cy="${y - 2 + Math.abs(i) * 0.5}" rx="4.5" ry="5.5" fill="#efe6d4" stroke="#bcae92" stroke-width=".6"/>`;
    out += `${ruff}<path d="M${CX - w + 6},${y + 18} Q${CX - w + 4},${y + 60} ${CX - w + 8},${H}" stroke="${trim}" stroke-width="2.5" fill="none"/><path d="M${CX + w - 6},${y + 18} Q${CX + w - 4},${y + 60} ${CX + w - 8},${H}" stroke="${trim}" stroke-width="2.5" fill="none"/>`;
  }
  if (at.includes('high-collar')) {
    out += `<path d="M${CX - n - 14},${y + 2} L${CX - n - 6},${g.chin - 18} L${CX - n + 2},${y - 4} Z" fill="${shade(main, 0.12)}" stroke="${shade(main, -0.4)}" stroke-width="1"/>
      <path d="M${CX + n + 14},${y + 2} L${CX + n + 6},${g.chin - 18} L${CX + n - 2},${y - 4} Z" fill="${shade(main, 0.12)}" stroke="${shade(main, -0.4)}" stroke-width="1"/>`;
  }
  if (at.includes('rosette')) {
    out += `<g transform="translate(${CX - w * 0.45} ${y + 34})"><circle r="7.5" fill="#1a1210" stroke="#d4a63a" stroke-width="1.6"/>
      <rect x="-1.2" y="-5.5" width="2.4" height="11" fill="#d4a63a"/><rect x="-4" y="-4.5" width="8" height="1.6" fill="#d4a63a"/><rect x="-4.5" y="3" width="9" height="1.6" fill="#d4a63a"/><circle r="2.2" fill="#d4a63a"/></g>`;
  }
  if (has(a.marks, 'tattoos-body')) {
    const r = rng(c.id + 'tat');
    let t = '';
    for (let i = 0; i < 26; i++) {
      const x = CX - n - 2 + r() * (g.neckW + 4);
      const yy = g.chin - 10 + r() * (y - g.chin + 20);
      t += `<path d="M${x},${yy} h${2 + r() * 5}" stroke="#2a3550" stroke-width="1.1" opacity=".8"/>`;
    }
    out += `<g data-neck-tattoo="1">${t}</g>`;
  }
  if (has(a.extras, 'hand-circuitry')) {
    // a gloved hand raised at the lapel, traced with the Glavian bio-wires
    const hx = CX + w - 34;
    const hy = y + 40;
    const skinH = SKIN[a.skin] ?? SKIN.unknown;
    const wire = a.palette?.[2] ?? (a.id === 'midas-betancore' ? '#d8dee6' : '#e8c36a');
    let fingers = '';
    for (let i = 0; i < 4; i++) {
      const fx = hx - 7.5 + i * 5;
      const len = [13, 16, 15, 11][i];
      fingers += `<rect x="${fx - 2.2}" y="${hy - len}" width="4.4" height="${len + 4}" rx="2.2" fill="${skinH}"/>
        <path d="M${fx},${hy - len + 2} V${hy + 6}" stroke="${wire}" stroke-width=".8" filter="url(#GLOW)"/>`;
    }
    out += `<rect x="${hx - 11}" y="${hy - 2}" width="22" height="22" rx="6" fill="${skinH}"/>${fingers}
      <rect x="${hx + 8}" y="${hy + 2}" width="9" height="4.4" rx="2.2" fill="${skinH}" transform="rotate(-35 ${hx + 8} ${hy + 4})"/>
      <path d="M${hx - 6},${hy + 16} Q${hx},${hy + 6} ${hx + 6},${hy + 16} M${hx - 7.5},${hy + 6} H${hx + 7.5}" stroke="${wire}" stroke-width=".9" fill="none" filter="url(#GLOW)"/>
      <rect x="${hx - 12}" y="${hy + 18}" width="24" height="8" fill="${shade(main, -0.2)}"/>`;
  }
  if (has(a.marks, 'augmetic-arm')) {
    out += `<path d="M${CX + w - 2},${y + 26} C${CX + w + 2},${y + 6} ${CX + w - 18},${y} ${CX + w - 26},${y + 6} L${CX + w - 20},${y + 40} Z" fill="#7d776c" stroke="#b08d57" stroke-width="1.5"/>
      <path d="M${CX + w - 18},${y + 12} l8,4 M${CX + w - 16},${y + 22} l8,4" stroke="#3a3530" stroke-width="1.5"/><circle cx="${CX + w - 12}" cy="${y + 32}" r="2" fill="#ff5a3a"/>`;
  }
  if (has(a.marks, 'chains')) {
    let ch = '';
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const x = CX - w + 6 + t * (w * 2 - 12);
      const yy = y + 10 + Math.sin(t * Math.PI) * 30;
      ch += `<ellipse cx="${x}" cy="${yy}" rx="5" ry="3" fill="none" stroke="#8d8a86" stroke-width="2" transform="rotate(${i % 2 ? 60 : -10} ${x} ${yy})"/>`;
    }
    out += ch;
  }
  if (has(a.marks, 'data-cables')) {
    out += `<path d="M${CX - g.rx + 6},${g.cy - 6} C${CX - g.rx - 18},${g.cy + 20} ${CX - w + 10},${y - 10} ${CX - w + 16},${y + 20}" stroke="#2d2a28" stroke-width="4" fill="none"/>
      <path d="M${CX - g.rx + 10},${g.cy - 14} C${CX - g.rx - 24},${g.cy + 8} ${CX - w + 2},${y - 20} ${CX - w + 6},${y + 26}" stroke="#4a3a2a" stroke-width="3" fill="none"/>
      <path d="M${CX + g.rx - 6},${g.cy - 4} C${CX + g.rx + 16},${g.cy + 24} ${CX + w - 12},${y - 8} ${CX + w - 18},${y + 22}" stroke="#2d2a28" stroke-width="3.5" fill="none"/>`;
  }
  return out;
}

function headwear(a: Appearance, g: Geo) {
  const at = a.attire ?? [];
  const { top, rx, cy } = g;
  let out = '';
  if (at.includes('tricorn')) {
    out += `<path d="M${CX - rx - 18},${top + 12} Q${CX},${top - 6} ${CX + rx + 18},${top + 12} Q${CX + rx},${top - 14} ${CX},${top - 30} Q${CX - rx},${top - 14} ${CX - rx - 18},${top + 12} Z" fill="#1d1715" stroke="#c9a24b" stroke-width="1.2"/>`;
  }
  if (at.includes('cap')) {
    out += `<path d="M${CX - rx - 2},${top + 14} Q${CX},${top - 22} ${CX + rx + 2},${top + 14} Z" fill="#1f2530"/><path d="M${CX - rx - 4},${top + 14} Q${CX},${top + 24} ${CX + rx + 8},${top + 12}" stroke="#0e1116" stroke-width="5" fill="none"/>`;
  }
  if (at.includes('circlet')) {
    out += `<path d="M${CX - rx},${top + 16} Q${CX},${top + 8} ${CX + rx},${top + 16}" stroke="#d8b25a" stroke-width="2.2" fill="none"/><circle cx="${CX}" cy="${top + 10}" r="2.6" fill="#b0283a" stroke="#d8b25a"/>`;
  }
  if (at.includes('helmet') && a.form !== 'astartes') {
    out += `<path d="M${CX - rx - 4},${cy - 2} C${CX - rx - 6},${top - 14} ${CX + rx + 6},${top - 14} ${CX + rx + 4},${cy - 2} L${CX + rx - 2},${cy + 14} L${CX + rx * 0.5},${cy - 10} L${CX - rx * 0.5},${cy - 10} L${CX - rx + 2},${cy + 14} Z" fill="#4e5259" stroke="#8a8f96" stroke-width="1.2"/>`;
  }
  return out;
}

function carries(a: Appearance, g: Geo) {
  const c = a.carries ?? [];
  let out = '';
  const y = g.shoulderY;
  if (c.includes('staff')) {
    const sx = Math.max(CX - g.bodyW / 2 + 14, 40);
    out += `<rect x="${sx}" y="46" width="5" height="${H}" fill="#3a2a1c"/><circle cx="${sx + 2.5}" cy="42" r="8" fill="#e8dcc4" stroke="#c9a24b" stroke-width="1.5"/>
      <circle cx="${sx}" cy="41" r="1.6" fill="#1a1210"/><circle cx="${sx + 5}" cy="41" r="1.6" fill="#1a1210"/><circle cx="${sx + 2.5}" cy="42" r="12" fill="#9fc4ff" opacity=".18" filter="url(#GLOW)"/>`;
  }
  if (c.includes('sword')) {
    out += `<g transform="rotate(-24 ${CX + g.bodyW / 2 - 10} ${y})"><rect x="${CX + g.bodyW / 2 - 13}" y="${y - 70}" width="6" height="64" fill="#cfd6dc"/><rect x="${CX + g.bodyW / 2 - 22}" y="${y - 8}" width="24" height="5" fill="#c9a24b"/><rect x="${CX + g.bodyW / 2 - 12.5}" y="${y - 3}" width="5" height="18" fill="#3a2418"/></g>`;
  }
  if (c.includes('hammer')) {
    out += `<g transform="rotate(20 ${CX + g.bodyW / 2} ${y})"><rect x="${CX + g.bodyW / 2 - 3}" y="${y - 60}" width="6" height="90" fill="#3a3a3e"/><rect x="${CX + g.bodyW / 2 - 16}" y="${y - 78}" width="32" height="22" rx="3" fill="#6a6e76" stroke="#c9a24b" stroke-width="1.5"/></g>`;
  }
  if (c.includes('rifle')) {
    out += `<rect x="${CX + g.bodyW / 2 - 18}" y="${y - 54}" width="7" height="80" fill="#2a2420" transform="rotate(14 ${CX + g.bodyW / 2} ${y})"/>`;
  }
  if (c.includes('pistol')) {
    out += `<g transform="translate(${CX - g.bodyW / 2 + 14} ${H - 22}) rotate(-12)"><rect width="30" height="8" rx="2" fill="#3a3632"/><rect x="2" y="6" width="8" height="14" rx="2" fill="#5a3a26"/><rect x="24" y="1" width="8" height="5" fill="#8a8f96"/></g>`;
  }
  if (c.includes('daggers')) {
    out += `<g transform="translate(${CX + g.bodyW / 2 - 26} ${H - 18})"><path d="M0,0 L26,-26" stroke="#cfd6dc" stroke-width="3"/><path d="M0,-26 L26,0" stroke="#cfd6dc" stroke-width="3"/></g>`;
  }
  if (c.includes('book')) {
    out += `<g transform="translate(${CX - 20} ${H - 30}) rotate(-6)"><rect width="40" height="30" rx="2" fill="#4a1e1e" stroke="#c9a24b" stroke-width="1.5"/><rect x="17" y="6" width="6" height="18" fill="#c9a24b" opacity=".8"/></g>`;
  }
  if (c.includes('blades-floating')) {
    for (const [dx, dy, r] of [
      [-62, -34, -30],
      [58, -52, 25],
      [66, 6, 60],
      [-58, 22, -70],
    ]) {
      out += `<g transform="translate(${CX + dx} ${g.cy + dy}) rotate(${r})" filter="url(#SOFT)"><path d="M0,-12 L3,6 L0,10 L-3,6 Z" fill="#dfe8f0"/><path d="M0,-12 L0,10" stroke="#9fb4c8" stroke-width=".6"/></g>
        <circle cx="${CX + dx}" cy="${g.cy + dy}" r="9" fill="#9fc4ff" opacity=".12"/>`;
    }
  }
  return out;
}

function lhoStick(a: Appearance, g: Geo) {
  if (!has(a.carries, 'lho-stick')) return '';
  const x = CX + g.mouthW / 2 - 2;
  const y = g.mouthY;
  return `<path d="M${x},${y} l16,4" stroke="#ece6d8" stroke-width="2.6" stroke-linecap="round"/><circle cx="${x + 16.5}" cy="${y + 4.2}" r="1.6" fill="#ff7a2a" filter="url(#GLOW)"/>
    <path d="M${x + 18},${y + 2} C${x + 26},${y - 10} ${x + 12},${y - 22} ${x + 22},${y - 36} C${x + 30},${y - 48} ${x + 18},${y - 58} ${x + 24},${y - 70}" stroke="#cfcac0" stroke-width="2" fill="none" opacity=".25" filter="url(#SOFT)"/>`;
}

/* ------------------------------------------------------------------ special forms */

function wings() {
  let out = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x0 = CX + s * 30;
      const y0 = 150 - i * 4;
      const x1 = CX + s * (96 - i * 4);
      const y1 = 40 + i * 26;
      out += `<path d="M${x0},${y0} Q${CX + s * (70 - i * 2)},${y1 - 30} ${x1},${y1} Q${CX + s * (60 - i * 4)},${y1 + 10} ${x0},${y0 + 14} Z" fill="${i % 2 ? '#e9e6df' : '#f6f3ec'}" stroke="#bdb6a8" stroke-width=".6" opacity="${0.95 - i * 0.05}"/>`;
    }
  }
  return out;
}

function bareTorso(g: Geo, skin: string) {
  const w = 86;
  const y = g.shoulderY - 4;
  return `<path d="M${CX - w - 6},${H + 2} C${CX - w - 8},${y + 30} ${CX - w + 10},${y - 4} ${CX - g.neckW / 2 - 10},${y - 8} L${CX + g.neckW / 2 + 10},${y - 8} C${CX + w - 10},${y - 4} ${CX + w + 8},${y + 30} ${CX + w + 6},${H + 2} Z" fill="${skin}"/>
    <path d="M${CX - w - 6},${H + 2} C${CX - w - 8},${y + 30} ${CX - w + 10},${y - 4} ${CX - g.neckW / 2 - 10},${y - 8} L${CX + g.neckW / 2 + 10},${y - 8} C${CX + w - 10},${y - 4} ${CX + w + 8},${y + 30} ${CX + w + 6},${H + 2} Z" fill="url(#BODYSHADE)"/>
    <path d="M${CX - 34},${y + 34} Q${CX - 16},${y + 46} ${CX},${y + 36} Q${CX + 16},${y + 46} ${CX + 34},${y + 34} M${CX},${y + 36} V${H}" stroke="${shade(skin, -0.3)}" stroke-width="1.4" fill="none" opacity=".6"/>`;
}

function chairForm(accent: string) {
  // Ravenor's armoured force chair: no visible body, only the sealed shell and its sensor band
  const top = 44;
  return `<path d="M${CX - 56},${H + 4} L${CX - 60},${top + 70} C${CX - 62},${top + 10} ${CX - 30},${top - 6} ${CX},${top - 8} C${CX + 30},${top - 6} ${CX + 62},${top + 10} ${CX + 60},${top + 70} L${CX + 56},${H + 4} Z"
      fill="#3b3e45" stroke="#8a8f96" stroke-width="1.5"/>
    <path d="M${CX - 60},${top + 70} C${CX - 62},${top + 10} ${CX - 30},${top - 6} ${CX},${top - 8} C${CX - 22},${top} ${CX - 46},${top + 20} ${CX - 48},${top + 80} Z" fill="#fff" opacity=".06"/>
    <path d="M${CX - 44},${top + 58} Q${CX},${top + 48} ${CX + 44},${top + 58} L${CX + 42},${top + 70} Q${CX},${top + 61} ${CX - 42},${top + 70} Z" fill="#0c0e12"/>
    <path d="M${CX - 36},${top + 63} Q${CX},${top + 55} ${CX + 36},${top + 63}" stroke="${accent}" stroke-width="3" fill="none" filter="url(#GLOW)"/>
    <path d="M${CX - 52},${top + 100} L${CX + 52},${top + 100} M${CX - 50},${top + 140} L${CX + 50},${top + 140} M${CX},${top + 74} L${CX},${H}" stroke="#23262b" stroke-width="2"/>
    ${[-40, -20, 20, 40].map((dx) => `<circle cx="${CX + dx}" cy="${top + 120}" r="2" fill="#8a8f96"/>`).join('')}
    <rect x="${CX - 66}" y="${top + 150}" width="14" height="40" rx="3" fill="#2c2f35" stroke="#8a8f96"/>
    <rect x="${CX + 52}" y="${top + 150}" width="14" height="40" rx="3" fill="#2c2f35" stroke="#8a8f96"/>
    <circle cx="${CX}" cy="${top + 24}" r="5" fill="#c9a24b" opacity=".85"/>`;
}

function daemonForm(a: Appearance, c: Character) {
  const r = rng(c.id);
  const col = a.palette?.[0] ?? '#5a6b2a';
  const glow = a.eyes.color && EYE[a.eyes.color] ? EYE[a.eyes.color] : '#d6ff6a';
  let out = `<path d="M20,${H} C10,170 40,110 60,96 C40,60 80,30 100,40 C130,20 170,60 150,98 C176,120 190,190 180,${H} Z" fill="${col}" filter="url(#MOTTLE2)"/>`;
  for (let i = 0; i < 7; i++) {
    const x = 30 + r() * 140;
    const y = 120 + r() * 120;
    out += `<path d="M${x},${y} C${x + (r() - 0.5) * 60},${y - 40} ${x + (r() - 0.5) * 80},${y - 70} ${x + (r() - 0.5) * 40},${y - 100}" stroke="${shade(col, -0.3)}" stroke-width="${5 + r() * 6}" fill="none" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 4; i++) {
    const x = 60 + r() * 80;
    const y = 80 + r() * 110;
    const w = 10 + r() * 14;
    out += `<path d="M${x - w},${y} Q${x},${y + w} ${x + w},${y} Q${x},${y + 4} ${x - w},${y} Z" fill="#1a0a0a"/>`;
    for (let k = -2; k <= 2; k++) out += `<path d="M${x + k * w * 0.35},${y + 1} l1.6,4 l1.6,-4" fill="#efe6d0"/>`;
  }
  for (let i = 0; i < 6; i++) {
    out += `<circle cx="${50 + r() * 100}" cy="${50 + r() * 140}" r="${2 + r() * 3}" fill="${glow}" filter="url(#GLOW)"/>`;
  }
  return out;
}

function constructForm(a: Appearance, g: Geo) {
  const metal = a.palette?.[0] ?? '#a8875a';
  const dark = shade(metal, -0.5);
  const { cy, rx, ry } = g;
  return `<path d="${torsoPath(g)}" fill="${shade(metal, -0.25)}"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${CX - g.bodyW / 2 + 10},${g.shoulderY + 20 + i * 18} H${CX + g.bodyW / 2 - 10}" stroke="${dark}" stroke-width="2"/>`).join('')}
    <rect x="${CX - 9}" y="${cy + ry * 0.7}" width="18" height="${g.shoulderY - cy - ry * 0.6}" fill="${dark}"/>
    <path d="M${CX - 7},${cy + ry * 0.8} v24 M${CX + 7},${cy + ry * 0.8} v24" stroke="${shade(metal, 0.3)}" stroke-width="2.5"/>
    <path d="M${CX},${cy - ry - 2} L${CX + rx + 2},${cy - 12} L${CX + rx * 0.8},${cy + ry * 0.6} L${CX},${cy + ry + 2} L${CX - rx * 0.8},${cy + ry * 0.6} L${CX - rx - 2},${cy - 12} Z" fill="${metal}" stroke="${dark}" stroke-width="1.5"/>
    <path d="M${CX},${cy - ry - 2} L${CX - rx - 2},${cy - 12} L${CX - rx * 0.8},${cy + ry * 0.6} L${CX},${cy + ry + 2} Z" fill="#000" opacity=".18"/>
    <path d="M${CX - rx * 0.62},${cy} L${CX - 6},${cy + 3} M${CX + 6},${cy + 3} L${CX + rx * 0.62},${cy}" stroke="#ff4a2a" stroke-width="3.2" stroke-linecap="round" filter="url(#GLOW)"/>
    <path d="M${CX - 10},${cy + ry * 0.55} h20 M${CX - 8},${cy + ry * 0.66} h16" stroke="${dark}" stroke-width="2"/>
    <circle cx="${CX + rx * 0.7}" cy="${cy - 18}" r="7" fill="none" stroke="${dark}" stroke-width="2.5" stroke-dasharray="3 2"/>
    ${[-1, 1].map((s) => `<circle cx="${CX + s * rx * 0.5}" cy="${cy - ry * 0.7}" r="1.4" fill="${shade(metal, 0.5)}"/>`).join('')}`;
}

function xenosForm(a: Appearance) {
  const col = a.palette?.[0] ?? '#8a9a7a';
  return `<path d="M30,${H} C20,180 50,150 64,140 C40,100 58,52 92,48 C110,24 150,40 152,74 C176,84 182,130 160,150 C186,180 176,230 170,${H} Z" fill="${col}" filter="url(#MOTTLE2)"/>
    <path d="M64,140 C80,130 70,104 60,96 M152,74 C140,90 150,110 160,150" stroke="${shade(col, -0.35)}" stroke-width="5" fill="none"/>
    <ellipse cx="94" cy="86" rx="9" ry="6" fill="#111" /><ellipse cx="128" cy="78" rx="5" ry="7" fill="#111"/><ellipse cx="116" cy="108" rx="3.5" ry="3" fill="#111"/>
    <ellipse cx="94" cy="86" rx="3" ry="2" fill="#e6ff9a" filter="url(#GLOW)"/><ellipse cx="128" cy="78" rx="1.8" ry="2.4" fill="#e6ff9a" filter="url(#GLOW)"/>
    <path d="M70,170 C60,190 90,200 84,230 M150,170 C170,186 140,206 156,236" stroke="${shade(col, -0.25)}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
}

function astartesBody(a: Appearance, c: Character) {
  const main = a.palette?.[0] ?? '#4a4e56';
  const trim = a.palette?.[1] ?? '#c9a24b';
  const y = 156;
  const chaos = c.faction === 'heretic' || c.faction === 'daemon';
  const emblem = chaos
    ? `<g transform="translate(${CX} ${y + 50})" stroke="${trim}" stroke-width="2.4">${[0, 45, 90, 135].map((r) => `<path d="M-14,0 L14,0" transform="rotate(${r})"/>`).join('')}<circle r="5" fill="none"/></g>`
    : `<g transform="translate(${CX} ${y + 48})" fill="${trim}"><path d="M-26,0 L-4,-6 L-4,6 Z M26,0 L4,-6 L4,6 Z"/><circle r="4"/></g>`;
  return `<path d="M${CX - 92},${H + 2} L${CX - 86},${y + 30} L${CX + 86},${y + 30} L${CX + 92},${H + 2} Z" fill="${shade(main, -0.15)}"/>
    <path d="M${CX - 42},${y + 6} L${CX + 42},${y + 6} L${CX + 38},${H} L${CX - 38},${H} Z" fill="${main}" stroke="${trim}" stroke-width="1.5"/>
    ${emblem}
    <path d="M${CX - 100},${y + 70} C${CX - 104},${y - 4} ${CX - 64},${y - 22} ${CX - 34},${y + 4} C${CX - 30},${y + 40} ${CX - 50},${y + 74} ${CX - 100},${y + 70} Z" fill="${main}" stroke="${trim}" stroke-width="3"/>
    <path d="M${CX + 100},${y + 70} C${CX + 104},${y - 4} ${CX + 64},${y - 22} ${CX + 34},${y + 4} C${CX + 30},${y + 40} ${CX + 50},${y + 74} ${CX + 100},${y + 70} Z" fill="${main}" stroke="${trim}" stroke-width="3"/>
    <path d="M${CX - 92},${y + 22} C${CX - 86},${y - 4} ${CX - 60},${y - 12} ${CX - 42},${y + 2}" stroke="#fff" stroke-width="3" opacity=".12" fill="none"/>
    <path d="M${CX - 30},${y - 8} Q${CX},${y + 12} ${CX + 30},${y - 8} L${CX + 34},${y + 10} Q${CX},${y + 26} ${CX - 34},${y + 10} Z" fill="${shade(main, -0.3)}" stroke="${trim}" stroke-width="1.2"/>`;
}

function astartesHelm(a: Appearance, g: Geo) {
  const main = a.palette?.[0] ?? '#4a4e56';
  const trim = a.palette?.[1] ?? '#c9a24b';
  const lens = a.eyes.color && EYE[a.eyes.color] ? EYE[a.eyes.color] : '#ff3a2a';
  const { cy } = g;
  const horns = has(a.extras, 'horns')
    ? `<path d="M${CX - 30},${cy - 26} C${CX - 52},${cy - 40} ${CX - 54},${cy - 64} ${CX - 44},${cy - 78} C${CX - 44},${cy - 58} ${CX - 36},${cy - 46} ${CX - 22},${cy - 38} Z
       M${CX + 30},${cy - 26} C${CX + 52},${cy - 40} ${CX + 54},${cy - 64} ${CX + 44},${cy - 78} C${CX + 44},${cy - 58} ${CX + 36},${cy - 46} ${CX + 22},${cy - 38} Z" fill="${trim}" stroke="${shade(trim, -0.4)}"/>`
    : '';
  return horns + `<path d="M${CX - 34},${cy + 10} C${CX - 38},${cy - 52} ${CX + 38},${cy - 52} ${CX + 34},${cy + 10} L${CX + 26},${cy + 44} L${CX - 26},${cy + 44} Z" fill="${main}" stroke="${trim}" stroke-width="1.5"/>
    <path d="M${CX - 24},${cy - 4} L${CX - 6},${cy + 2} L${CX - 8},${cy + 10} L${CX - 24},${cy + 6} Z M${CX + 24},${cy - 4} L${CX + 6},${cy + 2} L${CX + 8},${cy + 10} L${CX + 24},${cy + 6} Z" fill="${lens}" filter="url(#GLOW)"/>
    <path d="M${CX - 10},${cy + 22} L${CX + 10},${cy + 22} L${CX + 8},${cy + 40} L${CX - 8},${cy + 40} Z" fill="${shade(main, -0.4)}"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${CX - 7},${cy + 26 + i * 4} h14" stroke="${trim}" stroke-width="1"/>`).join('')}`;
}

/* ------------------------------------------------------------------ assembly */

export interface PortraitOptions {
  /** Hide the gothic frame & scanlines (e.g. for 3D medallions that add their own ring). */
  bare?: boolean;
}

export function portraitSVG(c: Character, a: Appearance | undefined, opts: PortraitOptions = {}): string {
  const p = `pt${uid++}-`;
  const fc = FACTIONS[c.faction].color;
  const app: Appearance = a
    ? { ...a, hair: { ...a.hair } }
    :
    ({
      id: c.id,
      form: 'human',
      sex: 'unknown',
      age: 'unknown',
      build: 'unknown',
      skin: 'unknown',
      hair: { color: 'unknown', style: 'unknown' },
      facialHair: 'unknown',
      eyes: { color: 'unknown', glow: false },
      marks: [],
      attire: [],
      carries: [],
      palette: [],
      described: 'none',
      summary: '',
      evidence: [],
    } as Appearance);
  const g = geometry(app, c.id);
  const none = app.described === 'none';
  const inferred = a ? inferredAttire(app, c) : [];

  let body = '';
  if (app.form === 'chair') {
    body = chairForm('#9fc4ff');
  } else if (app.form === 'daemon') {
    body = daemonForm(app, c);
  } else if (app.form === 'xenos') {
    body = xenosForm(app);
  } else if (app.form === 'construct') {
    body = constructForm(app, g);
  } else {
    const astartes = app.form === 'astartes';
    const daemonhost = app.form === 'daemonhost';
    const skinKey = daemonhost && app.skin === 'unknown' ? 'grey' : app.skin;
    let skin = SKIN[skinKey] ?? SKIN.unknown;
    if (has(app.marks, 'pale-sickly') || daemonhost) skin = shade(skin, 0.08);
    // colour known but cut unrecorded → a neutral short cut in that colour; neither known → shadow
    const hairUnknown = app.hair.color === 'unknown';
    if (!hairUnknown && app.hair.style === 'unknown') app.hair = { ...app.hair, style: 'short' };
    const hairCol = hairUnknown ? '#120d0c' : (HAIR[app.hair.color] ?? '#3a2a20');
    const eyeCol = EYE[app.eyes.color] ?? (daemonhost ? '#ffe6ff' : '#2a201c');
    const glow = app.eyes.glow || daemonhost;
    const helm = astartes && has(app.attire, 'helmet');
    const hood = has(app.attire, 'hood');

    // behind the figure
    if (has(app.extras, 'wings')) body += wings();
    if (hood) {
      body += `<path d="M${CX - g.rx - 16},${g.shoulderY + 6} C${CX - g.rx - 24},${g.cy - 20} ${CX - g.rx - 10},${g.top - 18} ${CX},${g.top - 20}
        C${CX + g.rx + 10},${g.top - 18} ${CX + g.rx + 24},${g.cy - 20} ${CX + g.rx + 16},${g.shoulderY + 6} Z" fill="${shade(app.palette?.[0] ?? ATTIRE_COLOR.robes, -0.2)}"/>`;
    } else if (!helm && !hairUnknown) body += hairBack(app, g, hairCol);

    body += astartes && !has(app.attire, 'power-armour', 'armour-heavy', 'armour-light')
      ? bareTorso(g, skin)
      : astartes
      ? astartesBody(app, c)
      : inferred.length
        ? `<g opacity=".55" filter="url(#${p}GHOST)">${clothing({ ...app, attire: inferred }, g, c)}</g>`
        : clothing(app, g, c);

    if (helm) {
      body += astartesHelm(app, g);
    } else {
      // neck + head
      body += `<path d="M${CX - g.neckW / 2},${g.cy + g.ry * 0.55} L${CX - g.neckW / 2 - 2},${g.shoulderY + 2} Q${CX},${g.shoulderY + 10} ${CX + g.neckW / 2 + 2},${g.shoulderY + 2} L${CX + g.neckW / 2},${g.cy + g.ry * 0.55} Z" fill="${shade(skin, -0.18)}"/>`;
      body += `<path d="M${CX - g.neckW / 2},${g.chin - 6} Q${CX},${g.chin + 10} ${CX + g.neckW / 2},${g.chin - 6} L${CX + g.neckW / 2},${g.chin + 4} Q${CX},${g.chin + 14} ${CX - g.neckW / 2},${g.chin + 4} Z" fill="#000" opacity=".22"/>`;
      if (has(app.marks, 'tattoos-body')) body += clothing({ ...app, attire: [], palette: [], marks: ['tattoos-body'] }, g, c).replace(/^<path[^>]*\/><path[^>]*\/>/, '');
      // ears
      body += `<ellipse cx="${CX - g.rx + 0.5}" cy="${g.cy + 4}" rx="4.5" ry="8" fill="${shade(skin, -0.1)}"/><ellipse cx="${CX + g.rx - 0.5}" cy="${g.cy + 4}" rx="4.5" ry="8" fill="${shade(skin, -0.1)}"/>`;
      body += `<path d="${facePath(g)}" fill="${skin}"/>`;
      body += `<path d="${facePath(g)}" fill="url(#${p}FACESHADE)"/>`;
      // faction-coloured rim light along the shadowed side of the face
      body += `<path d="${facePath(g)}" fill="none" stroke="${fc}" stroke-width="1.6" opacity=".32" clip-path="url(#${p}HALF)"/>`;
      body += marks(app, g, c.id);
      // eyes
      const browCol = hairUnknown ? '#2a1d18' : shade(hairCol === HAIR.white || hairCol === HAIR.silver ? '#8a8580' : hairCol, -0.15);
      const left = has(app.marks, 'augmetic-eyes') ? augmeticEye(CX - g.eyeDx, g) : eye(CX - g.eyeDx, g, app, eyeCol, glow, 1);
      const right = has(app.marks, 'augmetic-eye', 'augmetic-eyes') ? augmeticEye(CX + g.eyeDx, g) : eye(CX + g.eyeDx, g, app, eyeCol, glow, -1);
      body += (left + right).replace(/BROW/g, browCol).replace(/id="E(\d+)"/g, `id="${p}E$1"`).replace(/url\(#E(\d+)\)/g, `url(#${p}E$1)`);
      if (has(app.extras, 'blind'))
        for (const s of [-1, 1]) body += `<ellipse cx="${CX + s * g.eyeDx}" cy="${g.eyeY}" rx="${g.eyeW / 2 - 0.5}" ry="2.6" fill="#d8dde0" opacity=".9"/>`;
      if (has(app.extras, 'fangs'))
        body += `<path d="M${CX - 5},${g.mouthY + 0.5} l1.4,4 l1.4,-4 M${CX + 2.2},${g.mouthY + 0.5} l1.4,4 l1.4,-4" fill="#f4efe6" stroke="#f4efe6" stroke-width=".6"/>`;
      if (has(app.extras, 'visor'))
        body += `<rect x="${CX - g.rx - 2}" y="${g.eyeY - 6}" width="${g.rx * 2 + 4}" height="11" rx="3" fill="#1b1d22" stroke="#6a6e76"/>
          <rect x="${CX - g.rx + 4}" y="${g.eyeY - 2}" width="${g.rx * 2 - 8}" height="3" fill="#ff5a3a" filter="url(#GLOW)"/>`;
      if (has(app.marks, 'blindfold')) body += `<rect x="${CX - g.rx - 2}" y="${g.eyeY - 7}" width="${g.rx * 2 + 4}" height="13" fill="#1a1616"/>`;
      // nose
      body += `<path d="M${CX - 1},${g.eyeY + 4} Q${CX - g.nose + 1},${g.noseY - 2} ${CX - g.nose},${g.noseY} Q${CX},${g.noseY + 4} ${CX + g.nose},${g.noseY}" stroke="${shade(skin, -0.38)}" stroke-width="1.2" fill="none" opacity=".75"/>`;
      body += mouth(app, g, skin);
      body += facialHair(app, g, hairUnknown ? '#2a1d18' : hairCol);
      body += lhoStick(app, g);
      if (has(app.marks, 'mask')) {
        body += `<path d="M${CX - g.rx - 1},${g.eyeY + 7} L${CX + g.rx + 1},${g.eyeY + 7} L${CX + g.rx * 0.5},${g.chin + 2} L${CX - g.rx * 0.5},${g.chin + 2} Z" fill="#2a2a2e" stroke="#6a6e76"/>
          ${[0, 1, 2].map((i) => `<path d="M${CX - 9},${g.mouthY - 4 + i * 5} h18" stroke="#111" stroke-width="1.5"/>`).join('')}`;
      }
      if (has(app.marks, 'veil')) body += `<path d="M${CX - g.rx - 2},${g.eyeY + 8} L${CX + g.rx + 2},${g.eyeY + 8} L${CX + g.rx},${g.chin + 16} L${CX - g.rx},${g.chin + 16} Z" fill="#1a1418" opacity=".55"/>`;
      if (!hood) body += hairFront(app, g, hairCol, hairUnknown);
      body += headwear(app, g);
      if (hood) {
        body += `<path d="M${CX - g.rx - 10},${g.cy + 30} C${CX - g.rx - 14},${g.top - 12} ${CX + g.rx + 14},${g.top - 12} ${CX + g.rx + 10},${g.cy + 30}
          L${CX + g.rx + 2},${g.cy + 30} C${CX + g.rx + 4},${g.top} ${CX - g.rx - 4},${g.top} ${CX - g.rx - 2},${g.cy + 30} Z" fill="${shade(app.palette?.[0] ?? ATTIRE_COLOR.robes, -0.05)}"/>
          <path d="M${CX - g.rx - 2},${g.cy + 30} C${CX - g.rx - 4},${g.top} ${CX + g.rx + 4},${g.top} ${CX + g.rx + 2},${g.cy + 30}" stroke="#000" stroke-width="5" opacity=".35" fill="none"/>`;
      }
    }
    body += carries(app, g);
  }

  // psychic signature behind the head
  const halo =
    c.psy === 'psyker' && app.form !== 'daemon'
      ? `<circle cx="${CX}" cy="${app.form === 'chair' ? 100 : g.cy}" r="${app.form === 'chair' ? 82 : g.ry + 26}" fill="url(#${p}PSY)"/>`
      : c.psy === 'blank'
        ? `<circle cx="${CX}" cy="${g.cy}" r="${g.ry + 30}" fill="url(#${p}NULL)"/><circle cx="${CX}" cy="${g.cy}" r="${g.ry + 22}" fill="none" stroke="#dfe9ff" stroke-width=".8" opacity=".5"/>`
        : app.form === 'daemonhost' || app.form === 'daemon'
          ? `<circle cx="${CX}" cy="${g.cy + 10}" r="${g.ry + 50}" fill="url(#${p}WARP)"/>`
          : '';

  const frame = opts.bare
    ? ''
    : `<path d="${ARCH}" fill="none" stroke="${fc}" stroke-width="2.2" opacity=".85"/><path d="${ARCH_IN}" fill="none" stroke="${fc}" stroke-width=".7" opacity=".45"/>`;
  const unknownVeil = none
    ? `<rect width="${W}" height="${H}" filter="url(#${p}STATIC)" opacity=".5"/>
       <text x="${CX}" y="${H - 18}" text-anchor="middle" font-family="monospace" font-size="8.5" letter-spacing="1.5" fill="${fc}" opacity=".9">NO PICT-CAPTURE ON FILE</text>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="portrait">
  <defs>
    <clipPath id="${p}ARCHCLIP"><path d="${opts.bare ? `M0,0 H${W} V${H} H0 Z` : ARCH}"/></clipPath>
    <radialGradient id="${p}BG" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${shade(fc, -0.72)}"/><stop offset=".65" stop-color="#0b080a"/><stop offset="1" stop-color="#040304"/></radialGradient>
    <radialGradient id="${p}PSY"><stop offset=".55" stop-color="#9fc4ff" stop-opacity="0"/><stop offset=".8" stop-color="#9fc4ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fc4ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}NULL"><stop offset=".5" stop-color="#000" stop-opacity=".9"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}WARP"><stop offset="0" stop-color="#b05cff" stop-opacity=".55"/><stop offset=".6" stop-color="#5a1a6a" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}FACESHADE" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
    <linearGradient id="${p}SHADOWCAP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050304" stop-opacity=".85"/><stop offset=".45" stop-color="#050304" stop-opacity=".35"/><stop offset="1" stop-color="#050304" stop-opacity="0"/></linearGradient>
    <linearGradient id="${p}BODYSHADE" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
    <radialGradient id="${p}VIG" cx="50%" cy="45%" r="70%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <pattern id="${p}SCAN" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" opacity=".22"/></pattern>
    <pattern id="${p}STUB" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".45" fill="#1c1410"/></pattern>
    <clipPath id="${p}LOWER"><rect x="0" y="${g.noseY + 2}" width="${W}" height="${H}"/></clipPath>
    <clipPath id="${p}HALF"><rect x="${CX}" y="0" width="${W}" height="${H}"/></clipPath>
    <filter id="${p}GLOW" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${p}SOFT"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="${p}MOTTLE"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .16  0 0 0 0 .1  0 0 0 2.4 -1.1"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="${p}MOTTLE2"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter>
    <filter id="${p}GRAIN"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="${c.id.length}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
    <filter id="${p}STATIC"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2"/><feColorMatrix values="0 0 0 0 .6  0 0 0 0 .6  0 0 0 0 .6  0 0 0 .5 0"/></filter>
    <filter id="${p}GHOST"><feColorMatrix type="saturate" values=".25"/></filter>
    <filter id="${p}PICT"><feColorMatrix type="saturate" values=".78"/></filter>
  </defs>
  <g clip-path="url(#${p}ARCHCLIP)">
    <rect width="${W}" height="${H}" fill="url(#${p}BG)"/>
    ${halo}
    <g filter="url(#${p}PICT)" transform="${zoom(app.form)}">${none ? silhouette(g, fc) : body.replace(/url\(#(GLOW|SOFT|MOTTLE2|MOTTLE|HALF|STUB|LOWER|BODYSHADE)\)/g, `url(#${p}$1)`).replace(/url\(#SHADOWCAP\)/g, `url(#${p}SHADOWCAP)`)}</g>
    ${unknownVeil}
    <rect width="${W}" height="${H}" fill="url(#${p}VIG)"/>
    ${opts.bare ? '' : `<rect width="${W}" height="${H}" fill="url(#${p}SCAN)"/><rect width="${W}" height="${H}" filter="url(#${p}GRAIN)"/>`}
  </g>
  ${frame}
</svg>`;
}

/** Bring head-and-shoulders forms closer to the lens; whole-body forms keep their framing. */
function zoom(form: string) {
  if (form === 'human' || form === 'daemonhost' || form === 'construct') return 'translate(100 112) scale(1.24) translate(-100 -104)';
  if (form === 'astartes') return 'translate(100 112) scale(1.1) translate(-100 -104)';
  return '';
}

/** A soul with no recorded likeness: a dark bust with a rim of faction light. */
function silhouette(g: Geo, fc: string) {
  return `<path d="${torsoPath(g)}" fill="#0a0809" stroke="${fc}" stroke-width="1.2" stroke-opacity=".5"/>
    <path d="M${CX - g.neckW / 2},${g.cy + 20} L${CX - g.neckW / 2},${g.shoulderY} L${CX + g.neckW / 2},${g.shoulderY} L${CX + g.neckW / 2},${g.cy + 20} Z" fill="#0a0809"/>
    <path d="${facePath(g)}" fill="#0a0809" stroke="${fc}" stroke-width="1.2" stroke-opacity=".55"/>
    <text x="${CX}" y="${g.cy + 16}" text-anchor="middle" font-family="serif" font-size="44" fill="${fc}" opacity=".35">?</text>`;
}

const ARCH = `M8,${H} L8,92 Q8,26 100,6 Q192,26 192,92 L192,${H} Z`;
const ARCH_IN = `M14,${H} L14,94 Q14,32 100,13 Q186,32 186,94 L186,${H}`;

/** Rasterise to a canvas (for three.js textures). Circular medallion crop with a faction ring. */
export async function portraitCanvas(c: Character, a: Appearance | undefined, size = 256): Promise<HTMLCanvasElement> {
  const svg = portraitSVG(c, a, { bare: true });
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const r = size / 2;
  g.save();
  g.beginPath();
  g.arc(r, r, r - size * 0.04, 0, Math.PI * 2);
  g.clip();
  // frame the head & shoulders: crop the top ~80% of the 200×250 portrait into the circle
  const scale = size / 170;
  g.drawImage(img, (size - W * scale) / 2, -18 * scale, W * scale, H * scale);
  g.restore();
  const fc = FACTIONS[c.faction].color;
  g.strokeStyle = fc;
  g.lineWidth = size * 0.035;
  g.beginPath();
  g.arc(r, r, r - size * 0.04, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.6)';
  g.lineWidth = size * 0.012;
  g.beginPath();
  g.arc(r, r, r - size * 0.065, 0, Math.PI * 2);
  g.stroke();
  return cv;
}
