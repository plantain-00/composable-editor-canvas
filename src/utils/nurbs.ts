export function interpolateNurbs(
  t: number,
  degree: number,
  points: number[],
  knots = new Array<number>(points.length + degree + 1).fill(0).map((_, i) => i),
  weights = new Array<number>(points.length).fill(1),
) {
  const start = degree, end = knots.length - 1 - degree
  t = t * (knots[end] - knots[start]) + knots[start]
  const s = knots.findIndex((k, i) => i >= start && i < end && k <= t && knots[i + 1] >= t)
  const v = points.map((_, i) => points[i] * weights[i])
  const w = [...weights]
  for (let k = start; k >= 0; k--) {
    for (let i = s; i > s - k; i--) {
      const alpha = (t - knots[i]) / (knots[i + k] - knots[i])
      v[i] = (1 - alpha) * v[i - 1] + alpha * v[i]
      w[i] = (1 - alpha) * w[i - 1] + alpha * w[i]
    }
  }
  return v[s] / w[s]
}

export function interpolateNurbs2(t: number, degree: number, points: number[][], knots?: number[], weights?: number[]) {
  return points[0].map((_, i) => interpolateNurbs(t, degree, points.map(p => p[i]), knots, weights))
}
