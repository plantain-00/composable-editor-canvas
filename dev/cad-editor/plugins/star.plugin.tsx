import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'

export type StarContent = model.BaseContent<'star'> & model.StrokeFields & model.FillFields & core.Position & {
  outerRadius: number
  innerRadius: number
  count: number
  angle?: number
}

export function getModel(ctx: PluginContext): model.Model<StarContent> {
  const StarContent = ctx.and(ctx.BaseContent('star'), ctx.StrokeFields, ctx.FillFields, ctx.Position, {
    outerRadius: ctx.number,
    innerRadius: ctx.number,
    count: ctx.number,
    angle: ctx.optional(ctx.number),
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[] }>>()
  function getStarGeometriesFromCache(content: Omit<StarContent, "type">) {
    return geometriesCache.get(content, () => {
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
    type: 'star',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getStarGeometriesFromCache(content).lines.map(line => ctx.getPointAndLineSegmentMinimumDistance(point, ...line)))
      }
      distance *= this.isPointIn?.(content, point) ? -1 : 1
      const angle = Math.PI / content.count
      const length = Math.sqrt(content.innerRadius ** 2 + content.outerRadius ** 2 - 2 * content.innerRadius * content.outerRadius * Math.cos(angle))
      distance *= length / Math.sin(angle)
      return ctx.produce(content, (d) => {
        d.outerRadius += distance / content.innerRadius
        d.innerRadius += distance / content.outerRadius
      })
    },
    render(content, { target, getFillColor, getStrokeColor, transformStrokeWidth, getFillPattern, contents, clip }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const fillStyleContent = ctx.getFillStyleContent(content, contents)
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray,
        clip,
      }
      const { points } = getStarGeometriesFromCache(content)
      return target.renderPolygon(points, options)
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isStarContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isStarContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isStarContent(c)) { c.y = v } })} />,
        outerRadius: <ctx.NumberEditor value={content.outerRadius} setValue={(v) => update(c => { if (isStarContent(c)) { c.outerRadius = v } })} />,
        innerRadius: <ctx.NumberEditor value={content.innerRadius} setValue={(v) => update(c => { if (isStarContent(c)) { c.innerRadius = v } })} />,
        count: <ctx.NumberEditor value={content.count} setValue={(v) => update(c => { if (isStarContent(c)) { c.count = v } })} />,
        angle: <ctx.NumberEditor value={content.angle ?? 0} setValue={(v) => update(c => { if (isStarContent(c)) { c.angle = v === 0 ? undefined : v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, StarContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getStarGeometriesFromCache(content).points),
    getParam: (content, point) => ctx.getLinesParamAtPoint(point, getStarGeometriesFromCache(content).lines),
    getPoint: (content, param) => ctx.getLinesPointAtParam(param, getStarGeometriesFromCache(content).lines),
  }
}

export function isStarContent(content: model.BaseContent): content is StarContent {
  return content.type === 'star'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="75,84 70,56 90,36 62,32 49,7 37,33 9,37 29,56 25,84 50,71" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create star',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
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
              angle: ctx.radianToAngle(ctx.getTwoPointsAngle(p1, p0)),
              strokeStyleId,
              fillStyleId,
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
          angle: ctx.radianToAngle(ctx.getTwoPointsAngle(p1, p0)),
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
