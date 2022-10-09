import type ReactType from 'react'
import type * as core from '../../src'
import type { Position } from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'

type StarContent = model.StrokeBaseContent<'star'> & model.FillFields & core.Position & {
  outerRadius: number
  innerRadius: number
  count: number
}

export function getModel(ctx: typeof core & typeof model & { React: typeof ReactType }): model.Model<StarContent> {
  function getStarGeometriesFromCache(content: Omit<StarContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const p0 = { x: content.x, y: content.y - content.outerRadius }
      const p1 = ctx.rotatePositionByCenter({ x: content.x, y: content.y - content.innerRadius }, content, 180 / content.count)
      const points: Position[] = []
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
    move(content, offset) {
      content.x += offset.x
      content.y += offset.y
    },
    fill(content, color) {
      content.fillColor = color
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      const { points } = getStarGeometriesFromCache(content)
      return target.renderPolygon(points, { [colorField]: color, strokeWidth })
    },
    getDefaultColor(content) {
      return content.fillColor !== undefined ? content.fillColor : content.strokeColor
    },
    getDefaultStrokeWidth(content) {
      return content.strokeWidth
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
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
        ...ctx.getStrokeContentPropertyPanel(content, update, isStarContent),
        ...ctx.getFillContentPropertyPanel(content, update, isStarContent),
      }
    },
  }
}

function isStarContent(content: model.BaseContent): content is StarContent {
  return content.type === 'star'
}

export function getCommand(ctx: typeof core & typeof model): Command {
  return {
    name: 'create star',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create star',
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1])
            contents.push({
              type: 'star',
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              count: 5,
            } as StarContent)
          }
        }),
        {
          once: true,
        },
      )
      const assistentContents: StarContent[] = []
      if (line) {
        const outerRadius = ctx.getTwoPointsDistance(line[0], line[1])
        assistentContents.push({
          type: 'star',
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          count: 5,
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
