import { getBezierCurveDerivatives, getBezierCurvePercentAtPoint, getPartOfBezierCurve, getPartOfQuadraticCurve, getQuadraticCurveDerivatives, getQuadraticCurvePercentAtPoint } from "./bezier"
import { Arc, EllipseArc, Position, equals, getTwoPointCenter, isSamePoint, isZero, pointIsOnLine } from "./geometry"
import { BezierCurve, QuadraticCurve } from "./intersection"

export function mergeLineSegment(line1: [Position, Position], line2: [Position, Position]): [Position, Position] | undefined {
  if (!isSamePoint(line1[1], line2[0])) return
  if (!pointIsOnLine(line2[1], ...line1)) return
  return [line1[0], line2[1]]
}

export function mergeArc(curve1: Arc, curve2: Arc): Arc | undefined {
  if (!equals(curve1.x, curve2.x)) return
  if (!equals(curve1.y, curve2.y)) return
  if (!equals(curve1.r, curve2.r)) return
  if (curve1.counterclockwise !== curve2.counterclockwise) return
  if (!isZero(Math.abs(curve1.endAngle - curve2.startAngle) % 360)) return
  return {
    ...curve1,
    endAngle: curve2.endAngle,
  }
}

export function mergeEllipseArc(curve1: EllipseArc, curve2: EllipseArc): EllipseArc | undefined {
  if (!equals(curve1.cx, curve2.cx)) return
  if (!equals(curve1.cy, curve2.cy)) return
  if (!equals(curve1.rx, curve2.rx)) return
  if (!equals(curve1.ry, curve2.ry)) return
  if (curve1.counterclockwise !== curve2.counterclockwise) return
  if (!equals(curve1.angle, curve2.angle)) return
  if (!isZero(Math.abs(curve1.endAngle - curve2.startAngle) % 360)) return
  return {
    ...curve1,
    endAngle: curve2.endAngle,
  }
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
  return isZero(a.x * b.y - a.y * b.x)
}
