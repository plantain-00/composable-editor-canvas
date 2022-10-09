import React from "react"
import { getPointsBounding, getTextSize, iteratePolygonLines, NumberEditor, StringEditor, Text } from "../../src"
import { LineContent } from "./line-model"
import { BaseContent, getEditPointsFromCache, getGeometriesFromCache, Model } from "./model"

export type TextContent = BaseContent<'text'> & Text

export const textModel: Model<TextContent> = {
  type: 'text',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  getDefaultColor(content) {
    return content.color
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => {
      return {
        editPoints: [
          {
            x: content.x,
            y: content.y,
            cursor: 'move',
            update(c, { cursor, start, scale }) {
              if (!isTextContent(c)) {
                return
              }
              c.x += cursor.x - start.x
              c.y += cursor.y - start.y
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
            },
          },
        ],
      }
    })
  },
  render({ content, target, color }) {
    return target.renderText(content.x, content.y, content.text, color ?? content.color, content.fontSize, content.fontFamily, { cacheKey: content })
  },
  getGeometries: getTextGeometries,
  propertyPanel(content, update) {
    return {
      x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isTextContent(c)) { c.x = v } })} />,
      y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isTextContent(c)) { c.y = v } })} />,
      fontSize: <NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontSize = v } })} />,
      fontFamily: <StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontFamily = v } })} />,
      text: <StringEditor value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />,
      color: <NumberEditor type='color' value={content.color} setValue={(v) => update(c => { if (isTextContent(c)) { c.color = v } })} />,
    }
  },
}

export function getTextGeometries(content: Omit<TextContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const size = getTextSize(`${content.fontSize}px ${content.fontFamily}`, content.text)
    if (!size) {
      throw 'not supported'
    }
    const points = [
      { x: content.x, y: content.y - size.height },
      { x: content.x + size.width, y: content.y - size.height },
      { x: content.x + size.width, y: content.y },
      { x: content.x, y: content.y },
    ]
    const lines = Array.from(iteratePolygonLines(points))
    return {
      lines: [],
      points: [],
      bounding: getPointsBounding(points),
      regions: [
        {
          lines,
          points,
        },
      ],
      renderingLines: [],
    }
  })
}

export function isTextContent(content: BaseContent): content is TextContent {
  return content.type === 'text'
}
