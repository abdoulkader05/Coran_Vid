// Vérifie que les cartons affichés dans la page re-joignent exactement le texte du hadith dans le jeu de données
// (espaces multiples ramenés à un seul ; pour un extrait, le texte source doit commencer par l'extrait).
import { readFileSync } from 'node:fs';
import { openFilm } from '../../.claude/skills/opus-js-animations/scripts/lib.mjs';
const H = new Map(readFileSync('dataset/hadiths-fr.jsonl', 'utf8').trim().split('\n').map(l => { const h = JSON.parse(l); return [h.id, h]; }));
let ok = true;
for (const slug of process.argv.slice(2)) {
  const f = await openFilm(`histoires/${slug}/film.html`);
  const { cartons } = await f.ev('__film.texts()'), meta = await f.ev('({ id: HISTOIRE.id, extrait: HISTOIRE.extrait, ens: HISTOIRE.cartons.filter(c => c.enseignement).length })');
  f.close();
  const recit = cartons.slice(0, cartons.length - meta.ens).join(' ');
  const src = H.get(meta.id).hadeeth.split(/\s+/).filter(Boolean).join(' ');
  const same = meta.extrait ? src.startsWith(recit) : src === recit;
  const ens = cartons.slice(cartons.length - meta.ens).join(' ');
  const ensOk = !meta.ens || (H.get(meta.id).hints || []).some(x => x.trim() === ens);
  ok &&= same && ensOk;
  console.log(`${slug} (n° ${meta.id}) : récit ${same ? 'identique à la source' : 'DIFFÉRENT'}${meta.extrait ? ' (extrait du début)' : ''}${meta.ens ? `, enseignement ${ensOk ? 'identique' : 'DIFFÉRENT'}` : ''}`);
}
process.exit(ok ? 0 : 1);
