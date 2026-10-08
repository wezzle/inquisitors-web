import { books, spanOf } from '../data/codex';
import type { Character } from '../data/types';

/**
 * Spoiler policy. `progress` is the index of the last book the reader has finished;
 * a character's fate is spoiled if their story continues past it, or if the ward veils everything.
 */
export const spoilers = {
  all: false,
  progress: books.length - 1,
  listeners: [] as (() => void)[],

  isSpoiled(c: Character) {
    if (this.all) return true;
    return spanOf(c)[1] > this.progress;
  },

  /** Has the reader met this character yet? */
  isMet(c: Character) {
    return spanOf(c)[0] <= this.progress;
  },

  set(patch: Partial<{ all: boolean; progress: number }>) {
    Object.assign(this, patch);
    localStorage.setItem('iw-spoilers', JSON.stringify({ all: this.all, progress: this.progress }));
    this.listeners.forEach((f) => f());
  },

  load() {
    try {
      const s = JSON.parse(localStorage.getItem('iw-spoilers') ?? 'null');
      if (s && typeof s.all === 'boolean') this.all = s.all;
      if (s && typeof s.progress === 'number' && s.progress >= 0 && s.progress < books.length) this.progress = s.progress;
    } catch {
      /* first visit */
    }
  },

  onChange(f: () => void) {
    this.listeners.push(f);
  },
};
