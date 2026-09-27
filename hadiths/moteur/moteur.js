// Moteur commun des histoires de hadiths — Canvas 2D, contrat opus-js-animations.
// window.__film = { duration, ready, seek(t), shots, marks, wav() } ; seek(t) est une fonction pure du temps.
// Données : window.HISTOIRE (généré depuis le jeu de données HadeethEnc, aucun mot retapé).
// Décor : window.SCENES[HISTOIRE.scene](ctx, t, S) dessine l'arrière-plan symbolique (scenes.js).
'use strict';

const HI = window.HISTOIRE;
const W = 1080, H = 1920, DURATION = HI.duree;
const TAU = Math.PI * 2, PI = Math.PI;
window.FILM_GRAIN = window.FILM_GRAIN || 'none';

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

// ─── utils (partagés avec scenes.js via S) ──────────────────────────────────
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
function rng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const table = (n, seed, f) => Array.from({ length: n }, (_, i) => f(rng(seed + i * 7919)));
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// Instant du carton qui contient un mot donné : les décors se calent sur le texte, pas sur des numéros de carton.
const CARTONS = HI.cartons;
function when(mot, fin = false) {
  const c = CARTONS.find(c => c.texte.includes(mot));
  if (!c) throw new Error(`mot introuvable dans le texte : ${mot}`);
  return fin ? c.t1 : c.t0;
}
const S = { W, H, TAU, PI, clamp, smooth, easeIO, easeOut, lerp, ramp, keyed, rng, table, canvas, when, SS, HI, DURATION };

// ─── texte ──────────────────────────────────────────────────────────────────
const C = { ivory: '#f6efdf', gold: '#f0c96f', goldDim: 'rgba(240,201,111,.75)', ink: 'rgba(3,5,14,' };
const F = (px, w = 500, it = false) => `${it ? 'italic ' : ''}${w} ${px}px "EB Garamond"`;
const TEXT_Y = 1300, MAXW = 860;                       // bloc de texte fixe, dans la zone sûre (10 % haut, 15 % bas)
const [, MX] = canvas(8, 8);
function wrap(text, font, maxW) {
  MX.font = font;
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (MX.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur); return lines;
}
function balanced(text, font, maxW) {
  const n = wrap(text, font, maxW).length;
  if (n === 1) return [text];
  let lo = maxW / n, hi = maxW;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (wrap(text, font, m).length > n) lo = m; else hi = m; }
  return wrap(text, font, hi);
}
function bake(text, font, size, lineH, maxW, color) {   // → { c, w, h, lines } en pixels de film, cuit à SS×
  const lines = balanced(text, font, maxW), pad = 40, w = maxW + pad * 2, h = lines.length * lineH + pad * 2;
  const [c, x] = canvas(w * SS, h * SS); x.scale(SS, SS);
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => {
    const y = pad + lineH * (i + .5);
    x.fillStyle = color; x.shadowColor = 'rgba(2,4,14,.9)';
    x.shadowBlur = 16 * SS; x.fillText(l, w / 2, y);
    x.shadowBlur = 3 * SS; x.fillText(l, w / 2, y);
  });
  return { c, w, h, lines: lines.length };
}
function draw(sp, cy, prog, alpha) {
  const a = alpha * prog; if (a <= .005) return;
  ctx.save(); ctx.globalAlpha = a;
  const blur = (1 - prog) * 6; if (blur > .3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.drawImage(sp.c, W / 2 - sp.w / 2, cy - sp.h / 2 + (1 - prog) * 16, sp.w, sp.h);
  ctx.restore();
}
function hairline(y, hw, a) {
  if (a <= 0) return;
  const g = ctx.createLinearGradient(W / 2 - hw, 0, W / 2 + hw, 0);
  g.addColorStop(0, 'rgba(240,201,111,0)'); g.addColorStop(.5, `rgba(240,201,111,${.8 * a})`); g.addColorStop(1, 'rgba(240,201,111,0)');
  ctx.fillStyle = g; ctx.fillRect(W / 2 - hw, y - 1, hw * 2, 2);
}
let ART = null;
function buildText() {
  const cards = CARTONS.map(c => {
    if (c.intro) return bake(c.texte, F(40, 500, true), 40, 56, 800, C.goldDim);
    if (c.enseignement) return bake(c.texte, F(44, 500, true), 44, 62, MAXW, C.ivory);
    return bake(c.texte, F(48), 48, 67, MAXW, C.ivory);
  });
  const fin = HI.fin;
  ART = {
    cards,
    hookLabel: bake('Hadith · ' + HI.rapporte, F(36, 500), 36, 50, 900, C.goldDim),
    hookTitle: bake(HI.titre, F(72, 600), 72, 86, 900, C.gold),
    lesson: bake('Enseignement', F(34, 600), 34, 46, 600, C.gold),
    end: [
      bake(HI.titre, F(56, 600), 56, 70, 900, C.gold),
      bake(HI.rapporte + ' · Degré : ' + HI.degre, F(36), 36, 50, 900, C.ivory),
      bake((HI.extrait ? 'Extrait — ' : '') + 'Traduction : ' + HI.source, F(32), 32, 46, 900, 'rgba(246,239,223,.8)'),
    ],
    fin,
  };
}
function drawText(t) {
  // accroche : titre de l'histoire, présent dès l'image 0 (libellé, filet, titre empilés selon leurs hauteurs)
  const hookOut = 1 - ramp(t, CARTONS[0].t0 - .6, CARTONS[0].t0 - .1);
  if (hookOut > 0) {
    const lb = ART.hookLabel, ti = ART.hookTitle, inner = (lb.h - 80) + 34 + (ti.h - 80), y0 = TEXT_Y - inner / 2;
    draw(lb, y0 + (lb.h - 80) / 2, easeOut((t + .6) / .8), hookOut);
    hairline(y0 + (lb.h - 80) + 17, 90 * easeOut((t + .3) / 1), hookOut);
    draw(ti, y0 + (lb.h - 80) + 34 + (ti.h - 80) / 2, easeOut((t + .4) / .9), hookOut);
  }
  CARTONS.forEach((c, i) => {
    if (t < c.t0 - .05 || t > c.t1 + .1) return;
    const out = 1 - ramp(t, c.t1 - .45, c.t1);
    const sp = ART.cards[i];
    draw(sp, TEXT_Y, easeOut((t - c.t0) / .8), out);
    if (c.enseignement && c.premier) {
      const a = ramp(t, c.t0, c.t0 + .6) * out;
      draw(ART.lesson, TEXT_Y - sp.h / 2 - 10, easeOut((t - c.t0) / .8), a);
    }
  });
  // générique de fin : titre, filet, attribution, source — empilés selon leurs hauteurs
  const f = ART.fin, endA = 1 - ramp(t, DURATION - .7, DURATION - .1);
  const gaps = [26, 12], hs = ART.end.map(sp => sp.h - 80), total = hs.reduce((a, b) => a + b, 0) + gaps[0] + gaps[1];
  let y = TEXT_Y - total / 2;
  ART.end.forEach((sp, i) => {
    draw(sp, y + hs[i] / 2, easeOut((t - f.t0 - i * .2) / .9), endA);
    if (i === 0) hairline(y + hs[0] + gaps[0] / 2, 80, ramp(t, f.t0 + .2, f.t0 + 1) * endA);
    y += hs[i] + (gaps[i] || 0);
  });
}
function textPool(t) {                                 // un bassin sombre derrière le texte
  if (scene.pool) return scene.pool(ctx, t, S, TEXT_Y);
  const g = ctx.createRadialGradient(W / 2, TEXT_Y, 0, W / 2, TEXT_Y, 620);
  g.addColorStop(0, 'rgba(3,5,14,.62)'); g.addColorStop(.55, 'rgba(3,5,14,.38)'); g.addColorStop(1, 'rgba(3,5,14,0)');
  ctx.save(); ctx.translate(0, TEXT_Y); ctx.scale(1, .55); ctx.translate(0, -TEXT_Y);
  ctx.fillStyle = g; ctx.fillRect(0, TEXT_Y - 620, W, 1240); ctx.restore();
}

// ─── image ──────────────────────────────────────────────────────────────────
const VIGNETTE = (() => {
  const [c, x] = canvas(W, H);
  const g = x.createRadialGradient(W / 2, H / 2, W * .4, W / 2, H / 2, H * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();
let textReady = false;
const scene = window.SCENES[HI.scene];
if (!scene) throw new Error('scène inconnue : ' + HI.scene);
scene.init?.(S);
function seek(t) {
  t = clamp(t, 0, DURATION);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  ctx.save(); scene.draw(ctx, t, S); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  textPool(t);
  if (textReady) drawText(t);
  ctx.drawImage(VIGNETTE, 0, 0, W, H);
  const black = smooth((t - (DURATION - .6)) / .6);
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
}

// ─── son : ambiance générée (vent, souffle aux changements de carton), sans musique ──
// Tout est calculé depuis la même chronologie que l'image, dans un OfflineAudioContext, et exporté en WAV.
async function renderAudio() {
  const sr = 48000, n = Math.ceil(DURATION * sr);
  const oac = new OfflineAudioContext(2, n, sr);
  const r = rng(4242), noise = oac.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {                    // bruit brun : un souffle grave
    const d = noise.getChannelData(ch); let last = 0;
    for (let i = 0; i < n; i++) { last = (last + .02 * (r() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
  }
  const master = oac.createGain(); master.gain.value = 1; master.connect(oac.destination);
  // vent : bruit brun filtré, dont le volume et la couleur ondulent lentement
  const wind = oac.createBufferSource(); wind.buffer = noise;
  const lp = oac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .7;
  const wg = oac.createGain();
  wind.connect(lp).connect(wg).connect(master);
  for (let k = 0; k <= DURATION * 4; k++) {
    const tt = k / 4, s = .5 + .5 * Math.sin(tt * .7) * Math.sin(tt * .23 + 1);
    lp.frequency.setValueAtTime(380 + 520 * s, tt);
    wg.gain.setValueAtTime((.16 + .10 * s) * Math.min(1, tt / .4) * Math.min(1, (DURATION - tt) / 1.2), tt);
  }
  wind.start(0);
  // un souffle discret à chaque carton
  for (const c of [...CARTONS, HI.fin]) {
    const src = oac.createBufferSource(); src.buffer = noise;
    const bp = oac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    const g = oac.createGain();
    src.connect(bp).connect(g).connect(master);
    const t0 = Math.max(0, c.t0 - .35);
    bp.frequency.setValueAtTime(500, t0); bp.frequency.exponentialRampToValueAtTime(1600, t0 + .5); bp.frequency.exponentialRampToValueAtTime(700, t0 + 1.1);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.35, t0 + .45); g.gain.exponentialRampToValueAtTime(.001, t0 + 1.3);
    src.start(t0, (c.t0 * 7.3) % (DURATION - 2), 1.4);
  }
  scene.sound?.(oac, master, noise, S);
  const buf = await oac.startRendering();
  // WAV 16 bits
  const L = buf.getChannelData(0), R = buf.getChannelData(1), out = new DataView(new ArrayBuffer(44 + n * 4));
  const str = (o, s) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true);
  out.setUint16(32, 4, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    out.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true); out.setInt16(46 + i * 4, clamp(R[i], -1, 1) * 32767, true);
  }
  let s = ''; const u8 = new Uint8Array(out.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}

window.__film = {
  duration: DURATION, ready: false, seek, wav: renderAudio,
  shots: [{ id: HI.slug, start: 0, end: DURATION, readAt: CARTONS[1].t0 + 1, action: 'une scène symbolique continue' }],
  marks: CARTONS.map(c => c.t0),
  texts: () => ({ cartons: CARTONS.map(c => c.texte), source: HI.texte_source }),
};
Promise.all([document.fonts.load(F(48), 'Aa'), document.fonts.load(F(40, 500, true), 'Aa'), document.fonts.load(F(72, 600), 'Aa')])
  .then(() => { buildText(); textReady = true; window.__film.ready = true; });

// ─── lecteur (non utilisé par les outils de rendu) ───────────────────────────
const params = new URLSearchParams(location.search);
const FIXED = params.has('t') ? parseFloat(params.get('t')) : null, CAPTURE = params.has('capture');
const startEl = document.getElementById('start');
let ac = null, buffer = null, play = null;
async function startPlay() {
  if (!ac) {
    ac = new AudioContext();
    const b64 = await renderAudio();
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    buffer = await ac.decodeAudioData(bytes.buffer);
  }
  await ac.resume();
  if (play?.src) try { play.src.stop(); } catch {}
  const t0 = ac.currentTime + .1; play = { t0 };
  const src = ac.createBufferSource(); src.buffer = buffer; src.connect(ac.destination); src.start(t0); play.src = src;
  startEl.style.display = 'none';
}
startEl.addEventListener('click', startPlay);
cv.addEventListener('click', () => ac && (ac.state === 'running' ? ac.suspend() : ac.resume()));
function frame() {
  const t = FIXED !== null ? FIXED : play ? ac.currentTime - play.t0 : (performance.now() / 1000) % DURATION;
  seek(Math.max(0, t));
  requestAnimationFrame(frame);
}
if (FIXED !== null || CAPTURE) startEl.remove();
if (!CAPTURE) requestAnimationFrame(frame);
