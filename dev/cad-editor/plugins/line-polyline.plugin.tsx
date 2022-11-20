import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { ArcContent } from './circle-arc.plugin'
import type { TextContent } from './text.plugin'
import type { PolygonContent } from './polygon.plugin'

export type LineContent = model.BaseContent<'line' | 'polyline'> & model.StrokeFields & model.FillFields & {
  points: core.Position[]
}

export function getModel(ctx: PluginContext) {
  function getPolylineGeometries(content: Omit<LineContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const lines = Array.from(ctx.iteratePolylineLines(content.points))
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points,
          },
        ] : undefined,
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
    render(content, { getStrokeColor, target, transformStrokeWidth, contents }) {
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
      const options = {
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray,
      }
      return target.renderPolyline(content.points, options)
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
    propertyPanel(content, update, contents) {
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
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
      }
    },
    isValid(content) {
      return content.points.length > 1
    },
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
  }
  return [
    lineModel,
    {
      ...lineModel,
      type: 'polyline',
      ...ctx.fillModel,
      explode(content) {
        const { lines } = getPolylineGeometries(content)
        return lines.map((line) => ({ type: 'line', points: line } as LineContent))
      },
      render(content, { target, transformStrokeWidth, getFillColor, getStrokeColor, getFillPattern, contents }) {
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
        const fillStyleContent = ctx.getFillStyleContent(content, contents)
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent),
        }
        return target.renderPolyline(content.points, { ...options, dashArray: strokeStyleContent.dashArray })
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }))
      },
      canSelectPart: true,
      propertyPanel(content, update, contents) {
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
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
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
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="10,87 87,9" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="12,86 38,24 62,64 88,13" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return [
    {
      name: 'create line',
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset } = ctx.useLineClickCreate(
          type === 'create line',
          (c) => onEnd({
            updateContents: (contents) => contents.push(...Array.from(ctx.iteratePolylineLines(c)).map((line) => ({ points: line, strokeStyleId, fillStyleId, type: 'line' } as LineContent)))
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
            ...ctx.getAssistentText(
              r.toFixed(2),
              16 / scale,
              (start.x + end.x) / 2 - 20,
              (start.y + end.y) / 2 + 4,
              inputMode === 'length' ? 0xff0000 : 0xffcccc,
            ),
            ...ctx.getAssistentText(
              `${angle.toFixed(1)}°`,
              16 / scale,
              end.x + 10,
              end.y - 10,
              inputMode === 'angle' ? 0xff0000 : 0xffcccc,
            ),
          )
        }
        if (line) {
          for (const lineSegment of ctx.iteratePolylineLines(line)) {
            assistentContents.push({ points: lineSegment, strokeStyleId, fillStyleId, type: 'line' })
          }
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
      hotkey: 'L',
      icon: icon1,
    },
    {
      name: 'create polyline',
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
          type === 'create polyline',
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, strokeStyleId, fillStyleId, type: 'polyline' } as LineContent)
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
            ...ctx.getAssistentText(
              r.toFixed(2),
              16 / scale,
              (start.x + end.x) / 2 - 20,
              (start.y + end.y) / 2 + 4,
              inputMode === 'length' ? 0xff0000 : 0xffcccc,
            ),
            ...ctx.getAssistentText(
              `${angle.toFixed(1)}°`,
              16 / scale,
              end.x + 10,
              end.y - 10,
              inputMode === 'angle' ? 0xff0000 : 0xffcccc,
            ),
          )
        }
        if (line) {
          assistentContents.push({ points: line, strokeStyleId, fillStyleId, type: 'polyline' })
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition,
          reset,
          subcommand: type === 'create polyline' && positions.length > 2
            ? (
              <span>
                <button
                  onClick={() => {
                    onEnd({
                      updateContents: (contents) => contents.push({ points: positions, type: 'polygon' } as PolygonContent)
                    })
                    reset()
                  }}
                  style={{ position: 'relative' }}
                >
                  close
                </button>
              </span>
            )
            : undefined,
        }
      },
      selectCount: 0,
      hotkey: 'PL',
      icon: icon2,
    },
  ]
}
