import { Position } from "./geometry"

export function interpolateBSpline(
  t: number,
  degree: number,
  x: number[],
  knots = getDefaultNurbsKnots(x.length, degree),
) {
  const start = degree, end = knots.length - 1 - degree
  t = t * (knots[end] - knots[start]) + knots[start]
  const s = knots.findIndex((k, i) => i >= start && i < end && k <= t && knots[i + 1] >= t)
  const v = [...x]
  for (let k = start; k >= 0; k--) {
    for (let i = s; i > s - k; i--) {
      const alpha = (t - knots[i]) / (knots[i + k] - knots[i])
      v[i] = (1 - alpha) * v[i - 1] + alpha * v[i]
    }
  }
  return v[s]
}

export function interpolateNurbs(
  t: number,
  degree: number,
  x: number[],
  knots = getDefaultNurbsKnots(x.length, degree),
  weights?: number[],
) {
  if (!weights) {
    return interpolateBSpline(t, degree, x, knots)
  }
  const result = interpolateBSpline(t, degree, x.map((_, i) => x[i] * weights[i]), knots)
  const weight = interpolateBSpline(t, degree, weights, knots)
  return result / weight
}

export function interpolateNurbs2(t: number, degree: number, points: number[][], knots = getDefaultNurbsKnots(points.length, degree), weights?: number[]) {
  return points[0].map((_, i) => interpolateNurbs(t, degree, points.map(p => p[i]), knots, weights))
}

export function getDefaultNurbsKnots(pointsSize: number, degree: number) {
  const knots: number[] = []
  for (let i = 0; i < degree; i++) {
    knots.push(0)
  }
  for (let i = 0; i <= pointsSize - degree; i++) {
    knots.push(i)
  }
  for (let i = 0; i < degree; i++) {
    knots.push(pointsSize - degree)
  }
  return knots
}

export function getDefaultWeights(pointsSize: number) {
  return new Array<number>(pointsSize).fill(1)
}

export function getNurbsPoints(degree: number, points: Position[], knots = getDefaultNurbsKnots(points.length, degree), weights?: number[], segmentCount = 100) {
  const result: Position[] = []
  const x = points.map(p => p.x)
  const y = points.map(p => p.y)
  for (let t = 0; t <= segmentCount; t++) {
    const p = t / segmentCount
    result.push({
      x: interpolateNurbs(p, degree, x, knots, weights),
      y: interpolateNurbs(p, degree, y, knots, weights),
    })
  }
  return result
}
