// Usage: node scripts/contact-sheet.mjs <out-prefix> [cols] → writes a CDP script that shoots every portrait, in pages.
const out = process.argv[2] ?? '/tmp/iw-shots/contact';
const js = (page) => `(async()=>{ document.getElementById('cs')?.remove();
  const m=await import('/src/ui/portrait.ts'); const cx=await import('/src/data/codex.ts');
  const list=[...cx.characters].sort((a,b)=>b.importance-a.importance||a.name.localeCompare(b.name)).slice(${page}*40, ${page}*40+40);
  const d=document.createElement('div'); d.id='cs'; d.style.cssText='position:fixed;inset:0;z-index:999;background:#111;display:grid;grid-template-columns:repeat(10,1fr);gap:4px;padding:6px';
  for (const c of list){ const w=document.createElement('div'); w.style.cssText='color:#bbb;font:9px monospace;text-align:center;overflow:hidden;white-space:nowrap';
    const a=cx.appearanceById.get(c.id); w.innerHTML=m.portraitSVG(c,a).replace('<svg','<svg width="100%"')+c.id+'<br>'+(a?a.described:'—'); d.appendChild(w);} document.body.appendChild(d); return list.length })()`;
const steps = [{ wait: 2500 }];
for (let p = 0; p < 3; p++) steps.push({ eval: js(p) }, { wait: 1200 }, { shot: `${out}-${p + 1}.png` });
console.log(JSON.stringify({ url: 'http://127.0.0.1:5173/?nointro', width: 1600, height: 1250, steps }));
