import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import { LineContent } from './line-polyline.plugin'
import type { PolygonContent } from './polygon.plugin'
import type { TextContent } from './text.plugin'

export type CircleContent = model.BaseContent<'circle'> & model.StrokeFields & model.FillFields & core.Circle
export type ArcContent = model.BaseContent<'arc'> & model.StrokeFields & model.FillFields & core.Arc

export function getModel(ctx: PluginContext) {
  function getCircleGeometries(content: Omit<CircleContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const geometries = getArcGeometries({ ...content, startAngle: 0, endAngle: 360 })
      if (content.fillColor !== undefined) {
        return {
          lines: [],
          points: geometries.points,
          bounding: geometries.bounding,
          regions: [{
            lines: geometries.lines,
            points: geometries.points,
          }],
          renderingLines: [],
        }
      }
      return geometries
    })
  }
  function getArcGeometries(content: Omit<ArcContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.arcToPolyline(content, ctx.angleDelta)
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  return [
    {
      type: 'circle',
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
      },
      mirror(content, line) {
        const p = ctx.getSymmetryPoint(content, line)
        content.x = p.x
        content.y = p.y
      },
      break(content, points) {
        if (points.length < 2) {
          return
        }
        const angles = points.map((p) => Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI)
        angles.sort((a, b) => a - b)
        return angles.map((a, i) => ({
          ...content,
          type: 'arc',
          startAngle: a,
          endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
        }) as ArcContent)
      },
      render({ content, color, target, strokeWidth }) {
        const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
        if (content.fillColor !== undefined) {
          strokeWidth = 0
        }
        if (content.dashArray) {
          const { points } = getCircleGeometries(content)
          return target.renderPolyline(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
        }
        return target.renderCircle(content.x, content.y, content.r, { [colorField]: color, strokeWidth })
      },
      getOperatorRenderPosition(content) {
        return content
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x
          const y = content.y
          const updateEdges = (c: model.BaseContent, { cursor, scale }: { cursor: core.Position, scale: number }) => {
            if (!isCircleContent(c)) {
              return
            }
            c.r = ctx.getTwoPointsDistance(cursor, c)
            return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
          }
          return {
            editPoints: [
              {
                x,
                y,
                cursor: 'move',
                update(c, { cursor, start, scale }) {
                  if (!isCircleContent(c)) {
                    return
                  }
                  c.x += cursor.x - start.x
                  c.y += cursor.y - start.y
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                x: x - content.r,
                y,
                cursor: 'ew-resize',
                update: updateEdges,
              },
              {
                x,
                y: y - content.r,
                cursor: 'ns-resize',
                update: updateEdges,
              },
              {
                x: x + content.r,
                y,
                cursor: 'ew-resize',
                update: updateEdges,
              },
              {
                x,
                y: y + content.r,
                cursor: 'ns-resize',
                update: updateEdges,
              },
            ],
            angleSnapStartPoint: content,
          }
        })
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => [
          { x: content.x, y: content.y, type: 'center' },
          { x: content.x - content.r, y: content.y, type: 'endpoint' },
          { x: content.x + content.r, y: content.y, type: 'endpoint' },
          { x: content.x, y: content.y - content.r, type: 'endpoint' },
          { x: content.x, y: content.y + content.r, type: 'endpoint' },
        ])
      },
      getCircle(content) {
        return {
          circle: content,
          fill: content.fillColor !== undefined,
          bounding: {
            start: { x: content.x - content.r, y: content.y - content.r },
            end: { x: content.x + content.r, y: content.y + content.r },
          }
        }
      },
      getGeometries: getCircleGeometries,
      propertyPanel(content, update) {
        return {
          x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isCircleContent(c)) { c.x = v } })} />,
          y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isCircleContent(c)) { c.y = v } })} />,
          r: <ctx.NumberEditor value={content.r} setValue={(v) => update(c => { if (isCircleContent(c)) { c.r = v } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update),
          ...ctx.getFillContentPropertyPanel(content, update),
        }
      },
    } as model.Model<CircleContent>,
    {
      type: 'arc',
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
        content.startAngle += angle
        content.endAngle += angle
      },
      mirror(content, line, angle) {
        const p = ctx.getSymmetryPoint(content, line)
        content.x = p.x
        content.y = p.y
        const startAngle = 2 * angle - content.endAngle
        const endAngle = 2 * angle - content.startAngle
        content.startAngle = startAngle
        content.endAngle = endAngle
      },
      break(content, points) {
        if (points.length === 0) {
          return
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI, content))
        angles.sort((a, b) => a - b)
        const result: ArcContent[] = []
        if (!ctx.equals(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: 'arc',
            startAngle: content.startAngle,
            endAngle: angles[0],
          })
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.equals(a, content.endAngle)) {
              result.push({
                ...content,
                type: 'arc',
                startAngle: a,
                endAngle: content.endAngle,
              })
            }
          } else {
            result.push({
              ...content,
              type: 'arc',
              startAngle: a,
              endAngle: angles[i + 1],
            })
          }
        })
        return result.length > 1 ? result : undefined
      },
      render({ content, color, target, strokeWidth }) {
        const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
        if (content.fillColor !== undefined) {
          strokeWidth = 0
        }
        if (content.dashArray) {
          const { points } = getCircleGeometries(content)
          return target.renderPolyline(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { [colorField]: color, strokeWidth, counterclockwise: content.counterclockwise })
      },
      renderIfSelected({ content, color, target, strokeWidth }) {
        const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth })
      },
      getOperatorRenderPosition(content) {
        const { points } = getArcGeometries(content)
        return points[0]
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x
          const y = content.y
          const startAngle = content.startAngle / 180 * Math.PI
          const endAngle = content.endAngle / 180 * Math.PI
          const middleAngle = (startAngle + endAngle) / 2
          return {
            editPoints: [
              {
                x,
                y,
                cursor: 'move',
                update(c, { cursor, start, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.x += cursor.x - start.x
                  c.y += cursor.y - start.y
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                x: x + content.r * Math.cos(startAngle),
                y: y + content.r * Math.sin(startAngle),
                cursor: ctx.getResizeCursor(content.startAngle, 'top'),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.startAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                x: x + content.r * Math.cos(endAngle),
                y: y + content.r * Math.sin(endAngle),
                cursor: ctx.getResizeCursor(content.endAngle, 'top'),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.endAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                x: x + content.r * Math.cos(middleAngle),
                y: y + content.r * Math.sin(middleAngle),
                cursor: ctx.getResizeCursor((content.startAngle + content.endAngle) / 2, 'right'),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.r = ctx.getTwoPointsDistance(cursor, c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
            ],
            angleSnapStartPoint: content,
          }
        })
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const startAngle = content.startAngle / 180 * Math.PI
          const endAngle = content.endAngle / 180 * Math.PI
          const middleAngle = (startAngle + endAngle) / 2
          return [
            { x: content.x, y: content.y, type: 'center' },
            { x: content.x + content.r * Math.cos(startAngle), y: content.y + content.r * Math.sin(startAngle), type: 'endpoint' },
            { x: content.x + content.r * Math.cos(endAngle), y: content.y + content.r * Math.sin(endAngle), type: 'endpoint' },
            { x: content.x + content.r * Math.cos(middleAngle), y: content.y + content.r * Math.sin(middleAngle), type: 'midpoint' },
          ]
        })
      },
      getGeometries: getArcGeometries,
      propertyPanel(content, update) {
        return {
          x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isArcContent(c)) { c.x = v } })} />,
          y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isArcContent(c)) { c.y = v } })} />,
          r: <ctx.NumberEditor value={content.r} setValue={(v) => update(c => { if (isArcContent(c)) { c.r = v } })} />,
          startAngle: <ctx.NumberEditor value={content.startAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.startAngle = v } })} />,
          endAngle: <ctx.NumberEditor value={content.endAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.endAngle = v } })} />,
          counterclockwise: <ctx.BooleanEditor value={content.counterclockwise === true} setValue={(v) => update(c => { if (isArcContent(c)) { c.counterclockwise = v ? true : undefined } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update),
          ...ctx.getFillContentPropertyPanel(content, update),
        }
      },
    } as model.Model<ArcContent>,
  ]
}

export function isCircleContent(content: model.BaseContent): content is CircleContent {
  return content.type === 'circle'
}

export function isArcContent(content: model.BaseContent): content is ArcContent {
  return content.type === 'arc'
}

export function getCommand(ctx: PluginContext): Command[] {
  const React = ctx.React
  const circleIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="44" cy="48" r="39" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></circle>
      <polyline points="44,48 66,15" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="44" cy="48" r="39" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></circle>
      <circle cx="18" cy="20" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <circle cx="72" cy="76" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
    </svg>
  )
  const icon3 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="44" cy="48" r="39" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></circle>
      <circle cx="18" cy="20" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <circle cx="36" cy="87" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
      <circle cx="80" cy="28" r="12" strokeWidth="0" vectorEffect="non-scaling-stroke" fill="currentColor" stroke="#000000"></circle>
    </svg>
  )
  const circleIcon4 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="44" cy="48" r="39" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></circle>
      <polyline points="25,82 66,15" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const arcIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M 31 80 A 35 35 0 1 0 25 24" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" stroke="currentColor"></path>
    </svg>
  )
  return [
    {
      name: 'create circle',
      type: [
        { name: '2 points', icon: icon2, },
        { name: '3 points', icon: icon3 },
        { name: 'center radius', hotkey: 'C', icon: circleIcon },
        { name: 'center diameter', icon: circleIcon4 },
      ],
      useCommand({ onEnd, scale, type }) {
        const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleClickCreate(
          type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: 'circle' })
          }),
        )
        const assistentContents: (LineContent | PolygonContent | TextContent | CircleContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] })
          } else {
            assistentContents.push(
              { type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              {
                type: 'text',
                x: (startPosition.x + cursorPosition.x) / 2 - 20,
                y: (startPosition.y + cursorPosition.y) / 2 + 4,
                text: ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                color: 0xff0000,
                fontSize: 16 / scale,
                fontFamily: 'monospace',
              },
            )
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, type: 'circle' })
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition,
          reset,
        }
      },
      selectCount: 0,
    },
    {
      name: 'create arc',
      useCommand({ onEnd, type, scale }) {
        const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleArcClickCreate(
          type === 'create arc' ? 'center radius' : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: 'arc' })
          }),
        )
        const assistentContents: (LineContent | PolygonContent | CircleContent | TextContent | ArcContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] })
          } else {
            assistentContents.push(
              { type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              {
                type: 'text',
                x: (startPosition.x + cursorPosition.x) / 2 - 20,
                y: (startPosition.y + cursorPosition.y) / 2 + 4,
                text: ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                color: 0xff0000,
                fontSize: 16 / scale,
                fontFamily: 'monospace',
              },
            )
          }
        }
        if (arc) {
          assistentContents.push({ ...arc, dashArray: [4 / scale], type: 'circle' })
          if (arc.startAngle !== arc.endAngle) {
            assistentContents.push(
              {
                type: 'line', points: [
                  {
                    x: arc.x + arc.r * Math.cos(arc.startAngle / 180 * Math.PI),
                    y: arc.y + arc.r * Math.sin(arc.startAngle / 180 * Math.PI)
                  },
                  {
                    x: arc.x,
                    y: arc.y
                  },
                ],
                dashArray: [4 / scale]
              },
              {
                type: 'line', points: [
                  {
                    x: arc.x,
                    y: arc.y
                  },
                  {
                    x: arc.x + arc.r * Math.cos(arc.endAngle / 180 * Math.PI),
                    y: arc.y + arc.r * Math.sin(arc.endAngle / 180 * Math.PI)
                  },
                ],
                dashArray: [4 / scale]
              },
            )
          }
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [arc, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, dashArray: [4 / scale], type: 'circle' })
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [circle, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (arc && arc.startAngle !== arc.endAngle) {
          assistentContents.push({ ...arc, type: 'arc' })
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition,
          reset,
        }
      },
      selectCount: 0,
      hotkey: 'A',
      icon: arcIcon,
    },
  ]
}
