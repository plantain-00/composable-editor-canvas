import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'

export type LineContent = model.BaseContent<'line' | 'polyline'> & model.StrokeFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext) {
  function getPolylineGeometries(content: Omit<LineContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      return {
        lines: Array.from(ctx.iteratePolylineLines(content.points)),
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  const lineModel: model.Model<LineContent> = {
    type: 'line',
    ...ctx.strokeModel,
    move(content, offset) {
      for (const point of content.points) {
        point.x += offset.x
        point.y += offset.y
      }
    },
    rotate(content, center, angle) {
      content.points = content.points.map((p) => ctx.rotatePositionByCenter(p, center, -angle))
    },
    mirror(content, line) {
      content.points = content.points.map((p) => ctx.getSymmetryPoint(p, line))
    },
    break(content, intersectionPoints) {
      const { lines } = getPolylineGeometries(content)
      return ctx.breakPolyline(lines, intersectionPoints)
    },
    render({ content, color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
    },
    getOperatorRenderPosition(content) {
      return content.points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isLineContent) }))
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolylineGeometries(content)
        return [
          ...points.map((p) => ({ ...p, type: 'endpoint' as const })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: 'midpoint' as const,
          })),
        ]
      })
    },
    getGeometries: getPolylineGeometries,
    propertyPanel(content, update) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isLineContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isLineContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
  }
  return [
    lineModel,
    {
      ...lineModel,
      type: 'polyline',
      explode(content) {
        const { lines } = getPolylineGeometries(content)
        return lines.map((line) => ({ type: 'line', points: line } as LineContent))
      },
      render({ content, color, target, strokeWidth }) {
        return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }))
      },
      canSelectPart: true,
      propertyPanel(content, update) {
        return {
          points: <ctx.ArrayEditor
            inline
            {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolyLineContent(c)) { v(c) } }))}
            items={content.points.map((f, i) => <ctx.ObjectEditor
              inline
              properties={{
                x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].x = v } })} />,
                y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].y = v } })} />,
              }}
            />)}
          />,
          ...ctx.getStrokeContentPropertyPanel(content, update),
        }
      },
    } as model.Model<LineContent>,
  ]
}

export function isLineContent(content: model.BaseContent): content is LineContent {
  return content.type === 'line'
}

export function isPolyLineContent(content: model.BaseContent): content is LineContent {
  return content.type === 'polyline'
}

export function getCommand(ctx: PluginContext): Command[] {
  return [
    {
      name: 'create line',
      useCommand({ onEnd, scale, type }) {
        const { line, onClick, onMove, input, inputMode, lastPosition } = ctx.useLineClickCreate(
          type === 'create line',
          (c) => onEnd({
            updateContents: (contents) => contents.push(...Array.from(ctx.iteratePolylineLines(c)).map((line) => ({ points: line, type: 'line' })))
          }),
        )
        const assistentContents: (LineContent | ArcContent | TextContent)[] = []
        if (line && line.length > 1) {
          const start = line[line.length - 2]
          const end = line[line.length - 1]
          const r = ctx.getTwoPointsDistance(start, end)
          const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
          assistentContents.push(
            {
              type: 'arc',
              x: start.x,
              y: start.y,
              r,
              dashArray: [4 / scale],
              startAngle: angle > 180 || angle < 0 ? angle : 0,
              endAngle: angle > 180 || angle < 0 ? 0 : angle,
            },
            {
              type: 'line',
              dashArray: [4 / scale],
              points: [start, { x: start.x + r, y: start.y }]
            },
            {
              type: 'text',
              x: (start.x + end.x) / 2 - 20,
              y: (start.y + end.y) / 2 + 4,
              text: r.toFixed(2),
              color: inputMode === 'length' ? 0xff0000 : 0xffcccc,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
            },
            {
              type: 'text',
              x: end.x + 10,
              y: end.y - 10,
              text: `${angle.toFixed(1)}°`,
              color: inputMode === 'angle' ? 0xff0000 : 0xffcccc,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
            },
          )
        }
        if (line) {
          for (const lineSegment of ctx.iteratePolylineLines(line)) {
            assistentContents.push({ points: lineSegment, type: 'line' })
          }
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
      hotkey: 'L',
    },
    {
      name: 'create polyline',
      useCommand({ onEnd, scale, type }) {
        const { line, onClick, onMove, input, inputMode, lastPosition } = ctx.useLineClickCreate(
          type === 'create polyline',
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, type: 'polyline' } as LineContent)
          }),
        )
        const assistentContents: (LineContent | ArcContent | TextContent)[] = []
        if (line && line.length > 1) {
          const start = line[line.length - 2]
          const end = line[line.length - 1]
          const r = ctx.getTwoPointsDistance(start, end)
          const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
          assistentContents.push(
            {
              type: 'arc',
              x: start.x,
              y: start.y,
              r,
              dashArray: [4 / scale],
              startAngle: angle > 180 || angle < 0 ? angle : 0,
              endAngle: angle > 180 || angle < 0 ? 0 : angle,
            },
            {
              type: 'line',
              dashArray: [4 / scale],
              points: [start, { x: start.x + r, y: start.y }]
            },
            {
              type: 'text',
              x: (start.x + end.x) / 2 - 20,
              y: (start.y + end.y) / 2 + 4,
              text: r.toFixed(2),
              color: inputMode === 'length' ? 0xff0000 : 0xffcccc,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
            },
            {
              type: 'text',
              x: end.x + 10,
              y: end.y - 10,
              text: `${angle.toFixed(1)}°`,
              color: inputMode === 'angle' ? 0xff0000 : 0xffcccc,
              fontSize: 16 / scale,
              fontFamily: 'monospace',
            },
          )
        }
        if (line) {
          assistentContents.push({ points: line, type: 'polyline' })
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
      hotkey: 'PL',
    },
  ]
}
