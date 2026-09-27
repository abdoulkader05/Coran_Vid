// Sourate Al-Ikhlas (112) — film en Canvas 2D, construit sur le template opus-js-animations.
// Contrat : window.__film = { duration, ready, seek(t), shots, marks } ; seek(t) est une fonction pure du temps.
// Le texte (arabe, traduction, crédits) et le calage viennent de data.js, généré depuis les fichiers canoniques.
// Formats : window.FILM_FORMAT = '9x16' (1080×1920, par défaut) ou '16x9' (1920×1080), fixé par la page HTML.
'use strict';

const DATA = window.FILM_DATA;
const FMT = window.FILM_FORMAT === '16x9' ? '16x9' : '9x16';
const LAYOUTS = {
  // Sécurité TikTok/Reels : aucun texte au-dessus de 10 % de la hauteur ni sous 85 %.
  '9x16': { W: 1080, H: 1920, rc: [540, 580], rr: 320, tx: 540, arY: 1110, arSize: 110, arMaxW: 850, frTop: 1275, frSize: 46, frMaxW: 840, crY: 1180 },
  '16x9': { W: 1920, H: 1080, rc: [500, 540], rr: 330, tx: 1370, arY: 400, arSize: 96, arMaxW: 880, frTop: 545, frSize: 42, frMaxW: 820, crY: 500 },
};
const L = LAYOUTS[FMT];
const W = L.W, H = L.H;
const AUDIO_END = DATA.audioEnd;                      // 13.124 s de récitation
const DURATION = 15.3;                                // + 2 s de générique et le fondu
const TAU = Math.PI * 2, PI = Math.PI;
window.FILM_GRAIN = window.FILM_GRAIN || 'none';      // pas de grain animé (delivery.md)

const SS = Math.max(1, Math.round(Number(new URLSearchParams(location.search).get('ss')) || 1));
function supersample(g, k) {
  if (k === 1) return g;
  const C2 = CanvasRenderingContext2D.prototype, st = C2.setTransform;
  g.setTransform = function (a, b, c, d, e, f) { return st.call(this, a * k, b * k, c * k, d * k, e * k, f * k); };
  g.resetTransform = function () { return st.call(this, k, 0, 0, k, 0, 0); };
  for (const p of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) {
    const d = Object.getOwnPropertyDescriptor(C2, p);
    Object.defineProperty(g, p, { get() { return d.get.call(this) / k; }, set(v) { d.set.call(this, v * k); } });
  }
  const fd = Object.getOwnPropertyDescriptor(C2, 'filter');
  Object.defineProperty(g, 'filter', { get() { return fd.get.call(this); }, set(v) { fd.set.call(this, String(v).replace(/(-?[\d.]+)px/g, (m, n) => `${+n * k}px`)); } });
  g.setTransform(1, 0, 0, 1, 0, 0);
  return g;
}
const cv = document.getElementById('c');
cv.width = W * SS; cv.height = H * SS;
cv.style.aspectRatio = `${W} / ${H}`;
const ctx = supersample(cv.getContext('2d'), SS);

// ─── utils ──────────────────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, k) => a + (b - a) * k;
const ramp = (t, a, b) => smooth((t - a) / (b - a));
function keyed(t, keys, log = false) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], k = easeIO((t - t0) / (t1 - t0));
    return log ? v0 * Math.pow(v1 / v0, k) : lerp(v0, v1, k);
  }
  return keys[keys.length - 1][1];
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  inkTop: '#060a1c', inkBot: '#0d1636', gold: '217,178,95', goldHi: '255,231,168',
  ivory: '#f6efdf', goldText: '#f3cf7a', fr: '#ebe4d4',
};
const FONT_AR = px => `${px}px "Amiri Quran"`;
const FONT_FR = (px, w = 500) => `${w} ${px}px "EB Garamond"`;

// ─── timeline (données) ─────────────────────────────────────────────────────
const V = DATA.verses;
const LEAD = 0.10, SWEEP = 0.30;                      // un mot commence à se révéler 0,10 s avant son attaque, en 0,30 s
// Fin d'affichage de chaque verset : juste avant le premier mot du suivant ; le dernier tient jusqu'à 12,55 s.
V.forEach((v, i) => { v.show = v.onsets[0] - LEAD - .02; v.hide = i < V.length - 1 ? V[i + 1].onsets[0] - LEAD - .05 : 12.55; });
const T1 = V[0].start, T2 = V[1].start, T3 = V[2].start, T4 = V[3].start;
const AHAD1 = V[0].onsets[3], AHAD4 = V[3].onsets[4];   // les deux أَحَد : le cœur s'intensifie
const CREDITS_IN = 12.75, FADE_OUT = DURATION - .5;

// ─── texte arabe : une ligne composée d'un seul tenant, révélée mot par mot par un masque droite → gauche ──
// Les zones de mots sont mesurées sur des préfixes du texte (en RTL, un préfixe commence au bord droit) ;
// la frontière entre deux mots passe au milieu de l'espace, si bien qu'aucun glyphe ni signe n'est coupé.
const [, MX] = canvas(8, 8);
function arabicLines(words, size, maxW) {
  MX.font = FONT_AR(size); MX.direction = 'rtl';
  const lines = []; let cur = [];
  for (const w of words) {
    const t = [...cur, w];
    if (cur.length && MX.measureText(t.join(' ')).width > maxW) { lines.push(cur); cur = [w]; } else cur = t;
  }
  lines.push(cur);
  if (lines.length === 2) {                                   // équilibrer deux lignes
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
      const m = Math.max(MX.measureText(a).width, MX.measureText(b).width);
      if (m <= maxW && (!best || m < best.m)) best = { m, k };
    }
    if (best) return [words.slice(0, best.k), words.slice(best.k)];
  }
  return lines;
}
function bakeArabicLine(words, size, color) {
  MX.font = FONT_AR(size); MX.direction = 'rtl';
  const text = words.join(' ');
  const m = MX.measureText(text), lineW = m.width;
  const asc = Math.ceil(Math.max(m.actualBoundingBoxAscent, size * .95)), desc = Math.ceil(Math.max(m.actualBoundingBoxDescent, size * .55));
  const pad = 40, w = Math.ceil(lineW + pad * 2), h = asc + desc + pad * 2;
  const [c, x] = canvas(w * SS, h * SS);
  x.scale(SS, SS);
  x.font = FONT_AR(size); x.direction = 'rtl'; x.textAlign = 'right'; x.textBaseline = 'alphabetic';
  x.fillStyle = color;
  x.fillText(text, pad + lineW, pad + asc);
  // zones de mots en pixels de film, de droite à gauche
  const sp = MX.measureText(' ').width, right = pad + lineW, zones = [];
  for (let k = 0; k < words.length; k++) {
    const before = k ? MX.measureText(words.slice(0, k).join(' ')).width + sp / 2 : -pad;
    const after = k < words.length - 1 ? MX.measureText(words.slice(0, k + 1).join(' ')).width + sp / 2 : lineW + pad;
    zones.push({ r: right - before, l: right - after });
  }
  return { c, w, h, zones, text, baseline: pad + asc };
}
const verseArt = [];          // par verset : lignes { ivory, gold, words, first }
const [TMP, TX] = canvas(8, 8);
function buildText() {
  for (const v of V) {
    const words = v.ar.split(' ');
    if (words.join(' ') !== v.ar) throw new Error('mots arabes non recomposables');
    const lines = arabicLines(words, L.arSize, L.arMaxW);
    let first = 0;
    const art = lines.map(ws => {
      const o = { ivory: bakeArabicLine(ws, L.arSize, C.ivory), gold: bakeArabicLine(ws, L.arSize, C.goldText), first, n: ws.length };
      first += ws.length; return o;
    });
    if (art.map(a => a.ivory.text).join(' ') !== v.ar) throw new Error('lignes arabes ≠ texte canonique');
    verseArt.push(art);
    v.frArt = bakeFrench(v.fr, L.frSize, L.frMaxW);
  }
  let mw = 8, mh = 8;
  for (const art of verseArt) for (const a of art) { mw = Math.max(mw, a.ivory.w); mh = Math.max(mh, a.ivory.h); }
  TMP.width = Math.ceil(mw * SS); TMP.height = Math.ceil(mh * SS);
  CREDITS = DATA.credits.map((s, i) => bakeFrenchLine(s, i === 0 ? FONT_FR(L.frSize + 10, 600) : FONT_FR(L.frSize - 6, 500), i === 0 ? C.goldText : C.fr));
}
// révèle le verset i : chaque mot k a sa progression p_k ; le mot en cours est rehaussé d'or
function drawVerse(i, t, alpha) {
  const v = V[i], art = verseArt[i];
  const lineGap = L.arSize * 1.75;
  const y0 = L.arY - (art.length - 1) * lineGap / 2;
  art.forEach((ln, li) => {
    const iv = ln.ivory, gd = ln.gold;
    // progression de révélation de chaque mot de la ligne
    let edge = null, cur = -1, curH = 0;
    for (let k = 0; k < ln.n; k++) {
      const gk = ln.first + k, on = v.onsets[gk];
      const p = easeOut((t - (on - LEAD)) / SWEEP);
      if (p <= 0) break;
      const z = iv.zones[k];
      edge = { z, p };
      const next = gk + 1 < v.onsets.length ? v.onsets[gk + 1] - LEAD : v.voiceOff + .15;
      const h = Math.min(ramp(t, on - LEAD, on + .1), 1 - ramp(t, next, next + .45));
      if (h > curH) { curH = h; cur = k; }
    }
    if (!edge) return;
    const cw = iv.w * SS, ch = iv.h * SS;
    TX.setTransform(1, 0, 0, 1, 0, 0); TX.globalCompositeOperation = 'source-over'; TX.globalAlpha = 1;
    TX.clearRect(0, 0, TMP.width, TMP.height);
    TX.drawImage(iv.c, 0, 0);
    if (cur >= 0 && curH > .002) {
      const z = iv.zones[cur];
      TX.save(); TX.beginPath(); TX.rect(z.l * SS, 0, (z.r - z.l) * SS, ch); TX.clip();
      TX.globalAlpha = curH; TX.drawImage(gd.c, 0, 0); TX.restore();
    }
    // masque : tout ce qui est à droite du mot en cours est acquis ; le mot en cours se révèle avec un bord adouci
    const F = 34, { z, p } = edge, e = lerp(z.r, z.l - F, p);
    TX.globalCompositeOperation = 'destination-in';
    const g = TX.createLinearGradient(e * SS, 0, (e + F) * SS, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    // jamais au-delà du bord gauche du mot en cours : le mot suivant reste invisible jusqu'à son tour
    const x0 = Math.max(e, z.l, 0);
    TX.fillStyle = g; TX.fillRect(x0 * SS, 0, cw - x0 * SS, ch);
    if (x0 > 0) TX.clearRect(0, 0, x0 * SS, ch);
    TX.clearRect(cw, 0, TMP.width - cw, TMP.height); TX.clearRect(0, ch, TMP.width, TMP.height - ch);
    TX.globalCompositeOperation = 'source-over';
    // pose : ligne centrée en L.tx, ligne de base alignée sur y0 + li·lineGap
    const x = L.tx - iv.w / 2, y = y0 + li * lineGap - iv.baseline + L.arSize * .30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(255,205,120,.28)'; ctx.shadowBlur = 18;
    ctx.drawImage(TMP, 0, 0, cw, ch, x, y, iv.w, iv.h);
    ctx.restore();
  });
}

// ─── texte français ─────────────────────────────────────────────────────────
function wrapFr(text, font, maxW) {
  MX.font = font; MX.direction = 'ltr';
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (MX.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur); return lines;
}
function balancedFr(text, font, maxW) {
  const n = wrapFr(text, font, maxW).length;
  if (n === 1) return [text];
  let lo = maxW / n, hi = maxW;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (wrapFr(text, font, m).length > n) lo = m; else hi = m; }
  return wrapFr(text, font, hi);
}
function bakeFrenchLine(text, font, color) {
  MX.font = font; MX.direction = 'ltr';
  const tw = MX.measureText(text).width, pad = 30, size = parseFloat(font.match(/(\d+)px/)[1]);
  const w = Math.ceil(tw + pad * 2), h = Math.ceil(size * 1.5 + pad * 2);
  const [c, x] = canvas(w * SS, h * SS); x.scale(SS, SS);
  x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(2,4,14,.85)'; x.shadowBlur = 12 * SS;
  x.fillText(text, w / 2, h / 2);
  x.shadowColor = 'rgba(2,4,14,.9)'; x.shadowBlur = 2 * SS; x.fillText(text, w / 2, h / 2);
  return { c, w, h, text };
}
function bakeFrench(text, size, maxW) {
  const font = FONT_FR(size), lines = balancedFr(text, font, maxW);
  return { lines: lines.map(l => bakeFrenchLine(l, font, C.fr)), lineH: size * 1.38 };
}
function drawFrench(fa, top, prog, alpha) {
  const a = alpha * prog; if (a <= .005) return;
  ctx.save(); ctx.globalAlpha = a;
  const blur = (1 - prog) * 6; if (blur > .3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  fa.lines.forEach((ln, i) => ctx.drawImage(ln.c, L.tx - ln.w / 2, top + i * fa.lineH - ln.h / 2 + fa.lineH / 2 + (1 - prog) * 14, ln.w, ln.h));
  ctx.restore();
}
let CREDITS = [];

// ─── ornement : rosace à huit branches ──────────────────────────────────────
// Toutes les lignes sont des segments dont on trace une fraction p ∈ [0, 1] : l'image ne dépend que de t.
const polar = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
function seg(a, b, p) {
  if (p <= 0) return;
  ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p));
}
function starPoly(n, step, r, rot) {             // polygone étoilé {n/step} : n segments
  const out = [];
  for (let i = 0; i < n; i++) out.push([polar(r, rot + i * TAU / n), polar(r, rot + ((i + step) % n) * TAU / n)]);
  return out;
}
function strokeSet(segs, prog, width, alpha, stagger = .35) {
  // chaque segment démarre avec un léger décalage : la figure se trace en tournant
  if (alpha <= .003 || prog <= 0) return;
  ctx.beginPath();
  segs.forEach((s, i) => {
    const d = stagger * i / segs.length;
    seg(s[0], s[1], clamp((prog - d) / (1 - stagger)));
  });
  ctx.lineWidth = width;
  ctx.strokeStyle = `rgba(${C.gold},${alpha})`;
  ctx.stroke();
}
function glowStroke(fn) {                         // un halo doux puis le trait net
  ctx.save(); ctx.shadowColor = `rgba(${C.gold},.75)`; ctx.shadowBlur = 14; fn(); ctx.restore();
  fn();
}
const R = L.rr;
const SEG = {
  inner: starPoly(8, 2, R * .20, -PI / 2),                              // petite étoile de deux carrés
  octa: starPoly(8, 3, R * .60, -PI / 2),                               // étoile {8/3}
  rays: Array.from({ length: 8 }, (_, i) => [polar(R * .98, -PI / 2 + (i + .5) * TAU / 8), polar(R * .24, -PI / 2 + (i + .5) * TAU / 8)]),
  crown: starPoly(16, 5, R * .92, -PI / 2),                             // couronne {16/5}
  kites: Array.from({ length: 8 }, (_, i) => { const a = -PI / 2 + i * TAU / 8; return [polar(R * .60, a), polar(R * .92, a)]; }),
};
function drawCore(t) {
  // intensité du cœur : allumé dès l'image 0, s'intensifie sur chaque أَحَد
  const k = .55 + .30 * ramp(t, AHAD1 - .1, AHAD1 + .5) - .10 * ramp(t, 3.2, 5) + .12 * ramp(t, T4, T4 + 1)
          + .30 * ramp(t, AHAD4 - .1, AHAD4 + .6) - .06 * ramp(t, 13, DURATION);
  const breathe = 1 + .03 * Math.sin(t * 1.6);
  const rg = R * .75 * breathe;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rg);
  g.addColorStop(0, `rgba(${C.goldHi},${.95 * k})`);
  g.addColorStop(.08, `rgba(${C.goldHi},${.55 * k})`);
  g.addColorStop(.3, `rgba(${C.gold},${.16 * k})`);
  g.addColorStop(1, `rgba(${C.gold},0)`);
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rg, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}
function drawRosette(t) {
  const z = keyed(t, [[0, 1], [DURATION, 1.06]], true);
  const rot = t * .018;
  ctx.save();
  ctx.translate(L.rc[0], L.rc[1]); ctx.scale(z, z); ctx.rotate(rot);
  ctx.lineCap = 'round';
  // verset 1 : l'étoile intérieure puis l'étoile {8/3} se tracent autour du centre (déjà en cours à l'image 0)
  const pIn = easeOut((t + .9) / 1.3), pOc = easeOut((t + .45) / 2.6);
  glowStroke(() => { strokeSet(SEG.inner, pIn, 2.4, .95); strokeSet(SEG.octa, pOc, 2.2, .9); });
  // verset 2 : huit rayons partent du cercle et convergent vers le centre
  const pRay = easeIO((t - (T2 - .05)) / 1.6);
  glowStroke(() => strokeSet(SEG.rays, pRay, 1.6, .55, .2));
  // un éclat descend chaque rayon vers le centre, pendant le verset 2 seulement
  const fl = ramp(t, T2 + .2, T2 + .8) * (1 - ramp(t, T3 - .4, T3 + .3));
  if (fl > .01) {
    ctx.globalCompositeOperation = 'lighter';
    for (const [a, b] of SEG.rays) {
      const q = ((t - T2) / 1.25) % 1, c = [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
      const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 22);
      g.addColorStop(0, `rgba(${C.goldHi},${.8 * fl * Math.sin(PI * q)})`); g.addColorStop(1, `rgba(${C.goldHi},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c[0], c[1], 22, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // verset 3 : la couronne à seize pointes se ferme, puis un cercle scelle la figure sur يُولَدْ
  const pCr = easeIO((t - (T3 + .05)) / 1.9), pKi = easeIO((t - (T3 + .3)) / 1.2);
  glowStroke(() => { strokeSet(SEG.crown, pCr, 1.8, .85); strokeSet(SEG.kites, pKi, 1.4, .6, .2); });
  const pCirc = easeIO((t - (T3 + .9)) / (V[2].voiceOff - T3 - .9));
  if (pCirc > 0) glowStroke(() => {
    ctx.beginPath(); ctx.arc(0, 0, R, -PI / 2, -PI / 2 + TAU * pCirc); ctx.lineWidth = 2.4; ctx.strokeStyle = `rgba(${C.gold},.95)`; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 1.035, -PI / 2, -PI / 2 - TAU * pCirc, true); ctx.lineWidth = 1.1; ctx.strokeStyle = `rgba(${C.gold},.5)`; ctx.stroke();
  });
  drawCore(t);
  ctx.restore();
}
// verset 4 : un pavage d'étoiles identiques et pâles apparaît sur tout le fond ; aucune n'égale la rosace
const TILE = FMT === '9x16' ? 150 : 140;
const TILES = [];
for (let gy = -1; gy <= Math.ceil(H / TILE) + 1; gy++) for (let gx = -1; gx <= Math.ceil(W / TILE) + 1; gx++) {
  const x = gx * TILE + (FMT === '9x16' ? 15 : 0), y = gy * TILE + 40;
  const d = Math.hypot(x - L.rc[0], y - L.rc[1]);
  // le pavage s'efface sous le bloc de texte, pour ne jamais gêner la lecture
  const tm = (L.arY + L.frTop) / 2, dt = Math.hypot((x - L.tx) / (FMT === '9x16' ? 560 : 600), (y - tm) / 270);
  TILES.push({ x, y, d, keep: clamp((d - R * 1.2) / (R * .6)) * (.15 + .85 * clamp(dt - .7)) });
}
function drawTiling(t) {
  const a0 = ramp(t, T4 + .1, T4 + 2.2);
  if (a0 <= .003) return;
  ctx.save();
  ctx.lineWidth = 1.1;
  const s = TILE * .30;
  for (const T of TILES) {
    if (T.keep <= 0) continue;
    // l'apparition se propage depuis la rosace vers les bords
    const a = a0 * T.keep * ramp(t, T4 + T.d / 900, T4 + T.d / 900 + 1.2) * .20;
    if (a <= .003) continue;
    ctx.strokeStyle = `rgba(${C.gold},${a})`;
    ctx.beginPath();
    for (const q of [0, PI / 4]) for (let i = 0; i < 4; i++) {
      const p0 = polar(s, q + i * PI / 2), p1 = polar(s, q + (i + 1) * PI / 2);
      ctx.moveTo(T.x + p0[0], T.y + p0[1]); ctx.lineTo(T.x + p1[0], T.y + p1[1]);
    }
    // liaisons du pavage : de chaque étoile vers ses voisines
    ctx.moveTo(T.x + s, T.y); ctx.lineTo(T.x + TILE - s, T.y);
    ctx.moveTo(T.x, T.y + s); ctx.lineTo(T.x, T.y + TILE - s);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── fond ───────────────────────────────────────────────────────────────────
const BG = (() => {
  const [c, x] = canvas(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.inkTop); g.addColorStop(1, C.inkBot);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // dither statique ≤ 3/255 contre les aplats en bandes (delivery.md)
  const id = x.getImageData(0, 0, W, H); let s = 12345;
  for (let k = 0; k < id.data.length; k += 4) { s = (s * 1103515245 + 12345) >>> 0; const n = ((s >>> 16) % 7) - 3; id.data[k] += n; id.data[k + 1] += n; id.data[k + 2] += n; }
  x.putImageData(id, 0, 0);
  return c;
})();
function drawBackground(t) {
  ctx.drawImage(BG, 0, 0, W, H);
  // une lueur chaude très large derrière la rosace
  const k = .35 + .25 * ramp(t, 0, 3) + .15 * ramp(t, AHAD4, AHAD4 + 1);
  const g = ctx.createRadialGradient(L.rc[0], L.rc[1], 0, L.rc[0], L.rc[1], R * 2.4);
  g.addColorStop(0, `rgba(60,50,40,${.55 * k})`); g.addColorStop(.5, `rgba(30,32,60,${.35 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawTextPool(a) {                        // un bassin sombre sous le bloc de texte, pour la lecture
  if (a <= 0) return;
  const cx = L.tx, cy = (L.arY + L.frTop + 60) / 2, rx = FMT === '9x16' ? 620 : 640, ry = FMT === '9x16' ? 330 : 380;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(4,6,18,${.62 * a})`); g.addColorStop(.6, `rgba(4,6,18,${.35 * a})`); g.addColorStop(1, 'rgba(4,6,18,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
  ctx.restore();
}

// ─── scène ──────────────────────────────────────────────────────────────────
let textReady = false;
function drawScene(t) {
  drawBackground(t);
  drawTiling(t);
  drawTextPool(1);
  drawRosette(t);
  if (!textReady) return;
  // versets arabes et traduction
  V.forEach((v, i) => {
    if (t < v.show || t > v.hide + .5) return;
    const out = 1 - smooth((t - v.hide) / .4);
    drawVerse(i, t, out);
    const frIn = v.onsets[0] + .3;
    drawFrench(v.frArt, L.frTop, easeIO((t - frIn) / .9), out);
  });
  // filet d'or entre l'arabe et la traduction
  const div = ramp(t, .2, 1) * (1 - ramp(t, V[3].hide, V[3].hide + .4));
  if (div > 0) {
    const y = L.frTop - 22, hw = 70 * easeOut(ramp(t, .2, 1.2));
    const g = ctx.createLinearGradient(L.tx - hw, 0, L.tx + hw, 0);
    g.addColorStop(0, `rgba(${C.gold},0)`); g.addColorStop(.5, `rgba(${C.gold},${.7 * div})`); g.addColorStop(1, `rgba(${C.gold},0)`);
    ctx.fillStyle = g; ctx.fillRect(L.tx - hw, y - 1, hw * 2, 2);
  }
  // générique
  CREDITS.forEach((c, i) => {
    const tin = CREDITS_IN + i * .18, prog = easeIO((t - tin) / .8);
    const gap = FMT === '9x16' ? 74 : 70, y = L.crY + (i - 1) * gap + (i === 0 ? -14 : 0);
    const a = prog * (1 - ramp(t, FADE_OUT - .1, DURATION));
    if (a <= .005) return;
    ctx.save(); ctx.globalAlpha = a;
    const blur = (1 - prog) * 6; if (blur > .3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    ctx.drawImage(c.c, L.tx - c.w / 2, y - c.h / 2 + (1 - prog) * 14, c.w, c.h);
    ctx.restore();
  });
  const cd = ramp(t, CREDITS_IN, CREDITS_IN + .8) * (1 - ramp(t, FADE_OUT - .1, DURATION));
  if (cd > 0) {
    const y = L.crY - (FMT === '9x16' ? 38 : 36), hw = 60;
    const g = ctx.createLinearGradient(L.tx - hw, 0, L.tx + hw, 0);
    g.addColorStop(0, `rgba(${C.gold},0)`); g.addColorStop(.5, `rgba(${C.gold},${.7 * cd})`); g.addColorStop(1, `rgba(${C.gold},0)`);
    ctx.fillStyle = g; ctx.fillRect(L.tx - hw, y - 1, hw * 2, 2);
  }
}
const SHOTS = [{ id: 'rosace', start: 0, end: DURATION, readAt: 11, action: 'une scène continue, un état par verset' }];
const MARKS = V.flatMap(v => v.onsets);

// ─── étalonnage ─────────────────────────────────────────────────────────────
const VIGNETTE = (() => {
  const [c, x] = canvas(W, H);
  const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();
function seek(t) {
  t = clamp(t, 0, DURATION);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  drawScene(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(VIGNETTE, 0, 0, W, H);
  const black = smooth((t - FADE_OUT) / (DURATION - FADE_OUT));   // pas de fondu d'ouverture : l'image 0 est l'accroche
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
}

window.__film = {
  duration: DURATION, ready: false, seek, shots: SHOTS, marks: MARKS, format: FMT,
  texts: () => ({ ar: verseArt.map(a => a.map(l => l.ivory.text).join(' ')), fr: V.map(v => v.fr), credits: DATA.credits }),
  layout: () => ({ W, H, verses: verseArt.map(a => a.map(l => ({ w: l.ivory.w, h: l.ivory.h, zones: l.ivory.zones }))) }),
};
Promise.all([document.fonts.load(FONT_AR(L.arSize), 'قُلْ'), document.fonts.load(FONT_FR(L.frSize), 'Aa'), document.fonts.load(FONT_FR(L.frSize, 600), 'Aa')])
  .then(() => {
    if (!document.fonts.check(FONT_AR(L.arSize), 'قُلْ')) throw new Error('police Amiri Quran absente');
    buildText(); textReady = true; window.__film.ready = true;
  });

// ─── lecteur (non utilisé par les outils de rendu) ───────────────────────────
const params = new URLSearchParams(location.search);
const FIXED = params.has('t') ? parseFloat(params.get('t')) : null, CAPTURE = params.has('capture');
const startEl = document.getElementById('start');
let ac = null, buffer = null, play = null;
async function startPlay() {
  if (!ac) {
    ac = new AudioContext();
    if (window.FILM_AUDIO_B64) {
      const bytes = Uint8Array.from(atob(window.FILM_AUDIO_B64), c => c.charCodeAt(0));
      buffer = await ac.decodeAudioData(bytes.buffer);
    }
  }
  await ac.resume();
  if (play?.src) try { play.src.stop(); } catch {}
  const t0 = ac.currentTime + .1; play = { t0 };
  if (buffer) { const src = ac.createBufferSource(); src.buffer = buffer; src.connect(ac.destination); src.start(t0); play.src = src; }
  startEl.style.display = 'none';
}
startEl.addEventListener('click', startPlay);
cv.addEventListener('click', () => ac && (ac.state === 'running' ? ac.suspend() : ac.resume()));
addEventListener('keydown', e => {
  if (e.key === ' ' && ac) { e.preventDefault(); ac.state === 'running' ? ac.suspend() : ac.resume(); }
  if (e.key.toLowerCase() === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
});
function frame() {
  const t = FIXED !== null ? FIXED : play ? ac.currentTime - play.t0 : (performance.now() / 1000) % DURATION;
  seek(Math.max(0, t));
  requestAnimationFrame(frame);
}
if (FIXED !== null || CAPTURE) startEl.remove();
if (!CAPTURE) requestAnimationFrame(frame);
