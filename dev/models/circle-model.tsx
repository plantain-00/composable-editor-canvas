import React from 'react'
import { Circle, CircleEditBar, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getSymmetryPoint, getTwoNumbersDistance, getTwoPointsDistance, pointIsInRegion, twoPointLineToGeneralFormLine, useCircleClickCreate, useCircleEdit } from '../../src'
import { rotatePositionByCenter } from '../util'
import { BaseContent, Model } from './model'

export type CircleContent = BaseContent<'circle'> & Circle

export const circleModel: Model<CircleContent> = {
  type: 'circle',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
  },
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
  },
  canSelectByPosition(content, position, delta) {
    return getTwoNumbersDistance(getTwoPointsDistance(content, position), content.r) <= delta
  },
  canSelectByTwoPositions(content, region, partial) {
    if ([
      { x: content.x - content.r, y: content.y - content.r },
      { x: content.x + content.r, y: content.y + content.r },
    ].every((p) => pointIsInRegion(p, region))) {
      return true
    }
    if (partial) {
      const minDistance = getPointAndRegionMinimumDistance(content, region)
      const maxDistance = getPointAndRegionMaximumDistance(content, region)
      if (minDistance <= content.r && maxDistance >= content.r) {
        return true
      }
    }
    return false
  },
  render({ content, stroke, target }) {
    return target.strokeCircle(content.x, content.y, content.r, stroke)
  },
  useEdit(onEnd) {
    const [circleEditOffset, setCircleEditOffset] = React.useState<Circle & { data?: number }>({ x: 0, y: 0, r: 0 })
    const { onStartEditCircle, circleEditMask } = useCircleEdit<number>(setCircleEditOffset, onEnd)
    return {
      mask: circleEditMask,
      updatePreview(contents) {
        if (circleEditOffset.data !== undefined) {
          const content = contents[circleEditOffset.data]
          if (content.type === 'circle') {
            content.x += circleEditOffset.x
            content.y += circleEditOffset.y
            content.r += circleEditOffset.r
          }
        }
      },
      editBar({ content, index }) {
        return <CircleEditBar x={content.x} y={content.y} radius={content.r} onClick={(e, type, cursor) => onStartEditCircle(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [circleCreate, setCircleCreate] = React.useState<Circle>()
    const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput } = useCircleClickCreate(
      type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
      setCircleCreate,
      (c) => onEnd([{ ...c, type: 'circle' }]),
    )
    return {
      input: circleClickCreateInput,
      onClick: onCircleClickCreateClick,
      onMove: onCircleClickCreateMove,
      updatePreview(contents) {
        if (circleCreate) {
          contents.push({ type: 'circle', ...circleCreate })
        }
      },
    }
  },
}
