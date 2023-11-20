import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import type { LineContent } from './line-polyline.plugin'

export type EllipseContent = model.BaseContent<'ellipse'> & model.StrokeFields & model.FillFields & model.AngleDeltaFields & core.Ellipse
export type EllipseArcContent = model.BaseContent<'ellipse arc'> & model.StrokeFields & model.FillFields & model.AngleDeltaFields & core.EllipseArc

export function getModel(ctx: PluginContext) {
  const EllipseContent = ctx.and(ctx.BaseContent('ellipse'), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Ellipse)
  const EllipseArcContent = ctx.and(ctx.BaseContent('ellipse arc'), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.EllipseArc)
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], left: core.Position, right: core.Position, top: core.Position, bottom: core.Position, center: core.Position }>>()
  const ellipseArcGeometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], center: core.Position, start: core.Position, end: core.Position, middle: core.Position }>>()
  function getEllipseGeometries(content: Omit<EllipseContent, "type">) {
    return geometriesCache.get(content, () => {
      const points = ctx.ellipseToPolygon(content, content.angleDelta ?? ctx.defaultAngleDelta)
      const lines = Array.from(ctx.iteratePolygonLines(points))
      const polylinePoints = ctx.polygonToPolyline(points)
      const center = ctx.getEllipseCenter(content)
      const left = ctx.rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content)
      const right = ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content)
      const top = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content)
      const bottom = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content)
      return {
        lines: [{
          type: 'ellipse arc' as const,
          curve: ctx.ellipseToEllipseArc(content),
        }],
        points,
        center, left, right, top, bottom,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(polylinePoints, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points,
          },
        ] : undefined,
      }
    })
  }
  function getEllipseArcGeometries(content: Omit<EllipseArcContent, "type">) {
    return ellipseArcGeometriesCache.get(content, () => {
      const points = ctx.ellipseArcToPolyline(content, content.angleDelta ?? ctx.defaultAngleDelta)
      const lines = Array.from(ctx.iteratePolylineLines(points))
      const center = ctx.getEllipseCenter(content)
      const startRadian = ctx.angleToRadian(content.startAngle)
      const endRadian = ctx.angleToRadian(content.endAngle)
      const middleRadian = (startRadian + endRadian) / 2
      return {
        lines: [{
          type: 'ellipse arc' as const,
          curve: content,
        }],
        points,
        center,
        start: ctx.getEllipsePointAtRadian(content, startRadian),
        end: ctx.getEllipsePointAtRadian(content, endRadian),
        middle: ctx.getEllipsePointAtRadian(content, middleRadian),
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
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
  const ellipseModel: model.Model<EllipseContent> = {
    type: 'ellipse',
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.angleDeltaModel,
    move(content, offset) {
      content.cx += offset.x
      content.cy += offset.y
    },
    rotate(content, center, angle) {
      const p = ctx.rotatePositionByCenter(ctx.getEllipseCenter(content), center, -angle)
      content.cx = p.x
      content.cy = p.y
      content.angle = (content.angle ?? 0) + angle
    },
    mirror(content, line, angle) {
      const p = ctx.getSymmetryPoint(ctx.getEllipseCenter(content), line)
      content.cx = p.x
      content.cy = p.y
      content.angle = 2 * angle - (content.angle ?? 0)
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getEllipseGeometries(content).lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
      }
      return ctx.getParallelEllipsesByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfEllipse(point, content))]
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
    render(content, renderCtx) {
      const { options, target, dashed } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
      if (dashed) {
        const { points } = getEllipseGeometries(content)
        return target.renderPolygon(points, options)
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { ...options, angle: content.angle })
    },
    getOperatorRenderPosition(content) {
      return ctx.getEllipseCenter(content)
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { center, left, right, top, bottom } = getEllipseGeometries(content)
        const rotate = -(content.angle ?? 0)
        return {
          editPoints: [
            {
              x: content.cx,
              y: content.cy,
              cursor: 'move',
              type: 'move',
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
          angleSnapStartPoint: ctx.getEllipseCenter(content),
        }
      })
    },
    getSnapPoints(content) {
      const { center, left, right, top, bottom } = getEllipseGeometries(content)
      return ctx.getSnapPointsFromCache(content, () => [
        { ...center, type: 'center' },
        { ...left, type: 'endpoint' },
        { ...right, type: 'endpoint' },
        { ...top, type: 'endpoint' },
        { ...bottom, type: 'endpoint' },
      ])
    },
    getGeometries: getEllipseGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isEllipseContent(c)) { c.cx = p.x, c.cy = p.y } }))}>canvas</ctx.Button>,
        cx: <ctx.NumberEditor value={content.cx} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.cx = v } })} />,
        cy: <ctx.NumberEditor value={content.cy} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.cy = v } })} />,
        rx: <ctx.NumberEditor value={content.rx} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.rx = v } })} />,
        ry: <ctx.NumberEditor value={content.ry} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.ry = v } })} />,
        angle: [
          <ctx.BooleanEditor value={content.angle !== undefined} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.angle = v ? 0 : undefined } })} />,
          content.angle !== undefined ? <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isEllipseContent(c)) { c.angle = v } })} /> : undefined,
        ],
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update),
      }
    },
    isValid: (c, p) => ctx.validate(c, EllipseContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getEllipseGeometries(content).points),
    getArea: (content) => Math.PI * content.rx * content.ry,
  }
  return [
    ellipseModel,
    {
      type: 'ellipse arc',
      ...ctx.strokeModel,
      ...ctx.fillModel,
      ...ctx.angleDeltaModel,
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
      offset(content, point, distance) {
        if (!distance) {
          distance = Math.min(...getEllipseArcGeometries(content).lines.map(line => ctx.getPointAndGeometryLineMinimumDistance(point, line)))
        }
        return ctx.getParallelEllipseArcsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfEllipseArc(point, content))]
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx)
        const { points } = getEllipseArcGeometries(content)
        return target.renderPolyline(points, options)
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle })
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth })
      },
      getOperatorRenderPosition(content) {
        const { points } = getEllipseArcGeometries(content)
        return points[0]
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const { center, start, end } = getEllipseArcGeometries(content)
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
                ...start,
                cursor: ctx.getResizeCursor(content.startAngle - rotate, 'top'),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return
                  }
                  c.startAngle = ctx.getEllipseAngle(cursor, content)
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [center, cursor] } as LineContent] }
                },
              },
              {
                ...end,
                cursor: ctx.getResizeCursor(content.endAngle - rotate, 'top'),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return
                  }
                  c.endAngle = ctx.getEllipseAngle(cursor, content)
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
          const { center, start, end, middle } = getEllipseArcGeometries(content)
          return [
            { ...center, type: 'center' },
            { ...start, type: 'endpoint' },
            { ...end, type: 'endpoint' },
            { ...middle, type: 'midpoint' },
          ]
        })
      },
      getGeometries: getEllipseArcGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isEllipseArcContent(c)) { c.cx = p.x, c.cy = p.y } }))}>canvas</ctx.Button>,
          cx: <ctx.NumberEditor value={content.cx} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.cx = v } })} />,
          cy: <ctx.NumberEditor value={content.cy} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.cy = v } })} />,
          rx: <ctx.NumberEditor value={content.rx} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.rx = v } })} />,
          ry: <ctx.NumberEditor value={content.ry} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.ry = v } })} />,
          angle: [
            <ctx.BooleanEditor value={content.angle !== undefined} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.angle = v ? 0 : undefined } })} />,
            content.angle !== undefined ? <ctx.NumberEditor value={content.angle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.angle = v } })} /> : undefined,
          ],
          startAngle: <ctx.NumberEditor value={content.startAngle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.startAngle = v } })} />,
          endAngle: <ctx.NumberEditor value={content.endAngle} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.endAngle = v } })} />,
          counterclockwise: <ctx.BooleanEditor value={content.counterclockwise === true} setValue={(v) => update(c => { if (isEllipseArcContent(c)) { c.counterclockwise = v ? true : undefined } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
          ...ctx.getAngleDeltaContentPropertyPanel(content, update),
        }
      },
      isValid: (c, p) => ctx.validate(c, EllipseArcContent, p),
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      getStartPoint: (content) => ctx.getEllipseArcPointAtAngle(content, content.startAngle),
      getEndPoint: (content) => ctx.getEllipseArcPointAtAngle(content, content.endAngle),
      getArea: (content) => {
        const radian = ctx.angleToRadian(content.endAngle - content.startAngle)
        return content.rx * content.ry * (radian - Math.sin(radian)) / 2
      },
      reverse: (content) => ctx.reverseEllipseArc(content),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="42" ry="25" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" />
      <circle cx="50" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="92" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="42" ry="25" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></ellipse>
      <circle cx="8" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="92" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  const icon3 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="7,71 8,69 8,66 9,64 10,61 12,58 14,55 16,52 18,49 21,46 23,43 27,40 30,38 33,35 37,32 40,30 44,28 48,25 51,23 55,22 59,20 62,19 66,18 69,17 72,16 76,16 78,16 81,16 84,17 86,17 88,18 89,19 91,21 92,22 92,24 93,26 93,29 92,31 92,34 91,36 90,39 88,42 86,45 84,48 82,51 79,54 77,57 73,60 70,62 67,65 63,68 60,70 56,72 52,75 49,77 45,78 41,80 38,81 34,82" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return [
    {
      name: 'create ellipse',
      type: [
        { name: 'ellipse center', hotkey: 'EL', icon: icon1 },
        { name: 'ellipse endpoint', icon: icon2 },
      ],
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseClickCreate(
          type === 'ellipse center' || type === 'ellipse endpoint' ? type : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: 'ellipse' } as EllipseContent)
          }),
        )
        const assistentContents: (LineContent | EllipseContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4 / scale] })
            if (type === 'ellipse center') {
              assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
            } else if (ellipse) {
              assistentContents.push({ type: 'line', points: [ctx.getEllipseCenter(ellipse), cursorPosition], dashArray: [4 / scale] })
            }
          } else {
            assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (ellipse) {
          assistentContents.push({ ...ellipse, strokeStyleId, fillStyleId, type: 'ellipse' })
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
      name: 'create ellipse arc',
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseArcClickCreate(
          type === 'create ellipse arc' ? 'ellipse center' : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: 'ellipse arc' } as EllipseArcContent),
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
                  ctx.getEllipsePointAtRadian(ellipseArc, ctx.angleToRadian(ellipseArc.startAngle)),
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
                  ctx.getEllipsePointAtRadian(ellipseArc, ctx.angleToRadian(ellipseArc.endAngle)),
                ],
                dashArray: [4 / scale]
              },
            )
          }
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [ctx.getEllipseCenter(ellipseArc), cursorPosition], dashArray: [4 / scale] })
          }
        } else if (ellipse) {
          assistentContents.push({ ...ellipse, dashArray: [4 / scale], type: 'ellipse' })
          if (cursorPosition) {
            assistentContents.push({ type: 'line', points: [ctx.getEllipseCenter(ellipse), cursorPosition], dashArray: [4 / scale] })
          }
        }
        if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
          assistentContents.push({ ...ellipseArc, strokeStyleId, fillStyleId, type: 'ellipse arc' })
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
      icon: icon3,
    },
  ]
}
