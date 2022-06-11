import { Circle, getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTextSize, getTwoPointsDistance, MapCache2, Position, rotatePosition, rotatePositionByCenter, Size, WeakmapCache } from "../../src"
import { iteratePolylineLines, LineContent } from "./line-model"
import { getLinesAndPointsFromCache, Model, StrokeBaseContent, getEditPointsFromCache, BaseContent } from "./model"
import { iteratePolygonLines } from "./polygon-model"
import { TextStyle } from "./text-model"

export type RadialDimensionContent = StrokeBaseContent<'radial dimension'> & Circle & TextStyle & {
  position: Position
}

export const radialDimensionModel: Model<RadialDimensionContent> = {
  type: 'radial dimension',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
    content.position.x += offset.x
    content.position.y += offset.y
  },
  render({ content, target, color, strokeWidth }) {
    const { regions, lines } = getRadialDimensionLines(content)
    const children: ReturnType<typeof target.renderGroup>[] = []
    for (const line of lines) {
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
    }
    if (regions && regions.length > 0) {
      children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth, fillColor: color }))
    }
    const { textPosition, rotation } = getTextPosition(content)
    children.push(target.renderGroup(
      [
        target.renderText(textPosition.x, textPosition.y, `R${content.r}`, color, content.fontSize, content.fontFamily),
      ],
      {
        rotation,
        base: textPosition,
      },
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
              if (!isRadialDimensionContent(c)) {
                return
              }
              c.position.x += cursor.x - start.x
              c.position.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          }
        ]
      }
    })
  },
  getLines: getRadialDimensionLines,
}

export function getRadialDimensionLines(content: Omit<RadialDimensionContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const edgePoint = getPointByLengthAndDirection(content, content.r, content.position)
    const distance = getTwoPointsDistance(content, content.position)
    const arrowPoint = getPointByLengthAndDirection(edgePoint, 10, content.position)
    const arrowTail1 = rotatePositionByCenter(arrowPoint, edgePoint, 15)
    const arrowTail2 = rotatePositionByCenter(arrowPoint, edgePoint, -15)
    const linePoints = [distance > content.r ? content : edgePoint, content.position]
    const arrowPoints = [edgePoint, arrowTail1, arrowTail2]
    let textPoints: Position[] = []
    const { textPosition, rotation, size } = getTextPosition(content)
    if (size) {
      textPoints = [
        { x: textPosition.x, y: textPosition.y - size.height },
        { x: textPosition.x + size.width, y: textPosition.y - size.height },
        { x: textPosition.x + size.width, y: textPosition.y },
        { x: textPosition.x, y: textPosition.y },
      ].map((p) => rotatePosition(p, textPosition, rotation))
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
  })
}

export function isRadialDimensionContent(content: BaseContent): content is RadialDimensionContent {
  return content.type === 'radial dimension'
}

const textSizeMap = new MapCache2<string, string, Size | undefined>()
export function getTextSizeFromCache(font: string, text: string) {
  return textSizeMap.get(font, text, () => getTextSize(font, text))
}

const textPositionMap = new WeakmapCache<Omit<RadialDimensionContent, 'type'>, {
  textPosition: Position
  rotation: number
  size?: Size
}>()
function getTextPosition(content: Omit<RadialDimensionContent, 'type'>) {
  return textPositionMap.get(content, () => {
    let textPosition = content.position
    const size = getTextSizeFromCache(`${content.fontSize}px ${content.fontFamily}`, `R${content.r}`)
    let rotation = Math.atan2(content.position.y - content.y, content.position.x - content.x)
    if (size) {
      const distance = getTwoPointsDistance(content, content.position)
      if (distance > content.r) {
        if (content.position.x > content.x) {
          textPosition = getPointByLengthAndDirection(content.position, size.width, content)
        } else {
          rotation = rotation - Math.PI
        }
      } else if (content.position.x < content.x) {
        textPosition = getPointByLengthAndDirection(content.position, -size.width, content)
        rotation = rotation + Math.PI
      }
    }
    textPosition = getPointByLengthAndAngle(textPosition, 5, rotation - Math.PI / 2)
    return {
      textPosition,
      rotation,
      size,
    }
  })
}
