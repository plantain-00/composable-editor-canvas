import { Position } from "./geometry"
import { Validator, integer, minimum, number, optional } from "./validators"

export interface Nurbs {
  points: Position[]
  degree: number
  knots?: number[]
  weights?: number[]
}

export const Nurbs: Record<string, Validator> = {
  points: [Position],
  degree: /* @__PURE__ */ minimum(1, integer),
  knots: /* @__PURE__ */ optional([number]),
  weights: /* @__PURE__ */ optional([number]),
}

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

export function toBezierCurves(x: number[], i: number) {
  if (i === 1) {
    if (x.length === 4) {
      return {
        from: x[0],
        cp1: x[1],
        cp2: x[2],
        to: x[3],
      }
    }
    if (x.length === 5) {
      return {
        from: x[0],
        cp1: x[1],
        cp2: x[1] / 2 + x[2] / 2,
        to: x[1] / 4 + x[2] / 2 + x[3] / 4,
      }
    }
    return {
      from: x[0],
      cp1: x[1],
      cp2: 0.5 * x[2] + 0.5 * x[1],
      to: x[3] / 6 + 7 / 12 * x[2] + x[1] / 4,
    }
  }
  if (i === 2) {
    if (x.length === 5) {
      return {
        from: 0.25 * x[1] + 0.25 * x[3] + 0.5 * x[2],
        cp1: 0.5 * x[2] + 0.5 * x[3],
        cp2: x[3],
        to: x[4],
      }
    }
    if (x.length === 6) {
      return {
        from: 7 / 12 * x[2] + x[3] / 6 + 0.25 * x[1],
        cp1: 2 / 3 * x[2] + x[3] / 3,
        cp2: x[2] / 3 + 2 / 3 * x[3],
        to: x[2] / 6 + 7 / 12 * x[3] + x[4] / 4,
      }
    }
    return {
      from: x[1] / 4 + x[3] / 6 + 7 / 12 * x[2],
      cp1: x[3] / 3 + 2 * x[2] / 3,
      cp2: 2 / 3 * x[3] + x[2] / 3,
      to: x[4] / 6 + 2 / 3 * x[3] + x[2] / 6,
    }
  }
  if (i === x.length - 4) {
    return {
      from: x[x.length - 5] / 6 + 2 / 3 * x[x.length - 4] + x[x.length - 3] / 6,
      cp1: x[x.length - 3] / 3 + 2 / 3 * x[x.length - 4],
      cp2: 2 / 3 * x[x.length - 3] + x[x.length - 4] / 3,
      to: x[x.length - 2] / 4 + 7 / 12 * x[x.length - 3] + x[x.length - 4] / 6,
    }
  }
  if (i === x.length - 3) {
    return {
      from: x[x.length - 4] / 6 + 7 / 12 * x[x.length - 3] + x[x.length - 2] / 4,
      cp1: x[x.length - 2] / 2 + x[x.length - 3] / 2,
      cp2: x[x.length - 2],
      to: x[x.length - 1],
    }
  }
  return {
    from: x[i + 1] / 6 + 2 / 3 * x[i] + x[i - 1] / 6,
    cp1: x[i + 1] / 3 + 2 * x[i] / 3,
    cp2: 2 * x[i + 1] / 3 + x[i] / 3,
    to: x[i + 2] / 6 + 2 / 3 * x[i + 1] + x[i] / 6,
  }
}

export function toQuadraticCurves(x: number[], i: number) {
  return {
    from: i === 1 ? x[0] : (x[i - 1] + x[i]) / 2,
    cp: x[i],
    to: i === x.length - 2 ? x[x.length - 1] : (x[i] + x[i + 1]) / 2,
  }
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
