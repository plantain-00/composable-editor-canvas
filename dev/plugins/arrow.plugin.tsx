import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type ArrowContent = model.BaseContent<'arrow'> & model.StrokeFields & {
  p1: core.Position
  p2: core.Position
}

export function getModel(ctx: PluginContext): model.Model<ArrowContent> {
  function getArrowGeometriesFromCache(content: Omit<ArrowContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [content.p1, content.p2]
      const arrow = ctx.getPointByLengthAndDirection(content.p2, ctx.dimensionStyle.arrowSize, content.p1)
      const arrowPoints = [
        content.p2,
        ctx.rotatePositionByCenter(arrow, content.p2, ctx.dimensionStyle.arrowAngle),
        ctx.rotatePositionByCenter(arrow, content.p2, -ctx.dimensionStyle.arrowAngle),
      ]
      return {
        points: [],
        lines: Array.from(ctx.iteratePolylineLines(points)),
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints)),
          }
        ],
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'arrow',
    ...ctx.strokeModel,
    move(content, offset) {
      content.p1.x += offset.x
      content.p1.y += offset.y
      content.p2.x += offset.x
      content.p2.y += offset.y
    },
    render({ content, target, color, strokeWidth }) {
      const { regions, renderingLines } = getArrowGeometriesFromCache(content)
      const children: ReturnType<typeof target.renderGroup>[] = []
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }))
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }))
        }
      }
      return target.renderGroup(children)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.p1,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p1.x += cursor.x - start.x
                c.p1.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
            {
              ...content.p2,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return
                }
                c.p2.x += cursor.x - start.x
                c.p2.y += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [start, cursor] } as LineContent] }
              },
            },
          ]
        }
      })
    },
    getGeometries: getArrowGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        p1: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p1.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.x = v } })} />,
            y: <ctx.NumberEditor value={content.p1.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p1.y = v } })} />,
          }}
        />,
        p2: <ctx.ObjectEditor
          inline
          properties={{
            x: <ctx.NumberEditor value={content.p2.x} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.x = v } })} />,
            y: <ctx.NumberEditor value={content.p2.y} setValue={(v) => update(c => { if (isArrowContent(c)) { c.p2.y = v } })} />,
          }}
        />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
  }
}

export function isArrowContent(content: model.BaseContent): content is ArrowContent {
  return content.type === 'arrow'
}

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'create arrow',
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'create arrow',
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: 'arrow',
            p1: c[0],
            p2: c[1],
          } as ArrowContent)
        }),
        {
          once: true,
        },
      )
      const assistentContents: (ArrowContent)[] = []
      if (line) {
        assistentContents.push({
          type: 'arrow',
          p1: line[0],
          p2: line[1],
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
