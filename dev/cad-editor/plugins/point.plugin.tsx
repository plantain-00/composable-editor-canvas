import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { LineContent } from './line-polyline.plugin'

export type PointContent = model.BaseContent<'point'> & core.Position

export function getModel(ctx: PluginContext): model.Model<PointContent> {
  const PointContent = ctx.and(ctx.BaseContent('point'), ctx.Position)
  function getPointGeometries(content: Omit<PointContent, "type">) {
    return ctx.getGeometriesFromCache(content, new Set(), () => {
      return {
        lines: [[content, content]],
        bounding: ctx.getPointsBounding([content]),
        renderingLines: [],
        regions: [],
      }
    })
  }
  const React = ctx.React
  return {
    type: 'point',
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content, center, angle)
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy)
    },
    skew(content, center, sx, sy) {
      ctx.skewPoint(content, center, sx, sy)
    },
    mirror(content, line) {
      ctx.mirrorPoint(content, line)
    },
    render(content, { target, isHoveringOrSelected, transformStrokeWidth }) {
      const strokeWidth = transformStrokeWidth(1)
      const fuzzy = isHoveringOrSelected && strokeWidth !== 1
      const result = target.renderCircle(content.x, content.y, 1, { fillColor: 0x000000 })
      if (fuzzy) {
        return target.renderGroup([
          target.renderCircle(content.x, content.y, strokeWidth, {
            fillColor: 0x000000,
            strokeWidth: 0,
            fillOpacity: ctx.fuzzyStyle.strokeOpacity,
          }),
          result,
        ])
      }
      return result
    },
    getOperatorRenderPosition(content) {
      return content
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: 'move',
              type: 'move',
              update(c, { cursor, start, scale }) {
                if (!isPointContent(c)) {
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
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => [{ x: content.x, y: content.y, type: 'endpoint' }])
    },
    getGeometries: getPointGeometries,
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isPointContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isPointContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isPointContent(c)) { c.y = v } })} />,
      }
    },
    isValid: (c, p) => ctx.validate(c, PointContent, p),
  }
}

export function isPointContent(content: model.BaseContent): content is PointContent {
  return content.type === 'point'
}

export function getCommand(ctx: PluginContext): Command[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="44" cy="48" r="4" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  return [
    {
      name: 'create point',
      icon,
      useCommand({ type, onEnd }) {
        const [point, setPoint] = React.useState<core.Position>()
        const reset = () => {
          setPoint(undefined)
        }
        const assistentContents: PointContent[] = []
        if (point) {
          assistentContents.push({ ...point, type: 'point' })
        }
        return {
          onStart: (p) => {
            onEnd({
              updateContents: (contents) => contents.push({ x: p.x, y: p.y, type: 'point' } as PointContent)
            })
          },
          onMove(p) {
            if (!type) return
            setPoint(p)
          },
          assistentContents,
          reset,
        }
      },
      selectCount: 0,
    },
  ]
}
