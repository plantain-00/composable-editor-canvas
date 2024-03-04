import { getBezierCurveDerivatives, getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurveDerivatives, getQuadraticCurvePercentAtPoint } from "./bezier"
import { isSameNumber, isZero, equals } from "./math"
import { Position } from "./position"
import { getTwoPointCenter } from "./position"
import { isSamePoint } from "./position"
import { pointIsOnLine } from "./line"
import { EllipseArc } from "./ellipse"
import { Arc } from "./circle"
import { GeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { reverseArc, reverseEllipseArc } from "./reverse"
import { AngleRange } from "./angle"

export function mergeLineSegment(line1: [Position, Position], line2: [Position, Position]): [Position, Position] | undefined {
  if (!isSamePoint(line1[1], line2[0])) {
    return mergeLineSegment(line2, line1)
  }
  if (!pointIsOnLine(line2[1], ...line1)) return
  return [line1[0], line2[1]]
}

export function mergeArc<T extends Arc>(curve1: T, curve2: T): T | undefined {
  if (!isSameNumber(curve1.x, curve2.x)) return
  if (!isSameNumber(curve1.y, curve2.y)) return
  if (!isSameNumber(curve1.r, curve2.r)) return
  if (curve1.counterclockwise !== curve2.counterclockwise) {
    curve2 = reverseArc(curve2)
  }
  return mergeAngleRange(curve1, curve2)
}

export function mergeEllipseArc<T extends EllipseArc>(curve1: T, curve2: T): T | undefined {
  if (!isSameNumber(curve1.cx, curve2.cx)) return
  if (!isSameNumber(curve1.cy, curve2.cy)) return
  if (!isSameNumber(curve1.rx, curve2.rx)) return
  if (!isSameNumber(curve1.ry, curve2.ry)) return
  if (!equals(curve1.angle, curve2.angle)) return
  if (curve1.counterclockwise !== curve2.counterclockwise) {
    curve2 = reverseEllipseArc(curve2)
  }
  return mergeAngleRange(curve1, curve2)
}

function mergeAngleRange<T extends AngleRange>(curve1: T, curve2: T): T | undefined {
  if (isZero(Math.abs(curve1.endAngle - curve2.startAngle) % 360)) {
    if (isZero(Math.abs(curve1.startAngle - curve2.endAngle) % 360)) {
      return {
        ...curve1,
        startAngle: 0,
        endAngle: 360,
      }
    }
    return {
      ...curve1,
      endAngle: curve2.endAngle,
    }
  } else if (isZero(Math.abs(curve1.startAngle - curve2.endAngle) % 360)) {
    return {
      ...curve1,
      startAngle: curve2.startAngle,
    }
  }
  return
}

export function mergeQuadraticCurve(curve1: QuadraticCurve, curve2: QuadraticCurve): QuadraticCurve | undefined {
  const d1 = getQuadraticCurveDerivatives(curve1)
  const d2 = getQuadraticCurveDerivatives(curve2)
  if (!quadraticCurvesCanMergeToQuadraticSpline(d1, d2)) return
  if (!quadraticCurvesCanMergeToOneQuadraticCurve(d1, d2)) return
  return mergeQuadraticCurveUnsafe(curve1, curve2)
}

function mergeQuadraticCurveUnsafe(curve1: QuadraticCurve, curve2: QuadraticCurve): QuadraticCurve {
  const t2 = getQuadraticCurvePercentAtPoint(curve1, curve2.to)
  return getPartOfQuadraticCurve(curve1, 0, t2)
}

function quadraticCurvesCanMergeToQuadraticSpline(
  d0: [(t: number) => Position, (t: number) => Position, (t: number) => Position],
  d1: [(t: number) => Position, (t: number) => Position, (t: number) => Position],
) {
  return isSameDerivative(d0[0](1), d1[0](0)) && isSameDerivative(d0[1](1), d1[1](0))
}

function quadraticCurvesCanMergeToOneQuadraticCurve(
  d0: [(t: number) => Position, (t: number) => Position, (t: number) => Position],
  d1: [(t: number) => Position, (t: number) => Position, (t: number) => Position],
) {
  return isSameDerivative(d0[2](1), d1[2](0))
}

export function mergeQuadraticCurvesToQuadraticSpline(curves: QuadraticCurve[]): Position[] | undefined {
  if (curves.length === 0) return
  const first = curves[0]
  if (curves.length === 1) {
    return [first.from, first.cp, first.to]
  }
  const derivatives = [getQuadraticCurveDerivatives(first)]
  const result = [first.from, first.cp]
  for (let i = 1; ; i++) {
    derivatives.push(getQuadraticCurveDerivatives(curves[i]))
    if (!quadraticCurvesCanMergeToQuadraticSpline(derivatives[i - 1], derivatives[i])) return
    if (quadraticCurvesCanMergeToOneQuadraticCurve(derivatives[i - 1], derivatives[i])) {
      return mergeQuadraticCurvesToQuadraticSpline([...curves.slice(0, i - 1), mergeQuadraticCurveUnsafe(curves[i - 1], curves[i]), ...curves.slice(i + 1)])
    }
    if (!isSamePoint(getTwoPointCenter(curves[i - 1].cp, curves[i].cp), curves[i - 1].to)) return
    result.push(curves[i].cp)
    if (curves.length === i + 1) {
      return [...result, curves[curves.length - 1].to]
    }
  }
}

export function mergeBezierCurve(curve1: BezierCurve, curve2: BezierCurve): BezierCurve | undefined {
  const d1 = getBezierCurveDerivatives(curve1)
  const d2 = getBezierCurveDerivatives(curve2)
  if (!bezierCurvesCanMergeToBezierSpline(d1, d2)) return
  if (!bezierCurvesCanMergeToOneBezierCurve(d1, d2)) return
  return mergeBezierCurveUnsafe(curve1, curve2)
}

function mergeBezierCurveUnsafe(curve1: BezierCurve, curve2: BezierCurve): BezierCurve {
  const t2 = getBezierCurvePercentAtPoint(curve1, curve2.to)
  return getPartOfBezierCurve(curve1, 0, t2)
}

function bezierCurvesCanMergeToBezierSpline(
  d0: [(t: number) => Position, (t: number) => Position, (t: number) => Position, (t: number) => Position],
  d1: [(t: number) => Position, (t: number) => Position, (t: number) => Position, (t: number) => Position],
) {
  return isSameDerivative(d0[0](1), d1[0](0)) &&
    isSameDerivative(d0[1](1), d1[1](0)) &&
    isSameDerivative(d0[2](1), d1[2](0))
}

function bezierCurvesCanMergeToOneBezierCurve(
  d0: [(t: number) => Position, (t: number) => Position, (t: number) => Position, (t: number) => Position],
  d1: [(t: number) => Position, (t: number) => Position, (t: number) => Position, (t: number) => Position],
) {
  return isSameDerivative(d0[3](1), d1[3](0))
}

export function mergeBezierCurvesToBezierSpline(curves: BezierCurve[]): Position[] | undefined {
  if (curves.length === 0) return
  const first = curves[0]
  if (curves.length === 1) {
    return [first.from, first.cp1, first.cp2, first.to]
  }
  const derivatives = [getBezierCurveDerivatives(first)]
  const result = [first.from, first.cp1]
  for (let i = 1; ; i++) {
    derivatives.push(getBezierCurveDerivatives(curves[i]))
    if (!bezierCurvesCanMergeToBezierSpline(derivatives[i - 1], derivatives[i])) return
    if (bezierCurvesCanMergeToOneBezierCurve(derivatives[i - 1], derivatives[i])) {
      return mergeBezierCurvesToBezierSpline([...curves.slice(0, i - 1), mergeBezierCurveUnsafe(curves[i - 1], curves[i]), ...curves.slice(i + 1)])
    }
    if (!isSamePoint(getTwoPointCenter(curves[i - 1].cp2, curves[i].cp1), curves[i - 1].to)) return
    result.push({ x: curves[i].cp1.x * 2 - curves[i].cp2.x, y: curves[i].cp1.y * 2 - curves[i].cp2.y })
    if (curves.length === i + 1) {
      return [...result, curves[curves.length - 1].cp2, curves[curves.length - 1].to]
    }
  }
}

export function isSameDerivative(a: Position, b: Position) {
  return isSameNumber(a.x * b.y, a.y * b.x)
}

export function mergeGeometryLine(line1: GeometryLine, line2: GeometryLine): GeometryLine | undefined {
  if (Array.isArray(line1) && Array.isArray(line2)) {
    return mergeLineSegment(line1, line2)
  }
  if (Array.isArray(line1) || Array.isArray(line2)) return
  if (line1.type === 'arc' && line2.type === 'arc') {
    const curve = mergeArc(line1.curve, line2.curve)
    if (!curve) return
    return { type: 'arc', curve }
  }
  if (line1.type === 'ellipse arc' && line2.type === 'ellipse arc') {
    const curve = mergeEllipseArc(line1.curve, line2.curve)
    if (!curve) return
    return { type: 'ellipse arc', curve }
  }
  if (line1.type === 'quadratic curve' && line2.type === 'quadratic curve') {
    const curve = mergeQuadraticCurve(line1.curve, line2.curve)
    if (!curve) return
    return { type: 'quadratic curve', curve }
  }
  if (line1.type === 'bezier curve' && line2.type === 'bezier curve') {
    const curve = mergeBezierCurve(line1.curve, line2.curve)
    if (!curve) return
    return { type: 'bezier curve', curve }
  }
  return
}
