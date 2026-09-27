// Al-Kahf 18:17 — « Tu aurais vu le soleil, quand il se lève, s'écarter de leur caverne vers la droite,
// et quand il se couche, passer à leur gauche… »
// L'intérieur de la grotte en accéléré : les jours passent dehors ; au lever, la lumière frappe la paroi
// droite, au coucher la paroi gauche, jamais les dormeurs. Chaque image est une fonction pure de la frame.
import { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, css, graine, hex, lisse, mix, mixRGB } from "../lib/aleatoire";
import { dessineChien, dessineDormeur, Dormeur, liseré, teinte } from "../lib/silhouettes";

const W = 1920, H = 1080;
const HORIZON = 600;
const SEUIL = 700; // bas de l'ouverture, là où est couché le chien
export const DUREE_V17 = 420; // provisoire : sera calée sur la récitation du verset

// Temps du ciel : u = 0 lever, 0,5 coucher, 1 lever suivant. On commence avant l'aube, on finit la nuit.
const CYCLE = 140;
const tempsCiel = (f: number) => 0.85 + f / CYCLE;

const PAL = {
  nuitHaut: hex("#070b22"), nuitHor: hex("#1a2350"),
  aubeHaut: hex("#27325e"), aubeHor: hex("#e8955a"),
  jourHaut: hex("#4f86c4"), jourHor: hex("#d9e4e6"),
  roche: hex("#3b2a1f"), sable: hex("#c89a5b"),
  or: hex("#f2c46d"), argent: hex("#dfe6f2"), indigo: hex("#141a3a"),
};

// Contour irrégulier de l'ouverture, vu de l'intérieur.
const ouverture = (() => {
  const r = graine(17);
  const pts: [number, number][] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    const bruit = (r() - 0.5) * 26 + Math.sin(a * 7) * 10;
    const rx = 300 + bruit, ry = 470 + bruit * 1.4;
    pts.push([960 + Math.cos(a) * rx, SEUIL - Math.pow(Math.sin(a), 0.75) * ry]);
  }
  return pts;
})();

const traceOuverture = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.moveTo(ouverture[0][0], SEUIL + 6);
  for (const p of ouverture) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(ouverture[ouverture.length - 1][0], SEUIL + 6);
  ctx.closePath();
};

const DORMEURS: Dormeur[] = [
  { x: 560, y: 806, long: 300, sens: 1, manteau: "#4a3f52", plis: 1 },
  { x: 960, y: 800, long: 290, sens: -1, manteau: "#5a4834", plis: 2 },
  { x: 1360, y: 808, long: 300, sens: 1, manteau: "#3f5046", plis: 0 },
  { x: 760, y: 928, long: 340, sens: -1, manteau: "#5a3e36", plis: 1 },
  { x: 1170, y: 936, long: 340, sens: 1, manteau: "#44465c", plis: 2 },
];

const canvas = () => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
};

// Tout ce qui ne dépend pas du temps est dessiné une fois.
const precalcul = () => {
  const r = graine(1817);

  // La roche, percée de l'ouverture.
  const roche = canvas();
  {
    const x = roche.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a1d15");
    g.addColorStop(0.62, css(PAL.roche));
    g.addColorStop(0.72, "#4a3627");
    g.addColorStop(1, "#1e150f");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      const px = r() * W, py = r() * H, rr = 8 + r() * 70;
      x.fillStyle = r() < 0.5 ? `rgba(15,9,5,${0.05 + r() * 0.12})` : `rgba(120,90,62,${0.03 + r() * 0.07})`;
      x.beginPath();
      x.ellipse(px, py, rr * (1 + r()), rr, r() * Math.PI, 0, Math.PI * 2);
      x.fill();
    }
    // parois latérales et voûte plus sombres : la grotte s'enfonce autour de l'ouverture
    const cotes = x.createLinearGradient(0, 0, W, 0);
    cotes.addColorStop(0, "rgba(8,5,3,.7)");
    cotes.addColorStop(0.3, "rgba(8,5,3,0)");
    cotes.addColorStop(0.7, "rgba(8,5,3,0)");
    cotes.addColorStop(1, "rgba(8,5,3,.7)");
    x.fillStyle = cotes;
    x.fillRect(0, 0, W, H);
    const voute = x.createLinearGradient(0, 0, 0, SEUIL);
    voute.addColorStop(0, "rgba(8,5,3,.6)");
    voute.addColorStop(1, "rgba(8,5,3,0)");
    x.fillStyle = voute;
    x.fillRect(0, 0, W, SEUIL);
    // le sol intérieur, en légère perspective
    x.fillStyle = "rgba(90,66,45,.35)";
    x.beginPath();
    x.moveTo(0, H);
    x.lineTo(640, SEUIL + 2);
    x.lineTo(1280, SEUIL + 2);
    x.lineTo(W, H);
    x.fill();
    x.globalCompositeOperation = "destination-out";
    traceOuverture(x);
    x.fill();
  }

  // Masque noir de la roche, pour l'assombrir selon l'heure.
  const ombreRoche = canvas();
  {
    const x = ombreRoche.getContext("2d")!;
    x.drawImage(roche, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "#000";
    x.fillRect(0, 0, W, H);
  }

  // Les dormeurs, leur ombre et leur liseré (lumière venue de l'ouverture, au-dessus d'eux).
  const dormeurs = canvas();
  {
    const x = dormeurs.getContext("2d")!;
    [...DORMEURS].sort((a, b) => a.y - b.y).forEach((d) => {
      x.fillStyle = "rgba(0,0,0,.35)";
      x.beginPath();
      x.ellipse(d.x, d.y + 4, d.long * 0.55, d.long * 0.06, 0, 0, Math.PI * 2);
      x.fill();
      dessineDormeur(x, d);
    });
  }
  const noirDormeurs = canvas();
  {
    const x = noirDormeurs.getContext("2d")!;
    x.drawImage(dormeurs, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "#000";
    x.fillRect(0, 0, W, H);
  }
  const rimDormeurs = liseré(dormeurs, 0, 3);

  const chien = canvas();
  dessineChien(chien.getContext("2d")!, 985, SEUIL - 4, 230, "#17120e");
  const rimChien = liseré(chien, 0, 3);

  // Étoiles : positions fixes.
  const etoiles = Array.from({ length: 260 }, () => ({
    x: r() * W, y: r() * HORIZON, b: Math.pow(r(), 6), tw: r() * 6.28,
  }));

  // Collines lointaines, deux plans.
  const collines = [0, 1].map((k) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const px = 620 + (i / 40) * 680;
      pts.push([px, HORIZON - 10 - k * 18 - Math.abs(Math.sin(px * 0.011 + k * 2)) * (40 - k * 12) - r() * 6]);
    }
    return pts;
  });

  const vignette = canvas();
  {
    const x = vignette.getContext("2d")!;
    const g = x.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 1.05);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.55)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  }

  return { roche, ombreRoche, dormeurs, noirDormeurs, rimDormeurs, chien, rimChien, etoiles, collines, vignette, travail: canvas() };
};

type Pre = ReturnType<typeof precalcul>;

// L'état du ciel à l'instant u.
const ciel = (u: number) => {
  const phase = ((u % 1) + 1) % 1;
  const jour = phase < 0.5;
  const s = jour ? phase / 0.5 : (phase - 0.5) / 0.5; // 0 → 1 à travers le jour ou la nuit
  const haut = Math.sin(Math.PI * s);
  const elev = jour ? haut : -haut; // -1 nuit profonde, 1 midi
  const astre = { x: mix(1330, 590, s), y: HORIZON + 40 - haut * 470 };
  const lumiere = clamp(elev * 1.6 + 0.35, 0, 1); // lumière du jour qui entre dans la grotte
  return { phase, jour, s, elev, astre, lumiere };
};

const dessine = (ctx: CanvasRenderingContext2D, pre: Pre, f: number, fps: number) => {
  const c = ciel(tempsCiel(f));
  const t = f / fps;

  // 1. Dehors : ciel selon l'élévation du soleil.
  const aube = 1 - lisse(0, 0.35, Math.abs(c.elev));
  const jourT = lisse(0.05, 0.45, c.elev);
  const hautC = mixRGB(mixRGB(PAL.nuitHaut, PAL.aubeHaut, aube), PAL.jourHaut, jourT);
  const horC = mixRGB(mixRGB(PAL.nuitHor, PAL.aubeHor, aube * (c.elev > -0.3 ? 1 : 0.4)), PAL.jourHor, jourT);
  const g = ctx.createLinearGradient(0, 180, 0, HORIZON);
  g.addColorStop(0, css(hautC));
  g.addColorStop(1, css(horC));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON + 2);

  // étoiles la nuit
  const nuit = lisse(0.05, -0.25, c.elev);
  if (nuit > 0.01) {
    for (const e of pre.etoiles) {
      const a = nuit * (0.25 + 0.75 * e.b) * (0.8 + 0.2 * Math.sin(t * 3 + e.tw));
      ctx.fillStyle = `rgba(230,236,255,${a})`;
      const rr = 0.8 + e.b * 1.8;
      ctx.fillRect(e.x - rr / 2, e.y - rr / 2, rr, rr);
    }
  }

  // soleil le jour, lune la nuit
  if (c.astre.y < HORIZON + 30) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const coul = c.jour ? mixRGB(hex("#ff9a4a"), hex("#fff4d6"), clamp(c.elev * 2)) : PAL.argent;
    const halo = ctx.createRadialGradient(c.astre.x, c.astre.y, 0, c.astre.x, c.astre.y, c.jour ? 260 : 140);
    halo.addColorStop(0, css(coul, c.jour ? 0.55 : 0.3));
    halo.addColorStop(1, css(coul, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(c.astre.x - 300, c.astre.y - 300, 600, 600);
    ctx.restore();
    ctx.fillStyle = css(coul);
    ctx.beginPath();
    ctx.arc(c.astre.x, c.astre.y, c.jour ? 30 : 22, 0, Math.PI * 2);
    ctx.fill();
    if (!c.jour) {
      // un croissant : l'ombre mord la lune
      ctx.fillStyle = css(hautC);
      ctx.beginPath();
      ctx.arc(c.astre.x + 10, c.astre.y - 5, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // collines et sable, éclairés par le jour
  const terre = mixRGB(PAL.indigo, PAL.sable, clamp(c.lumiere));
  pre.collines.forEach((pts, k) => {
    ctx.fillStyle = css(mixRGB(terre, horC, 0.45 - k * 0.2));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], HORIZON + 40);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(pts[pts.length - 1][0], HORIZON + 40);
    ctx.fill();
  });
  ctx.fillStyle = css(terre);
  ctx.fillRect(0, HORIZON - 4, W, SEUIL - HORIZON + 30);

  // 2. La roche, assombrie par la nuit, teintée de bleu par la lune.
  ctx.drawImage(pre.roche, 0, 0);
  ctx.globalAlpha = mix(0.72, 0.18, c.lumiere);
  ctx.drawImage(pre.ombreRoche, 0, 0);
  ctx.globalAlpha = 1;
  if (nuit > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.18 * nuit;
    ctx.fillStyle = css(PAL.indigo);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // lumière diffuse qui passe par l'ouverture et éclaire les bords
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const diffus = ctx.createRadialGradient(960, SEUIL - 120, 120, 960, SEUIL - 80, 900);
  const coulDiffus = c.jour ? mixRGB(PAL.or, hex("#fff1d8"), clamp(c.elev)) : PAL.argent;
  diffus.addColorStop(0, css(coulDiffus, 0.16 * c.lumiere + 0.05 * nuit));
  diffus.addColorStop(1, css(coulDiffus, 0));
  ctx.fillStyle = diffus;
  ctx.fillRect(0, 0, W, H);

  // 3. Les faisceaux : au lever sur la paroi droite, au coucher sur la paroi gauche. Jamais au centre.
  if (c.jour) {
    const matin = c.s < 0.5;
    const force = lisse(0.5, 0.08, matin ? c.s : 1 - c.s) * lisse(0.0, 0.05, matin ? c.s : 1 - c.s);
    if (force > 0.005) {
      const k = matin ? c.s / 0.5 : (1 - c.s) / 0.5; // 0 à l'horizon → 1 vers midi
      const cote = matin ? 1 : -1;
      const src: [number, number][] = [
        [960 - cote * 250, SEUIL - 420],
        [960 - cote * 290, SEUIL - 60],
      ];
      // la tache glisse sur la paroi : basse et lointaine à l'aube, elle remonte et se retire vers midi
      const tache = { x: 960 + cote * mix(800, 700, k), y: mix(800, 560, k), rx: mix(120, 80, k), ry: mix(230, 150, k) };
      const coulF = mixRGB(hex("#ffb35c"), hex("#ffe7b0"), k);
      ctx.filter = "blur(28px)";
      const fg = ctx.createLinearGradient(src[0][0], 0, tache.x, 0);
      fg.addColorStop(0, css(coulF, 0.0));
      fg.addColorStop(0.4, css(coulF, 0.12 * force));
      fg.addColorStop(1, css(coulF, 0.26 * force));
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(src[0][0], src[0][1]);
      ctx.lineTo(tache.x, tache.y - tache.ry);
      ctx.lineTo(tache.x + cote * tache.rx * 0.3, tache.y + tache.ry);
      ctx.lineTo(src[1][0], src[1][1]);
      ctx.closePath();
      ctx.fill();
      ctx.filter = "none";
      const tg = ctx.createRadialGradient(tache.x, tache.y, 0, tache.x, tache.y, tache.ry);
      tg.addColorStop(0, css(coulF, 0.55 * force));
      tg.addColorStop(1, css(coulF, 0));
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.ellipse(tache.x, tache.y, tache.rx, tache.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 4. Le chien au seuil, à contre-jour, puis les dormeurs dans la pénombre.
  const coulRim = c.jour ? css(mixRGB(PAL.or, hex("#fff6e2"), clamp(c.elev))) : css(PAL.argent);
  const forceRim = 0.35 + 0.65 * Math.max(c.lumiere, nuit * 0.6);
  ctx.drawImage(pre.chien, 0, 0);
  ctx.globalAlpha = forceRim;
  ctx.drawImage(teinte(pre.rimChien, pre.travail, coulRim), 0, 0);
  ctx.globalAlpha = 1;

  ctx.drawImage(pre.dormeurs, 0, 0);
  ctx.globalAlpha = mix(0.55, 0.15, c.lumiere);
  ctx.drawImage(pre.noirDormeurs, 0, 0);
  ctx.globalAlpha = forceRim * 0.7;
  ctx.drawImage(teinte(pre.rimDormeurs, pre.travail, coulRim), 0, 0);
  ctx.globalAlpha = 1;

  ctx.drawImage(pre.vignette, 0, 0);
};

export const Verset17: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const pre = useMemo(precalcul, []);

  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    dessine(ctx, pre, frame, fps);
  }, [frame, fps, pre]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{
          width: "100%",
          height: "100%",
          opacity: interpolate(frame, [0, 20, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 64,
          fontFamily: "Georgia, 'EB Garamond', serif",
          fontSize: 34,
          letterSpacing: 2,
          color: "rgba(236,226,205,.7)",
        }}
      >
        Al-Kahf · 18:17
      </div>
    </AbsoluteFill>
  );
};
