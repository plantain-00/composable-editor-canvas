import { Position, rotatePositionByCenter } from "./position"
import { GeneralFormLine, pointIsOnRay } from "./line"
import { getSymmetryPoint } from "./line"
import { EllipseArc, arcToEllipseArc, getEllipseAngle, getEllipseArcPointAtAngle, getEllipseCenter, pointIsOnEllipse } from "./ellipse"
import { Arc, getCircleRadian, pointIsOnCircle } from "./circle"
import { Ellipse } from "./ellipse"
import { GeometryLine } from "./geometry-line"
import { angleToRadian, getTwoPointsRadian, radianToAngle } from "./radian"
import { equals, EXTENDED, isZero, mirrorNumber } from "./math"
import { calculateEquation2 } from "./equation-calculater"
import { pointIsOnBezierCurve, pointIsOnQuadraticCurve } from "./bezier"
import { Parabola, ParabolaSegment } from "./parabola"
import { getHyperbolaParamAtPoint, Hyperbola, HyperbolaSegment, pointIsOnHyperbola } from "./hyperbola"

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
  } else if (line.type === 'hyperbola curve') {
    movePoint(line.curve, offset)
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

export function rotateParabola(curve: Parabola, center: Position, angle: number) {
  rotatePoint(curve, center, angle)
  curve.angle += angle
}

export function rotateHyperbola(curve: Hyperbola, center: Position, angle: number) {
  rotatePoint(curve, center, angle)
  curve.angle += angle
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
  } else if (line.type === 'hyperbola curve') {
    rotateHyperbola(line.curve, center, angle)
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
  const startAngle = mirrorNumber(arc.endAngle, angle)
  const endAngle = mirrorNumber(arc.startAngle, angle)
  arc.startAngle = startAngle
  arc.endAngle = endAngle
}

export function mirrorEllipse(ellipse: Ellipse, line: GeneralFormLine, angle: number) {
  const p = mirrorPoint(getEllipseCenter(ellipse), line)
  ellipse.cx = p.x
  ellipse.cy = p.y
  ellipse.angle = mirrorNumber(ellipse.angle ?? 0, angle)
}

export function mirrorEllipseArc(ellipseArc: EllipseArc, line: GeneralFormLine, angle: number) {
  const p = mirrorPoint(getEllipseCenter(ellipseArc), line)
  ellipseArc.cx = p.x
  ellipseArc.cy = p.y
  const oldAngle = ellipseArc.angle ?? 0
  const newAngle = mirrorNumber(oldAngle, angle)
  ellipseArc.angle = newAngle
  const startAngle = mirrorNumber(ellipseArc.endAngle + oldAngle, angle)
  const endAngle = mirrorNumber(ellipseArc.startAngle + oldAngle, angle)
  ellipseArc.startAngle = startAngle - newAngle
  ellipseArc.endAngle = endAngle - newAngle
}

export function mirrorParabola(curve: ParabolaSegment, line: GeneralFormLine, angle: number) {
  mirrorPoint(curve, line)
  curve.angle = mirrorNumber(curve.angle, angle)
  curve.t1 *= -1
  curve.t2 *= -1
}

export function mirrorHyperbola(curve: HyperbolaSegment, line: GeneralFormLine, angle: number) {
  mirrorPoint(curve, line)
  curve.angle = mirrorNumber(curve.angle, angle)
  curve.t1 *= -1
  curve.t2 *= -1
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
  } else if (content.type === 'hyperbola curve') {
    mirrorHyperbola(content.curve, line, angle)
  } else if (content.type === 'nurbs curve') {
    for (const point of content.curve.points) {
      mirrorPoint(point, line)
    }
  }
}

export function scalePoint(point: Position, center: Position, sx: number, sy = sx) {
  point.x = (point.x - center.x) * sx + center.x
  point.y = (point.y - center.y) * sy + center.y
}

export function scaleEllipse(ellipse: Ellipse, center: Position, sx: number, sy = sx) {
  ellipse.cx = (ellipse.cx - center.x) * sx + center.x
  ellipse.cy = (ellipse.cy - center.y) * sy + center.y
  if (equals(sx, sy)) {
    ellipse.rx *= Math.abs(sx)
    ellipse.ry *= Math.abs(sy)
    return
  }
  const radian = angleToRadian(ellipse.angle)
  const d1 = Math.sin(radian)
  if (isZero(d1)) {
    ellipse.rx *= Math.abs(sx)
    ellipse.ry *= Math.abs(sy)
    return
  }
  const d2 = Math.cos(radian)
  if (isZero(d2)) {
    ellipse.rx *= Math.abs(sy)
    ellipse.ry *= Math.abs(sx)
    return
  }
  // (d2 x + d1 y)^2/rx/rx + (-d1 x + d2 y)^2/ry/ry = 1
  // let u = x sx, v = y sy
  // replace x,y with u,v: (d2 u/sx + d1 v/sy)^2/rx/rx + (-d1 u/sx + d2 v/sy)^2/ry/ry = 1
  const g1 = d2 / sx / ellipse.rx, g2 = d1 / sy / ellipse.rx, g3 = -d1 / sx / ellipse.ry, g4 = d2 / sy / ellipse.ry
  // (g1 u + g2 v)^2 + (g3 u + g4 v)^2 = 1
  // expand, group by u,v: (g1 g1 + g3 g3) u u + (2 g1 g2 + 2 g3 g4) v u + (g2 g2 + g4 g4) v v - 1 = 0
  const g5 = g1 * g1 + g3 * g3, g6 = g1 * g2 + g3 * g4, g7 = g2 * g2 + g4 * g4
  // F0: g5 u u + 2 g6 v u + g7 v v - 1 = 0
  // let f1 = Math.sin(t), f2 = Math.cos(t)
  // (f2 u + f1 v)^2/ru/ru + (-f1 u + f2 v)^2/rv/rv = 1
  // let m = 1/ru/ru, n = 1/rv/rv
  // (f2 u + f1 v)^2 m + (-f1 u + f2 v)^2 n = 1
  // expand, group by u, v: (f2 f2 m + f1 f1 n) u u + (2 f1 f2 m + -2 f1 f2 n) v u + (f1 f1 m + f2 f2 n) v v - 1 = 0
  // F1: f2 f2 m + f1 f1 n = g5
  // F2: f1 f2 m - f1 f2 n = g6
  // F3: f1 f1 m + f2 f2 n = g7
  // F1*f2*f2-F3*f1*f1: m = (g5 f2 f2 - g7 f1 f1) / (f2 f2 f2 f2 - f1 f1 f1 f1)
  // F3*f2*f2-F1*f1*f1: n = (g7 f2 f2 - g5 f1 f1) / (f2 f2 f2 f2 - f1 f1 f1 f1)
  // f2 f2 f2 f2 - f1 f1 f1 f1 = (f2 f2 + f1 f1)(f2 f2 - f1 f1) = f2 f2 - f1 f1
  // m = (g5 f2 f2 - g7 f1 f1) / (f2 f2 - f1 f1)
  // n = (g7 f2 f2 - g5 f1 f1) / (f2 f2 - f1 f1)
  // F2*(f2 f2 - f1 f1) replace m,n: f1 f2 (g5 f2 f2 - g7 f1 f1) - f1 f2 (g7 f2 f2 - g5 f1 f1) - g6(f2 f2 - f1 f1) = 0
  // (g5 - g7) f2 f1 f1 f1 + g6 f1 f1 + (g5 - g7) f2 f2 f2 f1 + -f2 f2 g6 = 0
  // (g5 - g7) f2 f1 + g6 f1 f1 - f2 f2 g6 = 0
  // /f2/f2: (g5 - g7) f1/f2 + g6 f1 f1/f2/f2 - g6 = 0
  // let f3 = f1/f2
  // g6 f3 f3 + (g5 - g7) f3 - g6 = 0
  const t = Math.atan(calculateEquation2(g6, g5 - g7, -g6)[0])
  ellipse.angle = radianToAngle(t)
  const f1 = Math.sin(t), f2 = Math.cos(t)
  // ru = sqrt((f2 f2 - f1 f1) / (g5 f2 f2 - g7 f1 f1))
  // rv = sqrt((f2 f2 - f1 f1) / (g7 f2 f2 - g5 f1 f1))
  ellipse.rx = Math.sqrt((f2 * f2 - f1 * f1) / (g5 * f2 * f2 - g7 * f1 * f1))
  ellipse.ry = Math.sqrt((f2 * f2 - f1 * f1) / (g7 * f2 * f2 - g5 * f1 * f1))
}

export function scaleEllipseArc(ellipse: EllipseArc, center: Position, sx: number, sy = sx) {
  const start = getEllipseArcPointAtAngle(ellipse, ellipse.startAngle)
  const end = getEllipseArcPointAtAngle(ellipse, ellipse.endAngle)
  scalePoint(start, center, sx, sy)
  scalePoint(end, center, sx, sy)
  scaleEllipse(ellipse, center, sx, sy)
  ellipse.startAngle = getEllipseAngle(start, ellipse)
  ellipse.endAngle = getEllipseAngle(end, ellipse)
}

export function scaleGeometryLine(line: GeometryLine, center: Position, sx: number, sy = sx): GeometryLine | void {
  if (Array.isArray(line)) {
    scalePoint(line[0], center, sx, sy)
    scalePoint(line[1], center, sx, sy)
  } else if (line.type === 'arc') {
    if (sx === sy || isZero(sx + sy)) {
      scalePoint(line.curve, center, sx, sy)
      line.curve.r *= Math.abs(sx)
    } else {
      const ellipse = arcToEllipseArc(line.curve)
      scaleEllipseArc(ellipse, center, sx, sy)
      return { type: 'ellipse arc', curve: ellipse }
    }
  } else if (line.type === 'ellipse arc') {
    scaleEllipseArc(line.curve, center, sx, sy)
  } else if (line.type === 'quadratic curve') {
    scalePoint(line.curve.from, center, sx, sy)
    scalePoint(line.curve.cp, center, sx, sy)
    scalePoint(line.curve.to, center, sx, sy)
  } else if (line.type === 'bezier curve') {
    scalePoint(line.curve.from, center, sx, sy)
    scalePoint(line.curve.cp1, center, sx, sy)
    scalePoint(line.curve.cp2, center, sx, sy)
    scalePoint(line.curve.to, center, sx, sy)
  } else if (line.type === 'hyperbola curve') {
    scalePoint(line.curve, center, sx, sy)
  } else if (line.type === 'nurbs curve') {
    for (const point of line.curve.points) {
      scalePoint(point, center, sx, sy)
    }
  }
}

export function scaleGeometryLines(lines: GeometryLine[], center: Position, sx: number, sy = sx) {
  for (let i = 0; i < lines.length; i++) {
    const line = scaleGeometryLine(lines[i], center, sx, sy)
    if (line) {
      lines[i] = line
    }
  }
}

export function skewPoint(point: Position, center: Position, sx: number, sy = 0) {
  const { x, y } = point
  if (sx) {
    point.x += (y - center.y) * sx
  }
  if (sy) {
    point.y += (x - center.x) * sy
  }
}

export function skewEllipse(ellipse: Ellipse, center: Position, sx: number, sy = 0) {
  const d3 = 1 - sx * sy
  if (isZero(d3)) return
  const { cx, cy } = ellipse
  ellipse.cx += (cy - center.y) * sx
  ellipse.cy += (cx - center.x) * sy
  const radian = angleToRadian(ellipse.angle)
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  // (d2 x + d1 y)^2/rx/rx + (-d1 x + d2 y)^2/ry/ry = 1
  // let u = x + y sx, v = y + x sy
  // x = (u - v sx)/(1 - sx sy), y = (v - u sy)/(1 - sx sy)
  // replace x,y with u,v: (d2 (u - v sx)/d3 + d1 (v - u sy)/d3))^2/rx/rx + (-d1 (u - v sx)/d3 + d2 (v - u sy)/d3)^2/ry/ry = 1
  const g1 = (d2 - d1 * sy) / d3 / ellipse.rx, g2 = (d1 - d2 * sx) / d3 / ellipse.rx, g3 = -(d1 + d2 * sy) / d3 / ellipse.ry, g4 = (d1 * sx + d2) / d3 / ellipse.ry
  // (g1 u + g2 v)^2 + (g3 u + g4 v)^2 = 1
  // expand, group by u,v: (g1 g1 + g3 g3) u u + (2 g1 g2 + 2 g3 g4) v u + (g2 g2 + g4 g4) v v - 1 = 0
  const g5 = g1 * g1 + g3 * g3, g6 = g1 * g2 + g3 * g4, g7 = g2 * g2 + g4 * g4
  // F0: g5 u u + 2 g6 v u + g7 v v - 1 = 0
  // let f1 = Math.sin(t), f2 = Math.cos(t)
  // (f2 u + f1 v)^2/ru/ru + (-f1 u + f2 v)^2/rv/rv = 1
  // let m = 1/ru/ru, n = 1/rv/rv
  // (f2 u + f1 v)^2 m + (-f1 u + f2 v)^2 n = 1
  // expand, group by u, v: (f2 f2 m + f1 f1 n) u u + (2 f1 f2 m + -2 f1 f2 n) v u + (f1 f1 m + f2 f2 n) v v - 1 = 0
  // F1: f2 f2 m + f1 f1 n = g5
  // F2: f1 f2 m - f1 f2 n = g6
  // F3: f1 f1 m + f2 f2 n = g7
  // F1*f2*f2-F3*f1*f1: m = (g5 f2 f2 - g7 f1 f1) / (f2 f2 f2 f2 - f1 f1 f1 f1)
  // F3*f2*f2-F1*f1*f1: n = (g7 f2 f2 - g5 f1 f1) / (f2 f2 f2 f2 - f1 f1 f1 f1)
  // f2 f2 f2 f2 - f1 f1 f1 f1 = (f2 f2 + f1 f1)(f2 f2 - f1 f1) = f2 f2 - f1 f1
  // m = (g5 f2 f2 - g7 f1 f1) / (f2 f2 - f1 f1)
  // n = (g7 f2 f2 - g5 f1 f1) / (f2 f2 - f1 f1)
  // F2*(f2 f2 - f1 f1) replace m,n: f1 f2 (g5 f2 f2 - g7 f1 f1) - f1 f2 (g7 f2 f2 - g5 f1 f1) - g6(f2 f2 - f1 f1) = 0
  // (g5 - g7) f2 f1 f1 f1 + g6 f1 f1 + (g5 - g7) f2 f2 f2 f1 + -f2 f2 g6 = 0
  // (g5 - g7) f2 f1 + g6 f1 f1 - f2 f2 g6 = 0
  // /f2/f2: (g5 - g7) f1/f2 + g6 f1 f1/f2/f2 - g6 = 0
  // let f3 = f1/f2
  // g6 f3 f3 + (g5 - g7) f3 - g6 = 0
  const t = Math.atan(calculateEquation2(g6, g5 - g7, -g6)[0])
  ellipse.angle = radianToAngle(t)
  const f1 = Math.sin(t), f2 = Math.cos(t)
  // ru = sqrt((f2 f2 - f1 f1) / (g5 f2 f2 - g7 f1 f1))
  // rv = sqrt((f2 f2 - f1 f1) / (g7 f2 f2 - g5 f1 f1))
  ellipse.rx = Math.sqrt((f2 * f2 - f1 * f1) / (g5 * f2 * f2 - g7 * f1 * f1))
  ellipse.ry = Math.sqrt((f2 * f2 - f1 * f1) / (g7 * f2 * f2 - g5 * f1 * f1))
}

export function skewEllipseArc(ellipse: EllipseArc, center: Position, sx: number, sy = 0) {
  const start = getEllipseArcPointAtAngle(ellipse, ellipse.startAngle)
  const end = getEllipseArcPointAtAngle(ellipse, ellipse.endAngle)
  skewPoint(start, center, sx, sy)
  skewPoint(end, center, sx, sy)
  skewEllipse(ellipse, center, sx, sy)
  ellipse.startAngle = getEllipseAngle(start, ellipse)
  ellipse.endAngle = getEllipseAngle(end, ellipse)
}

export function skewGeometryLine(line: GeometryLine, center: Position, sx: number, sy = 0): GeometryLine | void {
  if (Array.isArray(line)) {
    skewPoint(line[0], center, sx, sy)
    skewPoint(line[1], center, sx, sy)
  } else if (line.type === 'arc') {
    const ellipse = arcToEllipseArc(line.curve)
    skewEllipseArc(ellipse, center, sx, sy)
    return { type: 'ellipse arc', curve: ellipse }
  } else if (line.type === 'ellipse arc') {
    skewEllipseArc(line.curve, center, sx, sy)
  } else if (line.type === 'quadratic curve') {
    skewPoint(line.curve.from, center, sx, sy)
    skewPoint(line.curve.cp, center, sx, sy)
    skewPoint(line.curve.to, center, sx, sy)
  } else if (line.type === 'bezier curve') {
    skewPoint(line.curve.from, center, sx, sy)
    skewPoint(line.curve.cp1, center, sx, sy)
    skewPoint(line.curve.cp2, center, sx, sy)
    skewPoint(line.curve.to, center, sx, sy)
  } else if (line.type === 'hyperbola curve') {
    skewPoint(line.curve, center, sx, sy)
  } else if (line.type === 'nurbs curve') {
    for (const point of line.curve.points) {
      skewPoint(point, center, sx, sy)
    }
  }
}

export function skewGeometryLines(lines: GeometryLine[], center: Position, sx: number, sy = 0) {
  for (let i = 0; i < lines.length; i++) {
    const line = skewGeometryLine(lines[i], center, sx, sy)
    if (line) {
      lines[i] = line
    }
  }
}

export function extendGeometryLines(lines: GeometryLine[], point: Position) {
  const first = lines[0], last = lines[lines.length - 1]
  if (Array.isArray(first)) {
    if (pointIsOnRay(point, { ...first[0], angle: radianToAngle(getTwoPointsRadian(...first)) })) {
      first[0] = point
    }
  } else if (first.type === 'arc') {
    if (pointIsOnCircle(point, first.curve)) {
      first.curve.startAngle = radianToAngle(getCircleRadian(point, first.curve))
    }
  } else if (first.type === 'ellipse arc') {
    if (pointIsOnEllipse(point, first.curve)) {
      first.curve.startAngle = getEllipseAngle(point, first.curve)
    }
  } else if (first.type === 'quadratic curve') {
    if (pointIsOnQuadraticCurve(point, first.curve, EXTENDED)) {
      first.curve.from = point
    }
  } else if (first.type === 'bezier curve') {
    if (pointIsOnBezierCurve(point, first.curve, EXTENDED)) {
      first.curve.from = point
    }
  } else if (first.type === 'hyperbola curve') {
    if (pointIsOnHyperbola(point, first.curve)) {
      first.curve.t1 = getHyperbolaParamAtPoint(first.curve, point)
    }
  }
  if (Array.isArray(last)) {
    if (pointIsOnRay(point, { ...last[1], angle: radianToAngle(getTwoPointsRadian(last[1], last[0])) })) {
      last[1] = point
    }
  } else if (last.type === 'arc') {
    if (pointIsOnCircle(point, last.curve)) {
      last.curve.endAngle = radianToAngle(getCircleRadian(point, last.curve))
    }
  } else if (last.type === 'ellipse arc') {
    if (pointIsOnEllipse(point, last.curve)) {
      last.curve.endAngle = getEllipseAngle(point, last.curve)
    }
  } else if (last.type === 'quadratic curve') {
    if (pointIsOnQuadraticCurve(point, last.curve, EXTENDED)) {
      last.curve.to = point
    }
  } else if (last.type === 'bezier curve') {
    if (pointIsOnBezierCurve(point, last.curve, EXTENDED)) {
      last.curve.to = point
    }
  } else if (last.type === 'hyperbola curve') {
    if (pointIsOnHyperbola(point, last.curve)) {
      last.curve.t2 = getHyperbolaParamAtPoint(last.curve, point)
    }
  }
}
