import React from 'react'
import { Arc, CircleArcEditBar, equals, getSymmetryPoint, normalizeAngleInRange, Position, rotatePositionByCenter, useCircleArcEdit } from '../../src'
import { angleDelta } from './ellipse-model'
import { iteratePolylineLines } from './line-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent } from './model'

export type ArcContent = StrokeBaseContent<'arc'> & Arc

export const arcModel: Model<ArcContent> = {
  type: 'arc',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  rotate(content, center, angle) {
    const p = rotatePositionByCenter(content, center, -angle)
    content.x = p.x
    content.y = p.y
    content.startAngle += angle
    content.endAngle += angle
  },
  mirror(content, line, angle) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
    const startAngle = 2 * angle - content.endAngle
    const endAngle = 2 * angle - content.startAngle
    content.startAngle = startAngle
    content.endAngle = endAngle
  },
  break(content, points) {
    if (points.length === 0) {
      return
    }
    const angles = points.map((p) => normalizeAngleInRange(Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI, content))
    angles.sort((a, b) => a - b)
    const result: ArcContent[] = []
    if (!equals(angles[0], content.startAngle)) {
      result.push({
        ...content,
        type: 'arc',
        startAngle: content.startAngle,
        endAngle: angles[0],
      })
    }
    angles.forEach((a, i) => {
      if (i === angles.length - 1) {
        if (!equals(a, content.endAngle)) {
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
  render({ content, color, target, strokeWidth }) {
    if (content.dashArray) {
      const { points } = getArcLines(content)
      return target.strokePolyline(points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
    }
    return target.strokeArc(content.x, content.y, content.r, content.startAngle, content.endAngle, color ?? defaultStrokeColor, strokeWidth)
  },
  renderIfSelected({ content, color, target }) {
    const { points } = getArcLines({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 })
    return target.strokePolyline(points, color ?? defaultStrokeColor, [4])
  },
  getOperatorRenderPosition(content) {
    const { points } = getArcLines(content)
    return points[0]
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition } = useCircleArcEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = [{ type: 'line', dashArray: [4], points: [{ x: content.x, y: content.y }, cursorPosition] }]
          if (content.type === 'arc') {
            content.x += offset.x
            content.y += offset.y
            content.r += offset.r
            content.startAngle += offset.startAngle
            content.endAngle += offset.endAngle
            if (content.endAngle < content.startAngle) {
              content.endAngle += 360
            } else if (content.endAngle - content.startAngle > 360) {
              content.endAngle -= 360
            }
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <CircleArcEditBar {...content} scale={scale} onClick={(e, type, cursor) => onStart(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => {
      const startAngle = content.startAngle / 180 * Math.PI
      const endAngle = content.endAngle / 180 * Math.PI
      const middleAngle = (startAngle + endAngle) / 2
      return [
        { x: content.x, y: content.y, type: 'center' },
        { x: content.x + content.r * Math.cos(startAngle), y: content.y + content.r * Math.sin(startAngle), type: 'endpoint' },
        { x: content.x + content.r * Math.cos(endAngle), y: content.y + content.r * Math.sin(endAngle), type: 'endpoint' },
        { x: content.x + content.r * Math.cos(middleAngle), y: content.y + content.r * Math.sin(middleAngle), type: 'midpoint' },
      ]
    })
  },
  getLines: getArcLines,
}

export function getArcLines(content: Omit<ArcContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    const points: Position[] = []
    const endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
    let i = content.startAngle
    for (; i <= endAngle; i += angleDelta) {
      const angle = i * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
    if (i !== endAngle) {
      const angle = endAngle * Math.PI / 180
      points.push({
        x: content.x + content.r * Math.cos(angle),
        y: content.y + content.r * Math.sin(angle),
      })
    }
    return {
      lines: Array.from(iteratePolylineLines(points)),
      points,
    }
  })
}

export function isArcContent(content: BaseContent): content is ArcContent {
  return content.type === 'arc'
}
