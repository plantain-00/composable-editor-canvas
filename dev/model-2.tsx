import React from 'react'
import * as PIXI from 'pixi.js'
import { Circle, getPointAndLineMinimumDistance, getPointAndRegionMaximumDistance, getPointAndRegionMinimumDistance, getTwoNumbersDistance, getTwoPointsDistance, lineIntersectWithTwoPointsFormRegion, pointIsInRegion, Position, TwoPointsFormRegion } from '../src'
import { rotatePositionByCenter } from './util'

export type Content =
  | { type: 'circle' } & Circle
  | { type: 'polyline', points: Position[] }
  | { type: 'line', points: Position[] }

interface Model<T> {
  move(content: T, offset: Position): void
  rotate(content: T, center: Position, angle: number): void
  canSelectByPosition(content: T, position: Position, delta: number): boolean
  canSelectByTwoPositions(content: T, region: TwoPointsFormRegion, partial: boolean): boolean
  renderSvg(props: { content: T, stroke: string }): JSX.Element
  renderPixi(content: T, g: PIXI.Graphics): void
}

const modelCenter: Record<string, Model<Content>> = {}

export function getModel(type: Content['type']) {
  return modelCenter[type]
}

function registerModel<T extends Content>(type: T['type'], model: Model<T>) {
  modelCenter[type] = model
}

registerModel<{ type: 'circle' } & Circle>('circle', {
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, angle)
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
  renderSvg({ content, stroke }) {
    return <circle stroke={stroke} cx={content.x} cy={content.y} r={content.r} />
  },
  renderPixi(content, g) {
    g.drawCircle(content.x, content.y, content.r)
  },
})

const lineModel: Model<{ points: Position[] }> = {
  move(content, offset) {
    for (const point of content.points) {
      point.x += offset.x
      point.y += offset.y
    }
  },
  rotate(content, center, angle) {
    content.points = content.points.map((p) => rotatePositionByCenter(p, center, angle))
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
}

registerModel<{ type: 'polyline', points: Position[] }>('polyline', lineModel)
registerModel<{ type: 'line', points: Position[] }>('line', lineModel)
