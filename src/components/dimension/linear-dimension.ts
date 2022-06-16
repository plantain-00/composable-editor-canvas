import { formatNumber, getFootPoint, getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoNumbersDistance, getTwoPointCenter, getTwoPointsDistance, iteratePolygonLines, iteratePolylineLines, Position, rotatePosition, rotatePositionByCenter, Size, twoPointLineToGeneralFormLine } from "../../utils"
import { TextStyle } from "./radial-dimension"

/**
 * @public
 */
export function getLinearDimensionGeometries(
  content: LinearDimension,
  dimensionStyle: {
    margin: number
    arrowAngle: number
    arrowSize: number
  },
  getTextPosition: (content: LinearDimension) => {
    textPosition: Position
    textRotation: number
    size?: Size
    text: string
  }
) {
  const center = getTwoPointCenter(content.p1, content.p2)
  let line1Points: Position[]
  let line2Points: Position[]
  let line3Points: Position[]
  let arrow1Points: Position[]
  let arrow2Points: Position[]
  let textPoints: Position[] = []
  const { textPosition, size, textRotation } = getTextPosition(content)
  const centerRotation = Math.atan2(content.position.y - center.y, content.position.x - center.x)
  const rotation = Math.abs(centerRotation)
  if (content.direct) {
    const left = content.p1.x > content.p2.x ? content.p2 : content.p1
    const right = content.p1.x > content.p2.x ? content.p1 : content.p2
    const footPoint = getFootPoint(content.position, twoPointLineToGeneralFormLine(left, right))
    const distance = getTwoPointsDistance(content.position, footPoint)
    const r = Math.atan2(right.y - left.y, right.x - left.x)
    let rotationDelta = r - centerRotation
    if (rotationDelta < -Math.PI) {
      rotationDelta += Math.PI * 2
    }
    const direction = rotationDelta > 0 && rotationDelta < Math.PI ? -1 : 1
    line1Points = [left, getPointByLengthAndAngle(left, distance + dimensionStyle.margin, r + direction * Math.PI / 2)]
    line2Points = [right, getPointByLengthAndAngle(right, distance + dimensionStyle.margin, r + direction * Math.PI / 2)]
    let p1 = getPointByLengthAndAngle(left, distance, r + direction * Math.PI / 2)
    let p2 = getPointByLengthAndAngle(right, distance, r + direction * Math.PI / 2)
    const p1p2Distance = getTwoPointsDistance(content.p1, content.p2)
    let arrowDirection = 1
    if (size && p1p2Distance <= dimensionStyle.arrowSize * 2 + size.width) {
      arrowDirection = -1
    }
    const arrow1 = getPointByLengthAndAngle(p1, arrowDirection * dimensionStyle.arrowSize, r)
    const arrow2 = getPointByLengthAndAngle(p2, arrowDirection * dimensionStyle.arrowSize, r + Math.PI)
    arrow1Points = [
      p1,
      rotatePositionByCenter(arrow1, p1, dimensionStyle.arrowAngle),
      rotatePositionByCenter(arrow1, p1, -dimensionStyle.arrowAngle),
    ]
    arrow2Points = [
      p2,
      rotatePositionByCenter(arrow2, p2, dimensionStyle.arrowAngle),
      rotatePositionByCenter(arrow2, p2, -dimensionStyle.arrowAngle),
    ]
    if (size && p1p2Distance <= dimensionStyle.arrowSize * 2 + size.width) {
      p1 = getPointByLengthAndDirection(p1, - 2 * dimensionStyle.arrowSize, p2)
      p2 = getPointByLengthAndDirection(p2, - 2 * dimensionStyle.arrowSize, p1)
    }
    if (p1.y < p2.y) {
      line3Points = [
        { x: Math.min(p1.x, p2.x, content.position.x), y: Math.min(p1.y, p2.y, content.position.y) },
        { x: Math.max(p1.x, p2.x, content.position.x), y: Math.max(p1.y, p2.y, content.position.y) },
      ]
    } else {
      line3Points = [
        { x: Math.min(p1.x, p2.x, content.position.x), y: Math.max(p1.y, p2.y, content.position.y) },
        { x: Math.max(p1.x, p2.x, content.position.x), y: Math.min(p1.y, p2.y, content.position.y) },
      ]
    }
  } else if (rotation > Math.PI / 4 && rotation < Math.PI * 3 / 4) {
    const direction = content.position.y > center.y ? 1 : -1
    line1Points = [content.p1, { x: content.p1.x, y: content.position.y + direction * dimensionStyle.margin }]
    line2Points = [content.p2, { x: content.p2.x, y: content.position.y + direction * dimensionStyle.margin }]
    const p1 = { x: content.p1.x, y: content.position.y }
    const p2 = { x: content.p2.x, y: content.position.y }
    line3Points = [
      { x: Math.min(content.p1.x, content.p2.x, content.position.x), y: content.position.y },
      { x: Math.max(content.p1.x, content.p2.x, content.position.x), y: content.position.y },
    ]
    let p1ArrowSize = p1.x < p2.x ? dimensionStyle.arrowSize : -dimensionStyle.arrowSize
    if (size && Math.abs(p1.x - p2.x) <= dimensionStyle.arrowSize * 2 + size.width) {
      p1ArrowSize = -p1ArrowSize
      line3Points[0].x = Math.min(line3Points[0].x, Math.min(p1.x, p2.x) - 2 * dimensionStyle.arrowSize)
      line3Points[1].x = Math.max(line3Points[1].x, Math.max(p1.x, p2.x) + 2 * dimensionStyle.arrowSize)
    }
    arrow1Points = [
      p1,
      rotatePositionByCenter({ x: p1.x + p1ArrowSize, y: p1.y }, p1, dimensionStyle.arrowAngle),
      rotatePositionByCenter({ x: p1.x + p1ArrowSize, y: p1.y }, p1, -dimensionStyle.arrowAngle),
    ]
    arrow2Points = [
      p2,
      rotatePositionByCenter({ x: p2.x - p1ArrowSize, y: p2.y }, p2, dimensionStyle.arrowAngle),
      rotatePositionByCenter({ x: p2.x - p1ArrowSize, y: p2.y }, p2, -dimensionStyle.arrowAngle),
    ]
  } else {
    const direction = content.position.x > center.x ? 1 : -1
    line1Points = [content.p1, { x: content.position.x + direction * dimensionStyle.margin, y: content.p1.y }]
    line2Points = [content.p2, { x: content.position.x + direction * dimensionStyle.margin, y: content.p2.y }]
    const p1 = { x: content.position.x, y: content.p1.y }
    const p2 = { x: content.position.x, y: content.p2.y }
    line3Points = [
      { x: content.position.x, y: Math.min(content.p1.y, content.p2.y, content.position.y) },
      { x: content.position.x, y: Math.max(content.p1.y, content.p2.y, content.position.y) },
    ]
    let p1ArrowSize = p1.y < p2.y ? dimensionStyle.arrowSize : -dimensionStyle.arrowSize
    if (size && Math.abs(p1.y - p2.y) <= dimensionStyle.arrowSize * 2 + size.width) {
      p1ArrowSize = -p1ArrowSize
      line3Points[0].y = Math.min(line3Points[0].y, Math.min(p1.y, p2.y) - 2 * dimensionStyle.arrowSize)
      line3Points[1].y = Math.max(line3Points[1].y, Math.max(p1.y, p2.y) + 2 * dimensionStyle.arrowSize)
    }
    arrow1Points = [
      p1,
      rotatePositionByCenter({ x: p1.x, y: p1.y + p1ArrowSize }, p1, dimensionStyle.arrowAngle),
      rotatePositionByCenter({ x: p1.x, y: p1.y + p1ArrowSize }, p1, -dimensionStyle.arrowAngle),
    ]
    arrow2Points = [
      p2,
      rotatePositionByCenter({ x: p2.x, y: p2.y - p1ArrowSize }, p2, dimensionStyle.arrowAngle),
      rotatePositionByCenter({ x: p2.x, y: p2.y - p1ArrowSize }, p2, -dimensionStyle.arrowAngle),
    ]
  }
  if (size) {
    textPoints = [
      { x: textPosition.x, y: textPosition.y - size.height },
      { x: textPosition.x + size.width, y: textPosition.y - size.height },
      { x: textPosition.x + size.width, y: textPosition.y },
      { x: textPosition.x, y: textPosition.y },
    ].map((p) => rotatePosition(p, textPosition, textRotation))
  }
  const points = [...line1Points, ...line2Points, ...line3Points, ...arrow1Points, ...arrow2Points, ...textPoints]
  return {
    lines: [
      ...iteratePolylineLines(line1Points),
      ...iteratePolylineLines(line2Points),
      ...iteratePolylineLines(line3Points),
    ],
    regions: [
      {
        points: arrow1Points,
        lines: Array.from(iteratePolygonLines(arrow1Points)),
      },
      {
        points: arrow2Points,
        lines: Array.from(iteratePolygonLines(arrow2Points)),
      },
      {
        points: textPoints,
        lines: Array.from(iteratePolygonLines(textPoints)),
      },
    ],
    points,
    bounding: getPointsBounding(points),
  }
}

/**
 * @public
 */
export function getLinearDimensionTextPosition(
  content: LinearDimension,
  margin: number,
  getTextSize: (font: string, text: string) => Size | undefined
) {
  const center = getTwoPointCenter(content.p1, content.p2)
  let textPosition: Position
  let text: string
  let size: Size | undefined
  let textRotation = 0
  const centerRotation = Math.atan2(content.position.y - center.y, content.position.x - center.x)
  const rotation = Math.abs(centerRotation)
  if (content.direct) {
    const left = content.p1.x > content.p2.x ? content.p2 : content.p1
    const right = content.p1.x > content.p2.x ? content.p1 : content.p2
    const footPoint = getFootPoint(content.position, twoPointLineToGeneralFormLine(left, right))
    const distance = getTwoPointsDistance(content.position, footPoint)
    textRotation = Math.atan2(right.y - left.y, right.x - left.x)
    const r = Math.atan2(right.y - left.y, right.x - left.x)
    let rotationDelta = r - centerRotation
    if (rotationDelta < -Math.PI) {
      rotationDelta += Math.PI * 2
    }
    const direction = rotationDelta > 0 && rotationDelta < Math.PI ? 1 : -1
    textPosition = getPointByLengthAndDirection(footPoint, distance + direction * margin, content.position)
    text = formatNumber(getTwoNumbersDistance(left.x, right.x)).toString()
    size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, text)
    if (size) {
      textPosition = getPointByLengthAndAngle(textPosition, size.width / 2, textRotation - Math.PI)
    }
  } else if (rotation > Math.PI / 4 && rotation < Math.PI * 3 / 4) {
    textPosition = {
      x: content.position.x,
      y: content.position.y - margin,
    }
    text = formatNumber(getTwoNumbersDistance(content.p1.x, content.p2.x)).toString()
    size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, text)
    if (size) {
      textPosition.x -= size.width / 2
    }
  } else {
    textPosition = {
      x: content.position.x - margin,
      y: content.position.y,
    }
    text = formatNumber(getTwoNumbersDistance(content.p1.y, content.p2.y)).toString()
    size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, text)
    if (size) {
      textPosition.y += size.width / 2
    }
    textRotation = -Math.PI / 2
  }
  return {
    text,
    textPosition,
    size,
    textRotation,
  }
}

/**
 * @public
 */
export interface LinearDimension extends TextStyle {
  p1: Position
  p2: Position
  position: Position
  direct?: boolean
}
