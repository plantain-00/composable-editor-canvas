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

export type GeometryLine = [Position, Position] | { type: 'arc', arc: Arc }

export function getLineEllipseIntersectionPoints({ x: x1, y: y1 }: Position, { x: x2, y: y2 }: Position, { rx, ry, cx, cy, angle }: Ellipse) {
  const radian = angleToRadian(angle)
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - ry))^2/ry/ry = 1
  // let u = x - cx, v = y - cy
  // (d2 u + d1 v)^2/rx/rx + (-d1 u + d2 v)^2/ry/ry = 1
  const i1 = rx * rx
  const i2 = ry * ry
  // (d2 u + d1 v)^2/i1 + (-d1 u + d2 v)^2/i2 = 1
  // F1: i2(d2 u + d1 v)^2 + i1(-d1 u + d2 v)^2 = i1 i2

  // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1)
  const e1 = x2 - x1
  const e2 = y2 - y1
  // (u + cx - x1) / e1 = (v + cy - y1)/ e2
  // e2 (u + cx - x1) = e1 (v + cy - y1)
  const h1 = cx - x1
  const h2 = cy - y1
  // e2 (u + h1) = e1 (v + h2)
  // e2 u + e2 h1 = e1 v + e1 h2
  // e1 v = e2 u + e2 h1 - e1 h2
  const f1 = e2 * h1 - e1 * h2
  // F2: e1 v = e2 u + f1
  // F1*e1*e1: i2(d2 e1 u + d1 e1 v)^2 + i1(-d1 e1 u + d2 e1 v)^2 = i1 i2 e1 e1
  // i2(d2 e1 u + d1(e2 u + f1))^2 + i1(-d1 e1 u + d2(e2 u + f1))^2 = i1 i2 e1 e1
  // i2(d2 e1 u + d1 e2 u + d1 f1)^2 + i1(-d1 e1 u + d2 e2 u + d2 f1)^2 = i1 i2 e1 e1
  // i2((d2 e1 + d1 e2)u + d1 f1)^2 + i1((d2 e2 - d1 e1)u + d2 f1)^2 = i1 i2 e1 e1
  const f2 = d2 * e1 + d1 * e2
  const f3 = d2 * e2 - d1 * e1
  // i2(f2 u + d1 f1)^2 + i1(f3 u + d2 f1)^2 = i1 i2 e1 e1
  // i2(f2 f2 u^2 + 2 f2 u d1 f1 + d1 d1 f1 f1) + i1(f3 f3 u^2 + 2 f3 u d2 f1 + d2 d2 f1 f1) = i1 i2 e1 e1
  // i2 f2 f2 u^2 + 2 i2 f2 u d1 f1 + i2 d1 d1 f1 f1 + i1 f3 f3 u^2 + 2 i1 f3 u d2 f1 + i1 d2 d2 f1 f1 = i1 i2 e1 e1
  const k1 = i2 * f2
  const k2 = i1 * f3
  // k1 f2 u^2 + 2 k1 u d1 f1 + i2 d1 d1 f1 f1 + k2 f3 u^2 + 2 k2 u d2 f1 + i1 d2 d2 f1 f1 = i1 i2 e1 e1
  // (k1 f2 + k2 f3) u^2 + 2(k1 d1 f1 + k2 d2 f1)u + (i2 d1 d1 f1 f1 + i1 d2 d2 f1 f1 - i1 i2 e1 e1) = 0
  const k = k1 * f2 + k2 * f3
  // k u^2 + 2(k1 d1 f1 + k2 d2 f1)u + (i2 d1 d1 f1 f1 + i1 d2 d2 f1 f1 - i1 i2 e1 e1) = 0
  // a = k, b = 2(k1 d1 f1 + k2 d2 f1), c = i2 d1 d1 f1 f1 + i1 d2 d2 f1 f1 - i1 i2 e1 e1
  // bb - 4ac = 4(k1 d1 f1 + k2 d2 f1)^2 - 4k(i2 d1 d1 f1 f1 + i1 d2 d2 f1 f1 - i1 i2 e1 e1)
  // bb - 4ac = 4((k1 d1 f1 + k2 d2 f1)^2 - k(i2 d1 d1 f1 f1 + i1 d2 d2 f1 f1 - i1 i2 e1 e1))
  // bb - 4ac = 4(i2 k1 f2 d1 d1 f1 f1 + 2 k1 d1 d2 k2 f1 f1 + i1 k2 f3 d2 d2 f1 f1 - (k1 f2 i2 d1 d1 f1 f1 + k1 f2 i1 d2 d2 f1 f1 - k1 f2 i1 i2 e1 e1 + k2 f3 i2 d1 d1 f1 f1 + k2 f3 i1 d2 d2 f1 f1 - k2 f3 i1 i2 e1 e1))
  // bb - 4ac = 4(i2 k1 f2 d1 d1 f1 f1 + 2 k1 d1 d2 k2 f1 f1 + i1 k2 f3 d2 d2 f1 f1 - k1 f2 i2 d1 d1 f1 f1 - k1 f2 i1 d2 d2 f1 f1 + k1 f2 i1 i2 e1 e1 - k2 f3 i2 d1 d1 f1 f1 - k2 f3 i1 d2 d2 f1 f1 + k2 f3 i1 i2 e1 e1)
  // bb - 4ac = 4(f1 f1(i2 k1 f2 d1 d1 + 2 k1 d1 d2 k2 + i1 k2 f3 d2 d2 - i2 k1 f2 d1 d1 - k1 f2 i1 d2 d2 - k2 f3 i2 d1 d1 - k2 f3 i1 d2 d2) + i1 i2 e1 e1 k)
  // bb - 4ac = 4(f1 f1(2 k1 d1 d2 k2 - i1 k1 f2 d2 d2 - i1 i2 f3 f3 d1 d1) + i1 i2 e1 e1 k)
  // bb - 4ac = 4(f1 f1 i1 i2(2 d1 d2 f2 f3 - f2 f2 d2 d2 - f3 f3 d1 d1) + i1 i2 e1 e1 k)
  // bb - 4ac = 4(-f1 f1 i1 i2(f2 d2 - f3 d1)^2 + i1 i2 e1 e1 k)
  // bb - 4ac = 4(-f1 f1 i1 i2(d2 e1 d2 + d1 d2 e2 - d1 d2 e2  + d1 e1 d1)^2 + i1 i2 e1 e1 k)
  // bb - 4ac = 4(-f1 f1 i1 i2(d2 e1 d2  + d1 e1 d1)^2 + i1 i2 e1 e1 k)
  // bb - 4ac = 4(-f1 f1 i1 i2 e1 e1 (d2 d2  + d1 d1)^2 + i1 i2 e1 e1 k)
  // bb - 4ac = 4(-f1 f1 i1 i2 e1 e1 + i1 i2 e1 e1 k)
  // bb - 4ac = 4e1 e1 i1 i2(-f1 f1 + k)
  // bb - 4ac = 4e1 e1 i1 i2(k - f1 f1)
  const t = k - f1 * f1
  // bb - 4ac = 4e1 e1 i1 i2 t
  if (t < 0 && !isZero(t)) {
    return []
  }
  // u = -b/2/a = -2(k1 d1 f1 + k2 d2 f1)/2/k
  // u = -f1 (k1 d1 + k2 d2)/k
  // x = u + cx = cx - f1 (k1 d1 + k2 d2)/k
  const i = cx - f1 * (k1 * d1 + k2 * d2) / k
  // F2/e1: v = (e2 u + f1)/e1
  // v = (e2(-f1 (k1 d1 + k2 d2)/k) + f1)/e1
  // v = (-e2 f1 (k1 d1 + k2 d2)/k + f1)/e1
  // v = f1(-e2 (k1 d1 + k2 d2)/k + 1)/e1
  // v = f1(-e2 (k1 d1 + k2 d2) + k)/e1/k
  // v = f1(-e2 k1 d1 -e2 k2 d2 + k)/e1/k
  // v = f1(k1 (f2 - e2 d1) + k2 (f3 - e2 d2))/e1/k
  // v = f1(k1 d2 e1 - k2 d1 e1)/e1/k
  // v = f1(k1 d2 - k2 d1)/k
  // y = v + cy = cy + f1(k1 d2 - k2 d1)/k
  const j = cy + f1 * (k1 * d2 - k2 * d1) / k
  if (isZero(t)) {
    return [
      {
        x: i,
        y: j,
      }
    ]
  }
  const n = Math.sqrt(t)
  // sqrt(bb - 4ac)/2/a = sqrt(4e1 e1 i1 i2(k - f1 f1))/2/k = 2 e1 rx ry n/2/k = e1 rx ry n/k
  const r = rx * ry * n / k
  const p = e1 * r
  // F2/e1: v = (e2 u + f1)/e1
  // v = (e2(x - rx) + f1)/e1
  // v = (e2(rx - f1 (k1 d1 + k2 d2) / k + e1 rx ry n/k - rx) + f1)/e1
  // v = (e2(-f1(k1 d1 + k2 d2) / k + e1 rx ry n/k) + f1)/e1
  // v = (e2(-f1(k1 d1 + k2 d2) + e1 rx ry n) + f1 k)/e1/k
  // v = (e2(-f1 k1 d1 - f1 k2 d2 + e1 rx ry n) + f1 k)/e1/k
  // v = (-e2 f1 k1 d1 - e2 f1 k2 d2 + e1 e2 rx ry n + f1 k)/e1/k
  // v = (-e2 f1 k1 d1 - e2 f1 k2 d2 + e5 rx ry n + f1 (k1 f2 + k2 f3))/e1/k
  // v = (-e2 f1 k1 d1 - e2 f1 k2 d2 + e5 rx ry n + f1 (k1 (d2 e1 + d1 e2) + k2 (d2 e2 - d1 e1)))/e1/k
  // v = (-e2 f1 k1 d1 - e2 f1 k2 d2 + e5 rx ry n + f1 k1 (d2 e1 + d1 e2) + f1 k2 (d2 e2 - d1 e1))/e1/k
  // v = (-e2 f1 k1 d1 - e2 f1 k2 d2 + e5 rx ry n + f1 k1 d2 e1 + f1 k1 d1 e2 + f1 k2 d2 e2 - f1 k2 d1 e1)/e1/k
  // v = (e5 rx ry n + f1 k1 d2 e1 - f1 k2 d1 e1)/e1/k
  // v = (e2 rx ry n + f1 k1 d2 - f1 k2 d1)/k
  // v = (e2 rx ry n + f1(k1 d2 - k2 d1))/k
  // y = v + cy = cy + (e2 rx ry n + f1 (k1 d2 - k2 d1))/k = cy + e2 rx ry n/k + f1(k1 d2 - k2 d1)/k = i + e2 rx ry n/k 
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
  const d1 = Math.sin(radian)
  const d2 = Math.cos(radian)
  const d3 = d1 * d1
  const d4 = d2 * d2
  // (d2(x - cx) + d1(y - cy))^2/rx/rx + (-d1(x - cx) + d2(y - ry))^2/ry/ry = 1
  // let u = x - cx, v = y - cy
  // (d2 u + d1 v)^2/rx/rx + (-d1 u + d2 v)^2/ry/ry = 1
  const i1 = rx * rx
  const i2 = ry * ry
  const i3 = i2 - i1
  const i4 = i1 * i2
  // (d2 u + d1 v)^2/i1 + (-d1 u + d2 v)^2/i2 = 1
  // i2(d2 u + d1 v)^2 + i1(-d1 u + d2 v)^2 = i1 i2
  // i2(d2 d2 u^2 + 2 d1 d2 u v + d1 d1 v^2) + i1(d1 d1 u^2 -2 d1 d2 u v + d2 d2 v^2) = i1 i2
  // i2(d2 d2 u^2 + 2 d1 d2 u v + d1 d1 v^2) + i1(d1 d1 u^2 -2 d1 d2 u v + d2 d2 v^2) = i1 i2
  // i2 d2 d2 u^2 + 2 i2 d1 d2 u v + i2 d1 d1 v^2 + i1 d1 d1 u^2 -2 i1 d1 d2 u v + i1 d2 d2 v^2 = i1 i2
  // (i2 d2 d2 + i1 d1 d1)u^2 + 2(i2 - i1)d1 d2 u v + (i2 d1 d1 + i1 d2 d2) v^2 = i1 i2
  // (i2 d2 d2 + i1 d1 d1)u^2 + 2 i3 d1 d2 u v + (i2 d1 d1 + i1 d2 d2) v^2 = i1 i2

  // f3 = i2 d1 d1 + i1 d2 d2
  const f3 = i2 * d3 + i1 * d4
  // (i2 d2 d2 + i1 d1 d1)u^2 + 2 i3 d1 d2 u v + f3 v^2 = i1 i2
  const m = r1 ** 2
  // (x - x1)^2 + (y - y1)^2 = m
  // (u + cx - x1)^2 + (v + cy - y1)^2 = m
  const e1 = cx - x1
  const e2 = cy - y1
  const e3 = e1 * e1
  const e4 = e2 * e2
  const e5 = e1 * e2
  // F1: (u + e1)^2 + (v + e2)^2 = m
  // u^2 + 2 e1 u + e1 e1 + v^2 + 2 e2 v + e2 e2 = m
  // f3 u^2 + 2 e1 f3 u + e1 e1 f3 + f3 v^2 + 2 e2 f3 v + e2 e2 f3 = m f3
  // f3 u^2 + 2 e1 f3 u + e1 e1 f3 + f3 v^2 + 2 e2 f3 v + e2 e2 f3 - (i2 d2 d2 + i1 d1 d1)u^2 - 2 i3 d1 d2 u v - f3 v^2 = m f3 - i1 i2
  // f3 u^2 + 2 e1 f3 u + e1 e1 f3 + 2 e2 f3 v + e2 e2 f3 - (i2 d2 d2 + i1 d1 d1)u^2 - 2 i3 d1 d2 u v = m f3 - i1 i2
  // (f3 - i2 d2 d2 - i1 d1 d1)u^2 + 2 e1 f3 u + e1 e1 f3 + 2 e2 f3 v - 2 i3 d1 d2 u v + e2 e2 f3 = m f3 - i1 i2
  // (f3 - i2 d2 d2 - i1 d1 d1)u^2 + 2 e1 f3 u + e1 e1 f3 + (2 e2 f3 - 2 i3 d1 d2 u)v + e2 e2 f3 = m f3 - i1 i2
  // (i2 d1 d1 + i1 d2 d2 - i2 d2 d2 - i1 d1 d1) u^2 + 2 e1 f3 u + e1 e1 f3 + (2 e2 f3 - 2 i3 d1 d2 u)v + e2 e2 f3 = m f3 - i1 i2
  // i3 (d1 d1 - d2 d2)u^2 + 2 e1 f3 u + (e1 e1 + e2 e2)f3 + 2(e2 f3 - i3 d1 d2 u)v = m f3 - i1 i2
  // 2(e2 f3 - i3 d1 d2 u)v = -i3(d1 d1 - d2 d2)u^2 - 2 e1 f3 u + m f3 - i1 i2 - (e1 e1 + e2 e2)f3
  // (e2 f3 - i3 d1 d2 u)v = -i3 (d1 d1 - d2 d2)u^2/2 - e1 f3 u + (m f3 - i1 i2 - (e1 e1 + e2 e2)f3)/2
  // f1 = i3 d1 d2
  const f1 = i3 * d1 * d2
  // f2 = -i3 (d1 d1 - d2 d2)/2
  const f2 = -i3 * (d3 - d4) / 2
  // f4 = (m f3 - i1 i2 - (e1 e1 + e2 e2)f3)/2
  // f4 = (m f3 - i1 i2 - (e3 + e4)f3)/2
  const f4 = (m * f3 - i4 - (e3 + e4) * f3) / 2
  // (e2 f3 - f1 u)v = f2 * u^2 - e1 f3 u + f4
  // F1*(e2 f3 - f1 u)^2: (u + e1)^2 (e2 f3 - f1 u)^2 + (v + e2)^2 (e2 f3 - f1 u)^2 = m(e2 f3 - f1 u)^2
  // ((u + e1)(e2 f3 - f1 u)^2 + ((v + e2)(e2 f3 - f1 u))^2 = m(e2 f3 - f1 u)^2
  // ((u + e1)(e2 f3 - f1 u)^2 + (v(e2 f3 - f1 u) + e2(e2 f3 - f1 u))^2 = m(e2 f3 - f1 u)^2
  // ((u + e1)(e2 f3 - f1 u)^2 + (f2 * u^2 - e1 f3 u + f4 + e2(e2 f3 - f1 u))^2 = m(e2 f3 - f1 u)^2
  // ((u + e1)(f1 u - e2 f3)^2 + (f2 * u^2 - e1 f3 u + f4 + e2 e2 f3 - e2 f1 u)^2 = m(f1 u - e2 f3)^2
  // ((f1 u^2 - e2 f3 u + e1 f1 u - e1 e2 f3)^2 + (f2 * u^2 - (e1 f3 + e2 f1) u + (f4 + e2 e2 f3))^2 = m(f1 u - e2 f3)^2

  // f5 = f4 + e2 e2 f3
  // f5 = (m f3 - i1 i2 - (e1 e1 + e2 e2)f3)/2 + e2 e2 f3
  // f5 = (m(i2 d1 d1 + i1 d2 d2) - i1 i2 - (e1 e1 + e2 e2)(i2 d1 d1 + i1 d2 d2))/2 + e2 e2(i2 d1 d1 + i1 d2 d2)
  // f5 = (m i2 d1 d1 + m i1 d2 d2 - i1 i2 - (i2 d1 d1 e1 e1 + i1 d2 d2 e1 e1 + i2 d1 d1 e2 e2 + i1 d2 d2 e2 e2) + 2 e2 e2(i2 d1 d1 + i1 d2 d2))/2
  // f5 = (m i2 d1 d1 + m i1 d2 d2 - i1 i2 - i2 d1 d1 e1 e1 - i1 d2 d2 e1 e1 - i2 d1 d1 e2 e2 - i1 d2 d2 e2 e2 + 2 i2 d1 d1 e2 e2 + 2 i1 d2 d2 e2 e2)/2
  // f5 = (m i2 d1 d1 + m i1 d2 d2 - i1 i2 - i2 d1 d1 e1 e1 - i1 d2 d2 e1 e1 + i2 d1 d1 e2 e2 + i1 d2 d2 e2 e2)/2
  // f5 = ((m - e1 e1 + e2 e2)i2 d1 d1 + (m - e1 e1 + e2 e2)i1 d2 d2 - i1 i2)/2
  // f5 = ((m - e1 e1 + e2 e2)(i2 d1 d1 + i1 d2 d2) - i1 i2)/2
  // f5 = ((m - e3 + e2 e2)(i2 d1 d1 + i1 d2 d2) - i1 i2)/2
  // f5 = ((m - e3 + e2 e2)f3 - i1 i2)/2
  const f5 = ((m - e3 + e4) * f3 - i4) / 2

  const a1 = d2 * e1 - d1 * e2
  const a2 = d1 * e1 + d2 * e2

  // f6 = e1 f1 - e2 f3
  // f6 = e1(i2 - i1)d1 d2 - e2(i2 d1 d1 + i1 d2 d2)
  // f6 = i2 d1 d2 e1 - i1 d1 d2 e1 - i2 d1 d1 e2 - i1 d2 d2 e2
  // f6 = i2 d1 (d2 e1 - d1 e2) - i1 d2 (d1 e1 + d2 e2)
  const f6 = i2 * d1 * a1 - i1 * d2 * a2

  // f7 = e1 f3 + e2 f1
  // f7 = e1(i2 d1 d1 + i1 d2 d2) + e2(i2 - i1)d1 d2
  // f7 = i2 d1 d1 e1 + i1 d2 d2 e1 + i2 d1 d2 e2 - i1 d1 d2 e2
  // f7 = i2 d1(d1 e1 + d2 e2) + i1 d2(d2 e1 - d1 e2)
  const f7 = i2 * d1 * a2 + i1 * d2 * a1

  // (f1 u^2 + f6 u - e1 e2 f3)^2 + (f2 u^2 - f7 u + f5)^2 = m(f1 u - e2 f3)^2
  // (f1 f1 u^4 + 2 f1 f6 u^3 - 2 e1 e2 f1 f3 u^2 + f6 f6 u^2 - 2 e1 e2 f3 f6 u + e1 e1 e2 e2 f3 f3) + (f2 f2 u^4 - 2 f2 f7 u^3 + 2 f2 f5 u^2 + f7 f7 u^2 - 2 f5 f7 u + f5 f5) = m(f1 f1 u^2 - 2 f1 u e2 f3 + e2 e2 f3 f3)
  // f1 f1 u^4 + 2 f1 f6 u^3 - 2 e1 e2 f1 f3 u^2 + f6 f6 u^2 - 2 e1 e2 f3 f6 u + e1 e1 e2 e2 f3 f3 + f2 f2 u^4 - 2 f2 f7 u^3 + 2 f2 f5 u^2 + f7 f7 u^2 - 2 f5 f7 u + f5 f5 - m f1 f1 u^2 + 2 m f1 u e2 f3 - m e2 e2 f3 f3 = 0
  // (f1 f1 + f2 f2)u^4 + (2 f1 f6 - 2 f2 f7)u^3 + (-2 e1 e2 f1 f3 + f6 f6 + 2 f2 f5 + f7 f7 - m f1 f1)u^2 + (-2 e1 e2 f3 f6 - 2 f5 f7 + 2 m f1 e2 f3)u + (e1 e1 e2 e2 f3 f3 + f5 f5 - m e2 e2 f3 f3) = 0

  // a = f1 f1 + f2 f2
  // a = (i3 d1 d2)^2 -i3(d1 d1 - d2 d2)/2)^2
  // a = i3^2 * ((d1 d2)^2 + ((d1 d1 - d2 d2)/2)^2)
  // a = i3^2 * (4(d1 d2)^2 + 4((d1 d1 - d2 d2)/2)^2)/4
  // a = i3^2 * (4(d1 d2)^2 + (d1 d1 - d2 d2)^2)/4
  // a = i3^2 * (4 d1 d1 d2 d2 + d1 d1 d1 d1 - 2 d1 d1 d2 d2 + d2 d2 d2 d2)/4
  // a = i3^2 * (d1 d1 d1 d1 + 2 d1 d1 d2 d2 + d2 d2 d2 d2)/4
  // a = i3^2 * (d1 d1 + d2 d2)^2/4
  // a = i3^2/4
  const a = i3 ** 2 / 4

  // b = 2 f1 f6 - 2 f2 f7
  // b = 2i3d1 d2(e1 f1 - e2 f3) + i3(d1 d1 - d2 d2)(e1 f3 + e2 f1)
  // b = i3(2 d1 d2(e1 f1 - e2 f3) + (d1 d1 - d2 d2)(e1 f3 + e2 f1))
  // b = i3(2 d1 d2(e1 i3 d1 d2 - e2(i2 d1 d1 + i1 d2 d2)) + (d1 d1 - d2 d2)(e1(i2 d1 d1 + i1 d2 d2) + e2 i3 d1 d2))
  // b = i3(2 d1 d2(e1 i2 d1 d2 - e1 i1 d1 d2 - e2 i2 d1 d1 - e2 i1 d2 d2) + (d1 d1 - d2 d2)(e1 i2 d1 d1 + e1 i1 d2 d2 + e2 i2 d1 d2 - e2 i1 d1 d2))
  // b = i3(2 e1 i2 d1 d1 d2 d2 - 2 e1 i1 d1 d1 d2 d2 - 2 e2 i2 d1 d1 d1 d2 - 2 e2 i1 d1 d2 d2 d2 + e1 i2 d1 d1 d1 d1 + e1 i1 d1 d1 d2 d2 + e2 i2 d1 d1 d1 d2 - e2 i1 d1 d1 d1 d2 - (e1 i2 d1 d1 d2 d2 + e1 i1 d2 d2 d2 d2 + e2 i2 d1 d2 d2 d2 - e2 i1 d1 d2 d2 d2))
  // b = i3(e1 i2 d1 d1 d2 d2 - e1 i1 d1 d1 d2 d2 - e2 i2 d1 d1 d1 d2 - e2 i1 d1 d2 d2 d2 + e1 i2 d1 d1 d1 d1 - e2 i1 d1 d1 d1 d2 - e1 i1 d2 d2 d2 d2 - e2 i2 d1 d2 d2 d2)
  // b = i3(e1 i2 d1 d1(d2 d2 + d1 d1) - e1 i1 (d1 d1 + d2 d2) d2 d2 - e2 i2 (d1 d1 + d2 d2) d1 d2 - e2 i1 d1 d2 (d2 d2 + d1 d1))
  // b = i3(e1 i2 d1 d1 - e1 i1 d2 d2 - e2 i2 d1 d2 - e2 i1 d1 d2)
  // b = i3(e1(i2 d1 d1 - i1 d2 d2) - e2 d1 d2(i1 + i2))
  // b/a = (i3(e1(i2 d1 d1 - i1 d2 d2) - e2 d1 d2(i1 + i2)))/(i3^2 / 4)
  // b/a = (i3(e1(i2 d1 d1 - i1 d2 d2) - e2 d1 d2(i1 + i2)))/i3/i3*4
  // b/a = 4(e1(i2 d1 d1 - i1 d2 d2) - e2 d1 d2(i1 + i2))/i3
  let b = 4 * (e1 * (i2 * d3 - i1 * d4) - e2 * d1 * d2 * (i1 + i2)) / i3
  let c = (-2 * e5 * f3 * f1 + f6 * f6 + 2 * f2 * f5 + f7 * f7 - m * f1 * f1) / a
  let d = (-2 * e5 * f3 * f6 - 2 * f5 * f7 + 2 * m * f1 * e2 * f3) / a
  let e = ((e3 - m) * e4 * f3 * f3 + f5 * f5) / a

  const us = calculateEquation4(b, c, d, e)
  return us.map(u => {
    const v = (f2 * u ** 2 - e1 * f3 * u + f4) / (e2 * f3 - f1 * u)
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
