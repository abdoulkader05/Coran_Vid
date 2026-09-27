# Vérification octet par octet du texte arabe (quoted-text.md) : Quran.com (source) vs Tanzil (contrôle),
# et reconstruction de chaque verset à partir des mots Quran.com.
import json, sys, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
q = json.load(open('source/qurancom-uthmani.json', encoding='utf-8'))['verses']
t = json.load(open('source/tanzil-uthmani.json', encoding='utf-8'))['data']['ayahs']
w = json.load(open('source/qurancom-words.json', encoding='utf-8'))['verses']
ok = True
lines = []
for i in range(4):
    a = q[i]['text_uthmani'].strip()          # Quran.com renvoie un espace en tête du verset 1
    b = t[i]['text']
    if i == 0 and b.endswith(' ' + a):        # Tanzil préfixe la basmala (4 mots) au verset 1 : on retire exactement ce préfixe
        pre = b[:-len(a) - 1]; print('  préfixe Tanzil retiré :', len(pre.split(' ')), 'mots'); b = b[len(pre) + 1:]
    words = ' '.join(x['text_uthmani'] for x in w[i]['words'] if x['char_type_name'] == 'word')
    same = a.encode('utf-8') == b.encode('utf-8') == words.encode('utf-8')
    ok &= same
    print(f"112:{i+1} {'IDENTIQUE' if same else 'DIFFERENT'}  {len(a.encode('utf-8'))} octets  NFC={unicodedata.is_normalized('NFC', a)}")
    if not same: print('  qc ', a.encode('utf-8').hex()); print('  tz ', b.encode('utf-8').hex()); print('  wd ', words.encode('utf-8').hex())
    lines.append(a)
for l in lines:
    print(' '.join(f'U+{ord(c):04X}' for c in l))
open('texte-arabe.txt', 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
tr = [x['text'] for x in json.load(open('source/qurancom-hamidullah.json', encoding='utf-8'))['translations']]
open('traduction-fr.txt', 'w', encoding='utf-8', newline='\n').write('\n'.join(tr) + '\n')
# relecture : le fichier écrit redonne exactement les mêmes octets
back = open('texte-arabe.txt', encoding='utf-8').read().split('\n')[:4]
print('relecture fichier:', 'OK' if back == lines else 'ECHEC')
sys.exit(0 if ok and back == lines else 1)
