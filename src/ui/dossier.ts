import { appearanceById, bondsOf, bookById, books, characters, charById, locations, other, seriesOf } from '../data/codex';
import type { Appearance } from '../data/types';
import { DESCRIBED, likenessChips } from './likeness';
import { inferredAttire } from './portrait';
import { hasPortrait, portraitImg } from './likeness-img';
import { BONDS, BOND_ORDER, FACTIONS, IMPORTANCE_LABEL, PSY, SERIES, STATUS } from '../data/theme';
import type { Character, SeriesId } from '../data/types';
import { drawSeal } from './sigils';
import { spoilers } from './spoilers';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Stable pseudo-catalogue number, e.g. "XN-0412-Θ". */
function catalogue(c: Character) {
  let h = 2166136261;
  for (const ch of c.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const greek = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  const prefix: Record<string, string> = { eisenhorn: 'EH', ravenor: 'RV', bequin: 'BQ' };
  const s = seriesOf(c)[0] ?? 'eisenhorn';
  return `${prefix[s]}-${String((h >>> 0) % 10000).padStart(4, '0')}-${greek[(h >>> 8) % greek.length]}`;
}

const PURITY_SEAL = `
<svg class="purity-seal" viewBox="0 0 60 130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wax" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d0393a"/><stop offset=".6" stop-color="#8e1416"/><stop offset="1" stop-color="#4a0708"/></radialGradient>
    <linearGradient id="parch" x1="0" x2="1"><stop offset="0" stop-color="#d9c7a0"/><stop offset=".5" stop-color="#efe1bf"/><stop offset="1" stop-color="#c4ad7f"/></linearGradient>
  </defs>
  <path d="M14 26 L24 26 L22 122 L17 116 L12 124 Z" fill="url(#parch)"/>
  <path d="M34 26 L46 26 L49 108 L43 102 L38 110 Z" fill="url(#parch)"/>
  <g fill="#5a4630" opacity=".65">
    <rect x="15" y="40" width="7" height="1"/><rect x="15" y="45" width="6" height="1"/><rect x="15" y="50" width="7" height="1"/><rect x="15" y="55" width="5" height="1"/><rect x="15" y="60" width="7" height="1"/><rect x="15" y="65" width="6" height="1"/><rect x="15" y="70" width="7" height="1"/>
    <rect x="37" y="40" width="8" height="1"/><rect x="37" y="45" width="7" height="1"/><rect x="38" y="50" width="8" height="1"/><rect x="38" y="55" width="6" height="1"/><rect x="38" y="60" width="8" height="1"/>
  </g>
  <path d="M30 4 C44 3 55 12 55 26 C56 39 46 49 31 49 C15 50 5 41 5 27 C4 13 15 4 30 4 Z" fill="url(#wax)"/>
  <circle cx="30" cy="27" r="15" fill="none" stroke="#5c0a0b" stroke-width="2" opacity=".7"/>
  <g fill="#5c0a0b" opacity=".85"><rect x="28.3" y="15" width="3.4" height="24"/><rect x="23" y="17" width="14" height="2.4"/><rect x="21.5" y="35" width="17" height="2.4"/><circle cx="30" cy="26" r="5"/></g>
</svg>`;

export class Dossier {
  private el: HTMLElement;
  private current: string | null = null;
  onNavigate: (id: string) => void = () => {};
  onClose: () => void = () => {};
  onPreview: (id: string, on: boolean) => void = () => {};
  onHide: () => void = () => {};

  private wireGoto() {
    this.el.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) => {
      b.addEventListener('click', () => this.onNavigate(b.dataset.goto!));
      b.addEventListener('mouseenter', () => this.onPreview(b.dataset.goto!, true));
      b.addEventListener('mouseleave', () => this.onPreview(b.dataset.goto!, false));
    });
  }

  constructor() {
    this.el = document.getElementById('dossier')!;
  }

  /** Re-render whatever card is open (after spoiler settings change). */
  refresh() {
    const cur = this.current;
    if (!cur) return;
    if (cur.startsWith('book:')) this.showBook(cur.slice(5));
    else if (cur.startsWith('loc:')) this.showLocation(cur.slice(4));
    else void this.show(cur);
  }

  get isOpen() {
    return this.current !== null;
  }

  hide() {
    this.current = null;
    this.el.classList.remove('open');
    document.body.classList.remove('dossier-open');
    this.onHide();
  }

  /** A place card: what it is, and the volumes that visit it (unread ones veiled). */
  showLocation(id: string) {
    const l = locations.find((x) => x.id === id)!;
    this.current = `loc:${id}`;
    this.el.style.setProperty('--fc', '#c9a24b');
    const vols = books.filter((b) => l.books.includes(b.id));
    const volHtml = vols
      .map((b) => {
        const unread = b.order > spoilers.progress;
        return `<button data-book="${b.id}" style="--fc:${SERIES[b.series].color};--bc:${SERIES[b.series].color}" ${unread ? 'class="unread"' : ''}>
          <i></i><span><span class="n">${unread ? 'An unread volume' : esc(b.title)}</span><span class="note">${SERIES[b.series].label} · ${b.year}</span></span>
          <span class="kind">${b.kind === 'short' ? 'Short story' : 'Novel'}</span></button>`;
      })
      .join('');
    this.el.innerHTML = `
      <button class="close" title="Close (Esc)">×</button>
      <div class="d-head-strip"><span>+++ Astrocartographic record +++</span><span>${l.type === 'other' ? 'Place' : esc(l.type)}</span></div>
      <div class="scroll">
        <div class="d-book-hero">
          <div class="yr">${l.type === 'other' ? 'Place of note' : esc(l.type)}</div>
          <h2>${esc(l.name)}</h2>
        </div>
        <div class="d-sec"><h4>Record</h4><p class="d-text">${esc(l.note)}</p></div>
        <div class="d-sec"><h4>Visited in · ${vols.length}</h4><div class="d-assoc">${volHtml}</div></div>
      </div>`;
    this.el.classList.add('open');
    document.body.classList.add('dossier-open');
    this.el.querySelector('.close')!.addEventListener('click', () => this.onClose());
    this.el.querySelectorAll<HTMLButtonElement>('[data-book]').forEach((b) => b.addEventListener('click', () => this.onBook(b.dataset.book!)));
  }
  onBook: (id: string) => void = () => {};

  /** A volume card: synopsis, the worlds it visits and its dramatis personae. */
  showBook(bookId: string) {
    const b = bookById.get(bookId)!;
    this.current = `book:${bookId}`;
    const sc = SERIES[b.series].color;
    this.el.style.setProperty('--fc', sc);
    const unread = b.order > spoilers.progress;
    const cast = characters
      .filter((c) => c.books.includes(b.id) && spoilers.isMet(c))
      .sort((x, y) => y.importance - x.importance || x.name.localeCompare(y.name));
    const worlds = locations.filter((l) => l.books.includes(b.id));
    const castHtml = cast
      .map(
        (c) => `<button data-goto="${c.id}" style="--fc:${FACTIONS[c.faction].color};--bc:${FACTIONS[c.faction].color}">
          <i></i><span><span class="n">${esc(c.name)}</span><span class="note">${esc(c.title)}</span></span>
          <span class="kind">${'◆'.repeat(c.importance)}</span></button>`,
      )
      .join('');
    const worldHtml = worlds
      .map((l) => `<div class="d-world" data-loc="${l.id}"><span class="n">${esc(l.name)}</span>${l.type && l.type !== 'other' ? `<span class="t">${esc(l.type)}</span>` : ''}<p>${esc(l.note)}</p></div>`)
      .join('');
    this.el.innerHTML = `
      <button class="close" title="Close (Esc)">×</button>
      <div class="d-head-strip"><span>+++ Volume ${b.order + 1} of ${books.length} +++</span><span>${SERIES[b.series].label} · ${b.kind === 'short' ? 'Short story' : 'Novel'}</span></div>
      <div class="scroll">
        <div class="d-book-hero">
          <div class="yr">${b.year}</div>
          <h2>${esc(b.title)}</h2>
          <div class="sub">${SERIES[b.series].label} chronicle · Dan Abnett</div>
        </div>
        <div class="d-sec"><h4>Synopsis</h4><p class="d-text ${unread ? 'veiled' : ''}" data-spoiler>${esc(b.summary)}</p></div>
        ${worldHtml ? `<div class="d-sec"><h4>Worlds &amp; places · ${worlds.length}</h4><div class="d-worlds ${unread ? 'veiled' : ''}" data-spoiler>${worldHtml}</div></div>` : ''}
        <div class="d-sec"><h4>Dramatis personæ · ${cast.length}</h4><div class="d-assoc">${castHtml || '<p class="d-text plain">Read further to meet them.</p>'}</div></div>
      </div>`;
    this.el.classList.add('open');
    document.body.classList.add('dossier-open');
    this.el.querySelector('.close')!.addEventListener('click', () => this.onClose());
    this.wireGoto();
    this.el.querySelectorAll<HTMLElement>('[data-spoiler]').forEach((s) => s.addEventListener('click', () => s.classList.toggle('unveiled')));
    this.el.querySelectorAll<HTMLElement>('[data-loc]').forEach((x) =>
      x.addEventListener('click', (e) => {
        if (!(x.closest('[data-spoiler]') as HTMLElement | null)?.classList.contains('veiled') || (x.closest('[data-spoiler]') as HTMLElement).classList.contains('unveiled')) {
          e.stopPropagation();
          this.showLocation(x.dataset.loc!);
        }
      }),
    );
  }

  async show(id: string) {
    const c = charById.get(id)!;
    this.current = id;
    const fc = FACTIONS[c.faction].color;
    this.el.style.setProperty('--fc', fc);
    const series = seriesOf(c);
    const bonds = [...bondsOf.get(id)!].filter((b) => spoilers.isMet(charById.get(other(b, id))!)).sort(
      (a, b) =>
        BOND_ORDER.indexOf(a.kind) - BOND_ORDER.indexOf(b.kind) ||
        charById.get(other(b, id))!.importance - charById.get(other(a, id))!.importance,
    );
    const pips = Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < c.importance ? 'on' : ''}"></span>`).join('');
    const appear = books
      .map((b) => {
        if (b.order > spoilers.progress)
          return `<div class="b unread ${b.kind}" style="--sc:${SERIES[b.series].color}" title="${esc(b.title)} — not yet read">?</div>`;
        const on = c.books.includes(b.id);
        return `<div class="b ${on ? 'on' : ''} ${b.kind}" data-book="${b.id}" style="--sc:${SERIES[b.series].color}" title="${esc(b.title)} (${b.year})${on ? '' : ' — absent'} · click for the volume's card">${b.abbr}</div>`;
      })
      .join('');
    // arcs from chronicles the reader hasn't reached yet stay sealed
    const reached = (s: SeriesId) => books.findIndex((b) => b.series === s) <= spoilers.progress;
    const arcSeries = (['eisenhorn', 'ravenor', 'bequin'] as SeriesId[]).filter((s) => c.arcs[s] && reached(s));
    const primary = arcSeries.find((s) => c.arcs[s] === c.summary) ?? arcSeries[0];
    const record =
      arcSeries.length > 1
        ? `<div class="d-sec d-arcs"><h4>Record across the chronicles</h4>
            <div class="tabs">${arcSeries.map((s) => `<button data-arc="${s}" class="${s === primary ? 'on' : ''}" style="--sc:${SERIES[s].color}">${SERIES[s].label}</button>`).join('')}</div>
            <p class="d-text" data-arc-text>${esc(c.arcs[primary]!)}</p></div>`
        : `<div class="d-sec"><h4>Record</h4><p class="d-text">${esc(primary ? c.arcs[primary]! : c.summary)}</p></div>`;
    const assoc = bonds
      .map((b) => {
        const o = charById.get(other(b, id))!;
        const note = b.notes.find((n) => n.startsWith(c.name.split(' ')[0] + ':')) ?? b.notes[0] ?? '';
        const clean = note.replace(/^[^:]+:\s*/, '');
        return `<button data-goto="${o.id}" style="--fc:${FACTIONS[o.faction].color};--bc:${BONDS[b.kind].color}">
          <i></i><span><span class="n">${esc(o.name)}</span>${clean ? `<span class="note">${esc(clean)}</span>` : ''}</span>
          <span class="kind">${BONDS[b.kind].label}</span></button>`;
      })
      .join('');
    const srcs = c.sources
      .slice(0, 4)
      .map((u) => {
        let host = u;
        try {
          host = new URL(u).hostname.replace(/^www\./, '');
        } catch {
          /* keep raw */
        }
        return `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host)}</a>`;
      })
      .join(' · ');

    const look = appearanceById.get(id);
    const likeness = look ? likenessSection(look, spoilers.isSpoiled(c), c) : '';
    this.el.innerHTML = `
      ${PURITY_SEAL}
      <button class="close" title="Release (Esc)">×</button>
      <div class="d-head-strip"><span>+++ Dossier ${catalogue(c)} +++</span><span class="ser">${series.map((s) => `<b style="color:${SERIES[s].color}">${SERIES[s].label}</b>`).join(' · ')}</span></div>
      <div class="scroll">
        <div class="d-hero">
          <div class="d-portrait">${hasPortrait(c.id) ? `<button class="d-pict-open" data-pict="${c.id}" title="View full portrait" aria-label="View portrait of ${esc(c.name)}">${portraitImg(c, look)}</button>` : portraitImg(c, look)}<div class="d-seal"></div></div>
          <div>
            <h2 class="d-name">${esc(c.name)}</h2>
            <div class="d-title">${esc(c.title)}</div>
            ${c.aliases.length ? `<div class="d-alias">Also known as ${c.aliases.map(esc).join(', ')}</div>` : ''}
            <button class="d-link" title="Copy a link to this dossier">⧉ copy link</button>
          </div>
        </div>
        ${c.epithet ? `<div class="d-epithet">${esc(c.epithet)}</div>` : ''}
        <div class="d-stats">
          <div class="d-stat"><div class="k">Allegiance</div><div class="v" style="color:${fc}">${FACTIONS[c.faction].label}</div></div>
          <div class="d-stat"><div class="k">Psychic profile</div><div class="v">${PSY[c.psy].glyph} ${PSY[c.psy].label}</div></div>
          <div class="d-stat"><div class="k">Status</div><div class="v" data-spoiler>${STATUS[c.status].mark} ${STATUS[c.status].label}</div></div>
          <div class="d-stat"><div class="k">Significance</div><div class="v">${pips}</div></div>
          ${c.origin ? `<div class="d-stat" style="grid-column:1/-1"><div class="k">Origin</div><div class="v">${esc(c.origin)}</div></div>` : ''}
        </div>
        <div class="d-sec"><h4>Appearances</h4>
          <div class="d-appear" style="--n:${books.length}">${appear}</div>
          <div class="d-appear-legend"><span>${books[0].title}, ${books[0].year}</span><span>${IMPORTANCE_LABEL[c.importance]} · ${spoilers.progress === books.length - 1 ? `${c.books.length} of ${books.length}` : 'reading…'}</span><span>${books[books.length - 1].title}, ${books[books.length - 1].year}</span></div>
        </div>
        ${record}
        ${likeness}
        ${c.fate ? `<div class="d-sec"><h4>Fate</h4><div class="d-fate" data-spoiler>${esc(c.fate)}</div></div>` : ''}
        ${c.wargear ? `<div class="d-sec"><h4>Wargear &amp; effects</h4><p class="d-text plain" style="font-size:14.5px">${esc(c.wargear)}</p></div>` : ''}
        ${c.traits.length ? `<div class="d-sec"><h4>Marks</h4><div class="d-tags">${c.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>` : ''}
        ${assoc ? `<div class="d-sec"><h4>Known associates · ${bonds.length}</h4><div class="d-assoc">${assoc}</div></div>` : ''}
        <div class="d-hint">Shift-click another soul to trace the thread that binds them.</div>
        ${srcs ? `<div class="d-sources">Sources: ${srcs}</div>` : ''}
      </div>`;
    this.el.classList.add('open');
    document.body.classList.add('dossier-open');
    this.el.querySelector('.scroll')!.scrollTop = 0;

    this.el.querySelector('.close')!.addEventListener('click', () => this.onClose());
    this.wireGoto();
    const veiled = spoilers.isSpoiled(c);
    this.el.querySelectorAll<HTMLElement>('[data-spoiler]').forEach((s) => {
      s.classList.toggle('veiled', veiled);
      s.title = veiled ? 'Veiled: this soul\'s story continues past your reading. Click to unveil.' : '';
      s.addEventListener('click', () => s.classList.toggle('unveiled'));
    });
    this.el.querySelectorAll<HTMLElement>('.d-appear [data-book]').forEach((b) => b.addEventListener('click', () => this.onBook(b.dataset.book!)));
    const link = this.el.querySelector<HTMLButtonElement>('.d-link')!;
    link.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}#${id}`;
      try {
        await navigator.clipboard.writeText(url);
        link.textContent = '✓ copied';
      } catch {
        link.textContent = url;
      }
      setTimeout(() => (link.textContent = '⧉ link'), 1800);
    });
    this.el.querySelectorAll<HTMLButtonElement>('[data-arc]').forEach((b) =>
      b.addEventListener('click', () => {
        this.el.querySelectorAll('[data-arc]').forEach((x) => x.classList.toggle('on', x === b));
        this.el.querySelector('[data-arc-text]')!.textContent = c.arcs[b.dataset.arc as SeriesId] ?? '';
      }),
    );

    const seal = await drawSeal(c, 256);
    if (this.current === id) this.el.querySelector('.d-seal')?.replaceChildren(seal);
  }
}

function likenessSection(a: Appearance, veil: boolean, c: Character) {
  const inferred = inferredAttire(a, c);
  const chips = likenessChips(a);
  const testimony = a.evidence
    .map((e) => {
      let host = e.source;
      try {
        host = new URL(e.source).hostname.replace(/^www\./, '');
      } catch {
        /* local research file */
      }
      const link = /^https?:/.test(e.source) ? `<a href="${esc(e.source)}" target="_blank" rel="noopener">${esc(host)}</a>` : `<span>${esc(host.replace(/^.*\//, ''))}</span>`;
      return `<li>${esc(e.claim)} <span class="src">— ${link}</span></li>`;
    })
    .join('');
  return `<div class="d-sec d-likeness"><h4>Likeness <span class="lv lv-${a.described}">${DESCRIBED[a.described]}</span></h4>
    ${a.summary ? `<p class="d-text plain ${veil ? 'veiled' : ''}" data-spoiler>${esc(a.summary)}</p>` : ''}
    ${chips.length ? `<div class="d-tags likeness">${chips.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    ${testimony ? `<details class="d-testimony"><summary>Testimony · ${a.evidence.length}</summary><ul>${testimony}</ul></details>` : ''}
    <div class="d-note">${hasPortrait(c.id) ? 'AI-painted artistic interpretation informed by the descriptions above. Unrecorded details and allegiance-based backgrounds are creative choices, not additional canonical evidence.' : `Portrait reconstructed from the descriptions above; anything the books leave unsaid is left in shadow${inferred.length ? ', and the ghosted clothing is only typical of their role' : ''}.`}</div>
  </div>`;
}
