import { Ellipse, Position } from "./geometry"
import { GeometryLine } from "./intersection"

export function movePoint(point: Position, offset: Position) {
  point.x += offset.x
  point.y += offset.y
}

export function moveEllipse(ellipse: Ellipse, offset: Position) {
  ellipse.cx += offset.x
  ellipse.cy += offset.y
}

export function moveGeometryLine(line: GeometryLine, offset: Position) {
  if (Array.isArray(line)) {
    movePoint(line[0], offset)
    movePoint(line[1], offset)
  } else if (line.type === 'arc') {
    movePoint(line.curve, offset)
  } else if (line.type === 'ellipse arc') {
    moveEllipse(line.curve, offset)
  } else if (line.type === 'quadratic curve') {
    movePoint(line.curve.from, offset)
    movePoint(line.curve.cp, offset)
    movePoint(line.curve.to, offset)
  } else if (line.type === 'bezier curve') {
    movePoint(line.curve.from, offset)
    movePoint(line.curve.cp1, offset)
    movePoint(line.curve.cp2, offset)
    movePoint(line.curve.to, offset)
  } else if (line.type === 'nurbs curve') {
    for (const point of line.curve.points) {
      movePoint(point, offset)
    }
  }
}
