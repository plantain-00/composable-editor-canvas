import { Circle, formatNumber, getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoPointsDistance, iteratePolygonLines, iteratePolylineLines, Position, rotatePosition, rotatePositionByCenter, Size } from "../../utils"

/**
 * @public
 */
export function getRadialDimensionGeometries(
  content: RadialDimension,
  dimensionStyle: {
    margin: number
    arrowAngle: number
    arrowSize: number
  },
  getTextPosition: (content: RadialDimension) => {
    textPosition: Position
    textRotation: number
    size?: Size
    text: string
  }
) {
  const edgePoint = getPointByLengthAndDirection(content, content.r, content.position)
  const distance = getTwoPointsDistance(content, content.position)
  const arrowPoint = getPointByLengthAndDirection(edgePoint, dimensionStyle.arrowSize, content.position)
  const arrowTail1 = rotatePositionByCenter(arrowPoint, edgePoint, dimensionStyle.arrowAngle)
  const arrowTail2 = rotatePositionByCenter(arrowPoint, edgePoint, -dimensionStyle.arrowAngle)
  const linePoints = [distance > content.r ? content : edgePoint, content.position]
  const arrowPoints = [edgePoint, arrowTail1, arrowTail2]
  let textPoints: Position[] = []
  const { textPosition, textRotation, size } = getTextPosition(content)
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
  margin: number,
  getTextSize: (font: string, text: string) => Size | undefined
) {
  let textPosition = content.position
  const text = `R${formatNumber(content.r)}`
  const size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, text)
  let textRotation = Math.atan2(content.position.y - content.y, content.position.x - content.x)
  if (size) {
    const distance = getTwoPointsDistance(content, content.position)
    if (distance > content.r) {
      if (content.position.x > content.x) {
        textPosition = getPointByLengthAndDirection(content.position, size.width, content)
      } else {
        textRotation = textRotation - Math.PI
      }
    } else if (content.position.x < content.x) {
      textPosition = getPointByLengthAndDirection(content.position, -size.width, content)
      textRotation = textRotation + Math.PI
    }
  }
  textPosition = getPointByLengthAndAngle(textPosition, margin, textRotation - Math.PI / 2)
  return {
    textPosition,
    textRotation,
    size,
    text,
  }
}

/**
 * @public
 */
export interface RadialDimension extends Circle, TextStyle {
  position: Position
}

/**
 * @public
 */
export interface TextStyle {
  fontSize: number
  fontFamily: string
}
