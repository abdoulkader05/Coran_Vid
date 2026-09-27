# Sourate Al-Ikhlas (112) — traitement du réalisateur

*Statut : approuvé par consigne (étape 3 du brief), construction lancée directement.*

**Logline.** Sur une nuit d'encre, une rosace géométrique d'or naît d'un seul point et se referme sur elle-même à mesure que
les quatre versets sont récités : tout part d'un centre unique, tout y revient, rien n'en sort, et rien ne lui ressemble.

**L'image centrale (la vignette).** Une rosace à huit branches, tracée en fils de lumière dorée, dont le centre est le point le
plus lumineux de l'image, suspendue au-dessus d'un grand texte arabe ivoire.

**Précaution de représentation.** La lumière et la géométrie sont de l'ornement (tradition de l'art islamique : le motif
rayonnant qui exprime l'unité), jamais une figuration d'Allah. Aucun être humain, animal ni visage. Aucune musique ni effet
sonore sous la récitation.

**Look.** 2D, Canvas 2D pur.
| Rôle | Couleur |
|---|---|
| Fond, haut | encre bleu nuit `#060a1c` |
| Fond, bas | bleu nuit `#0d1636` |
| Lignes d'ornement | or `#d9b25f` |
| Cœur lumineux | or clair `#ffe7a8` |
| Texte arabe | ivoire `#f6efdf`, mot en cours rehaussé d'or `#f3cf7a` |
| Traduction | ivoire adouci `#e9e2d2` |
| Filet séparateur | or pâle, 35 % |

Texture : aucune (pas de grain animé en livraison, `delivery.md`), vignettage doux, halo sombre sous le texte.

**Son.** Mishary Rashid Alafasy, EveryAyah, fichiers 112001 à 112004 assemblés bout à bout : 13,12 s, sans normalisation ni
fondu. Chaque mot arabe apparaît sur son attaque mesurée (Whisper medium verset par verset, recoupé avec le signal). Film :
15,3 s, soit la récitation puis 2 s de générique sur un silence.

**Structure : une scène continue, un état par verset.**

| Temps (s) | Verset / mots | Ce que l'on voit | Ce qui change | Caméra | Texte |
|---|---|---|---|---|---|
| 0–2,92 | 1. قُلْ هُوَ ٱللَّهُ أَحَدٌ (« Dis : Il est Allah, Unique ») | un point de lumière au centre de la rosace, déjà allumé à l'image 0 | l'étoile à huit branches se trace depuis le centre ; sur أَحَدٌ (1,89 s) le cœur s'intensifie | poussée très lente (1 → 1,06 sur tout le film) | 4 mots révélés de droite à gauche, puis la traduction |
| 2,92–5,40 | 2. ٱللَّهُ ٱلصَّمَدُ (« Le Seul à être imploré… ») | huit rayons partent du cercle extérieur et convergent vers le centre | tout est tourné vers le centre : les lignes coulent vers lui | idem | 2 mots |
| 5,40–8,32 | 3. لَمْ يَلِدْ وَلَمْ يُولَدْ (« n'a jamais engendré, n'a pas été engendré ») | la couronne à seize pointes se ferme ; un cercle scelle la rosace | la figure est close et complète : rien n'en sort, rien n'y entre | idem | 4 mots |
| 8,32–12,3 | 4. وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ (« nul n'est égal à Lui ») | un pavage d'étoiles apparaît faiblement sur tout le fond | la multitude reste pâle et identique ; seule la rosace centrale brille : « nul n'est égal » | idem | 5 mots |
| 12,3–15,3 | générique | la rosace entière respire doucement | le texte du verset 4 s'efface ; générique ; fondu au noir sur les 0,5 dernières secondes | idem | « Sourate Al-Ikhlas (112) · Récitation : Mishary Rashid Alafasy · Traduction du sens : Muhammad Hamidullah » |

**Texte à l'écran.**
- Arabe : Amiri Quran (police conçue pour le texte coranique, harakat et signes Uthmani complets), environ 116 px, centré. Un
  verset à l'écran à la fois. Chaque mot se révèle par un masque qui balaie de droite à gauche ; la ligne est composée d'un
  seul tenant, donc les ligatures ne sont jamais coupées. Le mot en cours de récitation brille d'or, puis redevient ivoire.
- Français : EB Garamond Medium, environ 46 px, sous un filet d'or. Le verset entier apparaît 0,3 s après le premier mot
  (lisible sans le son).
- Zones de sécurité : aucun texte au-dessus de y = 192 px (10 %) ni sous y = 1632 px (15 %) ; largeur utile x = 90–940.

**L'accroche.** Image 0 : la rosace est déjà en train de se tracer autour d'un point lumineux, et la voix arrive à 0,08 s.

**La fin.** La rosace complète, le générique en trois lignes, puis un fondu au noir.

**Formats.** 9:16 en 1080×1920 (texte arabe à y ≈ 1080, traduction à y ≈ 1270, rosace centrée à y ≈ 600). 16:9 en 1920×1080 :
la rosace à gauche et le texte à droite, construits à partir du même `film.js`.

**Risques et contrôles.**
- Une ligne arabe mal composée : recadrages 1:1 de chaque verset, contrôle des signes ۥ (U+06E5) et ۢ (U+06E2) et de la wasla ٱ.
- Un mot révélé en décalage avec la voix : planche image par image autour de chaque attaque.
- Des lignes d'ornement qui gênent la lecture : halo sombre sous le bloc texte.
