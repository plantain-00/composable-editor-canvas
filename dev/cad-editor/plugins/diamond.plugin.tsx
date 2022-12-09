import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type DiamondContent = model.BaseContent<'diamond'> & model.StrokeFields & model.FillFields & core.Region

export function getModel(ctx: PluginContext): model.Model<DiamondContent> {
  const DiamondContent = ctx.and(ctx.BaseContent('diamond'), ctx.StrokeFields, ctx.FillFields, ctx.Region)
  function getGeometries(content: Omit<DiamondContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y },
        { x: content.x, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y },
      ]
      const lines = Array.from(ctx.iteratePolygonLines(points))
      return {
        lines,
        points,
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
    type: 'diamond',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    explode(content) {
      const { lines } = getGeometries(content)
      return lines.map((line) => ({ type: 'line', points: line } as LineContent))
    },
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const fillStyleContent = ctx.getFillStyleContent(content, contents)
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
      }
      const { points } = getGeometries(content)
      return target.renderPolygon(points, { ...options, dashArray: strokeStyleContent.dashArray })
    },
    getOperatorRenderPosition(content) {
      const { points } = getGeometries(content)
      return points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content)
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: 'center' as const },
            { ...points[0], direction: 'top' as const },
            { ...points[1], direction: 'right' as const },
            { ...points[2], direction: 'bottom' as const },
            { ...points[3], direction: 'left' as const },
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(0, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isDiamondContent(c)) {
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
    propertyPanel(content, update, contents) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isDiamondContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isDiamondContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isDiamondContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isDiamondContent(c)) { c.height = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
      }
    },
    isValid: (c, p) => ctx.validate(c, DiamondContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
  }
}

export function isDiamondContent(content: model.BaseContent): content is DiamondContent {
  return content.type === 'diamond'
}

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="52,5 97,50 52,96 6,50" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'create diamond',
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === 'create diamond',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'diamond',
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            strokeStyleId,
            fillStyleId,
          } as DiamondContent)
        }),
        {
          once: true,
        },
      )
      const assistentContents: (DiamondContent)[] = []
      if (line) {
        assistentContents.push({
          type: 'diamond',
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width: Math.abs(line[0].x - line[1].x),
          height: Math.abs(line[0].y - line[1].y),
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
