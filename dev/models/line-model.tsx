import React from 'react'
import { getPointAndLineMinimumDistance, getSymmetryPoint, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, PolylineEditBar, Position, twoPointLineToGeneralFormLine, useLineClickCreate, usePolylineEdit } from '../../src'
import { rotatePositionByCenter } from '../util'
import { BaseContent, Model } from './model'

export type LineContent = BaseContent<'line' | 'polyline'> & {
  points: Position[]
}

export const lineModel: Model<LineContent> = {
  type: 'line',
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
  canSelectByPosition(content, position, delta) {
    for (let j = 1; j < content.points.length; j++) {
      const minDistance = getPointAndLineMinimumDistance(position, content.points[j - 1], content.points[j])
      if (minDistance <= delta) {
        return true
      }
    }
    return false
  },
  canSelectByTwoPositions(content, region, partial) {
    if (content.points.every((p) => pointIsInRegion(p, region))) {
      return true
    }
    if (partial) {
      for (let j = 1; j < content.points.length; j++) {
        if (lineIntersectWithTwoPointsFormRegion(content.points[j - 1], content.points[j], region)) {
          return true
        }
      }
    }
    return false
  },
  renderSvg({ content, stroke }) {
    return <polyline stroke={stroke} points={content.points.map((p) => `${p.x},${p.y}`).join(' ')} />
  },
  renderPixi(content, g) {
    content.points.forEach((p, i) => {
      if (i === 0) {
        g.moveTo(p.x, p.y)
      } else {
        g.lineTo(p.x, p.y)
      }
    })
  },
  useEdit(onEnd) {
    const [polylineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[], data?: number }>()
    const { onStartEditPolyline, polylineEditMask } = usePolylineEdit<number>(setPolylineEditOffset, onEnd)
    return {
      mask: polylineEditMask,
      updatePreview(contents) {
        if (polylineEditOffset?.data !== undefined) {
          const content = contents[polylineEditOffset.data]
          for (const pointIndex of polylineEditOffset.pointIndexes) {
            content.points[pointIndex].x += polylineEditOffset.x
            content.points[pointIndex].y += polylineEditOffset.y
          }
        }
      },
      editBar({ content, index }) {
        return <PolylineEditBar points={content.points} onClick={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes, index)} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [lineCreate, setLineCreate] = React.useState<{ points: Position[] }>()
    const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
      type === 'line',
      (c) => setLineCreate(c ? { points: c } : undefined),
      (c) => {
        const lines: LineContent[] = []
        for (let i = 1; i < c.length; i++) {
          lines.push({ points: [c[i - 1], c[i]], type: 'line' })
        }
        onEnd(lines)
      },
    )
    return {
      input: lineClickCreateInput,
      onClick: onLineClickCreateClick,
      onMove: onLineClickCreateMove,
      updatePreview(contents) {
        if (lineCreate) {
          for (let i = 1; i < lineCreate.points.length; i++) {
            contents.push({ points: [lineCreate.points[i - 1], lineCreate.points[i]], type: 'line' })
          }
        }
      },
    }
  },
}
