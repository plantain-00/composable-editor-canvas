import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export function getModel(ctx: PluginContext): model.Model<model.TextStyleContent> {
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<core.Size & { text: string }>>()
  function getGeometriesFromCache(content: Omit<model.TextStyleContent, "type">) {
    return geometriesCache.get(content, () => {
      const text = `${content.fontFamily} ${content.fontSize} ${ctx.getColorString(content.color)}`
      const width = ctx.getTextSizeFromCache(ctx.getTextStyleFont(content), text)?.width ?? 0
      const height = content.fontSize * 1.2
      const points = ctx.getPolygonFromTwoPointsFormRegion({ start: content, end: { x: content.x + width, y: content.y + height } })
      return {
        lines: [],
        bounding: ctx.getPointsBounding(points),
        text,
        width,
        height,
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
    type: 'text style',
    ...ctx.textModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    render(content, { target, transformColor }) {
      const { width, height, text } = getGeometriesFromCache(content)
      return target.renderGroup([
        target.renderRect(content.x, content.y, width, height, {
          strokeColor: transformColor(content.isCurrent ? 0xff0000 : 0x000000)
        }),
        target.renderText(content.x, content.y, text, content.color, content.fontSize, content.fontFamily, { textBaseline: 'top' }),
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
                if (!ctx.isTextStyleContent(c)) {
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
          if (ctx.isTextStyleContent(c)) {
            const currentTextStyle = ctx.getTextStyles(contents).find(s => s.content.isCurrent)
            if (currentTextStyle) {
              const c = draft[currentTextStyle.index]
              if (c && ctx.isTextStyleContent(c)) {
                c.isCurrent = undefined
              }
            }
            c.isCurrent = v ? true : undefined
          }
        })} />,
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (ctx.isTextStyleContent(c)) { c.x = p.x; c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (ctx.isTextStyleContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (ctx.isTextStyleContent(c)) { c.y = v } })} />,
        ...ctx.getTextContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, ctx.TextStyleContent, p),
  }
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="6,7 40,7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="23,7 23,43" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="61,7 82,7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="72,7 72,26" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="51,49 90,49" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="71,47 71,94" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="11,71 32,71" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="21,71 21,89" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return {
    name: 'create text style',
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState<model.TextStyleContent>()
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
              type: 'text style',
              x: p.x,
              y: p.y,
              fontFamily: 'monospace',
              fontSize: 20,
              color: 0x000000,
            })
          }
        },
        assistentContents: result ? [result] : undefined,
        reset,
      }
    },
  }
}
