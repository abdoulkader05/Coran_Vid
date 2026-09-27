# Génère film/data.js à partir des fichiers canoniques (aucun texte retapé) : texte-arabe.txt, traduction-fr.txt, calage.json.
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
ar = open('texte-arabe.txt', encoding='utf-8').read().split('\n')[:4]
fr = open('traduction-fr.txt', encoding='utf-8').read().split('\n')[:4]
cal = json.load(open('calage.json', encoding='utf-8'))
verses = []
for a, f, c in zip(ar, fr, cal):
    assert len(a.split(' ')) == len(c['onsets']), (a, c)
    verses.append({'n': c['ayah'], 'ar': a, 'fr': f, 'start': c['start'], 'end': c['end'],
                   'voiceOff': c['voice_off'], 'onsets': c['onsets']})
data = {
    'surah': 112, 'audioEnd': cal[-1]['end'], 'verses': verses,
    'credits': ['Sourate Al-Ikhlas (112)', 'Récitation : Mishary Rashid Alafasy', 'Traduction du sens : Muhammad Hamidullah'],
}
open('film/data.js', 'w', encoding='utf-8', newline='\n').write(
    '// Généré par source/generer_data.py — ne pas éditer à la main.\nwindow.FILM_DATA = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('film/data.js écrit :', sum(len(v['onsets']) for v in verses), 'mots')
