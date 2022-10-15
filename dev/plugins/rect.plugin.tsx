import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type RectContent = model.BaseContent<'rect'> & model.StrokeFields & model.FillFields & core.Region & {
  angle: number
}

export function getModel(ctx: PluginContext): model.Model<RectContent> {
  function getRectGeometries(content: Omit<RectContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
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
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: content.fillColor !== undefined ? [
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
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      if (content.dashArray) {
        const { points } = getRectGeometries(content)
        return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { [colorField]: color, angle: content.angle, strokeWidth })
    },
    getOperatorRenderPosition(content) {
      const { points } = getRectGeometries(content)
      return points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points, lines } = getRectGeometries(content)
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: 'center' as const },
            { ...points[0], direction: 'left-top' as const },
            { ...points[1], direction: 'right-top' as const },
            { ...points[2], direction: 'right-bottom' as const },
            { ...points[3], direction: 'left-bottom' as const },
            { ...ctx.getTwoPointCenter(...lines[0]), direction: 'top' as const },
            { ...ctx.getTwoPointCenter(...lines[1]), direction: 'right' as const },
            { ...ctx.getTwoPointCenter(...lines[2]), direction: 'bottom' as const },
            { ...ctx.getTwoPointCenter(...lines[3]), direction: 'left' as const },
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(content.angle, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRectContent(c)) {
                return
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction, -content.angle * Math.PI / 180)
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
        const { points, lines } = getRectGeometries(content)
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
    getGeometries: getRectGeometries,
    canSelectPart: true,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRectContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRectContent(c)) { c.y = v } })} />,
        width: <ctx.NumberEditor value={content.width} setValue={(v) => update(c => { if (isRectContent(c)) { c.width = v } })} />,
        height: <ctx.NumberEditor value={content.height} setValue={(v) => update(c => { if (isRectContent(c)) { c.height = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRectContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

export function isRectContent(content: model.BaseContent): content is RectContent {
  return content.type === 'rect'
}

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'create rect',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create rect',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'rect',
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            angle: 0,
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
        })
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
      }
    },
    selectCount: 0,
    hotkey: 'REC',
  }
}
