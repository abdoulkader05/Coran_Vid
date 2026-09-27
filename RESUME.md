# Résumé — Sourate Al-Ikhlas (112), première vidéo

## Livrables (`versets/112-al-ikhlas/`)
| Fichier | Contenu |
|---|---|
| `export/al-ikhlas-112-9x16.mp4` | **à publier** sur Reels, TikTok et Shorts : 1080×1920, 30 ips, 15,3 s, H.264 + AAC |
| `export/al-ikhlas-112-16x9.mp4` | version 1920×1080 pour YouTube et X |
| `export/master-*.mp4` | maîtres (CRF 16) dont sont tirées les copies ci-dessus |
| `film.html`, `film-16x9.html`, `film/` | le film en JavaScript : un clic dans Chrome le lit avec le son ; `?t=5` fige une image |
| `TRAITEMENT.md` | le traitement du réalisateur (verset par verset) |
| `texte-arabe.txt`, `traduction-fr.txt`, `audio.mp3`, `calage.json` | matière première vérifiée et calage mot par mot |
| `source/` | fichiers téléchargés, réponses brutes des API et scripts de vérification et d'alignement |

`export/` n'est pas versionné (ajouté au `.gitignore`). Les décisions prises seul sont dans `DECISIONS.md`.

## Ce qui a été fait
1. Installation de ffmpeg (winget), d'un venv `.venv` avec whisper (le torch global est cassé, voir DECISIONS.md) et du skill opus-js-animations.
2. Récupération de l'audio (EveryAyah, Alafasy), du texte Uthmani (Quran.com, contrôlé octet par octet contre Tanzil : identique) et de la traduction Hamidullah (Quran.com).
3. Alignement Whisper verset par verset, recoupé avec le signal. Chaque mot arabe apparaît sur sa propre attaque.
4. Réalisation : une scène continue. Une rosace d'or à huit branches naît d'un point (v. 1), ses rayons convergent vers le centre (v. 2), elle se ferme et se scelle (v. 3), puis un pavage pâle et uniforme apparaît autour d'elle sans jamais l'égaler (v. 4). Générique de 2 s, puis un fondu.
5. Contrôles, en 3 itérations :
   - `verify.mjs` : seek(t) pur en 9:16, en 16:9 et en ×2 ;
   - planches contact ;
   - recadrages 1:1 de chaque verset ;
   - planche image par image autour de أَحَدٌۢ (11,42 s) ;
   - relecture dans la page des chaînes affichées, identiques octet par octet aux fichiers ;
   - image décodée du MP4 final ;
   - audio du MP4 aligné à 0 ms sur la source ;
   - 459 images = 15,3 s × 30.

   Corrections faites :
   - un liseré du mot suivant qui apparaissait trop tôt ;
   - le verset 4 qui passait sur deux lignes et touchait la rosace (arabe ramené de 116 à 110 px) ;
   - le pavage qui passait derrière le texte ;
   - l'image d'ouverture, trop vide ;
   - en 16:9, le texte qui chevauchait la rosace.

## Sources
- **Audio :** Mishary Rashid Alafasy, EveryAyah.com, `Alafasy_128kbps/112001.mp3` à `112004.mp3`. C'est à toi de juger des droits de réutilisation.
- **Texte arabe :** API Quran.com v4, écriture Uthmani. Contrôle : Tanzil `quran-uthmani` (via api.alquran.cloud).
- **Traduction :** Muhammad Hamidullah, API Quran.com (ressource 31), sans modification.
- **Polices :** Amiri Quran et EB Garamond (SIL Open Font License, licences dans `film/fonts/`).

## À vérifier par toi
1. **Écouter la vidéo avec le son.** Je ne peux pas l'écouter : la synchronisation est vérifiée par la mesure (Whisper + signal + planches), pas à l'oreille. Les points les moins sûrs sont يَلِدْ (6,31 s) et أَحَدٌۢ au verset 4 (11,42 s).
2. **Relire l'arabe à l'écran** (idéalement par quelqu'un qui maîtrise la lecture du Coran). Les recadrages montrent des harakat, ligatures et signes Uthmani corrects avec Amiri Quran, mais un second regard humain s'impose pour un texte sacré.
3. **Traduction :** Hamidullah ouvre des guillemets droits au verset 1 et les ferme au verset 4. Je les ai laissés tels quels ; dis-moi si tu préfères des « guillemets français ».
4. **Générique :** trois lignes centrées, au lieu d'une ligne avec les séparateurs « · ».
5. **Symbolique :** la rosace et la lumière sont de l'ornement (pas une figuration). Vérifie que cela te convient.
6. **Droits de l'audio** avant publication.

## 3 idées d'amélioration
1. **Un traitement par sourate, avec un motif propre à chacune** : une série cohérente (Al-Falaq, An-Nas…) avec la même charte, mais une géométrie différente liée au sens de chaque sourate.
2. **Une translittération optionnelle** en petit sous l'arabe, pour les francophones qui apprennent à lire, synchronisée mot par mot sur le même calage.
3. **Automatiser la chaîne** (téléchargement → vérification octet par octet → alignement → rendu) en une commande `node faire.mjs 112`, pour produire une sourate courte en quelques minutes, avec un contrôle humain à la fin seulement.

## Légende proposée pour la publication
> Sourate Al-Ikhlas (112) — « Dis : Il est Allah, Unique… »
> Récitation : Mishary Rashid Alafasy · Traduction du sens : Muhammad Hamidullah
> #Coran #AlIkhlas #Quran #Islam #Tawhid
