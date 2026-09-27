# Télécharge le catalogue français de HadeethEnc.com (Encyclopédie des hadiths traduits) :
# liste par catégorie racine, puis le détail de chaque hadith → dataset/hadiths-fr.jsonl (une ligne JSON par hadith).
import json, time, urllib.request, concurrent.futures as cf, os, sys
sys.stdout.reconfigure(encoding='utf-8')
API = 'https://hadeethenc.com/api/v1'
def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'coran-vid/1.0'}), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(2 * (k + 1))
roots = get(f'{API}/categories/roots/?language=fr')
ids = {}
for c in roots:
    page = 1
    while True:
        d = get(f"{API}/hadeeths/list/?language=fr&category_id={c['id']}&page={page}&per_page=200")
        for h in d['data']: ids.setdefault(h['id'], c['title'])
        if page >= int(d['meta']['last_page']): break
        page += 1
    print(c['title'], '→', len(ids), 'identifiants cumulés', flush=True)
out = 'dataset/hadiths-fr.jsonl'
done = set()
if os.path.exists(out):
    for l in open(out, encoding='utf-8'): done.add(json.loads(l)['id'])
todo = [i for i in ids if i not in done]
print(len(todo), 'à télécharger', flush=True)
with open(out, 'a', encoding='utf-8') as f, cf.ThreadPoolExecutor(4) as ex:
    for n, h in enumerate(ex.map(lambda i: get(f'{API}/hadeeths/one/?language=fr&id={i}'), todo)):
        h['root_category'] = ids[h['id']]
        f.write(json.dumps(h, ensure_ascii=False) + '\n')
        if n % 100 == 0: print(n, flush=True)
print('terminé :', len(done) + len(todo), 'hadiths')
