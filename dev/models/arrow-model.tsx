import React from "react"
import { dashedPolylineToLines, getPointByLengthAndDirection, getPointsBounding, iteratePolygonLines, iteratePolylineLines, NumberEditor, ObjectEditor, Position, rotatePositionByCenter } from "../../src"
import { LineContent } from "./line-model"
import { getGeometriesFromCache, Model, StrokeBaseContent, getEditPointsFromCache, BaseContent, getStrokeContentPropertyPanel } from "./model"
import { dimensionStyle } from "./radial-dimension-model"

export type ArrowContent = StrokeBaseContent<'arrow'> & {
  p1: Position
  p2: Position
}

export const arrowModel: Model<ArrowContent> = {
  type: 'arrow',
  move(content, offset) {
    content.p1.x += offset.x
    content.p1.y += offset.y
    content.p2.x += offset.x
    content.p2.y += offset.y
  },
  render({ content, target, color, strokeWidth }) {
    const { regions, renderingLines } = getArrowGeometriesFromCache(content)
    const children: ReturnType<typeof target.renderGroup>[] = []
    for (const line of renderingLines) {
      children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
    }
    if (regions) {
      for (let i = 0; i < 2 && i < regions.length; i++) {
        children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }))
      }
    }
    return target.renderGroup(children)
  },
  getDefaultColor(content) {
    return content.strokeColor
  },
  getDefaultStrokeWidth(content) {
    return content.strokeWidth
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      return {
        editPoints: [
          {
            ...content.p1,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isArrowContent(c)) {
                return
              }
              c.p1.x += cursor.x - start.x
              c.p1.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },
          {
            ...content.p2,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isArrowContent(c)) {
                return
              }
              c.p2.x += cursor.x - start.x
              c.p2.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          },
        ]
      }
    })
  },
  getGeometries: getArrowGeometriesFromCache,
  propertyPanel(content, update) {
    return {
      p1: <ObjectEditor
        inline
        properties={{
          x: <NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.x = v } })} />,
          y: <NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.y = v } })} />,
        }}
      />,
      p2: <ObjectEditor
        inline
        properties={{
          x: <NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.x = v } })} />,
          y: <NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.y = v } })} />,
        }}
      />,
      ...getStrokeContentPropertyPanel(content, update, isArrowContent),
    }
  },
}

export function getArrowGeometriesFromCache(content: Omit<ArrowContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const points = [content.p1, content.p2]
    const arrow = getPointByLengthAndDirection(content.p2, dimensionStyle.arrowSize, content.p1)
    const arrowPoints = [
      content.p2,
      rotatePositionByCenter(arrow, content.p2, dimensionStyle.arrowAngle),
      rotatePositionByCenter(arrow, content.p2, -dimensionStyle.arrowAngle),
    ]
    return {
      points: [],
      lines: Array.from(iteratePolylineLines(points)),
      bounding: getPointsBounding(points),
      regions: [
        {
          points: arrowPoints,
          lines: Array.from(iteratePolygonLines(arrowPoints)),
        }
      ],
      renderingLines: dashedPolylineToLines(points, content.dashArray),
    }
  })
}

export function isArrowContent(content: BaseContent): content is ArrowContent {
  return content.type === 'arrow'
}
