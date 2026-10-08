import * as THREE from 'three';
import { books } from '../data/codex';
import { SERIES } from '../data/theme';
import { CHRONICLE } from '../scene/layouts';
import type { Stage } from '../scene/stage';
import { spoilers } from './spoilers';

/**
 * Replays the chronicle volume by volume, up to the reader's bookmark: the camera climbs the
 * tower of rings while each book's newcomers bloom into being.
 */
export class Saga {
  active = false;
  private i = 0;
  private saved = 0;
  private timer = 0;
  private caption = document.getElementById('caption')!;
  onStop: () => void = () => {};

  constructor(
    private stage: Stage,
    private enterChronicle: () => void,
  ) {}

  start() {
    this.active = true;
    this.saved = spoilers.progress;
    this.i = 0;
    this.enterChronicle();
    this.step();
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    clearTimeout(this.timer);
    this.caption.classList.remove('show', 'saga');
    spoilers.set({ progress: this.saved });
    this.onStop();
  }

  private step() {
    if (!this.active) return;
    const b = books[this.i];
    spoilers.set({ progress: this.i }, false);
    const y = CHRONICLE.ringY(this.i);
    this.stage.flyTo(new THREE.Vector3(470, y + 210, 450), new THREE.Vector3(0, y - 10, 0), 2.4);
    const first = b.summary.split(/(?<=\.)\s/)[0] ?? '';
    this.caption.classList.remove('show', 'thread');
    this.caption.classList.add('saga');
    this.caption.style.setProperty('--fc', SERIES[b.series].color);
    window.setTimeout(() => {
      if (!this.active) return;
      this.caption.innerHTML = `<div class="step">+++ Volume ${b.order + 1} of ${books.length} · ${b.year} · ${SERIES[b.series].label} +++</div><div class="n">${b.title}</div><div class="e">${first}</div>`;
      this.caption.classList.add('show');
    }, 500);
    const last = this.i >= this.saved;
    this.timer = window.setTimeout(
      () => {
        if (last) return this.stop();
        this.i++;
        this.step();
      },
      (b.kind === 'short' ? 4.5 : 7) * 1000,
    );
  }
}
