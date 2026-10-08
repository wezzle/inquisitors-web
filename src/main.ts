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
import { bondsOf, charById, characters, other } from './data/codex';
import { BOND_ORDER } from './data/theme';
import type { LayoutId } from './scene/layouts';
import { Stage } from './scene/stage';
import { World } from './scene/world';
import { Choir } from './ui/audio';
import { Dossier } from './ui/dossier';
import { mountFilters, mountSearch, mountTicker, mountTooltip } from './ui/hud';
import { emblemSVG } from './ui/sigils';
import { spoilers } from './ui/spoilers';
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
const filters = mountFilters(world);
mountTicker();

// ---------------------------------------------------------------- selection
function select(id: string | null) {
  void world.select(id);
}
world.onSelect = (id) => {
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
dossier.onNavigate = (id) => {
  tour.stop();
  select(id);
};
dossier.onClose = () => {
  if (world.selected) select(null);
  else dossier.hide();
};
world.onBook = (id) => {
  tour.stop();
  if (world.selected) select(null);
  dossier.showBook(id);
  choir.bell();
};
const search = mountSearch(world, (id) => {
  tour.stop();
  if (!world.passes(id)) {
    // reveal filtered-out souls when explicitly sought
    $('f-reset').click();
  }
  select(id);
});

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
tourBtn.addEventListener('click', () => {
  if (tour.active) tour.stop();
  else {
    tourBtn.classList.add('on');
    tour.start();
  }
});
stage.labels.domElement.addEventListener('pointerdown', () => tour.stop());

// ---------------------------------------------------------------- toggles
const spoilerBtn = $('btn-spoiler');
spoilers.onChange(() => {
  spoilerBtn.classList.toggle('on', spoilers.all);
  world.applySpoilers();
  if (world.selected) void dossier.show(world.selected);
});
spoilerBtn.addEventListener('click', () => spoilers.set({ all: !spoilers.all }));
spoilerBtn.classList.toggle('on', spoilers.all);

const soundBtn = $('btn-sound');
function setSound(on: boolean) {
  choir.toggle(on);
  soundBtn.classList.toggle('on', on);
}
soundBtn.addEventListener('click', () => setSound(!choir.on));

const help = $('help');
$('btn-help').addEventListener('click', () => help.classList.toggle('open'));
$('help-close').addEventListener('click', () => help.classList.remove('open'));
help.addEventListener('click', (e) => e.target === help && help.classList.remove('open'));

// ---------------------------------------------------------------- keyboard
function stepAssociate(dir: number) {
  const sel = world.selected;
  if (!sel) return;
  const list = [...bondsOf.get(sel)!]
    .filter((b) => world.filters.bonds.has(b.kind) && world.passes(other(b, sel)))
    .sort((a, b) => BOND_ORDER.indexOf(a.kind) - BOND_ORDER.indexOf(b.kind));
  if (!list.length) return;
  const i = dir > 0 ? 0 : list.length - 1;
  select(other(list[i], sel));
}
window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
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
    case 'Escape':
      tour.stop();
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

function begin(sound: boolean) {
  const intro = $('intro');
  intro.classList.add('gone');
  document.body.classList.remove('pre');
  if (sound) setSound(true);
  stage.camera.position.set(0, 900, 1600);
  stage.controls.target.set(0, 0, 0);
  world.reveal();
  stage.flyTo(new THREE.Vector3(40, 250, 600), new THREE.Vector3(0, -10, 0), 4.2, () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && charById.has(hash)) select(hash);
  });
  stage.warp = 0.8;
}

$('intro').querySelector('.intro-rosette')!.innerHTML = emblemSVG('inquisition');
stage.start();

if (params.has('nointro')) {
  $('intro').style.display = 'none';
  begin(false);
} else {
  const feed = $('intro-feed');
  let line = 0;
  let ch = 0;
  let text = '';
  const type = () => {
    if (line >= FEED.length) {
      feed.innerHTML = text + '<span class="cur">&nbsp;</span>';
      $('intro').classList.add('ready');
      return;
    }
    const l = FEED[line];
    text += l[ch++] ?? '';
    if (ch > l.length) {
      text += '\n';
      line++;
      ch = 0;
      setTimeout(type, 180);
    } else setTimeout(type, 14 + Math.random() * 22);
    feed.innerHTML = text + '<span class="cur">&nbsp;</span>';
  };
  setTimeout(type, 500);
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
