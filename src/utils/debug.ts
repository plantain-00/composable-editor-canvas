import { Position } from "./position"
import { getEllipseCenter } from "./ellipse"
import { EllipseArc } from "./ellipse"
import { Arc } from "./circle"
import { GeometryLine } from "./geometry-line"
import { QuadraticCurve } from "./bezier"
import { BezierCurve } from "./bezier"
import { NurbsCurve } from "./nurbs"
import { Ray } from "./line"
import { ParabolaSegment } from "./parabola"

/**
 * @public
 */
export class Debug {
  constructor(private enabled?: boolean) { }
  private last = performance.now()
  private result: Record<string, number> = {}
  public add(name: string, value: number) {
    if (!this.enabled) {
      return
    }
    this.result[name] = value
  }
  public mark(name: string) {
    if (!this.enabled) {
      return
    }
    this.result[name] = Math.round(performance.now() - this.last)
    this.last = performance.now()
  }
  public print(name = 'end') {
    this.mark(name)
    return Object.values(this.result).join(' ')
  }
}

export function printParam(n: number) {
  return n.toFixed(1)
}

export function printPoint(point: Position) {
  return `(${Math.round(point.x)},${Math.round(point.y)})`
}

export function printLine(line: [Position, Position]) {
  return `${printPoint(line[0])}->${printPoint(line[1])}`
}

export function printArc(arc: Arc) {
  return `${printPoint(arc)} R${Math.round(arc.r)} A${Math.round(arc.startAngle)}${arc.counterclockwise ? '<-' : '->'}${Math.round(arc.endAngle)}`
}

export function printEllipseArc(arc: EllipseArc) {
  return `${printPoint(getEllipseCenter(arc))} R${Math.round(arc.rx)},${Math.round(arc.ry)} A${Math.round(arc.startAngle + (arc.angle || 0))}${arc.counterclockwise ? '<-' : '->'}${Math.round(arc.endAngle + (arc.angle || 0))}`
}

export function printQuadraticCurve(curve: QuadraticCurve) {
  return `${printPoint(curve.from)}->${printPoint(curve.cp)}->${printPoint(curve.to)}`
}

export function printBezierCurve(curve: BezierCurve) {
  return `${printPoint(curve.from)}->${printPoint(curve.cp1)}->${printPoint(curve.cp2)}->${printPoint(curve.to)}`
}

export function printParabolaParabola(curve: ParabolaSegment) {
  return `${printPoint(curve)} A${Math.round(curve.angle)} ${Math.round(curve.t1)}->${Math.round(curve.t2)}`
}

export function printNurbsCurve(curve: NurbsCurve) {
  return curve.points.map(p => printPoint(p)).join('->')
}

export function printRay(ray: Ray) {
  return `${printPoint(ray)}${ray.bidirectional ? '<->' : ray.reversed ? '<-' : '->'}${Math.round(ray.angle)}`
}

export function printGeometryLine(line: GeometryLine) {
  if (Array.isArray(line)) {
    return printLine(line)
  }
  if (line.type === 'arc') {
    return printArc(line.curve)
  }
  if (line.type === 'ellipse arc') {
    return printEllipseArc(line.curve)
  }
  if (line.type === 'quadratic curve') {
    return printQuadraticCurve(line.curve)
  }
  if (line.type === 'bezier curve') {
    return printBezierCurve(line.curve)
  }
  if (line.type === 'ray') {
    return printRay(line.line)
  }
  if (line.type === 'parabola curve') {
    return printParabolaParabola(line.curve)
  }
  return printNurbsCurve(line.curve)
}
