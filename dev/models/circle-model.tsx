import React from 'react'
import { Circle, CircleEditBar, getSymmetryPoint, rotatePositionByCenter, useCircleEdit } from '../../src'
import { ArcContent, getArcLines } from './arc-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model, getSnapPointsFromCache, BaseContent } from './model'

export type CircleContent = StrokeBaseContent<'circle'> & Circle

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
  mirror(content, line) {
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
  },
  break(content, points) {
    if (points.length < 2) {
      return
    }
    const angles = points.map((p) => Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI)
    angles.sort((a, b) => a - b)
    return angles.map((a, i) => ({
      ...content,
      type: 'arc',
      startAngle: a,
      endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1],
    }) as ArcContent)
  },
  render({ content, color, target, strokeWidth }) {
    if (content.dashArray) {
      const { points } = getCircleLines(content)
      return target.strokePolyline(points, color ?? defaultStrokeColor, content.dashArray, strokeWidth)
    }
    return target.strokeCircle(content.x, content.y, content.r, color ?? defaultStrokeColor, strokeWidth)
  },
  getOperatorRenderPosition(content) {
    return content
  },
  useEdit(onEnd, transform, getAngleSnap, scale) {
    const { offset, onStart, mask, cursorPosition } = useCircleEdit<number>(onEnd, {
      transform,
      getAngleSnap,
    })
    return {
      mask,
      updatePreview(contents) {
        if (offset.data !== undefined) {
          const content = contents[offset.data]
          const assistentContents = [{ type: 'line', dashArray: [4], points: [{ x: content.x, y: content.y }, cursorPosition] }]
          if (content.type === 'circle') {
            content.x += offset.x
            content.y += offset.y
            content.r += offset.r
          }
          return { assistentContents }
        }
        return {}
      },
      editBar({ content, index }) {
        return <CircleEditBar scale={scale} x={content.x} y={content.y} radius={content.r} onClick={(e, type, cursor) => onStart(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  getSnapPoints(content) {
    return getSnapPointsFromCache(content, () => [
      { x: content.x, y: content.y, type: 'center' },
      { x: content.x - content.r, y: content.y, type: 'endpoint' },
      { x: content.x + content.r, y: content.y, type: 'endpoint' },
      { x: content.x, y: content.y - content.r, type: 'endpoint' },
      { x: content.x, y: content.y + content.r, type: 'endpoint' },
    ])
  },
  getCircle(content) {
    return content
  },
  getLines: getCircleLines,
}

export function getCircleLines(content: Omit<CircleContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return getArcLines({ ...content, startAngle: 0, endAngle: 360 })
  })
}

export function isCircleContent(content: BaseContent): content is CircleContent {
  return content.type === 'circle'
}
