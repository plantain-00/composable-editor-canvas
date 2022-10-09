import React from "react"
import { BooleanEditor, getRadialDimensionGeometries, getTwoPointsDistance, Nullable, NumberEditor, ObjectEditor, RadialDimension, StringEditor, WeakmapCache2 } from "../../src"
import { ArcContent, isArcContent } from "./arc-model"
import { CircleContent, isCircleContent } from "./circle-model"
import { LineContent } from "./line-model"
import { Model, StrokeBaseContent, getEditPointsFromCache, BaseContent, Geometries, getStrokeContentPropertyPanel } from "./model"
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
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth, dashArray: content.dashArray }))
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
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
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
  propertyPanel(content, update) {
    return {
      position: <ObjectEditor
        inline
        properties={{
          x: <NumberEditor value={content.position.x} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.x = v } })} />,
          y: <NumberEditor value={content.position.y} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.position.y = v } })} />,
        }}
      />,
      text: <>
        <BooleanEditor value={content.text !== undefined} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v ? '' : undefined } })} style={{ marginRight: '5px' }} />
        {content.text !== undefined && <StringEditor value={content.text} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.text = v } })} />}
      </>,
      fontSize: <NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontSize = v } })} />,
      fontFamily: <StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isRadialDimensionReferenceContent(c)) { c.fontFamily = v } })} />,
      ...getStrokeContentPropertyPanel(content, update, isRadialDimensionReferenceContent),
    }
  },
}

export function getRadialDimensionReferenceGeometriesFromCache(content: Omit<RadialDimensionReferenceContent, "type">, contents: readonly Nullable<BaseContent>[]) {
  const target = getRadialDimensionReferenceTarget(content.refId, contents)
  if (target) {
    return radialDimensionReferenceLinesCache.get(target, content, () => {
      return getRadialDimensionGeometries(content, target, dimensionStyle, getTextPosition)
    })
  }
  return { lines: [], points: [], renderingLines: [] }
}

export function isRadialDimensionReferenceContent(content: BaseContent): content is RadialDimensionReferenceContent {
  return content.type === 'radial dimension reference'
}

const radialDimensionReferenceLinesCache = new WeakmapCache2<Omit<CircleContent | ArcContent, 'type'>, Omit<RadialDimensionReferenceContent, "type">, Geometries>()

function getRadialDimensionReferenceTarget(id: number, contents: readonly Nullable<BaseContent>[]) {
  return contents.find((c): c is CircleContent | ArcContent => !!c && (isCircleContent(c) || isArcContent(c)) && c.id === id)
}
