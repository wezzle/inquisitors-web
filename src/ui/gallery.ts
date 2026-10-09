import { appearanceById, characters, seriesOf } from '../data/codex';
import { FACTIONS, FACTION_ORDER, SERIES, SERIES_ORDER, STATUS } from '../data/theme';
import type { Faction, SeriesId } from '../data/types';
import { DESCRIBED } from './likeness';
import { portraitImg } from './likeness-img';
import { spoilers } from './spoilers';

type Sort = 'significance' | 'name' | 'likeness';

/** The Pict Archive: every soul's reconstructed likeness on one wall. */
export class Gallery {
  private el: HTMLElement;
  private grid: HTMLElement;
  private series: SeriesId | 'all' = 'all';
  private faction: Faction | 'all' = 'all';
  private sort: Sort = 'significance';
  private cache = new Map<string, string>();
  onPick: (id: string) => void = () => {};
  onClose: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'gallery';
    this.el.innerHTML = `
      <div class="g-head">
        <div>
          <div class="g-kicker">+++ Ordo Xenos · Pict Archive +++</div>
          <h2>The Rogues' Gallery</h2>
          <p>Painted character interpretations informed by the chronicles. Backgrounds reflect allegiance; unrecorded details are artistic choices, not testimony.</p>
        </div>
        <button class="g-close" title="Close (Esc)">×</button>
      </div>
      <div class="g-bar">
        <div class="g-group" data-g="series"></div>
        <div class="g-group" data-g="faction"></div>
        <div class="g-group" data-g="sort"></div>
      </div>
      <div class="g-grid"></div>`;
    document.body.appendChild(this.el);
    this.grid = this.el.querySelector('.g-grid')!;
    this.el.querySelector('.g-close')!.addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('[data-id]') as HTMLElement | null;
      if (card) {
        this.close();
        this.onPick(card.dataset.id!);
      }
    });
    this.buildBar();
  }

  get isOpen() {
    return this.el.classList.contains('open');
  }

  open() {
    this.render();
    this.el.classList.add('open');
  }

  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('open');
    this.onClose();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  private buildBar() {
    const btn = (value: string, label: string, color = '') =>
      `<button data-v="${value}" ${color ? `style="--c:${color}"` : ''}>${label}</button>`;
    this.el.querySelector('[data-g=series]')!.innerHTML =
      btn('all', 'All chronicles') + SERIES_ORDER.map((s) => btn(s, SERIES[s].label, SERIES[s].color)).join('');
    this.el.querySelector('[data-g=faction]')!.innerHTML =
      btn('all', 'Every allegiance') + FACTION_ORDER.map((f) => btn(f, FACTIONS[f].label, FACTIONS[f].color)).join('');
    this.el.querySelector('[data-g=sort]')!.innerHTML =
      btn('significance', 'By significance') + btn('likeness', 'Best attested') + btn('name', 'By name');
    this.el.querySelectorAll<HTMLElement>('.g-group').forEach((grp) =>
      grp.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest('button');
        if (!b) return;
        const g = grp.dataset.g!;
        if (g === 'series') this.series = b.dataset.v as SeriesId | 'all';
        if (g === 'faction') this.faction = b.dataset.v as Faction | 'all';
        if (g === 'sort') this.sort = b.dataset.v as Sort;
        this.render();
      }),
    );
  }

  private render() {
    const sel: Record<string, string> = { series: this.series, faction: this.faction, sort: this.sort };
    this.el.querySelectorAll<HTMLElement>('.g-group').forEach((grp) =>
      grp.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === sel[grp.dataset.g!])),
    );
    const rank = { well: 0, partial: 1, none: 2 } as const;
    const list = characters
      .filter((c) => spoilers.isMet(c))
      .filter((c) => this.series === 'all' || seriesOf(c).includes(this.series))
      .filter((c) => this.faction === 'all' || c.faction === this.faction)
      .sort((a, b) => {
        if (this.sort === 'name') return a.name.localeCompare(b.name);
        if (this.sort === 'likeness') {
          const la = rank[appearanceById.get(a.id)?.described ?? 'none'];
          const lb = rank[appearanceById.get(b.id)?.described ?? 'none'];
          return la - lb || b.importance - a.importance || a.name.localeCompare(b.name);
        }
        return b.importance - a.importance || a.name.localeCompare(b.name);
      });
    this.grid.innerHTML = list
      .map((c) => {
        const look = appearanceById.get(c.id);
        if (!this.cache.has(c.id)) this.cache.set(c.id, portraitImg(c, look, 'thumb'));
        const veil = spoilers.isSpoiled(c);
        const mark = !veil ? STATUS[c.status].mark : '';
        return `<button class="g-card imp-${c.importance}" data-id="${c.id}" style="--fc:${FACTIONS[c.faction].color}">
          ${this.cache.get(c.id)}
          <span class="g-name">${c.name}${mark ? ` <i>${mark}</i>` : ''}</span>
          <span class="g-title">${c.title}</span>
          <span class="g-lv lv-${look?.described ?? 'none'}">${DESCRIBED[look?.described ?? 'none']}</span>
        </button>`;
      })
      .join('');
    if (!list.length) this.grid.innerHTML = '<p class="g-empty">No souls match — or you have yet to meet them.</p>';
  }
}
