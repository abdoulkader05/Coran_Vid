// Décors symboliques des histoires : aucun être humain, animal ni visage — des lieux, des objets et de la lumière.
// Chaque décor est une fonction pure de t ; il se cale sur des mots du texte via S.when('mot').
// Le décor occupe le haut du cadre (y < 1050) : le bloc de texte est en dessous.
'use strict';
window.SCENES = {};

// ─── outils communs ─────────────────────────────────────────────────────────
function glowDot(ctx, x, y, r, col, a) {
  if (a <= .003) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function sky(ctx, S, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, S.H);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H);
}
const mixc = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
function stars(ctx, S, list, t, a) {
  if (a <= .01) return;
  for (const s of list) {
    const tw = .6 + .4 * Math.sin(t * s.sp + s.ph);
    ctx.fillStyle = `rgba(255,244,220,${a * s.b * tw})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

// ═══ 1. Le prêteur conciliant : un registre de dettes qui s'efface en lumière ═══
(() => {
  let STARS, ROWS, COINS, MOTES;
  window.SCENES.preteur = {
    init(S) {
      STARS = S.table(90, 3, r => ({ x: r() * S.W, y: r() * 1000, r: .6 + r() * 1.3, b: .3 + r() * .6, sp: .5 + r(), ph: r() * 9 }));
      ROWS = S.table(7, 17, r => ({ marks: Array.from({ length: 5 + Math.floor(r() * 4) }, () => 18 + r() * 46), gap: 10 + r() * 6, coin: .6 + r() * .5 }));
      COINS = S.table(5, 29, r => ({ dx: (r() < .5 ? -1 : 1) * (260 + r() * 260), dy: -160 - r() * 220, spin: r() * 6, delay: r() * 1.2 }));
      MOTES = S.table(140, 41, r => ({ row: Math.floor(r() * 7), fx: r(), vx: (r() - .5) * 120, vy: 180 + r() * 380, ph: r() * 9, r: 1.2 + r() * 2.4, d: r() * .9 }));
    },
    draw(ctx, t, S) {
      const { W, ramp, easeIO, easeOut, lerp, when } = S;
      const tLend = when('prêter'), tSoft = when('sois conciliant'), tMeet = when('rencontra Allah'), tFin = S.HI.fin.t0;
      const tErase = tMeet + 2.6;                                   // « Il fut conciliant avec lui »
      sky(ctx, S, [[0, '#070a1d'], [.45, '#121634'], [1, '#0a0d22']]);
      const light = ramp(t, tErase - .5, tErase + 3);              // lumière d'en haut quand le registre s'efface
      stars(ctx, S, STARS, t, .4 + .5 * light);
      // colonne de lumière
      if (light > 0) {
        const g = ctx.createLinearGradient(0, 0, 0, 1000);
        g.addColorStop(0, `rgba(255,226,160,${.28 * light})`); g.addColorStop(1, 'rgba(255,226,160,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W / 2 - 120, 0); ctx.lineTo(W / 2 + 120, 0); ctx.lineTo(W / 2 + 420, 1000); ctx.lineTo(W / 2 - 420, 1000); ctx.fill();
      }
      const z = S.keyed(t, [[0, 1], [S.DURATION, 1.08]], true);
      ctx.save(); ctx.translate(W / 2, 600); ctx.scale(z, z); ctx.translate(-W / 2, -600);
      // lampe à huile, à gauche
      const fl = 1 + .06 * Math.sin(t * 9.1) + .04 * Math.sin(t * 13.7 + 1);
      glowDot(ctx, 250, 700, 260 * fl, '255,190,110', .22);
      ctx.fillStyle = '#6b4a24'; ctx.beginPath(); ctx.ellipse(250, 790, 70, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a6130'; ctx.beginPath(); ctx.moveTo(185, 790); ctx.quadraticCurveTo(250, 735, 330, 770); ctx.lineTo(312, 790); ctx.fill();
      glowDot(ctx, 312, 752, 40 * fl, '255,220,150', .9);
      ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.ellipse(312, 752, 7, 16 * fl, 0, 0, Math.PI * 2); ctx.fill();
      // le registre (parchemin)
      const px = 380, py = 360, pw = 520, ph = 520;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
      pg.addColorStop(0, '#d9c49a'); pg.addColorStop(1, '#b89a66');
      ctx.fillStyle = pg; ctx.fillRect(px, py, pw, ph);
      ctx.restore();
      glowDot(ctx, px + 60, py + ph - 40, 380, '255,200,120', .18 * fl);   // la lampe éclaire le parchemin
      if (light > 0) { ctx.fillStyle = `rgba(255,236,190,${.35 * light})`; ctx.fillRect(px, py, pw, ph); }
      ctx.strokeStyle = 'rgba(90,60,25,.55)'; ctx.lineWidth = 2; ctx.strokeRect(px + 18, py + 18, pw - 36, ph - 36);
      // lignes de compte : des traits d'encre (pas d'écriture lisible) et une pièce par ligne
      ROWS.forEach((row, i) => {
        const y = py + 80 + i * 60;
        let fade = 1 - ramp(t, tErase + i * .12, tErase + .9 + i * .12);          // tout s'efface à la fin
        if (i === 3) fade = Math.min(fade, 1 - ramp(t, tSoft + 1.2, tSoft + 2.6));  // « sois conciliant » : une dette s'efface
        const hl = i === 3 ? ramp(t, tSoft, tSoft + .6) * (1 - ramp(t, tSoft + 2.4, tSoft + 3.2)) : 0;
        if (hl > 0) { ctx.fillStyle = `rgba(255,214,120,${.35 * hl})`; ctx.fillRect(px + 30, y - 22, pw - 60, 44); }
        if (fade <= 0) return;
        ctx.strokeStyle = `rgba(60,38,16,${.8 * fade})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
        let x = px + pw - 60;
        ctx.beginPath();
        for (const m of row.marks) { if (x - m < px + 120) break; ctx.moveTo(x, y); ctx.lineTo(x - m, y); x -= m + row.gap; }
        ctx.stroke();
        ctx.fillStyle = `rgba(150,105,30,${fade})`; ctx.beginPath(); ctx.arc(px + 70, y, 13 * row.coin + 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(240,200,110,${fade})`; ctx.lineWidth = 2; ctx.stroke();
      });
      // une fois le registre effacé : un sceau d'or à huit branches se trace au centre de la page
      const seal = easeOut((t - tErase - 1.4) / 1.6);
      if (seal > 0) {
        const cx = px + pw / 2, cy = py + ph / 2, r = 120;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .05);
        ctx.shadowColor = 'rgba(255,200,110,.8)'; ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(176,122,40,.95)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
        for (const q of [0, Math.PI / 4]) {
          ctx.beginPath();
          for (let k = 0; k <= 4 * seal; k += .05) {
            const kk = Math.min(k, 4), i = Math.floor(kk), f = kk - i;
            const a0 = q + i * Math.PI / 2 - Math.PI / 4, a1 = a0 + Math.PI / 2;
            const x = lerp(Math.cos(a0), Math.cos(a1), f) * r, y = lerp(Math.sin(a0), Math.sin(a1), f) * r;
            k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, r * .42, 0, Math.PI * 2 * seal); ctx.stroke();
        ctx.restore();
      }
      // particules : les dettes effacées montent vers la lumière
      ctx.globalCompositeOperation = 'lighter';
      for (const m of MOTES) {
        const t0 = m.row === 3 ? tSoft + 1.3 : tErase + m.row * .12;
        const u = t - t0 - m.d * .6; if (u < 0) continue;
        const x = px + 90 + m.fx * (pw - 150) + m.vx * u * .4 + Math.sin(u * 2 + m.ph) * 14;
        const y = py + 80 + m.row * 60 - m.vy * u * .5;
        const a = Math.min(1, u * 2) * (1 - S.clamp(u / 4.5));
        glowDot(ctx, x, y, m.r * 5, '255,220,150', .7 * a);
      }
      ctx.globalCompositeOperation = 'source-over';
      // les pièces prêtées : elles quittent la pile vers les gens (hors champ)
      const sx = px + pw - 70, sy = py + ph + 30;
      COINS.forEach((c, i) => {
        const u = easeIO((t - tLend - .6 - c.delay) / 1.8);
        const x = lerp(sx, sx + c.dx, u), y = lerp(sy - i * 10, sy + c.dy, u) - Math.sin(u * Math.PI) * 160;
        if (u > 0) glowDot(ctx, x, y, 70, '255,210,120', .35 * (1 - ramp(u, .75, 1)));
        const a = 1 - ramp(u, .75, 1);
        if (a <= 0) return;
        const sq = Math.abs(Math.cos(c.spin + u * 9));
        ctx.fillStyle = `rgba(214,168,72,${a})`; ctx.beginPath(); ctx.ellipse(x, y, 34 * Math.max(.2, sq), 34, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,226,150,${a})`; ctx.lineWidth = 2; ctx.stroke();
      });
      for (let i = 0; i < 3; i++) {                                  // la pile qui reste
        ctx.fillStyle = '#b8872f'; ctx.beginPath(); ctx.ellipse(sx, sy + 20 - i * 9, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f0cf80'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
      // fin : calme
      if (t > tFin) glowDot(ctx, W / 2, 300, 500, '255,226,160', .12 * ramp(t, tFin, tFin + 2));
    },
  };
})();

// ═══ 2. La sérénité : un livre ouvert la nuit, un nuage de lumière qui tourne et s'approche ═══
(() => {
  let STARS, PUFFS;
  function rope(ctx, x0, y0, x1, y1, sag, a) {
    ctx.strokeStyle = `rgba(150,120,80,${a})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); ctx.stroke();
    ctx.strokeStyle = `rgba(210,180,130,${a * .5})`; ctx.lineWidth = 1.5; ctx.stroke();
  }
  window.SCENES.serenite = {
    init(S) {
      STARS = S.table(160, 5, r => ({ x: r() * S.W, y: r() * 850, r: .6 + r() * 1.5, b: .3 + r() * .7, sp: .5 + r() * 1.5, ph: r() * 9 }));
      PUFFS = S.table(46, 23, r => ({ a: r() * Math.PI * 2, rr: .7 + r() * .5, s: 70 + r() * 90, ph: r() * 9, dy: (r() - .5) * .5 }));
    },
    draw(ctx, t, S) {
      const { W, ramp, easeIO, lerp, when } = S;
      const tCloud = when('Un nuage'), tHorse = tCloud + 3.2, tMorning = when('Au matin'), tSak = when('sérénité');
      const dawn = ramp(t, tMorning, tMorning + 3) * (1 - .6 * ramp(t, tSak, tSak + 2));
      const top = mixc([6, 9, 26], [60, 80, 130], dawn), mid = mixc([16, 22, 52], [210, 150, 120], dawn), bot = mixc([12, 14, 30], [120, 90, 80], dawn);
      sky(ctx, S, [[0, rgb(top)], [.48, rgb(mid)], [.62, rgb(bot)], [1, '#07080f']]);
      stars(ctx, S, STARS, t, .9 * (1 - dawn));
      // lune
      glowDot(ctx, 820, 250, 160, '230,230,255', .12 * (1 - dawn));
      ctx.save(); ctx.beginPath(); ctx.arc(820, 250, 34, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = `rgba(245,240,225,${.9 * (1 - dawn)})`;
      ctx.beginPath(); ctx.rect(760, 190, 120, 120); ctx.arc(836, 240, 30, 0, Math.PI * 2); ctx.fill('evenodd'); ctx.restore();
      // sol
      ctx.fillStyle = '#0b0c15'; ctx.beginPath(); ctx.moveTo(0, 930);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 930 + 18 * Math.sin(x / 170) + 8 * Math.sin(x / 57));
      ctx.lineTo(W, 1920); ctx.lineTo(0, 1920); ctx.fill();
      const bx = 430, by = 860;
      // le nuage : il paraît, tourne et descend vers le livre
      const cIn = ramp(t, tCloud - .3, tCloud + 1.5), cOut = 1 - ramp(t, tMorning - .3, tMorning + 1.2);
      const ca = cIn * cOut;
      if (ca > 0) {
        const near = easeIO((t - tCloud) / 7);
        const cx = lerp(bx + 60, bx, near), cy = lerp(330, 700, near), R = lerp(330, 190, near), rot = (t - tCloud) * .55;
        ctx.globalCompositeOperation = 'lighter';
        for (const p of PUFFS) {
          const ang = p.a + rot, rr = R * p.rr;
          const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * .42 + p.dy * 60;
          glowDot(ctx, x, y, p.s, '235,230,255', .10 * ca * (.7 + .3 * Math.sin(t * 1.3 + p.ph)));
        }
        glowDot(ctx, cx, cy, R * 1.4, '255,240,210', .10 * ca);
        ctx.globalCompositeOperation = 'source-over';
      }
      // lumière de la sérénité sur le livre, à la fin
      const sak = ramp(t, tSak + .8, tSak + 2.8);
      if (sak > 0) {
        const g = ctx.createLinearGradient(0, 0, 0, by);
        g.addColorStop(0, `rgba(255,228,170,0)`); g.addColorStop(1, `rgba(255,228,170,${.35 * sak})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 60, 0); ctx.lineTo(bx + 60, 0); ctx.lineTo(bx + 220, by); ctx.lineTo(bx - 220, by); ctx.fill();
      }
      // le poteau et les deux cordes : le cheval est hors champ, on ne voit que les cordes qui se tendent
      const pull = ramp(t, tHorse, tHorse + .5) * (1 - ramp(t, tMorning, tMorning + 1));
      const jerk = pull * (Math.sin(t * 11) * .5 + Math.sin(t * 7.3 + 1) * .5);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(760, 700, 20, 240);
      ctx.fillStyle = '#4d3820'; ctx.fillRect(754, 694, 32, 14);
      rope(ctx, 780, 740, W + 40, 700 + 30 * jerk, lerp(60, 4, pull), .95);
      rope(ctx, 780, 800, W + 40, 790 + 26 * jerk, lerp(70, 6, pull), .95);
      // le pupitre (rahl) et le livre ouvert
      glowDot(ctx, bx, by - 30, 260, '255,214,140', .28 + .12 * sak);
      ctx.strokeStyle = '#6e4a26'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 110, by + 70); ctx.lineTo(bx + 90, by - 40); ctx.moveTo(bx + 110, by + 70); ctx.lineTo(bx - 90, by - 40); ctx.stroke();
      ctx.fillStyle = '#f1e6c8';
      ctx.beginPath(); ctx.moveTo(bx, by - 30); ctx.quadraticCurveTo(bx - 70, by - 70, bx - 150, by - 55); ctx.lineTo(bx - 140, by - 5); ctx.quadraticCurveTo(bx - 70, by - 20, bx, by + 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, by - 30); ctx.quadraticCurveTo(bx + 70, by - 70, bx + 150, by - 55); ctx.lineTo(bx + 140, by - 5); ctx.quadraticCurveTo(bx + 70, by - 20, bx, by + 12); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,50,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by - 30); ctx.lineTo(bx, by + 12); ctx.stroke();
      for (let i = 0; i < 4; i++) for (const sgn of [-1, 1]) {        // lignes de texte suggérées, sans écriture lisible
        ctx.strokeStyle = 'rgba(90,70,40,.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx + sgn * 25, by - 38 + i * 11 + 4); ctx.lineTo(bx + sgn * 125, by - 48 + i * 11 + 4); ctx.stroke();
      }
    },
  };
})();

// ═══ 3. Le puits : un chemin dans le désert, des traces sur le sable humide, de l'eau versée ═══
(() => {
  let DUNES, PRINTS, DROPS, SPROUTS, STARS;
  window.SCENES.puits = {
    pool(ctx, t, S, ty) {                               // un voile brun chaud en bande, plutôt qu'une tache sombre sur le sable clair
      const n = S.ramp(t, S.when('Tout bienfait') - 1, S.when('Tout bienfait') + 3);
      const g = ctx.createLinearGradient(0, ty - 330, 0, ty + 330);
      g.addColorStop(0, 'rgba(40,22,10,0)'); g.addColorStop(.3, `rgba(40,22,10,${.5 - .1 * n})`); g.addColorStop(.7, `rgba(40,22,10,${.5 - .1 * n})`); g.addColorStop(1, 'rgba(40,22,10,0)');
      ctx.fillStyle = g; ctx.fillRect(0, ty - 330, S.W, 660);
    },
    init(S) {
      DUNES = [0, 1, 2].map(i => { const r = S.rng(70 + i); return { y: 640 + i * 110, a: [r() * 40 + 20, r() * 25, r() * 12], f: [r() * .004 + .002, r() * .01 + .005, r() * .02 + .01], ph: [r() * 9, r() * 9, r() * 9] }; });
      PRINTS = S.table(9, 51, r => ({ j: r() }));
      DROPS = S.table(14, 63, r => ({ ph: r(), dx: (r() - .5) * 16 }));
      SPROUTS = S.table(9, 77, r => ({ dx: (r() - .5) * 160, h: 26 + r() * 40, lean: (r() - .5) * .5, d: r() * .8 }));
      STARS = S.table(120, 9, r => ({ x: r() * S.W, y: r() * 700, r: .6 + r() * 1.3, b: .3 + r() * .7, sp: .5 + r(), ph: r() * 9 }));
    },
    draw(ctx, t, S) {
      const { W, ramp, easeIO, lerp, when, clamp } = S;
      const tThirst = when('grande soif'), tDog = when('haleter'), tShoe = when('chaussure'), tPardon = when('pardonna'),
            tAsk = when('Les Compagnons'), tAns = when('Tout bienfait');
      const dusk = ramp(t, tAsk, tAsk + 4), night = ramp(t, tAns - 1, tAns + 3);
      const top = mixc(mixc([250, 214, 150], [120, 70, 90], dusk), [10, 12, 32], night);
      const hz = mixc(mixc([255, 236, 190], [240, 140, 90], dusk), [40, 30, 60], night);
      sky(ctx, S, [[0, rgb(top)], [.36, rgb(hz)], [1, rgb(hz)]]);
      stars(ctx, S, STARS, t, night * .9);
      // soleil
      const sunY = lerp(260, 640, dusk), sunA = 1 - night;
      glowDot(ctx, 760, sunY, 420, '255,240,200', .5 * sunA);
      ctx.fillStyle = `rgba(255,250,235,${sunA})`; ctx.beginPath(); ctx.arc(760, sunY, 60, 0, Math.PI * 2); ctx.fill();
      const z = S.keyed(t, [[0, 1.22], [tDog, 1.32], [tShoe, 1.42], [S.DURATION, 1.5]], true);
      ctx.save(); ctx.translate(W / 2, 900); ctx.scale(z, z); ctx.translate(-W / 2, -900);
      // dunes, du lointain au proche
      const sand = [[226, 178, 118], [208, 156, 98], [190, 138, 84]];
      DUNES.forEach((d, i) => {
        const c = mixc(mixc(sand[i], [150, 90, 80], dusk * .7), [30, 26, 44], night * .85);
        ctx.fillStyle = rgb(c); ctx.beginPath(); ctx.moveTo(-100, 1920);
        for (let x = -100; x <= W + 100; x += 12) ctx.lineTo(x, d.y + d.a.reduce((s, a, k) => s + a * Math.sin(x * d.f[k] + d.ph[k]), 0));
        ctx.lineTo(W + 100, 1920); ctx.fill();
      });
      // le chemin qui vient de l'horizon
      const pc = mixc(mixc([236, 200, 146], [190, 120, 100], dusk * .7), [44, 38, 60], night * .85);
      ctx.fillStyle = rgb(pc);
      ctx.beginPath(); ctx.moveTo(500, 660); ctx.bezierCurveTo(470, 760, 690, 820, 540, 1100); ctx.lineTo(760, 1100); ctx.bezierCurveTo(820, 820, 520, 760, 520, 660); ctx.fill();
      // le puits
      const wx = 520, wy = 900, stone = rgb(mixc(mixc([150, 120, 90], [110, 80, 80], dusk), [40, 36, 54], night * .8));
      // tache de sable humide et traces de pattes
      const wet = ramp(t, tDog, tDog + 1.5), water = ramp(t, tShoe + 2, tShoe + 5);
      if (wet > 0) {
        const g = ctx.createRadialGradient(wx + 180, wy + 100, 0, wx + 180, wy + 100, 110);
        g.addColorStop(0, `rgba(90,60,40,${.55 * wet + .15 * water})`); g.addColorStop(1, 'rgba(90,60,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(wx + 180, wy + 100, 110, 40, 0, 0, Math.PI * 2); ctx.fill();
        PRINTS.forEach((p, i) => {                       // des empreintes qui s'approchent du puits
          const a = ramp(t, tDog + i * .25, tDog + i * .25 + .4);
          if (a <= 0) return;
          const x = 900 - i * 80 + (i % 2) * 18, y = 1040 - i * 16 + (i % 2 ? 14 : 0);
          ctx.fillStyle = `rgba(110,74,44,${.55 * a})`;
          ctx.beginPath(); ctx.ellipse(x, y, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
          for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 10 + k * 7, y - 11 - (k === 1 || k === 2 ? 3 : 0), 3, 0, Math.PI * 2); ctx.fill(); }
        });
      }
      if (water > 0) {                                  // reflet de l'eau versée
        ctx.globalCompositeOperation = 'lighter';
        glowDot(ctx, wx + 180, wy + 96, 90, '160,210,255', .35 * water * (1 - night * .5));
        ctx.globalCompositeOperation = 'source-over';
      }
      // corps du puits
      ctx.fillStyle = stone; ctx.fillRect(wx - 130, wy - 40, 260, 130);
      ctx.strokeStyle = 'rgba(60,40,30,.5)'; ctx.lineWidth = 2;
      ctx.save(); ctx.beginPath(); ctx.rect(wx - 130, wy - 40, 260, 130); ctx.clip();
      for (let r = 0; r < 3; r++) for (let k = -1; k < 5; k++) ctx.strokeRect(wx - 130 + k * 52 + (r % 2) * 26, wy - 40 + r * 43, 52, 43);
      ctx.restore();
      ctx.fillStyle = rgb(mixc([120, 95, 72], [30, 28, 44], night * .8)); ctx.beginPath(); ctx.ellipse(wx, wy - 40, 130, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1420'; ctx.beginPath(); ctx.ellipse(wx, wy - 40, 104, 24, 0, 0, Math.PI * 2); ctx.fill();
      glowDot(ctx, wx, wy - 40, 80, '140,190,240', .25 * (1 - night * .6));   // l'eau au fond
      // la soif : chaleur blanche au début
      const heat = ramp(t, tThirst - 1, tThirst + 1) * (1 - ramp(t, when('puits') + 2, when('puits') + 4));
      if (heat > 0) { ctx.fillStyle = `rgba(255,250,235,${.18 * heat})`; ctx.fillRect(-100, 0, W + 200, 1920); }
      // la chaussure pleine d'eau, posée au bord ; des gouttes tombent vers le sable humide
      const sa = ramp(t, tShoe + 1, tShoe + 1.8) * (1 - ramp(t, tPardon + 1, tPardon + 2.5));
      if (sa > 0) {
        const sx = wx + 150, sy = wy - 30;
        ctx.fillStyle = `rgba(92,58,30,${sa})`;
        ctx.beginPath(); ctx.moveTo(sx - 46, sy); ctx.quadraticCurveTo(sx - 50, sy - 30, sx - 18, sy - 32); ctx.lineTo(sx + 8, sy - 20);
        ctx.quadraticCurveTo(sx + 40, sy - 16, sx + 48, sy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(150,200,240,${.8 * sa})`; ctx.beginPath(); ctx.ellipse(sx - 22, sy - 28, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
        const pour = ramp(t, tShoe + 2, tShoe + 2.5) * (1 - ramp(t, tPardon, tPardon + 1));
        for (const d of DROPS) {
          const u = ((t * .9 + d.ph) % 1);
          const x = sx + 20 + d.dx * u, y = sy + u * 120;
          ctx.fillStyle = `rgba(170,215,250,${.8 * pour * (1 - u)})`; ctx.beginPath(); ctx.ellipse(x, y, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      // le pardon : une lumière douce monte de là où l'eau a été donnée
      const pl = ramp(t, tPardon, tPardon + 2);
      if (pl > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, wy + 100, 0, 200);
        g.addColorStop(0, `rgba(255,226,160,${.4 * pl})`); g.addColorStop(1, 'rgba(255,226,160,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx + 150, wy + 100); ctx.lineTo(wx + 210, wy + 100); ctx.lineTo(wx + 330, 200); ctx.lineTo(wx + 30, 200); ctx.fill();
        glowDot(ctx, wx + 180, wy + 96, 140, '255,226,160', .45 * pl);
        ctx.globalCompositeOperation = 'source-over';
      }
      // « tout bienfait sera récompensé » : des pousses vertes sortent du sable humide
      SPROUTS.forEach(s => {
        const g = easeIO((t - tAns - .6 - s.d) / 2.2); if (g <= 0) return;
        const x0 = wx + 180 + s.dx * .8, y0 = wy + 100 + Math.abs(s.dx) * .08, h = s.h * g;
        ctx.strokeStyle = `rgba(120,200,110,${clamp(g * 2)})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + s.lean * h, y0 - h * .6, x0 + s.lean * h * 1.4, y0 - h); ctx.stroke();
        ctx.fillStyle = `rgba(140,220,120,${clamp(g * 2)})`;
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x0 + s.lean * h * 1.4 + sg * 7 * g, y0 - h + 4, 8 * g, 3.5 * g, sg * .6, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.restore();
    },
  };
})();
