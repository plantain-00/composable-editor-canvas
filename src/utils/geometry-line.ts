import { geometryLineIntersectWithPolygon } from "./intersection";

import { QuadraticCurve, BezierCurve } from "./bezier";
import { getArcStartAndEnd, Arc } from "./circle";
import { getEllipseArcStartAndEnd, EllipseArc } from "./ellipse";
import { isArray } from "./is-array";
import { isRecord } from "./is-record";
import { pointInPolygon } from "./line";
import { getNurbsCurveStartAndEnd, NurbsCurve } from "./nurbs";
import { Position } from "./position";
import { Path, ValidationResult, validate, tuple } from "./validators";

export type GeometryLine = [Position, Position] |
{ type: 'arc'; curve: Arc } |
{ type: 'ellipse arc'; curve: EllipseArc } |
{ type: 'quadratic curve'; curve: QuadraticCurve } |
{ type: 'bezier curve'; curve: BezierCurve } |
{ type: 'nurbs curve'; curve: NurbsCurve }

export const GeometryLine = (v: unknown, path: Path): ValidationResult => {
  if (isArray(v)) return validate(v, tuple(Position, Position), path)
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'arc') return validate(v, { type: 'arc', curve: Arc }, path)
  if (v.type === 'ellipse arc') return validate(v, { type: 'ellipse arc', curve: EllipseArc }, path)
  if (v.type === 'quadratic curve') return validate(v, { type: 'quadratic curve', curve: QuadraticCurve }, path)
  if (v.type === 'bezier curve') return validate(v, { type: 'bezier curve', curve: BezierCurve }, path)
  if (v.type === 'nurbs curve') return validate(v, { type: 'nurbs curve', curve: NurbsCurve }, path)
  return { path: [...path, 'type'], expect: 'or', args: ['arc', 'ellipse arc', 'quadratic curve', 'bezier curve', 'nurbs curve'] }
}

export function geometryLineInPolygon(line: GeometryLine, polygon: Position[]) {
  if (Array.isArray(line)) {
    return pointInPolygon(line[0], polygon) && pointInPolygon(line[1], polygon)
  }
  let points: { start: Position; end: Position }
  if (line.type === 'arc') {
    points = getArcStartAndEnd(line.curve)
  } else if (line.type === 'ellipse arc') {
    points = getEllipseArcStartAndEnd(line.curve)
  } else if (line.type === 'nurbs curve') {
    points = getNurbsCurveStartAndEnd(line.curve)
  } else {
    points = {
      start: line.curve.from,
      end: line.curve.to,
    }
  }
  return pointInPolygon(points.start, polygon) && pointInPolygon(points.end, polygon) && !geometryLineIntersectWithPolygon(line, polygon)
}
