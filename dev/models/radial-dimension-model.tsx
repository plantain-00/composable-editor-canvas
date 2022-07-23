import { Circle, getRadialDimensionGeometries, getRadialDimensionTextPosition, getTextSize, getTwoPointsDistance, MapCache2, Position, RadialDimension, Size, WeakmapCache2 } from "../../src"
import { LineContent } from "./line-model"
import { getGeometriesFromCache, Model, StrokeBaseContent, getEditPointsFromCache, BaseContent } from "./model"

export type RadialDimensionContent = StrokeBaseContent<'radial dimension'> & Circle & RadialDimension

export const radialDimensionModel: Model<RadialDimensionContent> = {
  type: 'radial dimension',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
    content.position.x += offset.x
    content.position.y += offset.y
  },
  render({ content, target, color, strokeWidth }) {
    const { regions, lines } = getRadialDimensionGeometriesFromCache(content)
    const children: ReturnType<typeof target.renderGroup>[] = []
    for (const line of lines) {
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
    }
    if (regions && regions.length > 0) {
      children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth, fillColor: color }))
    }
    const { textPosition, textRotation, text } = getTextPosition(content, content)
    children.push(target.renderGroup(
      [
        target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily, { cacheKey: content }),
      ],
      {
        rotation: textRotation,
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
              if (getTwoPointsDistance(c, c.position) > c.r) {
                return
              }
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          }
        ]
      }
    })
  },
  getGeometries: getRadialDimensionGeometriesFromCache,
}

export function getRadialDimensionGeometriesFromCache(content: Omit<RadialDimensionContent, "type">) {
  return getGeometriesFromCache(content, () => {
    return getRadialDimensionGeometries(content, content, dimensionStyle, getTextPosition)
  })
}

export function isRadialDimensionContent(content: BaseContent): content is RadialDimensionContent {
  return content.type === 'radial dimension'
}

const textSizeMap = new MapCache2<string, string, Size | undefined>()
export function getTextSizeFromCache(font: string, text: string) {
  return textSizeMap.get(font, text, () => getTextSize(font, text))
}

const textPositionMap = new WeakmapCache2<RadialDimension, Circle, {
  textPosition: Position
  textRotation: number
  size?: Size
  text: string
}>()
export function getTextPosition(content: RadialDimension, circle: Circle) {
  return textPositionMap.get(content, circle, () => {
    return getRadialDimensionTextPosition(content, circle, dimensionStyle.margin, getTextSizeFromCache)
  })
}

export const dimensionStyle = {
  margin: 5,
  arrowAngle: 15,
  arrowSize: 10,
}
