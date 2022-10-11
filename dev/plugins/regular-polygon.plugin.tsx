import type ReactType from 'react'
import type * as core from '../../src'
import type { Position } from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

type RegularPolygonContent = model.BaseContent<'regular polygon'> & model.StrokeFields & model.FillFields & core.Position & {
  radius: number
  count: number
  angle: number
}

export function getModel(ctx: typeof core & typeof model & { React: typeof ReactType }): model.Model<RegularPolygonContent> {
  function getRegularPolygonGeometriesFromCache(content: Omit<RegularPolygonContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const angle = -(content.angle ?? 0)
      const p0 = ctx.rotatePositionByCenter({ x: content.x + content.radius, y: content.y }, content, angle)
      const points: Position[] = []
      for (let i = 0; i < content.count; i++) {
        points.push(ctx.rotatePositionByCenter(p0, content, 360 / content.count * i))
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
    type: 'regular polygon',
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
      const { points } = getRegularPolygonGeometriesFromCache(content)
      return target.renderPolygon(points, { [colorField]: color, strokeWidth })
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getRegularPolygonGeometriesFromCache(content)
        return {
          editPoints: [
            {
              ...content,
              cursor: 'move',
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
                c.angle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] }] }
              },
            } as core.EditPoint<model.BaseContent>))
          ]
        }
      })
    },
    getGeometries: getRegularPolygonGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.x = v } })} />,
        y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.y = v } })} />,
        radius: <ctx.NumberEditor value={content.radius} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.radius = v } })} />,
        count: <ctx.NumberEditor value={content.count} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.count = v } })} />,
        angle: <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isRegularPolygonContent(c)) { c.angle = v } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
}

function isRegularPolygonContent(content: model.BaseContent): content is RegularPolygonContent {
  return content.type === 'regular polygon'
}

export function getCommand(ctx: typeof core & typeof model): Command {
  return {
    name: 'create regular polygon',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create regular polygon',
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            contents.push({
              type: 'regular polygon',
              x: p0.x,
              y: p0.y,
              radius: ctx.getTwoPointsDistance(p0, p1),
              count: 5,
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
  }
}