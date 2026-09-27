# Reprise en local : où on en est (27/09/2026)

Branche : `claude/teste-ppdki7` (PR https://github.com/abdoulkader05/Coran_Vid/pull/1).

## 1. Récupérer le travail
```bash
cd C:\Users\Coulibaly\Desktop\Coran_Vid
git fetch origin
git checkout claude/teste-ppdki7
git pull
```

## 2. Ce qui a été décidé
- **Plus de hadiths en cartons de texte.** On fait des **histoires de l'islam racontées en images** : des personnages qui marchent, la lune, des décors, une caméra qui bouge.
- **Première histoire : les gens de la Caverne**, sourate Al-Kahf, versets 18:9 à 26.
- **Durée 4 à 6 min, en 16:9** (YouTube).
- **Son :** la récitation de Mishary Alafasy (EveryAyah) avec la traduction de Hamidullah (Quran.com), mot pour mot, vérifiée contre la source.
- **Personnages :** des silhouettes **sans visage**. Aucun prophète ni compagnon n'est représenté ; le divin, seulement par la lumière. Le chien apparaît : le Coran le mentionne.
- **Visuel :** le premier essai en Canvas 2D pur a été jugé **trop basique**. La nouvelle direction :
  - **FLUX génère les décors peints** : FLUX.1-dev, gratuit sur build.nvidia.com ; FLUX.1 Kontext pour garder la cohérence d'une image à l'autre.
  - **L'animation JS les fait vivre** : parallaxe, caméra, jour et nuit, rayons de lumière, brume, particules, silhouettes animées (marche, gestes).
  - **Remotion n'est pas obligatoire** : la méthode `opus-js-animations` (dans `.claude/skills/`) rend déjà des MP4 à l'image près.
- **Attention à la licence :** FLUX.1-dev est **non commercial**. Si la chaîne est monétisée, il faudra passer à une version payante (Flux Pro chez fal.ai ou BFL).

## 3. Ce qui existe dans le dépôt
| Chemin | Contenu |
|---|---|
| `histoires/caverne/FILM.md` | **Le traitement validé** : 16 scènes, verset par verset, avec palette, caméra et lumière. C'est le contrat du film. |
| `histoires/caverne/` | Projet Remotion, avec la scène test du v. 17 (`src/scenes/Verset17.tsx`) : l'intérieur de la grotte, trois jours en accéléré, cinq dormeurs drapés, le chien au seuil. C'est un essai de style (14 s, sans son), qui sera remplacé par la version Flux et JS. |
| `.claude/skills/opus-js-animations/` | Le skill de réalisation. **Corrigé :** les images 4K (`--ss 2`) étaient lues d'un bloc et bloquaient `verify.mjs` et `render.mjs` sans erreur (c'est pour ça que « le puits et le chien » ne finissait jamais). Elles sont maintenant transférées par tranches de 1 Mo (`bigString` dans `scripts/lib.mjs`). |
| `.claude/skills/remotion-*` | Les skills officiels Remotion (remotion-dev/skills). |
| `hadiths/` | L'ancien projet hadiths (abandonné, conservé). |

**Piège git :** le `.gitignore` (modèle Python) ignore tous les dossiers `lib/`. Pour un nouveau dossier `lib/`, il faut `git add -f`.

## 4. Configuration locale (Windows)
1. **La clé NVIDIA**, à mettre en variable d'environnement et **jamais dans le code** :
   ```powershell
   setx NVIDIA_API_KEY "nvapi-..."
   ```
   Ouvre ensuite un **nouveau** terminal. La clé se crée sur https://build.nvidia.com/settings/api-keys.
2. **Chrome** pour les scripts opus : `set CHROME=C:/Program Files/Google/Chrome/Application/chrome.exe` (déjà utilisé pour Al-Ikhlas).
3. **Le projet Remotion**, si tu le gardes :
   ```bash
   cd histoires/caverne
   npm i
   npx remotion studio          # prévisualisation
   npx remotion render Verset17 out/verset17.mp4
   ```
   En local, Remotion télécharge son propre Chrome ; l'option `--browser-executable` ne servait que dans le cloud.

## 5. Prochaines étapes
1. **Matière première :**
   - télécharger les MP3 `018009.mp3` à `018026.mp3` depuis `https://everyayah.com/data/Alafasy_128kbps/` ;
   - récupérer le texte Uthmani et la traduction Hamidullah (Quran.com, ressource 31) ;
   - vérifier le texte octet par octet, comme dans `versets/112-al-ikhlas/source/verifier_texte.py` ;
   - mesurer la durée de chaque verset.
2. **Calage :** Whisper, verset par verset (le venv `.venv` a déjà whisper), recoupé avec le signal. C'est ce qui donne la durée exacte de chaque scène.
3. **Guide de style FLUX :**
   - un préfixe de prompt commun : illustration peinte, palette du `FILM.md` (indigo nuit, argent lunaire, ocre sable, or chaud) ;
   - des règles : silhouettes de dos ou à contre-jour, **aucun visage**, pas d'idole détaillée ;
   - une graine fixe par décor.
4. **Liste des images, scène par scène.** Chaque décor est découpé en plans (ciel, fond, milieu, premier plan) pour la parallaxe. Générer avec FLUX.1-dev, décliner les variantes (jour/nuit, avant/après) avec FLUX.1 Kontext, puis **relire chaque image** et rejeter celles qui montrent des visages.
5. **Construire la scène la plus difficile en premier (v. 17)** avec les images FLUX, faire valider le style, puis le reste.
6. **Contrôles opus :** `verify.mjs`, planches `stills.mjs`, rendu `render.mjs --ss 2`, image décodée du MP4, audio aligné.

## 6. Phrase pour relancer Claude Code en local
> Lis `REPRISE.md` et `histoires/caverne/FILM.md`. On continue le film des gens de la Caverne : décors générés avec FLUX (clé dans `NVIDIA_API_KEY`, endpoint ai.api.nvidia.com) et animés en JS avec le skill opus-js-animations. Commence par récupérer la récitation et la traduction (étape 1), puis prépare le guide de style FLUX et la liste des images.
