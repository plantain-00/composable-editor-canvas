import { Position } from "./position";
import { EllipseArc } from "./ellipse";
import { Arc } from "./circle";
import { GeometryLine } from "./geometry-line";
import { QuadraticCurve } from "./bezier";
import { BezierCurve } from "./bezier";
import { Nurbs, reverseNurbsCurve } from "./nurbs";
import { Ray, getPolygonArea } from "./line";
import { normalizeAngle, normalizeRadian } from "./angle";
import { getGeometryLinesPoints } from "./hatch";

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
  if (geometryLine.type === 'ray') {
    return { ...geometryLine, line: reverseRay(geometryLine.line) }
  }
  return { ...geometryLine, curve: reverseNurbsCurve(geometryLine.curve) }
}

export function reverseGeometryLines(lines: GeometryLine[]): GeometryLine[] {
  return lines.map(n => reverseGeometryLine(n)).reverse()
}

export function reverseClosedGeometryLinesIfAreaIsNegative(lines: GeometryLine[]) {
  if (getPolygonArea(getGeometryLinesPoints(lines)) < 0) {
    return reverseGeometryLines(lines)
  }
  return lines
}

export function reverseRay(ray: Ray): Ray {
  if (!ray.bidirectional) {
    return {
      ...ray,
      reversed: !ray.reversed,
    }
  }
  return {
    ...ray,
    angle: normalizeAngle(ray.angle + 180),
  }
}

export function reverseRadian(radian: number) {
  return normalizeRadian(radian + Math.PI)
}

export function reverseAngle(angle: number) {
  return normalizeAngle(angle + 180)
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
