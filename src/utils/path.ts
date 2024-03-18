import { getLargeArc } from "./angle";
import { getGeometryLineStartAndEnd, optimizeGeometryLines } from "./geometry-line";
import { getArcControlPoint } from "./circle";
import { getEllipseArcByStartEnd } from "./ellipse";
import { GeometryLine } from "./geometry-line";
import { getGeometryLinesPoints } from "./hatch";
import { getTwoGeneralFormLinesIntersectionPoint } from "./intersection";
import { isRecord } from "./is-record";
import { twoPointLineToGeneralFormLine, getPointSideOfLine, getParallelLinesByDistance, pointInPolygon } from "./line";
import { delta2, isZero } from "./math";
import { getPerpendicularPoint } from "./perpendicular";
import { Position, isSamePoint } from "./position";
import { getTwoPointsRadian, radianToAngle } from "./radian";
import { Path, ValidationResult, validate, number, boolean } from "./validators";

export type PathCommand = {
  type: 'move'
  to: Position
} |
{
  type: 'line'
  to: Position
} |
{
  type: 'arc'
  from: Position
  to: Position
  radius: number
} |
{
  type: 'ellipseArc'
  rx: number
  ry: number
  angle: number
  largeArc: boolean
  sweep: boolean
  to: Position
} |
{
  type: 'bezierCurve'
  cp1: Position
  cp2: Position
  to: Position
} |
{
  type: 'quadraticCurve'
  cp: Position
  to: Position
} |
{
  type: 'close'
}

export const PathCommand = (v: unknown, path: Path): ValidationResult => {
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'move') return validate(v, {
    type: 'move',
    to: Position,
  }, path)
  if (v.type === 'line') return validate(v, {
    type: 'line',
    to: Position,
  }, path)
  if (v.type === 'arc') return validate(v, {
    type: 'arc',
    from: Position,
    to: Position,
    radius: number,
  }, path)
  if (v.type === 'ellipseArc') return validate(v, {
    type: 'ellipseArc',
    rx: number,
    ry: number,
    angle: number,
    largeArc: boolean,
    sweep: boolean,
    to: Position,
  }, path)
  if (v.type === 'bezierCurve') return validate(v, {
    type: 'bezierCurve',
    cp1: Position,
    cp2: Position,
    to: Position,
  }, path)
  if (v.type === 'quadraticCurve') return validate(v, {
    type: 'quadraticCurve',
    cp: Position,
    to: Position,
  }, path)
  if (v.type === 'close') return validate(v, {
    type: 'close',
  }, path)
  return { path: [...path, 'type'], expect: 'or', args: ['move', 'line', 'arc', 'ellipseArc', 'bezierCurve', 'quadraticCurve', 'close'] }
}

export function getPathCommandEndPoint(pathCommands: PathCommand[], index: number): Position | undefined {
  if (index >= 0) {
    const command = pathCommands[index]
    if (command.type !== 'close') {
      if (command.type !== 'arc') {
        return command.to
      }
      const last = getPathCommandEndPoint(pathCommands, index - 1)
      if (last) {
        const p1 = command.from
        const p2 = command.to
        const line1 = twoPointLineToGeneralFormLine(last, p1)
        const line2 = twoPointLineToGeneralFormLine(p1, p2)
        const p2Direction = getPointSideOfLine(p2, line1)
        if (isZero(p2Direction)) {
          return command.to
        }
        const i = p2Direction < 0 ? 0 : 1
        const center = getTwoGeneralFormLinesIntersectionPoint(
          getParallelLinesByDistance(line1, command.radius)[i],
          getParallelLinesByDistance(line2, command.radius)[i]
        )
        if (center) {
          const t2 = getPerpendicularPoint(center, line2)
          const endRadian = getTwoPointsRadian(t2, center)
          return {
            x: center.x + command.radius * Math.cos(endRadian),
            y: center.y + command.radius * Math.sin(endRadian),
          }
        }
      }
    }
  }
  return
}

export function pathCommandPointsToPath(points: Position[][]) {
  const result: Position[][][] = []
  let current: { polygon: Position[]; holes: Position[][] } | undefined
  for (const p of points) {
    if (!current) {
      current = { polygon: p, holes: [] }
    } else if (pointInPolygon(p[0], current.polygon)) {
      current.holes.push(p)
    } else {
      if (current) {
        result.push([current.polygon, ...current.holes])
      }
      current = { polygon: p, holes: [] }
    }
  }
  if (current) {
    result.push([current.polygon, ...current.holes])
  }
  return result
}

export function getPathCommandsPoints(pathCommands: PathCommand[]) {
  const result: Position[][] = []
  const lines = pathCommandsToGeometryLines(pathCommands)
  for (const line of lines) {
    result.push(getGeometryLinesPoints(line))
  }
  return result
}

export function pathCommandsToGeometryLines(pathCommands: PathCommand[]): GeometryLine[][] {
  const result: GeometryLine[][] = []
  let lines: GeometryLine[] = []
  let lineStartPoint: Position | undefined
  let last: Position | undefined
  for (const command of pathCommands) {
    if (command.type === 'move') {
      if (lines.length > 0) {
        if (lines.length > 1) {
          result.push(lines)
        }
        lines = []
        lineStartPoint = undefined
      }
      last = command.to
      if (!lineStartPoint) {
        lineStartPoint = command.to
      }
    } else if (command.type === 'line') {
      if (last) {
        lines.push([last, command.to])
      }
      last = command.to
    } else if (command.type === 'arc') {
      if (last) {
        const p1 = command.from
        const p2 = command.to
        const line1 = twoPointLineToGeneralFormLine(last, p1)
        const line2 = twoPointLineToGeneralFormLine(p1, p2)
        const p2Direction = getPointSideOfLine(p2, line1)
        if (isZero(p2Direction)) {
          if (last) {
            lines.push([last, p2])
            last = p2
          }
        } else {
          const index = p2Direction < 0 ? 0 : 1
          const center = getTwoGeneralFormLinesIntersectionPoint(
            getParallelLinesByDistance(line1, command.radius)[index],
            getParallelLinesByDistance(line2, command.radius)[index]
          )
          if (center) {
            const t1 = getPerpendicularPoint(center, line1)
            const t2 = getPerpendicularPoint(center, line2)
            if (last) {
              if (!isSamePoint(last, t1)) {
                lines.push([last, { x: t1.x, y: t1.y }])
              }
              last = t2
            }
            const startAngle = radianToAngle(getTwoPointsRadian(t1, center))
            const endAngle = radianToAngle(getTwoPointsRadian(t2, center))
            lines.push({
              type: 'arc',
              curve: {
                x: center.x,
                y: center.y,
                startAngle,
                endAngle,
                r: command.radius,
                counterclockwise: p2Direction > 0,
              }
            })
          }
        }
      }
    } else if (command.type === 'ellipseArc') {
      if (last) {
        const ellipse = getEllipseArcByStartEnd(last, command.rx, command.ry, command.angle, command.largeArc, command.sweep, command.to)
        if (ellipse) {
          lines.push({
            type: 'ellipse arc',
            curve: ellipse
          })
        }
      }
      last = command.to
    } else if (command.type === 'bezierCurve') {
      if (last) {
        lines.push({
          type: 'bezier curve',
          curve: {
            from: last,
            cp1: command.cp1,
            cp2: command.cp2,
            to: command.to,
          }
        })
      }
      last = command.to
    } else if (command.type === 'quadraticCurve') {
      if (last) {
        lines.push({
          type: 'quadratic curve',
          curve: {
            from: last,
            cp: command.cp,
            to: command.to,
          }
        })
      }
      last = command.to
    } else if (command.type === 'close') {
      if (lines.length > 0) {
        if (lines.length > 1) {
          if (lineStartPoint && last && !isSamePoint(lineStartPoint, last)) {
            lines.push([last, lineStartPoint])
          }
          result.push(lines)
        }
        lines = []
        lineStartPoint = undefined
      }
    }
  }
  if (lines.length > 0) {
    result.push(lines)
  }
  return result.map(r => optimizeGeometryLines(r))
}

export function geometryLineToPathCommands(lines: GeometryLine[]): PathCommand[] {
  const result: PathCommand[] = []
  let first: Position | undefined
  let last: Position | undefined
  for (let i = 0; i < lines.length; i++) {
    const n = lines[i]
    const { start, end } = getGeometryLineStartAndEnd(n)
    if (i === 0) {
      first = start
    }
    if (!start || !end) continue
    if (!last || !isSamePoint(last, start, delta2)) {
      result.push({ type: 'move', to: start })
    }
    if (Array.isArray(n)) {
      result.push({ type: 'line', to: end })
    } else if (n.type === 'arc') {
      const p = getArcControlPoint(n.curve)
      if (p) {
        result.push({ type: 'arc', from: p, to: end, radius: n.curve.r })
      }
    } else if (n.type === 'ellipse arc') {
      const largeArc = getLargeArc(n.curve)
      result.push({ type: 'ellipseArc', to: end, rx: n.curve.rx, ry: n.curve.ry, angle: n.curve.angle || 0, sweep: !n.curve.counterclockwise, largeArc })
    } else if (n.type === 'quadratic curve') {
      result.push({ type: 'quadraticCurve', cp: n.curve.cp, to: n.curve.to })
    } else if (n.type === 'bezier curve') {
      result.push({ type: 'bezierCurve', cp1: n.curve.cp1, cp2: n.curve.cp2, to: n.curve.to })
    }
    last = end
  }
  if (first && last && isSamePoint(first, last)) {
    result.push({ type: 'close' })
  }
  return result
}
