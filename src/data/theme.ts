import type { BondKind, Faction, PsyState, SeriesId, Status } from './types';

export const FACTIONS: Record<Faction, { label: string; color: string; blurb: string }> = {
  inquisition: { label: 'Inquisition', color: '#f2c14e', blurb: 'Holy Ordos of the Emperor' },
  retinue: { label: 'Retinue', color: '#62c6e3', blurb: 'Interrogators, agents & warbands' },
  imperial: { label: 'Imperium', color: '#a9b6c9', blurb: 'Arbites, Navy, Guard & Ecclesiarchy' },
  heretic: { label: 'Heretic', color: '#e0382f', blurb: 'Cults, cabals & radical renegades' },
  daemon: { label: 'Daemon', color: '#b05cff', blurb: 'Entities of the Empyrean' },
  xenos: { label: 'Xenos', color: '#55e08a', blurb: 'Alien powers' },
  rogue: { label: 'Rogue', color: '#f08a3c', blurb: 'Mercenaries, smugglers & killers' },
  civilian: { label: 'Civilian', color: '#d9c49b', blurb: 'Citizens caught in the web' },
};

export const FACTION_ORDER: Faction[] = ['inquisition', 'retinue', 'imperial', 'civilian', 'rogue', 'xenos', 'heretic', 'daemon'];

export const SERIES: Record<SeriesId, { label: string; color: string; sub: string; numeral: string }> = {
  eisenhorn: { label: 'Eisenhorn', color: '#d4a63a', sub: 'Xenos · Malleus · Hereticus', numeral: 'I' },
  ravenor: { label: 'Ravenor', color: '#4fa8d6', sub: 'Ravenor · Returned · Rogue', numeral: 'II' },
  bequin: { label: 'Bequin', color: '#c9506a', sub: 'Pariah · Penitent', numeral: 'III' },
};

export const SERIES_ORDER: SeriesId[] = ['eisenhorn', 'ravenor', 'bequin'];

export const BONDS: Record<BondKind, { label: string; color: string; verb: string }> = {
  service: { label: 'Service', color: '#e8c36a', verb: 'serves' },
  mentor: { label: 'Mentorship', color: '#9cc2ff', verb: 'mentored' },
  ally: { label: 'Alliance', color: '#5fd6b8', verb: 'allied with' },
  enemy: { label: 'Enmity', color: '#ff4636', verb: 'opposes' },
  rival: { label: 'Rivalry', color: '#ff9b42', verb: 'rivals' },
  love: { label: 'Love', color: '#ff74b0', verb: 'loves' },
  kin: { label: 'Kinship', color: '#e4d2ff', verb: 'kin of' },
  bound: { label: 'Warp-bond', color: '#b65cff', verb: 'bound to' },
  betrayal: { label: 'Betrayal', color: '#c7e64a', verb: 'betrayed' },
};

export const BOND_ORDER: BondKind[] = ['service', 'mentor', 'ally', 'love', 'kin', 'rival', 'enemy', 'betrayal', 'bound'];

export const PSY: Record<PsyState, { label: string; glyph: string }> = {
  psyker: { label: 'Psyker', glyph: 'Ψ' },
  blank: { label: 'Untouchable (Blank)', glyph: '∅' },
  none: { label: 'Non-psyker', glyph: '·' },
  daemon: { label: 'Warp Entity', glyph: '✶' },
};

export const STATUS: Record<Status, { label: string; mark: string }> = {
  alive: { label: 'Extant', mark: '' },
  dead: { label: 'Deceased', mark: '†' },
  unknown: { label: 'Unknown', mark: '?' },
  other: { label: 'Undying', mark: '◊' },
};

export const IMPORTANCE_LABEL = ['', 'Minor', 'Notable', 'Major', 'Principal', 'Protagonist'];
