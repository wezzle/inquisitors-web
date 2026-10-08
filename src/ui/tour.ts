import { charById } from '../data/codex';
import { FACTIONS } from '../data/theme';
import type { World } from '../scene/world';
import type { LayoutId } from '../scene/layouts';

interface Step {
  id: string;
  layout?: LayoutId;
  hold?: number;
}

/** A guided procession through the principal souls of all three chronicles. */
export class Tour {
  private steps: Step[];
  private i = -1;
  private timer = 0;
  private caption = document.getElementById('caption')!;
  active = false;
  onStop: () => void = () => {};

  constructor(
    private world: World,
    private select: (id: string) => void,
    order: string[],
  ) {
    this.steps = order.filter((id) => charById.has(id)).map((id) => ({ id }));
  }

  start() {
    if (!this.steps.length) return;
    this.active = true;
    this.i = -1;
    if (this.world.layout !== 'web') this.world.setLayout('web', false);
    this.next();
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    clearTimeout(this.timer);
    this.caption.classList.remove('show');
    this.onStop();
  }

  next() {
    if (!this.active) return;
    this.i = (this.i + 1) % this.steps.length;
    const step = this.steps[this.i];
    const c = charById.get(step.id)!;
    this.select(step.id);
    this.caption.style.setProperty('--fc', FACTIONS[c.faction].color);
    this.caption.classList.remove('show');
    setTimeout(() => {
      if (!this.active) return;
      this.caption.innerHTML = `<div class="step">${String(this.i + 1).padStart(2, '0')} / ${String(this.steps.length).padStart(2, '0')}</div><div class="n">${c.name}</div><div class="e">${c.epithet}</div>`;
      this.caption.classList.add('show');
    }, 900);
    this.timer = window.setTimeout(() => this.next(), (step.hold ?? 8) * 1000);
  }
}
