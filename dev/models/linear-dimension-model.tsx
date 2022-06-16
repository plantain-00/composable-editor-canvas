import { getLinearDimensionGeometries, getLinearDimensionTextPosition, LinearDimension, Position, Size, WeakmapCache } from "../../src"
import { LineContent } from "./line-model"
import { getGeometriesFromCache, Model, StrokeBaseContent, getEditPointsFromCache, BaseContent } from "./model"
import { dimensionStyle, getTextSizeFromCache } from "./radial-dimension-model"

export type LinearDimensionContent = StrokeBaseContent<'linear dimension'> & LinearDimension

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
    const { regions, lines } = getLinearDimensionGeometriesFromCache(content)
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
  getGeometries: getLinearDimensionGeometriesFromCache,
}

export function getLinearDimensionGeometriesFromCache(content: Omit<LinearDimensionContent, "type">) {
  return getGeometriesFromCache(content, () => {
    return getLinearDimensionGeometries(content, dimensionStyle, getTextPosition)
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
    return getLinearDimensionTextPosition(content, dimensionStyle.margin, getTextSizeFromCache)
  })
}
