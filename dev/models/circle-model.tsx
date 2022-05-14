import React from 'react'
import { Circle, CircleEditBar, getSymmetryPoint, rotatePositionByCenter, twoPointLineToGeneralFormLine, useCircleClickCreate, useCircleEdit } from '../../src'
import { getArcLines } from './arc-model'
import { LineContent } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model, reverseTransformPosition } from './model'
import { PolygonContent } from './polygon-model'

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
  render({ content, stroke, target }) {
    if (content.dashArray) {
      const { points } = getCircleLines(content)
      return target.strokePolyline(points, stroke, content.dashArray)
    }
    return target.strokeCircle(content.x, content.y, content.r, stroke)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    return target.fillText(content.x, content.y, text, stroke, fontSize)
  },
  useEdit(onEnd, transform) {
    const [circleEditOffset, setCircleEditOffset] = React.useState<Circle & { data?: number }>({ x: 0, y: 0, r: 0 })
    const { onStartEditCircle, circleEditMask } = useCircleEdit<number>(setCircleEditOffset, onEnd, { transform: (p) => reverseTransformPosition(p, transform) })
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
        return <CircleEditBar scale={transform?.scale} x={content.x} y={content.y} radius={content.r} onClick={(e, type, cursor) => onStartEditCircle(e, { ...content, type, cursor, data: index })} />
      },
    }
  },
  useCreate(type, onEnd) {
    const [circleCreate, setCircleCreate] = React.useState<Circle>()
    const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput, startPosition, middlePosition, cursorPosition } = useCircleClickCreate(
      type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
      setCircleCreate,
      (c) => onEnd([{ ...c, type: 'circle' }]),
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
      input: circleClickCreateInput,
      onClick: onCircleClickCreateClick,
      onMove: onCircleClickCreateMove,
      updatePreview(contents) {
        if (circleCreate) {
          contents.push({ type: 'circle', ...circleCreate })
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
