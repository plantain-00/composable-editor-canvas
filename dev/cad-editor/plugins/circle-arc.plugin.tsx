import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { LineContent } from './line-polyline.plugin'
import type { PolygonContent } from './polygon.plugin'
import type { TextContent } from './text.plugin'

export type CircleContent = model.BaseContent<'circle'> & model.StrokeFields & model.FillFields & core.Circle & {
  xExpression?: string
  yExpression?: string
  rExpression?: string
}
export type ArcContent = model.BaseContent<'arc'> & model.StrokeFields & model.FillFields & model.AngleDeltaFields & core.Arc

export function getModel(ctx: PluginContext) {
  const CircleContent = ctx.and(ctx.BaseContent('circle'), ctx.StrokeFields, ctx.FillFields, ctx.Circle, {
    xExpression: ctx.optional(ctx.string),
    yExpression: ctx.optional(ctx.string),
    rExpression: ctx.optional(ctx.string),
  })
  const ArcContent = ctx.and(ctx.BaseContent('arc'), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Arc)
  const geometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], quadrantPoints: core.Position[] }>>()
  const arcGeometriesCache = new ctx.WeakmapCache<object, model.Geometries<{ points: core.Position[], start: core.Position, end: core.Position, middle: core.Position }>>()
  function getCircleGeometries(content: Omit<CircleContent, "type">, _?: readonly core.Nullable<model.BaseContent>[], time?: number) {
    const quadrantPoints = [
      { x: content.x - content.r, y: content.y },
      { x: content.x, y: content.y - content.r },
      { x: content.x + content.r, y: content.y },
      { x: content.x, y: content.y + content.r },
    ]
    if (time && (content.xExpression || content.yExpression || content.rExpression)) {
      const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x)
      const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y)
      const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r)
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc({ ...content, x, y, r })) }
    }
    return geometriesCache.get(content, () => {
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc(content)) }
    })
  }
  function getArcGeometries(content: Omit<ArcContent, "type">) {
    return arcGeometriesCache.get(content, () => {
      const points = ctx.arcToPolyline(content, content.angleDelta ?? ctx.defaultAngleDelta)
      const startAngle = ctx.angleToRadian(content.startAngle)
      const endAngle = ctx.angleToRadian(content.endAngle)
      const middleAngle = (startAngle + endAngle) / 2
      const geometries = {
        lines: [{ type: 'arc' as const, curve: content }],
        points,
        start: {
          x: content.x + content.r * Math.cos(startAngle),
          y: content.y + content.r * Math.sin(startAngle),
        },
        end: {
          x: content.x + content.r * Math.cos(endAngle),
          y: content.y + content.r * Math.sin(endAngle),
        },
        middle: {
          x: content.x + content.r * Math.cos(middleAngle),
          y: content.y + content.r * Math.sin(middleAngle),
        },
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
      if (ctx.hasFill(content)) {
        return {
          ...geometries,
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
      offset(content, point, distance) {
        if (!distance) {
          distance = ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(point, content), content.r)
        }
        return ctx.getParallelCirclesByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfCircle(point, content))]
      },
      break(content, points) {
        if (points.length < 2) {
          return
        }
        const angles = points.map((p) => ctx.radianToAngle(ctx.getCircleRadian(p, content)))
        angles.sort((a, b) => a - b)
        return angles.map((a, i) => ({
          ...content,
          type: 'arc',
          startAngle: a,
          endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
        }) as ArcContent)
      },
      render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents, clip, time }) {
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
        const fillStyleContent = ctx.getFillStyleContent(content, contents)
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent),
        }
        if (strokeStyleContent.dashArray) {
          const { points } = getCircleGeometries(content, contents, time)
          return target.renderPolyline(points, { ...options, dashArray: strokeStyleContent.dashArray, clip })
        }
        const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x)
        const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y)
        const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r)
        return target.renderCircle(x, y, r, { ...options, clip })
      },
      getOperatorRenderPosition(content) {
        return content
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x
          const y = content.y
          const { quadrantPoints } = getCircleGeometries(content)
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
                type: 'move',
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
                ...quadrantPoints[0],
                cursor: 'ew-resize',
                update: updateEdges,
              },
              {
                ...quadrantPoints[1],
                cursor: 'ns-resize',
                update: updateEdges,
              },
              {
                ...quadrantPoints[2],
                cursor: 'ew-resize',
                update: updateEdges,
              },
              {
                ...quadrantPoints[3],
                cursor: 'ns-resize',
                update: updateEdges,
              },
            ],
            angleSnapStartPoint: content,
          }
        })
      },
      getSnapPoints(content) {
        const { quadrantPoints } = getCircleGeometries(content)
        return ctx.getSnapPointsFromCache(content, () => [
          { x: content.x, y: content.y, type: 'center' },
          ...quadrantPoints.map(p => ({ ...p, type: 'endpoint' as const })),
        ])
      },
      getGeometries: getCircleGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isCircleContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
          x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isCircleContent(c)) { c.x = v } })} />,
          y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isCircleContent(c)) { c.y = v } })} />,
          r: <ctx.NumberEditor value={content.r} setValue={(v) => update(c => { if (isCircleContent(c)) { c.r = v } })} />,
          xExpression: [
            <ctx.BooleanEditor value={content.xExpression !== undefined} setValue={(v) => update(c => { if (isCircleContent(c)) { c.xExpression = v ? '' : undefined } })} />,
            content.xExpression !== undefined ? <ctx.StringEditor value={content.xExpression} setValue={(v) => update(c => { if (isCircleContent(c)) { c.xExpression = v } })} /> : undefined
          ],
          yExpression: [
            <ctx.BooleanEditor value={content.yExpression !== undefined} setValue={(v) => update(c => { if (isCircleContent(c)) { c.yExpression = v ? '' : undefined } })} />,
            content.yExpression !== undefined ? <ctx.StringEditor value={content.yExpression} setValue={(v) => update(c => { if (isCircleContent(c)) { c.yExpression = v } })} /> : undefined
          ],
          rExpression: [
            <ctx.BooleanEditor value={content.rExpression !== undefined} setValue={(v) => update(c => { if (isCircleContent(c)) { c.rExpression = v ? '' : undefined } })} />,
            content.rExpression !== undefined ? <ctx.StringEditor value={content.rExpression} setValue={(v) => update(c => { if (isCircleContent(c)) { c.rExpression = v } })} /> : undefined
          ],
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
        }
      },
      isValid: (c, p) => ctx.validate(c, CircleContent, p),
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      isPointIn: (content, point) => ctx.getTwoPointsDistance(content, point) < content.r,
      getParam: (content, point) => ctx.getCircleRadian(point, content),
      getPoint: (content, param) => ctx.getCirclePointAtRadian(content, param),
      getArea: (content) => Math.PI * content.r ** 2,
    } as model.Model<CircleContent>,
    {
      type: 'arc',
      ...ctx.strokeModel,
      ...ctx.fillModel,
      ...ctx.angleDeltaModel,
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
      offset(content, point, distance) {
        if (!distance) {
          distance = ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(point, content), content.r)
        }
        return ctx.getParallelArcsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfArc(point, content))]
      },
      break(content, points) {
        if (points.length === 0) {
          return
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(ctx.radianToAngle(ctx.getCircleRadian(p, content)), content))
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
      render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents)
        const fillStyleContent = ctx.getFillStyleContent(content, contents)
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth(strokeStyleContent.strokeWidth ?? ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent),
        }
        if (strokeStyleContent.dashArray) {
          const { points } = getCircleGeometries(content)
          return target.renderPolyline(points, { ...options, dashArray: strokeStyleContent.dashArray })
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { ...options, counterclockwise: content.counterclockwise })
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
        const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth })
      },
      getOperatorRenderPosition(content) {
        const { points } = getArcGeometries(content)
        return points[0]
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const { start, end, middle } = getArcGeometries(content)
          return {
            editPoints: [
              {
                x: content.x,
                y: content.y,
                cursor: 'move',
                type: 'move',
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
                ...start,
                cursor: ctx.getResizeCursor(content.startAngle, 'top'),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.startAngle = ctx.radianToAngle(ctx.getCircleRadian(cursor, c))
                  c.r = ctx.getTwoPointsDistance(cursor, c)
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                ...end,
                cursor: ctx.getResizeCursor(content.endAngle, 'top'),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return
                  }
                  c.endAngle = ctx.radianToAngle(ctx.getCircleRadian(cursor, c))
                  c.r = ctx.getTwoPointsDistance(cursor, c)
                  ctx.normalizeAngleRange(c)
                  return { assistentContents: [{ type: 'line', dashArray: [4 / scale], points: [content, cursor] } as LineContent] }
                },
              },
              {
                ...middle,
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
          const { start, end, middle } = getArcGeometries(content)
          return [
            { x: content.x, y: content.y, type: 'center' },
            { ...start, type: 'endpoint' },
            { ...end, type: 'endpoint' },
            { ...middle, type: 'midpoint' },
          ]
        })
      },
      getGeometries: getArcGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: <ctx.Button onClick={() => acquirePoint(p => update(c => { if (isCircleContent(c)) { c.x = p.x, c.y = p.y } }))}>canvas</ctx.Button>,
          x: <ctx.NumberEditor value={content.x} setValue={(v) => update(c => { if (isArcContent(c)) { c.x = v } })} />,
          y: <ctx.NumberEditor value={content.y} setValue={(v) => update(c => { if (isArcContent(c)) { c.y = v } })} />,
          r: <ctx.NumberEditor value={content.r} setValue={(v) => update(c => { if (isArcContent(c)) { c.r = v } })} />,
          startAngle: <ctx.NumberEditor value={content.startAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.startAngle = v } })} />,
          endAngle: <ctx.NumberEditor value={content.endAngle} setValue={(v) => update(c => { if (isArcContent(c)) { c.endAngle = v } })} />,
          counterclockwise: <ctx.BooleanEditor value={content.counterclockwise === true} setValue={(v) => update(c => { if (isArcContent(c)) { c.counterclockwise = v ? true : undefined } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
          ...ctx.getAngleDeltaContentPropertyPanel(content, update),
        }
      },
      isValid: (c, p) => ctx.validate(c, ArcContent, p),
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      getStartPoint: (content) => ctx.getArcPointAtAngle(content, content.startAngle),
      getEndPoint: (content) => ctx.getArcPointAtAngle(content, content.endAngle),
      getParam: (content, point) => ctx.getCircleRadian(point, content),
      getPoint: (content, param) => ctx.getCirclePointAtRadian(content, param),
      getArea: (content) => {
        const radian = ctx.angleToRadian(content.endAngle - content.startAngle)
        return content.r ** 2 * (radian - Math.sin(radian)) / 2
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleClickCreate(
          type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: 'circle' } as CircleContent)
          }),
        )
        const assistentContents: (LineContent | PolygonContent | TextContent | CircleContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] })
          } else {
            assistentContents.push(
              { type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              ...ctx.getAssistentText(
                ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                16 / scale,
                (startPosition.x + cursorPosition.x) / 2 - 20,
                (startPosition.y + cursorPosition.y) / 2 + 4,
              ),
            )
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, strokeStyleId, fillStyleId, type: 'circle' })
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
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleArcClickCreate(
          type === 'create arc' ? 'center radius' : undefined,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: 'arc' } as ArcContent)
          }),
        )
        const assistentContents: (LineContent | PolygonContent | CircleContent | TextContent | ArcContent)[] = []
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] })
          } else {
            assistentContents.push(
              { type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              ...ctx.getAssistentText(
                ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                16 / scale,
                (startPosition.x + cursorPosition.x) / 2 - 20,
                (startPosition.y + cursorPosition.y) / 2 + 4,
              ),
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
                    x: arc.x + arc.r * Math.cos(ctx.angleToRadian(arc.startAngle)),
                    y: arc.y + arc.r * Math.sin(ctx.angleToRadian(arc.startAngle))
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
                    x: arc.x + arc.r * Math.cos(ctx.angleToRadian(arc.endAngle)),
                    y: arc.y + arc.r * Math.sin(ctx.angleToRadian(arc.endAngle))
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
          assistentContents.push({ ...arc, strokeStyleId, fillStyleId, type: 'arc' })
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
