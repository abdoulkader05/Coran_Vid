# Décisions prises en autonomie — Al-Ikhlas (112)

Date : 2026-09-27. Toutes les décisions ci-dessous ont été prises sans pouvoir te consulter, comme demandé.

## Installation
| Point | Décision |
|---|---|
| Node 22.14, Chrome 153, Python 3.11 + numpy | déjà présents |
| ffmpeg | absent : installé avec `winget install Gyan.FFmpeg` (ffmpeg 9.0.2). Le PATH de ta session se mettra à jour au prochain terminal ; binaires dans `%LOCALAPPDATA%\Microsoft\WinGet\Links`. |
| openai-whisper | `pip install --user openai-whisper` s'est installé, mais **torch est cassé dans ton Python global** (torch 2.5.1 mélangé aux fichiers d'une version plus récente : `AttributeError … BackendType … XCCL`). Je n'y ai pas touché. J'ai créé un venv propre `.venv/` à la racine du projet (ignoré par git) : torch 2.14 CPU + whisper. Un venv dans le dossier temporaire échouait à cause des chemins longs de Windows. |
| Chrome pour les scripts | les scripts du skill ne cherchent Chrome que sous macOS/Linux : j'ai utilisé la variable `CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"` sans modifier le skill. |
| Skill | cloné depuis github.com/klsoen/opus-js-animations (commit b20d25a) dans `.claude/skills/opus-js-animations/`. |
| `sacred-text.md` | **n'existe pas dans le skill.** Son équivalent est `references/quoted-text.md` (vérification octet par octet des textes cités), que j'ai suivi. |

## Matière première
| Point | Décision |
|---|---|
| Audio | EveryAyah, `Alafasy_128kbps/112001…112004.mp3`. Assemblage : chaque fichier est décodé puis concaténé échantillon par échantillon (`source/audio.wav`, 13,124 s), sans gain, sans fondu ni normalisation. `audio.mp3` en est encodé à 320 kb/s. La copie de flux MP3 bout à bout produisait des timestamps incohérents (délai d'encodeur), d'où ce choix. |
| Basmala | les fichiers EveryAyah du verset 1 ne la contiennent pas (confirmé par Whisper) ; elle n'est donc ni récitée ni affichée. |
| Texte arabe | API Quran.com v4 (`/quran/verses/uthmani`), contrôlé octet par octet contre Tanzil (via api.alquran.cloud, édition `quran-uthmani`) et contre les mots Quran.com : **identique pour les 4 versets.** Retouches : suppression de l'espace de tête que renvoie Quran.com au verset 1, et retrait de la basmala que Tanzil préfixe au verset 1 (par test de suffixe exact, rien de retapé). Le texte n'est pas normalisé NFC : les octets de la source sont conservés. Script : `source/verifier_texte.py`. |
| Traduction | Muhammad Hamidullah, API Quran.com (ressource 31), mot pour mot, guillemets droits d'origine compris (`Dis : "Il est…` … `à Lui."`). |
| Chaîne de texte | `film/data.js` est généré par `source/generer_data.py` à partir des fichiers. `source/sonde.mjs` relit dans la page les chaînes réellement dessinées et les compare octet par octet aux fichiers : identiques dans les deux formats. |

## Synchronisation
- Un premier passage Whisper medium sur la piste entière a **halluciné** « صلى الله عليه وسلم » à la place de « ٱلصَّمَدُ ». J'ai donc transcrit chaque verset seul (Whisper medium, texte canonique en invite) : 15 mots sur 15 conformes.
- Les frontières de mots sont recoupées avec le signal (creux RMS sur 10 ms, audio.md §3) et un spectrogramme zoomé. Il y avait 3 désaccords : يَلِدْ est pris à 6,31 s (signal, coupure nette), كُفُوًا à 10,46 s (signal, occlusive /k/) et أَحَدٌۢ à 11,42 s (Whisper, coupure visible ; le creux à 11,59 s correspond au ḥ). Calage final : `calage.json`.
- Chaque mot commence à se révéler 0,10 s avant son attaque, en 0,30 s, puis s'allume en or pendant sa récitation.

## Réalisation
- Structure : `film.html` (9:16), `film-16x9.html` (16:9) et un seul `film/film.js`, plutôt que `film/index.html` comme le propose le skill, puisque tu avais demandé `film.html`.
- Polices embarquées localement (OFL) : **Amiri Quran** pour l'arabe (couvre les 25 caractères, dont ۥ U+06E5, ۢ U+06E2 et ٱ U+0671) et **EB Garamond Medium** pour le français.
- L'arabe est composé en une seule ligne d'un seul tenant, puis révélé par un masque de droite à gauche calé sur les frontières de mots. Aucune ligature n'est jamais coupée. Taille 110 px en 9:16 : c'est la plus grande qui fait tenir le verset 4 sur une ligne dans la largeur sûre de 850 px (à 116 px, il passait sur deux lignes et touchait la rosace).
- Zones de sécurité 9:16 : le texte occupe y ≈ 1000–1400 px, donc aucun texte au-dessus de 192 px ni sous 1632 px, et x reste entre 90 et 940.
- Générique : les trois mentions sont présentées sur trois lignes centrées, sans le séparateur « · », plus lisibles qu'une ligne unique trop longue pour 9:16.
- Durée : 15,3 s (13,12 s de récitation, puis le générique pendant environ 2 s et un fondu de 0,5 s). L'audio est complété de silence.
- Ni musique, ni effet sonore, ni grain animé (conseil de livraison du skill). La lumière et la géométrie sont de l'ornement, jamais une figuration.
- Rendu en supersampling ×2 (`--ss 2`), puis copies « upload » en H.264 CRF 17, BT.709.

## Contrôles et itérations
1. Planche v1 : un liseré du mot suivant visible trop tôt (bord adouci du masque) et le verset 4 sur deux lignes qui touche la rosace → masque borné au mot en cours ; arabe ramené à 110 px.
2. Planche v2 : le pavage passe derrière le texte ; l'ouverture est un peu vide ; en 16:9, le texte chevauche la rosace → pavage atténué sous le bloc de texte, tracé déjà avancé à l'image 0, nouvelle mise en page 16:9.
3. Planche v3, recadrages 1:1 et image du MP4 : conformes. Audio du MP4 aligné à 0 ms sur la source ; 459 images.
Je n'ai pas pu **écouter** le résultat : la synchronisation est mesurée, pas entendue.
