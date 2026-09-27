#!/usr/bin/env bash
# Rend une ou plusieurs histoires : son généré par la page, vérification de pureté, rendu ×2, copie « upload ».
#   bash rendre.sh preteur-conciliant la-serenite …
set -e
export PATH="/c/Users/Coulibaly/AppData/Local/Microsoft/WinGet/Links:$PATH"
export CHROME="${CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
SK=../.claude/skills/opus-js-animations/scripts
mkdir -p export
for s in "$@"; do
  h=histoires/$s/film.html
  node $SK/verify.mjs $h --ss 2 | tail -1
  node $SK/page_audio.mjs $h --out histoires/$s/ambiance.wav
  node $SK/render.mjs $h --fps 30 --audio histoires/$s/ambiance.wav --out export/$s-master.mp4 --workers 3 --ss 2 | tail -3
  ffmpeg -v error -y -i export/$s-master.mp4 -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M -profile:v high -pix_fmt yuv420p \
    -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -g 60 -c:a copy -movflags +faststart export/hadith-$s.mp4
  echo "→ export/hadith-$s.mp4"
done
