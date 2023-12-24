import type { PluginContext } from './types'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export function getModel(ctx: PluginContext): model.Model<model.StrokeStyleContent> {
  function getGeometriesFromCache(content: Omit<model.StrokeStyleContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x, y: content.y },
        { x: content.x + content.width, y: content.y },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x, y: content.y + content.height },
      ]
      return {
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
    type: 'stroke style',
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, transformColor }) {
      const options = {
        strokeColor: getStrokeColor(content),
        strokeWidth: transformStrokeWidth(content.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        dashArray: content.dashArray,
        strokeOpacity: content.strokeOpacity,
      }
      return target.renderGroup([
        target.renderRect(content.x, content.y, content.width, content.height, {
          strokeColor: transformColor(content.isCurrent ? 0xff0000 : 0x000000)
        }),
        target.renderPolyline([
          { x: content.x, y: content.y + content.height / 2 },
          { x: content.x + content.width, y: content.y + content.height / 2 },
        ], options),
      ])
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!ctx.isStrokeStyleContent(c)) {
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        isCurrent: <ctx.BooleanEditor value={content.isCurrent === true} setValue={(v) => update((c, draft) => {
          if (ctx.isStrokeStyleContent(c)) {
            const currentStrokeStyle = ctx.getStrokeStyles(contents).find(s => s.content.isCurrent)
            if (currentStrokeStyle) {
              const c = draft[currentStrokeStyle.index]
              if (c && ctx.isStrokeStyleContent(c)) {
                c.isCurrent = undefined
              }
            }
            c.isCurrent = v ? true : undefined
          }
        })} />,
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (ctx.isStrokeStyleContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (ctx.isStrokeStyleContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (ctx.isStrokeStyleContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (ctx.isStrokeStyleContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (ctx.isStrokeStyleContent(c)) { c.height = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, ctx.StrokeStyleContent, p),
  }
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="0,22 100,22" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,45 100,45" strokeWidth="10" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,65 100,65" strokeWidth="5" strokeDasharray="10 5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="0,81 100,81" strokeWidth="5" strokeDasharray="15" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create stroke style',
    selectCount: 0,
    icon,
    useCommand({ onEnd, type, scale }) {
      const [result, setResult] = React.useState<model.StrokeStyleContent>()
      const reset = () => {
        setResult(undefined)
      }
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
              type: 'stroke style',
              x: p.x,
              y: p.y,
              width: 100 / scale,
              height: 20 / scale,
            })
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}
