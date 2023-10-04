import { calculateEquation4 } from "./equation-calculater"
import { Arc, Circle, Ellipse, EllipseArc, getTwoCircleIntersectionPoints, getTwoGeometryLinesIntersectionPoint, isZero, pointIsOnArc, pointIsOnEllipseArc, pointIsOnLineSegment, Position } from "./geometry"
import { angleToRadian } from "./radian"
import { Nullable } from "./types"

/**
 * @public
 */
export function* iterateIntersectionPoints<T>(
  content1: T,
  content2: T,
  contents: readonly Nullable<T>[],
  getModel: (content: T) => {
    getGeometries?: (content: T, contents: readonly Nullable<T>[]) => { lines: GeometryLine[] },
  } | undefined,
) {
  const model1 = getModel(content1)
  const model2 = getModel(content2)
  if (model1 && model2) {
    if (model1.getGeometries && model2.getGeometries) {
      for (const line1 of model1.getGeometries(content1, contents).lines) {
        for (const line2 of model2.getGeometries(content2, contents).lines) {
          yield* getTwoGeometryLinesIntersectionPoint(line1, line2)
        }
      }
    }
  }
}

export type GeometryLine = [Position, Position]
  | { type: 'arc', arc: Arc }
  | { type: 'ellipse arc', ellipseArc: EllipseArc }

export function getLineEllipseIntersectionPoints({ x: x1, y: y1 }: Position, { x: x2, y: y2 }: Position, { rx, ry, cx, cy, angle }: Ellipse) {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  // let u = x - cx, v = y - cy
  const i1 = rx * rx, i2 = ry * ry
  // (d2 u + d1 v)^2/i1 + (-d1 u + d2 v)^2/i2 = 1
  // i2(d2 u + d1 v)^2 + i1(-d1 u + d2 v)^2 - i1 i2 = 0
  // group v, F1: (d2 d2 i1 + d1 d1 i2) v v + (-2 d1 d2 i1 u + 2 d1 d2 i2 u) v + d1 d1 i1 u u + d2 d2 i2 u u + -i1 i2

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const e1 = x2 - x1, e2 = y2 - y1
  // (u + cx - x1) / e1 = (v + cy - y1)/ e2
  const h1 = cx - x1, h2 = cy - y1
  // e2 (u + h1) = e1 (v + h2)
  // group v: e1 v = e2 u + e2 h1 - e1 h2
  const f1 = e2 * h1 - e1 * h2
  // F2: v = (e2 u + f1) / e1
  // F1 replace v, *e1 e1, group u: (d1 d1 e1 e1 i1 + -2 d1 d2 e1 e2 i1 + d2 d2 e2 e2 i1 + d2 d2 e1 e1 i2 + 2 d1 d2 e1 e2 i2 + d1 d1 e2 e2 i2) u u + (-2 d1 d2 e1 f1 i1 + 2 d2 d2 e2 f1 i1 + 2 d1 d2 e1 f1 i2 + 2 d1 d1 e2 f1 i2) u + d2 d2 f1 f1 i1 + d1 d1 f1 f1 i2 + -e1 e1 i1 i2 = 0
  // a = d1 d1 e1 e1 i1 + -2 d1 d2 e1 e2 i1 + d2 d2 e2 e2 i1 + d2 d2 e1 e1 i2 + 2 d1 d2 e1 e2 i2 + d1 d1 e2 e2 i2
  // a = (d1 d1 e1 e1 + -2 d1 d2 e1 e2 + d2 d2 e2 e2) i1 + (d2 d2 e1 e1 + 2 d1 d2 e1 e2 + d1 d1 e2 e2) i2
  // a = (d1 e1 - d2 e2)^2 i1 + (d2 e1 + d1 e2)^2 i2
  const f2 = d2 * e1 + d1 * e2, f3 = d2 * e2 - d1 * e1
  // a = f3 f3 i1 + f2 f2 i2
  const k1 = i2 * f2, k2 = i1 * f3
  // a = f3 k2 + f2 k1
  const a = k1 * f2 + k2 * f3
  // b = -2 d1 d2 e1 f1 i1 + 2 d2 d2 e2 f1 i1 + 2 d1 d2 e1 f1 i2 + 2 d1 d1 e2 f1 i2
  // /2/f1, b = 2 f1 (-d1 d2 e1 i1 + d2 d2 e2 i1 + d1 d2 e1 i2 + d1 d1 e2 i2)
  // b = 2 f1 ((d2 e2 - d1 e1) d2 i1 + (d2 e1 + d1 e2) d1 i2)
  // b = 2 f1 (f3 d2 i1 + f2 d1 i2)
  // b = 2 f1 (d2 k2 + d1 k1)
  // c = d2 d2 f1 f1 i1 + d1 d1 f1 f1 i2 + -e1 e1 i1 i2

  // (bb - 4ac)/4/i1/i2/e1/e1 = -d1 d1 d1 d1 f1 f1 + -2 d1 d1 d2 d2 f1 f1 + -d2 d2 d2 d2 f1 f1 + a
  // (bb - 4ac)/4/i1/i2/e1/e1 = -(d1 d1 + d2 d2)^2 f1 f1 + a = a - f1 f1
  const t = a - f1 * f1
  // bb - 4ac = 4e1 e1 i1 i2 t
  if (t < 0 && !isZero(t)) {
    return []
  }
  // u = -b/2/a = -2 f1 (d2 k2 + d1 k1)/2/a
  // u = -f1 (k1 d1 + k2 d2)/a
  // x = u + cx = cx - f1 (k1 d1 + k2 d2)/a
  const i = cx - f1 * (k1 * d1 + k2 * d2) / a
  // F2 replace u, /f1*a: v = f1 (-e2 (k1 d1 + k2 d2) + a) / e1 / a
  // replace a: v = f1 (-e2 k1 d1 - e2 k2 d2 + f3 k2 + f2 k1) / e1 / a
  // replace f2, replace f3, /e1: f1 (d2 k1 + -d1 k2) / a
  // y = v + cy = cy + f1(k1 d2 - k2 d1)/a
  const j = cy + f1 * (k1 * d2 - k2 * d1) / a
  if (isZero(t)) {
    return [
      {
        x: i,
        y: j,
      }
    ]
  }
  const n = Math.sqrt(t)
  // sqrt(bb - 4ac)/2/a = sqrt(4e1 e1 i1 i2 t)/2/a = 2 e1 rx ry n/2/a = e1 rx ry n/a
  const r = rx * ry * n / a
  const p = e1 * r
  // F2 replace u: v = (e2(x - cx) + f1)/e1
  // replace x with i + p: v = (e2(cx - f1 (k1 d1 + k2 d2) / a + e1 rx ry n/a - cx) + f1)/e1
  // *a e1: v = (-d1 e2 f1 k1 + -d2 e2 f1 k2 + e1 e2 n rx ry + a f1)/e1/a
  // replace a: v = (-d1 e2 f1 k1 + -d2 e2 f1 k2 + f1 f2 k1 + f1 f3 k2 + e1 e2 n rx ry)/e1/a
  // replace f2, replace f3, /e1: v = (d2 f1 k1 + -d1 f1 k2 + e2 n rx ry)/a
  // v = (f1(d2 k1 + -d1 k2) + e2 n rx ry)/a
  // y = v + cy = cy + (f1(d2 k1 + -d1 k2) + e2 n rx ry)/a
  // y = cy + f1(d2 k1 + -d1 k2)/a + e2 n rx ry/a
  // y = j + e2 r
  const q = e2 * r
  return [
    {
      x: i + p,
      y: j + q,
    },
    {
      x: i - p,
      y: j - q,
    },
  ]
}

export function getLineSegmentEllipseIntersectionPoints(start: Position, end: Position, ellipse: Ellipse) {
  return getLineEllipseIntersectionPoints(start, end, ellipse).filter((p) => pointIsOnLineSegment(p, start, end))
}

export function getLineSegmentEllipseArcIntersectionPoints(start: Position, end: Position, ellipseArc: EllipseArc) {
  return getLineSegmentEllipseIntersectionPoints(start, end, ellipseArc).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getCircleEllipseIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { rx, ry, cx, cy, angle }: Ellipse) {
  if (isZero(rx - ry)) {
    return getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }, { x: cx, y: cy, r: rx })
  }
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian), d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - cy))^2/ry/ry = 1
  const i1 = 1 / rx / rx, i2 = 1 / ry / ry
  // let u = x - cx, v = y - cy
  // (d2 u + d1 v)^2 i1 + (-d1 u + d2 v)^2 i2 - 1 = 0
  // group v: (d1 d1 i1 + d2 d2 i2) v v + (2 d1 d2 i1 u + -2 d1 d2 i2 u) v + d2 d2 i1 u u + d1 d1 i2 u u + -1 = 0
  const g1 = d1 * d1 * i1 + d2 * d2 * i2, g2 = (2 * d1 * d2 * i1 - 2 * d1 * d2 * i2) / g1
  const g3 = (d2 * d2 * i1 + d1 * d1 * i2) / g1, g4 = -1 / g1
  // F1: v v + g2 u v + g3 u u + g4 = 0

  const m = r1 ** 2
  // (x - x1)^2 + (y - y1)^2 = m
  // (u + cx - x1)^2 + (v + cy - y1)^2 - m = 0
  const e1 = cx - x1
  const e2 = cy - y1
  // (u + e1)^2 + (v + e2)^2 - m = 0
  // group v: v v + 2 e2 v + e1 e1 + e2 e2 + 2 e1 u + -m + u u = 0
  const g5 = e1 * e1 + e2 * e2 - m
  // v v + 2 e2 v + g5 + 2 e1 u + u u = 0

  // -F1, group v: (2 e2 + -g2 u) v + -g4 + g5 + 2 e1 u + u u + -g3 u u = 0
  // let w = 2 e2 + -g2 u
  const h1 = 1 - g3, h2 = -g4 + g5
  // w v + h2 + 2 e1 u + h1 u u = 0
  // v = -(h2 + 2 e1 u + h1 u u) / w

  // F1 replace v, *w w, replace w, group u: (g2 g2 h1 + g2 g2 g3 + h1 h1) u u u u + (-2 e2 g2 h1 + 2 e1 g2 g2 + -4 e2 g2 g3 + 4 e1 h1) u u u + (-4 e1 e2 g2 + 4 e2 e2 g3 + 4 e1 e1 + g2 g2 g4 + 2 h1 h2 + g2 g2 h2) u u + (4 e1 h2 + -4 e2 g2 g4 + -2 e2 g2 h2) u + h2 h2 + 4 e2 e2 g4 = 0
  const a = g2 * g2 * h1 + g2 * g2 * g3 + h1 * h1
  const b = -2 * e2 * g2 * h1 + 2 * e1 * g2 * g2 + -4 * e2 * g2 * g3 + 4 * e1 * h1
  const c = -4 * e1 * e2 * g2 + 4 * e2 * e2 * g3 + 4 * e1 * e1 + g2 * g2 * g4 + 2 * h1 * h2 + g2 * g2 * h2
  const d = 4 * e1 * h2 + -4 * e2 * g2 * g4 + -2 * e2 * g2 * h2
  const e = h2 * h2 + 4 * e2 * e2 * g4

  const us = calculateEquation4(a, b, c, d, e)
  return us.map(u => {
    const v = -(h2 + 2 * e1 * u + h1 * u * u) / (2 * e2 - g2 * u)
    return {
      x: u + cx,
      y: v + cy,
    }
  })
}

export function getArcEllipseIntersectionPoints(arc: Arc, ellipse: Ellipse) {
  return getCircleEllipseIntersectionPoints(arc, ellipse).filter((p) => pointIsOnArc(p, arc))
}

export function getArcEllipseArcIntersectionPoints(arc: Arc, ellipseArc: EllipseArc) {
  return getArcEllipseIntersectionPoints(arc, ellipseArc).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getTwoEllipseIntersectionPoints({ rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 }: Ellipse, { rx: rx2, ry: ry2, cx: cx2, cy: cy2, angle: angle2 }: Ellipse) {
  if (isZero(rx1 - ry1)) {
    return getCircleEllipseIntersectionPoints({ x: cx1, y: cy1, r: rx1 }, { rx: rx2, ry: ry2, cx: cx2, cy: cy2, angle: angle2 })
  }
  if (isZero(rx2 - ry2)) {
    return getCircleEllipseIntersectionPoints({ x: cx2, y: cy2, r: rx2 }, { rx: rx1, ry: ry1, cx: cx1, cy: cy1, angle: angle1 })
  }
  const radian1 = angleToRadian(angle1), radian2 = angleToRadian(angle2)
  const a1 = Math.sin(radian1), a2 = Math.cos(radian1)
  const c1 = Math.sin(radian2), c2 = Math.cos(radian2)
  // (a2(x - cx1) + a1(y - cy1))^2/rx1/rx1 + (-a1(x - cx1) + a2(y - cy1))^2/ry1/ry1 = 1
  const b1 = 1 / rx1 / rx1, b2 = 1 / ry1 / ry1
  // let u = x - cx1, v = y - cy1
  // (a2 u + a1 v)^2 b1 + (-a1 u + a2 v)^2 b2 - 1 = 0
  // group v: (a1 a1 b1 + a2 a2 b2) v v + (2 a1 a2 b1 u + -2 a1 a2 b2 u) v + a2 a2 b1 u u + a1 a1 b2 u u + -1 = 0
  const b3 = a1 * a1 * b1 + a2 * a2 * b2, b4 = 2 * a1 * a2 * b1 / b3, b5 = 2 * a1 * a2 * b2 / b3, b6 = (a2 * a2 * b1 + a1 * a1 * b2) / b3, b7 = -1 / b3
  // F1: v v + (b4 u + -b5 u) v + b6 u u + b7 = 0

  // (c2(x - cx2) + c1(y - cy2))^2/rx2/rx2 + (-c1(x - cx2) + c2(y - ry2))^2/ry2/ry2 = 1
  const d1 = 1 / rx2 / rx2, d2 = 1 / ry2 / ry2
  // (c2(u + cx1 - cx2) + c1(v + cy1 - cy2))^2 d1 + (-c1(u + cx1 - cx2) + c2(v + cy1 - cy2))^2 d2 - 1 = 0
  const e1 = cx1 - cx2, e2 = cy1 - cy2
  // (c2(u + e1) + c1(v + e2))^2 d1 + (-c1(u + e1) + c2(v + e2))^2 d2 - 1 = 0
  // group v: (c1 c1 d1 + c2 c2 d2) v v + (2 c1 c2 d1 e1 + -2 c1 c2 d2 e1 + 2 c1 c1 d1 e2 + 2 c2 c2 d2 e2 + 2 c1 c2 d1 u + -2 c1 c2 d2 u) v + c2 c2 d1 e1 e1 + c1 c1 d2 e1 e1 + 2 c1 c2 d1 e1 e2 + -2 c1 c2 d2 e1 e2 + c1 c1 d1 e2 e2 + c2 c2 d2 e2 e2 + 2 c2 c2 d1 e1 u + 2 c1 c1 d2 e1 u + 2 c1 c2 d1 e2 u + -2 c1 c2 d2 e2 u + c2 c2 d1 u u + c1 c1 d2 u u + -1 = 0
  const c3 = c1 * c1 * d1 + c2 * c2 * d2, c4 = (2 * c1 * c2 * d1 * e1 - 2 * c1 * c2 * d2 * e1 + 2 * c1 * c1 * d1 * e2 + 2 * c2 * c2 * d2 * e2) / c3
  const c5 = (2 * c1 * c2 * d1 - 2 * c1 * c2 * d2) / c3, c6 = (c2 * c2 * d1 * e1 * e1 + c1 * c1 * d2 * e1 * e1 + 2 * c1 * c2 * d1 * e1 * e2 + -2 * c1 * c2 * d2 * e1 * e2 + c1 * c1 * d1 * e2 * e2 + c2 * c2 * d2 * e2 * e2 - 1) / c3
  const c7 = (2 * c2 * c2 * d1 * e1 + 2 * c1 * c1 * d2 * e1 + 2 * c1 * c2 * d1 * e2 - 2 * c1 * c2 * d2 * e2) / c3, c8 = (c2 * c2 * d1 + c1 * c1 * d2) / c3
  // v v + (c4 + c5 u) v + c6 + c7 u + c8 u u = 0

  // -F1, group v: (c5 u + b5 u + c4 + -b4 u) v + c7 u + -b6 u u + c8 u u + -b7 + c6 = 0
  const d3 = b5 + -b4 + c5, d4 = c8 - b6, d5 = -b7 + c6
  // (d3 u + c4) v + c7 u + d4 u u + d5 = 0
  // let w = d3 u + c4
  // v = -(c7 u + d4 u u + d5)/w
  // F1 replace v, *w w, replace w, group u: (b6 d3 d3 + b5 d3 d4 + d4 d4 + -b4 d3 d4) u u u u + (2 b6 c4 d3 + -b4 c7 d3 + 2 c7 d4 + b5 c7 d3 + -b4 c4 d4 + b5 c4 d4) u u u + (b6 c4 c4 + -b4 c4 c7 + b5 c4 c7 + b7 d3 d3 + c7 c7 + b5 d3 d5 + 2 d4 d5 + -b4 d3 d5) u u + (2 b7 c4 d3 + 2 c7 d5 + -b4 c4 d5 + b5 c4 d5) u + b7 c4 c4 + d5 d5 = 0
  const a = b6 * d3 * d3 + b5 * d3 * d4 + d4 * d4 + -b4 * d3 * d4
  const b = 2 * b6 * c4 * d3 + -b4 * c7 * d3 + 2 * c7 * d4 + b5 * c7 * d3 + -b4 * c4 * d4 + b5 * c4 * d4
  const c = b6 * c4 * c4 + -b4 * c4 * c7 + b5 * c4 * c7 + b7 * d3 * d3 + c7 * c7 + b5 * d3 * d5 + 2 * d4 * d5 + -b4 * d3 * d5
  const d = 2 * b7 * c4 * d3 + 2 * c7 * d5 + -b4 * c4 * d5 + b5 * c4 * d5
  const e = b7 * c4 * c4 + d5 * d5

  const us = calculateEquation4(a, b, c, d, e)
  return us.map(u => {
    const v = -(c7 * u + d4 * u * u + d5) / (d3 * u + c4)
    return {
      x: u + cx1,
      y: v + cy1,
    }
  })
}

export function getEllipseArcEllipseIntersectionPoints(ellipseArc: EllipseArc, ellipse: Ellipse) {
  return getTwoEllipseIntersectionPoints(ellipseArc, ellipse).filter((p) => pointIsOnEllipseArc(p, ellipseArc))
}

export function getTwoEllipseArcIntersectionPoints(ellipseArc1: EllipseArc, ellipseArc2: EllipseArc) {
  return getEllipseArcEllipseIntersectionPoints(ellipseArc1, ellipseArc2).filter((p) => pointIsOnEllipseArc(p, ellipseArc2))
}
