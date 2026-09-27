# Alignement Whisper verset par verset : chaque fichier EveryAyah est transcrit seul (modèle medium, mots horodatés),
# puis décalé de la durée cumulée des versets précédents dans audio.wav.
import json, sys, subprocess, whisper
sys.stdout.reconfigure(encoding='utf-8')
m = whisper.load_model(sys.argv[1] if len(sys.argv) > 1 else 'medium')
ref = open('texte-arabe.txt', encoding='utf-8').read().split('\n')[:4]
off, out = 0.0, []
for i in range(4):
    f = f'source/11200{i+1}.mp3'
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
    r = m.transcribe(f, language='ar', word_timestamps=True, condition_on_previous_text=False, initial_prompt=ref[i])
    words = [{'w': w['word'].strip(), 't0': round(w['start'] + off, 3), 't1': round(w['end'] + off, 3)} for s in r['segments'] for w in s['words']]
    print(f'112:{i+1} [{off:.3f}–{off+dur:.3f}]', r['text'].strip())
    for w in words: print(f"   {w['t0']:6.2f}–{w['t1']:6.2f}  {w['w']}")
    out.append({'ayah': i + 1, 'start': round(off, 3), 'end': round(off + dur, 3), 'words': words})
    off += dur
json.dump(out, open('source/versets.align.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
