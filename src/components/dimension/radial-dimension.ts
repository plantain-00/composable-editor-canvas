import { Circle, formatNumber, getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoPointsDistance, iteratePolygonLines, iteratePolylineLines, Position, rotatePosition, rotatePositionByCenter, Size, TextStyle } from "../../utils"

/**
 * @public
 */
export function getRadialDimensionGeometries(
  content: RadialDimension,
  circle: Circle,
  dimensionStyle: {
    margin: number
    arrowAngle: number
    arrowSize: number
  },
  getTextPosition: (content: RadialDimension, circle: Circle) => {
    textPosition: Position
    textRotation: number
    size?: Size
    text: string
  }
) {
  const edgePoint = getPointByLengthAndDirection(circle, circle.r, content.position)
  const distance = getTwoPointsDistance(circle, content.position)
  const arrowPoint = getPointByLengthAndDirection(edgePoint, dimensionStyle.arrowSize, content.position)
  const arrowTail1 = rotatePositionByCenter(arrowPoint, edgePoint, dimensionStyle.arrowAngle)
  const arrowTail2 = rotatePositionByCenter(arrowPoint, edgePoint, -dimensionStyle.arrowAngle)
  const linePoints = [distance > circle.r ? circle : edgePoint, content.position]
  const arrowPoints = [edgePoint, arrowTail1, arrowTail2]
  let textPoints: Position[] = []
  const { textPosition, textRotation, size } = getTextPosition(content, circle)
  if (size) {
    textPoints = [
      { x: textPosition.x, y: textPosition.y - size.height },
      { x: textPosition.x + size.width, y: textPosition.y - size.height },
      { x: textPosition.x + size.width, y: textPosition.y },
      { x: textPosition.x, y: textPosition.y },
    ].map((p) => rotatePosition(p, textPosition, textRotation))
  }
  const points = [...linePoints, ...arrowPoints, ...textPoints]
  return {
    lines: Array.from(iteratePolylineLines(linePoints)),
    regions: [
      {
        points: arrowPoints,
        lines: Array.from(iteratePolygonLines(arrowPoints)),
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
export function getRadialDimensionTextPosition(
  content: RadialDimension,
  circle: Circle,
  margin: number,
  getTextSize: (font: string, text: string) => Size | undefined
) {
  let textPosition = content.position
  const text = `R${formatNumber(circle.r)}`
  const size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, text)
  let textRotation = Math.atan2(content.position.y - circle.y, content.position.x - circle.x)
  if (size) {
    const distance = getTwoPointsDistance(circle, content.position)
    if (distance > circle.r) {
      if (content.position.x > circle.x) {
        textPosition = getPointByLengthAndDirection(content.position, size.width, circle)
      } else {
        textRotation = textRotation - Math.PI
      }
    } else if (content.position.x < circle.x) {
      textPosition = getPointByLengthAndDirection(content.position, -size.width, circle)
      textRotation = textRotation + Math.PI
    }
  }
  textPosition = getPointByLengthAndAngle(textPosition, margin, textRotation - Math.PI / 2)
  return {
    textPosition,
    textRotation,
    size,
    text: content.text || text,
  }
}

/**
 * @public
 */
export interface RadialDimension extends TextStyle {
  position: Position
  text?: string
}
