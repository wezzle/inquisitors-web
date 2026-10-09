import { charById } from '../data/codex';
import { portraitUrl } from './likeness-img';

/** Native modal: keyboard dismissal, focus containment and return handled by the browser. */
export function mountPictViewer() {
  const dialog = document.createElement('dialog');
  dialog.className = 'pict-viewer';
  dialog.setAttribute('aria-labelledby', 'pict-viewer-name');
  dialog.innerHTML = '<button class="pict-viewer-close" aria-label="Close portrait">×</button><img alt="" /><h2 id="pict-viewer-name"></h2><p>Painted interpretation · not canonical artwork</p>';
  document.body.appendChild(dialog);
  const img = dialog.querySelector('img')!;
  const name = dialog.querySelector('h2')!;
  dialog.querySelector('button')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); dialog.close(); }
  });
  document.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('[data-pict]');
    const id = button?.dataset.pict;
    if (!id) return;
    const character = charById.get(id);
    const url = portraitUrl(id);
    if (!character || !url) return;
    img.src = url;
    img.alt = 'Painted portrait of ' + character.name;
    name.textContent = character.name;
    dialog.showModal();
  });
}
