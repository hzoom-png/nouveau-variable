// SVG viewport
export const SVG_W = 800
export const SVG_H = 400
export const PAD = { l: 64, r: 24, t: 20, b: 44 }

// Value domain
export const MIN_V = 2300
export const MAX_V = 5500

export const COLORS = {
  gray:    '#4B6358',
  green:   '#36a64f',
  greenGlow: 'rgba(54,166,79,',
  grid:    '#E4EEEA',
  axis:    '#9BB5AA',
  bg:      '#ffffff',
}

// Organic flat curve (2500€ → 2580€)
export const GRAY_DATA = [
  [0,  2500], [1,  2522], [2,  2507], [3,  2548],
  [4,  2536], [5,  2563], [6,  2550], [7,  2558],
  [8,  2565], [9,  2571], [10, 2568], [11, 2575],
  [12, 2580],
].map(([m, v]) => ({ m, v }))

// Half-pipe exponential — f(t) = 2500 + 5000*(t/12)^2.85
// Mois 0→5 quasi-plat, accélération forte ensuite, mois 9≈4700, mois 12=7500
export const GREEN_DATA = [
  [0,  2500], [1,  2505], [2,  2530], [3,  2600],
  [4,  2720], [5,  2910], [6,  3190], [7,  3580],
  [8,  4070], [9,  4700], [10, 5470], [11, 6390],
  [12, 7500],
].map(([m, v]) => ({ m, v }))

// Coordinate transforms
export function toX(month: number) {
  return PAD.l + (month / 12) * (SVG_W - PAD.l - PAD.r)
}

export function toY(value: number) {
  return PAD.t + (1 - (value - MIN_V) / (MAX_V - MIN_V)) * (SVG_H - PAD.t - PAD.b)
}

// Catmull-Rom → Cubic Bezier smooth path
export function buildPath(data: { m: number; v: number }[]): string {
  const pts = data.map(p => [toX(p.m), toY(p.v)] as [number, number])
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)]
    const p1 = pts[i - 1]
    const p2 = pts[i]
    const p3 = pts[Math.min(pts.length - 1, i + 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

export const GRAY_PATH  = buildPath(GRAY_DATA)
export const GREEN_PATH = buildPath(GREEN_DATA)

// Axis labels
export const X_LABELS = [
  { m: 0,  label: 'Mois 0' },
  { m: 6,  label: 'Mois 6' },
  { m: 12, label: 'Mois 12' },
]
export const Y_LABELS = [
  { v: 2500, label: '2 500 €' },
  { v: 3750, label: '3 750 €' },
  { v: 5000, label: '5 000 €+' },
]

// 4 content points (range = progress window [0..1])
export const CONTENT_POINTS = [
  {
    title: 'De nouveaux outils',
    desc:  'Outils adaptés à ton activité commerciale quotidienne.',
    range: [0.72, 0.84] as const,
  },
  {
    title: 'Des missions commerciales',
    desc:  'Pour te créer un revenu supplémentaire immédiatement.',
    range: [0.84, 0.91] as const,
  },
  {
    title: 'Un réseau qualifié',
    desc:  'Grâce aux événements et fonctionnalités intégrées.',
    range: [0.91, 0.96] as const,
  },
  {
    title: 'Des revenus récurrents',
    desc:  'En développant le club Nouveau Variable autour de toi.',
    range: [0.96, 1.00] as const,
  },
]

// Scroll-to-progress timing (progress 0→1)
// 0.00–0.54 : intro + courbes (délai étendu pour comprendre le graphe)
// 0.54–0.62 : graph fade out
// 0.62–1.00 : 4 content points centrés (10% chacun)
export const T = {
  bgIn:       [0,    0.06] as const,  // white bg fade in
  gridIn:     [0.10, 0.24] as const,  // gridlines fade in (plus tôt)
  axesIn:     [0.16, 0.28] as const,  // axis labels
  grayIn:     [0.24, 0.36] as const,  // gray curve fade-in (décalé)
  grayDraw:   [0.28, 0.52] as const,  // gray pathLength — démarre plus tard
  grayOut:    [0.44, 0.52] as const,  // gray disparaît avant le vert
  greenDraw:  [0.30, 0.54] as const,  // green démarre après la grille visible
  glowUp:     [0.38, 0.52] as const,  // glow ramps up
  glowMax:    [0.52, 0.54] as const,  // glow au max pendant que le vert finit
  reZoom:     [0.52, 0.60] as const,
  graphOut:   [0.54, 0.62] as const,  // tout le graphe disparaît
}
