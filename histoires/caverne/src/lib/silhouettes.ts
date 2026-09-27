// Silhouettes sans visage, construites par parties sur un squelette (opus design.md §6) :
// chaque partie est tracée d'un contour sombre puis remplie, pour que les recouvrements se lisent.
type P = [number, number];
type Ctx = CanvasRenderingContext2D;

const membre = (ctx: Ctx, pts: P[], w: number, fond: string, contour: string) => {
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  trace();
  ctx.strokeStyle = contour;
  ctx.lineWidth = w + 3;
  ctx.stroke();
  trace();
  ctx.strokeStyle = fond;
  ctx.lineWidth = w;
  ctx.stroke();
};

export type Dormeur = { x: number; y: number; long: number; sens: 1 | -1; manteau: string; plis: number };

// Un dormeur allongé sur le côté, genoux un peu repliés, drapé dans son manteau, la tête sous un capuchon.
// Un seul contour lisse pour le corps (lisible de loin), des plis plus sombres, aucun visage.
const assombrir = (h: string, k: number) => {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const dessineDormeur = (ctx: Ctx, d: Dormeur, contour = "#07060a") => {
  const L = d.long, s = d.sens;
  const X = (fx: number) => d.x + s * fx * L, Y = (fy: number) => d.y + fy * L;
  const corps = () => {
    ctx.beginPath();
    ctx.moveTo(X(-0.36), Y(0));
    ctx.bezierCurveTo(X(-0.42), Y(-0.03), X(-0.4), Y(-0.1), X(-0.35), Y(-0.13)); // poitrine vers la nuque
    ctx.bezierCurveTo(X(-0.3), Y(-0.17), X(-0.2), Y(-0.165), X(-0.12), Y(-0.13)); // épaule
    ctx.bezierCurveTo(X(-0.05), Y(-0.105), X(0.02), Y(-0.16), X(0.1), Y(-0.155)); // taille puis hanche
    ctx.bezierCurveTo(X(0.2), Y(-0.15), X(0.28), Y(-0.13), X(0.3), Y(-0.085)); // cuisse jusqu'au genou
    ctx.bezierCurveTo(X(0.34), Y(-0.06), X(0.43), Y(-0.07), X(0.47), Y(-0.035)); // tibia, pied
    ctx.bezierCurveTo(X(0.49), Y(-0.01), X(0.47), Y(0.005), X(0.44), Y(0.005));
    ctx.lineTo(X(-0.36), Y(0.005));
    ctx.closePath();
  };
  const capuche = () => {
    ctx.beginPath();
    ctx.ellipse(X(-0.425), Y(-0.085), L * 0.085, L * 0.07, s * -0.35, 0, Math.PI * 2);
  };
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const f of [corps, capuche]) {
    f();
    ctx.strokeStyle = contour;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = d.manteau;
    ctx.fill();
  }
  // plis du manteau et bras posé le long du corps
  ctx.strokeStyle = assombrir(d.manteau, 0.62);
  ctx.lineWidth = L * 0.012;
  const pli = (pts: number[][]) => {
    ctx.beginPath();
    ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    ctx.quadraticCurveTo(X(pts[1][0]), Y(pts[1][1]), X(pts[2][0]), Y(pts[2][1]));
    ctx.stroke();
  };
  pli([[-0.3, -0.12], [-0.18, -0.085], [-0.06, -0.075]]);
  pli([[0.05, -0.12 + d.plis * 0.01], [0.14, -0.1], [0.28, -0.06]]);
  pli([[-0.2, -0.03], [-0.05, -0.05], [0.12, -0.03]]);
  // bord du capuchon, qui cache le visage
  ctx.strokeStyle = assombrir(d.manteau, 0.5);
  ctx.lineWidth = L * 0.014;
  ctx.beginPath();
  ctx.arc(X(-0.425), Y(-0.085), L * 0.055, s > 0 ? Math.PI * 0.55 : -Math.PI * 0.45, s > 0 ? Math.PI * 1.45 : Math.PI * 0.45);
  ctx.stroke();
};

// Le chien couché sur le seuil, pattes avant étendues (18:18), vu de profil, tourné vers le dehors.
export const dessineChien = (ctx: Ctx, x: number, y: number, L: number, fond: string, contour = "#07060a") => {
  const at = (fx: number, fy: number): P => [x + fx * L, y + fy * L];
  membre(ctx, [at(-0.42, -0.02), at(-0.58, 0.0), at(-0.66, -0.04)], L * 0.05, fond, contour); // queue
  membre(ctx, [at(-0.3, -0.04), at(-0.22, 0.0), at(-0.1, 0.0)], L * 0.08, fond, contour); // patte arrière repliée
  membre(ctx, [at(-0.36, -0.08), at(0.12, -0.1)], L * 0.2, fond, contour); // corps
  membre(ctx, [at(0.1, -0.04), at(0.36, -0.01), at(0.46, -0.01)], L * 0.055, fond, contour); // patte avant
  membre(ctx, [at(0.08, -0.02), at(0.34, 0.02), at(0.44, 0.02)], L * 0.055, fond, contour); // patte avant
  membre(ctx, [at(0.1, -0.15), at(0.22, -0.2)], L * 0.1, fond, contour); // cou
  membre(ctx, [at(0.22, -0.21), at(0.33, -0.17)], L * 0.09, fond, contour); // tête et museau
  membre(ctx, [at(0.2, -0.26), at(0.18, -0.31)], L * 0.035, fond, contour); // oreille
};

// Liseré de lumière (opus shaders.md §10) : la silhouette, moins elle-même décalée à l'opposé de la lumière.
export const liseré = (
  src: HTMLCanvasElement,
  dx: number,
  dy: number,
): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext("2d")!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = "destination-out";
  x.drawImage(src, dx, dy);
  return c;
};

// Teinte un masque blanc dans une couleur, dans un canvas de travail réutilisé.
export const teinte = (masque: HTMLCanvasElement, travail: HTMLCanvasElement, couleur: string) => {
  const x = travail.getContext("2d")!;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, travail.width, travail.height);
  x.drawImage(masque, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = couleur;
  x.fillRect(0, 0, travail.width, travail.height);
  x.globalCompositeOperation = "source-over";
  return travail;
};
