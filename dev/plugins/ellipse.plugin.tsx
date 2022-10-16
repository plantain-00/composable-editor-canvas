import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import type { LineContent } from './line-polyline.plugin'

export type EllipseContent = model.BaseContent<'ellipse'> & model.StrokeFields & model.FillFields & core.Ellipse
export type EllipseArcContent = model.BaseContent<'ellipse arc'> & model.StrokeFields & core.EllipseArc

export function getModel(ctx: PluginContext) {
  function getEllipseGeometries(content: Omit<EllipseContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.ellipseToPolygon(content, ctx.angleDelta)
      const lines = Array.from(ctx.iteratePolygonLines(points))
      const polylinePoints = ctx.polygonToPolyline(points)
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(polylinePoints, content.dashArray),
        regions: content.fillColor !== undefined ? [
          {
            lines,
            points,
          },
        ] : undefined,
      }
    })
  }
  function getEllipseArcGeometries(content: Omit<EllipseArcContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.ellipseArcToPolyline(content, ctx.angleDelta)
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  const ellipseModel: model.Model<EllipseContent> = {
    type: 'ellipse',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.cx += offset.x
      content.cy += offset.y
    },
    rotate(content, center, angle) {
      const p = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy }, center, -angle)
      content.cx = p.x
      content.cy = p.y
      content.angle = (content.angle ?? 0) + angle
    },
    mirror(content, line, angle) {
      const p = ctx.getSymmetryPoint({ x: content.cx, y: content.cy }, line)
      content.cx = p.x
      content.cy = p.y
      content.angle = 2 * angle - (content.angle ?? 0)
    },
    break(content, points) {
      if (points.length < 2) {
        return
      }
      const angles = points.map((p) => ctx.getEllipseAngle(p, content))
      angles.sort((a, b) => a - b)
      return angles.map((a, i) => ({
        ...content,
        type: 'ellipse arc',
        startAngle: a,
        endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
      }) as EllipseArcContent)
    },
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== undefined ? 'fillColor' : 'strokeColor'
      if (content.fillColor !== undefined) {
        strokeWidth = 0
      }
      if (content.dashArray) {
        const { points } = getEllipseGeometries(content)
        return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth })
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { [colorField]: color, angle: content.angle, strokeWidth })
    },
    getOperatorRenderPosition(content) {
      return { x: content.cx, y: content.cy }
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const center = { x: content.cx, y: content.cy }
        const rotate = -(content.angle ?? 0)
        const left = ctx.rotatePositionByCenter({ x: content.cx - content.rx, y: content.cy }, center, rotate)
        const right = ctx.rotatePositionByCenter({ x: content.cx + content.rx, y: content.cy }, center, rotate)
        const top = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy - content.ry }, center, rotate)
        const bottom = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy + content.ry }, center, rotate)
        return {
          editPoints: [
            {
              x: content.cx,
              y: content.cy,
              cursor: 'move',
              update(c, { cursor, start, scale }) {
                if (!isEllipseContent(c)) {
                  return
                }
                c.cx += cursor.x - start.x
                c.cy += cursor.y - start.y
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
              },
            },
            {
              x: left.x,
              y: left.y,
              cursor: ctx.getResizeCursor(-rotate, 'left'),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return
                }
                c.rx = ctx.getTwoPointsDistance(cursor, center)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
              },
            },
            {
              x: right.x,
              y: right.y,
              cursor: ctx.getResizeCursor(-rotate, 'right'),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return
                }
                c.rx = ctx.getTwoPointsDistance(cursor, center)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
              },
            },
            {
              x: top.x,
              y: top.y,
              cursor: ctx.getResizeCursor(-rotate, 'top'),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return
                }
                c.ry = ctx.getTwoPointsDistance(cursor, center)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
              },
            },
            {
              x: bottom.x,
              y: bottom.y,
              cursor: ctx.getResizeCursor(-rotate, 'bottom'),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return
                }
                c.ry = ctx.getTwoPointsDistance(cursor, center)
                return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
              },
            },
          ],
          angleSnapStartPoint: { x: content.cx, y: content.cy },
        }
      })
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => [
        { x: content.cx, y: content.cy, type: 'center' },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content), type: 'endpoint' },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content), type: 'endpoint' },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content), type: 'endpoint' },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content), type: 'endpoint' },
      ])
    },
    getGeometries: getEllipseGeometries,
    propertyPanel(content, update) {
      return {
        cx: <ctx.NumberEditor value={content.cx} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.cx = v } })} />,
        cy: <ctx.NumberEditor value={content.cy} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.cy = v } })} />,
        rx: <ctx.NumberEditor value={content.rx} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.rx = v } })} />,
        ry: <ctx.NumberEditor value={content.ry} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.ry = v } })} />,
        angle: [
          <ctx.BooleanEditor value={content.angle !== undefined} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.angle = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />,
          content.angle !== undefined ? <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.angle = v } })} /> : undefined,
        ],
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
  return [
    ellipseModel,
    {
      type: 'ellipse arc',
      ...ctx.strokeModel,
      move: ellipseModel.move,
      rotate: ellipseModel.rotate,
      mirror: ellipseModel.mirror,
      break(content, points) {
        if (points.length === 0) {
          return
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(ctx.getEllipseAngle(p, content), content))
        angles.sort((a, b) => a - b)
        const result: EllipseArcContent[] = []
        if (!ctx.equals(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: 'ellipse arc',
            startAngle: content.startAngle,
            endAngle: angles[0],
          })
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.equals(a, content.endAngle)) {
              result.push({
                ...content,
                type: 'ellipse arc',
                startAngle: a,
                endAngle: content.endAngle,
              })
            }
          } else {
            result.push({
              ...content,
              type: 'ellipse arc',
              startAngle: a,
              endAngle: angles[i + 1],
            })
          }
        })
        return result.length > 1 ? result : undefined
      },
      render({ content, color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries(content)
        return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
      },
      renderIfSelected({ content, color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth })
      },
      getOperatorRenderPosition(content) {
        const { points } = getEllipseArcGeometries(content)
        return points[0]
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const center = { x: content.cx, y: content.cy }
          const startAngle = content.startAngle / 180 * Math.PI
          const endAngle = content.endAngle / 180 * Math.PI
          const rotate = -(content.angle ?? 0)
          return {
            editPoints: [
              {
                x: content.cx,
                y: content.cy,
                cursor: 'move',
                update(c, { cursor, start, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return
                  }
                  c.cx += cursor.x - start.x
                  c.cy += cursor.y - start.y
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
                },
              },
              {
                ...ctx.rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, center, rotate),
                cursor: ctx.getResizeCursor(content.startAngle - rotate, 'top'),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, content.angle ?? 0)
                  c.startAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
                },
              },
              {
                ...ctx.rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, center, rotate),
                cursor: ctx.getResizeCursor(content.endAngle - rotate, 'top'),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, content.angle ?? 0)
                  c.endAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
                },
              },
            ],
            angleSnapStartPoint: center,
          }
        })
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const startAngle = content.startAngle / 180 * Math.PI
          const endAngle = content.endAngle / 180 * Math.PI
          const middleAngle = (startAngle + endAngle) / 2
          return [
            { x: content.cx, y: content.cy, type: 'center' },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, content), type: 'endpoint' },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, content), type: 'endpoint' },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(middleAngle), y: content.cy + content.ry * Math.sin(middleAngle) }, content), type: 'midpoint' },
          ]
        })
      },
      getGeometries: getEllipseArcGeometries,
      propertyPanel(content, update) {
        return {
          cx: <ctx.NumberEditor value={content.cx} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.cx = v } })} />,
          cy: <ctx.NumberEditor value={content.cy} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.cy = v } })} />,
          rx: <ctx.NumberEditor value={content.rx} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.rx = v } })} />,
          ry: <ctx.NumberEditor value={content.ry} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.ry = v } })} />,
          angle: [
            <ctx.BooleanEditor value={content.angle !== undefined} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.angle = v ? 0 : undefined } })} style={{ marginRight: '5px' }} />,
            content.angle !== undefined ? <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.angle = v } })} /> : undefined,
          ],
          startAngle: <ctx.NumberEditor value={content.startAngle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.startAngle = v } })} />,
          endAngle: <ctx.NumberEditor value={content.endAngle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.endAngle = v } })} />,
          counterclockwise: <ctx.BooleanEditor value={content.counterclockwise === true} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.counterclockwise = v ? true : undefined } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update),
        }
      },
    } as model.Model<EllipseArcContent>,
  ]
}

export function isEllipseContent(content: model.BaseContent): content is EllipseContent {
  return content.type === 'ellipse'
}

export function isEllipseArcContent(content: model.BaseContent): content is EllipseArcContent {
  return content.type === 'ellipse arc'
}

export function getCommand(ctx: PluginContext): Command[] {
  return [
    {
      name: 'create ellipse',
      type: [
        { name: 'ellipse center', hotkey: 'EL' },
        { name: 'ellipse endpoint' },
      ],
      useCommand({ onEnd, type, scale }) {
        const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useEllipseClickCreate(
          type === 'ellipse center' || type === 'ellipse endpoint' ? type : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: 'ellipse' })
          }),
        )
        const assistentContents: (LineContent | EllipseContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4 / scale] })
            if (type === 'ellipse center') {
              assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
            } else if (ellipse) {
              assistentContents.push({ type: 'line', points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] })
            }
          } else {
            assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (ellipse) {
          assistentContents.push({ ...ellipse, type: 'ellipse' })
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition,
        }
      },
      selectCount: 0,
    },
    {
      name: 'create ellipse arc',
      useCommand({ onEnd, type, scale }) {
        const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useEllipseArcClickCreate(
          type === 'create ellipse arc' ? 'ellipse center' : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: 'ellipse arc' }),
          }),
        )
        const assistentContents: (LineContent | EllipseContent | EllipseArcContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4 / scale] })
            const center = type === 'create ellipse arc'
              ? startPosition
              : { x: (startPosition.x + middlePosition.x) / 2, y: (startPosition.y + middlePosition.y) / 2 }
            assistentContents.push({ type: 'line', points: [center, cursorPosition], dashArray: [4 / scale] })
          } else {
            assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (ellipseArc) {
          assistentContents.push({ ...ellipseArc, dashArray: [4 / scale], type: 'ellipse' })
          if (ellipseArc.startAngle !== ellipseArc.endAngle) {
            assistentContents.push(
              {
                type: 'line', points: [
                  ctx.rotatePositionByEllipseCenter({
                    x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.startAngle / 180 * Math.PI),
                    y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.startAngle / 180 * Math.PI)
                  }, ellipseArc),
                  {
                    x: ellipseArc.cx,
                    y: ellipseArc.cy
                  },
                ],
                dashArray: [4 / scale]
              },
              {
                type: 'line', points: [
                  {
                    x: ellipseArc.cx,
                    y: ellipseArc.cy
                  },
                  ctx.rotatePositionByEllipseCenter({
                    x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.endAngle / 180 * Math.PI),
                    y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.endAngle / 180 * Math.PI)
                  }, ellipseArc),
                ],
                dashArray: [4 / scale]
              },
            )
          }
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [{ x: ellipseArc.cx, y: ellipseArc.cy }, cursorPosition], dashArray: [4 / scale] })
          }
        } else if (ellipse) {
          assistentContents.push({ ...ellipse, dashArray: [4 / scale], type: 'ellipse' })
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
          assistentContents.push({ ...ellipseArc, type: 'ellipse arc' })
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition,
        }
      },
      selectCount: 0,
    },
  ]
}
