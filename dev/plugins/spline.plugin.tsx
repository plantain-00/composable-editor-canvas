import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import bspline from 'b-spline'
import type { LineContent } from './line-polyline.plugin'

export type SplineContent = model.BaseContent<'spline'> & model.StrokeFields & {
  points: core.Position[]
  fitting?: boolean
}

export function getModel(ctx: PluginContext): model.Model<SplineContent> {
  function getSplineGeometries(content: Omit<SplineContent, "type">) {
    return ctx.getGeometriesFromCache(content, () => {
      const inputPoints = content.points.map((p) => [p.x, p.y])
      let points: core.Position[] = []
      if (inputPoints.length > 2) {
        if (content.fitting) {
          const controlPoints = ctx.getBezierSplineControlPointsOfPoints(content.points)
          for (let i = 0; i < controlPoints.length; i++) {
            points.push(
              content.points[i],
              ...ctx.getBezierCurvePoints(content.points[i], ...controlPoints[i], content.points[i + 1], splineSegmentCount),
            )
          }
          points.push(content.points[content.points.length - 1])
        } else {
          const degree = 2
          const knots: number[] = []
          for (let i = 0; i < inputPoints.length + degree + 1; i++) {
            if (i < degree + 1) {
              knots.push(0)
            } else if (i < inputPoints.length) {
              knots.push(i - degree)
            } else {
              knots.push(inputPoints.length - degree)
            }
          }
          for (let t = 0; t <= splineSegmentCount; t++) {
            const p = bspline(t / splineSegmentCount, degree, inputPoints, knots)
            points.push({ x: p[0], y: p[1] })
          }
        }
      } else {
        points = content.points
      }
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
      }
    })
  }
  const React = ctx.React
  return {
    type: 'spline',
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
    render({ content, color, target, strokeWidth }) {
      const { points } = getSplineGeometries(content)
      return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
    },
    renderIfSelected({ content, color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: [4], strokeWidth })
    },
    getOperatorRenderPosition(content) {
      return content.points[0]
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isSplineContent, false, true) }))
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => content.points.map((p) => ({ ...p, type: 'endpoint' as const })))
    },
    getGeometries: getSplineGeometries,
    propertyPanel(content, update) {
      return {
        points: <ctx.ArrayEditor
          inline
          {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isSplineContent(c)) { v(c) } }))}
          items={content.points.map((f, i) => <ctx.ObjectEditor
            inline
            properties={{
              x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isSplineContent(c)) { c.points[i].x = v } })} />,
              y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isSplineContent(c)) { c.points[i].y = v } })} />,
            }}
          />)}
        />,
        fitting: <ctx.BooleanEditor value={content.fitting === true} setValue={(v) => update(c => { if (isSplineContent(c)) { c.fitting = v ? true : undefined } })} />,
        ...ctx.getStrokeContentPropertyPanel(content, update),
      }
    },
  }
}

export function isSplineContent(content: model.BaseContent): content is SplineContent {
  return content.type === 'spline'
}

const splineSegmentCount = 100

export function getCommand(ctx: PluginContext): Command {
  return {
    name: 'create spline',
    type: [
      { name: 'spline', hotkey: 'SPL' },
      { name: 'spline fitting' },
    ],
    useCommand({ onEnd, type, scale }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === 'spline' || type === 'spline fitting',
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: 'spline', fitting: type === 'spline fitting' } as SplineContent)
        }),
      )
      const assistentContents: (SplineContent | LineContent)[] = []
      if (line) {
        assistentContents.push(
          { points: line, type: 'spline', fitting: type === 'spline fitting' },
          { points: line, type: 'polyline', dashArray: [4 / scale] }
        )
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
