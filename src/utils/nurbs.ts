import * as verb from 'verb-nurbs-web'
import * as twgl from 'twgl.js'
import { ExtendType, deduplicate, deepEquals, delta2, delta3, isBetween, isSameNumber, isZero } from "./math"
import { Position } from "./position"
import { getTwoPointsDistance } from "./position"
import { GeneralFormLine, pointAndDirectionToGeneralFormLine } from "./line"
import { getPointSideOfLine } from "./line"
import { Ellipse, EllipseArc, getEllipseDerivatives } from "./ellipse"
import { Arc, Circle, getCirclePointAtRadian, getCircleRadian, pointIsOnArc } from "./circle"
import { pointIsOnEllipseArc } from "./ellipse"
import { Validator, integer, minimum, number, optional } from "./validators"
import { angleToRadian } from './radian'
import { QuadraticCurve, getBezierCurveDerivatives, getQuadraticCurveDerivatives } from "./bezier"
import { BezierCurve } from "./bezier"
import { newtonIterate, newtonIterate2 } from './equation-calculater'
import { getParallelPolylinesByDistance } from './parallel'
import { Tuple2, Vec2, Vec3 } from './types'
import { getPerpendicularPoint } from './perpendicular'
import { reverseRadian } from './reverse'
import { Matrix2 } from './matrix'
import { normalizeRadian } from './angle'

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

export function interpolateNurbs2(t: number, degree: number, points: Vec2[], knots = getDefaultNurbsKnots(points.length, degree), weights?: number[]): Vec2 {
  return [
    interpolateNurbs(t, degree, points.map(p => p[0]), knots, weights),
    interpolateNurbs(t, degree, points.map(p => p[1]), knots, weights),
  ]
}

export function interpolateNurbs3(t: number, degree: number, points: Vec3[], knots = getDefaultNurbsKnots(points.length, degree), weights?: number[]): Vec3 {
  return [
    interpolateNurbs(t, degree, points.map(p => p[0]), knots, weights),
    interpolateNurbs(t, degree, points.map(p => p[1]), knots, weights),
    interpolateNurbs(t, degree, points.map(p => p[2]), knots, weights),
  ]
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

export function getNurbsPoints3D(degree: number, points: Vec3[], knots = getDefaultNurbsKnots(points.length, degree), weights?: number[], segmentCount = 100) {
  const result: Vec3[] = []
  const x = points.map(p => p[0])
  const y = points.map(p => p[1])
  const z = points.map(p => p[2])
  for (let t = 0; t <= segmentCount; t++) {
    const p = t / segmentCount
    result.push([
      interpolateNurbs(p, degree, x, knots, weights),
      interpolateNurbs(p, degree, y, knots, weights),
      interpolateNurbs(p, degree, z, knots, weights),
    ])
  }
  return result
}

export function getNurbsSurfaceTrianglePoints(
  points: Vec3[][],
  degreeU: number,
  knotsU = getDefaultNurbsKnots(points.length, degreeU),
  degreeV = degreeU,
  knotsV = getDefaultNurbsKnots(points[0].length, degreeU),
  segmentCount = 20,
) {
  const triangles: number[] = []
  let previous: Vec3[] | undefined
  for (let i = 0; i <= segmentCount; i++) {
    const u = i / segmentCount
    const ps = points.map(p => interpolateNurbs3(u, degreeU, p, knotsU))
    const x = ps.map(p => p[0])
    const y = ps.map(p => p[1])
    const z = ps.map(p => p[2])
    const current: Vec3[] = []
    for (let j = 0; j <= segmentCount; j++) {
      const v = j / segmentCount
      current.push([
        interpolateNurbs(v, degreeV, x, knotsV),
        interpolateNurbs(v, degreeV, y, knotsV),
        interpolateNurbs(v, degreeV, z, knotsV),
      ])
      if (previous && j > 0) {
        triangles.push(
          ...previous[j - 1], ...previous[j], ...current[j - 1],
          ...current[j - 1], ...previous[j], ...current[j],
        )
      }
    }
    previous = current
  }
  return triangles
}

export function getNurbsSurfaceVertices(
  points: Vec3[][],
  degreeU: number,
  knotsU = getDefaultNurbsKnots(points.length, degreeU),
  degreeV = degreeU,
  knotsV = getDefaultNurbsKnots(points[0].length, degreeU),
  weights?: number[][],
): { vertices: Record<string, twgl.primitives.TypedArray>, nurbs: verb.geom.NurbsSurface } {
  const nurbs = verb.geom.NurbsSurface.byKnotsControlPointsWeights(degreeU, degreeV, knotsU, knotsV, points, weights)
  const mesh = nurbs.tessellate()
  const positions = twgl.primitives.createAugmentedTypedArray(3, mesh.points.length)
  const normals = twgl.primitives.createAugmentedTypedArray(3, mesh.normals.length)
  const texcoords = twgl.primitives.createAugmentedTypedArray(2, mesh.uvs.length)
  const indicesLength = mesh.faces.length % 2 === 1 ? mesh.faces.length + 1 : mesh.faces.length
  const indices = twgl.primitives.createAugmentedTypedArray(3, indicesLength, Uint16Array)
  positions.push(...mesh.points)
  normals.push(...mesh.normals)
  texcoords.push(...mesh.uvs)
  indices.push(...mesh.faces)
  const vertices = {
    position: positions,
    normal: normals,
    texcoord: texcoords,
    indices: indices,
  }
  return {
    vertices,
    nurbs,
  }
}

export interface NurbsCurve {
  points: Position[]
  degree: number
  knots: number[]
  weights?: number[]
}

export const NurbsCurve: Record<string, Validator> = {
  points: [Position],
  degree: number,
  knots: [number],
  weights: /* @__PURE__ */ optional([number]),
}

function fromVerbNurbsCurve(curve: verb.geom.NurbsCurve): NurbsCurve {
  return {
    points: curve.controlPoints().map(p => fromVerbPoint(p)),
    degree: curve.degree(),
    knots: curve.knots(),
    weights: curve.weights(),
  }
}

function toVerbNurbsCurve(curve: NurbsCurve) {
  return verb.geom.NurbsCurve.byKnotsControlPointsWeights(curve.degree, curve.knots, curve.points.map(p => toVerbPoint(p)), curve.weights)
}

function fromVerbPoint(point: verb.core.Data.Point) {
  return { x: point[0], y: point[1] }
}

function toVerbPoint(point: Position) {
  return [point.x, point.y]
}

export function pointIsOnNurbsCurve(point: Position, curve: NurbsCurve) {
  const p = toVerbNurbsCurve(curve).closestPoint(toVerbPoint(point))
  return isZero(getTwoPointsDistance(point, fromVerbPoint(p)), delta3)
}

export function getNurbsMaxParam(curve: NurbsCurve) {
  return curve.points.length - curve.degree
}

export function getNurbsCurveParamAtPoint(curve: NurbsCurve, point: Position) {
  return toVerbNurbsCurve(curve).closestParam(toVerbPoint(point))
}

export function getNurbsCurvePointAtParam(curve: NurbsCurve, param: number) {
  return fromVerbPoint(toVerbNurbsCurve(curve).point(param))
}

export function getNurbsCurveStartAndEnd(curve: NurbsCurve) {
  return {
    start: getNurbsCurvePointAtParam(curve, 0),
    end: getNurbsCurvePointAtParam(curve, getNurbsMaxParam(curve)),
  }
}

export function getNurbsCurvePoints(curve: NurbsCurve, segmentCount: number) {
  const nurbs = toVerbNurbsCurve(curve)
  const points: Position[] = []
  for (let t = 0; t <= segmentCount; t++) {
    points.push(fromVerbPoint(nurbs.point(t / segmentCount)))
  }
  return points
}

export function getPerpendicularParamToNurbsCurve({ x: a, y: b }: Position, curve: NurbsCurve, near?: Position, delta = delta2) {
  const nurbs = toVerbNurbsCurve(curve)
  const f1 = (t: number) => {
    const [[x, y], [x1, y1]] = nurbs.derivatives(t)
    // (y - b)/(x - a) y1/x1 = -1
    // z = x1 (x - a) + y1 (y - b)
    return x1 * (x - a) + y1 * (y - b)
  }
  const f2 = (t: number) => {
    const [[x, y], [x1, y1], [x2, y2]] = nurbs.derivatives(t, 2)
    // z' = x1 x' + x1' (x - a) + y1 y'+ y1' (y - b)
    // z' = x1 x1 + x2 (x - a) + y1 y1 + y2 (y - b)
    return x1 * x1 + x2 * (x - a) + y1 * y1 + y2 * (y - b)
  }
  const u0 = near ? nurbs.closestParam(toVerbPoint(near)) : getNurbsMaxParam(curve) / 2
  return newtonIterate(u0, f1, f2, delta)
}

export function getTangencyParamToNurbsCurve({ x: a, y: b }: Position, curve: NurbsCurve, near?: Position, delta = delta2) {
  const nurbs = toVerbNurbsCurve(curve)
  const f1 = (t: number) => {
    const [[x, y], [x1, y1]] = nurbs.derivatives(t)
    // (y - b)/(x - a) = y1/x1
    // z = y1(x - a) - x1(y - b)
    return y1 * (x - a) - x1 * (y - b)
  }
  const f2 = (t: number) => {
    const [[x, y], [x1, y1], [x2, y2]] = nurbs.derivatives(t, 2)
    // z' = y1 x' + y1' (x - a) - (x1 y' + x1' (y - b))
    // z' = y1 x1 + y2 (x - a) - (x1 y1 + x2 (y - b))
    return y1 * x1 + y2 * (x - a) - (x1 * y1 + x2 * (y - b))
  }
  const u0 = near ? nurbs.closestParam(toVerbPoint(near)) : getNurbsMaxParam(curve) / 2
  return newtonIterate(u0, f1, f2, delta)
}

export function getNurbsCurveDerivatives(curve: NurbsCurve, t: number): [Position, Position] {
  const nurbs = toVerbNurbsCurve(curve)
  const [[x, y], [x1, y1]] = nurbs.derivatives(t)
  return [{ x, y }, { x: x1, y: y1 }]
}

export function getPointAndNurbsCurveNearestPointAndDistance(position: Position, curve: NurbsCurve) {
  const nurbs = toVerbNurbsCurve(curve)
  const u = nurbs.closestParam(toVerbPoint(position))
  const point = fromVerbPoint(nurbs.point(u))
  return {
    param: u,
    point,
    distance: getTwoPointsDistance(position, point)
  }
}

export function getNurbsCurveLength(curve: NurbsCurve) {
  return toVerbNurbsCurve(curve).length()
}

export function getNurbsCurveLengthByParam(curve: NurbsCurve, param: number) {
  return toVerbNurbsCurve(curve).lengthAtParam(param)
}

export function getNurbsCurveParamByLength(curve: NurbsCurve, length: number) {
  return toVerbNurbsCurve(curve).paramAtLength(length)
}

export function splitNurbsCurve(curve: NurbsCurve, t: number): [NurbsCurve, NurbsCurve] {
  const [start, end] = toVerbNurbsCurve(curve).split(t)
  return [fromVerbNurbsCurve(start), fromVerbNurbsCurve(end)]
}

export function getPartOfNurbsCurve(curve: NurbsCurve, t1: number, t2: number): NurbsCurve {
  let nurbs = toVerbNurbsCurve(curve)
  if (!isZero(t1)) {
    nurbs = nurbs.split(t1)[1]
  }
  if (!isZero(t2)) {
    nurbs = nurbs.split(t2)[0]
  }
  return fromVerbNurbsCurve(nurbs)
}

export function getLineSegmentNurbsCurveIntersectionPoints(start: Position, end: Position, curve: NurbsCurve) {
  const line = new verb.geom.Line(toVerbPoint(start), toVerbPoint(end))
  const nurbs = toVerbNurbsCurve(curve)
  return verb.geom.Intersect.curves(line, nurbs).map(s => fromVerbPoint(s.point0))
}

export function getArcNurbsCurveIntersectionPoints(arc: Arc, curve: NurbsCurve, extend: ExtendType = { body: true }) {
  let line: verb.geom.Arc
  if (extend.head || extend.tail) {
    line = new verb.geom.Circle(toVerbPoint(arc), [1, 0], [0, 1], arc.r)
  } else {
    const start = angleToRadian(arc.startAngle)
    const end = angleToRadian(arc.endAngle)
    line = new verb.geom.Arc(toVerbPoint(arc), [1, 0], [0, 1], arc.r, arc.counterclockwise ? end : start, arc.counterclockwise ? start : end)
  }
  const nurbs = toVerbNurbsCurve(curve)
  return verb.geom.Intersect.curves(line, nurbs).map(s => fromVerbPoint(s.point0)).filter(s => pointIsOnArc(s, arc, extend))
}

export function getEllipseArcNurbsCurveIntersectionPoints(arc: EllipseArc, curve: NurbsCurve, extend: ExtendType = { body: true }) {
  const radian = angleToRadian(arc.angle)
  const cos = Math.cos(radian), sin = Math.sin(radian)
  const line = new verb.geom.Ellipse([arc.cx, arc.cy], [arc.rx * cos, arc.rx * sin], [-arc.ry * sin, arc.ry * cos])
  const nurbs = toVerbNurbsCurve(curve)
  let result = verb.geom.Intersect.curves(line, nurbs).map(s => fromVerbPoint(s.point0))
  result = result.filter(s => pointIsOnEllipseArc(s, arc, extend))
  return result
}

export function getQuadraticCurveNurbsCurveIntersectionPoints(curve1: QuadraticCurve, curve: NurbsCurve) {
  const line = new verb.geom.BezierCurve([toVerbPoint(curve1.from), toVerbPoint(curve1.cp), toVerbPoint(curve1.to)])
  const nurbs = toVerbNurbsCurve(curve)
  return verb.geom.Intersect.curves(line, nurbs).map(s => fromVerbPoint(s.point0))
}

export function getBezierCurveNurbsCurveIntersectionPoints(curve1: BezierCurve, curve: NurbsCurve) {
  const line = new verb.geom.BezierCurve([toVerbPoint(curve1.from), toVerbPoint(curve1.cp1), toVerbPoint(curve1.cp2), toVerbPoint(curve1.to)])
  const nurbs = toVerbNurbsCurve(curve)
  return verb.geom.Intersect.curves(line, nurbs).map(s => fromVerbPoint(s.point0))
}

export function getTwoNurbsCurveIntersectionPoints(curve1: NurbsCurve, curve2: NurbsCurve) {
  const nurbs1 = toVerbNurbsCurve(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  return verb.geom.Intersect.curves(nurbs1, nurbs2).map(s => fromVerbPoint(s.point0))
}

export function reverseNurbsCurve(curve: NurbsCurve): NurbsCurve {
  return fromVerbNurbsCurve(toVerbNurbsCurve(curve).reverse())
}

/**
 * 0: point on nurbs curve
 * 1: point on left side of nurbs curve
 * -1: point on right side of nurbs curve
 */
export function getPointSideOfNurbsCurve(point: Position, curve: NurbsCurve): number {
  const p = getPointAndNurbsCurveNearestPointAndDistance(point, curve)
  const [x1, y1] = toVerbNurbsCurve(curve).tangent(p.param)
  const radian = Math.atan2(y1, x1)
  const line = pointAndDirectionToGeneralFormLine(p.point, radian)
  return getPointSideOfLine(point, line)
}

export function getParallelNurbsCurvesByDistance<T extends NurbsCurve>(curve: T, distance: number): [T, T] {
  if (isZero(distance)) {
    return [curve, curve]
  }
  const [p0, p1] = getParallelPolylinesByDistance(curve.points, distance, false)
  return [
    {
      ...curve,
      points: p0.length === curve.points.length ? p0 : curve,
    },
    {
      ...curve,
      points: p1.length === curve.points.length ? p1 : curve,
    },
  ]
}

export function getNurbsCurveCurvatureAtParam(curve: NurbsCurve, param: number) {
  const nurbs = toVerbNurbsCurve(curve)
  const [, [x1, y1], [x2, y2]] = nurbs.derivatives(param, 2)
  // (x1 y2 - y1 x2)/(x1 ** 2 + y1 ** 2)**1.5
  return (x1 * y2 - y1 * x2) / (x1 ** 2 + y1 ** 2) ** 1.5
}

export function getLineAndNurbsCurveExtremumPoints(line: GeneralFormLine, curve: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const nurbs = toVerbNurbsCurve(curve)
  const { a, b } = line
  const f1 = (t: number) => {
    const [, [x1, y1]] = nurbs.derivatives(t)
    // a x + b y + c = 0
    // y1 / x1 = -a/ b
    // a x1 + b y1 = 0
    // z = a x1 + b y1
    return a * x1 + b * y1
  }
  const f2 = (t: number) => {
    const [, , [x2, y2]] = nurbs.derivatives(t, 2)
    // z' = a x2 + b y2
    return a * x2 + b * y2
  }
  let ts: number[] = []
  const maxParam = getNurbsMaxParam(curve)
  for (let t0 = 0.5; t0 < maxParam; t0++) {
    const t = newtonIterate(t0, f1, f2, delta)
    if (t !== undefined) {
      ts.push(t)
    }
  }
  ts = deduplicate(ts, isSameNumber)
  return ts.filter(v => isBetween(v, 0, maxParam)).map(t => {
    const p2 = fromVerbPoint(nurbs.point(t))
    const p1 = getPerpendicularPoint(p2, line)
    return [p1, p2]
  })
}

export function getCircleAndNurbsCurveExtremumPoints(circle: Circle, curve: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const nurbs = toVerbNurbsCurve(curve)
  const { x: a, y: b } = circle
  const f1 = (t: number) => {
    const [[x, y], [x1, y1]] = nurbs.derivatives(t)
    // (y - b)/(x - a) y1/x1 = -1
    // z = x1 (x - a) + y1 (y - b)
    return x1 * (x - a) + y1 * (y - b)
  }
  const f2 = (t: number) => {
    const [[x, y], [x1, y1], [x2, y2]] = nurbs.derivatives(t, 2)
    // z' = x1 x' + x1' (x - a) + y1 y'+ y1' (y - b)
    // z' = x1 x1 + x2 (x - a) + y1 y1 + y2 (y - b)
    return x1 * x1 + x2 * (x - a) + y1 * y1 + y2 * (y - b)
  }
  let ts: number[] = []
  const maxParam = getNurbsMaxParam(curve)
  for (let t0 = 0.5; t0 < maxParam; t0++) {
    const t = newtonIterate(t0, f1, f2, delta)
    if (t !== undefined) {
      ts.push(t)
    }
  }
  ts = deduplicate(ts, isSameNumber)
  return ts.filter(v => isBetween(v, 0, maxParam)).map(t => {
    const p = fromVerbPoint(nurbs.point(t))
    const t1 = getCircleRadian(p, circle)
    return [[getCirclePointAtRadian(circle, t1), p], [getCirclePointAtRadian(circle, reverseRadian(t1)), p]] as Tuple2<Position>[]
  }).flat()
}

export function getEllipseAndNurbsCurveExtremumPoints(curve1: Ellipse, curve2: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const [p1, d1, d2] = getEllipseDerivatives(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const [[x2, y2], [x21, y21]] = nurbs2.derivatives(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const [[x2, y2], [x21, y21], [x22, y22]] = nurbs2.derivatives(t[1], 2)
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  const maxParam2 = getNurbsMaxParam(curve2)
  for (const t1 of [-Math.PI / 2, Math.PI / 2]) {
    for (let t2 = 0.5; t2 < maxParam2; t2++) {
      const t = newtonIterate2([t1, t2], f1, f2, delta)
      if (t !== undefined) {
        t[0] = normalizeRadian(t[0])
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isBetween(v[1], 0, maxParam2)).map(t => {
    return [p1(t[0]), fromVerbPoint(nurbs2.point(t[1]))]
  })
}

export function getQuadraticCurveAndNurbsCurveExtremumPoints(curve1: QuadraticCurve, curve2: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const [p1, d1, d2] = getQuadraticCurveDerivatives(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const [[x2, y2], [x21, y21]] = nurbs2.derivatives(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const [[x2, y2], [x21, y21], [x22, y22]] = nurbs2.derivatives(t[1], 2)
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  const maxParam2 = getNurbsMaxParam(curve2)
  for (const t1 of [0.25, 0.75]) {
    for (let t2 = 0.5; t2 < maxParam2; t2++) {
      const t = newtonIterate2([t1, t2], f1, f2, delta)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isBetween(v[0], 0, 1) && isBetween(v[1], 0, maxParam2)).map(t => {
    return [p1(t[0]), fromVerbPoint(nurbs2.point(t[1]))]
  })
}

export function getBezierCurveAndNurbsCurveExtremumPoints(curve1: BezierCurve, curve2: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const [p1, d1, d2] = getBezierCurveDerivatives(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const [[x2, y2], [x21, y21]] = nurbs2.derivatives(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const { x: x1, y: y1 } = p1(t[0])
    const { x: x11, y: y11 } = d1(t[0])
    const { x: x12, y: y12 } = d2(t[0])
    const [[x2, y2], [x21, y21], [x22, y22]] = nurbs2.derivatives(t[1], 2)
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  const maxParam2 = getNurbsMaxParam(curve2)
  for (const t1 of [0.25, 0.75]) {
    for (let t2 = 0.5; t2 < maxParam2; t2++) {
      const t = newtonIterate2([t1, t2], f1, f2, delta)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isBetween(v[0], 0, 1) && isBetween(v[1], 0, maxParam2)).map(t => {
    return [p1(t[0]), fromVerbPoint(nurbs2.point(t[1]))]
  })
}

export function getTwoNurbsCurveExtremumPoints(curve1: NurbsCurve, curve2: NurbsCurve, delta = delta2): Tuple2<Position>[] {
  const nurbs1 = toVerbNurbsCurve(curve1)
  const nurbs2 = toVerbNurbsCurve(curve2)
  const f1 = (t: Vec2): Vec2 => {
    // z = (x1 - x2)^2 + (y1 - y2)^2
    // dz/dt1/2: z1 = (x1 - x2)x1' + (y1 - y2)y1'
    // dz/dt2/2: z2 = (x2 - x1)x2' + (y2 - y1)y2'
    const [[x1, y1], [x11, y11]] = nurbs1.derivatives(t[0])
    const [[x2, y2], [x21, y21]] = nurbs2.derivatives(t[1])
    return [(x1 - x2) * x11 + (y1 - y2) * y11, (x2 - x1) * x21 + (y2 - y1) * y21]
  }
  const f2 = (t: Vec2): Matrix2 => {
    const [[x1, y1], [x11, y11], [x12, y12]] = nurbs1.derivatives(t[0], 2)
    const [[x2, y2], [x21, y21], [x22, y22]] = nurbs2.derivatives(t[1], 2)
    // dz1/dt1 = x1'x1' + (x1 - x2)x1'' + y1'y1' + (y1 - y2)y1''
    // dz1/dt2 = -x2' x1' - y2' y1'
    // dz2/dt1 = -x1' x2' - y1' y2'
    // dz2/dt2 = x2'x2' + (x2 - x1)x2'' + y2'y2' + (y2 - y1)y2''
    return [
      x11 * x11 + (x1 - x2) * x12 + y11 * y11 + (y1 - y2) * y12,
      -x21 * x11 - y21 * y11,
      -x11 * x21 - y11 * y21,
      x21 * x21 + (x2 - x1) * x22 + y21 * y21 + (y2 - y1) * y22,
    ]
  }
  let ts: Vec2[] = []
  const maxParam1 = getNurbsMaxParam(curve1)
  const maxParam2 = getNurbsMaxParam(curve2)
  for (let t1 = 0.5; t1 < maxParam1; t1++) {
    for (let t2 = 0.5; t2 < maxParam2; t2++) {
      const t = newtonIterate2([t1, t2], f1, f2, delta)
      if (t !== undefined) {
        ts.push(t)
      }
    }
  }
  ts = deduplicate(ts, deepEquals)
  return ts.filter(v => isBetween(v[0], 0, maxParam1) && isBetween(v[1], 0, maxParam2)).map(t => {
    return [fromVerbPoint(nurbs1.point(t[0])), fromVerbPoint(nurbs2.point(t[1]))]
  })
}
