import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type ImageContent = model.BaseContent<'image'> & core.Image

export function getModel(ctx: PluginContext): model.Model<ImageContent> {
  function getImageGeometries(content: Omit<ImageContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x, y: content.y + content.height },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x + content.width, y: content.y },
        { x: content.x, y: content.y },
      ]
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        lines: [],
        points: [],
        bounding: ctx.getPointsBounding(points),
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
  const React = ctx.React
  return {
    type: 'image',
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
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
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isImageContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isImageContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isImageContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isImageContent(c)) { c.height = v } })} />,
        url: <ctx.StringEditor value={content.url} setValue={(v) => update(c => { if (isImageContent(c)) { c.url = v } })} />,
      }
    },
  }
}

export function isImageContent(content: model.BaseContent): content is ImageContent {
  return content.type === 'image'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="100,100 100,50 66,67 28.124783736376884,11.999999999999993 0,36 0,100" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <circle cx="70" cy="22" r="13.601470508735444" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  return {
    name: 'create image',
    useCommand({ onEnd, type }) {
      const { image, onClick, onMove, input, reset } = ctx.useImageClickCreate(
        type === 'create image',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'image',
            ...c,
          } as ImageContent)
        }),
      )
      const assistentContents: ImageContent[] = []
      if (image) {
        assistentContents.push({
          type: 'image',
          ...image,
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        reset,
      }
    },
    selectCount: 0,
    hotkey: 'I',
    icon,
  }
}
