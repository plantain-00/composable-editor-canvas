import { getFootPoint, getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoNumbersDistance, getTwoPointCenter, getTwoPointsDistance, Position, rotatePosition, rotatePositionByCenter, Size, twoPointLineToGeneralFormLine, WeakmapCache } from "../../src"
import { iteratePolylineLines, LineContent } from "./line-model"
import { getLinesAndPointsFromCache, Model, StrokeBaseContent, getEditPointsFromCache, BaseContent } from "./model"
import { iteratePolygonLines } from "./polygon-model"
import { dimensionStyle, getTextSizeFromCache } from "./radial-dimension-model"
import { TextStyle } from "./text-model"

export type LinearDimensionContent = StrokeBaseContent<'linear dimension'> & TextStyle & {
  p1: Position
  p2: Position
  position: Position
  direct?: boolean
}

export const linearDimensionModel: Model<LinearDimensionContent> = {
  type: 'linear dimension',
  move(content, offset) {
    content.p1.x += offset.x
    content.p1.y += offset.y
    content.p2.x += offset.x
    content.p2.y += offset.y
    content.position.x += offset.x
    content.position.y += offset.y
  },
  render({ content, target, color, strokeWidth }) {
    const { regions, lines } = getLinearDimensionLines(content)
    const children: ReturnType<typeof target.renderGroup>[] = []
    for (const line of lines) {
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
    }
    if (regions) {
      for (let i = 0; i < 2 && i < regions.length; i++) {
        children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }))
      }
    }
    const { textPosition, text, textRotation } = getTextPosition(content)
    children.push(target.renderGroup(
      [
        target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily),
      ],
      {
        rotation: textRotation,
        base: textPosition,
      }
    ))
    return target.renderGroup(children)
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      return {
        editPoints: [
          {
            x: content.position.x,
            y: content.position.y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isLinearDimensionContent(c)) {
                return
              }
              c.position.x += cursor.x - start.x
              c.position.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          }
        ]
      }
    })
  },
  getLines: getLinearDimensionLines,
}

export function getLinearDimensionLines(content: Omit<LinearDimensionContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const center = getTwoPointCenter(content.p1, content.p2)
    let line1Points: Position[]
    let line2Points: Position[]
    let line3Points: Position[]
    let arrow1Points: Position[]
    let arrow2Points: Position[]
    let textPoints: Position[] = []
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
      line1Points = [left, getPointByLengthAndAngle(left, distance + dimensionStyle.textDistance, r + direction * Math.PI / 2)]
      line2Points = [right, getPointByLengthAndAngle(right, distance + dimensionStyle.textDistance, r + direction * Math.PI / 2)]
      const p1 = getPointByLengthAndAngle(left, distance, r + direction * Math.PI / 2)
      const p2 = getPointByLengthAndAngle(right, distance, r + direction * Math.PI / 2)
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
      const arrow1 = getPointByLengthAndAngle(p1, dimensionStyle.arrowSize, r)
      const arrow2 = getPointByLengthAndAngle(p2, dimensionStyle.arrowSize, r + Math.PI)
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
    } else if (rotation > Math.PI / 4 && rotation < Math.PI * 3 / 4) {
      const direction = content.position.y > center.y ? 1 : -1
      line1Points = [content.p1, { x: content.p1.x, y: content.position.y + direction * dimensionStyle.textDistance }]
      line2Points = [content.p2, { x: content.p2.x, y: content.position.y + direction * dimensionStyle.textDistance }]
      const p1 = { x: content.p1.x, y: content.position.y }
      const p2 = { x: content.p2.x, y: content.position.y }
      line3Points = [
        { x: Math.min(content.p1.x, content.p2.x, content.position.x), y: content.position.y },
        { x: Math.max(content.p1.x, content.p2.x, content.position.x), y: content.position.y },
      ]
      const p1ArrowSize = p1.x < p2.x ? dimensionStyle.arrowSize : -dimensionStyle.arrowSize
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
      line1Points = [content.p1, { x: content.position.x + direction * dimensionStyle.textDistance, y: content.p1.y }]
      line2Points = [content.p2, { x: content.position.x + direction * dimensionStyle.textDistance, y: content.p2.y }]
      const p1 = { x: content.position.x, y: content.p1.y }
      const p2 = { x: content.position.x, y: content.p2.y }
      line3Points = [
        { x: content.position.x, y: Math.min(content.p1.y, content.p2.y, content.position.y) },
        { x: content.position.x, y: Math.max(content.p1.y, content.p2.y, content.position.y) },
      ]
      const p1ArrowSize = p1.y < p2.y ? dimensionStyle.arrowSize : -dimensionStyle.arrowSize
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
    const { textPosition, size, textRotation } = getTextPosition(content)
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
  })
}

export function isLinearDimensionContent(content: BaseContent): content is LinearDimensionContent {
  return content.type === 'linear dimension'
}

const textPositionMap = new WeakmapCache<Omit<LinearDimensionContent, 'type'>, {
  textPosition: Position
  size?: Size
  text: string
  textRotation: number
}>()
function getTextPosition(content: Omit<LinearDimensionContent, 'type'>) {
  return textPositionMap.get(content, () => {
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
      textPosition = getPointByLengthAndDirection(footPoint, distance + direction * dimensionStyle.textDistance, content.position)
      text = getTwoNumbersDistance(left.x, right.x).toString()
      size = getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, text)
      if (size) {
        textPosition = getPointByLengthAndAngle(textPosition, size.width / 2, textRotation - Math.PI)
      }
    } else if (rotation > Math.PI / 4 && rotation < Math.PI * 3 / 4) {
      textPosition = {
        x: content.position.x,
        y: content.position.y - dimensionStyle.textDistance,
      }
      text = getTwoNumbersDistance(content.p1.x, content.p2.x).toString()
      size = getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, text)
      if (size) {
        textPosition.x -= size.width / 2
      }
    } else {
      textPosition = {
        x: content.position.x - dimensionStyle.textDistance,
        y: content.position.y,
      }
      text = getTwoNumbersDistance(content.p1.y, content.p2.y).toString()
      size = getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, text)
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
  })
}
