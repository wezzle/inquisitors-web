import { bonds, bookById, books, characters, charById, locations, seriesOf } from '../data/codex';
import { spoilers } from './spoilers';
import { BONDS, BOND_ORDER, FACTIONS, FACTION_ORDER, IMPORTANCE_LABEL, SERIES, SERIES_ORDER } from '../data/theme';
import type { SeriesId } from '../data/types';
import type { World } from '../scene/world';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/** Left-hand filter panel: chronicles, volumes, allegiances, bonds and significance. */
export function mountFilters(world: World) {
  const f = world.filters;
  const seriesEl = $('f-series');
  const booksEl = $('f-books');
  const facEl = $('f-factions');
  const bondEl = $('f-bonds');
  bondEl.classList.add('bonds');

  const render = () => {
    seriesEl.querySelectorAll<HTMLButtonElement>('[data-series]').forEach((b) => {
      const s = b.dataset.series as SeriesId;
      const any = books.filter((x) => x.series === s).some((x) => f.books.has(x.id));
      b.classList.toggle('off', !any);
    });
    booksEl.querySelectorAll<HTMLButtonElement>('[data-book]').forEach((b) => {
      b.classList.toggle('off', !f.books.has(b.dataset.book!));
      b.classList.toggle('unread', bookById.get(b.dataset.book!)!.order > spoilers.progress);
    });
    const last = books[spoilers.progress];
    $('f-progress-caption').textContent =
      spoilers.progress === books.length - 1
        ? 'All volumes read — every soul and fate revealed'
        : `Read through ${last.title} — later souls hidden, fates veiled`;
    facEl.querySelectorAll<HTMLButtonElement>('[data-faction]').forEach((b) => b.classList.toggle('off', !f.factions.has(b.dataset.faction as never)));
    bondEl.querySelectorAll<HTMLButtonElement>('[data-bond]').forEach((b) => b.classList.toggle('off', !f.bonds.has(b.dataset.bond as never)));
    $('f-importance-caption').textContent =
      f.minImportance === 1 ? 'Every soul catalogued' : `${IMPORTANCE_LABEL[f.minImportance]} figures and above`;
    world.applyFilters();
  };

  for (const s of SERIES_ORDER) {
    const n = characters.filter((c) => seriesOf(c).includes(s)).length;
    const b = document.createElement('button');
    b.className = 'series-btn';
    b.dataset.series = s;
    b.style.setProperty('--sc', SERIES[s].color);
    b.innerHTML = `<span class="num">${SERIES[s].numeral}</span><span class="nm">${SERIES[s].label}</span><span class="ct">${n}</span>`;
    b.title = SERIES[s].sub + ' — click to toggle, shift-click to isolate';
    b.addEventListener('click', (e) => {
      const ids = books.filter((x) => x.series === s).map((x) => x.id);
      if (e.shiftKey) {
        f.books.clear();
        ids.forEach((id) => f.books.add(id));
      } else {
        const any = ids.some((id) => f.books.has(id));
        ids.forEach((id) => (any ? f.books.delete(id) : f.books.add(id)));
      }
      render();
    });
    seriesEl.appendChild(b);
  }

  for (const bk of books) {
    const b = document.createElement('button');
    b.className = `chip ${bk.kind}`;
    b.dataset.book = bk.id;
    b.style.setProperty('--sc', SERIES[bk.series].color);
    b.textContent = bk.title;
    b.title = `${bk.title} (${bk.year}) — ${bk.summary}\nShift-click to isolate.`;
    b.addEventListener('click', (e) => {
      if (e.shiftKey) {
        f.books.clear();
        f.books.add(bk.id);
      } else if (f.books.has(bk.id)) f.books.delete(bk.id);
      else f.books.add(bk.id);
      render();
    });
    booksEl.appendChild(b);
  }

  for (const fac of FACTION_ORDER) {
    const n = characters.filter((c) => c.faction === fac).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.dataset.faction = fac;
    b.style.setProperty('--c', FACTIONS[fac].color);
    b.innerHTML = `<i></i>${FACTIONS[fac].label}<span class="ct">${n}</span>`;
    b.title = FACTIONS[fac].blurb + ' — shift-click to isolate';
    b.addEventListener('click', (e) => {
      if (e.shiftKey) {
        f.factions.clear();
        f.factions.add(fac);
      } else if (f.factions.has(fac)) f.factions.delete(fac);
      else f.factions.add(fac);
      render();
    });
    b.addEventListener('mouseenter', () => world.preview({ faction: fac }));
    b.addEventListener('mouseleave', () => world.preview({}));
    facEl.appendChild(b);
  }

  for (const k of BOND_ORDER) {
    const n = bonds.filter((b) => b.kind === k).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.dataset.bond = k;
    b.style.setProperty('--c', BONDS[k].color);
    b.innerHTML = `<i></i>${BONDS[k].label}<span class="ct">${n}</span>`;
    b.title = 'Shift-click to isolate';
    b.addEventListener('click', (e) => {
      if (e.shiftKey) {
        f.bonds.clear();
        f.bonds.add(k);
      } else if (f.bonds.has(k)) f.bonds.delete(k);
      else f.bonds.add(k);
      render();
    });
    b.addEventListener('mouseenter', () => world.preview({ bond: k }));
    b.addEventListener('mouseleave', () => world.preview({}));
    bondEl.appendChild(b);
  }

  const prog = $<HTMLInputElement>('f-progress');
  prog.max = String(books.length - 1);
  prog.value = String(spoilers.progress);
  prog.addEventListener('input', () => spoilers.set({ progress: Number(prog.value) }));
  spoilers.onChange(() => {
    prog.value = String(spoilers.progress);
    render();
  });
  $('f-progress-ticks').innerHTML = books
    .map((b) => `<i style="--sc:${SERIES[b.series].color}" class="${b.kind}" title="${b.title}"></i>`)
    .join('');

  const range = $<HTMLInputElement>('f-importance');
  range.addEventListener('input', () => {
    f.minImportance = Number(range.value);
    render();
  });

  $('f-reset').addEventListener('click', () => {
    books.forEach((b) => f.books.add(b.id));
    FACTION_ORDER.forEach((x) => f.factions.add(x));
    BOND_ORDER.forEach((x) => f.bonds.add(x));
    f.minImportance = 1;
    range.value = '1';
    render();
  });

  const panel = $('filters');
  $('filters-toggle').addEventListener('click', () => panel.classList.toggle('collapsed'));
  if (window.innerWidth < 760) panel.classList.add('collapsed');
  render();
  /** Isolate one chronicle (or restore all if it is already isolated). */
  const isolateSeries = (s: SeriesId) => {
    const ids = books.filter((x) => x.series === s).map((x) => x.id);
    const isolated = f.books.size === ids.length && ids.every((id) => f.books.has(id));
    f.books.clear();
    (isolated ? books.map((x) => x.id) : ids).forEach((id) => f.books.add(id));
    render();
  };
  return { toggle: () => panel.classList.toggle('collapsed'), isolateSeries };
}

/** Name search with live highlighting in the scene and a keyboard-navigable result list. */
export function mountSearch(world: World, select: (id: string) => void, glossia?: () => void) {
  const input = $<HTMLInputElement>('search');
  const list = $('search-results');
  let active = 0;
  let results: string[] = [];
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const run = () => {
    const q = norm(input.value.trim());
    if (!q) {
      results = [];
      list.classList.remove('open');
      world.setQuery(null);
      return;
    }
    const scored = characters
      .filter((c) => spoilers.isMet(c))
      .map((c) => {
        const hay = [c.name, ...c.aliases].map(norm);
        let s = 0;
        if (hay.some((h) => h.startsWith(q))) s = 3;
        else if (hay.some((h) => h.split(/[\s'-]+/).some((w) => w.startsWith(q)))) s = 2;
        else if (hay.some((h) => h.includes(q))) s = 1;
        else if (norm(c.title).includes(q) || c.traits.some((t) => norm(t).includes(q))) s = 0.5;
        return { c, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.c.importance - a.c.importance);
    results = scored.map((x) => x.c.id);
    active = 0;
    world.setQuery(new Set(results));
    list.innerHTML =
      scored
        .slice(0, 14)
        .map(
          ({ c }, i) =>
            `<li data-id="${c.id}" class="${i === 0 ? 'active' : ''}" style="--fc:${FACTIONS[c.faction].color}"><span class="dot"></span><span class="n">${c.name}</span><span class="t">${c.title}</span></li>`,
        )
        .join('') || '<li><span></span><span class="t">No such soul in the records.</span></li>';
    list.classList.add('open');
  };

  const choose = (id: string) => {
    input.value = '';
    run();
    input.blur();
    select(id);
  };

  input.addEventListener('input', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = list.querySelectorAll('li[data-id]');
      if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('active', i === active));
    } else if (e.key === 'Enter') {
      // Glossia: the private cant of Eisenhorn's circle
      if (glossia && /^thorn\s+wishes\s+talon$/i.test(input.value.trim())) {
        input.value = '';
        run();
        input.blur();
        return glossia();
      }
      if (results[active]) choose(results[active]);
    } else if (e.key === 'Escape') {
      input.value = '';
      run();
      input.blur();
    }
    e.stopPropagation();
  });
  list.addEventListener('pointerdown', (e) => {
    const li = (e.target as HTMLElement).closest('li[data-id]') as HTMLElement | null;
    if (li) {
      e.preventDefault();
      choose(li.dataset.id!);
    }
  });
  input.addEventListener('blur', () => setTimeout(() => list.classList.remove('open'), 150));
  input.addEventListener('focus', () => input.value && run());
  return { focus: () => input.focus() };
}

/** Hover card that follows the cursor. */
export function mountTooltip() {
  const el = $('tooltip');
  let current: string | null = null;
  return (id: string | null, ev?: PointerEvent) => {
    if (!id) {
      el.classList.remove('show');
      current = null;
      delete el.dataset.loc;
      return;
    }
    const c = charById.get(id)!;
    if (id !== current || el.dataset.loc) {
      current = id;
      delete el.dataset.loc;
      el.style.setProperty('--fc', FACTIONS[c.faction].color);
      el.innerHTML = `<div class="n">${c.name}</div><div class="t">${c.title}</div>${c.epithet ? `<div class="e">${c.epithet}</div>` : ''}`;
    }
    el.classList.add('show');
    if (ev) {
      const x = Math.min(ev.clientX + 18, window.innerWidth - el.offsetWidth - 12);
      const y = Math.min(ev.clientY + 18, window.innerHeight - el.offsetHeight - 40);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  };
}

const THOUGHTS = [
  'Innocence proves nothing',
  'A suspicious mind is a healthy mind',
  'Blessed is the mind too small for doubt',
  'Only in death does duty end',
  'Knowledge is power, guard it well',
  'Hope is the first step on the road to disappointment',
  'Even a man who has nothing can still offer his life',
  'The wise man learns from the deaths of others',
  'Heresy grows from idleness',
  'There is no such thing as innocence, only degrees of guilt',
];

export function mountTicker() {
  const cast = characters.length;
  const lines = [
    `${cast} souls catalogued`,
    `${bonds.length} bonds recorded`,
    `${books.length} volumes indexed`,
    ...THOUGHTS.map((t) => `Thought for the day: ${t}`),
    'Ordo Xenos · Ordo Malleus · Ordo Hereticus',
    'Calixis Sector · Segmentum Obscurus',
    'Report all unsanctioned psykers to the Black Ships',
  ];
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  $('ticker').textContent = lines.map((l) => `+++ ${l} `).join('') + '+++';
  $('brand-sub').textContent = `Dramatis personæ of Dan Abnett's Eisenhorn, Ravenor & Bequin chronicles — ${cast} souls, ${bonds.length} bonds`;
}

/** Hover card for worlds and places on the Chronicle. */
export function mountLocationTooltip() {
  const el = $('tooltip');
  return (id: string, ev?: PointerEvent) => {
    const l = locations.find((x) => x.id === id);
    if (!l) return;
    if (el.dataset.loc !== id) {
      el.dataset.loc = id;
      el.style.setProperty('--fc', '#c9a24b');
      const first = books.find((b) => l.books.includes(b.id));
      el.innerHTML = `<div class="n">${l.name}</div><div class="t">${l.type !== 'other' ? l.type + ' · ' : ''}first seen in ${first?.title ?? '?'}</div><div class="e">${l.note}</div>`;
    }
    el.classList.add('show');
    if (ev) {
      el.style.left = `${Math.min(ev.clientX + 18, window.innerWidth - el.offsetWidth - 12)}px`;
      el.style.top = `${Math.min(ev.clientY + 18, window.innerHeight - el.offsetHeight - 40)}px`;
    }
  };
}
