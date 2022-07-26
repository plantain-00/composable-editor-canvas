import { getRadialDimensionGeometries, getTwoPointsDistance, RadialDimension, WeakmapCache2 } from "../../src"
import { ArcContent, isArcContent } from "./arc-model"
import { CircleContent, isCircleContent } from "./circle-model"
import { LineContent } from "./line-model"
import { Model, StrokeBaseContent, getEditPointsFromCache, BaseContent, Geometries } from "./model"
import { dimensionStyle, getTextPosition } from "./radial-dimension-model"

export type RadialDimensionReferenceContent = StrokeBaseContent<'radial dimension reference'> & RadialDimension & {
  refId: number
}

export const radialDimensionReferenceModel: Model<RadialDimensionReferenceContent> = {
  type: 'radial dimension reference',
  move(content, offset) {
    content.position.x += offset.x
    content.position.y += offset.y
  },
  render({ content, target, color, strokeWidth, contents }) {
    const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents)
    const children: ReturnType<typeof target.renderGroup>[] = []
    for (const line of lines) {
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
    }
    if (regions && regions.length > 0) {
      children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth, fillColor: color }))
    }
    const referenceTarget = getRadialDimensionReferenceTarget(content.refId, contents)
    if (referenceTarget) {
      const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget)
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily),
        ],
        {
          rotation: textRotation,
          base: textPosition,
        },
      ))
    }

    return target.renderGroup(children)
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getEditPoints(content, contents) {
    return getEditPointsFromCache(content, () => {
      return {
        editPoints: [
          {
            x: content.position.x,
            y: content.position.y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isRadialDimensionReferenceContent(c)) {
                return
              }
              c.position.x += cursor.x - start.x
              c.position.y += cursor.y - start.y
              const target = getRadialDimensionReferenceTarget(c.refId, contents)
              if (!target || getTwoPointsDistance(target, c.position) > target.r) {
                return
              }
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [target, cursor] } as LineContent] }
            },
          }
        ]
      }
    })
  },
  getGeometries: getRadialDimensionReferenceGeometriesFromCache,
}

export function getRadialDimensionReferenceGeometriesFromCache(content: Omit<RadialDimensionReferenceContent, "type">, contents: readonly BaseContent[]) {
  const target = getRadialDimensionReferenceTarget(content.refId, contents)
  if (target) {
    return radialDimensionReferenceLinesCache.get(target, content, () => {
      return getRadialDimensionGeometries(content, target, dimensionStyle, getTextPosition)
    })
  }
  return { lines: [], points: [] }
}

export function isRadialDimensionReferenceContent(content: BaseContent): content is RadialDimensionReferenceContent {
  return content.type === 'radial dimension reference'
}

const radialDimensionReferenceLinesCache = new WeakmapCache2<Omit<CircleContent | ArcContent, 'type'>, Omit<RadialDimensionReferenceContent, "type">, Geometries>()

function getRadialDimensionReferenceTarget(id: number, contents: readonly BaseContent[]) {
  return contents.find((c): c is CircleContent | ArcContent => (isCircleContent(c) || isArcContent(c)) && c.id === id)
}
