import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type RectContent = model.BaseContent<'rect'> & model.StrokeFields & model.FillFields & core.Region & {
  angle: number
}

export function getModel(ctx: PluginContext): model.Model<RectContent> {
  const RectContent = ctx.and(ctx.BaseContent('rect'), ctx.StrokeFields, ctx.FillFields, ctx.Region, {
    angle: ctx.number
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], midpoints: core.Position[], lines: [core.Position, core.Position][] }>>()
  function getRectGeometries(content: Omit<RectContent, "type">) {
    return geometriesCache.get(content, () => {
      const points = [
        { x: content.x - content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y + content.height / 2 },
      ].map((p) => ctx.rotatePositionByCenter(p, content, -content.angle))
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        lines,
        points,
        midpoints: lines.map(line => ctx.getTwoPointCenter(...line)),
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points,
          },
        ] : undefined,
      }
    })
  }
  const React = ctx.React
  return {
    type: 'rect',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    rotate(content, center, angle) {
      const p = ctx.rotatePositionByCenter(content, center, -angle)
      content.x = p.x
      content.y = p.y
      content.angle += angle
    },
    explode(content) {
      const { lines } = getRectGeometries(content)
      return lines.map((line) => ({ type: 'line', points: line } as LineContent))
    },
    break(content, intersectionPoints) {
      const { lines } = getRectGeometries(content)
      return ctx.breakPolyline(lines, intersectionPoints)
    },
    mirror(content, line, angle) {
      const p = ctx.getSymmetryPoint(content, line)
      content.x = p.x
      content.y = p.y
      content.angle = 2 * angle - content.angle
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getRectGeometries(content).lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      distance *= 2 * (this.isPointIn?.(content, point) ? -1 : 1)
      return ctx.produce(content, (d) => {
        d.width += distance
        d.height += distance
      })
    },
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents, clip }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const fillStyleContent = ctx.getFillStyleContent(content, contents)
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
      }
      if (strokeStyleContent.dashArray) {
        const { points } = getRectGeometries(content)
        return target.renderPolygon(points, { ...options, dashArray: strokeStyleContent.dashArray, clip })
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { ...options, angle: content.angle, clip })
    },
    getOperatorRenderPosition(content) {
      const { points } = getRectGeometries(content)
      return points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content)
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: 'center' as const },
            { ...points[0], direction: 'left-top' as const },
            { ...points[1], direction: 'right-top' as const },
            { ...points[2], direction: 'right-bottom' as const },
            { ...points[3], direction: 'left-bottom' as const },
            { ...midpoints[0], direction: 'top' as const },
            { ...midpoints[1], direction: 'right' as const },
            { ...midpoints[2], direction: 'bottom' as const },
            { ...(midpoints[3] || midpoints[1]), direction: 'left' as const },
          ].map((p, i) => ({
            x: p.x,
            y: p.y,
            type: i === 0 ? 'move' : undefined,
            cursor: ctx.getResizeCursor(content.angle, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRectContent(c)) {
                return
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction, -ctx.angleToRadian(content.angle))
              if (!offset) {
                return
              }
              c.x += offset.x + offset.width / 2
              c.y += offset.y + offset.height / 2
              c.width = Math.abs(c.width + offset.width)
              c.height = Math.abs(c.height + offset.height)
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          }))
        }
      })
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content)
        return [
          { x: content.x, y: content.y, type: 'center' },
          ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
          ...midpoints.map(p => ({ ...p, type: 'midpoint' as const })),
        ]
      })
    },
    getGeometries: getRectGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRectContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRectContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRectContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isRectContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isRectContent(c)) { c.height = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRectContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, RectContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getRectGeometries(content).points),
    getArea: (content) => content.width * content.height,
  }
}

export function isRectContent(content: model.BaseContent): content is RectContent {
  return content.type === 'rect'
}

export function getCommand(ctx: PluginContext): Command {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="11" y="26" width="79" height="48" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
    </svg>
  )
  return {
    name: 'create rect',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create rect',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'rect',
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            angle: 0,
            strokeStyleId,
            fillStyleId,
          } as RectContent)
        }),
        {
          once: true,
        },
      )
      const assistentContents: (RectContent)[] = []
      if (line) {
        assistentContents.push({
          type: 'rect',
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width: Math.abs(line[0].x - line[1].x),
          height: Math.abs(line[0].y - line[1].y),
          angle: 0,
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
    hotkey: 'REC',
  }
}
