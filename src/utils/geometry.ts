export function getPointByLengthAndDirection(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  let dx = directionPoint.x - startPoint.x
  let dy = directionPoint.y - startPoint.y
  if (length < 0) {
    length = -length
    dx = -dx
    dy = -dy
  }
  if (isZero(dx)) {
    return {
      x: startPoint.x,
      y: startPoint.y + length * (dy > 0 ? 1 : -1),
    }
  }
  const offsetX = Math.sqrt(length ** 2 * dx ** 2 / (dx ** 2 + dy ** 2)) * (dx > 0 ? 1 : -1)
  return {
    x: startPoint.x + offsetX,
    y: startPoint.y + dy / dx * offsetX,
  }
}

/**
 * @public
 */
export function isZero(value: number) {
  return Math.abs(value) < 0.00000001
}

/**
 * @public
 */
export function getPointByLengthAndDirectionSafely(
  startPoint: Position,
  length: number,
  directionPoint: Position
) {
  if (isSamePoint(startPoint, directionPoint)) {
    return undefined
  }
  return getPointByLengthAndDirection(startPoint, length, directionPoint)
}

/**
 * @public
 */
export function isSamePoint(p1: Position, p2: Position) {
  return equals(p1.x, p2.x) && equals(p1.y, p2.y)
}

/**
 * @public
 */
export function getPointByLengthAndAngle(
  startPoint: Position,
  length: number,
  angle: number,
) {
  return {
    x: startPoint.x + length * Math.cos(angle),
    y: startPoint.y + length * Math.sin(angle),
  }
}

/**
 * @public
 */
export function getPointAndLineSegmentMinimumDistance(position: Position, point1: Position, point2: Position) {
  const { distance } = getPointAndLineSegmentNearestPointAndDistance(position, point1, point2)
  return distance
}

/**
 * @public
 */
export function getPointAndLineSegmentNearestPointAndDistance(position: Position, point1: Position, point2: Position) {
  const footPoint = getFootPoint(position, twoPointLineToGeneralFormLine(point1, point2))
  if (pointIsOnLineSegment(footPoint, point1, point2)) {
    return {
      point: footPoint,
      distance: getTwoPointsDistance(position, footPoint),
    }
  }
  const d1 = getTwoPointsDistance(position, point1)
  const d2 = getTwoPointsDistance(position, point2)
  if (d1 < d2) {
    return {
      point: point1,
      distance: d1,
    }
  }
  return {
    point: point2,
    distance: d2,
  }
}

/**
 * @public
 */
export function pointIsOnLineSegment(p: Position, point1: Position, point2: Position) {
  if (!equals(point1.x, point2.x) && isBetween(p.x, point1.x, point2.x)) {
    return true
  }
  if (!equals(point1.y, point2.y) && isBetween(p.y, point1.y, point2.y)) {
    return true
  }
  return false
}

/**
 * @public
 */
export function pointIsOnLine(p: Position, point1: Position, point2: Position) {
  const { a, b, c } = twoPointLineToGeneralFormLine(point1, point2)
  return isZero(a * p.x + b * p.y + c)
}

/**
 * @public
 */
export function getPointAndRegionMinimumDistance(position: Position, region: TwoPointsFormRegion) {
  const polygon = getPolygonFromTwoPointsFormRegion(region)
  const polygonLine = Array.from(getPolygonLine(polygon))
  return Math.min(...polygonLine.map((r) => getPointAndLineSegmentMinimumDistance(position, ...r)))
}

/**
 * @public
 */
export function getPointAndRegionMaximumDistance(position: Position, region: TwoPointsFormRegion) {
  const polygon = getPolygonFromTwoPointsFormRegion(region)
  return Math.max(...polygon.map((r) => getTwoPointsDistance(position, r)))
}

/**
 * @public
 */
export function getFootPoint(point: Position, line: GeneralFormLine): Position {
  const d = line.a ** 2 + line.b ** 2
  const e = line.a * line.b
  return {
    x: (line.b ** 2 * point.x - e * point.y - line.a * line.c) / d,
    y: (-e * point.x + line.a ** 2 * point.y - line.b * line.c) / d,
  }
}

/**
 * @public
 */
export function getTwoPointsDistance(point1: Position, point2: Position) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)
}

/**
 * @public
 */
export function getTwoNumbersDistance(n1: number, n2: number) {
  return Math.abs(n1 - n2)
}

/**
 * @public
 */
export function getTwoPointCenter(p1: Position, p2: Position) {
  return {
    x: getTwoNumberCenter(p1.x, p2.x),
    y: getTwoNumberCenter(p1.y, p2.y),
  }
}

/**
 * @public
 */
export function getTwoNumberCenter(p1: number, p2: number) {
  return (p1 + p2) / 2
}

/**
 * @public
 */
export function isBetween(target: number, a: number, b: number) {
  return target <= Math.max(a, b) && target >= Math.min(a, b)
}

/**
 * @public
 */
export function twoPointLineToGeneralFormLine(point1: Position, point2: Position): GeneralFormLine {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return {
    a: dy,
    b: -dx,
    c: -point1.x * dy + point1.y * dx,
  }
}

function generalFormLineToTwoPointLine({ a, b, c }: GeneralFormLine): [Position, Position] {
  if (isZero(a)) {
    return [
      {
        x: 0,
        y: -c / b
      },
      {
        x: 1,
        y: -c / b
      },
    ]
  }
  if (isZero(b)) {
    return [
      {
        x: -c / a,
        y: 0
      },
      {
        x: -c / a,
        y: 1
      },
    ]
  }
  return [
    {
      x: 0,
      y: -c / b
    },
    {
      x: -c / a,
      y: 0
    },
  ]
}

export function getThreePointsCircle(startPosition: Position, middlePosition: Position, endPosition: Position) {
  const x1 = middlePosition.x - startPosition.x
  const y1 = middlePosition.y - startPosition.y
  const x2 = endPosition.x - middlePosition.x
  const y2 = endPosition.y - middlePosition.y
  const t1 = middlePosition.x ** 2 - startPosition.x ** 2 + middlePosition.y ** 2 - startPosition.y ** 2
  const t2 = endPosition.x ** 2 - middlePosition.x ** 2 + endPosition.y ** 2 - middlePosition.y ** 2
  const center = {
    x: (t1 * y2 - t2 * y1) / (x1 * y2 - x2 * y1) / 2,
    y: (x2 * t1 - t2 * x1) / (x2 * y1 - y2 * x1) / 2,
  }
  return {
    ...center,
    r: getTwoPointsDistance(center, startPosition),
  }
}

/**
 * @public
 */
export function getTwoPointsFormRegion(p1: Position, p2: Position): TwoPointsFormRegion {
  return {
    start: {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    },
    end: {
      x: Math.max(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    },
  }
}

/**
 * @public
 */
export function getRegion(p1: Position, p2: Position): Region {
  return {
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    width: getTwoNumbersDistance(p1.x, p2.x),
    height: getTwoNumbersDistance(p1.y, p2.y),
  }
}

/**
 * @public
 */
export function pointIsInRegion(point: Position, region: TwoPointsFormRegion) {
  return point.x >= region.start.x && point.y >= region.start.y && point.x <= region.end.x && point.y <= region.end.y
}

/**
 * @public
 */
export function getPointsBounding(points: Position[]): TwoPointsFormRegion | undefined {
  if (points.length === 0) {
    return
  }
  const x = points.map((p) => p.x)
  const y = points.map((p) => p.y)
  return {
    start: {
      x: Math.min(...x),
      y: Math.min(...y),
    },
    end: {
      x: Math.max(...x),
      y: Math.max(...y),
    },
  }
}

/**
 * @public
 */
export function lineIntersectWithTwoPointsFormRegion(p1: Position, p2: Position, region: TwoPointsFormRegion) {
  return lineIntersectWithPolygon(p1, p2, getPolygonFromTwoPointsFormRegion(region))
}

function getPolygonFromTwoPointsFormRegion(region: TwoPointsFormRegion) {
  return [
    region.start,
    { x: region.start.x, y: region.end.y },
    region.end,
    { x: region.end.x, y: region.start.y },
  ]
}

function lineIntersectWithPolygon(p1: Position, p2: Position, polygon: Position[]) {
  for (const line of getPolygonLine(polygon)) {
    if (lineIntersectWithLine(p1, p2, ...line)) {
      return true
    }
  }
  return false
}

function* getPolygonLine(polygon: Position[]): Generator<[Position, Position], void, unknown> {
  for (let i = 0; i < polygon.length; i++) {
    yield [polygon[i], polygon[i + 1 < polygon.length ? i + 1 : 0]]
  }
}

function lineIntersectWithLine(a: Position, b: Position, c: Position, d: Position) {
  if (!(Math.min(a.x, b.x) <= Math.max(c.x, d.x) && Math.min(c.y, d.y) <= Math.max(a.y, b.y) && Math.min(c.x, d.x) <= Math.max(a.x, b.x) && Math.min(a.y, b.y) <= Math.max(c.y, d.y))) {
    return false
  }
  const u = (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y)
  const v = (d.x - a.x) * (b.y - a.y) - (b.x - a.x) * (d.y - a.y)
  const w = (a.x - c.x) * (d.y - c.y) - (d.x - c.x) * (a.y - c.y)
  const z = (b.x - c.x) * (d.y - c.y) - (d.x - c.x) * (b.y - c.y)
  return u * v <= 0 && w * z <= 0
}

/**
 * @public
 */
export function getSymmetryPoint(p: Position, { a, b, c }: GeneralFormLine) {
  const d = a ** 2
  const e = b ** 2
  const x = ((e - d) * p.x - 2 * a * b * p.y - 2 * a * c) / (d + e)
  return {
    x: x,
    y: b * (x - p.x) / a + p.y,
  }
}

/**
 * @public
 */
export function getTwoLineSegmentsIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  const result = getTwoLinesIntersectionPoint(p1Start, p1End, p2Start, p2End)
  if (result && pointIsOnLineSegment(result, p1Start, p1End) && pointIsOnLineSegment(result, p2Start, p2End)) {
    return result
  }
  return undefined
}

/**
 * @public
 */
export function getTwoLinesIntersectionPoint(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position) {
  return getTwoGeneralFormLinesIntersectionPoint(twoPointLineToGeneralFormLine(p1Start, p1End), twoPointLineToGeneralFormLine(p2Start, p2End))
}

/**
 * @public
 */
export function getTwoGeneralFormLinesIntersectionPoint(p1: GeneralFormLine, p2: GeneralFormLine) {
  const { a: a1, b: b1, c: c1 } = p1
  const { a: a2, b: b2, c: c2 } = p2
  const d = a2 * b1 - a1 * b2
  if (isZero(d)) {
    return undefined
  }
  return {
    x: (c1 * b2 - b1 * c2) / d,
    y: (c2 * a1 - c1 * a2) / d,
  }
}

/**
 * @public
 */
export function getTwoCircleIntersectionPoints({ x: x1, y: y1, r: r1 }: Circle, { x: x2, y: y2, r: r2 }: Circle): Position[] {
  const dx = x2 - x1
  const dy = y2 - y1
  const a = dx ** 2 + dy ** 2
  const d = Math.sqrt(a)
  const b = r1 ** 2
  const l = (b - r2 ** 2 + a) / 2 / d
  const f = b - l ** 2
  if (f < 0 && !isZero(f)) {
    return []
  }
  const c = l / d
  const g = c * dx + x1
  const i = c * dy + y1
  if (isZero(f)) {
    return [
      {
        x: g,
        y: i,
      },
    ]
  }
  const h = Math.sqrt(f)
  const e = h / d
  const j = e * dy
  const k = e * dx
  return [
    {
      x: g + j,
      y: i - k,
    },
    {
      x: g - j,
      y: i + k,
    },
  ]
}

/**
 * @public
 */
export function getLineSegmentCircleIntersectionPoints(start: Position, end: Position, circle: Circle) {
  return getLineCircleIntersectionPoints(start, end, circle).filter((p) => pointIsOnLineSegment(p, start, end))
}

/**
 * @public
 */
export function getLineCircleIntersectionPoints(start: Position, end: Position, { x, y, r }: Circle) {
  const baX = end.x - start.x
  const baY = end.y - start.y
  const caX = x - start.x
  const caY = y - start.y
  const a = baX ** 2 + baY ** 2
  const bBy2 = baX * caX + baY * caY
  const c = caX * caX + caY * caY - r * r
  const pBy2 = bBy2 / a
  const q = c / a
  const disc = pBy2 * pBy2 - q
  if (isZero(disc)) {
    return [
      {
        x: start.x + baX * pBy2,
        y: start.y + baY * pBy2,
      }
    ]
  }
  if (disc < 0) {
    return []
  }
  const tmpSqrt = Math.sqrt(disc)
  const abScalingFactor1 = -pBy2 + tmpSqrt
  const abScalingFactor2 = -pBy2 - tmpSqrt
  return [
    {
      x: start.x - baX * abScalingFactor1,
      y: start.y - baY * abScalingFactor1,
    },
    {
      x: start.x - baX * abScalingFactor2,
      y: start.y - baY * abScalingFactor2,
    },
  ]
}

function getGeneralFormLineCircleIntersectionPoints(line: GeneralFormLine, circle: Circle) {
  return getLineCircleIntersectionPoints(...generalFormLineToTwoPointLine(line), circle)
}

/**
 * @public
 */
export function rotatePositionByCenter(position: Position, center: Position, angle: number) {
  if (!angle) {
    return position
  }
  return rotatePosition(position, center, -angle * Math.PI / 180)
}

/**
 * @public
 */
export function rotatePosition(position: Position, center: Position, rotation: number) {
  if (!rotation) {
    return position
  }
  const offsetX = position.x - center.x
  const offsetY = position.y - center.y
  const sin = Math.sin(rotation)
  const cos = Math.cos(rotation)
  return {
    x: cos * offsetX - sin * offsetY + center.x,
    y: sin * offsetX + cos * offsetY + center.y,
  }
}

/**
 * @public
 */
export function getPolygonPoints(point: Position, center: Position, sides: number, toEdge?: boolean) {
  if (toEdge) {
    const length = getTwoPointsDistance(point, center) / Math.cos(Math.PI / sides)
    point = rotatePositionByCenter(point, center, 180 / sides)
    point = getPointByLengthAndDirection(center, length, point)
  }
  const points = [point]
  for (let i = 1; i < sides; i++) {
    points.push(rotatePositionByCenter(point, center, 360 / sides * i))
  }
  return points
}

/**
 * @public
 */
export function getEllipseRadiusOfAngle(ellipse: Ellipse, angle: number) {
  if (ellipse.angle) {
    angle -= (ellipse.angle / 180) * Math.PI
  }
  return ellipse.rx * ellipse.ry / Math.sqrt((ellipse.rx * Math.sin(angle)) ** 2 + (ellipse.ry * Math.cos(angle)) ** 2)
}

/**
 * @public
 */
export function dashedPolylineToLines(
  points: Position[],
  dashArray: number[],
  skippedLines?: number[],
) {
  const result: Position[][] = []
  let last: Position[] = []
  const g = {
    moveTo(x: number, y: number) {
      if (last.length > 1) {
        result.push(last)
      }
      last = [{ x, y }]
    },
    lineTo(x: number, y: number) {
      if (last.length === 0) {
        last.push({ x: 0, y: 0 })
      }
      last.push({ x, y })
    },
  }
  drawDashedPolyline(g, points, dashArray, skippedLines)
  if (last.length > 1) {
    result.push(last)
  }
  return result
}

/**
 * @public
 */
export function drawDashedPolyline(
  g: { moveTo: (x: number, y: number) => void, lineTo: (x: number, y: number) => void },
  points: Position[],
  dashArray: number[],
  skippedLines?: number[],
) {
  let startDistance = 0
  points.forEach((p, i) => {
    if (i === 0 || skippedLines?.includes(i - 1)) {
      g.moveTo(p.x, p.y)
    } else {
      startDistance = drawDashedLine(g, points[i - 1], p, dashArray, startDistance)
    }
  })
}

/**
 * @public
 */
export function drawDashedLine(
  g: { moveTo: (x: number, y: number) => void, lineTo: (x: number, y: number) => void },
  p1: Position,
  p2: Position,
  dashArray: number[],
  startDistance = 0,
) {
  if (dashArray.length % 2 === 1) {
    dashArray = [...dashArray, ...dashArray]
  }
  let distance = getTwoPointsDistance(p1, p2)
  let p = p1
  while (distance > 0) {
    let offset = 0
    for (let i = 0; i < dashArray.length; i++) {
      let length = dashArray[i]
      if (startDistance > 0) {
        if (length <= startDistance) {
          startDistance -= length
          continue
        }
        length = length - startDistance
        startDistance = 0
      }
      const operate = i % 2 === 0 ? 'lineTo' : 'moveTo'
      if (length >= distance) {
        g[operate](p2.x, p2.y)
        return offset + distance
      }
      const end = getPointByLengthAndDirection(p, length, p2)
      g[operate](end.x, end.y)
      distance -= length
      offset += length
      p = end
    }
  }
  return 0
}

function getValueBetween2PointsByPercent(n1: number, n2: number, percent: number) {
  return n1 + ((n2 - n1) * percent)
}

/**
 * @public
 */
export function getBezierCurvePoints(p1: Position, p2: Position, p3: Position, p4: Position, segmentCount: number) {
  const points: Position[] = []
  for (let t = 1; t < segmentCount; t++) {
    const i = t / segmentCount
    const xa = getValueBetween2PointsByPercent(p1.x, p2.x, i)
    const ya = getValueBetween2PointsByPercent(p1.y, p2.y, i)
    const xb = getValueBetween2PointsByPercent(p2.x, p3.x, i)
    const yb = getValueBetween2PointsByPercent(p2.y, p3.y, i)
    const xc = getValueBetween2PointsByPercent(p3.x, p4.x, i)
    const yc = getValueBetween2PointsByPercent(p3.y, p4.y, i)

    // The Blue Line
    const xm = getValueBetween2PointsByPercent(xa, xb, i)
    const ym = getValueBetween2PointsByPercent(ya, yb, i)
    const xn = getValueBetween2PointsByPercent(xb, xc, i)
    const yn = getValueBetween2PointsByPercent(yb, yc, i)

    // The Black Dot
    const x = getValueBetween2PointsByPercent(xm, xn, i);
    const y = getValueBetween2PointsByPercent(ym, yn, i);
    points.push({ x, y })
  }
  return points
}

/**
 * @public
 */
export function getBezierSplineControlPointsOfPoints(points: Position[]) {
  const x = getBezierSplineControlPoints(points.map((p) => p.x))
  const y = getBezierSplineControlPoints(points.map((p) => p.y))
  return x.p1.map((_, i) => [{ x: x.p1[i], y: y.p1[i] }, { x: x.p2[i], y: y.p2[i] }] as const)
}

function getBezierSplineControlPoints(k: number[]) {
  const p1: number[] = []
  const p2: number[] = []
  const n = k.length - 1;
  const a: number[] = []
  const b: number[] = []
  const c: number[] = []
  const r: number[] = []
  a[0] = 0;
  b[0] = 2;
  c[0] = 1;
  r[0] = k[0] + 2 * k[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    c[i] = 1;
    r[i] = 4 * k[i] + 2 * k[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  c[n - 1] = 0;
  r[n - 1] = 8 * k[n - 1] + k[n];

  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] = b[i] - m * c[i - 1];
    r[i] = r[i] - m * r[i - 1];
  }

  p1[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; --i)
    p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];

  for (let i = 0; i < n - 1; i++) {
    p2[i] = 2 * k[i + 1] - p1[i + 1];
  }

  p2[n - 1] = 0.5 * (k[n] + p1[n - 1])
  return { p1: p1, p2: p2 };
}

export interface Position {
  x: number
  y: number
}

/**
 * @public
 */
export interface Size {
  width: number
  height: number
}

/**
 * @public
 */
export interface GeneralFormLine {
  a: number
  b: number
  c: number
}

export interface Region extends Position, Size { }

export interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
  angle?: number
}

/**
 * @public
 */
export interface TwoPointsFormRegion {
  start: Position
  end: Position
}

export interface Circle extends Position {
  r: number
}

/**
 * @public
 */
export interface Arc extends Circle, AngleRange {
}

/**
 * @public
 */
export interface EllipseArc extends Ellipse, AngleRange {
}

/**
 * @public
 */
export interface AngleRange {
  startAngle: number
  endAngle: number
  counterclockwise?: boolean
}

/**
 * @public
 */
export function getCirclesTangentTo2Circles(circle1: Circle, circle2: Circle, radius: number) {
  const result: Position[] = []
  const circles1 = [circle1.r + radius, Math.abs(circle1.r - radius)]
  const circles2 = [circle2.r + radius, Math.abs(circle2.r - radius)]
  for (const r1 of circles1) {
    for (const r2 of circles2) {
      result.push(...getTwoCircleIntersectionPoints({ ...circle1, r: r1 }, { ...circle2, r: r2 }))
    }
  }
  return result
}

/**
 * @public
 */
export function getPerpendicular(point: Position, line: GeneralFormLine) {
  return {
    a: -line.b,
    b: line.a,
    c: point.x * line.b - line.a * point.y,
  }
}

/**
 * @public
 */
export function getPolylineTriangles(points: Position[], width: number) {
  const radius = width / 2
  const result: number[] = []
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]
    const p2 = points[i]
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const lines1 = getParallelLinesByDistance(line, radius)
    const line2 = getPerpendicular(p1, line)
    const line3 = getPerpendicular(p2, line)
    for (const line1 of lines1) {
      const point2 = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
      if (point2) {
        result.push(point2.x, point2.y)
      }
      const point3 = getTwoGeneralFormLinesIntersectionPoint(line1, line3)
      if (point3) {
        result.push(point3.x, point3.y)
      }
    }
  }
  return result
}

/**
 * @public
 */
export function combineStripTriangles(triangles: number[][]) {
  const result: number[] = []
  for (let i = 0; i < triangles.length; i++) {
    const triangle = triangles[i]
    if (i !== 0) {
      const lastTriangle = triangles[i - 1]
      result.push(
        lastTriangle[lastTriangle.length - 2], lastTriangle[lastTriangle.length - 1],
        triangle[0], triangle[1],
        triangle[0], triangle[1],
        triangle[2], triangle[3],
      )
    }
    result.push(...triangle)
  }
  return result
}

/**
 * @public
 */
export function getCirclesTangentTo2Lines(p1Start: Position, p1End: Position, p2Start: Position, p2End: Position, radius: number) {
  const result: Position[] = []
  const lines1 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const lines2 = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p2Start, p2End), radius)
  for (const line1 of lines1) {
    for (const line2 of lines2) {
      const point = getTwoGeneralFormLinesIntersectionPoint(line1, line2)
      if (point) {
        result.push(point)
      }
    }
  }
  return result
}

/**
 * @public
 */
export function getCirclesTangentToLineAndCircle(p1Start: Position, p1End: Position, circle: Circle, radius: number) {
  const result: Position[] = []
  const lines = getParallelLinesByDistance(twoPointLineToGeneralFormLine(p1Start, p1End), radius)
  const circles = [circle.r + radius, Math.abs(circle.r - radius)]
  for (const line of lines) {
    for (const r of circles) {
      result.push(...getGeneralFormLineCircleIntersectionPoints(line, { ...circle, r }))
    }
  }
  return result
}

/**
 * @public
 */
export function getParallelLinesByDistance(line: GeneralFormLine, distance: number) {
  const d = distance * Math.sqrt(line.a ** 2 + line.b ** 2)
  return [
    {
      ...line,
      c: line.c + d,
    },
    {
      ...line,
      c: line.c - d,
    },
  ]
}

/**
 * @public
 */
export function deduplicate<T>(array: T[], isSameValue: (a: T, b: T) => boolean) {
  const result: T[] = []
  for (const item of array) {
    if (result.every((r) => !isSameValue(r, item))) {
      result.push(item)
    }
  }
  return result
}

/**
 * @public
 */
export function equals(a: number, b: number) {
  return isZero(a - b)
}

/**
 * @public
 */
export function deduplicatePosition(array: Position[]) {
  return deduplicate(array, isSamePoint)
}

/**
 * @public
 */
export function getEllipseAngle(p: Position, ellipse: Ellipse) {
  const newPosition = rotatePositionByCenter(p, { x: ellipse.cx, y: ellipse.cy }, ellipse.angle ?? 0)
  return Math.atan2((newPosition.y - ellipse.cy) / ellipse.ry, (newPosition.x - ellipse.cx) / ellipse.rx) * 180 / Math.PI
}

/**
 * @public
 */
export function normalizeAngleInRange(angle: number, range: AngleRange) {
  while (angle > range.endAngle) {
    angle -= 360
  }
  while (angle < range.startAngle) {
    angle += 360
  }
  return angle
}

/**
 * @public
 */
export function normalizeAngleRange(content: AngleRange) {
  if (content.endAngle < content.startAngle) {
    content.endAngle += 360
  } else if (content.endAngle - content.startAngle > 360) {
    content.endAngle -= 360
  }
}

/**
 * @public
 */
export function pointInPolygon({ x, y }: Position, polygon: Position[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside;
}

export function* iteratePolylineLines(points: Position[]) {
  for (let i = 1; i < points.length; i++) {
    yield [points[i - 1], points[i]] as [Position, Position]
  }
}

export function* iteratePolygonLines(points: Position[]) {
  yield* iteratePolylineLines(polygonToPolyline(points))
}

export function polygonToPolyline(points: Position[]) {
  return [...points, points[0]]
}

/**
 * @public
 */
export function arcToPolyline(content: Arc, angleDelta: number) {
  const points: Position[] = []
  let endAngle: number
  if (content.counterclockwise) {
    endAngle = content.startAngle < content.endAngle ? content.endAngle - 360 : content.endAngle
  } else {
    endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
  }
  let i = content.startAngle
  if (content.counterclockwise) {
    for (; i >= endAngle; i -= angleDelta) {
      const angle = i * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
  } else {
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
  }
  if (i !== endAngle) {
    const angle = endAngle * Math.PI / 180
    points.push({
      x: content.x + content.r * Math.cos(angle),
      y: content.y + content.r * Math.sin(angle),
    })
  }
  return points
}

/**
 * @public
 */
export function ellipseToPolygon(content: Ellipse, angleDelta: number) {
  const lineSegmentCount = 360 / angleDelta
  const center = { x: content.cx, y: content.cy }
  const points: Position[] = []
  for (let i = 0; i < lineSegmentCount; i++) {
    const angle = angleDelta * i * Math.PI / 180
    const x = content.cx + content.rx * Math.cos(angle)
    const y = content.cy + content.ry * Math.sin(angle)
    if (content.angle) {
      points.push(rotatePosition({ x, y }, center, content.angle * Math.PI / 180))
    } else {
      points.push({ x, y })
    }
  }
  return points
}

/**
 * @public
 */
export function ellipseArcToPolyline(content: EllipseArc, angleDelta: number) {
  const points: Position[] = []
  const center = { x: content.cx, y: content.cy }
  let endAngle: number
  if (content.counterclockwise) {
    endAngle = content.startAngle < content.endAngle ? content.endAngle - 360 : content.endAngle
  } else {
    endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
  }
  let i = content.startAngle
  if (content.counterclockwise) {
    for (; i >= endAngle; i -= angleDelta) {
      const angle = i * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      if (content.angle) {
        points.push(rotatePosition({ x, y }, center, content.angle * Math.PI / 180))
      } else {
        points.push({ x, y })
      }
    }
  } else {
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      const x = content.cx + content.rx * Math.cos(angle)
      const y = content.cy + content.ry * Math.sin(angle)
      if (content.angle) {
        points.push(rotatePosition({ x, y }, center, content.angle * Math.PI / 180))
      } else {
        points.push({ x, y })
      }
    }
  }
  if (i !== endAngle) {
    const angle = endAngle * Math.PI / 180
    const x = content.cx + content.rx * Math.cos(angle)
    const y = content.cy + content.ry * Math.sin(angle)
    if (content.angle) {
      points.push(rotatePosition({ x, y }, center, content.angle * Math.PI / 180))
    } else {
      points.push({ x, y })
    }
  }
  return points
}
