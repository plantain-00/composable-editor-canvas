import { Position, rotatePositionByCenter } from "./position"
import { GeneralFormLine } from "./line"
import { getSymmetryPoint } from "./line"
import { getEllipseCenter } from "./ellipse"
import { Arc, Circle } from "./circle"
import { Ellipse } from "./ellipse"
import { GeometryLine } from "./geometry-line"

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

export function rotatePoint(point: Position, center: Position, angle: number) {
  const p = rotatePositionByCenter(point, center, -angle)
  point.x = p.x
  point.y = p.y
  return p
}

export function rotateArc(arc: Arc, center: Position, angle: number) {
  rotatePoint(arc, center, angle)
  arc.startAngle += angle
  arc.endAngle += angle
}

export function rotateEllipse(ellipse: Ellipse, center: Position, angle: number) {
  const p = rotatePoint(getEllipseCenter(ellipse), center, angle)
  ellipse.cx = p.x
  ellipse.cy = p.y
  ellipse.angle = (ellipse.angle ?? 0) + angle
}

export function rotateGeometryLine(line: GeometryLine, center: Position, angle: number) {
  if (Array.isArray(line)) {
    rotatePoint(line[0], center, angle)
    rotatePoint(line[1], center, angle)
  } else if (line.type === 'arc') {
    rotateArc(line.curve, center, angle)
  } else if (line.type === 'ellipse arc') {
    rotateEllipse(line.curve, center, angle)
  } else if (line.type === 'quadratic curve') {
    rotatePoint(line.curve.from, center, angle)
    rotatePoint(line.curve.cp, center, angle)
    rotatePoint(line.curve.to, center, angle)
  } else if (line.type === 'bezier curve') {
    rotatePoint(line.curve.from, center, angle)
    rotatePoint(line.curve.cp1, center, angle)
    rotatePoint(line.curve.cp2, center, angle)
    rotatePoint(line.curve.to, center, angle)
  } else if (line.type === 'nurbs curve') {
    for (const point of line.curve.points) {
      rotatePoint(point, center, angle)
    }
  }
}

export function mirrorPoint(point: Position, line: GeneralFormLine) {
  const p = getSymmetryPoint(point, line)
  point.x = p.x
  point.y = p.y
  return p
}

export function mirrorArc(arc: Arc, line: GeneralFormLine, angle: number) {
  mirrorPoint(arc, line)
  const startAngle = 2 * angle - arc.endAngle
  const endAngle = 2 * angle - arc.startAngle
  arc.startAngle = startAngle
  arc.endAngle = endAngle
}

export function mirrorEllipse(ellipse: Ellipse, line: GeneralFormLine, angle: number) {
  const p = mirrorPoint(getEllipseCenter(ellipse), line)
  ellipse.cx = p.x
  ellipse.cy = p.y
  ellipse.angle = 2 * angle - (ellipse.angle ?? 0)
}

export function mirrorGeometryLine(content: GeometryLine, line: GeneralFormLine, angle: number) {
  if (Array.isArray(content)) {
    mirrorPoint(content[0], line)
    mirrorPoint(content[1], line)
  } else if (content.type === 'arc') {
    mirrorArc(content.curve, line, angle)
  } else if (content.type === 'ellipse arc') {
    mirrorEllipse(content.curve, line, angle)
  } else if (content.type === 'quadratic curve') {
    mirrorPoint(content.curve.from, line)
    mirrorPoint(content.curve.cp, line)
    mirrorPoint(content.curve.to, line)
  } else if (content.type === 'bezier curve') {
    mirrorPoint(content.curve.from, line)
    mirrorPoint(content.curve.cp1, line)
    mirrorPoint(content.curve.cp2, line)
    mirrorPoint(content.curve.to, line)
  } else if (content.type === 'nurbs curve') {
    for (const point of content.curve.points) {
      mirrorPoint(point, line)
    }
  }
}

export function scalePoint(point: Position, center: Position, scale: number) {
  point.x = (point.x - center.x) * scale + center.x
  point.y = (point.y - center.y) * scale + center.y
}

export function scaleCircle(circle: Circle, center: Position, scale: number) {
  scalePoint(circle, center, scale)
  circle.r *= scale
}

export function scaleEllipse(ellipse: Ellipse, center: Position, scale: number) {
  ellipse.cx = (ellipse.cx - center.x) * scale + center.x
  ellipse.cy = (ellipse.cy - center.y) * scale + center.y
  ellipse.rx *= scale
  ellipse.ry *= scale
}

export function scaleGeometryLine(line: GeometryLine, center: Position, scale: number) {
  if (Array.isArray(line)) {
    scalePoint(line[0], center, scale)
    scalePoint(line[1], center, scale)
  } else if (line.type === 'arc') {
    scaleCircle(line.curve, center, scale)
  } else if (line.type === 'ellipse arc') {
    scaleEllipse(line.curve, center, scale)
  } else if (line.type === 'quadratic curve') {
    scalePoint(line.curve.from, center, scale)
    scalePoint(line.curve.cp, center, scale)
    scalePoint(line.curve.to, center, scale)
  } else if (line.type === 'bezier curve') {
    scalePoint(line.curve.from, center, scale)
    scalePoint(line.curve.cp1, center, scale)
    scalePoint(line.curve.cp2, center, scale)
    scalePoint(line.curve.to, center, scale)
  } else if (line.type === 'nurbs curve') {
    for (const point of line.curve.points) {
      scalePoint(point, center, scale)
    }
  }
}
