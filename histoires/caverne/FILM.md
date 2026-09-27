# Les gens de la Caverne (Al-Kahf 18:9-26) : traitement

**Logline.** Des jeunes gens refusent les idoles de leur ville. Ils fuient de nuit, sous la lune, et s'endorment dans une grotte. Le soleil tourne autour d'eux pendant trois siècles. Ils se réveillent dans un monde qui a changé et deviennent un signe que la promesse d'Allah est vraie.

**L'image centrale.** L'entrée de la grotte vue de l'intérieur. Les dormeurs sont des silhouettes allongées, le chien a les pattes étendues sur le seuil. Au-dehors, le soleil et la lune tournent en accéléré, et leurs rayons passent à droite puis à gauche sans jamais toucher les dormeurs (v. 17-18). C'est aussi la miniature.

**Look.** Une « nuit peinte » en 2D : ciel et astres en shaders WebGL (recettes opus `shaders.md`), décors en aplats superposés sur plusieurs plans avec parallaxe, grain léger. Palette :

| Couleur | Rôle |
|---|---|
| indigo nuit #141a3a | ciel, ombres |
| argent lunaire #dfe6f2 | lune, liserés sur les silhouettes |
| ocre sable #c89a5b | désert, collines |
| terre de grotte #3b2a1f | parois, sol |
| or chaud #f2c46d | lampes, soleil, lumière divine |
| rouge brique #8a3b2b | la ville et ses temples (acte 1) |
| vert d'aube #6f8f7a | le monde nouveau (acte 3) |

**Personnages.** Silhouettes pleines, sans visage, éclairées par un liseré (squelette articulé, opus `design.md` §6). Le roi et les gens de la ville sont aussi des silhouettes. Le chien est une silhouette : le Coran le mentionne. Aucun prophète n'apparaît dans ce récit. La révélation et la présence divine ne sont jamais figurées : seulement de la lumière.

**Son.** La récitation de Mishary Alafasy, versets 9 à 26 (EveryAyah, comme pour Al-Ikhlas), sans retouche. Ni musique ni effet sonore. Durée à mesurer : environ 3 min 30 à 4 min estimées. Chaque verset est une scène, et les changements d'image tombent sur les mots clés, calés avec Whisper puis vérifiés sur le signal.

**Texte à l'écran.** En bas : la traduction française de Hamidullah (Quran.com), mot pour mot, par segments de deux lignes au plus, calés sur la récitation. Au-dessus, en plus petit : le verset arabe (Uthmani) en cours. Référence « Al-Kahf 18:n » dans un coin. Le texte est vérifié octet par octet contre la source, comme pour Al-Ikhlas.

**Format.** 1920×1080, 30 i/s, pour YouTube. Titre sûr à 5 % des bords ; sous-titres entre y = 860 et 1010.

**Outil.** Projet Remotion (`histoires/caverne/`) : une `<Sequence>` par verset, les décors dessinés dans un `<canvas>` en fonction de `useCurrentFrame()`, l'audio en `<Audio>`. Vérifications et planches contact avec les scripts opus.

## Structure en trois actes

| Verset | Ce qu'on entend (sens) | Ce qu'on voit | Ce qui change | Caméra | Lumière |
|---|---|---|---|---|---|
| **Ouverture** (0-3 s) | silence avant la récitation | une montagne sous un ciel étoilé, l'entrée noire d'une grotte | les étoiles tournent lentement | large et fixe | indigo, lune basse |
| **9** | Penses-tu que les gens de la Caverne et d'Ar-Raqîm étaient une merveille ? | on s'approche de la grotte ; à l'entrée, une tablette gravée (ar-Raqîm) | la tablette s'éclaire d'or au mot « Ar-Raqîm » | lente poussée vers l'avant | lune argent |
| **10** | Les jeunes gens se réfugient dans la caverne : « Seigneur, accorde-nous une miséricorde » | un sentier de montagne sous la pleine lune : cinq ou six silhouettes marchent en file et atteignent la grotte | au moment de l'invocation, ils lèvent les mains ; une lueur descend | travelling latéral qui suit la marche | contre-jour lunaire |
| **11** | Nous avons scellé leurs oreilles dans la caverne pendant des années | l'intérieur de la grotte : ils s'allongent, la lampe baisse | la lampe s'éteint ; par l'entrée, les étoiles tournent de plus en plus vite | fixe, intérieur | l'or s'éteint, l'indigo reste |
| **12** | Puis Nous les avons réveillés pour savoir quel groupe compterait le mieux leur séjour | le même plan ; l'aube entre | les silhouettes remuent ; un sablier se retourne en surimpression | fixe | aube pâle |
| **13-14** *(acte 1 : retour en arrière)* | Leur récit en vérité : des jeunes qui croyaient ; Nous avons fortifié leurs cœurs, ils se levèrent et dirent : « Notre Seigneur est le Seigneur des cieux et de la terre » | une ville aux murs de brique ; une cour royale, le roi assis en silhouette | les jeunes se lèvent au milieu de la foule assise ; au mot « cieux », le toit s'ouvre sur le ciel | contre-plongée lente | torches rouges, puis une lumière blanche d'en haut |
| **15** | Nos concitoyens ont pris des divinités en dehors de Lui | les temples et les idoles, dans la lumière des torches | les idoles sont des blocs sans visage, grandes et vides | panoramique sur les statues | rouge brique, fumée |
| **16** | Séparez-vous d'eux et réfugiez-vous dans la caverne | les portes de la ville s'ouvrent de nuit ; les silhouettes sortent vers les collines, un chien les rejoint | la ville rétrécit derrière eux et la lune monte | grand plan qui s'élargit | rouge qui cède à l'indigo |
| **17** *(acte 2 : le sommeil)* | Le soleil, à son lever, s'écarte de leur caverne vers la droite ; à son coucher, il passe à leur gauche | **l'image centrale** : intérieur de la grotte en accéléré | les faisceaux du soleil balaient à droite, puis à gauche, et ne touchent jamais les dormeurs | fixe | alternance or et indigo |
| **18** | On les croirait éveillés ; Nous les tournons sur la droite et sur la gauche ; leur chien, les pattes étendues sur le seuil | gros plan sur les dormeurs, le chien au seuil | les corps se retournent lentement, d'un côté puis de l'autre | léger basculement | lune argent sur le chien |
| **19** | Ils se réveillent : « Combien de temps ? » « Un jour, ou une partie d'un jour. » Envoyez l'un de vous en ville avec votre pièce d'argent | ils s'assoient ; une main tend une pièce | la pièce brille ; une silhouette sort dans la lumière | fixe, puis on suit | aube, reflet d'argent |
| **20** | S'ils vous découvrent, ils vous lapideront | la silhouette descend la colline, prudente | son ombre s'allonge ; au loin, une ville inconnue | travelling | lumière de midi, ombres dures |
| **21** *(acte 3 : le signe)* | Nous les avons fait découvrir, pour qu'on sache que la promesse d'Allah est vraie ; « Élevons sur eux un lieu de prière » | une ville nouvelle, différente (coupoles, vert) : on se rassemble autour de l'homme et de sa pièce | on revient à la grotte : un édifice s'élève devant elle, pierre après pierre | grue qui s'élève | vert d'aube, or |
| **22** | « Ils étaient trois, le quatrième leur chien… cinq… sept… » Dis : Mon Seigneur connaît mieux leur nombre | des silhouettes apparaissent en rang, trois, puis cinq, puis sept, avec un chien | chaque groupe se dissout en poussière ; il ne reste que l'entrée de la grotte | fixe | brume |
| **23-24** | Ne dis jamais « je le ferai demain » sans « si Allah le veut » | un soleil se lève sur un paysage vide ; une lampe de voyageur | la lampe s'allume au mot « inchâ'Allah » | lent | aube |
| **25** | Ils demeurèrent dans leur caverne trois cents ans, et en ajoutèrent neuf | la lune au-dessus de la grotte | la lune passe par toutes ses phases en accéléré ; un compteur discret atteint 300, puis 309 | fixe | argent |
| **26** | Dis : Allah sait mieux combien ils demeurèrent ; à Lui l'inconnaissable des cieux et de la terre | on s'éloigne de la grotte vers la montagne, puis le ciel et les étoiles | fondu sur les étoiles | grand recul | indigo, étoiles |
| **Générique** (4 s) | — | « Al-Kahf 18:9-26 · Récitation : Mishary Alafasy · Traduction : Muhammad Hamidullah » | fondu au noir | — | — |

**L'accroche.** Image 0 : la grotte noire sous les étoiles, avec la tablette qui luit déjà faiblement. Dès la première seconde, la question du verset 9.

**La fin.** Le recul jusqu'au ciel étoilé, qui ramène à l'image d'ouverture (une boucle), puis le générique.

## Risques
- **Longueur (environ 4 min) :** 16 scènes, c'est du travail en « production ». Je construis d'abord la scène la plus difficile (v. 17, le soleil autour de la grotte) pour valider le style, puis le reste.
- **Sensibilité :** les silhouettes n'ont pas de visage ; aucune idole n'est détaillée ; le divin n'est jamais figuré. À faire relire par une personne de confiance.
- **Nombre des dormeurs :** le Coran le laisse en suspens (v. 22). On en montre un nombre flou (cinq ou six silhouettes, jamais comptables à l'écran), sauf au v. 22, où les nombres sont cités puis se dissolvent.
- **Réseau :** ce conteneur bloque l'accès à everyayah.com et à quran.com (voir plus bas). Il faut les autoriser, ou déposer l'audio et le texte dans le dépôt.
- **Écoute :** je ne peux pas écouter le résultat ; la synchronisation sera mesurée, pas entendue.
