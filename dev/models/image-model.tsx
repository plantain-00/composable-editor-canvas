import React from "react"
import { getPointsBounding, Image, iteratePolygonLines, NumberEditor, StringEditor } from "../../src"
import { LineContent } from "./line-model"
import { BaseContent, getEditPointsFromCache, getGeometriesFromCache, Model } from "./model"

export type ImageContent = BaseContent<'image'> & Image

export const imageModel: Model<ImageContent> = {
  type: 'image',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
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
              if (!isImageContent(c)) {
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
  render({ content, target }) {
    return target.renderImage(content.url, content.x, content.y, content.width, content.height)
  },
  renderIfSelected({ content, color, target, strokeWidth }) {
    return target.renderRect(content.x, content.y, content.width, content.height, { strokeColor: color, dashArray: [4], strokeWidth })
  },
  getOperatorRenderPosition(content) {
    return content
  },
  getGeometries: getImageGeometries,
  propertyPanel(content, update) {
    return {
      x: <NumberEditor value={content.x} setValue={(v) => update(c => { if (isImageContent(c)) { c.x = v } })} />,
      y: <NumberEditor value={content.y} setValue={(v) => update(c => { if (isImageContent(c)) { c.y = v } })} />,
      width: <NumberEditor value={content.width} setValue={(v) => update(c => { if (isImageContent(c)) { c.width = v } })} />,
      height: <NumberEditor value={content.height} setValue={(v) => update(c => { if (isImageContent(c)) { c.height = v } })} />,
      url: <StringEditor value={content.url} setValue={(v) => update(c => { if (isImageContent(c)) { c.url = v } })} />,
    }
  },
}

export function getImageGeometries(content: Omit<ImageContent, "type">) {
  return getGeometriesFromCache(content, () => {
    const points = [
      { x: content.x, y: content.y + content.height },
      { x: content.x + content.width, y: content.y + content.height },
      { x: content.x + content.width, y: content.y },
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

export function isImageContent(content: BaseContent): content is ImageContent {
  return content.type === 'image'
}
