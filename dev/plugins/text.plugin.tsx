import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type TextContent = model.BaseContent<'text'> & core.Text

export function getModel(ctx: PluginContext): model.Model<TextContent> {
  function getTextGeometries(content: Omit<TextContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const size = ctx.getTextSize(`${content.fontSize}px ${content.fontFamily}`, content.text)
      if (!size) {
        throw 'not supported'
      }
      const points = [
        { x: content.x, y: content.y - size.height },
        { x: content.x + size.width, y: content.y - size.height },
        { x: content.x + size.width, y: content.y },
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
    type: 'text',
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
    render({ content, target, transformColor }) {
      const color = transformColor(content.color)
      return target.renderText(content.x, content.y, content.text, color, content.fontSize, content.fontFamily, { cacheKey: content })
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isTextContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isTextContent(c)) { c.y = v } })} />,
        fontSize: <ctx.NumberEditor value={content.fontSize} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontSize = v } })} />,
        fontFamily: <ctx.StringEditor value={content.fontFamily} setValue={(v) => update(c => { if (isTextContent(c)) { c.fontFamily = v } })} />,
        text: <ctx.StringEditor value={content.text} setValue={(v) => update(c => { if (isTextContent(c)) { c.text = v } })} />,
        color: <ctx.NumberEditor type='color' value={content.color} setValue={(v) => update(c => { if (isTextContent(c)) { c.color = v } })} />,
      }
    },
  }
}

export function isTextContent(content: model.BaseContent): content is TextContent {
  return content.type === 'text'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="16,22 83,22" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="49,22 49,89" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create text',
    icon,
    useCommand({ onEnd, type, scale }) {
      const { text, onClick, onMove, input, reset } = ctx.useTextClickCreate(
        type === 'create text',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'text',
            ...c,
          } as TextContent)
        }),
        {
          scale,
        }
      )
      const assistentContents: (TextContent)[] = []
      if (text) {
        assistentContents.push({
          type: 'text',
          ...text,
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
    hotkey: 'T',
  }
}
