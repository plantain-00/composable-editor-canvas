import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export function getModel(ctx: PluginContext): model.Model<model.FillStyleContent> {
  function getGeometriesFromCache(content: Omit<model.FillStyleContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x, y: content.y },
        { x: content.x + content.width, y: content.y },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x, y: content.y + content.height },
      ]
      return {
        points: [],
        lines: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points,
            lines: Array.from(ctx.iteratePolygonLines(points)),
          }
        ],
        renderingLines: [],
      }
    })
  }
  const React = ctx.React
  return {
    type: 'fill style',
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render(content, { target, getFillColor, transformColor, getFillPattern }) {
      const options = {
        strokeColor: content.isCurrent ? transformColor(0xff0000) : undefined,
        strokeWidth: content.isCurrent ? 1 : 0,
        fillColor: getFillColor(content),
        fillPattern: getFillPattern(content,)
      }
      return target.renderRect(content.x, content.y, content.width, content.height, options)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!ctx.isFillStyleContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        isCurrent: <ctx.BooleanEditor value={content.isCurrent === true} setValue={(v) => update((c, draft) => {
          if (ctx.isFillStyleContent(c)) {
            const currentFillStyle = ctx.getFillStyles(contents).find(s => s.content.isCurrent)
            if (currentFillStyle) {
              const c = draft[currentFillStyle.index]
              if (c && ctx.isFillStyleContent(c)) {
                c.isCurrent = undefined
              }
            }
            c.isCurrent = v ? true : undefined
          }
        })} />,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (ctx.isFillStyleContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (ctx.isFillStyleContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (ctx.isFillStyleContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (ctx.isFillStyleContent(c)) { c.height = v } })} />,
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="5" y="6" width="89" height="39" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></rect>
      <pattern id="1" patternUnits="userSpaceOnUse" width="20" height="20">
        <path d="M 0 10 L 10 0 M 20 10 L 10 20" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path>
      </pattern>
      <rect x="5" y="55" width="89" height="39" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="url(#1)" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'create fill style',
    selectCount: 0,
    icon,
    useCommand({ onEnd, type, scale }) {
      const [result, setResult] = React.useState<model.FillStyleContent>()
      const reset = () => {
        setResult(undefined)
      }
      ctx.useKey((e) => e.key === 'Escape', reset, [setResult])
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result)
                }
              },
            })
            reset()
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: 'fill style',
              x: p.x,
              y: p.y,
              width: 100 / scale,
              height: 20 / scale,
              fillColor: 0x000000,
            })
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}
