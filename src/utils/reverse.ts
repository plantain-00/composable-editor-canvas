import { Arc, EllipseArc, Position } from "./geometry";
import { QuadraticCurve, BezierCurve, GeometryLine } from "./intersection";
import { Nurbs, reverseNurbsCurve } from "./nurbs";

export function reverseLineSegment(line: [Position, Position]): [Position, Position] {
  return [line[1], line[0]]
}

export function reverseArc<T extends Arc>(arc: T): T {
  return {
    ...arc,
    startAngle: arc.endAngle,
    endAngle: arc.startAngle,
    counterclockwise: !arc.counterclockwise,
  }
}

export function reverseEllipseArc<T extends EllipseArc>(ellipseArc: T): T {
  return {
    ...ellipseArc,
    startAngle: ellipseArc.endAngle,
    endAngle: ellipseArc.startAngle,
    counterclockwise: !ellipseArc.counterclockwise,
  }
}

export function reverseQuadraticCurve(curve: QuadraticCurve): QuadraticCurve {
  return {
    ...curve,
    from: curve.to,
    to: curve.from,
  }
}

export function reverseBezierCurve(curve: BezierCurve): BezierCurve {
  return {
    ...curve,
    from: curve.to,
    cp1: curve.cp2,
    cp2: curve.cp1,
    to: curve.from,
  }
}

export function reverseGeometryLine(geometryLine: GeometryLine): GeometryLine {
  if (Array.isArray(geometryLine)) {
    return reverseLineSegment(geometryLine)
  }
  if (geometryLine.type === 'arc') {
    return { ...geometryLine, curve: reverseArc(geometryLine.curve) }
  }
  if (geometryLine.type === 'ellipse arc') {
    return { ...geometryLine, curve: reverseEllipseArc(geometryLine.curve) }
  }
  if (geometryLine.type === 'quadratic curve') {
    return { ...geometryLine, curve: reverseQuadraticCurve(geometryLine.curve) }
  }
  if (geometryLine.type === 'bezier curve') {
    return { ...geometryLine, curve: reverseBezierCurve(geometryLine.curve) }
  }
  return { ...geometryLine, curve: reverseNurbsCurve(geometryLine.curve) }
}

function knotsReverse(knots: number[]): number[] {
  const result = [knots[0]]
  for (let i = 0; i < knots.length - 1; i++) {
    result.push(result[i] + knots[knots.length - i - 1] - knots[knots.length - i - 2])
  }
  return result
}

export function reverseNurbs<T extends Nurbs>(nurbs: T): T {
  return {
    ...nurbs,
    points: nurbs.points.slice().reverse(),
    weights: nurbs.weights ? nurbs.weights.slice().reverse() : undefined,
    knots: nurbs.knots ? knotsReverse(nurbs.knots) : undefined,
  }
}