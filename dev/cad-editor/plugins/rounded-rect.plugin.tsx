import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type RoundedRectContent = model.BaseContent<'rounded rect'> & model.StrokeFields & model.FillFields & core.Region & model.AngleDeltaFields & {
  radius: number
}

export function getModel(ctx: PluginContext): model.Model<RoundedRectContent> {
  const RoundedRectContent = ctx.and(ctx.BaseContent('rounded rect'), ctx.StrokeFields, ctx.FillFields, ctx.Region, ctx.AngleDeltaFields, {
    radius: ctx.number
  })
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], arcPoints: core.Position[] }>>()
  function getGeometries(content: Omit<RoundedRectContent, "type">) {
    return geometriesCache.get(content, () => {
      const rectPoints = [
        { x: content.x - content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y + content.height / 2 },
      ]
      const points = ctx.getRoundedRectPoints(content, content.radius, content.angleDelta ?? ctx.defaultAngleDelta)
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        lines,
        points: rectPoints,
        arcPoints: [
          { x: rectPoints[0].x + content.radius, y: rectPoints[0].y },
          { x: rectPoints[0].x, y: rectPoints[0].y + content.radius },
          { x: rectPoints[1].x - content.radius, y: rectPoints[1].y },
          { x: rectPoints[1].x, y: rectPoints[1].y + content.radius },
          { x: rectPoints[2].x - content.radius, y: rectPoints[2].y },
          { x: rectPoints[2].x, y: rectPoints[2].y - content.radius },
          { x: rectPoints[3].x + content.radius, y: rectPoints[3].y },
          { x: rectPoints[3].x, y: rectPoints[3].y - content.radius },
        ],
        bounding: ctx.getPointsBounding(rectPoints),
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
    type: 'rounded rect',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.angleDeltaModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getGeometries(content).lines.map(line => ctx.getPointAndLineSegmentMinimumDistance(point, ...line)))
      }
      distance *= this.isPointIn?.(content, point) ? -2 : 2
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
        clip,
      }
      const { renderingLines } = getGeometries(content)
      return target.renderPath(renderingLines, options)
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      const { points, arcPoints } = getGeometries(content)
      return target.renderGroup(points.map((p, i) => target.renderPolyline([arcPoints[2 * i], p, arcPoints[2 * i + 1]], { strokeColor: color, dashArray: [4], strokeWidth })))
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content)
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: 'center' as const },
            { ...points[0], direction: 'left-top' as const },
            { ...points[1], direction: 'right-top' as const },
            { ...points[2], direction: 'right-bottom' as const },
            { ...points[3], direction: 'left-bottom' as const },
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(0, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRoundedRectContent(c)) {
                return
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction)
              if (!offset) {
                return
              }
              c.x += offset.x + offset.width / 2
              c.y += offset.y + offset.height / 2
              c.width += offset.width
              c.height += offset.height
              return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
            },
          }))
        }
      })
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getGeometries(content)
        return [
          { x: content.x, y: content.y, type: 'center' },
          ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: 'midpoint' as const,
          })),
        ]
      })
    },
    getGeometries: getGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isRoundedRectContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRoundedRectContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRoundedRectContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isRoundedRectContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isRoundedRectContent(c)) { c.height = v } })} />,
        radius: <ctx.NumberEditor value={content.radius} setValue={(v) => update(c => { if (isRoundedRectContent(c)) { c.radius = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, RoundedRectContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getGeometries(content).points),
  }
}

export function isRoundedRectContent(content: model.BaseContent): content is RoundedRectContent {
  return content.type === 'rounded rect'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 35 11 L 65 11 L 65 11 L 67 11 L 69 11 L 71 12 L 73 13 L 75 13 L 77 14 L 79 16 L 81 17 L 82 18 L 84 20 L 85 22 L 86 24 L 87 25 L 88 27 L 89 30 L 89 32 L 89 34 L 90 36 L 90 36 L 90 66 L 90 66 L 89 68 L 89 70 L 89 72 L 88 74 L 87 76 L 86 78 L 85 80 L 84 82 L 82 83 L 81 85 L 79 86 L 77 87 L 75 88 L 73 89 L 71 90 L 69 90 L 67 90 L 65 91 L 65 91 L 35 91 L 35 91 L 33 90 L 31 90 L 29 90 L 26 89 L 24 88 L 23 87 L 21 86 L 19 85 L 17 83 L 16 82 L 15 80 L 13 78 L 12 76 L 12 74 L 11 72 L 10 70 L 10 68 L 10 66 L 10 66 L 10 36 L 10 36 L 10 34 L 10 32 L 11 30 L 12 27 L 12 25 L 13 23 L 15 22 L 16 20 L 17 18 L 19 17 L 21 16 L 22 14 L 24 13 L 26 13 L 29 12 L 31 11 L 33 11 L 35 11" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" fillRule="evenodd"></path>
    </svg>
  )
  return {
    name: 'create rounded rect',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create rounded rect',
        (c) => onEnd({
          updateContents: (contents) => {
            const width = Math.abs(c[0].x - c[1].x)
            const height = Math.abs(c[0].y - c[1].y)
            contents.push({
              type: 'rounded rect',
              x: (c[0].x + c[1].x) / 2,
              y: (c[0].y + c[1].y) / 2,
              width,
              height,
              radius: Math.round(Math.min(width, height) / 4),
              strokeStyleId,
              fillStyleId,
            } as RoundedRectContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: (RoundedRectContent)[] = []
      if (line) {
        const width = Math.abs(line[0].x - line[1].x)
        const height = Math.abs(line[0].y - line[1].y)
        assistentContents.push({
          type: 'rounded rect',
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width,
          height,
          radius: Math.round(Math.min(width, height) / 4),
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
