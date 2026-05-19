// SVG viewport
export const SVG_W = 800
export const SVG_H = 400
export const PAD = { l: 64, r: 24, t: 20, b: 44 }

// Value domain
export const MIN_V = 800
export const MAX_V = 6400

export const COLORS = {
  gray:    '#4B6358',
  green:   '#36a64f',
  greenGlow: 'rgba(54,166,79,',
  grid:    '#E4EEEA',
  axis:    '#9BB5AA',
  bg:      '#ffffff',
}

// Organic flat curve (1000€ → 1150€)
export const GRAY_DATA = [
  [0,  1000], [1,  1022], [2,  1007], [3,  1048],
  [4,  1036], [5,  1063], [6,  1050], [7,  1082],
  [8,  1070], [9,  1096], [10, 1088], [11, 1124],
  [12, 1150],
].map(([m, v]) => ({ m, v }))

// Exponential curve (1000€ → 6000€)
export const GREEN_DATA = [
  [0,  1000], [1,  1065], [2,  1200], [3,  1500],
  [4,  2000], [5,  2650], [6,  3300], [7,  3950],
  [8,  4480], [9,  4960], [10, 5300], [11, 5680],
  [12, 6000],
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
  { v: 1000, label: '1 000 €' },
  { v: 3000, label: '3 000 €' },
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
export const T = {
  bgIn:       [0,    0.06] as const,  // white bg fade in
  gridIn:     [0.15, 0.35] as const,  // gridlines fade in
  axesIn:     [0.20, 0.38] as const,  // axis labels fade in
  grayIn:     [0.28, 0.42] as const,  // gray curve appear
  grayOut:    [0.62, 0.72] as const,  // gray curve disappear
  greenDraw:  [0.28, 0.72] as const,  // green curve draws from 0→1
  glowUp:     [0.38, 0.65] as const,  // glow ramps up
  glowMax:    [0.65, 0.72] as const,  // glow at max
  reZoom:     [0.60, 0.72] as const,  // re-zoom to 1.8x
}
