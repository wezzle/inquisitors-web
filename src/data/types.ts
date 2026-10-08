export type SeriesId = 'eisenhorn' | 'ravenor' | 'bequin';

export type Faction =
  | 'inquisition'
  | 'retinue'
  | 'imperial'
  | 'heretic'
  | 'daemon'
  | 'xenos'
  | 'rogue'
  | 'civilian';

export type PsyState = 'psyker' | 'blank' | 'none' | 'daemon';
export type Status = 'alive' | 'dead' | 'unknown' | 'other';

export type RelType =
  | 'master'
  | 'servant'
  | 'ally'
  | 'enemy'
  | 'love'
  | 'kin'
  | 'rival'
  | 'bound'
  | 'mentor'
  | 'student'
  | 'betrayer';

/** Undirected bond categories used for rendering edges. */
export type BondKind = 'service' | 'mentor' | 'ally' | 'enemy' | 'love' | 'kin' | 'rival' | 'bound' | 'betrayal';

export interface Book {
  id: string;
  title: string;
  series: SeriesId;
  year: number;
  kind: 'novel' | 'short';
  abbr: string;
  summary: string;
  order: number;
}

export interface Relation {
  target: string;
  type: RelType;
  note: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  aliases: string[];
  faction: Faction;
  books: string[];
  importance: 1 | 2 | 3 | 4 | 5;
  psy: PsyState;
  status: Status;
  fate: string;
  origin: string;
  summary: string;
  arcs: Partial<Record<SeriesId, string>>;
  traits: string[];
  wargear: string;
  epithet: string;
  relationships: Relation[];
  sources: string[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  books: string[];
  note: string;
}

export interface Codex {
  books: Book[];
  characters: Character[];
  locations: Location[];
}

export interface Bond {
  index: number;
  a: string;
  b: string;
  kind: BondKind;
  /** Human-readable notes, each prefixed by direction where useful. */
  notes: string[];
  /** For directed kinds (service, mentor, betrayal): the superior / acting party. */
  from: string;
}
