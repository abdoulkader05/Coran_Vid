# Recoupe les frontières Whisper avec le signal : RMS sur fenêtres de 10 ms, début de voix par verset,
# et creux locaux (minimum > 6 dB sous le voisinage ±80 ms) près de chaque frontière de mot.
import json, sys, wave, numpy as np
sys.stdout.reconfigure(encoding='utf-8')
wf = wave.open('source/audio.wav'); sr = wf.getframerate(); n = wf.getnframes()
x = np.frombuffer(wf.readframes(n), dtype=np.int16).reshape(-1, wf.getnchannels()).mean(1) / 32768
hop = sr // 100; fr = len(x) // hop
rms = 20 * np.log10(np.sqrt((x[:fr * hop].reshape(fr, hop) ** 2).mean(1)) + 1e-9)
A = json.load(open('source/versets.align.json', encoding='utf-8'))
def dips_near(t, win=.25):
    c = int(t * 100); best = None
    for i in range(max(8, c - int(win * 100)), min(fr - 8, c + int(win * 100))):
        nb = np.r_[rms[i - 8:i - 2], rms[i + 3:i + 9]].mean()
        if rms[i] == rms[i - 3:i + 4].min() and nb - rms[i] > 6 and (best is None or rms[i] < rms[best]): best = i
    return None if best is None else best / 100
for v in A:
    a, b = int(v['start'] * 100), int(v['end'] * 100)
    on = next(i for i in range(a, b) if rms[i] > -35) / 100
    off = next(i for i in range(b - 1, a, -1) if rms[i] > -40) / 100
    print(f"112:{v['ayah']}  voix {on:.2f} → {off:.2f}")
    v['voice_on'], v['voice_off'] = on, off
    for k, w in enumerate(v['words']):
        d = dips_near(w['t0']) if k else None
        w['onset'] = on if k == 0 else (d if d is not None else w['t0'])
        print(f"   {w['w']:>10}  whisper {w['t0']:.2f}  creux {d if d is not None else '—'}  → retenu {w['onset']:.2f}")
json.dump(A, open('source/versets.align.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
