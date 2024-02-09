import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type RegularPolygonContent = model.BaseContent<'regular polygon'> & model.StrokeFields & model.FillFields & core.Position & {
  radius: number
  count: number
  angle: number
}

export function getModel(ctx: PluginContext): model.Model<RegularPolygonContent> {
  const RegularPolygonContent = ctx.and(ctx.BaseContent('regular polygon'), ctx.StrokeFields, ctx.FillFields, ctx.Position, {
    radius: ctx.number,
    count: ctx.number,
    angle: ctx.number,
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[] }>>()
  function getRegularPolygonGeometriesFromCache(content: Omit<RegularPolygonContent, "type">) {
    return geometriesCache.get(content, () => {
      const angle = -(content.angle ?? 0)
      const p0 = ctx.rotatePositionByCenter({ x: content.x + content.radius, y: content.y }, content, angle)
      const points: core.Position[] = []
      for (let i = 0; i < content.count; i++) {
        points.push(ctx.rotatePositionByCenter(p0, content, 360 / content.count * i))
      }
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        points,
        lines,
        bounding: ctx.getPointsBounding(points),
        regions: ctx.hasFill(content) ? [
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
    type: 'regular polygon',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      ctx.movePoint(content, offset)
    },
    scale(content, center, scale) {
      ctx.scalePoint(content, center, scale)
      content.radius *= scale
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getRegularPolygonGeometriesFromCache(content).lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      distance *= this.isPointIn?.(content, point) ? -1 : 1
      const radius = distance / Math.cos(Math.PI / content.count)
      return ctx.produce(content, (d) => {
        d.radius += radius
      })
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      const { points } = getRegularPolygonGeometriesFromCache(content)
      return target.renderPolygon(points, options)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getRegularPolygonGeometriesFromCache(content)
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
              type: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRegularPolygonContent(c)) {
                  return
                }
                c.x += cursor.x - start.x
                c.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            },
            ...points.map(p => ({
              x: p.x,
              y: p.y,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isRegularPolygonContent(c)) {
                  return
                }
                c.radius = ctx.getTwoPointsDistance(cursor, c)
                c.angle = ctx.radianToAngle(ctx.getTwoPointsRadian(cursor, c))
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            } as core.EditPoint<model.BaseContent>))
          ]
        }
      })
    },
    getGeometries: getRegularPolygonGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRegularPolygonContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.y = v } })} />,
        radius: <ctx.NumberEditor value={content.radius} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.radius = v } })} />,
        count: <ctx.NumberEditor value={content.count} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.count = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, RegularPolygonContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getRegularPolygonGeometriesFromCache(content).points),
  }
}

export function isRegularPolygonContent(content: model.BaseContent): content is RegularPolygonContent {
  return content.type === 'regular polygon'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="91,40 53,7 10,33 22,82 72,85" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create regular polygon',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create regular polygon',
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            contents.push({
              type: 'regular polygon',
              x: p0.x,
              y: p0.y,
              radius: ctx.getTwoPointsDistance(p0, p1),
              count: 5,
              angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
              strokeStyleId,
              fillStyleId,
            } as RegularPolygonContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: RegularPolygonContent[] = []
      if (line) {
        const [p0, p1] = line
        assistentContents.push({
          type: 'regular polygon',
          x: p0.x,
          y: p0.y,
          radius: ctx.getTwoPointsDistance(p0, p1),
          count: 5,
          angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
          strokeStyleId,
          fillStyleId,
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
