# Génère histoires/<slug>/data.js à partir du jeu de données HadeethEnc (aucun mot retapé).
# Le texte est découpé en cartons de lecture aux ponctuations ; chaque carton est une tranche de mots du texte source,
# et la re-jointure des cartons redonne exactement le texte (espaces multiples de la source ramenés à un seul).
import json, re, sys, os
sys.stdout.reconfigure(encoding='utf-8')
H = {h['id']: h for h in map(json.loads, open('dataset/hadiths-fr.jsonl', encoding='utf-8'))}
HISTOIRES = {
    'preteur-conciliant': {'id': '3753', 'titre': 'Le prêteur conciliant', 'scene': 'preteur', 'enseignement': 1},
    'la-serenite': {'id': '6178', 'titre': 'La sérénité descendue sur le Coran', 'scene': 'serenite', 'enseignement': None},
    'le-puits-et-le-chien': {'id': '10100', 'titre': 'L’homme qui abreuva un chien', 'scene': 'puits', 'enseignement': None,
                             'fin_extrait': 'sera récompensé. " »'},
}
CPS, BASE, MIN = 15.0, 1.3, 3.2          # vitesse de lecture (caractères/s), temps fixe par carton, durée minimale
OUVRANTS = {'"', "'", '«'}
def fin_forte(w): return re.search(r"[.!?;:][\"»']?$", w) is not None
def cartons(words, intro=True):
    # 1. phrases : coupure après une ponctuation forte ; un guillemet isolé après « : » ouvre la phrase suivante
    segs, cur = [], []
    for i, w in enumerate(words):
        if w in OUVRANTS and cur and cur[-1].endswith(':'):
            segs.append(cur); cur = [w]; continue
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else ''
        fermant = w in ('"', "'", '»') and len(cur) > 1 and fin_forte(cur[-2])
        if fermant or (fin_forte(w) and not (nxt in ('"', "'", '»') and not w.endswith(':'))):
            segs.append(cur); cur = []
    if cur: segs.append(cur)
    # une phrase qui annonce une parole (« … dit : ») reste avec la parole, sauf l'introduction du rapporteur
    def ouverte(sg):                      # une citation entre guillemets reste ouverte dans ce morceau
        return sg.count('"') % 2 == 1 or sg.count('«') > sg.count('»')
    glued = []
    for sg in segs:
        g = glued[-1] if glued else None
        colle = g and not (intro and len(glued) == 1) and (g[-1].endswith(':') or ouverte(g))
        if colle and len(' '.join(g + sg)) <= 140: glued[-1] = g + sg
        else: glued.append(sg)
    segs = glued
    # 2. phrases trop longues : coupure à la virgule la plus proche du milieu
    out = []
    for sg in segs:
        while len(' '.join(sg)) > 140:
            L = len(' '.join(sg)); best = None
            for k in range(1, len(sg)):
                if sg[k - 1].endswith(','):
                    d = abs(len(' '.join(sg[:k])) - L / 2)
                    if best is None or d < best[0]: best = (d, k)
            if not best: break
            out.append(sg[:best[1]]); sg = sg[best[1]:]
        out.append(sg)
    # 3. fusion des morceaux courts (jamais avec le carton d'introduction du rapporteur)
    res = []
    for sg in out:
        if res and not (intro and len(res) == 1) and len(' '.join(res[-1] + sg)) <= 110: res[-1] = res[-1] + sg
        else: res.append(sg)
    # aucun carton de moins de 18 caractères (un guillemet ou un « Alors, » seul) : il rejoint son voisin
    k = 1
    while k < len(res):
        if len(' '.join(res[k])) < 18: res[k - 1] = res[k - 1] + res.pop(k)
        elif len(' '.join(res[k - 1])) < 18 and not (intro and k == 1): res[k - 1] = res[k - 1] + res.pop(k)
        else: k += 1
    return res
def rapporte(a):
    # « Rapporté par Al-Bûkhârî - Rapporté par Al-Bukhârî et Muslim » → la mention la plus complète, telle qu'écrite dans la source
    parts = [p.strip() for p in a.split(' - ')]
    both = [p for p in parts if 'Muslim' in p and ('Bukh' in p or 'Bûkh' in p)]
    return both[0] if both else a
def generer(slug, cfg):
    h = H[cfg['id']]
    texte = h['hadeeth']
    extrait = False
    if cfg.get('fin_extrait'):
        k = texte.index(cfg['fin_extrait']) + len(cfg['fin_extrait']); extrait = texte[k:].strip() != ''; texte = texte[:k]
    words = texte.split()
    cs = cartons(words)
    assert ' '.join(' '.join(c) for c in cs) == ' '.join(words)
    t, tl = 3.0, []                                         # 3 s d'accroche avant le premier carton
    for i, c in enumerate(cs):
        s = ' '.join(c); d = max(MIN, BASE + len(s) / CPS)
        tl.append({'t0': round(t, 2), 't1': round(t + d, 2), 'texte': s, 'intro': i == 0})
        t += d
    ens = None
    if cfg['enseignement'] is not None and h.get('hints'):
        ens = h['hints'][cfg['enseignement']].strip()
        for j, c in enumerate([ens.split()] if len(ens) <= 160 else cartons(ens.split(), intro=False)):
            e = ' '.join(c); d = max(MIN, BASE + len(e) / CPS)
            tl.append({'t0': round(t, 2), 't1': round(t + d, 2), 'texte': e, 'enseignement': True, 'premier': j == 0}); t += d
    fin = {'t0': round(t, 2), 't1': round(t + 4.0, 2)}
    data = {
        'slug': slug, 'id': h['id'], 'titre': cfg['titre'], 'scene': cfg['scene'], 'extrait': extrait,
        'degre': h['grade'], 'rapporte': rapporte(h['attribution']), 'rapporte_source': h['attribution'], 'cartons': tl, 'fin': fin, 'duree': round(fin['t1'] + .6, 2),
        'source': f"HadeethEnc.com · hadith n° {h['id']}", 'texte_source': ' '.join(words),
    }
    os.makedirs(f'histoires/{slug}', exist_ok=True)
    open(f'histoires/{slug}/data.js', 'w', encoding='utf-8', newline='\n').write(
        '// Généré par moteur/generer_histoire.py depuis dataset/hadiths-fr.jsonl — ne pas éditer à la main.\nwindow.HISTOIRE = '
        + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
    print(f"== {slug} ({h['id']}) : {len(tl)} cartons, {data['duree']} s{' — extrait' if extrait else ''}")
    for c in tl: print(f"  {c['t0']:6.2f}–{c['t1']:6.2f} [{len(c['texte']):3d}] {c['texte']}")
for slug, cfg in HISTOIRES.items():
    if len(sys.argv) < 2 or slug in sys.argv[1:]: generer(slug, cfg)
