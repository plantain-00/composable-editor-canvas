import type { PluginContext } from './types'
import type * as core from '../../src'
import type { Command } from '../commands/command'
import type * as model from '../models/model'
import bspline from 'b-spline'
import type { LineContent } from './line-polyline.plugin'

export type SplineContent = model.BaseContent<'spline'> & model.StrokeFields & model.FillFields & {
  points: core.Position[]
  fitting?: boolean
}
export type SplineArrowContent = model.BaseContent<'spline arrow'> & model.StrokeFields & model.ArrowFields & {
  points: core.Position[]
  fitting?: boolean
}

export function getModel(ctx: PluginContext): model.Model<SplineContent | SplineArrowContent>[] {
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
      const lines = Array.from(ctx.iteratePolylineLines(points))
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points,
          },
        ] : undefined,
      }
    })
  }
  function getSplineArrowGeometries(content: Omit<SplineArrowContent, "type">): model.Geometries {
    return ctx.getGeometriesFromCache(content, () => {
      const geometry = getSplineGeometries(content)
      let arrowPoints: core.Position[] | undefined
      let points = geometry.points
      if (content.points.length > 1) {
        const p1 = content.points[content.points.length - 2]
        const p2 = content.points[content.points.length - 1]
        const r = ctx.getArrowPoints(p1, p2, content)
        arrowPoints = r.arrowPoints
        const index = points.findIndex(p => ctx.getTwoPointsDistance(p, p2) < r.distance)
        points = [...points.slice(0, index), r.endPoint]
      }
      const lines = Array.from(ctx.iteratePolylineLines(points))
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: arrowPoints ? [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints)),
          }
        ] : undefined,
      }
    })
  }
  const React = ctx.React
  const splineModel: model.Model<SplineContent> = {
    type: 'spline',
    ...ctx.strokeModel,
    ...ctx.fillModel,
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
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern }) {
      const { points } = getSplineGeometries(content)
      const options = {
        fillColor: getFillColor(content),
        strokeColor: getStrokeColor(content),
        strokeWidth: transformStrokeWidth(ctx.getStrokeWidth(content)),
        fillPattern: getFillPattern(content),
      }
      return target.renderPolyline(points, { ...options, dashArray: content.dashArray })
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
        ...ctx.getFillContentPropertyPanel(content, update),
      }
    },
  }
  return [
    splineModel,
    {
      type: 'spline arrow',
      ...ctx.strokeModel,
      ...ctx.arrowModel,
      move: splineModel.move,
      rotate: splineModel.rotate,
      mirror: splineModel.mirror,
      render(content, { getStrokeColor, target, transformStrokeWidth }) {
        const strokeColor = getStrokeColor(content)
        const strokeWidth = transformStrokeWidth(ctx.getStrokeWidth(content))
        const { regions, renderingLines } = getSplineArrowGeometries(content)
        const children: ReturnType<typeof target.renderGroup>[] = []
        for (const line of renderingLines) {
          children.push(target.renderPolyline(line, { strokeColor, strokeWidth }))
        }
        if (regions) {
          for (let i = 0; i < 2 && i < regions.length; i++) {
            children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }))
          }
        }
        return target.renderGroup(children)
      },
      renderIfSelected: splineModel.renderIfSelected,
      getOperatorRenderPosition: splineModel.getOperatorRenderPosition,
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isSplineArrowContent, false, true) }))
      },
      getSnapPoints: splineModel.getSnapPoints,
      getGeometries: getSplineArrowGeometries,
      propertyPanel(content, update) {
        return {
          points: <ctx.ArrayEditor
            inline
            {...ctx.getArrayEditorProps<core.Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isSplineArrowContent(c)) { v(c) } }))}
            items={content.points.map((f, i) => <ctx.ObjectEditor
              inline
              properties={{
                x: <ctx.NumberEditor value={f.x} setValue={(v) => update(c => { if (isSplineArrowContent(c)) { c.points[i].x = v } })} />,
                y: <ctx.NumberEditor value={f.y} setValue={(v) => update(c => { if (isSplineArrowContent(c)) { c.points[i].y = v } })} />,
              }}
            />)}
          />,
          fitting: <ctx.BooleanEditor value={content.fitting === true} setValue={(v) => update(c => { if (isSplineArrowContent(c)) { c.fitting = v ? true : undefined } })} />,
          ...ctx.getStrokeContentPropertyPanel(content, update),
          ...ctx.getArrowContentPropertyPanel(content, update),
        }
      },
    } as model.Model<SplineArrowContent>
  ]
}

export function isSplineContent(content: model.BaseContent): content is SplineContent {
  return content.type === 'spline'
}
export function isSplineArrowContent(content: model.BaseContent): content is SplineArrowContent {
  return content.type === 'spline arrow'
}

const splineSegmentCount = 100

export function getCommand(ctx: PluginContext): Command[] {
  const React = ctx.React
  const icon1 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="13" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="28" cy="79" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="63" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="85" cy="80" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <polyline points="13,22 14,24 14,26 15,29 15,31 16,33 17,34 17,36 18,38 18,40 19,41 20,43 20,44 21,46 22,47 22,49 23,50 23,51 24,52 25,53 25,54 26,55 27,56 27,56 28,57 29,58 29,58 30,59 31,59 31,59 32,60 33,60 33,60 34,60 35,60 35,60 36,60 37,60 37,59 38,59 39,58 39,58 40,57 41,57 41,56 42,55 43,55 43,54 44,53 45,52 46,51 46,49 47,48 48,47 48,46 49,46 50,45 50,44 51,44 52,43 53,43 53,42 54,42 55,42 56,41 56,41 57,41 58,41 59,41 59,41 60,42 61,42 62,42 63,43 63,43 64,44 65,44 66,45 67,46 67,47 68,47 69,48 70,49 71,51 71,52 72,53 73,54 74,56 75,57 76,59 76,60 77,62 78,64 79,65 80,67 81,69 82,71 82,73 83,75 84,78 85,80" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="13" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="28" cy="79" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="63" cy="22" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <circle cx="85" cy="80" r="5" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></circle>
      <polyline points="13,22 13,23 13,24 13,25 13,26 13,27 14,28 14,29 14,30 14,31 14,31 14,32 14,33 14,34 14,35 14,36 14,37 15,38 15,39 15,40 15,41 15,42 15,43 15,43 15,44 15,45 15,46 15,47 16,48 16,49 16,49 16,50 16,51 16,52 16,53 16,54 16,54 17,55 17,56 17,57 17,58 17,58 17,59 17,60 17,61 18,61 18,62 18,63 18,63 18,64 18,65 18,65 18,66 19,67 19,67 19,68 19,69 19,69 19,70 19,70 20,71 20,71 20,72 20,72 20,73 20,73 21,74 21,74 21,75 21,75 21,75 21,76 22,76 22,77 22,77 22,77 22,78 23,78 23,78 23,78 23,79 23,79 24,79 24,79 24,79 24,79 25,80 25,80 25,80 25,80 25,80 26,80 26,80 26,80 26,80 27,80 27,80 27,79 27,79 28,79 28,79 28,79 29,79 29,78 29,78 29,78 30,77 30,77 30,77 31,76 31,76 31,76 32,75 32,75 32,74 32,74 33,73 33,73 33,72 34,72 34,71 34,71 35,70 35,69 35,69 36,68 36,68 37,67 37,66 37,66 38,65 38,64 38,64 39,63 39,62 39,62 40,61 40,60 40,59 41,59 41,58 42,57 42,56 42,56 43,55 43,54 43,53 44,53 44,52 45,51 45,50 45,50 46,49 46,48 46,47 47,47 47,46 48,45 48,44 48,44 49,43 49,42 50,41 50,41 50,40 51,39 51,39 51,38 52,37 52,37 53,36 53,35 53,35 54,34 54,33 54,33 55,32 55,31 55,31 56,30 56,30 57,29 57,29 57,28 58,28 58,27 58,27 59,26 59,26 59,25 60,25 60,25 60,24 61,24 61,24 61,23 62,23 62,23 62,22 63,22 63,22 63,22 64,22 64,22 64,21 65,21 65,21 65,21 65,21 66,21 66,21 66,21 67,21 67,21 67,22 67,22 68,22 68,22 68,22 69,22 69,23 69,23 69,23 70,23 70,24 70,24 70,24 71,25 71,25 71,25 71,26 72,26 72,27 72,27 72,27 73,28 73,28 73,29 73,29 73,30 74,31 74,31 74,32 74,32 75,33 75,33 75,34 75,35 75,35 76,36 76,37 76,37 76,38 76,39 77,39 77,40 77,41 77,42 77,42 78,43 78,44 78,45 78,46 78,46 79,47 79,48 79,49 79,50 79,50 80,51 80,52 80,53 80,54 80,55 80,56 81,57 81,57 81,58 81,59 81,60 82,61 82,62 82,63 82,64 82,65 82,66 83,67 83,68 83,69 83,69 83,70 83,71 84,72 84,73 84,74 84,75 84,76 84,77 85,78 85,79 85,80" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  )
  const icon3 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="8,93 8,90 8,87 8,83 8,81 8,78 9,75 9,72 9,70 9,67 10,65 10,62 10,60 11,58 11,56 12,54 12,53 13,51 13,49 14,48 15,46 15,45 16,44 17,43 17,42 18,41 19,40 20,39 21,39 22,38 23,38 24,38 25,38 26,37 27,37 28,38 29,38 30,38 32,38 33,39 34,40 36,40 37,41 38,42 40,43 41,44 43,45 44,46 46,48 47,49 49,51 51,53 52,54 54,55 55,57 57,58 58,59 60,60 61,61 62,62 64,62 65,63 66,63 68,64 69,64 70,64 71,64 72,64 73,64 74,64 75,64 76,63 77,63 78,62 79,62 80,61 81,60 81,59 82,58 83,56 83,55 84,54 85,52 85,51 86,49 86,47 87,45 87,43 88,41 88,39 88,37 89,34 89,32 89,29 89,26 90,24 90,21 90,18 90,17" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline><polyline points="90,8 98,37 82,37" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor" />
    </svg>
  )
  const splineCommand: Command = {
    name: 'create spline',
    type: [
      { name: 'spline', hotkey: 'SPL', icon: icon1 },
      { name: 'spline fitting', icon: icon2 },
    ],
    useCommand({ onEnd, type, scale }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
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
        reset,
      }
    },
    selectCount: 0,
  }
  return [
    splineCommand,
    {
      name: 'create spline arrow',
      icon: icon3,
      useCommand({ onEnd, type, scale }) {
        const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
          type === 'create spline arrow',
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, type: 'spline arrow' } as SplineArrowContent)
          }),
        )
        const assistentContents: (SplineArrowContent | LineContent)[] = []
        if (line) {
          assistentContents.push(
            { points: line, type: 'spline arrow' },
            { points: line, type: 'polyline', dashArray: [4 / scale] }
          )
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
    } as Command,
  ]
}
