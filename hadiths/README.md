# Histoires tirées des hadiths — vidéos animées 9:16

## Le jeu de données
- **Source :** [HadeethEnc.com](https://hadeethenc.com), l'Encyclopédie des hadiths traduits, via son API publique.
  Chaque hadith contient :
  - la traduction française ;
  - le texte arabe ;
  - le degré d'authenticité ;
  - la référence (Bukhari, Muslim…) ;
  - une explication et des enseignements.
- **Fichier :** `dataset/hadiths-fr.jsonl`. **1 790 hadiths** en français (une ligne JSON par hadith), dont 1 619 « Authentique » et 112 « Bon ».
  Pour le mettre à jour : `python dataset/telecharger.py` (le script reprend là où il s'était arrêté).
- **Conditions d'utilisation :** vérifie celles de HadeethEnc.com avant une diffusion commerciale. Les vidéos citent la source et le numéro du hadith.

## Les trois vidéos (`export/`)
| Vidéo | Hadith | Durée | Décor symbolique |
|---|---|---|---|
| `hadith-preteur-conciliant.mp4` | n° 3753, Bukhari et Muslim, authentique | 48 s | Un registre de dettes à la lueur d'une lampe. Des pièces partent, une dette s'efface (« sois conciliant »), puis tout le registre s'efface en lumière et un sceau d'or se trace. S'y ajoute un enseignement tiré du jeu de données. |
| `hadith-la-serenite.mp4` | n° 6178, Bukhari et Muslim, authentique | 44 s | Un livre ouvert sur un pupitre, la nuit. Un nuage de lumière tourne et s'approche ; les deux cordes du poteau se tendent (le cheval reste hors champ). Vient l'aube, puis une lumière qui descend sur le livre. |
| `hadith-le-puits-et-le-chien.mp4` | n° 10100, Bukhari et Muslim, authentique (**extrait** : première version seulement) | 69 s | Un chemin dans le désert et un puits. Des empreintes de pattes et du sable humide, une chaussure qui verse de l'eau. Une lumière monte, le soir tombe, et des pousses sortent du sable. |

## Décisions (prises sans pouvoir te consulter)
- **Choix des hadiths :** uniquement des récits authentiques de Bukhari et Muslim, assez courts pour un Reel. J'ai écarté les grands récits (la grotte : 521 mots ; les trois hommes : 656 mots), qui méritent un format long ou une voix off, ainsi que le hadith de la chatte (un châtiment).
- **Texte :** jamais retapé. Chaque carton est une tranche de mots du texte de la source, découpée aux ponctuations. `moteur/sonde.mjs` vérifie dans la page que les cartons re-joints redonnent exactement la source ; seuls les espaces multiples de la source sont ramenés à un seul. Le puits est un extrait (le hadith n° 10100 cite ensuite d'autres versions), signalé « Extrait » au générique.
- **Attribution affichée :** quand la source écrit « Rapporté par Al-Bûkhârî - Rapporté par Al-Bukhârî et Muslim », j'affiche la mention la plus complète telle qu'elle est écrite. Le texte brut est conservé dans `data.js` (`rapporte_source`).
- **Aucun être humain, animal ni visage.** Les histoires sont racontées par des lieux, des objets et de la lumière. Le Prophète ﷺ n'est jamais représenté. Le chien n'est suggéré que par ses empreintes, et le cheval par les cordes.
- **Son :** faute de voix off (pas de clé ElevenLabs ou OpenAI fournie), une ambiance générée dans la page : un vent doux et un léger souffle à chaque carton. **Aucune musique.**
- **Rythme de lecture :** environ 15 caractères par seconde + 1,3 s par carton (3,2 s minimum). L'accroche dure 3 s, le générique 4 s.

## Fabriquer une nouvelle histoire
1. Trouve le hadith dans `dataset/hadiths-fr.jsonl` (par son `id`).
2. Ajoute-le dans `HISTOIRES` de `moteur/generer_histoire.py` (titre, décor, enseignement éventuel, fin d'extrait éventuelle), puis lance `python moteur/generer_histoire.py <slug>`.
3. Crée `histoires/<slug>/film.html` en copiant celui d'une autre histoire, et choisis un décor existant dans `moteur/scenes.js` ou ajoute-en un. Un décor se cale sur les mots du texte : `S.when('mot')`.
4. Lance `node moteur/sonde.mjs <slug>` pour vérifier le texte, puis `bash rendre.sh <slug>`.

## À vérifier par toi
- **Écoute :** je n'ai pas pu écouter l'ambiance. Les niveaux ont été mesurés, pas entendus.
- **Relecture :** fais relire les textes et le choix des hadiths par une personne de confiance en science religieuse.
- **Rythme :** la vitesse de lecture est un réglage (`CPS` dans `generer_histoire.py`). Dis-moi si les cartons défilent trop vite ou trop lentement.
