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
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="42" ry="25.495097567963924" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor" />
      <circle cx="50" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="92" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="42" ry="25.495097567963924" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></ellipse>
      <circle cx="8" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="92" cy="50" r="10" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
    </svg>
  )
  const icon3 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="7.25397110182702,71.37301444908648 7.525675776285333,68.97359332179542 8.120635704784306,66.42977169275659 9.034322883021424,63.7609095805685 10.259783599870872,60.987318637407924 11.787691359324036,58.130107565092274 13.606417860755549,55.211021465113106 15.70212149731244,52.25227634528363 18.058852698900033,49.27639004250492 20.65867531804105,46.30601084843038 23.481803134788017,43.363745142290924 26.506750441804286,40.47198534269887 29.710495563570376,37.65273948782142 33.06865606523542,34.9274637409214 36.555674317669016,32.316899095999176 40.14501200645094,29.840913526304668 43.80935210446823,27.518350777064185 47.520806770985914,25.366886953201202 51.25112959495419,23.40289599350468 54.97193056725217,21.641325055068076 58.65489214579961,20.095580756398505 62.27198476915073,18.77742714495478 65.79568017838163,17.696896165642876 69.19916092376258,16.86221131165783 72.45652446174336,16.279725038734938 75.54298028895008,15.953870419125984 78.43503861288471,15.88712740324258 81.11068912342954,16.080003945736145 83.54956850459736,16.53103213965627 85.73311541166187,17.23677938810893 87.64471173419864,18.19187452839158 89.26980906993974,19.389048709784426 90.59603944689957,20.819190713893583 91.61330945110967,22.47141629652439 92.3138770435936,24.333151023351952 92.69241048195828,26.39022596895895 92.746028898173,28.626985550913506 92.47432422371466,31.02640667820458 91.8793642952157,33.570228307243404 90.96567711697858,36.239090419431484 89.74021640012914,39.012681362592076 88.21230864067596,41.869892434907726 86.39358213924444,44.788978534886894 84.29787850268758,47.74772365471635 81.94114730109996,50.723609957495086 79.34132468195895,53.69398915156962 76.51819686521199,56.636254857709076 73.49324955819571,59.52801465730113 70.28950443642962,62.347260512178565 66.93134393476458,65.0725362590786 63.44432568233099,67.68310090400082 59.85498799354905,70.15908647369534 56.19064789553177,72.4816492229358 52.479193229014086,74.6331130467988 48.74887040504581,76.59710400649531 45.02806943274783,78.35867494493192 41.3451078542004,79.9044192436015 37.728015230849266,81.22257285504521 34.20431982161838,82.30310383435712" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  return [
    {
      name: 'create ellipse',
      type: [
        { name: 'ellipse center', hotkey: 'EL', icon: icon1 },
        { name: 'ellipse endpoint', icon: icon2 },
      ],
      useCommand({ onEnd, type, scale }) {
        const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseClickCreate(
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
          reset,
        }
      },
      selectCount: 0,
    },
    {
      name: 'create ellipse arc',
      useCommand({ onEnd, type, scale }) {
        const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseArcClickCreate(
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
          reset,
        }
      },
      selectCount: 0,
      icon: icon3,
    },
  ]
}
