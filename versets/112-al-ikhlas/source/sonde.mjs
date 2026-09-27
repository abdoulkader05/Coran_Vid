// Sonde : largeurs des lignes arabes et textes réellement composés dans la page (comparés octet par octet aux fichiers).
import { readFileSync } from 'node:fs';
import { openFilm } from '../../../.claude/skills/opus-js-animations/scripts/lib.mjs';
const f = await openFilm(process.argv[2] || 'film.html');
const lay = await f.ev('__film.layout()'), tx = await f.ev('__film.texts()');
lay.verses.forEach((v, i) => console.log(`verset ${i + 1}:`, v.map(l => `${l.w - 80}px`).join(' + ')));
const ar = readFileSync('texte-arabe.txt', 'utf8').split('\n').slice(0, 4), fr = readFileSync('traduction-fr.txt', 'utf8').split('\n').slice(0, 4);
let ok = true;
tx.ar.forEach((s, i) => { const same = Buffer.from(s).equals(Buffer.from(ar[i])); ok &&= same; console.log(`arabe ${i + 1}: ${same ? 'identique octet par octet' : 'DIFFÉRENT'}`); });
tx.fr.forEach((s, i) => { const same = s === fr[i]; ok &&= same; console.log(`français ${i + 1}: ${same ? 'identique' : 'DIFFÉRENT'}`); });
if (f.logs.length) console.log(f.logs);
f.close(); process.exit(ok ? 0 : 1);
