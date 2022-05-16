import React from 'react'
import bspline from 'b-spline'
import { getBezierCurvePoints, getBezierSplineControlPointsOfPoints, getSymmetryPoint, PolylineEditBar, Position, rotatePositionByCenter, twoPointLineToGeneralFormLine, useLineClickCreate, usePolylineEdit } from '../../src'
import { iteratePolylineLines } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'

export type SplineContent = BaseContent<'spline'> & {
  points: Position[]
  fitting?: boolean
}

export const splineModel: Model<SplineContent> = {
  type: 'spline',
  move(content, offset) {
    for (const point of content.points) {
      point.x += offset.x
      point.y += offset.y
    }
  },
  rotate(content, center, angle) {
    content.points = content.points.map((p) => rotatePositionByCenter(p, center, -angle))
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    content.points = content.points.map((p) => getSymmetryPoint(p, line))
  },
  render({ content, stroke, target }) {
    const { points } = getSplineLines(content)
    return target.strokePolyline(points, stroke, content.dashArray)
  },
  renderIfSelected({ content, stroke, target }) {
    return target.strokePolyline(content.points, stroke, [4])
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    return target.fillText(content.points[0].x, content.points[0].y, text, stroke, fontSize)
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, dragStartPosition, cursorPosition } = usePolylineEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset?.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = dragStartPosition ? [{ type: 'line', dashArray: [4], points: [{ x: dragStartPosition.x, y: dragStartPosition.y }, cursorPosition] }] : undefined
          for (const pointIndex of offset.pointIndexes) {
            content.points[pointIndex].x += offset.x
            content.points[pointIndex].y += offset.y
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <PolylineEditBar scale={scale} midpointDisabled points={content.points} onClick={(e, pointIndexes) => onStart(e, pointIndexes, index)} />
      },
    }
  },
  useCreate(type, onEnd, getAngleSnap) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'spline' || type === 'spline fitting',
      (c) => onEnd([{ points: c, type: 'spline', fitting: type === 'spline fitting' }]),
      {
        getAngleSnap,
      },
    )
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (line) {
          contents.push({ points: line, type: 'spline', fitting: type === 'spline fitting' })
        }
      },
      assistentContents: line ? [{ points: line, type: 'polyline', dashArray: [4] }] : undefined,
    }
  },
  getSnapPoints(content) {
    return content.points.map((p) => ({ ...p, type: 'endpoint' as const }))
  },
  getLines: getSplineLines,
}

function getSplineLines(content: Omit<SplineContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const inputPoints = content.points.map((p) => [p.x, p.y])
    let points: Position[] = []
    if (inputPoints.length > 2) {
      if (content.fitting) {
        const controlPoints = getBezierSplineControlPointsOfPoints(content.points)
        for (let i = 0; i < controlPoints.length; i++) {
          points.push(
            content.points[i],
            ...getBezierCurvePoints(content.points[i], ...controlPoints[i], content.points[i + 1], splineSegmentCount),
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
      lines: Array.from(iteratePolylineLines(points)),
      points,
    }
  })
}

const splineSegmentCount = 100
