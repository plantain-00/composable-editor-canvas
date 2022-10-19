import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

export type StarContent = model.BaseContent<'star'> & model.StrokeFields & model.FillFields & core.Position & {
  outerRadius: number
  innerRadius: number
  count: number
  angle?: number
}

export function getModel(ctx: PluginContext): model.Model<StarContent> {
  function getStarGeometriesFromCache(content: Omit<StarContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const angle = -(content.angle ?? 0)
      const p0 = ctx.rotatePositionByCenter({ x: content.x + content.outerRadius, y: content.y }, content, angle)
      const p1 = ctx.rotatePositionByCenter({ x: content.x + content.innerRadius, y: content.y }, content, angle + 180 / content.count)
      const points: core.Position[] = []
      for (let i = 0; i < content.count; i++) {
        const angle = 360 / content.count * i
        points.push(
          ctx.rotatePositionByCenter(p0, content, angle),
          ctx.rotatePositionByCenter(p1, content, angle),
        )
      }
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        points,
        lines,
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== undefined ? [
          {
            lines,
            points,
          },
        ] : undefined,
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'star',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      const { points } = getStarGeometriesFromCache(content)
      return target.renderPolygon(points, { [colorField]: color, strokeWidth })
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getStarGeometriesFromCache(content)
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isStarContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            },
            ...points.map((p, i) => ({
              x: p.x,
              y: p.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isStarContent(c)) {
                  return
                }
                if (i % 2 === 0) {
                  c.outerRadius = ctx.getTwoPointsDistance(cursor, c)
                } else {
                  c.innerRadius = ctx.getTwoPointsDistance(cursor, c)
                }
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            } as core.EditPoint<model.BaseContent>))
          ]
        }
      })
    },
    getGeometries: getStarGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isStarContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isStarContent(c)) { c.y = v } })} />,
        outerRadius: <ctx.NumberEditor value={content.outerRadius} setValue={(v) => update(c => { if (isStarContent(c)) { c.outerRadius = v } })} />,
        innerRadius: <ctx.NumberEditor value={content.innerRadius} setValue={(v) => update(c => { if (isStarContent(c)) { c.innerRadius = v } })} />,
        count: <ctx.NumberEditor value={content.count} setValue={(v) => update(c => { if (isStarContent(c)) { c.count = v } })} />,
        angle: <ctx.NumberEditor value={content.angle ?? 0} setValue={(v) => update(c => { if (isStarContent(c)) { c.angle = v === 0 ? undefined : v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

export function isStarContent(content: model.BaseContent): content is StarContent {
  return content.type === 'star'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="75,84 70.10506171865889,56.40597325071819 90.0613464134089,36.73016490136938 62.30524834733077,32.85850464193647 49.75927371857041,7.798790883939958 37.5,33 9.789876562682231,37.18805349856361 29.969326793295547,56.63491754931531 25.389503305338458,84.28299071612705 50.1203631407148,71.10060455803003" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create star',
    icon,
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create star',
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(p0, p1)
            contents.push({
              type: 'star',
              x: p0.x,
              y: p0.y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              count: 5,
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
            } as StarContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: StarContent[] = []
      if (line) {
        const [p0, p1] = line
        const outerRadius = ctx.getTwoPointsDistance(p0, p1)
        assistentContents.push({
          type: 'star',
          x: p0.x,
          y: p0.y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          count: 5,
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset,
      }
    },
    selectCount: 0,
  }
}
