import React from 'react'
import { Circle, CircleEditBar, getSymmetryPoint, rotatePositionByCenter, twoPointLineToGeneralFormLine, useCircleClickCreate, useCircleEdit } from '../../src'
import { getArcLines } from './arc-model'
import { LineContent } from './line-model'
import { StrokeBaseContent, defaultStrokeColor, getLinesAndPointsFromCache, Model } from './model'
import { PolygonContent } from './polygon-model'

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
  mirror(content, p1, p2) {
    const line = twoPointLineToGeneralFormLine(p1, p2)
    const p = getSymmetryPoint(content, line)
    content.x = p.x
    content.y = p.y
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
  useCreate(type, onEnd, getAngleSnap) {
    const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useCircleClickCreate(
      type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
      (c) => onEnd([{ ...c, type: 'circle' }]),
      {
        getAngleSnap,
      },
    )
    let assistentContents: (LineContent | PolygonContent)[] | undefined
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents = [{ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4] }]
      } else {
        assistentContents = [{ type: 'line', points: [startPosition, cursorPosition], dashArray: [4] }]
      }
    }
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (circle) {
          contents.push({ type: 'circle', ...circle })
        }
      },
      assistentContents,
    }
  },
  getSnapPoints(content) {
    return [
      { x: content.x, y: content.y, type: 'center' },
      { x: content.x - content.r, y: content.y, type: 'endpoint' },
      { x: content.x + content.r, y: content.y, type: 'endpoint' },
      { x: content.x, y: content.y - content.r, type: 'endpoint' },
      { x: content.x, y: content.y + content.r, type: 'endpoint' },
    ]
  },
  getCircle(content) {
    return content
  },
}

function getCircleLines(content: Omit<CircleContent, "type">) {
  return getLinesAndPointsFromCache(content, () => {
    return getArcLines({ ...content, startAngle: 0, endAngle: 360 })
  })
}
