import type { Appearance } from '../data/types';

const LABEL: Record<string, string> = {
  // marks
  'scar-face': 'Facial scar',
  'burn-scars': 'Burn scars',
  'augmetic-eye': 'Augmetic eye',
  'augmetic-eyes': 'Augmetic eyes',
  'augmetic-jaw': 'Augmetic jaw',
  'augmetic-arm': 'Augmetic arm',
  'augmetic-cranial': 'Cranial augmetics',
  'data-cables': 'Data cables',
  'tattoos-face': 'Facial tattoos',
  'tattoos-body': 'Tattooed body',
  freckles: 'Freckles',
  wrinkles: 'Lined face',
  'paralysed-face': 'Paralysed face',
  'pale-sickly': 'Sickly pallor',
  blindfold: 'Blindfold',
  mask: 'Masked',
  veil: 'Veiled',
  'beauty-mark': 'Beauty mark',
  wards: 'Warding runes',
  chains: 'Bound in chains',
  // attire
  'long-coat': 'Long coat',
  'high-collar': 'High collar',
  robes: 'Robes',
  hood: 'Hooded',
  cloak: 'Cloak',
  'armour-light': 'Light armour',
  'armour-heavy': 'Heavy armour',
  'power-armour': 'Power armour',
  uniform: 'Uniform',
  finery: 'Finery',
  rags: 'Rags',
  bodyglove: 'Bodyglove',
  'priest-vestments': 'Vestments',
  fur: 'Furs',
  rosette: 'Inquisitorial rosette',
  tricorn: 'Tricorn',
  cap: 'Cap',
  circlet: 'Circlet',
  helmet: 'Helmet',
  // carries
  sword: 'Sword',
  pistol: 'Pistol',
  staff: 'Staff',
  book: 'Book',
  'lho-stick': 'Lho-sticks',
  rifle: 'Rifle',
  daggers: 'Daggers',
  'blades-floating': 'Kineblades',
  hammer: 'Hammer',
  // extras
  'hand-circuitry': 'Glavian bio-circuitry (hands)',
  wings: 'Feathered wings',
  fangs: 'Fangs',
  visor: 'Optic visor',
  blind: 'Blind',
  grin: 'Fixed smile',
  horns: 'Horned helm',
};

const FORM: Record<string, string> = {
  astartes: 'Astartes',
  daemonhost: 'Daemonhost',
  daemon: 'Daemonic manifestation',
  xenos: 'Xenos',
  construct: 'Mechanical body',
  chair: 'Force chair',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

/** Human-readable chips for every attested trait (unknowns are simply omitted). */
export function likenessChips(a: Appearance): string[] {
  const out: string[] = [];
  if (FORM[a.form]) out.push(FORM[a.form]);
  if (a.age !== 'unknown') out.push(cap(a.age));
  if (a.build !== 'unknown') out.push(`${cap(a.build)} build`);
  if (a.skin !== 'unknown') out.push(`${cap(a.skin)} skin`);
  if (a.hair.style === 'bald' || a.hair.color === 'none') out.push(a.hair.style === 'shaven' ? 'Shaven head' : 'Bald');
  else if (a.hair.color !== 'unknown' || a.hair.style !== 'unknown')
    out.push([a.hair.style !== 'unknown' ? cap(a.hair.style) : '', a.hair.color !== 'unknown' ? a.hair.color.replace('-', ' ') : '', 'hair'].filter(Boolean).join(' '));
  if (a.facialHair !== 'unknown' && a.facialHair !== 'none') out.push(cap(a.facialHair));
  if (a.eyes.color !== 'unknown') out.push(`${cap(a.eyes.color)} eyes${a.eyes.glow ? ', burning' : ''}`);
  else if (a.eyes.glow) out.push('Burning eyes');
  for (const x of [...a.marks, ...a.attire, ...a.carries, ...(a.extras ?? [])]) if (LABEL[x]) out.push(LABEL[x]);
  return out;
}

export const DESCRIBED: Record<Appearance['described'], string> = {
  well: 'Well attested',
  partial: 'Partly attested',
  none: 'No likeness recorded',
};
