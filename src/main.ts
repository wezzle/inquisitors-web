import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel-decorative/400.css';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource/unifrakturmaguntia/400.css';
import '@fontsource/share-tech-mono/400.css';
import './style.css';

import * as THREE from 'three';
import { bonds, bondsOf, books, charById, characters, other, roleOf } from './data/codex';
import { BONDS, BOND_ORDER, FACTIONS } from './data/theme';
import type { LayoutId } from './scene/layouts';
import { Stage } from './scene/stage';
import { World } from './scene/world';
import { Choir } from './ui/audio';
import { Dossier } from './ui/dossier';
import { mountFilters, mountLocationTooltip, mountSearch, mountTicker, mountTooltip } from './ui/hud';
import { emblemSVG } from './ui/sigils';
import { spoilers } from './ui/spoilers';
import { Saga } from './ui/saga';
import { Tour } from './ui/tour';

const params = new URLSearchParams(location.search);
const $ = (id: string) => document.getElementById(id)!;

document.body.classList.add('pre');
spoilers.load();
const stage = new Stage($('stage'));
const world = new World(stage);
const dossier = new Dossier();
const choir = new Choir();
const tooltip = mountTooltip();
const tooltipLoc = mountLocationTooltip();
const filters = mountFilters(world);
mountTicker();

// keep the focus of the scene in the part of the screen the panels leave free
stage.freeArea = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const a = { x0: 0, y0: 0, x1: W, y1: H };
  const d = document.getElementById('dossier')!;
  if (d.classList.contains('open')) {
    const r = d.getBoundingClientRect();
    if (W < 760) {
      a.y1 = r.top;
      a.y0 = document.querySelector('.hud-top')!.getBoundingClientRect().bottom;
    } else a.x1 = r.left;
  }
  const f = document.getElementById('filters')!;
  const fr = W >= 760 && !f.classList.contains('collapsed') ? f.getBoundingClientRect().right : 0;
  // captions sit centred in the gap between the panels
  const cap = document.getElementById('caption')!;
  cap.style.left = `${(fr + a.x1) / 2}px`;
  cap.style.maxWidth = `${Math.max(280, a.x1 - fr - 40)}px`;
  a.x0 = fr * 0.6;
  return a;
};

let hintDone = false;
let glossiaCall = false;
function dismissHint() {
  if (hintDone) return;
  hintDone = true;
  $('hint').classList.remove('show');
  localStorage.setItem('iw-hinted', '1');
}

// ---------------------------------------------------------------- selection
function select(id: string | null) {
  if (id && !spoilers.isMet(charById.get(id)!)) return;
  // a soul hidden by the filters is revealed by restoring them
  if (id && !world.passes(id)) $('f-reset').click();
  void world.select(id);
}
world.onSelect = (id) => {
  if (id) dismissHint();
  if (id) world.setCast(null);
  if (id) {
    void dossier.show(id);
    const c = charById.get(id)!;
    choir.bell(c.faction === 'heretic' || c.faction === 'daemon');
    history.replaceState(null, '', `#${id}`);
  } else {
    dossier.hide();
    history.replaceState(null, '', location.pathname + location.search);
  }
};
let lastHover: string | null = null;
world.onHover = (id, ev) => {
  tooltip(world.selected === id ? null : id, ev);
  if (id && id !== lastHover) choir.tick();
  lastHover = id;
};
world.onHoverLoc = (id, ev) => {
  if (id) tooltipLoc(id, ev);
  else if (!world.hovered) tooltip(null);
};
world.onLocation = (id) => {
  tour.stop();
  tooltip(null);
  world.setCast(null);
  if (world.selected) select(null);
  dossier.showLocation(id);
  choir.bell();
};
dossier.onNavigate = (id) => {
  tour.stop();
  select(id);
};
const caption = $('caption');
world.onThread = (t, from, to) => {
  if (!t && !from) {
    caption.classList.remove('show', 'thread');
    return;
  }
  tour.stop();
  caption.classList.add('show', 'thread');
  caption.style.setProperty('--fc', '#f0d08a');
  if (!t) {
    caption.innerHTML = `<div class="step">+++ No thread binds them +++</div><div class="e">${charById.get(from)!.name} and ${charById.get(to)!.name} share no chain of bonds among the souls on show.</div>`;
    return;
  }
  const chain = t.ids
    .map((id, i) => {
      const c = charById.get(id)!;
      const name = `<b style="color:${FACTIONS[c.faction].color}">${c.name}</b>`;
      if (!i) return name;
      const b = bonds[t.bonds[i - 1]];
      return `<i style="color:${BONDS[b.kind].color}">— ${roleOf(b, t.ids[i - 1]).toLowerCase()} —</i> ${name}`;
    })
    .join(' ');
  const head = glossiaCall ? 'Thorn wishes Talon · Talon attends' : `A thread of ${t.bonds.length} bond${t.bonds.length > 1 ? 's' : ''}`;
  glossiaCall = false;
  caption.innerHTML = `<div class="step">+++ ${head} +++</div><div class="chain">${chain}</div><div class="hint">Esc or click empty space to release</div>`;
};
dossier.onBook = (id) => world.onBook(id);
dossier.onPreview = (id, on) => {
  const n = world.nodes.get(id);
  if (n) n.hoverTarget = on ? 1 : 0;
};
dossier.onClose = () => {
  if (world.selected) select(null);
  else dossier.hide();
};
world.onBook = (id) => {
  tour.stop();
  if (world.selected) select(null);
  dossier.showBook(id);
  // light up the volume's cast in the scene while its card is open
  world.setCast(new Set(characters.filter((c) => c.books.includes(id)).map((c) => c.id)));
  choir.bell();
};
dossier.onHide = () => world.setCast(null);
const search = mountSearch(
  world,
  (id) => {
    tour.stop();
    select(id);
  },
  () => {
    // "Thorn wishes Talon": Eisenhorn summons Ravenor
    tour.stop();
    select('gregor-eisenhorn');
    setTimeout(() => {
      glossiaCall = true;
      world.traceTo('gideon-ravenor');
    }, 900);
    choir.bell(true);
  },
);

// ---------------------------------------------------------------- layouts
const layoutButtons = [...document.querySelectorAll<HTMLButtonElement>('#layouts button')];
function setLayout(id: LayoutId) {
  layoutButtons.forEach((b) => b.classList.toggle('on', b.dataset.layout === id));
  if (id !== world.layout) choir.whoosh();
  world.setLayout(id);
}
layoutButtons.forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout as LayoutId)));

// ---------------------------------------------------------------- tour
const TOUR = [
  'gregor-eisenhorn',
  'alizebeth-bequin',
  'uber-aemos',
  'godwyn-fischig',
  'midas-betancore',
  'pontius-glaw',
  'cherubael',
  'quixos',
  'gideon-ravenor',
  'harlon-nayl',
  'kara-swole',
  'patience-kys',
  'carl-thonius',
  'zygmunt-molotch',
  'beta-bequin',
  'medea-betancore',
];
const tour = new Tour(world, (id) => select(id), [
  ...TOUR,
  ...characters
    .filter((c) => c.importance >= 4 && !TOUR.includes(c.id))
    .sort((a, b) => b.importance - a.importance)
    .map((c) => c.id),
]);
const tourBtn = $('btn-tour');
tour.onStop = () => tourBtn.classList.remove('on');
tour.onLayout = (id) => {
  layoutButtons.forEach((b) => b.classList.toggle('on', b.dataset.layout === id));
  world.setLayout(id, false);
};
tourBtn.addEventListener('click', () => {
  if (tour.active) tour.stop();
  else {
    saga.stop();
    tour.start();
    tourBtn.classList.toggle('on', tour.active);
  }
});
stage.labels.domElement.addEventListener('pointerdown', () => tour.stop());

// ---------------------------------------------------------------- saga
const saga = new Saga(stage, () => {
  tour.stop();
  select(null);
  dossier.hide();
  layoutButtons.forEach((b) => b.classList.toggle('on', b.dataset.layout === 'chronicle'));
  if (world.layout !== 'chronicle') choir.whoosh();
  world.setLayout('chronicle', false);
});
const sagaBtn = $('btn-saga');
saga.onStop = () => {
  sagaBtn.textContent = '▶ Replay the saga';
  sagaBtn.classList.remove('on');
};
sagaBtn.addEventListener('click', () => {
  if (saga.active) return saga.stop();
  sagaBtn.textContent = '■ Halt the replay';
  sagaBtn.classList.add('on');
  saga.start();
});
stage.labels.domElement.addEventListener('pointerdown', () => saga.stop());
world.onRegion = (s) => filters.isolateSeries(s);
// moving the bookmark by hand ends any replay first (capture phase runs before the slider's own handler)
document.addEventListener('input', (e) => (e.target as HTMLElement).id === 'f-progress' && saga.stop(false), true);

// ---------------------------------------------------------------- toggles
const spoilerBtn = $('btn-spoiler');
spoilers.onChange(() => {
  spoilerBtn.classList.toggle('on', spoilers.all);
  world.applySpoilers();
  dossier.refresh();
});
spoilerBtn.addEventListener('click', () => spoilers.set({ all: !spoilers.all }));
spoilerBtn.classList.toggle('on', spoilers.all);

const soundBtn = $('btn-sound');
function setSound(on: boolean) {
  choir.toggle(on);
  soundBtn.classList.toggle('on', on);
}
soundBtn.addEventListener('click', () => setSound(!choir.on));

document.querySelector('.brand-title')!.addEventListener('click', () => {
  select(null);
  world.overview();
});

const help = $('help');
$('btn-help').addEventListener('click', () => help.classList.toggle('open'));
$('help-close').addEventListener('click', () => help.classList.remove('open'));
help.addEventListener('click', (e) => e.target === help && help.classList.remove('open'));

// ---------------------------------------------------------------- keyboard
/** ←/→ walk round the associates of an anchor soul (the one selected before stepping began). */
const cycle = { anchor: '', at: '', i: -1 };
function stepAssociate(dir: number) {
  const sel = world.selected;
  if (!sel) return;
  if (sel !== cycle.at) {
    cycle.anchor = sel;
    cycle.i = -1;
  }
  const anchor = cycle.anchor;
  const list = [...bondsOf.get(anchor)!]
    .filter((b) => world.filters.bonds.has(b.kind) && world.passes(other(b, anchor)))
    .sort((a, b) => BOND_ORDER.indexOf(a.kind) - BOND_ORDER.indexOf(b.kind));
  if (!list.length) return;
  cycle.i = (cycle.i + dir + list.length + (cycle.i < 0 && dir < 0 ? 1 : 0)) % list.length;
  cycle.at = other(list[cycle.i], anchor);
  select(cycle.at);
}
window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.body.classList.contains('pre')) return;
  switch (e.key) {
    case '1':
      return setLayout('web');
    case '2':
      return setLayout('chronicle');
    case '3':
      return setLayout('allegiance');
    case '/':
      e.preventDefault();
      return search.focus();
    case 'p':
    case 'P':
      return sagaBtn.click();
    case 'Escape':
      saga.stop();
      tour.stop();
      if (world.thread || document.getElementById('caption')!.classList.contains('thread')) return world.clearThread();
      help.classList.remove('open');
      return select(null);
    case 't':
    case 'T':
      return tourBtn.click();
    case 's':
    case 'S':
      return spoilerBtn.click();
    case 'm':
    case 'M':
      return soundBtn.click();
    case 'f':
    case 'F':
      return filters.toggle();
    case '?':
      return help.classList.toggle('open');
    case 'ArrowRight':
      return stepAssociate(1);
    case 'ArrowLeft':
      return stepAssociate(-1);
    case 'Home':
      return world.overview();
  }
});

// ---------------------------------------------------------------- intro
const FEED = [
  '+++ INCOMING TRANSMISSION +++',
  '+++ ORIGIN: CALIXIS SECTOR · ORDO XENOS CONCLAVE +++',
  '+++ CIPHER: THORN WISHES TALON +++',
  '+++ DECRYPTING DOSSIERS',
  `+++ ${characters.length} SOULS · ${[...bondsOf.values()].reduce((s, b) => s + b.length, 0) / 2} BONDS · 3 CHRONICLES +++`,
  '+++ THOUGHT FOR THE DAY: INNOCENCE PROVES NOTHING +++',
];

let started = false;
function begin(sound: boolean) {
  if (started) return;
  started = true;
  const intro = $('intro');
  intro.classList.add('gone');
  document.body.classList.remove('pre');
  if (sound) setSound(true);
  stage.camera.position.set(0, 900, 1600);
  stage.controls.target.set(0, 0, 0);
  world.reveal();
  // a deep link (#id) opens once the swoop lands, or after 4.4 s if the user interrupts it
  let hash: string | null = decodeURIComponent(location.hash.slice(1));
  const openHash = () => {
    if (hash && charById.has(hash) && !world.selected) select(hash);
    hash = null;
  };
  stage.flyTo(world.fitted(new THREE.Vector3(40, 250, 600), new THREE.Vector3(0, -10, 0)), new THREE.Vector3(0, -10, 0), 4.2, openHash);
  setTimeout(openHash, 4400);
  stage.warp = 0.8;
  // a one-time hint, dismissed by the first selection or after a while
  if (!localStorage.getItem('iw-hinted')) {
    setTimeout(() => !hintDone && $('hint').classList.add('show'), 5200);
    setTimeout(dismissHint, 22000);
  }
}

$('intro').querySelector('.intro-rosette')!.innerHTML = emblemSVG('inquisition');
const readSel = $('intro-read') as HTMLSelectElement;
readSel.innerHTML = books
  .map((b, i) =>
    i === books.length - 1
      ? `<option value="${i}">everything, through ${b.title}</option>`
      : `<option value="${i}">up to ${b.title}${b.kind === 'short' ? ' (short story)' : ''}</option>`,
  )
  .join('');
readSel.value = String(spoilers.progress);
readSel.addEventListener('change', () => spoilers.set({ progress: Number(readSel.value) }));
stage.start();

if (params.has('nointro')) {
  $('intro').style.display = 'none';
  begin(false);
} else {
  // time-based typewriter: robust to slow frames, ~3 s in total; click to skip
  const feed = $('intro-feed');
  const full = FEED.join('\n');
  const t0 = performance.now() + 400;
  const DURATION = 3200;
  let done = false;
  const finish = () => {
    done = true;
    feed.innerHTML = full + '\n<span class="cur">&nbsp;</span>';
    $('intro').classList.add('ready');
  };
  const type = () => {
    if (done) return;
    const k = Math.max(0, Math.min(1, (performance.now() - t0) / DURATION));
    if (k >= 1) return finish();
    feed.innerHTML = full.slice(0, Math.floor(full.length * k)) + '<span class="cur">&nbsp;</span>';
    setTimeout(type, 30);
  };
  type();
  $('intro').addEventListener('click', (e) => {
    if (!done && !(e.target as HTMLElement).closest('button, select, label')) finish();
  });
  $('intro-go').addEventListener('click', () => begin(($('intro-sound') as HTMLInputElement).checked));
  window.addEventListener('keydown', function enter(e) {
    if (e.key === 'Enter' && $('intro').classList.contains('ready') && !$('intro').classList.contains('gone')) {
      window.removeEventListener('keydown', enter);
      begin(($('intro-sound') as HTMLInputElement).checked);
    }
  });
}

// expose for debugging in the console
Object.assign(window, { world, stage });
